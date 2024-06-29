import express, { Express, Request, Response } from "express";
import cors from "cors";
import fs from "fs";
import morgan from "morgan";
import { performance } from 'perf_hooks';
const mp3Parser = require("mp3-parser");

const app: Express = express();

app.use(cors());
app.use(morgan("dev"));

app.get("/music-library", function (req: Request, res: Response) {
  const files = fs.readdirSync("./music-assets").filter((file) => {
    return file.endsWith(".mp3");
  });

  res.json(files);
});

let nextFileToPlay = 0;
let requestedFile: number | null = null;
let responses: Response[] = [];


app.post("/play/:index", function (req: Request, res: Response) {
  const index = req.params.index;
  console.log("Playing song at index", index);
  requestedFile = parseInt(index);
  res.json({ message: "Playing song at index" });

})


const fileNames = fs
  .readdirSync("./music-assets")
  .filter((file) => file.endsWith("mp3"));

const fileLengths = fileNames.map((file) => {
  return fs.statSync(`music-assets/${file}`).size;
});

const fileBuffers = fileNames.map((file) => {
  return fs.readFileSync(`music-assets/${file}`);
});

const writeNextBytes = (bytesWritten: number = 0, start: number = performance.now(), offset: number | null = null, arrayMusicBuffer = new ArrayBuffer(0), dataView = new DataView(new ArrayBuffer(0))) => {

  let bytesWrittenCounter = 0;
  const secondsElapsed = (performance.now() - start) / 1000;
  const targetBytesSent = 44100 * (secondsElapsed + 1);
  const bytesToSend = targetBytesSent - bytesWritten;

  // console.log("secondsElapsed", secondsElapsed)
  // console.log("bytesToSend", bytesToSend);
  // console.log("targetBytesSent", targetBytesSent);
  // console.log("bytesWritten", bytesWritten);

  if (requestedFile !== null) {
    nextFileToPlay = requestedFile;
    offset = null;
    requestedFile = null;
  }

  while (bytesWrittenCounter <= bytesToSend) {
    if (offset === null) {
      console.log("Playing new song")

      if (nextFileToPlay === fileNames.length) {
        break;
      }

      arrayMusicBuffer = new ArrayBuffer(fileLengths[nextFileToPlay]);
      dataView = new DataView(arrayMusicBuffer);
      for (var i = 0; i < Buffer.byteLength(fileBuffers[nextFileToPlay]); i++) {
        dataView.setUint8(i, fileBuffers[nextFileToPlay][i]);
      }

      const firstFrame = mp3Parser
        .readTags(dataView)
        .filter((tag: any) => tag._section.type === "frame")[0];
      offset = firstFrame._section.offset;
      nextFileToPlay++;
    } else {
      if (!fileBuffers) {
        throw new Error("musicBuffer is null");
      }
      const frame: any = mp3Parser.readFrame(dataView as DataView, offset);

      if (!frame) {
        offset = null;
        continue;
      }

      responses.forEach((res) => {
        res.write(
          fileBuffers[nextFileToPlay - 1].subarray(
            frame._section.offset,
            frame._section.offset + frame._section.byteLength,
          ),
        );
      })


      bytesWrittenCounter += frame._section.sampleLength;
      offset = frame._section?.nextFrameIndex;
    }
  }


  if (nextFileToPlay <= fileNames.length) {
    setTimeout(() => {
      writeNextBytes(bytesWritten += bytesWrittenCounter, start, offset, arrayMusicBuffer, dataView);
    }, 50);
  }
}

app.get("/", function (req: Request, res: Response) {

  const head = {
    "Content-Type": "audio/mp3",
  };
  res.writeHead(200, head);
  responses.push(res);
});

app.listen(3000, function () {
  console.log("Listening on port 3000!");
});

setTimeout(() => {
  writeNextBytes();
}, 0);
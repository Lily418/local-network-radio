import express, { Express, Request, Response } from "express";
import cors from "cors";
import fs from "fs";
import morgan from "morgan";
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

app.get("/", function (req: Request, res: Response) {
  let nextFileToPlay = 0;

  const fileNames = fs
    .readdirSync("./music-assets")
    .filter((file) => file.endsWith("mp3"));

  const fileLengths = fileNames.map((file) => {
    return fs.statSync(`music-assets/${file}`).size;
  });

  const fileBuffers = fileNames.map((file) => {
    return fs.readFileSync(`music-assets/${file}`);
  });

  const head = {
    "Content-Type": "audio/mp3",
  };
  res.writeHead(200, head);

  let chunksWrittenCounter = 0;
  const chunksToSend = 100;
  let offset = null;
  let dataView: DataView = new DataView(new ArrayBuffer(0));
  let arrayMusicBuffer: ArrayBuffer = new ArrayBuffer(0);
  while (nextFileToPlay <= fileNames.length) {
    if (offset === null || chunksWrittenCounter >= chunksToSend) {
      if (nextFileToPlay === fileNames.length) {
        break;
      }

      chunksWrittenCounter = 0;

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

      res.write(
        fileBuffers[nextFileToPlay - 1].subarray(
          frame._section.offset,
          frame._section.offset + frame._section.byteLength,
        ),
      );

      chunksWrittenCounter++;
      offset = frame._section?.nextFrameIndex;
    }
  }
});

app.listen(3000, function () {
  console.log("Listening on port 3000!");
});

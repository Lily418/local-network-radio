import express, { Express, Request, Response } from "express";
import cors from "cors";
import fs from "fs";
import morgan from "morgan";
import { performance } from "perf_hooks";
import expressWs from "express-ws";
import ffmpeg from "fluent-ffmpeg";
import path from "path";
import { MusicTracking } from "./src/music-tracking";

const mp3Parser = require("mp3-parser");

const { app, getWss, applyTo } = expressWs(express());

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
let trackLength = 0;
let musicTracking = new MusicTracking();

app.post("/play/:index", function (req: Request, res: Response) {
  const index = req.params.index;
  console.log("Playing song at index", index);
  requestedFile = parseInt(index);
  res.json({ message: "Playing song at index" });
});

const fileNames = fs
  .readdirSync("./music-assets")
  .filter((file) => file.endsWith("mp3"));

const fileLengths = fileNames.map((file) => {
  return fs.statSync(`music-assets/${file}`).size;
});

const fileBuffers = fileNames.map((file) => {
  return fs.readFileSync(`music-assets/${file}`);
});

musicTracking.loadTrack(
  fileBuffers[nextFileToPlay],
  fileLengths[nextFileToPlay],
);

const writeNextBytes = (
  bytesWritten: number = 0,
  start: number = performance.now(),
) => {
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
    musicTracking.loadTrack(
      fileBuffers[nextFileToPlay],
      fileLengths[nextFileToPlay],
    );
    requestedFile = null;
  }

  while (bytesWrittenCounter <= bytesToSend) {
    if (!fileBuffers) {
      throw new Error("musicBuffer is null");
    }

    const frame = musicTracking.readFrame();

    if (!frame) {
      if (nextFileToPlay === fileNames.length) {
        nextFileToPlay = 0;
      }
      musicTracking.loadTrack(
        fileBuffers[nextFileToPlay],
        fileLengths[nextFileToPlay],
      );
      continue;
    }

    responses.forEach((res) => {
      res.write(
        musicTracking
          .getCurrentlyPlayingTrack()
          .subarray(
            frame._section.offset,
            frame._section.offset + frame._section.byteLength,
          ),
      );
    });

    bytesWrittenCounter += frame._section.sampleLength;
  }

  if (nextFileToPlay <= fileNames.length) {
    setTimeout(() => {
      writeNextBytes((bytesWritten += bytesWrittenCounter), start);
    }, 50);
  }
};

app.get("/", function (req: Request, res: Response) {
  const head = {
    "Content-Type": "audio/mp3",
  };
  res.writeHead(200, head);
  responses.push(res);
});

// app.get("/convert", function (req: Request, res: Response) {
//   // const head = {
//   //   "Content-Type": "audio/mp3",
//   // };
//   // res.writeHead(200, head);

// app.get("/ffmpeg", async (req: Request, res: Response) => {
//   await getFileExtensionsSupported();
//   return res.json({});
// });

//   const filePath = path.resolve(__dirname, `music-assets/thwack.flac`);
//   console.log("filePath", filePath);
//   const proc = ffmpeg(filePath)
//     .format("mp3")
//     .outputOptions(["-vn", "-ar 44100", "-ac 2", "-b:a 192k"])
//     .on("end", function () {
//       console.log("file has been converted succesfully");
//     })
//     .on("error", function (err) {
//       console.log("an error happened: " + err.message);
//     })
//     .pipe(fs.createWriteStream("thwack.mp3"));
//   // .outputOptions(["-vn", "-ar 44100", "-ac 2", "-b:a 192k"])
//   // return res.json({ file: `music-assets/${fileNames[0]}` });
//   return res.json({});
// });

app.ws("/", (ws, req) => {
  ws.on("message", (msg: String) => {
    ws.send(
      JSON.stringify({
        fileName: fileNames[nextFileToPlay - 1],
        trackLocationInSeconds: musicTracking.getTrackLocationInSeconds(),
      }),
    );
  });
});

app.listen(3000, function () {
  console.log("Listening on port 3000!");
});

setTimeout(() => {
  writeNextBytes();
}, 0);

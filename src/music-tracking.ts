import { listAvailableFiles } from "./music-library";
import { promises as fs } from "fs";
const mp3Parser = require("mp3-parser");

export class MusicTracking {
  private offset: number | null = null;
  private trackLocationInSeconds: number = 0;
  private firstFrameOffset: number = 0;
  private dataView: DataView;
  private currentTrack: Buffer;

  constructor() {}

  loadTrack(buffer: Buffer, size: number) {
    this.currentTrack = buffer;
    const arrayBuffer = new ArrayBuffer(size);
    this.trackLocationInSeconds = 0;
    this.dataView = new DataView(arrayBuffer);
    for (var i = 0; i < Buffer.byteLength(arrayBuffer); i++) {
      this.dataView.setUint8(i, buffer[i]);
    }

    console.log(
      "Buffer.byteLength(arrayBuffer)",
      Buffer.byteLength(arrayBuffer),
    );

    const firstFrame = mp3Parser
      .readTags(this.dataView)
      .filter((tag: any) => tag._section.type === "frame")[0];
    console.log("firstFrame", firstFrame);
    this.setOffset(firstFrame._section.offset);
    this.firstFrameOffset = this.getOffset() as number;
  }

  getCurrentlyPlayingTrack(): Buffer {
    return this.currentTrack;
  }

  readFrame() {
    const frame: any = mp3Parser.readFrame(
      this.dataView as DataView,
      this.getOffset(),
    );
    if (frame) {
      this.setOffset(frame._section?.nextFrameIndex);
    } else {
      this.setOffset(null);
    }
    return frame;
  }

  private setOffset(offset: number | null) {
    this.offset = offset;
  }

  private getOffset() {
    return this.offset;
  }

  getTrackLocationInSeconds(): number {
    if (!this.offset) {
      return 0;
    } else {
      return (this.offset - this.firstFrameOffset) / 44100;
    }
  }
}

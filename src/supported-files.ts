import ffmpeg from "fluent-ffmpeg";

const supportedFileExtensions = ["mp3", "wav", "flac", "aac", "ogg"];

export const getFileExtensionsSupported = async (): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    ffmpeg.getAvailableFormats(function (err, formats) {
      if (err) {
        reject(err);
      } else {
        const formatsSupportedByFfmpegInstallation = Object.keys(
          formats,
        ).filter((format) => supportedFileExtensions.includes(format));
        resolve(formatsSupportedByFfmpegInstallation);
      }
    });
  });
};

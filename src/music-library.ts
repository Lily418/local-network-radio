import { promises as fs } from "fs";
import { getFileExtensionsSupported } from "./supported-files";

export const listAvailableFiles = async (): Promise<string[]> => {
  const supportedFileExtensions: string[] = await getFileExtensionsSupported();
  const fileNames = await fs.readdir("./music-assets");
  return fileNames.filter((file) =>
    supportedFileExtensions.some((extension) => file.endsWith(`.${extension}`)),
  );
};

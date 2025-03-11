import { access,
  mkdir,
  copyFile,
  rm } from "fs/promises";
import path from "path";
import * as readline from "readline";
import { execSync } from "child_process";

export function createReadlineInterface(): readline.Interface {
  return readline.createInterface({
    input: process.stdin as NodeJS.ReadableStream,
    output: process.stdout as NodeJS.WritableStream,
  });
}

export const askQuestion = async (question: string, rl: readline.Interface): Promise<string> => {
  try {
    return await new Promise(resolve => rl.question(question, input => resolve(input.trim())));
  } catch (error) {
    console.error("Error asking question:", error);
    throw error;
  }
};

export const cleanInput = (inputStr: string): string => {
  if (!inputStr) return "";
  return inputStr.trim().replace(/["`]/g, "'").replace(/\r\n/g, "\n");
};

export const isValidPath = async (pathToCheck: string): Promise<boolean> => {
  if (!pathToCheck) return false;

  try {
    // Using async fs.access is preferred over synchronous existsSync
    // as it doesn't block the main thread/event loop
    await access(pathToCheck.trim());
    return true;
  } catch {
    return false;
  }
};

export async function copyFilesToTargetDir(buildPath: string): Promise<void> {
  const manifestDest = path.join(buildPath, "manifest.json");
  const cssDest = path.join(buildPath, "styles.css");
  const folderToRemove = path.join(buildPath, "_.._");

  try {
    await mkdir(buildPath);
  } catch (error) {
    if (error.code !== "EEXIST") {
      console.error(`Error creating directory: ${error.message}`);
    }
  }

  // Copy manifest
  try {
    await copyFile("./manifest.json", manifestDest);
  } catch (error) {
    console.error(`Error copying manifest: ${error.message}`);
  }

  // Copy CSS
  try {
    // First check if CSS exists in src/styles.css
    if (await isValidPath("./src/styles.css")) {
      await copyFile("./src/styles.css", cssDest);
    }
    // Otherwise, check if it exists in the root
    else if (await isValidPath("./styles.css")) {
      await copyFile("./styles.css", cssDest);
      if (await isValidPath(folderToRemove)) {
        await rm(folderToRemove, { recursive: true });
      }
    } else {
      return;
    }
  } catch (error) {
    console.error(`Error copying CSS: ${error.message}`);
  }
}

export function gitExec(command: string): void {
  try {
    execSync(command, { stdio: "inherit" });
  } catch (error) {
    console.error(`Error executing '${command}':`, error.message);
    throw error;
  }
}
import { promises as fs } from 'fs';
import { dirname } from 'path';
import { GeneratedFile } from '../config/types';

export const readFile = async (filePath: string): Promise<string> => {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return data;
  } catch (error: any) {
    throw new Error(`Error reading file at ${filePath}: ${error.message}`);
  }
};

export const writeFile = async (filePath: string, data: string): Promise<void> => {
  try {
    // Ensure directory exists
    await ensureDirectoryExists(dirname(filePath));
    await fs.writeFile(filePath, data, 'utf-8');
  } catch (error: any) {
    throw new Error(`Error writing file at ${filePath}: ${error.message}`);
  }
};

export const ensureDirectoryExists = async (dirPath: string): Promise<void> => {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error: any) {
    throw new Error(`Error creating directory at ${dirPath}: ${error.message}`);
  }
};

export const writeGeneratedFiles = async (
  files: GeneratedFile[],
  outputDir: string
): Promise<void> => {
  await ensureDirectoryExists(outputDir);
  
  for (const file of files) {
    const fullPath = `${outputDir}/${file.path}`;
    await writeFile(fullPath, file.content);
    console.log(`Generated: ${file.path} - ${file.description}`);
  }
};

export const fileExists = async (filePath: string): Promise<boolean> => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};
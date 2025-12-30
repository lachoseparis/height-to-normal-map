import { readdir, lstat, mkdir, mkdtemp } from 'fs/promises';
import fsExists from 'fs.promises.exists';
import { promisify } from 'util';
import { createRequire } from 'module';
import copy from 'recursive-copy';
import rimraf from 'rimraf';
import path from 'path';
import os from 'os';

import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const require = createRequire(import.meta.url);
var sizeOf = promisify(require('image-size'));
const { forEach } = require('p-iteration');
const baseFolder = '/sources';

// Store the temporary directory path for this run
let tempDirPath = null;
let exportsDirPath = null;

export const initializeTempDirectory = async () => {
  tempDirPath = await mkdtemp(path.join(os.tmpdir(), 'height-to-normal-'));
  exportsDirPath = path.join(tempDirPath, 'exports');
  await mkdir(exportsDirPath, { recursive: true });
  return tempDirPath;
};

export const parseTempFolder = async () => {
  if (!tempDirPath) {
    throw new Error('Temp directory not initialized. Call initializeTempDirectory() first.');
  }
  const lImages = parseFolder(tempDirPath);
  return lImages;
};

export const parseFolder = async (folder, oImages = []) => {
  try {
    const elements = await readdir(folder);
    await forEach(elements, async (element) => {
      const filePath = folder + '/' + element;
      const relativePath = filePath.replace(tempDirPath, '');
      const exportPath = path.join(exportsDirPath, relativePath);

      const fileName = element.split('.')[0];
      const stat = await lstat(filePath);
      if (stat.isDirectory()) {
        // parse folder
        await parseFolder(folder + '/' + element, oImages);
      } else if (stat.isFile()) {
        const ext = element.split('.')[1]?.toLowerCase();
        if ('.png,.jpg,.svg,.webp'.indexOf(ext) > -1) {
          try {
            const dimensions = await sizeOf(filePath);
            const fileId = folder + '/' + fileName;
            const id = fileId.replace(baseFolder, '').replace('/', '').replace(/\//g, '-');

            // Create a URL path for the HTTP server
            const relativePath = filePath.replace(tempDirPath, '').replace(/\\/g, '/');
            const srcUrl = `/temp-files${relativePath}`;

            oImages.push({
              ...oImages[id],
              ...dimensions,
              exportPath,
              filePath,
              src: srcUrl,
            });
            // console.info('dim', id, oImages[id]);
          } catch (e) {
            console.info('not an image', e, folder + '/' + element);
          }
        }
      }
    });

    return oImages;
  } catch (e) {
    console.error(e);
  }
};

export const createFolderFromPathFile = async (filePath) => {
  const path = filePath.split('/').slice(0, -1).join('/');
  const isPath = await fsExists(path);
  if (!isPath) {
    await mkdir(path, { recursive: true });
  }
};

export const deleteTempFolder = () => {
  try {
    if (tempDirPath) {
      rimraf.sync(tempDirPath);
      tempDirPath = null;
      exportsDirPath = null;
    }
  } catch (error) {
    console.error('Delete temp folder failed: ' + error);
  }
};

export const copySourcesToTemp = async (sources) => {
  if (!tempDirPath) {
    throw new Error('Temp directory not initialized. Call initializeTempDirectory() first.');
  }
  const sourcePath = path.resolve(process.cwd(), sources);
  try {
    await copy(sourcePath, tempDirPath);
  } catch (error) {
    console.error('Copy failed: ' + error);
    throw error;
  }
};

export const copyToFinalFolder = async (dest) => {
  if (!exportsDirPath) {
    throw new Error('Exports directory not initialized.');
  }

  const pathDest = path.resolve(process.cwd(), dest);

  // Check if exports directory exists and has content
  const exportsExists = await fsExists(exportsDirPath);
  if (!exportsExists) {
    console.error('Copy failed: Exports directory does not exist at', exportsDirPath);
    return;
  }

  try {
    // Ensure destination directory exists
    await mkdir(pathDest, { recursive: true });

    // Copy from exports to destination
    await copy(exportsDirPath, pathDest, { overwrite: true });
  } catch (error) {
    console.error('Copy failed: ' + error);
    throw error;
  }
};

export const deleteFile = async (filePath) => {
  try {
    const stat = await lstat(filePath);
    const ext = filePath.split('.')[1]?.toLowerCase();
    if (stat.isFile() && '.png,.jpg,jpeg,.svg,.webp'.indexOf(ext) > -1) {
      rimraf.sync(filePath);
    }
  } catch (e) {
    console.info('no file to replace', e);
  }
};

export const getAbsoluteDistPath = () => {
  return __dirname;
};

export const getTempDirPath = () => {
  return tempDirPath;
};

export default parseFolder;

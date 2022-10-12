import { readdir, lstat, mkdir } from 'fs/promises';
import fsExists from 'fs.promises.exists';
import { promisify } from 'util';
import { createRequire } from 'module';
import copy from 'recursive-copy';
import rimraf from 'rimraf';
import path from 'path';

import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const require = createRequire(import.meta.url);
var sizeOf = promisify(require('image-size'));
const { forEach } = require('p-iteration');
const baseFolder = '/sources';

export const parseTempFolder = async () => {
  const pathTemp = path.join(__dirname, './temp');
  const lImages = parseFolder(pathTemp);
  return lImages;
};

export const parseFolder = async (folder, oImages = []) => {
  try {
    const elements = await readdir(folder);
    await forEach(elements, async (element) => {
      const filePath = folder + '/' + element;
      const exportPath = filePath.replace('/temp', '/exports');

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

            oImages.push({
              ...oImages[id],
              ...dimensions,
              exportPath,
              filePath,
              src: filePath.replace(__dirname, ''),
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
  const pathTemp = path.join(__dirname, './temp');
  rimraf.sync(pathTemp);
};

export const copySourcesToTemp = async (sources) => {
  const pathTemp = path.join(__dirname, './temp');
  rimraf.sync(pathTemp);
  await mkdir(pathTemp);
  try {
    await copy(`${sources}`, pathTemp);
  } catch (error) {
    console.error('Copy failed: ' + error);
  }
};

export const copyToFinalFolder = async (dest) => {
  const pathExports = path.join(__dirname, './exports');
  const pathDest = path.resolve(process.cwd(), dest);
  rimraf.sync(pathDest);
  try {
    await copy(`${pathExports}`, pathDest);
    rimraf.sync(pathExports);
  } catch (error) {
    console.error('Copy failed: ' + error);
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

export default parseFolder;

import { readdir, lstat, mkdir } from 'fs/promises';
import fsExists from 'fs.promises.exists';
import { promisify } from 'util';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
var sizeOf = promisify(require('image-size'));
const { forEach } = require('p-iteration');
const baseFolder = '/sources';

export const parseFolder = async (folder, oImages = []) => {
  try {
    const elements = await readdir(folder);
    await forEach(elements, async (element) => {
      const filePath = folder + '/' + element;
      const exportPath = filePath.replace(baseFolder, '/exports');

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
              path: filePath.replace('./', '/'),
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
  console.info('--- path', path);
  const isPath = await fsExists(path);
  if (!isPath) {
    await mkdir(path, { recursive: true });
  }
};

export default parseFolder;

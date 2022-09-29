export const convertCanvasToURL = async (canvas) => {
  const promise = new Promise((resolve, reject) => {
    try {
      let url;
      canvas.toBlob((blob) => {
        console.info('canvas to blob', blob);
        url = URL.createObjectURL(blob);
        resolve(url);
      });
    } catch (e) {
      reject(new Error('Cannot convert canvas to url'));
    }
  });
  return promise;
};

export const createImageFromCanvas = async (canvas) => {
  const image = new Image();
  const src = await convertCanvasToURL(canvas);
  image.src = src;
  return image;
}

export const loadImageSrc = async (src) => {
  const image = new Image();
  const promise = new Promise((resolve, reject) => {
    image.addEventListener('load', () => {
      resolve(image);
    }, false);
    image.addEventListener('error', (e) => {
      reject(new Error('Error loading image', src, e));
    }, false);
    console.info('src', src);
    image.src = src;
  });
  return promise;
}

export default convertCanvasToURL;
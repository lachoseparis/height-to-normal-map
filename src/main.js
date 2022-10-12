import HeightToNormal from '../lib/HeightToNormal';
import { convertCanvasToURL, loadImageSrc } from './utils/ImageCanvas';

const transformSource = async (options) => {
  if (document.body.querySelector('img'))
    document.body.removeChild(document.body.querySelector('img'));
  const heightToNormal = new HeightToNormal();
  const image = await loadImageSrc(options.src);
  heightToNormal.apply(image, options);
  const newSrc = await convertCanvasToURL(heightToNormal.canvas);
  const newImage = await loadImageSrc(newSrc);
  document.body.appendChild(newImage);
  return newImage;
};

// const url = new URL(window.location.href);
// const src = url.searchParams.get('src') || 'example.png';
// transformSource(src);

window.transformSource = transformSource;

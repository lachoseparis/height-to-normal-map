import HeightToNormal from './HeightToNormal';
import { convertCanvasToURL, loadImageSrc } from './utils/ImageCanvas';


const transformSource = async (baseSrc) => {
  const heightToNormal = new HeightToNormal();
  const image = await loadImageSrc(baseSrc);
  console.info('image', image);
  heightToNormal.apply(image, {
    blurSharp: 1,
    level: 8.5,
    strength: 1,
  });
  const newSrc = await convertCanvasToURL(heightToNormal.canvas);
  const newImage = await loadImageSrc(newSrc);
  document.body.appendChild(newImage);
  return newImage;
};



const url = new URL(window.location.href);
const src = url.searchParams.get("src") || 'example.png'
transformSource(src);

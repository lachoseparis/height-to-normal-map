<div align="center">
  <h1>Height to Normal Map</h1>
</div>

## A tool to create normal maps.


<p align="center">
  <img src="https://user-images.githubusercontent.com/505236/195153145-ed186943-d69d-43bb-af59-b722bb77dfc2.jpg" />
</p>

You can use it as a cli tool or as a library.

Sources are based from the work of [cpetry](https://github.com/cpetry) and his project [NormalMap-Online](https://cpetry.github.io/NormalMap-Online/).

The library uses [three.js](https://threejs.org) and [Puppeteer](https://github.com/puppeteer/puppeteer) to apply transforms.

### Why

We were working on a project which purpose was to show a large number of products in a 3d viewer. 
To be able to treat all the images we had, we needed to develop a tool that was able to process batch images.
This is what we done with this library.

### Using as a cli tool


```sh
npm install -g height-to-normal-map
```

### Usage

```sh

 Usage: height-to-normal-map [options]

Options:
  -p, --port <number>              port number (default: 3896)
  -i, --input <string>             path to sources images (default:
                                   "./sources")
  -o, --output <string>            path to destination images (default:
                                   "./exports")
  -t, --type <string>              Export image type.
                                   Auto means it will try to stick to source image type.
                                   Warning : forcing a type will not keep the source extension
                                   ["png" |"jpeg"|"webp"|"auto"] (default: "png")
  -q, --quality <number>           Export image quality [0-100].    
                                   Not applicable for png. (default: 100)
  -s, --strength <number>          Strength of the NormalMap renderer. Value
                                   between 0.01 to 5 (default: 1)
  -l, --level <number>             Level of the NormalMap renderer. Value
                                   between 4 to 10 (default: 8.5)
  -bs, --blursharp <number>        Add blur or sharp effect to the normal map.
                                   Value between -32 (very blurry) and 32 (vary
                                   sharp) (default: 1)
  -ir, --invertedRed <boolean>     Invert red value (default: false)
  -ig, --invertedGreen <boolean>   Invert green value (default: false)
  -ih, --invertedHeight <boolean>  Invert height value (default: false)
  -h, --help                       display help for command


```

### Using as a library

```js
import HeightToNormal from 'height-to-normal-map';

const heightToNormal = new HeightToNormal();

// image is a dom image element

heightToNormal.apply(image, {
  blurSharp: 1,
  level: 8.5,
  strength: 1,
  invertedRed: false,
  invertedGreen: false,
  invertedSource: false,
  type: NORMA_MAP_TYPES.SOBEL,
});

```

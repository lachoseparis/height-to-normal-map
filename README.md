<div align="center">
  <h1>Height to NormalMap</h1>
</div>

## A tool to create normalmap images.


<p align="center">
  <img src="https://user-images.githubusercontent.com/505236/195153145-ed186943-d69d-43bb-af59-b722bb77dfc2.jpg" />
</p>

You can use it as a cli tool or as a library.

It uses [three.js]('https://threejs.org') and puppeteer to apply transform and is based on the work of [cpetry]('https://github.com/cpetry') and his [project]('https://github.com/cpetry/NormalMap-Online') 

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
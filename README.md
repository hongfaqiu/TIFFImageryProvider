# TIFFImageryProvider

Load GeoTIFF/COG(Cloud optimized GeoTIFF) on Cesium

[![gzip size](http://img.badgesize.io/https://unpkg.com/tiff-imagery-provider@latest?compression=gzip&label=gzip)](https://unpkg.com/tiff-imagery-provider) ![npm latest version](https://img.shields.io/npm/v/tiff-imagery-provider.svg) ![license](https://img.shields.io/npm/l/tiff-imagery-provider)

[中文readme](./README_CN.md)

## Features

- Three band rendering.
- Multi mode color rendering.
- Support identify TIFF value with cartographic position.
- Support any projected TIFF.
- Web Workers speed up.
- WebGL accelerated rendering.
- Band calculation.

## Install

```bash
#npm
npm install --save tiff-imagery-provider
#pnpm
pnpm add tiff-imagery-provider
```

## Usage

Basic

```ts
import { Viewer } from "cesium";
import TIFFImageryProvider from 'tiff-imagery-provider';

const cesiumViewer = new Viewer("cesiumContainer");

const provider = new TIFFImageryProvider({
  url: 'https://oin-hotosm.s3.amazonaws.com/56f9b5a963ebf4bc00074e70/0/56f9c2d42b67227a79b4faec.tif',
});
provider.readyPromise.then(() => {
  cesiumViewer.imageryLayers.addImageryProvider(provider);
})

```

If TIFF's projection is not EPSG:4326 or EPSG:3857, you can pass the ``projFunc`` to handle the projection

```ts
import proj4 from 'proj4';

new TIFFImageryProvider({
  url: YOUR_TIFF_URL,
  projFunc: (code) => {
    if (code === 32760) {
      proj4.defs("EPSG:32760", "+proj=utm +zone=60 +south +datum=WGS84 +units=m +no_defs +type=crs");
      return proj4("EPSG:32760", "EPSG:4326").forward
    }
  }
});
```

Band calculation

```ts
// NDVI
new TIFFImageryProvider({
  url: YOUR_TIFF_URL,
  renderOptions: {
    single: {
      colorScale: 'rainbow',
      domain: [-1, 1],
      expression: '(b1 - b2) / (b1 + b2)'
    }
  }
});
```

## API

```ts
class TIFFImageryProvider {
  ready: boolean;
  readyPromise: Promise<void>
  bands: Record<number, {
    min: number;
    max: number;
  }>;
  constructor(options: TIFFImageryProviderOptions);

  get isDestroyed(): boolean;
  destroy(): void;
}

interface TIFFImageryProviderOptions {
  url: string;
  credit?: string;
  tileSize?: number;
  maximumLevel?: number;
  minimumLevel?: number;
  enablePickFeatures?: boolean;
  hasAlphaChannel?: boolean;
  renderOptions?: TIFFImageryProviderRenderOptions;
  /** projection function, convert [lon, lat] position to EPSG:4326 */
  projFunc?: (code: number) => (((pos: number[]) => number[]) | void);
  /** cache survival time, defaults to 60 * 1000 ms */
  cache?: number;
}

type TIFFImageryProviderRenderOptions = {
  /** nodata value, default read from tiff meta */
  nodata?: number;
  /** try to render multi band cog to RGB, priority 1 */
  convertToRGB?: boolean;
  /** priority 2 */
  multi?: MultiBandRenderOptions;
  /** priority 3 */
  single?: SingleBandRenderOptions;
}

interface SingleBandRenderOptions {
  /** band index start from 1, defaults to 1 */
  band?: number;

  /**
   * The color scale image to use.
   */
  colorScaleImage?: HTMLCanvasElement | HTMLImageElement;

  /**
   * The name of a named color scale to use.
   */
  colorScale?: ColorScaleNames;

  /** custom interpolate colors, [stopValue(0 - 1), color] or [color], if the latter, means equal distribution 
   * @example
   * [[0, 'red'], [0.6, 'green'], [1, 'blue']]
  */
  colors?: [number, string][] | string[];

  /** defaults to continuous */
  type?: 'continuous' | 'discrete';

  /**
   * The value domain to scale the color.
   */
  domain?: [number, number];

  /**
   * Range of values that will be rendered, values outside of the range will be transparent.
   */
  displayRange?: [number, number];

  /**
   * Set if displayRange should be used.
   */
  applyDisplayRange?: boolean;

  /**
   * Whether or not values below the domain shall be clamped.
   */
  clampLow?: boolean;

  /**
   * Whether or not values above the domain shall be clamped (if not defined defaults to clampLow value).
   */
  clampHigh?: boolean;
  
  /**
   * Sets a mathematical expression to be evaluated on the plot. Expression can contain mathematical operations with integer/float values, band identifiers or GLSL supported functions with a single parameter.
   * Supported mathematical operations are: add '+', subtract '-', multiply '*', divide '/', power '**', unary plus '+a', unary minus '-a'.
   * Useful GLSL functions are for example: radians, degrees, sin, asin, cos, acos, tan, atan, log2, log, sqrt, exp2, exp, abs, sign, floor, ceil, fract.
   * Don't forget to set the domain parameter!
   * @example 
   * '-2 * sin(3.1415 - b1) ** 2'
   * '(b1 - b2) / (b1 + b2)'
   */
  expression?: string;
}

interface MultiBandRenderOptions {
  /** Band value starts from 1 */
  r?: {
    band: number;
    min?: number;
    max?: number;
  };
  g?: {
    band: number;
    min?: number;
    max?: number;
  };
  b?: {
    band: number;
    min?: number;
    max?: number;
  };
}


/** see https://observablehq.com/@d3/color-schemes */
type ColorScaleNames = 'viridis' | 'inferno' | 'turbo' | 'rainbow' | 'jet' | 'hsv' | 'hot' | 'cool' | 'spring' | 'summer' | 'autumn' | 'winter' | 'bone' | 'copper' | 'greys' | 'ylgnbu' | 'greens' | 'ylorrd' | 'bluered' | 'rdbu' | 'picnic' | 'portland' | 'blackbody' | 'earth' | 'electric' | 'magma' | 'plasma' | 'redblue' | 'coolwarm' | 'diverging_1' | 'diverging_2' | 'blackwhite' | 'twilight' | 'twilight_shifted';
```

## Demo

[online Demo](https://tiff-imagery-provider-example.vercel.app/)

- Powered by [Next.js](https://github.com/vercel/next.js).
- Dark mode with [Semi-UI](<https://github.com/DouyinFE/semi-design>).
- Simple cog custom render method.

Launch the app in the demo folder, and then visit <http://localhost:3000/>

```node
pnpm install
cd example
pnpm start
```

![screenshot.png](/pictures/screenshot.png) | ![classify.png](/pictures/classify.png) | ![landsat.png](/pictures/landsat.png)
| ------- | ------- | -------- |

## Bugs

- Cesium@1.101 misplacement

## Plans

- [x] Use Web Workers to generate tile image
- [x] GPU speed up calculation
- [ ] Web Workers Offscreen WebGL rendering

## Credits

<https://github.com/geotiffjs/geotiff.js>

<https://github.com/santilland/plotty>

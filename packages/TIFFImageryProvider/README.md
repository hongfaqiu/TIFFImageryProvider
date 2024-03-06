# TIFFImageryProvider

Load GeoTIFF/COG(Cloud optimized GeoTIFF) on Cesium

[![gzip size](http://img.badgesize.io/https://unpkg.com/tiff-imagery-provider@latest?compression=gzip&label=gzip)](https://unpkg.com/tiff-imagery-provider) ![npm latest version](https://img.shields.io/npm/v/tiff-imagery-provider.svg) ![license](https://img.shields.io/npm/l/tiff-imagery-provider)

[中文readme](./README_CN.md)

[![CodeSandbox](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/p/github/hongfaqiu/cog-example/main)

## Features

- Three band rendering.
- Multi mode color rendering.
- Support identify TIFF value with cartographic position.
- WebGL accelerated rendering.
- Band calculation.
- **[experimental]** Support any projected TIFF .

## Install

```bash
#npm
npm install --save tiff-imagery-provider

#yarn
yarn add tiff-imagery-provider

#pnpm
pnpm add tiff-imagery-provider
```

## Usage

Basic

```ts
import { Viewer } from "cesium";
import TIFFImageryProvider from 'tiff-imagery-provider';

const cesiumViewer = new Viewer("cesiumContainer");

const provider = await TIFFImageryProvider.fromUrl('https://oin-hotosm.s3.amazonaws.com/56f9b5a963ebf4bc00074e70/0/56f9c2d42b67227a79b4faec.tif');

cesiumViewer.imageryLayers.addImageryProvider(provider);
```

You can also use the New keyword to create a new TIFFimageryProvider, which was deprecated after cesium@1.104+

```ts
const provider = new TIFFImageryProvider({
  url: YOUR_TIFF_URL,
});
provider.readyPromise.then(() => {
  cesiumViewer.imageryLayers.addImageryProvider(provider);
})
```

**Experimental** If TIFF's projection is not EPSG:4326 or EPSG:3857, you can pass the ``projFunc`` to handle the projection

```ts
import proj4 from 'proj4';

TIFFImageryProvider.fromUrl(YOUR_TIFF_URL, {
  projFunc: (code) => {
    if (code === 32760) {
      proj4.defs("EPSG:32760", "+proj=utm +zone=60 +south +datum=WGS84 +units=m +no_defs +type=crs");
      return {
        project: proj4("EPSG:4326", "EPSG:32760").forward,
        unproject: proj4("EPSG:4326", "EPSG:32760").inverse
      }
    }
  }
});
```

Band calculation

```ts
// NDVI
TIFFImageryProvider.fromUrl(YOUR_TIFF_URL, {
  renderOptions: {
    single: {
      colorScale: 'rainbow',
      domain: [-1, 1],
      expression: '(b1 - b2) / (b1 + b2)'
    }
  }
});
```

Custom colors

```ts
TIFFImageryProvider.fromUrl(YOUR_TIFF_URL, {
  renderOptions: {
    single: {
      "colors": [
        [1, "rgb(154, 206, 127)"],
        [2, "rgb(163, 214, 245)"],
        [3, "rgb(255, 251, 177)"],
        [4, "rgb(193, 114, 97)"],
        [5, "rgb(220, 100, 120)"],
        [6, "rgb(49, 173, 105)"]
      ],
      type: "discrete",
      useRealValue: true // use real value in colors stops
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
  origin: number[];
  reverseY: boolean;
  samples: number;
  constructor(options: TIFFImageryProviderOptions & {
    /** 
     * @deprecated 
     * Deprecated after cesium@1.104+, you can use fromUrl instead
     * @example 
     * const provider = await TIFFImageryProvider.fromUrl(url)
     */
    url?: string | File | Blob;
  });

  get isDestroyed(): boolean;
  destroy(): void;
  
  static fromUrl(url: string | File | Blob, options?: TIFFImageryProviderOptions): Promise<TIFFImageryProvider>;
}

interface TIFFImageryProviderOptions {
  requestOptions?: {
    /** defaults to false */
    forceXHR?: boolean;
    headers?: Record<string, any>;
    credentials?: boolean;
    /** defaults to 0 */
    maxRanges?: number;
    /** defaults to false */
    allowFullFile?: boolean;
    [key: string]: any;
  };
  credit?: string;
  tileSize?: number;
  maximumLevel?: number;
  minimumLevel?: number;
  enablePickFeatures?: boolean;
  hasAlphaChannel?: boolean;
  renderOptions?: TIFFImageryProviderRenderOptions;
  /**
   * If TIFF's projection is not EPSG:4326 or EPSG:3857, you can pass the ``projFunc`` to handle the projection
   * @experimental
   */
  projFunc?: (code: number) => {
    /** projection function, convert [lon, lat] position to [x, y] */
    project: ((pos: number[]) => number[]);
    /** unprojection function, convert [x, y] position to [lon, lat] */
    unproject: ((pos: number[]) => number[]);
  } | undefined;
  /** cache survival time, defaults to 60 * 1000 ms */
  cache?: number;
  /** geotiff resample method, defaults to nearest */
  resampleMethod?: 'nearest' | 'bilinear' | 'linear';
}

type TIFFImageryProviderRenderOptions = {
  /** nodata value, default read from tiff meta */
  nodata?: number;
  /** Only valid for three band rendering, defaults to { 'black': 'transparent' } */
  colorMapping?: Record<string, string>;
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

  /** Determine whether to use the true value range for custom color ranges, defaults to false */
  useRealValue?: boolean;

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

[online Demo](https://tiff-imagery-provider.opendde.com/?panel=layer)

- Powered by [Next.js](https://github.com/vercel/next.js).
- Dark mode with [Semi-UI](<https://github.com/DouyinFE/semi-design>).
- Simple cog custom render method.

Launch the app in the demo folder, and then visit <http://localhost:3000/>

```node
pnpm install
cd example
pnpm dev
```

![screenshot.png](/pictures/screenshot.png) | ![classify.png](/pictures/classify.png) | ![landsat.png](/pictures/landsat.png)
| ------- | ------- | -------- |

## Plans

- [x] GPU speed up calculation
- [ ] More efficient tile request method

## Credits

<https://github.com/geotiffjs/geotiff.js>

<https://github.com/santilland/plotty>

# TIFFImageryProvider

Load GeoTIFF/COG(Cloud optimized GeoTIFF) on Cesium

[![gzip size](http://img.badgesize.io/https://unpkg.com/tiff-imagery-provider@latest?compression=gzip&label=gzip)](https://unpkg.com/tiff-imagery-provider) ![npm latest version](https://img.shields.io/npm/v/tiff-imagery-provider.svg) ![license](https://img.shields.io/npm/l/tiff-imagery-provider)

## Features

- Three band rendering.
- Multi mode color rendering.
- Support identify TIFF value with cartographic position.
- Support any projected TIFF.
- Web Workers speed up.

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
  url: 'https://sentinel-cogs.s3.us-west-2.amazonaws.com/sentinel-s2-l2a-cogs/36/Q/WD/2020/7/S2A_36QWD_20200701_0_L2A/TCI.tif',
});
provider.readyPromise().then(() => {
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

## API

```ts
class TIFFImageryProvider {
  ready: boolean;
  readyPromise: Promise<void>
  bands: {
      min: number;
      max: number;
  }[];
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
  renderOptions?: {
    /** nodata value, default read from tiff meta */
    nodata?: number;
    /** Band value starts from 1 */
    r?: {
      band?: number;
      min?: number;
      max?: number;
    };
    g?: {
      band?: number;
      min?: number;
      max?: number;
    };
    b?: {
      band?: number;
      min?: number;
      max?: number;
    };
    fill?: {
      /** interpolate colors, [stopValue, color] or [color], if the latter, means equal distribution */
      colors: [number, string][] | string[];
      /** defaults to continuous */
      type?: 'continuous' | 'discrete';
      /** interpolate mode, defaults to 'rgb'
       * 
       *  refer to https://observablehq.com/@d3/working-with-color
       */
      mode?: 'hsl' | 'rgb' | 'hslLong' | 'lab';
    };
  }
  /** projection function, convert [lon, lat] position to EPSG:4326 */
  projFunc?: (code: number) => (((pos: number[]) => number[]) | void);
  /** cache survival time, defaults to 60 * 3000 ms */
  cache?: number;
}
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
- [ ] GPU speed up calculation

## Credits

<https://github.com/geotiffjs/geotiff.js>

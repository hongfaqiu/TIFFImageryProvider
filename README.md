# TIFFImageryProvider

Load GeoTIFF/COG(Cloud optimized GeoTIFF) on Cesium

[![gzip size](http://img.badgesize.io/https://unpkg.com/tiff-imagery-provider@latest/lib?compression=gzip&label=gzip)](https://unpkg.com/tiff-imagery-provider) ![npm latest version](https://img.shields.io/npm/v/tiff-imagery-provider.svg) ![license](https://img.shields.io/npm/l/tiff-imagery-provider)

- Three band rendering.
- Multi mode color rendering.
- Support identify TIFF value with cartographic position.
- Support any projected TIFF.

## Install

```bash
#npm
npm install --save tiff-imagery-provider
#pnpm
pnpm add tiff-imagery-provider
```

## Usage

- Basic

```ts
import * as Cesium from "cesium";
import TIFFImageryProvider from 'tiff-imagery-provider';

const cesiumViewer = new Cesium.Viewer("cesiumContainer");

const provider = new TIFFImageryProvider({
  url: 'https://data-of-vrexp.oss-cn-hangzhou.aliyuncs.com/cog/SIO_MERGE_MERGE_20000101TO20000131_L3B_EAMS_1KM_ACP_CT2017_.tif',
});
provider.readyPromise().then(() => {
  cesiumViewer.imageryLayers.addImageryProvider(provider);
})

```

- If TIFF's projection is not EPSG:4326 or EPSG:3857, you can pass the ``projFunc`` to handle the projection

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
      STATISTICS_MINIMUM: string;
      STATISTICS_MAXIMUM: string;
      STATISTICS_MEAN: string;
      STATISTICS_STDDEV: string;
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
      mode?: 'hsl' | 'rgb' | 'hslLong' | 'lab'
    };
  }
  /** projection function, convert [lon, lat] position to EPSG:4326 */
  projFunc?: (code: number) => (((pos: number[]) => number[]) | void);
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

![zOP7o6.md.png](https://s1.ax1x.com/2022/12/20/zOP7o6.md.png)

## Bugs

- Aliyun OSS has a broken API for HTTP Range requests, so will resposed with full file.

## Plans

- GPU speed up calculation

## Credits

<https://github.com/geotiffjs/geotiff.js>

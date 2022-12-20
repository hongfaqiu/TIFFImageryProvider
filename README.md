# TIFFImageryProvider

Load GeoTIFF/COG(Cloud optimized GeoTIFF) on Cesium

## Install

```bash
#npm
npm install --save tiff-imagery-provider
#pnpm
pnpm add tiff-imagery-provider
```

## Usage

```ts
import * as Cesium from "cesium";
import TIFFImageryProvider from 'tiff-imagery-provider';

const cesiumViewer = new Cesium.Viewer("cesiumContainer");

// Load remote cogTIFF and render with continuous color
const provider = new TIFFImageryProvider({
  url: 'https://data-of-vrexp.oss-cn-hangzhou.aliyuncs.com/cog/SIO_MERGE_MERGE_20000101TO20000131_L3B_EAMS_1KM_ACP_CT2017_.tif',
  renderOptions: {
    fill: {
      colors: ['red', 'blue'],
      mode: 'hslLong'
    }
  }
});

cesiumViewer.imageryLayers.addImageryProvider(provider);

```

## API

```ts
class TIFFImageryProvider {
  ready: boolean;
  bands: {
      STATISTICS_MINIMUM: string;
      STATISTICS_MAXIMUM: string;
      STATISTICS_MEAN: string;
      STATISTICS_STDDEV: string;
  }[];
  constructor(options: TIFFImageryProviderOptions);

  get isDestroyed(): boolean;
  private getTiffSource;
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
  /** nodata value, default read from tiff meta */
  nodata?: number;
  renderOptions?: {
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
}
```

## Demo

[online Demo](https://tiff-imagery-provider-example.vercel.app/)

Launch the app in the demo folder, and then visit <http://localhost:3000/>

```node
pnpm install
cd example
pnpm start
```

![zOP7o6.md.png](https://s1.ax1x.com/2022/12/20/zOP7o6.md.png)

## Credit

<https://github.com/geotiffjs/geotiff.js>

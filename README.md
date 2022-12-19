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

const provider = new TIFFImageryProvider({
  url: 'https://data-of-vrexp.oss-cn-hangzhou.aliyuncs.com/cog/SIO_MERGE_MERGE_20000101TO20000131_L3B_EAMS_1KM_ACP_CT2017_.tif',
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
  tilingScheme?: WebMercatorTilingScheme | GeographicTilingScheme;
  hasAlphaChannel?: boolean;
  nodata?: number;
  renderOptions?: {
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
      colors: [number, string][];
      type: 'discrete' | 'continuous';
    };
  };
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

## Credit

<https://github.com/geotiffjs/geotiff.js>

# TIFFImageryProvider

在Cesium上加载GeoTIFF / COG（优化的云存储GeoTIFF）

[![gzip size](http://img.badgesize.io/https://unpkg.com/tiff-imagery-provider@latest?compression=gzip&label=gzip)](https://unpkg.com/tiff-imagery-provider) ![npm latest version](https://img.shields.io/npm/v/tiff-imagery-provider.svg) ![license](https://img.shields.io/npm/l/tiff-imagery-provider)

## 特点

- 三波段渲染。
- 多模式颜色渲染。
- 支持使用地理位置识别TIFF值。
- 支持任何投影的TIFF。
- Web Workers 加速。
- WebGL 加速渲染。
- 波段计算。

## 安装

```bash
#npm
npm install --save tiff-imagery-provider
#pnpm
pnpm add tiff-imagery-provider
```

## 用法

基本用法

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

如果TIFF的投影不是EPSG：4326或EPSG：3857，则可以传递 ``projFunc`` 来处理投影

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
    /** nodata 值，默认从 tiff meta 中读取 */
    nodata?: number;
    /** 波段值从1开始 */
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
      /** 色带名称 */
      colorScale?: ColorScaleNames;
      /** 自定义色带，[stopValue, color] 或 [color]，如果是后者，意味着均匀分布 */
      colors?: [number, string][] | string[];
      /** 默认为连续 */
      type?: 'continuous' | 'discrete';
    };
    /**
     * 设置要在图上评估的数学表达式。表达式可以包含具有整数/浮点值的数学运算、波段标识符或具有单个参数的 GLSL 支持函数。
     * 支持的数学运算有：加“+”、减“-”、乘“*”、除“/”、幂“**”、一元加“+a”、一元减“-a”。
     * 有用的 GLSL 函数例如：弧度、度数、sin、asin、cos、acos、tan、atan、log2、log、sqrt、exp2、exp、abs、sign、floor、ceil、fract。
     * @param {string} expression 数学表达式。示例：'-2 *sin(3.1415 -band1) **2'
     */
    expression?: string;
  }
  /** 投影函数，将 [lon, lat] 位置转换为 EPSG:4326 */
  projFunc?: (code:number) => (((pos: number[]) => number[]) | void);
  /** 缓存生存时间，默认为 60 *3000 ms */
  cache?: number;
}

/** 参考 https://observablehq.com/@d3/color-schemes */
type ColorScaleNames = 'viridis' | 'inferno' | 'turbo' | 'rainbow' | 'jet' | 'hsv' | 'hot' | 'cool' | 'spring' | 'summer' | 'autumn' | 'winter' | 'bone' | 'copper' | 'greys' | 'ylgnbu' | 'greens' | 'ylorrd' | 'bluered' | 'rdbu' | 'picnic' | 'portland' | 'blackbody' | 'earth' | 'electric' | 'magma' | 'plasma';
```

## 示例

[在线演示](https://tiff-imagery-provider-example.vercel.app/)

- 由 [Next.js](https://github.com/vercel/next.js) 支持。
- 带有 [Semi-UI](<https://github.com/DouyinFE/semi-design>) 的暗色模式。
- 简单的自定义渲染方法。

在示例文件夹中启动应用程序，然后访问 <http://localhost:3000/>

```node
pnpm install
cd example
pnpm start
```

![screenshot.png](/pictures/screenshot.png) | ![classify.png](/pictures/classify.png) | ![landsat.png](/pictures/landsat.png)
| ------- | ------- | -------- |

## 已知问题

- Cesium@1.101 错位

## 计划

- [x] 使用Web Workers生成图块图像
- [x] GPU 加速计算

## 鸣谢

<https://github.com/geotiffjs/geotiff.js>
<https://github.com/santilland/plotty>
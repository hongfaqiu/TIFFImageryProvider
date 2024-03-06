# TIFFImageryProvider

在Cesium中加载GeoTIFF/COG（Cloud optimized GeoTIFF）。

[![gzip size](http://img.badgesize.io/https://unpkg.com/tiff-imagery-provider@latest?compression=gzip&label=gzip)](https://unpkg.com/tiff-imagery-provider) ![npm latest version](https://img.shields.io/npm/v/tiff-imagery-provider.svg) ![license](https://img.shields.io/npm/l/tiff-imagery-provider)

[![CodeSandbox](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/p/github/hongfaqiu/cog-example/main)

## 特点

- 三波段渲染。
- 多模式颜色渲染。
- 支持在地图上查询TIFF值。
- WebGL 加速渲染。
- 波段计算。
- **[实验性]** 支持任何投影的TIFF。

## 安装

```bash
#npm
npm install --save tiff-imagery-provider

#yarn
yarn add tiff-imagery-provider

#pnpm
pnpm add tiff-imagery-provider
```

## 使用

基本用法

```ts
import { Viewer } from "cesium";
import TIFFImageryProvider from 'tiff-imagery-provider';

const cesiumViewer = new Viewer("cesiumContainer");

const provider = await TIFFImageryProvider.fromUrl('https://oin-hotosm.s3.amazonaws.com/56f9b5a963ebf4bc00074e70/0/56f9c2d42b67227a79b4faec.tif');

cesiumViewer.imageryLayers.addImageryProvider(provider);

```

也可以使用New关键字新建一个TIFFimageryProvider，但是在cesium@1.104+之后被弃用

```ts
const provider = new TIFFImageryProvider({
  url: YOUR_TIFF_URL,
});
provider.readyPromise.then(() => {
  cesiumViewer.imageryLayers.addImageryProvider(provider);
})
```

**[实验性]** 如果 TIFF 的投影不是 EPSG:4326，你可以通过 ``projFunc`` 来处理投影

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

波段计算

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

自定义色带

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
      useRealValue: true // 使用tiff真实值作为色带的控制点
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
  constructor(options: TIFFImageryProviderOptions & {
    /** 
     * @deprecated 
     * cesium@1.104+ 后弃用，你可以使用 fromUrl 替代
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
    /** 默认 false */
    forceXHR?: boolean;
    headers?: Record<string, any>;
    credentials?: boolean;
    /** 默认 0 */
    maxRanges?: number;
    /** 默认 false */
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
   * 如果 TIFF 的投影不是 EPSG:4326，你可以通过 ``projFunc`` 来处理投影
   * @experimental
   */
  projFunc?: (code: number) => {
    /** 投影函数，将 [lon, lat] 位置转换为 [x, y] */
    project: ((pos: number[]) => number[]);
    /** 逆投影函数，将 [x, y] 位置转换为 [lon, lat] */
    unproject: ((pos: number[]) => number[]);
  } | undefined;
  /** 缓存生存时间，默认为60 * 1000毫秒 */
  cache?: number;
  /** geotiff 重采样方法, 默认为 nearest */
  resampleMethod?: 'nearest' | 'bilinear' | 'linear';
}

type TIFFImageryProviderRenderOptions = {
  /** 无效值，默认从tiff meta读取 */
  nodata?: number;
  /** 只对三波段渲染有效，默认为 { 'black': 'transparent' } */
  colorMapping?: Record<string, string>;
  /** 尝试将多波段cog渲染为rgb，优先级 1 */
  convertToRGB?: boolean;
  /** 优先级 2 */
  multi?: MultiBandRenderOptions;
  /** 优先级 3 */
  single?: SingleBandRenderOptions;
}

interface SingleBandRenderOptions {
  /** 波段索引从1开始，默认为1 */
  band?: number;

  /**
   * 使用的颜色比例尺图像。
   */
  colorScaleImage?: HTMLCanvasElement | HTMLImageElement;

  /**
   * 使用的命名颜色比例尺的名称。
   */
  colorScale?: ColorScaleNames;

  /** 自定义插值颜色，[stopValue(0-1), color]或[color]，如果后者，表示等分布 
   * @example
   * [[0, 'red'], [0.6, 'green'], [1, 'blue']]
  */
  colors?: [number, string][] | string[];
  
  /** 控制是否使用真实值生成插值色带，colors参数的stopValue将使用真实值，默认为否 */
  useRealValue?: boolean;

  /** 默认为连续 */
  type?: 'continuous' | 'discrete';

  /**
   * 将值域缩放到颜色。
   */
  domain?: [number, number];

  /**
   * 将呈现的值的范围，超出范围的值将透明。
   */
  displayRange?: [number, number];

  /**
   * 设置是否应使用displayRange。
   */
  applyDisplayRange?: boolean;

  /**
   * 是否对域以下的值进行夹紧。
   */
  clampLow?: boolean;

  /**
   * 是否对域以上的值进行夹紧（如果未定义，则默认为clampLow值）。
   */
  clampHigh?: boolean;
  
  /**
   * 设置要在绘图上评估的数学表达式。表达式可以包含具有整数/浮点值、波段标识符或带有单个参数的GLSL支持函数的数学运算。
   * 支持的数学运算符为：add '+', subtract '-', multiply '*', divide '/', power '**', unary plus '+a', unary minus '-a'。
   * 有用的GLSL函数例如：radians、degrees、sin、asin、cos、acos、tan、atan、log2、log、sqrt、exp、ceil、floor、abs、sign、min、max、clamp、mix、step、smoothstep。
   * 这些函数的完整列表可以在[GLSL 4.50规范](https://www.khronos.org/registry/OpenGL/specs/gl/GLSLangSpec.4.50.pdf)的第117页找到。
   * 不要忘记设置domain参数!
   * @example 
   * '-2 * sin(3.1415 - b1) ** 2'
   * '(b1 - b2) / (b1 + b2)'
   */
  expression?: string;
}

interface MultiBandRenderOptions {
  /** 波段值从1开始 */
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

type ColorScaleNames = 'viridis' | 'inferno' | 'turbo' | 'rainbow' | 'jet' | 'hsv' | 'hot' | 'cool' | 'spring' | 'summer' | 'autumn' | 'winter' | 'bone' | 'copper' | 'greys' | 'ylgnbu' | 'greens' | 'ylorrd' | 'bluered' | 'rdbu' | 'picnic' | 'portland' | 'blackbody' | 'earth' | 'electric' | 'magma' | 'plasma' | 'redblue' | 'coolwarm' | 'diverging_1' | 'diverging_2' | 'blackwhite' | 'twilight' | 'twilight_shifted';
```

## 示例

[在线示例](https://tiff-imagery-provider.opendde.com/?panel=layer)

- 使用 [Next.js](https://github.com/vercel/next.js) 搭建。
- 使用 [Semi-UI](<https://github.com/DouyinFE/semi-design>) 实现暗黑模式。
- 实现了简单的 COG 自定义渲染方法。

在 `demo` 文件夹中启动应用程序，然后访问 <http://localhost:3000/>：

```node
pnpm install
cd example
pnpm dev
```

![screenshot.png](/pictures/screenshot.png) | ![classify.png](/pictures/classify.png) | ![landsat.png](/pictures/landsat.png)
| ------- | ------- | -------- |

## 计划

- [x] 使用 GPU 加速计算
- [ ] 更高效的瓦片请求方法

## 致谢

<https://github.com/geotiffjs/geotiff.js>

<https://github.com/santilland/plotty>
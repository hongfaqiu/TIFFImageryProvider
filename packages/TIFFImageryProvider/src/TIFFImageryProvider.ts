import { Event, GeographicTilingScheme, Credit, Rectangle, ImageryLayerFeatureInfo, Math as CesiumMath, DeveloperError, defined, Cartesian2, WebMercatorTilingScheme } from "cesium";
import GeoTIFF, { Pool, fromUrl, fromBlob, GeoTIFFImage, TypedArrayArrayWithDimensions } from 'geotiff';

import { addColorScale, plot } from './plotty'
import { getMinMax, generateColorScale, findAndSortBandNumbers, stringColorToRgba } from "./helpers/utils";
import { ColorScaleNames, TypedArray } from "./plotty/typing";
import TIFFImageryProviderTilingScheme from "./TIFFImageryProviderTilingScheme";
import { BBox, reprojection } from "./helpers/reprojection";

import { GenerateImageOptions, generateImage } from "./helpers/generateImage";
import { reverseArray } from "./helpers/utils";
import { createCanavas } from "./helpers/createCanavas";
import WorkerPool from "./worker/pool";
import { ResampleDataOptions } from "./helpers/resample";

export interface SingleBandRenderOptions {
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

  /** Determine whether to use the true value range for custom color ranges */
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

export interface MultiBandRenderOptions {
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

export type TIFFImageryProviderRenderOptions = {
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
  /** resample method, defaults to nearest */
  resampleMethod?: ResampleDataOptions['method']
}

export interface TIFFImageryProviderOptions {
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
  /** resample web worker pool size, defaults to the number of CPUs available. 
   * When this parameter is `null` or 0, 
   * then the resampling will be done in the main thread. 
   * */
  workerPoolSize?: number;
}

const canvas = createCanavas(256, 256);

let workerPool: Pool;
function getWorkerPool() {
  if (!workerPool) {
    workerPool = new Pool();
  };
  return workerPool;
}

export class TIFFImageryProvider {
  ready: boolean;
  tilingScheme: TIFFImageryProviderTilingScheme | GeographicTilingScheme | WebMercatorTilingScheme;
  rectangle: Rectangle;
  tileSize: number;
  tileWidth: number;
  tileHeight: number;
  maximumLevel: number;
  minimumLevel: number;
  credit: Credit;
  errorEvent: Event;
  readyPromise: Promise<boolean>;
  bands: Record<number, {
    min: number;
    max: number;
  }>;
  noData: number;
  hasAlphaChannel: boolean;
  plot?: plot;
  renderOptions: TIFFImageryProviderRenderOptions;
  readSamples: number[];
  requestLevels: number[];
  bbox: number[];
  private _destroyed = false;
  private _source!: GeoTIFF;
  private _imageCount!: number;
  private _images: (GeoTIFFImage | null)[] = [];
  private _imagesCache: Record<string, {
    time: number;
    data: ImageData | HTMLCanvasElement | HTMLImageElement | OffscreenCanvas;
  }> = {};
  private _cacheTime: number;
  private _isTiled: boolean;
  private _proj?: {
    /** projection function, convert [lon, lat] position to EPSG:4326 */
    project: (pos: number[]) => number[];
    /** unprojection function */
    unproject: (pos: number[]) => number[];
  };
  origin: number[];
  reverseY: boolean = false;
  samples: number;
  workerPool: WorkerPool;

  constructor(private readonly options: TIFFImageryProviderOptions & {
    /**
     * @deprecated 
     * Deprecated after cesium@1.104+, you can use fromUrl instead
     * @example 
     * const provider = await TIFFImageryProvider.fromUrl(url)
     */
    url: string | File | Blob;
  }) {
    this.hasAlphaChannel = options.hasAlphaChannel ?? true;
    this.maximumLevel = options.maximumLevel ?? 18;
    this.minimumLevel = options.minimumLevel ?? 0;
    this.credit = new Credit(options.credit || "", false);
    this.errorEvent = new Event();
    this._cacheTime = options.cache ?? 60 * 1000;
    this.workerPool = new WorkerPool(options.workerPoolSize);

    this.ready = false;
    if (defined(options.url)) {
      this.readyPromise = this._build(options.url, options).then(() => {
        return true;
      })
    }
  }

  get isDestroyed() {
    return this._destroyed
  }

  private async _build(url: string | File | Blob, options: TIFFImageryProviderOptions = {}) {
    const { tileSize, renderOptions, projFunc, requestOptions } = options;
    let source = await (url instanceof File || url instanceof Blob ? fromBlob(url) : fromUrl(url, requestOptions))
    let image = await source.getImage();
    this._isTiled = image.isTiled;

    // handle native tiff range request error
    if (!this._isTiled && typeof url === 'string') {
      source = await fromBlob(await (await fetch(url)).blob());
      image = await source.getImage();
    }

    this._source = source;

    // get bounding box
    this.origin = this._getOrigin(image);
    this.bbox = image.getBoundingBox();
    this.reverseY = this._checkIfReversed(image);
    const [west, south, east, north] = this.bbox;

    const prjCode = +(image.geoKeys.ProjectedCSTypeGeoKey ?? image.geoKeys.GeographicTypeGeoKey)

    this._proj = projFunc?.(prjCode)
    if (prjCode === 3857 || prjCode === 900913) {
      this.tilingScheme = new WebMercatorTilingScheme({
        rectangleNortheastInMeters: new Cartesian2(east, north),
        rectangleSouthwestInMeters: new Cartesian2(west, south),
      })
    } else if (prjCode === 4326) {
      this.tilingScheme = new GeographicTilingScheme({
        rectangle: Rectangle.fromDegrees(...this.bbox),
        numberOfLevelZeroTilesX: 1,
        numberOfLevelZeroTilesY: 1
      });
    } else if (typeof this._proj?.project === 'function' && typeof this._proj?.unproject === 'function') {
      console.warn(`[Experimental] Reprojection EPSG:${prjCode}`)
      this.tilingScheme = new TIFFImageryProviderTilingScheme({
        rectangleNortheastInMeters: new Cartesian2(east, north),
        rectangleSouthwestInMeters: new Cartesian2(west, south),
        ...this._proj
      })
    } else {
      const error = new DeveloperError(`Unspported projection type: EPSG:${prjCode}, please add projFunc parameter to handle projection`)
      throw error;
    }

    this.rectangle = this.tilingScheme.rectangle
    // dealing with situations crossing the 180 degree meridian
    // https://github.com/CesiumGS/cesium/blob/da00d26473f663db180cacd8e662ca4309e09560/packages/engine/Source/Core/TileAvailability.js#L195
    if (this.rectangle.east < this.rectangle.west) {
      this.rectangle.east += CesiumMath.TWO_PI;
    }
    this._imageCount = await source.getImageCount();
    this.tileSize = this.tileWidth = tileSize || (this._isTiled ? image.getTileWidth() : image.getWidth()) || 256;
    this.tileHeight = tileSize || (this._isTiled ? image.getTileHeight() : image.getHeight()) || 256;
    // get the appropriate COG level
    this.requestLevels = this._isTiled ? await this._getCogLevels() : [0];
    this._images = new Array(this._imageCount).fill(null);

    // Get the number of bands
    const samples = image.getSamplesPerPixel();
    this.samples = samples;
    this.renderOptions = renderOptions ?? {}
    // Get nodata value
    const noData = image.getGDALNoData();
    this.noData = this.renderOptions.nodata ?? noData;

    // Assign initial value
    if (samples < 3 && this.renderOptions.convertToRGB) {
      const error = new DeveloperError('Can not render the image as RGB, please check the convertToRGB parameter')
      throw error;
    }
    if (!this.renderOptions.single && !this.renderOptions.multi && !this.renderOptions.convertToRGB) {
      if (samples > 2) {
        this.renderOptions = {
          convertToRGB: true,
          ...this.renderOptions
        }
      } else {
        this.renderOptions = {
          single: {
            band: 1
          },
          ...this.renderOptions
        }
      }
    }
    if (this.renderOptions.single) {
      this.renderOptions.single.band = this.renderOptions.single.band ?? 1;
    }

    const { single, multi, convertToRGB } = this.renderOptions;
    this.readSamples = multi ? [multi.r.band - 1, multi.g.band - 1, multi.b.band - 1] : convertToRGB ? [0, 1, 2] : Array.from({ length: samples }, (_, index) => index);
    if (single?.expression) {
      this.readSamples = findAndSortBandNumbers(single.expression);
    }

    // Get the maximum and minimum value information of the band
    const bands: Record<number, {
      min: number;
      max: number;
    }> = {};
    await Promise.all(this.readSamples.map(async (i) => {
      const element = image.getGDALMetadata(i);
      const bandNum = i + 1;

      if (element?.STATISTICS_MINIMUM && element?.STATISTICS_MAXIMUM) {
        bands[bandNum] = {
          min: +element.STATISTICS_MINIMUM,
          max: +element.STATISTICS_MAXIMUM,
        }
      } else {
        if (convertToRGB) {
          bands[bandNum] = {
            min: 0,
            max: 255,
          }
        };

        if (multi) {
          const inputBand = multi[Object.keys(multi).find(key => multi[key]?.band === bandNum)]
          if (inputBand?.min !== undefined && inputBand?.max !== undefined) {
            const { min, max } = inputBand
            bands[bandNum] = {
              min, max
            }
          }
        }

        if (single && !single.expression && single.band === bandNum && single.domain) {
          bands[bandNum] = {
            min: single.domain[0],
            max: single.domain[1],
          }
        }

        if (!single?.expression && !bands[bandNum]) {
          // Try to get the maximum and minimum values ​​of the band
          console.warn(`Can not get band${bandNum} min/max, try to calculate min/max values, or setting ${single ? 'domain' : 'min / max'}`)

          const previewImage = await source.getImage(this.requestLevels[0])
          const data = (await previewImage.readRasters({
            samples: [i],
            pool: getWorkerPool(),
          }) as unknown as number[][])[0].filter((item: any) => !isNaN(item))
          bands[bandNum] = getMinMax(data, noData)
        }
      }
    }))
    this.bands = bands;

    // If it is single-pass rendering, build the plot object
    try {
      if (this.renderOptions.single) {
        const band = this.bands[single.band];
        if (!single.expression && !band) {
          throw new DeveloperError(`Invalid band${single.band}`);
        }
        const domain = single.domain ?? [band.min, band.max]
        this.plot = new plot({
          canvas,
          ...single,
          domain,
        })
        this.plot.setNoDataValue(this.noData);

        const { expression, colors, colorScaleImage } = single;
        this.plot.setExpression(expression);
        if (colors) {
          const colorScale = generateColorScale(colors, single?.useRealValue ? domain : [0, 1])
          addColorScale('temp', colorScale.colors, colorScale.positions);
          this.plot.setColorScale('temp' as any);
        } else if (!colorScaleImage) {
          this.plot.setColorScale(single?.colorScale ?? 'blackwhite');
        }
      }

    } catch (e) {
      console.error(e);
      this.errorEvent.raiseEvent(e);
    }
    this.readyPromise = Promise.resolve(true);
    this.ready = true;
  }

  static async fromUrl(url: string | File | Blob, options: TIFFImageryProviderOptions = {}) {
    const provider = new TIFFImageryProvider(options as any);

    await provider._build(url, {
      ...options,
      url: undefined
    } as any)

    return provider;
  }

  /**
   * Get the origin of an image.  If the image does not have an affine transform,
   * the top-left corner of the pixel bounds is returned.
   * @param {GeoTIFFImage} image The image.
   * @return {Array<number>} The image origin.
   */
  private _getOrigin(image: GeoTIFFImage): number[] {
    try {
      return image.getOrigin().slice(0, 2);
    } catch (_) {
      return [0, image.fileDirectory.ImageLength];
    }
  }

  private _checkIfReversed(image: GeoTIFFImage) {
    const pixelScale = image.getFileDirectory().ModelPixelScale;
    if (pixelScale) {
      const pixelScaleY = pixelScale[1];
      if (pixelScaleY < 0) return true;
    }

    const transformation = image.getFileDirectory().ModelTransformation;
    if (transformation) {
      const originX = transformation[3];
      const originY = transformation[7];
      if (originY > originX) return true;
    }
    return false;
  }

  /**
   * get suitable cog levels
   */
  private async _getCogLevels() {
    const levels: number[] = [];
    let maximumLevel: number = this._imageCount - 1;
    for (let i = this._imageCount - 1; i >= 0; i--) {
      const image = this._images[i] = await this._source.getImage(i);
      const width = image.getWidth();
      const height = image.getHeight();
      const size = Math.max(width, height);

      // If the image tileSize of the first tile is greater than 256, the sequence will be delayed to reduce the amount of requests.
      if (i === this._imageCount - 1) {
        const firstImageLevel = Math.ceil((size - this.tileSize) / this.tileSize)
        levels.push(...new Array(firstImageLevel).fill(i))
      }

      // add 50% tilewidth tolerance
      if (size > (this.tileSize * 0.5)) {
        maximumLevel = i;
        break;
      }
    }
    let nowCogLevel: number = maximumLevel;
    while (nowCogLevel >= 0) {
      levels.push(nowCogLevel--);
    }
    return levels;
  }

  /**
   * Get tile data
   * @param x 
   * @param y 
   * @param z 
   */
  private async _loadTile(reqx: number, reqy: number, reqz: number) {
    let x = reqx, y = reqy, z = reqz, startX = reqx, startY = reqy;
    const maxCogLevel = this.requestLevels.length - 1;
    if (z > maxCogLevel) {
      z = maxCogLevel;
      x = x >> (reqz - maxCogLevel)
      y = y >> (reqz - maxCogLevel)
      startX = x << (reqz - z);
      startY = y << (reqz - z);
    }
    
    const index = this.requestLevels[z];
    let image = this._images[index];
    if (!image) {
      image = this._images[index] = await this._source.getImage(index);
    }

    const width = image.getWidth();
    const height = image.getHeight();
    const tileXNum = this.tilingScheme.getNumberOfXTilesAtLevel(z);
    const tileYNum = this.tilingScheme.getNumberOfYTilesAtLevel(z);
    const tilePixel = {
      xWidth: width / tileXNum,
      yWidth: height / tileYNum
    }
    let window = [
      Math.round(x * tilePixel.xWidth),
      Math.round(y * tilePixel.yWidth),
      Math.round((x + 1) * tilePixel.xWidth),
      Math.round((y + 1) * tilePixel.yWidth),
    ];

    if (this._proj && this.tilingScheme instanceof TIFFImageryProviderTilingScheme) {
      const targetRect = this.tilingScheme.tileXYToNativeRectangle2(x, y, z);
      const nativeRect = this.tilingScheme.nativeRectangle;
      targetRect.west -= (nativeRect.width / width)
      targetRect.east += (nativeRect.width / width)
      targetRect.south -= (nativeRect.height / height)
      targetRect.north += (nativeRect.height / height)

      window = [
        ~~((targetRect.west - nativeRect.west) / nativeRect.width * width),
        ~~((nativeRect.north - targetRect.north) / nativeRect.height * height),
        ~~((targetRect.east - nativeRect.west) / nativeRect.width * width),
        ~~((nativeRect.north - targetRect.south) / nativeRect.height * height),
      ]
    }
    if (this.reverseY) {
      window = [window[0], height - window[3], window[2], height - window[1]];
    }
    const buffer = 1;
    window = [window[0] - buffer, window[1] - buffer, window[2] + buffer, window[3] + buffer]
    const sourceWidth = window[2] - window[0], sourceHeight = window[3] - window[1];
    
    const options = {
      window,
      pool: getWorkerPool(),
      samples: this.readSamples,
      fillValue: this.noData,
      interleave: false,
    }
    /** the cast to TypedArrayArray is safe because of `interleave: false` **/
    let res: TypedArrayArrayWithDimensions | TypedArray[];
    try {
      if (this.renderOptions.convertToRGB) {
        res = await image.readRGB(options) as TypedArrayArrayWithDimensions;
      } else {
        res = await image.readRasters(options) as TypedArrayArrayWithDimensions;
        if (this.reverseY) {
          // @ts-ignore
          res = await Promise.all((res).map((array) => reverseArray({ array, width: res.width, height: res.height })));
        }
      }
      
      if (this._proj?.project && this.tilingScheme instanceof TIFFImageryProviderTilingScheme) {
        const sourceRect = this.tilingScheme.tileXYToNativeRectangle2(x, y, z);
        const targetRect = this.tilingScheme.tileXYToRectangle(x, y, z);

        const sourceBBox: BBox = [sourceRect.west, sourceRect.south, sourceRect.east, sourceRect.north];
        const targetBBox = [targetRect.west, targetRect.south, targetRect.east, targetRect.north].map(CesiumMath.toDegrees) as BBox;

        const result: TypedArray[] = [];
        for (let i = 0; i < res.length; i++) {
          // TODO Buffer effects are not considered
          const prjData = reprojection({
            data: res[i] as any,
            sourceWidth,
            sourceHeight,
            nodata: this.noData,
            project: this._proj.project,
            sourceBBox,
            targetBBox,
          })
          result.push(prjData)
        }
        res = result
      }
      
      const tileNum = 1 << (reqz - z)
      const x0 = (reqx - startX) / tileNum;
      const y0 = (reqy - startY) / tileNum;
      const step = 1 / (1 << (reqz - z))
      const x1 = x0 + step;
      const y1 = y0 + step;

      res = await Promise.all(res.map(async (data) => this.workerPool.resample(data, {
        sourceWidth,
        sourceHeight,
        targetWidth: this.tileWidth,
        targetHeight: this.tileHeight,
        window: [x0, y0, x1, y1],
        method: this.renderOptions.resampleMethod,
        buffer,
      })));

      return {
        data: res,
        width: this.tileWidth,
        height: this.tileHeight
      };
    } catch (error) {
      this.errorEvent.raiseEvent(error);
      throw error;
    }
  }
  
  async requestImage(
    x: number,
    y: number,
    z: number,
  ) {
    if (!this.ready) {
      throw new DeveloperError(
        "requestImage must not be called before the imagery provider is ready."
      );
    }
    if (z < this.minimumLevel || z > this.maximumLevel) return undefined
    if (this._cacheTime && this._imagesCache[`${x}_${y}_${z}`]) return this._imagesCache[`${x}_${y}_${z}`].data;

    const { single, multi, convertToRGB } = this.renderOptions;

    try {
      const { width, height, data } = await this._loadTile(x, y, z);
      
      if (this._destroyed || !width || !height) {
        return undefined;
      }

      let result: ImageData | HTMLImageElement | HTMLCanvasElement | OffscreenCanvas

      if (multi || convertToRGB) {
        const opts: GenerateImageOptions = {
          data,
          width,
          height,
          renderOptions: multi ?? ['r', 'g', 'b'].reduce((pre, val, index) => ({
            ...pre,
            [val]: {
              band: index + 1,
              min: 0,
              max: 255
            }
          }), {}),
          bands: this.bands,
          noData: this.noData,
          colorMapping: Object.entries(this.renderOptions.colorMapping ?? { 'black': 'transparent' }).map((val) => val.map(stringColorToRgba)),
        }

        result = await generateImage(opts);
      } else if (single && this.plot) {
        const { band = 1 } = single;
        this.plot.removeAllDataset();
        this.readSamples.forEach((sample, index) => {
          this.plot.addDataset(`b${sample + 1}`, data[index], width, height);
        })

        if (single.expression) {
          this.plot.render();
        } else {
          this.plot.renderDataset(`b${band}`)
        }

        const canv = createCanavas(this.tileWidth, this.tileHeight)
        const ctx = canv.getContext("2d") as CanvasRenderingContext2D
        ctx.drawImage(this.plot.canvas, 0, 0);
        result = canv;
      }

      if (result && this._cacheTime) {
        const now = new Date().getTime()
        this._imagesCache[`${x}_${y}_${z}`] = {
          time: now,
          data: result
        };
        for (let key in this._imagesCache) {
          if ((now - this._imagesCache[key].time) > this._cacheTime) {
            delete this._imagesCache[key]
          }
        }
      }
      return result;
    } catch (e) {
      console.error(e);
      this.errorEvent.raiseEvent(e);
      throw e;
    }
  }

  async pickFeatures(x: number, y: number, zoom: number, longitude: number, latitude: number) {
    if (!this.options.enablePickFeatures) return undefined

    const z = zoom > this.maximumLevel ? this.maximumLevel : zoom;
    const index = this.requestLevels[z];
    let image = this._images[index];
    if (!image) {
      image = this._images[index] = await this._source.getImage(index);
    }
    const width = image.getWidth();
    const height = image.getHeight();
    let posX: number, posY: number, window: number[];
    const { west, south, north, width: lonWidth } = this.rectangle;
    let lonGap = longitude - west;
    // Handling cases across 180° longitude
    if (longitude < west) {
      lonGap += CesiumMath.TWO_PI;
    }

    posX = ~~(Math.abs(lonGap / lonWidth) * width);
    posY = ~~(Math.abs((north - latitude) / (north - south)) * height);
    window = [posX, posY, posX + 1, posY + 1];

    if (this.reverseY) {
      posY = height - posY;
      window = [posX, posY - 1, posX + 1, posY]
    }
    const options = {
      window,
      height: 1,
      width: 1,
      pool: getWorkerPool(),
      interleave: false,
    }
    let res: TypedArray[];
    if (this.renderOptions.convertToRGB) {
      res = await image.readRGB(options) as TypedArray[];
    } else {
      res = await image.readRasters(options) as TypedArray[];
    }

    const featureInfo = new ImageryLayerFeatureInfo()
    featureInfo.name = `lon:${(longitude / Math.PI * 180).toFixed(6)}, lat:${(latitude / Math.PI * 180).toFixed(6)}`;
    const data = {};
    res?.forEach((item: any, index: number) => {
      data[index] = item?.[0];
    })
    featureInfo.data = data
    if (res) {
      featureInfo.configureDescriptionFromProperties(data)
    }
    return [featureInfo];
  }

  destroy() {
    this._images = undefined;
    this._source = undefined;
    this._imagesCache = undefined;
    this.plot?.destroy();
    this.workerPool.destroy();
    this._destroyed = true;
  }
}

export default TIFFImageryProvider;

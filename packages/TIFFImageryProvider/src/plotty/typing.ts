import { colorscales } from "./colorscales";

export type TypedArray = Uint8Array | Int8Array | Uint16Array | Int16Array | Uint32Array | Int32Array | Float32Array | Float64Array;

export interface DataSet {
  textureData: WebGLTexture;
  width: number;
  height: number;
  data: TypedArray;
  id: string;
}

export type ColorScaleNames = keyof typeof colorscales;

export interface PlotOptions {
  /**
   * The canvas to render to.
   */
  canvas?: HTMLCanvasElement;

  /**
   * The raster data to render.
   */
  data?: TypedArray;

  /**
   * The width of the input raster.
   */
  width?: number;

  /**
   * The height of the input raster.
   */
  height?: number;

  /**
   * A list of named datasets. Each must have 'id', 'data', 'width' and 'height'.
   */
  datasets?: {
    id: string;
    data: TypedArray;
    width: number;
    height: number;
  }[];

  /**
   * The color scale image to use.
   */
  colorScaleImage?: HTMLCanvasElement | HTMLImageElement;

  /**
   * The name of a named color scale to use.
   */
  colorScale?: ColorScaleNames;

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
   * The no-data value that shall always be hidden.
   */
  noDataValue?: number;

  /**
   * Transformation matrix.
   */
  matrix?: [number, number, number, number, number, number, number, number, number];

  /**
   * Plotty can also function with pure javascript but it is much slower then using WebGL rendering.
   */
  useWebGL?: boolean;
}
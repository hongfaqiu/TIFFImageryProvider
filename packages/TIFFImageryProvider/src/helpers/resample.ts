import { TypedArray } from "geotiff";

export type ResampleDataOptions = {
  sourceWidth: number;
  sourceHeight: number;
  targetWidth: number;
  targetHeight: number;
  /** start from 0 to 1, examples: [0, 0, 0.5, 0.5] */
  window: [number, number, number, number];
  method?: 'bilinear' | 'nearest';
  buffer?: number;
  /** No-data value */
  nodata?: number; // 新增 nodata 属性
}

export function resampleNearest(data: TypedArray, options: ResampleDataOptions) {
  const { sourceWidth, sourceHeight, targetWidth, targetHeight, window, buffer = 0 } = options;
  const [x0, y0, x1, y1] = window;

  const effectiveSourceWidth = sourceWidth - 2 * buffer;
  const effectiveSourceHeight = sourceHeight - 2 * buffer;

  const resampledData = copyNewSize(data, targetWidth, targetHeight);

  for (let y = 0; y < targetHeight; y++) {
    for (let x = 0; x < targetWidth; x++) {
      const col = buffer + ((effectiveSourceWidth * (x0 + x / targetWidth * (x1 - x0))) >>> 0);
      const row = buffer + ((effectiveSourceHeight * (y0 + y / targetHeight * (y1 - y0))) >>> 0);
      resampledData[y * targetWidth + x] = data[row * sourceWidth + col];
    }
  }

  return resampledData;
}

export function resampleData(data: TypedArray, options: ResampleDataOptions) {
  const { method = 'nearest' } = options;

  switch (method) {
    case "nearest":
      return resampleNearest(data, options);
    case "bilinear":
      return resampleBilinear(data, options);
  }
}

export function copyNewSize(array: TypedArray, width: number, height: number, samplesPerPixel = 1) {
  return new (Object.getPrototypeOf(array).constructor)(width * height * samplesPerPixel) as typeof array;
}

function lerp(v0: number, v1: number, t: number) {
  return ((1 - t) * v0) + (t * v1);
}

/**
 * Resample the input array using bilinear interpolation.
 * @param data The input arrays to resample
 * @param options The options for resampling
 * @returns The resampled rasters
 */
export function resampleBilinear(data: TypedArray, options: ResampleDataOptions) {
  const { sourceWidth, sourceHeight, targetWidth, targetHeight, window, buffer = 0 } = options;
  const [x0, y0, x1, y1] = window;

  const windowWidth = x1 - x0;
  const windowHeight = y1 - y0;

  const newArray = copyNewSize(data, targetWidth, targetHeight);

  const effectiveSourceWidth = sourceWidth - 2 * buffer;
  const effectiveSourceHeight = sourceHeight - 2 * buffer;

  const invTargetWidth = 1 / targetWidth;
  const invTargetHeight = 1 / targetHeight;

  for (let y = 0; y < targetHeight; y++) {
    const yRatio = y * invTargetHeight;
    const yMapped = y0 + yRatio * windowHeight;
    const rawY = effectiveSourceHeight * yMapped + buffer;
    const yl = Math.floor(rawY);
    const yh = Math.min(Math.ceil(rawY), sourceHeight - buffer - 1);
    const ty = rawY - yl; // Equivalent to rawY % 1 but more efficient

    for (let x = 0; x < targetWidth; x++) {
      const xRatio = x * invTargetWidth;
      const xMapped = x0 + xRatio * windowWidth;
      const rawX = effectiveSourceWidth * xMapped + buffer;
      const xl = Math.floor(rawX);
      const xh = Math.min(Math.ceil(rawX), sourceWidth - buffer - 1);
      const tx = rawX - xl; // Equivalent to rawX % 1 but more efficient

      const ll = data[yl * sourceWidth + xl];
      const hl = data[yl * sourceWidth + xh];
      const lh = data[yh * sourceWidth + xl];
      const hh = data[yh * sourceWidth + xh];

      // Check if any of the four neighboring pixels is nodata
      if (ll === options.nodata || hl === options.nodata || lh === options.nodata || hh === options.nodata) {
        newArray[y * targetWidth + x] = options.nodata;
        continue;
      }

      // Perform bilinear interpolation
      const v0 = ll * (1 - tx) + hl * tx;
      const v1 = lh * (1 - tx) + hh * tx;
      const value = v0 * (1 - ty) + v1 * ty;
      newArray[y * targetWidth + x] = value;
    }
  }

  return newArray;
}
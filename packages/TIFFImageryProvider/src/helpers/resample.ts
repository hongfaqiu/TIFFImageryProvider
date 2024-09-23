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
  nodata?: number;
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
  const { sourceWidth, sourceHeight, targetWidth, targetHeight, window, buffer = 0, nodata } = options;
  const [x0, y0, x1, y1] = window;

  const windowWidth = x1 - x0;
  const windowHeight = y1 - y0;

  const newArray = copyNewSize(data, targetWidth, targetHeight);

  const effectiveSourceWidth = sourceWidth - 2 * buffer;
  const effectiveSourceHeight = sourceHeight - 2 * buffer;

  const invTargetWidth = 1 / targetWidth;
  const invTargetHeight = 1 / targetHeight;

  const isNodata = (value: number) => {
    if (nodata === undefined) return false;
    if (nodata === 0) return value === 0;
    return Math.abs((value - nodata) / nodata) < 1e-6;
  };

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
      const txFraction = rawX - xl; // Equivalent to rawX % 1 but more efficient

      const center = data[yl * sourceWidth + xl];
      const neighbors = [
        data[yl * sourceWidth + xl],
        data[yl * sourceWidth + xh],
        data[yh * sourceWidth + xl],
        data[yh * sourceWidth + xh],
      ];

      neighbors.forEach((neighbor, index) => {
        if (isNodata(neighbor)) {
          neighbors[index] = center;
        }
      });

      // Check if any of the four neighboring pixels is nodata
      if (isNodata(center)) {
        newArray[y * targetWidth + x] = nodata;
        continue;
      }

      const [ll, hl, lh, hh] = neighbors;
      // Perform bilinear interpolation
      const v0 = lerp(ll, hl, txFraction);
      const v1 = lerp(lh, hh, txFraction);
      const value = lerp(v0, v1, ty);
      newArray[y * targetWidth + x] = value;
    }
  }

  return newArray;
}
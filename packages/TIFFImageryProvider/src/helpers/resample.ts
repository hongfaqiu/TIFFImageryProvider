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

  for (let y = 0; y < targetHeight; y++) {
    const rawY = effectiveSourceHeight * (y0 + y / targetHeight * windowHeight) + buffer;
    const yl = Math.floor(rawY);
    const yh = Math.min(Math.ceil(rawY), sourceHeight - 1);

    for (let x = 0; x < targetWidth; x++) {
      const rawX = effectiveSourceWidth * (x0 + x / targetWidth * windowWidth) + buffer;
      const tx = rawX % 1;

      const xl = Math.floor(rawX);
      const xh = Math.min(Math.ceil(rawX), sourceWidth - 1);

      const ll = data[(yl * sourceWidth) + xl];
      const hl = data[(yl * sourceWidth) + xh];
      const lh = data[(yh * sourceWidth) + xl];
      const hh = data[(yh * sourceWidth) + xh];

      const value = lerp(
        lerp(ll, hl, tx),
        lerp(lh, hh, tx),
        rawY % 1,
      );
      newArray[(y * targetWidth) + x] = value;
    }
  }
  return newArray;
}
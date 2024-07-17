import { Color } from "cesium";
import { TypedArray } from "geotiff";

export function getMinMax(data: number[], nodata: number) {
  let min: number, max: number;
  for (let j = 0; j < data.length; j += 1) {
    const val = data[j];
    if (val === nodata) continue;
    if (min === undefined && max === undefined) {
      min = max = val;
      continue;
    }
    if (val < min) {
      min = val;
    } else if (val > max) {
      max = val;
    }
  }
  return {
    min, max
  }
}

export function decimal2rgb(number: number) {
  return Math.round(number * 255)
}

export function getRange(bands: Record<number, {
  min: number;
  max: number;
}>, opts: {
  min?: number,
  max?: number,
  band: number
  } | undefined) {
  const band = bands[opts.band]
  if (!band) {
    throw new Error(`Invalid band${opts.band}`)
  }
  const min = opts?.min ?? +band.min;
  const max = opts?.max ?? +band.max;
  const range = max - min;
  return { min, max, range };
}

export function generateColorScale(colors: [number, string][] | string[], minMax: number[]) {
  let stops: [number, string][];

  if (typeof colors[0] === 'string') {
    stops = (colors as string[]).map((color, index) => [index / colors.length, color])
  } else {
    const [min, max] = minMax;
    stops = (colors as [number, string][]).map(item => [((item[0] - min) / (max - min)), item[1]])
  }

  stops.sort((a, b) => a[0] - b[0]);
  // delete extra break points
  let i = stops.length - 1;
  while (i > 1 && stops[i][0] >= 1 && stops[i - 1][0] >= 1) {
    stops.pop();
    i--;
  }

  if (stops[0][0] > 0) {
    stops = [[0, stops[0][1]], ...stops]
  }
  
  const colorScale = {
    colors: stops.map(stop => stop[1]),
    positions: stops.map(stop => {
      let s = stop[0];
      if (s < 0) return 0;
      if (s > 1) return 1;
      return s;
    }),
  }

  return colorScale;
}

export function findAndSortBandNumbers(str: string) {
  const regex = /b(\d+)/g;
  const bandNumbers = new Set<number>();
  let match: string[];
  while ((match = regex.exec(str)) !== null) {
    bandNumbers.add(parseInt(match[1]) - 1);
  }
  return Array.from(bandNumbers).sort((a, b) => a - b);
}

export function stringColorToRgba(color: string) {
  const newColor = Color.fromCssColorString(color);
  const { red, green, blue, alpha } = newColor;

  return [red, green, blue, alpha].map(val => Math.round(val * 255));
}

export function reverseArray(options: {
  array: TypedArray; width: number; height: number;
}) {
  const { array, width, height } = options;
  const reversedArray: number[] = [];

  for (let row = height - 1; row >= 0; row--) {
    const startIndex = row * width;
    const endIndex = startIndex + width;
    const rowArray = array.slice(startIndex, endIndex);
    reversedArray.push(...rowArray);
  }

  return reversedArray;
}

export type ResampleDataOptions = {
  sourceWidth: number;
  sourceHeight: number;
  targetWidth: number;
  targetHeight: number;
  /** start from 0 to 1, examples: [0, 0, 0.5, 0.5] */
  window: [number, number, number, number];
  method: 'bilinear' | 'nearest'
}

export function resampleNearest(data: TypedArray, options: ResampleDataOptions) {
  const { sourceWidth, sourceHeight, targetWidth, targetHeight, window } = options;
  const [x0, y0, x1, y1] = window;
  
  const resampledData = copyNewSize(data, targetWidth, targetHeight)

  for (let y = 0; y < targetHeight; y++) {
    for (let x = 0; x < targetWidth; x++) {
      const col = (sourceWidth * (x0 + x / targetWidth * (x1 - x0))) >>> 0;
      const row = (sourceHeight * (y0 + y / targetHeight * (y1 - y0))) >>> 0;
      resampledData[y * targetWidth + x] = data[row * sourceWidth + col];
    }
  }

  return resampledData;
}

export function resampleData(data: TypedArray, options: ResampleDataOptions) {
  switch (options.method) {
    case "nearest":
      return resampleNearest(data, options);
    case "bilinear":
      return resampleBilinear(data, options.sourceWidth, options.sourceHeight, options.targetWidth, options.targetHeight, options.window);
  }
}

function lerp(v0: number, v1:number, t: number) {
  return ((1 - t) * v0) + (t * v1);
}
export function copyNewSize(array: TypedArray, width: number, height: number, samplesPerPixel = 1) {
  return new (Object.getPrototypeOf(array).constructor)(width * height * samplesPerPixel) as typeof array;
}
/**
 * Resample the input array using bilinear interpolation. Adapted from
 * [geotiff.js](https://github.com/geotiffjs/geotiff.js/blob/a2013a3790a657badade613169c9eaa1dc550a0b/src/resample.js#L50-L84)
 * @param valueArray The input arrays to resample
 * @param inWidth The width of the input rasters
 * @param inHeight The height of the input rasters
 * @param outWidth The desired width of the output rasters
 * @param outHeight The desired height of the output rasters
 * @returns The resampled rasters
 * @remarks
 * There's still a problem here -- once the window is less than full (`[0,0,1,1]`), 
 * there's visible edge stitching within a raster. I'm not sure if the issue starts here
 * or in [reprojection.ts](./reprojection.ts), but geotiff.js's implementation doesn't
 * use the `window` parameter, so I figure this may still need investigation.
 */
export function resampleBilinear(valueArray: TypedArray, inWidth: number, inHeight: number, outWidth: number, outHeight: number, window: [number, number, number, number]) {
  // const relX = inWidth / outWidth;
  // const relY = inHeight / outHeight;

  const [x0, y0, x1, y1] = window

  const windowWidth = x1 - x0
  const windowHeight = y1 - y0

  const newArray = copyNewSize(valueArray, outWidth, outHeight);
  for (let y = 0; y < outHeight; y++) {
    // const rawY = relY * y;
    const rawY = (inHeight * (y0 + y / outHeight * windowHeight))// * relY //?

    const yl = Math.floor(rawY);
    const yh = Math.min(Math.ceil(rawY), (inHeight - 1));

    for (let x = 0; x < outWidth; x++) {
      // const rawX = relX * x;
      const rawX = (inWidth * (x0 + x / outWidth * windowWidth ))// * relX //?
      const tx = rawX % 1;

      const xl = Math.floor(rawX);
      const xh = Math.min(Math.ceil(rawX), (inWidth - 1));

      const ll = valueArray[(yl * inWidth) + xl];
      const hl = valueArray[(yl * inWidth) + xh];
      const lh = valueArray[(yh * inWidth) + xl];
      const hh = valueArray[(yh * inWidth) + xh];

      const value = lerp(
        lerp(ll, hl, tx),
        lerp(lh, hh, tx),
        rawY % 1,
      );
      newArray[(y * outWidth) + x] = value;
    }
  }
  return newArray;
}

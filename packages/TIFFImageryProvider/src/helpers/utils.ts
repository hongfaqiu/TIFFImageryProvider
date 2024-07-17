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

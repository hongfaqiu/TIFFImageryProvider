import { rgb } from "d3-color";
import { interpolateHsl, interpolateHslLong, interpolateLab, interpolateRgb } from "d3-interpolate";
import { scaleLinear } from "d3-scale";
import { TIFFImageryProviderRenderOptions } from "src";

const interpolateFactorys = {
  'rgb': interpolateRgb,
  'hsl': interpolateHsl,
  'hslLong': interpolateHslLong,
  'lab': interpolateLab
}

function decimal2rgb(number: number) {
  return Math.round(number * 255)
}

function getRange(bands: {
  min: number;
  max: number;
}[], opts: {
  min?: number,
  max?: number,
  band?: number
} | undefined) {
  const min = opts?.min ?? +bands[(opts?.band ?? 1) - 1].min;
  const max = opts?.max ?? +bands[(opts?.band ?? 1) - 1].max;
  const range = max - min;
  return { min, max, range };
}

export type GenerateImageOptions = {
  width: number;
  height: number;
  renderOptions?: TIFFImageryProviderRenderOptions;
  bands: {
    min: number;
    max: number;
  }[];
  noData?: number;
}

export async function generateImage(data: (string | any[])[], opts: GenerateImageOptions) {
  const { width, height, renderOptions, bands, noData } = opts;
  const imageData = new Uint8ClampedArray(width * height * 4);
  const { r, g, b, fill } = renderOptions ?? {};
  const ranges = [r, g, b].map(item => getRange(bands, item));

  const redData = data[(r?.band ?? 1) - 1];
  const greenData = data[(g?.band ?? 2) - 1] ?? data[0];
  const blueData = data[(b?.band ?? 3) - 1] ?? data[0];

  function ifNoDataFunc(...vals: number[]) {
    for (let i = 0; i < vals.length; i++) {
      const val = vals[i]
      if (isNaN(val) || val === noData) {
        return true
      }
    }
    return false
  }

  if (fill) {
    const { min, max, range } = ranges[0];
    const { type = 'continuous', colors, mode = 'rgb' } = fill;
    let stops: [number, string][];
    if (typeof colors[0] === 'string') {
      const step = range / colors.length;
      stops = (colors as string[]).map((color: any, index: number) => {
        return [min + index * step, color]
      })
    } else {
      stops = (colors as [number, string][]).sort((a, b) => a[0] - b[0])
      if (stops[0][0] > min) {
        stops[0][0] = min;
      }
      if (stops[stops.length - 1][0] < max) {
        stops[stops.length] = [max, stops[stops.length - 1][1]];
      }
    }
    for (let i = 0; i < data[0].length; i += 1) {
      const val = redData[i];
      let color = 'transparent';
      const ifNoData = ifNoDataFunc(val)
      if (!ifNoData) {
        for (let j = 0; j < stops.length; j += 1) {
          if ((val >= stops[j][0] && (!stops[j + 1] || (val < stops[j + 1][0])))) {
            if (type === 'continuous') {
              color = scaleLinear<string>()
                .domain(stops.map(item => (item[0] - min) / range))
                .range(stops.map(item => item[1]))
                .interpolate(interpolateFactorys[mode])((val - min) / range)
            } else {
              color = stops[j][1];
            }
            break;
          }
        }
      }
      const { r, g, b, opacity } = rgb(color)
      imageData[i * 4] = r;
      imageData[i * 4 + 1] = g;
      imageData[i * 4 + 2] = b;
      imageData[i * 4 + 3] = ifNoData ? 0 : decimal2rgb(opacity);
    }
  } else {
    for (let i = 0; i < data[0].length; i++) {
      const red = redData[i];
      const green = greenData[i];
      const blue = blueData[i];
      imageData[i * 4] = decimal2rgb((red - ranges[0].min) / ranges[0].range);
      imageData[i * 4 + 1] = decimal2rgb((green - ranges[1].min) / ranges[1].range);
      imageData[i * 4 + 2] = decimal2rgb((blue - ranges[2].min) / ranges[2].range);
      imageData[i * 4 + 3] = ifNoDataFunc(red, green, blue) ? 0 : 255;
    }
  }
  const result = new ImageData(imageData, width, height);

  return result;
}

export type GenerateImage = typeof generateImage
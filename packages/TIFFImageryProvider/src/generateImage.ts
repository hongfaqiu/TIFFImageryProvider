import { rgb } from "d3-color";
import { getRange, decimal2rgb } from "./utils";
import { TIFFImageryProviderRenderOptions } from "./TIFFImageryProvider";

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

export async function generateImage(data: Float32Array[], opts: GenerateImageOptions) {
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
    const colors = fill.colors as [number, string][];

    if (fill.type === 'discrete') {
      redData.forEach((val, i) => {
        let color = 'transparent';
        const ifNoData = ifNoDataFunc(val)
        if (!ifNoData) {
          for (let j = 0; j < colors.length; j += 1) {
            if ((val >= colors[j][0] && (!colors[j + 1] || (val < colors[j + 1][0])))) {
              color = colors[j][1];
              break;
            }
          }
        }
        const { r, g, b, opacity } = rgb(color)
        imageData[i * 4] = r;
        imageData[i * 4 + 1] = g;
        imageData[i * 4 + 2] = b;
        imageData[i * 4 + 3] = ifNoData ? 0 : decimal2rgb(opacity);
      })
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

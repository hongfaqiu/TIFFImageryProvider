import { getRange, decimal2rgb } from "./utils";
import { MultiBandRenderOptions } from "../TIFFImageryProvider";

export type GenerateImageOptions = {
  data: Float32Array[];
  width: number;
  height: number;
  renderOptions?: MultiBandRenderOptions;
  bands: Record<number, {
    min: number;
    max: number;
  }>;
  noData?: number;
  colorMapping: number[][][];
}

export async function generateImage(opts: GenerateImageOptions) {
  const { data, width, height, renderOptions, bands, noData, colorMapping } = opts;
  const imageData = new Uint8ClampedArray(width * height * 4);

  function ifNoDataFunc(...vals: number[]) {
    if (vals.some((val) => isNaN(val) || val === noData)) return true;

    return false
  }

  const { r, g, b } = renderOptions ?? {};
  const ranges = [r, g, b].map(item => getRange(bands, item));

  const redData = data[0];
  const greenData = data[1];
  const blueData = data[2];

  for (let i = 0; i < data[0].length; i++) {
    let red = decimal2rgb((redData[i] - ranges[0].min) / ranges[0].range);
    let green = decimal2rgb((greenData[i] - ranges[1].min) / ranges[1].range);
    let blue = decimal2rgb((blueData[i] - ranges[2].min) / ranges[2].range);
    let alpha = ifNoDataFunc(redData[i], greenData[i], blueData[i]) ? 0 : 255;

    colorMapping.map(([colorFrom, colorTo]) => {
      if (red === colorFrom[0] && green === colorFrom[1] && blue === colorFrom[2]) {
        red = colorTo[0];
        green = colorTo[1];
        blue = colorTo[2];
        alpha = colorTo[3];
      }
    })
    
    imageData[i * 4] = red;
    imageData[i * 4 + 1] = green;
    imageData[i * 4 + 2] = blue;
    imageData[i * 4 + 3] = alpha;
  }

  const result = new ImageData(imageData, width, height);

  return result;
}

import { TypedArray } from "geotiff";
import { copyNewSize } from "./utils";

export type ReprojectionOptions = {
  project: (pos: number[]) => number[];
  sourceBBox: [minX: number, minY: number, maxX: number, maxY: number];
  targetBBox: [minX: number, minY: number, maxX: number, maxY: number];
  data: TypedArray//number[];
  sourceWidth: number;
  sourceHeight: number;
  targetWidth?: number;
  targetHeight?: number;
  nodata?: any;
}

function inRange(val: number, range: [number, number]) {
  if ((val < range[0] && val < range[1]) || (val > range[0] && val > range[1])) {
    return false;
  } else {
    return true;
  }
}

export function reprojection(options: ReprojectionOptions): TypedArray {
  // console.log(`[DEBUG] reprojection(${JSON.stringify({...options, data: null })})`,options)
  const { data, sourceBBox, targetBBox, project, sourceWidth, sourceHeight, nodata } = options;
  const { targetWidth = sourceWidth, targetHeight = sourceHeight } = options;

  const [minX, minY, maxX, maxY] = sourceBBox;

  const [minLon, minLat, maxLon, maxLat] = targetBBox;
  
  const stepX = Math.abs(maxX - minX) / sourceWidth;
  const stepY = Math.abs(maxY - minY) / sourceHeight;

  const stepLon = Math.abs(maxLon - minLon) / targetWidth;
  const stepLat = Math.abs(maxLat - minLat) / targetHeight;

  const result = copyNewSize(data, targetWidth, targetHeight)//.fill(nodata)//new Array(targetWidth * targetHeight).fill(nodata);

  for (let i = 0; i < targetHeight; i++) {
    for (let j = 0; j < targetWidth; j++) {
      const lon = minLon + stepLon * (j + 0.5);
      const lat = maxLat - stepLat * (i + 0.5);
      const [x, y] = project([lon, lat]);

      if (!inRange(x, [minX, maxX]) || !inRange(y, [minX, maxY])) {
        break;
      }

      const indexX = ~~((x - minX) / stepX);
      const indexY = ~~((maxY - y) / stepY);

      const sourceVal = data[indexY * sourceWidth + indexX];
      const index = i * targetWidth + j;
      
      result[index] = sourceVal;
    }
  }
  return result;
}
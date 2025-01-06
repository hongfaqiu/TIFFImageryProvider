import { TypedArray } from "geotiff";

export function copyNewSize(array: TypedArray, width: number, height: number, samplesPerPixel = 1) {
  return new (Object.getPrototypeOf(array).constructor)(width * height * samplesPerPixel) as typeof array;
}

export type BBox = [minX: number, minY: number, maxX: number, maxY: number];

export type ReprojectionOptions = {
  project: (pos: number[]) => number[];
  sourceBBox: BBox;
  targetBBox: BBox;
  data: TypedArray;
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

// 处理单个数据块
function processChunk(
  options: ReprojectionOptions,
  result: TypedArray,
  startRow: number,
  endRow: number,
  targetWidth: number,
  targetHeight: number
) {
  const { data, sourceBBox, targetBBox, project, sourceWidth, sourceHeight, nodata } = options;
  const [minX, minY, maxX, maxY] = sourceBBox;
  const [minLon, minLat, maxLon, maxLat] = targetBBox;

  const stepX = Math.abs(maxX - minX) / sourceWidth;
  const stepY = Math.abs(maxY - minY) / sourceHeight;
  const stepLon = Math.abs(maxLon - minLon) / targetWidth;
  const stepLat = Math.abs(maxLat - minLat) / targetHeight;

  // 使用批量处理优化内部循环
  const colBatchSize = 100;
  for (let i = startRow; i < endRow; i++) {
    for (let jBatch = 0; jBatch < targetWidth; jBatch += colBatchSize) {
      const endJ = Math.min(jBatch + colBatchSize, targetWidth);
      for (let j = jBatch; j < endJ; j++) {
        const lon = minLon + stepLon * (j + 0.5);
        const lat = maxLat - stepLat * (i + 0.5);
        const [x, y] = project([lon, lat]);

        if (!inRange(x, [minX, maxX]) || !inRange(y, [minY, maxY])) {
          result[i * targetWidth + j] = nodata;
          continue;
        }

        const indexX = ~~((x - minX) / stepX);
        const indexY = ~~((maxY - y) / stepY);
        result[i * targetWidth + j] = data[indexY * sourceWidth + indexX];
      }
    }
  }
}

export async function reprojection(options: ReprojectionOptions): Promise<TypedArray> {
  const { targetWidth = options.sourceWidth, targetHeight = options.sourceHeight } = options;
  const result = copyNewSize(options.data, targetWidth, targetHeight).fill(options.nodata);

  // 如果数据量较小，使用同步处理
  if (targetHeight * targetWidth < 10000) {
    processChunk(options, result, 0, targetHeight, targetWidth, targetHeight);
    return result;
  }

  // 计算最佳的块大小
  const CHUNK_SIZE = Math.min(100, Math.max(10, Math.floor(targetHeight / 10)));

  try {
    // 分块处理
    for (let startRow = 0; startRow < targetHeight; startRow += CHUNK_SIZE) {
      const endRow = Math.min(startRow + CHUNK_SIZE, targetHeight);
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => {
          processChunk(options, result, startRow, endRow, targetWidth, targetHeight);
          resolve();
        });
      });
    }
    return result;
  } finally {
    // 在 finally 块中清理源数据，确保无论成功失败都会执行
    if (options.data !== result) {
      try {
        options.data.fill(0);
      } catch (e) {
        console.warn('Failed to clean up source data:', e);
      }
    }
  }
}
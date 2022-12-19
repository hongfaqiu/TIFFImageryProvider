import { calculateRange, lnglatRange2Boundary } from "../usefulFunc";

/** 根据boundary字符串计算视点 */
export function getViewPort(boundary: string) {
  const result = boundary.match(/\(\((.+?)\)/);
  let viewPort = [110.60396458865515, 34.54408834959379, 15000000];
  if (result) {
    const coors = result[1].split(',').map((item) => item.split(' ').map((val) => Number(val)));
    const { minLon, minLat, maxLon, maxLat } = calculateRange(coors);
    const height = Math.max(Math.max(maxLon - minLon, maxLat - minLat) * 150000, 1000); // min height 1000m
    viewPort = [(minLon + maxLon) / 2, (minLat + maxLat) / 2, height];
  }
  return viewPort;
}

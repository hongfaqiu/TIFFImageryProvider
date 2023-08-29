import { Cartesian3, Cartographic, Math as CesiumMath } from "cesium";

/**
 * 经纬度四至转多边形
 * @param rect 四至[最小大经度，最小大纬度]
 * @returns {string} bound
 */
export function lnglatRange2Boundary(
  rect: [minx: number, maxx: number, miny: number, maxy: number] | null | undefined,
) {
  if (!rect || rect.length !== 4) return undefined;
  const bound =
    'POLYGON((' +
    [
      [rect[0], rect[2]],
      [rect[1], rect[2]],
      [rect[1], rect[3]],
      [rect[0], rect[3]],
      [rect[0], rect[2]],
    ]
      .map((coor) => coor.join(' '))
      .join(',') +
    '))';
  return bound;
}

/**
 * 坐标串转多边形
 * @param coors 坐标串
 * @returns {string} bound
 */
export function coors2Boundary(coors: number[][]) {
  if (!coors) return undefined;
  if (coors.length === 2) {
    const bbox = calculateRange(coors)
    return lnglatRange2Boundary([bbox.minLon, bbox.maxLon, bbox.minLat, bbox.maxLat])
  }
  if (coors[coors.length - 1] !== coors[0]) {
    coors.push(coors[0])
  }
  const bound = 'POLYGON((' + coors.map((coor) => coor.join(' ')).join(',') + '))';
  return bound;
}

/**
 * 将包围盒转换为坐标串
 * @param boundary 包围盒字符串
 * @returns {number[][]}
 */
export function boundary2Coors(boundary: string) {
  const result = boundary.match(/\(\((.+?)\)/);
  if (result) {
    const coors = result[1].split(',').map((item) => item.split(' ').map((val) => Number(val)));
    return coors;
  }
  return null;
}

export function boundary4326(boundary: string) {
  let coors = boundary2Coors(boundary)
  if (coors?.every(item => Math.abs(item[0]) > 180)) {
    coors = coors.map(item => {
      const cartographic = Cartographic.fromCartesian(new Cartesian3(item[0], item[1]));
      return [CesiumMath.toDegrees(cartographic.longitude), CesiumMath.toDegrees(cartographic.latitude)]
    })
  }
  return coors ? coors2Boundary(coors) : undefined
}

/**
 * 输入一串经纬度,计算四至
 */
export function calculateRange(coors: number[][]) {
  return {
    minLon: Math.min(...coors.map((item) => item[0])),
    minLat: Math.min(...coors.map((item) => item[1])),
    maxLon: Math.max(...coors.map((item) => item[0])),
    maxLat: Math.max(...coors.map((item) => item[1])),
  };
}

/**
 * 将包围盒转换为geojson
 * @param boundary 包围盒字符串
 * @returns {Object} geojson
 */
export function boundary2Geojson(boundary: string) {
  const coors = boundary2Coors(boundary);
  if (coors) {
    const geojson = {
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'Polygon',
        coordinates: [coors],
      },
    };
    return geojson;
  }
  return null;
}

/**
 * 生成一个唯一的id
 * @returns {string} id
 */
export function uniqueId() {
  let _val = '';

  do {
    _val = Math.random().toString(36).slice(-8);
  } while (_val.length < 8);

  return _val;
}

export function convertDEGToDMS(deg: number, isLat: boolean) {
  const absolute = Math.abs(deg);

  const degrees = ~~absolute;
  const minutesNotTruncated = (absolute - degrees) * 60;
  const minutes = ~~minutesNotTruncated;
  const seconds = ((minutesNotTruncated - minutes) * 60).toFixed(2);

  let minSec = '';
  if (minutes || seconds !== '0.00') minSec += minutes + "'";
  if (seconds !== '0.00') minSec += seconds + '"';

  return `${degrees}°${minSec.padStart(2, '0')} ${
    isLat ? (deg >= 0 ? 'N' : 'S') : deg >= 0 ? 'E' : 'W'
  }`;
}

/**
 * 将经纬度数值转换为经纬度字符串
 */
export function lonLat2DMS(lonLat: number[]) {
  const DMS = [convertDEGToDMS(lonLat[0], false), convertDEGToDMS(lonLat[1], true)];
  if (lonLat[2]) DMS.push(lonLat[2].toFixed(0) + 'm');
  return DMS;
}

export function generateUrl(url: string, params?: Record<string, any>) {
  if (!params) return url;

  const entries = Object.entries(params);
  let newUrl = url + '?';
  for (let i = 0; i < entries.length; i += 1) {
    if (i > 0) newUrl += '&';
    newUrl += entries[i][0] + '=' + entries[i][1];
  }
  return newUrl;
}

export function miter2Str(miter: number) {
  if(!miter) return '0m'

  if (miter > 10000) {
    return (miter / 1000).toFixed(2) + 'km'
  } else {
    return miter.toFixed(2) + 'm'
  }
}

/**
 * 比较获取两个对象的不同部分
 * @param newObj 新对象
 * @param oldObj 老对象
 * @returns 返回新对象与老对象的不同部分
 */
export function getDiffObj(newObj: Record<string, any>, oldObj: Record<string, any> | undefined) {
  const result: Record<string, any> = {}
  for (let k in newObj) {
    const val = newObj[k]
    if (val === undefined) return
    
    if (typeof val === 'object') {
      if (Object.keys(val).length) {
        const res = getDiffObj(val, oldObj?.[k])
        if (res) result[k] = res
      }
    } else {
      if (oldObj?.[k] !== val) {
        result[k] = val
      }
    }
  }
  return Object.keys(result).length ? result : undefined
}

/**
 * 匹配路径
 * @param path 当前路由
 * @param targetArr 目标路由数组
 * @param strictArray 严格匹配的路由数组
 * @returns 目标路由数组中的值
 */
export const changePath = (path: string, targetArr: string[], strictArray?: string[]) => {
  if (strictArray?.includes(path)) return path;

  // 将目标路由路径从长到短排序
  targetArr.sort((a, b) => (b.length - a.length))

  for (let i = 0; i < targetArr.length; i += 1) {
    const item = targetArr[i]
    if (path.includes(item)) return item;
  }

  return undefined
}
import {
  Cartesian2,
  defined,
  Math as CMath
} from 'cesium';

import CesiumMap from './CesiumMap';

import type {
  Viewer,
  Cartesian3
} from 'cesium';

type MapObjType = {
  name: string;
  type: 'main' | 'other';
  obj: CesiumMap;
};

/**
 * 只有MainMapObj支持关联系统图层管理操作
 */
export let MainMapObj: CesiumMap | undefined;
export const MapObjs: Map<string, CesiumMap> = new Map();

export const addMapObj = (mapObjItem: MapObjType) => {
  if (!(mapObjItem.obj instanceof CesiumMap)) {
    return false;
  }
  if (MapObjs.get(mapObjItem.name) !== undefined) {
    return false;
  }
  if (mapObjItem.type === 'main') {
    if (MainMapObj) {
      return false;
    } else {
      MainMapObj = mapObjItem.obj;
    }
  }

  MapObjs.set(mapObjItem.name, mapObjItem.obj);
  return true;
};

export const removeMapObj = (name: string) => {
  const mapObj = MapObjs.get(name);
  mapObj?.viewer?.destroy();
  if (mapObj === MainMapObj) {
    MainMapObj = undefined;
  }
  if (mapObj) {
    MapObjs.delete(name);
    return true;
  } else {
    return false;
  }
};

/**
 * 屏幕坐标转地图坐标
 */
export function screenPosToMapPos(viewer: Viewer, x: number, y: number) {
  const pick1 = new Cartesian2(x, y);
  const ray = viewer.camera.getPickRay(pick1);
  if (!ray) return null;
  const cartesian = viewer.scene.globe.pick(ray, viewer.scene);
  if (cartesian) {
    //将笛卡尔三维坐标转为地图坐标（弧度）
    const cartographic = viewer.scene.globe.ellipsoid.cartesianToCartographic(cartesian);
    //将地图坐标（弧度）转为十进制的度数
    const lon = +CMath.toDegrees(cartographic.longitude).toFixed(6);
    const lat = +CMath.toDegrees(cartographic.latitude).toFixed(6);
    return [lon, lat];
  }
  return null;
}

/**
 * Cartesian2 坐标转经纬度
 */
export function CartesiantoLonlat(
  cartesian: Cartesian2 | Cartesian3 | undefined,
  viewer: Viewer,
  height?: number,
) {
  const scene = viewer.scene;
  let pos = undefined;
  let cartesian3: Cartesian3 | undefined;

  if (cartesian instanceof Cartesian2) {
    const pickedObject = scene.pick(cartesian);
    if (scene.pickPositionSupported && defined(pickedObject)) {
      cartesian3 = viewer.scene.pickPosition(cartesian);
    } else {
      cartesian3 = viewer.camera.pickEllipsoid(cartesian);
    }
  } else {
    cartesian3 = cartesian;
  }

  if (cartesian3) {
    const cartographic = viewer.scene.globe.ellipsoid.cartesianToCartographic(
      cartesian3 as Cartesian3,
    );
    // 将弧度转为度的十进制度表示
    const lon = +CMath.toDegrees(cartographic.longitude);
    const lat = +CMath.toDegrees(cartographic.latitude);
    pos = [lon, lat, height ?? cartographic.height];
  }
  return pos;
}

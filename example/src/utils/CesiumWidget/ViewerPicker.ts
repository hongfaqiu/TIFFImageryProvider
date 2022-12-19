import * as Cesium from 'cesium';

import type { Cartesian2, ScreenSpaceEventHandler, Viewer } from 'cesium';

type VeiwerPickercallback = (result: { xy: number[]; bbox: [number[], number[]] }) => void;

type ViewerPickerOptions = {
  accuracy?: number;
  buffer?: number;
};
export default class VeiwerPicker {
  viewer: Viewer;
  private handler: ScreenSpaceEventHandler;
  private callback: VeiwerPickercallback;
  options = {
    accuracy: 6,
    buffer: 0,
  };

  constructor(viewer: Viewer, callback: VeiwerPickercallback, options?: ViewerPickerOptions) {
    this.viewer = viewer;
    this.callback = callback;
    this.handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    this.options = { ...this.options, ...options };
  }

  start = () => {
    // 得到当前三维场景
    const { scene } = this.viewer;
    // 得到当前三维场景的椭球体
    const { ellipsoid } = scene.globe;
    // 设置鼠标双击事件的处理函数，这里负责获取x,y坐标值
    this.handler?.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK); // 移除事件
    this.handler.setInputAction((movement: { position: Cartesian2 }) => {
      // 通过指定的椭球或者地图对应的坐标系，将鼠标的二维坐标转换为对应椭球体三维坐标
      const { buffer, accuracy } = this.options;
      const cartesian = this.viewer.camera.pickEllipsoid(
        new Cesium.Cartesian2(movement.position.x - buffer / 2, movement.position.y - buffer / 2),
        ellipsoid,
      );
      const cartesian2 = this.viewer.camera.pickEllipsoid(
        new Cesium.Cartesian2(movement.position.x + buffer / 2, movement.position.y + buffer / 2),
        ellipsoid,
      );
      if (cartesian && cartesian2) {
        // 将笛卡尔坐标转换为地理坐标
        const cartographic = ellipsoid.cartesianToCartographic(cartesian);
        const cartographic2 = ellipsoid.cartesianToCartographic(cartesian2);
        // 将弧度转为度的十进制度表示
        const point1lon = +Cesium.Math.toDegrees(cartographic.longitude).toFixed(accuracy);
        const point1lat = +Cesium.Math.toDegrees(cartographic.latitude).toFixed(accuracy);
        const point2lon = +Cesium.Math.toDegrees(cartographic2.longitude).toFixed(accuracy);
        const point2lat = +Cesium.Math.toDegrees(cartographic2.latitude).toFixed(accuracy);
        this.callback({
          xy: [movement.position.x, movement.position.y],
          bbox: [
            [point1lon, point1lat],
            [point2lon, point2lat],
          ],
        });
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
  };

  end = () => {
    this.handler?.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK); // 移除事件
  };
}

import { ScreenSpaceEventHandler, ScreenSpaceEventType, Math as CMath } from "cesium";
import { useEffect, useRef, useState } from "react";
import { throttle } from "lodash";

import { screenPosToMapPos } from "@/utils/map";
import { convertDEGToDMS, miter2Str } from '@/utils/usefulFunc';
import styles from './index.module.scss'

import type { Cartesian2 } from "cesium";
import { ViewerHook } from "@/hooks/use-viewer";

export type CameraParams = {
  height: number;
  pitch: number;
  angle: number;
};

const MapStatus = () => {
  const [lonLat, setLonLat] = useState([0, 0]);
  const [params, setParams] = useState<CameraParams>();
  const handler = useRef<ScreenSpaceEventHandler>()
  const {viewer} = ViewerHook.useHook();

  const orbitTickFunction = () => {
    if (!viewer || viewer?.isDestroyed()) return

    const angle = CMath.toDegrees(viewer.camera.heading);
    setParams({
      height: viewer.camera.positionCartographic.height,
      pitch: CMath.toDegrees(viewer.camera.pitch),
      angle: -(angle > 180 ? angle - 360 : angle),
    });
  }

  useEffect(() => {
    if (!viewer || viewer?.isDestroyed()) return
    handler.current = new ScreenSpaceEventHandler(viewer.scene.canvas);
    const action = throttle((movement: { endPosition: Cartesian2 }) => {
      if (!viewer.isDestroyed()) {
        setLonLat(
          screenPosToMapPos(viewer, movement.endPosition.x, movement.endPosition.y) ?? [0, 0],
        );
      }
    }, 100)
    handler.current.setInputAction(action, ScreenSpaceEventType.MOUSE_MOVE);
    viewer?.clock.onTick.addEventListener(orbitTickFunction);

    return () => {
      if (!viewer.isDestroyed()) {
        viewer?.clock.onTick.removeEventListener(orbitTickFunction)
        handler.current?.removeInputAction(ScreenSpaceEventType.MOUSE_MOVE)
      }
    }
  }, [viewer]);

  return (
    <div className={styles["map-status"]}>
      <div className={styles["msg"]}><label>经度:</label> <div className={styles["lonlat"]}>{convertDEGToDMS(lonLat[0], false)}</div> </div>
      <div className={styles["msg"]}><label>纬度:</label> <div className={styles["lonlat"]}>{convertDEGToDMS(lonLat[1], true)}</div> </div>
      <div className={styles["msg"]}><label>高度:</label> <div className={styles["camera"]}>{miter2Str(params?.height ?? 0)}</div> </div>
      <div className={styles["msg"]}><label>朝向:</label> <div className={styles["camera"]}>{params?.angle.toFixed(2) ?? 0}°</div> </div>
      <div className={styles["msg"]}><label>俯仰角:</label> <div className={styles["camera"]}>{params?.pitch.toFixed(2) ?? 0}°</div> </div>
    </div>
  )
}

export default MapStatus

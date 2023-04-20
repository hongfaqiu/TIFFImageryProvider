import { createContext, useEffect, useMemo, useState } from "react"

import CesiumMap from "@/utils/CesiumMap"
import { addMapObj, removeMapObj } from "@/utils/map"
import styles from './index.module.scss'

import { LayerHook } from "@/hooks/use-layer"
import EarthHeader from "../EarthHeader"
import { ViewerHook } from "@/hooks/use-viewer"

import { Viewer } from "cesium"
import ToolsAndPanels from "../ToolsAndPanels"
import ViewerModeSwitchBtn from "../ViewerModeSwitchBtn"
import { MapConfigHook } from "@/hooks/use-mapConfig"

export type ViewerProps = {
  headerSlot?: React.ReactNode;
  children?: React.ReactNode;
}

export const V = createContext<Viewer | null>(null);

const EarthViewer: React.FC<ViewerProps> = ({
  children
}) => {
  const { setViewer } = ViewerHook.useHook();
  const { mapConfig, initialMapConfig, resetMapState } = MapConfigHook.useHook();
  const { resetLayerState, addLayer } = LayerHook.useHook();

  useEffect(() => {
    // 初始化地图
    const mapObj = new CesiumMap('cesiumContainer');

    setViewer(mapObj.viewer);
    addMapObj({
      name: 'cesiumContainer',
      type: 'main',
      obj: mapObj,
    });
    initialMapConfig().then(async () => {
      await addLayer({
        layerName: 'singleBand',
        id: '1',
        method: 'cog',
        url: '/cogtif.tif',
        renderOptions: {
          fill: {
            colorScale: 'jet'
          }
        }
      }, {
        zoom: true
      })
    })
    
    return () => {
      removeMapObj('cesiumContainer');
      resetLayerState();
      resetMapState();
    };
  }, []);

  return (
    <div className={styles.mapview}>
      <div className={styles["earth-ui-header"]}>
        <EarthHeader/>
      </div>
      <div
        id="cesiumContainer"
        className={styles.cesiumContainer}
      >
        {children}
        <div className={styles.rightTool}>
          {mapConfig.viewerModeSwitch && <ViewerModeSwitchBtn />}
        </div>
      </div>
    </div>
  )
}

const EarthChildren = () => {
  return (
    <>
      <ToolsAndPanels />
    </>
  )
}

const Earth = () => {
  return (
    <LayerHook.Provider>
      <MapConfigHook.Provider>
        <ViewerHook.Provider >
          <EarthViewer>
            <EarthChildren/>
          </EarthViewer>
        </ViewerHook.Provider>
      </MapConfigHook.Provider>
    </LayerHook.Provider>
  )
}

export default Earth

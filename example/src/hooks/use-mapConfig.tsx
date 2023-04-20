import { useEffect, useState } from 'react';

import { MainMapObj } from '@/utils/map';
import preHandleLayer from '@/utils/preHandleLayer';
import createGlobalHook from './create-global-hook';

import type { Layer } from '@/typings/layer';

export type CartographyContainerParams = {
  width?: string | number | undefined;
  height?: string | number | undefined;
  resizeable?: boolean | undefined;
  ratio?: number | undefined;
};

export type MapConfigType = {
  navigator?: boolean; // 是否显示导航控件
  displayMode?: 1 | 2 | 3; // 2为二维, 3为三维, 1为2.5D
  skyAtmosphere?: boolean; // 是否显示大气
  fogDensity?: number; // 水汽含量
  baseMap?: Layer.LayerItem; // 底图
  annotationMap?: Layer.LayerItem; // 注记
  terrain?: Layer.TerrainLayer; // 地形
  viewerModeSwitch?: boolean; // 是否显示二三维切换按钮
  performance?: number; // 显示效果,与性能有关,数值0-1,越大越精细
  terrainExaggeration?: number; // 地形拉伸系数
  antiAliasing?: boolean; // 是否开启FXAA抗锯齿
  /** 地形透明 */
  translucency?: {
    enable: boolean;
    /** 是否按距离变化透明度 */
    fadeByDistance: boolean;
    /** 透明度 */
    alpha: number;
  };
};

export const defaultMapConfig: MapConfigType = {
  navigator: true,
  displayMode: 3,
  skyAtmosphere: true,
  fogDensity: 0.0001,
  baseMap: {
    layerName: 'ESRI影像底图',
    id: '底图-ESRI影像底图',
    method: 'arcgis',
    url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer',
    imageURL: 'https://resource.deep-time.org/resource/mapViewPic/baseMap-esri.png',
  },
  viewerModeSwitch: true,
  performance: 1.0,
  terrainExaggeration: 1.0,
  antiAliasing: false,
  translucency: {
    enable: false,
    fadeByDistance: true,
    alpha: 0.5,
  },
};

let mapConfigCopy = defaultMapConfig

const useMapConfigHook = () => {
  const [mapConfig, setMapConfig] = useState<MapConfigType>(defaultMapConfig);

  useEffect(() => {
    mapConfigCopy = mapConfig
  }, [mapConfig])

  async function updateMapConfig(config: MapConfigType) {
    if (MainMapObj === undefined) return false;
    let bool = true;
    for (const key in config) {
      if (MainMapObj === undefined) return;
      const val = (config as any)[key];
      try {
        switch (key) {
          case 'navigator':
            MainMapObj.setNavigation(val);
            break;
          case 'displayMode':
            MainMapObj.switchDisplayMode(val);
            break;
          case 'skyAtmosphere':
            MainMapObj.switchSkyAtmosphere(val);
            break;
          case 'fogDensity':
            MainMapObj.changeFogDensity(val);
            break;
          case 'baseMap':
            if (MainMapObj.baseMapObj) MainMapObj.removeImageLayer(MainMapObj.baseMapObj);
            const baseLayer = await preHandleLayer(val)
            if (baseLayer)
              MainMapObj.baseMapObj = await MainMapObj.addRasterLayer(baseLayer, { index: 0 });
            break;
          case 'terrain':
            MainMapObj.addTerrain(val);
            break;
          case 'performance':
            MainMapObj.changePerformance(val);
            break;
          case 'terrainExaggeration':
            MainMapObj.changeTerrainExag(val);
            break;
          case 'antiAliasing':
            MainMapObj.antiAliasing(val);
            break;
          case 'translucency':
            config.translucency = {
              enable: false,
              fadeByDistance: true,
              alpha: 0.5,
              ...mapConfigCopy.translucency,
              ...config.translucency,
            };
            MainMapObj.changeTranslucency(config.translucency);
            break;
          default:
            break;
        }
      } catch (e) {
        console.log(e);
        bool = false;
      }
    }
    setMapConfig((oldval) => ({ ...oldval, ...config }));
    return bool;
  }

  useEffect(() => {
    const viewerMode = MainMapObj?.viewer.scene.mode;
    if (viewerMode !== undefined) {
      setMapConfig((oldval) => ({ ...oldval, displayMode: viewerMode as any }));
    }
  }, [MainMapObj?.viewer.scene.mode]);

  /**
   * 初始化地图,从url中读取默认加载的内容
   */
  const initialMapConfig = () => {
    return updateMapConfig({ ...defaultMapConfig });
  };

  /**
   * 重置全局变量
   */
  const resetMapState = () => {
    setMapConfig(defaultMapConfig);
  };

  return {
    mapConfig,
    updateMapConfig,
    initialMapConfig,
    resetMapState,
  };
};

export const MapConfigHook = createGlobalHook(useMapConfigHook)
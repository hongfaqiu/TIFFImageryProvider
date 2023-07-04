import * as Cesium from 'cesium';
import { Cartesian2, Cartesian3 } from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';

import { Compass, ZoomController } from '../CesiumWidget';
import Subscriber from '../subscriber';

import type {
  Cesium3DTileset,
  DataSource,
  Entity,
  EntityCollection,
  ImageryLayer,
  TimeDynamicPointCloud,
  Viewer,
} from 'cesium';
import type { EventType, ExternalListenCallback } from '../subscriber';

Cesium.Ion.defaultAccessToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI4OGQwZTM2MC00NjkzLTRkZTgtYTU5MS0xZTA1NTljYWQyN2UiLCJpZCI6NTUwODUsImlhdCI6MTYyMDM5NjQ3NH0.lu_JBwyngYucPsvbCZt-xzmzgfwEKwcRXiYs5uV8uTM';

export type CesiumMapOptions = {
  navigator?: boolean;
  displayMode?: 0 | 1 | 2;
  skyAtmosphere?: boolean;
  fogDensity?: number;
  defaultView?: number[];
  listeners?: {
    map?: {
      [K in EventType]?: ExternalListenCallback;
    };
  };
};

/**
 * 基础地图类
 */
export default class BaseMap {
  readonly viewer: Viewer;
  readonly cesiumContainer: string;
  protected _options: CesiumMapOptions;
  cesiumNavigation: {
    compass?: Compass;
    zoomController?: ZoomController;
  } | null = null;
  readonly subscriber: Subscriber;
  readonly subscribIds: string[] = [];
  private _destroyed: boolean = false;
  baseMapObj: ImageryLayer | null = null;
  annotationMapObj: ImageryLayer | null = null

  constructor(cesiumContainer: string, options: CesiumMapOptions = {}) {
    this.viewer = this.initMap(cesiumContainer);
    this._options = {
      navigator: true,
      displayMode: 1,
      skyAtmosphere: true,
      fogDensity: 0.0001,
      defaultView: [116.3, 39.9, 15000000],
      ...options,
    };
    this.cesiumContainer = cesiumContainer;
    if (options.navigator !== undefined) this.setNavigation(options.navigator);
    this.resetView();
    this.subscriber = new Subscriber(this.viewer, {
      pickResult: {
        enable: true,
      },
    });
    this.subscriber.removeNative(this.viewer, 'LEFT_DOUBLE_CLICK');
    if (options.listeners?.map) {
      Object.entries(options.listeners.map).map(([eve, func]) => {
        const Id = this.subscriber.addExternal(func, eve as any);
        if (Id) this.subscribIds.push(Id);
      });
    }

  }

  get isDestroyed() {
    return this._destroyed;
  }

  /**
   * 初始化地图
   * @param cesiumContainer 地图容器div id
   */
  protected initMap = (cesiumContainer: string) => {
    const viewer: Viewer = new Cesium.Viewer(cesiumContainer, {
      baseLayerPicker: false, // 图层选择器
      animation: false, // 左下角仪表
      fullscreenButton: false, // 全屏按钮
      geocoder: false, // 右上角查询搜索
      homeButton: false, // home按钮
      sceneModePicker: false, // 3d 2d选择器
      selectionIndicator: true, //
      timeline: false, // 时间轴
      navigationHelpButton: false, // 右上角帮助按钮
      shouldAnimate: true,
      useBrowserRecommendedResolution: false,
      orderIndependentTranslucency: false,
    });

    viewer.scene.fog.density = 0.0001; // 雾气中水分含量
    viewer.scene.globe.enableLighting = false;
    viewer.scene.moon.show = false; // 不显示月球
    // @ts-ignore
    viewer._cesiumWidget._creditContainer.style.display = 'none';
    viewer.scene.debugShowFramesPerSecond = true;
    // viewer.scene.globe.depthTestAgainstTerrain = true;
    viewer.scene.skyBox.show = false;
    viewer.scene.backgroundColor = new Cesium.Color(0.0, 0.0, 0.0, 0.0);
    // @ts-ignore
    viewer.imageryLayers.remove(viewer.imageryLayers._layers[0]);
    viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#4F4F4F');
    viewer.scene.screenSpaceCameraController.enableCollisionDetection = false;
    viewer.scene.globe.translucency.frontFaceAlphaByDistance = new Cesium.NearFarScalar(
      400.0,
      0.0,
      10000.0,
      1.0,
    );

    return viewer;
  };

  /**
   * 地形拉伸
   * @param val 拉伸系数
   */
  changeTerrainExag(val: number) {
    this.viewer.scene.globe.terrainExaggeration = val;
    this.viewer.scene.requestRender();
  }

  /**
   * 更改性能
   */
  changePerformance(val: number) {
    this.viewer.resolutionScale = val; //默认值为1.0
  }

  /**
   * 是否开启FXAA抗锯齿
   */
  antiAliasing(val: boolean) {
    this.viewer.postProcessStages.fxaa.enabled = val;
    this.viewer.scene.requestRender();
  }

  /**
   * 透明度调整
   */
  changeTranslucency(options: { enable: boolean; fadeByDistance?: boolean; alpha: number }) {
    const { enable, fadeByDistance, alpha } = options;

    const globe = this.viewer.scene.globe;
    globe.translucency.enabled = enable;
    globe.translucency.frontFaceAlphaByDistance.nearValue = alpha;
    globe.translucency.frontFaceAlphaByDistance.farValue = fadeByDistance ? 1.0 : alpha;
    this.viewer.scene.requestRender();
  }

  /**
   * 重置视角
   */
  resetView() {
    const defaultView = this._options.defaultView;
    if (!defaultView) return;
    this.viewer.camera.setView({
      // 镜头的经纬度、高度。镜头默认情况下，在指定经纬高度俯视（pitch=-90）地球
      destination: Cesium.Cartesian3.fromDegrees(defaultView[0], defaultView[1], defaultView[2]),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-90),
        roll: Cesium.Math.toRadians(0),
      },
    });
  }

  /**
   * 切换指南针和比例尺
   */
  setNavigation = (
    ifShow: boolean,
    options: {
      enableCompass?: boolean;
      enableZoomControls?: boolean;
    } = {},
  ) => {
    const { enableCompass = true, enableZoomControls = true } = options;
    if (this.cesiumNavigation) {
      this.cesiumNavigation.compass?.destroy()
      this.cesiumNavigation.zoomController?.destroy()
      this.cesiumNavigation = null;
    }
    if (ifShow) {
      const defaultView = this._options.defaultView;
      this.cesiumNavigation = {
        compass: enableCompass ? new Compass(this.viewer) : undefined,
        zoomController: enableZoomControls
          ? new ZoomController(this.viewer, {
              home: defaultView
                ? Cesium.Cartesian3.fromDegrees(defaultView[0], defaultView[1], defaultView[2])
                : undefined,
            })
          : undefined,
      };
    }
  };

  // 切换显示模式
  switchDisplayMode(val: 1 | 2 | 3) {
    switch (val) {
      case 2:
        this.viewer.scene.morphTo2D(0);
        break;
      case 3:
        this.viewer.scene.morphTo3D(0);
        break;
      case 1:
        this.viewer.scene.morphToColumbusView(0); // 哥伦布视图
        break;
      default:
        this.viewer.scene.morphTo3D(0);
        break;
    }
  }

  // 是否显示大气层
  switchSkyAtmosphere(bool: boolean) {
    if (this.viewer.scene.skyAtmosphere) {
      this.viewer.scene.skyAtmosphere.show = bool;
    }
    this.viewer.scene.requestRender();
  }

  // 更改水汽含量
  changeFogDensity(val: number) {
    this.viewer.scene.fog.density = val; // 雾气中水分含量
    this.viewer.scene.requestRender();
  }

  /**
   * 缩放至, 优先缩放至viewPort
   * @param viewPort 空间经纬度高度
   * @param layer 图层
   */
  zoomToViewPort(
    viewPort: number[] | undefined,
    target:
      | DataSource
      | ImageryLayer
      | Entity
      | Entity[]
      | EntityCollection
      | Cesium3DTileset
      | TimeDynamicPointCloud
      | null = null,
  ) {
    if (viewPort) {
      // 三维下不缩放到太远
      const if3d = this.viewer.scene.mode === Cesium.SceneMode.SCENE3D;
      this.viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
          viewPort[0],
          viewPort[1],
          if3d ? Math.min(viewPort[2], 20000000) : viewPort[2],
        ),
        duration: 1,
      });
      return;
    }
    if (target) {
      this.viewer.flyTo(target, {
        duration: 1,
      });
      return;
    }
  }

  // 移除对应图层
  removeImageLayer(layer: ImageryLayer) {
    (layer.imageryProvider as any)?.destroy?.();
    return this.viewer.imageryLayers.remove(layer, true);
  }

  // 清除所有图层
  removeAllImageLayer() {
    return this.viewer.imageryLayers.removeAll(true);
  }

  /**
   * 将栅格图层拖拽到目标位置
   * @param dragLayer 拖拽图层
   * @param dropLayer 目标图层
   * @returns boolean
   */
  moveImageLayer(dragLayer: ImageryLayer, dropLayer: ImageryLayer) {
    if (!dragLayer || !dropLayer) {
      return false;
    }
    try {
      const { imageryLayers } = this.viewer;
      const dragIndex = imageryLayers.indexOf(dragLayer);
      const dropIndex = imageryLayers.indexOf(dropLayer);
      const num = dropIndex - dragIndex;

      if (num <= 0) {
        for (let i = num; i < 0; i += 1) {
          imageryLayers.lower(dragLayer);
        }
      } else {
        for (let i = 0; i < num; i += 1) {
          imageryLayers.raise(dragLayer);
        }
      }
      this.viewer.scene.requestRender();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 移动不同类型的图层
   * @param dragLayer
   * @param dropLayer
   * @returns boolean
   */
  moveLayerByType = (dragLayer: any, dropLayer: any) => {
    if (dragLayer instanceof Cesium.ImageryLayer && dropLayer instanceof Cesium.ImageryLayer) {
      return this.moveImageLayer(dragLayer, dropLayer);
    }
    return false;
  };

  getCesiumEnv() {
    const { position, heading, pitch, roll, positionCartographic } = this.viewer.camera;
    const viewCenter = new Cartesian2(
      Math.floor(this.viewer.canvas.clientWidth / 2),
      Math.floor(this.viewer.canvas.clientHeight / 2),
    );
    // Given the pixel in the center, get the world position
    const centerPosition = this.viewer.scene.camera.pickEllipsoid(viewCenter);
    return {
      sceneMode: this.viewer.scene.mode,
      centerPosition,
      height: positionCartographic.height,
      camera: {
        destination: position,
        orientation: {
          heading,
          pitch,
          roll,
        },
      },
    };
  }

  resetCesiumEvn(value: ReturnType<BaseMap['getCesiumEnv']>) {
    if (value.sceneMode === Cesium.SceneMode.SCENE2D) {
      this.viewer.scene.morphTo2D(0);
    }
    if (value.sceneMode === Cesium.SceneMode.COLUMBUS_VIEW) {
      this.viewer.scene.morphToColumbusView(0);
    }
    if (this.viewer.scene.mode !== Cesium.SceneMode.SCENE3D && value.centerPosition) {
      this.viewer.camera.lookAt(value.centerPosition, new Cartesian3(0, 0, value.height));
      this.viewer.scene.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
    } else {
      this.viewer.scene.camera.setView({
        destination: value.camera.destination,
        orientation: value.camera.orientation,
      });
    }
  }

  destroy() {
    this.subscriber.removeExternal(this.subscribIds);
    this.subscriber.destroy();
    this.viewer.destroy();
    this._destroyed = true;
  }
}

import * as Cesium from 'cesium';
import { Resource } from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import { TIFFImageryProvider } from 'tiff-imagery-provider';
import proj4 from 'proj4-fully-loaded'; 

import { boundary2Coors, calculateRange } from '../usefulFunc';
import BaseMap from './BaseMap';

import { ImageryLayer, ImageryProvider, Rectangle } from 'cesium';
import type { Layer } from '@/typings/layer';

export default class CesiumMap extends BaseMap {
  protected getResource(options: { url: string; headers?: any; queryParameters?: any }) {
    if (!options.url) return null;
    const resource = new Resource({
      ...options,
      retryAttempts: 1,
    });
    if (resource.getBaseUri()) {
      return resource;
    } else {
      return null;
    }
  }

  // 生成ImageryProvider
  protected async generateImageProvider(
    imageLayer: Layer.LayerItem,
  ): Promise<ImageryProvider | null> {
    const {
      url: OriginUrl,
      method,
      boundary,
      layerName,
      renderOptions,
      headers,
      queryParameters,
    } = imageLayer;
    const { loaderinfo = {} } = imageLayer as Layer.RasterLayerItem;
    const { minimumLevel, maximumLevel } = loaderinfo;

    const layer = imageLayer.sourceLayer || layerName;
    let tilingScheme = new Cesium.WebMercatorTilingScheme()

    const srs = loaderinfo?.srs ?? ''
    if (/4326|4490/.test(srs)) {
      tilingScheme = new Cesium.GeographicTilingScheme()
    }

    const url: any =
      typeof OriginUrl === 'string'
        ? this.getResource({
            url: OriginUrl,
            headers,
            queryParameters,
          })
        : OriginUrl;
    if (!url) return null;

    let imageryProvider: any = null, rectangle: Rectangle | undefined = undefined;
    const coors = boundary2Coors(boundary ?? '');
    if (coors) {
      const { minLon, minLat, maxLon, maxLat } = calculateRange(coors);
      rectangle = Cesium.Rectangle.fromDegrees(minLon, minLat, maxLon, maxLat)
    }

    switch (method) {
      case 'wms':
        imageryProvider = new Cesium.WebMapServiceImageryProvider({
          url,
          layers: layer,
          tilingScheme,
          minimumLevel,
          maximumLevel,
          parameters: {
            // service : "WMS",
            format: 'image/png', // 显示声明png格式、透明度，让背景区域透明
            transparent: true,
            ...queryParameters,
          }
        });
        break;
      case 'wmts':
        imageryProvider = new Cesium.WebMapTileServiceImageryProvider({
          url,
          layer,
          style: loaderinfo.style ?? '',
          tileMatrixSetID: loaderinfo.tileMatrixSetID ?? '',
          format: loaderinfo.format,
          tilingScheme,
          minimumLevel,
          maximumLevel,
          tileMatrixLabels: loaderinfo.tileMatrixLabels ?? /4490/.test(srs) ? ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21'] : undefined
        });
        break;
      case 'arcgis':
        imageryProvider = new Cesium.ArcGisMapServerImageryProvider({
          url,
          maximumLevel,
          tilingScheme,
          enablePickFeatures: false
        });
        break;
      case 'tms':
        imageryProvider = new Cesium.UrlTemplateImageryProvider({
          url,
          tilingScheme,
          minimumLevel,
          maximumLevel,
          enablePickFeatures: false
        });
        break;
      case 'cog':
        imageryProvider = await TIFFImageryProvider.fromUrl(url, {
          minimumLevel,
          maximumLevel,
          renderOptions,
          enablePickFeatures: true,
          projFunc: (code) => {
            if (![4326].includes(code)) {
              {
                try {
                  let prj = proj4(`EPSG:${code}`, "EPSG:4326")
                  let unprj = proj4("EPSG:4326", `EPSG:${code}`)
                  if (prj && unprj) return {
                    project: prj.forward,
                    unproject: unprj.forward
                  }
                } catch (e) {
                  console.error(e);
                }
              }
            }
          },
        });
        break;
      case 'pic':
        imageryProvider = new Cesium.SingleTileImageryProvider({
          url,
          rectangle,
        });
        break;
      default:
        break;
    }
    return imageryProvider;
  }

  /**
   * 添加栅格图层
   * @param imageLayer 栅格图层参数
   * @param zoom 是否缩放,默认为false
   * @returns ImageryLayer
   */
  async addRasterLayer(
    imageLayer: Layer.LayerItem,
    options: {
      index?: number;
      zoom?: boolean;
    } = {},
  ) {
    try {
      if (!imageLayer.url) return null;
      const { viewPort, renderOptions = {} } = imageLayer;
      const annoIndex = this.annotationMapObj ? this.viewer.imageryLayers.indexOf(this.annotationMapObj) : -1
      const { index = annoIndex > 0 ? annoIndex : undefined, zoom } = options;
      const imageryProvider = await this.generateImageProvider(imageLayer);
      if (!imageryProvider) return null;
      const layer = this.viewer.imageryLayers.addImageryProvider(imageryProvider, index);
      if (renderOptions) {
        const { alpha, brightness, hue, saturation, gamma, contrast } =
          renderOptions as Layer.RasterOptions;
        this.updateImageLayer(layer, { alpha, brightness, hue, saturation, gamma, contrast });
      }

      if (zoom) {
        if (['cog', 'pic'].includes(imageLayer.method)) {
          this.zoomToViewPort(undefined, layer)
        } else {
          this.zoomToViewPort(viewPort);
        }
      }
      this.viewer.scene.requestRender();
      return layer;
    } catch (e) {
      throw(e)
    }
  }

  /**
   * 添加图层
   * @param layer 图层
   * @param zoom 是否缩放, 默认不缩放
   * @returns Cesium对象
   */
  addLayerByMethod = async (layer: Layer.LayerItem, zoom: boolean = false) => {
    const { method } = layer;
    if (!method) return null;
    try {
      return this.addRasterLayer(layer, { zoom });
    } catch (e) {
      console.error(e);
      throw(e)
    }
  };

  /**
   * 切换图层显隐
   * @param layerObj 图层对象
   * @param show 是否显示
   */
  switchLayerShow = (layerObj: ImageryLayer, show: boolean) => {
    try {
      layerObj.show = show;
      this.viewer.scene.requestRender();
      return true;
    } catch (e) {
      console.error(e);
      throw(e)
    }
  };

  removeLayerByMethod(layerObj: ImageryLayer) {
    let bool = false;
    this.viewer.imageryLayers.remove(layerObj as ImageryLayer, true);
    bool = (layerObj as ImageryLayer)?.isDestroyed();

    this.viewer.scene.requestRender();
    return bool;
  }

  /**
   * 更新栅格图层
   * @param layer 栅格图层对象
   * @param options 渲染参数
   */
  updateImageLayer(layer: ImageryLayer, options: Layer.RasterOptions) {
    const temp = layer;
    if (options.alpha !== undefined) {
      temp.alpha = options.alpha;
    }
    if (options.brightness !== undefined) {
      temp.brightness = options.brightness;
    }
    if (options.hue !== undefined) {
      temp.hue = options.hue;
    }
    if (options.saturation !== undefined) {
      temp.saturation = options.saturation;
    }
    if (options.gamma !== undefined) {
      temp.gamma = options.gamma;
    }
    if (options.contrast !== undefined) {
      temp.contrast = options.contrast;
    }
    this.viewer.scene.requestRender();
  }

  /**
   * 重载栅格图层
   * @param layerObj 栅格图层对象
   * @param layer 新的栅格图层元数据
   */
  reLoadImageLayer = async (
    layerObj: ImageryLayer,
    layer: Layer.LayerItem,
    index: number | undefined = undefined,
  ) => {
    if (layerObj && !layerObj.isDestroyed()) {
      const objIndex = this.viewer.imageryLayers.indexOf(layerObj);
      (layerObj.imageryProvider as any)?.destroy();
      const bool = this.viewer.imageryLayers.remove(layerObj, true);
      if (bool) {
        const newImageryLayer = await this.addRasterLayer(layer, {
          index: objIndex < 0 ? index : objIndex,
        });
        if (newImageryLayer) return newImageryLayer;
      } else {
        const newImageryLayer = await this.addRasterLayer(layer, { index });
        if (newImageryLayer) return newImageryLayer;
      }
    }
    return layerObj;
  };

  // 加载地形数据
  addTerrain(layer: Layer.TerrainLayer) {
    const { type, headers, queryParameters, options } = layer;
    let terrainLayer:
      | Cesium.CesiumTerrainProvider
      | Cesium.EllipsoidTerrainProvider
      = new Cesium.EllipsoidTerrainProvider({});
    const newUrl = this.getResource({
      url: (layer as any)?.url,
      headers,
      queryParameters,
    });
    switch (type) {
      case 'cesium':
        terrainLayer = Cesium.createWorldTerrain({
          requestVertexNormals: true,
          ...options,
        });
        break;
      case 'custom':
        if (!newUrl) break;
        terrainLayer = new Cesium.CesiumTerrainProvider({
          url: newUrl,
          requestVertexNormals: true,
        });
        break;
      default:
        break;
    }

    this.viewer.scene.terrainProvider = terrainLayer;
    this.viewer.scene.requestRender();
  }
}

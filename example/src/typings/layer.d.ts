import type { TIFFImageryProviderRenderOptions } from 'tiff-imagery-provider';

declare namespace Layer {
  /**
   * 图层元数据
   */
  export type BasicLayer = {
    layerName: string;
    id: string;
    /** 图层url, geojson加载方式传入geojson */
    url: string;
    /** 请求头 */
    headers?: Record<string, any>;
    /** 可以传自定义url参数，如token等 */
    queryParameters?: Record<string, any>;
    originId?: string;
    /** 地图边界，例：
     * POLYGON((-167.1072 32.0969,-167.1072 69.834,-104.1519 69.834,-104.1519 32.0969,-167.1072 32.0969))
     */
    boundary?: string | null;
    datasetId?: string;
    /** 地图缩放的范围，如果没有viewPort，从boundary中计算
     * 默认为[110.60396458865515, 34.54408834959379, 15000000]
     */
    viewPort?: number[];
    /** 真实图层名，wms、wmts、cog、pbf等加载方式需要此字段，不填则取layerName，两者可能不一致 */
    sourceLayer?: string;
    /** 缩略图 */
    imageURL?: string;
  };

  export type LoaderInfo = {
    /** 'EPSG:4326' | 'EPSG:3857'，默认为3857 */
    srs?: string;
    minimumLevel?: number;
    maximumLevel?: number;
    /** wmts 服务所需字段 */
    style?: string;
    tileMatrixSetID?: string;
    tileMatrixLabels?: string[];
    format?: string;
  };

  /**
   * 栅格图层元数据格式
   */
  export type RasterLayerItem = {
    method: 'wms' | 'wmts' | 'tms' | 'amap' | 'arcgis' | 'pic';
    layerType?: 'raster' | 'ogc';
    /** 是否添加鉴权 */
    addTgt?: boolean;
    loaderinfo?: LoaderInfo;
    renderOptions?: RasterOptions;
  } & BasicLayer;

  /**
   * 栅格图层元数据格式
   */
  export type COGLayerItem = {
    method: 'cog';
    loaderinfo?: LoaderInfo;
    renderOptions?: TIFFImageryProviderRenderOptions & RasterOptions;
  } & BasicLayer;

  export type LayerItem =
    | COGLayerItem
    | RasterLayerItem

  export type LayerMethod = LayerItem['method'];

  export type LayerType = LayerItem['layerType'];

  export type RenderOptions = LayerItem['renderOptions'];

  // 几类图层的渲染配置
  export type RasterOptions = {
    alpha?: number;
    brightness?: number;
    hue?: number;
    saturation?: number;
    gamma?: number;
    contrast?: number;
  };

  /**
   * 图层管理的数据类型
   */
  export type layerManageItem = {
    layerName: string;
    id: string;
    layer: LayerItem;
    layerObj: layerObjType;
    show?: boolean;
    /** 是否开启点击查询，默认为否 */
    enableQuery?: boolean;
    split?: boolean;
  };

  export type TerrainLayer = {
    layerName: string;
    id: string;
    /** 请求头 */
    headers?: Record<string, any>;
    /** 可以传自定义url参数，如token等 */
    queryParameters?: Record<string, any>;
    imageURL?: string;
    options?: {
      /** 水面效果 */
      requestWaterMask?: boolean;
      /** Needed to visualize slope */
      requestVertexNormals?: boolean;
    };
  } & (
    | {
        type?: 'cesium';
      }
    | {
        type: 'custom' | 'martini';
        url: string;
      }
  );
}

import { Event, GeographicTilingScheme, Credit, Rectangle, ImageryLayerFeatureInfo } from "cesium";
import GeoTIFF, { GeoTIFFImage } from 'geotiff';
export interface TIFFImageryProviderRenderOptions {
    /** nodata value, default read from tiff meta */
    nodata?: number;
    /** Band value starts from 1 */
    r?: {
        band?: number;
        min?: number;
        max?: number;
    };
    g?: {
        band?: number;
        min?: number;
        max?: number;
    };
    b?: {
        band?: number;
        min?: number;
        max?: number;
    };
    fill?: {
        /** interpolate colors, [stopValue, color] or [color], if the latter, means equal distribution */
        colors: [number, string][] | string[];
        /** defaults to continuous */
        type?: 'continuous' | 'discrete';
        /** interpolate mode, defaults to 'rgb'
         *
         *  refer to https://observablehq.com/@d3/working-with-color
         */
        mode?: 'hsl' | 'rgb' | 'hslLong' | 'lab';
    };
}
export interface TIFFImageryProviderOptions {
    url: string;
    credit?: string;
    tileSize?: number;
    maximumLevel?: number;
    minimumLevel?: number;
    enablePickFeatures?: boolean;
    hasAlphaChannel?: boolean;
    renderOptions?: TIFFImageryProviderRenderOptions;
    /** projection function, convert [lon, lat] position to EPSG:4326 */
    projFunc?: (code: number) => (((pos: number[]) => number[]) | void);
}
export declare class TIFFImageryProvider {
    private readonly options;
    ready: boolean;
    tilingScheme: GeographicTilingScheme;
    rectangle: Rectangle;
    tileSize: number;
    tileWidth: number;
    tileHeight: number;
    maximumLevel: number;
    minimumLevel: number;
    credit: Credit;
    private _error;
    readyPromise: Promise<void>;
    private _destroyed;
    _source: GeoTIFF;
    private _imageCount;
    _images: (GeoTIFFImage | null)[];
    _imagesCache: {};
    bands: {
        min: number;
        max: number;
    }[];
    noData: number;
    hasAlphaChannel: boolean;
    private _pool;
    private _workerFarm;
    constructor(options: TIFFImageryProviderOptions);
    /**
     * Gets an event that will be raised if an error is encountered during processing.
     * @memberof GeoJsonDataSource.prototype
     * @type {Event}
     */
    get errorEvent(): Event<(...args: any[]) => void>;
    get isDestroyed(): boolean;
    private _getIndex;
    /**
     * 获取瓦片数据
     * @param x
     * @param y
     * @param z
     */
    private _loadTile;
    requestImage(x: number, y: number, z: number): Promise<any>;
    pickFeatures(x: number, y: number, zoom: number, longitude: number, latitude: number): Promise<ImageryLayerFeatureInfo[]>;
    destroy(): void;
}
export default TIFFImageryProvider;

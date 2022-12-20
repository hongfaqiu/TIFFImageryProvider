import { Event, WebMercatorTilingScheme, GeographicTilingScheme, Credit } from "cesium";
import GeoTIFF, { GeoTIFFImage } from 'geotiff';
export interface TIFFImageryProviderOptions {
    url: string;
    credit?: string;
    tileSize?: number;
    maximumLevel?: number;
    minimumLevel?: number;
    enablePickFeatures?: boolean;
    hasAlphaChannel?: boolean;
    /** nodata value, default read from tiff meta */
    nodata?: number;
    renderOptions?: {
        /** Band value starts from 1 */
        r?: {
            band: number;
            min?: number;
            max?: number;
        };
        g?: {
            band: number;
            min?: number;
            max?: number;
        };
        b?: {
            band: number;
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
    };
}
export declare class TIFFImageryProvider {
    private readonly options;
    ready: boolean;
    tilingScheme: WebMercatorTilingScheme | GeographicTilingScheme;
    rectangle: any;
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
        STATISTICS_MINIMUM: string;
        STATISTICS_MAXIMUM: string;
        STATISTICS_MEAN: string;
        STATISTICS_STDDEV: string;
    }[];
    noData: number;
    hasAlphaChannel: boolean;
    constructor(options: TIFFImageryProviderOptions);
    /**
     * Gets an event that will be raised if an error is encountered during processing.
     * @memberof GeoJsonDataSource.prototype
     * @type {Event}
     */
    get errorEvent(): Event<(...args: any[]) => void>;
    get isDestroyed(): boolean;
    private getTiffSource;
    /**
     * 获取瓦片数据
     * @param x
     * @param y
     * @param z
     * @returns 已根据最大最小值进行归一化(0-255)的数组
     */
    loadTile(x: number, y: number, z: number): Promise<number[][]>;
    requestImage(x: number, y: number, z: number): Promise<any>;
    destroy(): void;
}
export default TIFFImageryProvider;

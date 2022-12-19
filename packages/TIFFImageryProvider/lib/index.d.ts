import { Event, WebMercatorTilingScheme, GeographicTilingScheme, Credit } from "cesium";
import GeoTIFF, { GeoTIFFImage } from 'geotiff';
interface TIFFImageryProviderOptions {
    url: string;
    credit?: string;
    tileSize?: number;
    maximumLevel?: number;
    minimumLevel?: number;
    enablePickFeatures?: boolean;
    hasAlphaChannel?: boolean;
    nodata?: number;
    renderOptions?: {
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
            colors: [number, string][];
            type: 'discrete' | 'continuous';
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
    loadTile(x: number, y: number, z: number): Promise<number[][]>;
    requestImage(x: number, y: number, z: number): Promise<ImageData>;
    destroy(): void;
}
export default TIFFImageryProvider;

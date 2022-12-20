import { Event, GeographicTilingScheme, Credit, Rectangle, Cartesian3, Color } from "cesium";
import { Pool, fromUrl as tiffFromUrl } from 'geotiff';
import { interpolateHsl, interpolateHslLong, interpolateLab, interpolateRgb } from "d3-interpolate";
import { scaleLinear } from "d3-scale";
let workerPool;
function getWorkerPool() {
    if (!workerPool) {
        workerPool = new Pool();
    }
    return workerPool;
}
function decimal2rgb(number) {
    return Math.round(number * 255);
}
const interpolateFactorys = {
    'rgb': interpolateRgb,
    'hsl': interpolateHsl,
    'hslLong': interpolateHslLong,
    'lab': interpolateLab
};
export class TIFFImageryProvider {
    options;
    ready;
    tilingScheme;
    rectangle;
    tileSize;
    tileWidth;
    tileHeight;
    maximumLevel;
    minimumLevel;
    credit;
    _error;
    readyPromise;
    _destroyed = false;
    _source;
    _imageCount;
    _images = [];
    _imagesCache = {};
    bands;
    noData;
    hasAlphaChannel;
    constructor(options) {
        this.options = options;
        this.ready = false;
        this.tileSize = this.tileWidth = this.tileHeight = options.tileSize || 512;
        this.hasAlphaChannel = options.hasAlphaChannel ?? true;
        this.maximumLevel = options.maximumLevel ?? 18;
        this.minimumLevel = options.minimumLevel ?? 0;
        this.credit = new Credit(options.credit || "", false);
        this._error = new Event();
        this.readyPromise = this.getTiffSource(options.url).then(async (res) => {
            this._source = res;
            const image = await res.getImage();
            const bands = [];
            // 获取波段数
            const samples = image.getSamplesPerPixel();
            for (let i = 0; i < samples; i++) {
                // 获取该波段信息
                const element = image.getGDALMetadata(i);
                bands.push(element);
            }
            // 获取nodata值
            const noData = image.getGDALNoData();
            this.bands = bands;
            this.noData = options.nodata ?? noData;
            const bbox = image.getBoundingBox();
            const prj = +image.geoKeys.GeographicTypeGeoKey;
            if (prj === 4326) {
                this.rectangle = Rectangle.fromDegrees(...bbox);
            }
            else if (prj === 3857 || prj === 900913) {
                const [west, south, east, north] = bbox;
                this.rectangle = Rectangle.fromCartesianArray([new Cartesian3(west, south), new Cartesian3(east, north)]);
            }
            else {
                const error = new Error('Unspported projection type');
                throw error;
            }
            this.tilingScheme = new GeographicTilingScheme({
                rectangle: this.rectangle,
                numberOfLevelZeroTilesX: 1,
                numberOfLevelZeroTilesY: 1
            });
            this._imageCount = await res.getImageCount();
            this.maximumLevel = this.maximumLevel >= this._imageCount ? this._imageCount - 1 : this.maximumLevel;
            this._images = new Array(this._imageCount).fill(null);
            this.ready = true;
        });
    }
    /**
     * Gets an event that will be raised if an error is encountered during processing.
     * @memberof GeoJsonDataSource.prototype
     * @type {Event}
     */
    get errorEvent() {
        return this._error;
    }
    get isDestroyed() {
        return this._destroyed;
    }
    getTiffSource(url, options) {
        return tiffFromUrl(url, options);
    }
    /**
     * 获取瓦片数据
     * @param x
     * @param y
     * @param z
     * @returns 已根据最大最小值进行归一化(0-255)的数组
     */
    async loadTile(x, y, z) {
        const { tileSize } = this;
        const index = this._imageCount - z - 1;
        let image = this._images[index];
        if (!image) {
            image = this._images[index] = await this._source.getImage(index);
        }
        const pool = getWorkerPool();
        const width = image.getWidth();
        const height = image.getHeight();
        const tileXNum = this.tilingScheme.getNumberOfXTilesAtLevel(z);
        const tileYNum = this.tilingScheme.getNumberOfYTilesAtLevel(z);
        const tilePixel = {
            xWidth: width / tileXNum,
            yWidth: height / tileYNum
        };
        const pixelBounds = [
            Math.round(x * tilePixel.xWidth),
            Math.round(y * tilePixel.yWidth),
            Math.round((x + 1) * tilePixel.xWidth),
            Math.round((y + 1) * tilePixel.yWidth),
        ];
        const promise = image.readRasters({
            window: pixelBounds,
            width: tileSize,
            height: tileSize,
            fillValue: this.noData,
            pool: pool,
        });
        return promise
            .then((res) => {
            const data = res;
            return data.map((band, index) => {
                let min, max;
                ['r', 'g', 'b'].forEach(k => {
                    const bandOpt = this.options.renderOptions?.[k];
                    min = bandOpt?.min ?? +this.bands[index].STATISTICS_MINIMUM;
                    max = bandOpt?.max ?? +this.bands[index].STATISTICS_MAXIMUM;
                });
                const bias = 255 / (+max - +min);
                return band.map(item => (item === this.noData || item < min || item > max) ? 0 : (item - min) * bias);
            });
        })
            .catch((error) => {
            this._error.raiseEvent(error);
            throw error;
        });
    }
    async requestImage(x, y, z) {
        if (z < this.minimumLevel || z > this.maximumLevel || z > this._imageCount)
            return undefined;
        if (this._imagesCache[`${x}_${y}_${z}`])
            return this._imagesCache[`${x}_${y}_${z}`];
        const width = this.tileSize;
        const height = this.tileSize;
        const { renderOptions } = this.options;
        const { r, g, b, fill } = renderOptions ?? {};
        try {
            const data = await this.loadTile(x, y, z);
            const redData = data[(r?.band ?? 1) - 1];
            const greenData = data[(g?.band ?? 1) - 1];
            const blueData = data[(b?.band ?? 1) - 1];
            const imageData = new Uint8ClampedArray(width * height * 4);
            if (fill) {
                const min = r?.min ?? +this.bands[(r?.band ?? 1) - 1].STATISTICS_MINIMUM;
                const max = r?.max ?? +this.bands[(r?.band ?? 1) - 1].STATISTICS_MAXIMUM;
                const { type = 'continuous', colors, mode = 'rgb' } = fill;
                let stops;
                if (typeof colors[0] === 'string') {
                    const step = 255 / colors.length;
                    stops = colors.map((color, index) => {
                        return [index === (colors.length - 1) ? 255 : index * step, color];
                    });
                }
                else {
                    stops = colors.sort((a, b) => a[0] - b[0]).map(item => [(item[0] - min) / max * 255, item[1]]);
                }
                for (let i = 0; i < data[0].length; i += 1) {
                    const val = redData[i];
                    let color = 'black';
                    if (val !== 0) {
                        for (let j = 0; j < stops.length - 1; j += 1) {
                            if (val >= stops[j][0] && val <= stops[j + 1][0]) {
                                if (type === 'continuous') {
                                    color = scaleLinear()
                                        .domain(stops.map(item => item[0]))
                                        .range(stops.map(item => item[1]))
                                        .interpolate(interpolateFactorys[mode])(val);
                                }
                                else {
                                    color = stops[j][1];
                                }
                                break;
                            }
                        }
                    }
                    const { red, green, blue, alpha } = Color.fromCssColorString(color);
                    imageData[i * 4] = decimal2rgb(red);
                    imageData[i * 4 + 1] = decimal2rgb(green);
                    imageData[i * 4 + 2] = decimal2rgb(blue);
                    imageData[i * 4 + 3] = val === 0 ? 0 : decimal2rgb(alpha);
                }
            }
            else {
                for (let i = 0; i < data[0].length; i++) {
                    const red = redData[i];
                    const green = greenData[i];
                    const blue = blueData[i];
                    imageData[i * 4] = red;
                    imageData[i * 4 + 1] = green;
                    imageData[i * 4 + 2] = blue;
                    imageData[i * 4 + 3] = (red === 0 && red === green && green === blue) ? 0 : 255;
                }
            }
            const result = new ImageData(imageData, width, height);
            this._imagesCache[`${x}_${y}_${z}`] = result;
            return result;
        }
        catch (e) {
            this._error.raiseEvent(e);
            throw e;
        }
    }
    destroy() {
        this._images = undefined;
        this._imagesCache = undefined;
        this._destroyed = true;
    }
}
export default TIFFImageryProvider;
//# sourceMappingURL=index.js.map
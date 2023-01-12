import { Event, GeographicTilingScheme, Credit, Rectangle, Cartesian3, Color, ImageryLayerFeatureInfo, Math as CMath, DeveloperError } from "cesium";
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
function getMinMax(data, nodata) {
    let min, max;
    for (let j = 0; j < data.length; j += 1) {
        const val = data[j];
        if (val === nodata)
            continue;
        if (min === undefined && max === undefined) {
            min = max = val;
            continue;
        }
        if (val < min) {
            min = val;
        }
        else if (val > max) {
            max = val;
        }
    }
    return {
        min, max
    };
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
        this.hasAlphaChannel = options.hasAlphaChannel ?? true;
        this.maximumLevel = options.maximumLevel ?? 18;
        this.minimumLevel = options.minimumLevel ?? 0;
        this.credit = new Credit(options.credit || "", false);
        this._error = new Event();
        this.readyPromise = tiffFromUrl(options.url, {
            allowFullFile: true
        }).then(async (res) => {
            this._source = res;
            const image = await res.getImage();
            this._imageCount = await res.getImageCount();
            this.tileSize = this.tileWidth = this.tileHeight = options.tileSize || image.getTileWidth() || 512;
            // 获取nodata值
            const noData = image.getGDALNoData();
            this.noData = options.renderOptions.nodata ?? noData;
            const bands = [];
            // 获取波段数
            const samples = image.getSamplesPerPixel();
            for (let i = 0; i < samples; i++) {
                // 获取该波段最大最小值信息
                const element = image.getGDALMetadata(i);
                if (element?.STATISTICS_MINIMUM && element?.STATISTICS_MAXIMUM) {
                    bands.push({
                        min: element.STATISTICS_MINIMUM,
                        max: element.STATISTICS_MAXIMUM,
                    });
                }
                else {
                    const pool = getWorkerPool();
                    const previewImage = await res.getImage();
                    const data = (await previewImage.readRasters({
                        samples: [i],
                        pool
                    }))[0].filter((item) => !isNaN(item));
                    bands.push(getMinMax(data, noData));
                }
            }
            this.bands = bands;
            // 获取空间范围
            const bbox = image.getBoundingBox();
            const [west, south, east, north] = bbox;
            const prjCode = +(image.geoKeys.ProjectedCSTypeGeoKey ?? image.geoKeys.GeographicTypeGeoKey);
            const { projFunc } = options;
            const proj = projFunc?.(prjCode);
            if (typeof proj === 'function') {
                const leftBottom = proj([west, south]);
                const rightTop = proj([east, north]);
                this.rectangle = Rectangle.fromDegrees(leftBottom[0], leftBottom[1], rightTop[0], rightTop[1]);
            }
            else if (prjCode === 4326) {
                this.rectangle = Rectangle.fromDegrees(...bbox);
            }
            else if (prjCode === 3857 || prjCode === 900913) {
                this.rectangle = Rectangle.fromCartesianArray([new Cartesian3(west, south), new Cartesian3(east, north)]);
            }
            else {
                const error = new Error(`Unspported projection type: EPSG:${prjCode}, please add projFunc parameter to handle projection`);
                throw error;
            }
            // 处理跨180度经线的情况
            // https://github.com/CesiumGS/cesium/blob/da00d26473f663db180cacd8e662ca4309e09560/packages/engine/Source/Core/TileAvailability.js#L195
            if (this.rectangle.east < this.rectangle.west) {
                this.rectangle.east += CMath.TWO_PI;
            }
            this.tilingScheme = new GeographicTilingScheme({
                rectangle: this.rectangle,
                numberOfLevelZeroTilesX: 1,
                numberOfLevelZeroTilesY: 1
            });
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
    _getIndex(level) {
        const z = level > this._imageCount ? this._imageCount : level;
        const index = this._imageCount - z - 1;
        return index;
    }
    /**
     * 获取瓦片数据
     * @param x
     * @param y
     * @param z
     */
    async _loadTile(x, y, z) {
        const { tileSize } = this;
        const index = this._getIndex(z);
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
            return res;
        })
            .catch((error) => {
            this._error.raiseEvent(error);
            throw error;
        });
    }
    _ifNoData(...vals) {
        return vals.every(val => isNaN(val) || val === this.noData);
    }
    _getRange(opts) {
        const min = opts?.min ?? +this.bands[(opts?.band ?? 1) - 1].min;
        const max = opts?.max ?? +this.bands[(opts?.band ?? 1) - 1].max;
        const range = max - min;
        return { min, max, range };
    }
    async requestImage(x, y, z) {
        if (!this.ready) {
            throw new DeveloperError("requestImage must not be called before the imagery provider is ready.");
        }
        if (z < this.minimumLevel || z > this.maximumLevel || z > this._imageCount)
            return undefined;
        if (this._imagesCache[`${x}_${y}_${z}`])
            return this._imagesCache[`${x}_${y}_${z}`];
        const width = this.tileSize;
        const height = this.tileSize;
        const { renderOptions } = this.options;
        const { r, g, b, fill } = renderOptions ?? {};
        try {
            const data = await this._loadTile(x, y, z);
            const redData = data[(r?.band ?? 1) - 1];
            const greenData = data[(g?.band ?? 1) - 1];
            const blueData = data[(b?.band ?? 1) - 1];
            const ranges = [r, g, b].map(item => this._getRange(item));
            const imageData = new Uint8ClampedArray(width * height * 4);
            if (fill) {
                const { min, max, range } = ranges[0];
                const { type = 'continuous', colors, mode = 'rgb' } = fill;
                let stops;
                if (typeof colors[0] === 'string') {
                    const step = range / colors.length;
                    stops = colors.map((color, index) => {
                        return [min + index * step, color];
                    });
                }
                else {
                    stops = colors.sort((a, b) => a[0] - b[0]);
                    if (stops[0][0] > min) {
                        stops[0][0] = min;
                    }
                    if (stops[stops.length - 1][0] < max) {
                        stops[stops.length] = [max, stops[stops.length - 1][1]];
                    }
                }
                for (let i = 0; i < data[0].length; i += 1) {
                    const val = redData[i];
                    let color = 'black';
                    const ifNoData = this._ifNoData(val);
                    if (!ifNoData) {
                        for (let j = 0; j < stops.length; j += 1) {
                            if ((val >= stops[j][0] && (!stops[j + 1] || (val < stops[j + 1][0])))) {
                                if (type === 'continuous') {
                                    color = scaleLinear()
                                        .domain(stops.map(item => (item[0] - min) / range))
                                        .range(stops.map(item => item[1]))
                                        .interpolate(interpolateFactorys[mode])((val - min) / range);
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
                    imageData[i * 4 + 3] = ifNoData ? 0 : decimal2rgb(alpha);
                }
            }
            else {
                for (let i = 0; i < data[0].length; i++) {
                    const red = redData[i];
                    const green = greenData[i];
                    const blue = blueData[i];
                    imageData[i * 4] = decimal2rgb((red - ranges[0].min) / ranges[0].range);
                    imageData[i * 4 + 1] = decimal2rgb((green - ranges[1].min) / ranges[1].range);
                    imageData[i * 4 + 2] = decimal2rgb((blue - ranges[2].min) / ranges[2].range);
                    imageData[i * 4 + 3] = this._ifNoData(red, green, blue) ? 0 : 255;
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
    async pickFeatures(x, y, zoom, longitude, latitude) {
        if (!this.options.enablePickFeatures)
            return undefined;
        const z = zoom > this._imageCount ? this._imageCount : zoom;
        const index = this._getIndex(z);
        let image = this._images[index];
        if (!image) {
            image = this._images[index] = await this._source.getImage(index);
        }
        const { west, south, north, width: lonWidth } = this.rectangle;
        const width = image.getWidth();
        const height = image.getHeight();
        let lonGap = longitude - west;
        // 处理跨180°经线的情况
        if (longitude < west) {
            lonGap += CMath.TWO_PI;
        }
        const posX = ~~(Math.abs(lonGap / lonWidth) * width);
        const posY = ~~(Math.abs((north - latitude) / (north - south)) * height);
        const pool = getWorkerPool();
        const res = await image.readRasters({
            window: [posX, posY, posX + 1, posY + 1],
            height: 1,
            width: 1,
            pool: pool,
        });
        const featureInfo = new ImageryLayerFeatureInfo();
        featureInfo.name = `lon:${(longitude / Math.PI * 180).toFixed(6)}, lat:${(latitude / Math.PI * 180).toFixed(6)}`;
        featureInfo.data = res[0];
        if (res) {
            featureInfo.configureDescriptionFromProperties(res[0]);
        }
        return [featureInfo];
    }
    destroy() {
        this._images = undefined;
        this._imagesCache = undefined;
        this._destroyed = true;
    }
}
export default TIFFImageryProvider;
//# sourceMappingURL=index.js.map
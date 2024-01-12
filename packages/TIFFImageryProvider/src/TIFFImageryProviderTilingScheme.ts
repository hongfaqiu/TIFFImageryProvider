import {
  Cartesian2,
  Cartographic,
  Math as CesiumMath,
  Rectangle,
  WebMercatorTilingScheme,
  Cartesian3,
  Ellipsoid,
} from 'cesium';

class TIFFImageryProviderTilingScheme extends WebMercatorTilingScheme {
  readonly nativeRectangle: Rectangle;

  constructor(options?: {
    ellipsoid?: Ellipsoid;
    numberOfLevelZeroTilesX?: number;
    numberOfLevelZeroTilesY?: number;
    rectangleSouthwestInMeters?: Cartesian2;
    rectangleNortheastInMeters?: Cartesian2;
    /** projection function, convert [lon, lat] position to [x, y] */
    project: (pos: number[]) => number[];
    /** unprojection function, convert [x, y] position to [lon, lat] */
    unproject: (pos: number[]) => number[];
  }) {
    super(options);
    
    const { project, unproject } = options;

    this.nativeRectangle = new Rectangle(options.rectangleSouthwestInMeters.x, options.rectangleSouthwestInMeters.y, options.rectangleNortheastInMeters.x, options.rectangleNortheastInMeters.y)

    // @ts-ignore
    this._projection = {
      ellipsoid: this.ellipsoid,
      project(cartographic: Cartographic, result?: Cartesian3): Cartesian3 {
        const [x, y] = project([cartographic.longitude, cartographic.latitude].map(CesiumMath.toDegrees));
        const z = cartographic.height;
        return Cartesian3.fromElements(x, y, z, result);
      },
      unproject(cartesian: Cartesian3, result?: Cartographic): Cartographic {
        const [longitude, latitude] = unproject([cartesian.x, cartesian.y]);
        const height = cartesian.z;
        return Cartographic.fromDegrees(longitude, latitude, height, result);
      },
    };
    
    const swMeters = new Cartesian3();
    options.rectangleSouthwestInMeters.clone(swMeters);
    const neMeters = new Cartesian3();
    options.rectangleNortheastInMeters.clone(neMeters);
    const seMeters = new Cartesian3(neMeters.x, swMeters.y);
    const nwMeters = new Cartesian3(swMeters.x, neMeters.y);

    const southwest = this.projection.unproject(swMeters);
    const southeast = this.projection.unproject(seMeters);
    const northwest = this.projection.unproject(nwMeters);
    const northeast = this.projection.unproject(neMeters);

    // @ts-ignore
    this._rectangle = Rectangle.fromCartographicArray([southwest, southeast, northwest, northeast])
  }

  tileXYToNativeRectangle2(
    x: number,
    y: number,
    level: number,
  ) {
    const rect = this.tileXYToRectangle(x, y, level);

    const projection = this.projection;
    const ws = projection.project(new Cartographic(rect.west, rect.south));
    const wn = projection.project(new Cartographic(rect.west, rect.north));
    const en = projection.project(new Cartographic(rect.east, rect.north));
    const es = projection.project(new Cartographic(rect.east, rect.south));
    const positions = [ws, wn, en, es];

    const xx = positions.map(pos => pos.x);
    const yy = positions.map(pos => pos.y);
    return new Rectangle(
      Math.min(...xx),
      Math.min(...yy),
      Math.max(...xx),
      Math.max(...yy)
    );
  };

  tileXYToRectangle(
    x: number,
    y: number,
    level: number,
  ) {
    const rect = this.tileXYToNativeRectangle(x, y, level);

    const projection = this.projection;
    const ws = projection.unproject(new Cartesian3(rect.west, rect.south));
    const wn = projection.unproject(new Cartesian3(rect.west, rect.north));
    const en = projection.unproject(new Cartesian3(rect.east, rect.north));
    const es = projection.unproject(new Cartesian3(rect.east, rect.south));
    const newRect = Rectangle.fromCartographicArray([ws, wn, en, es]);
    if (newRect.east < newRect.west) {
      newRect.east += CesiumMath.TWO_PI;
    }
    return newRect;
  };
}

export default TIFFImageryProviderTilingScheme;

import {
  Cartesian2,
  Cartographic,
  Math as CMath,
  Rectangle,
  WebMercatorTilingScheme,
} from 'cesium';

import {
  Cartesian3,
  Ellipsoid,
} from 'cesium';

class TIFFImageryProviderTilingScheme extends WebMercatorTilingScheme {
  constructor(options?: {
    ellipsoid?: Ellipsoid;
    numberOfLevelZeroTilesX?: number;
    numberOfLevelZeroTilesY?: number;
    rectangleSouthwestInMeters?: Cartesian2;
    rectangleNortheastInMeters?: Cartesian2;
    project?: (pos: number[]) => number[];
    unproject?: (pos: number[]) => number[];
  }) {
    super(options);
    
    const { project, unproject } = options;
    if (project) {
      // @ts-ignore
      this._projection.project = function (cartographic: Cartographic) {
        const [x, y] = unproject([cartographic.longitude, cartographic.latitude].map(CMath.toDegrees))
        const z = cartographic.height;
        return new Cartesian3(x, y, z);
      };
    }
    if (unproject) {
      // @ts-ignore
      this._projection.unproject = function (cartesian: Cartesian3) {
        const [longitude, latitude] = project([cartesian.x, cartesian.y]).map(CMath.toRadians)
        const height = cartesian.z;
        return new Cartographic(longitude, latitude, height);
      };
    }
    
    const southwest = this.projection.unproject(
      options.rectangleSouthwestInMeters as any
    );
    const northeast = this.projection.unproject(
      options.rectangleNortheastInMeters as any
    );
    // @ts-ignore
    this._rectangle = new Rectangle(
      southwest.longitude,
      southwest.latitude,
      northeast.longitude,
      northeast.latitude
    );
  }
}

export default TIFFImageryProviderTilingScheme;

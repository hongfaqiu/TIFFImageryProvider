import { ArcGisMapServerImageryProvider, ImageryLayer, Viewer } from 'cesium';
import './index.css';
import TIFFImageryProvider from 'tiff-imagery-provider';
import proj4 from 'proj4-fully-loaded';

const viewer = new Viewer('cesiumContainer', {
  baseLayer: ImageryLayer.fromProviderAsync(ArcGisMapServerImageryProvider.fromUrl('https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer', {
    enablePickFeatures: false
  }), {}),
  baseLayerPicker: false,
  animation: false,
  fullscreenButton: false,
  geocoder: false,
  homeButton: false,
  selectionIndicator: true,
  timeline: false,
  navigationHelpButton: false,
  shouldAnimate: true,
  useBrowserRecommendedResolution: false,
  orderIndependentTranslucency: false,
});

TIFFImageryProvider.fromUrl('/zeta.tif', {
  enablePickFeatures: true,
  projFunc: (code) => {
    if (![4326, 3857, 900913].includes(code)) {
      {
        try {
          let prj = proj4("EPSG:4326", `EPSG:${code}`,)
          if (prj) return {
            project: prj.forward,
            unproject: prj.inverse
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
    return undefined
  },
  renderOptions: {
    single: {
      band: 1,
      colorScale: 'rainbow'
    },
    resampleMethod: 'bilinear'
  },
}).then((provider) => {
  console.log(provider);
  const imageryLayer = viewer.imageryLayers.addImageryProvider(provider as any);
  const legend = document.getElementById("legend") as HTMLImageElement;
  const img = provider.plot?.colorScaleCanvas.toDataURL();
  legend.src = img;

  viewer.flyTo(imageryLayer, {
    duration: 1,
  });
})
import { ArcGisMapServerImageryProvider, Viewer } from 'cesium';
import './index.css';
import TIFFImageryProvider from 'tiff-imagery-provider';
import proj4 from 'proj4-fully-loaded'; 

const viewer = new Viewer('cesiumContainer', {
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

ArcGisMapServerImageryProvider.fromUrl('https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer', {
  enablePickFeatures: false
}).then(async imageryProvider => {
  viewer.imageryLayers.remove(viewer.imageryLayers.get(0));
  viewer.imageryLayers.addImageryProvider(imageryProvider)
  const provider: any = await TIFFImageryProvider.fromUrl('https://sentinel-cogs.s3.us-west-2.amazonaws.com/sentinel-s2-l2a-cogs/56/J/NP/2023/4/S2A_56JNP_20230410_0_L2A/TCI.tif', {
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
  
  const imageryLayer = viewer.imageryLayers.addImageryProvider(provider);
  viewer.flyTo(imageryLayer, {
    duration: 1,
  });
})

/** 处理栅格图层 */
export async function handleRasterLayer(layer: Layer.RasterLayerItem) {

  return {
    renderOptions: {
      brightness: 1,
      alpha: 1,
      gamma: 1,
      saturation: 1,
      contrast: 1,
      hue: 0,
      ...layer.renderOptions
    },
    ...layer,
  };
}

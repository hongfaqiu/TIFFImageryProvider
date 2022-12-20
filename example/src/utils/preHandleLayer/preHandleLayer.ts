import { getViewPort } from './handle-utils';

import { boundary4326 } from '../usefulFunc';

/** 预处理所有图层 */
function handleAllLayer(layer: Layer.LayerItem): Layer.LayerItem {
  const boundary = boundary4326(layer?.boundary ?? '')
  const layerPro: Layer.LayerItem = {
    ...layer,
    boundary,
    viewPort: getViewPort(boundary ?? ''),
    originId: layer.id,
    method: layer.method?.toLowerCase() as any,
  };

  return layerPro
}

/**
 * 为不同类型的图层添加必要的属性
 * @param layer 图层元数据
 */
export default async function preHandleLayer(
  layer: Layer.LayerItem,
): Promise<Layer.LayerItem | null> {

  const layerPro = handleAllLayer(layer);

  return {
    ...layerPro,
    renderOptions: {
      brightness: 1,
      alpha: 1,
      gamma: 1,
      saturation: 1,
      contrast: 1,
      hue: 0,
      ...layerPro.renderOptions
    },
  };
}

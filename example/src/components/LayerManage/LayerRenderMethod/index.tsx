import { LayerHook } from '@/hooks/use-layer';
import { Spin, Toast } from '@douyinfe/semi-ui';
import { useState } from 'react';

import styles from '../index.module.scss';
import RasterRenderMethods from './RasterRenderMethods';

type RenderMethodProps = {
  layerItem: Layer.layerManageItem;
};

/**
 * 根据数据类型生成渲染方案
 * @param props
 */
const LayerRenderMethod = (props: RenderMethodProps) => {
  const { layerItem } = props;
  const { renderLayer } = LayerHook.useHook();
  const [rendering, setRendering] = useState(false);

  const { renderOptions } = layerItem.layer;

  const onValuesChange = (
    values: Layer.RenderOptions,
    forceMethod: Layer.LayerMethod | undefined = undefined,
  ) => {
    if (rendering) return;
    setRendering(true);
    renderLayer(layerItem.id, values, forceMethod)
      .then(() => {
        setRendering(false);
      })
      .catch((e) => {
        Toast.error(e.toString());
        setRendering(false);
      });
  };

  return (
    <Spin spinning={rendering}>
      <div className={styles.paramsSetting}>
        <RasterRenderMethods
          value={renderOptions as Layer.RasterOptions}
          onOptionsChange={(val) => onValuesChange(val)}
        />
      </div>
    </Spin>
  );
};

export default LayerRenderMethod;

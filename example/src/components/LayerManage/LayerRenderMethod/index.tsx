import { LayerHook } from '@/hooks/use-layer';
import { Spin, Toast } from '@douyinfe/semi-ui';
import { ImageryLayer } from 'cesium';
import TIFFImageryProvider from 'tiff-imagery-provider';
import { useEffect, useMemo, useState } from 'react';

import styles from '../index.module.scss';
import COGRenderMethods from './COGRenderMethods';
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

  const { renderOptions, method } = layerItem.layer;

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
        {
          method === 'cog' && 
          <COGRenderMethods
            value={renderOptions}
            onChange={(val) => onValuesChange(val)}
          />
        }

        <RasterRenderMethods
          value={renderOptions as Layer.RasterOptions}
          onOptionsChange={(val) => onValuesChange(val, 'wms')}
        />
      </div>
    </Spin>
  );
};

export default LayerRenderMethod;

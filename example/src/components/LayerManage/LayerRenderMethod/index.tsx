import { LayerHook } from '@/hooks/use-layer';
import { Form, Spin, Toast } from '@douyinfe/semi-ui';
import { useState } from 'react';
import { TIFFImageryProviderRenderOptions } from 'tiff-imagery-provider';

import styles from '../index.module.scss';
import { COGRenderFormItem } from './COGRenderMethods';
import { RasterRenderFormItem } from './RasterRenderMethods';

type RenderMethodProps = {
  layerItem: Layer.layerManageItem;
};

/**
 * 根据数据类型生成渲染方案
 * @param props
 */
const LayerRenderMethod = ({
  layerItem
}: RenderMethodProps) => {
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
        <Form<{
          cog?: TIFFImageryProviderRenderOptions,
          raster: Layer.RasterOptions
        }>
          onValueChange={(values, changedValue) => {
            onValuesChange({
              ...values.cog,
              ...values.raster
            }, Object.keys(changedValue)[0] as any)
          }}
        >
          {
            method === 'cog' && 
            <COGRenderFormItem
              initValue={renderOptions}
              field='cog'
              noLabel
            />
          }
          <RasterRenderFormItem
            initValue={renderOptions}
            field='raster'
            noLabel
          />
        </Form>
      </div>
    </Spin>
  );
};

export default LayerRenderMethod;

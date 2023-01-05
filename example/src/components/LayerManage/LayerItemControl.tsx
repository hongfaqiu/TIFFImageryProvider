import classNames from 'classnames';
import { useRef, useState } from 'react';
import { IconChevronDownStroked, IconCrossStroked, IconEyeClosedSolid, IconEyeOpened, IconSendStroked } from '@douyinfe/semi-icons';
import { Popover, Typography } from '@douyinfe/semi-ui';
import { Tooltip } from '@/components/tooltip';

import { MainMapObj } from '@/utils/map';
import styles from './index.module.scss';
import LayerRenderMethod from './LayerRenderMethod';
import { LayerHook } from '@/hooks/use-layer';

const { Text } = Typography;

const zoomToLayer = (layerItem: Layer.layerManageItem) => {
  if (layerItem.layer.method === 'cog') {
    MainMapObj?.zoomToViewPort(undefined, layerItem.layerObj);
  } else {
    MainMapObj?.zoomToViewPort(layerItem.layer.viewPort);
  }
};

export interface LayerItemTools {
  attributeTable?: boolean;
  spatialQuery?: boolean;
  detailMsg?: boolean;
  cogQuery?: boolean;
}
interface LayerItemControlProps {
  layerItem: Layer.layerManageItem;
  dragHandle?: React.ReactNode;
  moreTool?: LayerItemTools;
  hideTools?: {
    visible?: boolean;
    render?: boolean;
    zoom?: boolean;
    delete?: boolean;
  };
}

/**
 * 图层控制
 */
const LayerItemControl = (props: LayerItemControlProps) => {

  const { layerItem, dragHandle, hideTools } = props;
  const [showRender, setShowRender] = useState(false);

  const { removeLayer: deleteLayer, updateLayer } = LayerHook.useHook();
  const ref = useRef(null);

  const onChangeShow = (val: boolean) => {
    const newLayer = { ...layerItem, show: val };
    if (updateLayer) {
      updateLayer(newLayer);
    }
    MainMapObj?.switchLayerShow(layerItem.layerObj, val);
  };

  return (
    <div ref={ref} className={classNames(styles.layerItemControl)}>
      <div className={styles.header}>
        <div className={styles.dragHandle}>{dragHandle}</div>
        {!hideTools?.visible && (
          <Text
            style={!layerItem.show ? { color: '#222' } : undefined}
            className={styles.switchShow}
            title={
              layerItem.show
                ? '隐藏'
                : '显示'
            }
            icon={layerItem.show ? <IconEyeOpened /> : <IconEyeClosedSolid />}
            onClick={() => {
              onChangeShow(!layerItem.show)
            }}
          />
        )}
        <Text
          className={styles.layerName}
          title={layerItem.layerName}
          onClick={() => setShowRender((val) => !val)}
        >
          {layerItem.layerName}
        </Text>
        <span className={styles.icons}>
          {!hideTools?.render && (
            <Tooltip
              content={ showRender ? '收起渲染面板' : '展开渲染面板' }
            >
              <Text
                className={
                  showRender
                    ? `${styles.activeIcon} ${styles.rotateIcon}`
                    : ''
                }
                onClick={() => setShowRender((oldval) => !oldval)}
                icon={<IconChevronDownStroked />}
              />
            </Tooltip>
          )}
          {!hideTools?.zoom && (
            <Tooltip content={'缩放至'}>
              <Text
                icon={<IconSendStroked />}
                onClick={() => {
                  zoomToLayer(layerItem);
                }}
              />
            </Tooltip>
          )}
          {!hideTools?.delete && (
            <Tooltip
              content={'移除图层'}
            >
              <Text
                icon={<IconCrossStroked />}
                onClick={() => {
                  deleteLayer(layerItem.id);
                }}
              />
            </Tooltip>
          )}
        </span>
      </div>

      <div className={classNames(styles.legendContainer, { [styles.open]: showRender })}>
        <LayerRenderMethod layerItem={layerItem} />
      </div>
    </div>
  );
};

export default LayerItemControl;

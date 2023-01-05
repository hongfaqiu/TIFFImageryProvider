import { LayerHook } from '@/hooks/use-layer';
import { Button, Divider, Input } from '@douyinfe/semi-ui';
import { useCallback, useState } from 'react';
import DragableLayerItems from './DragableLayerItems';
import styles from './index.module.scss'

const LayerManage = () => {
  const { allLayers, addLayer, moveLayer } = LayerHook.useHook();
  const [url, setUrl] = useState('')

  const addCogLayer = useCallback(
    () => {
      addLayer({
        id: url,
        url,
        layerName: url,
        method: 'cog'
      }, {
        zoom: true
      })
    },
    [url],
  )

  return (
    <div className={styles.layerMangeContainer}>
      <div className={styles.addLayer}>
        <Input value={url} onChange={setUrl} placeholder={'输入url添加图层'} showClear/>
        <Button onClick={addCogLayer}>添加</Button>
      </div>

      <DragableLayerItems
        layers={allLayers}
        onDrop={(startIndex, endIndex) => moveLayer('2d', startIndex, endIndex)}
      />
    </div>
  );
};

export default LayerManage;

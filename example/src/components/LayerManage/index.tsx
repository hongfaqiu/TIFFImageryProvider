import { LayerHook } from '@/hooks/use-layer';
import DragableLayerItems from './DragableLayerItems';
import styles from './index.module.scss'

const LayerManage = () => {

  const { allLayers, moveLayer } = LayerHook.useHook();

  return (
    <div className={styles.layerMangeContainer}>
      <DragableLayerItems
        layers={allLayers}
        onDrop={(startIndex, endIndex) => moveLayer('2d', startIndex, endIndex)}
      />
    </div>
  );
};

export default LayerManage;

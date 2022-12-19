import { SceneModePicker } from 'cesium';
import _ from 'lodash';
import { useEffect } from 'react';

import { MapConfigHook } from '@/hooks/use-mapConfig';
import styles from './index.module.scss';

import { ViewerHook } from '@/hooks/use-viewer';

type ViewerModeSwitchBtnProps = {
  style?: React.CSSProperties;
};
let sceneModePicker: SceneModePicker;
const ViewerModeSwitchBtn = (props: ViewerModeSwitchBtnProps) => {
  const { style: userStyle } = props;
  const { viewer } = ViewerHook.useHook();
  const PickerId = 'sceneModePickerContainer' + _.uniqueId();
  const { updateMapConfig } = MapConfigHook.useHook();

  useEffect(() => {
    if (!viewer || viewer.isDestroyed()) return;
    
    sceneModePicker = new SceneModePicker(PickerId, viewer.scene, 0);
    sceneModePicker.viewModel.morphTo2D.afterExecute.addEventListener(() => updateMapConfig({
      displayMode: 2
    }))
    sceneModePicker.viewModel.morphTo3D.afterExecute.addEventListener(() => updateMapConfig({
      displayMode: 3
    }))
    sceneModePicker.viewModel.morphToColumbusView.afterExecute.addEventListener(() => updateMapConfig({
      displayMode: 1
    }))
    return () => {
      sceneModePicker.destroy();
    };
  }, [viewer]);

  return <div className={styles.modeSwitchBtn} id={PickerId} style={userStyle} />;
};

export default ViewerModeSwitchBtn;

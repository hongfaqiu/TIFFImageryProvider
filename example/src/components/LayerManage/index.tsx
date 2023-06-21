import { LayerHook } from '@/hooks/use-layer';
import { Button, Divider, Input, Upload } from '@douyinfe/semi-ui';
import { useCallback, useState } from 'react';
import DragableLayerItems from './DragableLayerItems';
import styles from './index.module.scss'
import { FileItem } from '@douyinfe/semi-ui/lib/es/upload';

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

  const uploadFile = (file: FileItem) => {
    const { name, fileInstance } = file;
    if (fileInstance) {
      addLayer({
          id: name,
          url: fileInstance,
          layerName: name.slice(0, name.lastIndexOf('.')),
          method: 'cog'
        }, {
          zoom: true
        })
    }
    return false
  }

  return (
    <div className={styles.layerMangeContainer}>
      <div className={styles.addLayer}>
        <Input value={url} onChange={setUrl} placeholder={'输入url添加图层'} showClear />
        <Button onClick={addCogLayer}>添加</Button>
        <Upload
          beforeUpload={({ file }) => uploadFile(file)}
          accept='.tif,.tiff'
          showUploadList={false}
        >
          <Button>上传文件</Button>
        </Upload>
      </div>

      <DragableLayerItems
        layers={allLayers}
        onDrop={(startIndex, endIndex) => moveLayer('2d', startIndex, endIndex)}
      />
    </div>
  );
};

export default LayerManage;

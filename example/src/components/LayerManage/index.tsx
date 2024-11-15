import { LayerHook } from '@/hooks/use-layer';
import { Button, Input, Upload } from '@douyinfe/semi-ui';
import { useCallback, useState } from 'react';
import DragableLayerItems from './DragableLayerItems';
import styles from './index.module.scss'
import { FileItem } from '@douyinfe/semi-ui/lib/es/upload';
import { IconUpload } from '@douyinfe/semi-icons';

const LayerManage = () => {
  const { allLayers, addLayer, moveLayer } = LayerHook.useHook();
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const addCogLayer = useCallback(
    async () => {
      setLoading(true);
      await addLayer({
        id: url,
        url,
        layerName: url,
        method: 'cog'
      }, {
        zoom: true
      })
      setLoading(false);
    },
    [url],
  )

  const uploadFile = (file: FileItem) => {
    const { name, fileInstance } = file;
    if (fileInstance) {
      setUploading(true);
      addLayer({
        id: name,
        url: fileInstance,
        layerName: name.slice(0, name.lastIndexOf('.')),
        method: 'cog'
      }, {
        zoom: true
      }).then(() => {
        setUploading(false);
      }).catch(() => {
        setUploading(false);
      })
    }
    return false
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    const tiffFiles = files.filter(file => 
      file.name.endsWith('.tif') || file.name.endsWith('.tiff')
    );

    tiffFiles.forEach(file => {
      uploadFile({
        name: file.name,
        fileInstance: file,
        status: 'success',
        uid: file.name,
        size: String(file.size),
      });
    });
  };

  return (
    <div 
      className={`${styles.layerMangeContainer} ${isDragging ? styles.dragging : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className={styles.dragOverlay} style={{ display: isDragging ? 'flex' : 'none' }}>
        <IconUpload size="extra-large" />
        <span>拖拽 TIFF 文件到此处</span>
      </div>
      
      <div className={styles.addLayer}>
        <Input value={url} onChange={setUrl} placeholder={'输入url添加图层'} showClear />
        <Button loading={loading} onClick={addCogLayer}>添加</Button>
      </div>

      <Upload
        className={styles.uploadArea}
        beforeUpload={({ file }) => uploadFile(file)}
        accept='.tif,.tiff'
        showUploadList={false}
        draggable
      >
        <div className={styles.uploadBox}>
          <IconUpload size="large" />
          <p className={styles.uploadText}>
            <span className={styles.mainText}>点击或拖拽文件到此处</span>
            <span className={styles.subText}>支持 .tif, .tiff 格式</span>
          </p>
        </div>
      </Upload>

      <DragableLayerItems
        layers={allLayers}
        onDrop={(startIndex, endIndex) => moveLayer('2d', startIndex, endIndex)}
      />
    </div>
  );
};

export default LayerManage;

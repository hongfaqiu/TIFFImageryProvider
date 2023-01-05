import { Divider, Radio } from '@douyinfe/semi-ui';
import { TIFFImageryProviderRenderOptions } from 'tiff-imagery-provider';
import { useEffect, useState } from 'react';
import MultiColorInput from '../../ColorBarInput';
import styles from './COGRenderMethods.module.scss';

type COGRenderMethodsProps = {
  onChange?: (values: TIFFImageryProviderRenderOptions) => void;
  value?: TIFFImageryProviderRenderOptions;
  range?: {
    min: number;
    max: number;
  };
};

const COGRenderMethods: React.FC<COGRenderMethodsProps> = ({
  value,
  onChange,
  range = {
    min: 1,
    max: 1,
  }
}) => {
  const [mode, setMode] = useState<'default' | 'public' | 'private'>('default')
  const [fill, setFill] = useState(value?.fill)
  const [showModal, setShowModal] = useState(false)
  const [noData, setNoData] = useState(value?.nodata)
  
  useEffect(() => {
    if (!onChange) return;

    if (mode === 'public') {
      onChange({
        fill,
        nodata: noData,
      })
    } else if (mode === 'default') {
      onChange({
        fill: undefined,
        nodata: noData
      })
    }
  }, [mode, fill, noData])

  return (
    <div className={styles.cogRenderContainer}>
      <div className={styles.mode}>
        <Radio.Group value={mode} onChange={e => setMode(e.target.value)}>
          <Radio value={'default'}>默认样式</Radio>
          <Radio value={'public'}>内置样式</Radio>
        </Radio.Group>
        <Divider />
      </div>

      <div className={mode === 'public' ? styles.show : styles.hide}>
        <MultiColorInput
          label='色带'
          onChange={colors => setFill(old => ({
            ...old,
            colors
          }))}
        />
      </div>

      <Divider />
      
    </div>
  )
}

export default COGRenderMethods;

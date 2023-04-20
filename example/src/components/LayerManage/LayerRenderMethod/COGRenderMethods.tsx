import { Col, Divider, Form, Radio, Row, withField } from '@douyinfe/semi-ui';
import { TIFFImageryProviderRenderOptions } from 'tiff-imagery-provider';
import { useEffect, useMemo, useState } from 'react';
import { MultiColorInputItem } from '../../ColorBarInput';
import styles from './COGRenderMethods.module.scss';

type COGRenderMethodsProps = {
  onChange?: (values?: TIFFImageryProviderRenderOptions) => void;
  value?: TIFFImageryProviderRenderOptions;
  range?: {
    min: number;
    max: number;
  };
};

const COGRenderMethods: React.FC<COGRenderMethodsProps> = ({
  value,
  onChange
}) => {
  const [mode, setMode] = useState<'default' | 'single' | 'multi'>('default')
  const [single, setSingle] = useState<TIFFImageryProviderRenderOptions>({
    r: {
      band: 1,
    },
    ...value,
    fill: {
      colors: [],
      type: 'continuous',
      ...value?.fill
    }
  })
  const [multi, setMulti] = useState<TIFFImageryProviderRenderOptions>({
    r: {
      band: 1,
    },
    g: {
      band: 2,
    },
    b: {
      band: 3,
    },
    ...value,
    fill: undefined
  })
  const [noData, setNoData] = useState(value?.nodata)
  
  const defaultStyle = useMemo(() => value, [])
  
  useEffect(() => {
    if (!onChange) return;

    if (mode === 'single') {
      onChange(single)
    } else if (mode === 'default') {
      onChange(defaultStyle)
    } else if (mode === 'multi') {
      onChange(multi)
    }
  }, [mode, single, noData, defaultStyle, multi])

  return (
    <div className={styles.cogRenderContainer}>
      <div className={styles.mode}>
        <Radio.Group value={mode} onChange={e => setMode(e.target.value)}>
          <Radio value={'default'}>默认样式</Radio>
          <Radio value={'single'}>单波段</Radio>
          <Radio value={'multi'}>多波段</Radio>
        </Radio.Group>
      </div>

      <div className={mode === 'single' ? styles.show : styles.hide}>
        <Form<TIFFImageryProviderRenderOptions>
          labelPosition='left'
          labelAlign='right'
          onValueChange={(values) => {
            if (mode === 'single') {
              onChange?.(values)
            }
            setSingle(values)
          }}
          initValues={single}
          style={{
            margin: '10px 0'
          }}
          labelWidth={'22%'}
        >
          
          <Form.InputNumber
            label={'波段:'}
            field={'r.band'}
            step={1}
            min={1}
          />
          
          <Form.RadioGroup
            label={'模式:'}
            field={'fill.type'}
          >
            {
              ["continuous", "discrete"].map(item => (
                <Form.Radio key={item} value={item} >{item}</Form.Radio>
              ))
            }
          </Form.RadioGroup>

          <MultiColorInputItem
            field='fill.colors'
            initialValue={value?.fill?.colors as any}
            noLabel
          />

        </Form>
      </div>
      
      <div className={mode === 'multi' ? styles.show : styles.hide}>
        <Form<TIFFImageryProviderRenderOptions>
          layout='horizontal'
          labelPosition='left'
          labelAlign='right'
          onValueChange={(values) => {
            if (mode === 'multi') 
              onChange?.({
                ...values,
                fill: undefined
              })
            setMulti(values)
          }}
          initValues={multi}
          style={{
            margin: '10px 0'
          }}
        >
          <Row>
            {
              ['r', 'g', 'b'].map(band => (
                <Col key={band} span={8}>
                  <Form.InputNumber
                    label={band}
                    field={`${band}.band`}
                    step={1}
                    min={1}
                  />
                </Col>
              ))
            }
          </Row>
        </Form>
      </div>
      
      <Divider/>

    </div>
  )
}

export default COGRenderMethods;

export const COGRenderFormItem = withField((props: COGRenderMethodsProps) => {
  const { validateStatus, ...rest } = props as any;
  return <COGRenderMethods {...rest} />
})

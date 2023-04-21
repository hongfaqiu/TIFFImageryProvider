import { Col, Divider, Form, Radio, Row, withField } from '@douyinfe/semi-ui';
import { MultiBandRenderOptions, SingleBandRenderOptions, TIFFImageryProviderRenderOptions } from 'tiff-imagery-provider';
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
  const [mode, setMode] = useState<'default' | 'single' | 'multi' | 'rgb'>('default')
  const [single, setSingle] = useState<SingleBandRenderOptions>({
    band: 1,
    colors: [],
    type: 'continuous',
    ...value?.single
  })
  const [multi, setMulti] = useState<MultiBandRenderOptions>({
    r: {
      band: 1,
      ...value?.multi?.r
    },
    g: {
      band: 2,
      ...value?.multi?.g
    },
    b: {
      band: 3,
      ...value?.multi?.b
    },
  })
  const [noData, setNoData] = useState(value?.nodata)
  
  const defaultStyle = useMemo(() => value, [])
  
  useEffect(() => {
    if (!onChange) return;

    if (mode === 'single') {
      onChange({ single })
    } else if (mode === 'default') {
      onChange(defaultStyle)
    } else if (mode === 'multi') {
      onChange({ multi })
    } if (mode === 'rgb') {
      onChange({ convertToRGB: true})
    }
  }, [mode, single, noData, defaultStyle, multi])

  return (
    <div className={styles.cogRenderContainer}>
      <div className={styles.mode}>
        <Radio.Group value={mode} onChange={e => setMode(e.target.value)}>
          <Radio value={'default'}>默认样式</Radio>
          <Radio value={'single'}>单波段</Radio>
          <Radio value={'multi'}>多波段</Radio>
          <Radio value={'rgb'}>RGB</Radio>
        </Radio.Group>
      </div>

      <div className={mode === 'single' ? styles.show : styles.hide}>
        <Form<SingleBandRenderOptions>
          labelPosition='left'
          labelAlign='right'
          onValueChange={(single) => {
            if (mode === 'single') {
              onChange?.({ single });
            }
            setSingle(single)
          }}
          initValues={single}
          style={{
            margin: '10px 0'
          }}
          labelWidth={'22%'}
        >
          
          <Form.InputNumber
            label={'波段:'}
            field={'band'}
            step={1}
            min={1}
          />
          
          <Form.RadioGroup
            label={'模式:'}
            field={'type'}
          >
            {
              ["continuous", "discrete"].map(item => (
                <Form.Radio key={item} value={item} >{item}</Form.Radio>
              ))
            }
          </Form.RadioGroup>

          <MultiColorInputItem
            field='colors'
            initialValue={value?.single?.colors as any}
            noLabel
          />

        </Form>
      </div>
      
      <div className={mode === 'multi' ? styles.show : styles.hide}>
        <Form<MultiBandRenderOptions>
          layout='horizontal'
          labelPosition='left'
          labelAlign='right'
          onValueChange={(multi) => {
            if (mode === 'multi') 
              onChange?.({
                multi
              })
            setMulti(multi)
          }}
          initValues={multi}
          style={{
            margin: '10px 0'
          }}
          labelWidth={30}
        >
          {
            ['r', 'g', 'b'].map(band => (
              <Row key={band}>
                <Col span={8}>
                  <Form.InputNumber
                    label={band}
                    field={`${band}.band`}
                    step={1}
                    min={1}
                  />
                </Col>
                <Col span={8}>
                  <Form.InputNumber
                    label={'min'}
                    field={`${band}.min`}
                  />
                </Col>
                <Col span={8}>
                  <Form.InputNumber
                    label={'max'}
                    field={`${band}.max`}
                  />
                </Col>
              </Row>
            ))
          }
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

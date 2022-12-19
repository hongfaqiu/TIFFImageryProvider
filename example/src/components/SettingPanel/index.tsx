import React, { useRef } from 'react';

import { Col, Form, Row } from '@douyinfe/semi-ui';
import { FormApi } from '@douyinfe/semi-ui/lib/es/form';

import styles from './index.module.scss';
import { MapConfigHook, MapConfigType } from '@/hooks/use-mapConfig';
import { getDiffObj } from '@/utils/usefulFunc';

const SettingPanel: React.FC = () => {
  const { mapConfig, updateMapConfig } = MapConfigHook.useHook();

  const $form = useRef<FormApi<MapConfigType>>();

  const switchParams = {
    checkedText: "｜",
    uncheckedText: "〇"
  };

  return (
    <div className={styles.content}>
      <Form
        getFormApi={(formApi: FormApi<MapConfigType> | undefined) => $form.current = formApi}
        name="setting"
        layout="vertical"
        initValues={mapConfig}
        autoComplete="off"
        onValueChange={(values: MapConfigType) => {
          const newVal = getDiffObj(values, mapConfig)
          if (newVal) updateMapConfig(newVal);
        }}
      >
        <Row>
          <Col span={10}>
            <Form.Switch
              field='navigator'
              label='指南针'
              {...switchParams}
            />

            <Form.Switch
              label='地球视图切换'
              field="viewerModeSwitch"
              {...switchParams}
            />

            <Form.Switch
              label='摄像机控制器'
              field="cameraController"
              {...switchParams}
            />

            <Form.Switch
              label='显示大气层'
              field="skyAtmosphere"
              {...switchParams}
            />
            <Form.Switch
              label='FXAA抗锯齿'
              field="antiAliasing"
              {...switchParams}
            />
          </Col>

          <Col span={12}>
            <Form.Switch
              label='地表透明'
              field={'translucency.enable'}
              {...switchParams}
            />

            {mapConfig.translucency?.enable && (
              <>
                <Form.Switch
                  label='随距离透明'
                  field='translucency.fadeByDistance'
                  {...switchParams}
                />

                <Form.Slider
                  label='透明度'
                  field='translucency.alpha'
                  step={0.01} max={1} min={0.1}
                  style={{
                    width: 200
                  }}
                />
              </>
            )}

            <Form.Slider
              label='水汽含量'
              field="fogDensity"
              step={0.0001} max={0.001} min={0.0001}
            />

            <Form.Slider
              label="地形拉伸"
              field="terrainExaggeration"
              step={0.1} max={30} min={1}
            />

            <Form.Slider
              label="性能调整"
              field="performance"
              step={0.1}
              max={1}
              min={0.1}
              marks={{
                0.1: "性能",
                1: '质量',
              }}
            />
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default SettingPanel;

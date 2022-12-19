import React from 'react';
import { SketchPicker } from 'react-color';
import { Row, Col, Slider, InputNumber, Select, Popover } from '@douyinfe/semi-ui';
import { InputNumberProps } from '@douyinfe/semi-ui/lib/es/inputNumber';
import { SliderProps } from '@douyinfe/semi-ui/lib/es/slider';

import useMergedState from '@/hooks/useMergedState';
import styles from './index.module.scss';

// 通用组件
type FormItemProps = {
  label: React.ReactNode;
  formItemStyle?: {
    formItem?: React.CSSProperties;
    label?: React.CSSProperties;
    input?: React.CSSProperties;
  };
  col?: {
    label?: number;
    input?: number;
  };
  children?: React.ReactNode;
};

export const FormItem = (props: FormItemProps) => {
  const { label, formItemStyle, children, col } = props;
  return (
    <Row className={styles.formItem} style={formItemStyle?.formItem}>
      <Col span={col?.label ?? 6} className={styles.label} style={formItemStyle?.label}>
        {label}:
      </Col>
      <Col span={col?.input ?? 13} className={styles.input} style={formItemStyle?.input}>
        {children}
      </Col>
    </Row>
  );
};

// 数字输入组件
export type NumberInputItem = {
  label?: string;
  min: number;
  max: number;
  step: number;
};

type NumberInputProps = {
  item: NumberInputItem;
  value?: number;
  defaultValue?: number;
  style?: React.CSSProperties;
  span?: {
    label?: number;
    slider?: number;
    number?: number;
  };
  SliderProps?: SliderProps;
  InputNumberProps?: InputNumberProps;
  onChange?: (value: number) => void;
};

export const NumberInput = (props: NumberInputProps) => {
  const {
    item,
    style: userStyle,
    value,
    defaultValue,
    SliderProps,
    InputNumberProps,
    onChange,
  } = props;

  const span = {
    label: 6,
    slider: 11,
    number: 6,
    ...props.span,
  }

  return (
    <Row className={styles.formItem} style={userStyle}>
      {item.label && (
        <Col span={span.label} className={styles.label}>
          {item.label}:
        </Col>
      )}
      <Col span={span.slider} className={styles.input}>
        <Slider
          {...SliderProps}
          min={item.min}
          max={item.max}
          step={item.step}
          onChange={(val) => {
            if (onChange && val !== undefined) onChange(+val);
          }}
          value={value}
          defaultValue={defaultValue}
        />
      </Col>
      <Col span={span.number}>
        <InputNumber
          style={{ width: '100%' }}
          {...InputNumberProps}
          min={item.min}
          max={item.max}
          step={item.step}
          value={value}
          defaultValue={defaultValue}
          onChange={(val) => {
            if (onChange) onChange(+val);
          }}
        />
      </Col>
    </Row>
  );
};

// 选择输入组件
export type SelectInputItem = {
  label: string;
  options: {
    label: React.ReactNode;
    value: string | number;
  }[];
};

type SelectInputProps = {
  item: SelectInputItem;
  defaultValue?: any;
  value?: any;
  style?: React.CSSProperties;
  formItemStyle?: {
    formItem?: React.CSSProperties;
    label?: React.CSSProperties;
    input?: React.CSSProperties;
  };
  onChange?: (value: any) => void;
};

export const SelectInput = (props: SelectInputProps) => {
  const { item, defaultValue, value, formItemStyle, style: userStyle, onChange } = props;
  return (
    <FormItem label={item.label} formItemStyle={formItemStyle}>
      <Select
        defaultValue={defaultValue}
        value={value}
        onChange={(val: any) => onChange !== undefined && onChange(val)}
        size={'small'}
        style={{ width: '100%', ...userStyle }}
        optionList={item.options}
      />
    </FormItem>
  );
};

/**
 * 颜色选择组件
 */
export const ColorPicker: React.FC<{
  value?: any;
  defaultValue?: any;
  style?: React.CSSProperties;
  outStyle?: React.CSSProperties;
  onChange?: (val: any) => void;
  zIndex?: number;
  mode?: 'rgb' | 'hex' | 'hsl';
}> = ({ value, defaultValue, onChange, zIndex, mode = 'rgb', ...props }) => {
  const [color, setColor] = useMergedState(defaultValue, { value, onChange });

  return (
    <Popover
      position="bottom"
      content={<SketchPicker color={color} onChange={(val) => setColor(val[mode])} />}
      trigger="click"
      zIndex={zIndex}
    >
      <div className={styles.colorPicker} style={props.outStyle}>
        <div
          className={styles.colorPickerItem}
          style={{
            ...props.style,
            backgroundColor:
              typeof color === 'object'
                ? `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`
                : color,
          }}
        />
      </div>
    </Popover>
  );
};

// 单一颜色输入组件
type SingleColorInputProps = {
  label: string;
  value?: string;
  onChange?: (values: string) => void;
  mode?: 'rgb' | 'hex' | 'hsl';
  style?: React.CSSProperties;
};

export const SingleColorInput = (props: SingleColorInputProps) => {
  const { label, value, onChange, mode, style: userStyle } = props;

  return (
    <Row className={styles.formItem}>
      <Col span={6} className={styles.label}>
        {label}:
      </Col>
      <Col span={13} className={styles.input} style={{ display: 'flex' }}>
        <ColorPicker
          value={value}
          mode={mode}
          onChange={onChange}
          style={{
            height: '7px',
            margin: '0 7px',
            borderRadius: 3,
            ...userStyle,
          }}
        />
      </Col>
    </Row>
  );
};

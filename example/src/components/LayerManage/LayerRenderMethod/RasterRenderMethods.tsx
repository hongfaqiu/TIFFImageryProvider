import { NumberInputItem } from '@/components/FormComponents';
import { Form } from '@douyinfe/semi-ui';
import { FormApi, withField } from '@douyinfe/semi-ui/lib/es/form';
import { useEffect, useRef } from 'react';

import type { Layer } from '@/typings/layer';

interface RasterRenderMethodsProps {
  value?: Layer.RasterOptions;
  onChange?: (options: Layer.RasterOptions) => void;
}

const RasterRenderMethods = ({
  value, onChange
}: RasterRenderMethodsProps) => {
  const $form = useRef<FormApi>();

  const formItems = [
    {
      label: '透明度',
      field: 'alpha',
      min: 0,
      max: 1,
      step: 0.01,
    },
    {
      label: '亮度',
      field: 'brightness',
      min: 0,
      max: 3,
      step: 0.01,
    },
    {
      label: '色度',
      field: 'hue',
      min: 0,
      max: 3,
      step: 0.01,
    },
    {
      label: '对比度',
      field: 'contrast',
      min: 0,
      max: 3,
      step: 0.01,
    },
    {
      label: '明暗',
      field: 'gamma',
      min: 0.01,
      max: 3,
      step: 0.01,
    },
    {
      label: '饱和度',
      field: 'saturation',
      min: 0,
      max: 3,
      step: 0.01,
    },
  ];
  
  useEffect(() => {
    $form.current?.setValues(value ?? {});
  }, [value]);

  return (
    <Form<Layer.RasterOptions>
      getFormApi={(formApi) => ($form.current = formApi)}
      onValueChange={onChange}
    >
      {formItems.map((item) => (
        <NumberInputItem
          field={item.field}
          item={item}
          key={item.label}
          noLabel
        />
      ))}
    </Form>
  );
};

export default RasterRenderMethods;

export const RasterRenderFormItem = withField((props: RasterRenderMethodsProps) => {
  const { validateStatus, ...rest } = props as any;
  return <RasterRenderMethods {...rest} />
})
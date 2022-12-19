import { NumberInput } from '@/components/FormComponents';
import styles from '../index.module.scss';

interface RasterRenderMethodsProps {
  value?: Layer.RasterOptions;
  onOptionsChange?: (options: Layer.RasterOptions) => void;
}

const RasterRenderMethods = (props: RasterRenderMethodsProps) => {
  const { value, onOptionsChange } = props;

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

  const onValueChange = (val: number | string[] | boolean, field: string) => {
    const newOptions = {
      ...value,
      [field]: val,
    };
    if (onOptionsChange !== undefined) onOptionsChange(newOptions);
  };

  return (
    <div className={styles.formItemsContainer}>
      {formItems.map((item) => (
        <NumberInput
          item={item}
          key={item.label}
          value={value?.[item.field as keyof Layer.RasterOptions]}
          onChange={(val) => onValueChange(val, item.field)}
        />
      ))}
    </div>
  );
};

export default RasterRenderMethods;

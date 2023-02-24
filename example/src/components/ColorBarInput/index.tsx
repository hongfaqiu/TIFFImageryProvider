
import { SwapIcon } from '@/components/SVGIcons';
import { Tooltip } from '@/components/tooltip';
import { IconRedoStroked } from '@douyinfe/semi-icons';
import { Button, Col, Row, Select, withField } from '@douyinfe/semi-ui';
import { useEffect, useState } from 'react';

import { NumberInput } from '../FormComponents';
import { generateAllDiscreteColor } from './d3colors';
import style from './index.module.scss';

const { Option } = Select;

export function randomHexColor() {
  //随机生成十六进制颜色
  let hex = Math.floor(Math.random() * 16777216).toString(16); //生成ffffff以内16进制数
  while (hex.length < 6) {
    //while循环判断hex位数，少于6位前面加0凑够6位
    hex = '0' + hex;
  }
  return '#' + hex; //返回‘#'开头16进制颜色
}

function getRandomColorBar(num: number) {
  const colorBar: string[] = [];
  for (let i = 0; i < num; i += 1) {
    colorBar.push(randomHexColor());
  }
  return colorBar;
}

const ColorBar = (props: { colors: string[]; extra?: React.ReactNode }) => {
  const { colors, extra } = props;
  const width = (100 / colors.length).toFixed(3) + '%';
  return (
    <div className={style.colorBar}>
      <div className={style.colors}>
        {colors.map((item, index) => (
          <div className={style.colorBarItem} key={item + index.toString()} style={{ backgroundColor: item, width }} />
        ))}
      </div>
      <div className={style.extra}>{extra}</div>
    </div>
  );
};

const getDefaultColorBars = (num: number) => {
  const colorBar: any[] = [];
  generateAllDiscreteColor(num).map((colors) => {
    colorBar.push(...colors.values.map((item) => item.colors));
  });
  return colorBar;
};

// 色带输入组件
export type MultiColorInputProps = {
  opacityControl?: boolean;
  numberControl?: boolean;
  onChange?: (values: string[]) => void;
  number?: number;
  initialValue?: string[];
  locales?: {
    numberControl?: string;
    opacityControl?: string;
    reverse?: string;
    refresh?: string;
  };
};

const getColorBars = (
  num: number,
  inputColorBar: string[] | undefined = undefined,
  reverse?: Record<number, boolean>,
) => {
  let firstColorBar = getRandomColorBar(num);
  if (inputColorBar?.length === num) firstColorBar = inputColorBar;
  if (inputColorBar?.length === 1) firstColorBar = new Array(num).fill(inputColorBar[0]);
  const newColorBars = [firstColorBar ?? getRandomColorBar(num), ...getDefaultColorBars(num)].map(
    (colorBar, index) => {
      if (reverse?.[index]) return colorBar.reverse();
      return colorBar;
    },
  );

  return newColorBars;
};

const MultiColorInput: React.FC<MultiColorInputProps> = ({
  opacityControl,
  numberControl = true,
  onChange,
  number,
  initialValue,
  locales,
}) => {
  const [colorNum, setColorNum] = useState(number ?? 2);
  const [selectedIndex, setselectedIndex] = useState(0);
  const [colorBars, setColorBars] = useState<string[][]>([]);
  const [opacity, setOpacity] = useState(100);
  const [reverse, setReverse] = useState<Record<string, boolean>>({});

  const colorBar2AlphaHex = (colors: string[]) => {
    return colors.map((color) => {
      const alpha = Math.floor(2.55 * opacity).toString(16);
      if (alpha.length > 1) return color + alpha;
      return color + '0' + alpha;
    });
  };

  useEffect(() => {
    if (number) setColorNum(number);
  }, [number]);

  const handelChange = (num: null | number = null) => {
    let newColorBars = colorBars;
    // 根据颜色数量更新色带
    if (colorBars.length === 0) {
      newColorBars = getColorBars(number ?? 2, initialValue, reverse);
      setColorBars(newColorBars);
    } else if (num) {
      newColorBars = getColorBars(num, undefined, reverse);
      setColorBars(newColorBars);
    }
    // 颜色更改的回调
    if (onChange) {
      if (opacityControl) {
        const values = colorBar2AlphaHex(newColorBars[selectedIndex]);
        onChange(values);
      } else onChange(newColorBars[selectedIndex]);
    }
  };

  useEffect(() => {
    if (colorBars.length === 0) return;
    handelChange();
  }, [selectedIndex, opacity]);

  useEffect(() => {
    handelChange(colorNum);
  }, [colorNum]);

  const reverseColorBar = (index: number) => {
    const newColorBars = [...colorBars];
    if (index) {
      setReverse({
        ...reverse,
        [index]: !reverse[index],
      });
      newColorBars[index] = newColorBars[index].reverse();
    } else {
      newColorBars[0] = getRandomColorBar(colorNum);
    }
    setColorBars(newColorBars);
    if (selectedIndex === index && onChange) {
      if (opacityControl) {
        const values = colorBar2AlphaHex(newColorBars[index]);
        onChange(values);
      } else onChange(newColorBars[index]);
    }
  };

  return (
    <div className={style.multiColorInput}>
      {numberControl && (
        <NumberInput
          item={{
            label: locales?.numberControl ?? '数量',
            min: 2,
            max: 20,
            step: 1,
          }}
          value={colorNum}
          onChange={(val) => setColorNum(val)}
        />
      )}
      <Row className={style.formItem}>
        <Col span={4} className={style.label}>
          颜色:
        </Col>
        <Col span={18} className={style.input}>
          <Select
            value={selectedIndex}
            onChange={(val) => setselectedIndex(val as number)}
            size={'small'}
            style={{ width: '100%' }}
            renderSelectedItem={(optionNode: any) => optionNode.renderItem}
          >
            {colorBars.map((colorBar, index) => (
              <Option
                value={index}
                key={colorBar[0] + index.toString()}
                colors={colorBar}
                renderItem={<ColorBar colors={colorBar} />}
              >
                <ColorBar
                  colors={colorBar}
                  extra={
                    (index === selectedIndex || index === 0) ? (
                      <Tooltip
                        content={ index ? '翻转' : '刷新' }
                      >
                        <Button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            reverseColorBar(index);
                          }}
                          theme='borderless'
                          icon={index ? <SwapIcon /> : <IconRedoStroked />}
                          size="small"
                        />
                      </Tooltip>
                    ) : null
                  }
                />
              </Option>
            ))}
          </Select>
        </Col>
      </Row>
      {opacityControl && (
        <NumberInput
          item={{
            label: locales?.opacityControl ?? 'Opacity',
            min: 1,
            max: 100,
            step: 1,
          }}
          value={opacity}
          onChange={(val) => setOpacity(val)}
        />
      )}
    </div>
  );
};

export default MultiColorInput;

export const MultiColorInputItem = withField((props: MultiColorInputProps) => {
  const { validateStatus, ...rest } = props as any;
  return <MultiColorInput {...rest} />
})


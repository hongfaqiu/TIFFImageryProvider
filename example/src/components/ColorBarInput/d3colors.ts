import { Color } from 'cesium';
import * as d3 from 'd3-scale-chromatic';

export const SequentialSingleHueColors = ['Blues', 'Greens', 'Greys', 'Oranges', 'Purples', 'Reds'];

export const SequentialMultiHueColors = [
  'BuGn',
  'BuPu',
  'GnBu',
  'OrRd',
  'PuBuGn',
  'PuBu',
  'PuRd',
  'RdPu',
  'YlGnBu',
  'YlGn',
  'YlOrBr',
  'YlOrRd',
];

export const SequentialMultiHue2Colors = [
  'Cividis',
  'Viridis',
  'Inferno',
  'Magma',
  'Plasma',
  'Warm',
  'Cool',
  'CubehelixDefault',
  'Turbo',
];

export const DivergingColors = [
  'BrBG',
  'PRGn',
  'PiYG',
  'PuOr',
  'RdBu',
  'RdGy',
  'RdYlBu',
  'RdYlGn',
  'Spectral',
];

export const CyclicalColors = ['Rainbow', 'Sinebow'];

export const CategoricalColors = [
  'Category10',
  'Accent',
  'Dark2',
  'Paired',
  'Pastel1',
  'Pastel2',
  'Set1',
  'Set2',
  'Set3',
  'Tableau10',
];

/**
 * 根据颜色数量生成不连续色带
 * @param {number} num 颜色数量
 * @param {string[]} colorNames 颜色名称
 */
export function generateDiscreteColor(num: number, colorNames: string[]) {
  return colorNames.map((name) => {
    let colors: string[];
    if (d3[`scheme${name}`] && d3[`scheme${name}`][num]) {
      colors = d3[`scheme${name}`][num];
    } else {
      const interpolate = d3[`interpolate${name}`];
      colors = [];
      for (let i = 0; i < num; ++i) {
        const rgb = interpolate(num === 1 ? 0 : i / (num - 1));
        const color = Color.fromCssColorString(rgb).toCssHexString();
        colors.push(color);
      }
    }
    return {
      name,
      colors,
    };
  });
}

export function generateAllDiscreteColor(num: number) {
  const colorTypes = {
    singleHue: SequentialSingleHueColors,
    multiHue: SequentialMultiHueColors,
    MultiHue2: SequentialMultiHue2Colors,
    diverging: DivergingColors,
    cyclical: CyclicalColors,
  };
  return Object.entries(colorTypes).map(([key, colorNames]) => {
    const values = generateDiscreteColor(num, colorNames);
    if (key === 'diverging') values.forEach((item) => (item.colors = item.colors.reverse()));
    return {
      type: key,
      values,
    };
  });
}

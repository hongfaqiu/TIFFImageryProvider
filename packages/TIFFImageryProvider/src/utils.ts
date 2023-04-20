export function getMinMax(data: number[], nodata: number) {
  let min: number, max: number;
  for (let j = 0; j < data.length; j += 1) {
    const val = data[j];
    if (val === nodata) continue;
    if (min === undefined && max === undefined) {
      min = max = val;
      continue;
    }
    if (val < min) {
      min = val;
    } else if (val > max) {
      max = val;
    }
  }
  return {
    min, max
  }
}

export function decimal2rgb(number: number) {
  return Math.round(number * 255)
}

export function getRange(bands: {
  min: number;
  max: number;
}[], opts: {
  min?: number,
  max?: number,
  band?: number
} | undefined) {
  const min = opts?.min ?? +bands[(opts?.band ?? 1) - 1].min;
  const max = opts?.max ?? +bands[(opts?.band ?? 1) - 1].max;
  const range = max - min;
  return { min, max, range };
}

export function generateColorScale(colors: [number, string][] | string[], bands: {
  min: number;
  max: number;
}[], opts: {
  min?: number,
  max?: number,
  band?: number
} | undefined) {
  const { min, max, range } = getRange(bands, opts);

  let stops: [number, string][];

  if (typeof colors[0] === 'string') {
    const step = range / colors.length;
    stops = (colors as string[]).map((color: any, index: number) => {
      return [min + index * step, color]
    })
  } else {
    stops = (colors as [number, string][]).sort((a, b) => a[0] - b[0])
    if (stops[0][0] > min) {
      stops[0][0] = min;
    }
    if (stops[stops.length - 1][0] < max) {
      stops[stops.length] = [max, stops[stops.length - 1][1]];
    }
  }

  const colorScale = {
    colors: stops.map(stop => stop[1]),
    positions: stops.map(stop => (stop[0] - min) / range),
  }

  return { stops, colorScale };
}

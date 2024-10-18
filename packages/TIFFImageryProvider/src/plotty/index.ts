/**
 * The main plotty module.
 * @module plotty
 * @name plotty
 * @author: Daniel Santillan
 */

/**
 * @constant
 */
import { colorscales } from './colorscales';
import { parse as parseArithmetics } from './arithmetics-parser';
import { ColorScaleNames, DataSet, PlotOptions, RenderColorType, TypedArray } from './typing';

function hasOwnProperty(obj: any, prop: string) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

function defaultFor(arg: any, val: any) { return typeof arg !== 'undefined' ? arg : val; }

function create3DContext(canvas: HTMLCanvasElement | OffscreenCanvas, optAttribs: { premultipliedAlpha: boolean; }) {
  const names = ['webgl', 'experimental-webgl'];
  let context: WebGLRenderingContext | null = null;
  for (let ii = 0; ii < names.length; ++ii) {
    try {
      context = canvas.getContext(names[ii] as any, optAttribs) as any as WebGLRenderingContext;
    } catch (e) { }
    if (context) {
      break;
    }
  }
  if (!context || !context.getExtension('OES_texture_float')) {
    return null;
  }
  return context;
}

function createProgram(gl: WebGLRenderingContext, vertexShaderSource: string, fragmentShaderSource: string) {
  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, vertexShaderSource);
  gl.compileShader(vertexShader);

  if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
    console.error('Vertex shader compilation failed:', gl.getShaderInfoLog(vertexShader));
    gl.deleteShader(vertexShader);
    return null;
  }

  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, fragmentShaderSource);
  gl.compileShader(fragmentShader);

  if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
    console.error('Fragment shader compilation failed:', gl.getShaderInfoLog(fragmentShader));
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    return null;
  }

  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Shader program linking failed:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);
    return null;
  }

  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  return program;
}

function setRectangle(gl: WebGLRenderingContext, x: number, y: number, width: number, height: number) {
  const x1 = x;
  const x2 = x + width;
  const y1 = y;
  const y2 = y + height;
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
    x1, y1,
    x2, y1,
    x1, y2,
    x1, y2,
    x2, y1,
    x2, y2]), gl.STATIC_DRAW);
}

function createDataset(gl: WebGLRenderingContext, id: string, data: TypedArray, width: number, height: number) {
  let textureData: WebGLTexture;
  if (gl) {
    gl.viewport(0, 0, width, height);
    textureData = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, textureData);

    // Set the parameters so we can render any size image.
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    const processedData = new Float32Array(data.length);

    for (let i = 0; i < data.length; i++) {
      processedData[i] = isNaN(data[i]) ? Number.MIN_SAFE_INTEGER : data[i];
    }

    // Upload the image into the texture.
    gl.texImage2D(gl.TEXTURE_2D, 0,
      gl.LUMINANCE,
      width, height, 0,
      gl.LUMINANCE, gl.FLOAT, processedData
    );
  }
  return { textureData, width, height, data, id };
}

function destroyDataset(gl: WebGLRenderingContext, dataset: DataSet) {
  if (gl) {
    gl.deleteTexture(dataset.textureData);
  }
}

/**
 * Add a new colorscale to the list of available colorscales.
 * @memberof module:plotty
 * @param {String} name the name of the newly defined color scale
 * @param {String[]} colors the array containing the colors. Each entry shall
 *                          adhere to the CSS color definitions.
 * @param {Number[]} positions the value position for each of the colors
 */
function addColorScale(name: string, colors: string[], positions: number[]) {
  if (colors.length !== positions.length) {
    throw new Error('Invalid color scale.');
  }
  colorscales[name] = { colors, positions };
}

/**
 * Render the colorscale to the specified canvas.
 * @memberof module:plotty
 * @param {String} name the name of the color scale to render
 * @param {HTMLCanvasElement} canvas the canvas to render to
 * @param {RenderColorType} type the type of color scale to render, either "continuous" or "discrete"
 */
function renderColorScaleToCanvas(name: string, canvas: HTMLCanvasElement, type: RenderColorType = 'continuous') {
  const csDef = colorscales[name];
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  // TODO: move into fs, dont's use texture interpolation
  // Supports up to 4 decimal places of precision
  const width = 8192 //10 ** 4;

  if (!ctx) {
    throw new Error('Unable to get canvas context.');
  }

  if (Object.prototype.toString.call(csDef) === '[object Object]') {
    canvas.width = width;

    if (type === 'continuous') {
      const gradient = ctx.createLinearGradient(0, 0, width, 1);

      for (let i = 0; i < csDef.colors.length; ++i) {
        gradient.addColorStop(csDef.positions[i], csDef.colors[i]);
      }

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, 1);
    } else if (type === 'discrete') {
      for (let i = 0; i < csDef.colors.length; ++i) {
        const nowPos = csDef.positions[i], lastPos = csDef.positions[i + 1];
        const startPos = nowPos * (width - 10);
        const endPos = lastPos ? lastPos * (width - 10) : width;
        ctx.fillStyle = csDef.colors[i];
        ctx.fillRect(startPos, 0, endPos - startPos, 1);
      }
    } else {
      throw new Error('Invalid color scale type.');
    }
  } else if (Object.prototype.toString.call(csDef) === '[object Uint8Array]') {
    canvas.width = width;
    const imgData = ctx.createImageData(width, 1);
    imgData.data.set(csDef);
    ctx.putImageData(imgData, 0, 0);
  } else {
    throw new Error('Color scale not defined.');
  }
}

const vertexShaderSource = `
  precision mediump float;
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  uniform mat3 u_matrix;
  uniform vec2 u_resolution;
  uniform vec2 u_sourceSize;
  uniform vec2 u_targetSize;
  uniform vec4 u_window;
  varying vec2 v_texCoord;
  varying vec2 v_sourceTexCoord;

  void main() {
    vec2 position = (u_matrix * vec3(a_position, 1)).xy;
    vec2 zeroToOne = position / u_resolution;
    vec2 zeroToTwo = zeroToOne * 2.0;
    vec2 clipSpace = zeroToTwo - 1.0;
    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
    
    v_texCoord = a_texCoord;
    v_sourceTexCoord = mix(u_window.xy, u_window.zw, a_position / u_targetSize) * (u_sourceSize - 1.0) / u_sourceSize;
  }
`;

/**
 * The raster plot class.
 * @memberof module:plotty
 * @constructor
 * @param {Object} options the options to pass to the plot.
 * @param {HTMLCanvasElement} [options.canvas=document.createElement('canvas')]
 *        the canvas to render to
 * @param {TypedArray} [options.data] the raster data to render
 * @param {Number} [options.width] the width of the input raster
 * @param {Number} [options.height] the height of the input raster
 * @param {Object[]} [options.datasets=undefined] a list of named datasets. each
 *         must have 'id', 'data', 'width' and 'height'.
 * @param {(HTMLCanvasElement|HTMLImageElement)} [options.colorScaleImage=undefined]
 *        the color scale image to use
 * @param {String} [options.colorScale] the name of a named color scale to use
 * @param {Number[]} [options.domain=[0, 1]] the value domain to scale the color
 * @param {Number[]} [options.displayRange=[0, 1]] range of values that will be
 *        rendered, values outside of the range will be transparent
 * @param {Boolean} [options.applyDisplayRange=false] set if displayRange should
 *        be used
 * @param {Boolean} [options.clampLow=true] whether or now values below the domain
 *        shall be clamped
 * @param {Boolean} [options.clampHigh=clampLow] whether or now values above the
 * domain shall be clamped (if not defined defaults to clampLow value)
 * @param {Number} [options.noDataValue = undefined] the no-data value that shall
 *         always be hidden
 * @param {Array} [options.matrix=[1, 0, 0, 0, 1, 0, 0, 0, 1 ]] Transformation matrix
 * @param {Boolean} [options.useWebGL=true] plotty can also function with pure javascript
 *         but it is much slower then using WebGl rendering
 *
 */
class plot {
  canvas: HTMLCanvasElement | OffscreenCanvas;
  currentDataset: DataSet;
  datasetCollection: Record<string, DataSet>;
  gl: WebGLRenderingContext | null;
  program: WebGLProgram;
  texCoordBuffer: WebGLBuffer;
  ctx: CanvasRenderingContext2D;
  displayRange: number[];
  applyDisplayRange: boolean;
  matrix: number[];
  colorScaleImage: HTMLCanvasElement | HTMLImageElement;
  domain: number[];
  colorScaleCanvas: HTMLCanvasElement;
  name: ColorScaleNames;
  clampLow: boolean;
  clampHigh: boolean;
  textureScale: WebGLTexture;
  noDataValue: number;
  expressionAst: string;
  colorType: RenderColorType = 'continuous';
  positionBuffer: WebGLBuffer;
  programCache: Record<string, WebGLProgram> = {};
  window: number[];
  interpolationMethod: 'nearest' | 'bilinear' = 'nearest';
  tileWidth: number;
  tileHeight: number;
  buffer: number;

  constructor(options: PlotOptions) {
    this.datasetCollection = {};
    this.currentDataset = null;

    this.setCanvas(options.canvas);
    this.setColorType(options.type);
    // check if a webgl context is requested and available and set up the shaders

    if (defaultFor(options.useWebGL, true)) {
      // Try to create a webgl context in a temporary canvas to see if webgl and
      // required OES_texture_float is supported
      const gl = create3DContext(this.canvas, { premultipliedAlpha: false });
      if (gl !== null) {
        this.gl = gl;
        this.program = createProgram(gl, vertexShaderSource, this.createFragmentShader(null));
        gl.useProgram(this.program);

        // look up where the vertex data needs to go.
        const texCoordLocation = gl.getAttribLocation(this.program, 'a_texCoord');

        // provide texture coordinates for the rectangle.
        this.texCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
          0.0, 0.0,
          1.0, 0.0,
          0.0, 1.0,
          0.0, 1.0,
          1.0, 0.0,
          1.0, 1.0]), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(texCoordLocation);
        gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

        // Create and bind the position buffer
        this.positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
          0, 0,
          1, 0,
          0, 1,
          0, 1,
          1, 0,
          1, 1
        ]), gl.STATIC_DRAW);

        // Set up the vertex attribute pointer
        const positionLocation = gl.getAttribLocation(this.program, 'a_position');
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
      } else {
        // Fall back to 2d context
        this.ctx = (this.canvas as HTMLCanvasElement).getContext('2d');
      }
    } else {
      this.ctx = (this.canvas as HTMLCanvasElement).getContext('2d');
    }

    if (options.colorScaleImage) {
      this.setColorScaleImage(options.colorScaleImage);
    } else {
      this.setColorScale(defaultFor(options.colorScale, 'viridis'));
    }
    this.setDomain(defaultFor(options.domain, [0, 1]));
    this.displayRange = defaultFor(options.displayRange, [0, 1]);
    this.applyDisplayRange = defaultFor(options.applyDisplayRange, false);
    this.setClamp(defaultFor(options.clampLow, true), options.clampHigh);
    this.setNoDataValue(options.noDataValue);

    if (options.data) {
      const l = options.data.length;
      this.setData(
        options.data,
        defaultFor(options.width, options.data[l - 2]),
        defaultFor(options.height, options.data[l - 2])
      );
    }

    if (options.datasets) {
      for (let i = 0; i < options.datasets.length; ++i) {
        const ds = options.datasets[i];
        this.addDataset(ds.id, ds.data, ds.width, ds.height);
      }
    }

    if (options.matrix) {
      this.matrix = options.matrix;
    } else {  // if no matrix is provided, supply identity matrix
      this.matrix = [
        1, 0, 0,
        0, 1, 0,
        0, 0, 1,
      ];
    }

    this.tileWidth = options.tileWidth || 256;
    this.tileHeight = options.tileHeight || 256;
    this.buffer = options.buffer || 1;
  }

  /**
   * Get the raw data from the currently selected dataset.
   * @returns {TypedArray} the data of the currently selected dataset.
   */
  getData(): TypedArray {
    const dataset = this.currentDataset;
    if (!dataset) {
      throw new Error('No dataset available.');
    }
    return dataset.data;
  }

  /**
   * Query the raw raster data at the specified coordinates.
   * @param {Number} x the x coordinate
   * @param {Number} y the y coordinate
   * @returns {Number} the value at the specified coordinates
   */
  atPoint(x: number, y: number): number {
    const dataset = this.currentDataset;
    if (!dataset) {
      throw new Error('No dataset available.');
    } else if (x >= dataset.width || y >= dataset.height) {
      throw new Error('Coordinates are outside of image bounds.');
    }
    return dataset.data[(y * dataset.width) + x];
  }

  /**
   * Set the raw raster data to be rendered. This creates a new unnamed dataset.
   * @param {TypedArray} data the raw raster data. This can be a typed array of
   *                          any type, but will be coerced to Float32Array when
   *                          beeing rendered.
   * @param {number} width the width of the raster image
   * @param {number} height the height of the data
   */
  setData(data: TypedArray, width: number, height: number) {
    if (this.currentDataset && this.currentDataset.id === null) {
      destroyDataset(this.gl, this.currentDataset);
    }
    this.currentDataset = createDataset(this.gl, null, data, width, height);
  }

  /**s
   * Add a new named dataset. The semantics are the same as with @see setData.
   * @param {string} id the identifier for the dataset.
   * @param {TypedArray} data the raw raster data. This can be a typed array of
   *                          any type, but will be coerced to Float32Array when
   *                          beeing rendered.
   * @param {number} width the width of the raster image
   * @param {number} height the height of the data
   */
  addDataset(id: string, data: TypedArray, width: number, height: number) {
    if (this.datasetAvailable(id)) {
      throw new Error(`There is already a dataset registered with id '${id}'`);
    }
    this.datasetCollection[id] = createDataset(this.gl, id, data, width, height);
    if (!this.currentDataset) {
      this.currentDataset = this.datasetCollection[id];
    }
  }

  /**
   * Set the current dataset to be rendered.
   * @param {string} id the identifier of the dataset to be rendered.
   */
  setCurrentDataset(id: string) {
    if (!this.datasetAvailable(id)) {
      throw new Error(`No such dataset registered: '${id}'`);
    }
    if (this.currentDataset && this.currentDataset.id === null) {
      destroyDataset(this.gl, this.currentDataset);
    }
    this.currentDataset = this.datasetCollection[id];
  }

  /**
   * Remove the dataset.
   * @param {string} id the identifier of the dataset to be removed.
   */
  removeDataset(id: string) {
    const dataset = this.datasetCollection[id];
    if (!dataset) {
      throw new Error(`No such dataset registered: '${id}'`);
    }
    destroyDataset(this.gl, dataset);
    if (this.currentDataset === dataset) {
      this.currentDataset = null;
    }
    delete this.datasetCollection[id];
  }

  removeAllDataset() {
    Object.keys(this.datasetCollection).forEach(id => this.removeDataset(id));
  }

  /**
   * Check if the dataset is available.
   * @param {string} id the identifier of the dataset to check.
   * @returns {Boolean} whether or not a dataset with that identifier is defined
   */
  datasetAvailable(id: string): boolean {
    return hasOwnProperty(this.datasetCollection, id);
  }

  /**
   * Retrieve the rendered color scale image.
   * @returns {(HTMLCanvasElement|HTMLImageElement)} the canvas or image element
   *                                                 for the rendered color scale
   */
  getColorScaleImage(): (HTMLCanvasElement | HTMLImageElement) {
    return this.colorScaleImage;
  }

  /**
   * Set the canvas to draw to. When no canvas is supplied, a new canvas element
   * is created.
   * @param {HTMLCanvasElement | OffscreenCanvas} [canvas] the canvas element to render to.
   */
  setCanvas(canvas: HTMLCanvasElement | OffscreenCanvas) {
    this.canvas = canvas || document.createElement('canvas');
  }

  setColorType(type: RenderColorType) {
    this.colorType = type ?? 'continuous';
  }

  /**
   * Set the new value domain for the rendering.
   * @param {number[]} domain the value domain range in the form [low, high]
   */
  setDomain(domain: number[]) {
    if (!domain || domain.length !== 2) {
      throw new Error('Invalid domain specified.');
    }
    this.domain = domain;
  }

  /**
   * Set the display range that will be rendered, values outside of the range
   * will not be rendered (transparent)
   * @param {number[]} displayRange range array in the form [min, max]
   */
  setDisplayRange(displayRange: number[]) {
    if (!displayRange || displayRange.length !== 2) {
      throw new Error('Invalid view range specified.');
    }
    this.displayRange = displayRange;
    // When setting view range automatically enable the apply flag
    this.applyDisplayRange = true;
  }

  /**
   * Get the canvas that is currently rendered to.
   * @returns {HTMLCanvasElement} the canvas that is currently rendered to.
   */
  getCanvas(): HTMLCanvasElement | OffscreenCanvas {
    return this.canvas;
  }

  /**
   * Set the currently selected color scale.
   * @param {ColorScaleNames} name the name of the colorscale. Must be registered.
   */
  setColorScale(name: ColorScaleNames) {
    if (!hasOwnProperty(colorscales, name)) {
      throw new Error(`No such color scale '${name}'`);
    }
    if (!this.colorScaleCanvas) {
      // Create single canvas to render colorscales
      this.colorScaleCanvas = document.createElement('canvas');
      this.colorScaleCanvas.width = 256;
      this.colorScaleCanvas.height = 1;
    }
    renderColorScaleToCanvas(name, this.colorScaleCanvas, this.colorType);
    this.name = name;
    this.setColorScaleImage(this.colorScaleCanvas);
  }

  /**
   * Set the clamping for the lower and the upper border of the values. When
   * clamping is enabled for either side, the values below or above will be
   * clamped to the minimum/maximum color.
   * @param {Boolean} clampLow whether or not the minimum shall be clamped.
   * @param {Boolean} clampHigh whether or not the maxmimum shall be clamped.
   *                            defaults to clampMin.
   */
  setClamp(clampLow: boolean, clampHigh: boolean) {
    this.clampLow = clampLow;
    this.clampHigh = (typeof clampHigh !== 'undefined') ? clampHigh : clampLow;
  }

  /**
   * Set the currently selected color scale as an image or canvas.
   * @param {(HTMLCanvasElement|HTMLImageElement)} colorScaleImage the new color
   *                                                               scale image
   */
  setColorScaleImage(colorScaleImage: (HTMLCanvasElement | HTMLImageElement)) {
    this.colorScaleImage = colorScaleImage;
    const gl = this.gl;
    if (gl) {
      if (this.textureScale) {
        gl.deleteTexture(this.textureScale);
      }
      this.textureScale = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.textureScale);

      // Set the parameters so we can render any size image.
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      // Upload the image into the texture.
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, colorScaleImage);
    }
  }

  /**
   * Set the no-data-value: a special value that will be rendered transparent.
   * @param {number} noDataValue the no-data-value. Use null to clear a
   *                            previously set no-data-value.
   */
  setNoDataValue(noDataValue: number) {
    this.noDataValue = isNaN(noDataValue) ? Number.MIN_SAFE_INTEGER : noDataValue;
  }

  /**
   * Render the map to the specified canvas with the given settings.
   */
  render(window?: [number, number, number, number]) {
    const dataset = this.currentDataset;

    // 设置 canvas 尺寸为目标尺寸（瓦片尺寸）
    this.canvas.width = this.tileWidth;
    this.canvas.height = this.tileHeight;

    this.window = window || [0, 0, 1, 1];

    let ids = this.getExpressionIds();

    if (this.gl) {
      this.renderWebGL(dataset, ids);
    } else if (this.ctx) {
      this.render2D(dataset);
    }
  }

  private getExpressionIds(): string[] | null {
    if (!this.expressionAst) return null;

    const idsSet = new Set<string>();
    const getIds = (node: any) => {
      if (typeof node === 'string') {
        idsSet.add(node.replace(/[+-]/g, ''));
      }
      if (typeof node.lhs === 'string') {
        idsSet.add(node.lhs.replace(/[+-]/g, ''));
      } else if (typeof node.lhs === 'object') {
        getIds(node.lhs);
      }
      if (typeof node.rhs === 'string') {
        idsSet.add(node.rhs.replace(/[+-]/g, ''));
      } else if (typeof node.rhs === 'object') {
        getIds(node.rhs);
      }
    };
    getIds(this.expressionAst);
    return Array.from(idsSet);
  }

  private renderWebGL(dataset: any, ids: string[] | null) {
    const gl = this.gl!;
    gl.viewport(0, 0, this.tileWidth, this.tileHeight);

    const program = this.getOrCreateProgram(ids);
    if (!program) {
      console.error('Failed to create WebGL program');
      return;
    }

    gl.useProgram(program);

    this.setupTextures(program, ids, dataset);
    this.setupUniforms(program);
    this.setupAttributes(program);

    // Draw the rectangle
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  private getOrCreateProgram(ids: string[] | null): WebGLProgram | null {
    if (!this.expressionAst) {
      return this.program;
    }

    const exprKey = JSON.stringify(this.expressionAst);
    if (this.programCache[exprKey]) {
      return this.programCache[exprKey];
    }

    const fragmentShader = this.createFragmentShader(ids);
    const program = createProgram(this.gl!, vertexShaderSource, fragmentShader);

    if (program) {
      this.programCache[exprKey] = program;
      return program;
    } else {
      console.error('Failed to create WebGL program');
      return null;
    }
  }

  private createFragmentShader(ids: string[] | null): string {
    const baseShader = `
      precision mediump float;
      uniform sampler2D u_textureScale;
      uniform vec2 u_sourceSize;
      uniform vec2 u_targetSize;
      uniform vec2 u_domain;
      uniform vec2 u_display_range;
      uniform bool u_apply_display_range;
      uniform float u_noDataValue;
      uniform bool u_clampLow;
      uniform bool u_clampHigh;
      uniform int u_interpolationMethod;
      uniform float u_buffer;
      varying vec2 v_texCoord;
      varying vec2 v_sourceTexCoord;

      bool isNoData(float value) {
        return (value == u_noDataValue) || (value != value);
      }

      float getValue(sampler2D texture, vec2 point) {
        vec2 effectiveSize = u_sourceSize - 2.0 * u_buffer;
        vec2 adjustedPoint = (point * effectiveSize + u_buffer) / u_sourceSize;
        
        if (any(lessThan(adjustedPoint, vec2(0.0))) || any(greaterThanEqual(adjustedPoint, vec2(1.0)))) {
          return u_noDataValue;
        }

        vec2 clampedSamplePoint = clamp(adjustedPoint, vec2(0.0), vec2(1.0) - (1.0 / u_sourceSize));

        vec4 sample = texture2D(texture, clampedSamplePoint);

        return sample.r;
      }

      float sampleNearest(sampler2D texture, vec2 uv) {
        vec2 effectiveSize = u_sourceSize - 2.0 * u_buffer;
        vec2 texelCoords = uv * effectiveSize;
        vec2 samplePoint = (texelCoords + 0.5 + u_buffer) / u_sourceSize;
        float value = getValue(texture, samplePoint);
        return value;
      }

      vec4 sampleBilinear(sampler2D texture, vec2 uv) {
        vec2 effectiveSize = u_sourceSize - 2.0 * u_buffer;
        vec2 texelCoords = uv * effectiveSize;
        vec2 f = fract(texelCoords);

        vec2 tl = (floor(texelCoords) + vec2(0.0, 0.0) + u_buffer) / u_sourceSize;
        vec2 tr = (floor(texelCoords) + vec2(1.0, 0.0) + u_buffer) / u_sourceSize;
        vec2 bl = (floor(texelCoords) + vec2(0.0, 1.0) + u_buffer) / u_sourceSize;
        vec2 br = (floor(texelCoords) + vec2(1.0, 1.0) + u_buffer) / u_sourceSize;

        float tlSample = texture2D(texture, tl).r;
        float trSample = texture2D(texture, tr).r;
        float blSample = texture2D(texture, bl).r;
        float brSample = texture2D(texture, br).r;

        float w1 = (1.0 - f.x) * (1.0 - f.y);
        float w2 = f.x * (1.0 - f.y);
        float w3 = (1.0 - f.x) * f.y;
        float w4 = f.x * f.y;

        float value = 0.0;
        float totalWeight = 0.0;

        if (!isNoData(tlSample)) {
          value += tlSample * w1;
          totalWeight += w1;
        }
        if (!isNoData(trSample)) {
          value += trSample * w2;
          totalWeight += w2;
        }
        if (!isNoData(blSample)) {
          value += blSample * w3;
          totalWeight += w3;
        }
        if (!isNoData(brSample)) {
          value += brSample * w4;
          totalWeight += w4;
        }

        if (totalWeight == 0.0) {
          return vec4(u_noDataValue, 0.0, 0.0, 0.0);
        }

        float normalizedValue = value / totalWeight;
        float alpha = totalWeight;

        return vec4(normalizedValue, 0.0, 0.0, alpha);
      }
    `;

    let mainFunction: string;
    if (ids) {
      const expressionReducer = (node: any): string => {
        if (typeof node === 'object') {
          if (node.op === '**') {
            return `pow(${expressionReducer(node.lhs)}, ${expressionReducer(node.rhs)})`;
          }
          if (node.fn) {
            return `(${node.fn}(${expressionReducer(node.lhs)}))`;
          }
          return `(${expressionReducer(node.lhs)} ${node.op} ${expressionReducer(node.rhs)})`;
        } else if (typeof node === 'string') {
          return `${node}_value`;
        }
        return `float(${node})`;
      };

      const compiledExpression = expressionReducer(this.expressionAst);

      mainFunction = `
        void main() {
          ${ids.map((id: string) => `float ${id}_value = sampleBilinear(u_texture_${id}, v_sourceTexCoord).r;`).join('\n')}
          float value = ${compiledExpression};

          if (isNoData(value)) {
            gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
          } else if (u_apply_display_range && (value < u_display_range[0] || value >= u_display_range[1])) {
            gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
          } else if ((!u_clampLow && value < u_domain[0]) || (!u_clampHigh && value > u_domain[1])) {
            gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
          } else {
            float normalisedValue = (value - u_domain[0]) / (u_domain[1] - u_domain[0]);
            vec4 color = texture2D(u_textureScale, vec2(normalisedValue, 0.0));
            gl_FragColor = vec4(color.rgb, color.a);
          }
        }
      `;
    } else {
      mainFunction = `
        void main() {
          vec4 sampledValue;
          
          if (u_interpolationMethod == 0) {
            sampledValue = vec4(sampleNearest(u_textureData, v_sourceTexCoord), 0.0, 0.0, 1.0);
          } else {
            sampledValue = sampleBilinear(u_textureData, v_sourceTexCoord);
          }

          float value = sampledValue.r;
          float alpha = sampledValue.a;

          if (isNoData(value) || alpha == 0.0) {
            gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
          } else if (u_apply_display_range && (value < u_display_range[0] || value >= u_display_range[1])) {
            gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
          } else if ((!u_clampLow && value < u_domain[0]) || (!u_clampHigh && value > u_domain[1])) {
            gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
          } else {
            float normalisedValue = (value - u_domain[0]) / (u_domain[1] - u_domain[0]);
            vec4 color = texture2D(u_textureScale, vec2(normalisedValue, 0.0));
            gl_FragColor = vec4(color.rgb, color.a * alpha);
          }
        }
      `;
    }

    return `
      ${baseShader}
      ${ids ? ids.map((id: string) => `uniform sampler2D u_texture_${id};`).join('\n') : 'uniform sampler2D u_textureData;'}
      ${mainFunction}
    `;
  }

  private setupTextures(program: WebGLProgram, ids: string[] | null, dataset: any) {
    const gl = this.gl!;

    if (ids) {
      gl.uniform1i(gl.getUniformLocation(program, 'u_textureScale'), 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.textureScale);

      ids.forEach((id, index) => {
        const location = index + 1;
        const ds = this.datasetCollection[id];
        if (!ds) {
          throw new Error(`No such dataset registered: '${id}'`);
        }
        gl.uniform1i(gl.getUniformLocation(program, `u_texture_${id}`), location);
        gl.activeTexture(gl[`TEXTURE${location}`]);
        gl.bindTexture(gl.TEXTURE_2D, ds.textureData);
      });
    } else {
      gl.uniform1i(gl.getUniformLocation(program, 'u_textureData'), 0);
      gl.uniform1i(gl.getUniformLocation(program, 'u_textureScale'), 1);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, dataset.textureData);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, this.textureScale);
    }
  }

  private setupUniforms(program: WebGLProgram) {
    const gl = this.gl!;

    gl.uniform2f(gl.getUniformLocation(program, 'u_resolution'), this.tileWidth, this.tileHeight);
    gl.uniform2f(gl.getUniformLocation(program, 'u_sourceSize'), this.currentDataset.width, this.currentDataset.height);
    gl.uniform2f(gl.getUniformLocation(program, 'u_targetSize'), this.tileWidth, this.tileHeight);
    gl.uniform2fv(gl.getUniformLocation(program, 'u_domain'), this.domain);
    gl.uniform2fv(gl.getUniformLocation(program, 'u_display_range'), this.displayRange);
    gl.uniform1i(gl.getUniformLocation(program, 'u_apply_display_range'), +this.applyDisplayRange);
    gl.uniform1i(gl.getUniformLocation(program, 'u_clampLow'), +this.clampLow);
    gl.uniform1i(gl.getUniformLocation(program, 'u_clampHigh'), +this.clampHigh);
    gl.uniform1f(gl.getUniformLocation(program, 'u_noDataValue'), this.noDataValue);
    gl.uniformMatrix3fv(gl.getUniformLocation(program, 'u_matrix'), false, this.matrix);
    gl.uniform4fv(gl.getUniformLocation(program, 'u_window'), this.window);
    gl.uniform1i(gl.getUniformLocation(program, 'u_interpolationMethod'), this.interpolationMethod === 'nearest' ? 0 : 1);
    gl.uniform1f(gl.getUniformLocation(program, 'u_buffer'), this.buffer);
  }

  private setupAttributes(program: WebGLProgram) {
    const gl = this.gl!;

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    if (positionLocation === -1) {
      console.error('Unable to get position attribute location');
      return;
    }

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    setRectangle(gl, 0, 0, this.tileWidth, this.tileHeight);
  }

  private render2D(dataset: any) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    const imageData = ctx.createImageData(w, h);

    const trange = this.domain[1] - this.domain[0];
    const steps = this.colorScaleCanvas.width;
    const csImageData = this.colorScaleCanvas.getContext('2d').getImageData(0, 0, steps, 1).data;
    let alpha: number;

    const data = dataset.data;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w) + x;
        // TODO: Possible increase of performance through use of worker threads?

        let c = Math.floor(((data[i] - this.domain[0]) / trange) * (steps - 1));
        alpha = 255;
        if (c < 0) {
          c = 0;
          if (!this.clampLow) {
            alpha = 0;
          }
        } else if (c > 255) {
          c = 255;
          if (!this.clampHigh) {
            alpha = 0;
          }
        }
        // NaN values should be the only values that are not equal to itself
        if (data[i] === this.noDataValue || data[i] !== data[i]) {
          alpha = 0;
        } else if (this.applyDisplayRange
          && (data[i] < this.displayRange[0] || data[i] >= this.displayRange[1])) {
          alpha = 0;
        }

        const index = ((y * w) + x) * 4;
        imageData.data[index + 0] = csImageData[c * 4];
        imageData.data[index + 1] = csImageData[(c * 4) + 1];
        imageData.data[index + 2] = csImageData[(c * 4) + 2];
        imageData.data[index + 3] = Math.min(alpha, csImageData[(c * 4) + 3]);
      }
    }

    ctx.putImageData(imageData, 0, 0); // at coords 0,0
  }

  /**
   * Render the specified dataset with the current settings.
   * @param {string} id the identifier of the dataset to render.
   */
  renderDataset(id: string, window?: [number, number, number, number]) {
    this.setCurrentDataset(id);
    return this.render(window);
  }

  /**
   * Get the color for the specified value.
   * @param {number} val the value to query the color for.
   * @returns {Array} the 4-tuple: red, green, blue, alpha in the range 0-255.
   */
  getColor(val: number): Array<any> {
    const steps = this.colorScaleCanvas.width;
    const csImageData = this.colorScaleCanvas.getContext('2d')
      .getImageData(0, 0, steps, 1).data;
    const trange = this.domain[1] - this.domain[0];
    let c = Math.round(((val - this.domain[0]) / trange) * steps);
    let alpha = 255;
    if (c < 0) {
      c = 0;
      if (!this.clampLow) {
        alpha = 0;
      }
    }
    if (c > 255) {
      c = 255;
      if (!this.clampHigh) {
        alpha = 0;
      }
    }

    return [
      csImageData[c * 4],
      csImageData[(c * 4) + 1],
      csImageData[(c * 4) + 2],
      alpha,
    ];
  }
  /**
   * Sets a mathematical expression to be evaluated on the plot. Expression can contain mathematical operations with integer/float values, dataset identifiers or GLSL supported functions with a single parameter.
   * Supported mathematical operations are: add '+', subtract '-', multiply '*', divide '/', power '**', unary plus '+a', unary minus '-a'.
   * Useful GLSL functions are for example: radians, degrees, sin, asin, cos, acos, tan, atan, log2, log, sqrt, exp2, exp, abs, sign, floor, ceil, fract.
   * @param {string} expression Mathematical expression. Example: '-2 * sin(3.1415 - dataset1) ** 2'
   */
  setExpression(expression: string) {
    if (!expression || !expression.length) {
      this.expressionAst = null;
    } else {
      this.expressionAst = parseArithmetics(expression);
    }
  }

  setInterpolationMethod(method: 'nearest' | 'bilinear') {
    this.interpolationMethod = method;
  }

  destroy() {
    // 在使用完WebGL上下文后，释放资源
    this.gl?.deleteProgram(this.program);
    this.removeAllDataset();
  }
}

// register the symbols to be exported at the 'global' object (to be replaced by browserify)
export { plot, addColorScale, colorscales, renderColorScaleToCanvas };
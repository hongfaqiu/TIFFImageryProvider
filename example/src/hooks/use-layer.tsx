import { useReducer } from 'react';
import { Toast } from '@douyinfe/semi-ui';

import { MainMapObj } from '@/utils/map';
import preHandleLayer from '@/utils/preHandleLayer';
import createGlobalHook from './create-global-hook';

import type { ImageryLayer } from 'cesium';
import type { Layer } from '@/typings/layer';

type layerType = 'raster' | 'vector' | 'tdtiles' | 'nc';

let layerManageItems: Layer.layerManageItem[] = [];
const AddingKeys: Map<string, boolean> = new Map()
const useLayerHook = () => {

  const initLayers: Layer.layerManageItem[] = [];
  type reducerAction = {
    type: 'add' | 'remove' | 'replace' | 'update';
    item?: Layer.layerManageItem;
    index?: number;
    newState?: Layer.layerManageItem[];
  };

  function reducer(state: Layer.layerManageItem[], action: reducerAction) {
    const { type, item, index, newState } = action;
    switch (type) {
      case 'add':
        if (item === undefined) {
          throw new Error('item is undefined');
        }
        return [item, ...state];
      case 'remove':
        if (item === undefined) {
          throw new Error('index is undefined');
        }
        return state.filter((layer) => layer !== item);
      case 'replace':
        if (newState === undefined) {
          throw new Error('newState is undefined');
        }
        return [...newState];
      case 'update':
        if (index === undefined || item === undefined) {
          throw new Error('index is undefined');
        }
        state[index] = item;
        return [...state];
      default:
        throw new Error();
    }
  }

  const [state, dispatch] = useReducer(reducer, initLayers);

  function showMsg(name: string, motivation: string, bool: boolean = true) {
    if (bool) {
      Toast.success(`${motivation}${name}成功`);
    } else {
      Toast.error(`${motivation}${name}失败`);
    }
  }

  function getLayerById(id: string) {
    const index = layerManageItems?.findIndex((layer) => layer.id === id);
    if (index === -1 || index === undefined) {
      return null;
    }
    return {
      raw: layerManageItems[index],
      index,
    };
  }

  const moveLayerItem = (dragLayer: Layer.layerManageItem, dropLayer: Layer.layerManageItem) => {
    if (!MainMapObj) return false;
    let bool = true;
    bool = MainMapObj.moveLayerByType(dragLayer.layerObj, dropLayer.layerObj);
    if (bool) {
      // 全局变量移动图层
      const originSourceIndex = layerManageItems.findIndex((item) => item.id === dragLayer.id);
      const originTargetIndex = layerManageItems.findIndex((item) => item.id === dropLayer.id);
      const temp = [...layerManageItems];
      const item = temp.splice(originSourceIndex, 1);
      temp.splice(originTargetIndex, 0, item[0]);
      layerManageItems = temp;
      dispatch({
        type: 'replace',
        newState: temp,
      });
    }
    return bool;
  };

  type PropOptions = {
    /** 添加后是否显示 */
    show?: boolean;
    type?: layerType;
    /** 是否显示添加成功/失败信息 */
    showMessage?: boolean;
    /** 添加完成后是否缩放到地图范围，默认不缩放 */
    zoom?: boolean;
    /** 添加到某个id图层下方 */
    topLayerId?: string;
    /** 是否对图层进行后处理, 默认为true */
    preHandle?: boolean;
  };

  /**
   * 添加图层并处理全局变量
   * @param layer 图层元数据
   * @param options 添加参数，是否显示添加成功信息，是否缩放
   * @returns layerManageItem | null
   */
  async function addLayer(layer: Layer.LayerItem, options?: PropOptions) {
    if (!MainMapObj || AddingKeys.get(layer.id)) return null;
    AddingKeys.set(layer.id, true)
    Toast.destroyAll()
    if (!layer || !layer.url) {
      Toast.create({
        type: 'warning',
        content: '图层不能为空',
      });
      return null;
    }
    if (!layer.method) {
      Toast.create({
        type: 'warning',
        content: '图层缺少方法',
      });
      return null;
    }
    const { showMessage = true, zoom, topLayerId } = { ...options };
    if (getLayerById(layer.id)) {
      if (showMessage) {
        Toast.create({
          type: 'warning',
          content: `重复添加图层 ${layer.layerName}`,
        });
      }
      return null;
    }
    try {
      // 预处理
      const ifPreHandle = options?.preHandle ?? true;
      const layerPro = ifPreHandle ? await preHandleLayer(layer) : layer;
      if (!layerPro) return null;
      
      // 添加到地图
      const lay = await MainMapObj.addLayerByMethod(layerPro, zoom);
      console.log(lay?.imageryProvider);
      if (lay) {
        const show = options?.show ?? true;
        const layerItem: Layer.layerManageItem = {
          layerName: layer.layerName,
          id: layer.id,
          layer: layerPro,
          layerObj: lay,
          show,
        };
        MainMapObj.switchLayerShow(layerItem.layerObj, show);
        layerManageItems = [layerItem, ...layerManageItems];
        dispatch({
          type: 'add',
          item: layerItem,
        });
        if (showMessage) {
          showMsg(layer.layerName, '添加');
        }
        if (topLayerId) {
          const topLayer = getLayerById(topLayerId);
          if (topLayer?.raw) moveLayerItem(layerItem, topLayer.raw);
        }
        AddingKeys.set(layer.id, false)
        return layerItem;
      }
      if (showMessage) {
        showMsg(layer.layerName, '添加', false);
      }
    } catch (e) {
      console.error(e);
      if (showMessage) {
        showMsg(layer.layerName, '添加', false);
      }
    }
    AddingKeys.set(layer.id, false)
    return null;
  }

  /**
   * 移除图层
   * @param name 图层名
   * @param options 参数：是否显示提示
   * @returns boolean
   */
  function removeLayer(id: string, options?: PropOptions) {
    if (!MainMapObj) return false;
    if (AddingKeys.get(id)) AddingKeys.delete(id)
    Toast.destroyAll();
    const { showMessage } = { showMessage: true, ...options };
    const layer = getLayerById(id);
    if (layer === null) {
      if (showMessage) {
        Toast.create({
          type: 'error',
          content: '未找到该图层',
        });
      }
      return false;
    }
    const layerName = layer.raw.layerName;
    if (MainMapObj.removeLayerByMethod(layer.raw.layerObj)) {
      layerManageItems = layerManageItems.filter((item) => item !== layer.raw);
      dispatch({
        type: 'remove',
        item: layer.raw,
      });
      if (showMessage) {
        showMsg(layerName, '移除');
      }
      return true;
    }
    if (showMessage) {
      showMsg(layerName, '移除', false);
    }
    return false;
  }

  /**
   * 清除所有图层
   * @param ids 图层id集合
   * @returns 未清除的id集合
   */
  function removeLayerByIds(ids: string[], options?: PropOptions) {
    const { showMessage } = { showMessage: true, ...options };

    const temp: string[] = [];
    Toast.destroyAll()
    if (ids.length === 0) {
      if (showMessage)
        Toast.create({
          type: 'warning',
          content: '没有图层需要移除',
        });
      return temp;
    }
    let i = 0;
    ids.forEach((id) => {
      if (!removeLayer(id, { showMessage: false })) {
        temp.push(id);
      } else {
        i += 1;
      }
    });
    if (showMessage) {
      Toast.create({
        type: 'success',
        content: `成功移除了${i}个图层`,
      });
      if (temp.length > 0) {
        Toast.create({
          type: 'warning',
          content:`剩余${i}个图层移除失败`,
        });
      }
    }
    return temp;
  }

  /**
   * 根据id移动图层,将被移动图层插入到目标图层之后
   * @param sourceId 移动图层的id
   * @param tartgetId 目标图层的id
   * @returns boolean
   */
  const moveLayerById = (sourceId: string, tartgetId: string) => {
    const dragLayer = getLayerById(sourceId);
    const dropLayer = getLayerById(tartgetId);
    if (!dragLayer || !dropLayer) {
      return false;
    }
    return moveLayerItem(dragLayer.raw, dropLayer.raw);
  };

  /**
   *
   * @param type 图层类型 矢量/栅格
   * @returns boolean
   */
  const moveLayer = (
    type: 'raster' | 'vector' | 'tdtiles' | '2d' | '3d',
    sourceIndex: number,
    targetIndex: number,
  ) => {
    if (!MainMapObj) return false;

    // cesium移动图层
    const dragLayer = layerManageItems[sourceIndex];
    const dropLayer = layerManageItems[targetIndex];
    return moveLayerItem(dragLayer, dropLayer);
  };

  function updateLayer(newLayer: Layer.layerManageItem) {
    const layer = getLayerById(newLayer.id);
    if (layer === null) {
      Toast.create({
        type: 'warning',
        content: `未能找到该图层`,
      });
      return;
    }
    layerManageItems[layer.index] = newLayer;
    dispatch({
      type: 'replace',
      newState: [...layerManageItems],
    });
  }

  /**
   * 渲染图层
   * @param id 图层id
   * @param options 渲染配置
   */
  async function renderLayer(
    id: string,
    options: Layer.RenderOptions,
    forceMethod: Layer.LayerMethod | undefined = undefined,
  ) {
    if (!MainMapObj) return false;
    const obj = getLayerById(id);
    if (obj === null) {
      Toast.create({
        type: 'warning',
        content: `未能找到该图层`,
      });
      return false;
    }
    const layerItem = obj.raw;

    const newLayer: Layer.LayerItem = {
      ...layerItem.layer,
      method: (forceMethod ?? layerItem.layer.method) as any,
      renderOptions: options,
    };

    const { method, renderOptions: newRenderOptions } = newLayer;

    if (!newRenderOptions) return false;

    switch (method) {
      case 'cog':
        newLayer.renderOptions = { ...newRenderOptions };
        const newLayerObj = await MainMapObj.reLoadImageLayer(
          layerItem.layerObj as ImageryLayer,
          newLayer,
        );
        console.log(newRenderOptions);
        layerItem.layerObj = newLayerObj;
        break;
      default:
        MainMapObj.updateImageLayer(layerItem.layerObj as ImageryLayer, newRenderOptions);
        break;
    }

    newLayer.renderOptions = newRenderOptions;
    newLayer.method = layerItem.layer.method;
    layerItem.layer = newLayer;
    layerItem.show = true;
    layerManageItems[obj.index] = layerItem;
    dispatch({
      type: 'update',
      item: layerItem,
      index: obj.index,
    });
    return true;
  }

  /**
   * 重置全局变量
   */
  const resetLayerState = () => {
    layerManageItems = [];
    dispatch({
      type: 'replace',
      newState: [],
    });
  };

  return {
    allLayers: state,
    dispatch,
    getLayerById,
    addLayer,
    removeLayer,
    removeLayerByIds,
    moveLayerById,
    moveLayer,
    updateLayer,
    renderLayer,
    resetLayerState,
  };
};

export const LayerHook = createGlobalHook(useLayerHook)
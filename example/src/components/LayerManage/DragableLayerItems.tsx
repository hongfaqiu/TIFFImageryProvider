import { SortableItem, DragHandle, SortableListComp } from '@/components/SortableList';
import React, { useRef } from 'react';
import LayerItemControl from './LayerItemControl';

type DragableLayerItemsProps = {
  layers: Layer.layerManageItem[];
  openDataTable?: (layerItem: Layer.layerManageItem) => void;
  onDrop: (startIndex: number, endIndex: number) => boolean;
  hideTools?: {
    visible?: boolean;
    render?: boolean;
    zoom?: boolean;
    delete?: boolean;
    detailMsg?: boolean;
  };
};

const DragableLayerItems = (props: DragableLayerItemsProps) => {
  const { layers, onDrop, hideTools } = props;

  const componentRef = useRef<HTMLDivElement>(null);

  return (
    <div id="dragableContainer" ref={componentRef}>
      <SortableListComp
        onSortEnd={({ oldIndex, newIndex }) => onDrop(oldIndex, newIndex)}
        useDragHandle
        helperContainer={() => {
          return componentRef.current?.querySelector('.semi-spin-children') || document.body;
        }}
        size="small"
      >
        {layers.map((item, index) => (
          <SortableItem
            key={item.id}
            index={index}
            node={
              <LayerItemControl
                layerItem={item}
                dragHandle={<DragHandle />}
                hideTools={hideTools}
              />
            }
          />
        ))}
      </SortableListComp>
    </div>
  );
};

export default DragableLayerItems;

import React, { ReactNode, useRef, useState } from 'react';
import { List } from '@douyinfe/semi-ui';
import classNames from 'classnames';
import { SortableContainer, SortableContainerProps, SortableElement, SortableHandle } from 'react-sortable-hoc';
import { ListProps } from '@douyinfe/semi-ui/lib/es/list';

import { SvgType, DragIcon } from '../SVGIcons';
import styles from './index.module.scss';

export const DragHandle = SortableHandle<SvgType>((props: SvgType) => <DragIcon {...props} className={classNames(styles.dragHandle, props.className)} />);

export const SortableItem = SortableElement<{ node: React.ReactNode }>(({ node }: { node: React.ReactNode }) => (
  <div>{node}</div>
));

export const SortableListComp = SortableContainer<ListProps<any>>(List);

export interface SortableListProps<T> {
  data: T[];
  onDrop?: (oldIndex: number, newIndex: number, data: T[]) => void;
  renderItem: (item: T) => ReactNode;
  listProps?: ListProps<T> & SortableContainerProps;
  dragHandleProps?: SvgType;
  disDragable?: boolean;
}

const SortableList = <T, >(props: SortableListProps<T>) => {
  const { data, onDrop, renderItem, listProps, dragHandleProps, disDragable } = props;

  const componentRef = useRef<HTMLDivElement>(null);
  const [list, setList] = useState(data);

  const renderDragableItem = (item: T) => {
    return (
      <List.Item className={styles.listItem}>
        {!disDragable && <DragHandle {...dragHandleProps as any} />}
        {renderItem(item)}
      </List.Item>
    );
  };

  const arrayMove = (array: T[], from: number, to: number) => {
    let newArray = array.slice();
    newArray.splice(to < 0 ? newArray.length + to : to, 0, newArray.splice(from, 1)[0]);
    return newArray;
  };

  const onDropFuc = (oldIndex: number, newIndex: number) => {
    let newList = arrayMove(list, oldIndex, newIndex);
    setList(newList);
    onDrop && onDrop(oldIndex, newIndex, newList);
  };

  return (
    <div id="dragableContainer" ref={componentRef}>
      <SortableListComp
        onSortEnd={({ oldIndex, newIndex }) => onDropFuc(oldIndex, newIndex)}
        useDragHandle
        helperContainer={() => {
          return componentRef.current?.querySelector('.semi-spin-children') || document.body;
        }}
        size="small"
        {...listProps}
      >
        {data.map((item, index) => (
          <SortableItem
            key={index}
            index={index}
            node={renderDragableItem(item)}
          />
        ))}
      </SortableListComp>
    </div>
  );
};

export default SortableList;
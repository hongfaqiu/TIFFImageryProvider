import React, { ReactNode, useRef } from 'react';
import { List } from '@douyinfe/semi-ui';
import classNames from 'classnames';
import { SortableContainer, SortableContainerProps, SortableElement, SortableHandle } from 'react-sortable-hoc';
import { ListProps } from '@douyinfe/semi-ui/lib/es/list';

import { SvgType, DragIcon } from '../SVGIcons';
import styles from './index.module.scss';
import useMergedState from '@/hooks/useMergedState';

export const DragHandle = SortableHandle<SvgType>((props: SvgType) => <DragIcon {...props} className={classNames(styles.dragHandle, props.className)} />);

export const SortableItem = SortableElement<{ node: React.ReactNode }>(({ node }: { node: React.ReactNode }) => (
  <div>{node}</div>
));

export const SortableListComp = SortableContainer<ListProps<any>>(List);

export interface SortableListProps<T extends {
  id: string;
}> {
  value: T[];
  onChange?: (value: T[]) => void;
  onDrop?: (oldIndex: number, newIndex: number, data: T[]) => void;
  renderItem: (item: T) => ReactNode;
  listProps?: ListProps<T> & SortableContainerProps;
  dragHandleProps?: SvgType;
  disDragable?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const SortableList = <T extends {
  id: string;
}, >(props: SortableListProps<T>) => {
  const { value, onChange, onDrop, renderItem, listProps, dragHandleProps, disDragable, className, style } = props;

  const componentRef = useRef<HTMLDivElement>(null);
  const [list, setList] = useMergedState([], {
    value,
    onChange
  })

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
    <div id="dragableContainer" className={className} style={style} ref={componentRef}>
      <SortableListComp
        onSortEnd={({ oldIndex, newIndex }) => onDropFuc(oldIndex, newIndex)}
        useDragHandle
        helperContainer={() => {
          return componentRef.current?.querySelector('.semi-spin-children') || document.body;
        }}
        size="small"
        {...listProps}
      >
        {list.map((item, index) => (
          <SortableItem
            key={item.id}
            index={index}
            node={renderDragableItem(item)}
          />
        ))}
      </SortableListComp>
    </div>
  );
};

export default SortableList;
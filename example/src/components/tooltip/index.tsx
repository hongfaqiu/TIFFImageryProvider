import { Tooltip as SemiTooltip } from '@douyinfe/semi-ui';
import { useToggle } from '@/hooks/use-toggle';
import React from 'react';
import { Position } from '@douyinfe/semi-ui/lib/es/tooltip';

interface IProps {
  content: React.ReactNode;
  hideOnClick?: boolean;
  position?: Position;
  children?: React.ReactNode;
}

export const Tooltip: React.FC<IProps> = ({ content, hideOnClick = false, position = 'top', children }) => {
  const [visible, toggleVisible] = useToggle(false);

  return (
    <SemiTooltip visible={visible} content={content} zIndex={10000} trigger={'custom'} position={position} >
      <span
        onMouseEnter={() => {
          toggleVisible(true);
        }}
        onMouseLeave={() => {
          toggleVisible(false);
        }}
        onMouseDown={() => {
          hideOnClick && toggleVisible(false);
        }}
      >
        {children}
      </span>
    </SemiTooltip>
  );
};

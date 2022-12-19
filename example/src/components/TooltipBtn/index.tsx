import cls from "classnames";

import styles from './index.module.scss'

import useMergedState from "@/hooks/useMergedState";
import { Popover } from "@douyinfe/semi-ui";
import { Tooltip } from '@/components/tooltip';
import { Position } from "@douyinfe/semi-ui/lib/es/tooltip";

export type TooltipBtnProps = {
  icon: React.ReactNode;
  component: React.ReactNode;
  toolTip?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (val: boolean) => void;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  placement?: Position
}

const TooltipBtn: React.FC<TooltipBtnProps> = ({
  toolTip, icon, component,
  open, onOpenChange, className, style, onClick,
  placement = 'bottomLeft'
}) => {

  const [visible, setVisible] = useMergedState(false, {
    value: open,
    onChange: onOpenChange
  })

  return (
    <Popover
      zIndex={1000}
      content={
        <div
          className={cls(styles["tooltip-btn-content"],  'hidden-scrollbar')}>
          {component}
        </div>
      }
      trigger="click"
      position={placement}
      visible={visible}
      onVisibleChange={setVisible}
      showArrow
      arrowPointAtCenter
    >
      <div>
        <Tooltip
          content={toolTip}
        >
          <div
            className={cls(styles["tooltip-btn"], className, {
              [styles.active]: visible
            })}
            style={style}
            onClick={() => {
              setVisible(old => !old)
              if(onClick) onClick()
            }}
          >
            {icon}
          </div>
        </Tooltip>
      </div>
    </Popover>
  )
}

export default TooltipBtn;

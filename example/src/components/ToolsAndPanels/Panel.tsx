import classNames from "classnames";

import { CloseIcon } from "../SVGIcons";
import styles from './index.module.scss'

export type PanelProps = {
  open?: boolean;
  title?: React.ReactNode;
  className?: string;
  onClose?: () => void;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

const Panel: React.FC<PanelProps> = ({
  open,
  children,
  title,
  className,
  style,
  onClose
}) => {

  return (
    <div className={classNames(styles["home-panel"], className, open ? styles.show : styles.hide)} style={style}>
      <div className={styles["home-panel-header"]}>
        <div className={styles["home-panel-title"]}>
          {title}
        </div>
        {onClose && (
          <span
            className={styles['home-panel-closebtn']}
            title='关闭'
            onClick={onClose}
          >
            <CloseIcon />
          </span>
        )}
      </div>
      <div className={styles["home-panel-content"]}>
        {children}
      </div>
    </div>
  )
}

export default Panel

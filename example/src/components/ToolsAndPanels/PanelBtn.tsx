import classNames from "classnames";
import styles from './index.module.scss'

export type PanelBtnProps = {
  name: React.ReactNode;
  icon: React.ReactNode;
  active?: boolean;
} & React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>

export const PanelBtn: React.FC<PanelBtnProps> = ({
  name, icon, className, active,
  ...props
}) => {
  return (
    <div
      {...props}
      className={classNames(styles['panel-btn'], className, {
        [styles.active]: active
      })}
    >
      <span className={styles["panel-btn-icon"]}>{icon}</span>
      <div className={styles["panel-btn-name"]}>
        {name}
      </div>
    </div>
  )
}

import React, { useRef } from "react"
import { useSize } from "ahooks";

import Panel from "./Panel";
import { PanelBtn } from "./PanelBtn";
import { LayerIcon } from "../SVGIcons";
import styles from './index.module.scss'
import useSearch from "@/hooks/use-search";
import LayerManage from "../LayerManage";

export type PanelItem<T = string> = {
  key: T;
  name: string;
  icon: React.ReactNode;
  component?: React.ReactNode | null;
}

const ToolsAndPanels: React.FC = () => {
  const [search, setSearch] = useSearch('panel');

  const ref = useRef(null);
  const size = useSize(ref)

  const PanelConfig: PanelItem[] = [
    {
      key: 'layer',
      name: '图层',
      icon: <LayerIcon />,
      component: <LayerManage />,
    },
  ]

  return (
    <div className={styles["tools-and-panels"]} ref={ref}>
      <div>
        <div className={styles['tool-btns']}>
          {
            PanelConfig.map(item => {
              const active = item.key === search
              return (
                <PanelBtn
                  key={item.key}
                  name={item.name}
                  icon={item.icon}
                  className={styles['panel-tool']}
                  onClick={() => {
                    if (item.component) {
                      setSearch(active ? undefined : item.key)
                    }
                  }}
                  active={active}
                />
              )
            })
          }
        </div>

        <div
          className={styles[`tool-panel`]}
        >
          {
            PanelConfig.map(item => {
              const active = item.key === search
              if (!item.component) return null
              return (
                <Panel
                  key={'panel' + item.key}
                  open={active}
                  className={styles.panel}
                  style={{
                    maxHeight: size ? size.height - 200 : `calc(100vh - 200px)`
                  }}
                  onClose={() => setSearch(undefined)}
                  title={item.name}
                >
                  {item.component}
                </Panel>
              )
            })
          }
        </div>
      </div>
    </div>
  )
}

export default ToolsAndPanels

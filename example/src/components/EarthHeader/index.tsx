import React from 'react';

import MapStatus from '../MapStatus';
import { MapSettingIcon } from '../SVGIcons';
import styles from './index.module.scss'
import SettingPanel from '../SettingPanel';
import TooltipBtn from '../TooltipBtn';
import useSearch from '@/hooks/use-search';

export type HeaderBtnType = {
  key: string;
  icon: React.ReactNode;
  component: React.ReactNode;
  name?: React.ReactNode;
}

const BtnsRight: HeaderBtnType[] = [
  {
    key: 'setting',
    icon: <MapSettingIcon />,
    component: <SettingPanel />,
    name: '设置'
  }
]

const EarthHeader = () => {
  const [search, setSearch] = useSearch('panel');
  
  return (
    <div className={styles["earth-header"]}>
      <div className={styles.left}>
      </div>
      <div className={styles["right"]}>
        <MapStatus/>
        <div className={styles["interval-line"]} />
        {
          BtnsRight.map(item => (
            <TooltipBtn
              key={item.key}
              icon={item.icon}
              component={item.component}
              toolTip={item.name}
              placement='bottomRight'
              open={search === item.key}
              onOpenChange={(val) => setSearch(val ? item.key : undefined)}
            />
          ))
        }
      </div>
    </div>
  )
}

export default EarthHeader

import { IconLoading } from "@douyinfe/semi-icons";
import { Spin } from "@douyinfe/semi-ui";

export const defaultLoading = (
  <Spin
    style={{ margin: '0 auto', height: '100%', width: '100%' }}
    indicator={<IconLoading />}
    tip='加载中…'
    size='large'
  />
);
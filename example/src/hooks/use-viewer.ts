import { Viewer } from "cesium";
import { useState } from "react";
import createGlobalHook from "./create-global-hook";


export function useViewer() {
  const [viewer, setViewer] = useState<Viewer>();
  
  return {
    viewer, setViewer
  }
}

export const ViewerHook = createGlobalHook(useViewer)
import { defaultLoading } from "@/components/Loading";
import { NextPage } from "next";
import dynamic from "next/dynamic";

const Earth = dynamic(() => import('@/components/Earth'),
  {
    loading: () => defaultLoading,
    ssr: false
  }
)

const Platform: NextPage = () => {

  return (
    <Earth />
  )
}

export default Platform
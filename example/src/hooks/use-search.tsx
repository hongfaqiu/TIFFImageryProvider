import { useCallback, useMemo } from "react";

import type { Updater } from "./use-state";
import { useRouter } from "next/router";
import createGlobalHook from "./create-global-hook";

let params: Record<string, any> = {}
export const useUrlState = () => {
  const router = useRouter()

  const queryParams = useMemo(() => {
    params = router.query
    return params
  }, [router.query])

  const setQueryParams = useCallback(
    (values: {
      [key: string]: string | undefined
    }) => {
      params = {
        ...params,
        ...values
      }

      for (let k in params) {
        if (params[k] === undefined || params[k] === null)
          delete params[k]
      }
      router.push({
        query: params
      })  

    },
    [queryParams],
  )

  return {
    queryParams,
    setQueryParams
  }
}

export const UrlStateHook = createGlobalHook(useUrlState)

type TSearchValue = string | undefined
type TSetSearch = (nextValue: Updater<TSearchValue>, other?: Record<string, any>) => void
type SearchKeys = 'panel' | 'tool' | 'header' | 'dataset' | 'pos'

const useSearch = (key: SearchKeys): [TSearchValue, TSetSearch] => {
  const { queryParams, setQueryParams } = UrlStateHook.useHook();

  const value = useMemo(() => queryParams[key], [queryParams[key]]) as TSearchValue

  const dispatcher = (updater: Updater<TSearchValue>, other?: Record<string, any>) => {
    let val
    if (typeof updater === 'function') {
      val = updater(value)
    } else {
      val = updater
    }

    setQueryParams({
      [key]: val,
      ...other
    })
  }

  return [
    value,
    dispatcher
  ]
}

export default useSearch

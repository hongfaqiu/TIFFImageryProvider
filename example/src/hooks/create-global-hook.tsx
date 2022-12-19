import React, { createContext, useContext } from 'react';

const EMPTY = Symbol();

export interface ContainerProviderProps<State = void> {
  initialState?: State;
  children: React.ReactNode;
}

interface GlobalHook<Value, State> {
  Provider: React.ComponentType<ContainerProviderProps<State>>;
  useHook: () => Value;
}

function createGlobalHook<Value, State = void>(hook: (...args: any) => Value): GlobalHook<Value, State> {
  const Context = createContext<Value | typeof EMPTY>(EMPTY);

  function Provider(props: any) {
    const value = hook(props.initialState);

    return <Context.Provider value={value}>{props.children}</Context.Provider>;
  }

  function useHook() {
    const value = useContext(Context);
    if (value === EMPTY) {
      throw new Error('You forget to wrap component with<Context.Provider>');
    }
    return value;
  }

  return { Provider, useHook };
}

export default createGlobalHook
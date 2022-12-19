import '../styles/globals.scss';
import App from 'next/app';
import { Theme } from '@/hooks/use-theme';
import { UrlStateHook } from '@/hooks/use-search';

class MyApp extends App {

  render() {
    const { Component, pageProps } = this.props;

    return (
      <UrlStateHook.Provider>
        <Theme.Provider>
          <Component {...pageProps} />
        </Theme.Provider>
      </UrlStateHook.Provider>
    );
  }
}

export default MyApp;

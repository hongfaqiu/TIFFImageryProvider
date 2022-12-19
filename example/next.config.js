/** @type {import('next').NextConfig} */
const semi = require('@douyinfe/semi-next').default({});
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin')
const path = require('path');

const nextConfig = semi({
  webpack: (config, { webpack, dev, isServer }) => {
    config.resolve.plugins.push(new TsconfigPathsPlugin());
    try{
      config.externals.cesium = "Cesium";
    } catch {
      config.externals = {
        cesium: "Cesium",
      };
    }

    if(isServer){
      config.plugins.push(new CopyWebpackPlugin({
        patterns: [{
          from: path.join(__dirname, (dev ? 
            "node_modules/cesium/Build/CesiumUnminified/" :
            "node_modules/cesium/Build/Cesium/")),
          to: path.join(__dirname, "public/cesium"),
        },]
      }));
    }
    config.plugins.push(new webpack.DefinePlugin({
        CESIUM_BASE_URL: JSON.stringify("./cesium"),
    }));
    return config;
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // FIXME: douyinfe 的第三方包存在 ts 类型错误！
  typescript: {
    ignoreBuildErrors: true,
  },
})

module.exports = nextConfig;

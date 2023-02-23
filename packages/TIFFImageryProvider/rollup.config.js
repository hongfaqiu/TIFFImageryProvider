import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import webWorkerLoader from "rollup-plugin-web-worker-loader";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pkg = require("./package.json")

const deps = { ...pkg.dependencies, ...pkg.peerDependencies };
/**
 * @type {import('rollup').RollupOptions}
 */
const config = {
  input: 'src/index.ts',
  output: {
    file: pkg.main,
    sourcemap: true,
    exports: "auto",
  },
  external: Object.keys(deps),
  plugins: [
    resolve(),
    commonjs(),
    typescript(),
    webWorkerLoader({
      inline: true,
      targetPlatform: "browser",
      extensions: ["ts", "js"],
      external: []
    }),
  ]
};

export default config;
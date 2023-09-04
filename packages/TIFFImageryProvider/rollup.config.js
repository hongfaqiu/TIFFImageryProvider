import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import { readFileSync } from 'fs';
import webWorkerLoader from "rollup-plugin-web-worker-loader";
import { createRequire } from "module";
import esbuild from 'rollup-plugin-esbuild';
import path from 'path';
import dts from 'rollup-plugin-dts';

const pkg = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url)).toString(),
);

const deps = { ...pkg.dependencies, ...pkg.peerDependencies };
const external = Object.keys(deps)
/**
 * @type {import('rollup').RollupOptions}
 */
const config = [
  {
    input: 'src/index.ts',
    output: {
      dir: path.dirname(pkg.main),
      name: pkg.main,
      format: 'esm',
      sourcemap: true,
      // preserveModules: true,
    },
    external,
    plugins: [
      webWorkerLoader({
        inline: true,
        targetPlatform: "browser",
        extensions: ["ts", "js"],
        external,
      }),
      esbuild({
        target: 'node14',
      }),
    ]
  }, 
  {
    input: 'src/index.ts',
    output: {
      dir: path.dirname(pkg.types),
      entryFileNames: '[name].d.ts',
      format: 'esm',
    },
    plugins: [dts()],
  },
];

export default config;
import { readFileSync } from 'fs';
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
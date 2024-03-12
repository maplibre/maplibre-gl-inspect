import dts from 'rollup-plugin-dts';
import typescript from '@rollup/plugin-typescript';
import type {RollupOptions} from 'rollup';

const name = 'maplibre-gl-inspect';

const config: RollupOptions[] = [
  {
    input: 'index.ts',
    plugins: [typescript()],
    output: [
      {
        file: `dist/${name}.js`,
        format: 'cjs',
        sourcemap: true,
      },
      {
        file: `dist/${name}.mjs`,
        format: 'es',
        sourcemap: true,
      },
    ],
  },
  {
    input: 'index.ts',
    plugins: [dts()],
    output: {
      file: `dist/${name}.d.ts`,
      format: 'es',
    },
  },
];

export default config;
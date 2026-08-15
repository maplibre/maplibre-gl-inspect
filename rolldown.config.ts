import {defineConfig} from 'rolldown';
import {dts} from 'rolldown-plugin-dts';

const name = 'maplibre-gl-inspect';
const external = ['maplibre-gl'];

export default defineConfig([
  {
    input: 'index.ts',
    external,
    transform: {
      target: 'es2016'
    },
    output: {
      file: `dist/${name}.js`,
      format: 'umd',
      codeSplitting: false,
      sourcemap: true,
      name: 'MaplibreInspect',
      globals: {
        'maplibre-gl': 'maplibregl'
      }
    }
  },
  {
    input: 'index.ts',
    external,
    transform: {
      target: 'es2016'
    },
    output: {
      file: `dist/${name}.mjs`,
      format: 'es',
      codeSplitting: false,
      sourcemap: true
    }
  },
  {
    input: {
      [name]: 'index.ts'
    },
    external,
    plugins: [dts({emitDtsOnly: true})],
    output: {
      dir: 'dist',
      format: 'es',
      codeSplitting: false,
      cleanDir: false
    }
  }
]);

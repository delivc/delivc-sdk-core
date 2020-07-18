import typescript from '@rollup/plugin-typescript'
import pkg from './package.json'

export default {
  input: 'src/index.ts',
  output: [
    {
      file: pkg.module, format: 'esm'
    },
    {
      file: pkg.main, format: 'cjs'
    }
  ],
  plugins: [typescript()]
}

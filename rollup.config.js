// import vue from 'rollup-plugin-vue'
// import json from 'rollup-plugin-json'
import buble from 'rollup-plugin-buble'
import resolve from 'rollup-plugin-node-resolve'
// import commonjs from 'rollup-plugin-commonjs'
// import nodeResolve from 'rollup-plugin-node-resolve'
import cfg from './package.json'

export default {
  input: 'src/index.js',
  output: [{
    file: cfg.browser,
    format: 'umd',
    name: 'raf'
  }, {
    file: cfg.module,
    format: 'es'
  }, {
    file: cfg.cjs,
    format: 'cjs'
  }],
  plugins: [
    buble(),
    resolve({
      module: true
    })
  ]
}

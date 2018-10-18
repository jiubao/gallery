// import vue from 'rollup-plugin-vue'
// import json from 'rollup-plugin-json'
import buble from 'rollup-plugin-buble'
import resolve from 'rollup-plugin-node-resolve'
// import commonjs from 'rollup-plugin-commonjs'
// import nodeResolve from 'rollup-plugin-node-resolve'
import cfg from './package.json'
import embedCSS from 'rollup-plugin-embed-css'

export default {
  input: 'src/index.js',
  output: [{
    file: cfg.browser,
    format: 'umd',
    name: 'gallery'
  }, {
    file: cfg.module,
    format: 'es'
  }, {
    file: cfg.cjs,
    format: 'cjs'
  }],
  external: [
    'swipe-core'
  ],
  plugins: [
    embedCSS({
      mangle: false // true for prod build
    }),
    buble({
      transforms: {
        templateString: false // TODO: not support prod build
      }
    }),
    resolve({
      module: true
    })
  ]
}

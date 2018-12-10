// import vue from 'rollup-plugin-vue'
// import json from 'rollup-plugin-json'
import buble from 'rollup-plugin-buble'
import resolve from 'rollup-plugin-node-resolve'
// import commonjs from 'rollup-plugin-commonjs'
// import nodeResolve from 'rollup-plugin-node-resolve'
import cfg from './package.json'
import embedCSS from 'rollup-plugin-embed-css'
import hash from 'rollup-plugin-hash'

export default [{
  input: 'src/index.js',
  output: [{
    file: cfg.browser,
    format: 'umd',
    name: 'gallery'
  }],
  plugins: [
    embedCSS({
      mangle: false // true for prod build
    }),
    buble({
      objectAssign: 'Object.assign',
      transforms: {
        dangerousTaggedTemplateString: true // https://buble.surge.sh/guide/#unsupported-features
        // templateString: false // not parse tagged template string, and not support prod build
      }
    }),
    resolve({
      module: true
    }),
    hash({
      dest: 'dist/gallery.[hash:4].js',
      replace: true
    })
  ]
}]

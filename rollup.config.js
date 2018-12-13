// import vue from 'rollup-plugin-vue'
// import json from 'rollup-plugin-json'
import buble from 'rollup-plugin-buble'
import resolve from 'rollup-plugin-node-resolve'
// import commonjs from 'rollup-plugin-commonjs'
// import nodeResolve from 'rollup-plugin-node-resolve'
import cfg from './package.json'
import embedCSS from 'rollup-plugin-embed-css'
import { uglify } from "rollup-plugin-uglify"

const banner =
`/*
 * @jiubao/gallery v${cfg.version}
 * (c) 2018-${new Date().getFullYear()} jiubao
 * MIT License
 */`

var env = process.env.target

var isprod = (env === 'prod')

var moduler = {
  input: 'src/index.js',
  output: [{
    file: cfg.module,
    format: 'es',
    banner
  }, {
    file: cfg.cjs,
    format: 'cjs',
    banner
  }],
  external: [
    'swipe-core',
    '@jiubao/raf',
    '@jiubao/passive',
    '@jiubao/link',
    '@jiubao/hook',
    '@jiubao/utils'
  ],
  plugins: [
    embedCSS({
      mangle: isprod, // true for prod build
      classesOnly: true
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
    })
  ]
}

var browser = {
  input: 'src/index.js',
  output: [{
    file: cfg.browser,
    format: 'umd',
    name: 'gallery',
    banner
  }],
  plugins: [
    embedCSS({
      mangle: isprod, // true for prod build
      classesOnly: true
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
    })
  ]
}

if (isprod) {
  browser.plugins.push(uglify({
    output: {
      preamble: banner
    }
  }))
}

export default [moduler, browser]

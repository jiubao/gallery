[![npm][npm]][npm-url]

# gallery
* 18k before gzip

## Demo
* https://jiubao.github.io/gallery/

## Gestures
* tap to open gallery
* swipe to next or previous image
* vertical pan to close
* double tap to zoom in or zoom out
* pinch to zoom in
* pan to drag
* pinch to zoom out or close

## Install
```sh
$ npm install --save @jiubao/gallery
```
```sh
$ yarn add @jiubao/gallery
```
```javascript
// using ES6 modules
import gallery from '@jiubao/gallery/dist/gallery.es'
```

The [UMD](https://github.com/umdjs/umd) build is available on [unpkg](https://unpkg.com):
```html
<script src="https://unpkg.com/@jiubao/gallery"></script>
```

## Usage
```html
<div class="box">
  <img src="./imgs/1.jpg" data-gallery-item alt="">
  <img src="./imgs/2.jpg" data-gallery-item alt="">
  <img src="./imgs/3.jpg" data-gallery-item alt="">
  <img src="./imgs/4.jpg" data-gallery-item alt="">
  <img src="./imgs/5.jpg" data-gallery-item alt="">
</div>
```

```js
import gallery from '@jiubao/gallery/dist/gallery.es'
gallery()
```

## Options

## Methods

## Events

## Event handler arguments

## element interface

## Todos
* add api
* add readme
* need figure out a one step close solution
* quick pan -> move back
* pan trigger swipe
* limit zoom in / out level
* ~~pan right () -> postpan -> tap (out) -> pan left -> post pan: a little slow~~
* ~~pan right () -> postpan -> tap (out) -> pan left -> post pan: super slow~~
* ~~destroy swiper (events, elements)~~
* ~~manage events~~
* ~~manage destroy~~
* ~~support landscape~~
* ~~switch to landscape~~
* ~~multi events on document~~
* ~~destroy & release~~
* ~~zoom out and zoom in: should not close~~
* ~~transparent issue~~
* ~~double and quickly swipe issue~~
* ~~triple tap~~
* ~~pinch trigger postpan~~
* ~~pan does not stop post pan animation~~
* ~~pan out of boundary stop issue~~
* ~~phone & scroll: not in middle issue~~
* ~~after scroll pinch break~~
* ~~pan accelerate & momentum~~
* ~~remove swiper's !important~~
* ~~gap between slides~~
* ~~disable swiper when gesture~~
* ~~disable gesture when swiper~~
* ~~ios / safari support~~
* ~~use js to simulate animation~~
* ~~pinch & pan: pending issue~~
* ~~pinch -> pan: twitter~~
* quick pinch: strange behaviors (bounce back, move far away ...)
* recover postpinch (current use postpan)
* do we need post pinch?
* window.resize: add a temp black bk, remove it after init
* manage zoom
* manage shape
* manage animations
* startSwiper | stopSwiper
* gesture.on: support on an object
* out of screen close animation
* desktop


[npm]: https://img.shields.io/npm/v/@jiubao/gallery.svg
[npm-url]: https://npmjs.com/package/@jiubao/gallery

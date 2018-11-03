import {raf, caf} from '@jiubao/raf'
import { on, off, isFunction, addClass, removeClass } from './utils'
import tpls from './html.js'
import {classes as cls} from './style.css';
import gestureFactory from './gesture.js'

// console.log('the best gallery is coming...')

const applyTranslateScale = (elm, x, y, scale) => elm.style.transform = `translate3d(${x}px,${y}px,0) scale(${scale})`
const applyOpacity = (elm, opacity) => elm.style.opacity = opacity

const html = document.documentElement
const doc_h = () => html.clientHeight
const doc_w = () => html.clientWidth

const showHideAnimationDuration = 333
const showHideComplete = fn => setTimeout(fn, showHideAnimationDuration + 20)
const getRect = elm => elm.getBoundingClientRect()

const getCenterPoint = (p1, p2) => ({x: (p1.x + p2.x) * .5, y: (p1.y + p2.y) * .5})
const square = x => x * x
const distance = (p1, p2) => Math.sqrt(square(p1.x - p2.x) + square(p1.y - p2.y))
const calculateZoomLevel = points => distance(points.current[0], points.current[1]) / distance(points.start[0], points.start[1])

var defaultOptions = {
  selector: 'data-gallery-item',
  dataset: 'galleryItem'
}

function gallery (options) {
  var opts = {
    ...defaultOptions,
    ...options
  }

  var cache = []
  var buildCache = () => {
    cache.splice(0, cache.length)
    document.querySelectorAll(`img[${selector}]`).forEach((img, index) => {
      img.dataset.galleryIndex = index
      var w = img.naturalWidth, h = img.naturalHeight
      cache[index] = { elm: img, w, h, r: w / h }
    })
  }
  const getCacheItem = img => cache[Number(img.dataset.galleryIndex)]
  var thin = false

  var setInitShape = img => {
    var item = getCacheItem(img)
    var docWidth = doc_w(), docHeight = doc_h()
    var thin = (docWidth / docHeight) > item.r
    var w = thin ? docHeight * item.r : docWidth
    var h = thin ? docHeight : docWidth / item.r
    var x = thin ? (docWidth - w) / 2 : 0
    var y = thin ? 0 : (docHeight - h) / 2
    shape.init = {x, y, w, h, z: 1}
    return shape.init
  }
  var emptyshape = () => ({x: 0, y: 0, z: 1, w: 0, h: 0})

  // var x, y, w, h

  var shape = {init: emptyshape(), start: emptyshape(), last: emptyshape(), current: emptyshape()}

  // var gesture = gestureFactory()

  var {selector, dataset} = opts
  // the container
  var div = document.createElement('div')
  document.body.appendChild(div)

  var gallery, wrap, background, freeze = false
  // var offDocClick, offTouchStart, offTouchMove, offTouchEnd
  var offStach = []
  var offs = fn => offStach.push(fn)

  // click document
  offs(on(document, 'click', evt => {
    var target = evt.target
    if (target.tagName === 'IMG' && dataset in target.dataset) {
      buildCache()
      var sizes = setInitShape(target)
      div.innerHTML = tpls.main(target.src, sizes.w, sizes.h, target.dataset.galleryIndex)
      raf(() => init(target))
    }
  }))

  const enableTransition = () => removeClass(gallery, cls.disableTransition)
  const disableTransition = () => addClass(gallery, cls.disableTransition)

  /*
   * events (pan | pinch | press | rotate | swipe | tap)
   * horizontal swipe: flick to next / previous
   * vertical swipe: close gallery
   * spread: zoom in
   * pinch: zoom out and close gallery
   * double tap: zoom in / zoom out based on tap point
   * pan: drag to pan
   * tap: toggle controls
   */
  // var on = () => {}
  // var off = () => {}

  var zoom = ''

  var gallery = {
    // on, off
    destroy
  }

  return gallery

  function destroy () {
    // TODO: leave the first click which is the document click, should be included in the future
    // TODO: remove all events and dom elements in destroy
    offStach.splice(1, offStach.length).forEach(o => o())
  }

  // TODO: reset all private variables
  function init (img) {
    gallery = div.childNodes[1]
    wrap = gallery.querySelector('.' + cls.wrap)
    background = gallery.querySelector('.' + cls.bg)

    var rect = getRect(img)
    disableTransition()
    applyTranslateScale(wrap, rect.left, rect.top, rect.width / shape.init.w)

    var gesture = opts.gesture = window.ges = gestureFactory(wrap)

    // TODO: tap to toggle controls, double tap to zoom in / out
    // offs(on(wrap, 'click', evt => hide(evt.target)))

    offs(gesture.on('single', onsingle))
    offs(gesture.on('double', ondouble))

    offs(gesture.on('scroll', onscroll))
    offs(gesture.on('scrollend', onscrollend))

    // offs(gesture.on('pinchstart', onpinchstart))
    offs(gesture.on('pinch', onpinch))
    offs(gesture.on('pinchend', onpinchend))

    // offs(gesture.on('panstart', onpanstart))
    offs(gesture.on('pan', onpan))
    // offs(gesture.on('panend', onpanend))

    offs(gesture.on('start', onstart))
    offs(gesture.on('move', onmove))
    offs(gesture.on('end', onend))

    gallery.style.display = 'block'
    raf(() => {
      show(img)
    })
  }

  function show (img) {
    // if (freeze) return
    // freeze = true
    enableTransition()
    // var sizes = size(img)

    applyTranslateScale(wrap, shape.init.x, shape.init.y, 1)
    applyOpacity(background, 1)
    showHideComplete(() => freeze = !!disableTransition())
  }

  function hide (img) {
    if (freeze) return
    freeze = true
    enableTransition()
    var rect = getRect(getCacheItem(img).elm)
    // ga('hide.rect', rect)

    applyTranslateScale(wrap, rect.left, rect.top, rect.width / shape.init.w)
    applyOpacity(background, 0)
    showHideComplete(() => {
      freeze = !(gallery.style.display = 'none')
      destroy()
    })
  }

  function onsingle (points, target) {
    ga('single')
    // TODO: trigger wrong
    hide(target)
  }

  function ondouble (points, target) {
    ga('double.zoom: ', zoom)
    if (zoom !== 'out') {
      enableTransition()
      var init = shape.init
      if (zoom === 'in') applyTranslateScale(wrap, init.x, init.y, 1)
      else {
        var {x, y} = limitxy({
          x: init.x * 2 - points.start[0].x,
          y: init.y * 2 - points.start[0].y,
          w: init.w * 2,
          h: init.h * 2
        })
        applyTranslateScale(wrap, x, y, 2)
      }
      showHideComplete(() => disableTransition())
    }
  }

  function onscroll (points, target) {
    // ga('onscroll')
    if (zoom !== '') return
    var yy = points.current[0].y - points.start[0].y
    applyTranslateScale(wrap, shape.init.x, shape.init.y + yy, 1)
    var opacity = 1 - Math.abs(yy * 2 / doc_h())
    applyOpacity(background, opacity > 0 ? opacity : 0)
  }

  function onscrollend (points, target) {
    if (zoom !== '') return
    var yy = Math.abs(points.current[0].y - points.start[0].y)

    if (yy / doc_h() > 1/7) hide(target)
    else {
      enableTransition()
      applyTranslateScale(wrap, shape.init.x, shape.init.y, 1)
      applyOpacity(background, 1)
      showHideComplete(() => disableTransition())
    }
  }

  // function _onstart (points, target) {}
  //
  // function onstartpinch (points, target) {
  //   _onstart(points, target)
  // }

  function onpinch (points, target) {
    // ga('onpinch')

    var zoomLevel = calculateZoomLevel(points) //* pinch.z
    var center1 = getCenterPoint(points.start[0], points.start[1])
    var center2 = getCenterPoint(points.current[0], points.current[1])

    var dx = center2.x - (center1.x - shape.start.x) * zoomLevel
    var dy = center2.y - (center1.y - shape.start.y) * zoomLevel

    var _zoom = zoomLevel * shape.start.z
    zoom = _zoom > 1 ? 'in' : (_zoom < 1 ? 'out' : '')
    applyTranslateScale(wrap, dx, dy, _zoom)
    if (zoom === 'out') {
      var rect = getRect(getCacheItem(target).elm)
      // ga((shape.current.w - rect.width) / (shape.init.w - rect.width))
      shape.start.z <= 1 && applyOpacity(background, (shape.current.w - rect.width) / (shape.init.w - rect.width))
    }
  }

  // TODO: 缩小露底问题
  function onpinchend(points, target) {
    if (zoom === 'out') {
      if (shape.start.z <= 1) hide(target)
      else show(target)
    }
  }

  function onstart(points, target) {
    var rect = getRect(target)
    shape.start.x = shape.last.x = shape.current.x = rect.x
    shape.start.y = shape.last.y = shape.current.y = rect.y
    shape.start.w = shape.last.w = shape.current.w = rect.width
    shape.start.h = shape.last.h = shape.current.h = rect.height
    var _zoom = shape.start.z = shape.last.z = shape.current.z = rect.width / shape.init.w
    zoom = _zoom > 1 ? 'in' : (_zoom < 1 ? 'out' : '')
    // ga('onstart.shape: ', shape)
  }

  function onmove(points, target) {
    // ga('index.onmove')
    var rect = getRect(target)
    shape.current.x = rect.x
    shape.current.y = rect.y
    shape.current.w = rect.width
    shape.current.h = rect.height
    shape.current.z = rect.width / shape.init.w
  }

  function onpanstart(points, target, phase) {
    // ga('panstart: ', shape.start)
  }

  // TODO: fast pan should have a panend animation
  // TODO: 拖拽卡顿
  function onpan(points, target, phase) {
    // ga(zoom)
    // ga('onpan')
    if (zoom === 'in') {
      // ga('zzz')
      // var zoomLevel = calculateZoomLevel(points) //* pinch.z
      // ga(zoomLevel)
      var dx = points.current[0].x - points.start[0].x + shape.start.x
      var dy = points.current[0].y - points.start[0].y + shape.start.y
      // ga({dx, dy})
      // ga('pan: ', {dx, dy, z: shape.start.z})
      applyTranslateScale(wrap, dx, dy, shape.start.z)
    }
  }

  function onend(points, target, phase) {
    if (phase.is('pan') || phase.is('pinch')) {
      if (zoom !== 'in') return

      var current = shape.current
      var {x, y} = limitxy(current)

      if (x === current.x && y === current.y) return

      enableTransition()
      applyTranslateScale(wrap, x, y, current.z)
      showHideComplete(() => disableTransition())
    }
  }

  function limitxy (_shape) {
    var {x, y, w, h} = _shape
    var dw = doc_w(), dh = doc_h()

    if (dw > w) x = (dw - w) / 2
    else if (x > 0) x = 0
    else if (x < dw - w) x = dw - w

    if (dh > h) y = (dh - h) / 2
    else if (y > 0) y = 0
    else if (y < dh - h) y = dh - h

    return {x, y}
  }
}

export default gallery

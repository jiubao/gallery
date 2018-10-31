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

  // var gesture = gestureFactory()

  var {selector, dataset} = opts
  var cache = []
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
      document.querySelectorAll(`img[${selector}]`).forEach((item, index) => {
        item.dataset.galleryIndex = index
        var w = item.naturalWidth, h = item.naturalHeight
        cache[index] = { elm: item, w, h, r: w / h }
      })
      var sizes = size(target)
      div.innerHTML = tpls.main(target.src, sizes.w, sizes.h, target.dataset.galleryIndex)
      raf(() => init(target, sizes))
    }
  }))

  // click
  // items.forEach(item => on(item, 'click', evt => {
  //   show(evt.target)
  // }))

  const getCacheItem = img => cache[Number(img.dataset.galleryIndex)]

  const size = img => {
    var item = getCacheItem(img)
    var docWidth = doc_w(), docHeight = doc_h()
    var thin = (docWidth / docHeight) > item.r
    w = thin ? docHeight * item.r : docWidth
    h = thin ? docHeight : docWidth / item.r
    x = thin ? (docWidth - w) / 2 : 0
    y = thin ? 0 : (docHeight - h) / 2
    shape.init = {x, y, w, h, z: 1}
    return {w, h, x, y}
  }

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

  var shapeit = () => ({x: 0, y: 0, z: 1, w: 0, h: 0})

  var x, y, w, h

  var pinch = {x: 0, y: 0, z: 1}
  var pan = {x: 0, y: 0}
  // var shape = {x: 0, y: 0, z: 1}
  var shape = {init: shapeit(), start: shapeit(), last: shapeit(), current: shapeit()}

  var zoom = ''

  var gallery = {
    // on, off
    destroy: () => {
      // unbind document click
      // offDocClick()
      // offTouchStart()
      // offTouchMove()
      // offTouchEnd()
      offStach.forEach(o => o())
    }
  }

  return gallery

  function init (img, sizes) {
    var rect = getRect(img)
    gallery = div.childNodes[1]
    wrap = gallery.querySelector('.' + cls.wrap)
    background = gallery.querySelector('.' + cls.bg)
    disableTransition()
    applyTranslateScale(wrap, rect.left, rect.top, rect.width / sizes.w)

    var gesture = opts.gesture = window.ges = gestureFactory(wrap)

    offs(on(wrap, 'click', evt => hide(evt.target)))

    offs(gesture.on('scroll', onscroll))
    offs(gesture.on('scrollend', onscrollend))
    // offs(gesture.on('startpinch', onstartpinch))
    offs(gesture.on('pinch', onpinch))
    offs(gesture.on('pinchstart', onpinchstart))
    offs(gesture.on('pinchend', onpinchend))
    offs(gesture.on('pan', onpan))
    offs(gesture.on('panstart', onpanstart))
    offs(gesture.on('start', onstart))

    gallery.style.display = 'block'
    raf(() => {
      show(img)
    })
  }

  function show (img) {
    if (freeze) return
    freeze = true
    enableTransition()
    var sizes = size(img)

    applyTranslateScale(wrap, sizes.x, sizes.y, 1)
    applyOpacity(background, 1)
    showHideComplete(() => freeze = !!disableTransition())
  }

  function hide (img) {
    if (freeze) return
    freeze = true
    enableTransition()
    var rect = getRect(getCacheItem(img).elm)
    ga('hide.rect', rect)

    applyTranslateScale(wrap, rect.left, rect.top, rect.width / shape.init.w)
    applyOpacity(background, 0)
    showHideComplete(() => freeze = !(gallery.style.display = 'none'))
  }

  function onscroll (points, target) {
    if (zoom !== '') return
    var yy = points.current[0].y - points.start[0].y
    applyTranslateScale(wrap, x, y + yy, 1)
    var opacity = 1 - Math.abs(yy * 2 / doc_h())
    applyOpacity(background, opacity > 0 ? opacity : 0)
  }

  function onscrollend (points, target) {
    if (zoom !== '') return
    var yy = Math.abs(points.current[0].y - points.start[0].y)

    if (yy / doc_h() > 1/7) hide(target)
    else {
      enableTransition()
      applyTranslateScale(wrap, x, y, 1)
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
    var zoomLevel = calculateZoomLevel(points) //* pinch.z
    zoom = zoomLevel > 1 ? 'in' : (zoomLevel < 1 ? 'out' : '')
    var center1 = getCenterPoint(points.start[0], points.start[1])
    var center2 = getCenterPoint(points.current[0], points.current[1])

    var dx = center2.x - (center1.x - pinch.x) * zoomLevel
    var dy = center2.y - (center1.y - pinch.y) * zoomLevel
    applyTranslateScale(wrap, dx, dy, zoomLevel * pinch.z)
  }

  function onpinchstart(points, target) {
    var rect = getRect(target)
    pinch.x = rect.x
    pinch.y = rect.y
    pinch.z = rect.width / w
  }

  function onpinchend(points, target) {
    if (zoom === 'out') {
      try {
        hide(target)
      } catch (e) {
        ga('pinchend.e: ', e)
      }
    }
  }

  function onstart(points, target) {
    // g(target)
    var rect = getRect(target)
    shape.start.x = rect.x
    shape.start.y = rect.y
    shape.start.w = rect.width
    shape.start.h = rect.height
    shape.start.z = rect.width / w
  }

  function onpanstart(points, target, phase) {
    // ga('panstart: ', shape.start)
  }

  function onpan(points, target, phase) {
    // ga(zoom)
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
}

export default gallery

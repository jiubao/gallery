import {raf, caf} from '@jiubao/raf'
import { on, off, isFunction, addClass, removeClass, doc_w, doc_h } from './utils'
import tpls from './html.js'
import {classes as cls} from './style.css'
import gestureFactory from './gesture.js'
import swiper from 'swipe-core'

// console.log('the best gallery is coming...')

const applyTranslateScale = (elm, x, y, scale) => elm.style.transform = `translate3d(${x}px,${y}px,0) scale(${scale})`
const applyOpacity = (elm, opacity) => elm.style.opacity = opacity

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

  var {selector, dataset} = opts

  var cache = []
  var buildCache = () => {
    cache.splice(0, cache.length)
    document.querySelectorAll(`img[${selector}]`).forEach((img, index) => {
      img.dataset.galleryIndex = index
      var w = img.naturalWidth, h = img.naturalHeight
      cache[index] = { elm: img, w, h, r: w / h, src: img.src, i: index }
      cache[index].shape = getInitShape(img)
    })
  }
  const getCacheItem = img => cache[Number(img.dataset.galleryIndex)]
  var thin = false

  var getInitShape = img => {
    var item = getCacheItem(img)
    var docWidth = doc_w(), docHeight = doc_h()
    var thin = (docWidth / docHeight) > item.r
    var w = thin ? docHeight * item.r : docWidth
    var h = thin ? docHeight : docWidth / item.r
    var x = thin ? (docWidth - w) / 2 : 0
    var y = thin ? 0 : (docHeight - h) / 2

    return {x, y, w, h, z: 1}
  }

  const emptyshape = () => ({x: 0, y: 0, z: 1, w: 0, h: 0})

  var shape = {init: emptyshape(), start: emptyshape(), last: emptyshape(), current: emptyshape()}

  // the container
  var div = document.createElement('div')
  document.body.appendChild(div)

  var gallery, wrap, background, freeze = false
  var swiperDom, swiperInstance
  var offStach = []
  var offs = fn => offStach.push(fn)

  // click document
  offs(on(document, 'click', evt => {
    var target = evt.target
    if (target.tagName === 'IMG' && dataset in target.dataset) {
      buildCache()
      // var sizes = setInitShape(target)
      var item = getCacheItem(target)
      shape.init = item.shape
      div.innerHTML = tpls.main(cache)
      raf(() => init(item))
    }
  }))

  const enableTransition = () => removeClass(gallery, cls.disableTransition)
  const disableTransition = () => addClass(gallery, cls.disableTransition)

  const stopSwiper = () => swiperInstance.stop()
  const startSwiper = () => swiperInstance.start()

  const setShape = (target, key) => {
    var rect = getRect(target)
    shape[key].x = rect.x
    shape[key].y = rect.y
    shape[key].w = rect.width
    shape[key].h = rect.height
    shape[key].z = rect.width / shape.init.w
  }

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
  var swiping = false
  var animations = {
    pan: 0
  }
  const clearAnimations = () => {
    caf(animations.pan)
  }

  // var occupy = 'idle' // idle, swipe, gesture

  const postpan = (boundary, target, x, y, dx, dy) => {
    var runtime = {
      phase: 'D', // D: deceleration, O: outofboundary, B: debounce, Z: stop
      ba: 0, // lower limit boundary
      bz: 0, // upper limit boundary
      oa: false, // out of lower limit
      oz: false, // out of upper limit
      start: 0, // debounce start
      now: 0, // debounce current
      interval: 0, // debounce interval
      from: 0, // debounce from
      to: 0, // debounce to

      v: 0, // x | y
      dv: 0, // dx | dy
      r: 1 // right|down: 1, left|up: -1
    }

    var it = {
      x: {...runtime, v: x, dv: Math.abs(dx), r: dx > 0 ? 1 : -1, ba: boundary.x1, bz :boundary.x2},
      y: {...runtime, v: y, dv: Math.abs(dy), r: dy > 0 ? 1 : -1, ba: boundary.y1, bz: boundary.y2}
    }
    const ease = k => --k * k * k + 1

    const deceleration = axis => {
      var iz = it[axis]
      if (iz.phase !== 'D') return

      iz.dv *= .95
      if (iz.dv <= .5) {
        iz.dv = 0
        iz.phase = 'Z'
        return
      }

      iz.v += iz.dv * iz.r
      iz.oa = iz.v <= iz.ba && !~iz.r
      iz.oz = iz.v >= iz.bz && !!~iz.r

      if (iz.oa || iz.oz) iz.phase = 'O'
    }

    const out = axis => {
      var iz = it[axis]
      if (iz.phase !== 'O') return

      iz.dv = iz.dv * .8
      if (iz.dv <= .5) {
        iz.phase = 'B'
        iz.start = Date.now()
        iz.from = iz.v
        iz.to = iz.oz ? iz.bz : iz.ba
        var interval = 1000 * Math.abs(iz.to - iz.from) / doc_w()
        if (interval > 500) interval = 500
        else if (interval < 150) interval = 150
        iz.interval = interval
      } else {
        iz.v += iz.dv * iz.r
      }
    }

    const debounce = axis => {
      var iz = it[axis]
      if (iz.phase !== 'B') return

      iz.now = Date.now()
      var during = iz.now - iz.start
      if (during >= iz.interval) {
        iz.v = iz.to
        iz.phase = 'Z'
      }
      iz.v = (iz.to - iz.from) * ease(during / iz.interval) + iz.from
    }

    ~function loop () {
      deceleration('x')
      deceleration('y')
      out('x')
      out('y')
      debounce('x')
      debounce('y')
      applyTranslateScale(wrap, it.x.v, it.y.v, shape.current.z)

      if (it.x.phase !== 'Z' || it.y.phase !== 'Z') raf(loop)
    }()

    // const stack = [
    //   () => deceleration('x'),
    //   () => deceleration('y'),
    //   () => out('x'),
    //   () => out('y'),
    //   () => debounce('x'),
    //   () => debounce('y'),
    //   () => applyTranslateScale(wrap, it.x.v, it.y.v, shape.current.z)
    // ]
    //
    // ~function loop2 () {
    //   animations.pan = raf(loop2)
    //   stack.forEach(fn => fn())
    // }()
  }

  const handlers = {
    single: (points, target) => {
      ga('single')
      // TODO: trigger wrong
      hide(target)
    },
    double: (points, target) => {
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
        showHideComplete(() => {
          disableTransition()
          zoom === 'in' && startSwiper()
        })
      }
    },

    scroll: (points, target) => {
      // ga('onscroll')
      stopSwiper()
      if (zoom !== '') return
      var yy = points.current[0].y - points.start[0].y
      applyTranslateScale(wrap, shape.init.x, shape.init.y + yy, 1)
      var opacity = 1 - Math.abs(yy * 2 / doc_h())
      applyOpacity(background, opacity > 0 ? opacity : 0)
    },
    scrollend: (points, target) => {
      if (zoom !== '') return
      var yy = Math.abs(points.current[0].y - points.start[0].y)

      if (yy / doc_h() > 1/7) hide(target, startSwiper)
      else {
        enableTransition()
        applyTranslateScale(wrap, shape.init.x, shape.init.y, 1)
        applyOpacity(background, 1)
        showHideComplete(() => {disableTransition(); startSwiper()})
      }
    },

    pinch: (points, target) => {
      // ga('onpinch')
      stopSwiper()

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
    },

    // TODO: 缩小露底问题
    pinchend: (points, target) => {
      if (zoom === 'out') {
        if (shape.start.z <= 1) hide(target, startSwiper)
        else show(target, startSwiper)
      }
    },

    // TODO: fast pan should have a panend animation
    // TODO: 拖拽卡顿
    pan: (points, target, phase) => {
      // ga(zoom)
      // ga('onpan')
      if (zoom === 'in') {
        stopSwiper()
        // ga('zzz')
        // var zoomLevel = calculateZoomLevel(points) //* pinch.z
        // ga(zoomLevel)
        var dx = points.current[0].x - points.start[0].x + shape.start.x
        var dy = points.current[0].y - points.start[0].y + shape.start.y
        // ga({dx, dy})
        // ga('pan: ', {dx, dy, z: shape.start.z})
        applyTranslateScale(wrap, dx, dy, shape.start.z)
      }
    },

    panend: (points, target, phase) => {
      console.log('pan end...')
		  // TODO: Avoid acceleration animation if speed is too low

      // TODO: accelerate
      var dx = points.current[0].x - points.last[0].x
      var dy = points.current[0].y - points.last[0].y

      var right = dx > 0 ? 1 : -1
      var down = dy > 0 ? 1 : -1

      var _dx = Math.abs(dx)
      var _dy = Math.abs(dy)

      if (zoom === 'in' && (_dx >= 0.3 || _dy >= 0.3)) {
        var xx = points.current[0].x - points.start[0].x + shape.start.x
        var yy = points.current[0].y - points.start[0].y + shape.start.y

        // if (Math.abs(dx) > 40) dx = 40 * right
        // if (Math.abs(dy) > 40) dy = 40 * down

        postpan(xyBoundary(shape.current), target, xx, yy, dx * 2, dy * 2)
      }
    },

    start: (points, target) => {
      clearAnimations()
      var rect = getRect(target)
      shape.start.x = shape.last.x = shape.current.x = rect.x
      shape.start.y = shape.last.y = shape.current.y = rect.y
      shape.start.w = shape.last.w = shape.current.w = rect.width
      shape.start.h = shape.last.h = shape.current.h = rect.height
      var _zoom = shape.start.z = shape.last.z = shape.current.z = rect.width / shape.init.w
      zoom = _zoom > 1 ? 'in' : (_zoom < 1 ? 'out' : '')
      // ga('onstart.shape: ', shape)
    },

    move: (points, target) => {
      setShape(target, 'current')
    }
  }

  Object.keys(handlers).forEach(key => {
    var fn = handlers[key]
    handlers[key] = (...args) => {
      if (!swiping || key === 'double' || key === 'single') fn.apply(null, args)
    }
  })

  var gallery = {
    // on, off
    destroy,
    // get: () => {
    //   return {
    //     swiping,
    //     occupy
    //   }
    // }
  }

  return gallery

  function destroy () {
    // TODO: leave the first click which is the document click, should be included in the future
    // TODO: remove all events and dom elements in destroy
    offStach.splice(1, offStach.length).forEach(o => o())
  }

  // TODO: reset all private variables
  function init (item) {
    var img = item.elm
    gallery = div.childNodes[1]
    background = gallery.querySelector('.' + cls.bg)
    swiperDom = gallery.querySelector('.' + cls.swiper)

    var rect = getRect(img)
    disableTransition()

    cache.forEach(c => {
      c.wrap = gallery.querySelector(`.${cls.wrap} img[data-gallery-index="${c.i}"]`).parentElement
      if (c.i === item.i) applyTranslateScale(c.wrap, rect.left, rect.top, rect.width / shape.init.w)
      else applyTranslateScale(c.wrap, c.shape.x, c.shape.y, 1)

      var gesture = gestureFactory(c.wrap)

      // TODO: tap to toggle controls, double tap to zoom in / out
      // offs(on(wrap, 'click', evt => hide(evt.target)))

      Object.keys(handlers).forEach(key => offs(gesture.on(key, handlers[key])))
    })

    wrap = item.wrap

    swiperInstance = swiper({
      root: swiperDom,
      elms: Array.prototype.slice.apply(swiperDom.children[0].children),
      auto: false,
      index: item.i,
      expose: true,
      css: true
    })

    swiperInstance.on('move', index => {
      // console.log('swipe.move')
      swiping = true
      // occupy = 'swipe'
    })
    swiperInstance.on('end', index => {
      wrap = cache[index].wrap
      shape.init = cache[index].shape
      swiping = false
      // occupy = ''
    })

    swiping = false
    // occupy = 'idle'

    gallery.style.display = 'block'
    raf(() => {
      show(img)
    })
  }

  function show (img, callback) {
    // if (freeze) return
    // freeze = true
    enableTransition()
    // var sizes = size(img)

    applyTranslateScale(wrap, shape.init.x, shape.init.y, 1)
    applyOpacity(background, 1)
    showHideComplete(() => {
      freeze = !!disableTransition()
      callback && callback()
    })
  }

  function hide (img, callback) {
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
      callback && callback()
    })
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

  function xyBoundary (_shape) {
    var {x, y, w, h} = _shape
    var dw = doc_w(), dh = doc_h()
    var x1,  x2, y1, y2
    if (dw > w) {
      x1 = x2 = (dw - w) / 2
    } else {
      x1 = dw - w
      x2 = 0
    }
    if (dh > h) {
      y1 = y2 = (dh - h) / 2
    } else {
      y1 = dh - h
      y2 = 0
    }
    return {x1, x2, y1, y2}
  }
}

export default gallery

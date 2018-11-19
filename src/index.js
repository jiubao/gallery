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

    // shape.init = {x, y, w, h, z: 1}
    // return shape.init
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
  var swiperDom, swiperInstance
  // var offDocClick, offTouchStart, offTouchMove, offTouchEnd
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
  var callbackStack = []
  const clearStack = () => {callbackStack.forEach(fn => fn()); callbackStack = []}
  // var occupy = 'idle' // idle, swipe, gesture

  const cal_x = (axis, target, boundary, v, dist, direction) => {
    var {tl, rb} = boundary
    dist = dist * .95
    if (dist <= .5) dist = 0
    v += dist * direction

    var rout = v >= rb[axis] && ~direction
    var lout = v <= tl[axis] && !~direction

    if (rout) v = rb[axis]
    else if (lout) v = tl[axis]

    if (rout || lout) dist = 0

    return {v, dist}
  }

  const postpan = (boundary, target, x, y, dx, dy, right, down) => {
    // console.log('R:', xRout, 'L:', xLout, 'T:', yTout, 'B:', yBout)

    // var {x1, x2, y1, y2} = boundary
    //
    // dx = dx * .95
    // if (dx <= .5) dx = 0
    // x += dx * right
    //
    // var xRout = x >= x2 && !!~right
    // var xLout = x <= x1 && !~right
    //
    // if (xRout) x = x2
    // else if (xLout) x = x1
    //
    // if (xRout || xLout) dx = 0
    //
    // dy = dy * .95
    // if (dy <= .5) dy = 0
    // y += dy * down
    //
    // var yTout = y <= y1 && !~down
    // var yBout = y >= y2 && !!~down
    //
    // if (yTout) y = y1
    // else if (yBout) y = y2
    //
    // if (yTout || yBout) dy = 0
    //
    // applyTranslateScale(wrap, x, y, shape.current.z)
    //
    // if (dx === 0 || dy === 0) {
    //   animations.pan = 0
    //   setShape(target, 'current')
    //   // clearStack()
    //   return
    // }

    var phase = {x: 'D', y: 'D'} // D: deceleration, O: outofboundary, B: debounce, Z: stop

    var {x1, x2, y1, y2} = boundary

    var xRout = false, xLout = false, yTout = false, yBout = false
    var speedX = 0, speedY = 0

  // function animate (elm, from, to, interval, onAnimation, callback) {
  //   var start = Date.now()
  //   function loop () {
  //     var now = Date.now()
  //     var during = now - start
  //     if (during >= interval) x = to
  //     isFunction(onAnimation) && onAnimation()
  //     if (during >= interval) {
  //       // moveX(elm, to)
  //       moveEx(elm, to)
  //       !phase.is(phaseEnum.cancel) && isFunction(callback) && callback()
  //       phase.set(phaseEnum.idle)
  //       // return onAnimationEnd(current.$index, current, main, elms)
  //       return onEnd(current.$index, current, main, elms)
  //     }
  //     var distance = (to - from) * easing[ease](during / interval) + from
  //     x = distance
  //     // moveX(elm, distance)
  //     moveEx(elm, x)
  //     animations.main = raf(loop)
  //   }
  //   loop()
  // }

    // const animate (elm, from, to)

    var start = 0, now = 0, interval = 0, from = 0, to = 0
    const ease = k => --k * k * k + 1

    const decelerationX = () => {
      dx = dx * .95
      if (dx <= .5) {
        dx = 0
        phase.x = 'Z'
        return
      }

      x += dx * right

      xRout = x >= x2 && !!~right
      xLout = x <= x1 && !~right

      if (xRout || xLout) {
        phase.x = 'O'
        speedX = dx
      }
    }

    const decelerationY = () => {
      dy = dy * .95
      if (dy <= .5) {
        dy = 0
        phase.y = 'Z'
      }

      y += dy * down

      yTout = y <= y1 && !~down
      yBout = y >= y2 && !!~down

      if (yTout || yBout) phase.y = 'O'
    }

    const outX = () => {
      dx = dx * .7
      if (dx <= .5) {
        dx = speedX / 2
        phase.x = 'B'
        start = Date.now()
        from = x
        to = xRout ? x2 : x1
        interval = Math.abs((to - from) / doc_w()) * 500
        if (interval > 400) interval = 400
        else if (interval < 150) interval = 150
        console.log(interval)
      } else {
        x += dx * right
      }
    }

    const outY = () => {}

    const debounceX = () => {
      // dx = dx
      // x += dx * -right
      // if (xRout && x <= x2) {
      //   x = x2
      //   phase.x = 'Z'
      // } else if (xLout && x >= x1) {
      //   x = x1
      //   phase.x = 'Z'
      // }
      // console.log('z...')

      now = Date.now()
      var during = now - start
      if (during >= interval) {
        x = to
        phase.x = 'Z'
      }
      x = (to - from) * ease(during / interval) + from
    }

    const debounceY = () => {}

    const loop = () => {
      if (phase.x === 'D') decelerationX()
      else if (phase.x === 'O') outX()
      else if (phase.x === 'B') debounceX()

      if (phase.y === 'D') decelerationY()
      else if (phase.y === 'O') outY()
      else if (phase.y === 'B') debounceY()

      applyTranslateScale(wrap, x, y, shape.current.z)

      if (phase.x !== 'Z' || phase.y !== 'Z') animations.pan = raf(loop)
    }

    loop()
  }

  const panloop = (boundary, target, xx, yy, dx, dy, right, down) => {
    var {x1, x2, y1, y2} = boundary

    dx = Math.abs(dx) * .9
    dy = Math.abs(dy) * .9
    if (dx <= 0.5) dx = 0
    if (dy <= 0.5) dy = 0

    xx += dx * right
    yy += dy * down

    var xout = xx < x1 || xx > x2
    var yout = yy < y1 || yy > y2

    if (xout) xx -= dx * right

    if (yout) yy -= dy * down

    if ((xout && yout) || (dx === 0 && dy === 0)) {
      animations.pan = 0
      setShape(target, 'current')
      clearStack()
      return
    }

    applyTranslateScale(wrap, xx, yy, shape.start.z)
    // console.log(dx * right, dy * down)
    animations.pan = raf(() => panloop(boundary, target, xx, yy, dx * right, dy * down, right, down))
  }

  const bounceBack = () => {
    var current = shape.current
    var {x, y} = limitxy(current)

    if (x === current.x && y === current.y) return

    enableTransition()
    applyTranslateScale(wrap, x, y, current.z)
    showHideComplete(() => disableTransition())
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

      dx = Math.abs(dx)
      dy = Math.abs(dy)

      if (zoom === 'in' && (dx >= 0.3 || dy >= 0.3)) {
        var xx = points.current[0].x - points.start[0].x + shape.start.x
        var yy = points.current[0].y - points.start[0].y + shape.start.y

        // if (Math.abs(dx) > 40) dx = 40 * right
        // if (Math.abs(dy) > 40) dy = 40 * down

        // console.log('boundary:', xyBoundary(shape.current))
        postpan(xyBoundary(shape.current), target, xx, yy, dx * 2, dy * 2, right, down)
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
      // ga('index.onmove')
      // var rect = getRect(target)
      // shape.current.x = rect.x
      // shape.current.y = rect.y
      // shape.current.w = rect.width
      // shape.current.h = rect.height
      // shape.current.z = rect.width / shape.init.w
      setShape(target, 'current')
    },

    end: (points, target, phase) => {
      if (phase.is('pan') || phase.is('pinch')) {
        if (zoom !== 'in') return

        // var current = shape.current
        // var {x, y} = limitxy(current)
        //
        // if (x === current.x && y === current.y) return
        //
        // enableTransition()
        // applyTranslateScale(wrap, x, y, current.z)
        // showHideComplete(() => disableTransition())

        // if (animations.pan) callbackStack.push(bounceBack)
        // else bounceBack()
      }
    }

    // swipe: () => {
    //   swiping = true
    // }
  }

  Object.keys(handlers).forEach(key => {
    var fn = handlers[key]
    handlers[key] = (...args) => {
      // console.log('event: ', key)
      // console.log('swiping', swiping)
      // if (!swiping || key === 'double') fn.apply(null, args)
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

      // offs(gesture.on('single', handlers.onsingle))
      // offs(gesture.on('double', handlers.ondouble))
      //
      // offs(gesture.on('scroll', handlers.onscroll))
      // offs(gesture.on('scrollend', handlers.onscrollend))
      //
      // // offs(gesture.on('pinchstart', onpinchstart))
      // offs(gesture.on('pinch', handlers.onpinch))
      // offs(gesture.on('pinchend', handlers.onpinchend))
      //
      // // offs(gesture.on('panstart', onpanstart))
      // offs(gesture.on('pan', handlers.onpan))
      // // offs(gesture.on('panend', onpanend))
      //
      // offs(gesture.on('start', handlers.onstart))
      // offs(gesture.on('move', handlers.onmove))
      // offs(gesture.on('end', handlers.onend))
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

    // // var gesture = opts.gesture = window.ges = gestureFactory(wrap)
    // var gesture = gestureFactory(wrap)
    //
    // // TODO: tap to toggle controls, double tap to zoom in / out
    // // offs(on(wrap, 'click', evt => hide(evt.target)))
    //
    // offs(gesture.on('single', onsingle))
    // offs(gesture.on('double', ondouble))
    //
    // offs(gesture.on('scroll', onscroll))
    // offs(gesture.on('scrollend', onscrollend))
    //
    // // offs(gesture.on('pinchstart', onpinchstart))
    // offs(gesture.on('pinch', onpinch))
    // offs(gesture.on('pinchend', onpinchend))
    //
    // // offs(gesture.on('panstart', onpanstart))
    // offs(gesture.on('pan', onpan))
    // // offs(gesture.on('panend', onpanend))
    //
    // offs(gesture.on('start', onstart))
    // offs(gesture.on('move', onmove))
    // offs(gesture.on('end', onend))

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

  // function _onstart (points, target) {}
  //
  // function onstartpinch (points, target) {
  //   _onstart(points, target)
  // }

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

import {raf, caf} from '@jiubao/raf'
import { on, off, isFunction, addClass, removeClass, doc_w, doc_h, prevent, isArray, camelCase } from './utils'
import tpls from './html.js'
import {classes as cls} from './style.css'
import gestureFactory from './gesture.js'
import swiper from 'swipe-core'
import eventFactory from './event'

/*
 * animations
 *    1. show / hide
 *    2. post pan / pinch
 *    3. double tap
 *    4. opacity
 *    5. scroll end
 */

// console.log('the best gallery is coming...')
const easing = {
  'cubic': k => --k * k * k + 1,
  // quart: k => 1 - Math.pow(1 - k, 4), // 1 - --k * k * k * k,
  // quint: k => 1 - Math.pow(1 - k, 5),
  // expo: k => k === 1 ? 1 : 1 - Math.pow(2, -10 * k),
  'circ': k => Math.sqrt(1 - Math.pow(k - 1, 2))
}

const applyTranslateScale = (elm, x, y, scale) => elm.style.transform = `translate3d(${x}px,${y}px,0) scale(${scale})`
const applyOpacity = (elm, opacity) => elm.style.opacity = opacity

const showHideAnimationDuration = 333
const showHideComplete = fn => setTimeout(fn, showHideAnimationDuration + 20)
const getRect = elm => elm.getBoundingClientRect()

const getCenterPoint = (p1, p2) => ({x: (p1.x + p2.x) * .5, y: (p1.y + p2.y) * .5})
const getCenter = ps => type => getCenterPoint(ps[type][0], ps[type][1])
const square = x => x * x
const distance = (p1, p2) => Math.sqrt(square(p1.x - p2.x) + square(p1.y - p2.y))
const calculateZoomLevel = points => distance(points.current[0], points.current[1]) / distance(points.start[0], points.start[1])

const preventDefault = prevent()

var defaultOptions = {
  selector: 'data-gallery-item'
}

function gallery (options) {
  var opts = {
    ...defaultOptions,
    ...options
  }

  var {selector} = opts
  var dataset = camelCase(selector)
  var instance = Object.create(new eventFactory())

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

  var getInitShape = img => {
    var item = getCacheItem(img)
    var docWidth = doc_w(), docHeight = doc_h()
    var thin = (docWidth / docHeight) > item.r
    var w = thin ? docHeight * item.r : docWidth
    var h = thin ? docHeight : docWidth / item.r
    var x = thin ? (docWidth - w) / 2 : 0
    var y = thin ? 0 : (docHeight - h) / 2

    return {x, y, w, h, z: 1, t: thin}
  }

  const emptyshape = () => ({x: 0, y: 0, z: 1, w: 0, h: 0})

  var shape = {init: emptyshape(), start: emptyshape(), last: emptyshape(), current: emptyshape()}
  const thin = () => shape.init.t

  // the container
  var div = document.createElement('div')
  document.body.appendChild(div)

  var gallery, wrap, background, freeze = false, opacity = 0
  var swiperDom, swiperInstance
  var offStack = []
  var moreStack = []
  var offs = fn => offStack.push(fn)

  // click document
  const onshow = img => {
    buildCache()
    if (!cache.length) return
    if (!img) img = cache[0].elm
    var item = getCacheItem(img)
    shape.init = item.shape
    div.innerHTML = tpls.main(cache)
    raf(() => init(item))
  }
  moreStack.push(on(document, 'click', evt => {
    var target = evt.target
    if (target.tagName === 'IMG' && dataset in target.dataset) {
      onshow(target)
    }
  }))

  const stopSwiper = () => {swiping = false; swiperInstance.stop()}
  const startSwiper = () => swiperInstance.start()

  const setShape = (target, key) => {
    var rect = getRect(target)

    var setByKey = key => {
      shape[key].x = rect.x
      shape[key].y = rect.y
      shape[key].w = rect.width
      shape[key].h = rect.height
      shape[key].z = rect[thin() ? 'height' : 'width'] / shape.init[thin() ? 'h' : 'w']
    }

    isArray(key) ? key.forEach(key => setByKey(key)) : setByKey(key)
  }

  const setShape3 = target => setShape(target, ['start', 'current', 'last'])

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
  var animations = { postpan: 0, main: 0, opacity: 0 }
  const clearAnimations = () => {
    Object.keys(animations).forEach(key => {
      caf(animations[key])
      animations[key] = 0
    })
  }

  // var occupy = 'idle' // idle, swipe, gesture

  const animateDeceleration = (boundary, target, current, last) => {
    // console.log('animateDeceleration')
    var dx = (current.x - last.x) * 2
    var dy = (current.y - last.y) * 2
    // console.log('dx:', dx)
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
      r: 1 // right|down: 1, left|up: -1, freeze: 0
    }

    var _dx = Math.abs(dx), _dy = Math.abs(dy)

    var it = {
      x: {...runtime, v: current.x, dv: _dx, r: !dx ? dx : dx / _dx, ba: boundary.x1, bz :boundary.x2},
      y: {...runtime, v: current.y, dv: _dy, r: !dy ? dy : dy / _dy, ba: boundary.y1, bz: boundary.y2}
    }
    const ease = k => --k * k * k + 1

    const deceleration = axis => {
      var iz = it[axis]
      if (iz.phase !== 'D') return

      iz.dv *= .95
      if (iz.dv <= .5) {
        iz.dv = 0
      }

      iz.v += iz.dv * iz.r

      iz.oa = iz.v <= iz.ba
      iz.oz = iz.v >= iz.bz

      // TODO: why write this login
      // if (iz.dv > 0) {
      //   iz.oa = iz.oa && iz.r <= 0
      //   iz.oz = iz.oz && iz.r >= 0
      // }

      // console.log('axiz:', axis)
      // console.log('oa:', iz.oa)
      // console.log('oz:', iz.oz)
      // console.log('r:', iz.r)
      // console.log('out:', (iz.oa && iz.r === 1) || (iz.oz && iz.r === -1))
      if ((iz.oa && iz.r === 1) || (iz.oz && iz.r === -1)) prepareBounce(iz, true)
      else if (iz.oa || iz.oz) iz.phase = 'O'
      else if (iz.dv === 0) iz.phase = 'Z'
    }

    const prepareBounce = (iz, oneway) => {
      iz.phase = 'B'
      iz.start = Date.now()
      iz.from = iz.v
      iz.to = iz.oz ? iz.bz : iz.ba
      var distance = Math.abs(iz.to - iz.from)
      var interval = 1000 * distance / doc_w()
      if (interval > 500) interval = 500
      else if (interval < 150) interval = 150
      // console.log('interval.a:', interval)

      if (oneway) {
        // console.log('dv:', iz.dv)
        // console.log('distance:', distance)
        // console.log('duration:', 16.67 * distance / iz.dv)
        var t = 16.67 * distance / iz.dv
        if (t < interval) interval = t
      }

      iz.interval = interval
      // console.log('interval.b:', interval)
    }

    const out = axis => {
      var iz = it[axis]
      if (iz.phase !== 'O') return

      iz.dv = iz.dv * .8
      if (iz.dv <= .5) {
        prepareBounce(iz)
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

      if (it.x.phase !== 'Z' || it.y.phase !== 'Z') animations.postpan = raf(loop)
      else instance.trigger('postpan')
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

  function postpan (target, current, last) {
    // animateDeceleration(xyBoundary(shape.current), target, shape.current.x, shape.current.y, (current.x - last.x) * 2, (current.y - last.y) * 2)
    animateDeceleration(xyBoundary(shape.current), target, shape.current, shape.last)
  }

  var gestureEnabled = false
  const enableGesture = () => gestureEnabled = true
  const disableGesture = () => gestureEnabled = false

  var gestures = []
  const handlers = {
    single: (points, target) => {
      // TODO: trigger wrong
      // ga('single')
      // hide(target)
    },
    double: (points, target) => {
      // ga('double.zoom: ', zoom)
      if (zoom !== 'out') {
        stopSwiper()
        disableGesture()
        var init = shape.init
        if (zoom === 'in') {
          zoom = ''
          show(target)
        } else {
          var {x, y} = limitxy({
            x: init.x * 2 - points.start[0].x,
            y: init.y * 2 - points.start[0].y,
            w: init.w * 2,
            h: init.h * 2
          })
          animateTranslateScale(false, init, {x, y, z: 2}, null, () => {setShape3(target); enableGesture()})
          zoom = 'in'
        }
      }
    },

    scroll: (points, target, phase, eventArgs) => {
      // ga('onscroll')
      stopSwiper()
      if (zoom !== '') return
      var yy = points.current[0].y - points.start[0].y
      applyTranslateScale(wrap, shape.init.x, shape.init.y + yy, 1)
      opacity = 1 - Math.abs(yy * 2 / doc_h())
      applyOpacity(background, opacity > 0 ? opacity : 0)
      instance.trigger('scroll', points, target, phase, eventArgs)
    },
    scrollend: (points, target, phase, eventArgs) => {
      if (zoom !== '') return
      var yy = Math.abs(points.current[0].y - points.start[0].y)

      if (yy / doc_h() > 1/7) hide(target)
      else show(target)
      instance.trigger('scrollend', points, target, phase, eventArgs)
    },

    pinch: (points, target) => {
      // ga('pinch')
      stopSwiper()

      var zoomLevel = calculateZoomLevel(points) //* pinch.z
      var center1 = getCenterPoint(points.start[0], points.start[1])
      var center2 = getCenterPoint(points.current[0], points.current[1])

      var dx = center2.x - (center1.x - shape.start.x) * zoomLevel
      var dy = center2.y - (center1.y - shape.start.y) * zoomLevel

      // console.log('dx:', dx, ' | dy:', dy)

      var _zoom = zoomLevel * shape.start.z
      zoom = _zoom > 1 ? 'in' : (_zoom < 1 ? 'out' : '')
      applyTranslateScale(wrap, dx, dy, _zoom)
      if (zoom === 'out') {
        var rect = getRect(getCacheItem(target).elm)
        if (shape.start.z <= 1) opacity = (shape.current.w - rect.width) / (shape.init.w - rect.width)
      }

      if (shape.current.z >= 1) opacity = 1

      applyOpacity(background, opacity)
    },

    pinchend: (points, target, phase, evt) => {
      // ga('pinchend')
      // console.log('pinchend')
      if (zoom === 'out') {
        if (shape.start.z <= 1 && shape.last.z > shape.current.z) hide(target)
        else show(target)
      // } else if (evt.touches.length === 0) {
        // console.log('xxxxxxxxxxx')
        // var last = getCenter(points)('last')
        // var current = getCenter(points)('current')
        // postpan(target, current, last)
      }
    },

    // TODO: 拖拽卡顿
    pan: (points, target, phase, eventArgs) => {
      // ga('pan')
      if (zoom === 'in') {
        stopSwiper()
        var dx = points.current[0].x - points.start[0].x + shape.start.x
        var dy = points.current[0].y - points.start[0].y + shape.start.y
        applyTranslateScale(wrap, dx, dy, shape.start.z)
        instance.trigger('pan', points, target, phase, eventArgs)
      }
    },

    panend: (points, target, phase, eventArgs) => {
      // ga('panend')
		  // TODO: Avoid acceleration animation if speed is too low
      if (zoom === 'in') {
        postpan(target, points.current[0], points.last[0])
        instance.trigger('panend', points, target, phase, eventArgs)
      }
    },

    start: (points, target) => {
      // console.log('start')
      clearAnimations()
      setShape3(target)
      var z = shape.start.z
      zoom = z > 1 ? 'in' : (z < 1 ? 'out' : '')
    },

    end: (points, target) => {
      // TODO: tap the img during postpan will stop the animation, as a result we need recover postpan again onend. currently only recover postpan, should recover postpinch also.
      // if (zoom === 'in' && !animations.postpan) postpan(target, points.current[0], points.last[0])
    },

    move: (points, target) => {
      shape.last = {...shape.current}
      setShape(target, 'current')
    }
  }

  Object.keys(handlers).forEach(key => {
    var fn = handlers[key]
    handlers[key] = (...args) => {
      if (gestureEnabled && (!swiping || ['single', 'double'].indexOf(key) >= 0)) {
        fn.apply(null, args)
        if (['pan', 'panend', 'scroll', 'scrollend'].indexOf(key) < 0) instance.trigger(key, ...args)
      }
      // if (gestureEnabled && (!swiping || key === 'double' || key === 'single')) fn.apply(null, args)
      // instance.trigger(key, ...args)
    }
  })

  instance.hide = hide
  instance.show = onshow
  // caution: destroy can't rollback, if you still want to show the gallery, use hide
  instance.destroy = () => {
    release()
    moreStack.forEach(m => m())
    div.parentNode && div.parentNode.removeChild(div)
    instance.$destroy()
  }

  return instance

  function release () {
    // TODO: remove all events and dom elements in destroy
    // offStack.splice(1, offStack.length).forEach(o => o())
    offStack.forEach(o => o())
    preventDefault.off()
    gestures.forEach(g => g.destroy())
    gestures = []
    swiperInstance.destroy()
    // div.innerHTML = ''
  }

  // TODO: reset all private variables
  function init (item, resize) {
    preventDefault.on()
    var img = item.elm
    gallery = div.childNodes[1]
    background = gallery.querySelector('.' + cls.bg)
    swiperDom = gallery.querySelector('.' + cls.swiper)

    var rect = getRect(img)
    // disableTransition()

    cache.forEach(c => {
      c.wrap = gallery.querySelector(`.${cls.wrap} img[data-gallery-index="${c.i}"]`).parentElement
      if (c.i === item.i) applyTranslateScale(c.wrap, rect.left, rect.top, rect.width / shape.init.w)
      else applyTranslateScale(c.wrap, c.shape.x, c.shape.y, 1)

      var gesture = gestureFactory(c.wrap)

      // TODO: tap to toggle controls, double tap to zoom in / out
      // offs(on(wrap, 'click', evt => hide(evt.target)))

      Object.keys(handlers).forEach(key => offs(gesture.on(key, handlers[key])))
      gestures.push(gesture)
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

    swiperInstance.on('start', index => {
      instance.trigger('swipestart', index)
    })
    swiperInstance.on('move', index => {
      swiping = true
      instance.trigger('swipe', index)
    })
    swiperInstance.on('end', index => {
      wrap = cache[index].wrap
      shape.init = cache[index].shape
      swiping = false
      instance.trigger('swipeend', index)
    })

    swiping = false

    gallery.style.display = 'block'
    raf(() => {
      if (resize) {
        var s = shape.init
        applyTranslateScale(wrap, s.x, s.y, s.z)
        applyOpacity(background, 1)
      } else show(img)
    })

    offs(on(window, 'resize', evt => {
      release()
      buildCache()
      var item = getCacheItem(wrap.firstElementChild)
      shape.init = item.shape
      div.innerHTML = tpls.main(cache)
      raf(() => init(item, true))
    }))
  }

  // function animate (type, elm, from, to, interval, ease, onAnimation, onEnd) {
  //   var start = Date.now()
  //   var x = from.x, y = from.y, z = from.z
  //
  //   ~function loop () {
  //     onAnimation && onAnimation()
  //     var now = Date.now()
  //     var during = now - start
  //     if (during >= interval) {
  //       applyTranslateScale(elm, to.x, to.y, to.z)
  //       return onEnd && onEnd()
  //     }
  //
  //     const cal = p => (to[p] - from[p]) * easing[ease](during / interval) + from[p]
  //
  //     x = cal('x')
  //     y = cal('y')
  //     z = cal('z')
  //
  //     applyTranslateScale(elm, x, y, z)
  //     animations[type] = raf(loop)
  //   }()
  // }

  /*
   * interruptable: true | false
   */
  function animate (interruptable, type, elm, from, to, fn, move, interval, ease, onAnimation, onEnd) {
    var start = Date.now()
    ~function loop () {
      const next = (from, to) => (to - from) * easing[ease](during / interval) + from

      var now = Date.now()
      var during = now - start
      if (during >= interval) {
        move(elm, to)
        onAnimation && onAnimation(to)
        return onEnd && onEnd()
      }
      var value = fn ? fn(from, to, next) : next(from, to)
      onAnimation && onAnimation(value)
      move(elm, value)
      var timer = raf(loop)
      if (interruptable) animations[type] = timer
      // animations[type] = raf(loop)
    }()
  }

  function animateTranslateScale (interruptable, from, to, onAnimation, onEnd) {
    animate(interruptable, 'main', wrap, from, to, (from, to, next) => ({
      x: next(from.x, to.x), y: next(from.y, to.y), z: next(from.z, to.z)
    }), (elm, opts) => applyTranslateScale(elm, opts.x, opts.y, opts.z), 333, 'cubic', onAnimation, onEnd)
  }

  function animateOpacity (interruptable, from, to, onEnd) {
    animate(interruptable, 'opacity', background, from, to, null, (elm, opts) => applyOpacity(elm, opts), 333, 'cubic', v => opacity = v, onEnd)
  }

  function show (img) {
    if (!img) {
      if (cache.length) img = cache[0].elm
      else return
    }
    disableGesture()
    var rect = getRect(img)
    animateTranslateScale(false, {x: rect.x, y: rect.y, z: rect.width / shape.init.w}, shape.init, null, null)
    animateOpacity(false, opacity, 1, () => {
      // callback && callback();
      setShape3(img)
      startSwiper()
      enableGesture()
    })
    instance.trigger('show', img)
  }

  function hide (img) {
    if (!img) img = wrap.firstElementChild
    disableGesture()
    stopSwiper()
    var rect = getRect(getCacheItem(img).elm)

    animateTranslateScale(false, shape.current, {x: rect.x, y: rect.y, z: rect.width / shape.init.w})
    animateOpacity(false, opacity, 0, () => {
      gallery.style.display = 'none'
      release()
    })
    instance.trigger('hide', img)
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

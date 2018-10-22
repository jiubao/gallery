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

  var x, y, w, h

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
    applyTranslateScale(wrap, rect.left, rect.top, rect.width / getRect(img).width)
    applyOpacity(background, 0)
    showHideComplete(() => freeze = !(gallery.style.display = 'none'))
  }

  function onscroll (currentPoint, lastPoint, startPoint, target) {
    var yy = currentPoint.y - startPoint.y
    applyTranslateScale(wrap, x, y + yy, 1)
    var opacity = 1 - Math.abs(yy * 2 / doc_h())
    applyOpacity(background, opacity > 0 ? opacity : 0)
  }

  function onscrollend (currentPoint, lastPoint, startPoint, target) {
    var yy = Math.abs(currentPoint.y - startPoint.y)

    if (yy / doc_h() > 1/7) hide(target)
    else {
      enableTransition()
      applyTranslateScale(wrap, x, y, 1)
      applyOpacity(background, 1)
      showHideComplete(() => disableTransition())
    }
  }
}

export default gallery

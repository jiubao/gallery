import {raf, caf} from '@jiubao/raf'
import { on, off, isFunction, addClass, removeClass } from './utils'
import tpls from './html.js'
import {classes as cls} from './style.css';

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

  var {selector, dataset} = opts
  var cache = []
  // the container
  var div = document.createElement('div')
  document.body.appendChild(div)

  var gallery, wrap, background, blocked = false
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
    var w = thin ? docHeight * item.r : docWidth
    var h = thin ? docHeight : docWidth / item.r
    var x = thin ? (docWidth - w) / 2 : 0
    var y = thin ? 0 : (docHeight - h) / 2
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

    offs(on(wrap, 'click', evt => hide(evt.target)))
    offs(on(wrap, 'touchstart', onTouchStart))
    offs(on(wrap, 'touchmove', onTouchMove))
    offs(on(wrap, 'touchend', onTouchEnd))

    gallery.style.display = 'block'
    raf(() => {
      show(img)
    })
  }

  function show (img) {
    if (blocked) return
    blocked = true
    enableTransition()
    var sizes = size(img)

    applyTranslateScale(wrap, sizes.x, sizes.y, 1)
    applyOpacity(background, 1)
    showHideComplete(() => blocked = !!disableTransition())
  }

  function hide (img) {
    if (blocked) return
    blocked = true
    enableTransition()
    var rect = getRect(getCacheItem(img).elm)
    applyTranslateScale(wrap, rect.left, rect.top, rect.width / getRect(img).width)
    applyOpacity(background, 0)
    showHideComplete(() => blocked = !(gallery.style.display = 'none'))
  }

  function onTouchStart () {}
  function onTouchMove () {}
  function onTouchEnd () {}
}

export default gallery

import {raf, caf} from '@jiubao/raf'
import { on, off, isFunction, translate_scale, opacity, addClass, removeClass } from './utils'
import tpls from './html.js'
import {classes as cls} from './style.css';

// console.log('the best gallery is coming...')

const html = document.documentElement

const doc_h = () => html.clientHeight
const doc_w = () => html.clientWidth
// const doc_r = () => doc_w / doc_h
const showHideAnimationDuration = 333

function openGallery (items) {
  // the container
  var div = document.createElement('div')
  document.body.appendChild(div)

  // click
  items.forEach(item => on(item, 'click', evt => {
    show(evt.target)
  }))

  function show (img) {
    var n_w = img.naturalWidth, n_h = img.naturalHeight, d_w = doc_w(), d_h = doc_h(), w, h
    var d_r = d_w / d_h, n_r = n_w / n_h
    var w = d_r > n_r ? d_h * n_r : d_w
    var h = d_r > n_r ? d_h : d_w / n_r

    var rect = img.getBoundingClientRect()

    // var opts = {
    //   src: img.src,
    //   width: w,
    //   height: h,
    //   x: rect.left,
    //   y: rect.top,
    //   scale: rect.width / w
    // }
    div.innerHTML = tpls.main(img.src, w, h)

    raf(() => {
      var gallary = div.childNodes[1]
      var wrap = gallary.querySelector('.' + cls.wrap)
      var background = gallary.querySelector('.' + cls.bg)
      translate_scale(wrap, rect.left, rect.top, rect.width / w)
      on(wrap, 'click', evt => {
        removeClass(wrap, cls.noTransition)
        removeClass(background, cls.noTransition)
        translate_scale(wrap, rect.left, rect.top, rect.width / w)
        opacity(background, 0)
        showHideComplete(() => gallary.style.display = 'none')
      })
      gallary.style.display = 'block'
      raf(() => {
        translate_scale(wrap, d_r > n_r ? (d_w - w) / 2 : 0, d_r > n_r ? 0 : (d_h - h) / 2, 1)
        opacity(background, 1)
        showHideComplete(() => {
          addClass(wrap, cls.noTransition)
          addClass(background, cls.noTransition)
        })
      })
    })
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

  var gallery = {
    // on, off
  }

  return gallery
}

function showHideComplete(fn) {
  setTimeout(fn, showHideAnimationDuration + 20)
}

export default openGallery

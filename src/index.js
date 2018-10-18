import { on, off, isFunction } from './utils'
import tpls from './html.js'
import {classes} from './style.css';

// console.log('the best gallery is coming...')

function openGallery (items) {
  var div = document.createElement('div')
  document.body.appendChild(div)

  items.forEach(item => on(item, 'click', evt => {
    init(evt.target.src)
    setTimeout(() => {
      div.childNodes[1].style.display = 'block'
    }, 10)
  }))

  function init (src) {
    div.innerHTML = tpls.main(src)
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
}

export default openGallery

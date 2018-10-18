import { on, off, isFunction } from './utils'
import tpl from './html.js'
import './style.css'

console.log('the best gallery is coming...')

function openGallery (items) {
  items.forEach(item => on(item, 'touchend', () => {
    console.log('clicking...')
  }))

  document.getElementById('test01').innerHTML = tpl

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

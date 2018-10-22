import {raf, caf} from '@jiubao/raf'
import { on, off, isFunction, addClass, removeClass } from './utils'

const html = document.documentElement
const doc_h = () => html.clientHeight
const doc_w = () => html.clientWidth
const touch2point = touch => ({x: touch.pageX, y: touch.pageY})

function gesture (elm) {
  /*
   * 0000 0000: idle
   * 0000 0001: start
   * 0000 0010: swipe
   * 0000 0100: vertical scrolling
   */
  var phase = 0
  var freeze = false
  var ismoving = false

  const handlers = {
    'swipe': [],
    'scroll': [],
    'scrollend': [],
    'zoom': [],
    'double': [],
    'pan': [],
    'tap': []
  }
  const trigger = (evt, ...args) => handlers[evt].forEach(fn => fn(...args))

  var point0 = {}, point1 = {}, startPoint = {}, lastPoint = {}, currentPoint = {}, target = {}

  const loop = () => { if (ismoving) { raf(loop); render() }}

  const onstart = evt => {
    // if (freeze) return
    startPoint = lastPoint = currentPoint = touch2point(evt.touches[0])
    phase = 1
    ismoving = true
    target = evt.target
    loop()
  }

  const onmove = evt => {
    // if (freeze) return

    lastPoint = currentPoint
    currentPoint = touch2point(evt.touches[0])
  }

  const onend = evt => {
    // if (freeze) return
    trigger('scrollend', currentPoint, lastPoint, startPoint, target)
    ismoving = false
  }

  const _off = (evt, fn) => handlers[evt].splice(handlers[evt].indexOf(fn), 1)
  const _on = (evt, fn) => {
    handlers[evt].push(fn)
    return () => off(evt, fn)
  }

  on(elm, 'touchstart', onstart)
  on(elm, 'touchmove', onmove)
  on(elm, 'touchend', onend)

  return {
    on: _on, off: _off
    // destroy: () => {}
  }

  function render () {
    var xx = currentPoint.x - startPoint.x
    var yy = currentPoint.y - startPoint.y

    // if (phase === 1) {
      phase = Math.abs(xx) >= Math.abs(yy) ? 2 : 4
    // }

    if (phase === 2) {
    }
    else if (phase === 4) {
      trigger('scroll', currentPoint, lastPoint, startPoint, target)
    }
  }
}

export default gesture

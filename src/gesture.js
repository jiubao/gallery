import {raf, caf} from '@jiubao/raf'
import { on, off, isString, isArray, addClass, removeClass } from './utils'

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

  var target = {}

  var points = {
    start: [],
    last: [],
    current: []
  }

  const loop = () => { if (ismoving) { raf(loop); render() }}

  const setTouchPoints = (evt, item) => {
    // if (!evt.touches || !evt.touches.length) return
    if (isArray(item)) return item.forEach(i => setTouchPoints(evt, i))
    if (isString(item)) points[item][0] = touch2point(evt.touches[0])
    if (evt.touches.length > 1) points[item][1] = touch2point(evt.touches[1])
  }

  const onstart = evt => {
    // if (freeze) return
    setTouchPoints(evt, ['start', 'last', 'current'])
    // points.start[0] = points.last[0] = points.current[0] = touch2point(evt.touches[0])
    // if (evt.touches.length > 1) points.start[1] = points.last[1] = points.current[1] = touch2point(evt.touches[1])

    phase = 1
    ismoving = true
    target = evt.target
    loop()
  }

  const onmove = evt => {
    // if (freeze) return

    points.last = points.current
    setTouchPoints(evt, 'current')

    if (phase === 1) {
      phase = Math.abs(points.current[0].x - points.start[0].x) >= Math.abs(points.current[0].y - points.start[0].y) ? 2 : 4
    }
  }

  const onend = evt => {
    // if (freeze) return
    phase === 4 && trigger('scrollend', points, target)
    phase = 0
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
    phase === 4 && trigger('scroll', points, target)
  }
}

export default gesture

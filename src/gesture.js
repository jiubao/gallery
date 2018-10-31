import {raf, caf} from '@jiubao/raf'
import { on, off, isString, isArray, addClass, removeClass } from './utils'
import enumFactory from './enum'

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
   * 0000 1000: pinch (two fingers)
   * 0001 0000: pan (one fingers move)
   */
  // var phase = 0
  var phase = enumFactory().add('start', 'move', 'end', 'scroll', 'pinch', 'pan')
  var freeze = false
  var ismoving = false

  const handlers = {
    'swipe': [],
    'scroll': [],
    'scrollend': [],
    'zoom': [],
    'double': [],
    'tap': [],

    'start': [],
    'move': [],
    'end': [],

    'pan': [],
    'panstart': [],
    'panend': [],

    'pinch': [],
    'pinchstart': [],
    'pinchend': []
  }

  var target = {}
  var points = {
    start: [],
    last: [],
    current: []
  }
  // const trigger = (evt, ...args) => handlers[evt].forEach(fn => fn(...args))
  const trigger = evt => handlers[evt].forEach(fn => fn(points, target, phase))

  const loop = () => { if (ismoving) { raf(loop); render() }}

  const setTouchPoints = (evt, item) => {
    // if (!evt.touches || !evt.touches.length) return
    if (isArray(item)) return item.forEach(i => setTouchPoints(evt, i))
    if (isString(item)) points[item][0] = touch2point(evt.touches[0])
    if (evt.touches.length > 1) points[item][1] = touch2point(evt.touches[1])
    else points[item].splice(1, 10)
  }

  const onstart = evt => {
    // if (freeze) return
    setTouchPoints(evt, ['start', 'last', 'current'])
    // points.start[0] = points.last[0] = points.current[0] = touch2point(evt.touches[0])
    // if (evt.touches.length > 1) points.start[1] = points.last[1] = points.current[1] = touch2point(evt.touches[1])

    target = evt.target

    // phase = evt.touches.length > 1 ? 8 : 1
    phase.set('start')
    if (evt.touches.length > 1) phase.or('pinch')

    ismoving = true

    trigger('start')
    if (phase.is('pinch')) trigger('pinchstart')
    else trigger('panstart') // one touch point trigger pan

    loop()
  }

  /// TODO: check pinch every time, if one point, switch behavior
  /// TODO: pinch / scroll: change status in onmove or trigger loop in onmove
  const onmove = evt => {
    // if (freeze) return

    points.last = points.current
    setTouchPoints(evt, 'current')

    if (phase.is('start') && evt.touches.length === 1) {
      Math.abs(points.current[0].x - points.start[0].x) < Math.abs(points.current[0].y - points.start[0].y) && phase.or('scroll')
      phase.or('pan')
    }

    phase.rm('start').or('move')
    //
    // if (evt.touches.length === 1) phase = 16

    if (evt.touches.length > 1) phase.or('pinch')
  }

  const onend = evt => {
    // if (freeze) return

    phase.rm('start', 'move').or('end')
    phase.is('scroll') && trigger('scrollend')
    phase.is('pinch') && trigger('pinchend')
    ismoving = false
    trigger('end')
    phase.set(0)
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
    trigger('move')

    // ga(phase)

    phase.is('scroll') && trigger('scroll')
    phase.is('pinch') && trigger('pinch')
    phase.is('pan') && trigger('pan')
  }
}

export default gesture

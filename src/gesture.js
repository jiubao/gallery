import {raf, caf} from '@jiubao/raf'
import { on, off, isString, isArray, addClass, removeClass } from './utils'
import eventFactory from './event'
import enumFactory from './enum'

const html = document.documentElement
const doc_h = () => html.clientHeight
const doc_w = () => html.clientWidth
const touch2point = touch => ({x: touch.clientX, y: touch.clientY})

/*
 * tap, single, double, start, move, end, scroll, scrollend, pan, panstart, panend, pinch, pinchstart, pinchend, swipe
 */
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
  // TODO: rm window.phase
  var phase = window.phase = enumFactory().add('start', 'move', 'end', 'scroll', 'pinch', 'pan', 'swipe')
  var freeze = false
  var ismoving = false
  var tapTimes = 0, tapStart = -1, tapLast = -1

  var target = {}
  var points = {
    start: [],
    last: [],
    current: []
  }

  var eventArg
  // const trigger = evt => handlers[evt].forEach(fn => fn(points, target, phase, eventArg))
  var instance = Object.create(eventFactory())
  var trigger = evt => instance.trigger(evt, points, target, phase, eventArg)

  const loop = () => { if (ismoving) { raf(loop); render() }}

  const setTouchPoints = (evt, item) => {
    // if (!evt.touches || !evt.touches.length) return
    if (isArray(item)) return item.forEach(i => setTouchPoints(evt, i))
    points[item] = []
    if (isString(item)) points[item][0] = touch2point(evt.touches[0])
    if (evt.touches.length > 1) points[item][1] = touch2point(evt.touches[1])
    // else points[item].splice(1, 10)
  }

  const onstart = evt => {
    eventArg = evt
    // if (freeze) return
    // ga('gesture.start')
    setTouchPoints(evt, ['start', 'last', 'current'])
    // points.start[0] = points.last[0] = points.current[0] = touch2point(evt.touches[0])
    // if (evt.touches.length > 1) points.start[1] = points.last[1] = points.current[1] = touch2point(evt.touches[1])

    target = evt.target

    // phase = evt.touches.length > 1 ? 8 : 1
    phase.set('start')
    if (evt.touches.length > 1) phase.or('pinch')

    // ismoving = true

    trigger('start')
    if (phase.is('pinch')) trigger('pinchstart')
    else trigger('panstart') // one touch point trigger pan

    // loop()
    if (!phase.is('pinch')) tapStart = Date.now()
  }

  /// TODO: check pinch every time, if one point, switch behavior
  /// TODO: pinch / scroll: change status in onmove or trigger loop in onmove
  const onmove = evt => {
    eventArg = evt
    // console.log('gesture.onmove')
    // if (freeze) return
    // ga('gesture.onmove')

    points.last = points.current
    setTouchPoints(evt, 'current')

    // evt.touches.length === 1 && phase.rm('pinch')
    // evt.touches.length > 1 && phase.or('pinch')
    if (evt.touches.length > 1) phase.rm('pan').or('pinch')
    else {
      if (phase.is('pinch')) {
        // console.log('pinch ===> start')
        setTouchPoints(evt, 'start')
        // ga('move.trigger.start')
        trigger('start')
      }
      phase.rm('pinch').or('pan')
      // ga('xxxxxxxxxxx: ', phase.is('pan'))
    }
    // phase[evt.touches.length > 1 ? 'or' : 'rm']('pinch')

    if (phase.is('start') && !phase.is('pinch')) {
      Math.abs(points.current[0].x - points.start[0].x) < Math.abs(points.current[0].y - points.start[0].y) && phase.or('scroll')
      // phase.or('pan')
    }

    if (phase.is('pan') && !phase.is('scroll')) phase.or('swipe')

    phase.rm('start').or('move')
    //
    // if (evt.touches.length === 1) phase = 16

    if (!ismoving) {
      // TODO: change from two points to one points
      ismoving = true
      loop()
    }
  }

  const onend = evt => {
    eventArg = evt
    // console.log('end...')
    // console.log('end.touches:', evt.touches)
    // if (freeze) return
    phase.rm('start', 'move').or('end')

    // ga('gesture.end')

    phase.is('scroll') && trigger('scrollend')
    phase.is('pinch') && trigger('pinchend')
    phase.is('pan') && trigger('panend')
    ismoving = false
    // phase.set(0)

    // TODO: learn single / double logic
    if (!phase.is('pinch') && !phase.is('pan')) {
      var now = Date.now()
      if (now - tapStart <= 200) {
        trigger('tap')
        // if (now - tapLastTimestamp <= 200) tapTimes++
        // else tapTimes = 0

        tapTimes = now - tapLast <= 300 ? tapTimes + 1 : 1
        tapLast = now

        if (tapTimes === 1) setTimeout(() => tapTimes === 1 && trigger('single'), 300)
        else if (tapTimes === 2) trigger('double')
      }
    }

    trigger('end')
  }

  var offs = [ on(elm, 'touchstart', onstart), on(elm, 'touchmove', onmove), on(elm, 'touchend', onend) ]

  // return {
  //   on: _on, off: _off, phase: () => phase,
  //   destroy: () => offs.forEach(h => h())
  // }
  instance.phase = () => phase
  instance.destroy = () => {
    Object.getPrototypeOf(instance).destroy()
    offs.forEach(h => h())
  }
  return instance

  function render () {
    trigger('move')

    // ga('yyyyyyyyyyyyy: ', phase.is('pan'))
    // ga(phase)

    // var _map = arr => JSON.stringify(arr.map(a => ({x: a.x.toFixed(0), y: a.y.toFixed(0)})))
    // console.log('current:', _map(points.current), 'start:', _map(points.start))

    phase.is('scroll') && trigger('scroll')
    phase.is('swipe') && trigger('swipe')
    phase.is('pinch') && trigger('pinch')
    phase.is('pan') && trigger('pan')

    // (phase.is('pan') && !phase.is('scroll')) && trigger('swipe')
  }
}

export default gesture

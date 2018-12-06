export default function () {
  const handlers = Object.create(null)
  const get = evt => {
    if (!handlers[evt]) handlers[evt] = []
    return handlers[evt]
  }
  const trigger = (evt, ...args) => {get(evt).forEach(fn => fn.apply(null, args))}

  const off = (evt, fn) => {
    if (fn) get(evt).splice(get(evt).indexOf(fn), 1)
    else delete handlers[evt]
  }
  const on = (evt, fn) => {
    get(evt).push(fn)
    return () => off(evt, fn)
  }

  return {
    on, off, trigger, $get: get, $destroy: () => {Object.keys(handlers).forEach(evt => {off(evt)})}
  }
}

// function eventFactory () {
//   this.handlers = {}
// }
//
// eventFactory.prototype = {
//   get: evt => {
//     if (!this.handlers[evt]) this.handlers.evt = []
//     return this.handlers.evt
//   },
//   off: (evt, fn) => get(evt).splice(get(evt).indexOf(fn), 1),
//   on: (evt, fn) => {
//     this.get(evt).push(fn)
//     return () => this.off(evt, fn)
//   },
//   trigger: (evt, ...args) => {
//     get(evt).forEach(fn => fn.apply(null, args))
//   },
//   destroy: () => {}
// }
//
// export default eventFactory

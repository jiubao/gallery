export default function () {
  const handlers = Object.create(null)
  const get = evt => {
    if (!handlers[evt]) handlers[evt] = []
    return handlers[evt]
  }
  const trigger = (evt, ...args) => {get(evt).forEach(fn => fn.apply(null, args))}

  const off = (evt, fn) => get(evt).splice(get(evt).indexOf(fn), 1)
  const on = (evt, fn) => {
    get(evt).push(fn)
    return () => off(evt, fn)
  }

  const destroy = () => {Object.keys(handlers).forEach(key => delete handlers[key])}

  return {
    on, off, get, trigger, destroy
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

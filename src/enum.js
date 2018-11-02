function enumFactory () {
  var value = 0, next = 0b1

  const get = v => typeof v === 'number' ? v : bit[v]
  const is = v => !!(value & get(v))
  const or = v => value = value | get(v)
  const rm = v => value = value & ~get(v)
  const set = v => { value = get(v); return bit }
  const add = name => { bit[name] = next; next = next << 1 }
  const spread = (fn, value) => (...args) => { args.forEach(arg => fn(arg)); return bit }

  var bit = {
    // TODO: should rm idle
    'idle': 0b0,
    or: spread(or), rm: spread(rm), add: spread(add),
    is, set, get
  }

  return bit
}

export default enumFactory

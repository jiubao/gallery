function enumFactory () {
  // TODO: should rm idle
  var value = 0, next = 0b1, enums = {'idle': 0b0}

  const get = v => typeof v === 'number' ? v : enums[v]
  const is = v => !!(value & get(v))
  const or = v => value = value | get(v)
  const rm = v => value = value & ~get(v)
  // const set = v => { value = get(v); return bit }
  const add = name => { enums[name] = next; next = next << 1 }
  const spread = (fn, value) => (...args) => { args.forEach(arg => fn(arg)); return bit }

  var bit = {
    v: () => value,
    or: spread(or),
    rm: spread(rm),
    add: spread(add),
    is: (...args) => args.reduce((result, arg) => result && is(arg), is(args[0])),
    set: (...args) => { value = args.reduce((r, v) => r | get(v), get(args[0])); return bit }
    // get,
    // enums
  }

  return bit
}

export default enumFactory

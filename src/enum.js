function enumFactory () {
  var value = 0, next = 0b1

  var bit = {
    'idle': 0b0,
    is: arraify(is),
    or: arraify(or), rm: arraify(rm), set, add: arraify(add), get
  }

  return bit

  function get (v) {
    return typeof v === 'number' ? v : bit[v]
  }

  function is (v) {
    return value & get(v)
  }

  function or (v) {
    value = value | get(v)
    return bit
  }

  function rm (v) {
    value = value & ~get(v)
    return bit
  }

  function set (v) {
    value = get(v)
    return bit
  }

  function add (name) {
    // args.forEach(name => {
    //   bit[name] = next
    //   next = next << 1
    // })

    // if (Array.isArray(name)) name.forEach(n => add(n))
    // else {
    //   bit[name] = next
    //   next = next << 1
    // }

    bit[name] = next
    next = next << 1

    return bit
  }
}

function arraify (fn) {
  return function (...args) {
    return args.reduce((result, current) => fn(current), fn(args[0]))
  }
}

export default enumFactory

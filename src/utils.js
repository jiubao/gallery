export const on = (element, evt, handler) => {
  element.addEventListener(evt, handler, false)
}

export const off = (element, evt, handler) => {
  element.removeEventListener(evt, handler, false)
}

export const isFunction = value => {
  return typeof value === 'function'
}

export const html = (literalSections, ...subsets) => subsets.reduce((result, current, index) => result + current + literalSections[index + 1], literalSections[0])

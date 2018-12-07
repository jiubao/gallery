import supportPassive from '@jiubao/passive'
var passive = supportPassive()
var defaultEventOptions = passive ? {capture: false, passive: true} : false

// export const on = (element, evt, handler, options = defaultEventOptions) => {
//   element.addEventListener(evt, handler, options)
//   return () => off(element, evt, handler, options)
// }
//
// export const off = (element, evt, handler, options = defaultEventOptions) => element.removeEventListener(evt, handler, options)

// export const isFunction = value => typeof value === 'function'
// export const isString = value => typeof value === 'string'
// export const isArray = arr => Array.isArray(arr) || arr instanceof Array
//
// export const html = (literalSections, ...subsets) => subsets.reduce((result, current, index) => result + current + literalSections[index + 1], literalSections[0])
//
// export const hasClass = (elm, className) => elm.className && new RegExp('(^|\\s)' + className + '(\\s|$)').test(elm.className)
// export const addClass = (elm, className) => {
// 	if (!hasClass(elm, className)) {
// 		elm.className += (elm.className ? ' ' : '') + className
// 	}
// }
// export const removeClass = (elm, className) => {
// 	var reg = new RegExp('(\\s|^)' + className + '(\\s|$)')
// 	elm.className = elm.className.replace(reg, ' ').replace(/^\s\s*/, '').replace(/\s\s*$/, '')
// }

export const doc_h = () => window.innerHeight
export const doc_w = () => window.innerWidth

export function prevent () {
  const handler = e => e.preventDefault()
  const opts = {passive: false}

  return {
    on: () => on(document, 'touchmove', handler, opts),
    off: () => off(document, 'touchmove', handler, opts)
  }
}

// data-gallery-item ===> galleryItem
export const camelCase = str => str.split('-').slice(1).map((item, index) => !index ? item : item.replace(/^./, match => match.toUpperCase())).join('')

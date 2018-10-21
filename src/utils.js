export const on = (element, evt, handler) => {
  element.addEventListener(evt, handler, false)
  return () => off(element, evt, handler)
}

export const off = (element, evt, handler) => element.removeEventListener(evt, handler, false)

export const isFunction = value => typeof value === 'function'

export const html = (literalSections, ...subsets) => subsets.reduce((result, current, index) => result + current + literalSections[index + 1], literalSections[0])

export const hasClass = (elm, className) => elm.className && new RegExp('(^|\\s)' + className + '(\\s|$)').test(elm.className)
export const addClass = (elm, className) => {
	if (!hasClass(elm, className)) {
		elm.className += (elm.className ? ' ' : '') + className
	}
}
export const removeClass = (elm, className) => {
	var reg = new RegExp('(\\s|^)' + className + '(\\s|$)')
	elm.className = elm.className.replace(reg, ' ').replace(/^\s\s*/, '').replace(/\s\s*$/, '')
}

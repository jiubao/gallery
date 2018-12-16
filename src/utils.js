import {on, off} from '@jiubao/utils'

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
export const camelCase = str => str.replace(/^data-/, '').replace(/-(\w)/g, (_, p1) => p1.toUpperCase())
// export const camelCase = str => str.replace(/^(data-)|-(\w)/g, (_, p1, p2) => p1 ? '' : p2.toUpperCase())

export const addStylesheetRules = str => {
  var style = document.createElement('style');
  document.head.appendChild(style);
  style.sheet.insertRule(str)
}

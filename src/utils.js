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
export const camelCase = str => str.split('-').slice(1).map((item, index) => !index ? item : item.replace(/^./, match => match.toUpperCase())).join('')

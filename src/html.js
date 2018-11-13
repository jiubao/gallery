import {html} from './utils'
import {classes as cls} from './style.css'
// function htmlEscape(str) {
//     return str.replace(/&/g, '&amp;') // first!
//               .replace(/>/g, '&gt;')
//               .replace(/</g, '&lt;')
//               .replace(/"/g, '&quot;')
//               .replace(/'/g, '&#39;')
//               .replace(/`/g, '&#96;');
// }

    // <img data-gallery-index="${index}" src="${src}" style="width: ${width}px; height: ${height}px;" />
        // <div><img data-gallery-index="${index}" src="${src}" style="width: ${width}px; height: ${height}px;" /> </div>
      // `${srcs.forEach(src => `<div><img data-gallery-index="${index}" src="${src}" style="width: ${width}px; height: ${height}px;" /></div>`)}`

var main = (imgs, width, height, index) => html`
<div class="${cls.gallery}">
  <div class="${cls.bg}"></div>
  <div class="${cls.wrap}">
    <div class="swiper">
      <div>
      ${imgs.map(img => html`
        <div><img data-gallery-index="${img.i}" src="${img.src}"/></div>
      `).join('')}
      </div>
    </div>
  </div>
</div>
`

export default {main}

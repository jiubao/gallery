import {html, doc_w} from './utils'
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

var half = ~~(doc_w() / 15)

var main = imgs => html`
<div class="${cls.gallery}">
  <div class="${cls.bg}"></div>
  <div class="${cls.swiper}" style="margin-left: -${half}px; width: ${imgs[0].shape.w + half * 2}px;">
    <div class="${cls.swiperWrap}">
    ${imgs.map(img => html`
      <div class="${cls.swiperItem}" style="padding: 0 ${half}px;">
        <div class="${cls.wrap}" style="width: ${img.shape.w}px;">
          <img data-gallery-index="${img.i}" src="${img.src}" style="width: ${img.shape.w}px; height: ${img.shape.h}px;"/>
        </div>
      </div>
    `).join('')}
    </div>
  </div>
</div>
`

export default {main}

import {doc_w} from './utils'
import {html} from '@jiubao/utils'
import {classes as cls} from './style.css'

var half = ~~(doc_w() / 15)

var main = imgs => html`
<div class="${cls.gallery}">
  <div class="${cls.bg}"></div>
  <div class="${cls.swiper}" style="margin-left: -${half}px; width: ${doc_w() + half * 2}px;">
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

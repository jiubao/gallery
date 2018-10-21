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

var main = (src, width, height) => html`
<div class="${cls.gallery}">
  <div class="${cls.bg}"></div>
  <div class="${cls.wrap}">
    <img src="${src}" style="width: ${width}px; height: ${height}px;" />
  </div>
</div>
`

export default {main}

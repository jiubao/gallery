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

var main = img => html`
<div class="${cls.gallery}">
  <div class="${cls.bg}"></div>
  <div class="${cls.wrap}">
    <img src="${img}" alt="" />
  </div>
</div>
`

export default {main}

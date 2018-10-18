const html = (literalSections, ...subsets) => subsets.reduce((result, current, index) => result + current + literalSections[index + 1], literalSections[0])
// function htmlEscape(str) {
//     return str.replace(/&/g, '&amp;') // first!
//               .replace(/>/g, '&gt;')
//               .replace(/</g, '&lt;')
//               .replace(/"/g, '&quot;')
//               .replace(/'/g, '&#39;')
//               .replace(/`/g, '&#96;');
// }

var tpl = html`
<div id="gallery" class="">
  <div class="cover"></div>
  <div class="wrapper">
    <img src="./imgs/2.jpg" alt="" />
  </div>
</div>
`
export default tpl

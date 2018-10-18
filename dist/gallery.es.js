var on = function (element, evt, handler) {
  element.addEventListener(evt, handler, false);
};

var html = function (literalSections) {
  var subsets = [], len = arguments.length - 1;
  while ( len-- > 0 ) subsets[ len ] = arguments[ len + 1 ];

  return subsets.reduce(function (result, current, index) { return result + current + literalSections[index + 1]; }, literalSections[0]);
};
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
`;

console.log('the best gallery is coming...');

function openGallery (items) {
  items.forEach(function (item) { return on(item, 'touchend', function () {
    console.log('clicking...');
  }); });

  document.getElementById('test01').innerHTML = tpl;
}

export default openGallery;
(function (encoded, words, link) {
    link.setAttribute('rel', 'stylesheet');
    link.setAttribute('href', URL.createObjectURL(
        new Blob(
            encoded.map(function (index) {
                return words[index];
            }),
            {type: 'text/css'}
        )
    ));
    URL.revokeObjectURL(link.getAttribute('href'));
}(
    [3,1,2,4,5,6,0],
    ["}","{","width","img",":","100","%"],
    document.head.appendChild(document.createElement('link'))
));

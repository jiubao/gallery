var on = function (element, evt, handler) {
  element.addEventListener(evt, handler, false);
};

var html = function (literalSections) {
  var subsets = [], len = arguments.length - 1;
  while ( len-- > 0 ) subsets[ len ] = arguments[ len + 1 ];

  return subsets.reduce(function (result, current, index) { return result + current + literalSections[index + 1]; }, literalSections[0]);
};

var classes = {
	gallery: "_src_style_css_gallery",
	bg: "_src_style_css_bg",
	wrap: "_src_style_css_wrap",
	full: "_src_style_css_full"
};

// function htmlEscape(str) {
//     return str.replace(/&/g, '&amp;') // first!
//               .replace(/>/g, '&gt;')
//               .replace(/</g, '&lt;')
//               .replace(/"/g, '&quot;')
//               .replace(/'/g, '&#39;')
//               .replace(/`/g, '&#96;');
// }

var main = function (img) { return html`
<div class="${classes.gallery}">
  <div class="${classes.bg}"></div>
  <div class="${classes.wrap}">
    <img src="${img}" alt="" />
  </div>
</div>
`; };

var tpls = {main: main};

// console.log('the best gallery is coming...')

function openGallery (items) {
  var div = document.createElement('div');
  document.body.appendChild(div);

  items.forEach(function (item) { return on(item, 'click', function (evt) {
    init(evt.target.src);
    setTimeout(function () {
      div.childNodes[1].style.display = 'block';
    }, 10);
  }); });

  function init (src) {
    div.innerHTML = tpls.main(src);
  }
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
    [6,0,4,0,3,0,5,0,18,15,9,6,0,4,0,3,0,5,0,19,15,9,6,0,4,0,3,0,5,0,11,15,9,6,0,4,0,3,0,5,0,33,8,25,2,21,1,28,2,21,1,17,2,14,16,1,32,2,14,16,1,7,10,6,0,4,0,3,0,5,0,18,8,35,2,13,1,12,2,34,1,26,2,31,1,24,22,37,2,13,1,23,22,29,2,38,1,27,2,13,1,7,10,6,0,4,0,3,0,5,0,19,8,12,2,20,1,36,2,40,39,1,7,10,6,0,4,0,3,0,5,0,11,8,12,2,20,1,7,10,6,0,4,0,3,0,5,0,11,9,30,8,17,2,14,16,1,7],
    ["_",";",":","style","src","css",".","}","{"," ","\n","wrap","position","none","100",",","%","width","gallery","bg","absolute","0","-","z","touch","top","overflow","outline","left","index","img","hidden","height","full","fixed","display","background","action","9999","000","#"],
    document.head.appendChild(document.createElement('link'))
));

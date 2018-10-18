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
	full: "_src_style_css_full",
	center: "_src_style_css_center"
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
    <img src="${img}" class="${classes.center}" />
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
    [5,0,8,0,7,0,9,0,27,16,1,5,0,8,0,7,0,9,0,28,16,1,5,0,8,0,7,0,9,0,17,16,1,5,0,8,0,7,0,9,0,45,11,19,3,29,2,21,3,29,2,26,3,23,6,2,43,3,23,6,2,10,4,5,0,8,0,7,0,9,0,27,11,47,3,20,2,14,3,46,2,38,3,42,2,37,13,49,3,20,2,32,13,40,3,50,2,39,3,20,2,10,4,5,0,8,0,7,0,9,0,28,11,14,3,15,2,48,3,52,51,2,10,4,5,0,8,0,7,0,9,0,17,11,14,3,15,2,10,4,5,0,8,0,7,0,9,0,17,1,41,11,26,3,23,6,2,10,4,5,0,8,0,7,0,9,0,22,11,14,3,15,2,21,3,12,6,2,19,3,12,6,2,18,3,36,25,13,12,6,16,1,13,12,6,24,2,10,30,31,1,5,22,13,44,1,11,4,1,1,14,3,1,15,2,4,1,1,21,3,1,12,6,2,4,1,1,18,3,1,35,25,13,12,6,24,2,4,10,4,4,5,22,13,33,1,11,4,1,1,14,3,1,15,2,4,1,1,19,3,1,12,6,2,4,1,1,18,3,1,34,25,13,12,6,24,2,4,10,1,31,30],
    ["_"," ",";",":","\n",".","%","style","src","css","}","{","50","-","position","absolute",",","wrap","transform","top","none","left","center","100",")","(","width","gallery","bg","0","/","*","z","v","translateY","translateX","translate","touch","overflow","outline","index","img","hidden","height","h","full","fixed","display","background","action","9999","000","#"],
    document.head.appendChild(document.createElement('link'))
));

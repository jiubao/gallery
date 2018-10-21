'use strict';

// for a 60Hz monitor, requestAnimationFrame will trigger the callback every 16.67ms (1000 / 60 == 16.66...)
var vendorPrefixes = ['webkit','moz','ms','o'];
var raf = vendorPrefixes.reduce(function (result, next) { return result || window[(next + "RequestAnimationFrame")]; }, window.requestAnimationFrame).bind(window);
var caf = vendorPrefixes.reduce(function (result, next) { return result || window[(next + "CancelAnimationFrame")]; }, window.cancelAnimationFrame).bind(window);
if (!raf || !caf) {
  var last = 0;
  raf = function (fn) {
    var now = +new Date();
    last = Math.max(now, last + 16);
    return setTimeout(fn, last - now)
  };
  caf = clearTimeout;
}

var on = function (element, evt, handler) {
  element.addEventListener(evt, handler, false);
};

var html = function (literalSections) {
	var subsets = [], len = arguments.length - 1;
	while ( len-- > 0 ) subsets[ len ] = arguments[ len + 1 ];

	return subsets.reduce(function (result, current, index) { return result + current + literalSections[index + 1]; }, literalSections[0]);
};

var translate_scale = function (elm, x, y, scale) { return elm.style.transform = "translate3d(" + x + "px," + y + "px,0) scale(" + scale + ")"; };
var opacity = function (elm, opacity) { return elm.style.opacity = opacity; };

var hasClass = function (elm, className) { return elm.className && new RegExp('(^|\\s)' + className + '(\\s|$)').test(elm.className); };
var addClass = function (elm, className) {
	if (!hasClass(elm, className)) {
		elm.className += (elm.className ? ' ' : '') + className;
	}
};
var removeClass = function (elm, className) {
	var reg = new RegExp('(\\s|^)' + className + '(\\s|$)');
	elm.className = elm.className.replace(reg, ' ').replace(/^\s\s*/, '').replace(/\s\s*$/, '');
};

var classes = {
	gallery: "_src_style_css_gallery",
	bg: "_src_style_css_bg",
	wrap: "_src_style_css_wrap",
	full: "_src_style_css_full",
	center: "_src_style_css_center",
	noTransition: "_src_style_css_noTransition"
};

var templateObject = Object.freeze(["\n<div class=\"", "\">\n  <div class=\"", "\"></div>\n  <div class=\"", "\">\n    <img src=\"", "\" style=\"width: ", "px; height: ", "px;\" />\n  </div>\n</div>\n"]);
// function htmlEscape(str) {
//     return str.replace(/&/g, '&amp;') // first!
//               .replace(/>/g, '&gt;')
//               .replace(/</g, '&lt;')
//               .replace(/"/g, '&quot;')
//               .replace(/'/g, '&#39;')
//               .replace(/`/g, '&#96;');
// }

var main = function (src, width, height) { return html(templateObject, classes.gallery, classes.bg, classes.wrap, src, width, height); };

var tpls = {main: main};

// console.log('the best gallery is coming...')

var html$1 = document.documentElement;

var doc_h = function () { return html$1.clientHeight; };
var doc_w = function () { return html$1.clientWidth; };
// const doc_r = () => doc_w / doc_h
var showHideAnimationDuration = 333;

function openGallery (items) {
  // the container
  var div = document.createElement('div');
  document.body.appendChild(div);

  // click
  items.forEach(function (item) { return on(item, 'click', function (evt) {
    show(evt.target);
  }); });

  function show (img) {
    var n_w = img.naturalWidth, n_h = img.naturalHeight, d_w = doc_w(), d_h = doc_h(), w, h;
    var d_r = d_w / d_h, n_r = n_w / n_h;
    var w = d_r > n_r ? d_h * n_r : d_w;
    var h = d_r > n_r ? d_h : d_w / n_r;

    var rect = img.getBoundingClientRect();

    // var opts = {
    //   src: img.src,
    //   width: w,
    //   height: h,
    //   x: rect.left,
    //   y: rect.top,
    //   scale: rect.width / w
    // }
    div.innerHTML = tpls.main(img.src, w, h);

    raf(function () {
      var gallary = div.childNodes[1];
      var wrap = gallary.querySelector('.' + classes.wrap);
      var background = gallary.querySelector('.' + classes.bg);
      translate_scale(wrap, rect.left, rect.top, rect.width / w);
      on(wrap, 'click', function (evt) {
        removeClass(wrap, classes.noTransition);
        removeClass(background, classes.noTransition);
        translate_scale(wrap, rect.left, rect.top, rect.width / w);
        opacity(background, 0);
        showHideComplete(function () { return gallary.style.display = 'none'; });
      });
      gallary.style.display = 'block';
      raf(function () {
        translate_scale(wrap, d_r > n_r ? (d_w - w) / 2 : 0, d_r > n_r ? 0 : (d_h - h) / 2, 1);
        opacity(background, 1);
        showHideComplete(function () {
          addClass(wrap, classes.noTransition);
          addClass(background, classes.noTransition);
        });
      });
    });
  }

  /*
   * events (pan | pinch | press | rotate | swipe | tap)
   * horizontal swipe: flick to next / previous
   * vertical swipe: close gallery
   * spread: zoom in
   * pinch: zoom out and close gallery
   * double tap: zoom in / zoom out based on tap point
   * pan: drag to pan
   * tap: toggle controls
   */
  // var on = () => {}
  // var off = () => {}

  var gallery = {
    // on, off
  };

  return gallery
}

function showHideComplete(fn) {
  setTimeout(fn, showHideAnimationDuration + 20);
}

module.exports = openGallery;
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
    [5,0,9,0,8,0,10,0,31,11,1,5,0,9,0,8,0,10,0,33,11,1,5,0,9,0,8,0,10,0,24,11,1,5,0,9,0,8,0,10,0,56,13,21,3,18,2,23,3,18,2,28,3,27,7,2,54,3,27,7,2,47,3,53,2,12,4,5,0,9,0,8,0,10,0,31,13,58,3,22,2,15,3,57,2,46,6,60,3,22,2,41,6,51,3,61,2,48,3,22,2,12,4,5,0,9,0,8,0,10,0,33,13,15,3,17,2,59,3,63,62,2,25,3,29,1,35,30,1,32,6,34,20,37,11,1,18,11,1,38,11,1,36,19,2,29,3,18,2,12,4,5,0,9,0,8,0,10,0,24,13,15,3,17,2,16,6,49,3,23,1,21,2,25,3,16,1,35,30,1,32,6,34,20,37,11,1,18,11,1,38,11,1,36,19,2,12,4,5,0,9,0,8,0,10,0,24,1,52,13,28,3,27,7,2,12,4,5,0,9,0,8,0,10,0,26,13,15,3,17,2,23,3,14,7,2,21,3,14,7,2,16,3,45,20,6,14,7,11,1,6,14,7,19,2,12,39,40,1,5,26,6,55,1,13,4,1,1,15,3,1,17,2,4,1,1,23,3,1,14,7,2,4,1,1,16,3,1,44,20,6,14,7,19,2,4,12,4,4,5,26,6,42,1,13,4,1,1,15,3,1,17,2,4,1,1,21,3,1,14,7,2,4,1,1,16,3,1,43,20,6,14,7,19,2,4,12,1,40,39,4,5,0,9,0,8,0,10,0,50,13,25,3,22,2,12],
    ["_"," ",";",":","\n",".","-","%","style","src","css",",","}","{","50","position","transform","absolute","0",")","(","top","none","left","wrap","transition","center","100","width","opacity","ms","gallery","cubic","bg","bezier","333","1","0.4","0.22","/","*","z","v","translateY","translateX","translate","touch","overflow","outline","origin","noTransition","index","img","hidden","height","h","full","fixed","display","background","action","9999","000","#"],
    document.head.appendChild(document.createElement('link'))
));

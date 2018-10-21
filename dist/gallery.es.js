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
  return function () { return off(element, evt, handler); }
};

var off = function (element, evt, handler) { return element.removeEventListener(evt, handler, false); };

var html = function (literalSections) {
	var subsets = [], len = arguments.length - 1;
	while ( len-- > 0 ) subsets[ len ] = arguments[ len + 1 ];

	return subsets.reduce(function (result, current, index) { return result + current + literalSections[index + 1]; }, literalSections[0]);
};

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
	disableTransition: "_src_style_css_disableTransition"
};

var templateObject = Object.freeze(["\n<div class=\"", "\">\n  <div class=\"", "\"></div>\n  <div class=\"", "\">\n    <img data-gallery-index=\"", "\" src=\"", "\" style=\"width: ", "px; height: ", "px;\" />\n  </div>\n</div>\n"]);
// function htmlEscape(str) {
//     return str.replace(/&/g, '&amp;') // first!
//               .replace(/>/g, '&gt;')
//               .replace(/</g, '&lt;')
//               .replace(/"/g, '&quot;')
//               .replace(/'/g, '&#39;')
//               .replace(/`/g, '&#96;');
// }

var main = function (src, width, height, index) { return html(templateObject, classes.gallery, classes.bg, classes.wrap, index, src, width, height); };

var tpls = {main: main};

// console.log('the best gallery is coming...')

var applyTranslateScale = function (elm, x, y, scale) { return elm.style.transform = "translate3d(" + x + "px," + y + "px,0) scale(" + scale + ")"; };
var applyOpacity = function (elm, opacity) { return elm.style.opacity = opacity; };

var html$1 = document.documentElement;
var doc_h = function () { return html$1.clientHeight; };
var doc_w = function () { return html$1.clientWidth; };

var showHideAnimationDuration = 333;
var showHideComplete = function (fn) { return setTimeout(fn, showHideAnimationDuration + 20); };
var getRect = function (elm) { return elm.getBoundingClientRect(); };

var defaultOptions = {
  selector: 'data-gallery-item',
  dataset: 'galleryItem'
};

function gallery (options) {
  var opts = Object.assign({}, defaultOptions,
    options);

  var selector = opts.selector;
  var dataset = opts.dataset;
  var cache = [];
  // the container
  var div = document.createElement('div');
  document.body.appendChild(div);

  var gallery, wrap, background;
  // var offDocClick, offTouchStart, offTouchMove, offTouchEnd
  var offStach = [];
  var offs = function (fn) { return offStach.push(fn); };

  // click document
  offs(on(document, 'click', function (evt) {
    var target = evt.target;
    if (target.tagName === 'IMG' && dataset in target.dataset) {
      document.querySelectorAll(("img[" + selector + "]")).forEach(function (item, index) {
        item.dataset.galleryIndex = index;
        var w = item.naturalWidth, h = item.naturalHeight;
        cache[index] = { elm: item, w: w, h: h, r: w / h };
      });
      var sizes = size(target);
      div.innerHTML = tpls.main(target.src, sizes.w, sizes.h, target.dataset.galleryIndex);
      raf(function () { return init(target, sizes); });
    }
  }));

  // click
  // items.forEach(item => on(item, 'click', evt => {
  //   show(evt.target)
  // }))

  var getCacheItem = function (img) { return cache[Number(img.dataset.galleryIndex)]; };

  var size = function (img) {
    var item = getCacheItem(img);
    var docWidth = doc_w(), docHeight = doc_h();
    var thin = (docWidth / docHeight) > item.r;
    var w = thin ? docHeight * item.r : docWidth;
    var h = thin ? docHeight : docWidth / item.r;
    var x = thin ? (docWidth - w) / 2 : 0;
    var y = thin ? 0 : (docHeight - h) / 2;
    return {w: w, h: h, x: x, y: y}
  };

  var enableTransition = function () { return removeClass(gallery, classes.disableTransition); };
  var disableTransition = function () { return addClass(gallery, classes.disableTransition); };

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
    destroy: function () {
      // unbind document click
      // offDocClick()
      // offTouchStart()
      // offTouchMove()
      // offTouchEnd()
      offStach.forEach(function (o) { return o(); });
    }
  };

  return gallery

  function init (img, sizes) {
    var rect = getRect(img);
    gallery = div.childNodes[1];
    wrap = gallery.querySelector('.' + classes.wrap);
    background = gallery.querySelector('.' + classes.bg);
    disableTransition();
    applyTranslateScale(wrap, rect.left, rect.top, rect.width / sizes.w);

    offs(on(wrap, 'click', function (evt) { return hide(evt.target); }));
    offs(on(wrap, 'touchstart', onTouchStart));
    offs(on(wrap, 'touchmove', onTouchMove));
    offs(on(wrap, 'touchend', onTouchEnd));

    gallery.style.display = 'block';
    raf(function () {
      show(img);
    });
  }

  function show (img) {
    enableTransition();
    var sizes = size(img);

    applyTranslateScale(wrap, sizes.x, sizes.y, 1);
    applyOpacity(background, 1);
    showHideComplete(function () { return disableTransition(); });
  }

  function hide (img) {
    enableTransition();
    var rect = getRect(getCacheItem(img).elm);
    applyTranslateScale(wrap, rect.left, rect.top, rect.width / getRect(img).width);
    applyOpacity(background, 0);
    showHideComplete(function () { return gallery.style.display = 'none'; });
  }

  function onTouchStart () {}
  function onTouchMove () {}
  function onTouchEnd () {}
}

export default gallery;
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
    [5,0,7,0,6,0,8,0,32,10,1,5,0,7,0,6,0,8,0,27,10,1,5,0,7,0,6,0,8,0,21,10,1,5,0,7,0,6,0,8,0,56,13,22,3,18,2,24,3,18,2,29,3,28,11,2,54,3,28,11,2,48,3,53,2,12,4,5,0,7,0,6,0,8,0,32,13,58,3,23,2,15,3,57,2,47,9,60,3,23,2,42,9,51,3,61,2,49,3,23,2,12,4,5,0,7,0,6,0,8,0,27,13,15,3,17,2,59,3,63,62,2,25,3,30,1,36,31,1,34,9,35,20,38,10,1,18,10,1,39,10,1,37,19,2,30,3,18,2,12,4,5,0,7,0,6,0,8,0,21,13,15,3,17,2,16,9,50,3,24,1,22,2,25,3,16,1,36,31,1,34,9,35,20,38,10,1,18,10,1,39,10,1,37,19,2,12,4,5,0,7,0,6,0,8,0,21,1,52,13,29,3,28,11,2,12,4,5,0,7,0,6,0,8,0,26,13,15,3,17,2,24,3,14,11,2,22,3,14,11,2,16,3,46,20,9,14,11,10,1,9,14,11,19,2,12,40,41,1,5,26,9,55,1,13,4,1,1,15,3,1,17,2,4,1,1,24,3,1,14,11,2,4,1,1,16,3,1,45,20,9,14,11,19,2,4,12,4,4,5,26,9,43,1,13,4,1,1,15,3,1,17,2,4,1,1,22,3,1,14,11,2,4,1,1,16,3,1,44,20,9,14,11,19,2,4,12,1,41,40,4,5,0,7,0,6,0,8,0,33,1,5,0,7,0,6,0,8,0,27,10,1,5,0,7,0,6,0,8,0,33,1,5,0,7,0,6,0,8,0,21,13,25,3,23,2,12],
    ["_"," ",";",":","\n",".","style","src","css","-",",","%","}","{","50","position","transform","absolute","0",")","(","wrap","top","none","left","transition","center","bg","100","width","opacity","ms","gallery","disableTransition","cubic","bezier","333","1","0.4","0.22","/","*","z","v","translateY","translateX","translate","touch","overflow","outline","origin","index","img","hidden","height","h","full","fixed","display","background","action","9999","000","#"],
    document.head.appendChild(document.createElement('link'))
));

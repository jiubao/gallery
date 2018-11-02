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
var isString = function (value) { return typeof value === 'string'; };
var isArray = function (arr) { return Array.isArray(arr) || arr instanceof Array; };

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

function enumFactory () {
  var value = 0, next = 1;

  var bit = {
    'idle': 0,
    is: arraify(is),
    or: arraify(or), rm: arraify(rm), set: set, add: arraify(add), get: get
  };

  return bit

  function get (v) {
    return typeof v === 'number' ? v : bit[v]
  }

  function is (v) {
    return value & get(v)
  }

  function or (v) {
    value = value | get(v);
    return bit
  }

  function rm (v) {
    value = value & ~get(v);
    return bit
  }

  function set (v) {
    value = get(v);
    return bit
  }

  function add (name) {
    bit[name] = next;
    next = next << 1;

    return bit
  }
}

function arraify (fn) {
  return function () {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];

    return args.reduce(function (result, current) { return fn(current); }, fn(args[0]))
  }
}

var html$1 = document.documentElement;
var touch2point = function (touch) { return ({x: touch.pageX, y: touch.pageY}); };

function gesture (elm) {
  /*
   * 0000 0000: idle
   * 0000 0001: start
   * 0000 0010: swipe
   * 0000 0100: vertical scrolling
   * 0000 1000: pinch (two fingers)
   * 0001 0000: pan (one fingers move)
   */
  // var phase = 0
  var phase = enumFactory().add('start', 'move', 'end', 'scroll', 'pinch', 'pan');
  var ismoving = false;

  var handlers = {
    'swipe': [],
    'scroll': [],
    'scrollend': [],
    'zoom': [],
    'double': [],
    'tap': [],

    'start': [],
    'move': [],
    'end': [],

    'pan': [],
    'panstart': [],
    'panend': [],

    'pinch': [],
    'pinchstart': [],
    'pinchend': []
  };

  var target = {};
  var points = {
    start: [],
    last: [],
    current: []
  };
  // const trigger = (evt, ...args) => handlers[evt].forEach(fn => fn(...args))
  var trigger = function (evt) { return handlers[evt].forEach(function (fn) { return fn(points, target, phase); }); };

  var loop = function () { if (ismoving) { raf(loop); render(); }};

  var setTouchPoints = function (evt, item) {
    // if (!evt.touches || !evt.touches.length) return
    if (isArray(item)) { return item.forEach(function (i) { return setTouchPoints(evt, i); }) }
    if (isString(item)) { points[item][0] = touch2point(evt.touches[0]); }
    if (evt.touches.length > 1) { points[item][1] = touch2point(evt.touches[1]); }
    else { points[item].splice(1, 10); }
  };

  var onstart = function (evt) {
    // if (freeze) return
    ga('gesture.start');
    setTouchPoints(evt, ['start', 'last', 'current']);
    // points.start[0] = points.last[0] = points.current[0] = touch2point(evt.touches[0])
    // if (evt.touches.length > 1) points.start[1] = points.last[1] = points.current[1] = touch2point(evt.touches[1])

    target = evt.target;

    // phase = evt.touches.length > 1 ? 8 : 1
    phase.set('start');
    if (evt.touches.length > 1) { phase.or('pinch'); }

    // ismoving = true

    trigger('start');
    if (phase.is('pinch')) { trigger('pinchstart'); }
    else { trigger('panstart'); } // one touch point trigger pan

    // loop()
  };

  /// TODO: check pinch every time, if one point, switch behavior
  /// TODO: pinch / scroll: change status in onmove or trigger loop in onmove
  var onmove = function (evt) {
    // if (freeze) return
    ga('gesture.onmove');
    if (!ismoving) {
      ismoving = true;
      loop();
    }

    points.last = points.current;
    setTouchPoints(evt, 'current');

    // evt.touches.length === 1 && phase.rm('pinch')
    // evt.touches.length > 1 && phase.or('pinch')
    if (evt.touches.length > 1) { phase.rm('pan').or('pinch'); }
    else {
      // if (phase.is('pinch')) trigger('panstart')
      phase.rm('pinch').or('pan');
      ga('xxxxxxxxxxx: ', phase.is('pan'));
    }
    // phase[evt.touches.length > 1 ? 'or' : 'rm']('pinch')

    if (phase.is('start') && !phase.is('pinch')) {
      Math.abs(points.current[0].x - points.start[0].x) < Math.abs(points.current[0].y - points.start[0].y) && phase.or('scroll');
      // phase.or('pan')
    }

    phase.rm('start').or('move');
    //
    // if (evt.touches.length === 1) phase = 16
  };

  var onend = function (evt) {
    // if (freeze) return
    ga('gesture.end');
    trigger('end');

    phase.rm('start', 'move').or('end');
    phase.is('scroll') && trigger('scrollend');
    phase.is('pinch') && trigger('pinchend');
    ismoving = false;
    phase.set(0);
  };

  var _off = function (evt, fn) { return handlers[evt].splice(handlers[evt].indexOf(fn), 1); };
  var _on = function (evt, fn) {
    handlers[evt].push(fn);
    return function () { return off(elm, evt, fn); }
  };

  on(elm, 'touchstart', onstart);
  on(elm, 'touchmove', onmove);
  on(elm, 'touchend', onend);

  return {
    on: _on, off: _off
    // destroy: () => {}
  }

  function render () {
    trigger('move');

    ga('yyyyyyyyyyyyy: ', phase.is('pan'));
    // ga(phase)

    phase.is('scroll') && trigger('scroll');
    phase.is('pinch') && trigger('pinch');
    phase.is('pan') && trigger('pan');
  }
}

// console.log('the best gallery is coming...')

var applyTranslateScale = function (elm, x, y, scale) { return elm.style.transform = "translate3d(" + x + "px," + y + "px,0) scale(" + scale + ")"; };
var applyOpacity = function (elm, opacity) { return elm.style.opacity = opacity; };

var html$2 = document.documentElement;
var doc_h$1 = function () { return html$2.clientHeight; };
var doc_w$1 = function () { return html$2.clientWidth; };

var showHideAnimationDuration = 333;
var showHideComplete = function (fn) { return setTimeout(fn, showHideAnimationDuration + 20); };
var getRect = function (elm) { return elm.getBoundingClientRect(); };

var getCenterPoint = function (p1, p2) { return ({x: (p1.x + p2.x) * .5, y: (p1.y + p2.y) * .5}); };
var square = function (x) { return x * x; };
var distance = function (p1, p2) { return Math.sqrt(square(p1.x - p2.x) + square(p1.y - p2.y)); };
var calculateZoomLevel = function (points) { return distance(points.current[0], points.current[1]) / distance(points.start[0], points.start[1]); };

var defaultOptions = {
  selector: 'data-gallery-item',
  dataset: 'galleryItem'
};

function gallery (options) {
  var opts = Object.assign({}, defaultOptions,
    options);

  var cache = [];
  var buildCache = function () {
    cache.splice(0, cache.length);
    document.querySelectorAll(("img[" + selector + "]")).forEach(function (img, index) {
      img.dataset.galleryIndex = index;
      var w = img.naturalWidth, h = img.naturalHeight;
      cache[index] = { elm: img, w: w, h: h, r: w / h };
    });
  };
  var getCacheItem = function (img) { return cache[Number(img.dataset.galleryIndex)]; };

  var setInitShape = function (img) {
    var item = getCacheItem(img);
    var docWidth = doc_w$1(), docHeight = doc_h$1();
    var thin = (docWidth / docHeight) > item.r;
    var w = thin ? docHeight * item.r : docWidth;
    var h = thin ? docHeight : docWidth / item.r;
    var x = thin ? (docWidth - w) / 2 : 0;
    var y = thin ? 0 : (docHeight - h) / 2;
    shape.init = {x: x, y: y, w: w, h: h, z: 1};
    return shape.init
  };
  var emptyshape = function () { return ({x: 0, y: 0, z: 1, w: 0, h: 0}); };

  // var x, y, w, h

  var shape = {init: emptyshape(), start: emptyshape(), last: emptyshape(), current: emptyshape()};

  // var gesture = gestureFactory()

  var selector = opts.selector;
  var dataset = opts.dataset;
  // the container
  var div = document.createElement('div');
  document.body.appendChild(div);

  var gallery, wrap, background, freeze = false;
  // var offDocClick, offTouchStart, offTouchMove, offTouchEnd
  var offStach = [];
  var offs = function (fn) { return offStach.push(fn); };

  // click document
  offs(on(document, 'click', function (evt) {
    var target = evt.target;
    if (target.tagName === 'IMG' && dataset in target.dataset) {
      buildCache();
      var sizes = setInitShape(target);
      div.innerHTML = tpls.main(target.src, sizes.w, sizes.h, target.dataset.galleryIndex);
      raf(function () { return init(target); });
    }
  }));

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

  var zoom = '';

  var gallery = {
    // on, off
    destroy: destroy
  };

  return gallery

  function destroy () {
    // TODO: leave the first click which is the document click, should be included in the future
    // TODO: remove all events and dom elements in destroy
    offStach.splice(1, offStach.length).forEach(function (o) { return o(); });
  }

  // TODO: reset all private variables
  function init (img) {
    gallery = div.childNodes[1];
    wrap = gallery.querySelector('.' + classes.wrap);
    background = gallery.querySelector('.' + classes.bg);

    var rect = getRect(img);
    disableTransition();
    applyTranslateScale(wrap, rect.left, rect.top, rect.width / shape.init.w);

    var gesture$$1 = opts.gesture = window.ges = gesture(wrap);

    // TODO: tap to toggle controls, double tap to zoom in / out
    offs(on(wrap, 'click', function (evt) { return hide(evt.target); }));

    offs(gesture$$1.on('scroll', onscroll));
    offs(gesture$$1.on('scrollend', onscrollend));
    offs(gesture$$1.on('pinch', onpinch));
    // offs(gesture.on('pinchstart', onpinchstart))
    offs(gesture$$1.on('pinchend', onpinchend));
    offs(gesture$$1.on('pan', onpan));
    // offs(gesture.on('panstart', onpanstart))

    offs(gesture$$1.on('start', onstart));
    offs(gesture$$1.on('move', onmove));

    gallery.style.display = 'block';
    raf(function () {
      show(img);
    });
  }

  function show (img) {
    // if (freeze) return
    // freeze = true
    enableTransition();
    // var sizes = size(img)

    applyTranslateScale(wrap, shape.init.x, shape.init.y, 1);
    applyOpacity(background, 1);
    showHideComplete(function () { return freeze = !!disableTransition(); });
  }

  function hide (img) {
    if (freeze) { return }
    freeze = true;
    enableTransition();
    var rect = getRect(getCacheItem(img).elm);
    // ga('hide.rect', rect)

    applyTranslateScale(wrap, rect.left, rect.top, rect.width / shape.init.w);
    applyOpacity(background, 0);
    showHideComplete(function () {
      freeze = !(gallery.style.display = 'none');
      destroy();
    });
  }

  function onscroll (points, target) {
    ga('onscroll');
    if (zoom !== '') { return }
    var yy = points.current[0].y - points.start[0].y;
    applyTranslateScale(wrap, shape.init.x, shape.init.y + yy, 1);
    var opacity = 1 - Math.abs(yy * 2 / doc_h$1());
    applyOpacity(background, opacity > 0 ? opacity : 0);
  }

  function onscrollend (points, target) {
    if (zoom !== '') { return }
    var yy = Math.abs(points.current[0].y - points.start[0].y);

    if (yy / doc_h$1() > 1/7) { hide(target); }
    else {
      enableTransition();
      applyTranslateScale(wrap, shape.init.x, shape.init.y, 1);
      applyOpacity(background, 1);
      showHideComplete(function () { return disableTransition(); });
    }
  }

  // function _onstart (points, target) {}
  //
  // function onstartpinch (points, target) {
  //   _onstart(points, target)
  // }

  function onpinch (points, target) {
    ga('onpinch');

    var zoomLevel = calculateZoomLevel(points); //* pinch.z
    var center1 = getCenterPoint(points.start[0], points.start[1]);
    var center2 = getCenterPoint(points.current[0], points.current[1]);

    var dx = center2.x - (center1.x - shape.start.x) * zoomLevel;
    var dy = center2.y - (center1.y - shape.start.y) * zoomLevel;

    var _zoom = zoomLevel * shape.start.z;
    zoom = _zoom > 1 ? 'in' : (_zoom < 1 ? 'out' : '');
    applyTranslateScale(wrap, dx, dy, _zoom);
    if (zoom === 'out') {
      var rect = getRect(getCacheItem(target).elm);
      // ga((shape.current.w - rect.width) / (shape.init.w - rect.width))
      shape.start.z <= 1 && applyOpacity(background, (shape.current.w - rect.width) / (shape.init.w - rect.width));
    }
  }

  function onpinchend(points, target) {
    if (zoom === 'out') {
      if (shape.start.z <= 1) { hide(target); }
      else { show(target); }
    }
    // zoom === 'out' && shape.start.z <= 1 && hide(target)
  }

  function onstart(points, target) {
    var rect = getRect(target);
    shape.start.x = shape.last.x = shape.current.x = rect.x;
    shape.start.y = shape.last.y = shape.current.y = rect.y;
    shape.start.w = shape.last.w = shape.current.w = rect.width;
    shape.start.h = shape.last.h = shape.current.h = rect.height;
    var _zoom = shape.start.z = shape.last.z = shape.current.z = rect.width / shape.init.w;
    zoom = _zoom > 1 ? 'in' : (_zoom < 1 ? 'out' : '');
  }

  function onmove(points, target) {
    ga('index.onmove');
    var rect = getRect(target);
    shape.current.x = rect.x;
    shape.current.y = rect.y;
    shape.current.w = rect.width;
    shape.current.h = rect.height;
    shape.current.z = rect.width / shape.init.w;
  }

  function onpan(points, target, phase) {
    // ga(zoom)
    ga('onpan');
    if (zoom === 'in') {
      // ga('zzz')
      // var zoomLevel = calculateZoomLevel(points) //* pinch.z
      // ga(zoomLevel)
      var dx = points.current[0].x - points.start[0].x + shape.start.x;
      var dy = points.current[0].y - points.start[0].y + shape.start.y;
      // ga({dx, dy})
      // ga('pan: ', {dx, dy, z: shape.start.z})
      applyTranslateScale(wrap, dx, dy, shape.start.z);
    }
  }
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
    [6,0,8,0,7,0,9,0,36,10,1,6,0,8,0,7,0,9,0,30,10,1,6,0,8,0,7,0,9,0,22,10,1,6,0,8,0,7,0,9,0,59,13,23,3,19,2,24,3,19,2,33,3,32,11,2,57,3,32,11,2,51,3,56,2,12,5,6,0,8,0,7,0,9,0,36,13,61,3,14,2,16,3,60,2,46,4,54,3,63,2,52,3,14,2,27,4,31,3,14,2,25,4,28,3,14,2,12,5,6,0,8,0,7,0,9,0,30,13,16,3,18,2,62,3,65,64,2,26,3,34,1,40,35,1,38,4,39,21,42,10,1,19,10,1,43,10,1,41,20,2,34,3,19,2,12,5,6,0,8,0,7,0,9,0,22,13,16,3,18,2,17,4,53,3,24,1,23,2,26,3,17,1,40,35,1,38,4,39,21,42,10,1,19,10,1,43,10,1,41,20,2,27,4,31,3,14,2,25,4,28,3,14,2,12,5,6,0,8,0,7,0,9,0,22,1,55,13,33,3,32,11,2,27,4,31,3,14,2,25,4,28,3,14,2,12,5,6,0,8,0,7,0,9,0,29,13,16,3,18,2,24,3,15,11,2,23,3,15,11,2,17,3,50,21,4,15,11,10,1,4,15,11,20,2,12,44,45,1,6,29,4,58,1,13,5,1,1,16,3,1,18,2,5,1,1,24,3,1,15,11,2,5,1,1,17,3,1,49,21,4,15,11,20,2,5,12,5,5,6,29,4,47,1,13,5,1,1,16,3,1,18,2,5,1,1,23,3,1,15,11,2,5,1,1,17,3,1,48,21,4,15,11,20,2,5,12,1,45,44,5,6,0,8,0,7,0,9,0,37,1,6,0,8,0,7,0,9,0,30,10,1,6,0,8,0,7,0,9,0,37,1,6,0,8,0,7,0,9,0,22,13,26,3,14,2,12],
    ["_"," ",";",":","-","\n",".","style","src","css",",","%","}","{","none","50","position","transform","absolute","0",")","(","wrap","top","left","user","transition","touch","select","center","bg","action","100","width","opacity","ms","gallery","disableTransition","cubic","bezier","333","1","0.4","0.22","/","*","z","v","translateY","translateX","translate","overflow","outline","origin","index","img","hidden","height","h","full","fixed","display","background","9999","000","#"],
    document.head.appendChild(document.createElement('link'))
));

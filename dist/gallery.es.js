import supportPassive from '@jiubao/passive';
import { raf } from '@jiubao/raf';
import swiper from 'swipe-core';

var passive = supportPassive();
var defaultEventOptions = passive ? {capture: false, passive: true} : false;

var on = function (element, evt, handler, options) {
  if ( options === void 0 ) options = defaultEventOptions;

  element.addEventListener(evt, handler, options);
  return function () { return off(element, evt, handler, options); }
};

var off = function (element, evt, handler, options) {
	if ( options === void 0 ) options = defaultEventOptions;

	return element.removeEventListener(evt, handler, options);
};
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

var dom = document.documentElement;
var doc_h = function () { return dom.clientHeight; };
var doc_w = function () { return dom.clientWidth; };

var classes = {
	gallery: "_src_style_css_gallery",
	bg: "_src_style_css_bg",
	full: "_src_style_css_full",
	swiper: "_src_style_css_swiper",
	swiperItem: "_src_style_css_swiperItem",
	swiperWrap: "_src_style_css_swiperWrap",
	wrap: "_src_style_css_wrap",
	center: "_src_style_css_center",
	disableTransition: "_src_style_css_disableTransition"
};

var templateObject$1 = Object.freeze(["\n      <div class=\"", "\" style=\"padding: 0 ", "px;\">\n        <div class=\"", "\" style=\"width: ", "px;\">\n          <img data-gallery-index=\"", "\" src=\"", "\" style=\"width: ", "px; height: ", "px;\"/>\n        </div>\n      </div>\n    "]);
var templateObject = Object.freeze(["\n<div class=\"", "\">\n  <div class=\"", "\"></div>\n  <div class=\"", "\" style=\"margin-left: -", "px; width: ", "px;\">\n    <div class=\"", "\">\n    ", "\n    </div>\n  </div>\n</div>\n"]);
// function htmlEscape(str) {
//     return str.replace(/&/g, '&amp;') // first!
//               .replace(/>/g, '&gt;')
//               .replace(/</g, '&lt;')
//               .replace(/"/g, '&quot;')
//               .replace(/'/g, '&#39;')
//               .replace(/`/g, '&#96;');
// }

    // <img data-gallery-index="${index}" src="${src}" style="width: ${width}px; height: ${height}px;" />
        // <div><img data-gallery-index="${index}" src="${src}" style="width: ${width}px; height: ${height}px;" /> </div>
      // `${srcs.forEach(src => `<div><img data-gallery-index="${index}" src="${src}" style="width: ${width}px; height: ${height}px;" /></div>`)}`

var half = ~~(doc_w() / 15);

var main = function (imgs) { return html(templateObject, classes.gallery, classes.bg, classes.swiper, half, imgs[0].shape.w + half * 2, classes.swiperWrap, imgs.map(function (img) { return html(templateObject$1, classes.swiperItem, half, classes.wrap, img.shape.w, img.i, img.src, img.shape.w, img.shape.h); }).join('')); };

var tpls = {main: main};

function enumFactory () {
  // TODO: should rm idle
  var value = 0, next = 1, enums = {'idle': 0};

  var get = function (v) { return typeof v === 'number' ? v : enums[v]; };
  var is = function (v) { return !!(value & get(v)); };
  var or = function (v) { return value = value | get(v); };
  var rm = function (v) { return value = value & ~get(v); };
  // const set = v => { value = get(v); return bit }
  var add = function (name) { enums[name] = next; next = next << 1; };
  var spread = function (fn, value) { return function () {
  var args = [], len = arguments.length;
  while ( len-- ) args[ len ] = arguments[ len ];
 args.forEach(function (arg) { return fn(arg); }); return bit }; };

  var bit = {
    v: function () { return value; },
    or: spread(or),
    rm: spread(rm),
    add: spread(add),
    is: function () {
      var args = [], len = arguments.length;
      while ( len-- ) args[ len ] = arguments[ len ];

      return args.reduce(function (result, arg) { return result && is(arg); }, true);
  },
    set: function () {
    var args = [], len = arguments.length;
    while ( len-- ) args[ len ] = arguments[ len ];
 value = args.reduce(function (r, v) { return r | get(v); }, 0); return bit }
    // get,
    // enums
  };

  return bit
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
  // TODO: rm window.phase
  var phase = window.phase = enumFactory().add('start', 'move', 'end', 'scroll', 'pinch', 'pan', 'swipe');
  var ismoving = false;
  var tapTimes = 0, tapStart = -1, tapLast = -1;

  var handlers = {
    // 'swipe': [],
    'tap': [],
    'single': [],
    'double': [],

    'start': [],
    'move': [],
    'end': [],

    'scroll': [],
    'scrollend': [],

    'pan': [],
    'panstart': [],
    'panend': [],

    'pinch': [],
    'pinchstart': [],
    'pinchend': [],

    'swipe': []
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
    // ga('gesture.start')
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
    if (!phase.is('pinch')) { tapStart = Date.now(); }
  };

  /// TODO: check pinch every time, if one point, switch behavior
  /// TODO: pinch / scroll: change status in onmove or trigger loop in onmove
  var onmove = function (evt) {
    // if (freeze) return
    // ga('gesture.onmove')

    points.last = points.current;
    setTouchPoints(evt, 'current');

    // evt.touches.length === 1 && phase.rm('pinch')
    // evt.touches.length > 1 && phase.or('pinch')
    if (evt.touches.length > 1) { phase.rm('pan').or('pinch'); }
    else {
      if (phase.is('pinch')) {
        setTouchPoints(evt, 'start');
        // ga('move.trigger.start')
        trigger('start');
      }
      phase.rm('pinch').or('pan');
      // ga('xxxxxxxxxxx: ', phase.is('pan'))
    }
    // phase[evt.touches.length > 1 ? 'or' : 'rm']('pinch')

    if (phase.is('start') && !phase.is('pinch')) {
      Math.abs(points.current[0].x - points.start[0].x) < Math.abs(points.current[0].y - points.start[0].y) && phase.or('scroll');
      // phase.or('pan')
    }

    if (phase.is('pan') && !phase.is('scroll')) { phase.or('swipe'); }

    phase.rm('start').or('move');
    //
    // if (evt.touches.length === 1) phase = 16

    if (!ismoving) {
      // TODO: change from two points to one points
      ismoving = true;
      loop();
    }
  };

  var onend = function (evt) {
    // if (freeze) return
    phase.rm('start', 'move').or('end');

    // ga('gesture.end')
    trigger('end');

    phase.is('scroll') && trigger('scrollend');
    phase.is('pinch') && trigger('pinchend');
    phase.is('pan') && trigger('panend');
    ismoving = false;
    // phase.set(0)

    // TODO: learn single / double logic
    if (!phase.is('pinch') && !phase.is('pan')) {
      var now = Date.now();
      if (now - tapStart <= 200) {
        trigger('tap');
        // if (now - tapLastTimestamp <= 200) tapTimes++
        // else tapTimes = 0

        tapTimes = now - tapLast <= 300 ? tapTimes + 1 : 1;
        tapLast = now;

        if (tapTimes === 1) { setTimeout(function () { return tapTimes === 1 && trigger('single'); }, 300); }
        else if (tapTimes === 2) { trigger('double'); }
      }
    }
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
    on: _on, off: _off, phase: function () { return phase; }
    // destroy: () => {}
  }

  function render () {
    trigger('move');

    // ga('yyyyyyyyyyyyy: ', phase.is('pan'))
    // ga(phase)

    phase.is('scroll') && trigger('scroll');
    phase.is('swipe') && trigger('swipe');
    phase.is('pinch') && trigger('pinch');
    phase.is('pan') && trigger('pan');

    // (phase.is('pan') && !phase.is('scroll')) && trigger('swipe')
  }
}

// console.log('the best gallery is coming...')

var applyTranslateScale = function (elm, x, y, scale) { return elm.style.transform = "translate3d(" + x + "px," + y + "px,0) scale(" + scale + ")"; };
var applyOpacity = function (elm, opacity) { return elm.style.opacity = opacity; };

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
      cache[index] = { elm: img, w: w, h: h, r: w / h, src: img.src, i: index };
      cache[index].shape = getInitShape(img);
    });
  };
  var getCacheItem = function (img) { return cache[Number(img.dataset.galleryIndex)]; };

  var getInitShape = function (img) {
    var item = getCacheItem(img);
    var docWidth = doc_w(), docHeight = doc_h();
    var thin = (docWidth / docHeight) > item.r;
    var w = thin ? docHeight * item.r : docWidth;
    var h = thin ? docHeight : docWidth / item.r;
    var x = thin ? (docWidth - w) / 2 : 0;
    var y = thin ? 0 : (docHeight - h) / 2;

    return {x: x, y: y, w: w, h: h, z: 1}

    // shape.init = {x, y, w, h, z: 1}
    // return shape.init
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
  var swiperDom, swiperInstance;
  // var offDocClick, offTouchStart, offTouchMove, offTouchEnd
  var offStach = [];
  var offs = function (fn) { return offStach.push(fn); };

  // click document
  offs(on(document, 'click', function (evt) {
    var target = evt.target;
    if (target.tagName === 'IMG' && dataset in target.dataset) {
      buildCache();
      // var sizes = setInitShape(target)
      var item = getCacheItem(target);
      shape.init = item.shape;
      div.innerHTML = tpls.main(cache);
      raf(function () { return init(item); });
    }
  }));

  var enableTransition = function () { return removeClass(gallery, classes.disableTransition); };
  var disableTransition = function () { return addClass(gallery, classes.disableTransition); };

  var stopSwiper = function () { return swiperInstance.stop(); };
  var startSwiper = function () { return swiperInstance.start(); };

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
  var swiping = false;
  // var occupy = 'idle' // idle, swipe, gesture

  var handlers = {
    single: function (points, target) {
      ga('single');
      // TODO: trigger wrong
      hide(target);
    },
    double: function (points, target) {
      ga('double.zoom: ', zoom);
      if (zoom !== 'out') {
        enableTransition();
        var init = shape.init;
        if (zoom === 'in') { applyTranslateScale(wrap, init.x, init.y, 1); }
        else {
          var ref = limitxy({
            x: init.x * 2 - points.start[0].x,
            y: init.y * 2 - points.start[0].y,
            w: init.w * 2,
            h: init.h * 2
          });
          var x = ref.x;
          var y = ref.y;
          applyTranslateScale(wrap, x, y, 2);
        }
        showHideComplete(function () {
          disableTransition();
          zoom === 'in' && startSwiper();
        });
      }
    },

    scroll: function (points, target) {
      // ga('onscroll')
      stopSwiper();
      if (zoom !== '') { return }
      var yy = points.current[0].y - points.start[0].y;
      applyTranslateScale(wrap, shape.init.x, shape.init.y + yy, 1);
      var opacity = 1 - Math.abs(yy * 2 / doc_h());
      applyOpacity(background, opacity > 0 ? opacity : 0);
    },
    scrollend: function (points, target) {
      if (zoom !== '') { return }
      var yy = Math.abs(points.current[0].y - points.start[0].y);

      if (yy / doc_h() > 1/7) { hide(target, startSwiper); }
      else {
        enableTransition();
        applyTranslateScale(wrap, shape.init.x, shape.init.y, 1);
        applyOpacity(background, 1);
        showHideComplete(function () {disableTransition(); startSwiper();});
      }
    },

    pinch: function (points, target) {
      // ga('onpinch')
      stopSwiper();

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
    },

    // TODO: 缩小露底问题
    pinchend: function (points, target) {
      if (zoom === 'out') {
        if (shape.start.z <= 1) { hide(target, startSwiper); }
        else { show(target, startSwiper); }
      }
    },

    // TODO: fast pan should have a panend animation
    // TODO: 拖拽卡顿
    pan: function (points, target, phase) {
      // ga(zoom)
      // ga('onpan')
      if (zoom === 'in') {
        stopSwiper();
        // ga('zzz')
        // var zoomLevel = calculateZoomLevel(points) //* pinch.z
        // ga(zoomLevel)
        var dx = points.current[0].x - points.start[0].x + shape.start.x;
        var dy = points.current[0].y - points.start[0].y + shape.start.y;
        // ga({dx, dy})
        // ga('pan: ', {dx, dy, z: shape.start.z})
        applyTranslateScale(wrap, dx, dy, shape.start.z);
      }
    },

    start: function (points, target) {
      var rect = getRect(target);
      shape.start.x = shape.last.x = shape.current.x = rect.x;
      shape.start.y = shape.last.y = shape.current.y = rect.y;
      shape.start.w = shape.last.w = shape.current.w = rect.width;
      shape.start.h = shape.last.h = shape.current.h = rect.height;
      var _zoom = shape.start.z = shape.last.z = shape.current.z = rect.width / shape.init.w;
      zoom = _zoom > 1 ? 'in' : (_zoom < 1 ? 'out' : '');
      // ga('onstart.shape: ', shape)
    },

    move: function (points, target) {
      // ga('index.onmove')
      var rect = getRect(target);
      shape.current.x = rect.x;
      shape.current.y = rect.y;
      shape.current.w = rect.width;
      shape.current.h = rect.height;
      shape.current.z = rect.width / shape.init.w;
    },

    end: function (points, target, phase) {
      if (phase.is('pan') || phase.is('pinch')) {
        if (zoom !== 'in') { return }

        var current = shape.current;
        var ref = limitxy(current);
        var x = ref.x;
        var y = ref.y;

        if (x === current.x && y === current.y) { return }

        enableTransition();
        applyTranslateScale(wrap, x, y, current.z);
        showHideComplete(function () { return disableTransition(); });
      }
    }

    // swipe: () => {
    //   swiping = true
    // }
  };

  Object.keys(handlers).forEach(function (key) {
    var fn = handlers[key];
    handlers[key] = function () {
      var args = [], len = arguments.length;
      while ( len-- ) args[ len ] = arguments[ len ];

      // console.log('event: ', key)
      // console.log('swiping', swiping)
      // if (!swiping || key === 'double') fn.apply(null, args)
      if (!swiping || key === 'double' || key === 'single') { fn.apply(null, args); }
    };
  });

  var gallery = {
    // on, off
    destroy: destroy,
    // get: () => {
    //   return {
    //     swiping,
    //     occupy
    //   }
    // }
  };

  return gallery

  function destroy () {
    // TODO: leave the first click which is the document click, should be included in the future
    // TODO: remove all events and dom elements in destroy
    offStach.splice(1, offStach.length).forEach(function (o) { return o(); });
  }

  // TODO: reset all private variables
  function init (item) {
    var img = item.elm;
    gallery = div.childNodes[1];
    background = gallery.querySelector('.' + classes.bg);
    swiperDom = gallery.querySelector('.' + classes.swiper);

    var rect = getRect(img);
    disableTransition();

    cache.forEach(function (c) {
      c.wrap = gallery.querySelector(("." + (classes.wrap) + " img[data-gallery-index=\"" + (c.i) + "\"]")).parentElement;
      if (c.i === item.i) { applyTranslateScale(c.wrap, rect.left, rect.top, rect.width / shape.init.w); }
      else { applyTranslateScale(c.wrap, c.shape.x, c.shape.y, 1); }

      var gesture$$1 = gesture(c.wrap);

      // TODO: tap to toggle controls, double tap to zoom in / out
      // offs(on(wrap, 'click', evt => hide(evt.target)))

      Object.keys(handlers).forEach(function (key) { return offs(gesture$$1.on(key, handlers[key])); });

      // offs(gesture.on('single', handlers.onsingle))
      // offs(gesture.on('double', handlers.ondouble))
      //
      // offs(gesture.on('scroll', handlers.onscroll))
      // offs(gesture.on('scrollend', handlers.onscrollend))
      //
      // // offs(gesture.on('pinchstart', onpinchstart))
      // offs(gesture.on('pinch', handlers.onpinch))
      // offs(gesture.on('pinchend', handlers.onpinchend))
      //
      // // offs(gesture.on('panstart', onpanstart))
      // offs(gesture.on('pan', handlers.onpan))
      // // offs(gesture.on('panend', onpanend))
      //
      // offs(gesture.on('start', handlers.onstart))
      // offs(gesture.on('move', handlers.onmove))
      // offs(gesture.on('end', handlers.onend))
    });

    wrap = item.wrap;

    swiperInstance = swiper({
      root: swiperDom,
      elms: Array.prototype.slice.apply(swiperDom.children[0].children),
      auto: false,
      index: item.i,
      expose: true,
      css: true
    });

    swiperInstance.on('move', function (index) {
      // console.log('swipe.move')
      swiping = true;
      // occupy = 'swipe'
    });
    swiperInstance.on('end', function (index) {
      wrap = cache[index].wrap;
      shape.init = cache[index].shape;
      swiping = false;
      // occupy = ''
    });

    swiping = false;
    // occupy = 'idle'

    // // var gesture = opts.gesture = window.ges = gestureFactory(wrap)
    // var gesture = gestureFactory(wrap)
    //
    // // TODO: tap to toggle controls, double tap to zoom in / out
    // // offs(on(wrap, 'click', evt => hide(evt.target)))
    //
    // offs(gesture.on('single', onsingle))
    // offs(gesture.on('double', ondouble))
    //
    // offs(gesture.on('scroll', onscroll))
    // offs(gesture.on('scrollend', onscrollend))
    //
    // // offs(gesture.on('pinchstart', onpinchstart))
    // offs(gesture.on('pinch', onpinch))
    // offs(gesture.on('pinchend', onpinchend))
    //
    // // offs(gesture.on('panstart', onpanstart))
    // offs(gesture.on('pan', onpan))
    // // offs(gesture.on('panend', onpanend))
    //
    // offs(gesture.on('start', onstart))
    // offs(gesture.on('move', onmove))
    // offs(gesture.on('end', onend))

    gallery.style.display = 'block';
    raf(function () {
      show(img);
    });
  }

  function show (img, callback) {
    // if (freeze) return
    // freeze = true
    enableTransition();
    // var sizes = size(img)

    applyTranslateScale(wrap, shape.init.x, shape.init.y, 1);
    applyOpacity(background, 1);
    showHideComplete(function () {
      freeze = !!disableTransition();
      callback && callback();
    });
  }

  function hide (img, callback) {
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
      callback && callback();
    });
  }

  // function _onstart (points, target) {}
  //
  // function onstartpinch (points, target) {
  //   _onstart(points, target)
  // }

  function limitxy (_shape) {
    var x = _shape.x;
    var y = _shape.y;
    var w = _shape.w;
    var h = _shape.h;
    var dw = doc_w(), dh = doc_h();

    if (dw > w) { x = (dw - w) / 2; }
    else if (x > 0) { x = 0; }
    else if (x < dw - w) { x = dw - w; }

    if (dh > h) { y = (dh - h) / 2; }
    else if (y > 0) { y = 0; }
    else if (y < dh - h) { y = dh - h; }

    return {x: x, y: y}
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
    [4,0,6,0,5,0,7,0,30,10,1,4,0,6,0,5,0,7,0,25,10,1,4,0,6,0,5,0,7,0,37,10,1,4,0,6,0,5,0,7,0,55,10,1,4,0,6,0,5,0,7,0,54,10,1,4,0,6,0,5,0,7,0,53,13,23,3,19,2,24,3,19,2,34,3,33,11,2,63,3,33,11,2,40,8,56,3,67,8,40,2,12,9,4,0,6,0,5,0,7,0,30,10,1,4,0,6,0,5,0,7,0,25,10,1,4,0,6,0,5,0,7,0,22,10,1,4,0,6,0,5,0,7,0,37,13,57,3,62,2,12,9,4,0,6,0,5,0,7,0,30,13,66,3,14,2,16,3,65,2,48,8,60,3,69,2,58,3,14,2,28,8,32,3,14,2,26,8,29,3,14,2,12,9,4,0,6,0,5,0,7,0,25,13,16,3,18,2,68,3,71,70,2,27,3,35,1,42,36,1,39,8,41,21,44,10,1,19,10,1,45,10,1,43,20,2,35,3,19,2,12,9,4,0,6,0,5,0,7,0,22,13,16,3,18,2,17,8,59,3,24,1,23,2,27,3,17,1,42,36,1,39,8,41,21,44,10,1,19,10,1,45,10,1,43,20,2,28,8,32,3,14,2,26,8,29,3,14,2,12,9,4,0,6,0,5,0,7,0,22,1,61,13,34,3,33,11,2,28,8,32,3,14,2,26,8,29,3,14,2,12,9,4,0,6,0,5,0,7,0,31,13,16,3,18,2,24,3,15,11,2,23,3,15,11,2,17,3,52,21,8,15,11,10,1,8,15,11,20,2,12,46,47,1,4,31,8,64,1,13,9,1,1,16,3,1,18,2,9,1,1,24,3,1,15,11,2,9,1,1,17,3,1,51,21,8,15,11,20,2,9,12,9,9,4,31,8,49,1,13,9,1,1,16,3,1,18,2,9,1,1,23,3,1,15,11,2,9,1,1,17,3,1,50,21,8,15,11,20,2,9,12,1,47,46,9,4,0,6,0,5,0,7,0,38,1,4,0,6,0,5,0,7,0,25,10,1,4,0,6,0,5,0,7,0,38,1,4,0,6,0,5,0,7,0,22,13,27,3,14,2,12],
    ["_"," ",";",":",".","style","src","css","-","\n",",","%","}","{","none","50","position","transform","absolute","0",")","(","wrap","top","left","bg","user","transition","touch","select","gallery","center","action","100","width","opacity","ms","full","disableTransition","cubic","box","bezier","333","1","0.4","0.22","/","*","z","v","translateY","translateX","translate","swiperWrap","swiperItem","swiper","sizing","overflow","outline","origin","index","img","hidden","height","h","fixed","display","border","background","9999","000","#"],
    document.head.appendChild(document.createElement('link'))
));

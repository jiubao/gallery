/*
 * @jiubao/gallery v0.0.29
 * (c) 2018-2018 jiubao
 * MIT License
 */
'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var utils = require('@jiubao/utils');
var raf = require('@jiubao/raf');
var hook = _interopDefault(require('@jiubao/hook'));
var swiper = _interopDefault(require('swipe-core'));

var doc_h = function () { return window.innerHeight; };
var doc_w = function () { return window.innerWidth; };

function prevent () {
  var handler = function (e) { return e.preventDefault(); };
  var opts = {passive: false};

  return {
    on: function () { return utils.on(document, 'touchmove', handler, opts); },
    off: function () { return utils.off(document, 'touchmove', handler, opts); }
  }
}

// data-gallery-item ===> galleryItem
var camelCase = function (str) { return str.split('-').slice(1).map(function (item, index) { return !index ? item : item.replace(/^./, function (match) { return match.toUpperCase(); }); }).join(''); };

var addStylesheetRules = function (str) {
  var style = document.createElement('style');
  document.head.appendChild(style);
  style.sheet.insertRule(str);
};

var gallery = "_0";
var bg = "_1";
var full = "_2";
var swiper$1 = "_3";
var swiperItem = "_4";
var swiperWrap = "_5";
var wrap = "_6";
var center = "_7";
var cls = {
	gallery: gallery,
	bg: bg,
	full: full,
	swiper: swiper$1,
	swiperItem: swiperItem,
	swiperWrap: swiperWrap,
	wrap: wrap,
	center: center
};

var templateObject$1 = Object.freeze(["\n      <div class=\"", "\" style=\"padding: 0 ", "px;\">\n        <div class=\"", "\" style=\"width: ", "px;\">\n          <img data-gallery-index=\"", "\" src=\"", "\" style=\"width: ", "px; height: ", "px;\"/>\n        </div>\n      </div>\n    "]);
var templateObject = Object.freeze(["\n<div class=\"", "\">\n  <div class=\"", "\"></div>\n  <div class=\"", "\" style=\"margin-left: -", "px; width: ", "px;\">\n    <div class=\"", "\">\n    ", "\n    </div>\n  </div>\n</div>\n"]);

var half = ~~(doc_w() / 15);

var main = function (imgs) { return utils.html(templateObject, cls.gallery, cls.bg, cls.swiper, half, doc_w() + half * 2, cls.swiperWrap, imgs.map(function (img) { return utils.html(templateObject$1, cls.swiperItem, half, cls.wrap, img.shape.w, img.i, img.src, img.shape.w, img.shape.h); }).join('')); };

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

var html = document.documentElement;
var touch2point = function (touch) { return ({x: touch.clientX, y: touch.clientY}); };

/*
 * tap, single, double, start, move, end, scroll, scrollend, pan, panstart, panend, pinch, pinchstart, pinchend, swipe
 */
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

  var target;
  var points = {
    start: [],
    last: [],
    current: []
  };

  var eventArg;
  // const trigger = evt => handlers[evt].forEach(fn => fn(points, target, phase, eventArg))
  var instance = Object.create(hook());
  var trigger = function (evt) { return instance.trigger(evt, points, target, phase, eventArg); };

  var loop = function () { if (ismoving) { raf.raf(loop); render(); }};

  var setTouchPoints = function (evt, item) {
    // if (!evt.touches || !evt.touches.length) return
    if (utils.isArray(item)) { return item.forEach(function (i) { return setTouchPoints(evt, i); }) }
    points[item] = [];
    if (utils.isString(item)) { points[item][0] = touch2point(evt.touches[0]); }
    if (evt.touches.length > 1) { points[item][1] = touch2point(evt.touches[1]); }
    // else points[item].splice(1, 10)
  };

  var onstart = function (evt) {
    eventArg = evt;
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
    eventArg = evt;
    // console.log('gesture.onmove')
    // if (freeze) return
    // ga('gesture.onmove')

    points.last = points.current;
    setTouchPoints(evt, 'current');

    // evt.touches.length === 1 && phase.rm('pinch')
    // evt.touches.length > 1 && phase.or('pinch')
    if (evt.touches.length > 1) { phase.rm('pan').or('pinch'); }
    else {
      if (phase.is('pinch')) {
        // console.log('pinch ===> start')
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
    eventArg = evt;
    // console.log('end...')
    // console.log('end.touches:', evt.touches)
    // if (freeze) return
    phase.rm('start', 'move').or('end');

    // ga('gesture.end')

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

    trigger('end');
  };

  var offs = [ utils.on(elm, 'touchstart', onstart), utils.on(elm, 'touchmove', onmove), utils.on(elm, 'touchend', onend) ];

  // return {
  //   on: _on, off: _off, phase: () => phase,
  //   destroy: () => offs.forEach(h => h())
  // }
  instance.phase = function () { return phase; };
  instance.destroy = function () {
    instance.$destroy();
    offs.forEach(function (h) { return h(); });
  };
  return instance

  function render () {
    trigger('move');

    // ga('yyyyyyyyyyyyy: ', phase.is('pan'))
    // ga(phase)

    // var _map = arr => JSON.stringify(arr.map(a => ({x: a.x.toFixed(0), y: a.y.toFixed(0)})))
    // console.log('current:', _map(points.current), 'start:', _map(points.start))

    phase.is('scroll') && trigger('scroll');
    phase.is('swipe') && trigger('swipe');
    phase.is('pinch') && trigger('pinch');
    phase.is('pan') && trigger('pan');

    // (phase.is('pan') && !phase.is('scroll')) && trigger('swipe')
  }
}

/*
 * animations
 *    1. show / hide
 *    2. post pan / pinch
 *    3. double tap
 *    4. opacity
 *    5. scroll end
 */

// console.log('the best gallery is coming...')
var easing = {
  'cubic': function (k) { return --k * k * k + 1; },
  // quart: k => 1 - Math.pow(1 - k, 4), // 1 - --k * k * k * k,
  // quint: k => 1 - Math.pow(1 - k, 5),
  // expo: k => k === 1 ? 1 : 1 - Math.pow(2, -10 * k),
  'circ': function (k) { return Math.sqrt(1 - Math.pow(k - 1, 2)); }
};

var applyTranslateScale = function (elm, x, y, scale) { return elm.style.transform = "translate3d(" + x + "px," + y + "px,0) scale(" + scale + ")"; };
var applyOpacity = function (elm, opacity) { return elm.style.opacity = opacity; };
var getRect = function (elm) { return elm.getBoundingClientRect(); };

var getCenterPoint = function (p1, p2) { return ({x: (p1.x + p2.x) * .5, y: (p1.y + p2.y) * .5}); };
var square = function (x) { return x * x; };
var distance = function (p1, p2) { return Math.sqrt(square(p1.x - p2.x) + square(p1.y - p2.y)); };
var calculateZoomLevel = function (points) { return distance(points.current[0], points.current[1]) / distance(points.start[0], points.start[1]); };

var preventDefault = prevent();

var defaultOptions = {
  selector: 'data-gallery-item'
};

function gallery$1 (options) {
  var opts = Object.assign({}, defaultOptions,
    options);

  var selector = opts.selector;
  addStylesheetRules(("[" + selector + "]{cursor:pointer;}")); // fix iOS wechat event bubble issue
  var dataset = camelCase(selector);
  var instance = Object.create(new hook());

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

    return {x: x, y: y, w: w, h: h, z: 1, t: thin}
  };

  var emptyshape = function () { return ({x: 0, y: 0, z: 1, w: 0, h: 0}); };

  var shape = {init: emptyshape(), start: emptyshape(), last: emptyshape(), current: emptyshape()};
  var thin = function () { return shape.init.t; };

  // the container
  var div = document.createElement('div');
  document.body.appendChild(div);

  var gallery$$1, wrap$$1, background, opacity = 0;
  var swiperDom, swiperInstance;
  var offStack = [];
  var moreStack = [];
  var offs = function (fn) { return offStack.push(fn); };

  // click document
  var onshow = function (img) {
    buildCache();
    if (!cache.length) { return }
    if (!img) { img = cache[0].elm; }
    var item = getCacheItem(img);
    shape.init = item.shape;
    div.innerHTML = tpls.main(cache);
    raf.raf(function () { return init(item); });
  };
  moreStack.push(utils.on(document, 'click', function (evt) {
    var target = evt.target;
    if (target.tagName === 'IMG' && dataset in target.dataset) {
      onshow(target);
    }
  }));

  var stopSwiper = function () {swiping = false; swiperInstance.stop();};
  var startSwiper = function () { return swiperInstance.start(); };

  var setShape = function (target, key) {
    var rect = getRect(target);

    var setByKey = function (key) {
      shape[key].x = rect.left;
      shape[key].y = rect.top;
      shape[key].w = rect.width;
      shape[key].h = rect.height;
      shape[key].z = rect[thin() ? 'height' : 'width'] / shape.init[thin() ? 'h' : 'w'];
    };

    utils.isArray(key) ? key.forEach(function (key) { return setByKey(key); }) : setByKey(key);
  };

  var setShape3 = function (target) { return setShape(target, ['start', 'current', 'last']); };

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
  var animations = { postpan: 0, main: 0, opacity: 0 };
  var clearAnimations = function () {
    Object.keys(animations).forEach(function (key) {
      raf.caf(animations[key]);
      animations[key] = 0;
    });
  };

  // var occupy = 'idle' // idle, swipe, gesture

  var animateDeceleration = function (boundary, target, current, last) {
    // console.log('animateDeceleration')
    var dx = (current.x - last.x) * 2;
    var dy = (current.y - last.y) * 2;
    // console.log('dx:', dx)
    var runtime = {
      phase: 'D', // D: deceleration, O: outofboundary, B: debounce, Z: stop
      ba: 0, // lower limit boundary
      bz: 0, // upper limit boundary
      oa: false, // out of lower limit
      oz: false, // out of upper limit
      start: 0, // debounce start
      now: 0, // debounce current
      interval: 0, // debounce interval
      from: 0, // debounce from
      to: 0, // debounce to

      v: 0, // x | y
      dv: 0, // dx | dy
      r: 1 // right|down: 1, left|up: -1, freeze: 0
    };

    var _dx = Math.abs(dx), _dy = Math.abs(dy);

    var it = {
      x: Object.assign({}, runtime, {v: current.x, dv: _dx, r: !dx ? dx : dx / _dx, ba: boundary.x1, bz :boundary.x2}),
      y: Object.assign({}, runtime, {v: current.y, dv: _dy, r: !dy ? dy : dy / _dy, ba: boundary.y1, bz: boundary.y2})
    };
    var ease = function (k) { return --k * k * k + 1; };

    var deceleration = function (axis) {
      var iz = it[axis];
      if (iz.phase !== 'D') { return }

      iz.dv *= .95;
      if (iz.dv <= .5) {
        iz.dv = 0;
      }

      iz.v += iz.dv * iz.r;

      iz.oa = iz.v <= iz.ba;
      iz.oz = iz.v >= iz.bz;

      // TODO: why write this login
      // if (iz.dv > 0) {
      //   iz.oa = iz.oa && iz.r <= 0
      //   iz.oz = iz.oz && iz.r >= 0
      // }

      // console.log('axiz:', axis)
      // console.log('oa:', iz.oa)
      // console.log('oz:', iz.oz)
      // console.log('r:', iz.r)
      // console.log('out:', (iz.oa && iz.r === 1) || (iz.oz && iz.r === -1))
      if ((iz.oa && iz.r === 1) || (iz.oz && iz.r === -1)) { prepareBounce(iz, true); }
      else if (iz.oa || iz.oz) { iz.phase = 'O'; }
      else if (iz.dv === 0) { iz.phase = 'Z'; }
    };

    var prepareBounce = function (iz, oneway) {
      iz.phase = 'B';
      iz.start = Date.now();
      iz.from = iz.v;
      iz.to = iz.oz ? iz.bz : iz.ba;
      var distance = Math.abs(iz.to - iz.from);
      var interval = 1000 * distance / doc_w();
      if (interval > 500) { interval = 500; }
      else if (interval < 150) { interval = 150; }
      // console.log('interval.a:', interval)

      if (oneway) {
        // console.log('dv:', iz.dv)
        // console.log('distance:', distance)
        // console.log('duration:', 16.67 * distance / iz.dv)
        var t = 16.67 * distance / iz.dv;
        if (t < interval) { interval = t; }
      }

      iz.interval = interval;
      // console.log('interval.b:', interval)
    };

    var out = function (axis) {
      var iz = it[axis];
      if (iz.phase !== 'O') { return }

      iz.dv = iz.dv * .8;
      if (iz.dv <= .5) {
        prepareBounce(iz);
      } else {
        iz.v += iz.dv * iz.r;
      }
    };

    var debounce = function (axis) {
      var iz = it[axis];
      if (iz.phase !== 'B') { return }

      iz.now = Date.now();
      var during = iz.now - iz.start;
      if (during >= iz.interval) {
        iz.v = iz.to;
        iz.phase = 'Z';
      }
      iz.v = (iz.to - iz.from) * ease(during / iz.interval) + iz.from;
    };

    ~function loop () {
      deceleration('x');
      deceleration('y');
      out('x');
      out('y');
      debounce('x');
      debounce('y');
      applyTranslateScale(wrap$$1, it.x.v, it.y.v, shape.current.z);

      if (it.x.phase !== 'Z' || it.y.phase !== 'Z') { animations.postpan = raf.raf(loop); }
      else { instance.trigger('postpan'); }
    }();

    // const stack = [
    //   () => deceleration('x'),
    //   () => deceleration('y'),
    //   () => out('x'),
    //   () => out('y'),
    //   () => debounce('x'),
    //   () => debounce('y'),
    //   () => applyTranslateScale(wrap, it.x.v, it.y.v, shape.current.z)
    // ]
    //
    // ~function loop2 () {
    //   animations.pan = raf(loop2)
    //   stack.forEach(fn => fn())
    // }()
  };

  function postpan (target, current, last) {
    // animateDeceleration(xyBoundary(shape.current), target, shape.current.x, shape.current.y, (current.x - last.x) * 2, (current.y - last.y) * 2)
    animateDeceleration(xyBoundary(shape.current), target, shape.current, shape.last);
  }

  var gestureEnabled = false;
  var enableGesture = function () { return gestureEnabled = true; };
  var disableGesture = function () { return gestureEnabled = false; };

  var gestures = [];
  var handlers = {
    single: function (points, target) {
      // TODO: trigger wrong
      // ga('single')
      // hide(target)
    },
    double: function (points, target) {
      // ga('double.zoom: ', zoom)
      if (zoom !== 'out') {
        stopSwiper();
        disableGesture();
        var init = shape.init;
        if (zoom === 'in') {
          zoom = '';
          show(target);
        } else {
          var ref = limitxy({
            x: init.x * 2 - points.start[0].x,
            y: init.y * 2 - points.start[0].y,
            w: init.w * 2,
            h: init.h * 2
          });
          var x = ref.x;
          var y = ref.y;
          animateTranslateScale(false, init, {x: x, y: y, z: 2}, null, function () {setShape3(target); enableGesture();});
          zoom = 'in';
        }
      }
    },

    scroll: function (points, target, phase, eventArgs) {
      // ga('onscroll')
      stopSwiper();
      if (zoom !== '') { return }
      var yy = points.current[0].y - points.start[0].y;
      applyTranslateScale(wrap$$1, shape.init.x, shape.init.y + yy, 1);
      opacity = 1 - Math.abs(yy * 2 / doc_h());
      applyOpacity(background, opacity > 0 ? opacity : 0);
      instance.trigger('scroll', points, target, phase, eventArgs);
    },
    scrollend: function (points, target, phase, eventArgs) {
      if (zoom !== '') { return }
      var yy = Math.abs(points.current[0].y - points.start[0].y);

      if (yy / doc_h() > 1/7) { hide(target); }
      else { show(target); }
      instance.trigger('scrollend', points, target, phase, eventArgs);
    },

    pinch: function (points, target) {
      // ga('pinch')
      stopSwiper();

      var zoomLevel = calculateZoomLevel(points); //* pinch.z
      var center1 = getCenterPoint(points.start[0], points.start[1]);
      var center2 = getCenterPoint(points.current[0], points.current[1]);

      var dx = center2.x - (center1.x - shape.start.x) * zoomLevel;
      var dy = center2.y - (center1.y - shape.start.y) * zoomLevel;

      // console.log('dx:', dx, ' | dy:', dy)

      var _zoom = zoomLevel * shape.start.z;
      zoom = _zoom > 1 ? 'in' : (_zoom < 1 ? 'out' : '');
      applyTranslateScale(wrap$$1, dx, dy, _zoom);
      if (zoom === 'out') {
        var rect = getRect(getCacheItem(target).elm);
        if (shape.start.z <= 1) { opacity = (shape.current.w - rect.width) / (shape.init.w - rect.width); }
      }

      if (shape.current.z >= 1) { opacity = 1; }

      applyOpacity(background, opacity);
    },

    pinchend: function (points, target, phase, evt) {
      // ga('pinchend')
      // console.log('pinchend')
      if (zoom === 'out') {
        if (shape.start.z <= 1 && shape.last.z > shape.current.z) { hide(target); }
        else { show(target); }
      // } else if (evt.touches.length === 0) {
        // console.log('xxxxxxxxxxx')
        // var last = getCenter(points)('last')
        // var current = getCenter(points)('current')
        // postpan(target, current, last)
      }
    },

    // TODO: 拖拽卡顿
    pan: function (points, target, phase, eventArgs) {
      // ga('pan')
      if (zoom === 'in') {
        stopSwiper();
        var dx = points.current[0].x - points.start[0].x + shape.start.x;
        var dy = points.current[0].y - points.start[0].y + shape.start.y;
        applyTranslateScale(wrap$$1, dx, dy, shape.start.z);
        instance.trigger('pan', points, target, phase, eventArgs);
      }
    },

    panend: function (points, target, phase, eventArgs) {
      // ga('panend')
		  // TODO: Avoid acceleration animation if speed is too low
      if (zoom === 'in') {
        postpan(target, points.current[0], points.last[0]);
        instance.trigger('panend', points, target, phase, eventArgs);
      }
    },

    start: function (points, target) {
      // console.log('start')
      clearAnimations();
      setShape3(target);
      var z = shape.start.z;
      zoom = z > 1 ? 'in' : (z < 1 ? 'out' : '');
    },

    end: function (points, target) {
      // TODO: tap the img during postpan will stop the animation, as a result we need recover postpan again onend. currently only recover postpan, should recover postpinch also.
      // if (zoom === 'in' && !animations.postpan) postpan(target, points.current[0], points.last[0])
    },

    move: function (points, target) {
      shape.last = Object.assign({}, shape.current);
      setShape(target, 'current');
    }
  };

  Object.keys(handlers).forEach(function (key) {
    var fn = handlers[key];
    handlers[key] = function () {
      var args = [], len = arguments.length;
      while ( len-- ) args[ len ] = arguments[ len ];

      if (gestureEnabled && (!swiping || ['single', 'double'].indexOf(key) >= 0)) {
        fn.apply(null, args);
        if (['pan', 'panend', 'scroll', 'scrollend'].indexOf(key) < 0) { instance.trigger.apply(instance, [ key ].concat( args )); }
      }
      // if (gestureEnabled && (!swiping || key === 'double' || key === 'single')) fn.apply(null, args)
      // instance.trigger(key, ...args)
    };
  });

  instance.hide = hide;
  instance.show = onshow;
  // caution: destroy can't rollback, if you still want to show the gallery, use hide
  instance.destroy = function () {
    release();
    moreStack.forEach(function (m) { return m(); });
    div.parentNode && div.parentNode.removeChild(div);
    instance.$destroy();
  };

  return instance

  function release () {
    // TODO: remove all events and dom elements in destroy
    // offStack.splice(1, offStack.length).forEach(o => o())
    offStack.forEach(function (o) { return o(); });
    preventDefault.off();
    gestures.forEach(function (g) { return g.destroy(); });
    gestures = [];
    swiperInstance.destroy();
    // div.innerHTML = ''
  }

  // TODO: reset all private variables
  function init (item, resize) {
    preventDefault.on();
    var img = item.elm;
    gallery$$1 = div.childNodes[1];
    background = gallery$$1.querySelector('.' + cls.bg);
    swiperDom = gallery$$1.querySelector('.' + cls.swiper);

    var rect = getRect(img);
    // disableTransition()

    cache.forEach(function (c) {
      c.wrap = gallery$$1.querySelector(("." + (cls.wrap) + " img[data-gallery-index=\"" + (c.i) + "\"]")).parentElement;
      if (c.i === item.i) { applyTranslateScale(c.wrap, rect.left, rect.top, rect.width / shape.init.w); }
      else { applyTranslateScale(c.wrap, c.shape.x, c.shape.y, 1); }

      var gesture$$1 = gesture(c.wrap);

      // TODO: tap to toggle controls, double tap to zoom in / out
      // offs(on(wrap, 'click', evt => hide(evt.target)))

      Object.keys(handlers).forEach(function (key) { return offs(gesture$$1.on(key, handlers[key])); });
      gestures.push(gesture$$1);
    });

    wrap$$1 = item.wrap;

    swiperInstance = swiper({
      root: swiperDom,
      elms: Array.prototype.slice.apply(swiperDom.children[0].children),
      auto: false,
      index: item.i,
      expose: true,
      css: true
    });

    swiperInstance.on('start', function (index) {
      instance.trigger('swipestart', index);
    });
    swiperInstance.on('move', function (index) {
      swiping = true;
      instance.trigger('swipe', index);
    });
    swiperInstance.on('end', function (index) {
      wrap$$1 = cache[index].wrap;
      shape.init = cache[index].shape;
      swiping = false;
      instance.trigger('swipeend', index);
    });

    swiping = false;

    gallery$$1.style.display = 'block';
    raf.raf(function () {
      if (resize) {
        var s = shape.init;
        applyTranslateScale(wrap$$1, s.x, s.y, s.z);
        applyOpacity(background, 1);
      } else { show(img); }
    });

    offs(utils.on(window, 'resize', function (evt) {
      release();
      buildCache();
      var item = getCacheItem(wrap$$1.firstElementChild);
      shape.init = item.shape;
      div.innerHTML = tpls.main(cache);
      raf.raf(function () { return init(item, true); });
    }));
  }

  // function animate (type, elm, from, to, interval, ease, onAnimation, onEnd) {
  //   var start = Date.now()
  //   var x = from.x, y = from.y, z = from.z
  //
  //   ~function loop () {
  //     onAnimation && onAnimation()
  //     var now = Date.now()
  //     var during = now - start
  //     if (during >= interval) {
  //       applyTranslateScale(elm, to.x, to.y, to.z)
  //       return onEnd && onEnd()
  //     }
  //
  //     const cal = p => (to[p] - from[p]) * easing[ease](during / interval) + from[p]
  //
  //     x = cal('x')
  //     y = cal('y')
  //     z = cal('z')
  //
  //     applyTranslateScale(elm, x, y, z)
  //     animations[type] = raf(loop)
  //   }()
  // }

  /*
   * interruptable: true | false
   */
  function animate (interruptable, type, elm, from, to, fn, move, interval, ease, onAnimation, onEnd) {
    var start = Date.now();
    ~function loop () {
      var next = function (from, to) { return (to - from) * easing[ease](during / interval) + from; };

      var now = Date.now();
      var during = now - start;
      if (during >= interval) {
        move(elm, to);
        onAnimation && onAnimation(to);
        return onEnd && onEnd()
      }
      var value = fn ? fn(from, to, next) : next(from, to);
      onAnimation && onAnimation(value);
      move(elm, value);
      var timer = raf.raf(loop);
      if (interruptable) { animations[type] = timer; }
      // animations[type] = raf(loop)
    }();
  }

  function animateTranslateScale (interruptable, from, to, onAnimation, onEnd) {
    animate(interruptable, 'main', wrap$$1, from, to, function (from, to, next) { return ({
      x: next(from.x, to.x), y: next(from.y, to.y), z: next(from.z, to.z)
    }); }, function (elm, opts) { return applyTranslateScale(elm, opts.x, opts.y, opts.z); }, 333, 'cubic', onAnimation, onEnd);
  }

  function animateOpacity (interruptable, from, to, onEnd) {
    animate(interruptable, 'opacity', background, from, to, null, function (elm, opts) { return applyOpacity(elm, opts); }, 333, 'cubic', function (v) {opacity = v;}, onEnd);
  }

  function show (img) {
    if (!img) {
      if (cache.length) { img = cache[0].elm; }
      else { return }
    }
    disableGesture();
    var rect = getRect(img);
    animateTranslateScale(false, {x: rect.left, y: rect.top, z: rect.width / shape.init.w}, shape.init, null, null);
    animateOpacity(false, opacity, 1, function () {
      // callback && callback();
      setShape3(img);
      startSwiper();
      enableGesture();
    });
    instance.trigger('show', img);
  }

  function hide (img) {
    if (!img) { img = wrap$$1.firstElementChild; }
    disableGesture();
    stopSwiper();
    var rect = getRect(getCacheItem(img).elm);

    animateTranslateScale(false, shape.current, {x: rect.left, y: rect.top, z: rect.width / shape.init.w});
    animateOpacity(false, opacity, 0, function () {
      gallery$$1.style.display = 'none';
      release();
    });
    instance.trigger('hide', img);
  }

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

  function xyBoundary (_shape) {
    var x = _shape.x;
    var y = _shape.y;
    var w = _shape.w;
    var h = _shape.h;
    var dw = doc_w(), dh = doc_h();
    var x1,  x2, y1, y2;
    if (dw > w) {
      x1 = x2 = (dw - w) / 2;
    } else {
      x1 = dw - w;
      x2 = 0;
    }
    if (dh > h) {
      y1 = y2 = (dh - h) / 2;
    } else {
      y1 = dh - h;
      y2 = 0;
    }
    return {x1: x1, x2: x2, y1: y1, y2: y2}
  }
}

module.exports = gallery$1;
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
    [3,2,9,5,4,3,2,19,5,4,3,2,23,5,4,3,2,43,5,4,3,2,42,5,4,3,2,41,7,14,1,9,0,15,1,9,0,20,1,18,8,0,34,1,18,8,0,22,10,26,1,37,10,22,0,6,11,3,2,9,5,4,3,2,19,5,4,3,2,17,5,4,3,2,23,7,27,1,33,0,6,11,3,2,9,7,36,1,30,0,12,1,35,0,24,10,31,1,39,0,6,11,3,2,19,7,12,1,16,0,38,1,47,44,0,29,1,9,0,6,11,3,2,17,7,12,1,16,0,21,10,28,1,15,4,14,0,6,11,3,2,17,4,32,7,20,1,18,8,0,6,11,3,2,40,7,12,1,16,0,15,1,13,8,0,14,1,13,8,0,21,1,25,46,10,13,8,5,4,10,13,8,45,0,6],
    [";",":","_","."," ",",","}","{","%","0","-","\n","position","50","top","left","absolute","6","100","1","width","transform","box","2","z","translate","sizing","overflow","origin","opacity","none","index","img","hidden","height","fixed","display","border","background","9999","7","5","4","3","000",")","(","#"],
    document.head.appendChild(document.createElement('link'))
));

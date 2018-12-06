(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global.gallery = factory());
}(this, (function () { 'use strict';

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

  function index (_) {
    var passive = false;

    function noop () {}

    var options = Object.defineProperty({}, 'passive', {
      get: function get () { passive = true; }
    });

    window.addEventListener('testPassive', noop, options);
    window.removeEventListener('testPassive', noop, options);
    return passive
  }

  var passive = index();
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

    return subsets.reduce(function (result, current, index$$1) { return result + current + literalSections[index$$1 + 1]; }, literalSections[0]);
  };

  var doc_h = function () { return window.innerHeight; };
  var doc_w = function () { return window.innerWidth; };

  function prevent () {
    var handler = function (e) { return e.preventDefault(); };
    var opts = {passive: false};

    return {
      on: function () { return on(document, 'touchmove', handler, opts); },
      off: function () { return off(document, 'touchmove', handler, opts); }
    }
  }

  var classes = {
  	gallery: "_src_style_css_gallery",
  	bg: "_src_style_css_bg",
  	full: "_src_style_css_full",
  	swiper: "_src_style_css_swiper",
  	swiperItem: "_src_style_css_swiperItem",
  	swiperWrap: "_src_style_css_swiperWrap",
  	wrap: "_src_style_css_wrap",
  	center: "_src_style_css_center"
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

  var main = function (imgs) { return html(templateObject, classes.gallery, classes.bg, classes.swiper, half, doc_w() + half * 2, classes.swiperWrap, imgs.map(function (img) { return html(templateObject$1, classes.swiperItem, half, classes.wrap, img.shape.w, img.i, img.src, img.shape.w, img.shape.h); }).join('')); };

  var tpls = {main: main};

  function eventFactory () {
    var handlers = Object.create(null);
    var get = function (evt) {
      if (!handlers[evt]) { handlers[evt] = []; }
      return handlers[evt]
    };
    var trigger = function (evt) {
    var args = [], len = arguments.length - 1;
    while ( len-- > 0 ) args[ len ] = arguments[ len + 1 ];
  get(evt).forEach(function (fn) { return fn.apply(null, args); });};

    var off = function (evt, fn) {
      if (fn) { get(evt).splice(get(evt).indexOf(fn), 1); }
      else { delete handlers[evt]; }
    };
    var on = function (evt, fn) {
      get(evt).push(fn);
      return function () { return off(evt, fn); }
    };

    return {
      on: on, off: off, trigger: trigger, $get: get, $destroy: function () {Object.keys(handlers).forEach(function (evt) {off(evt);});}
    }
  }

  // function eventFactory () {
  //   this.handlers = {}
  // }
  //
  // eventFactory.prototype = {
  //   get: evt => {
  //     if (!this.handlers[evt]) this.handlers.evt = []
  //     return this.handlers.evt
  //   },
  //   off: (evt, fn) => get(evt).splice(get(evt).indexOf(fn), 1),
  //   on: (evt, fn) => {
  //     this.get(evt).push(fn)
  //     return () => this.off(evt, fn)
  //   },
  //   trigger: (evt, ...args) => {
  //     get(evt).forEach(fn => fn.apply(null, args))
  //   },
  //   destroy: () => {}
  // }
  //
  // export default eventFactory

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
    var instance = Object.create(eventFactory());
    var trigger = function (evt) { return instance.trigger(evt, points, target, phase, eventArg); };

    var loop = function () { if (ismoving) { raf(loop); render(); }};

    var setTouchPoints = function (evt, item) {
      // if (!evt.touches || !evt.touches.length) return
      if (isArray(item)) { return item.forEach(function (i) { return setTouchPoints(evt, i); }) }
      points[item] = [];
      if (isString(item)) { points[item][0] = touch2point(evt.touches[0]); }
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

    var offs = [ on(elm, 'touchstart', onstart), on(elm, 'touchmove', onmove), on(elm, 'touchend', onend) ];

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

  function Link (arr) {
    var this$1 = this;

    arr.forEach(function (item) { return this$1.append(item); });
  }

  Link.prototype.append = function (item) {
    var node = item.$next = item.$prev = item;
    if (!this.$tail) { return this.$head = this.$tail = node }
    node.$prev = this.$tail;
    node.$next = this.$tail.$next;
    this.$tail.$next = node;
    node.$next.$prev = node;
    return this.$tail = node
  };

  var passive$1 = index();
  var defaultEventOptions$1 = passive$1 ? {capture: false, passive: true} : false;

  var on$1 = function (element, evt, handler, options) {
    if ( options === void 0 ) { options = defaultEventOptions$1; }

    element.addEventListener(evt, handler, options);
    return function () { return off$1(element, evt, handler, options); }
  };

  var off$1 = function (element, evt, handler, options) {
    if ( options === void 0 ) { options = defaultEventOptions$1; }

    element.removeEventListener(evt, handler, options);
  };

  var isFunction$1 = function (value) {
    return typeof value === 'function'
  };

  var inViewport = function (item) {
    var rect = item.getBoundingClientRect();
    return (rect.top < window.innerHeight && rect.bottom > 0) &&
      (rect.left < window.innerWidth && rect.right > 0)
  };

  var easing = {
    'cubic': function (k) { return --k * k * k + 1; },
    // quart: k => 1 - Math.pow(1 - k, 4), // 1 - --k * k * k * k,
    // quint: k => 1 - Math.pow(1 - k, 5),
    // expo: k => k === 1 ? 1 : 1 - Math.pow(2, -10 * k),
    'circ': function (k) { return Math.sqrt(1 - Math.pow(k - 1, 2)); }
  };

  // TODO: desktop support, mouse / pointer events
  // var touch = 'ontouchstart' in window
  // export var pointerdown = touch ? 'touchstart' : 'mousedown'
  // export var pointermove = touch ? 'touchmove' : 'mousemove'
  // export var pointerup = touch ? 'touchend' : 'mouseup'
  var pointerdown = 'touchstart';
  var pointermove = 'touchmove';
  var pointerup = 'touchend';

  var computedProp = function (el, prop) { return window.getComputedStyle(el, null).getPropertyValue(prop); };

  // export const requestFrame = fn => {
  //   var ticking = false
  //   return () => {
  //     if (!ticking) {
  //       raf(() => {
  //         fn()
  //         ticking = false
  //       })
  //       ticking = true
  //     }
  //   }
  // }

  function bitEnum () {
    this.value = 0;
  }
  bitEnum.prototype = {
    is: function (v) {
      return this.value & v
    },
    or: function (v) {
      this.value = this.value | v;
      return this
    },
    rm: function (v) {
      this.value = this.value & ~v;
      return this
    },
    set: function (v) {
      this.value = v;
      return this
    }
  };

  var options = { 'root': null, 'rootMargin': '0px', 'threshold': [0, 0.01] };

  var observable = !!window['IntersectionObserver'];

  var observe = function (el, fn) {
    if (!observable) { return fn() }
    var observer = new IntersectionObserver (fn, options);
    observer.observe(el);
    return function () { observer.unobserve(el); }
  };

  var FAST_THRESHOLD = 120; // threshold to identify fast swipe
  var FAST_INTERVAL = 250; // swipe duration in fast mode
  var MAX_INTERVAL = 1000; // total swipe duration
  var MAX_PART = MAX_INTERVAL * 2 / 3;
  var AUTO_TIMEOUT = 3000; // auto swipe interval

  // quote property name to pervent mangling
  var defaultOptions = {
    'auto': false,
    'cycle': true,
    'expose': false,
    'root': null, // required
    'elms': [], // required
    'index': 0,
    'width': window.screen.width, // if css is false, need width & height
    'height': 200,
    'css': false,
    'ease': 'cubic',
    'plugins': [],
    'initHandlers': [],
    'startHandlers': [],
    'moveHandlers': [],
    'endHandlers': [],
    'animationEndHandlers': []
  };

  function swipeIt (options) {
    // hidden div to store swipe elements which are out of current three
    var hides = document.createElement('div');
    hides.style.display = 'none';
    document.body.appendChild(hides);

    var opts = Object.assign({}, defaultOptions,
      options);

    var index$$1 = opts.index;
    var root = opts.root;
    var elms = opts.elms;
    var width = opts.width;
    var height = opts.height;
    var cycle = opts.cycle;
    var expose = opts.expose;
    var auto = opts.auto;
    var css = opts.css;
    var ease = opts.ease;
    var plugins = opts.plugins;

    plugins.forEach(function (p) { return Object.keys(p).forEach(function (action) { return opts[action + 'Handlers'].push(p[action]); }); });

    var onFn = function (action) { return function () {
      var arguments$1 = arguments;

      var args = [], len = arguments.length;
      while ( len-- ) { args[ len ] = arguments$1[ len ]; }

      return opts[action + 'Handlers'].forEach(function (f) { return f.apply(null, args); });
   }    };
    var onInit = onFn('init');
    var onStart = onFn('start');
    var onMove = onFn('move');
    var onEnd = onFn('end');
    // var onAnimationEnd = onFn('animationEnd')

    if (!root) { return }

    if (css) {
      width = Number(computedProp(root, 'width').slice(0, -2));
      height = Number(computedProp(root, 'height').slice(0, -2));
    }
    var main = root.children[0], animations = {main: -1, auto: -1}, threshold = width / 3;

    /* phase
     * 0000 0000: idle
     * 0000 0001: start
     * 0000 0010: dragging
     * 0000 0100: animating
     * 0000 1000: vertical scrolling
     * 0001 0000: auto animating
     * 0010 0000: cancel auto animating
     */

    var phaseEnum = {
      idle:     0,
      start:    1,
      drag:     2,
      animate:  4,
      scroll:   8,
      auto:     16,
      cancel:   32
    };
    var phase = new bitEnum();

    /* autoPhase
     * 0: distance <= width / 2
     * 1: distance > width / 2
     */
    var autoPhase = 0;
    var restartX = 0, direction = 0; // -1: left, 0: na, 1: right
    var x = 0, startTime = 0, startX = 0, currentX = 0, startY = 0, slides = [];
    var two = false;
    auto = cycle && auto;

    var current = elms[index$$1];

    // const moveE = el => moveX(el, el.x)
    var moveEx = function (el, x) { el.x = x; moveX(el, x); };
    var hide = function (el) { return hides.appendChild(el); };

    var show = function (el) { return main.appendChild(el); };
    var stopR = function (_) { return !cycle && currentX > startX && current === slides.$head; };
    var stopL = function (_) { return !cycle && currentX <= startX && current === slides.$tail; };

    var clearAuto = function (_) { return clearTimeout(animations.auto); };
    var clearAndCancel = function (_) { return clearAuto(phase.set(phaseEnum.cancel)); };
    var clearMain = function (_) { return caf(animations.main); };
    var clearAnimations = function (_) {clearAuto(); clearMain();};

    var running = true;

    var offStack = [];
    var on2 = function () {
      var arguments$1 = arguments;

      var args = [], len = arguments.length;
      while ( len-- ) { args[ len ] = arguments$1[ len ]; }

      return offStack.push(on$1.apply(null, args));
    };

    init();

    return {
      'destroy': destroy,
      'index': function (_) { return current.$index; },
      'on': function (evt, callback) {
        var fns = opts[evt + 'Handlers'];
        fns.push(callback);
        return function () { return fns.splice(fns.indexOf(callback), 1); }
      },
      stop: function () { return running = false; },
      start: function () { return running = true; }
    }

    function moveX (el, x) {
      if (!el) { return }
      el.style.transition = el.style.webkitTransition = '';
      el.style.transform = el.style.webkitTransform = "translate3d(" + x + "px, 0, 0)";
      onMove(current.$index, current, main, elms);
    }

    function onTouchStart (evt) {
      if (!running) { return }
      clearAnimations();
      phase.or(phaseEnum.start).rm(phaseEnum.scroll);
      direction = 0;

      var touch = evt.touches[0];
      startTime = Date.now();
      restartX = currentX = startX = touch.pageX;
      startY = touch.clientY;
      onStart(current.$index, current, main, elms);
    }

    function onTouchMove (evt) {
      if (!running) { return }
      if (phase.is(phaseEnum.scroll)) { return }

      var touch = evt.touches[0];
      var gap = touch.pageX - currentX;

      // identify vertical scrolling
      if (phase.is(phaseEnum.start) && Math.abs(gap) * 2 < Math.abs(touch.clientY - startY)) {
        phase.or(phaseEnum.scroll).rm(phaseEnum.start);
        return
      }

      var _d = gap > 0 ? 1 : -1;
      if (direction !== _d) {
        restartX = currentX;
        startTime = Date.now();
        direction = _d;
      }

      phase.set(phaseEnum.drag);
      currentX = touch.pageX;

      x = x + gap;
      // moveX(main, x)
      moveEx(main, x);

      // evt.preventDefault();
    }

    function moveRight () {
      two || hide(current.$next);
      current = current.$prev;
      if (!stopR()) {
        moveEx(current.$prev, current.x - width);
        show(current.$prev);
      }
    }

    function moveLeft () {
      two || hide(current.$prev);
      current = current.$next;
      if (!stopL()) {
        moveEx(current.$next, current.x + width);
        show(current.$next);
      }
    }

    function onAutoAnimation () {
      if (autoPhase === 0 && -current.x - x > width / 2) {
        autoPhase = 1;
        moveLeft();
      }
    }

    function autoSwipePostpone () {
      clearAuto();
      animations.auto = setTimeout(function () {
        if (!running) { return }
        autoSwipeImmediate();
      }, AUTO_TIMEOUT);
    }

    function autoSwipeImmediate () {
      autoPhase = 0;
      phase.set(phaseEnum.auto);
      onStart(current.$index, current, main, elms);
      animate(main, x, -current.x - width, MAX_PART, onAutoAnimation, autoSwipePostpone);
      // animate(main, x, x - width, MAX_INTERVAL, onAutoAnimation, autoCallback)
      // onEnd(current.$next.$index, current.$next, main, elms)
    }

    function autoSwipe() {
      if (Math.abs(x + current.x) > 3) { autoSwipeImmediate(); }
      else { autoSwipePostpone(); }
    }

    function onTouchEnd (evt) {
      if (!running) { return }
      // auto && autoCallback()
      if (phase.is(phaseEnum.scroll) && !phase.is(phaseEnum.animate) && !phase.is(phaseEnum.auto)) { return auto && autoSwipe(); }
      phase.set(phaseEnum.animate);
      var right = currentX > restartX;
      var fast = (Date.now() - startTime) < FAST_THRESHOLD;

      if (!stopR() && !stopL()) {
        var cx = current.x + x;
        if (fast) {
          if (right && cx > 0) { moveRight(); }
          else if (!right && cx < 0) { moveLeft(); }
        } else if (cx > threshold) { moveRight(); }
        else if (cx < -threshold) { moveLeft(); }
      }

      var to = current.x * -1;

      var t = Math.min(Math.max(MAX_INTERVAL * Math.abs(to - x) / width, FAST_INTERVAL), MAX_PART);
      animate(main, x, to, fast ? FAST_INTERVAL : t, null, auto ? function () { return autoSwipe(); } : null);
      // animate(main, x, to, fast ? FAST_INTERVAL : t)

      // onEnd(current.$index, current, main, elms)
    }

    function animate (elm, from, to, interval, onAnimation, callback) {
      var start = Date.now();
      function loop () {
        var now = Date.now();
        var during = now - start;
        if (during >= interval) { x = to; }
        isFunction$1(onAnimation) && onAnimation();
        if (during >= interval) {
          // moveX(elm, to)
          moveEx(elm, to);
          !phase.is(phaseEnum.cancel) && isFunction$1(callback) && callback();
          phase.set(phaseEnum.idle);
          // return onAnimationEnd(current.$index, current, main, elms)
          return onEnd(current.$index, current, main, elms)
        }
        var distance = (to - from) * easing[ease](during / interval) + from;
        x = distance;
        // moveX(elm, distance)
        moveEx(elm, x);
        animations.main = raf(loop);
      }
      loop();
    }

    function init () {
      if (elms.length === 0) { return onInit(-1) }
      // if (!expose) root.style.overflow = 'hidden'
      root.style.position = 'relative';
      if (!css) {
        root.style.width = width + 'px';
        root.style.height = height + 'px';
      }
      var needClone = elms.length === 2 && cycle;
      if (needClone) {
        elms.push(elms[0].cloneNode(true));
        show(elms[2]);
        elms.push(elms[1].cloneNode(true));
        show(elms[3]);
        elms[0].$index = elms[2].$index = 0;
        elms[1].$index = elms[3].$index = 1;
      }
      var one = elms.length === 1;
      two = elms.length === 2;
      // slides = new Link(elms, needClone ? '0101' : null)
      slides = new Link(elms);
      needClone || elms.forEach(function (e, i) { return e.$index = i; });

      moveEx(current, 0);
      one || two || moveEx(current.$prev, -width);
      one || moveEx(current.$next, width);
      elms.forEach(function (el) {
        el.style.position = 'absolute';
        if (!css) {
          el.style.width = width + 'px';
          el.style.height = height + 'px';
        }
        // el.style.overflow = 'hidden'
        if (!two && !one && el !== current && el !== current.$prev && el !== current.$next) { hide(el); }
      });

      if (one) { return onInit(current.$index, current, main, elms) }

      if (!two && !cycle && index$$1 === 0) { hide(current.$prev); }
      if (!two && !cycle && index$$1 === elms.length - 1) { hide(current.$next); }

      // destroy()
      on2(root, pointerdown, onTouchStart);
      on2(root, pointermove, onTouchMove);
      on2(root, pointerup, onTouchEnd);

      if (auto) {
        // stop auto swipe when out of screen
        if (observable) {
          raf(function () {
            opts.unobserve = observe(root, function (entries) {
              if (entries && entries[0].intersectionRatio === 0) { clearAndCancel(); }
              else { autoSwipe(); }
            });
          });
        } else {
          var toggleSwiper = function () { return inViewport(root) ? autoSwipePostpone() : clearAndCancel(); };
          on2(window, 'touchmove', function () { return inViewport(root) || clearAndCancel(); });
          on2(window, 'touchend', toggleSwiper);
          toggleSwiper();
        }

        // stop auto swipe when invisible
        // Set the name of the hidden property and the change event for visibility
        var ref = ['webkit', 'moz', 'ms', '-'].reduce(function (result, current) { return typeof document[result[0]] !== 'undefined' ? result : [current + 'Hidden', current + 'visibilitychange']; }, ['hidden', 'visibilitychange']);
        var hidden = ref[0];
        var visibilitychange = ref[1];
        // Handle page visibility change
        hidden[0] !== '-' && on2(document, 'visibilitychange', function () {document[hidden] ? clearAndCancel() : autoSwipePostpone();}, false);
      }

      main.x = 0;
      onInit(current.$index, current, main, elms);
    }

    function destroy () {
      clearAnimations();
      isFunction$1(opts.unobserve) && opts.unobserve();
      offStack.forEach(function (fn) { return fn(); });
      hides.parentNode && hides.parentNode.removeChild(hides);
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
  var easing$1 = {
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

  var defaultOptions$1 = {
    selector: 'data-gallery-item',
    dataset: 'galleryItem'
  };

  function gallery (options) {
    var opts = Object.assign({}, defaultOptions$1,
      options);

    var selector = opts.selector;
    var dataset = opts.dataset;
    var instance = Object.create(new eventFactory());

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

    var gallery, wrap, background, opacity = 0;
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
      raf(function () { return init(item); });
    };
    moreStack.push(on(document, 'click', function (evt) {
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
        shape[key].x = rect.x;
        shape[key].y = rect.y;
        shape[key].w = rect.width;
        shape[key].h = rect.height;
        shape[key].z = rect[thin() ? 'height' : 'width'] / shape.init[thin() ? 'h' : 'w'];
      };

      isArray(key) ? key.forEach(function (key) { return setByKey(key); }) : setByKey(key);
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
        caf(animations[key]);
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
        applyTranslateScale(wrap, it.x.v, it.y.v, shape.current.z);

        if (it.x.phase !== 'Z' || it.y.phase !== 'Z') { animations.postpan = raf(loop); }
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
        applyTranslateScale(wrap, shape.init.x, shape.init.y + yy, 1);
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
        applyTranslateScale(wrap, dx, dy, _zoom);
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
          applyTranslateScale(wrap, dx, dy, shape.start.z);
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
      gallery = div.childNodes[1];
      background = gallery.querySelector('.' + classes.bg);
      swiperDom = gallery.querySelector('.' + classes.swiper);

      var rect = getRect(img);
      // disableTransition()

      cache.forEach(function (c) {
        c.wrap = gallery.querySelector(("." + (classes.wrap) + " img[data-gallery-index=\"" + (c.i) + "\"]")).parentElement;
        if (c.i === item.i) { applyTranslateScale(c.wrap, rect.left, rect.top, rect.width / shape.init.w); }
        else { applyTranslateScale(c.wrap, c.shape.x, c.shape.y, 1); }

        var gesture$$1 = gesture(c.wrap);

        // TODO: tap to toggle controls, double tap to zoom in / out
        // offs(on(wrap, 'click', evt => hide(evt.target)))

        Object.keys(handlers).forEach(function (key) { return offs(gesture$$1.on(key, handlers[key])); });
        gestures.push(gesture$$1);
      });

      wrap = item.wrap;

      swiperInstance = swipeIt({
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
        wrap = cache[index].wrap;
        shape.init = cache[index].shape;
        swiping = false;
        instance.trigger('swipeend', index);
      });

      swiping = false;

      gallery.style.display = 'block';
      raf(function () {
        if (resize) {
          var s = shape.init;
          applyTranslateScale(wrap, s.x, s.y, s.z);
          applyOpacity(background, 1);
        } else { show(img); }
      });

      offs(on(window, 'resize', function (evt) {
        release();
        buildCache();
        var item = getCacheItem(wrap.firstElementChild);
        shape.init = item.shape;
        div.innerHTML = tpls.main(cache);
        raf(function () { return init(item, true); });
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
        var next = function (from, to) { return (to - from) * easing$1[ease](during / interval) + from; };

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
        var timer = raf(loop);
        if (interruptable) { animations[type] = timer; }
        // animations[type] = raf(loop)
      }();
    }

    function animateTranslateScale (interruptable, from, to, onAnimation, onEnd) {
      animate(interruptable, 'main', wrap, from, to, function (from, to, next) { return ({
        x: next(from.x, to.x), y: next(from.y, to.y), z: next(from.z, to.z)
      }); }, function (elm, opts) { return applyTranslateScale(elm, opts.x, opts.y, opts.z); }, 333, 'cubic', onAnimation, onEnd);
    }

    function animateOpacity (interruptable, from, to, onEnd) {
      animate(interruptable, 'opacity', background, from, to, null, function (elm, opts) { return applyOpacity(elm, opts); }, 333, 'cubic', function (v) { return opacity = v; }, onEnd);
    }

    function show (img) {
      if (!img) {
        if (cache.length) { img = cache[0].elm; }
        else { return }
      }
      disableGesture();
      var rect = getRect(img);
      animateTranslateScale(false, {x: rect.x, y: rect.y, z: rect.width / shape.init.w}, shape.init, null, null);
      animateOpacity(false, opacity, 1, function () {
        // callback && callback();
        setShape3(img);
        startSwiper();
        enableGesture();
      });
      instance.trigger('show', img);
    }

    function hide (img) {
      if (!img) { img = wrap.firstElementChild; }
      disableGesture();
      stopSwiper();
      var rect = getRect(getCacheItem(img).elm);

      animateTranslateScale(false, shape.current, {x: rect.x, y: rect.y, z: rect.width / shape.init.w});
      animateOpacity(false, opacity, 0, function () {
        gallery.style.display = 'none';
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

  return gallery;

})));
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
    [4,0,9,0,8,0,10,0,32,7,1,4,0,9,0,8,0,10,0,27,7,1,4,0,9,0,8,0,10,0,39,7,1,4,0,9,0,8,0,10,0,55,7,1,4,0,9,0,8,0,10,0,54,7,1,4,0,9,0,8,0,10,0,53,13,25,3,21,2,26,3,21,2,36,3,35,11,2,63,3,35,11,2,42,5,56,3,67,5,42,2,12,6,4,0,9,0,8,0,10,0,32,7,1,4,0,9,0,8,0,10,0,27,7,1,4,0,9,0,8,0,10,0,24,7,1,4,0,9,0,8,0,10,0,39,13,57,3,62,2,12,6,4,0,9,0,8,0,10,0,32,13,66,3,14,2,18,3,65,2,48,5,60,3,69,2,58,3,14,2,30,5,34,3,14,2,28,5,31,3,14,2,12,6,4,0,9,0,8,0,10,0,27,13,18,3,20,2,68,3,71,70,2,16,17,1,29,3,1,37,1,44,38,1,41,5,43,23,46,7,1,21,7,1,47,7,1,45,22,2,1,17,16,37,3,21,2,12,6,4,0,9,0,8,0,10,0,24,13,18,3,20,2,19,5,59,3,26,1,25,2,16,17,1,29,3,1,19,1,44,38,1,41,5,43,23,46,7,1,21,7,1,47,7,1,45,22,2,1,17,16,30,5,34,3,14,2,28,5,31,3,14,2,12,6,4,0,9,0,8,0,10,0,24,1,61,13,36,3,35,11,2,30,5,34,3,14,2,28,5,31,3,14,2,12,6,4,0,9,0,8,0,10,0,33,13,18,3,20,2,26,3,15,11,2,25,3,15,11,2,19,3,52,23,5,15,11,7,1,5,15,11,22,2,12,16,17,1,4,33,5,64,1,13,6,1,1,18,3,1,20,2,6,1,1,26,3,1,15,11,2,6,1,1,19,3,1,51,23,5,15,11,22,2,6,12,6,6,4,33,5,49,1,13,6,1,1,18,3,1,20,2,6,1,1,25,3,1,15,11,2,6,1,1,19,3,1,50,23,5,15,11,22,2,6,12,1,17,16,16,17,1,4,40,1,4,27,7,1,4,40,1,4,24,1,13,6,1,1,29,3,1,14,2,6,12,1,17,16],
    ["_"," ",";",":",".","-","\n",",","style","src","css","%","}","{","none","50","/","*","position","transform","absolute","0",")","(","wrap","top","left","bg","user","transition","touch","select","gallery","center","action","100","width","opacity","ms","full","disableTransition","cubic","box","bezier","333","1","0.4","0.22","z","v","translateY","translateX","translate","swiperWrap","swiperItem","swiper","sizing","overflow","outline","origin","index","img","hidden","height","h","fixed","display","border","background","9999","000","#"],
    document.head.appendChild(document.createElement('link'))
));

/*!
 * tiny-popup-menu - v1.0.0
 * https://github.com/GastonZalba/tiny-popup-menu#readme
 * Built: Fri Sep 01 2023 10:39:40 GMT-0300 (Argentina Standard Time)
*/
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.TinyPopupMenu = factory());
})(this, (function () { 'use strict';

  var tinyEmitter = {exports: {}};

  function E () {
    // Keep this empty so it's easier to inherit from
    // (via https://github.com/lipsmack from https://github.com/scottcorgan/tiny-emitter/issues/3)
  }

  E.prototype = {
    on: function (name, callback, ctx) {
      var e = this.e || (this.e = {});

      (e[name] || (e[name] = [])).push({
        fn: callback,
        ctx: ctx
      });

      return this;
    },

    once: function (name, callback, ctx) {
      var self = this;
      function listener () {
        self.off(name, listener);
        callback.apply(ctx, arguments);
      }
      listener._ = callback;
      return this.on(name, listener, ctx);
    },

    emit: function (name) {
      var data = [].slice.call(arguments, 1);
      var evtArr = ((this.e || (this.e = {}))[name] || []).slice();
      var i = 0;
      var len = evtArr.length;

      for (i; i < len; i++) {
        evtArr[i].fn.apply(evtArr[i].ctx, data);
      }

      return this;
    },

    off: function (name, callback) {
      var e = this.e || (this.e = {});
      var evts = e[name];
      var liveEvents = [];

      if (evts && callback) {
        for (var i = 0, len = evts.length; i < len; i++) {
          if (evts[i].fn !== callback && evts[i].fn._ !== callback)
            liveEvents.push(evts[i]);
        }
      }

      // Remove event from queue to prevent memory leak
      // Suggested by https://github.com/lazd
      // Ref: https://github.com/scottcorgan/tiny-emitter/commit/c6ebfaa9bc973b33d110a84a307742b7cf94c953#commitcomment-5024910

      (liveEvents.length)
        ? e[name] = liveEvents
        : delete e[name];

      return this;
    }
  };

  tinyEmitter.exports = E;
  var TinyEmitter = tinyEmitter.exports.TinyEmitter = E;

  function createElement(tagName, attrs = {}, ...children) {
      if (typeof tagName === 'function')
          return tagName(attrs, children);
      const elem = tagName === null
          ? new DocumentFragment()
          : document.createElement(tagName);
      Object.entries(attrs || {}).forEach(([name, value]) => {
          if (typeof value !== undefined &&
              value !== null &&
              value !== undefined) {
              if (name.startsWith('on') && name.toLowerCase() in window)
                  elem.addEventListener(name.toLowerCase().substr(2), value);
              else {
                  if (name === 'className')
                      elem.setAttribute('class', value.toString());
                  else if (name === 'htmlFor')
                      elem.setAttribute('for', value.toString());
                  else
                      elem.setAttribute(name, value.toString());
              }
          }
      });
      for (const child of children) {
          if (!child)
              continue;
          if (Array.isArray(child))
              elem.append(...child);
          else {
              if (child.nodeType === undefined)
                  elem.innerHTML += child;
              else
                  elem.appendChild(child);
          }
      }
      return elem;
  }

  const ID = 'popup-menu';
  const CLASS_CONTAINER = ID + '--container';
  const CLASS_OPEN = ID + '--active';
  const CLASS_SHOW_ARROW = ID + '--show-arrow';
  const CLASS_SHOW_ARROW_TOP = ID + '--show-arrow-top';
  const CLASS_SHOW_ARROW_BOTTOM = ID + '--show-arrow-bottom';
  const CLASS_ITEM = ID + '--item';
  const CLASS_ITEM_SEPARATOR = ID + '--item-separator';
  let instances = 1;
  /**
   *
   * @param target
   * @param sources
   * @returns
   */
  const deepObjectAssign = (target, ...sources) => {
      sources.forEach((source) => {
          Object.keys(source).forEach((key) => {
              const s_val = source[key];
              const t_val = target[key];
              target[key] =
                  t_val &&
                      s_val &&
                      typeof t_val === 'object' &&
                      typeof s_val === 'object' &&
                      !Array.isArray(t_val) // Don't merge arrays
                      ? deepObjectAssign(t_val, s_val)
                      : s_val;
          });
      });
      return target;
  };
  /**
   * @fires open
   * @fires close
   * @fires updateposition
   */
  class TinyPopupMenu extends TinyEmitter {
      constructor(options = null) {
          super();
          this._isOpen = false;
          this._containerMenu = createElement("div", { id: `${ID}-${instances}` });
          this._instanceOptions = this._parseOptions(options);
          instances++;
      }
      /**
       * Open Menu
       * @fires open
       * @param options
       * @returns
       */
      open(options) {
          if (this._isOpen) {
              // clean menu items
              this.close();
              // if the same button is clicked, do not reopen
              if (options.event.currentTarget === this._toggler) {
                  options.event.preventDefault();
                  options.event.stopPropagation();
                  return;
              }
          }
          this._options = this._parseOptions(options);
          const { event, menuItems, autoClose } = this._options;
          this._toggler = event.currentTarget;
          this._menuItemsList = menuItems.map((item) => {
              if (item === '-') {
                  return createElement("span", { className: CLASS_ITEM_SEPARATOR });
              }
              else {
                  return (createElement("div", { className: CLASS_ITEM + ' ' + (item.className || ''), onClick: item.callback
                          ? (event) => {
                              item.callback(event);
                              if (autoClose)
                                  this.close();
                          }
                          : null, id: item.id, style: item.style }, item.content));
              }
          });
          this._isOpen = true;
          this.updatePosition();
          this.addEventListeners();
          this.emit('open');
          event.preventDefault();
          event.stopPropagation();
      }
      /**
       * @fires close
       * Close menu
       */
      close() {
          this._containerMenu.innerHTML = '';
          this._containerMenu.remove();
          this._toggler.classList.remove(CLASS_OPEN);
          this._isOpen = false;
          this.removeEventListeners();
          this.emit('close');
      }
      /**
       * Update the position of an opened menu
       * @fires updateposition
       */
      updatePosition(silent = true) {
          /**
           * Check if the default position is ok or needs to be inverted
           */
          const evaluatePosition = () => {
              if (position === "top" /* Position.Top */) {
                  if (togglerPosition.top + menuHeight + offsetTop + margin <=
                      0) {
                      return "bottom" /* Position.Bottom */;
                  }
              }
              else if (position === "bottom" /* Position.Bottom */) {
                  if (togglerPosition.top +
                      menuHeight +
                      offsetTop +
                      togglerHeight +
                      margin >=
                      document.documentElement.scrollHeight) {
                      return "top" /* Position.Top */;
                  }
              }
              return position;
          };
          if (!this._isOpen)
              return;
          const { offset, className, arrow, position, margin } = this._options;
          this._containerMenu.style.position = 'fixed';
          this._containerMenu.className = className;
          this._containerMenu.classList.add(ID);
          if (arrow) {
              this._containerMenu.classList.add(CLASS_SHOW_ARROW);
          }
          this._containerMenu.innerHTML = '';
          this._containerMenu.append(createElement("div", { className: CLASS_CONTAINER }, ...this._menuItemsList));
          document.body.append(this._containerMenu);
          const togglerPosition = this._toggler.getBoundingClientRect();
          const togglerHeight = this._toggler.offsetHeight;
          const togglerWidth = this._toggler.offsetWidth;
          const offsetLeft = (offset === null || offset === void 0 ? void 0 : offset.x) || 0;
          const offsetTop = (offset === null || offset === void 0 ? void 0 : offset.y) || 0;
          // Button height + menu height
          const menuHeight = this._containerMenu.offsetHeight;
          const menuWidth = this._containerMenu.offsetWidth;
          // If menu is near bottom, show upright
          const finalPosition = evaluatePosition();
          let compensateMenuHeight = 0;
          let compensateMenuWidthToCenter = 0;
          switch (finalPosition) {
              case "bottom" /* Position.Bottom */:
                  compensateMenuHeight = offsetTop + togglerHeight + margin;
                  compensateMenuWidthToCenter = -menuWidth / 2 + togglerWidth / 2;
                  break;
              case "top" /* Position.Top */:
                  compensateMenuHeight = -menuHeight - margin;
                  compensateMenuWidthToCenter = -menuWidth / 2 + togglerWidth / 2;
                  break;
          }
          const windowWidth = window.innerWidth;
          const calcualteLeft = togglerPosition.left + offsetLeft + compensateMenuWidthToCenter;
          let adjustX = 0;
          // it's outside the left border
          if (calcualteLeft < 0) {
              adjustX = 0 - calcualteLeft + margin;
          }
          else if (calcualteLeft + menuWidth > windowWidth) {
              // it's outside the right border
              adjustX = windowWidth - (calcualteLeft + menuWidth) - margin;
          }
          this._containerMenu.style.left = calcualteLeft + adjustX + 'px';
          this._containerMenu.style.top =
              togglerPosition.top + compensateMenuHeight + 'px';
          this._toggler.classList.add(CLASS_OPEN);
          if (arrow) {
              // displace X css arrow
              this._containerMenu.style.setProperty('--ofx', `${adjustX + 5}px`);
              this._evaluateArrowPosition(finalPosition);
          }
          if (!silent) {
              this.emit('updateposition');
          }
      }
      /**
       * Instead of creating onclick listeners on each toggler/button,
       * you can add these using the `addToggler` method
       *
       * @param el
       * @param options
       * @param type
       */
      addToggler(el, options = {}, type = 'click') {
          if (type === 'contextmenu') {
              el.addEventListener('contextmenu', (event) => this.open(Object.assign(Object.assign({}, options), { event })));
          }
          else {
              el.addEventListener('click', (event) => this.open(Object.assign(Object.assign({}, options), { event })));
          }
      }
      /**
       * Merge default options, instance options, and single open method options
       * @param options
       * @returns
       */
      _parseOptions(options) {
          const defaultOptions = {
              position: "bottom" /* Position.Bottom */,
              className: '',
              autoClose: true,
              arrow: true,
              margin: ('arrow' in (options || {}) ? options.arrow : true)
                  ? 10
                  : 2,
              offset: {
                  x: 0,
                  y: 0
              },
              menuItems: []
          };
          return deepObjectAssign({}, defaultOptions, this._instanceOptions || {}, options || {});
      }
      _evaluateArrowPosition(position) {
          let arrowPositionClass = '';
          switch (position) {
              case "bottom" /* Position.Bottom */:
                  arrowPositionClass = CLASS_SHOW_ARROW_TOP;
                  break;
              case "top" /* Position.Top */:
                  arrowPositionClass = CLASS_SHOW_ARROW_BOTTOM;
                  break;
          }
          this._containerMenu.classList.add(arrowPositionClass);
      }
      addEventListeners() {
          // Close if click is outside the menu
          this._closeListener = (evt) => {
              if (!this._containerMenu.contains(evt.target)) {
                  this.close();
              }
          };
          this._resizeListener = () => {
              if (this._isOpen) {
                  this.updatePosition(false);
              }
          };
          document.addEventListener('click', this._closeListener);
          window.addEventListener('resize', this._resizeListener);
      }
      removeEventListeners() {
          document.removeEventListener('click', this._closeListener);
          window.removeEventListener('resize', this._resizeListener);
      }
  }

  var utils = /*#__PURE__*/Object.freeze({
    __proto__: null,
    default: TinyPopupMenu
  });

  Object.assign(TinyPopupMenu, utils);

  return TinyPopupMenu;

}));
//# sourceMappingURL=tiny-popup-menu.js.map

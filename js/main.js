(function main(document) {
  const emptyObj = {};
  function toArray(e) {
    return Array.prototype.slice.call(e);
  }
  const isArray = Array.isArray
      || function (object) { return object instanceof Array; };
  const cls2Type = {};
  const methods = 'Boolean Number String Function Array Date RegExp Object Error'.split(' ');
  methods.forEach((name) => {
    cls2Type[`[object ${name}]`] = name.toLowerCase();
  });
  function type(obj) {
    return obj == null ? String(obj) : cls2Type[emptyObj.toString.call(obj)] || 'object';
  }

  function $(elSelector) {
    function Obj(el) {
      this.el = el;
    }
    Obj.prototype = {
      on(eventName, elementSelector, handler) {
        this.el.forEach((element) => {
          this.delegate(element, eventName, elementSelector, handler);
        });
      },
      delegate(el, eventName, elementSelector, handler) {
        el.addEventListener(eventName, function listener(e) {
          // loop parent nodes from the target to the delegation node
          for (let { target } = e; target && target !== this; target = target.parentNode) {
            if (target.matches(elementSelector)) {
              handler.call(target, e, target);
              break;
            }
          }
        }, false);
      },
      removeClass(selector) {
        this.el.forEach((el) => el.classList.remove(selector));
      },
      addClass(selector) {
        this.el.forEach((el) => el.classList.add(selector));
      },
      each(fn) {
        this.el.forEach(fn);
      }
    };
    let el;
    if (type(elSelector) === 'string') {
      el = toArray(document.querySelectorAll(elSelector));
    } else if (isArray(elSelector)) {
      el = toArray(el);
    } else if (type(elSelector) === 'object') {
      el = [elSelector];
    }
    return new Obj(el);
  }

  function handleCateClick(e, el) {
    const $list = $('.category-list li');
    $list.removeClass('active');
    $(el).addClass('active');
    const cateId = el.dataset.id;

    $('.podcast-list .podcast').each((pod) => {
      if (cateId === 'all' || pod.dataset.category.indexOf(cateId) >= 0) {
        pod.style.display = 'flex';
      } else {
        pod.style.display = 'none';
      }
    });
  }

  const categoryList = $('.category-list');
  categoryList.on('click', 'li', handleCateClick);
}(window.document));

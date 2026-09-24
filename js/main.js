/* Designentwurf „Malermeister Jörg Heller“
   Gestaltung und Code © 2026 Mykhailo Sibahatov. Alle Rechte vorbehalten.
   Nur zur Ansicht — keine Nutzung ohne schriftliche Vereinbarung (LICENSE).
   Malermeister Jörg Heller — interactions. No dependencies. */
(function () {
  'use strict';

  /* ---------- Licence: the draft only runs where it has been licensed ----------
     Add a domain here once a written agreement is in place. */
  var LICENSED = ['sibagatovmihail.github.io', 'localhost', '127.0.0.1'];
  if (location.protocol !== 'file:' && LICENSED.indexOf(location.hostname) === -1) {
    var lock = document.createElement('div');
    lock.className = 'licence-lock';
    lock.setAttribute('role', 'alertdialog');
    lock.innerHTML = '<div><b>Nicht lizenzierte Kopie</b>' +
      '<p>Diese Website ist ein urheberrechtlich geschützter Designentwurf von Mykhailo Sibahatov und für diese Domain nicht lizenziert.</p>' +
      '<p>Nutzungsrechte: <a href="mailto:sibagatovmihail@gmail.com">sibagatovmihail@gmail.com</a></p></div>';
    document.body.appendChild(lock);
    document.documentElement.style.overflow = 'hidden';
  }

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* the hero marker sweeps in once the first frame has settled */
  requestAnimationFrame(function () { setTimeout(function () { root.classList.add('is-loaded'); }, 120); });

  /* ---------- frozen viewport unit: refresh on width change only ----------
     iOS Safari changes innerHeight while the URL bar collapses; a vh that
     follows it would make the hero and the open sheet jump. */
  var vhPx = window.innerHeight;
  var vw0 = window.innerWidth;
  root.style.setProperty('--vh', (vhPx * 0.01) + 'px');
  window.addEventListener('resize', function () {
    if (window.innerWidth !== vw0) {
      vw0 = window.innerWidth;
      vhPx = window.innerHeight;
      root.style.setProperty('--vh', (vhPx * 0.01) + 'px');
    }
  });

  /* ---------- header: tall at the top, collapses once the page moves ---------- */
  var header = document.querySelector('.site-header');
  var ticking = false;
  function onScroll() {
    ticking = false;
    if (root.classList.contains('nav-open')) return;          /* body is pinned; keep the state it had */
    header.classList.toggle('is-scrolled', window.scrollY > 8);
    markCurrent();
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(onScroll); }
  }, { passive: true });

  /* ---------- navigation (phone sheet under the bar) ----------
     Scroll lock while the sheet is open: overflow:hidden alone does not stop
     iOS Safari, so the body is pinned at the current offset and the exact
     position is restored on close — instantly, no smooth scroll back. */
  var strip = document.querySelector('.navbar');
  var toggle = document.querySelector('.navbar__toggle');
  var lockY = 0, locked = false;
  function lockScroll(on) {
    var b = document.body.style;
    if (on && !locked) {
      lockY = window.scrollY;
      b.position = 'fixed'; b.top = -lockY + 'px'; b.left = '0'; b.right = '0'; b.width = '100%';
      locked = true;
    } else if (!on && locked) {
      b.position = b.top = b.left = b.right = b.width = '';
      root.style.scrollBehavior = 'auto';
      window.scrollTo(0, lockY);
      root.style.scrollBehavior = '';
      locked = false;
    }
  }
  function setNav(open) {
    strip.setAttribute('data-open', open ? 'true' : 'false');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.querySelector('.visually-hidden').textContent = open ? 'Menü schließen' : 'Menü öffnen';
    if (open) lockScroll(true);
    root.classList.toggle('nav-open', open);
    if (!open) lockScroll(false);
  }
  toggle.addEventListener('click', function () { setNav(strip.getAttribute('data-open') !== 'true'); });
  /* anchor links in the sheet: unlock first, then let the jump happen */
  strip.querySelector('.navbar__menu').addEventListener('click', function (e) {
    var a = e.target.closest('a');
    if (!a || strip.getAttribute('data-open') !== 'true') return;
    var hash = a.getAttribute('href');
    if (hash.charAt(0) !== '#') { setNav(false); return; }
    e.preventDefault();
    setNav(false);
    var target = document.querySelector(hash);
    if (target) {
      requestAnimationFrame(function () { target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' }); });
      history.replaceState(null, '', hash);
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && strip.getAttribute('data-open') === 'true') { setNav(false); toggle.focus(); }
  });
  /* a tap on the dimmed page below the sheet closes it */
  document.addEventListener('click', function (e) {
    if (strip.getAttribute('data-open') === 'true' && !e.target.closest('.site-header')) setNav(false);
  });
  window.matchMedia('(min-width: 64.0625rem)').addEventListener('change', function (m) {
    if (m.matches) setNav(false);
  });

  /* ---------- header hover: one tinted block glides from link to link ----------
     Wide screens with a real pointer only; it appears in place on first entry
     (no slide-in from 0) and fades out when the pointer leaves. */
  var menu = document.querySelector('.navbar__menu');
  var wideHover = window.matchMedia('(min-width: 64.0625rem) and (hover: hover) and (pointer: fine)');
  if (!reduceMotion) {
    var glider = document.createElement('span');
    glider.className = 'navbar__glider';
    glider.setAttribute('aria-hidden', 'true');
    menu.prepend(glider);
    var moveTo = function (link) {
      glider.style.left = link.offsetLeft + 'px';
      glider.style.top = link.offsetTop + 'px';
      glider.style.width = link.offsetWidth + 'px';
    };
    var showGlider = function (link) {
      if (!wideHover.matches) return;
      if (!menu.classList.contains('has-glider')) {
        glider.style.transition = 'none';
        moveTo(link);
        void glider.offsetWidth;
        glider.style.transition = '';
        menu.classList.add('has-glider');
      } else {
        moveTo(link);
      }
    };
    var hideGlider = function () { menu.classList.remove('has-glider'); };
    menu.querySelectorAll('.navbar__link').forEach(function (link) {
      link.addEventListener('mouseenter', function () { showGlider(link); });
      link.addEventListener('focus', function () { showGlider(link); });
      link.addEventListener('blur', hideGlider);
    });
    menu.querySelector('.navbar__links').addEventListener('mouseleave', hideGlider);
  }

  /* ---------- current section: the link of the section under the header ---------- */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.navbar__link'));
  var sections = navLinks.map(function (a) { return document.querySelector(a.getAttribute('href')); });
  function markCurrent() {
    var line = window.innerHeight * 0.35, current = -1;
    sections.forEach(function (s, i) { if (s && s.getBoundingClientRect().top <= line) current = i; });
    /* past the last linked section (Kontakt) nothing is current */
    var kontakt = document.getElementById('kontakt');
    if (kontakt && kontakt.getBoundingClientRect().top <= line) current = -1;
    navLinks.forEach(function (a, i) {
      a.classList.toggle('is-current', i === current);
      if (i === current) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
  }
  onScroll();

  /* ---------- reveal: whole groups, never per item ---------- */
  var reveals = document.querySelectorAll('.reveal');
  function finish(el) {
    el.classList.add('is-in');
    var done = function () { el.classList.add('is-done'); };
    el.addEventListener('transitionend', function (e) { if (e.target === el) done(); });
    setTimeout(done, 1000);
  }
  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('is-in', 'is-done'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { finish(entry.target); io.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
    /* a jump (anchor, End key, restored scroll) can skip an element entirely */
    var sweeping = false;
    var sweep = function () {
      sweeping = false;
      reveals.forEach(function (el) {
        if (!el.classList.contains('is-in') && el.getBoundingClientRect().top < vhPx) { finish(el); io.unobserve(el); }
      });
    };
    window.addEventListener('scroll', function () {
      if (!sweeping) { sweeping = true; requestAnimationFrame(sweep); }
    }, { passive: true });
    window.addEventListener('load', sweep);
  }

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll('.acc__btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var item = btn.closest('.acc');
      var open = !item.classList.contains('is-open');
      item.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });

  /* ---------- custom dropdowns — the native <select> stays for value + validation ---------- */
  var closeAll = function (except) {
    document.querySelectorAll('.select.is-open').forEach(function (w) { if (w !== except) w._close(); });
  };
  document.querySelectorAll('#contact-form select.input').forEach(function (sel) {
    var wrap = document.createElement('div');
    wrap.className = 'select';
    sel.parentNode.insertBefore(wrap, sel);
    wrap.appendChild(sel);
    sel.classList.add('select__native');
    sel.tabIndex = -1;
    sel.setAttribute('aria-hidden', 'true');

    var id = sel.id;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'select__btn';
    btn.id = id + '-btn';
    btn.setAttribute('aria-haspopup', 'listbox');
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<span class="select__val"></span><svg class="select__chev" aria-hidden="true"><use href="#i-chev"/></svg>';
    var label = document.querySelector('label[for="' + id + '"]');
    if (label) { label.htmlFor = btn.id; label.id = id + '-lbl'; btn.setAttribute('aria-labelledby', label.id + ' ' + btn.id); }

    var list = document.createElement('ul');
    list.className = 'select__list';
    list.id = id + '-list';
    list.setAttribute('role', 'listbox');
    list.tabIndex = -1;
    if (label) list.setAttribute('aria-labelledby', label.id);
    btn.setAttribute('aria-controls', list.id);
    var opts = Array.prototype.map.call(sel.options, function (o, i) {
      var li = document.createElement('li');
      li.id = id + '-o' + i;
      li.setAttribute('role', 'option');
      li.innerHTML = '<span>' + o.text + '</span><svg aria-hidden="true"><use href="#i-check"/></svg>';
      if (o.value === '') li.classList.add('is-placeholder');
      list.appendChild(li);
      return li;
    });
    wrap.appendChild(btn);
    wrap.appendChild(list);

    var active = sel.selectedIndex;
    var sync = function () {
      var o = sel.options[sel.selectedIndex];
      btn.querySelector('.select__val').textContent = o ? o.text : '';
      btn.classList.toggle('is-empty', !o || o.value === '');
      opts.forEach(function (li, i) { li.setAttribute('aria-selected', String(i === sel.selectedIndex)); });
    };
    var mark = function (i) {
      active = Math.max(0, Math.min(opts.length - 1, i));
      opts.forEach(function (li, k) { li.classList.toggle('is-active', k === active); });
      list.setAttribute('aria-activedescendant', opts[active].id);
      var li = opts[active];
      if (li.offsetTop < list.scrollTop) list.scrollTop = li.offsetTop - 4;
      else if (li.offsetTop + li.offsetHeight > list.scrollTop + list.clientHeight) list.scrollTop = li.offsetTop + li.offsetHeight - list.clientHeight + 4;
    };
    var open = function () {
      closeAll(wrap);
      wrap.classList.add('is-open');
      btn.setAttribute('aria-expanded', 'true');
      /* flip upward when there is no room below */
      var r = btn.getBoundingClientRect();
      wrap.classList.toggle('is-up', window.innerHeight - r.bottom < 280 && r.top > window.innerHeight - r.bottom);
      mark(sel.selectedIndex < 0 ? 0 : sel.selectedIndex);
      list.focus({ preventScroll: true });
    };
    var close = function (focusBtn) {
      wrap.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
      if (focusBtn) btn.focus({ preventScroll: true });
    };
    wrap._close = function () { close(false); };
    var choose = function (i) {
      sel.selectedIndex = i;
      sel.dispatchEvent(new Event('change', { bubbles: true }));
      sync();
      close(true);
    };
    btn.addEventListener('click', function () { wrap.classList.contains('is-open') ? close(true) : open(); });
    btn.addEventListener('keydown', function (e) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].indexOf(e.key) > -1) { e.preventDefault(); open(); }
    });
    var typed = '', typedT;
    list.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); mark(active + 1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); mark(active - 1); }
      else if (e.key === 'Home') { e.preventDefault(); mark(0); }
      else if (e.key === 'End') { e.preventDefault(); mark(opts.length - 1); }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(active); }
      else if (e.key === 'Escape') { e.preventDefault(); close(true); }
      else if (e.key === 'Tab') { close(false); }
      else if (e.key.length === 1) {                          /* type-ahead */
        typed += e.key.toLowerCase(); clearTimeout(typedT);
        typedT = setTimeout(function () { typed = ''; }, 600);
        for (var k = 0; k < opts.length; k++) {
          if (sel.options[k].text.toLowerCase().indexOf(typed) === 0) { mark(k); break; }
        }
      }
    });
    opts.forEach(function (li, i) {
      li.addEventListener('click', function () { choose(i); });
      li.addEventListener('mousemove', function () { if (active !== i) mark(i); });
    });
    sel.addEventListener('change', sync);
    sync();
  });
  document.addEventListener('click', function (e) {
    document.querySelectorAll('.select.is-open').forEach(function (w) { if (!w.contains(e.target)) w._close(); });
  });

  /* ---------- request form — draft: validates, then shows the thank-you state ----------
     Production: Web3Forms (hidden access_key + the botcheck honeypot already in place). */
  var form = document.getElementById('contact-form');
  if (form) {
    var status = form.querySelector('.form__status');
    var messages = {
      'f-name': 'Bitte geben Sie Ihren Namen an.',
      'f-tel': 'Bitte geben Sie eine Telefonnummer an, damit wir Sie zurückrufen können.',
      'f-mail': 'Bitte prüfen Sie die E-Mail-Adresse.',
      'f-ok': 'Bitte bestätigen Sie die Einwilligung.'
    };
    var check = function (input) {
      var field = input.closest('.field');
      var err = document.getElementById(input.id + '-err');
      var ok = input.checkValidity();
      if (input.type === 'email' && ok && input.value) ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value);
      if (input.type === 'tel' && ok && input.value) ok = input.value.replace(/\D/g, '').length >= 6;
      field.classList.toggle('is-invalid', !ok);
      input.setAttribute('aria-invalid', ok ? 'false' : 'true');
      if (err) {
        err.textContent = ok ? '' : messages[input.id];
        input.setAttribute('aria-describedby', err.id);
      }
      return ok;
    };
    var checked = form.querySelectorAll('[required], [type="email"]');
    checked.forEach(function (input) {
      input.addEventListener(input.type === 'checkbox' ? 'change' : 'blur', function () {
        if (input.value || input.type === 'checkbox') check(input);
      });
      input.addEventListener('input', function () { if (input.closest('.field').classList.contains('is-invalid')) check(input); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (form.querySelector('[name="botcheck"]').checked) return;
      var firstBad = null;
      checked.forEach(function (input) { if (!check(input) && !firstBad) firstBad = input; });
      if (firstBad) { firstBad.focus(); return; }
      var name = form.querySelector('#f-name').value.trim().split(/\s+/)[0];
      form.closest('.form-cell').classList.add('is-sent');
      status.textContent = 'Danke, ' + name + '! Wir melden uns in den nächsten Tagen bei Ihnen.';
    });
  }

  /* ---------- footer year ---------- */
  document.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();

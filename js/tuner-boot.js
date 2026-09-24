/* Designentwurf „Malermeister Jörg Heller“ · Gestaltung und Code © 2026 Mykhailo Sibahatov. Alle Rechte vorbehalten. */
/* Gestalten — shared core of the design tuner (draft tool).
   Loaded in <head>, synchronously, so saved choices apply before first paint
   (no flash of the default palette). Holds the colour maths, the palette
   derivation and the font registry; js/tuner.js builds the panel on top.

   The whole palette derives from two colours (brand + accent, HSL) and a
   ground choice. Every derived token is contrast-checked, so a wild pick can
   make the page ugly but never unreadable. */
(function () {
  'use strict';

  var KEY = 'heller-tune-v1';

  var DEFAULTS = {
    brand:   { h: 222, s: 55, l: 28 },   /* Ultramarin */
    accent:  { h: 14,  s: 78, l: 52 },   /* Mennige, the red-lead primer */
    harmony: 'free',
    ground:  'linen',
    head: 'Archivo',
    body: 'Source Sans 3',
    hw: 700,
    hs: 1
  };

  /* ---------- colour maths ---------- */
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  function hslToRgb(h, s, l) {
    h = ((h % 360) + 360) % 360; s = clamp(s, 0, 100) / 100; l = clamp(l, 0, 100) / 100;
    var k = function (n) { return (n + h / 30) % 12; };
    var a = s * Math.min(l, 1 - l);
    var f = function (n) { return l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))); };
    return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
  }
  function rgbToHex(c) {
    return '#' + c.map(function (v) { return (v < 16 ? '0' : '') + v.toString(16); }).join('').toUpperCase();
  }
  function hexToRgb(hex) {
    var m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec((hex || '').trim());
    if (!m) return null;
    var s = m[1].length === 3 ? m[1].replace(/./g, '$&$&') : m[1];
    return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
  }
  function rgbToHsl(c) {
    var r = c[0] / 255, g = c[1] / 255, b = c[2] / 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    var h = 0, s = 0, l = (max + min) / 2;
    if (d) {
      s = d / (1 - Math.abs(2 * l - 1));
      h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
      h *= 60; if (h < 0) h += 360;
    }
    return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
  }
  function lum(c) {
    var ch = c.map(function (v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
  }
  function contrast(a, b) {
    var x = lum(a), y = lum(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  }
  var rgb = function (o) { return hslToRgb(o.h, o.s, o.l); };
  var hex = function (h, s, l) { return rgbToHex(hslToRgb(h, s, l)); };

  /* walk lightness until the colour reaches the contrast target against bg */
  function reach(c, bg, target, dir) {
    var l = c.l;
    while (l >= 0 && l <= 100 && contrast(hslToRgb(c.h, c.s, l), bg) < target) l += dir;
    return { h: c.h, s: c.s, l: clamp(l, 0, 100) };
  }

  var WHITE = [255, 255, 255];

  function markerSvg(fill, alpha) {
    return 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 200 40\' preserveAspectRatio=\'none\'%3E%3Cpath d=\'M3 9.5C40 6.5 120 5 197 7.5L199 35C130 37.5 60 38 1 36.5Z\' fill=\'%23' +
      fill.slice(1) + '\' fill-opacity=\'' + alpha + '\'/%3E%3C/svg%3E")';
  }

  /* ---------- the palette: two colours in, every token out ---------- */
  function derive(st) {
    var b = st.brand, a = st.accent, v = {};
    var ink = { h: b.h, s: Math.min(b.s, 30), l: 12 };
    var inkRgb = rgb(ink);

    var tint;
    switch (st.ground) {
      case 'accent':  tint = { h: a.h, s: Math.min(a.s, 60) * 0.5, l: 96.5 }; break;
      case 'brand':   tint = { h: b.h, s: Math.min(b.s, 40) * 0.6, l: 96.5 }; break;
      case 'neutral': tint = { h: b.h, s: 4, l: 96.5 }; break;
      default:        tint = { h: 36, s: 32, l: 95.5 };                      /* linen */
    }
    var tintRgb = rgb(tint);
    var night = { h: b.h, s: Math.min(b.s, 48), l: 14 };
    var nightRgb = rgb(night);

    v['--brand']      = rgbToHex(rgb(b));
    v['--brand-deep'] = hex(b.h, b.s, Math.max(b.l - 7, 3));
    v['--on-brand']   = contrast(WHITE, rgb(b)) >= contrast(inkRgb, rgb(b)) ? '#FFFFFF' : rgbToHex(inkRgb);
    v['--night']      = rgbToHex(nightRgb);
    v['--night-2']    = hex(night.h, Math.min(b.s, 38), 20);
    v['--accent']     = rgbToHex(rgb(a));
    v['--on-accent']  = contrast(WHITE, rgb(a)) >= 3 ? '#FFFFFF' : rgbToHex(inkRgb);
    v['--accent-text']  = rgbToHex(rgb(reach(a, tintRgb, 4.5, -1)));   /* small text on white + tint */
    v['--accent-light'] = rgbToHex(rgb(reach(a, nightRgb, 4.5, 1)));   /* small text on night */
    v['--accent-wash']  = hex(a.h, Math.min(a.s, 80), 93);
    v['--tint']  = rgbToHex(tintRgb);
    v['--sand']  = hex(tint.h, tint.s, 91);
    v['--ink']   = rgbToHex(inkRgb);
    v['--muted'] = hex(b.h, Math.min(b.s, 12), 37);
    v['--line']  = 'rgba(' + inkRgb.join(', ') + ', .13)';
    v['--marker']       = markerSvg(v['--accent'], .38);
    v['--marker-night'] = markerSvg(v['--accent'], .55);
    return v;
  }

  /* ---------- fonts ---------- */
  /* q = Google Fonts css2 family spec; w = weight range; st = font-stretch.
     The two defaults are self-hosted (fonts/), the rest load from Google
     only when picked in the tuner — the draft tool, never the default page. */
  var FONTS = {
    head: {
      'Archivo':             { q: 'Archivo:wdth,wght@100..125,400..800', w: [400, 800], st: '112%', local: true, fb: 'sans-serif' },
      'Bricolage Grotesque': { q: 'Bricolage+Grotesque:opsz,wght@12..96,200..800', w: [400, 800], fb: 'sans-serif' },
      'Fraunces':            { q: 'Fraunces:opsz,wght@9..144,300..900', w: [400, 900], fb: 'serif' },
      'Zilla Slab':          { q: 'Zilla+Slab:wght@400;500;600;700', w: [400, 700], fb: 'serif' },
      'Roboto Slab':         { q: 'Roboto+Slab:wght@300..900', w: [400, 900], fb: 'serif' },
      'Manrope':             { q: 'Manrope:wght@300..800', w: [400, 800], fb: 'sans-serif' },
      'Outfit':              { q: 'Outfit:wght@300..900', w: [400, 900], fb: 'sans-serif' },
      'Libre Franklin':      { q: 'Libre+Franklin:wght@300..900', w: [400, 900], fb: 'sans-serif' },
      'Barlow Condensed':    { q: 'Barlow+Condensed:wght@400;500;600;700;800', w: [400, 800], fb: 'sans-serif' },
      'Playfair Display':    { q: 'Playfair+Display:wght@400..900', w: [400, 900], fb: 'serif' },
      'DM Serif Display':    { q: 'DM+Serif+Display', w: [400, 400], fb: 'serif' },
      'Josefin Sans':        { q: 'Josefin+Sans:wght@300..700', w: [400, 700], fb: 'sans-serif' }
    },
    body: {
      'Source Sans 3':         { q: 'Source+Sans+3:wght@400..700', local: true, fb: 'sans-serif' },
      'Inter':                 { q: 'Inter:wght@400..700', fb: 'sans-serif' },
      'Figtree':               { q: 'Figtree:wght@400..700', fb: 'sans-serif' },
      'Public Sans':           { q: 'Public+Sans:wght@400..700', fb: 'sans-serif' },
      'Work Sans':             { q: 'Work+Sans:wght@400..700', fb: 'sans-serif' },
      'IBM Plex Sans':         { q: 'IBM+Plex+Sans:wght@400;500;600;700', fb: 'sans-serif' },
      'Lato':                  { q: 'Lato:wght@400;700', fb: 'sans-serif' },
      'Atkinson Hyperlegible': { q: 'Atkinson+Hyperlegible:wght@400;700', fb: 'sans-serif' },
      'Literata':              { q: 'Literata:opsz,wght@7..72,400..700', fb: 'serif' }
    }
  };

  var loaded = {};
  function loadFont(kind, name) {
    var f = FONTS[kind][name];
    if (!f || f.local || loaded[name]) return;
    loaded[name] = true;
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=' + f.q + '&display=swap';
    document.head.appendChild(link);
  }
  var stack = function (kind, name) {
    var f = FONTS[kind][name] || {};
    return '"' + name + '", ' + (f.fb === 'serif' ? 'Georgia, "Times New Roman", serif' : 'system-ui, -apple-system, "Segoe UI", sans-serif');
  };

  function fontVars(st) {
    var h = FONTS.head[st.head] || FONTS.head.Archivo;
    return {
      '--font-head': stack('head', st.head),
      '--font-body': stack('body', st.body),
      '--head-w': String(clamp(st.hw, h.w[0], h.w[1])),
      '--head-stretch': h.st || '100%',
      '--head-scale': String(st.hs)
    };
  }

  /* ---------- state ---------- */
  var copy = function (o) { return JSON.parse(JSON.stringify(o)); };
  function valid(st) {
    return st && st.brand && st.accent && typeof st.brand.h === 'number' && typeof st.accent.h === 'number';
  }
  function merge(st) {
    var d = copy(DEFAULTS);
    if (!valid(st)) return d;
    Object.keys(d).forEach(function (k) { if (st[k] !== undefined) d[k] = st[k]; });
    if (!FONTS.head[d.head]) d.head = DEFAULTS.head;
    if (!FONTS.body[d.body]) d.body = DEFAULTS.body;
    return d;
  }
  function encode(st) { return btoa(unescape(encodeURIComponent(JSON.stringify(st)))).replace(/=+$/, ''); }
  function decode(s) { try { return JSON.parse(decodeURIComponent(escape(atob(s)))); } catch (e) { return null; } }

  function load() {
    var fromUrl = null;
    try {
      var p = new URLSearchParams(location.search).get('gestaltung');
      if (p) fromUrl = decode(p);
    } catch (e) { /* old browser */ }
    if (valid(fromUrl)) { save(fromUrl); return merge(fromUrl); }
    try { return merge(JSON.parse(localStorage.getItem(KEY))); } catch (e) { return copy(DEFAULTS); }
  }
  function save(st) { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { /* private mode */ } }
  function clear() { try { localStorage.removeItem(KEY); } catch (e) { /* private mode */ } }

  var isDefault = function (st) { return JSON.stringify(merge(st)) === JSON.stringify(DEFAULTS); };

  /* write every token onto <html>; with the defaults, remove them so the
     stylesheet's own values (the same numbers) take over again */
  function apply(st) {
    var root = document.documentElement.style;
    var vars = Object.assign(derive(st), fontVars(st));
    if (isDefault(st)) {
      Object.keys(vars).forEach(function (k) { root.removeProperty(k); });
    } else {
      Object.keys(vars).forEach(function (k) { root.setProperty(k, vars[k]); });
    }
    loadFont('head', st.head);
    loadFont('body', st.body);
    return vars;
  }

  var state = load();
  apply(state);

  window.HellerTune = {
    KEY: KEY, DEFAULTS: DEFAULTS, FONTS: FONTS, state: state,
    hslToRgb: hslToRgb, rgbToHex: rgbToHex, hexToRgb: hexToRgb, rgbToHsl: rgbToHsl, contrast: contrast, hex: hex,
    derive: derive, fontVars: fontVars, apply: apply, save: save, clear: clear, merge: merge,
    encode: encode, isDefault: isDefault, loadFont: loadFont, copy: copy
  };
})();

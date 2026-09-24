/* Designentwurf „Malermeister Jörg Heller“ · Gestaltung und Code © 2026 Mykhailo Sibahatov. Alle Rechte vorbehalten. */
/* Gestalten — the design tuner panel (draft tool, remove before handover).
   Colour wheel with two handles (Hauptfarbe + Akzent: angle = hue, distance
   from the centre = saturation), lightness sliders, harmony locks, ground
   choice and live contrast checks; font pairs, heading/body lists, weight and
   size. Every change is applied through window.HellerTune (tuner-boot.js),
   saved in this browser, and can be exported as CSS or as a share link. */
(function () {
  'use strict';
  var T = window.HellerTune;
  if (!T) return;

  var st = T.state;
  var HARMONY = { free: null, complement: 180, analog: 30, triad: 120, split: 150 };
  var PRESETS = [
    { n: 'Ultramarin & Mennige',  b: [222, 55, 28], a: [14, 78, 52],  g: 'linen' },
    { n: 'Tanne & Ocker',         b: [158, 40, 22], a: [40, 78, 50],  g: 'linen' },
    { n: 'Anthrazit & Signalgelb', b: [212, 14, 20], a: [45, 95, 52], g: 'neutral' },
    { n: 'Ochsenblut & Sand',     b: [356, 52, 30], a: [34, 58, 58],  g: 'linen' },
    { n: 'Petrol & Koralle',      b: [190, 60, 24], a: [8, 78, 62],   g: 'brand' },
    { n: 'Schiefer & Kupfer',     b: [214, 22, 30], a: [22, 62, 47],  g: 'neutral' },
    { n: 'Aubergine & Salbei',    b: [292, 30, 27], a: [100, 24, 52], g: 'accent' },
    { n: 'Himmel & Zitrone',      b: [205, 70, 38], a: [52, 90, 55],  g: 'brand' }
  ];
  var PAIRS = [
    { n: 'Handwerk',   h: 'Archivo',             b: 'Source Sans 3',         w: 700 },
    { n: 'Klassisch',  h: 'Fraunces',            b: 'Figtree',               w: 600 },
    { n: 'Werkstatt',  h: 'Zilla Slab',          b: 'Public Sans',           w: 700 },
    { n: 'Freundlich', h: 'Bricolage Grotesque', b: 'Inter',                 w: 700 },
    { n: 'Ruhig',      h: 'Outfit',              b: 'Work Sans',             w: 600 },
    { n: 'Elegant',    h: 'Playfair Display',    b: 'Lato',                  w: 700 },
    { n: 'Kompakt',    h: 'Barlow Condensed',    b: 'IBM Plex Sans',         w: 700 },
    { n: 'Gut lesbar', h: 'Libre Franklin',      b: 'Atkinson Hyperlegible', w: 700 }
  ];
  var GROUNDS = [['linen', 'Leinen'], ['accent', 'Akzent'], ['brand', 'Hauptfarbe'], ['neutral', 'Neutral']];
  var HARMONIES = [['free', 'Frei'], ['complement', 'Komplementär'], ['analog', 'Analog'], ['triad', 'Triade'], ['split', 'Split']];
  var ROLES = { brand: 'Hauptfarbe', accent: 'Akzent' };

  var el = function (tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var norm = function (h) { return ((Math.round(h) % 360) + 360) % 360; };
  var hexOf = function (c) { return T.hex(c.h, c.s, c.l); };

  /* ---------- markup ---------- */
  var fab = el('button', 'tuner-fab',
    '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.7-.8 1.7-1.7 0-.5-.2-.9-.5-1.2-.3-.3-.5-.7-.5-1.2 0-.9.8-1.7 1.7-1.7h2A4.6 4.6 0 0 0 21 10.6C21 6.4 17 3 12 3Z" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="7.5" cy="11" r="1.3" fill="currentColor"/><circle cx="10" cy="7.3" r="1.3" fill="currentColor"/><circle cx="14.5" cy="7.3" r="1.3" fill="currentColor"/><circle cx="17" cy="11" r="1.3" fill="currentColor"/></svg><span>Gestalten</span>');
  fab.type = 'button';
  fab.setAttribute('aria-expanded', 'false');
  fab.setAttribute('aria-controls', 'tuner');

  var panel = el('aside', 'tuner');
  panel.id = 'tuner';
  panel.setAttribute('aria-label', 'Gestalten: Farben und Schriften ausprobieren');
  panel.hidden = true;
  panel.innerHTML =
    '<div class="tuner__head">' +
      '<div class="tuner__title"><b>Gestalten</b><span>Entwurfs-Werkzeug · wird vor Übergabe entfernt</span></div>' +
      '<button class="tuner__close" type="button" aria-label="Schließen"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>' +
    '</div>' +
    '<div class="tuner__tabs" role="tablist">' +
      '<span class="tuner__thumb" aria-hidden="true"></span>' +
      '<button type="button" role="tab" id="t-tab-c" aria-controls="t-pane-c" aria-selected="true">Farben</button>' +
      '<button type="button" role="tab" id="t-tab-f" aria-controls="t-pane-f" aria-selected="false" tabindex="-1">Schrift</button>' +
    '</div>' +
    '<div class="tuner__body">' +
      '<div class="tuner__pane" id="t-pane-c" role="tabpanel" aria-labelledby="t-tab-c"></div>' +
      '<div class="tuner__pane" id="t-pane-f" role="tabpanel" aria-labelledby="t-tab-f" hidden></div>' +
    '</div>' +
    '<div class="tuner__foot">' +
      '<button type="button" class="t-btn" data-act="reset">Zurücksetzen</button>' +
      '<button type="button" class="t-btn" data-act="link">Link kopieren</button>' +
      '<button type="button" class="t-btn t-btn--dark" data-act="css">CSS kopieren</button>' +
    '</div>' +
    '<p class="tuner__toast" role="status" aria-live="polite"></p>';

  var paneC = panel.querySelector('#t-pane-c');
  var paneF = panel.querySelector('#t-pane-f');

  /* --- colour pane --- */
  paneC.innerHTML =
    '<div class="t-group"><p class="t-label">Vorlagen</p><div class="t-presets"></div></div>' +
    '<div class="t-group t-wheelbox">' +
      '<div class="t-wheel" aria-label="Farbkreis">' +
        '<div class="t-wheel__disc"></div>' +
        '<svg class="t-wheel__link" aria-hidden="true"><line/></svg>' +
        '<div class="t-handle" data-role="brand" tabindex="0" role="slider" aria-label="Hauptfarbe: Farbton (Pfeil links/rechts) und Sättigung (Pfeil hoch/runter)" aria-valuemin="0" aria-valuemax="359"><span>H</span></div>' +
        '<div class="t-handle" data-role="accent" tabindex="0" role="slider" aria-label="Akzent: Farbton (Pfeil links/rechts) und Sättigung (Pfeil hoch/runter)" aria-valuemin="0" aria-valuemax="359"><span>A</span></div>' +
      '</div>' +
      '<p class="t-hint">Punkte ziehen: Richtung = Farbton, Abstand zur Mitte = Sättigung. Klick in den Kreis bewegt die aktive Farbe.</p>' +
    '</div>' +
    '<div class="t-group t-roles"></div>' +
    '<div class="t-group"><p class="t-label">Harmonie</p><div class="t-chips" data-set="harmony"></div></div>' +
    '<div class="t-group"><p class="t-label">Hintergrund der Abschnitte</p><div class="t-chips" data-set="ground"></div></div>' +
    '<div class="t-group"><p class="t-label">Lesbarkeit</p><ul class="t-contrast"></ul></div>';

  var presetsBox = paneC.querySelector('.t-presets');
  PRESETS.forEach(function (p, i) {
    var b = { h: p.b[0], s: p.b[1], l: p.b[2] }, a = { h: p.a[0], s: p.a[1], l: p.a[2] };
    var btn = el('button', 't-preset', '<span class="t-preset__dot" style="--b:' + hexOf(b) + ';--a:' + hexOf(a) + '"></span><span>' + p.n + '</span>');
    btn.type = 'button';
    btn.addEventListener('click', function () {
      st.brand = b; st.accent = a; st.ground = p.g; st.harmony = 'free';
      commit(); paintAll();
    });
    presetsBox.appendChild(btn);
  });

  var rolesBox = paneC.querySelector('.t-roles');
  Object.keys(ROLES).forEach(function (role) {
    var row = el('div', 't-role');
    row.dataset.role = role;
    row.innerHTML =
      '<div class="t-role__top">' +
        '<button type="button" class="t-role__pick" aria-pressed="false"><span class="t-role__sw"></span><span class="t-role__name">' + ROLES[role] +
        '<small>' + (role === 'brand' ? 'Buttons, Logo, Kontaktkarte, dunkle Flächen' : 'Markierungen, Ablauf, kleine Details') + '</small></span></button>' +
        '<input class="t-hex" type="text" spellcheck="false" autocomplete="off" maxlength="7" aria-label="' + ROLES[role] + ' als Hex-Wert">' +
      '</div>' +
      '<div class="t-slider" role="slider" tabindex="0" aria-label="' + ROLES[role] + ': Helligkeit" aria-valuemin="0" aria-valuemax="100"><span class="t-slider__thumb"></span></div>';
    rolesBox.appendChild(row);
  });

  function chips(box, items, key) {
    items.forEach(function (it) {
      var b = el('button', 't-chip', it[1]);
      b.type = 'button';
      b.dataset.value = it[0];
      b.addEventListener('click', function () {
        st[key] = it[0];
        if (key === 'harmony') lockHarmony('brand');
        commit(); paintAll();
      });
      box.appendChild(b);
    });
  }
  chips(paneC.querySelector('[data-set="harmony"]'), HARMONIES, 'harmony');
  chips(paneC.querySelector('[data-set="ground"]'), GROUNDS, 'ground');

  /* --- font pane --- */
  paneF.innerHTML =
    '<div class="t-group"><p class="t-label">Schriftpaare</p><div class="t-pairs"></div></div>' +
    '<div class="t-group"><p class="t-label" id="t-lbl-h">Überschriften</p><ul class="t-fonts" role="listbox" tabindex="0" aria-labelledby="t-lbl-h" data-kind="head"></ul></div>' +
    '<div class="t-group"><p class="t-label" id="t-lbl-b">Fließtext</p><ul class="t-fonts" role="listbox" tabindex="0" aria-labelledby="t-lbl-b" data-kind="body"></ul></div>' +
    '<div class="t-group"><div class="t-row"><p class="t-label">Stärke der Überschriften</p><output class="t-out" data-out="hw"></output></div>' +
      '<div class="t-slider t-slider--plain" data-num="hw" role="slider" tabindex="0" aria-label="Stärke der Überschriften"><span class="t-slider__thumb"></span></div></div>' +
    '<div class="t-group"><div class="t-row"><p class="t-label">Größe der Überschriften</p><output class="t-out" data-out="hs"></output></div>' +
      '<div class="t-slider t-slider--plain" data-num="hs" role="slider" tabindex="0" aria-label="Größe der Überschriften"><span class="t-slider__thumb"></span></div></div>' +
    '<p class="t-hint">Die zwei Standardschriften liegen auf dem eigenen Server. Alle anderen lädt das Werkzeug zum Ausprobieren von Google Fonts; vor der Übergabe wird die gewählte Schrift ebenfalls lokal eingebunden.</p>';

  var pairsBox = paneF.querySelector('.t-pairs');
  PAIRS.forEach(function (p) {
    var btn = el('button', 't-pair',
      '<span class="t-pair__aa" style="font-family:\'' + p.h + '\';font-weight:' + p.w + '">Aa</span>' +
      '<span class="t-pair__meta"><b>' + p.n + '</b><span>' + p.h + ' + ' + p.b + '</span></span>');
    btn.type = 'button';
    btn.dataset.h = p.h; btn.dataset.b = p.b;
    btn.addEventListener('click', function () {
      st.head = p.h; st.body = p.b; st.hw = p.w;
      commit(); paintAll();
    });
    pairsBox.appendChild(btn);
  });

  paneF.querySelectorAll('.t-fonts').forEach(function (list) {
    var kind = list.dataset.kind;
    Object.keys(T.FONTS[kind]).forEach(function (name, i) {
      var li = el('li', 't-font', '<span style="font-family:\'' + esc(name) + '\'">' + esc(name) + '</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>');
      li.setAttribute('role', 'option');
      li.id = 't-font-' + kind + '-' + i;
      li.dataset.name = name;
      li.addEventListener('click', function () { pickFont(kind, name); });
      list.appendChild(li);
    });
    /* listbox keyboard: arrows move and pick, Home/End */
    list.addEventListener('keydown', function (e) {
      var names = Object.keys(T.FONTS[kind]);
      var i = names.indexOf(st[kind]);
      if (e.key === 'ArrowDown') i++;
      else if (e.key === 'ArrowUp') i--;
      else if (e.key === 'Home') i = 0;
      else if (e.key === 'End') i = names.length - 1;
      else return;
      e.preventDefault();
      pickFont(kind, names[Math.max(0, Math.min(names.length - 1, i))]);
    });
  });
  function pickFont(kind, name) {
    st[kind] = name;
    if (kind === 'head') {
      var w = T.FONTS.head[name].w;
      st.hw = Math.max(w[0], Math.min(w[1], st.hw));
    }
    commit(); paintAll();
  }

  /* preview every font name once, in its own face: one small request with
     only the glyphs of the names (Google's text= subset), on first visit */
  var previewed = false;
  function loadPreviews() {
    if (previewed) return;
    previewed = true;
    var fams = [], glyphs = 'Aa';
    ['head', 'body'].forEach(function (kind) {
      Object.keys(T.FONTS[kind]).forEach(function (name) {
        if (T.FONTS[kind][name].local) { glyphs += name; return; }
        fams.push('family=' + T.FONTS[kind][name].q.split(':')[0]);
        glyphs += name;
      });
    });
    var uniq = glyphs.split('').filter(function (c, i, a) { return a.indexOf(c) === i; }).join('');
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?' + fams.join('&') + '&text=' + encodeURIComponent(uniq) + '&display=swap';
    document.head.appendChild(link);
    /* pair previews render "Aa" in each heading face */
    PAIRS.forEach(function (p) { T.loadFont('head', p.h); });
  }

  document.body.appendChild(panel);
  document.body.appendChild(fab);

  /* ---------- wheel ---------- */
  var wheel = paneC.querySelector('.t-wheel');
  var handles = { brand: wheel.querySelector('[data-role="brand"]'), accent: wheel.querySelector('[data-role="accent"]') };
  var linkLine = wheel.querySelector('line');
  var activeRole = 'brand';

  function lockHarmony(moved) {
    var off = HARMONY[st.harmony];
    if (off == null) return;
    if (moved === 'brand') st.accent.h = norm(st.brand.h + off);
    else st.brand.h = norm(st.accent.h - off);
  }
  function fromPoint(role, x, y) {
    var r = wheel.getBoundingClientRect();
    var cx = r.left + r.width / 2, cy = r.top + r.height / 2, R = r.width / 2;
    var dx = x - cx, dy = y - cy;
    var hue = norm(Math.atan2(dx, -dy) * 180 / Math.PI);
    var sat = Math.round(Math.min(1, Math.sqrt(dx * dx + dy * dy) / R) * 100);
    st[role].h = hue; st[role].s = sat;
    lockHarmony(role);
  }
  function setActive(role) {
    activeRole = role;
    Object.keys(handles).forEach(function (k) { handles[k].classList.toggle('is-active', k === role); });
    rolesBox.querySelectorAll('.t-role').forEach(function (row) {
      var on = row.dataset.role === role;
      row.classList.toggle('is-active', on);
      row.querySelector('.t-role__pick').setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }
  var dragRole = null;
  wheel.addEventListener('pointerdown', function (e) {
    var h = e.target.closest('.t-handle');
    dragRole = h ? h.dataset.role : activeRole;
    setActive(dragRole);
    wheel.setPointerCapture(e.pointerId);
    if (!h) { fromPoint(dragRole, e.clientX, e.clientY); schedule(); }
    e.preventDefault();
  });
  wheel.addEventListener('pointermove', function (e) {
    if (!dragRole) return;
    fromPoint(dragRole, e.clientX, e.clientY);
    schedule();
  });
  var endDrag = function () { if (dragRole) { dragRole = null; commit(); } };
  wheel.addEventListener('pointerup', endDrag);
  wheel.addEventListener('pointercancel', endDrag);
  Object.keys(handles).forEach(function (role) {
    handles[role].addEventListener('focus', function () { setActive(role); });
    handles[role].addEventListener('keydown', function (e) {
      var step = e.shiftKey ? 10 : 2, c = st[role];
      if (e.key === 'ArrowRight') c.h = norm(c.h + step);
      else if (e.key === 'ArrowLeft') c.h = norm(c.h - step);
      else if (e.key === 'ArrowUp') c.s = Math.min(100, c.s + step);
      else if (e.key === 'ArrowDown') c.s = Math.max(0, c.s - step);
      else return;
      e.preventDefault();
      lockHarmony(role);
      schedule(); commitSoon();
    });
  });
  rolesBox.querySelectorAll('.t-role__pick').forEach(function (b) {
    b.addEventListener('click', function () { setActive(b.closest('.t-role').dataset.role); });
  });

  /* hex fields: type a colour, it lands on the wheel */
  rolesBox.querySelectorAll('.t-hex').forEach(function (input) {
    var role = input.closest('.t-role').dataset.role;
    input.addEventListener('input', function () {
      var rgb = T.hexToRgb(input.value);
      if (!rgb || input.value.replace('#', '').length !== 6) { input.classList.toggle('is-bad', input.value.length >= 6); return; }
      input.classList.remove('is-bad');
      st[role] = T.rgbToHsl(rgb);
      lockHarmony(role);
      paint(true); commitSoon();
    });
    input.addEventListener('blur', function () { input.classList.remove('is-bad'); input.value = hexOf(st[role]); });
    input.addEventListener('focus', function () { setActive(role); });
  });

  /* ---------- sliders (custom, pointer + keyboard) ---------- */
  function slider(node, get, set, min, max, step, fmt) {
    var fromX = function (x) {
      var r = node.getBoundingClientRect();
      var t = Math.min(1, Math.max(0, (x - r.left) / r.width));
      set(Math.round((min + t * (max - min)) / step) * step);
      schedule();
    };
    var dragging = false;
    node.addEventListener('pointerdown', function (e) { dragging = true; node.setPointerCapture(e.pointerId); fromX(e.clientX); e.preventDefault(); node.focus({ preventScroll: true }); });
    node.addEventListener('pointermove', function (e) { if (dragging) fromX(e.clientX); });
    var end = function () { if (dragging) { dragging = false; commit(); } };
    node.addEventListener('pointerup', end);
    node.addEventListener('pointercancel', end);
    node.addEventListener('keydown', function (e) {
      var v = get();
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') v += step;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') v -= step;
      else if (e.key === 'Home') v = min;
      else if (e.key === 'End') v = max;
      else return;
      e.preventDefault();
      set(Math.max(min, Math.min(max, Math.round(v / step) * step)));
      schedule(); commitSoon();
    });
    node._paint = function (lo, hi) {
      var v = get();
      if (lo != null) { min = lo; max = hi; }
      node.style.setProperty('--t', (max === min ? 0 : (v - min) / (max - min)));
      node.setAttribute('aria-valuemin', min);
      node.setAttribute('aria-valuemax', max);
      node.setAttribute('aria-valuenow', v);
      node.setAttribute('aria-valuetext', fmt ? fmt(v) : String(v));
    };
  }
  rolesBox.querySelectorAll('.t-slider').forEach(function (node) {
    var role = node.closest('.t-role').dataset.role;
    slider(node, function () { return st[role].l; }, function (v) { st[role].l = v; }, 5, 90, 1, function (v) { return 'Helligkeit ' + v + ' Prozent'; });
  });
  var hwSlider = paneF.querySelector('[data-num="hw"]');
  var hsSlider = paneF.querySelector('[data-num="hs"]');
  slider(hwSlider, function () { return st.hw; }, function (v) { st.hw = v; }, 400, 800, 100);
  slider(hsSlider, function () { return Math.round(st.hs * 100); }, function (v) { st.hs = v / 100; }, 85, 120, 5, function (v) { return v + ' Prozent'; });

  /* ---------- painting ---------- */
  var raf = 0;
  function schedule() { if (!raf) raf = requestAnimationFrame(function () { raf = 0; paint(false); }); }

  function paint(skipHex) {
    var vars = T.apply(st);
    /* wheel handles + the harmony link */
    var W = wheel.clientWidth, R = W / 2;
    var pos = {};
    Object.keys(handles).forEach(function (role) {
      var c = st[role], a = c.h * Math.PI / 180, d = c.s / 100 * R;
      var x = R + Math.sin(a) * d, y = R - Math.cos(a) * d;
      pos[role] = [x, y];
      var h = handles[role];
      h.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      h.style.setProperty('--c', hexOf(c));
      h.setAttribute('aria-valuenow', c.h);
      h.setAttribute('aria-valuetext', 'Farbton ' + c.h + ' Grad, Sättigung ' + c.s + ' Prozent');
    });
    linkLine.setAttribute('x1', pos.brand[0]); linkLine.setAttribute('y1', pos.brand[1]);
    linkLine.setAttribute('x2', pos.accent[0]); linkLine.setAttribute('y2', pos.accent[1]);
    wheel.classList.toggle('is-linked', st.harmony !== 'free');

    rolesBox.querySelectorAll('.t-role').forEach(function (row) {
      var role = row.dataset.role, c = st[role];
      row.querySelector('.t-role__sw').style.background = hexOf(c);
      var input = row.querySelector('.t-hex');
      if (!skipHex && document.activeElement !== input) input.value = hexOf(c);
      var s = row.querySelector('.t-slider');
      s.style.setProperty('--track', 'linear-gradient(90deg,' + T.hex(c.h, c.s, 5) + ',' + T.hex(c.h, c.s, 47) + ',' + T.hex(c.h, c.s, 90) + ')');
      s._paint();
    });

    paneC.querySelectorAll('[data-set] .t-chip').forEach(function (b) {
      var key = b.parentNode.dataset.set;
      b.setAttribute('aria-pressed', st[key] === b.dataset.value ? 'true' : 'false');
    });

    /* contrast: button text, marks on white, the step numbers */
    var rows = [
      ['Button-Text auf Hauptfarbe', vars['--on-brand'], vars['--brand'], 4.5],
      ['Akzent-Text auf Hintergrund', vars['--accent-text'], vars['--tint'], 4.5],
      ['Zahlen auf Akzent (Ablauf)', vars['--on-accent'], vars['--accent'], 3],
      ['Akzent auf Nachtblau', vars['--accent-light'], vars['--night'], 4.5]
    ];
    paneC.querySelector('.t-contrast').innerHTML = rows.map(function (r) {
      var c = T.contrast(T.hexToRgb(r[1]), T.hexToRgb(r[2]));
      var ok = c >= r[3];
      return '<li><span class="t-contrast__sample" style="background:' + r[2] + ';color:' + r[1] + '">Aa</span><span>' + r[0] + '</span>' +
        '<b class="' + (ok ? 'is-ok' : 'is-low') + '">' + c.toFixed(1) + ' : 1 ' + (ok ? '✓' : '!') + '</b></li>';
    }).join('');

    /* fonts */
    paneF.querySelectorAll('.t-pair').forEach(function (b) {
      b.setAttribute('aria-pressed', b.dataset.h === st.head && b.dataset.b === st.body ? 'true' : 'false');
    });
    paneF.querySelectorAll('.t-fonts').forEach(function (list) {
      var kind = list.dataset.kind, activeId = '';
      list.querySelectorAll('.t-font').forEach(function (li) {
        var on = li.dataset.name === st[kind];
        li.setAttribute('aria-selected', on ? 'true' : 'false');
        if (on) activeId = li.id;
      });
      list.setAttribute('aria-activedescendant', activeId);
    });
    var w = T.FONTS.head[st.head].w;
    hwSlider._paint(w[0], w[1]);
    hwSlider.classList.toggle('is-fixed', w[0] === w[1]);
    hsSlider._paint();
    paneF.querySelector('[data-out="hw"]').textContent = w[0] === w[1] ? 'nur ' + w[0] : st.hw;
    paneF.querySelector('[data-out="hs"]').textContent = Math.round(st.hs * 100) + ' %';
  }
  function paintAll() { paint(false); }

  /* ---------- saving ---------- */
  var saveT;
  function commit() { clearTimeout(saveT); if (T.isDefault(st)) T.clear(); else T.save(st); }
  function commitSoon() { clearTimeout(saveT); saveT = setTimeout(commit, 300); }

  /* ---------- open / close, tabs ---------- */
  function setOpen(open) {
    panel.hidden = !open;
    fab.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.documentElement.classList.toggle('tuner-open', open);
    if (open) { paint(false); setActive(activeRole); panel.querySelector('.tuner__close').focus({ preventScroll: true }); }
  }
  fab.addEventListener('click', function () { setOpen(panel.hidden); });
  panel.querySelector('.tuner__close').addEventListener('click', function () { setOpen(false); fab.focus(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !panel.hidden && panel.contains(document.activeElement)) { setOpen(false); fab.focus(); }
  });

  var tabs = panel.querySelectorAll('[role="tab"]');
  function selectTab(i) {
    tabs.forEach(function (t, k) {
      t.setAttribute('aria-selected', k === i ? 'true' : 'false');
      t.tabIndex = k === i ? 0 : -1;
      document.getElementById(t.getAttribute('aria-controls')).hidden = k !== i;
    });
    panel.querySelector('.tuner__tabs').style.setProperty('--i', i);
    if (i === 1) loadPreviews();
    panel.querySelector('.tuner__body').scrollTop = 0;
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { selectTab(i); });
    t.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); var n = (i + 1) % 2; selectTab(n); tabs[n].focus(); }
    });
  });

  /* ---------- footer actions ---------- */
  var toast = panel.querySelector('.tuner__toast'), toastT;
  function say(msg) {
    toast.textContent = msg;
    toast.classList.add('is-on');
    clearTimeout(toastT);
    toastT = setTimeout(function () { toast.classList.remove('is-on'); }, 2200);
  }
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (ok, fail) {
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy') ? ok() : fail(); } catch (e) { fail(e); }
      ta.remove();
    });
  }
  panel.querySelector('.tuner__foot').addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]');
    if (!b) return;
    var act = b.dataset.act;
    if (act === 'reset') {
      var d = T.copy(T.DEFAULTS);
      Object.keys(d).forEach(function (k) { st[k] = d[k]; });
      commit(); paintAll(); say('Zurück auf den Entwurf gesetzt');
    } else if (act === 'link') {
      var url = location.origin + location.pathname + '?gestaltung=' + T.encode(st);
      copyText(url).then(function () { say('Link kopiert: öffnet genau diese Gestaltung'); }, function () { say('Kopieren nicht möglich'); });
    } else if (act === 'css') {
      var vars = Object.assign(T.derive(st), T.fontVars(st));
      var css = '/* Gestaltung ' + new Date().toLocaleDateString('de-DE') + ' · ' + JSON.stringify(st) + ' */\n:root {\n' +
        Object.keys(vars).map(function (k) { return '  ' + k + ': ' + vars[k] + ';'; }).join('\n') + '\n}\n';
      copyText(css).then(function () { say('CSS kopiert'); }, function () { say('Kopieren nicht möglich'); });
    }
  });

  setActive('brand');
  window.addEventListener('resize', function () { if (!panel.hidden) paint(false); });
})();

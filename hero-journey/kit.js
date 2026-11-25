/* Hero kit: shared map data, projection, theme, motion and pointer helpers.
   World units: x = longitude, y = -latitude (so north is up on a canvas). */
const Kit = (() => {
  const D = JSON.parse(document.getElementById('kit-geo').textContent);
  const W = document.getElementById('kit-world'); const WORLD = W ? JSON.parse(W.textContent) : null;
  const TAU = Math.PI * 2, clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const root = document.documentElement;

  /* ---------- decode ---------- */
  const ring = (r, q = 1000, off = 0) => { const o = []; let x = r[off] / q, y = r[off + 1] / q; o.push([x, y]); for (let i = off + 2; i < r.length; i += 2) { x += r[i] / q; y += r[i + 1] / q; o.push([x, y]); } return o; };
  const rings = (list, q) => list.map(r => ring(r, q));
  const mapObj = (o, f) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, f(v)]));
  const geo = {
    bb: D.bb,                                           // [lon0, lat0, lon1, lat1] covered by relief and height
    uganda: rings(D.uganda),                            // rings of [x, y] in world units
    neighbors: mapObj(D.neighbors, v => rings(v)),      // { Kenya: rings, ... } clipped to a wider region
    lakes: mapObj(D.lakes, v => rings(v)),              // { 'Lake Victoria': rings, ... }
    nile: ring(D.nile),                                 // one line, from the outlet at Jinja flowing north
    rivers: mapObj(D.rivers, v => rings(v)),            // { Kagera: lines, ... }
    contours: D.contours.map(c => ({ level: c[0], pts: ring(c, 1000, 1) })),   // level 0..contourLevels-1, low to high
    contourLevels: D.contourLevels,
    local: D.local.map(c => ({ level: c[0], pts: ring(c, 1000, 1) })),         // finer contours near Jinja
    world: WORLD ? rings(WORLD, 100) : null,            // whole-world land rings (only when the hero asks for it)
    places: D.places,                                   // [{n, lon, lat, pop, c (country), cap}] sorted by population
    JINJA: [33.2, -0.44], WANYANGE: [33.252, -0.468], KAMPALA: [32.58, -0.32], CENTER: [32.37, -1.28],
    UG_BOX: [29.55, -1.5, 35.05, 4.25],                 // Uganda's own bounds: lon0, lat0, lon1, lat1
  };
  const path = (rs, close = true) => { const p = new Path2D(); for (const r of rs) { p.moveTo(r[0][0], r[0][1]); for (let i = 1; i < r.length; i++) p.lineTo(r[i][0], r[i][1]); if (close) p.closePath(); } return p; };
  const paths = {
    uganda: path(geo.uganda),
    neighbors: path(Object.values(geo.neighbors).flat()),
    lakes: path(Object.values(geo.lakes).flat()),
    victoria: path(geo.lakes['Lake Victoria']),
    nile: path([geo.nile], false),
    rivers: path(Object.values(geo.rivers).flat(), false),
  };

  /* ---------- projection (equirectangular; Uganda straddles the equator, so distortion is negligible) ---------- */
  // fit([lon0, lat0, lon1, lat1], {x, y, w, h}) -> view. Draw world-unit paths after view.apply(ctx); line widths then need / view.k.
  const fit = (box, rect, mode = 'contain') => {
    const bw = box[2] - box[0], bh = box[3] - box[1];
    const k = mode === 'cover' ? Math.max(rect.w / bw, rect.h / bh) : Math.min(rect.w / bw, rect.h / bh);
    const cx = (box[0] + box[2]) / 2, cy = -(box[1] + box[3]) / 2;
    return view(k, rect.x + rect.w / 2 - cx * k, rect.y + rect.h / 2 - cy * k);
  };
  const view = (k, tx, ty) => ({
    k, tx, ty,
    x: lon => lon * k + tx, y: lat => -lat * k + ty,          // lon/lat -> px
    px: (wx, wy) => [wx * k + tx, wy * k + ty],               // world units -> px
    inv: (px, py) => [(px - tx) / k, -(py - ty) / k],         // px -> [lon, lat]
    apply: (ctx, dpr = 1) => ctx.setTransform(k * dpr, 0, 0, k * dpr, tx * dpr, ty * dpr),
  });
  const km = (a, b) => { const R = 6371, r = Math.PI / 180, dy = (b[1] - a[1]) * r, dx = (b[0] - a[0]) * r; const h = Math.sin(dy / 2) ** 2 + Math.cos(a[1] * r) * Math.cos(b[1] * r) * Math.sin(dx / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)); }; // [lon, lat] pairs

  /* ---------- theme ---------- */
  const mqDark = matchMedia('(prefers-color-scheme: dark)');
  const theme = () => root.dataset.theme === 'dark' || root.dataset.theme === 'light' ? root.dataset.theme : (mqDark.matches ? 'dark' : 'light');
  const PAL = {
    dark: { bg: '#1D2022', bg2: '#262C2F', land: '#2A3236', ink: '#F7F7F7', body: '#C7C8C8', small: '#A4A5A6', line: 'rgba(247,247,247,.14)', lake: '#68A9B9', deep: '#5A93A1', sipi: '#FC7A1E', matoke: '#8FAA66', murram: '#C8514D' },
    light: { bg: '#F7F7F7', bg2: '#ECEBE8', land: '#E6E4DF', ink: '#1D2022', body: '#31393C', small: '#6A7073', line: 'rgba(29,32,34,.14)', lake: '#68A9B9', deep: '#4E8494', sipi: '#E8650A', matoke: '#5F7A3C', murram: '#B0413E' },
  };
  const colors = () => PAL[theme()];
  const themeSubs = new Set(), motionSubs = new Set();
  let lastTheme = theme();
  const themeChanged = () => { const t = theme(); if (t !== lastTheme) { lastTheme = t; themeSubs.forEach(f => f(t)); } };
  new MutationObserver(themeChanged).observe(root, { attributes: true, attributeFilter: ['data-theme'] });
  mqDark.addEventListener ? mqDark.addEventListener('change', themeChanged) : mqDark.addListener(themeChanged);

  /* ---------- reduced motion ---------- */
  const mqRM = matchMedia('(prefers-reduced-motion: reduce)');
  let forceRM = root.dataset.motion === 'reduced' ? true : null;   // the preview gallery can start a frame with motion already reduced
  const reduced = () => forceRM === null ? mqRM.matches : forceRM;
  let lastRM = reduced();
  const motionChanged = () => { const r = reduced(); root.classList.toggle('reduced', r); if (r !== lastRM) { lastRM = r; motionSubs.forEach(f => f(r)); } };
  mqRM.addEventListener ? mqRM.addEventListener('change', motionChanged) : mqRM.addListener(motionChanged);
  root.classList.toggle('reduced', lastRM);
  // The preview gallery drives theme and motion from outside the frame.
  addEventListener('message', e => { const m = e.data; if (!m || m.type !== 'kit') return; if ('theme' in m) { if (m.theme) root.dataset.theme = m.theme; else delete root.dataset.theme; } if ('reduced' in m) { forceRM = m.reduced; motionChanged(); } });

  /* ---------- canvas + loop ---------- */
  // stage(canvas, {frame(t, dt, s), still(s), resize(s)}): keeps the canvas sized to its box (DPR capped at 2),
  // runs frame() only while the canvas is on screen and the tab is visible, and calls still() instead when motion is reduced.
  // s = {ctx, w, h, dpr} in CSS px. Returns {s, poke()}; poke() asks for one more still() (after a tap, theme change, data load).
  const stage = (cv, o) => {
    const s = { ctx: cv.getContext('2d'), w: 0, h: 0, dpr: 1, cv };
    let raf = 0, on = false, vis = true, last = 0, t0 = performance.now(), poked = false;
    const size = () => {
      const r = cv.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
      if (w === s.w && h === s.h && dpr === s.dpr) return false;
      s.w = w; s.h = h; s.dpr = dpr; cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      o.resize && o.resize(s); return true;
    };
    const tick = now => {
      raf = 0; if (!on) return;
      const t = (now - t0) / 1000, dt = Math.min(.05, last ? (now - last) / 1000 : 0); last = now;
      s.ctx.setTransform(s.dpr, 0, 0, s.dpr, 0, 0); o.frame(t, dt, s);
      raf = requestAnimationFrame(tick);
    };
    const still = () => { poked = false; s.ctx.setTransform(s.dpr, 0, 0, s.dpr, 0, 0); (o.still || (x => o.frame((performance.now() - t0) / 1000, 0, x)))(s); };
    const sync = () => {
      const want = vis && !document.hidden && !reduced();
      if (want && !on) { on = true; last = 0; raf = requestAnimationFrame(tick); }
      else if (!want && on) { on = false; cancelAnimationFrame(raf); raf = 0; }
      if (!want && vis) still();
    };
    const poke = () => { if (on || poked) return; poked = true; requestAnimationFrame(still); };
    if ('ResizeObserver' in window) new ResizeObserver(() => { if (size()) on ? 0 : poke(); }).observe(cv); else addEventListener('resize', () => { if (size()) poke(); });
    if ('IntersectionObserver' in window) new IntersectionObserver(es => { vis = es[es.length - 1].isIntersecting; sync(); }, { threshold: 0.01 }).observe(cv);
    document.addEventListener('visibilitychange', sync);
    motionSubs.add(sync); themeSubs.add(poke);
    size(); sync();
    return { s, poke, time: () => (performance.now() - t0) / 1000 };
  };

  /* ---------- pointer ---------- */
  // pointer(el, {move(p), down(p), up(p), leave()}); p = {x, y, type: 'mouse'|'touch'|'pen', down}. Coordinates are CSS px inside el.
  // Vertical page scroll is never blocked: set el.style.touchAction yourself only if a drag gesture truly needs it.
  const pointer = (el, h) => {
    let down = false;
    const P = e => { const r = el.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, type: e.pointerType || 'mouse', down, e }; };
    el.addEventListener('pointermove', e => h.move && h.move(P(e)), { passive: true });
    el.addEventListener('pointerdown', e => { down = true; h.down && h.down(P(e)); }, { passive: true });
    const up = e => { if (!down) return; down = false; h.up && h.up(P(e)); };
    el.addEventListener('pointerup', up, { passive: true }); el.addEventListener('pointercancel', up, { passive: true });
    el.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') h.leave && h.leave(); }, { passive: true });
  };

  /* ---------- raster terrain ---------- */
  const img = id => new Promise(res => { const im = document.getElementById(id); if (!im) return res(null); if (im.complete && im.naturalWidth) res(im); else { im.onload = () => res(im); im.onerror = () => res(null); } });
  const reliefCache = {};
  // relief(theme?) -> Promise<canvas> covering geo.bb, tinted for the theme. Draw it with drawBB(ctx, view, canvas).
  // opts: {flat, hi, lo} override the three tones (flat ground, lit faces, shaded faces) as [r, g, b].
  const relief = async (th = theme(), opts) => {
    const key = th + (opts ? JSON.stringify(opts) : '');
    if (reliefCache[key]) return reliefCache[key];
    const im = await img('kit-relief'); if (!im) return null;
    const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight;
    const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(im, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height), a = d.data;
    const T = Object.assign(th === 'dark' ? { flat: [36, 44, 48], hi: [168, 192, 200], lo: [14, 16, 18] } : { flat: [233, 231, 226], hi: [255, 255, 255], lo: [150, 156, 158] }, opts || {});
    for (let i = 0; i < a.length; i += 4) {
      const v = a[i]; let r, gg, b;
      if (v >= 128) { const u = (v - 128) / 127; r = T.flat[0] + (T.hi[0] - T.flat[0]) * u; gg = T.flat[1] + (T.hi[1] - T.flat[1]) * u; b = T.flat[2] + (T.hi[2] - T.flat[2]) * u; }
      else { const u = (128 - v) / 128; r = T.flat[0] + (T.lo[0] - T.flat[0]) * u; gg = T.flat[1] + (T.lo[1] - T.flat[1]) * u; b = T.flat[2] + (T.lo[2] - T.flat[2]) * u; }
      a[i] = r; a[i + 1] = gg; a[i + 2] = b;
    }
    g.putImageData(d, 0, 0);
    return reliefCache[key] = c;
  };
  // Draws any image/canvas that covers geo.bb into the current view (ctx must be in CSS-px space, i.e. setTransform(dpr,0,0,dpr,0,0)).
  const drawBB = (ctx, v, im) => { const b = geo.bb; ctx.drawImage(im, v.x(b[0]), v.y(b[3]), (b[2] - b[0]) * v.k, (b[3] - b[1]) * v.k); };
  // height() -> Promise<{w, h, data (Uint8, 0 low .. 255 high), at(lon, lat) -> 0..1}>. Relative heights only, not metres.
  let heightP;
  const height = () => heightP || (heightP = img('kit-height').then(im => {
    if (!im) return null;
    const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight;
    const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(im, 0, 0);
    const px = g.getImageData(0, 0, c.width, c.height).data, data = new Uint8Array(c.width * c.height);
    for (let i = 0; i < data.length; i++) data[i] = px[i * 4];
    const b = geo.bb, w = c.width, h = c.height;
    const at = (lon, lat) => { const x = clamp((lon - b[0]) / (b[2] - b[0])) * (w - 1), y = clamp((b[3] - lat) / (b[3] - b[1])) * (h - 1); const x0 = x | 0, y0 = y | 0, x1 = Math.min(w - 1, x0 + 1), y1 = Math.min(h - 1, y0 + 1), fx = x - x0, fy = y - y0; return (lerp(lerp(data[y0 * w + x0], data[y0 * w + x1], fx), lerp(data[y1 * w + x0], data[y1 * w + x1], fx), fy)) / 255; };
    return { w, h, data, at };
  }));

  /* ---------- text on canvas ---------- */
  const fontsReady = () => (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve());
  const FONT = { display: "'Asul', Georgia, serif", body: "'Figtree', system-ui, sans-serif" };

  return { geo, paths, path, ring, fit, view, km, theme, colors, PAL, onTheme: f => themeSubs.add(f), reduced, onReduced: f => motionSubs.add(f), stage, pointer, relief, drawBB, height, fontsReady, FONT, TAU, clamp, lerp, ease, easeOut };
})();

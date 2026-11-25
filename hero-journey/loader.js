/* Ripples journey hero loader.
   Put this on a page that has a section with id="hero" holding a real heading, paragraph and buttons.
   It adds the globe canvas and controls, loads the map data, asks the city lookup where the visitor is,
   then starts the journey. If anything fails the section simply stays as plain text and buttons.

   <link rel="stylesheet" href=".../hero-journey/hero.css">
   <script defer src=".../hero-journey/loader.js" data-geo="https://YOUR-WORKER/"></script> */
(function () {
  var me = document.currentScript;
  var base = me && me.src ? me.src.slice(0, me.src.lastIndexOf('/') + 1) : '';
  var geoUrl = (me && me.getAttribute('data-geo')) || window.RIPPLES_GEO_URL || '';
  var GEO_WAIT = 1200; // ms to hold the start for the city lookup; after that the time zone is used and a late answer still updates it
  var CHROME = "<div class=\"learn\" id=\"learn\" role=\"group\" aria-label=\"Learn about Uganda\"></div><div class=\"lcard\" id=\"lcard\" aria-live=\"off\"><div class=\"lc-head\"><span class=\"lc-num\" aria-hidden=\"true\"></span><p class=\"lc-t\"></p><button class=\"lc-x\" type=\"button\" aria-label=\"Close\"><svg viewBox=\"0 0 16 16\" width=\"14\" height=\"14\" aria-hidden=\"true\"><path d=\"M3.5 3.5l9 9M12.5 3.5l-9 9\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\"/></svg></button></div><p class=\"lc-p\"></p><p class=\"lc-f\"><span class=\"lc-n\"></span><span class=\"lc-c\"></span></p></div><div class=\"jr-bar\" id=\"bar\"><p class=\"jr-from\" id=\"from\"><svg viewBox=\"0 0 22 10\" width=\"22\" height=\"10\" aria-hidden=\"true\"><circle cx=\"2\" cy=\"7\" r=\"1.3\"/><circle cx=\"7\" cy=\"4.4\" r=\"1.3\"/><circle cx=\"12.5\" cy=\"3.2\" r=\"1.3\"/><circle cx=\"18\" cy=\"4\" r=\"2.4\"/></svg><span></span></p><button class=\"jr-btn jr-replay\" id=\"replayBtn\" type=\"button\"><svg viewBox=\"0 0 20 20\" width=\"18\" height=\"18\" aria-hidden=\"true\"><path d=\"M4.2 10a5.8 5.8 0 1 0 1.9-4.3\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\"/><path d=\"M5.6 2.6v3.6h3.6\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/></svg><span>Replay journey</span></button><button class=\"jr-btn globe-toggle\" id=\"zoomBtn\" type=\"button\" aria-pressed=\"false\"><svg class=\"ic-in\" viewBox=\"0 0 20 20\" width=\"18\" height=\"18\" aria-hidden=\"true\"><circle cx=\"8.5\" cy=\"8.5\" r=\"5.5\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\"/><path d=\"M12.6 12.6 17 17M8.5 6v5M6 8.5h5\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.6\" stroke-linecap=\"round\"/></svg><svg class=\"ic-out\" viewBox=\"0 0 20 20\" width=\"18\" height=\"18\" aria-hidden=\"true\"><circle cx=\"10\" cy=\"10\" r=\"7\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.5\"/><ellipse cx=\"10\" cy=\"10\" rx=\"3.2\" ry=\"7\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.3\"/><path d=\"M3.3 7.6h13.4M3.3 12.4h13.4\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.3\"/></svg><span>Zoom to Uganda</span></button></div>";

  function pick(root, list) { for (var i = 0; i < list.length; i++) { var el = root.querySelector(list[i]); if (el) return el; } return null; }
  function script(src) { return new Promise(function (ok, no) { var s = document.createElement('script'); s.src = src; s.onload = ok; s.onerror = no; document.head.appendChild(s); }); }
  function data(id, text) { var s = document.createElement('script'); s.type = 'application/json'; s.id = id; s.textContent = text; document.body.appendChild(s); }
  function text(url) { return fetch(url).then(function (r) { if (!r.ok) throw new Error(url + ' ' + r.status); return r.text(); }); }
  function validOrigin(o) { return o && isFinite(+o.lon) && isFinite(+o.lat) && Math.abs(+o.lat) <= 90 && o.name ? { name: String(o.name), lon: +o.lon, lat: +o.lat } : null; }

  function locate() {
    if (!geoUrl || window.RIPPLES_ORIGIN) return Promise.resolve();
    if (/[?&]from=/.test(location.search)) return Promise.resolve(); // the testing override wins
    var started = false;
    var ask = fetch(geoUrl, { credentials: 'omit', cache: 'no-store' })
      .then(function (r) { return r.ok && r.status !== 204 ? r.json() : null; })
      .then(function (o) {
        o = validOrigin(o); if (!o) return;
        if (!started) window.RIPPLES_ORIGIN = o;
        else dispatchEvent(new CustomEvent('ripples:origin', { detail: o }));
      })
      .catch(function () { /* blocked or offline: the time zone is the fallback */ });
    var wait = new Promise(function (ok) { setTimeout(ok, GEO_WAIT); });
    return Promise.race([ask, wait]).then(function () { started = true; });
  }

  function start() {
    var hero = document.getElementById('hero');
    if (!hero || hero.dataset.journey === 'on' || !window.fetch || !window.Promise) return;
    var body = pick(hero, ['.hero-journey_body', '.hero-body']);
    var copy = pick(hero, ['.hero-journey_copy', '.hero-copy']);
    var cta = pick(hero, ['.hero-journey_cta', '.hero-cta']);
    if (!body || !copy || !cta || !copy.querySelector('p')) return;
    hero.dataset.journey = 'on';

    Promise.all([text(base + 'kit-geo.json'), text(base + 'kit-world.json'), locate()]).then(function (r) {
      data('kit-geo', r[0]); data('kit-world', r[1]);
      var im = new Image(); im.id = 'kit-relief'; im.hidden = true; im.alt = ''; im.crossOrigin = 'anonymous'; im.src = base + 'relief.jpg';
      document.body.appendChild(im);

      document.documentElement.dataset.theme = 'light'; // the site has one theme; never follow the device's dark mode
      body.classList.add('hero-body'); copy.classList.add('hero-copy'); cta.classList.add('hero-cta');
      var vis = document.createElement('div'); vis.className = 'hero-visual'; vis.setAttribute('aria-hidden', 'true');
      var cv = document.createElement('canvas'); cv.id = 'cv'; vis.appendChild(cv);
      hero.insertBefore(vis, hero.firstChild);
      hero.insertAdjacentHTML('beforeend', CHROME);
      hero.classList.add('hero', 'globe-hero', 'journey-hero', 'jr-busy');
      // a fixed or sticky site nav covers part of the first screen: take its height off the hero so the controls stay in view
      var nav = document.querySelector('.w-nav'), np = nav ? getComputedStyle(nav).position : '';
      if (nav && (np === 'fixed' || np === 'sticky') && hero.getBoundingClientRect().top + window.scrollY < nav.offsetHeight + 40) hero.style.setProperty('--nav-h', nav.offsetHeight + 'px');

      return script(base + 'kit.js').then(function () { return script(base + 'journey.js'); });
    }).catch(function (e) {
      // leave the plain section in place
      hero.classList.remove('hero', 'globe-hero', 'journey-hero', 'jr-busy');
      var v = hero.querySelector('.hero-visual'); if (v) v.remove();
      ['learn', 'lcard', 'bar'].forEach(function (id) { var el = document.getElementById(id); if (el) el.remove(); });
      if (window.console) console.warn('Journey hero did not start:', e);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();

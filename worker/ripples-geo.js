/* ripples-geo: tells the journey hero which city a visitor is near.
   Cloudflare already works this out for every request (request.cf). Nothing is stored or logged here,
   and the visitor's IP address is never returned. Answers only the sites listed below.

   Response: {"name":"Wichita","lon":-97.33,"lat":37.69}   or 204 when Cloudflare has no city. */
const ALLOWED = [
  'https://rftw-dev.webflow.io',
  'https://ripplesfromthewell.org',
  'https://www.ripplesfromthewell.org',
];

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const extra = (env && env.ALLOWED_ORIGINS ? String(env.ALLOWED_ORIGINS) : '').split(',').map(s => s.trim()).filter(Boolean);
    const ok = ALLOWED.concat(extra).includes(origin);
    const headers = { 'Vary': 'Origin', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' };
    if (ok) headers['Access-Control-Allow-Origin'] = origin;

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: { ...headers, 'Access-Control-Allow-Methods': 'GET', 'Access-Control-Max-Age': '86400' } });
    if (request.method !== 'GET') return new Response(null, { status: 405, headers });
    if (!ok) return new Response(null, { status: 403, headers });

    const cf = request.cf || {};
    const lon = parseFloat(cf.longitude), lat = parseFloat(cf.latitude);
    if (!cf.city || !isFinite(lon) || !isFinite(lat)) return new Response(null, { status: 204, headers });

    // two decimals is about a kilometre: city level, not street level
    const body = JSON.stringify({ name: String(cf.city).slice(0, 48), lon: Math.round(lon * 100) / 100, lat: Math.round(lat * 100) / 100 });
    return new Response(body, { status: 200, headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8' } });
  },
};

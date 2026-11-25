# rftw-website

Hosted code for the Ripples from the Well website (Webflow).

## hero-journey

The Home hero: a dot globe that turns from the visitor's city to Uganda, then opens a relief map with a few places to learn about.

The heading, paragraph and buttons are ordinary Webflow elements. `loader.js` adds the canvas and controls around them, so if the script fails the section is still a normal hero.

Webflow section needs: `id="hero"`, and inside it elements with the classes `hero-journey_body`, `hero-journey_copy` (holding a paragraph) and `hero-journey_cta`.

Page code (pin `@REF` to a commit or tag, never a branch):

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/Ripples-from-the-Well/rftw-website@REF/hero-journey/hero.css">
<script defer src="https://cdn.jsdelivr.net/gh/Ripples-from-the-Well/rftw-website@REF/hero-journey/loader.js" data-geo="https://ripples-geo.shrill-credit-5613.workers.dev/"></script>
```

Starting point, in order: `window.RIPPLES_ORIGIN`, `?from=Europe/London` (testing), the city lookup (`data-geo`), the browser's time zone, Hutchinson.

## worker/ripples-geo.js

Cloudflare Worker behind `data-geo`. Returns `{name, lon, lat}` for the visitor's city from Cloudflare's own request data. Stores nothing, never returns an IP address, and only answers the sites in its `ALLOWED` list (add more with an `ALLOWED_ORIGINS` variable, comma separated).

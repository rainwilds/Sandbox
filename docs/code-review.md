# Website code review feedback (high-signal)

This is a repo-specific assessment focused on **overall improvement opportunities**, with the note that most HTML files are test pages (so the review emphasizes **`<head>`/site wiring** and anything that broadly affects real pages).

## Highest priority fixes (breakages / correctness)

### 1) Broken or mismatched head scripts

- Some pages reference `./js/head.js`, but **that file is not present** in the repo (so the head-meta system can’t run on those pages).
  - Example: `index.html`, `web-components.html`
- Several pages reference `js/head-generator.js` (missing) while others use the correct path `js/generators/head-generator.js` (exists).
  - Example: `header-2.html`, `header-3.html`, `post.html`

**Impact**: missing head scripts means missing SEO tags, missing icons, missing structured data, inconsistent preloads, and inconsistent component loading.

### 2) Stop linking to files that don’t exist

- `custom.css` is preloaded/injected but **doesn’t exist** in the repo.
  - `_head.html`, `blog.html`, and `js/generators/head-generator.js` currently assume it exists.
- `setup.json` includes favicon links like `./favicon.svg` and `./apple-touch-icon.png`, but those files **don’t exist** in the repo.

**Impact**: avoidable 404s, wasted requests, broken favicons/app icons across the site.

### 3) Unify on one head system

There are currently two approaches in the codebase:

- **Newer**: `<data-custom-head>` + `js/generators/head-generator.js`
- **Older**: `<data-bh-head>` + `./js/head.js` (missing)

**Recommendation**: consolidate to the generator-based approach (or re-add the missing older system), but don’t keep both in active use.

## SEO / metadata improvements (head-generator)

### 1) Add a real `<title>` element

The generator currently sets `meta name="title"` which is non-standard. Browsers/search engines primarily use the **`<title>` element**.

**Recommendation**: generate `<title>` (and keep `meta[name="description"]`, OG, Twitter/X tags).

### 2) Robots + sitemap are currently template/placeholder-ish

- `robots.txt` points to an `example.com` sitemap and disallows major asset paths (`/img/`, `/video/`, `/styles.css`, `/fonts/`).
- `sitemap.xml` contains `https://example.com/...` URLs.

**Impact**: search engines may not index the site properly; blocking images/videos harms rich results and previews.

## Performance improvements (head-level)

### 1) Avoid preload cache misses for `setup.json`

You preload `./JSON/setup.json` with `crossorigin="anonymous"`, but fetch it via normal `fetch()`. Depending on browser caching behavior, this can cause **double-fetch** or a preload not being reused.

**Recommendation**: ensure the preload and fetch are aligned (same-origin settings) so the preload is actually consumed.

### 2) Pin or self-host third-party CDN dependencies

`marked` is loaded from jsDelivr without a pinned version or SRI in `blog.html`/`post.html`.

**Recommendation**: pin versions and add SRI (or self-host) to reduce supply-chain risk and improve repeatability.

## Security / hardening (head-level)

### 1) Consider Subresource Integrity (SRI)

For any third-party scripts/styles (jsDelivr, Swiper CDN, etc.), use SRI or self-host.

### 2) Decide whether you want a CSP

Snipcart is injected via an inline loader script string inside `head-generator.js`. This works, but it makes a strict Content Security Policy harder unless you use nonces/hashes or externalize the loader.

## Broad codebase health note (not just `<head>`, but high impact)

### CSS features that may not be broadly supported without a build step

`styles.css` uses features like custom `@function` and calls like `background-color: --shade(...)`. If this CSS is served as-is (static), many browsers will ignore these parts, causing silent styling regressions.

**Recommendation**: either add a build step (PostCSS/Sass/etc.) or rewrite those parts into standard CSS.

## Suggested next steps (small, high ROI)

- Make every “real” page use **one** consistent head pipeline.
- Remove/guard references to missing assets (`custom.css`, missing icons).
- Fix `robots.txt` and generate a real `sitemap.xml` for `rainwilds.github.io/Sandbox/`.


# Head Generator Documentation

The `head-generator.js` script dynamically manages the `<head>` section using a centralized `config.js` and optional page-specific attributes from `<data-custom-head>`. It supports:

- Critical and deferred resource loading
- Font and stylesheet preloading
- **Zero-config hero image preloading** with `srcset` (uses `shared.js` breakpoints)
- Meta tags (SEO, Open Graph, X/Twitter)
- Dynamic `theme-color` meta tags
- JSON-LD structured data (`Organization`)
- Favicon injection
- Snipcart e-commerce integration
- Dynamic component loading with dependency resolution

The script runs on `DOMContentLoaded`, processes configuration, loads components, and removes `<data-custom-head>`.

---

## Key Features

| Feature | Behavior |
|-------|----------|
| **Config-Driven** | All defaults from `config.js` |
| **Hero Images** | `hero-image` + `hero-count` required; defaults to `shared.js` breakpoints |
| **Components** | Full dependency graph, resilient loading |
| **Logging** | `isDev` enabled via `/dev/` or `?debug=true` |
| **Performance** | `requestIdleCallback`, `preload`, `async` |

---

## Page-Specific Attributes (`<data-custom-head>`)

Only these attributes are processed:

| Attribute | Description | Expected Format |
|---------|-------------|-----------------|
| `components` | Space-separated component names | `custom-header custom-logo` |
| `hero-image` | **Comma-separated** image URL templates | `img/hero-{width}.avif` or `img/a-{width}.avif,img/b-{width}.avif` |
| `hero-count` | **Required** — number of images to preload | `1`, `2`, etc. |
| `hero-widths` | **Optional** — override default widths | `640,1280,1920,3840` |
| `hero-size` | `sizes` string | `100vw`, `(max-width: 768px) 100vw, 50vw` (default: `100vw`) |
| `hero-format` | Image format | `avif` (default) |
| `canonical` | Canonical URL override | `https://example.com/page` |

> **Hero Preload Rules**:
> - `hero-count` **must be present**
> - `hero-image` holds **1 or more** templates
> - Max images = `min(hero-count, template count)`
> - **Default `hero-widths`**: `[576, 768, 992, 1200]` from `shared.js`

---

## Hero Image Preloading

**Zero-config by default** — uses `VIEWPORT_BREAKPOINT_WIDTHS` from `shared.js`.

### Example: Single Hero (Default Widths)

```html
<data-custom-head
  hero-image="img/hero-{width}.avif"
  hero-count="1">
</data-custom-head>
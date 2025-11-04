# Custom Nav Documentation

The `<custom-nav>` is a Web Component designed to create a customizable, responsive navigation menu with support for mobile toggling, accessibility, and dynamic content. It supports **local JSON via the `nav` attribute** or **global navigation via config** (header/footer). The component sanitizes inputs, validates icons, and caches rendering for performance. It integrates with `BACKDROP_FILTER_MAP` from `shared.js`.

---

## Key Features

- **Lazy initialization** via `IntersectionObserver` (loads only when visible + 50px root margin)
- **Render caching** based on critical attribute hash
- **Global navigation support** (via `getConfig()` when `nav` attribute is absent)
- **Responsive toggle** with accessible hamburger menu
- **Input sanitization & validation** (XSS-safe HTML, valid URLs, Font Awesome icons)
- **Debug mode** (`?debug=true` in URL)
- **Event-driven updates** for global nav changes

---

## Navigation Attributes

| Attribute Name | Description | Default Value | Expected Format |
|----------------|-------------|---------------|-----------------|
| `nav` | Specifies navigation links as a JSON array of `{href, text}` objects. If absent, attempts to load from global config (`headerNavigation` or `footerNavigation`). | `null` (falls back to global) | JSON string: `[{"href": "/home", "text": "Home"}]` |
| `nav-type` | Defines whether this is a `header` or `footer` nav. Affects global config key and event listening. | `'header'` | `header` or `footer` |
| `nav-aria-label` | ARIA label for the `<nav>` element. | `'Main navigation'` | Plain text |
| `nav-background-color` | Inline background color (not class-based). | `''` | Valid CSS color: `#fff`, `#1a1a1a`, `rgb(255,0,0)` |
| `nav-background-image-noise` | Adds noise texture background when present. | `false` | Boolean attribute (presence = `true`) |
| `nav-backdrop-filter` | Applies backdrop filter effects. Uses `BACKDROP_FILTER_MAP` for values. Non-matching classes are added as-is. | `[]` | Space-separated: `backdrop-filter-blur-small backdrop-filter-saturate-high` |
| `nav-border` | Adds border utility classes. | `''` | Space-separated class names (alphanumeric, `-`, `_` only) |
| `nav-border-radius` | Adds border-radius utility classes. | `''` | Space-separated class names |
| `nav-class` | Custom classes for the `<nav>` element. | `''` | Sanitized space-separated class names |
| `nav-container-class` | Classes for the outer container `<div>`. | `''` | Sanitized space-separated class names |
| `nav-container-style` | Inline styles for container. Limited to safe properties. | `''` | CSS: `display: flex; padding: 1rem;` (allowed: `display`, `justify-content`, `align-items`, `padding`, `margin`, `width`, `height`) |
| `nav-style` | Inline styles for `<nav>`. Limited to safe properties. | `''` | CSS: `padding: 10px; font-size: 1rem;` (allowed: `color`, `background-color`, `border`, `border-radius`, `padding`, `margin`, `font-size`, `font-weight`, `text-align`, `display`, `width`, `height`, `position`) |
| `nav-orientation` | Layout direction of links. | `'horizontal'` | `horizontal` or `vertical` |
| `nav-position` | Alignment within container. Maps to `VALID_ALIGN_MAP`. | `''` | One of: `center`, `top`, `bottom`, `left`, `right`, `top-left`, `top-center`, `top-right`, `bottom-left`, `bottom-center`, `bottom-right`, `center-left`, `center-right` |
| `nav-toggle-class` | Custom classes for toggle button. | `''` | Sanitized space-separated class names |
| `nav-toggle-icon` | **Font Awesome `<i>` tag only**. Must include `fa-` class. Sanitized and validated. | `'<i class="fa-solid fa-bars"></i>'` | Valid FA icon: `<i class="fa-solid fa-bars"></i>` |

---

## Global Navigation

- If `nav` attribute is **missing**, the component loads from global config:
  - `nav-type="header"` → `config.headerNavigation`
  - `nav-type="footer"` → `config.footerNavigation`
- Listens to custom events:
  - `header-navigation-updated`
  - `footer-navigation-updated`
- Re-renders automatically on config update **if visible and initialized**

---

## Rendering & Caching

- **Critical attributes** trigger re-render:
  ```js
  ['nav', 'nav-type', 'nav-position', 'nav-class', 'nav-style', 'nav-aria-label',
   'nav-toggle-class', 'nav-toggle-icon', 'nav-orientation', 'nav-container-class',
   'nav-container-style', 'nav-background-color', 'nav-background-image-noise',
   'nav-border', 'nav-border-radius', 'nav-backdrop-filter']
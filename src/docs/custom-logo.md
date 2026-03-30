<!-- Add this block to the top of all Markdown documentation to ensure printing is corrrect. -->

<style>
    /* 1. Force all standard body text to be pure black */
    body, p, li, h1, h2, h3, h4, h5, h6, table, th, td {
        color: #000000 !important;
    }

    /* 2. Force the code blocks background to be white (optional, saves ink) */
    code, pre {
        background-color: #ffffff !important;
        border: 1px solid #cccccc !important; /* Adds a nice border instead of a grey box */
    }

    /* 3. The "Nuclear" Option: Force EVERY distinct part of the code to be black. 
       Syntax highlighters wrap keywords in <span> tags. We must target them. */
    code, pre, code *, pre * {
        color: #000000 !important;
        font-weight: 600 !important; /* Semi-bold for readability */
        text-shadow: none !important;
    }

    /* 4. Keep comments distinctive but readable (Dark Grey + Italic) */
    .hljs-comment, span.hljs-comment {
        color: #444444 !important; 
        font-style: italic !important;
        font-weight: normal !important; /* Make comments thinner than code */
    }
</style>

# Custom Logo (`<custom-logo>`)

The `<custom-logo>` is a highly robust Web Component designed to handle responsive, theme-aware, and accessible brand logos. Extending the base `HTMLElement`, it dynamically generates `<picture>` markup to serve different image assets based on the user's color scheme preference (light/dark mode) and viewport size, while actively lazy-loading and validating image sources to ensure layout stability.

## Features

* **👁️ Lazy Loading:** Utilizes `IntersectionObserver` to defer initialization, source validation, and rendering until the element is within 50px of the viewport.
* **🌗 Theme-Aware:** Natively supports dark and light mode asset swapping using `prefers-color-scheme` media queries.
* **📱 Responsive Art Direction:** Seamlessly transitions between full-sized logos and simplified icons based on a defined breakpoint.
* **🛡️ Auto-Validation & Fallbacks:** Automatically performs `HEAD` requests to validate image URLs before rendering. If a source fails, it gracefully degrades to a placeholder image.
* **♿ Accessibility (a11y) Enforced:** Validates the presence of `alt` text alongside image sources. It also supports purely decorative logos by automatically applying `role="presentation"`.

---

## 1. Setup & Usage

### Requirements
1.  Import the `custom-logo.js` component file into your bundle.
2.  Ensure `VALID_ALIGNMENTS` and `VALID_ALIGN_MAP` are exported from your `../shared.js` utility.
3.  Ensure your `../config.js` is set up to provide the application's `basePath`.

### Basic Example (Theme-Aware Desktop Logo)
```html
<custom-logo 
    logo-full-light-src="/assets/logo-light.svg" 
    logo-full-light-alt="Acme Corp"
    logo-full-dark-src="/assets/logo-dark.svg" 
    logo-full-dark-alt="Acme Corp"
    logo-height="40px"
    logo-full-position="left">
</custom-logo>
```

### Advanced Example (Responsive & Theme-Aware)
```html
<custom-logo 
    logo-full-primary-src="/assets/logo-full.svg" 
    logo-full-primary-alt="Acme Corporation"
    logo-icon-light-src="/assets/icon-light.svg"
    logo-icon-dark-src="/assets/icon-dark.svg"
    logo-icon-light-alt="Acme"
    logo-icon-dark-alt="Acme"
    logo-breakpoint="768"
    logo-height="3rem"
    logo-full-position="left"
    logo-icon-position="center">
</custom-logo>
```

---

## 2. Configuration Attributes

### Logo Sources & Accessibility

| Attribute Name | Description | Required? |
|----------------|-------------|-----------|
| **logo-full-primary-src** | Default URL for the full desktop logo. | No* |
| **logo-full-light-src** | URL for the full logo in light mode. | No* |
| **logo-full-dark-src** | URL for the full logo in dark mode. | No* |
| **logo-icon-primary-src** | Default URL for the mobile/icon logo. | No* |
| **logo-icon-light-src** | URL for the icon logo in light mode. | No* |
| **logo-icon-dark-src** | URL for the icon logo in dark mode. | No* |

> **Note**: *At least one valid source (either full or icon) must be provided. If providing a light variant, the corresponding dark variant must also be provided (and vice versa).* Every provided source **must** have a corresponding `-alt` attribute (e.g., `logo-full-primary-alt`) unless **all** alt attributes are left blank, which marks the logo as decorative.

### Layout & Settings

| Attribute Name | Description | Default | Expected Format |
|----------------|-------------|---------|-----------------|
| **logo-breakpoint** | Viewport width (in pixels) below which the `icon` sources are displayed instead of `full` sources. | `''` | Positive Integer (e.g., `768`) |
| **logo-height** | Applies inline height to the rendered `<img>` tag. | `''` | CSS Length (`px`, `rem`, `%`, `vh`, etc.) |
| **logo-full-position** | Alignment for the full logo. Maps via `VALID_ALIGN_MAP`. | `place-self-center` | Defined in `VALID_ALIGNMENTS` |
| **logo-icon-position** | Alignment for the icon logo (only active below `logo-breakpoint`). | `''` | Defined in `VALID_ALIGNMENTS` |

---

## 3. Key Features & Behavior

### 🚦 Intersection Observer & Caching
The component registers itself with a static `IntersectionObserver` upon creation. It will not fetch configuration, validate sources, or render HTML until it is `50px` away from intersecting the viewport. Once rendered, the generated HTML string is stored in a `renderCache` based on a hash of the component's critical attributes, preventing expensive re-renders on subsequent DOM changes unless the attributes themselves change.

### 🖼️ The `<picture>` Generation Logic
When resolving the attributes, the component dynamically constructs a `<picture>` element containing multiple `<source>` tags. 
* **Media Queries:** It calculates CSS media queries based on your `logo-breakpoint`. Mobile/Icon sources are wrapped in `(max-width: {breakpoint - 1}px)`, while desktop/full sources get `(min-width: {breakpoint}px)`.
* **Color Scheme:** It appends `and (prefers-color-scheme: dark/light)` to the media queries if light/dark specific attributes are provided.

### 🔍 Strict Validation
Before rendering the final HTML, the component executes a `HEAD` fetch request to validate every provided image URL (checking for `res.ok`). 
* If validation fails (e.g., a 404 or CORS error), a console warning is emitted.
* If *any* critical source is invalid, or if no sources are provided, the component falls back to rendering a safe placeholder (`https://placehold.co/300x40`).

---

## 4. Styling Reference (Internals)

Understanding the internal structure helps when targeting the logo via external CSS.

### 🏗️ Structural Hierarchy

1.  **Outer Wrapper (`div.logo-container`)**
    * **Classes:** Always includes `logo-container`. Additional alignment classes are mapped from `logo-full-position` via `VALID_ALIGN_MAP` (e.g., `place-self-center`).
2.  **Anchor Tag (`a`)**
    * **Attributes:** Always links to `/` (home).
3.  **Picture Element (`picture`)**
    * Contains the dynamically generated `<source>` tags specifying `media` and `srcset`.
4.  **Fallback Image (`img`)**
    * **Attributes:** Contains the `src` and `alt` for browsers that don't support `<picture>`.
    * Includes `loading="lazy"` and `fetchpriority="high"`.
    * Applies the inline `height` style based on the `logo-height` attribute.

### 📱 Injected Styles (Breakpoint Override)
If both `logo-breakpoint` and `logo-icon-position` are defined, the component injects a scoped `<style>` block immediately preceding the container:

```css
<style>
    @media (max-width: {breakpoint - 1}px) {
        .logo-container {
            place-self: {mapped-icon-position} !important;
        }
    }
</style>
```

---

## 5. Troubleshooting

* **Logo is displaying a `300x40` placeholder image:**
    * Check your browser console. The component is likely failing its pre-render `HEAD` request. Ensure the image URLs are correct, exist on the server, and have proper CORS headers if loaded from a different origin.
* **Getting Accessibility (❌) Errors in the console:**
    * If you provide a `src` attribute (like `logo-icon-light-src`), you *must* provide the corresponding `alt` attribute (`logo-icon-light-alt`). If the logo is purely decorative, remove *all* `-alt` attributes from the element to trigger the `role="presentation"` mode.
* **Logo isn't updating when I change attributes via JS:**
    * The component batches and ignores attribute changes if it hasn't intersected the viewport yet. Ensure the element is visible on screen.
* **How do I enable Debug Mode?**
    * The component has robust internal logging. You can enable it by ensuring your URL contains `/dev/` in the path, or by appending `?debug=true` to your query string. Look for blue `[CustomLogo]` logs in your DevTools console.
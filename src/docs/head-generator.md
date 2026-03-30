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

# Head Generator (`head-generator.js`)

The `head-generator.js` module is the vital entry point and orchestrator for the design system. It operates via an Immediately Invoked Function Expression (IIFE) that runs immediately upon page load. Its primary responsibilities are dynamic component loading, injecting critical meta/SEO tags, preloading assets (fonts, hero images), and managing external dependencies (like Font Awesome and Snipcart).

Unlike the Web Components (`<custom-block>`, `<custom-slider>`), this is a pure JavaScript module that reads instructions from a hidden `<data-custom-head>` element present in the HTML document body.

## Features

* **🧩 Dynamic Dependency Injection:** Asynchronously loads requested web components and strictly manages their dependency trees to prevent race conditions.
* **⚡ Critical Asset Preloading:** Automatically generates complex `<link rel="preload">` markup with full `imagesrcset` generation for the Hero image to maximize Core Web Vitals (LCP).
* **🔍 Automated SEO & Meta Tags:** Merges global settings from `config.js` with page-specific attributes to dynamically build all required Open Graph, Twitter Cards, and standard meta tags.
* **🌐 JSON-LD Schema Generation:** Constructs proper Schema.org JSON-LD data for the organization based on the global business configuration.
* **🛒 E-commerce Ready:** Native integration for injecting the Snipcart loader script and its required settings via a deferred execution strategy.
* **🧹 DOM Cleanup:** Ensures all stray `<style>`, `<link>`, and `<script>` tags found in the body are moved into the `<head>` after initialization.

---

## 1. Setup & Usage

### Requirements
1.  Import `head-generator.js` at the bottom of your HTML `<body>` or as a `type="module"`.
2.  Ensure `../config.js` and `../shared.js` are present.
3.  Include a `<data-custom-head>` element anywhere in your HTML with appropriate `data-*` attributes to instruct the generator.

### Basic Example
```html
<body>
    <data-custom-head 
        data-components="custom-header custom-block custom-logo"
        data-title="Home - My Website"
        data-description="Welcome to my awesome website."
        data-theme="light"
        data-hero-image="hero-bg.jpg"
        data-hero-count="1">
    </data-custom-head>

    <custom-header>...</custom-header>
    <custom-block>...</custom-block>

    <script type="module" src="/js/generators/head-generator.js"></script>
</body>
```

---

## 2. Configuration Attributes (data-custom-head)

The module parses all `data-*` attributes on the `<data-custom-head>` element. Because dataset keys are automatically converted to camelCase by the browser, a `data-hero-image` attribute becomes `attributes.heroImage`.

### 2.1 Component Loading
| Attribute | Description | Expected Value |
| :--- | :--- | :--- |
| `data-components` | Space-separated list of Web Components to load. | e.g. `"custom-block custom-slider"` |

### 2.2 Page Meta & SEO
*Note: If an attribute is omitted, the module will fallback to the global defaults defined in `config.js`.*

| Attribute | Description | Expected Value |
| :--- | :--- | :--- |
| `data-title` | Overrides the `<title>` and `og:title`. | String |
| `data-description` | Overrides the `<meta name="description">`. | String |
| `data-canonical` | Overrides the canonical URL. | Full URL String |
| `data-og-image` | Overrides the `og:image` asset. | URL String |

### 2.3 Theme & Styling
| Attribute | Description | Expected Value |
| :--- | :--- | :--- |
| `data-theme` | Sets the global `data-theme` attribute on the `<body>` tag. | `"light"` or `"dark"` |

### 2.4 Hero Image Preloading (LCP Optimization)
*These attributes control how the `head-generator` creates the `rel="preload"` links for critical images.*

| Attribute | Description | Default | Expected Value |
| :--- | :--- | :--- | :--- |
| `data-hero-image` | The base filename(s) of the image to preload. Comma-separated for multiple. | `''` | e.g. `"hero-image.jpg"` |
| `data-hero-count` | Number of images from the list to process. | `0` | Integer >= 1 |
| `data-hero-widths` | Comma-separated list of widths to generate the `imagesrcset`. | `VIEWPORT_BREAKPOINTS` | e.g. `"640, 1024, 1920"` |
| `data-hero-size` | The CSS `sizes` attribute string. | `'100vw'` | e.g. `"(max-width: 768px) 100vw, 50vw"` |
| `data-hero-format` | The file extension to target. | `'avif'` | `"avif"`, `"webp"`, `"jpg"` |

---

## 3. Key Features & Behavior

### 🧩 Component Dependency Resolution
When `data-components` is provided, the script cross-references the requested components against its internal `DEPENDENCIES` graph. 
```javascript
const DEPENDENCIES = {
  'custom-slider': ['custom-block'],
  'custom-block': ['image-generator', 'video-generator', 'shared'],
  // ...
};
```
If you request `custom-slider`, the generator automatically resolves the tree and guarantees that `shared`, `image-generator`, `video-generator`, and `custom-block` are loaded *before* `custom-slider`.

### 🖼️ Hero Preloading Logic
To ensure the best possible LCP (Largest Contentful Paint) scores, the `data-hero-image` system does not just inject a simple URL. It programmatically generates an entire responsive `imagesrcset` string based on `data-hero-widths` (or the default system breakpoints). 
* It intelligently switches paths between the `responsivePath` and `primaryPath` based on the image size and format (e.g., pulling a full-resolution 3840px JPEG from a different directory than smaller WebPs).
* The resulting `<link rel="preload" as="image" imagesrcset="...">` is injected into the `<head>` before rendering begins.

### 🛒 Snipcart & Deferred Scripts
The module utilizes `document.createDocumentFragment()` to batch DOM injections. Critical items (like fonts, meta tags, CSS) are appended to a `criticalFrag`, while non-critical scripts (like the JSON-LD schema or the official Snipcart loader script) are appended to a `deferredFrag`.
* The `criticalFrag` is injected immediately. 
* The `deferredFrag` is injected inside a `requestIdleCallback` (or a `setTimeout(..., 0)` fallback) to ensure the main thread is not blocked during initial page rendering.

### 🧹 Final Cleanup
Once all tasks are completed, the `<data-custom-head>` element is destroyed to keep the DOM clean. Finally, the script crawls the DOM for any `<style>`, `<link>`, or `<script>` tags that may have been injected directly into the `<body>` by CMS plugins, forces script tags to `defer`, and moves them into the `<head>`. It signals completion by setting `window.__PAGE_FULLY_RENDERED__ = true` and `data-page-ready="true"` on the `html` element.
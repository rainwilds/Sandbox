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

# Image Generator (`image-generator.js`)

The `image-generator.js` module is a powerful utility designed to programmatically generate robust, responsive `<picture>` markup. It handles format negotiation (JXL, AVIF, WebP, JPG), theme switching (light/dark mode), responsive art direction (swapping assets at specific breakpoints), and automated `srcset` calculation.

Unlike a Web Component, this is an exported asynchronous function used internally by components like `<custom-block>` and `<custom-logo>`.

## Features

* **🖼️ Advanced Format Support:** Automatically generates sources for modern image formats (JXL, AVIF, WebP) with a reliable JPG fallback.
* **📏 Automated `srcset` Generation:** Builds complex `srcset` strings based on the system's `VIEWPORT_BREAKPOINT_WIDTHS`, ensuring browsers only download appropriately sized assets.
* **🌓 Theme Awareness:** Natively handles `lightSrc` and `darkSrc` inputs, wrapping them in `prefers-color-scheme` media queries.
* **📱 Art Direction:** Supports swapping entirely different image files (e.g., `iconSrc` vs `src`) at a defined `breakpoint`.
* **⚡ Caching & Performance:** Implements an internal `markupCache` to instantly return generated HTML if called multiple times with the exact same parameters.
* **♿ Accessibility & SEO:** Enforces strict `alt` text validation and optionally injects JSON-LD `ImageObject` schema directly into the markup.

---

## 1. Setup & Usage

### Requirements
1.  Ensure `getImageResponsivePath` and `getImagePrimaryPath` are properly exported from `../config.js`.
2.  Ensure `VIEWPORT_BREAKPOINTS` and `VIEWPORT_BREAKPOINT_WIDTHS` are exported from `../shared.js`.

### Basic Example (Inside a Component)
```javascript
import { generatePictureMarkup } from '../generators/image-generator.js';

async function renderImage() {
  const markup = await generatePictureMarkup({
    src: 'hero-image.jpg',
    alt: 'A beautiful landscape',
    loading: 'eager',
    fetchPriority: 'high'
  });
  
  document.getElementById('container').innerHTML = markup;
}
```

### Advanced Example (Theme & Art Direction)
```javascript
import { generatePictureMarkup } from '../generators/image-generator.js';

async function renderLogo() {
  const markup = await generatePictureMarkup({
    lightSrc: 'logo-full-light.jpg',
    darkSrc: 'logo-full-dark.jpg',
    iconLightSrc: 'icon-light.jpg',
    iconDarkSrc: 'icon-dark.jpg',
    alt: 'Acme Corp',
    breakpoint: '768', // Switches to icon sources below 768px
    mobileWidth: '50vw',
    desktopWidth: '25vw'
  });
  
  document.getElementById('logo-container').innerHTML = markup;
}
```

---

## 2. Configuration Parameters

The `generatePictureMarkup` function accepts a single options object with the following properties:

### 2.1 Image Sources & Accessibility

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| **src** | `String` | `''` | The default, full-size image source. |
| **lightSrc** / **darkSrc** | `String` | `''` | Theme-specific full-size sources. |
| **iconSrc** | `String` | `''` | The default mobile/icon source (requires `breakpoint`). |
| **iconLightSrc** / **iconDarkSrc**| `String` | `''` | Theme-specific mobile/icon sources. |
| **alt** | `String` | `''` | Default alt text. |
| **lightAlt** / **darkAlt** | `String` | `''` | Theme-specific alt text. |
| **isDecorative** | `Boolean`| `false` | If `true`, forces `alt=""` and `role="presentation"`. |
| **includeSchema**| `Boolean`| `false` | If `true`, appends a `<script type="application/ld+json">` block. |

> **Note on Alts:** If no alt text is provided for *any* attribute, the generator automatically sets `isDecorative = true`. If an alt is required but missing, it returns a placeholder image.

### 2.2 Sizing & Breakpoints

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| **mobileWidth** | `String` | `'100vw'`| The CSS viewport width calculation for mobile sizes. |
| **tabletWidth** | `String` | `'100vw'`| The CSS viewport width calculation for tablet sizes. |
| **desktopWidth** | `String` | `'100vw'`| The CSS viewport width calculation for desktop sizes. |
| **breakpoint** | `String` | `''` | Pixel width at which the `src` switches to the `iconSrc`. |
| **noResponsive** | `Boolean`| `false` | If `true`, disables `srcset` format variants (SVGs do this automatically). |

### 2.3 Styling & Behavior

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| **customClasses**| `String` | `''` | CSS classes applied to the `<picture>` element. |
| **extraClasses** | `Array/Str`| `[]` | CSS classes applied specifically to the fallback `<img>` element. |
| **extraStyles** | `String` | `''` | Inline styles applied to the fallback `<img>` element. |
| **isBackground** | `Boolean`| `false` | If `true`, prevents `extraStyles` from being applied to the `<img>`. |
| **loading** | `String` | `'lazy'` | HTML `loading` attribute (`lazy` or `eager`). |
| **fetchPriority**| `String` | `''` | HTML `fetchpriority` attribute (`high`, `low`, `auto`). |
| **aspectRatio** | `String` | `''` | Maps to an `aspect-ratio-*` CSS class. Must be in `VALID_ASPECT_RATIOS`. |

---

## 3. Key Features & Behavior

### 🚦 Validation & SVG Handling
Before processing, the module checks if the provided sources end in valid extensions. If the source is an SVG (`.svg`), the generator automatically enables `noResponsive` mode. SVGs do not need multiple sizes or modern format wrappers, so they are rendered as simple `<source>` tags.

### 🧮 How `srcset` & `sizes` are Calculated
The true power of this generator is how it builds the `<source>` tags for modern formats (JXL, AVIF, WEBP). 
1.  **Format Iteration:** It loops through the `IMAGE_FORMATS` array.
2.  **Srcset Generation:** It maps over the `VIEWPORT_BREAKPOINT_WIDTHS` to generate a string pointing to pre-rendered resized images in the `IMAGE_RESPONSIVE_DIRECTORY_PATH`. 
    *(e.g., `/img/responsive/hero-640.webp 640w, /img/responsive/hero-1024.webp 1024w`)*
3.  **Sizes Generation:** It calculates the `sizes` attribute by parsing the `mobileWidth`, `tabletWidth`, and `desktopWidth` inputs and matching them against the system breakpoints.

### 🌓 Client-Side Hydration
The module includes standalone client-side code that runs on `DOMContentLoaded`. 
* **Theme Switching:** It listens to the `(prefers-color-scheme: dark)` media query. When the OS theme changes, it dynamically updates the `<img>.src` and `<img>.alt` to match the currently active `<source>` tag without requiring a page reload.
* **Lazy Loading:** It instantiates an `IntersectionObserver` to handle `loading="lazy"` images, ensuring they only fetch when near the viewport.

---

## 4. Troubleshooting

* **Images are displaying a `3000x2000` placeholder:**
    * Ensure your image paths are correct and have valid extensions (`.jpg`, `.png`, `.webp`, `.avif`, `.jxl`, `.svg`).
    * Ensure you have provided `alt` text for all non-decorative images.
* **Breakpoint isn't switching to icon:**
    * The `breakpoint` parameter must be a string containing an integer that matches one of the values in `VIEWPORT_BREAKPOINT_WIDTHS`. 
* **SVGs are generating JXL/AVIF sources:**
    * This shouldn't happen. The module detects `.svg` extensions and automatically forces `noResponsive = true`, bypassing the format iteration loop.
* **Debug logging isn't appearing:**
    * Append `?debug=true` to your URL to enable the internal logger and clear the `markupCache`.
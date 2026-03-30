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

# Custom Block (`<custom-block>`)

The `<custom-block>` is the foundational building block of the design system. It is a highly versatile Web Component capable of rendering complex cards, hero sections, media blocks, and text groups. It dynamically manages background media (images/videos), foreground content (headings, paragraphs, lists, buttons), and complex styling (gradients, overlays, blur effects, and alignments) purely through HTML attributes.

## Features

* **🎨 Advanced Styling Engine:** Natively supports CSS classes for backgrounds, gradients, borders, shadows, and `backdrop-filter` effects.
* **🖼️ Rich Media Support:** Handles both primary (foreground) and background images/videos, automatically leveraging the `image-generator` and `video-generator` modules.
* **🌗 Theme-Aware Media:** Supports distinct `light-src` and `dark-src` assets for all media types, seamlessly integrating with the user's OS color scheme preferences.
* **📝 Dynamic Content Reordering:** Provides a `content-order` attribute to control the flow of text, lists, and buttons without modifying the DOM structure.
* **🛡️ Built-in Validation & Sanitization:** Validates URLs, purges unsafe inline CSS (`icon-style`, `button-style`), and sanitizes classes to prevent XSS and layout breaks.
* **🐛 Visual Debugging:** Includes a built-in HUD (Heads Up Display) overlay to visually debug active attributes and computed layout classes when in debug mode.

---

## 1. Setup & Usage

### Requirements
1.  Import the `custom-block.js` component file into your bundle.
2.  Ensure `generatePictureMarkup` and `generateVideoMarkup` are available.
3.  Ensure `ALLOWED_ICON_STYLES`, `ALLOWED_BUTTON_STYLES`, `ALLOWED_LIST_STYLES`, `VALID_ALIGNMENTS`, `VALID_ALIGN_MAP`, and `BACKDROP_FILTER_MAP` are exported from `../shared.js`.
4.  Ensure `../config.js` provides `getConfig` and `getImagePrimaryPath`.

### Basic Example (Text Card)
```html
<custom-block 
    background-color="background-color-2"
    border="border-medium"
    border-radius="border-radius-large"
    shadow="shadow-medium"
    heading="Hello World"
    paragraph="This is a simple text card with a button."
    button-text="Read More"
    button-href="/about">
</custom-block>
```

### Advanced Example (Hero Section with Background Image & Lists)
```html
<custom-block 
    class="padding-large"
    img-background-src="/hero-bg.jpg"
    img-background-alt="Scenic landscape"
    background-overlay="background-overlay-black"
    backdrop-filter="backdrop-filter-blur-sm"
    inner-alignment="center-left"
    heading="Discover the Unknown"
    heading-tag="h1"
    sub-heading="Your journey starts here"
    ul-items="Adventure awaits, Find your path, Build memories"
    ul-icon="<i class='fa-solid fa-check'></i>"
    button-text="Start Exploring"
    button-class="button-primary">
</custom-block>
```

---

## 2. Configuration Attributes

The `<custom-block>` accepts over 100 attributes. They are grouped below by category.

### 2.1 Content & Typography

| Attribute Name | Description | Default |
| :--- | :--- | :--- |
| **heading** | Primary title text. | `''` |
| **heading-tag** | HTML tag for the heading (`h1`-`h6`). | `h2` |
| **sub-heading** | Secondary title text. | `''` |
| **sub-heading-tag** | HTML tag for the sub-heading (`h1`-`h6`). | `h3` |
| **paragraph** | Body text block. | `''` |
| **icon** | FontAwesome icon markup (e.g., `<i class="fa-solid fa-star"></i>`). | `''` |
| **content-order** | Comma-separated list defining render order. | `'paragraph,ul,ol'` |
| **text-alignment** | Alignment of text content (`left`, `center`, `right`). | `''` |

### 2.2 Lists (UL / OL)

| Attribute Name | Description | Default |
| :--- | :--- | :--- |
| **ul-items** / **ol-items** | Comma-separated list items. Wraps items with commas in parenthesis `(item 1, item 2)` to avoid splitting. | `''` |
| **ul-icon** / **ol-icon** | Custom FontAwesome icon for list bullets. | `''` |
| **ul-icon-position** / **ol-icon-position** | Icon placement (`left` or `right` of text). | `'left'` |
| **ul-style** / **ol-style** | Inline CSS for the list container (sanitized). | `''` |

### 2.3 Buttons

| Attribute Name | Description | Default |
| :--- | :--- | :--- |
| **button-text** | Text to display inside the button. | `''` |
| **button-href** | URL the button links to. If empty, renders a `<button>` tag instead of `<a>`. | `#` |
| **button-class** | CSS classes applied to the button. | `''` |
| **button-type** | HTML `type` attribute (`button`, `submit`, `reset`). | `button` |
| **button-icon** | FontAwesome icon to include in the button. | `''` |
| **button-icon-position** | Placement of the icon relative to text (`left`, `right`). | `''` |

### 2.4 Outer Block Styling

| Attribute Name | Description | Expected Values / Format |
| :--- | :--- | :--- |
| **class** | Standard HTML classes (mapped directly to the outer wrapper). | e.g., `padding-large` |
| **background-color** | Background color class. | e.g., `background-color-1` |
| **background-gradient** | Gradient overlay class. | e.g., `background-gradient-2` |
| **border** | Border thickness class. | `border-small`, `border-medium`, `border-large` |
| **border-radius** | Corner rounding class. | `border-radius-small`, `border-medium`, etc. |
| **shadow** | Drop shadow intensity class. | `shadow-light`, `shadow-medium`, `shadow-heavy` |
| **backdrop-filter** | Native CSS backdrop-filter effects. | e.g., `backdrop-filter-blur-md` |
| **background-overlay** | Solid color overlay applied over background media. | e.g., `background-overlay-black` |

### 2.5 Inner Wrapper Styling
*These attributes mirror the Outer Styling but prefix the attribute with `inner-` (e.g., `inner-background-color`, `inner-border`, `inner-shadow`). They target the container wrapping the text/content.*

| Attribute Name | Description | Expected Values |
| :--- | :--- | :--- |
| **inner-alignment** | Controls position of the inner content box relative to the outer block. | Maps to `VALID_ALIGNMENTS` (e.g., `center`, `bottom-right`) |

### 2.6 Background Media (Image)
*Note: Prefix with `img-primary-` to render an image alongside the content instead of behind it.*

| Attribute Name | Description | Default |
| :--- | :--- | :--- |
| **img-background-src** | URL of the background image. | `''` |
| **img-background-light-src** | URL specifically for light mode. | `''` |
| **img-background-dark-src** | URL specifically for dark mode. | `''` |
| **img-background-alt** | Required accessibility text. | `''` |
| **img-background-decorative** | If present, strips `alt` text and applies `role="presentation"`. | (Presence) |
| **img-background-position** | CSS `object-position` value. | `''` |

### 2.7 Background Media (Video)
*Note: Prefix with `video-primary-` to render a video alongside the content instead of behind it.*

| Attribute Name | Description | Default |
| :--- | :--- | :--- |
| **video-background-src** | URL of the background video. | `''` |
| **video-background-poster** | URL of the placeholder image shown before loading. | `''` |
| **video-background-autoplay**| Automatically begins playback. | (Presence) |
| **video-background-loop** | Restarts video upon completion. | (Presence) |

---

## 3. Key Features & Behavior

### 🎯 Strict Media Validation
The `<custom-block>` aggressively prevents broken layouts. 
* If you provide a `light-src`, you **must** provide a `dark-src`. 
* All media URLs undergo a `HEAD` request check before rendering. If the URL returns a 404 or fails CORS, the component aborts rendering the media and injects a fallback placeholder (`https://placehold.co/3000x2000`).
* Missing `alt` attributes on non-decorative images will trigger console errors.

### 📦 Caching Mechanism
The component hashes all its `criticalAttributes`. If the component receives a DOM update, but the critical attributes haven't changed, it will clone and inject the HTML from its `renderCacheMap` instead of re-running the expensive validation and markup generation logic.

### 🛠️ Visual Debugging Overlay
If `?debug=true` is present in the URL, the component appends a Heads Up Display (HUD) to the bottom of the block. This overlay prints out the currently active classes, inner alignments, and media source paths directly on the screen, making it incredibly easy to troubleshoot complex layouts without opening the browser inspector.

---

## 4. Troubleshooting

* **Block is rendering as empty / missing:**
    * Ensure you have provided valid content attributes (`heading`, `paragraph`, etc.) or valid media attributes. If the component detects it is empty, it will fall back to an empty render state.
* **Console Error: "Both img-background-light-src and img-background-dark-src must be present"**
    * The block enforces strict theme-pairing. If you specify an asset for light mode, you must specify its dark mode counterpart. Use `img-background-src` if you want a universal image.
* **Inner alignment isn't working:**
    * Ensure the value you are passing to `inner-alignment` exists in the `VALID_ALIGNMENTS` array exported from `shared.js`.
* **Inline CSS in `icon-style` or `button-style` is being removed:**
    * The component sanitizes inline styles against strict whitelists (`ALLOWED_ICON_STYLES`, `ALLOWED_BUTTON_STYLES`) to prevent XSS. Check your `shared.js` configuration if a specific CSS property is being stripped.
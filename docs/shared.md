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

# Shared Resources (`shared.js`)

The `shared.js` module is a central utility file that exports static constants, configuration arrays, and mapping objects. It acts as the "source of truth" for the design system's layout boundaries, alignment logic, and security sanitization. 

By keeping these values in a single file, all Web Components (`<custom-block>`, `<custom-slider>`, etc.) and generators (`image-generator.js`) remain perfectly synchronized without duplicating logic.

---

## 1. Responsive Breakpoints


The system defines six standardized viewport breakpoints. These are critical for the `image-generator` calculating `srcset` sizes and the `<custom-slider>` determining how many slides to show.

### `VIEWPORT_BREAKPOINTS`
An array of objects defining the names and maximum pixel widths for each target device class.

| Name | Max Width (px) | Description |
| :--- | :--- | :--- |
| **mobile** | `768` | Phones and small devices. |
| **tablet** | `1024` | Portrait tablets and large foldables. |
| **laptop** | `1366` | Small laptops and landscape tablets. |
| **desktop** | `1920` | Standard 1080p desktop monitors. |
| **large** | `2560` | 1440p / QHD displays. |
| **ultra** | `3840` | 4K / UHD displays. |

### `VIEWPORT_BREAKPOINT_WIDTHS`
A flattened array of just the `maxWidth` integers (e.g., `[768, 1024, 1366, ...]`). This is used heavily by the `image-generator` for rapid `srcset` math and iteration.

---

## 2. Layout & Alignment

To prevent invalid layout configurations and ensure CSS Grid works predictably, the system uses a strict mapping approach for alignments.

### `VALID_ALIGNMENTS`
A flat array of all accepted alignment strings. Components use this to validate user input before attempting to render.
* `center`
* `top`, `bottom`
* `top-left`, `top-center`, `top-right`
* `bottom-left`, `bottom-center`, `bottom-right`
* `center-left`, `center-right`

### `VALID_ALIGN_MAP`
A dictionary object that translates the semantic alignment strings into actual CSS utility classes (specifically targeting CSS Grid `place-content` properties).

```javascript
{
    'center': 'place-content-center',
    'top-right': 'place-content-top-right',
    // ... etc
}
```

---

## 3. Visual Effects

### `BACKDROP_FILTER_MAP`
Translates semantic class names into actual CSS `backdrop-filter` property strings utilizing CSS variables. This ensures components like `<custom-block>` can safely apply complex blur and grayscale effects to overlays.

| Class Name | CSS Output |
| :--- | :--- |
| `backdrop-filter-blur-small` | `blur(var(--blur-small))` |
| `backdrop-filter-blur-medium`| `blur(var(--blur-medium))` |
| `backdrop-filter-blur-large` | `blur(var(--blur-large))` |
| `backdrop-filter-grayscale-small` | `grayscale(var(--grayscale-small))` |
| `...` | `...` |

---

## 4. Security & Sanitization (Allowed Styles)

To prevent Cross-Site Scripting (XSS) and layout-breaking CSS injection, components that accept inline styles via attributes (like `button-style` or `icon-style` on `<custom-block>`) sanitize the input. They split the user's CSS string and only apply properties found in these specific allowlists.

### `ALLOWED_ICON_STYLES`
Restricts icon inline CSS to semantic, typography, and basic layout properties:
`color`, `font-size`, `margin` (and directional variants), `padding` (and directional variants), `display`, `text-align`, `vertical-align`, `line-height`, `width`, `height`.

### `ALLOWED_BUTTON_STYLES`
Allows basic aesthetic overrides for buttons, but prevents dangerous positioning overrides:
`color`, `background-color`, `border`, `border-radius`, `padding`, `margin`, `font-size`, `font-weight`, `text-align`, `display`, `width`, `height`.

### `ALLOWED_LIST_STYLES`
Permits styling for unordered (`<ul>`) and ordered (`<ol>`) lists. It includes basic sizing/spacing, plus properties necessary for building grid-based feature lists:
`color`, `background-color`, `border`, `border-radius`, `padding` (all), `margin` (all), `font-size`, `font-weight`, `text-align`, `display`, `width`, `height`, `list-style`, `list-style-position`, `list-style-type`, `grid-template-columns`, `justify-content`.
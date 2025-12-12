# Custom Block (<custom-block>)

The `<custom-block>` is a highly versatile, multi-purpose Web Component designed to render content sections. It supports **rich typography**, **lists**, **buttons**, and complex **media configurations** (images and videos) for both background and primary content areas.

It features built-in support for **light/dark mode media switching**, **responsive image sizing**, **lazy loading**, and granular **styling controls** (gradients, glassmorphism/backdrop-filters, and borders).

---

## 1. Attributes

Due to the component's versatility, attributes are grouped by function.

### Content & Typography

| Attribute Name | Description | Default | Expected Format |
|----------------|-------------|---------|-----------------|
| `heading` | Main title text. | `''` | Plain text |
| `heading-tag` | HTML tag for the heading. | `h2` | `h1`–`h6` |
| `sub-heading` | Subtitle text appearing above or near the heading. | `''` | Plain text |
| `sub-heading-tag`| HTML tag for the sub-heading. | `h3` | `h1`–`h6` |
| `paragraph` | Main body text. | `''` | Plain text |
| `icon` | Icon displayed near the text content. | `''` | FontAwesome class string (e.g., `<i class="fa-solid fa-star"></i>`) |
| `icon-size` | Size of the main icon. | `''` | CSS length (e.g., `2rem`) |
| `content-order` | Determines the render order of text elements. | `paragraph,ul,ol` | Comma-separated string |

### Button Controls

| Attribute Name | Description | Default | Expected Format |
|----------------|-------------|---------|-----------------|
| `button-text` | Text displayed on the button. | `''` | Plain text |
| `button-href` | URL the button links to. | `#` | URL |
| `button-type` | Type of button. | `button` | `button`, `submit`, `reset`, or `link` (implied if href exists) |
| `button-style` | Inline styles for the button (sanitized). | `''` | CSS string |
| `button-icon` | Icon displayed inside the button. | `''` | FontAwesome string |
| `button-icon-position`| Position of the icon relative to text. | `''` | `left`, `right` |
| `button-target` | Target attribute for links (e.g., `_blank`). | `''` | `_self`, `_blank`, etc. |

### List Controls (`<ul>` & `<ol>`)

| Attribute Name | Description | Default | Expected Format |
|----------------|-------------|---------|-----------------|
| `ul-items` | Content for Unordered List. Parsing handles comma separation. | `''` | String list (e.g., `Item 1, Item 2`) |
| `ol-items` | Content for Ordered List. | `''` | String list |
| `ul-icon` / `ol-icon` | Custom bullet icon for list items. | `''` | FontAwesome string |
| `ul-style` / `ol-style`| Custom CSS for the list container. | `''` | CSS string |

### Primary Media (Foreground)

These attributes control the main image or video displayed alongside content (e.g., in a split layout).

| Attribute Name | Description | Default | Notes |
|----------------|-------------|---------|-------|
| `img-primary-src` | Source for the primary image. | `''` | Required unless using video |
| `img-primary-light-src` | Light mode variant. | `''` | Must pair with `*-dark-src` |
| `img-primary-dark-src` | Dark mode variant. | `''` | Must pair with `*-light-src` |
| `img-primary-alt` | Alt text for accessibility. | `''` | **Required** unless `img-primary-decorative` is present |
| `img-primary-position` | Position of media relative to content. | `top` | `top`, `bottom`, `left`, `right` |
| `video-primary-src` | Source for primary video. | `''` | URL (mp4/webm) |
| `video-primary-autoplay`| Autoplays the video. | `false` | Boolean attribute |
| `img-primary-mobile-width` | CSS width for mobile. | `100vw` | e.g., `100%`, `50vw` |

### Background Media

These attributes control media rendered behind the content.

| Attribute Name | Description | Default | Notes |
|----------------|-------------|---------|-------|
| `img-background-src` | Source for background image. | `''` | |
| `video-background-src` | Source for background video. | `''` | |
| `background-overlay` | Applies an overlay class. | `''` | `background-overlay-N` |
| `backdrop-filter` | Applies glassmorphism effects. | `''` | Space-separated classes |
| `img-background-position`| CSS object-position. | `''` | `center`, `top-left`, `50% 50%` |

### Styling & Layout (Container)

| Attribute Name | Description | Values |
|----------------|-------------|--------|
| `text-alignment` | Aligns text content. | `left`, `center`, `right` |
| `inner-alignment` | Aligns the inner content box. | `top-left`, `center`, `bottom-right`, etc. |
| `background-color` | Sets background color class. | `background-color-N` |
| `border` | Adds border class. | `border-small`, `border-medium`, etc. |
| `shadow` | Adds shadow class. | `shadow-light`, `shadow-medium`, `shadow-heavy` |
| `effects` | Adds animation/effect classes. | Custom strings |

---

## 2. Key Features

### 🌓 Advanced Media Switching
The component intelligently handles media sources:
* **Theme Switching:** Supports distinct `*-light-src` and `*-dark-src` for both images and videos. The component internally generates `<picture>` tags or `<video>` logic to switch assets based on user system preference.
* **Media Priority:** Validates sources via `HEAD` requests before rendering. Falls back to `placehold.co` if validation fails (in non-debug mode).

### ⚡ Performance Optimization
* **Lazy Loading:** Defaults to `loading="lazy"` for images and videos unless overridden.
* **Fetch Priority:** Supports `fetchpriority="high"` for critical above-the-fold assets.
* **Responsive Widths:** Allows defining distinct widths for mobile, tablet, and desktop (`img-primary-mobile-width`, etc.) to optimize the `sizes` attribute.

### 🧩 Flexible Layouts
* **Content Reordering:** The `content-order` attribute allows you to change the visual order of the paragraph, unordered list, and ordered list without changing the HTML structure.
* **Inner Container:** Supports an "Inner" concept (`inner-class`, `inner-style`, `inner-background-color`) allowing for "card-inside-a-section" designs.

### 🛡️ Security & Validation
* **Sanitization:** styles passed via attributes (like `icon-style` or `button-style`) are sanitized against a whitelist of allowed CSS properties to prevent XSS/injection.
* **Validation:** Source URLs are validated via fetch before rendering.

---

## 3. Styling Reference (Internals)

The component shadow DOM (or Light DOM content replacement) structure varies based on content, but generally follows:

1.  **Wrapper (`div.block`)**: The main container. Applies `background-color`, `border`, `shadow`, and background media.
2.  **Media Elements**:
    * Background media is absolutely positioned behind content.
    * Primary media is positioned via flex/grid logic based on `img-primary-position`.
3.  **Inner Container (`div`)**: Wraps text/button content. Receives `inner-class` and `inner-padding`.
    * **Group (`div[role="group"]`)**: Holds the Heading, Subheading, Text, Lists, and Buttons.

### ⚠️ Important Styling Notes
* **Backdrop Filters:** To use `backdrop-filter`, ensure the background allows for transparency. The component maps classes like `blur-small` to specific CSS `backdrop-filter` values internally.
* **Padding:** Padding should generally be applied via utility classes in `customClasses` or `inner-class`, not inline styles, to ensure consistency.

---

## 4. Example Usage

### Simple Card with Image
```html
<custom-block
  heading="Feature Highlights"
  paragraph="We offer state of the art web components."
  img-primary-src="/assets/feature.jpg"
  img-primary-alt="Feature illustration"
  img-primary-position="top"
  button-text="Learn More"
  button-href="/features"
  border="border-small"
  shadow="shadow-medium">
</custom-block>
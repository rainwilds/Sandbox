# CustomImg

## Summary

The `CustomImg` is a custom web component that extends the native HTML `<img>` element. It provides theme-aware image loading by dynamically switching sources based on the user's system color scheme (`prefers-color-scheme: light` or `dark`). Key features include:
- Lazy loading with `IntersectionObserver` to trigger initialization only when the image is near the viewport.
- Generation of `<picture>` markup for responsive images using media queries for mobile, tablet, and desktop widths.
- Accessibility enhancements: warns on missing `alt` if not `decorative`, sets `role="img"` if needed, and supports decorative images.
- Theme-specific sources (`light-src`, `dark-src`) with fallback to a placeholder image on errors.
- Optional Schema.org markup (via `include-schema`) for structured data, wrapping in `<figure>` with `itemscope` and `itemtype="https://schema.org/ImageObject"`.
- Replacement of the original `<img>` element with a `<picture>` element in the DOM.
- Error handling for image loading failures and timeouts waiting for dependencies.

The component requires at least one of `light-src` or `dark-src` and supports file extensions implied by the sources (e.g., `.jpg`, `.png`). It relies on `picture-generator.js` for markup generation and removes the original element after processing.

## Dependencies

The `CustomImg` component depends on `picture-generator.js`, which must be loaded before the component is initialized. This script provides the `generatePictureMarkup` function, used to generate responsive and theme-aware `<picture>` markup. The component polls for `generatePictureMarkup` availability with a 3-second timeout and logs an error if not found.

## Standard Attributes

These are native HTML `<img>` attributes supported and processed by the component. They are transferred to the generated `<img>` element inside the `<picture>`.

| Attribute       | Description                                                                 | Type     | Required | Default Value |
|-----------------|-----------------------------------------------------------------------------|----------|----------|---------------|
| `alt`           | Alternative text for accessibility; warns if missing and not `decorative`.  | String   | No       | '' |
| `class`         | CSS classes for styling the image element.                                  | String   | No       | '' |
| `fetchpriority` | Priority hint for fetching the image (`high`, `low`, or `auto`).            | String   | No       | None |
| `loading`       | Controls loading behavior (`lazy` or `eager`).                              | String   | No       | None (browser default) |

## Custom Attributes

These are non-standard attributes specific to the component, used for theme-specific sources, responsiveness, and schema. They are processed and not transferred to the final DOM (the original element is replaced).

| Attribute        | Description                                                                 | Type     | Required | Default Value |
|------------------|-----------------------------------------------------------------------------|----------|----------|---------------|
| `light-src`      | Image source URL for light theme. Required if `dark-src` is not provided.   | String   | Conditional | None |
| `dark-src`       | Image source URL for dark theme. Required if `light-src` is not provided.   | String   | Conditional | None |
| `decorative`     | Indicates the image is decorative (no `alt` warning; sets empty `alt`).     | Boolean  | No       | False |
| `mobile-width`   | Width descriptor for mobile devices (used in `sizes` attribute).            | String   | No       | '100vw' |
| `tablet-width`   | Width descriptor for tablet devices (used in `sizes` attribute).            | String   | No       | '100vw' |
| `desktop-width`  | Width descriptor for desktop devices (used in `sizes` attribute).           | String   | No       | '100vw' |
| `include-schema` | Enables Schema.org markup, wrapping in `<figure>` with metadata.            | Boolean  | No       | False |
| `caption`        | Caption text for the image (used in `<figcaption>` if `include-schema`).    | String   | No       | None |

## Example Custom-Img Tags

Here are example usages of the `<img is="custom-img">` tag. These demonstrate different combinations of attributes.

### Basic Example (Light Theme Only, with Lazy Loading)
```html
<img
    is="custom-img"
    light-src="./img/image-light.jpg"
    alt="Light theme image"
    loading="lazy"
    class="aspect-ratio-16-9"
>
```

### Example with Both Themes, Responsiveness, and Schema
```html
<img
    is="custom-img"
    light-src="./img/image-light.png"
    dark-src="./img/image-dark.png"
    alt="Theme-aware image"
    mobile-width="100vw"
    tablet-width="50vw"
    desktop-width="33vw"
    include-schema
    caption="A responsive, theme-aware image"
    loading="lazy"
    fetchpriority="high"
    class="padding-medium"
>
```

### Example with Dark Theme Only and Decorative Flag
```html
<img
    is="custom-img"
    dark-src="./img/image-dark.jpg"
    decorative
    loading="lazy"
    class="image-container"
>
```

### Minimal Example (No Responsiveness, With Fallback Poster)
```html
<img
    is="custom-img"
    light-src="./img/image1.jpg"
    alt="Simple image"
    class="aspect-ratio-4-3"
>
```
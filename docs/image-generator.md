# Image Generator Documentation

The `image-generator.js` module provides utility functions for generating responsive and accessible image markup using the HTML `<picture>` element. It supports multiple image formats, responsive breakpoints, light/dark mode switching, and schema markup for SEO. The module exports two main functions, `generatePictureMarkup` and `generateLogoMarkup`, along with a `BACKDROP_FILTER_MAP` constant for applying backdrop filter styles. Below is a detailed explanation of the parameters for each function, grouped by function and presented in alphabetical order.

## `generatePictureMarkup` Parameters

The `generatePictureMarkup` function generates HTML markup for a responsive `<picture>` element with support for multiple image formats, light/dark mode sources, and responsive sizes.

| Parameter Name | Description | Default Value | Expected Format |
|----------------|-------------|---------------|-----------------|
| alt | Provides the alt text for the default image for accessibility. | `''` (empty) | Plain text (e.g., `Background image`) |
| aspectRatio | Sets the aspect ratio for the image. | `''` (empty) | One of: `16/9`, `9/16`, `3/2`, `2/3`, `1/1`, `21/9` |
| customClasses | Adds custom CSS classes to the `<picture>` element. | `''` (empty) | Space-separated class names (e.g., `custom-class another-class`) |
| darkAlt | Provides the alt text for the dark mode image. | `''` (empty) | Plain text (e.g., `Dark mode background`) |
| darkSrc | Specifies the source URL for the dark mode image. | `''` (empty) | Valid image URL (e.g., `image-dark.jpg`) |
| desktopWidth | Sets the width of the image on desktop screens (min-width: 1024px). | `'100vw'` | CSS width value (e.g., `1200px`, `50vw`) |
| extraClasses | Additional CSS classes to append to the `<picture>` element. | `[]` (empty array) | Array of class names (e.g., `['extra-class', 'style-class']`) |
| fetchPriority | Defines the fetch priority for the image. | `''` (empty) | One of: `high`, `low`, `auto` |
| includeSchema | Includes schema.org `ImageObject` markup when true. | `false` | Boolean |
| isDecorative | Marks the image as decorative, omitting alt text for accessibility. | `false` | Boolean |
| lightAlt | Provides the alt text for the light mode image. | `''` (empty) | Plain text (e.g., `Light mode background`) |
| lightSrc | Specifies the source URL for the light mode image. | `''` (empty) | Valid image URL (e.g., `image-light.jpg`) |
| loading | Sets the loading strategy for the image. | `'lazy'` | One of: `lazy`, `eager` |
| mobileWidth | Sets the width of the image on mobile screens (max-width: 768px). | `'100vw'` | CSS width value (e.g., `600px`, `100vw`) |
| noResponsive | Disables responsive sources when true, using only provided sources. | `false` | Boolean |
| src | Specifies the default source URL for the image. | None (required) | Valid image URL (e.g., `image.jpg`) |
| tabletWidth | Sets the width of the image on tablet screens (min-width: 768px, max-width: 1023px). | `'100vw'` | CSS width value (e.g., `800px`, `100vw`) |

### Notes for `generatePictureMarkup`
- The `src` parameter must be a valid image URL with a supported extension (`.jpg`, `.jpeg`, `.png`, `.webp`, `.avif`, `.jxl`, `.svg`).
- Non-decorative images require an `alt` attribute or both `lightAlt` and `darkAlt` if `lightSrc` and `darkSrc` are provided; otherwise, an error is logged, and an empty string is returned.
- Responsive sources are generated for multiple formats (`jxl`, `avif`, `webp`, `jpeg`) and widths (`768`, `1024`, `1366`, `1920`, `2560`) unless `noResponsive` is true.
- The `sizes` attribute is computed based on `mobileWidth`, `tabletWidth`, and `desktopWidth`, with breakpoints defined in `SIZES_BREAKPOINTS`.
- Invalid `aspectRatio` values are ignored, and supported ratios add a class like `aspect-ratio-16-9`.
- A fallback image (`https://placehold.co/3000x2000`) is used if the image fails to load, with a fallback alt text for non-decorative images.
- The `animate animate-fade-in` class is added to the `<picture>` element for animation.
- Schema markup (`ImageObject`) is included if `includeSchema` is true, with a `<figcaption>` if alt text is provided.

## `generateLogoMarkup` Parameters

The `generateLogoMarkup` function generates HTML markup for a responsive `<picture>` element specifically for logos, with support for mobile, tablet, and desktop sources, as well as light/dark mode switching.

| Parameter Name | Description | Default Value | Expected Format |
|----------------|-------------|---------------|-----------------|
| alt | Provides the alt text for the logo for accessibility. | `''` (empty) | Plain text (e.g., `Company logo`) |
| customClasses | Adds custom CSS classes to the `<picture>` element. | `''` (empty) | Space-separated class names (e.g., `logo-class custom-class`) |
| darkSrc | Specifies the source URL for the dark mode logo (desktop). | `''` (empty) | Valid image URL (e.g., `logo-dark.jpg`) |
| desktopSrc | Specifies the source URL for the desktop logo (min-width: 1024px). | `''` (empty) | Valid image URL (e.g., `logo-desktop.jpg`) |
| extraClasses | Additional CSS classes to append to the `<picture>` element. | `[]` (empty array) | Array of class names (e.g., `['extra-class', 'style-class']`) |
| fetchPriority | Defines the fetch priority for the logo image. | `'high'` | One of: `high`, `low`, `auto` |
| isDecorative | Marks the logo as decorative, omitting alt text for accessibility. | `false` | Boolean |
| lightSrc | Specifies the source URL for the light mode logo (desktop). | `''` (empty) | Valid image URL (e.g., `logo-light.jpg`) |
| loading | Sets the loading strategy for the logo image. | `'eager'` | One of: `lazy`, `eager` |
| mobileDarkSrc | Specifies the source URL for the dark mode logo on mobile screens (max-width: 767px). | `''` (empty) | Valid image URL (e.g., `logo-mobile-dark.jpg`) |
| mobileLightSrc | Specifies the source URL for the light mode logo on mobile screens (max-width: 767px). | `''` (empty) | Valid image URL (e.g., `logo-mobile-light.jpg`) |
| mobileSrc | Specifies the source URL for the mobile logo (max-width: 767px). | `''` (empty) | Valid image URL (e.g., `logo-mobile.jpg`) |
| src | Specifies the default source URL for the logo. | None (required if no other sources) | Valid image URL (e.g., `logo.jpg`) |
| tabletDarkSrc | Specifies the source URL for the dark mode logo on tablet screens (min-width: 768px, max-width: 1023px). | `''` (empty) | Valid image URL (e.g., `logo-tablet-dark.jpg`) |
| tabletLightSrc | Specifies the source URL for the light mode logo on tablet screens (min-width: 768px, max-width: 1023px). | `''` (empty) | Valid image URL (e.g., `logo-tablet-light.jpg`) |
| tabletSrc | Specifies the source URL for the tablet logo (min-width: 768px, max-width: 1023px). | `''` (empty) | Valid image URL (e.g., `logo-tablet.jpg`) |

### Notes for `generateLogoMarkup`
- At least one valid source (`src`, `mobileSrc`, `tabletSrc`, `desktopSrc`) must be provided with a supported extension (`.jpg`, `.jpeg`, `.png`, `.webp`, `.avif`, `.jxl`, `.svg`).
- Non-decorative logos require an `alt` attribute; otherwise, an error is logged, and an empty string is returned.
- Light and dark mode sources (`lightSrc`/`darkSrc`, `mobileLightSrc`/`mobileDarkSrc`, `tabletLightSrc`/`tabletDarkSrc`) must be provided as pairs; if only one is specified, an error is logged, and an empty string is returned.
- The `<picture>` element includes `<source>` tags for mobile (max-width: 767px), tablet (min-width: 768px, max-width: 1023px), and desktop (min-width: 1024px) breakpoints, with light/dark mode support.
- The fallback `<img>` uses `desktopSrc`, `tabletSrc`, `mobileSrc`, or `src` in that order, with a placeholder (`https://placehold.co/300x300`) if loading fails.
- The `animate animate-fade-in` class is added to the `<picture>` element for animation.
- Defaults to `loading="eager"` and `fetchpriority="high"` to prioritize logo loading.

## `BACKDROP_FILTER_MAP` Constant

The `BACKDROP_FILTER_MAP` constant defines a mapping of CSS class names to backdrop filter styles for use in other components.

| Key | Value |
|-----|-------|
| `backdrop-filter-blur-small` | `blur(var(--blur-small))` |
| `backdrop-filter-blur-medium` | `blur(var(--blur-medium))` |
| `backdrop-filter-blur-large` | `blur(var(--blur-large))` |
| `backdrop-filter-grayscale-small` | `grayscale(var(--grayscale-small))` |
| `backdrop-filter-grayscale-medium` | `grayscale(var(--grayscale-medium))` |
| `backdrop-filter-grayscale-large` | `grayscale(var(--grayscale-large))` |

### Notes for `BACKDROP_FILTER_MAP`
- Used by components like `<custom-nav>` to apply backdrop filter styles via inline CSS.
- Assumes CSS variables (`--blur-small`, `--blur-medium`, etc.) are defined in the project's stylesheet.

## General Notes
- Both functions validate image sources and log errors for invalid URLs or missing alt text for non-decorative images.
- Responsive sources in `generatePictureMarkup` use a base path (`./img/responsive/`) and generate `srcset` for multiple widths and formats.
- Fallback images ensure graceful degradation if primary sources fail to load.
- The module is designed for use in Web Components like `<custom-logo>` and `<custom-block>` to handle image rendering consistently.
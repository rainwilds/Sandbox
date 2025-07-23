# `<bh-img>` Web Component

The `<bh-img>` component renders responsive images with support for themes, accessibility, and SEO optimization.

## Attribute Reference

| Attribute          | Description                                                                 | Usage Instructions                                                                 | Default Value |
|--------------------|-----------------------------------------------------------------------------|------------------------------------------------------------------------------------|---------------|
| `src`             | Primary image source URL (required).                                        | Specify the main image file using a relative or absolute URL. Ensure the image is optimized for web (e.g., compressed JPG, PNG, or WebP). This acts as a fallback if `light-src` or `dark-src` are unavailable. Use descriptive filenames (e.g., `business-service.jpg`) for SEO. Example: `src="./img/primary/image.jpg"`. Test across devices to verify loading. | None (required) |
| `light-src`       | Image source URL for light theme.                                           | Provide a light-themed image variant for users with `prefers-color-scheme: light`. Use the same base filename as `src` for responsive variants (e.g., `image-light.jpg`). Example: `light-src="./img/primary/image-light.jpg"`. Test theme switching in browser dev tools. Omit if theme support isn't needed. | None |
| `dark-src`        | Image source URL for dark theme.                                            | Specify a dark-themed image for `prefers-color-scheme: dark`. Ensure consistency with `src` naming (e.g., `image-dark.jpg`). Example: `dark-src="./img/primary/image-dark.jpg"`. Combine with `light-src` for full theme support. Test for correct switching. | None |
| `alt`             | Alternative text for accessibility.                                         | Provide a concise, descriptive text for meaningful images to support screen readers and SEO. Use empty string (`""`) for decorative images or set `decorative`. Example: `alt="Business service in Location"`. Keep under 125 characters and include keywords. Test with screen readers. | Empty string |
| `decorative`      | Boolean flag marking the image as decorative (no meaningful content).       | Add without a value to indicate a non-essential image (e.g., backgrounds). Sets `alt=""` and `aria-hidden="true"`. Example: `decorative`. Use only for images that don’t convey information. Test by disabling images to ensure no content loss. | False |
| `aspect-ratio`    | Aspect ratio for the image container.                                       | Choose from `16/9`, `9/16`, `3/2`, `2/3`, `1/1`, `21/9` to set proportions via a CSS class (e.g., `aspect-ratio-16-9`). Example: `aspect-ratio="16/9"`. Prevents layout shifts; use with `object-fit`. Test across breakpoints for consistency. | None |
| `mobile-width`    | Width for mobile breakpoints (≤768px).                                      | Set width in `vw` or `px` for small screens, affecting `sizes`. Example: `mobile-width="100vw"`. Optimize for mobile performance; test with device emulation. | `100vw` |
| `tablet-width`    | Width for tablet breakpoints (≤1024px).                                     | Set width in `vw` or `px` for medium screens. Example: `tablet-width="80vw"`. Test transitions between breakpoints. | `100vw` |
| `desktop-width`   | Width for desktop breakpoints (>1024px).                                    | Set width in `vw` or `px` for large screens. Example: `desktop-width="80vw"`. Test on high-resolution displays. | `100vw` |
| `class`           | Custom CSS classes to apply to the `<img>`.                                 | Add space-separated classes for styling (e.g., `border-radius-medium`). Example: `class="border-radius-medium"`. Define in your stylesheet; test for conflicts with generated classes. | None |
| `loading`         | Image loading behavior.                                                     | Use `lazy` for off-screen images or `eager` for critical ones. Example: `loading="lazy"`. Improves performance; test with Lighthouse. | Browser default (`eager`) |
| `fetch-priority`  | Resource fetch priority.                                                    | Set to `high`, `low`, or `auto` for loading priority. Example: `fetch-priority="high"`. Use `high` for hero images; test in throttled networks. | Browser default (`auto`) |
| `fallback-src`    | Fallback image URL if primary source fails.                                 | Provide a URL for error handling. Example: `fallback-src="./img/placeholder.jpg"`. Test by breaking `src`. | `https://placehold.co/3000x2000` |
| `object-fit`      | CSS `object-fit` property for image scaling.                                | Use `contain`, `cover`, or `fill` to control scaling. Adds class like `object-fit-cover`. Example: `object-fit="cover"`. Test with `aspect-ratio`. | Browser default (`fill`) |
| `object-position` | CSS `object-position` property for image alignment.                         | Set alignment (e.g., `top`, `50% 50%`). Example: `object-position="top"`. Test with `object-fit="cover"`. | Browser default (`50% 50%`) |
| `include-schema`  | Boolean flag to add schema.org `ImageObject` markup.                        | Add to wrap in `<figure>` with structured data for SEO. Example: `include-schema`. Test with Google’s Structured Data Tool. | False |
| `caption`         | Caption text for schema.org `ImageObject`.                                  | Set caption for `<figcaption>` when `include-schema` is used. Example: `caption="Business service"`. Keep keyword-rich. | None |
| `schema-url`      | Canonical URL for schema.org `ImageObject`.                                 | Set absolute URL for `<meta itemprop="url">`. Example: `schema-url="https://example.com/image.jpg"`. | Resolved `src` |
| `schema-description` | Description for schema.org `ImageObject`.                             | Set description for `<meta itemprop="description">`. Example: `schema-description="Photo description"`. | `alt` or empty |

## Example
```html
<bh-img
    src="./img/primary/image.jpg"
    alt="Business service in Location"
    aspect-ratio="16/9"
    mobile-width="100vw"
    tablet-width="80vw"
    desktop-width="80vw"
    object-fit="cover"
    loading="lazy"
    include-schema
    caption="Business service in Location"
>
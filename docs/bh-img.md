# `<bh-img>` Web Component

The `<bh-img>` is a custom web component designed for rendering responsive, theme-aware images with built-in support for accessibility, performance optimization, and SEO enhancements. It generates a `<picture>` element with responsive sources (`srcset`, `sizes`), modern formats (`avif`, `webp`, `jpeg`), and optional schema.org markup for structured data. This component is ideal for modern web frameworks, ensuring images load efficiently across devices while maintaining high accessibility standards.

## Installation

To use `<bh-img>`, include the necessary JavaScript and CSS files in your HTML:

```html
<script src="image-utils.js"></script>
<script src="components.js"></script>
<link rel="stylesheet" href="styles.css">
```

Ensure `image-utils.js` is loaded before `components.js` for proper functionality.

## Image File Requirements

Store primary images (`src`, `light-src`, `dark-src`, `fallback-src`) in `./img/primary/` (e.g., `business-service-3840.jpg`). Primary images may include a `-XXXX` suffix (e.g., `-3840`) to indicate their resolution. Store responsive variants in `./img/responsive/` with names like `business-service-[width].[format]` (e.g., `business-service-1024.avif`), where the base filename excludes the `-XXXX` suffix, for widths `[768, 980, 1024, 1366, 1920, 2560, 3840]` and formats `avif`, `webp`, `jpeg`. Ensure all variants exist to avoid fallback to suboptimal sizes.

## Attribute Reference

| Attribute             | Description                                                                      | Usage Instructions                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     | Default Value                 |
|----------------------|----------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------------------------|
| src                  | Primary image source URL (required).                                             | This attribute is mandatory and defines the main image file to be loaded and displayed by the component. Always provide a valid relative or absolute URL pointing to an image resource, such as a JPG, PNG, or other supported format, which may include a `-XXXX` suffix (e.g., `-3840`). For best results, ensure the image is optimized for web use (e.g., compressed without losing quality) to improve loading times and SEO. If using theme-specific sources like `light-src` or `dark-src`, the `src` acts as a fallback for browsers that don't support `prefers-color-scheme`. Combine with `fallback-src` for error handling. Example: `src="./img/primary/image-3840.jpg"`. Avoid using data URIs or base64-encoded images here, as they can bloat HTML and reduce performance; instead, reference external files. Test across devices to confirm the image loads correctly, and consider adding a descriptive filename (e.g., `business-service-3840.jpg`) for better SEO crawlability. If `src` is missing, the component will log an error and fail to render, so always include it in your markup. | None (required)               |
| light-src            | Image source URL for light theme (optional).                                     | Use this attribute to specify an alternative image optimized for light mode themes, which the component will automatically switch to based on the user's system preference via the `(prefers-color-scheme: light)` media query. This is particularly useful for sites with dark/light mode toggles to ensure visual consistency, such as using brighter colors or higher contrast in light mode. The `light-src` should point to a file with the same base filename structure as `src`, optionally with a `-XXXX` suffix (e.g., if `src` is `image-3840.jpg`, `light-src` could be `image-light-3840.jpg`). If omitted, the component falls back to `src`. Pair with `dark-src` for full theme support. Example: `light-src="./img/primary/image-light-3840.jpg"`. Best practice: Ensure the light version is perceptually similar but adjusted for theme (e.g., invert colors or adjust brightness). Test in both light and dark modes using browser dev tools to simulate preferences. Avoid using this for non-theme-related variations, as it could confuse users; reserve it for genuine theme adaptations. For performance, ensure all theme images are pre-generated in responsive sizes matching the `WIDTHS` array in the utils. | None                          |
| dark-src             | Image source URL for dark theme (optional).                                      | Similar to `light-src`, this attribute allows you to define an image variant tailored for dark mode, automatically selected via the `(prefers-color-scheme: dark)` media query to provide better visibility in low-light environments, such as reducing glare or using darker tones. It's ideal for maintaining accessibility and aesthetic appeal across user preferences. The file should follow the same naming convention as `src`, optionally with a `-XXXX` suffix (e.g., `image-dark-3840.jpg`). If not provided, `src` is used as fallback. Always use in conjunction with `light-src` for balanced theme support. Example: `dark-src="./img/primary/image-dark-3840.jpg"`. To optimize, create dark variants with tools like image editors to adjust contrast, shadows, or color palettes. Verify switching behavior by toggling system themes or using browser emulation. Do not overuse for minor changes; significant visual differences justify its use. Combine with `object-fit="cover"` to ensure proper scaling in themes. For sites without theme support, omit this to simplify markup. | None                          |
| alt                  | Alternative text for accessibility.                                              | This attribute supplies text that describes the image's content or purpose, which is crucial for screen readers, SEO, and cases where the image fails to load. For meaningful images (e.g., product photos or charts), use concise, keyword-rich descriptions that convey the same information as the image. Use empty string (`""`) for decorative images or the `decorative` attribute to automate it. The component warns in the console if `alt` is missing and `decorative` is not set, promoting WCAG compliance. Example: `alt="Business service in Location"`. Best practices: Keep under 125 characters, include relevant keywords for SEO (e.g., brand names, locations), and avoid redundant phrases like "image of" unless necessary. Test with screen readers like VoiceOver or NVDA to ensure the description reads naturally. If using schema.org via `include-schema`, align `alt` with `schema-description` for consistency, as `schema-description` defaults to `alt` for non-decorative images. Never use `alt` for decorative text or styling; that's what CSS is for. In error cases (e.g., fallback-src loads), the component updates `alt` to a placeholder if not decorative. | Empty string                  |
| decorative           | Boolean flag marking the image as decorative (no meaningful content).           | Add this boolean attribute (no value needed) to indicate the image is purely aesthetic, such as a background pattern or ornament, and does not contribute essential information to the page. When present, the component automatically sets `alt=""` and adds `aria-hidden="true"` to the generated `<img>`, instructing screen readers to ignore it and improving accessibility by reducing clutter. This aligns with WCAG guidelines for non-essential visuals. Example: `decorative`. Usage tip: Only use for images that can be removed without affecting understanding (e.g., dividers, icons without labels). Do not use for content images like logos or charts, as it hides them from assistive technologies. Combine with `object-fit="contain"` for better decorative scaling. If `decorative` is used with `alt`, the `alt` is overridden to empty. Test by disabling images in the browser to confirm no critical info is lost. For SEO, decorative images don't need descriptive `alt`, but ensure surrounding content provides context. Omit this for meaningful images to enforce `alt` warnings. | False                         |
| aspect-ratio         | Aspect ratio for the image container.                                           | Specify a predefined ratio to maintain consistent proportions, preventing layout shifts and improving performance (e.g., CLS metric for SEO). Valid values are '16/9', '9/16', '3/2', '2/3', '1/1', '21/9'; the component adds a CSS class like `aspect-ratio-16-9` to the `<img>`, applying the ratio via styles. Invalid values are silently ignored, so always check the list. Example: `aspect-ratio="16/9"`. Ideal for responsive designs; use with `object-fit="cover"` to crop images without distortion. For custom ratios not in the list, apply via external CSS instead. Test across breakpoints (mobile, tablet, desktop) to ensure the ratio holds with varying widths. This attribute helps with placeholder sizing before image load, reducing reflow. Combine with `mobile-width` etc., for fluid layouts. For ultrawide content, '21/9' is great for cinematic images. Update the CSS file if adding more ratios manually. | None                          |
| mobile-width         | Width for mobile breakpoints (≤768px).                                          | Define the image width for small screens (up to 768px), influencing the `sizes` attribute in `<source>` for responsive loading. Accepts `vw` (viewport width, e.g., `100vw` for full screen) or `px` (fixed, e.g., `300px`); the component parses and clamps values between 0.1-2.0 for safety. Example: `mobile-width="100vw"`. Use to optimize for mobile performance, e.g., smaller widths reduce file size downloads. Pair with `tablet-width` and `desktop-width` for breakpoint-specific sizing. Best practice: Use `vw` for fluid designs; test with browser resizing to verify `srcset` selection. If omitted, defaults to full viewport, which is safe but may load larger images than needed. For SEO, this helps with mobile-first indexing by serving appropriately sized images. Avoid extreme values to prevent distortion; combine with `aspect-ratio` for consistent proportions. | `100vw`                       |
| tablet-width         | Width for tablet breakpoints (≤1024px).                                         | Set the image width for medium screens (up to 1024px), contributing to the `sizes` attribute for efficient resource selection. Supports `vw` or `px` units, with parsing and clamping to reasonable ranges. Example: `tablet-width="80vw"`. This allows finer control in tablet views, e.g., narrower images in portrait mode. Always test with device emulation to ensure smooth transitions from mobile to desktop. Use in conjunction with `mobile-width` and `desktop-width` for progressive enhancement. If not specified, falls back to full viewport, which might overload bandwidth on tablets. For performance-critical sites, experiment with values like `50vw` for side-by-side layouts. This attribute enhances responsiveness, positively impacting SEO through better Core Web Vitals scores. Avoid mixing units inconsistently; stick to `vw` for relative sizing. | `100vw`                       |
| desktop-width        | Width for desktop breakpoints (>1024px).                                        | Specify the image width for large screens (above 1024px), affecting the `sizes` fallback for high-resolution displays. Accepts `vw` or `px`, parsed and clamped for validity. Example: `desktop-width="80vw"`. Ideal for capping widths in wide layouts to prevent oversized downloads. Test on large monitors to confirm optimal loading from `srcset`. Combine with other widths for a complete responsive strategy. Omitting it uses full viewport, suitable for full-width heroes but not for constrained designs. For SEO, this optimizes for desktop users, balancing quality and speed. Use with `aspect-ratio` to maintain shape across sizes. Prefer `vw` for scalability; fixed `px` for precise control in fixed-width containers. | `100vw`                       |
| class                | Custom CSS classes to apply to the `<img>`.                                      | Append additional CSS classes to the generated `<img>` element for custom styling, such as borders, shadows, or animations. Classes are space-separated and merged with any auto-generated classes (e.g., from `aspect-ratio`). Example: `class="border-radius-medium shadow-large"`. This allows overriding or extending the component's default styles without inline CSS, promoting separation of concerns. Define these classes in your global stylesheet (e.g., `styles.css`). Test for conflicts with generated classes like `aspect-ratio-16-9`. For themes, use classes like `dark-mode-invert`. Avoid using this for core functionality like `object-fit`, as dedicated attributes exist. If no classes are needed, omit for cleaner markup. This attribute enhances flexibility for design systems. | None                          |
| loading              | Image loading behavior.                                                         | Control how the image loads: `lazy` defers until near viewport (improves performance), `eager` loads immediately (for critical images). Omit for browser default. Example: `loading="lazy"`. Use `lazy` for below-the-fold images to boost page speed and SEO (e.g., Core Web Vitals). Test with Lighthouse to measure impact. For hero images, use `eager` with `fetch-priority="high"`. Invalid values are ignored by browsers, but stick to supported ones. Combine with `fallback-src` for robust error handling during load. This attribute is key for modern web performance; always consider it for non-critical content. | Browser default (`eager`)     |
| fetch-priority       | Resource fetch priority.                                                        | Prioritize image loading: `high` for critical resources, `low` for non-essential, `auto` for browser decision. Omit for default. Example: `fetch-priority="high"`. Warns on invalid values. Use `high` for above-the-fold images to speed up perceived load time. Test in network-throttled conditions to see effects. For background images, use `low`. This optimizes resource competition, aiding SEO via faster pages. Avoid overusing `high` to prevent delaying other assets. Pair with `loading="eager"` for urgent images. | Browser default (`auto`)       |
| fallback-src         | Fallback image URL if primary source fails.                                      | Provide an alternative URL loaded on `onerror` (e.g., network failure), optionally with a `-XXXX` suffix. Example: `fallback-src="./img/primary/placeholder-3840.jpg"`. Use branded or generic placeholders to maintain UX. Updates `alt` to "Placeholder image" if not decorative. Test by simulating errors (e.g., invalid `src`). For SEO, ensure fallback is relevant to avoid misleading crawlers. Omit for default placeholder. This enhances resilience; consider low-res versions for speed. | `https://placehold.co/3000x2000` |
| object-fit           | CSS `object-fit` property for image scaling.                                     | Define how the image fits its container: `contain` (scale to fit), `cover` (crop to cover), `fill` (stretch). Adds class like `object-fit-cover`. Example: `object-fit="cover"`. Use with `aspect-ratio` for controlled cropping. Test on different sizes to avoid distortion. For logos, `contain` preserves shape. Invalid values ignored. Pair with `object-position` for alignment. This is styling-focused; apply via classes for overrides. | Browser default (`fill`)      |
| object-position      | CSS `object-position` property for image alignment.                              | Position the image within its box when cropped (e.g., `top`, `center`, `50% 50%`). Applied as inline style. Example: `object-position="top"`. Use with `object-fit="cover"` to focus on key areas. Test for focal points in responsive views. Keywords like `bottom right` work; percentages for precision. Default centers; omit if not needed. Enhances visual control without extra CSS. | Browser default (`50% 50%`)   |
| include-schema       | Boolean flag to add schema.org `ImageObject` markup.                             | Enable by adding the attribute to wrap output in `<figure>` with structured data for SEO. Example: `include-schema`. Activates `caption`, `schema-url`, `schema-description`. Use for image-search traffic (e.g., e-commerce). Test with Google's Structured Data Testing Tool (https://search.google.com/test/rich-results). Omit for simple images. Boosts rich results; align with `alt` for consistency. | False                         |
| caption              | Caption text for schema.org `ImageObject`.                                       | Text for `<figcaption itemprop="caption">` when `include-schema` is active. Example: `caption="Business service"`. Keep concise and keyword-rich for SEO. If omitted, no `<figcaption>` is included. Use for contextual labels visible to users, distinct from `alt` which is for accessibility. Test readability in the rendered output and ensure alignment with `alt` and `schema-description` for consistency. | None                          |
| schema-url           | Canonical URL for schema.org `ImageObject`.                                      | Absolute URL for `<meta itemprop="url">` in schema markup. Example: `schema-url="https://example.com/image-3840.jpg"`. Defaults to resolved `src`. Use to specify canonical for duplicates or CDN-hosted images. Enhances SEO indexing by ensuring search engines reference the correct URL. Test with Google's Structured Data Testing Tool. | Resolved `src` URL            |
| schema-description   | Description for schema.org `ImageObject`.                                        | Text for `<meta itemprop="description">` in schema markup. Example: `schema-description="Detailed photo"`. Defaults to `alt` or empty if `decorative`. Elaborate on image content for better search context; keep keyword-rich for SEO. Test with Google's Structured Data Testing Tool to ensure proper indexing. | `alt` (or empty if decorative) |

## Examples

### Minimum Attributes Example

This example uses only the required `src` attribute for basic image rendering. All other attributes use their defaults, suitable for simple use cases where minimal configuration is needed.

```html
<bh-img src="./img/primary/image-3840.jpg"></bh-img>
```

### In-Between Example

This example includes a mix of common attributes for responsive design, accessibility, performance, and styling, but omits advanced features like theme variants or schema.org markup. It’s ideal for typical content images requiring optimization without full customization.

```html
<bh-img
    src="./img/primary/business-service-3840.jpg"
    alt="Business service in Location"
    aspect-ratio="16/9"
    mobile-width="100vw"
    tablet-width="80vw"
    desktop-width="80vw"
    object-fit="cover"
    object-position="top"
    class="border-radius-medium"
    loading="lazy"
    fetch-priority="high"
    fallback-src="./img/primary/custom-placeholder-3840.jpg">
</bh-img>
```

### All Attributes Example

This example demonstrates all supported attributes, including theme variants, schema.org markup, and full responsive/styling options. Note: `decorative` and `alt` are included together here for completeness, but in practice, omit `alt` or set to `""` for decorative images to avoid conflicts, as `decorative` overrides `alt` to empty.

```html
<bh-img
    src="./img/primary/business-service-3840.jpg"
    light-src="./img/primary/business-service-light-3840.jpg"
    dark-src="./img/primary/business-service-dark-3840.jpg"
    alt="Business service in Location"
    decorative
    aspect-ratio="21/9"
    mobile-width="100vw"
    tablet-width="80vw"
    desktop-width="80vw"
    class="border-radius-medium shadow-large"
    loading="lazy"
    fetch-priority="high"
    fallback-src="./img/primary/custom-placeholder-3840.jpg"
    object-fit="cover"
    object-position="top"
    include-schema
    caption="Business service offered at our downtown location"
    schema-url="https://yourdomain.com/img/primary/business-service-3840.jpg"
    schema-description="Photo of our business service at the downtown location">
</bh-img>
```

## Cross-Domain Usage
The component works on any domain if image files are accessible at the specified paths (`./img/primary/`, `./img/responsive/`) or absolute URLs are used with proper CORS. For schema.org markup, provide `schema-url` to override the default resolution if images are not hosted on the same domain as the page. Update script and CSS paths to match your domain or use a CDN. Test URL resolution on different domains to ensure no 404 errors.
```

---


# bh-card Web Component

## Overview

The `bh-card` is a customizable web component that renders a card element, typically consisting of a heading, description, button, and optional background image or video with overlay. It supports light/dark mode variants for images and videos, CSS classes for styling (including background color, border, radius, and backdrop filters), and depends on `ImageUtils` (from `image-utils.js`) for generating background image markup and assumes `bh-video` is defined for background videos. The component observes attribute changes and re-renders dynamically. Upon rendering, the `<bh-card>` tag is replaced in the DOM with its generated markup (a single `<div>` containing the card content).

When the `image-src` attribute is present and non-empty, the component automatically generates and adds a background image using `image-utils.js` (via `ImageUtils.generatePictureMarkup`). If the `video-src` attribute is present and non-empty, it generates and adds a background video using the `bh-video` component. If both are provided, both are added (image first, video second), but it's recommended to use one or the other. If `image-include-schema` is present, the background image is wrapped in a `<figure>` tag with schema.org markup (e.g., `itemscope itemtype="https://schema.org/ImageObject"`) and includes a `<figcaption>` if an `image-alt` attribute is provided.

This component is ideal for creating interactive cards in web applications, such as product displays, blog teasers, or call-to-action blocks.

## Usage

### Basic Example
```html
<bh-card 
  heading="Card Title" 
  description="This is a simple card description." 
  button-text="Learn More" 
  button-href="/details">
</bh-card>
```

### With Background Image and Overlay
```html
<bh-card 
  heading="Featured Card" 
  description="Card with image background and overlay." 
  button-text="Explore" 
  button-href="/explore" 
  image-src="default-image.jpg" 
  image-light-src="light-image.jpg" 
  image-dark-src="dark-image.jpg" 
  image-alt="Background image" 
  image-mobile-width="100vw" 
  image-tablet-width="50vw" 
  image-desktop-width="33vw" 
  image-aspect-ratio="16/9" 
  image-loading="lazy" 
  image-fetch-priority="high" 
  image-object-fit="cover" 
  image-object-position="center" 
  image-include-schema 
  background-overlay="rgba(0,0,0,0.5)" 
  classes="space-between padding-medium">
</bh-card>
```

### With Background Video
```html
<bh-card 
  heading="Video Card" 
  description="Card with video background." 
  button-text="Watch" 
  button-href="/video" 
  video-src="default-video.mp4" 
  video-src-light="light-video.mp4" 
  video-src-dark="dark-video.mp4" 
  video-poster="poster.jpg" 
  video-alt="Background video" 
  video-loading="lazy" 
  background-overlay="rgba(0,0,0,0.5)" 
  classes="space-between padding-medium">
</bh-card>
```

### With Styling Classes
```html
<bh-card 
  heading="Styled Card" 
  description="Card with custom background, border, and filter." 
  button-text="Action" 
  button-href="#" 
  background-color="bg-primary" 
  border="border-solid" 
  border-radius="rounded-lg" 
  backdrop-filter="backdrop-filter-blur-medium" 
  classes="shadow-lg">
</bh-card>
```

**Notes:**
- Ensure `image-utils.js` is loaded before `components.js` for background image support, as it provides `ImageUtils`. For background video, ensure the `bh-video` component is defined (e.g., in `components.js` or a separate script).
- The card's inner structure adapts based on attributes: e.g., if `image-src` or `video-src` is present (enabling background media), content is wrapped in a div that can have classes like `space-between` or `padding-medium` (pulled from the `classes` attribute).
- All attributes are observed for changes, triggering a re-render. However, since the component replaces itself with the rendered markup upon connection, dynamic attribute changes after initial render may require re-insertion of the component.
- The `<bh-card>` tag is removed from the final rendered HTML, replaced by the generated `<div class="card ...">` structure.
- The background image is automatically enabled if `image-src` is provided. The background video is automatically enabled if `video-src` is provided. If `image-include-schema` is present, `ImageUtils` wraps the image in a `<figure>` tag with schema.org markup (e.g., `itemscope itemtype="https://schema.org/ImageObject"`). A `<figcaption>` is included only if an `image-alt` attribute is provided.
- **Accessibility Recommendation**: Always provide an `image-alt` or `video-alt` attribute for background media unless `image-is-decorative` is used, to ensure accessibility for screen readers. For images with `image-include-schema`, the `image-alt` is used for `<figcaption>`.
- `image-object-fit` and `image-object-position` are applied as classes to the `<img>` tag (e.g., `object-fit-cover`, `object-position-center`). Ensure the corresponding CSS classes are defined in your stylesheet.

## Attributes

The following table lists all possible attributes for the `bh-card` component, including their descriptions, types, defaults, and usage notes.

| Attribute          | Description                                                                 | Type              | Default Value                                      | Required | Notes |
|--------------------|-----------------------------------------------------------------------------|-------------------|----------------------------------------------------|----------|-------|
| `heading`         | The text for the card's heading (`<h2>` element).                           | String            | `'Default Heading'`                                | No       | Displayed in an `<hgroup>`. |
| `description`     | The text for the card's description (`<p>` element).                        | String            | `'Default description text.'`                      | No       | Displayed in an `<hgroup>`. |
| `button-href`     | The URL for the button's hyperlink.                                         | String            | `'#'`                                              | No       | Applied to the `<a class="button">` element. |
| `button-text`     | The text displayed on the button.                                           | String            | `'Button'`                                         | No       | Applied to the `<a class="button">` element. |
| `background-overlay` | Enables an overlay div on the background media and sets its background color. | String (color) or Boolean (presence) | `'light-dark(var(--color-static-light-4), var(--color-static-dark-2))'` | No       | If present without value, uses default color. Applied as inline style to `.background-overlay`. Only applied if background media is present. |
| `background-color`| Adds a custom class for background color to the card's main div.            | String (class name)| `''` (no class)                                    | No       | Presence checked; value used as class. |
| `border`          | Adds a custom class for border styling to the card's main div.              | String (class name)| `''` (no class)                                    | No       | Presence checked; value used as class. |
| `border-radius`   | Adds a custom class for border radius to the card's main div (only if `border` is present). | String (class name)| `''` (no class)                                    | No       | Presence checked; value used as class. |
| `backdrop-filter` | Adds space-separated classes for backdrop-filter effects to the overlay div (if `background-overlay` is present). | String (space-separated classes) | `''` (no classes)                                  | No       | Presence checked; e.g., `"backdrop-filter-blur-medium backdrop-filter-grayscale-large"`. |
| `classes`         | Additional space-separated classes applied to the card's main div. Special classes like `space-between` or `padding-medium` are also applied to the inner content div if background media is present. | String (space-separated) | `''` (no classes)                                  | No       | Flexible for custom styling. Parsed to check for specific inner classes. |
| `image-src`       | The default source URL for the background image.                            | String            | `''` (no image)                                    | No       | If provided (non-empty), enables and generates background image markup via `ImageUtils`. |
| `image-light-src` | The source URL for the light mode variant of the background image.          | String            | `''` (falls back to `image-src`)                   | No       | Used in light mode via `ImageUtils`. |
| `image-dark-src`  | The source URL for the dark mode variant of the background image.           | String            | `''` (falls back to `image-src`)                   | No       | Used in dark mode via `ImageUtils`. |
| `image-alt`       | The alt text for the background image.                                      | String            | `''` (no alt)                                      | No       | For accessibility; used as `<figcaption>` content if `image-include-schema` is present. |
| `image-width`     | The width specification for the background image (fallback or base width).  | String            | `'100vw'`                                          | No       | Passed to `ImageUtils` for sizing; can be overridden by responsive widths. |
| `image-aspect-ratio` | The aspect ratio for the background image.                               | String            | `''` (none)                                        | No       | Passed to `ImageUtils` for aspect ratio (e.g., adds `aspect-ratio-16-9` class to `<img>`). |
| `image-is-decorative` | Marks the background image as decorative (e.g., for accessibility, hides from screen readers). | Boolean (presence)| `false` (absent)                                   | No       | If present, adds `aria-hidden="true"` to the `<img>` tag. |
| `image-mobile-width` | The width for mobile viewports in the background image sources.          | String            | `''` (none)                                        | No       | Passed to `ImageUtils` for responsive `sizes` attribute. |
| `image-tablet-width` | The width for tablet viewports in the background image sources.          | String            | `''` (none)                                        | No       | Passed to `ImageUtils` for responsive `sizes` attribute. |
| `image-desktop-width` | The width for desktop viewports in the background image sources.        | String            | `''` (none)                                        | No       | Passed to `ImageUtils` for responsive `sizes` attribute. |
| `image-loading`   | The loading strategy for the background image (e.g., `lazy`, `eager`).      | String            | `'lazy'`                                           | No       | Passed to `ImageUtils` for `<img>` loading attribute. |
| `image-fetch-priority` | The fetch priority for the background image (e.g., `high`, `low`, `auto`). | String            | `'auto'`                                           | No       | Passed to `ImageUtils` for `<img>` fetchpriority attribute. |
| `image-object-fit` | The object-fit CSS property for the background image (e.g., `cover`, `contain`, `fill`). | String         | `'cover'`                                          | No       | Adds a class to the `<img>` tag (e.g., `object-fit-cover`). Requires corresponding CSS in stylesheet. |
| `image-object-position` | The object-position CSS property for the background image (e.g., `center`, `top`, `bottom`). | String       | `'center'`                                         | No       | Adds a class to the `<img>` tag (e.g., `object-position-center`). Requires corresponding CSS in stylesheet. |
| `image-include-schema` | Includes schema.org markup for the background image if present.         | Boolean (presence)| `false` (absent)                                   | No       | If present, wraps the image in a `<figure>` tag with schema.org markup and includes `<figcaption>` if `image-alt` is provided. |
| `video-src`       | The default source URL for the background video.                            | String            | `''` (no video)                                    | No       | If provided (non-empty), enables and adds a `bh-video` element as background, with class `background-video` on the card div. |
| `video-src-light` | The source URL for the light mode variant of the background video.          | String            | `''` (falls back to `video-src`)                   | No       | Used in light mode for the background video. |
| `video-src-dark`  | The source URL for the dark mode variant of the background video.           | String            | `''` (falls back to `video-src`)                   | No       | Used in dark mode for the background video. |
| `video-poster`    | The poster URL for the background video.                                    | String            | `''` (no poster)                                   | No       | Fallback image for the background video. |
| `video-poster-light` | The poster URL for the light mode variant of the background video.       | String            | `''` (falls back to `video-poster`)                | No       | Used in light mode for the background video poster. |
| `video-poster-dark` | The poster URL for the dark mode variant of the background video.         | String            | `''` (falls back to `video-poster`)                | No       | Used in dark mode for the background video poster. |
| `video-alt`       | The alt text (title) for the background video.                              | String            | `'Background video'`                               | No       | For accessibility; applied as `title` attribute on the `<video>` tag. |
| `video-loading`   | The preload strategy for the background video (e.g., `lazy`, `auto`).       | String            | `'lazy'`                                           | No       | Applied as `preload` attribute on the `<video>` tag. |
| `video-autoplay`  | Enables autoplay for the background video.                                  | Boolean (presence or value) | `true` (present or absent)                         | No       | If present (or absent), sets `autoplay`; set to `'false'` to disable. |
| `video-muted`     | Mutes the background video.                                                 | Boolean (presence or value) | `true` (present or absent)                         | No       | If present (or absent), sets `muted`; set to `'false'` to disable. |
| `video-loop`      | Loops the background video.                                                 | Boolean (presence or value) | `true` (present or absent)                         | No       | If present (or absent), sets `loop`; set to `'false'` to disable. |
| `video-playsinline` | Enables playsinline for the background video (for mobile).                | Boolean (presence or value) | `true` (present or absent)                         | No       | If present (or absent), sets `playsinline`; set to `'false'` to disable. |
| `video-disablepictureinpicture` | Disables picture-in-picture for the background video.                   | Boolean (presence or value) | `false` (absent)                                   | No       | If present, sets `disablepictureinpicture`; set to `'false'` to enable. |


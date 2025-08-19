```markdown
# CustomBlock

## Summary

The `CustomBlock` is a custom web component that extends `HTMLElement` to create a versatile, reusable block component with customizable layout, supporting both image and video backgrounds. It features lazy loading, theme-aware media, accessibility enhancements, and robust error handling. Key features include:

- **Lazy Loading**: Uses `IntersectionObserver` to initialize the block only when it enters the viewport (with a 50px root margin).
- **Theme-Aware Media**: Supports `custom-img-*-light-src` and `custom-img-*-dark-src` for images, and `custom-video-background-light-src` and `custom-video-background-dark-src` for videos, adapting to light/dark mode via `prefers-color-scheme`.
- **Video Support**: Generates `<video>` elements with theme-specific sources, poster images, and customizable playback options (e.g., `autoplay`, `muted`, `loop`).
- **Accessibility**: Warns if `custom-img-*-alt` is missing for non-decorative images, supports custom `custom-video-background-alt` for videos, and includes Schema.org markup via `custom-img-*-include-schema`.
- **Customizable Styling**: Offers attributes for background overlays, gradients, noise textures, backdrop filters, borders, and custom classes for both outer and inner containers.
- **Dynamic Content**: Renders heading, description, and button with customizable text, alignment, and styling.
- **Error Handling**: Falls back to a placeholder image or error state if media fails to load, with detailed console warnings.
- **DOM Replacement**: Replaces the `<custom-block>` element with a fully constructed `<div>` containing the block's content.

The component requires no external dependencies for basic functionality, as image and video markup generation is handled internally. It supports a wide range of attributes for flexible styling, media, and content configuration.

## Dependencies

None. The `CustomBlock` component is self-contained, with image and video markup generation logic embedded in the class. Previously, `CustomCard` relied on `picture-generator.js` for image markup, but `CustomBlock` integrates this functionality directly.

## Standard Attributes

These are standard HTML attributes supported by the component, applied to the rendered block or its sub-elements.

| Attribute       | Description                                                                 | Type     | Required | Default Value |
|-----------------|-----------------------------------------------------------------------------|----------|----------|---------------|
| `class`         | CSS classes for styling the block container.                                | String   | No       | ''            |
| `style`         | Inline CSS styles for the block container.                                  | String   | No       | ''            |

## Custom Attributes

These are non-standard attributes specific to the component, used for configuring content, styling, images, and videos. Most are not transferred to the final DOM as the original element is replaced.

| Attribute                             | Description                                                                 | Type     | Required | Default Value         |
|---------------------------------------|-----------------------------------------------------------------------------|----------|----------|-----------------------|
| `section-title`                       | Marks the block as a section title (adds `data-section-title` attribute).   | Boolean  | No       | False                 |
| `heading`                             | The block's heading text.                                                  | String   | No       | 'Default Heading'     |
| `heading-tag`                         | HTML tag for the heading (e.g., `h1`, `h2`). Must be `h1`-`h6`.             | String   | No       | 'h2'                  |
| `description`                         | The block's description text.                                              | String   | No       | 'Default description text.' |
| `button-href`                         | The URL for the block's button link.                                       | String   | No       | '#'                   |
| `button-text`                         | The text for the block's button.                                           | String   | No       | ''                    |
| `background-overlay`                  | Adds a background overlay (format: `background-overlay-[number]`).          | String   | No       | ''                    |
| `background-gradient`                 | Adds a gradient overlay to the background (format: `background-gradient-[number]`). | String   | No       | ''                    |
| `background-image-noise`              | Adds a noise texture to the background overlay.                            | Boolean  | No       | False                 |
| `backdrop-filter`                     | CSS classes for backdrop filter (e.g., `blur-5`).                          | String   | No       | ''                    |
| `background-color`                    | CSS class for background color (e.g., `bg-blue-500`).                      | String   | No       | ''                    |
| `border`                              | CSS class for border (e.g., `border-solid`).                               | String   | No       | ''                    |
| `border-radius`                       | CSS class for border radius (e.g., `rounded-lg`). Requires `border`.        | String   | No       | ''                    |
| `inner-background-overlay`            | Adds an overlay to the inner container (format: `background-overlay-[number]`). | String   | No       | ''                    |
| `inner-background-gradient`           | Adds a gradient to the inner container (format: `background-gradient-[number]`). | String   | No       | ''                    |
| `inner-background-image-noise`        | Adds a noise texture to the inner container.                               | Boolean  | No       | False                 |
| `inner-backdrop-filter`               | CSS classes for inner container backdrop filter (e.g., `blur-5`).          | String   | No       | ''                    |
| `inner-background-color`              | CSS class for inner container background color (e.g., `background-color-1`). | String   | No       | ''                    |
| `inner-border`                        | CSS class for inner container border (e.g., `border-solid`).               | String   | No       | ''                    |
| `inner-border-radius`                 | CSS class for inner container border radius (e.g., `rounded-lg`). Requires `inner-border`. | String   | No       | ''                    |
| `inner-style`                         | Inline CSS styles for the inner container.                                 | String   | No       | ''                    |
| `inner-align`                         | Alignment of inner content (e.g., `center`, `top-left`, `bottom-right`).   | String   | No       | ''                    |
| `inner-text-align`                    | Text alignment for inner content (e.g., `left`, `center`, `right`).        | String   | No       | ''                    |
| `custom-img-background-light-src`     | Background image URL for light theme. Conditional with `custom-img-background-dark-src`. | String   | Conditional | ''                |
| `custom-img-background-dark-src`      | Background image URL for dark theme. Conditional with `custom-img-background-light-src`. | String   | Conditional | ''                |
| `custom-img-background-alt`           | Alt text for background image; warns if missing and not `custom-img-background-decorative`. | String   | No       | ''                    |
| `custom-img-background-decorative`    | Marks background image as decorative (no `alt` warning, empty `alt`).       | Boolean  | No       | False                 |
| `custom-img-background-mobile-width`  | Width descriptor for mobile devices (used in `sizes` attribute).            | String   | No       | '100vw'               |
| `custom-img-background-tablet-width`  | Width descriptor for tablet devices (used in `sizes` attribute).            | String   | No       | '100vw'               |
| `custom-img-background-desktop-width` | Width descriptor for desktop devices (used in `sizes` attribute).           | String   | No       | '100vw'               |
| `custom-img-background-aspect-ratio`  | Aspect ratio for background image (e.g., `16/9`).                          | String   | No       | ''                    |
| `custom-img-background-include-schema`| Enables Schema.org markup for background image.                            | Boolean  | No       | False                 |
| `custom-img-background-fetchpriority` | Fetch priority for background image (`high`, `low`, `auto`).               | String   | No       | ''                    |
| `custom-img-background-loading`       | Loading behavior for background image (`lazy`, `eager`).                   | String   | No       | 'lazy'                |
| `custom-img-foreground-light-src`     | Foreground image URL for light theme. Conditional with `custom-img-foreground-dark-src`. | String   | Conditional | ''                |
| `custom-img-foreground-dark-src`      | Foreground image URL for dark theme. Conditional with `custom-img-foreground-light-src`. | String   | Conditional | ''                |
| `custom-img-foreground-alt`           | Alt text for foreground image; warns if missing and not `custom-img-foreground-decorative`. | String   | No       | ''                    |
| `custom-img-foreground-decorative`    | Marks foreground image as decorative (no `alt` warning, empty `alt`).       | Boolean  | No       | False                 |
| `custom-img-foreground-mobile-width`  | Width descriptor for mobile devices (used in `sizes` attribute).            | String   | No       | '100vw'               |
| `custom-img-foreground-tablet-width`  | Width descriptor for tablet devices (used in `sizes` attribute).            | String   | No       | '100vw'               |
| `custom-img-foreground-desktop-width` | Width descriptor for desktop devices (used in `sizes` attribute).           | String   | No       | '100vw'               |
| `custom-img-foreground-aspect-ratio`  | Aspect ratio for foreground image (e.g., `16/9`).                          | String   | No       | ''                    |
| `custom-img-foreground-include-schema`| Enables Schema.org markup for foreground image.                            | Boolean  | No       | False                 |
| `custom-img-foreground-fetchpriority` | Fetch priority for foreground image (`high`, `low`, `auto`).               | String   | No       | ''                    |
| `custom-img-foreground-loading`       | Loading behavior for foreground image (`lazy`, `eager`).                   | String   | No       | 'lazy'                |
| `custom-img-foreground-position`      | Position of foreground image (`none`, `above`, `below`, `left`, `right`).  | String   | No       | 'none'                |
| `custom-video-background-src`         | Default video source URL (used if theme-specific sources are unavailable). | String   | Conditional | ''                    |
| `custom-video-background-light-src`   | Video source URL for light theme. Conditional with other video sources.    | String   | Conditional | ''                    |
| `custom-video-background-dark-src`    | Video source URL for dark theme. Conditional with other video sources.     | String   | Conditional | ''                    |
| `custom-video-background-poster`      | Default poster image URL for the video.                                    | String   | No       | ''                    |
| `custom-video-background-light-poster`| Poster image URL for light theme.                                         | String   | No       | ''                    |
| `custom-video-background-dark-poster` | Poster image URL for dark theme.                                          | String   | No       | ''                    |
| `custom-video-background-alt`         | Accessibility text for the video (`title` and `aria-label`).               | String   | No       | 'Video content'       |
| `custom-video-background-loading`     | Loading behavior for the video (`lazy`, `auto`).                           | String   | No       | 'lazy'                |
| `custom-video-background-autoplay`    | Enables automatic video playback.                                          | Boolean  | No       | True                  |
| `custom-video-background-muted`       | Mutes the video.                                                          | Boolean  | No       | True                  |
| `custom-video-background-loop`        | Loops the video.                                                          | Boolean  | No       | True                  |
| `custom-video-background-playsinline` | Enables inline playback (e.g., for mobile devices).                        | Boolean  | No       | True                  |
| `custom-video-background-disablepictureinpicture` | Disables picture-in-picture mode.                             | Boolean  | No       | False                 |

## Notes
- **Conditional Attributes**: At least one of `custom-img-background-light-src`, `custom-img-background-dark-src`, `custom-img-foreground-light-src`, `custom-img-foreground-dark-src`, `custom-video-background-src`, `custom-video-background-light-src`, or `custom-video-background-dark-src` is required for media rendering.
- **Theme-Aware Media**: For images and videos, `light-src` and `dark-src` (or their equivalents) enable theme-specific rendering based on `prefers-color-scheme`. If only one is provided, it serves as the default.
- **Video Playback**: Videos include both `.mp4` and `.webm` sources for compatibility. A dynamic script handles theme changes for `custom-video-background-light-src` and `dark-src`, preserving playback state.
- **Accessibility**: Missing `custom-img-*-alt` for non-decorative images triggers console warnings. Videos use `custom-video-background-alt` for `title` and `aria-label`.
- **Styling**: Attributes like `background-overlay`, `background-gradient`, and `backdrop-filter` apply to the media layer, while `inner-*` attributes style the content container.

## Example Custom-Block Tags

Here are example usages of the `<custom-block>` tag, demonstrating various attribute combinations for text, images, and videos.

### Basic Example (Text Only, No Media)
```html
<custom-block
    heading="Welcome Block"
    heading-tag="h1"
    description="A simple block with centered text content."
    button-text="Learn More"
    button-href="/learn"
    class="padding-medium"
    inner-align="center"
    inner-text-align="center"
>
</custom-block>
```

### Example with Theme-Aware Background Image
```html
<custom-block
    heading="Featured Product"
    description="Explore our latest offering with a responsive background."
    button-text="Shop Now"
    button-href="/shop"
    custom-img-background-light-src="./img/product-light.jpg"
    custom-img-background-dark-src="./img/product-dark.jpg"
    custom-img-background-alt="Product image"
    custom-img-background-mobile-width="100vw"
    custom-img-background-tablet-width="50vw"
    custom-img-background-desktop-width="33vw"
    custom-img-background-include-schema
    custom-img-background-loading="eager"
    custom-img-background-fetchpriority="high"
    background-overlay="background-overlay-1"
    backdrop-filter="blur-5"
    class="rounded-lg border-solid border-gray-300"
>
</custom-block>
```

### Example with Theme-Aware Video Background
```html
<custom-block
    heading="Video Showcase"
    description="Watch our theme-aware promotional video."
    button-text="Discover More"
    button-href="/discover"
    custom-video-background-light-src="./video/light-video.mp4"
    custom-video-background-dark-src="./video/dark-video.mp4"
    custom-video-background-light-poster="./img/light-poster.jpg"
    custom-video-background-dark-poster="./img/dark-poster.jpg"
    custom-video-background-alt="Promotional video for new feature"
    custom-video-background-loading="auto"
    custom-video-background-autoplay="true"
    custom-video-background-muted="true"
    custom-video-background-loop="true"
    custom-video-background-playsinline="true"
    background-gradient="background-gradient-2"
    background-overlay="background-overlay-2"
    class="hero-section padding-large"
    style="max-width: 1400px; margin: auto;"
>
</custom-block>
```

### Detailed Example with Video, Foreground Image, and Inner Styling
```html
<custom-block
    heading="Interactive Tutorial"
    heading-tag="h1"
    description="Learn with our interactive video and foreground image."
    button-text="Start Tutorial"
    button-href="/tutorial"
    custom-video-background-light-src="./video/tutorial-light.mp4"
    custom-video-background-dark-src="./video/tutorial-dark.mp4"
    custom-video-background-poster="./img/default-poster.jpg"
    custom-video-background-light-poster="./img/light-poster.jpg"
    custom-video-background-dark-poster="./img/dark-poster.jpg"
    custom-video-background-alt="Interactive tutorial video"
    custom-video-background-loading="lazy"
    custom-video-background-autoplay="true"
    custom-video-background-muted="true"
    custom-video-background-loop="false"
    custom-video-background-playsinline="true"
    custom-video-background-disablepictureinpicture="true"
    custom-img-foreground-light-src="./img/foreground-light.jpg"
    custom-img-foreground-dark-src="./img/foreground-dark.jpg"
    custom-img-foreground-alt="Tutorial illustration"
    custom-img-foreground-position="right"
    custom-img-foreground-loading="lazy"
    background-overlay="background-overlay-3"
    background-gradient="background-gradient-1"
    background-image-noise
    backdrop-filter="blur-10"
    inner-align="center-left"
    inner-text-align="left"
    inner-background-color="background-color-2"
    inner-background-gradient="background-gradient-2"
    inner-background-image-noise
    class="tutorial-block padding-large border-solid"
    style="max-width: 1600px; margin: auto;"
>
</custom-block>
```

## Implementation Notes
- **Lazy Loading**: Videos and images with `loading="lazy"` use `IntersectionObserver` for playback or loading when in view.
- **Theme Switching**: For videos with `custom-video-background-light-src` or `dark-src`, a script is generated to handle theme changes, updating sources and posters while preserving playback state.
- **Error Handling**: Invalid video extensions or failed loads trigger console warnings and fallback to a placeholder image or error state.
- **Performance**: Caches rendered output to avoid redundant DOM manipulation when attributes remain unchanged.

This documentation reflects the `CustomBlock` component as of 2025-08-19, providing a comprehensive guide to its usage for both image and video-based layouts.
```
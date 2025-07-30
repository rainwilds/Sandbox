# CustomVideo Component Reference

## Summary

The `CustomVideo` is a custom web component that extends the native HTML `<video>` element. It provides theme-aware video playback by dynamically switching sources and posters based on the user's system color scheme (`prefers-color-scheme: light` or `dark`). Key features include:
- Automatic generation of `.webm` and `.mp4` sources from provided base URLs for better browser compatibility (prioritizing `.webm`).
- Support for lazy loading, autoplay preservation during theme changes, and accessibility enhancements (e.g., setting `title` and `aria-label` from `alt`).
- Error handling for invalid sources or posters, with fallback to default sources.
- Playback state preservation (current time and play/pause) on theme changes or errors.
- Integration with `IntersectionObserver` for reliable autoplay with lazy loading.
- Removal of non-native attributes after processing to keep the DOM clean.

The component requires at least one of `light-src` or `dark-src` and supports file extensions `.mp4` or `.webm`. It does not support `.ogg` or a native `src` attribute, focusing on theme-based switching.

## Dependencies

The `CustomVideo` component has no external dependencies. It is a standalone JavaScript class that extends `HTMLVideoElement` and uses built-in browser APIs like `matchMedia`, `Image`, and `IntersectionObserver`. No additional libraries (e.g., `image-utils.js`) are required.

## Standard Attributes

These are native HTML `<video>` attributes supported and processed by the component.

| Attribute              | Description                                                                 | Type     | Required | Default Value |
|------------------------|-----------------------------------------------------------------------------|----------|----------|---------------|
| `alt`                  | Alternative text for accessibility; used to set `title` and `aria-label`.   | String   | No       | "Video content" |
| `loading`              | Controls loading behavior (`"lazy"` sets `preload="metadata"`).             | String   | No       | None (browser default) |
| `autoplay`             | Enables automatic playback.                                                 | Boolean  | No       | False |
| `muted`                | Mutes the video audio by default.                                           | Boolean  | No       | False |
| `loop`                 | Loops the video playback.                                                   | Boolean  | No       | False |
| `playsinline`          | Allows inline playback on mobile devices.                                    | Boolean  | No       | False |
| `disablepictureinpicture` | Disables picture-in-picture mode.                                        | Boolean  | No       | False |
| `class`                | CSS classes for styling the video element.                                  | String   | No       | None |
| `poster`               | Default poster image URL (fallback if theme-specific posters fail).         | String   | No       | None |

## Custom Attributes

These are non-standard attributes specific to the component, used for theme-specific sources and posters. They are removed from the DOM after processing.

| Attribute      | Description                                                                 | Type     | Required | Default Value |
|----------------|-----------------------------------------------------------------------------|----------|----------|---------------|
| `light-src`    | Video source URL for light theme (base for generating `.webm` and `.mp4`). Required if `dark-src` is not provided. | String   | Conditional | None |
| `dark-src`     | Video source URL for dark theme (base for generating `.webm` and `.mp4`). Required if `light-src` is not provided. | String   | Conditional | None |
| `light-poster` | Poster image URL for light theme.                                           | String   | No       | None |
| `dark-poster`  | Poster image URL for dark theme.                                            | String   | No       | None |

## Example Custom-Video Tags

Here are example usages of the `<video is="custom-video">` tag. These demonstrate different combinations of attributes.

### Basic Example (Light Theme Only, with Lazy Loading and Autoplay)
```html
<video
    is="custom-video"
    light-src="./video/video-light.mp4"
    alt="Light theme video"
    loading="lazy"
    autoplay
    muted
    loop
    playsinline
    disablepictureinpicture
    class="aspect-ratio-16-9"
></video>
```

### Example with Both Themes and Posters
```html
<video
    is="custom-video"
    light-src="./video/video-light.webm"
    dark-src="./video/video-dark.mp4"
    poster="./img/default-poster.jpg"
    light-poster="./img/light-poster.jpg"
    dark-poster="./img/dark-poster.jpg"
    alt="Theme-aware video"
    loading="lazy"
    autoplay
    muted
    loop
    playsinline
    class="padding-medium aspect-ratio-16-9"
></video>
```

### Example with Dark Theme Only and Custom Class
```html
<video
    is="custom-video"
    dark-src="./video/video-dark.mp4"
    dark-poster="./img/dark-poster.jpg"
    alt="Dark theme video"
    loading="lazy"
    muted
    loop
    playsinline
    class="video-container"
></video>
```

### Minimal Example (No Theme-Specific Posters, No Autoplay)
```html
<video
    is="custom-video"
    light-src="./video/video1.mp4"
    alt="Simple video"
    poster="./img/poster.jpg"
    class="aspect-ratio-4-3"
></video>
```
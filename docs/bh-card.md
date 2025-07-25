# bh-card Web Component

## Overview

The `bh-card` is a customizable web component that renders a card element, typically consisting of a heading, description, button, and optional background image with overlay. It supports light/dark mode image variants, CSS classes for styling (including background color, border, radius, and backdrop filters), and depends on `ImageUtils` (from `image-utils.js`) for generating background image markup. The component observes attribute changes and re-renders dynamically.

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
  src="default-image.jpg" 
  light-src="light-image.jpg" 
  dark-src="dark-image.jpg" 
  alt="Background image" 
  width="100%" 
  aspect-ratio="16/9" 
  background-image 
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
- Ensure `image-utils.js` is loaded before `components.js` for background image support, as it provides `ImageUtils`.
- The card's inner structure adapts based on attributes: e.g., if `background-image` is present, content is wrapped in a div that can have classes like `space-between` or `padding-medium` (pulled from the `classes` attribute).
- All attributes are observed for changes, triggering a re-render.

## Attributes

The following table lists all possible attributes for the `bh-card` component, including their descriptions, types, defaults, and usage notes.

| Attribute          | Description                                                                 | Type              | Default Value                                      | Required | Notes |
|--------------------|-----------------------------------------------------------------------------|-------------------|----------------------------------------------------|----------|-------|
| `heading`         | The text for the card's heading (`<h2>` element).                           | String            | `'Default Heading'`                                | No       | Displayed in an `<hgroup>`. |
| `description`     | The text for the card's description (`<p>` element).                        | String            | `'Default description text.'`                      | No       | Displayed in an `<hgroup>`. |
| `button-href`     | The URL for the button's hyperlink.                                         | String            | `'#'`                                              | No       | Applied to the `<a class="button">` element. |
| `button-text`     | The text displayed on the button.                                           | String            | `'Button'`                                         | No       | Applied to the `<a class="button">` element. |
| `background-image`| Enables a background image using the provided image sources.                | Boolean (presence)| `false` (absent)                                   | No       | If present, generates image markup via `ImageUtils`. Requires `src` for display. |
| `background-overlay` | Enables an overlay div on the background image and sets its background color. | String (color) or Boolean (presence) | `'light-dark(var(--color-static-light-4), var(--color-static-dark-2))'` | No       | If present without value, uses default color. Applied as inline style to `.background-overlay`. |
| `background-color`| Adds a custom class for background color to the card's main div.            | String (class name)| `''` (no class)                                    | No       | Presence checked; value used as class. |
| `border`          | Adds a custom class for border styling to the card's main div.              | String (class name)| `''` (no class)                                    | No       | Presence checked; value used as class. |
| `border-radius`   | Adds a custom class for border radius to the card's main div (only if `border` is present). | String (class name)| `''` (no class)                                    | No       | Presence checked; value used as class. |
| `backdrop-filter` | Adds space-separated classes for backdrop-filter effects to the overlay div (if `background-overlay` is present). | String (space-separated classes) | `''` (no classes)                                  | No       | Presence checked; e.g., `"backdrop-filter-blur-medium backdrop-filter-grayscale-large"`. |
| `classes`         | Additional space-separated classes applied to the card's main div. Special classes like `space-between` or `padding-medium` are also applied to the inner content div if `background-image` is present. | String (space-separated) | `''` (no classes)                                  | No       | Flexible for custom styling. Parsed to check for specific inner classes. |
| `src`             | The default source URL for the background image.                            | String            | `''` (no image)                                    | No       | Used with `ImageUtils` for `<picture>` markup. Required if `background-image` is present. |
| `light-src`       | The source URL for the light mode variant of the background image.          | String            | `''` (falls back to `src`)                         | No       | Used in light mode via `ImageUtils`. |
| `dark-src`        | The source URL for the dark mode variant of the background image.           | String            | `''` (falls back to `src`)                         | No       | Used in dark mode via `ImageUtils`. |
| `alt`             | The alt text for the background image.                                      | String            | `''` (no alt)                                      | No       | For accessibility. |
| `width`           | The width specification for the background image.                           | String            | `'100vw'`                                          | No       | Passed to `ImageUtils` for sizing. |
| `aspect-ratio`    | The aspect ratio for the background image.                                  | String            | `''` (none)                                        | No       | Passed to `ImageUtils` for aspect ratio. |
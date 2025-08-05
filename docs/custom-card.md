# CustomCard

## Summary

The `CustomCard` is a custom web component that extends `HTMLElement` to create a reusable card component with a customizable layout. It supports lazy loading via `IntersectionObserver`, theme-aware background images, and accessibility features. Key features include:

- **Lazy Loading**: Uses `IntersectionObserver` to initialize the card only when it enters the viewport (with a 50px root margin).
- **Theme-Aware Background Images**: Supports `image-light-src` and `image-dark-src` for light/dark mode background images, generated via `picture-generator.js`.
- **Accessibility**: Warns if `image-alt` is missing for non-decorative images and supports Schema.org markup with `image-include-schema`.
- **Customizable Styling**: Allows attributes for background overlay, color, border, border radius, backdrop filter, and custom classes.
- **Dynamic Content**: Renders a heading, description, and button with customizable text and link.
- **Error Handling**: Provides a fallback rendering if errors occur during initialization or image loading, with a placeholder image fallback.
- **DOM Replacement**: Replaces the `<custom-card>` element with a fully constructed `<div>` containing the card's content.

The component requires `picture-generator.js` for generating responsive `<picture>` markup for background images. It supports a wide range of attributes for flexibility in styling and behavior.

## Dependencies

The `CustomCard` component depends on `picture-generator.js`, which provides the `generatePictureMarkup` function for generating responsive and theme-aware `<picture>` markup. This script must be loaded before the component is initialized, or the card will fail to render background images.

## Standard Attributes

These are standard HTML attributes supported by the component, processed and applied to the rendered card or its sub-elements.

| Attribute       | Description                                                                 | Type     | Required | Default Value |
|-----------------|-----------------------------------------------------------------------------|----------|----------|---------------|
| `class`         | CSS classes for styling the card container.                                 | String   | No       | '' |

## Custom Attributes

These are non-standard attributes specific to the component, used for configuring content, styling, and background images. Most are not transferred to the final DOM as the original element is replaced.

| Attribute              | Description                                                                 | Type     | Required | Default Value         |
|------------------------|-----------------------------------------------------------------------------|----------|----------|-----------------------|
| `heading`              | The card's heading text.                                                    | String   | No       | 'Default Heading'     |
| `description`          | The card's description text.                                                | String   | No       | 'Default description text.' |
| `button-href`          | The URL for the card's button link.                                         | String   | No       | '#'                   |
| `button-text`          | The text for the card's button.                                             | String   | No       | 'Button'              |
| `background-overlay`   | Adds a background overlay div (with optional backdrop filter).              | Boolean  | No       | False                 |
| `background-color`     | CSS class for background color (e.g., `bg-blue-500`).                       | String   | No       | None                  |
| `border`               | CSS class for border (e.g., `border-solid`).                                | String   | No       | None                  |
| `border-radius`        | CSS class for border radius (e.g., `rounded-lg`). Requires `border`.        | String   | No       | None                  |
| `backdrop-filter`      | CSS class for backdrop filter (e.g., `backdrop-blur-sm`).                   | String   | No       | None                  |
| `image-light-src`      | Background image URL for light theme. Conditional with `image-dark-src`.    | String   | Conditional | None                |
| `image-dark-src`       | Background image URL for dark theme. Conditional with `image-light-src`.    | String   | Conditional | None                |
| `image-alt`            | Alt text for background image; warns if missing and not `image-decorative`. | String   | No       | ''                    |
| `image-decorative`     | Marks background image as decorative (no `alt` warning, empty `alt`).       | Boolean  | No       | False                 |
| `image-mobile-width`   | Width descriptor for mobile devices (used in `sizes` attribute).            | String   | No       | '100vw'               |
| `image-tablet-width`   | Width descriptor for tablet devices (used in `sizes` attribute).            | String   | No       | '100vw'               |
| `image-desktop-width`  | Width descriptor for desktop devices (used in `sizes` attribute).           | String   | No       | '100vw'               |
| `image-aspect-ratio`   | Aspect ratio for the background image (e.g., `16/9`).                      | String   | No       | ''                    |
| `image-include-schema` | Enables Schema.org markup for the background image.                        | Boolean  | No       | False                 |
| `image-fetchpriority`  | Fetch priority for the background image (`high`, `low`, or `auto`).        | String   | No       | ''                    |
| `image-loading`        | Loading behavior for the background image (`lazy` or `eager`).             | String   | No       | 'lazy'                |

## Example Custom-Card Tags

Here are example usages of the `<custom-card>` tag, demonstrating various attribute combinations.

### Basic Example (Text Only, No Background Image)
```html
<custom-card
    heading="Welcome Card"
    description="This is a simple card with no background image."
    button-text="Learn More"
    button-href="/learn"
    class="padding-medium"
>
</custom-card>
```

### Example with Theme-Aware Background Image and Schema
```html
<custom-card
    heading="Featured Product"
    description="Explore our latest offering with a responsive background."
    button-text="Shop Now"
    button-href="/shop"
    image-light-src="./img/product-light.jpg"
    image-dark-src="./img/product-dark.jpg"
    image-alt="Product image"
    image-mobile-width="100vw"
    image-tablet-width="50vw"
    image-desktop-width="33vw"
    image-include-schema
    image-loading="lazy"
    image-fetchpriority="high"
    background-overlay
    backdrop-filter="backdrop-blur-sm"
    class="rounded-lg border-solid border-gray-300"
>
</custom-card>
```

### Example with Background Color and Decorative Image
```html
<custom-card
    heading="Decorative Card"
    description="A card with a decorative background image."
    button-text="Explore"
    button-href="/explore"
    image-dark-src="./img/decorative-dark.png"
    image-decorative
    image-loading="lazy"
    background-color="bg-gray-800"
    class="space-between padding-medium"
>
</custom-card>
```

### Minimal Example (Fallback Placeholder)
```html
<custom-card
    heading="Simple Card"
    description="A minimal card with a placeholder image."
    button-text="Click Me"
    button-href="#"
    image-light-src="./img/simple.jpg"
    image-alt="Simple placeholder"
    class="border-dashed"
>
</custom-card>
```
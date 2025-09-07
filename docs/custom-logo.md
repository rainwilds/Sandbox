# Custom Logo Documentation

The `<custom-logo>` is a Web Component designed to display a customizable logo image with support for responsive sources across different screen sizes and light/dark modes. It integrates with the `generateLogoMarkup` function from an external module (`image-generator.js`) to render the logo markup. The component provides attributes to control the logo's source, alternate text, and positioning. Below is a detailed explanation of all attributes, grouped into Logo Attributes, presented in alphabetical order.

## Logo Attributes

| Attribute Name | Description | Default Value | Expected Format |
|----------------|-------------|---------------|-----------------|
| logo-dark-alt | Provides the alt text for the logo image in dark mode for accessibility. | `''` (empty) | Plain text (e.g., `Dark mode logo`) |
| logo-dark-src | Specifies the source URL for the logo image in dark mode. Must be paired with `logo-light-src`. | `''` (empty) | Valid image URL (e.g., `logo-dark.jpg`) |
| logo-light-alt | Provides the alt text for the logo image in light mode for accessibility. | `''` (empty) | Plain text (e.g., `Light mode logo`) |
| logo-light-src | Specifies the source URL for the logo image in light mode. Must be paired with `logo-dark-src`. | `''` (empty) | Valid image URL (e.g., `logo-light.jpg`) |
| logo-mobile-dark-src | Specifies the source URL for the logo image in dark mode on mobile screens. Must be paired with `logo-mobile-light-src`. | `''` (empty) | Valid image URL (e.g., `logo-mobile-dark.jpg`) |
| logo-mobile-light-src | Specifies the source URL for the logo image in light mode on mobile screens. Must be paired with `logo-mobile-dark-src`. | `''` (empty) | Valid image URL (e.g., `logo-mobile-light.jpg`) |
| logo-mobile-src | Specifies the source URL for the logo image on mobile screens. | `''` (empty) | Valid image URL (e.g., `logo-mobile.jpg`) |
| logo-position | Controls the alignment of the logo within its container. | `''` (empty) | One of: `center`, `top`, `bottom`, `left`, `right`, `top-left`, `top-center`, `top-right`, `bottom-left`, `bottom-center`, `bottom-right`, `center-left`, `center-right` |
| logo-primary-alt | Provides the alt text for the default logo image for accessibility. | `''` (empty) | Plain text (e.g., `Default logo`) |
| logo-primary-src | Specifies the default source URL for the logo image. | `''` (empty) | Valid image URL (e.g., `logo.jpg`) |
| logo-tablet-dark-src | Specifies the source URL for the logo image in dark mode on tablet screens. Must be paired with `logo-tablet-light-src`. | `''` (empty) | Valid image URL (e.g., `logo-tablet-dark.jpg`) |
| logo-tablet-light-src | Specifies the source URL for the logo image in light mode on tablet screens. Must be paired with `logo-tablet-dark-src`. | `''` (empty) | Valid image URL (e.g., `logo-tablet-light.jpg`) |
| logo-tablet-src | Specifies the source URL for the logo image on tablet screens. | `''` (empty) | Valid image URL (e.g., `logo-tablet.jpg`) |

## Notes
- The `<custom-logo>` component relies on the `generateLogoMarkup` function from `image-generator.js` to generate the logo's HTML markup, which supports responsive images and light/dark mode switching.
- The logo is wrapped in an `<a>` tag with `href="/"`, making it a clickable link to the homepage.
- If no valid logo sources are provided (e.g., `logo-primary-src`, `logo-light-src`, `logo-dark-src`, `logo-mobile-src`, or `logo-tablet-src`), a placeholder div with the message "No logo sources provided" is rendered, and a console warning is logged.
- The `logo-light-src` and `logo-dark-src` attributes must be provided together, as must `logo-mobile-light-src` and `logo-mobile
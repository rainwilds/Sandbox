# Custom Nav Documentation

The `<custom-nav>` is a Web Component designed to create a customizable navigation menu with support for responsive toggling, styling, and accessibility features. It renders a navigation menu with a toggle button for mobile views and supports dynamic navigation links provided via a JSON string. The component integrates with the `BACKDROP_FILTER_MAP` from `custom-block.js` for backdrop filter styling. Below is a detailed explanation of all attributes, grouped into Navigation Attributes, presented in alphabetical order.

## Navigation Attributes

| Attribute Name | Description | Default Value | Expected Format |
|----------------|-------------|---------------|-----------------|
| nav | Specifies the navigation links as a JSON array of objects with `href` and `text` properties. | `null` | JSON string (e.g., `[{"href": "/home", "text": "Home"}, {"href": "/about", "text": "About"}]` |
| nav-aria-label | Sets the ARIA label for the navigation element for accessibility. | `'Main navigation'` | Plain text (e.g., `Primary navigation`) |
| nav-background-color | Sets the background color of the navigation using a predefined class. | `''` (empty) | `background-color-[number]` (e.g., `background-color-1`) |
| nav-background-image-noise | Adds a noise texture to the navigation background when present. | Not set (false) | Boolean attribute (presence indicates `true`) |
| nav-backdrop-filter | Applies backdrop filter effects to the navigation. | `[]` (empty array) | Space-separated class names (e.g., `backdrop-filter-blur-small backdrop-filter-grayscale-medium`) |
| nav-border | Sets the border style for the navigation. | `''` (empty) | CSS class name (e.g., `border-small`) |
| nav-border-radius | Sets the border radius for the navigation, requires `nav-border` to be set. | `''` (empty) | CSS class name (e.g., `border-radius-small`) |
| nav-class | Adds custom CSS classes to the navigation element. | `''` (empty) | Space-separated class names (e.g., `nav-custom nav-style`) |
| nav-container-class | Adds custom CSS classes to the container div wrapping the navigation. | `''` (empty) | Space-separated class names (e.g., `container-custom container-style`) |
| nav-container-style | Applies inline CSS styles to the container div wrapping the navigation. | `''` (empty) | CSS style string (e.g., `padding: 10px; z-index: 2;`) |
| nav-orientation | Sets the orientation of the navigation links. | `'horizontal'` | One of: `horizontal`, `vertical` |
| nav-position | Controls the alignment of the navigation within its container. | `''` (empty) | One of: `center`, `top`, `bottom`, `left`, `right`, `top-left`, `top-center`, `top-right`, `bottom-left`, `bottom-center`, `bottom-right`, `center-left`, `center-right` |
| nav-style | Applies inline CSS styles to the navigation element. | `''` (empty) | CSS style string (e.g., `background: blue; padding: 10px;`) |
| nav-toggle-class | Adds custom CSS classes to the navigation toggle button. | `''` (empty) | Space-separated class names (e.g., `toggle-custom toggle-style`) |
| nav-toggle-icon | Specifies a Font Awesome icon for the navigation toggle button. | `'<i class="fa-light fa-bars"></i>'` | Valid Font Awesome `<i>` tag (e.g., `<i class="fa-light fa-bars"></i>`) |

## Notes
- The `<custom-nav>` component uses the light DOM (sets `innerHTML`) to render a `<nav>` element with a toggle button and a list of navigation links.
- The `nav` attribute must be a valid JSON string containing an array of objects with `href` and `text` properties. If `href` is empty, the link is marked with `aria-disabled="true"`.
- The navigation toggle button (hamburger menu) is interactive and toggles the visibility of the `<ul>` element with `id="nav-menu"` by updating its `display` style and the button's `aria-expanded` attribute.
- Invalid `nav-position` values trigger a console warning and are ignored, with no alignment class applied.
- The `nav-backdrop-filter` attribute integrates with `BACKDROP_FILTER_MAP` from `custom-block.js` to apply backdrop filter styles, with non-backdrop classes added to the navigation's class list and backdrop-specific styles applied inline.
- The component automatically upgrades existing `<custom-nav>` elements in the DOM using `customElements.upgrade()` to ensure compatibility.
- The navigation menu is wrapped in a container div with classes and styles applied via `nav-container-class` and `nav-container-style`.
- The toggle button includes accessibility attributes (`aria-controls`, `aria-expanded`, `aria-label`) to ensure proper screen reader support.
- If `nav` is not provided or is invalid, the `<ul>` element will be empty, but the toggle button and navigation structure are still rendered.
# Custom Header Documentation

The `<custom-header>` is a Web Component that extends the `CustomBlock` base class to create a customizable header with support for a logo (`custom-logo`) and navigation (`custom-nav`). It provides attributes to control the positioning, styling, and behavior of the header, including sticky positioning, logo placement, and navigation alignment. Below is a detailed explanation of all attributes, grouped into General Attributes, presented in alphabetical order.

## General Attributes

| Attribute Name | Description | Default Value | Expected Format |
|----------------|-------------|---------------|-----------------|
| background-color | Sets the background color of the header using a predefined class (inherited from `CustomBlock`). | `''` (empty) | `background-color-[number]` (e.g., `background-color-1`) |
| border | Sets the border style for the header (inherited from `CustomBlock`). | `''` (empty) | CSS class name (e.g., `border-small`) |
| border-radius | Sets the border radius for the header, requires `border` to be set (inherited from `CustomBlock`). | `''` (empty) | CSS class name (e.g., `border-radius-small`) |
| logo-placement | Determines whether the logo is placed independently or within the navigation container. | `'independent'` | One of: `independent`, `nav` |
| nav-alignment | Controls the alignment of the navigation within the header. | `'center'` | One of: `center`, `top`, `bottom`, `left`, `right`, `top-left`, `top-center`, `top-right`, `bottom-left`, `bottom-center`, `bottom-right`, `center-left`, `center-right` |
| nav-logo-container-class | Adds custom CSS classes to the container div for logo and navigation when `logo-placement` is `nav`. | `''` (empty) | Space-separated class names (e.g., `nav-logo-custom nav-style`) |
| nav-logo-container-style | Applies inline CSS styles to the container div for logo and navigation when `logo-placement` is `nav`. | `''` (empty) | CSS style string (e.g., `padding: 10px; z-index: 3;`) |
| shadow | Applies a shadow effect to the header (inherited from `CustomBlock`). | `''` (empty) | One of: `shadow-light`, `shadow-medium`, `shadow-heavy` |
| sticky | Makes the header sticky at the top of the viewport when present. | Not set (false) | Boolean attribute (presence indicates `true`) |

## Notes
- The `<custom-header>` component requires `<custom-logo>` and `<custom-nav>` components to be defined for proper rendering of logo and navigation elements. If either is not defined, a placeholder div with a warning message is rendered instead.
- When `logo-placement` is set to `nav`, the logo and navigation are wrapped in a single container div, with styles and classes applied via `nav-logo-container-style` and `nav-logo-container-class`.
- The `sticky` attribute sets the header's CSS position to `sticky` with `top: 0` and `z-index: 1000` for visibility above other content.
- Invalid values for `nav-alignment` or `logo-placement` trigger console warnings and fallback to default values (`center` for `nav-alignment`, `independent` for `logo-placement`).
- The component dynamically upgrades `<custom-logo>` and `<custom-nav>` elements using `customElements.upgrade()` to ensure proper rendering.
- All inherited attributes from `CustomBlock` (e.g., `background-color`, `border`, `border-radius`, `shadow`) are available and applied to the header's outer element.
# Custom Header Documentation

The `<custom-header>` is a Web Component that extends the `CustomBlock` base class to create a highly customizable header with support for a logo (`<custom-logo>`) and navigation (`<custom-nav>`). It provides fine-grained control over positioning, backdrop effects, logo placement, and navigation alignment. Below is a detailed explanation of all attributes, grouped into **General Attributes**, presented in alphabetical order.

## General Attributes

| Attribute Name | Description | Default Value | Expected Format |
|----------------|-------------|---------------|-----------------|
| **backdrop-filter** | Applies a backdrop filter effect (e.g., blur) to the header background. Uses predefined mapping from `shared.js`. | `''` (none) | One of: `blur-sm`, `blur-md`, `blur-lg`, `blur-xl` (or any key in `BACKDROP_FILTER_MAP`) |
| **background-color** | Sets the background color of the header using a predefined class (inherited from `CustomBlock`). | `''` (empty) | `background-color-[number]` (e.g., `background-color-1`) |
| **border** | Sets the border style for the header (inherited from `CustomBlock`). | `''` (empty) | CSS class name (e.g., `border-small`) |
| **border-radius** | Sets the border radius for the header; requires `border` to be set (inherited from `CustomBlock`). | `''` (empty) | CSS class name (e.g., `border-radius-small`) |
| **logo-placement** | Determines whether the logo is rendered independently or inside the navigation container. | `'independent'` | One of: `independent`, `nav` |
| **nav-alignment** | Controls the alignment of the navigation within its container when `logo-placement="nav"`. Uses `VALID_ALIGN_MAP` for CSS grid placement. | `'center'` | One of: `center`, `top`, `bottom`, `left`, `right`, `top-left`, `top-center`, `top-right`, `bottom-left`, `bottom-center`, `bottom-right`, `center-left`, `center-right` |
| **nav-logo-container-class** | Adds custom CSS classes to the wrapper `<div>` that contains both logo and nav when `logo-placement="nav"`. | `''` (empty) | Space-separated class names (e.g., `my-header-container gap-4`) |
| **nav-logo-container-style** | Applies inline styles to the wrapper `<div>` when `logo-placement="nav"`. Automatically includes `z-index: 2`. | `''` (empty) | Valid CSS (e.g., `padding: 1rem; gap: 2rem;`) |
| **position** | Controls the CSS positioning of the header. Replaces the deprecated `sticky` attribute. | `null` (static/none) | One of: `sticky-top`, `sticky-bottom`, `absolute`, `fixed` |
| **shadow** | Applies a shadow effect to the header (inherited from `CustomBlock`). | `''` (empty) | One of: `shadow-light`, `shadow-medium`, `shadow-heavy` |

> **Note**: The `sticky` attribute is **deprecated and no longer supported**. Use `position="sticky-top"` or `position="sticky-bottom"` instead.

---

## Key Features & Behavior

### Positioning (`position`)
- **`sticky-top`**: Header sticks to the top of the viewport as the user scrolls.
- **`sticky-bottom`**: Header sticks to the bottom of the viewport.
- **`fixed`**: Header remains fixed in the viewport (does not scroll).
- **`absolute`**: Positioned absolutely within its nearest positioned ancestor.
- Invalid values are ignored with a warning; falls back to normal document flow.

### Backdrop Filter
- Applied via `backdrop-filter` attribute.
- Value must match a key in `BACKDROP_FILTER_MAP` (e.g., `blur-md` → `blur(8px)`).
- Invalid values are cleared with a console warning.

### Logo & Navigation Integration
- **Independent Mode** (`logo-placement="independent"`):  
  Logo and nav are rendered separately in sequence.
- **Nav-Integrated Mode** (`logo-placement="nav"`):  
  Logo and nav are wrapped in a shared container with:
  - Custom classes via `nav-logo-container-class`
  - Custom styles via `nav-logo-container-style`
  - Navigation aligned using `nav-alignment` (mapped via `VALID_ALIGN_MAP`)
  - Responsive override: logo centered on mobile (`max-width: 1023px`)

### Content Handling
- If any content attributes are present (`heading`, `sub-heading`, `text`, `button-text`, `icon`), the base `CustomBlock` content is preserved **below** the logo/nav.
- The `aria-live="polite"` region is styled as `display: grid` when content exists.
- `text-align-*` classes are converted to `place-self-*` for better grid alignment.

### Rendering & Caching
- Uses **render caching** based on a hash of all critical attributes.
- Re-renders on any `observedAttributes` change.
- Fallback rendering ensures a valid `<header>` element even if `super.render()` fails.

### Validation & Debugging
- Invalid attribute values trigger **colored console warnings** (orange) with stack traces in debug mode.
- Errors during child rendering (`custom-logo`, `custom-nav`) are caught and replaced with error placeholders.
- Debug mode enabled via URL: `/dev/` or `?debug=true`

---

## Notes
- Requires `<custom-logo>` and `<custom-nav>` to be **defined** before use. Undefined components result in error placeholders.
- Uses `customElements.upgrade()` to ensure child components are initialized.
- All inherited `CustomBlock` attributes (background, border, effects, etc.) are fully supported.
- The component sets `role="banner"` on the root `<header>` for accessibility.
- Caching is cleared on `disconnectedCallback` to prevent memory leaks.

---

## Example Usage

```html
<custom-header 
    position="sticky-top"
    backdrop-filter="blur-md"
    logo-placement="nav"
    nav-alignment="center"
    nav-logo-container-class="px-6 py-4"
    nav-logo-container-style="background: rgba(255,255,255,0.1);">
    
    <custom-logo src="logo.svg" alt="My Brand"></custom-logo>
    <custom-nav>
        <a href="/">Home</a>
        <a href="/about">About</a>
    </custom-nav>

    <h1 slot="heading">Welcome</h1>
    <p slot="text">This is a sticky header with blur backdrop.</p>
</custom-header>
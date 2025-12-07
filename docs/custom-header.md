# Custom Header (<custom-header>)

The `<custom-header>` is a Web Component that extends the `CustomBlock` base class to create a highly customizable header with support for a logo (`<custom-logo>`) and navigation (`<custom-nav>`). It provides fine-grained control over positioning, backdrop effects, logo placement, and navigation alignment.

## Features

* **🧩 Extensible:** Inherits all styling capabilities (backgrounds, borders, shadows) from `CustomBlock`.
* **📍 Positioning:** Supports `sticky`, `fixed`, and `absolute` positioning.
* **🌫️ Glassmorphism:** Native support for `backdrop-filter` blur effects.
* **📐 Flexible Layouts:** Choose between independent logo/nav rendering or a unified container with grid alignment.
* **📱 Responsive Defaults:** Automatically handles mobile logo centering when using integrated layouts.

---

## 1. Setup & Usage

### Requirements
1.  Import the component file.
2.  Ensure `CustomBlock`, `CustomLogo`, and `CustomNav` are imported and defined.
3.  Ensure `shared.js` maps are available.

### Basic Example
```html
<custom-header 
    position="sticky-top"
    backdrop-filter="blur-md"
    background-color="background-color-1"
    shadow="shadow-light">
    
    <custom-logo src="/logo.svg" alt="Brand"></custom-logo>
    
    <custom-nav>
        <a href="/">Home</a>
        <a href="/products">Products</a>
    </custom-nav>
</custom-header>
```

---

## 2. Configuration Attributes

### General Attributes

| Attribute Name | Description | Default Value | Expected Format |
|----------------|-------------|---------------|-----------------|
| **position** | Controls CSS positioning. | `null` (static) | `sticky-top`, `sticky-bottom`, `absolute`, `fixed` |
| **backdrop-filter** | Applies a blur effect to the background. | `''` | `blur-sm`, `blur-md`, `blur-lg`, `blur-xl` |
| **logo-placement** | Layout strategy for logo and nav. | `'independent'` | `independent`, `nav` |
| **nav-alignment** | Alignment of nav within container (only if `logo-placement="nav"`). | `'center'` | `center`, `left`, `right`, `top-center`, etc. |
| **nav-logo-container-class** | CSS classes for the wrapper div (only if `logo-placement="nav"`). | `''` | Space-separated classes |
| **nav-logo-container-style** | Inline styles for the wrapper div (only if `logo-placement="nav"`). | `''` | CSS string |

### Inherited Attributes (from CustomBlock)
Since this extends `CustomBlock`, you can also use:
* `background-color`, `background-gradient`, `background-image-noise`
* `border`, `border-radius`, `shadow`
* `heading`, `text`, `button-text` (Content appears *below* the nav/logo)

> **Note**: The `sticky` attribute is **deprecated**. Use `position="sticky-top"` instead.

---

## 3. Key Features & Behavior

### Positioning logic
* **`sticky-top` / `sticky-bottom`**: Uses CSS `position: sticky`. Requires a parent container with defined height/overflow to work correctly in some contexts.
* **`fixed`**: Fixes header relative to the viewport.
* **`absolute`**: Absolute positioning relative to the nearest positioned ancestor.

### Logo & Navigation Integration
* **Independent Mode (`independent`)**: The `<custom-logo>` is rendered first, followed immediately by `<custom-nav>`. They are siblings in the DOM.
* **Integrated Mode (`nav`)**: Both components are wrapped in a shared `<div>`.
    * This wrapper receives `z-index: 2` automatically.
    * This mode enables the `nav-alignment` attribute to control the grid placement of the navigation relative to the logo.

### Content Injection
If you provide `CustomBlock` content attributes (like `heading="Welcome"`), this content is rendered **after** the navigation elements. The internal layout engine switches the content container to `display: grid` and converts text-alignment classes to `place-self` properties to ensure proper centering.

---

## 4. Styling Reference (Internals)



Understanding the internal structure helps when applying custom CSS.

### 🏗️ Structural Hierarchy

1.  **Root Element (`header`)**
    * **Role:** `banner`
    * **Classes:** Receives `position-*`, `background-color-*`, `shadow-*`, etc.
    * **Styles:** Receives the `backdrop-filter` inline style.

2.  **Logo/Nav Container (Conditional)**
    * *Only exists if `logo-placement="nav"`*
    * **Style:** `z-index: 2` is forced inline.
    * **Classes:** Receives `nav-logo-container-class`.

3.  **Content Container (`div[aria-live="polite"]`)**
    * *Only exists if text/heading attributes are present.*
    * **Style:** `display: grid` is applied via JS to handle content alignment.
    * **Classes:** Content alignment classes (`text-align-center`) are converted to Grid alignment (`place-self-center`).

### 📱 Injected Styles (Mobile Override)
When using `logo-placement="nav"`, the component injects an internal `<style>` block:

```css
@media (max-width: 1023px) {
    .logo-container {
        place-self: center !important;
    }
}
```
This ensures that on mobile devices (Tablet Portrait and below), the logo is forced to the center regardless of the desktop alignment settings.

---

## 5. Troubleshooting

* **Sticky positioning not working?**
    Ensure the parent container of `<custom-header>` does not have `overflow: hidden` or `overflow: auto`, as this breaks sticky behavior.
* **Nav overlapping Logo?**
    If using `logo-placement="independent"`, they are block-level siblings. Switch to `logo-placement="nav"` to manage them in a unified flex/grid context, or use `nav-logo-container-class="d-flex"` to align them manually.
* **Missing Child Components?**
    If the header renders "Error rendering logo" or "Error rendering nav", ensure that `<custom-logo>` and `<custom-nav>` are imported and defined in your JavaScript bundle *before* the header tries to render.
* **Z-Index Issues?**
    When `logo-placement="nav"` is used, the container is set to `z-index: 2`. If you need the background content (like a video in `CustomBlock`) to be above the nav, you will need to override this via `nav-logo-container-style`.
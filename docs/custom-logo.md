# Custom Logo (<custom-logo>)

The `<custom-logo>` is a Web Component designed to display a customizable logo with support for **responsive breakpoints** and **light/dark mode switching** using the `<picture>` element and `prefers-color-scheme`. It supports **two logo variants**:
- **Full logo** (default for larger screens)
- **Icon logo** (used below a configurable breakpoint)

The component **does not** use `generatePictureMarkup` from `image-generator.js` — instead, it **generates the `<picture>` markup internally** with full control over media queries, fallbacks, and accessibility.

---

## 1. Logo Attributes

All attributes are **prefixed** and grouped into **full logo**, **icon logo**, and **layout** controls.

### Full Logo (Default / Large Screens)

| Attribute Name | Description | Default Value | Expected Format |
|----------------|-------------|---------------|-----------------|
| `logo-full-primary-src` | Default full logo image (used when no light/dark variants are provided). | `''` | Valid image URL (e.g., `/assets/logo-full.svg`) |
| `logo-full-light-src` | Full logo for **light mode**. Must be paired with `logo-full-dark-src`. | `''` | Valid image URL |
| `logo-full-dark-src` | Full logo for **dark mode**. Must be paired with `logo-full-light-src`. | `''` | Valid image URL |
| `logo-full-primary-alt` | Alt text for the primary full logo. Required if `logo-full-primary-src` is used and logo is not decorative. | `''` | Plain text |
| `logo-full-light-alt` | Alt text for light mode full logo. Required with `logo-full-light-src`. | `''` | Plain text |
| `logo-full-dark-alt` | Alt text for dark mode full logo. Required with `logo-full-dark-src`. | `''` | Plain text |
| `logo-full-position` | Alignment of the full logo within its container. | `center` | One of: `center`, `top`, `bottom`, `left`, `right`, `top-left`, `top-center`, `top-right`, `bottom-left`, `bottom-center`, `bottom-right`, `center-left`, `center-right` |

### Icon Logo (Small Screens)

| Attribute Name | Description | Default Value | Expected Format |
|----------------|-------------|---------------|-----------------|
| `logo-icon-primary-src` | Default icon logo (used when no light/dark variants are provided). | `''` | Valid image URL (e.g., `/assets/logo-icon.svg`) |
| `logo-icon-light-src` | Icon logo for **light mode**. Must be paired with `logo-icon-dark-src`. | `''` | Valid image URL |
| `logo-icon-dark-src` | Icon logo for **dark mode**. Must be paired with `logo-icon-light-src`. | `''` | Valid image URL |
| `logo-icon-primary-alt` | Alt text for primary icon logo. Required if `logo-icon-primary-src` is used and not decorative. | `''` | Plain text |
| `logo-icon-light-alt` | Alt text for light mode icon. Required with `logo-icon-light-src`. | `''` | Plain text |
| `logo-icon-dark-alt` | Alt text for dark mode icon. Required with `logo-icon-dark-src`. | `''` | Plain text |
| `logo-icon-position` | Alignment of the **icon logo** on small screens. | `center` | Same as `logo-full-position` |

### Layout & Behavior

| Attribute Name | Description | Default Value | Expected Format |
|----------------|-------------|---------------|-----------------|
| `logo-breakpoint` | Screen width (in pixels) **below which the icon logo is shown**. | `''` (no breakpoint) | Positive integer (e.g., `768`) |
| `logo-height` | Fixed height for the logo (applies to `<img>`). | `''` | CSS length (e.g., `40px`, `2.5rem`, `10vh`) |

---

## 2. Key Features

### Responsive Breakpoint Switching
- If `logo-breakpoint="768"` and `logo-icon-*` sources are provided:
  - **Below 768px**: Uses **icon logo** with `logo-icon-position`
  - **768px and above**: Uses **full logo** with `logo-full-position`

### Light/Dark Mode Support
- Uses `prefers-color-scheme` media queries.
- Supports **paired** light/dark sources:
  - `logo-full-light-src` + `logo-full-dark-src`
  - `logo-icon-light-src` + `logo-icon-dark-src`
- Falls back to `*-primary-src` if light/dark pair is incomplete.

### Accessibility
- **Decorative logos**: If **all alt attributes are empty**, `alt=""` and `role="presentation"` are applied.
- **Required alt text**:
  - `logo-full-primary-alt` required if `logo-full-primary-src` is used
  - Both `logo-full-light-alt` and `logo-full-dark-alt` required if light/dark pair is used
  - Same rules apply to icon variants

### Performance
- Uses `IntersectionObserver` to defer initialization until visible.
- `loading="lazy"` and `fetchpriority="high"` on `<img>`.
- `onerror` fallback to placeholder (`placehold.co/300x40`).

---

## 3. Styling Reference (Internals)



The component generates a specific DOM structure to handle the responsive image switching and positioning.

### 🏗️ Structural Hierarchy

1.  **Container (`div.logo-container`)**
    * **Purpose:** Handles alignment within the host element.
    * **Classes:** Receives utility classes based on `logo-full-position` (e.g., `place-self-center`).
    * **Dynamic Styles:** If a breakpoint is defined, the component injects an internal `<style>` block to forcefully change the alignment of this container on mobile screens based on `logo-icon-position`.

2.  **Anchor (`a`)**
    * **Purpose:** Links the logo to the homepage (`/`).
    * **Note:** The href is currently hardcoded to `/`.

3.  **Picture Element (`picture`)**
    * **Purpose:** logic container for source switching.
    * **Internals:** Contains multiple `<source>` tags for media queries (breakpoints and color schemes).

4.  **Image (`img`)**
    * **Purpose:** The visible element.
    * **Style:** Receives the `height` from `logo-height` inline (e.g., `style="height: 40px;"`).

### ⚠️ Important Styling Notes

* **Height Control:** Use the `logo-height` attribute rather than external CSS to ensure the height is applied directly to the image element across all responsive states.
* **Positioning:** The component uses Grid alignment logic (`place-self-*`). Ensure the parent of `<custom-logo>` allows for this positioning if you are encountering layout issues.

---

## 4. Example Usage

```html
<custom-logo
  logo-full-primary-src="/assets/logo-full.svg"
  logo-full-primary-alt="My Company"
  logo-icon-primary-src="/assets/logo-icon.svg"
  logo-icon-primary-alt="My Company"
  logo-breakpoint="640"
  logo-height="40px"
  logo-full-position="center"
  logo-icon-position="center-left">
</custom-logo>
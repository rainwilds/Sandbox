# Custom Slider Documentation

The `<custom-slider>` is a **Web Component** that creates a fully-featured, responsive, touch-enabled, and accessible image/content slider with **breakpoint-specific slides-per-view**, **infinite scrolling**, **cross-fade**, **autoplay (interval or continuous)**, **navigation arrows**, **pagination dots**, **drag/swipe**, **gap support**, **pause-on-hover**, and **lazy initialization**. It uses `IntersectionObserver` for performance, validates all inputs (including icons), and includes extensive debugging.

---

## Key Features

- **Lazy initialization** via `IntersectionObserver` (50px root margin)
- **Responsive slides-per-view** using breakpoint attributes or fallback default
- **Infinite scrolling** with seamless buffer cloning and loop animation
- **Cross-fade mode** (only for `slides-per-view=1`)
- **Autoplay**:
  - `interval` (e.g., `3s`, `500ms`)
  - `continuous` (smooth scrolling at `Npx/s`)
- **Navigation arrows** with stacked icon support
- **Pagination dots** with active/inactive icons and size control
- **Drag/swipe support** (mouse + touch)
- **Gap between slides** (CSS `column-gap`)
- **Pause on hover**
- **Dynamic resize handling** with debounced recalculations
- **Input sanitization & validation** (icons, URLs, numbers)
- **Debug mode** (`?debug=true` in URL) with colored console logs
- **Attribute change detection** with full reinitialization
- **No external dependencies** (uses native Web APIs)

---

## Slider Attributes

| Attribute Name | Description | Default Value | Expected Format |
|----------------|-------------|---------------|-----------------|
| `slides-per-view` | Default number of slides visible per view. Required if not using breakpoint attributes. | `1` | Integer ≥ 1 |
| `slides-per-view-mobile` | Slides visible on **mobile** (`≤ 480px`) | — | Integer ≥ 1 |
| `slides-per-view-tablet` | Slides visible on **tablet** (`481–768px`) | — | Integer ≥ 1 |
| `slides-per-view-laptop` | Slides visible on **laptop** (`769–1024px`) | — | Integer ≥ 1 |
| `slides-per-view-desktop` | Slides visible on **desktop** (`1025–1440px`) | — | Integer ≥ 1 |
| `slides-per-view-large` | Slides visible on **large** (`> 1440px`) | — | Integer ≥ 1 |
| `autoplay` | Enables autoplay. | — | `Ns`, `Nms`, `continuous`, `continuous Npx/s` |
| `navigation` | Shows prev/next arrows. | — | Boolean (presence = `true`) |
| `navigation-icon-left` | Left arrow icon. | `'<i class="fa-chisel fa-regular fa-angle-left"></i>'` | Valid FA `<i>` tag |
| `navigation-icon-right` | Right arrow icon. | `'<i class="fa-chisel fa-regular fa-angle-right"></i>'` | Valid FA `<i>` tag |
| `navigation-icon-left-background` | Background icon for left arrow (stacked). | `''` | Valid FA `<i>` tag |
| `navigation-icon-right-background` | Background icon for right arrow (stacked). | `''` | Valid FA `<i>` tag |
| `navigation-icon-size` | Font size for nav icons. | `''` | `Npx`, `Nrem`, `var(--name)` (1 or 2 values) |
| `pagination` | Shows pagination dots. | — | Boolean |
| `pagination-icon-active` | Active dot icon. | `'<i class="fa-solid fa-circle"></i>'` | Valid FA `<i>` tag |
| `pagination-icon-inactive` | Inactive dot icon. | `'<i class="fa-regular fa-circle"></i>'` | Valid FA `<i>` tag |
| `pagination-icon-size` | Font size for pagination icons. | `''` | `Npx`, `Nrem` (1 value only) |
| `gap` | Gap between slides. | `'0'` | CSS length: `1rem`, `16px` |
| `cross-fade` | Enables cross-fade transition (only for `slides-per-view=1`). | — | Boolean |
| `infinite-scrolling` | Enables infinite loop. | — | Boolean |
| `pause-on-hover` | Pauses autoplay on hover. | — | Boolean |
| `draggable` | Enables drag/swipe. | — | Boolean |

---

## Breakpoint System

- Uses `VIEWPORT_BREAKPOINTS` from `shared.js`
- **All breakpoint attributes must be present** or none (strict validation)
- Fallback: `slides-per-view` if breakpoints invalid or missing
- Recalculates on `resize` with debounced handler

```js
// Example: shared.js
export const VIEWPORT_BREAKPOINTS = [
  { name: 'mobile', maxWidth: 480 },
  { name: 'tablet', maxWidth: 768 },
  { name: 'laptop', maxWidth: 1024 },
  { name: 'desktop', maxWidth: 1440 },
  { name: 'large', maxWidth: Infinity }
];
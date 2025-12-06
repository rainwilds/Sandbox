# Custom Slider (<custom-slider>)

The `<custom-slider>` is a high-performance, zero-dependency Web Component designed for responsiveness and flexibility. It features lazy initialization, touch-enabled dragging, infinite scrolling, and extensive configuration options for navigation and pagination.

## Features

* **⚡ Lazy Initialization:** Uses `IntersectionObserver` to load only when in the viewport.
* **📱 Fully Responsive:** Define specific `slides-per-view` for Mobile, Tablet, Laptop, Desktop, and Large screens.
* **🔄 Infinite Scrolling:** Seamless looping with DOM buffer management.
* **▶️ Advanced Autoplay:** Supports standard interval (e.g., "3s") or smooth continuous scrolling (e.g., "continuous 100px/s").
* **🖱️ Interactive:** Touch/Swipe support (`draggable`) and `pause-on-hover` functionality.
* **🎨 Custom UI:** Stacked navigation icons (background + foreground), custom pagination icons, and positioning.
* **🛠️ Debug Mode:** URL-based debugging (`?debug=true`) for developer insights.

---

## 1. Setup & HTML Structure

### Requirements
1.  Import the component class.
2.  Ensure `VIEWPORT_BREAKPOINTS` is defined in `../shared.js`.
3.  **Crucial:** Immediate children must be `<custom-block>` elements OR have the class `.block`.

### Basic Example
```html
<custom-slider 
    slides-per-view="3" 
    gap="20px" 
    draggable
    navigation
    pagination>
    
    <div class="block">Slide 1</div>
    <div class="block">Slide 2</div>
    <div class="block">Slide 3</div>
    <div class="block">Slide 4</div>
</custom-slider>
```

---

## 2. Configuration Attributes

### 📐 Layout & Responsiveness

| Attribute | Description | Default | Format |
| :--- | :--- | :--- | :--- |
| `slides-per-view` | **Required** (if no breakpoints). Base number of slides visible. | `1` | Integer ≥ 1 |
| `gap` | Space between slides. | `0` | CSS length (e.g., `20px`, `1rem`) |
| `cross-fade` | Fades slides instead of sliding. **Only works if `slides-per-view="1"`.** | — | Boolean |
| `infinite-scrolling` | Enables seamless looping of slides. | — | Boolean |
| `draggable` | Enables mouse/touch dragging. | — | Boolean |

#### Breakpoint Attributes
To use breakpoints, **you must define ALL of the following attributes**. If one is missing, the slider falls back to the standard `slides-per-view`.

| Attribute | Viewport Range (approx) |
| :--- | :--- |
| `slides-per-view-mobile` | ≤ 480px |
| `slides-per-view-tablet` | 481px – 768px |
| `slides-per-view-laptop` | 769px – 1024px |
| `slides-per-view-desktop` | 1025px – 1440px |
| `slides-per-view-large` | > 1440px |

---

### ▶️ Autoplay

| Attribute | Description | Format Examples |
| :--- | :--- | :--- |
| `autoplay` | Controls auto-scrolling behavior. | **Interval:** `3s`, `3000ms`<br>**Continuous:** `continuous`, `continuous 50px/s` |
| `pause-on-hover` | Pauses autoplay when mouse hovers over slider. | Boolean |

> **Note:** Continuous autoplay is automatically disabled if `cross-fade` is active.

---

### 🧭 Navigation (Arrows)

Requires `navigation` attribute to be present.

| Attribute | Description | Default |
| :--- | :--- | :--- |
| `navigation` | Enables previous/next arrows. | — |
| `navigation-icon-left` | HTML/Icon for the Left arrow. | `<i class="fa-regular fa-angle-left"></i>` |
| `navigation-icon-right` | HTML/Icon for the Right arrow. | `<i class="fa-regular fa-angle-right"></i>` |
| `navigation-icon-size` | CSS Font size for icons. Supports 1 value (unified) or 2 values (background foreground). | e.g., `2rem` or `2rem 1rem` |

#### Stacked Icons (Advanced)
You can create "stacked" icons (e.g., a circle background with an arrow inside) by providing background attributes.

* `navigation-icon-left-background`
* `navigation-icon-right-background`

---

### ⚪ Pagination (Dots)

Requires `pagination` attribute to be present.

| Attribute | Description | Default |
| :--- | :--- | :--- |
| `pagination` | Enables pagination dots. | — |
| `pagination-position` | Position of dots relative to slides. | `overlay` OR `below` |
| `pagination-icon-active` | Icon for the current slide. | `<i class="fa-solid fa-circle"></i>` |
| `pagination-icon-inactive` | Icon for other slides. | `<i class="fa-regular fa-circle"></i>` |
| `pagination-icon-size` | Size of the dots (active/inactive). | e.g., `12px` or `12px 10px` |

---

## 3. Advanced Configuration Example

Here is a complex setup using continuous scrolling, stacked navigation icons, and full breakpoint control.

```html
<custom-slider
    id="hero-slider"
    
    infinite-scrolling
    draggable
    pause-on-hover
    autoplay="continuous 80px/s"
    
    slides-per-view-mobile="1"
    slides-per-view-tablet="2"
    slides-per-view-laptop="3"
    slides-per-view-desktop="4"
    slides-per-view-large="5"
    gap="1.5rem"

    navigation
    navigation-icon-size="3rem 1.2rem"
    navigation-icon-left="<i class='fa-solid fa-chevron-left'></i>"
    navigation-icon-left-background="<i class='fa-solid fa-circle'></i>"
    navigation-icon-right="<i class='fa-solid fa-chevron-right'></i>"
    navigation-icon-right-background="<i class='fa-solid fa-circle'></i>"

    pagination
    pagination-position="below"
    pagination-icon-active="<i class='fa-solid fa-square'></i>"
    pagination-icon-inactive="<i class='fa-regular fa-square'></i>">

    <custom-block>Content A</custom-block>
    <custom-block>Content B</custom-block>
    <custom-block>Content C</custom-block>
    <custom-block>Content D</custom-block>
    <custom-block>Content E</custom-block>

</custom-slider>
```

## 4. Troubleshooting

* **Slides not appearing?**
    Ensure your child elements are either `<custom-block>` tags or `div`s with the class `block`.
* **Breakpoints not working?**
    The component enforces strict validation. If you use responsive attributes, you must define **all 5** (`mobile` through `large`). If one is missing, it reverts to the default `slides-per-view`.
* **Icons missing?**
    The component validates FontAwesome classes. Ensure your strings contain valid classes (e.g., `fa-solid`, `fa-regular`).
* **Debug Mode:**
    Append `?debug=true` to your URL (e.g., `localhost:8080/page?debug=true`) to see detailed logs in the browser console regarding initialization, attribute validation, and calculation logic.
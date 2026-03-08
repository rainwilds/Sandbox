<style>
    /* 1. Force all standard body text to be pure black */
    body, p, li, h1, h2, h3, h4, h5, h6, table, th, td {
        color: #000000 !important;
    }

    /* 2. Force the code blocks background to be white (optional, saves ink) */
    code, pre {
        background-color: #ffffff !important;
        border: 1px solid #cccccc !important; /* Adds a nice border instead of a grey box */
    }

    /* 3. The "Nuclear" Option: Force EVERY distinct part of the code to be black. 
       Syntax highlighters wrap keywords in <span> tags. We must target them. */
    code, pre, code *, pre * {
        color: #000000 !important;
        font-weight: 600 !important; /* Semi-bold for readability */
        text-shadow: none !important;
    }

    /* 4. Keep comments distinctive but readable (Dark Grey + Italic) */
    .hljs-comment, span.hljs-comment {
        color: #444444 !important; 
        font-style: italic !important;
        font-weight: normal !important; /* Make comments thinner than code */
    }
</style>

# Custom Slider (`<custom-slider>`)

The `<custom-slider>` is an advanced, fully responsive Web Component for creating carousels and slideshows. It is engineered to handle multiple slides per view, responsive breakpoints, infinite scrolling, customizable navigation/pagination (via Font Awesome icons), touch/pointer dragging, and multiple autoplay modes.

## Features

* **👁️ Lazy Loading:** Defers rendering and initialization until the slider is within 50px of the viewport using `IntersectionObserver`.
* **📱 Responsive Art Direction:** Define different `slides-per-view` counts for various breakpoints (mobile, tablet, laptop, desktop, large).
* **🔄 Playback Options:** Supports standard interval-based autoplay, smooth continuous scrolling, and cross-fade effects.
* **🖱️ Interactive:** Includes touch/pointer drag support (`draggable`) and hover-to-pause functionality (`pause-on-hover`).
* **♾️ Infinite Looping:** Clones slides to create a seamless infinite scrolling experience (`infinite-scrolling`).
* **🎨 Highly Customizable:** Detailed control over navigation arrows, pagination dots, gap spacing, and icon sizes (including stacked background icons).

---

## 1. Setup & Usage

### Requirements
1.  Import the `custom-slider.js` component file into your bundle.
2.  Ensure `VIEWPORT_BREAKPOINTS` is exported from your `../shared.js` utility (required for responsive features).
3.  Ensure `../config.js` provides `basePath` if needed (though primarily used for internal routing/fallback logic).
4.  *Font Awesome* must be loaded on the page if using the default icon classes.

### Basic Example (Single Slide Carousel)
```html
<custom-slider 
    slides-per-view="1" 
    autoplay="5s" 
    navigation 
    pagination>
    
    <custom-block heading="Slide 1" background-color="blue"></custom-block>
    <custom-block heading="Slide 2" background-color="red"></custom-block>
    <custom-block heading="Slide 3" background-color="green"></custom-block>
</custom-slider>
```

### Advanced Example (Responsive Multi-Slide)
```html
<custom-slider 
    slides-per-view-mobile="1"
    slides-per-view-tablet="2"
    slides-per-view-desktop="4"
    slides-per-view-large="5"
    gap="1.5rem"
    draggable
    infinite-scrolling
    pause-on-hover
    navigation
    navigation-icon-size="2rem 1.5rem"
    navigation-icon-left="<i class='fa-solid fa-arrow-left'></i>"
    navigation-icon-left-background="<i class='fa-solid fa-circle'></i>"
    pagination
    pagination-position="below">
    
    <div class="block">Card 1</div>
    <div class="block">Card 2</div>
    <div class="block">Card 3</div>
    <div class="block">Card 4</div>
    <div class="block">Card 5</div>
</custom-slider>
```

---

## 2. Configuration Attributes

### Layout & Responsiveness

| Attribute Name | Description | Default | Expected Format |
| :--- | :--- | :--- | :--- |
| **slides-per-view** | Fixed number of slides to show (used if breakpoints aren't provided). | `1` | Integer >= 1 |
| **slides-per-view-\*** | Breakpoint-specific counts. \(`-mobile`, `-tablet`, `-laptop`, `-desktop`, `-large`\). | `null` | Integer >= 1 |
| **gap** | Spacing between slides (no effect if `slides-per-view="1"`). | `'0'` | CSS Length (`px`, `rem`, etc.) |

> **Note on Breakpoints:** If you define *any* `slides-per-view-*` attribute, you **must** define all five (`mobile`, `tablet`, `laptop`, `desktop`, `large`). If validation fails, it falls back to the default `slides-per-view`.

### Playback & Interaction

| Attribute Name | Description | Default | Expected Format |
| :--- | :--- | :--- | :--- |
| **autoplay** | Defines playback behavior. | `none` | Empty (defaults 3s), `Ns`, `Nms`, `continuous`, `continuous Npx/s` |
| **draggable** | Enables touch/mouse swiping. | `false` | Boolean (presence of attribute) |
| **infinite-scrolling**| Enables seamless looping. | `false` | Boolean (presence of attribute) |
| **pause-on-hover** | Pauses autoplay when mouse is over the slider. | `false` | Boolean (presence of attribute) |
| **cross-fade** | Fades between slides instead of sliding (Requires `slides-per-view="1"`). | `false` | Boolean (presence of attribute) |

> **Note on Cross-Fade:** Cannot be used with `continuous` autoplay.

### Navigation (Arrows)

| Attribute Name | Description | Default | Expected Format |
| :--- | :--- | :--- | :--- |
| **navigation** | Enables prev/next arrows. | `false` | Boolean |
| **navigation-icon-left** | HTML markup for the left arrow. | FontAwesome Angle Left | `<i class="..."></i>` |
| **navigation-icon-right** | HTML markup for the right arrow. | FontAwesome Angle Right | `<i class="..."></i>` |
| **navigation-icon-\*-background** | HTML for a stacked background icon. | `''` | `<i class="..."></i>` |
| **navigation-icon-size** | Sets font-size for icons. Provide 1 value for flat icons, 2 values (`bg fg`) for stacked. | `''` | CSS Size (`rem`, `px`, etc.) |

### Pagination (Dots)

| Attribute Name | Description | Default | Expected Format |
| :--- | :--- | :--- | :--- |
| **pagination** | Enables dot indicators. | `false` | Boolean |
| **pagination-position** | Placement of the dots container. | `'overlay'` | `'overlay'` or `'below'` |
| **pagination-icon-active** | HTML for the active dot. | FontAwesome Solid Circle | `<i class="..."></i>` |
| **pagination-icon-inactive** | HTML for inactive dots. | FontAwesome Reg Circle | `<i class="..."></i>` |
| **pagination-icon-size** | Size of the dots. Can provide two values (`active inactive`). | `''` | CSS Size |

---

## 3. Key Features & Behavior

### 🚦 Rendering & Initialization
The slider clones its valid children (either `<custom-block>` elements or elements with the `.block` class) into a new internal DOM structure. The original children are discarded.

### ♾️ Infinite Scrolling Logic
When `infinite-scrolling` is active, the component clones a "buffer" of slides (equal to the current `slides-per-view`) and appends/prepends them to the start and end of the track. When the user scrolls past the original boundary, the slider instantly and invisibly resets the CSS `transform` back to the corresponding slide in the original set, creating a seamless loop.

### 🏃 Continuous Autoplay
Unlike interval autoplay (which snaps to specific slides), `continuous` uses `requestAnimationFrame` to smoothly translate the slider track pixel-by-pixel. 
* If `infinite-scrolling` is off, it will stop when it reaches the end. 
* If `infinite-scrolling` is on, it will loop forever.

### 📏 Resize Handling
The component listens to window `resize` events (debounced by 100ms) to recalculate dimensions, `gap` values, and re-evaluate `slides-per-view` based on the defined `VIEWPORT_BREAKPOINTS`. It dynamically rebuilds the infinite buffer if the `slides-per-view` count changes across breakpoints.

---

## 4. Troubleshooting

* **Slider is empty / "No slides available":**
    * Ensure the children elements you place inside `<custom-slider>` are either `<custom-block>` elements or standard HTML elements containing the class `block`. The component filters out anything else.
* **Breakpoints aren't working:**
    * Ensure all 5 breakpoint attributes are present if you use one.
    * Verify that `VIEWPORT_BREAKPOINTS` is correctly exported from `../shared.js` and is formatted as an array of objects with `name` and `maxWidth` properties.
* **Continuous Autoplay is ignoring my settings:**
    * `continuous` autoplay is incompatible with `cross-fade`. 
* **Navigation icons are missing:**
    * The component enforces strict validation on icon HTML. It *must* contain a valid Font Awesome class (starting with `fa-`, `fa-chisel`, `fa-utility`, etc.). If invalid HTML is passed, navigation will be disabled. 
* **How to debug layout math?**
    * Add `?debug=true` to your URL. The slider provides extremely verbose console logging detailing internal dimensions, translate calculations, pointer dragging physics, and index tracking.
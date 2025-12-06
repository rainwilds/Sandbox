# Custom Navigation (<custom-nav>)

The `<custom-nav>` is a smart, responsive Web Component that generates navigation menus. It supports **hybrid data sourcing** (local JSON or global config), **lazy initialization**, **input sanitization**, and **rendering caching**. It includes a built-in accessible mobile toggle and supports advanced styling like glassmorphism (backdrop filters).

## Features

* **⚡ Hybrid Data:** Define links inline via attributes OR fetch them automatically from a global configuration file.
* **📱 Responsive & Accessible:** Built-in hamburger menu logic with correct ARIA attributes (`aria-expanded`, `aria-controls`).
* **🛡️ Secure:** Auto-sanitizes HTML inputs and URLs to prevent XSS.
* **🎨 Styleable:** Supports inline CSS, utility classes, and specific hooks for container vs. inner nav styling.
* **🚀 Performance:** Uses `IntersectionObserver` to load only when visible and caches rendered HTML to prevent expensive repaints.

---

## 1. Setup & Usage

### Requirements
1.  Import the component class.
2.  Ensure `BACKDROP_FILTER_MAP` and `VALID_ALIGN_MAP` are defined in `../shared.js`.
3.  Ensure `getConfig()` is available in `../config.js` (if using Global Mode).

### Method A: Global Configuration (Simplest)
If you omit the `nav` attribute, the component fetches links from your global config based on `nav-type`.

```html
<custom-nav nav-type="header"></custom-nav>

<custom-nav nav-type="footer"></custom-nav>
```

### Method B: Local Data (Manual)
You can provide links directly using a JSON string.

```html
<custom-nav 
    nav='[{"text": "Home", "href": "/"}, {"text": "About", "href": "/about"}]'
    nav-position="right">
</custom-nav>
```

---

## 2. Configuration Attributes

### 🔗 Data & Source

| Attribute | Description | Default | Format |
| :--- | :--- | :--- | :--- |
| `nav` | **Local Mode:** JSON array of links. If omitted, Global Mode is active. | `null` | `[{"text":"Name","href":"/url"}]` |
| `nav-type` | **Global Mode:** Selects which config key to use. | `header` | `header` or `footer` |
| `nav-orientation` | Layout direction of the links. | `horizontal` | `horizontal` or `vertical` |

### 📐 Layout & Alignment

| Attribute | Description | Example Values |
| :--- | :--- | :--- |
| `nav-position` | Align within container. | `center`, `right`, `top-right`, `bottom-center` |
| `nav-container-class` | Classes for the outer wrapper `<div>`. | `container-fluid`, `wrapper` |
| `nav-container-style` | Inline style for the outer wrapper. | `padding: 2rem; width: 100%;` |
| `nav-class` | Classes for the `<nav>` element. | `navbar`, `my-custom-nav` |
| `nav-style` | Inline style for the `<nav>` element. | `border-bottom: 1px solid #ccc;` |

### 🎨 Visuals & Effects

| Attribute | Description | Default |
| :--- | :--- | :--- |
| `nav-background-color` | Sets the background color. | — |
| `nav-background-image-noise` | Adds a noise texture overlay. | Boolean |
| `nav-backdrop-filter` | CSS backdrop filters (Glassmorphism). | `backdrop-filter-blur-md` |
| `nav-border` | Utility classes for borders. | e.g., `border-bottom` |
| `nav-border-radius` | Utility classes for radius. | e.g., `rounded-lg` |

### 📱 Mobile Toggle

| Attribute | Description | Default |
| :--- | :--- | :--- |
| `nav-toggle-icon` | HTML for the mobile menu button. | `<i class="fa-solid fa-bars"></i>` |
| `nav-toggle-class` | Custom class for the toggle button. | — |

---

## 3. Technical Behavior

### Global Event Listeners
When in **Global Mode** (no `nav` attribute), the component listens for specific events on the `document` to trigger re-renders. This allows you to update the navigation dynamically without reloading the page.
* `header-navigation-updated`
* `footer-navigation-updated`

### Caching Strategy
The component hashes specific "Critical Attributes" (like `nav`, `nav-type`, `nav-class`, etc.). If `attributeChangedCallback` fires but the calculated hash matches the previous render, the component skips the expensive HTML generation step.

---
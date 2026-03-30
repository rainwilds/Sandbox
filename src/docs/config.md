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

# Configuration Loader (`config.js`)

The `config.js` module is the central state management and configuration pipeline for the entire design system. It handles fetching the global `setup.json` file, deeply merging it with fallback defaults, and providing both asynchronous and synchronous APIs for other components (like `image-generator`, `head-generator`, and `custom-block`) to access these settings.

## Features

* **🗄️ Multi-Layer Caching:** Implements both a local module cache (`cachedConfig`) and a global window cache (`window.__SETUP_CONFIG__`) to ensure the `setup.json` file is only fetched and parsed once.
* **⚡ Force-Cache Fetching:** Utilizes the `cache: 'force-cache'` directive in its `fetch` request to maximize performance by forcing the browser to use the HTTP cache if available.
* **🛡️ Deep Merging & Fallbacks:** Safely merges the fetched JSON with a robust `defaultSetup` object. If the fetch fails (e.g., a 404), the system automatically falls back to these defaults to prevent fatal application crashes.
* **⏱️ Sync & Async APIs:** Provides asynchronous promises for initial load situations, as well as synchronous functions for immediate data access later in the application lifecycle.

---

## 1. Setup & Usage

### Requirements
1.  Ensure you have a valid `./JSON/setup.json` file located at the root of your project. 
2.  Import the required helper functions into your JavaScript or Web Component file.

### Basic Example (Asynchronous)
```javascript
import { getConfig, getImagePrimaryPath } from '../config.js';

async function init() {
  // Fetches the full config object
  const config = await getConfig();
  console.log('Site Title:', config.general.title);

  // Gets a specific path helper
  const primaryDir = await getImagePrimaryPath();
  console.log('Primary images live in:', primaryDir);
}
init();
```

### Basic Example (Synchronous)
*Note: Synchronous methods should only be used after the application has fully initialized (e.g., after the `head-generator.js` has completed).*
```javascript
import { getSyncImageResponsivePath } from '../config.js';

function constructImagePath(filename) {
  const path = getSyncImageResponsivePath();
  return `${path}${filename}`;
}
```

---

## 2. API Reference

### Asynchronous Fetchers
These functions return a `Promise` resolving to their respective data sets.

| Function Name | Returns | Description |
| :--- | :--- | :--- |
| `getConfig()` | `Promise<Object>` | The core function. Returns the fully merged configuration object. |
| `getGeneralConfig()` | `Promise<Object>` | Returns the `general` sub-object (metadata, SEO, etc.). |
| `getBusinessInfo()` | `Promise<Object>` | Returns the `business` sub-object (address, schema info). |
| `getThemeColors()` | `Promise<Object>` | Returns the `theme_colors` sub-object (`light` and `dark`). |
| `getImagePrimaryPath()` | `Promise<String>` | Returns the full path to the primary image directory (factors in `basePath`). |
| `getImageResponsivePath()`| `Promise<String>` | Returns the full path to the responsive image directory. |

### Synchronous Getters
These functions return `String` values immediately by reading from the globally cached `window.__SETUP_CONFIG__` object.

| Function Name | Returns | Description |
| :--- | :--- | :--- |
| `getSyncImagePrimaryPath()` | `String` | Synchronous access to the primary image directory path. |
| `getSyncImageResponsivePath()` | `String` | Synchronous access to the responsive image directory path. |

---

## 3. The `defaultSetup` Schema

If properties are missing from your `setup.json`, or if the file fails to load, `config.js` relies on this internal default schema:

```javascript
{
  fonts: [],
  general: {
    basePath: '/',
    title: 'Default Title',
    description: 'Default Description',
    canonical: window.location.href,
    themeColor: '#000000',
    ogLocale: 'en_US',
    ogType: 'website',
    siteName: 'Site Name',
    favicons: [ /* default Apple/PNG/ICO icons */ ],
    robots: 'index, follow',
    x: { card: 'summary_large_image', domain: window.location.hostname },
    theme_colors: { light: '#000000', dark: '#000000' }
  },
  business: {},
  font_awesome: { kitUrl: '[https://kit.fontawesome.com/85d1e578b1.js](https://kit.fontawesome.com/85d1e578b1.js)' },
  media: {
    responsive_images: { directory_path: 'img/responsive/' },
    primary_images: { directory_path: 'img/primary/' }
  }
}
```

---

## 4. Troubleshooting

* **My API calls are returning default data instead of my custom JSON:**
    * Check the network tab in your DevTools. The module expects your configuration file to be strictly located at `./JSON/setup.json`. If it 404s, it will print a warning (`Using default configuration`) and gracefully fallback to the defaults.
* **Images are missing or paths are resolving incorrectly:**
    * Ensure `basePath` is correctly set in your `setup.json` under the `general` object. The `getImagePrimaryPath()` dynamically prepends this `basePath` to the `directory_path`. 
* **How can I see what config was loaded?**
    * Append `?debug=true` to your URL. The module uses a `createLogger` function that will output the exact paths, merge events, and global cache hits directly to the console under the `[Config]` namespace.
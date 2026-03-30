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

# Video Generator (`video-generator.js`)

The `video-generator.js` module is an internal utility script responsible for generating accessible, theme-aware HTML5 `<video>` markup. It is primarily consumed by the `<custom-block>` Web Component to render background and primary media videos.

## Features

* **🌓 Theme-Aware Playback:** Natively supports distinct `lightSrc` and `darkSrc` video paths. It automatically swaps the active video source and poster image when the user changes their OS-level color scheme.
* **🎥 Multi-Format Generation:** Automatically generates `<source>` elements for both `.webm` and `.mp4` formats for every video source provided, ensuring maximum cross-browser compatibility.
* **⚡ Lazy Autoplay:** Integrates with `IntersectionObserver` to pause off-screen autoplaying videos, saving user bandwidth and CPU cycles until the video scrolls into the viewport.
* **🏎️ Caching:** Implements a `markupCache` to instantly return generated HTML strings if the same configuration is requested multiple times.
* **🛡️ Fallback Support:** Generates a polite, accessible fallback download link for browsers that do not support HTML5 video tags.

---

## 1. Setup & Usage

### Requirements
This script is designed to be imported and used by other JavaScript modules. It does not require any external configuration files.

### Basic Example
```javascript
import { generateVideoMarkup } from '../generators/video-generator.js';

async function renderVideo() {
  const markup = await generateVideoMarkup({
    src: '/assets/my-video.mp4',
    poster: '/assets/my-video-poster.jpg',
    autoplay: true,
    loop: true,
    muted: true
  });
  
  document.getElementById('video-container').innerHTML = markup;
}
```

### Advanced Example (Theme-Aware)
```javascript
import { generateVideoMarkup } from '../generators/video-generator.js';

async function renderThemedVideo() {
  const markup = await generateVideoMarkup({
    lightSrc: '/assets/light-bg.webm',
    darkSrc: '/assets/dark-bg.webm',
    lightPoster: '/assets/light-poster.jpg',
    darkPoster: '/assets/dark-poster.jpg',
    alt: 'Abstract shifting colors background',
    autoplay: true,
    playsinline: true,
    disablePip: true
  });
  
  document.getElementById('video-container').innerHTML = markup;
}
```

---

## 2. Configuration Parameters

The `generateVideoMarkup` function accepts a single options object with the following properties:

### 2.1 Media Sources

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| **src** | `String` | `''` | The default video source. |
| **lightSrc** / **darkSrc** | `String` | `''` | Theme-specific video sources. |
| **poster** | `String` | `''` | The default placeholder image shown before loading. |
| **lightPoster** / **darkPoster**| `String` | `''` | Theme-specific placeholder images. |
| **alt** | `String` | `'Video content'` | The `aria-label` applied to the `<video>` tag. |

> **Format Note:** You only need to provide a single format path (e.g., `/video.mp4`). The generator strips the extension and generates both `.webm` and `.mp4` `<source>` tags automatically. 

### 2.2 Playback Behaviors

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| **autoplay** | `Boolean` | `false` | Automatically begins playback. (Forces `muted=true`). |
| **muted** | `Boolean` | `false` | Mutes the video audio track. |
| **loop** | `Boolean` | `false` | Restarts the video continuously upon completion. |
| **playsinline**| `Boolean` | `false` | Prevents the video from automatically entering fullscreen on iOS. |
| **disablePip** | `Boolean` | `false` | Disables the "Picture-in-Picture" UI control. |
| **controls** | `Boolean` | `false` | Displays native browser playback controls. |

### 2.3 Styling & Performance

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| **customClasses**| `String` | `''` | Space-separated CSS classes. |
| **extraClasses** | `Array` | `[]` | Additional CSS classes applied to the `<video>` element. |
| **loading** | `String` | `'lazy'` | Sets the `loading` attribute (`lazy` or `eager`). |
| **preload** | `String` | `'metadata'` | Dictates what data to load (`auto`, `metadata`, `none`). |

---

## 3. Key Features & Behavior

### 🔀 Theme Switching Logic
The generated `<video>` tag is embedded with `data-light-src` and `data-dark-src` attributes. The module includes a client-side listener that watches for `(prefers-color-scheme: dark)` changes. 

When a theme change occurs:
1. It updates the `poster` image.
2. It completely rebuilds the internal `<source>` tags to point to the new theme's files.
3. It reloads the video (`video.load()`), seeks to the previous playback time (`video.currentTime = currentTime`), and resumes playback if it was already playing.

### 🔒 Extension Validation
The generator strictly requires that any provided `src` ends in either `.mp4` or `.webm`. If a URL without a valid extension is passed, it will strip the source and render the fallback HTML. 

### 🤫 Forced Muting for Autoplay
Browsers severely restrict autoplaying media. To ensure videos actually autoplay when requested, the generator automatically forces the `muted` attribute if `autoplay=true`.
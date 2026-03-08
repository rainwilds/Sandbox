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

# Blog Rendering Engine (`blog.js`)

The `blog.js` script acts as the lightweight, client-side rendering engine for the application's blog system. It handles simple routing, fetching post manifests, parsing Markdown content, and dynamically hydrating Web Components (`<custom-block>`) embedded both in the blog feed and inside individual Markdown posts.



## Features

* **🚦 Client-Side Routing:** Automatically detects whether to render the main blog index or a specific post based on the presence of DOM elements and URL search parameters (`?slug=`).
* **📝 Markdown Parsing:** Fetches raw `.md` files, strips out the YAML frontmatter for metadata, and parses the remaining content into HTML using the `marked` library.
* **🧩 Component Hydration:** Safely unescapes and initializes `<custom-block>` Web Components that authors embed directly inside their Markdown files.
* **🖼️ Automated Featured Images:** Dynamically injects highly-optimized `<custom-block>` elements to serve as featured images for both the feed list and individual posts.
* **🔍 SEO Injection:** Automatically updates the document `<title>` and `<meta name="description">` based on the parsed Markdown frontmatter.

---

## 1. Setup & Usage

### Requirements
1.  The `marked.js` library must be loaded globally on the page for Markdown parsing to work.
2.  The `config.js` module must be accessible to provide the application's `basePath`.
3.  The `<custom-block>` Web Component must be registered in the application, as the script explicitly waits for it to define via `customElements.whenDefined()` before rendering layouts.

### HTML Implementation (Blog Index Page)
To render the feed of all blog posts, simply include a container with the ID `blog-index`.
```html
<body>
    <div id="blog-index">
        </div>
    
    <script src="[https://cdn.jsdelivr.net/npm/marked/marked.min.js](https://cdn.jsdelivr.net/npm/marked/marked.min.js)"></script>
    <script type="module" src="/js/blog.js"></script>
</body>
```

### HTML Implementation (Single Post Page)
To render an individual post, include a container with the ID `post-content`. The script will look for a `?slug=post-name` parameter in the URL.
```html
<body>
    <div id="post-content">
        </div>
    
    <script src="[https://cdn.jsdelivr.net/npm/marked/marked.min.js](https://cdn.jsdelivr.net/npm/marked/marked.min.js)"></script>
    <script type="module" src="/js/blog.js"></script>
</body>
```

---

## 2. Core Rendering Logic

### `renderBlogIndex()`
When the script detects the `#blog-index` element, it executes the following flow:
1.  Fetches `manifest.json` from the `/blog/` directory.
2.  Maps over the array of posts to generate `<article>` blocks.
3.  If a post has a `featuredImage` defined in its frontmatter, it generates a `<custom-block>` specifically configured for lazy-loading responsive images.
4.  Injects the HTML into the `#blog-index` container.
5.  Finds all newly injected `<custom-block>` tags, forces their `isVisible` property to `true`, and calls their `.initialize()` method to trigger rendering.

### `renderPost(slug)`
When the script detects a `?slug=` parameter in the URL, it executes the following flow:
1.  Fetches the raw Markdown file from `/blog/{slug}.md`.
2.  Uses a Regular Expression (`/^-{3}\s*\n([\s\S]*?)\n-{3}\s*(\n|$)/`) to extract the frontmatter metadata (title, date, excerpt, featured image).
3.  Passes the raw body text into `marked.parse()` with sanitization disabled, allowing raw HTML to pass through.
4.  Updates the page `<title>` and `<meta name="description">` using the parsed frontmatter data.
5.  Injects the featured image `<custom-block>` at the very top of the `#post-content` container.
6.  Hydrates all Web Components found within the parsed content.

---

## 3. Key Behaviors

### 🔧 Embedded Web Components in Markdown
Markdown parsers often HTML-encode raw tags (turning `<` into `&lt;`). To allow authors to use `<custom-block>` elements directly inside their blog posts, `blog.js` runs a post-processing RegEx replacement:

```javascript
const customBlockRegex = /&lt;custom-block([\s\S]*?)&gt;([\s\S]*?)&lt;\/custom-block&gt;/gi;
```
It finds encoded `<custom-block>` tags, decodes them back to standard HTML, fixes encoded quotes (`&quot;`), and strips out any erroneous `<br>` tags the parser might have inserted inside the attributes. 

### ⏱️ Awaiting Custom Elements
Because the script relies heavily on `<custom-block>` to render featured media, it utilizes a `waitForCustomElement('custom-block')` wrapper. This creates a `Promise` that leverages the browser's native `customElements.whenDefined()` API, ensuring the script pauses its rendering pipeline until the Web Component is fully registered and ready to be instantiated.

---

## 4. Troubleshooting

* **Blog index is empty / "No #blog-index element found":**
    * Ensure your HTML file contains a `<div id="blog-index"></div>`. The script relies on this specific ID to know where to inject the feed.
* **Console Error: "marked is not defined":**
    * You forgot to include the `marked` library in your HTML file before calling `blog.js`.
* **Single post says "Error loading post":**
    * Verify that the URL contains a valid `?slug=...` parameter.
    * Ensure the corresponding `.md` file exists in the `/blog/` directory and is accessible via a simple HTTP fetch request.
* **Web Components inside Markdown aren't rendering:**
    * Ensure you wrote the component tag exactly as `<custom-block ...>...</custom-block>`. The regex is specifically looking for that tag name.
    * Check your browser console. If `blog.js` fired before the component was bundled, you might see `❌ custom-block custom element is not defined`.
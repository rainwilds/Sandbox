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

# Blog Manifest Generator (`generateManifest`)

The `generateManifest` function is an asynchronous utility designed to power dynamic blog feeds. It takes an array of blog post slugs, fetches the corresponding Markdown files, securely parses their frontmatter metadata, and returns a fully populated, standardized JSON array (the "manifest") ready to be consumed by your rendering components.

## Features

* **📄 Frontmatter Parsing:** Uses a robust, whitespace-forgiving regular expression to extract YAML-like metadata from the top of Markdown files.
* **🛡️ Fallback Injection:** Automatically populates missing data with safe defaults (e.g., standardizing missing dates to `1970-01-01` and providing default featured images) to prevent frontend UI breaks.
* **🗂️ Array Mapping:** Intelligently splits comma-separated strings (like `categories`) into clean arrays for easier filtering and rendering.
* **🌐 Environment Agnostic:** Uses relative pathing (`blog/${slug}.md`) ensuring seamless functionality across different hosting environments, including GitHub Pages subdirectories.
* **⚠️ Resilient Execution:** Wraps individual file parsing in `try/catch` blocks. If one blog post fails to fetch or parse, it logs the error but continues processing the rest of the manifest.

---

## 1. Setup & Usage

### Requirements
This function expects your Markdown files to be located in a `blog/` directory relative to where the script is executed. 

### Basic Example
```javascript
import { generateManifest } from '../utils/blog-utils.js'; // Adjust path as needed

async function loadBlog() {
  // Pass an array of markdown filenames (without the .md extension)
  const slugs = ['my-first-post', 'hello-world', 'upcoming-events'];
  
  const manifest = await generateManifest(slugs);
  
  console.log(`Successfully loaded ${manifest.length} posts.`);
  console.log(manifest[0].title); // "My First Post"
}

loadBlog();
```

---

## 2. Markdown Frontmatter Schema

For the parser to correctly read your blog posts, each `.md` file must begin with a metadata block enclosed by triple hyphens (`---`). 


### Example `blog/hello-world.md`
```markdown
---
title: The Future of Web Components
date: 2026-03-08
categories: Tech, Development, UI
excerpt: An exploration into how custom elements are reshaping the DOM.
featuredImage: /img/primary/web-components.jpg
featuredImageAlt: A glowing computer chip
featuredImageAspectRatio: 16/9
---

# The Future of Web Components
The actual markdown content of your blog post goes down here...
```

---

## 3. Output Data Structure

The function returns a `Promise` that resolves to an array of objects. Each object represents a single blog post and maps directly to the frontmatter, filling in any missing gaps with the defaults listed below.

| Property | Type | Default Fallback |
| :--- | :--- | :--- |
| **slug** | `String` | *(Derived from the input array, `.md` stripped)* |
| **title** | `String` | `'Untitled'` |
| **date** | `String` | `'1970-01-01'` |
| **categories** | `Array<String>` | `[]` *(Parsed from comma-separated string)* |
| **excerpt** | `String` | `''` |
| **featuredImage** | `String` | `'/img/primary/tourism-photography-light-1.jpg'` |
| **featuredImageAlt** | `String` | `'Featured image for {title}'` |
| **featuredImageMobileWidth** | `String` | `'100vw'` |
| **featuredImageTabletWidth**| `String` | `'50vw'` |
| **featuredImageDesktopWidth**| `String` | `'30vw'` |
| **featuredImageAspectRatio**| `String` | `'16/9'` |
| **featuredImageLoading**| `String` | `'lazy'` |

---

## 4. Key Features & Behavior

### 🔍 Forgiving Parsing Logic
The regex used to isolate the frontmatter (`/^-{3}\s*\n([\s\S]*?)\n-{3}\s*\n/`) is specifically designed to be forgiving of extra whitespace or trailing spaces that authors might accidentally leave after the `---` markers. 

Furthermore, when splitting the key-value pairs (`title: My Post`), the parser uses a safe rest-joining technique (`const value = rest.join(':').trim();`). This ensures that if a user includes a colon *inside* their title or excerpt (e.g., `title: Web Components: A New Era`), the parser won't accidentally truncate the string at the second colon.

### 🛡️ Safe Iteration
The `for...of` loop contains an internal `try/catch` block for every single slug. This is a critical architectural choice: if the user passes `['post-a', 'missing-post', 'post-b']`, the function will log an error for `missing-post` but will successfully return a manifest containing `post-a` and `post-b`. It prevents a single missing file from crashing the entire blog feed.
/* global document, window, console, marked, URLSearchParams */
import { getConfig } from './config.js'; // Import getConfig for basePath

async function getManifest() {
  try {
    const config = await getConfig();
    const basePath = config.general?.basePath || '/';
    console.log(`📡 Fetching manifest from: ${basePath}blog/manifest.json`); // Debug
    const cached = localStorage.getItem('blog-manifest');
    if (cached) {
      console.log('📦 Using cached manifest');
      return JSON.parse(cached);
    }
    const response = await fetch(`${basePath}blog/manifest.json`);
    if (!response.ok) throw new Error(`Failed to fetch manifest: ${response.status} ${response.statusText}`);
    const manifest = await response.json();
    localStorage.setItem('blog-manifest', JSON.stringify(manifest));
    console.log('📦 Manifest loaded:', manifest);
    return manifest;
  } catch (error) {
    console.error('❌ Error fetching manifest:', error);
    return [];
  }
}

async function renderPost(slug) {
  try {
    const config = await getConfig();
    const basePath = config.general?.basePath || '/';
    const postUrl = `${basePath}blog/${slug}.md`; // Changed 'posts' to 'blog'
    console.log(`📄 Fetching post from: ${postUrl}`); // Debug
    const response = await fetch(postUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${slug}.md: ${response.status} ${response.statusText}`);
    }
    const text = await response.text();
    console.log(`📄 Post fetched successfully, length: ${text.length} characters`);

    // Loosened regex: allows optional whitespace and is more forgiving
    const frontmatterMatch = text.match(/^-{3}\s*\n([\s\S]*?)\n-{3}\s*\n/);
    if (!frontmatterMatch) {
      console.warn('⚠️ No frontmatter found in post');
    }
    const frontmatter = frontmatterMatch ? frontmatterMatch[1] : '';
    const content = frontmatterMatch ? text.slice(frontmatterMatch[0].length) : text;

    const data = {};
    frontmatter.split('\n').forEach(line => {
      if (!line.trim()) return; // skip empty lines
      const [key, ...rest] = line.split(':');
      const value = rest.join(':').trim(); // handles values with colons
      if (key && value) data[key.trim()] = value;
    });
    console.log('📝 Post data parsed:', data); // Debug

    const html = marked.parse(content);
    console.log('📝 Markdown parsed to HTML:', html.slice(0, 100) + '...'); // Debug snippet
    const postContent = document.querySelector('#post-content');
    if (postContent) {
      postContent.innerHTML = html;
      document.title = data.title || 'Blog Post';
      document.querySelector('meta[name="description"]')?.setAttribute('content', data.excerpt || '');
      // Update canonical URL dynamically
      document.querySelector('link[rel="canonical"]')?.setAttribute('href', `${window.location.origin}${basePath}post.html?slug=${slug}`);
      if (data.featuredImage) {
        console.log(`🖼️ Adding featured image: ${data.featuredImage}`);
        postContent.insertAdjacentHTML('afterbegin', `
          <custom-block
            img-primary-src="${data.featuredImage}"
            img-primary-alt="${data.featuredImageAlt || `Featured image for ${data.title}`}"
            img-primary-mobile-width="${data.featuredImageMobileWidth || '100vw'}"
            img-primary-tablet-width="${data.featuredImageTabletWidth || '50vw'}"
            img-primary-desktop-width="${data.featuredImageDesktopWidth || '30vw'}"
            img-primary-aspect-ratio="${data.featuredImageAspectRatio || '16/9'}"
            img-primary-loading="lazy"
          ></custom-block>
        `);
      }
      console.log('✅ Post rendered successfully');
    } else {
      console.error('❌ No #post-content element found in the DOM.');
    }
  } catch (error) {
    console.error('❌ Error rendering post:', error);
    const postContent = document.querySelector('#post-content');
    if (postContent) {
      postContent.innerHTML = '<p>Error loading post: ' + error.message + '</p>';
    }
  }
}

async function renderIndex() {
  try {
    const manifest = await getManifest();
    console.log("📦 Manifest loaded:", manifest);

    const container = document.querySelector('#blog-index');
    console.log("🧩 Container found:", container);

    if (!container) {
      console.warn("⚠️ No #blog-index element found in the DOM.");
      return;
    }

    container.innerHTML = '';

    if (!manifest || manifest.length === 0) {
      console.warn("⚠️ Manifest is empty, nothing to render.");
      container.innerHTML = '<p>No posts available.</p>';
      return;
    }

    manifest.forEach(post => {
      console.log("📝 Rendering post:", post.slug, post.title);

      container.innerHTML += `
        <custom-block
          heading="${post.title}"
          text="${post.excerpt}"
          img-primary-src="${post.featuredImage}"
          img-primary-alt="${post.featuredImageAlt}"
          img-primary-mobile-width="${post.featuredImageMobileWidth}"
          img-primary-tablet-width="${post.featuredImageTabletWidth}"
          img-primary-desktop-width="${post.featuredImageDesktopWidth}"
          img-primary-aspect-ratio="${post.featuredImageAspectRatio}"
          img-primary-loading="lazy"
          button-text="Read More"
          button-href="/post.html?slug=${post.slug}"
          button-class="button-primary"
          shadow="shadow-light"
          border="border-light"
        ></custom-block>`;
    });
    console.log('✅ Index rendered successfully');
  } catch (error) {
    console.error('❌ Error rendering index:', error);
    const container = document.querySelector('#blog-index');
    if (container) {
      container.innerHTML = '<p>Error loading posts: ' + error.message + '</p>';
    }
  }
}

async function renderCategory(category) {
  try {
    const manifest = await getManifest();
    const filteredPosts = manifest.filter(post => post.categories.includes(category));
    console.log(`📂 Rendering category: ${category}`, filteredPosts);
    const container = document.querySelector('#blog-index');
    if (container) {
      container.innerHTML = `<h1>Posts in ${category.charAt(0).toUpperCase() + category.slice(1)}</h1>`;
      filteredPosts.forEach(post => {
        container.innerHTML += `
          <custom-block
            heading="${post.title}"
            text="${post.excerpt}"
            img-primary-src="${post.featuredImage}"
            img-primary-alt="${post.featuredImageAlt}"
            img-primary-mobile-width="${post.featuredImageMobileWidth}"
            img-primary-tablet-width="${post.featuredImageTabletWidth}"
            img-primary-desktop-width="${post.featuredImageDesktopWidth}"
            img-primary-aspect-ratio="${post.featuredImageAspectRatio}"
            img-primary-loading="lazy"
            button-text="Read More"
            button-href="/post.html?slug=${post.slug}"
            button-class="button-primary"
            shadow="shadow-light"
            border="border-light"
          ></custom-block>`;
      });
      console.log('✅ Category rendered successfully');
    } else {
      console.warn('⚠️ No #blog-index element found for category.');
    }
  } catch (error) {
    console.error('❌ Error rendering category:', error);
    const container = document.querySelector('#blog-index');
    if (container) {
      container.innerHTML = '<p>Error loading posts: ' + error.message + '</p>';
    }
  }
}

// Routing logic
console.log('🚀 blog.js loaded, checking path:', window.location.pathname); // Debug
const path = window.location.pathname;
const params = new URLSearchParams(window.location.search);
if (path.endsWith('/blog.html') || path.endsWith('/') || path.endsWith('/index.html')) {
  console.log('🗂️ Rendering index');
  renderIndex();
} else if (path.endsWith('/post.html') && params.get('slug')) {
  console.log(`📄 Rendering post with slug: ${params.get('slug')}`);
  renderPost(params.get('slug'));
} else if (path.endsWith('/category.html') && params.get('category')) {
  console.log(`📂 Rendering category: ${params.get('category')}`);
  renderCategory(params.get('category'));
} else {
  console.warn('⚠️ No matching route for path:', path);
}

// Expose for console debugging
window.getManifest = getManifest;
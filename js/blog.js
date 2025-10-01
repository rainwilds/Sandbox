/* global document, window, marked, console */

async function getManifest() {
  try {
    const cached = localStorage.getItem('blog-manifest');
    if (cached) {
      console.log('📦 Using cached manifest');
      return JSON.parse(cached);
    }
    const response = await fetch('/Sandbox/blog/manifest.json');
    if (!response.ok) throw new Error('Failed to fetch manifest');
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
    console.log(`📄 Fetching post from: /Sandbox/blog/${slug}.md`);
    const response = await fetch(`/Sandbox/blog/${slug}.md`);
    if (!response.ok) throw new Error(`Failed to fetch ${slug}.md`);
    const text = await response.text();
    console.log(`📄 Post fetched successfully, length: ${text.length} characters`);

    const frontmatterMatch = text.match(/^-{3}\s*\n([\s\S]*?)\n-{3}\s*(\n|$)/);
    const frontmatter = frontmatterMatch ? frontmatterMatch[1] : '';
    const content = frontmatterMatch ? text.slice(frontmatterMatch[0].length) : text;

    const data = {};
    frontmatter.split('\n').forEach(line => {
      if (!line.trim()) return;
      const [key, ...rest] = line.split(':');
      const value = rest.join(':').trim();
      if (key && value) data[key.trim()] = value;
    });
    console.log('📝 Post data parsed:', data);

    marked.use({ sanitizer: null, mangle: false, breaks: true });
    const html = marked.parse(content, { async: false });
    console.log('📝 Markdown parsed to HTML:', html.substring(0, 100) + '...');

    const postContent = document.querySelector('#post-content');
    if (postContent) {
      postContent.innerHTML = html;
      document.title = data.title || 'Blog Post';
      document.querySelector('meta[name="description"]')?.setAttribute('content', data.excerpt || '');
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
      // Initialize custom-block elements after DOM insertion
      const customBlocks = postContent.querySelectorAll('custom-block');
      customBlocks.forEach((block, index) => {
        console.log(`🛠️ Initializing custom-block ${index + 1}/${customBlocks.length}`);
        if (!block.isConnected) return;
        block.isVisible = true;
        block.initialize();
      });
    }
    console.log('✅ Post rendered successfully');
  } catch (error) {
    console.error('❌ Error rendering post:', error);
    document.querySelector('#post-content').innerHTML = '<p>Error loading post</p>';
  }
}

async function renderIndex() {
  try {
    const manifest = await getManifest();
    console.log('📦 Manifest loaded:', manifest);

    const container = document.querySelector('#blog-index');
    console.log('🧩 Container found:', container);

    if (!container) {
      console.warn('⚠️ No #blog-index element found in the DOM.');
      return;
    }

    container.innerHTML = '';

    if (!manifest || manifest.length === 0) {
      console.warn('⚠️ Manifest is empty, nothing to render.');
      container.innerHTML = '<p>No posts available.</p>';
      return;
    }

    console.log(`📝 Rendering ${manifest.length} posts`);
    manifest.forEach((post, index) => {
      console.log(`📝 Rendering post ${index + 1}/${manifest.length}: ${post.slug} ${post.title}`);
      container.insertAdjacentHTML('beforeend', `
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
          button-href="/Sandbox/post.html?slug=${post.slug}"
          button-class="button-primary"
          shadow="shadow-light"
          border="border-light"
        ></custom-block>
      `);
    });

    // Initialize custom-block elements after DOM insertion
    const customBlocks = container.querySelectorAll('custom-block');
    console.log(`🛠️ Found ${customBlocks.length} custom-block elements to initialize`);
    customBlocks.forEach((block, index) => {
      console.log(`🛠️ Initializing custom-block ${index + 1}/${customBlocks.length}`);
      if (!block.isConnected) return;
      block.isVisible = true;
      block.initialize();
    });
  } catch (error) {
    console.error('❌ Error rendering index:', error);
    const container = document.querySelector('#blog-index');
    if (container) {
      container.innerHTML = '<p>Error loading posts</p>';
    }
  }
}

async function renderCategory(category) {
  try {
    const manifest = await getManifest();
    const filteredPosts = manifest.filter(post => post.categories.includes(category));
    console.log(`📂 Rendering category: ${category}, ${filteredPosts.length} posts found`);
    const container = document.querySelector('#blog-index');
    if (container) {
      container.innerHTML = `<h1>Posts in ${category.charAt(0).toUpperCase() + category.slice(1)}</h1>`;
      filteredPosts.forEach((post, index) => {
        console.log(`📝 Rendering post ${index + 1}/${filteredPosts.length}: ${post.slug}`);
        container.insertAdjacentHTML('beforeend', `
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
            button-href="/Sandbox/post.html?slug=${post.slug}"
            button-class="button-primary"
            shadow="shadow-light"
            border="border-light"
          ></custom-block>
        `);
      });
      const customBlocks = container.querySelectorAll('custom-block');
      console.log(`🛠️ Found ${customBlocks.length} custom-block elements to initialize in category`);
      customBlocks.forEach((block, index) => {
        console.log(`🛠️ Initializing custom-block ${index + 1}/${customBlocks.length}`);
        if (!block.isConnected) return;
        block.isVisible = true;
        block.initialize();
      });
    }
  } catch (error) {
    console.error('❌ Error rendering category:', error);
    document.querySelector('#blog-index').innerHTML = '<p>Error loading posts</p>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const path = window.location.pathname;
  const params = new URLSearchParams(window.location.search);
  console.log('🚀 blog.js loaded, checking path:', path);

  if (path.endsWith('/blog.html') || path === '/Sandbox/' || path.endsWith('/index.html')) {
    console.log('📄 Rendering index');
    renderIndex();
  } else if (path === '/Sandbox/post.html' && params.get('slug')) {
    console.log('📄 Rendering post with slug:', params.get('slug'));
    renderPost(params.get('slug'));
  } else if (path === '/Sandbox/category.html' && params.get('category')) {
    console.log('📂 Rendering category:', params.get('category'));
    renderCategory(params.get('category'));
  }
});

window.getManifest = getManifest;
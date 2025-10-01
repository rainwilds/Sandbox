/* global document, window, marked, console */

async function getManifest() {
  try {
    const cached = localStorage.getItem('blog-manifest');
    if (cached) {
      const parsed = JSON.parse(cached);
      console.log('📦 Using cached manifest:', parsed);
      if (parsed.length === 2) {
        return parsed;
      }
      console.log('🧹 Clearing invalid cached manifest');
      localStorage.removeItem('blog-manifest');
    }
    console.log('🌐 Fetching manifest from /Sandbox/blog/manifest.json');
    const response = await fetch('/Sandbox/blog/manifest.json');
    console.log('🌐 Fetch response:', response.status, response.statusText, response.url);
    if (!response.ok) throw new Error(`Failed to fetch manifest: ${response.statusText}`);
    const manifest = await response.json();
    console.log('📦 Manifest fetched:', manifest);
    localStorage.setItem('blog-manifest', JSON.stringify(manifest));
    return manifest;
  } catch (error) {
    console.error('❌ Error fetching manifest:', error.message);
    return [];
  }
}

async function waitForCustomElement(elementName, timeout = 5000) {
  const start = Date.now();
  while (!customElements.get(elementName)) {
    if (Date.now() - start > timeout) {
      throw new Error(`Timeout waiting for ${elementName} to be defined`);
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  console.log(`✅ ${elementName} custom element defined`);
}

async function renderPost(slug) {
  try {
    console.log(`📄 Fetching post from: /Sandbox/blog/${slug}.md`);
    const response = await fetch(`/Sandbox/blog/${slug}.md`);
    console.log('🌐 Fetch response:', response.status, response.statusText, response.url);
    if (!response.ok) throw new Error(`Failed to fetch ${slug}.md: ${response.statusText}`);
    const text = await response.text();
    console.log(`📄 Post fetched, length: ${text.length} characters`, text.substring(0, 100));
    const frontmatterMatch = text.match(/^-{3}\s*\n([\s\S]*?)\n-{3}\s*(\n|$)/);
    const frontmatter = frontmatterMatch ? frontmatterMatch[1] : '';
    const content = frontmatterMatch ? text.slice(frontmatterMatch[0].length) : text;
    console.log('📝 Frontmatter:', frontmatter);
    console.log('📝 Content preview:', content.substring(0, 100));
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
    if (!postContent) {
      console.error('❌ No #post-content element found in DOM');
      return;
    }
    console.log('🧩 Post content container found:', postContent);
    postContent.innerHTML = html;
    console.log('🖌️ HTML inserted into #post-content');
    document.title = data.title || 'Blog Post';
    document.querySelector('meta[name="description"]')?.setAttribute('content', data.excerpt || '');
    console.log('📝 Updated title and meta description');
    if (data.featuredImage) {
      console.log(`🖼️ Adding featured image: ${data.featuredImage}`);
      await waitForCustomElement('custom-block');
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
      console.log('🖼️ Custom-block for featured image inserted');
    }
    const customBlocks = postContent.querySelectorAll('custom-block');
    console.log(`🛠️ Found ${customBlocks.length} custom-block elements`);
    if (!customElements.get('custom-block')) {
      console.error('❌ custom-block custom element is not defined');
      postContent.innerHTML = '<p>Error: custom-block component not loaded</p>';
      return;
    }
    customBlocks.forEach((block, index) => {
      console.log(`🛠️ Initializing custom-block ${index + 1}/${customBlocks.length}`);
      if (!block.isConnected) {
        console.warn(`⚠️ custom-block ${index + 1} is not connected to DOM`);
        return;
      }
      if (typeof block.initialize !== 'function') {
        console.error(`❌ custom-block ${index + 1} has no initialize method`);
        return;
      }
      block.isVisible = true;
      block.initialize();
    });
    console.log('✅ Post rendering completed');
  } catch (error) {
    console.error('❌ Error rendering post:', error.message);
    const postContent = document.querySelector('#post-content');
    if (postContent) {
      postContent.innerHTML = `<p>Error loading post: ${error.message}</p>`;
    }
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
    console.log('🧹 Container cleared');
    if (!manifest || manifest.length === 0) {
      console.warn('⚠️ Manifest is empty, nothing to render.');
      container.innerHTML = '<p>No posts available.</p>';
      return;
    }
    console.log(`📝 Rendering ${manifest.length} posts`);
    await waitForCustomElement('custom-block');
    manifest.forEach((post, index) => {
      console.log(`📝 Rendering post ${index + 1}/${manifest.length}: ${post.slug} - ${post.title}`);
      container.insertAdjacentHTML('beforeend', `
        <custom-block
          heading="${post.title || 'Untitled'}"
          text="${post.excerpt || ''}"
          img-primary-src="${post.featuredImage || ''}"
          img-primary-alt="${post.featuredImageAlt || ''}"
          img-primary-mobile-width="${post.featuredImageMobileWidth || '100vw'}"
          img-primary-tablet-width="${post.featuredImageTabletWidth || '50vw'}"
          img-primary-desktop-width="${post.featuredImageDesktopWidth || '30vw'}"
          img-primary-aspect-ratio="${post.featuredImageAspectRatio || '16/9'}"
          img-primary-loading="${post.featuredImageLoading || 'lazy'}"
          button-text="Read More"
          button-href="/Sandbox/post.html?slug=${post.slug}"
          button-class="button-primary"
          shadow="shadow-light"
          border="border-light"
        ></custom-block>
      `);
    });
    const customBlocks = container.querySelectorAll('custom-block');
    console.log(`🛠️ Found ${customBlocks.length} custom-block elements`);
    if (!customElements.get('custom-block')) {
      console.error('❌ custom-block custom element is not defined');
      container.innerHTML = '<p>Error: custom-block component not loaded</p>';
      return;
    }
    customBlocks.forEach((block, index) => {
      console.log(`🛠️ Initializing custom-block ${index + 1}/${customBlocks.length}`);
      if (!block.isConnected) {
        console.warn(`⚠️ custom-block ${index + 1} is not connected to DOM`);
        return;
      }
      if (typeof block.initialize !== 'function') {
        console.error(`❌ custom-block ${index + 1} has no initialize method`);
        return;
      }
      block.isVisible = true;
      block.initialize();
    });
    console.log('✅ Index rendering completed');
  } catch (error) {
    console.error('❌ Error rendering index:', error.message);
    const container = document.querySelector('#blog-index');
    if (container) {
      container.innerHTML = `<p>Error loading posts: ${error.message}</p>`;
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
      await waitForCustomElement('custom-block');
      filteredPosts.forEach((post, index) => {
        console.log(`📝 Rendering post ${index + 1}/${filteredPosts.length}: ${post.slug}`);
        container.insertAdjacentHTML('beforeend', `
          <custom-block
            heading="${post.title || 'Untitled'}"
            text="${post.excerpt || ''}"
            img-primary-src="${post.featuredImage || ''}"
            img-primary-alt="${post.featuredImageAlt || ''}"
            img-primary-mobile-width="${post.featuredImageMobileWidth || '100vw'}"
            img-primary-tablet-width="${post.featuredImageTabletWidth || '50vw'}"
            img-primary-desktop-width="${post.featuredImageDesktopWidth || '30vw'}"
            img-primary-aspect-ratio="${post.featuredImageAspectRatio || '16/9'}"
            img-primary-loading="${post.featuredImageLoading || 'lazy'}"
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
      if (!customElements.get('custom-block')) {
        console.error('❌ custom-block custom element is not defined');
        container.innerHTML = '<p>Error: custom-block component not loaded</p>';
        return;
      }
      customBlocks.forEach((block, index) => {
        console.log(`🛠️ Initializing custom-block ${index + 1}/${customBlocks.length}`);
        if (!block.isConnected) {
          console.warn(`⚠️ custom-block ${index + 1} is not connected to DOM`);
          return;
        }
        if (typeof block.initialize !== 'function') {
          console.error(`❌ custom-block ${index + 1} has no initialize method`);
          return;
        }
        block.isVisible = true;
        block.initialize();
      });
    }
  } catch (error) {
    console.error('❌ Error rendering category:', error.message);
    const container = document.querySelector('#blog-index');
    if (container) {
      container.innerHTML = `<p>Error loading posts: ${error.message}</p>`;
    }
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 blog.js loaded, checking path:', window.location.pathname);
  try {
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    if (path.endsWith('/blog.html') || path === '/Sandbox/' || path.endsWith('/index.html')) {
      console.log('📄 Rendering index');
      await renderIndex();
    } else if (path === '/Sandbox/post.html' && params.get('slug')) {
      console.log('📄 Rendering post with slug:', params.get('slug'));
      await renderPost(params.get('slug'));
    } else if (path === '/Sandbox/category.html' && params.get('category')) {
      console.log('📂 Rendering category:', params.get('category'));
      await renderCategory(params.get('category'));
    }
  } catch (error) {
    console.error('❌ Error in DOMContentLoaded handler:', error.message);
  }
});

window.getManifest = getManifest;
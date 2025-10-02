// blog.js
import { getGeneralConfig } from './config.js'; // Import config.js to get basePath

async function fetchManifest(basePath) {
  const manifestPath = `${basePath}blog/manifest.json`;
  try {
    console.log(`📋 Fetching manifest from: ${manifestPath}`);
    const response = await fetch(manifestPath);
    console.log('🌐 Manifest fetch response:', response.status, response.statusText, response.url);
    if (!response.ok) throw new Error(`Failed to fetch manifest.json: ${response.statusText}`);
    const manifest = await response.json();
    console.log('📋 Manifest fetched:', manifest);
    return manifest;
  } catch (error) {
    console.error('❌ Error fetching manifest:', error.message);
    return [];
  }
}

async function renderBlogIndex() {
  const blogIndex = document.querySelector('#blog-index');
  if (!blogIndex) {
    console.error('❌ No #blog-index element found in DOM');
    return;
  }
  console.log('🧩 Blog index container found:', blogIndex);

  const config = await getGeneralConfig();
  const basePath = config.basePath || '/';
  const posts = await fetchManifest(basePath);
  if (posts.length === 0) {
    blogIndex.innerHTML = '<p>No blog posts available.</p>';
    console.warn('⚠️ No posts found in manifest');
    return;
  }

  const html = posts.map(post => `
    <article>
      <h2><a href="${basePath}post.html?slug=${post.slug}">${post.title}</a></h2>
      <p><small>Posted on ${post.date}</small></p>
      <p>${post.excerpt}</p>
      ${post.featuredImage ? `
        <img src="${post.featuredImage}" 
             alt="${post.featuredImageAlt || `Image for ${post.title}`}" 
             style="width: ${post.featuredImageDesktopWidth}; aspect-ratio: ${post.featuredImageAspectRatio};"
             loading="${post.featuredImageLoading}">
      ` : ''}
    </article>
  `).join('');
  
  blogIndex.innerHTML = html;
  console.log('🖌️ Blog index rendered:', html);
}

async function renderPost(slug) {
  const config = await getGeneralConfig();
  const basePath = config.basePath || '/';
  try {
    const postPath = `${basePath}blog/${slug}.md`;
    console.log(`📄 Fetching post from: ${postPath}`);
    const response = await fetch(postPath);
    console.log('🌐 Fetch response:', response.status, response.statusText, response.url);
    if (!response.ok) throw new Error(`Failed to fetch ${slug}.md: ${response.statusText}`);
    const text = await response.text();
    console.log(`📄 Post fetched, length: ${text.length} characters`, text.substring(0, 100));
    const frontmatterMatch = text.match(/^-{3}\s*\n([\s\S]*?)\n-{3}\s*(\n|$)/);
    const frontmatter = frontmatterMatch ? frontmatterMatch[1] : '';
    const content = frontmatterMatch ? text.slice(frontmatterMatch[0].length) : text;
    console.log('📝 Frontmatter:', frontmatter);
    console.log('📝 Content:', content);
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
    console.log('📝 Markdown parsed to HTML:', html);
    const postContent = document.querySelector('#post-content');
    if (!postContent) {
      console.error('❌ No #post-content element found in DOM');
      return;
    }
    console.log('🧩 Post content container found:', postContent);
    postContent.innerHTML = html;
    console.log('🖌️ HTML inserted into #post-content:', html);
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

async function waitForCustomElement(name) {
  return new Promise((resolve) => {
    if (customElements.get(name)) {
      resolve();
      return;
    }
    customElements.whenDefined(name).then(resolve);
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const slug = urlParams.get('slug');
  const isBlogIndex = document.querySelector('#blog-index') !== null;

  if (isBlogIndex) {
    console.log('🚀 Rendering blog index');
    await renderBlogIndex();
  } else if (slug) {
    console.log(`🚀 Rendering single post with slug: ${slug}`);
    await renderPost(slug);
  } else {
    console.error('❌ No slug provided for post page');
    const postContent = document.querySelector('#post-content');
    if (postContent) {
      postContent.innerHTML = '<p>Error: No post specified. Please provide a valid slug.</p>';
    }
  }
});
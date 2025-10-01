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
async function getManifest() {
  try {
    const cached = localStorage.getItem('blog-manifest');
    if (cached) return JSON.parse(cached);
    const response = await fetch('/blog/manifest.json');
    if (!response.ok) throw new Error('Failed to fetch manifest');
    const manifest = await response.json();
    localStorage.setItem('blog-manifest', JSON.stringify(manifest));
    return manifest;
  } catch (error) {
    console.error('Error fetching manifest:', error);
    return [];
  }
}

async function renderPost(slug) {
  try {
    const response = await fetch(`/blog/${slug}.md`);
    if (!response.ok) throw new Error(`Failed to fetch ${slug}.md`);
    const text = await response.text();
    const frontmatterMatch = text.match(/^---\n([\s\S]*?)\n---\n/);
    const frontmatter = frontmatterMatch ? frontmatterMatch[1] : '';
    const content = frontmatterMatch ? text.slice(frontmatterMatch[0].length) : text;
    const data = {};
    frontmatter.split('\n').forEach(line => {
      const [key, value] = line.split(':').map(s => s.trim());
      if (key && value) data[key] = value;
    });
    const html = marked.parse(content);
    const postContent = document.querySelector('#post-content');
    if (postContent) {
      postContent.innerHTML = html;
      document.title = data.title || 'Blog Post';
      document.querySelector('meta[name="description"]')?.setAttribute('content', data.excerpt || '');
      if (data.featuredImage) {
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
    }
  } catch (error) {
    console.error('Error rendering post:', error);
    document.querySelector('#post-content').innerHTML = '<p>Error loading post</p>';
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
    }
  } catch (error) {
    console.error('Error rendering category:', error);
    document.querySelector('#blog-index').innerHTML = '<p>Error loading posts</p>';
  }
}

const path = window.location.pathname;
const params = new URLSearchParams(window.location.search);
if (path === '/' || path === '/blog.html') {
  renderIndex();
} else if (path === '/post.html' && params.get('slug')) {
  renderPost(params.get('slug'));
} else if (path === '/category.html' && params.get('category')) {
  renderCategory(params.get('category'));
}
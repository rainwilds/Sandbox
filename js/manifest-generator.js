async function generateManifest(postSlugs) {
  const manifest = [];
  for (const slug of postSlugs) {
    try {
      const response = await fetch(`/blog/${slug}.md`);
      if (!response.ok) throw new Error(`Failed to fetch ${slug}.md`);
      const text = await response.text();
      const frontmatterMatch = text.match(/^---\n([\s\S]*?)\n---\n/);
      const frontmatter = frontmatterMatch ? frontmatterMatch[1] : '';
      const data = {};
      frontmatter.split('\n').forEach(line => {
        const [key, value] = line.split(':').map(s => s.trim());
        if (key && value) data[key] = value;
      });
      manifest.push({
        slug: slug.replace('.md', ''),
        title: data.title || 'Untitled',
        date: data.date || '1970-01-01',
        categories: data.categories ? data.categories.split(',').map(s => s.trim()) : [],
        excerpt: data.excerpt || '',
        featuredImage: data.featuredImage || '/img/primary/tourism-photography-light-1.jpg',
        featuredImageAlt: data.featuredImageAlt || `Featured image for ${data.title || 'Untitled'}`,
        featuredImageMobileWidth: data.featuredImageMobileWidth || '100vw',
        featuredImageTabletWidth: data.featuredImageTabletWidth || '50vw',
        featuredImageDesktopWidth: data.featuredImageDesktopWidth || '30vw',
        featuredImageAspectRatio: data.featuredImageAspectRatio || '16/9',
        featuredImageLoading: data.featuredImageLoading || 'lazy'
      });
    } catch (error) {
      console.error(`Error processing ${slug}:`, error);
    }
  }
  console.log(JSON.stringify(manifest, null, 2));
}

// Run in console: replace with your slugs
generateManifest(['exploring-the-wonders-of-nature']);
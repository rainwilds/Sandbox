export async function generateManifest(postSlugs) {
  const manifest = [];
  for (const slug of postSlugs) {
    try {
      // Use relative path so it works on GitHub Pages under /Sandbox/
      const response = await fetch(`blog/${slug}.md`);
      if (!response.ok) throw new Error(`Failed to fetch ${slug}.md`);
      const text = await response.text();

      // More forgiving regex: allows optional whitespace and is less brittle
      const frontmatterMatch = text.match(/^-{3}\s*\n([\s\S]*?)\n-{3}\s*\n/);
      const frontmatter = frontmatterMatch ? frontmatterMatch[1] : '';
      const data = {};

      // Safer parsing: handles blank lines and values with colons
      frontmatter.split('\n').forEach(line => {
        if (!line.trim()) return;
        const [key, ...rest] = line.split(':');
        const value = rest.join(':').trim();
        if (key && value) data[key.trim()] = value;
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
  return manifest;  // Return the manifest array for use in .then()
}
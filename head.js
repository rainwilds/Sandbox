class Head extends HTMLElement {
  static get observedAttributes() {
    return ['title', 'description', 'keywords', 'author', 'canonical'];
  }

  connectedCallback() {
    console.log('bh-head connectedCallback started'); // Debug: Confirm connectedCallback runs

    // Find or create <head>
    let head = document.head || document.createElement('head');
    if (!document.head) document.documentElement.prepend(head);

    // Hardcoded font preloads
    const fonts = [
      { href: './fonts/AdobeAldine-Regular.woff2', type: 'font/woff2' }
    ];
    fonts.forEach(font => {
      if (!document.querySelector(`link[href="${font.href}"]`)) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = font.href;
        link.as = 'font';
        link.type = font.type;
        head.appendChild(link);
      }
    });

    // Hardcoded Font Awesome styles
    const fontAwesomeStyles = [
      './fonts/fontawesome/fontawesome.min.css',
      './fonts/fontawesome/sharp-light.min.css',
      './fonts/fontawesome/brands.min.css'
    ];

    // Preload Font Awesome styles
    fontAwesomeStyles.forEach(href => {
      if (!document.querySelector(`link[href="${href}"]`)) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = href;
        link.as = 'style';
        head.appendChild(link);
      }
    });

    // Append meta tags
    if (!document.querySelector('meta[charset]')) {
      const metaCharset = document.createElement('meta');
      metaCharset.setAttribute('charset', 'UTF-8');
      head.appendChild(metaCharset);
    }

    if (!document.querySelector('meta[name="viewport"]')) {
      const metaViewport = document.createElement('meta');
      metaViewport.name = 'viewport';
      metaViewport.content = 'width=device-width, initial-scale=1';
      head.appendChild(metaViewport);
    }

    if (!document.querySelector('title')) {
      const title = document.createElement('title');
      title.textContent = this.getAttribute('title') || 'Sandbox';
      head.appendChild(title);
    }

    if (!document.querySelector('meta[name="author"]')) {
      const metaAuthor = document.createElement('meta');
      metaAuthor.name = 'author';
      metaAuthor.content = this.getAttribute('author') || 'David Dufourq';
      head.appendChild(metaAuthor);
    }

    if (this.hasAttribute('description') && !document.querySelector('meta[name="description"]')) {
      const metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      metaDesc.content = this.getAttribute('description') || '';
      head.appendChild(metaDesc);
    }

    if (this.hasAttribute('keywords') && !document.querySelector('meta[name="keywords"]')) {
      const metaKeywords = document.createElement('meta');
      metaKeywords.name = 'keywords';
      metaKeywords.content = this.getAttribute('keywords') || '';
      head.appendChild(metaKeywords);
    }

    if (this.hasAttribute('canonical') && !document.querySelector('link[rel="canonical"]')) {
      const linkCanonical = document.createElement('link');
      linkCanonical.rel = 'canonical';
      linkCanonical.href = this.getAttribute('canonical') || '';
      head.appendChild(linkCanonical);
    }

    // Add theme-color meta tag
    if (!document.querySelector('meta[name="theme-color"]')) {
      const metaThemeColor = document.createElement('meta');
      metaThemeColor.name = 'theme-color';
      metaThemeColor.content = 'cyan';
      head.appendChild(metaThemeColor);
    }

    // Add main stylesheet (
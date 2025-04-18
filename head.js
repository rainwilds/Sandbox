class Head extends HTMLElement {
  static get observedAttributes() {
    return ['title', 'description', 'keywords', 'author', 'canonical'];
  }

  connectedCallback() {
    // Find or create <head>
    let head = document.head || document.createElement('head');
    if (!document.head) document.documentElement.prepend(head);

    // Append instead of clearing to preserve static <link> tags
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

    // Load Font Awesome stylesheets
    fontAwesomeStyles.forEach(href => {
      if (!document.querySelector(`link[rel="stylesheet"][href="${href}"]`)) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        head.appendChild(link);
      }
    });

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

    // Hardcoded favicons
    const favicons = [
      { rel: 'apple-touch-icon', sizes: '180x180', href: './img/icons/apple-touch-icon.png' },
      { rel: 'icon', type: 'image/png', sizes: '32x32', href: './img/icons/favicon-32x32.png' },
      { rel: 'icon', type: 'image/png', sizes: '16x16', href: './img/icons/favicon-16x16.png' }
    ];
    favicons.forEach(favicon => {
      if (!document.querySelector(`link[href="${favicon.href}"]`)) {
        const link = document.createElement('link');
        link.rel = favicon.rel;
        link.href = favicon.href;
        if (favicon.sizes) link.sizes = favicon.sizes;
        if (favicon.type) link.type = favicon.type;
        head.appendChild(link);
      }
    });

    // Optional Eruda
    if (this.hasAttribute('include-eruda') && !document.querySelector('script[src="https://cdn.jsdelivr.net/npm/eruda"]')) {
      const scriptEruda = document.createElement('script');
      scriptEruda.src = 'https://cdn.jsdelivr.net/npm/eruda';
      head.appendChild(scriptEruda);
      const scriptInit = document.createElement('script');
      scriptInit.textContent = 'eruda.init();';
      head.appendChild(scriptInit);
    }

    // Scripts
    const scripts = ['./scripts.js', './components.js'];
    scripts.forEach(src => {
      if (!document.querySelector(`script[src="${src}"]`)) {
        const script = document.createElement('script');
        script.src = src;
        script.defer = true;
        script.onerror = () => console.error(`Failed to load script: ${src}`);
        head.appendChild(script);
      }
    });
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (!document.head) return;
    if (name === 'title') {
      let title = document.querySelector('title');
      if (!title) {
        title = document.createElement('title');
        document.head.appendChild(title);
      }
      title.textContent = newValue || 'Sandbox';
    } else if (name === 'description') {
      let meta = document.querySelector('meta[name="description"]');
      if (newValue && !meta) {
        meta = document.createElement('meta');
        meta.name = 'description';
        document.head.appendChild(meta);
      }
      if (meta) meta.content = newValue || '';
    } else if (name === 'keywords') {
      let meta = document.querySelector('meta[name="keywords"]');
      if (newValue && !meta) {
        meta = document.createElement('meta');
        meta.name = 'keywords';
        document.head.appendChild(meta);
      }
      if (meta) meta.content = newValue || '';
    } else if (name === 'author') {
      let meta = document.querySelector('meta[name="author"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'author';
        document.head.appendChild(meta);
      }
      meta.content = newValue || 'David Dufourq';
    } else if (name === 'canonical') {
      let link = document.querySelector('link[rel="canonical"]');
      if (newValue && !link) {
        link = document.createElement('link');
        link.rel = 'canonical';
        document.head.appendChild(link);
      }
      if (link) link.href = newValue || '';
    }
  }
}
customElements.define('bh-head', Head);
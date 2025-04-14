class Footer extends HTMLElement {
    connectedCallback() {
      this.innerHTML = `
        <footer class="min-height-two-thirds">
          <p>© ${new Date().getFullYear()} My Site. All rights reserved.</p>
          <nav>
            <a href="/about">About</a> | <a href="/contact">Contact</a>
          </nav>
        </footer>
      `;
    }
  }
  customElements.define('bh-footer', Footer);

  class Nav extends HTMLElement {
    connectedCallback() {
      const hasDropdown = this.hasAttribute('dropdown') && this.getAttribute('dropdown') !== 'false';
      const menuItemHtml = hasDropdown
        ? `
          <li class="dropdown-toggle">
            <a href="./item2.html">Item 2</a>
            <div class="dropdown-menu">
              <a href="./item2/subitem1.html">Subitem 1</a>
              <a href="./item2/subitem2.html">Subitem 2</a>
            </div>
          </li>
        `
        : `<li><a href="./item2.html">Item 2</a></li>`;
  
      this.innerHTML = `
        <nav ${hasDropdown ? 'class="dropdown"' : ''}>
          <ul>
            <li><a href="./item1.html">Item 1</a></li>
            ${menuItemHtml}
            <li><a href="./item3.html">Item 3</a></li>
            <li><a href="./item4.html">Item 4</a></li>
            <li><a href="./item5.html">Item 5</a></li>
            <li><a href="./item6.html">Item 6</a></li>
          </ul>
          <i class="fa-sharp fa-light fa-bars font-size-medium"></i>
        </nav>
      `;
    }
  }
  customElements.define('bh-nav', Nav);

  class Head extends HTMLElement {
    static get observedAttributes() {
      return ['title', 'description', 'keywords', 'author', 'canonical'];
    }
  
    connectedCallback() {
      // Find or create <head>
      let head = document.head;
      if (!head) {
        head = document.createElement('head');
        document.documentElement.prepend(head);
      }
  
      // Clear existing content to avoid duplicates
      head.innerHTML = '';
  
      // Meta charset
      const metaCharset = document.createElement('meta');
      metaCharset.setAttribute('charset', 'UTF-8');
      head.appendChild(metaCharset);
  
      // Meta viewport
      const metaViewport = document.createElement('meta');
      metaViewport.name = 'viewport';
      metaViewport.content = 'width=device-width, initial-scale=1';
      head.appendChild(metaViewport);
  
      // Title
      const title = document.createElement('title');
      title.textContent = this.getAttribute('title') || 'Sandbox';
      head.appendChild(title);
  
      // Meta author
      const metaAuthor = document.createElement('meta');
      metaAuthor.name = 'author';
      metaAuthor.content = this.getAttribute('author') || 'David Dufourq';
      head.appendChild(metaAuthor);
  
      // Optional meta description
      if (this.hasAttribute('description')) {
        const metaDesc = document.createElement('meta');
        metaDesc.name = 'description';
        metaDesc.content = this.getAttribute('description') || '';
        head.appendChild(metaDesc);
      }
  
      // Optional meta keywords
      if (this.hasAttribute('keywords')) {
        const metaKeywords = document.createElement('meta');
        metaKeywords.name = 'keywords';
        metaKeywords.content = this.getAttribute('keywords') || '';
        head.appendChild(metaKeywords);
      }
  
      // Optional canonical
      if (this.hasAttribute('canonical')) {
        const linkCanonical = document.createElement('link');
        linkCanonical.rel = 'canonical';
        linkCanonical.href = this.getAttribute('canonical') || '';
        head.appendChild(linkCanonical);
      }
  
      // Preload styles
      const preloadStyles = [
        './styles.css',
        './fonts/fontawesome/fontawesome.min.css',
        './fonts/fontawesome/sharp-light.min.css',
        './fonts/fontawesome/brands.min.css'
      ];
      preloadStyles.forEach(href => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = href;
        link.as = 'style';
        head.appendChild(link);
      });
  
      // Optional font preloads
      if (this.hasAttribute('include-fonts')) {
        const fonts = [
          { href: './fonts/Gelica-Medium.woff2', type: 'font/woff2' },
          { href: './fonts/FuturaPT-Light.woff2', type: 'font/woff2' }
        ];
        fonts.forEach(font => {
          const link = document.createElement('link');
          link.rel = 'preload';
          link.href = font.href;
          link.as = 'font';
          link.type = font.type;
          head.appendChild(link);
        });
      }
  
      // Optional favicons
      if (this.hasAttribute('include-favicons')) {
        const favicons = [
          { rel: 'apple-touch-icon', sizes: '180x180', href: './img/icons/apple-touch-icon.png' },
          { rel: 'icon', type: 'image/png', sizes: '32x32', href: './img/icons/favicon-32x32.png' },
          { rel: 'icon', type: 'image/png', sizes: '16x16', href: './img/icons/favicon-16x16.png' }
        ];
        favicons.forEach(favicon => {
          const link = document.createElement('link');
          link.rel = favicon.rel;
          link.href = favicon.href;
          if (favicon.sizes) link.sizes = favicon.sizes;
          if (favicon.type) link.type = favicon.type;
          head.appendChild(link);
        });
      }
  
      // Stylesheets
      const stylesheets = [
        './styles.css',
        './fonts/fontawesome/fontawesome.min.css',
        './fonts/fontawesome/sharp-light.min.css',
        './fonts/fontawesome/brands.min.css'
      ];
      stylesheets.forEach(href => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        head.appendChild(link);
      });
  
      // Optional Eruda
      if (this.hasAttribute('include-eruda')) {
        const scriptEruda = document.createElement('script');
        scriptEruda.src = 'https://cdn.jsdelivr.net/npm/eruda';
        head.appendChild(scriptEruda);
        const scriptInit = document.createElement('script');
        scriptInit.textContent = 'eruda.init();';
        head.appendChild(scriptInit);
      }
  
      // Scripts
      const scripts = [
        './scripts.js',
        './components.js'
      ];
      scripts.forEach(src => {
        const script = document.createElement('script');
        script.src = src;
        script.defer = true;
        head.appendChild(script);
      });
    }
  
    attributeChangedCallback(name, oldValue, newValue) {
      if (!document.head) return;
      if (name === 'title') {
        const title = document.querySelector('title');
        if (title) title.textContent = newValue || 'Sandbox';
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
        const meta = document.querySelector('meta[name="author"]');
        if (meta) meta.content = newValue || 'David Dufourq';
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
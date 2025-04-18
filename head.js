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
      { href: './fonts/AdobeAldine-Regular.woff2', type: 'font/woff2', crossorigin: 'anonymous' }
    ];
    fonts.forEach(font => {
      if (!document.querySelector(`link[href="${font.href}"]`)) {
        console.log(`Adding font preload: ${font.href}`); // Debug: Confirm font preload
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = font.href;
        link.as = 'font';
        link.type = font.type;
        link.crossOrigin = font.crossorigin;
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
        console.log(`Adding Font Awesome preload: ${href}`); // Debug: Confirm preload
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

    // Add main stylesheet (only if not already present in <head> or <body>)
    const mainStylesheet = './styles.css';
    if (!document.querySelector(`link[rel="stylesheet"][href="${mainStylesheet}"]`)) {
      console.log('Adding styles.css stylesheet'); // Debug: Confirm stylesheet addition
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = mainStylesheet;
      head.appendChild(link);
    } else {
      console.log('styles.css stylesheet already present, skipping'); // Debug: Confirm duplicate check
    }

    // Load Font Awesome stylesheets
    fontAwesomeStyles.forEach(href => {
      if (!document.querySelector(`link[rel="stylesheet"][href="${href}"]`)) {
        console.log(`Adding Font Awesome stylesheet: ${href}`); // Debug: Confirm stylesheet
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        head.appendChild(link);
      }
    });

    // Scripts
    const scripts = ['./scripts.js', './components.js'];
    scripts.forEach(src => {
      if (!document.querySelector(`script[src="${src}"]`)) {
        console.log(`Adding script: ${src}`); // Debug: Confirm script
        const script = document.createElement('script');
        script.src = src;
        script.defer = true;
        script.onerror = () => console.error(`Failed to load script: ${src}`);
        head.appendChild(script);
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
        console.log(`Adding favicon: ${favicon.href}`); // Debug: Confirm favicon
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
      console.log('Adding Eruda'); // Debug: Confirm Eruda logic
      const scriptEruda = document.createElement('script');
      scriptEruda.src = 'https://cdn.jsdelivr.net/npm/eruda';
      scriptEruda.onload = () => {
        console.log('Eruda script loaded, initializing'); // Debug: Confirm Eruda load
        const scriptInit = document.createElement('script');
        scriptInit.textContent = 'eruda.init();';
        head.appendChild(scriptInit);
      };
      scriptEruda.onerror = () => console.error('Failed to load Eruda script');
      head.appendChild(scriptEruda);
    }

    // Optional Snipcart e-commerce
    if (this.hasAttribute('include-e-commerce')) {
      console.log('include-e-commerce detected'); // Debug: Confirm attribute check
      if (!document.querySelector('script[data-snipcart]')) {
        console.log('No existing Snipcart script, attempting to add'); // Debug: Confirm no duplicates
        const addSnipcartScript = () => {
          if (!document.body) {
            console.warn('Cannot add Snipcart: <body> element not found');
            return;
          }
          console.log('Adding Snipcart script'); // Debug: Confirm script addition
          // Add Snipcart settings
          const snipcartSettings = document.createElement('script');
          snipcartSettings.type = 'text/javascript';
          snipcartSettings.textContent = `
            window.SnipcartSettings = {
              publicApiKey: 'NTMzMTQxN2UtNjQ3ZS00ZWNjLWEyYmEtOTNiNGMwNzYyYWNlNjM4ODA0NjY5NzE2NjExMzg5',
              loadStrategy: 'on-user-interaction',
              version: '3.0'
            };
          `;
          document.body.prepend(snipcartSettings);

          // Add Snipcart inline script
          const snipcartScript = document.createElement('script');
          snipcartScript.dataset.snipcart = 'true';
          snipcartScript.type = 'text/javascript';
          snipcartScript.textContent = `
            try {
              (() => {
                var c, d;
                (d = (c = window.SnipcartSettings).version) != null || (c.version = "3.0");
                var s, S;
                (S = (s = window.SnipcartSettings).timeoutDuration) != null || (s.timeoutDuration = 2750);
                var l, p;
                (p = (l = window.SnipcartSettings).domain) != null || (l.domain = "cdn.snipcart.com");
                var w, u;
                (u = (w = window.SnipcartSettings).protocol) != null || (w.protocol = "https");
                var f = window.SnipcartSettings.version.includes("v3.0.0-ci") || window.SnipcartSettings.version != "3.0" && window.SnipcartSettings.version.localeCompare("3.4.0", void 0, { numeric: true, sensitivity: "base" }) === -1,
                  m = ["focus", "mouseover", "touchmove", "scroll", "keydown"];
                window.LoadSnipcart = o;
                document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", r) : r();
                function r() {
                  window.SnipcartSettings.loadStrategy ? window.SnipcartSettings.loadStrategy === "on-user-interaction" && (m.forEach(t => document.addEventListener(t, o)), setTimeout(o, window.SnipcartSettings.timeoutDuration)) : o();
                }
                var a = false;
                function o() {
                  if (a) return;
                  a = true;
                  let t = document.getElementsByTagName("head")[0],
                    e = document.querySelector("#snipcart"),
                    i = document.querySelector(\`src[src^="\${window.SnipcartSettings.protocol}://\${window.SnipcartSettings.domain}"][src$="snipcart.js"]\`),
                    n = document.querySelector(\`link[href^="\${window.SnipcartSettings.protocol}://\${window.SnipcartSettings.domain}"][href$="snipcart.css"]\`);
                  e || (e = document.createElement("div"), e.id = "snipcart", e.setAttribute("hidden", "true"), document.body.appendChild(e));
                  v(e);
                  i || (i = document.createElement("script"), i.src = \`\${window.SnipcartSettings.protocol}://\${window.SnipcartSettings.domain}/themes/v\${window.SnipcartSettings.version}/default/snipcart.js\`, i.async = true, t.appendChild(i));
                  n || (n = document.createElement("link"), n.rel = "stylesheet", n.type = "text/css", n.href = \`\${window.SnipcartSettings.protocol}://\${window.SnipcartSettings.domain}/themes/v\${window.SnipcartSettings.version}/default/snipcart.css\`, t.prepend(n));
                  m.forEach(g => document.removeEventListener(g, o));
                  console.log('Snipcart initialized'); // Debug: Confirm initialization
                }
                function v(t) {
                  if (!f) return;
                  t.dataset.apiKey = window.SnipcartSettings.publicApiKey;
                  window.SnipcartSettings.addProductBehavior && (t.dataset.configAddProductBehavior = window.SnipcartSettings.addProductBehavior);
                  window.SnipcartSettings.modalStyle && (t.dataset.configModalStyle = window.SnipcartSettings.modalStyle);
                  window.SnipcartSettings.currency && (t.dataset.currency = window.SnipcartSettings.currency);
                  window.SnipcartSettings.templatesUrl && (t.dataset.templatesUrl = window.SnipcartSettings.templatesUrl);
                }
              })();
            } catch (error) {
              console.error('Snipcart script error:', error);
            }
          `;
          snipcartScript.onerror = () => console.error('Failed to load Snipcart script');
          document.body.appendChild(snipcartScript); // Use appendChild to avoid prepend issues
        };

        // Add Snipcart on DOMContentLoaded to ensure DOM is parsed
        console.log('Scheduling Snipcart script addition'); // Debug: Confirm scheduling
        document.addEventListener('DOMContentLoaded', addSnipcartScript);
      } else {
        console.log('Snipcart script already exists'); // Debug: Confirm duplicate check
      }
    } else {
      console.log('include-e-commerce attribute not found'); // Debug: Confirm attribute missing
    }

    // Add preconnect for Snipcart CDN
    if (this.hasAttribute('include-e-commerce') && !document.querySelector('link[href="https://cdn.snipcart.com"]')) {
      console.log('Adding Snipcart preconnect'); // Debug: Confirm preconnect
      const preconnect = document.createElement('link');
      preconnect.rel = 'preconnect';
      preconnect.href = 'https://cdn.snipcart.com';
      head.appendChild(preconnect);
    }

    // Remove <bh-head> from DOM to prevent it appearing in <body>
    if (this.parentNode) {
      console.log('Removing bh-head from DOM'); // Debug: Confirm removal
      this.parentNode.removeChild(this);
    }

    // Initialize theme color and listen for changes
    this.updateThemeColor();
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => this.updateThemeColor());
  }

  updateThemeColor() {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) return;

    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const color = isDarkMode
      ? getComputedStyle(document.documentElement).getPropertyValue('--color-background-dark').trim()
      : getComputedStyle(document.documentElement).getPropertyValue('--color-background-light').trim();

    if (color) {
      console.log(`Updating theme-color to: ${color}`); // Debug: Confirm theme color update
      metaThemeColor.setAttribute('content', color);
    } else {
      console.warn('Theme color not updated: CSS variables not found');
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (!document.head) return;
    if (name === 'title') {
      let title = document.querySelector('title');
      if (!title) {
        title = document.createElement('title');
        head.appendChild(title);
      }
      title.textContent = newValue || 'Sandbox';
    } else if (name === 'description') {
      let meta = document.querySelector('meta[name="description"]');
      if (newValue && !meta) {
        meta = document.createElement('meta');
        meta.name = 'description';
        head.appendChild(meta);
      }
      if (meta) meta.content = newValue || '';
    } else if (name === 'keywords') {
      let meta = document.querySelector('meta[name="keywords"]');
      if (newValue && !meta) {
        meta = document.createElement('meta');
        meta.name = 'keywords';
        head.appendChild(meta);
      }
      if (meta) meta.content = newValue || '';
    } else if (name === 'author') {
      let meta = document.querySelector('meta[name="author"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'author';
        head.appendChild(meta);
      }
      meta.content = newValue || 'David Dufourq';
    } else if (name === 'canonical') {
      let link = document.querySelector('link[rel="canonical"]');
      if (newValue && !link) {
        link = document.createElement('link');
        link.rel = 'canonical';
        head.appendChild(link);
      }
      if (link) link.href = newValue || '';
    }
  }
}
console.log('bh-head custom element defined'); // Debug: Confirm definition
customElements.define('bh-head', Head);
class Head extends HTMLElement {
  static get observedAttributes() {
    // MODIFIED: Removed include-e-commerce, as dynamic updates are not needed
    return ['title', 'description', 'keywords', 'author', 'canonical'];
  }

  connectedCallback() {
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

    // Preload Font Awesome styles (first)
    fontAwesomeStyles.forEach(href => {
      if (!document.querySelector(`link[href="${href}"]`)) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = href;
        link.as = 'style';
        head.appendChild(link);
      }
    });

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

    // Add theme-color meta tag without id
    if (!document.querySelector('meta[name="theme-color"]')) {
      const metaThemeColor = document.createElement('meta');
      metaThemeColor.name = 'theme-color';
      metaThemeColor.content = 'cyan'; // Fallback color
      head.appendChild(metaThemeColor);
    }

    // Add main stylesheet (ensure CSS variables are available)
    const mainStylesheet = './styles.css'; // Adjust path as needed
    if (!document.querySelector(`link[href="${mainStylesheet}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = mainStylesheet;
      head.appendChild(link);
    }

    // Load Font Awesome stylesheets
    fontAwesomeStyles.forEach(href => {
      if (!document.querySelector(`link[rel="stylesheet"][href="${href}"]`)) {
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

    // NEW: Optional Snipcart e-commerce (fixed on page load)
    if (this.hasAttribute('include-e-commerce') && !document.querySelector('script[data-snipcart]')) {
      if (!document.body) {
        console.warn('Cannot add Snipcart: <body> element not found');
        return;
      }

      // Add Snipcart script just after <body>
      const snipcartScript = document.createElement('script');
      snipcartScript.dataset.snipcart = 'true'; // Marker to identify Snipcart script
      snipcartScript.textContent = `
        window.SnipcartSettings = {
            publicApiKey: 'NTMzMTQxN2UtNjQ3ZS00ZWNjLWEyYmEtOTNiNGMwNzYyYWNlNjM4ODA0NjY5NzE2NjExMzg5',
            loadStrategy: 'on-user-interaction',
        };

        (()=>{var c,d;(d=(c=window.SnipcartSettings).version)!=null||(c.version="3.0");var s,S;(S=(s=window.SnipcartSettings).timeoutDuration)!=null||(s.timeoutDuration=2750);var l,p;(p=(l=window.SnipcartSettings).domain)!=null||(l.domain="cdn.snipcart.com");var w,u;(u=(w=window.SnipcartSettings).protocol)!=null||(w.protocol="https");var f=window.SnipcartSettings.version.includes("v3.0.0-ci")||window.SnipcartSettings.version!="3.0"&&window.SnipcartSettings.version.localeCompare("3.4.0",void 0,{numeric:!0,sensitivity:"base"})===-1,m=["focus","mouseover","touchmove","scroll","keydown"];window.LoadSnipcart=o;document.readyState==="loading"?document.addEventListener("DOMContentLoaded",r):r();function r(){window.SnipcartSettings.loadStrategy?window.SnipcartSettings.loadStrategy==="on-user-interaction"&&(m.forEach(t=>document.addEventListener(t,o)),setTimeout(o,window.SnipcartSettings.timeoutDuration)):o()}var a=!1;function o(){if(a)return;a=!0;let t=document.getElementsByTagName("head")[0],e=document.querySelector("#snipcart"),i=document.querySelector('src[src^="${window.SnipcartSettings.protocol}://${window.SnipcartSettings.domain}"][src$="snipcart.js"]'),n=document.querySelector('link[href^="${window.SnipcartSettings.protocol}://${window.SnipcartSettings.domain}"][href$="snipcart.css"]');e||(e=document.createElement("div"),e.id="snipcart",e.setAttribute("hidden","true"),document.body.appendChild(e)),v(e),i||(i=document.createElement("script"),i.src='${window.SnipcartSettings.protocol}://${window.SnipcartSettings.domain}/themes/v${window.SnipcartSettings.version}/default/snipcart.js',i.async=!0,t.appendChild(i)),n||(n=document.createElement("link"),n.rel="stylesheet",n.type="text/css",n.href='${window.SnipcartSettings.protocol}://${window.SnipcartSettings.domain}/themes/v${window.SnipcartSettings.version}/default/snipcart.css',t.prepend(n)),m.forEach(g=>document.removeEventListener(g,o))}function v(t){!f||(t.dataset.apiKey=window.SnipcartSettings.publicApiKey,window.SnipcartSettings.addProductBehavior&&(t.dataset.configAddProductBehavior=window.SnipcartSettings.addProductBehavior),window.SnipcartSettings.modalStyle&&(t.dataset.configModalStyle=window.SnipcartSettings.modalStyle),window.SnipcartSettings.currency&&(t.dataset.currency=window.SnipcartSettings.currency),window.SnipcartSettings.templatesUrl&&(t.dataset.templatesUrl=window.SnipcartSettings.templatesUrl))}})();
      `;
      snipcartScript.onerror = () => console.error('Failed to load Snipcart script');
      document.body.prepend(snipcartScript); // Place just after <body>
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
    // MODIFIED: Removed include-e-commerce case, as dynamic updates are not needed
  }
}
customElements.define('bh-head', Head);
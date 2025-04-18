// Define <bh-head> custom element (for potential <body> use)
class Head extends HTMLElement {
  static get observedAttributes() {
    return ['title', 'description', 'keywords', 'author', 'canonical'];
  }

  connectedCallback() {
    console.log('bh-head connectedCallback started (body context)'); // Debug
    // Minimal logic for <body> use, if needed
    this.updateThemeColor();
  }

  updateThemeColor() {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) return;

    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const color = isDarkMode
      ? getComputedStyle(document.documentElement).getPropertyValue('--color-background-dark').trim()
      : getComputedStyle(document.documentElement).getPropertyValue('--color-background-light').trim();

    if (color) {
      console.log(`Updating theme-color to: ${color}`); // Debug
      metaThemeColor.setAttribute('content', color);
    } else {
      console.warn('Theme color not updated: CSS variables not found');
    }
  }
}
console.log('bh-head custom element defined'); // Debug
customElements.define('bh-head', Head);

// Head management function (replaces <bh-head> in <head>)
function manageHead(attributes = {}) {
  console.log('manageHead started'); // Debug

  // Find or create <head>
  let head = document.head || document.createElement('head');
  if (!document.head) document.documentElement.prepend(head);

  // Hardcoded font preloads
  const fonts = [
    { href: './fonts/AdobeAldine-Regular.woff2', type: 'font/woff2', crossorigin: 'anonymous' }
  ];
  fonts.forEach(font => {
    if (!document.querySelector(`link[href="${font.href}"]`)) {
      console.log(`Adding font preload: ${font.href}`); // Debug
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
      console.log(`Adding Font Awesome preload: ${href}`); // Debug
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = href;
      link.as = 'style';
      head.appendChild(link);
    }
  });

  // Append meta tags
  if (!document.querySelector('meta[charset]')) {
    console.log('Adding meta charset'); // Debug
    const metaCharset = document.createElement('meta');
    metaCharset.setAttribute('charset', 'UTF-8');
    head.appendChild(metaCharset);
  }

  if (!document.querySelector('meta[name="viewport"]')) {
    console.log('Adding meta viewport'); // Debug
    const metaViewport = document.createElement('meta');
    metaViewport.name = 'viewport';
    metaViewport.content = 'width=device-width, initial-scale=1';
    head.appendChild(metaViewport);
  }

  if (!document.querySelector('title')) {
    console.log('Adding title'); // Debug
    const title = document.createElement('title');
    title.textContent = attributes.title || 'Sandbox';
    head.appendChild(title);
  }

  if (!document.querySelector('meta[name="author"]')) {
    console.log('Adding meta author'); // Debug
    const metaAuthor = document.createElement('meta');
    metaAuthor.name = 'author';
    metaAuthor.content = attributes.author || 'David Dufourq';
    head.appendChild(metaAuthor);
  }

  if (attributes.description && !document.querySelector('meta[name="description"]')) {
    console.log('Adding meta description'); // Debug
    const metaDesc = document.createElement('meta');
    metaDesc.name = 'description';
    metaDesc.content = attributes.description || '';
    head.appendChild(metaDesc);
  }

  if (attributes.keywords && !document.querySelector('meta[name="keywords"]')) {
    console.log('Adding meta keywords'); // Debug
    const metaKeywords = document.createElement('meta');
    metaKeywords.name = 'keywords';
    metaKeywords.content = attributes.keywords || '';
    head.appendChild(metaKeywords);
  }

  if (attributes.canonical && !document.querySelector('link[rel="canonical"]')) {
    console.log('Adding link canonical'); // Debug
    const linkCanonical = document.createElement('link');
    linkCanonical.rel = 'canonical';
    linkCanonical.href = attributes.canonical || '';
    head.appendChild(linkCanonical);
  }

  // Add theme-color meta tag
  if (!document.querySelector('meta[name="theme-color"]')) {
    console.log('Adding meta theme-color'); // Debug
    const metaThemeColor = document.createElement('meta');
    metaThemeColor.name = 'theme-color';
    metaThemeColor.content = 'cyan';
    head.appendChild(metaThemeColor);
  }

  // Load Font Awesome stylesheets
  fontAwesomeStyles.forEach(href => {
    if (!document.querySelector(`link[rel="stylesheet"][href="${href}"]`)) {
      console.log(`Adding Font Awesome stylesheet: ${href}`); // Debug
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
      console.log(`Adding script: ${src}`); // Debug
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
      console.log(`Adding favicon: ${favicon.href}`); // Debug
      const link = document.createElement('link');
      link.rel = favicon.rel;
      link.href = favicon.href;
      if (favicon.sizes) link.sizes = favicon.sizes;
      if (favicon.type) link.type = favicon.type;
      head.appendChild(link);
    }
  });

  // Add main stylesheet on DOMContentLoaded
  const mainStylesheet = './styles.css';
  const addStylesheet = () => {
    setTimeout(() => {
      if (!document.querySelector(`link[rel="stylesheet"][href="${mainStylesheet}"]`)) {
        console.log('Forcing styles.css stylesheet in <head>'); // Debug
        const link = document.createElement('link');
        link.rel = ' periodontitis';
        link.href = mainStylesheet;
        head.appendChild(link);
      } else {
        console.log('styles.css stylesheet already present in <head>, skipping force'); // Debug
      }
    }, 100);
  };
  console.log('Scheduling styles.css check on DOMContentLoaded'); // Debug
  document.addEventListener('DOMContentLoaded', addStylesheet);

  // Optional Snipcart e-commerce
  if (attributes['include-e-commerce']) {
    console.log('include-e-commerce detected'); // Debug
    if (!document.querySelector('script[data-snipcart]')) {
      console.log('No existing Snipcart script, attempting to add'); // Debug
      const addSnipcartScript = () => {
        if (!document.body) {
          console.warn('Cannot add Snipcart: <body> element not found');
          return;
        }
        console.log('Adding Snipcart scripts'); // Debug
        // Add Snipcart settings
        const snipcartSettings = document.createElement('script');
        snipcartSettings.type = 'text/javascript';
        snipcartSettings.textContent = `
          console.log('Setting window.SnipcartSettings'); // Debug
          window.SnipcartSettings = {
            publicApiKey: 'NTMzMTQxN2UtNjQ3ZS00ZWNjLWEyYmEtOTNiNGMwNzYyYWNlNjM4ODA0NjY5NzE2NjExMzg5',
            loadStrategy: 'on-user-interaction',
            version: '3.0'
          };
        `;
        document.body.appendChild(snipcartSettings);

        // Add Snipcart inline script
        const snipcartScript = document.createElement('script');
        snipcartScript.dataset.snipcart = 'true';
        snipcartScript.type = 'text/javascript';
        snipcartScript.textContent = `
          try {
            console.log('Executing Snipcart inline script'); // Debug
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
                console.log('Snipcart initialized'); // Debug
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
        document.body.appendChild(snipcartScript);
      };

      // Add Snipcart on DOMContentLoaded to ensure DOM is parsed
      console.log('Scheduling Snipcart script addition'); // Debug
      document.addEventListener('DOMContentLoaded', addSnipcartScript);
    } else {
      console.log('Snipcart script already exists'); // Debug
    }
  } else {
    console.log('include-e-commerce attribute not found'); // Debug
  }

  // Add preconnect for Snipcart CDN
  if (attributes['include-e-commerce'] && !document.querySelector('link[href="https://cdn.snipcart.com"]')) {
    console.log('Adding Snipcart preconnect'); // Debug
    const preconnect = document.createElement('link');
    preconnect.rel = 'preconnect';
    preconnect.href = 'https://cdn.snipcart.com';
    head.appendChild(preconnect);
  }

  // Initialize theme color and listen for changes
  const updateThemeColor = () => {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) return;

    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const color = isDarkMode
      ? getComputedStyle(document.documentElement).getPropertyValue('--color-background-dark').trim()
      : getComputedStyle(document.documentElement).getPropertyValue('--color-background-light').trim();

    if (color) {
      console.log(`Updating theme-color to: ${color}`); // Debug
      metaThemeColor.setAttribute('content', color);
    } else {
      console.warn('Theme color not updated: CSS variables not found');
    }
  };
  updateThemeColor();
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateThemeColor);
}

// Execute head management immediately
document.addEventListener('DOMContentLoaded', () => {
  manageHead({
    title: 'Home',
    description: 'Welcome to my photography portfolio',
    keywords: 'portfolio, web design',
    author: 'David Dufourq',
    canonical: 'https://linktopage.com',
    'include-e-commerce': true
  });
});
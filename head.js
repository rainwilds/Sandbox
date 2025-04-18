// Define <bh-head> custom element (for potential <body> use, minimal logic)
class Head extends HTMLElement {
  static get observedAttributes() {
    return ['title', 'description', 'keywords', 'author', 'canonical'];
  }

  connectedCallback() {
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
      metaThemeColor.setAttribute('content', color);
    }
  }
}
customElements.define('bh-head', Head);

// Head management function
function manageHead(attributes = {}) {
  // Find or create <head>
  let head = document.head || document.createElement('head');
  if (!document.head) document.documentElement.prepend(head);

  // Hardcoded font preloads
  const fonts = [
    { href: './fonts/AdobeAldine-Regular.woff2', type: 'font/woff2', crossorigin: 'anonymous' }
  ];
  fonts.forEach(font => {
    if (!document.querySelector(`link[href="${font.href}"]`)) {
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
    title.textContent = attributes.title || 'Sandbox';
    head.appendChild(title);
  }

  if (!document.querySelector('meta[name="author"]')) {
    const metaAuthor = document.createElement('meta');
    metaAuthor.name = 'author';
    metaAuthor.content = attributes.author || 'David Dufourq';
    head.appendChild(metaAuthor);
  }

  if (attributes.description && !document.querySelector('meta[name="description"]')) {
    const metaDesc = document.createElement('meta');
    metaDesc.name = 'description';
    metaDesc.content = attributes.description || '';
    head.appendChild(metaDesc);
  }

  if (attributes.keywords && !document.querySelector('meta[name="keywords"]')) {
    const metaKeywords = document.createElement('meta');
    metaKeywords.name = 'keywords';
    metaKeywords.content = attributes.keywords || '';
    head.appendChild(metaKeywords);
  }

  if (attributes.canonical && !document.querySelector('link[rel="canonical"]')) {
    const linkCanonical = document.createElement('link');
    linkCanonical.rel = 'canonical';
    linkCanonical.href = attributes.canonical || '';
    head.appendChild(linkCanonical);
  }

  // Add theme-color meta tag
  if (!document.querySelector('meta[name="theme-color"]')) {
    const metaThemeColor = document.createElement('meta');
    metaThemeColor.name = 'theme-color';
    metaThemeColor.content = 'cyan';
    head.appendChild(metaThemeColor);
  }

  // Add Open Graph (OG) meta tags
  if (!document.querySelector('meta[property="og:url"]')) {
    const ogUrl = document.createElement('meta');
    ogUrl.setAttribute('property', 'og:url');
    ogUrl.setAttribute('content', attributes['og-url'] || 'https://rainwilds.github.io/Sandbox/index.html');
    head.appendChild(ogUrl);
  }

  if (!document.querySelector('meta[property="og:type"]')) {
    const ogType = document.createElement('meta');
    ogType.setAttribute('property', 'og:type');
    ogType.setAttribute('content', attributes['og-type'] || 'website');
    head.appendChild(ogType);
  }

  if (!document.querySelector('meta[property="og:title"]')) {
    const ogTitle = document.createElement('meta');
    ogTitle.setAttribute('property', 'og:title');
    ogTitle.setAttribute('content', attributes['og-title'] || attributes.title || 'Sandbox');
    head.appendChild(ogTitle);
  }

  if (!document.querySelector('meta[property="og:description"]')) {
    const ogDescription = document.createElement('meta');
    ogDescription.setAttribute('property', 'og:description');
    ogDescription.setAttribute('content', attributes['og-description'] || attributes.description || '');
    head.appendChild(ogDescription);
  }

  if (!document.querySelector('meta[property="og:image"]')) {
    const ogImage = document.createElement('meta');
    ogImage.setAttribute('property', 'og:image');
    ogImage.setAttribute('content', attributes['og-image'] || 'https://rainwilds.github.io/Sandbox/img/preview.jpg');
    head.appendChild(ogImage);
  }

  // Add Twitter meta tags
  if (!document.querySelector('meta[name="twitter:card"]')) {
    const twitterCard = document.createElement('meta');
    twitterCard.setAttribute('name', 'twitter:card');
    twitterCard.setAttribute('content', attributes['twitter-card'] || 'summary_large_image');
    head.appendChild(twitterCard);
  }

  if (!document.querySelector('meta[property="twitter:domain"]')) {
    const twitterDomain = document.createElement('meta');
    twitterDomain.setAttribute('property', 'twitter:domain');
    twitterDomain.setAttribute('content', attributes['twitter-domain'] || 'rainwilds.github.io');
    head.appendChild(twitterDomain);
  }

  if (!document.querySelector('meta[property="twitter:url"]')) {
    const twitterUrl = document.createElement('meta');
    twitterUrl.setAttribute('property', 'twitter:url');
    twitterUrl.setAttribute('content', attributes['twitter-url'] || 'https://rainwilds.github.io/Sandbox/index.html');
    head.appendChild(twitterUrl);
  }

  if (!document.querySelector('meta[name="twitter:title"]')) {
    const twitterTitle = document.createElement('meta');
    twitterTitle.setAttribute('name', 'twitter:title');
    twitterTitle.setAttribute('content', attributes['twitter-title'] || attributes.title || 'Sandbox');
    head.appendChild(twitterTitle);
  }

  if (!document.querySelector('meta[name="twitter:description"]')) {
    const twitterDescription = document.createElement('meta');
    twitterDescription.setAttribute('name', 'twitter:description');
    twitterDescription.setAttribute('content', attributes['twitter-description'] || attributes.description || '');
    head.appendChild(twitterDescription);
  }

  if (!document.querySelector('meta[name="twitter:image"]')) {
    const twitterImage = document.createElement('meta');
    twitterImage.setAttribute('name', 'twitter:image');
    twitterImage.setAttribute('content', attributes['twitter-image'] || attributes['og-image'] || 'https://rainwilds.github.io/Sandbox/img/preview.jpg');
    head.appendChild(twitterImage);
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
  const scripts = ['./components.js', './scripts.js'];
  scripts.forEach(src => {
    if (!document.querySelector(`script[src="${src}"]`)) {
      const script = document.createElement('script');
      script.src = src;
      script.defer = true;
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

  // Add main stylesheet immediately
  const mainStylesheet = './styles.css';
  if (!document.querySelector(`link[rel="stylesheet"][href="${mainStylesheet}"]`)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = mainStylesheet;
    head.appendChild(link);
  }

  // Optional Snipcart e-commerce
  if (attributes['include-e-commerce']) {
    if (!document.querySelector('script[data-snipcart]')) {
      // Add Snipcart immediately
      if (!document.body) return;
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
      document.body.appendChild(snipcartSettings);

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
              n || (n = document.createElement("link"), n.rel = "stylesheet", n.type = "text/css", n.href = \`\${window.SnipcartSettings.protocol}://\${window.SnipcartSettings.domain}/themes/v\${window.SnipcartSettings.version}/default/snipcart.css\`, t.appendChild(n));
              m.forEach(g => document.removeEventListener(g, o));
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
        } catch (error) {}
      `;
      document.body.appendChild(snipcartScript);
    }
  }

  // Add preconnect for Snipcart CDN
  if (attributes['include-e-commerce'] && !document.querySelector('link[href="https://cdn.snipcart.com"]')) {
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
      metaThemeColor.setAttribute('content', color);
    }
  };
  updateThemeColor();
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateThemeColor);
}

// Read <data-bh-head> attributes and call manageHead
document.addEventListener('DOMContentLoaded', () => {
  const dataHead = document.querySelector('data-bh-head');
  if (dataHead) {
    const attributes = {
      title: dataHead.dataset.title,
      description: dataHead.dataset.description,
      keywords: dataHead.dataset.keywords,
      author: dataHead.dataset.author,
      canonical: dataHead.dataset.canonical,
      'og-title': dataHead.dataset.ogTitle,
      'og-description': dataHead.dataset.ogDescription,
      'og-image': dataHead.dataset.ogImage,
      'og-url': dataHead.dataset.ogUrl,
      'og-type': dataHead.dataset.ogType,
      'twitter-title': dataHead.dataset.twitterTitle,
      'twitter-description': dataHead.dataset.twitterDescription,
      'twitter-image': dataHead.dataset.twitterImage,
      'twitter-url': dataHead.dataset.twitterUrl,
      'twitter-domain': dataHead.dataset.twitterDomain,
      'twitter-card': dataHead.dataset.twitterCard,
      'include-e-commerce': dataHead.hasAttribute('data-include-e-commerce'),
      'include-eruda': dataHead.hasAttribute('data-include-eruda')
    };
    manageHead(attributes);
    // Remove <data-bh-head> from DOM to keep <head> clean
    if (dataHead.parentNode) {
      dataHead.parentNode.removeChild(dataHead);
    }
  } else {
    manageHead({
      title: 'Sandbox',
      description: '',
      keywords: '',
      author: 'David Dufourq',
      canonical: ''
    });
  }
});
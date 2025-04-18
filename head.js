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
function manageHead(attributes = {}, businessConfig = {}) {
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
    metaAuthor.content = attributes.author || 'Unknown';
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

  // Add schema markup (WebSite, LocalBusiness, optional Product)
  const schemaScript = document.createElement('script');
  schemaScript.type = 'application/ld+json';
  const schemas = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": attributes['schema-site-name'] || attributes.title || 'Business Site',
      "url": attributes['schema-site-url'] || 'https://rainwilds.github.io/Sandbox/'
    },
    {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "name": attributes['business-name'] || businessConfig.business?.name || attributes.title || 'Business Site',
      "url": attributes['business-url'] || businessConfig.business?.url || attributes['schema-site-url'] || 'https://rainwilds.github.io/Sandbox/',
      "telephone": attributes['business-telephone'] || businessConfig.business?.telephone || '',
      "address": (attributes['business-address-street'] || businessConfig.business?.address?.streetAddress) ? {
        "@type": "PostalAddress",
        "streetAddress": attributes['business-address-street'] || businessConfig.business?.address?.streetAddress || '',
        "addressLocality": attributes['business-address-locality'] || businessConfig.business?.address?.addressLocality || '',
        "addressRegion": attributes['business-address-region'] || businessConfig.business?.address?.addressRegion || '',
        "postalCode": attributes['business-address-postal'] || businessConfig.business?.address?.postalCode || '',
        "addressCountry": attributes['business-address-country'] || businessConfig.business?.address?.addressCountry || ''
      } : undefined,
      "openingHours": attributes['business-opening-hours'] || businessConfig.business?.openingHours || ''
    }
  ];

  // Add Product schema if e-commerce is enabled
  if (attributes['include-e-commerce']) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "Product",
      "name": attributes['product-name'] || 'Featured Product',
      "description": attributes['product-description'] || attributes.description || 'High-quality product.',
      "image": attributes['product-image'] || attributes['og-image'] || 'https://rainwilds.github.io/Sandbox/img/product.jpg',
      "offers": {
        "@type": "Offer",
        "priceCurrency": attributes['product-price-currency'] || 'USD',
        "price": attributes['product-price'] || '10.00',
        "availability": attributes['product-availability'] || 'https://schema.org/InStock'
      }
    });
  }

  // Filter out schemas with undefined properties (e.g., address if no street)
  schemaScript.textContent = JSON.stringify(schemas.filter(schema => schema.address ? schema.address.streetAddress : true));
  head.appendChild(schemaScript);

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

  // Add main stylesheet with strict <head> check
  const mainStylesheet = './styles.css';
  if (!document.querySelector(`link[rel="stylesheet"][href="${mainStylesheet}"]`)) {
    console.log('Adding styles.css to <head>'); // TEMPORARY: Remove after testing
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = mainStylesheet;
    head.appendChild(link);
  } else {
    console.log('styles.css already in DOM'); // TEMPORARY: Remove after testing
  }
}

// Process <data-bh-head> attributes and fetch business-info.json
document.addEventListener('DOMContentLoaded', () => {
  const dataHead = document.querySelector('data-bh-head');
  // Read attributes immediately
  const attributes = dataHead ? {
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
    'business-name': dataHead.dataset.businessName,
    'business-url': dataHead.dataset.businessUrl,
    'business-telephone': dataHead.dataset.businessTelephone,
    'business-address-street': dataHead.dataset.businessAddressStreet,
    'business-address-locality': dataHead.dataset.businessAddressLocality,
    'business-address-region': dataHead.dataset.businessAddressRegion,
    'business-address-postal': dataHead.dataset.businessAddressPostal,
    'business-address-country': dataHead.dataset.businessAddressCountry,
    'business-opening-hours': dataHead.dataset.businessOpeningHours,
    'schema-site-name': dataHead.dataset.schemaSiteName,
    'schema-site-url': dataHead.dataset.schemaSiteUrl,
    'product-name': dataHead.dataset.productName,
    'product-description': dataHead.dataset.productDescription,
    'product-image': dataHead.dataset.productImage,
    'product-price-currency': dataHead.dataset.productPriceCurrency,
    'product-price': dataHead.dataset.productPrice,
    'product-availability': dataHead.dataset.productAvailability,
    'include-e-commerce': dataHead.hasAttribute('data-include-e-commerce'),
    'include-eruda': dataHead.hasAttribute('data-include-eruda')
  } : {
    title: 'Sandbox',
    description: '',
    keywords: '',
    author: 'Unknown',
    canonical: ''
  };

  // Remove <data-bh-head> immediately to prevent parsing issues
  if (dataHead && dataHead.parentNode) {
    console.log('Removing data-bh-head from DOM'); // TEMPORARY: Remove after testing
    dataHead.parentNode.removeChild(dataHead);
  }

  // Fetch business-info.json
  fetch('/Sandbox/business-info.json')
    .then(response => response.ok ? response.json() : {})
    .then(businessConfig => {
      console.log('Fetched business-info.json:', businessConfig); // TEMPORARY: Remove after testing
      manageHead(attributes, businessConfig);
    })
    .catch(error => {
      console.warn('Failed to fetch business-info.json:', error.message); // TEMPORARY: Remove after testing
      manageHead(attributes, {});
    });
});
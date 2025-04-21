// Manages the <head> section by adding meta tags, styles, scripts, and schema markup
function manageHead(attributes = {}, businessInfo = {}) {
  // Ensure <head> exists, creating one if necessary
  let head = document.head || document.createElement('head');
  if (!document.head) document.documentElement.prepend(head);

  // Preload fonts to improve performance
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
      if (font.crossorigin) link.crossOrigin = font.crossorigin;
      head.appendChild(link);
    }
  });

  // Preload Font Awesome styles for icons
  const fontAwesomeStyles = [
    './fonts/fontawesome/fontawesome.min.css',
    './fonts/fontawesome/sharp-light.min.css',
    './fonts/fontawesome/brands.min.css'
  ];
  fontAwesomeStyles.forEach(href => {
    if (!document.querySelector(`link[href="${href}"]`)) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = href;
      link.as = 'style';
      head.appendChild(link);
    }
  });

  // Add essential meta tags (charset, viewport, robots, title, author, etc.)
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

  if (!document.querySelector('meta[name="robots"]')) {
    const metaRobots = document.createElement('meta');
    metaRobots.name = 'robots';
    metaRobots.content = attributes.robots || 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
    head.appendChild(metaRobots);
  }

  if (!document.querySelector('title')) {
    const title = document.createElement('title');
    title.textContent = attributes.title || 'Behive';
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

  // Add theme-color meta tag with dynamic light/dark support using CSS variables
  const updateThemeColor = () => {
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.name = 'theme-color';
      head.appendChild(metaThemeColor);
    }
    const theme = document.documentElement.dataset.theme || document.body.dataset.theme;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = theme ? theme === 'dark' : prefersDark;
    const rootStyle = getComputedStyle(document.documentElement);
    const lightColor = attributes['theme-color-light'] || rootStyle.getPropertyValue('--color-background-light').trim();
    const darkColor = attributes['theme-color-dark'] || rootStyle.getPropertyValue('--color-background-dark').trim();
    metaThemeColor.content = isDark ? darkColor : lightColor;
  };

  updateThemeColor();
  const htmlObserver = new MutationObserver(updateThemeColor);
  htmlObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  const bodyObserver = new MutationObserver(updateThemeColor);
  bodyObserver.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateThemeColor);

  // Add Open Graph (OG) meta tags for social media sharing
  if (!document.querySelector('meta[property="og:locale"]')) {
    const ogLocale = document.createElement('meta');
    ogLocale.setAttribute('property', 'og:locale');
    ogLocale.setAttribute('content', attributes['og-locale'] || 'en_AU');
    head.appendChild(ogLocale);
  }
  if (!document.querySelector('meta[property="og:url"]')) {
    const ogUrl = document.createElement('meta');
    ogUrl.setAttribute('property', 'og:url');
    ogUrl.setAttribute('content', attributes['og-url'] || 'https://rainwilds.github.io/Sandbox/');
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
    ogTitle.setAttribute('content', attributes['og-title'] || attributes.title || 'Behive');
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
  if (!document.querySelector('meta[property="og:site_name"]')) {
    const ogSiteName = document.createElement('meta');
    ogSiteName.setAttribute('property', 'og:site_name');
    ogSiteName.setAttribute('content', attributes['og-site-name'] || 'Behive');
    head.appendChild(ogSiteName);
  }

  // Add Twitter meta tags for social media sharing
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
    twitterUrl.setAttribute('content', attributes['twitter-url'] || 'https://rainwilds.github.io/Sandbox/');
    head.appendChild(twitterUrl);
  }
  if (!document.querySelector('meta[name="twitter:title"]')) {
    const twitterTitle = document.createElement('meta');
    twitterTitle.setAttribute('name', 'twitter:title');
    twitterTitle.setAttribute('content', attributes['twitter-title'] || attributes.title || 'Behive');
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

  // Add JSON-LD schema markup for SEO (WebSite, LocalBusiness, BreadcrumbList, Product/CollectionPage)
  const schemaScript = document.createElement('script');
  schemaScript.type = 'application/ld+json';
  const schemas = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": (attributes['schema-site-url'] || 'https://rainwilds.github.io/Sandbox/') + "#website",
        "name": attributes['schema-site-name'] || attributes.title || 'Behive Media',
        "url": attributes['schema-site-url'] || 'https://rainwilds.github.io/Sandbox/',
        "description": attributes.description || 'Behive Media offers professional photography, videography, and website services in Australia.',
        "inLanguage": attributes['og-locale'] || 'en-AU',
        "publisher": { "@id": (attributes['business-url'] || businessInfo.business?.url || 'https://rainwilds.github.io/Sandbox/') + "#business" },
        "potentialAction": [
          {
            "@type": "SearchAction",
            "target": {
              "@type": "EntryPoint",
              "urlTemplate": (attributes['schema-site-url'] || 'https://rainwilds.github.io/Sandbox/') + "?s={search_term_string}"
            },
            "query-input": {
              "@type": "PropertyValueSpecification",
              "valueRequired": true,
              "valueName": "search_term_string"
            }
          }
        ]
      },
      {
        "@type": "LocalBusiness",
        "@id": (attributes['business-url'] || businessInfo.business?.url || 'https://rainwilds.github.io/Sandbox/') + "#business",
        "name": attributes['business-name'] || businessInfo.business?.name || 'Behive Media',
        "url": attributes['business-url'] || businessInfo.business?.url || 'https://rainwilds.github.io/Sandbox/',
        "telephone": attributes['business-telephone'] || businessInfo.business?.telephone || '+61-3-9876-5432',
        "address": {
          "@type": "PostalAddress",
          "streetAddress": attributes['business-address-street'] || businessInfo.business?.address?.streetAddress || '456 Creative Lane',
          "addressLocality": attributes['business-address-locality'] || businessInfo.business?.address?.addressLocality || 'Melbourne',
          "addressRegion": attributes['business-address-region'] || businessInfo.business?.address?.addressRegion || 'VIC',
          "postalCode": attributes['business-address-postal'] || businessInfo.business?.address?.postalCode || '3000',
          "addressCountry": attributes['business-address-country'] || businessInfo.business?.address?.addressCountry || 'AU'
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": attributes['business-geo-latitude'] || businessInfo.business?.geo?.latitude || -37.8136,
          "longitude": attributes['business-geo-longitude'] || businessInfo.business?.geo?.longitude || 144.9631
        },
        "openingHours": attributes['business-opening-hours'] || businessInfo.business?.openingHours || 'Mo-Fr 09:00-18:00',
        "image": attributes['business-image'] || businessInfo.business?.image || 'https://rainwilds.github.io/Sandbox/img/logo.jpg',
        "logo": attributes['business-logo'] || businessInfo.business?.logo || 'https://rainwilds.github.io/Sandbox/img/logo.jpg',
        "sameAs": attributes['business-same-as']?.split(',') || businessInfo.business?.sameAs || [
          'https://www.facebook.com/behivemedia',
          'https://www.instagram.com/behivemedia'
        ]
      },
      {
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Home",
            "item": attributes['schema-site-url'] || 'https://rainwilds.github.io/Sandbox/'
          }
        ]
      }
    ]
  };

  // Handle Product or CollectionPage schema based on attributes
  if (attributes['include-e-commerce']) {
    if (attributes['products']) {
      // Multi-product page: CollectionPage with ItemList
      console.log('Adding CollectionPage schema');
      let products;
      try {
        products = JSON.parse(attributes['products']);
      } catch (error) {
        console.error('Failed to parse data-products:', error);
        products = [];
      }
      const collectionSchema = {
        "@type": "CollectionPage",
        "@id": (attributes['canonical'] || attributes['schema-site-url'] || 'https://rainwilds.github.io/Sandbox/') + "#collectionpage",
        "url": attributes['canonical'] || attributes['schema-site-url'] || 'https://rainwilds.github.io/Sandbox/',
        "name": attributes['collection-name'] || attributes.title || 'Behive Shop',
        "description": attributes['collection-description'] || attributes.description || 'Browse our curated selection of products.',
        "isPartOf": { "@id": (attributes['schema-site-url'] || 'https://rainwilds.github.io/Sandbox/') + "#website" },
        "inLanguage": attributes['og-locale'] || 'en-AU',
        "mainEntity": {
          "@type": "ItemList",
          "itemListElement": products.map(product => ({
            "@type": "Product",
            "name": product.name || 'Unnamed Product',
            "url": product.url || '',
            "image": product.image || attributes['og-image'] || 'https://rainwilds.github.io/Sandbox/img/product.jpg',
            "description": product.description || attributes.description || '',
            "sku": product.sku || '',
            "brand": {
              "@type": "Brand",
              "name": product.brand || 'Behive'
            },
            "offers": {
              "@type": "Offer",
              "priceCurrency": product.priceCurrency || 'AUD',
              "price": product.price || '0.00',
              "availability": product.availability || 'https://schema.org/InStock',
              "url": product.url || ''
            }
          }))
        }
      };
      schemas["@graph"].push(collectionSchema);
    } else if (attributes['product-name']) {
      // Single-product page: Product schema
      console.log('Adding Product schema');
      const productSchema = {
        "@type": "Product",
        "name": attributes['product-name'] || 'Behive Premium Video Production Package',
        "url": attributes['product-url'] || 'https://rainwilds.github.io/Sandbox/products/video-package',
        "description": attributes['product-description'] || attributes.description || 'Professional video production services for events and marketing.',
        "image": attributes['product-image'] || attributes['og-image'] || 'https://rainwilds.github.io/Sandbox/img/video-package.jpg',
        "sku": attributes['product-sku'] || 'BH-VIDEO-002',
        "brand": {
          "@type": "Brand",
          "name": attributes['product-brand'] || 'Behive'
        },
        "offers": {
          "@type": "Offer",
          "priceCurrency": attributes['product-price-currency'] || 'AUD',
          "price": attributes['product-price'] || '1500.00',
          "availability": attributes['product-availability'] || 'https://schema.org/InStock',
          "url": attributes['product-url'] || 'https://rainwilds.github.io/Sandbox/products/video-package'
        }
      };
      schemas["@graph"].push(productSchema);
    }
  }

  // Set schema content, filtering out undefined properties
  schemaScript.textContent = JSON.stringify(schemas, (key, value) => value === undefined ? null : value);
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

  // Load additional scripts (components.js, scripts.js)
  const scripts = ['./js/components.js', './js/scripts.js'];
  scripts.forEach(src => {
    if (!document.querySelector(`script[src="${src}"]`)) {
      const script = document.createElement('script');
      script.src = src;
      script.defer = true;
      head.appendChild(script);
    }
  });

  // Add favicon links for various devices
  const favicons = [
    { rel: 'apple-touch-icon', sizes: '180x180', href: './images/icons/apple-touch-icon.png' },
    { rel: 'icon', type: 'image/png', sizes: '32x32', href: './images/icons/favicon-32x32.png' },
    { rel: 'icon', type: 'image/png', sizes: '16x16', href: './images/icons/favicon-16x16.png' }
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

  // Add main stylesheet (styles.css) if not already present
  const mainStylesheet = './styles.css';
  if (!document.querySelector(`link[rel="stylesheet"][href="${mainStylesheet}"]`)) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = mainStylesheet;
    head.appendChild(link);
  }

  // Initialize Snipcart for e-commerce functionality only if enabled
  if (attributes['include-e-commerce']) {
    console.log('Snipcart initialization triggered');
    if (!document.querySelector('script[data-snipcart]')) {
      const addSnipcartScripts = () => {
        if (!document.body) {
          setTimeout(addSnipcartScripts, 100);
          return;
        }

        const snipcartSettings = document.createElement('script');
        snipcartSettings.type = 'text/javascript';
        snipcartSettings.textContent = `
        window.SnipcartSettings = {
          publicApiKey: 'NTMzMTQxN2UtNjQ3ZS00ZWNjLWEyYmEtOTNiNGMwNzYyYWNlNjM4ODA0NjY5NzE2NjExMzg5',
          loadStrategy: 'on-user-interaction',
          version: '3.7.3',
          templatesUrl: '/Sandbox//plugins/snipcart.html',
          modalStyle: 'side',
        };
      `;
        document.body.appendChild(snipcartSettings);

        const snipcartScript = document.createElement('script');
        snipcartScript.dataset.snipcart = 'true';
        snipcartScript.type = 'text/javascript';
        snipcartScript.textContent = `
        try {
          (() => {
            var c, d;
            (d = (c = window.SnipcartSettings).version) != null || (c.version = "3.7.1");
            var s, S;
            (S = (s = window.SnipcartSettings).timeoutDuration) != null || (s.timeoutDuration = 2750);
            var l, p;
            (p = (l = window.SnipcartSettings).domain) != null || (l.domain = "cdn.snipcart.com");
            var w, u;
            (u = (w = window.SnipcartSettings).protocol) != null || (w.protocol = "https");
            var f = window.SnipcartSettings.version.includes("v3.0.0-ci") || window.SnipcartSettings.version != "3.7.1" && window.SnipcartSettings.version.localeCompare("3.4.0", void 0, { numeric: true, sensitivity: "base" }) === -1,
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
              e || (e = document.createElement("div"), e.id = "snipcart", e.setAttribute("hidden", "true"), e.setAttribute("data-snipcart-debug", "true"), document.body.appendChild(e));
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
        } catch (error) {
          console.error('Snipcart initialization error:', error);
        }
      `;
        snipcartScript.onload = () => {
          console.log('Snipcart script loaded successfully');
        };
        snipcartScript.onerror = () => {
          console.error('Failed to load Snipcart script');
        };
        document.body.appendChild(snipcartScript);
      };

      if (!document.querySelector('link[href="https://cdn.snipcart.com"]')) {
        const preconnect = document.createElement('link');
        preconnect.rel = 'preconnect';
        preconnect.href = 'https://cdn.snipcart.com';
        head.appendChild(preconnect);
      }

      addSnipcartScripts();
    }
  }

  // Initialize Eruda for debugging if enabled
  if (attributes['include-eruda']) {
    console.log('Eruda initialization triggered');
    if (!document.querySelector('script[src="https://cdn.jsdelivr.net/npm/eruda"]')) {
      const erudaScript = document.createElement('script');
      erudaScript.src = 'https://cdn.jsdelivr.net/npm/eruda';
      erudaScript.onload = () => {
        console.log('Eruda script loaded, initializing...');
        try {
          window.eruda.init();
          console.log('Eruda initialized successfully');
        } catch (error) {
          console.error('Eruda initialization error:', error);
        }
      };
      erudaScript.onerror = () => {
        console.error('Failed to load Eruda script');
      };
      document.head.appendChild(erudaScript);
    }
  }
}

// Initialize head management on DOM load, processing <data-bh-head> attributes
document.addEventListener('DOMContentLoaded', async () => {
  const dataHeads = document.querySelectorAll('data-bh-head');
  console.log('Found data-bh-head elements:', dataHeads.length);
  dataHeads.forEach((dataHead, index) => {
    console.log(`data-bh-head[${index}] outerHTML:`, dataHead.outerHTML);
  });

  // Fetch business-info.json
  let businessInfo = {};
  try {
    const response = await fetch('./JSON/business-info.json');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    businessInfo = await response.json();
    console.log('Loaded business-info.json:', businessInfo);
  } catch (error) {
    console.error('Failed to load business-info.json:', error);
  }

  // Merge attributes from all <data-bh-head> elements
  const attributes = {};
  dataHeads.forEach(dataHead => {
    Object.assign(attributes, {
      title: dataHead.dataset.title,
      description: dataHead.dataset.description,
      keywords: dataHead.dataset.keywords,
      author: dataHead.dataset.author,
      canonical: dataHead.dataset.canonical,
      robots: dataHead.dataset.robots,
      'og-title': dataHead.dataset.ogTitle,
      'og-description': dataHead.dataset.ogDescription,
      'og-image': dataHead.dataset.ogImage,
      'og-url': dataHead.dataset.ogUrl,
      'og-type': dataHead.dataset.ogType,
      'og-locale': dataHead.dataset.ogLocale,
      'og-site-name': dataHead.dataset.ogSiteName,
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
      'business-geo-latitude': dataHead.dataset.businessGeoLatitude,
      'business-geo-longitude': dataHead.dataset.businessGeoLongitude,
      'business-image': dataHead.dataset.businessImage,
      'business-logo': dataHead.dataset.businessLogo,
      'business-same-as': dataHead.dataset.businessSameAs,
      'schema-site-name': dataHead.dataset.schemaSiteName,
      'schema-site-url': dataHead.dataset.schemaSiteUrl,
      'product-name': dataHead.dataset.productName || null,
      'product-description': dataHead.dataset.productDescription || null,
      'product-image': dataHead.dataset.productImage || null,
      'product-url': dataHead.dataset.productUrl || null,
      'product-price-currency': dataHead.dataset.productPriceCurrency || null,
      'product-price': dataHead.dataset.productPrice || null,
      'product-availability': dataHead.dataset.productAvailability || null,
      'product-sku': dataHead.dataset.productSku || null,
      'product-brand': dataHead.dataset.productBrand || null,
      'collection-name': dataHead.dataset.collectionName || null,
      'collection-description': dataHead.dataset.collectionDescription || null,
      products: dataHead.dataset.products || null,
      'theme-color-light': dataHead.dataset.themeColorLight,
      'theme-color-dark': dataHead.dataset.themeColorDark,
      'include-e-commerce': dataHead.hasAttribute('data-include-e-commerce') || attributes['include-e-commerce'],
      'include-eruda': dataHead.hasAttribute('data-include-eruda') || attributes['include-eruda']
    });
  });

  // Remove all <data-bh-head> elements to prevent parsing issues
  dataHeads.forEach(dataHead => {
    if (dataHead.parentNode) {
      dataHead.parentNode.removeChild(dataHead);
    }
  });

  // Pass merged attributes and businessInfo to manageHead
  manageHead(attributes, businessInfo);
});
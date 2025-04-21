// Manages the <head> section by adding meta tags, styles, scripts, and schema markup
function manageHead(attributes = {}, businessInfo = {}) {
  // Ensure <head> exists, creating one if necessary
  let head = document.head || document.createElement('head');
  if (!document.head) document.documentElement.prepend(head);

  // Preload hero images for mobile and desktop
  const heroImages = [
    { href: attributes['preload-feature-img-mobile'], media: '(max-width: 980px)', type: 'image/avif' },
    { href: attributes['preload-feature-img-desktop'], media: '(min-width: 981px)', type: 'image/avif' }
  ].filter(image => image.href); // Only include images with valid hrefs
  heroImages.forEach(image => {
    if (!document.querySelector(`link[href="${image.href}"][media="${image.media}"]`)) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = image.href;
      link.as = 'image';
      link.type = image.type;
      link.media = image.media;
      head.appendChild(link);
    }
  });

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

  // ... (rest of the manageHead function remains unchanged, including meta tags, Font Awesome, schemas, etc.)
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
      'preload-feature-img-mobile': dataHead.dataset.preloadFeatureImgMobile,
      'preload-feature-img-desktop': dataHead.dataset.preloadFeatureImgDesktop,
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
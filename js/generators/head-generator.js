/* global document, window, console, Promise, requestIdleCallback */

'use strict';

import { getConfig } from '../config.js';

const isDev = window.location.pathname.includes('/dev/') || new URLSearchParams(window.location.search).get('debug') === 'true';

const createLogger = (prefix) => ({
  log: (message, data = null) => {
    if (isDev) {
      console.groupCollapsed(`%c[${prefix}] ${new Date().toLocaleTimeString()} ${message}`, 'color: #2196F3; font-weight: bold;');
      if (data) console.log('%cData:', 'color: #4CAF50;', data);
      console.trace();
      console.groupEnd();
    }
  },
  warn: (message, data = null) => {
    if (isDev) {
      console.groupCollapsed(`%c[${prefix}] Warning: ${new Date().toLocaleTimeString()} ${message}`, 'color: #FF9800; font-weight: bold;');
      if (data) console.log('%cData:', 'color: #4CAF50;', data);
      console.trace();
      console.groupEnd();
    }
  },
  error: (message, data = null) => {
    if (isDev) {
      console.groupCollapsed(`%c[${prefix}] Error: ${new Date().toLocaleTimeString()} ${message}`, 'color: #F44336; font-weight: bold;');
      if (data) console.log('%cData:', 'color: #4CAF50;', data);
      console.trace();
      console.groupEnd();
    }
    console.error(`[${prefix}] ${message}`, data);
  }
});

const logger = createLogger('HeadGenerator');

const DEPENDENCIES = {
  'shared': [],
  'config': [],
  'image-generator': ['shared'],
  'video-generator': ['shared'],
  'custom-block': ['image-generator', 'video-generator', 'shared'],
  'custom-nav': ['shared'],
  'custom-logo': ['image-generator', 'shared'],
  'custom-header': ['image-generator', 'shared'],
  'custom-slider': ['custom-block'],
  'custom-filter': ['shared']
};

const PATH_MAP = {
  'config': '../config.js',
  'image-generator': './image-generator.js',
  'video-generator': './video-generator.js',
  'shared': '../shared.js',
  'custom-block': '../components/custom-block.js',
  'custom-nav': '../components/custom-nav.js',
  'custom-logo': '../components/custom-logo.js',
  'custom-header': '../components/custom-header.js',
  'custom-slider': '../components/custom-slider.js',
  'custom-filter': '../components/custom-filter.js'
};

async function loadModule(moduleName) {
  const modulePath = PATH_MAP[moduleName];
  if (!modulePath) {
    const err = new Error(`Unknown module: ${moduleName}`);
    logger.error(`Module not found in PATH_MAP`, { moduleName, available: Object.keys(PATH_MAP) });
    throw err;
  }
  try {
    logger.log(`Loading module: ${modulePath}`);
    const module = await import(modulePath);
    logger.log(`Successfully loaded: ${moduleName}`);
    return { name: moduleName, module, path: modulePath };
  } catch (err) {
    logger.error(`Failed to load module ${moduleName}`, { path: modulePath, error: err.message, stack: err.stack });
    return { name: moduleName, module: null, path: modulePath, error: err };
  }
}

async function loadComponentWithDependencies(componentName) {
  logger.log(`Loading component with dependencies: ${componentName}`);
  const allDependencies = new Set();
  const collectDependencies = (name) => {
    const deps = DEPENDENCIES[name] || [];
    deps.forEach(dep => {
      if (!allDependencies.has(dep)) {
        allDependencies.add(dep);
        collectDependencies(dep);
      }
    });
  };
  collectDependencies(componentName);
  const loadOrder = [...allDependencies, componentName];
  logger.log(`Load order for ${componentName}:`, loadOrder);

  const loadPromises = loadOrder.map(moduleName => loadModule(moduleName));
  const results = await Promise.all(loadPromises);
  const componentResult = results.find(r => r.name === componentName);
  if (componentResult.error) {
    throw componentResult.error;
  }
  const directDeps = DEPENDENCIES[componentName] || [];
  const missingDeps = directDeps.filter(dep => results.find(r => r.name === dep)?.module === null);
  if (missingDeps.length > 0) {
    logger.warn(`Component ${componentName} loaded but missing dependencies:`, missingDeps);
  }
  logger.log(`Component ${componentName} loaded successfully with ${results.length} modules`);
  return results;
}

async function loadComponents(componentList) {
  if (!componentList) {
    logger.log('No components specified, skipping');
    return [];
  }
  logger.log('Loading requested components', { components: componentList });
  const components = componentList.split(/\s+/).map(c => c.trim()).filter(c => c);
  const loadPromises = components.map(component =>
    loadComponentWithDependencies(component).catch(err => {
      logger.error(`Failed to load component ${component}`, { error: err.message, stack: err.stack });
      return [];
    })
  );
  const allResults = (await Promise.all(loadPromises)).flat();
  const successfulComponents = allResults.filter(r => components.includes(r.name) && r.module).length;
  const totalComponents = components.length;
  const successfulModules = allResults.filter(r => r.module).length;
  const totalModules = allResults.length;
  logger.log(`Component loading summary: ${successfulComponents}/${totalComponents} components, ${successfulModules}/${totalModules} modules`, {
    components,
    successful: allResults.filter(r => r.module && components.includes(r.name)).map(r => r.name),
    failed: allResults.filter(r => r.error && components.includes(r.name)).map(r => r.name)
  });
  return allResults;
}

async function updateHead(attributes, setup) {
  logger.log('updateHead called with attributes', attributes);
  const head = document.head;
  const criticalFrag = document.createDocumentFragment();
  const deferredFrag = document.createDocumentFragment();

  // ——— FONT PRELOAD ———
  const validFonts = (setup.fonts || []).filter(font => font.href || font.url);
  if (validFonts.length > 0) {
    validFonts.forEach(font => {
      const fontUrl = font.href ?? font.url;
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = fontUrl;
      link.as = font.as ?? 'font';
      link.type = font.type ?? 'font/woff2';
      link.crossOrigin = font.crossorigin ?? 'anonymous';
      criticalFrag.appendChild(link);
      logger.log(`Added font preload: ${fontUrl}`);
    });
  }

  // ——— STYLESHEETS ———
  const styleLink = document.createElement('link');
  styleLink.rel = 'stylesheet';
  styleLink.href = './styles.css';
  criticalFrag.appendChild(styleLink);

  const customStyleLink = document.createElement('link');
  customStyleLink.rel = 'stylesheet';
  customStyleLink.href = './custom.css';
  criticalFrag.appendChild(customStyleLink);

  // ——— FONT AWESOME ———
  const faKitUrl = setup.font_awesome?.kit_url ?? setup.font_awesome?.kitUrl;
  if (faKitUrl) {
    const script = document.createElement('script');
    script.src = faKitUrl;
    script.crossOrigin = 'anonymous';
    script.async = true;
    criticalFrag.appendChild(script);
    logger.log(`Added Font Awesome Kit script: ${faKitUrl}`);
  }

  // ——— HERO IMAGE PRELOAD (data-hero-*) ———
  if (attributes.heroImages && attributes.heroWidths) {
    const imageTemplates = attributes.heroImages.split(',').map(s => s.trim());
    const widths = attributes.heroWidths.split(',').map(w => w.trim()).filter(Boolean);
    const sizes = attributes.heroSizes || '100vw';
    const format = attributes.heroFormat || 'avif';
    const count = parseInt(attributes.heroCount) || 1;

    const preloadCount = Math.min(count, imageTemplates.length);

    for (let i = 0; i < preloadCount; i++) {
      const template = imageTemplates[i];
      const largest = widths[widths.length - 1];

      // Handle 3840w (no suffix)
      const href = largest === '3840'
        ? template.replace(/-\{width\}\./, '.').replace('{format}', format)
        : template.replace('{width}', largest).replace('{format}', format);

      const srcset = widths
        .map(w => {
          const url = w === '3840'
            ? template.replace(/-\{width\}\./, '.').replace('{format}', format)
            : template.replace('{width}', w).replace('{format}', format);
          return `${url} ${w}w`;
        })
        .join(', ');

      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = href;
      link.imagesrcset = srcset;
      link.imagesizes = sizes;
      link.importance = 'high';
      criticalFrag.appendChild(link);

      logger.log(`HERO SLIDE ${i + 1} PRELOADED`, { href, srcset, sizes });
    }
  }

  // ——— META TAGS ———
  let metaTags = [];
  const hasPageAttributes = Object.keys(attributes).length > 0;

  if (hasPageAttributes) {
    metaTags = [
      { name: 'robots', content: setup.general?.robots },
      { name: 'title', content: attributes.title ?? setup.general?.title },
      { name: 'author', content: setup.general?.author ?? setup.business?.author },
      { name: 'description', content: attributes.description ?? setup.general?.description },
      { name: 'og:locale', property: true, content: setup.general?.og?.locale ?? setup.general?.ogLocale },
      { name: 'og:url', property: true, content: attributes.canonical ?? setup.general?.canonical ?? window.location.href },
      { name: 'og:type', property: true, content: setup.general?.og?.type ?? setup.general?.ogType },
      { name: 'og:title', property: true, content: attributes.title ?? setup.general?.title },
      { name: 'og:description', property: true, content: attributes.description ?? setup.general?.description },
      { name: 'og:image', property: true, content: attributes.ogImage ?? setup.general?.og?.image ?? setup.business?.image },
      { name: 'og:site_name', property: true, content: setup.general?.og?.site_name ?? setup.general?.siteName },
      { name: 'twitter:card', content: setup.general?.x?.card },
      { name: 'twitter:domain', content: setup.general?.x?.domain ?? window.location.hostname },
      { name: 'twitter:site', content: setup.general?.x?.site },
      { name: 'twitter:url', content: attributes.canonical ?? setup.general?.canonical ?? window.location.href },
      { name: 'twitter:title', content: attributes.title ?? setup.general?.title },
      { name: 'twitter:description', content: attributes.description ?? setup.general?.description },
      { name: 'twitter:image', content: setup.business?.image }
    ].filter(tag => tag.content?.trim());
  } else {
    metaTags = [
      { name: 'og:locale', property: true, content: setup.general?.og?.locale ?? setup.general?.ogLocale },
      { name: 'og:site_name', property: true, content: setup.general?.og?.site_name ?? setup.general?.siteName },
      { name: 'og:type', property: true, content: setup.general?.og?.type ?? setup.general?.ogType },
      { name: 'og:image', property: true, content: setup.general?.og?.image ?? setup.business?.image },
      { name: 'og:url', property: true, content: setup.general?.canonical ?? window.location.href },
      { name: 'twitter:card', content: setup.general?.x?.card },
      { name: 'twitter:domain', content: setup.general?.x?.domain ?? window.location.hostname },
      { name: 'twitter:site', content: setup.general?.x?.site }
    ].filter(tag => tag.content?.trim());
  }
  metaTags.forEach(({ name, property, content }) => {
    const meta = document.createElement('meta');
    if (property) meta.setAttribute('property', name);
    else meta.name = name;
    meta.content = content;
    criticalFrag.appendChild(meta);
  });

  // ——— CANONICAL ———
  const canonicalUrl = attributes.canonical ?? setup.general?.canonical ?? window.location.href;
  const canonicalLink = document.createElement('link');
  canonicalLink.rel = 'canonical';
  canonicalLink.href = canonicalUrl;
  criticalFrag.appendChild(canonicalLink);

  // ——— THEME COLOR ———
  setTimeout(() => {
    const rootStyles = getComputedStyle(document.documentElement);
    const lightTheme = rootStyles.getPropertyValue('--color-light-scale-1').trim();
    const darkTheme = rootStyles.getPropertyValue('--color-dark-scale-1').trim();

    if (lightTheme) {
      const themeMetaLight = document.createElement('meta');
      themeMetaLight.name = 'theme-color';
      themeMetaLight.content = lightTheme;
      themeMetaLight.media = '(prefers-color-scheme: light)';
      head.appendChild(themeMetaLight);
    }
    if (darkTheme && darkTheme !== lightTheme) {
      const themeMetaDark = document.createElement('meta');
      themeMetaDark.name = 'theme-color';
      themeMetaDark.content = darkTheme;
      themeMetaDark.media = '(prefers-color-scheme: dark)';
      head.appendChild(themeMetaDark);
    }
  }, 0);

  // ——— JSON-LD ———
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": setup.business?.name,
    "url": setup.business?.url,
    "telephone": setup.business?.telephone,
    "address": setup.business?.address ? {
      "@type": "PostalAddress",
      "streetAddress": setup.business.address.streetAddress,
      "addressLocality": setup.business.address.addressLocality,
      "addressRegion": setup.business.address.addressRegion,
      "postalCode": setup.business.address.postalCode,
      "addressCountry": setup.business.address.addressCountry
    } : undefined,
    "openingHours": setup.business?.openingHours?.split(',').map(s => s.trim()).filter(Boolean),
    "geo": setup.business?.geo ? {
      "@type": "GeoCoordinates",
      "latitude": setup.business.geo.latitude,
      "longitude": setup.business.geo.longitude
    } : undefined,
    "image": setup.business?.image,
    "logo": setup.business?.logo,
    "sameAs": setup.business?.sameAs?.filter(Boolean) || []
  };
  const cleanedJsonLd = Object.fromEntries(Object.entries(jsonLd).filter(([_, v]) => v !== undefined && (Array.isArray(v) ? v.length : true)));
  if (Object.keys(cleanedJsonLd).length > 2) {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(cleanedJsonLd, null, 2);
    deferredFrag.appendChild(script);
  }

  // ——— FAVICONS ———
  const favicons = (setup.general?.favicons || []).filter(f => f.href?.trim());
  favicons.forEach(favicon => {
    const link = document.createElement('link');
    link.rel = favicon.rel;
    link.href = favicon.href;
    if (favicon.sizes) link.sizes = favicon.sizes;
    if (favicon.type) link.type = favicon.type;
    criticalFrag.appendChild(link);
  });

  // ——— SNIPCART ———
  if (setup.general?.include_e_commerce && setup.general?.snipcart) {
    const snipcart = setup.general.snipcart;
    const script = document.createElement('script');
    script.id = 'snipcart';
    script.src = `https://cdn.snipcart.com/themes/v${snipcart.version}/default/snipcart.${snipcart.version}.js`;
    script.setAttribute('data-api-key', snipcart.publicApiKey);
    script.setAttribute('data-config-modal-style', snipcart.modalStyle);
    script.setAttribute('data-config-load-strategy', snipcart.loadStrategy);
    if (snipcart.templatesUrl) script.setAttribute('data-templates-url', snipcart.templatesUrl);
    deferredFrag.appendChild(script);
  }

  head.appendChild(criticalFrag);
  logger.log('Appended critical elements to head');

  const appendDeferred = () => {
    head.appendChild(deferredFrag);
    logger.log('Appended deferred elements to head');
  };
  if (window.requestIdleCallback) {
    requestIdleCallback(appendDeferred, { timeout: 2000 });
  } else {
    setTimeout(appendDeferred, 0);
  }
}

// ——— MAIN IIFE ———
(async () => {
  try {
    logger.log('Starting HeadGenerator');
    const setupPromise = getConfig();
    const customHead = document.querySelector('data-custom-head');
    if (!customHead) {
      logger.warn('No data-custom-head element found');
      return;
    }

    const attributes = {};
    for (const [key, value] of Object.entries(customHead.dataset)) {
      const trimmed = value?.trim();
      if (trimmed) attributes[key] = trimmed;
    }
    logger.log('Merged attributes', attributes);

    if (attributes.components) {
      await loadComponents(attributes.components);
    }

    const setup = await setupPromise;
    await updateHead(attributes, setup);
    customHead.remove();
    logger.log('Removed data-custom-head element');

    // Cleanup: move styles/links/scripts
    ['style', 'link', 'script'].forEach(tag => {
      document.querySelectorAll(tag).forEach(el => {
        if (el.parentNode !== document.head && el.parentNode !== null) {
          if (tag === 'script' && el.src && !el.defer && !el.async) el.defer = true;
          document.head.appendChild(el);
        }
      });
    });

    logger.log('HeadGenerator completed successfully');
    window.__PAGE_FULLY_RENDERED__ = true;
    document.documentElement.setAttribute('data-page-ready', 'true');
  } catch (err) {
    logger.error('Error in HeadGenerator', { error: err.message, stack: err.stack });
  }
})();
/* global document, window, console, Promise, requestIdleCallback */

// Use strict mode for better compliance and error catching
'use strict';

// Import config utilities (removes duplication)
import { getConfig } from './config.js';

// Browser-compatible dev detection (modernized)
const isDev = window.location.pathname.includes('/dev/') ||
  new URLSearchParams(window.location.search).get('debug') === 'true';

// Debug logging methods (consolidated and optimized)
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
      console.groupCollapsed(`%c[${prefix}] ⚠️ ${new Date().toLocaleTimeString()} ${message}`, 'color: #FF9800; font-weight: bold;');
      if (data) console.log('%cData:', 'color: #4CAF50;', data);
      console.trace();
      console.groupEnd();
    }
  },
  error: (message, data = null) => {
    if (isDev) {
      console.groupCollapsed(`%c[${prefix}] ❌ ${new Date().toLocaleTimeString()} ${message}`, 'color: #F44336; font-weight: bold;');
      if (data) console.log('%cData:', 'color: #4CAF50;', data);
      console.trace();
      console.groupEnd();
    }
    console.error(`[${prefix}] ${message}`, data);
  }
});

const logger = createLogger('HeadGenerator');

// Dependency mapping: component → required modules (unchanged, assumed optimal)
const DEPENDENCIES = {
  'shared': [],
  'config': [],
  'image-generator': ['shared'],
  'video-generator': ['shared'],
  'custom-block': ['image-generator', 'video-generator', 'shared'],
  'custom-nav': ['shared'],
  'custom-logo': ['image-generator', 'shared'],
  'custom-header': ['image-generator', 'shared']
};

// Path mapping for modules (unchanged)
const PATH_MAP = {
  'config': './config.js',
  'image-generator': './image-generator.js',
  'video-generator': './video-generator.js',
  'shared': './shared.js',
  'custom-block': './components/custom-block.js',
  'custom-nav': './components/custom-nav.js',
  'custom-logo': './components/custom-logo.js',
  'custom-header': './components/custom-header.js'
};

// Function to load a single module (optimized with error handling)
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

// Function to load a component and its dependencies (recursion optimized)
async function loadComponentWithDependencies(componentName) {
  logger.log(`Loading component with dependencies: ${componentName}`);

  // Collect all unique dependencies recursively
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

  // Load order: dependencies first, then component
  const loadOrder = [...allDependencies, componentName];
  logger.log(`Load order for ${componentName}:`, loadOrder);

  const results = [];
  for (const moduleName of loadOrder) {
    const result = await loadModule(moduleName);
    results.push(result);
    if (result.error && moduleName === componentName) {
      throw result.error;
    }
  }

  // Check for missing direct dependencies
  const directDeps = DEPENDENCIES[componentName] || [];
  const missingDeps = directDeps.filter(dep => results.find(r => r.name === dep)?.module === null);
  if (missingDeps.length > 0) {
    logger.warn(`Component ${componentName} loaded but missing dependencies:`, missingDeps);
  }

  logger.log(`Component ${componentName} loaded successfully with ${results.length} modules`);
  return results;
}

// Function to load components selectively (parallelized where possible)
async function loadComponents(componentList) {
  if (!componentList) {
    logger.log('No components specified, skipping');
    return [];
  }

  logger.log('Loading requested components', { components: componentList });
  const components = componentList.split(' ').filter(c => c.trim());

  const loadPromises = components.map(component =>
    loadComponentWithDependencies(component).catch(err => {
      logger.error(`Failed to load component ${component}`, { error: err.message, stack: err.stack });
      return [];
    })
  );

  const allResults = (await Promise.all(loadPromises)).flat();

  // Summary (optimized calculation)
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

// Function to create and append DOM elements (optimized for performance: fragments, filtering)
async function updateHead(attributes, setup) {
  logger.log('updateHead called with attributes', attributes);
  const head = document.head;
  const criticalFrag = document.createDocumentFragment();
  const deferredFrag = document.createDocumentFragment();

  // Fonts: Critical preloads (filtered for validity)
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
  } else {
    logger.warn('No valid fonts in setup.json; relying on CSS @font-face');
  }

  // Stylesheet: Critical (root-relative)
  const styleLink = document.createElement('link');
  styleLink.rel = 'stylesheet';
  styleLink.href = './styles.css';
  criticalFrag.appendChild(styleLink);
  logger.log('Applied stylesheet: ./styles.css');

  // Font Awesome: Async load (critical but non-blocking)
  const faKitUrl = setup.font_awesome?.kit_url ?? setup.font_awesome?.kitUrl;
  if (faKitUrl) {
    const script = document.createElement('script');
    script.src = faKitUrl;
    script.crossOrigin = 'anonymous';
    script.async = true;
    criticalFrag.appendChild(script);
    logger.log(`Added Font Awesome Kit script: ${faKitUrl}`);
  } else {
    logger.warn('No Font Awesome kit URL found; icons may not load');
  }

  // Meta tags: Critical for SEO (filtered for content)
  const metaTags = [
    { name: 'robots', content: setup.general?.robots },
    { name: 'title', content: attributes.title ?? setup.general?.title },
    { name: 'author', content: setup.general?.author ?? setup.business?.author },
    { name: 'description', content: attributes.description ?? setup.general?.description },
    { name: 'og:locale', property: true, content: setup.general?.og?.locale ?? setup.general?.ogLocale },
    { name: 'og:url', property: true, content: attributes.canonical ?? setup.general?.canonical ?? window.location.href },
    { name: 'og:type', property: true, content: setup.general?.ogType },
    { name: 'og:title', property: true, content: attributes.title ?? setup.general?.title },
    { name: 'og:description', property: true, content: attributes.description ?? setup.general?.description },
    { name: 'og:image', property: true, content: setup.business?.image },
    { name: 'og:site_name', property: true, content: setup.general?.og?.site_name ?? setup.general?.siteName },
    { name: 'twitter:card', content: setup.general?.x?.card },
    { name: 'twitter:domain', content: setup.general?.x?.domain ?? window.location.hostname },
    { name: 'twitter:url', content: attributes.canonical ?? setup.general?.canonical ?? window.location.href },
    { name: 'twitter:title', content: attributes.title ?? setup.general?.title },
    { name: 'twitter:description', content: attributes.description ?? setup.general?.description },
    { name: 'twitter:image', content: setup.business?.image }
  ].filter(tag => tag.content?.trim());

  metaTags.forEach(({ name, property, content }) => {
    const meta = document.createElement('meta');
    if (property) meta.setAttribute('property', name);
    else meta.name = name;
    meta.content = content;
    criticalFrag.appendChild(meta);
    logger.log(`Added ${property ? 'property' : 'name'} "${name}" with content: ${content}`);
  });

  // Canonical: Critical for SEO
  const canonicalUrl = attributes.canonical ?? setup.general?.canonical ?? window.location.href;
  const canonicalLink = document.createElement('link');
  canonicalLink.rel = 'canonical';
  canonicalLink.href = canonicalUrl;
  criticalFrag.appendChild(canonicalLink);
  logger.log('Added canonical link: ' + canonicalUrl);

  // Theme colors: Critical for PWA/visuals
  const lightTheme = setup.general?.theme_colors?.light ?? '#000000';
  const darkTheme = setup.general?.theme_colors?.dark ?? lightTheme;
  const themeMetaLight = document.createElement('meta');
  themeMetaLight.name = 'theme-color';
  themeMetaLight.content = lightTheme;
  themeMetaLight.media = '(prefers-color-scheme: light)';
  criticalFrag.appendChild(themeMetaLight);
  logger.log(`Updated theme-color (light): ${lightTheme}`);

  if (darkTheme !== lightTheme) {
    const themeMetaDark = document.createElement('meta');
    themeMetaDark.name = 'theme-color';
    themeMetaDark.content = darkTheme;
    themeMetaDark.media = '(prefers-color-scheme: dark)';
    criticalFrag.appendChild(themeMetaDark);
    logger.log(`Updated theme-color (dark): ${darkTheme}`);
  }

  // JSON-LD: Deferred for performance (cleaned aggressively)
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
    "openingHours": setup.business?.openingHours?.split(',')?.map(s => s.trim()).filter(Boolean),
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
  if (Object.keys(cleanedJsonLd).length > 2) {  // @context, @type + at least one property
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(cleanedJsonLd, null, 2);
    deferredFrag.appendChild(script);
    logger.log('Added Organization JSON-LD schema (deferred)', {
      name: cleanedJsonLd.name,
      url: cleanedJsonLd.url,
      sameAsCount: cleanedJsonLd.sameAs?.length || 0
    });
  } else {
    logger.log('Skipped empty JSON-LD schema');
  }

  // Favicons: Critical (filtered for validity)
  const favicons = (setup.general?.favicons || []).filter(f => f.href?.trim());
  favicons.forEach(favicon => {
    const link = document.createElement('link');
    link.rel = favicon.rel;
    link.href = favicon.href;
    if (favicon.sizes) link.sizes = favicon.sizes;
    if (favicon.type) link.type = favicon.type;
    criticalFrag.appendChild(link);
    logger.log(`Added favicon: ${favicon.href}`);
  });

  // Snipcart: Deferred (non-critical)
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
    logger.log('Added Snipcart script (deferred)', { version: snipcart.version });
  }

  // Append critical immediately for FCP
  head.appendChild(criticalFrag);
  logger.log('Appended critical elements to head', { count: criticalFrag.childNodes.length });

  // Defer non-critical (use requestIdleCallback with fallback)
  const appendDeferred = () => {
    head.appendChild(deferredFrag);
    logger.log('Appended deferred elements to head', { count: deferredFrag.childNodes.length });
  };
  if (window.requestIdleCallback) {
    requestIdleCallback(appendDeferred, { timeout: 2000 });
  } else {
    setTimeout(appendDeferred, 0);
  }
}

// Main execution (async IIFE, optimized flow)
(async () => {
  try {
    logger.log('Starting HeadGenerator');

    // Early config load for parallelism
    const setupPromise = getConfig();

    const customHead = document.querySelector('data-custom-head');
    if (!customHead) {
      logger.warn('No data-custom-head element found');
      return;
    }

    // Gather attributes (modernized with dataset)
    const attributes = {};
    for (const [key, value] of Object.entries(customHead.dataset)) {
      const trimmed = value?.trim();
      if (trimmed) attributes[key] = trimmed;
    }
    logger.log('Merged attributes', attributes);

    // Load components if specified (parallel with config)
    if (attributes.components) {
      await loadComponents(attributes.components);
    }

    // Await config
    const setup = await setupPromise;

    // Update head
    await updateHead(attributes, setup);

    // Cleanup
    customHead.remove();
    logger.log('Removed data-custom-head element');

    logger.log('HeadGenerator completed successfully');
  } catch (err) {
    logger.error('Error in HeadGenerator', { error: err.message, stack: err.stack });
  }
})();
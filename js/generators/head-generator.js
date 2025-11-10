/* global document, window, console, Promise, requestIdleCallback */

'use strict';

import { getConfig } from '../config.js';
import { VIEWPORT_BREAKPOINTS } from '../shared.js';

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

  // ——— FONT AWESOME (self-hosted) ———
  const fa = setup.font_awesome;
  if (fa && fa.core && fa.base_path) {
    const base = (setup.general?.basePath || '') + fa.base_path.replace(/\/+$/, '') + '/';
    const makeScript = (file) => {
      const script = document.createElement('script');
      script.src = base + file;
      script.crossOrigin = 'anonymous';
      if (fa.defer !== false) script.defer = true;
      if (fa.async === true) script.async = true;
      return script;
    };

    criticalFrag.appendChild(makeScript(fa.core));
    logger.log(`Added FA core: ${base}${fa.core}`);

    if (Array.isArray(fa.packages) && fa.packages.length) {
      fa.packages.forEach(pkg => {
        criticalFrag.appendChild(makeScript(pkg));
        logger.log(`Added FA package: ${base}${pkg}`);
      });
    }
  }

  // ——— HERO IMAGE PRELOAD ———
  if (attributes.heroImage && attributes.heroCount) {
    const count = Math.max(1, parseInt(attributes.heroCount) || 0);
    if (count === 0) {
      logger.log('Hero preload skipped: hero-count=0');
    } else {
      const imageTemplates = attributes.heroImage
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      if (imageTemplates.length > 0) {
        const actualCount = Math.min(count, imageTemplates.length);
        const defaultWidths = VIEWPORT_BREAKPOINTS
          .map(bp => bp.maxWidth)
          .filter(w => Number.isFinite(w));
        const widths = attributes.heroWidths
          ? attributes.heroWidths.split(',').map(w => parseInt(w.trim())).filter(w => w > 0)
          : defaultWidths;

        const sizes = attributes.heroSize || '100vw';
        const format = attributes.heroFormat || 'avif';

        const [responsivePath, primaryPath] = await Promise.all([
          import('../config.js').then(m => m.getImageResponsivePath()),
          import('../config.js').then(m => m.getImagePrimaryPath())
        ]);

        const largestWidth = Math.max(...widths);
        const isJpg = format === 'jpg';
        const usePrimary = isJpg && largestWidth === 3840;

        for (let i = 0; i < actualCount; i++) {
          let raw = imageTemplates[i];
          const cleanName = raw
            .replace(/^\/+/, '')
            .replace(/-\d+$/, '')
            .replace(/\.[^/.]+$/, '');

          const srcset = widths
            .map(w => {
              const isLargest = w === largestWidth;
              const filename = isLargest && !usePrimary
                ? `${cleanName}.${format}`
                : `${cleanName}-${w}.${format}`;
              const path = (isLargest && usePrimary) ? primaryPath : responsivePath;
              return `${path}${filename} ${w}w`;
            })
            .join(', ');

          const hrefFilename = usePrimary ? `${cleanName}.${format}` : `${cleanName}.${format}`;
          const hrefPath = usePrimary ? primaryPath : responsivePath;
          const finalHref = `${hrefPath}${hrefFilename}`;

          const link = document.createElement('link');
          link.rel = 'preload';
          link.as = 'image';
          link.href = finalHref;
          link.imagesrcset = srcset;
          link.imagesizes = sizes;
          link.importance = 'high';
          criticalFrag.appendChild(link);

          logger.log(`HERO SLIDE ${i + 1}/${actualCount} PRELOADED`, {
            href: finalHref,
            srcset,
            format,
            largest: largestWidth,
            usePrimary,
            cleanName
          });
        }
      }
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

  // ——— SNIPCART (OFFICIAL LOADER SCRIPT) ———
  if (setup.general?.include_e_commerce && setup.general?.snipcart) {
    const snipcart = setup.general.snipcart;
    const version = snipcart.version?.trim() || undefined;  // undefined = latest (internal default "3.0")

    // Build window.SnipcartSettings
    window.SnipcartSettings = {
      publicApiKey: snipcart.publicApiKey,
      loadStrategy: snipcart.loadStrategy || 'on-user-interaction',
      modalStyle: snipcart.modalStyle,
      templatesUrl: snipcart.templatesUrl,
      currency: snipcart.currency,
      loadCSS: snipcart.loadCSS !== false,
      ...(version && { version })  // Only add if pinned
    };

    // Official loader script (minified from docs)
    const loaderScript = document.createElement('script');
    loaderScript.textContent = `
    (function(){var c,d;(d=(c=window.SnipcartSettings).version)!=null||(c.version="3.0");var s,S;(S=(s=window.SnipcartSettings).timeoutDuration)!=null||(s.timeoutDuration=2750);var l,p;(p=(l=window.SnipcartSettings).domain)!=null||(l.domain="cdn.snipcart.com");var w,u;(u=(w=window.SnipcartSettings).protocol)!=null||(w.protocol="https");var m,g;(g=(m=window.SnipcartSettings).loadCSS)!=null||(m.loadCSS=!0);var y=window.SnipcartSettings.version.includes("v3.0.0-ci")||window.SnipcartSettings.version!="3.0"&&window.SnipcartSettings.version.localeCompare("3.4.0",void 0,{numeric:!0,sensitivity:"base"})===-1,f=["focus","mouseover","touchmove","scroll","keydown"];window.LoadSnipcart=o;document.readyState==="loading"?document.addEventListener("DOMContentLoaded",r):r();function r(){window.SnipcartSettings.loadStrategy?window.SnipcartSettings.loadStrategy==="on-user-interaction"&&(f.forEach(function(t){return document.addEventListener(t,o)}),setTimeout(o,window.SnipcartSettings.timeoutDuration)):o()}var a=!1;function o(){if(a)return;a=!0;let t=document.getElementsByTagName("head")[0],n=document.querySelector("#snipcart"),i=document.querySelector('script[src^="'.concat(window.SnipcartSettings.protocol,"://").concat(window.SnipcartSettings.domain,'"][src$="snipcart.js"]')),e=document.querySelector('link[href^="'.concat(window.SnipcartSettings.protocol,"://").concat(window.SnipcartSettings.domain,'"][href$="snipcart.css"]'));n||(n=document.createElement("div"),n.id="snipcart",n.setAttribute("hidden","true"),document.body.appendChild(n)),h(n),i||(i=document.createElement("script"),i.src="".concat(window.SnipcartSettings.protocol,"://").concat(window.SnipcartSettings.domain,"/themes/v").concat(window.SnipcartSettings.version,"/default/snipcart.js"),i.async=!0,t.appendChild(i)),!e&&window.SnipcartSettings.loadCSS&&(e=document.createElement("link"),e.rel="stylesheet",e.type="text/css",e.href="".concat(window.SnipcartSettings.protocol,"://").concat(window.SnipcartSettings.domain,"/themes/v").concat(window.SnipcartSettings.version,"/default/snipcart.css"),t.prepend(e)),f.forEach(function(v){return document.removeEventListener(v,o)})}function h(t){!y||(t.dataset.apiKey=window.SnipcartSettings.publicApiKey,window.SnipcartSettings.addProductBehavior&&(t.dataset.configAddProductBehavior=window.SnipcartSettings.addProductBehavior),window.SnipcartSettings.modalStyle&&(t.dataset.configModalStyle=window.SnipcartSettings.modalStyle),window.SnipcartSettings.currency&&(t.dataset.currency=window.SnipcartSettings.currency),window.SnipcartSettings.templatesUrl&&(t.dataset.templatesUrl=window.SnipcartSettings.templatesUrl))}})();
  `;
    deferredFrag.appendChild(loaderScript);
    logger.log('Snipcart official loader injected', {
      version: version || 'latest (defaults to 3.0 internally)',
      settings: window.SnipcartSettings
    });
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
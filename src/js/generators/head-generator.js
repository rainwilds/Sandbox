/* global document, window, console, Promise */
'use strict';

import { getConfig } from '../config.js';

const isDev = window.location.pathname.includes('/dev/') || new URLSearchParams(window.location.search).get('debug') === 'true';

const createLogger = (prefix) => ({
    log: (message, data = null) => { if (isDev) console.log(`%c[${prefix}] ${message}`, 'color: #2196F3;', data); },
    error: (message, data = null) => console.error(`[${prefix}] ${message}`, data)
});

const logger = createLogger('HeadGenerator');

/**
 * AUTOMATED PATH RESOLVER
 * Converts a module name into its standard file path.
 */
const getModulePath = (name) => {
    const internalTools = ['config', 'shared', 'image-generator', 'video-generator'];
    if (name === 'config') return '../config.js';
    if (name === 'shared') return '../shared.js';
    if (internalTools.includes(name)) return `./${name}.js`;
    
    // Default convention: custom-component -> ../components/custom-component.js
    return `../components/${name}.js`;
};

async function loadModuleWithDependencies(moduleName, loadedSet = new Set()) {
    if (loadedSet.has(moduleName)) return [];
    loadedSet.add(moduleName);

    const path = getModulePath(moduleName);
    logger.log(`Fetching: ${moduleName} from ${path}`);

    try {
        const moduleNamespace = await import(path);
        const moduleKey = Object.keys(moduleNamespace)[0];
        const exportedClass = moduleNamespace[moduleKey];

        let results = [];

        // AUTOMATIC DEPENDENCY DISCOVERY
        // Looks for 'static dependencies = [...]' inside the class
        const deps = exportedClass?.dependencies || [];
        if (deps.length > 0) {
            logger.log(`${moduleName} requires:`, deps);
            for (const dep of deps) {
                const childResults = await loadModuleWithDependencies(dep, loadedSet);
                results.push(...childResults);
            }
        }

        results.push({ name: moduleName, module: moduleNamespace });
        return results;
    } catch (err) {
        logger.error(`Failed to auto-load ${moduleName}`, err);
        return [];
    }
}

async function loadComponents(componentList) {
    if (!componentList) return;
    const components = componentList.split(/\s+/).filter(Boolean);
    const loadedSet = new Set();
    
    logger.log('Starting Auto-Discovery for:', components);
    
    const promises = components.map(c => loadModuleWithDependencies(c, loadedSet));
    await Promise.all(promises);
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
  styleLink.href = './css/styles.css';
  criticalFrag.appendChild(styleLink);

  const customStyleLink = document.createElement('link');
  customStyleLink.rel = 'stylesheet';
  customStyleLink.href = './css/custom.css'; 
  criticalFrag.appendChild(customStyleLink);

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

        const defaultWidths = VIEWPORT_BREAKPOINT_WIDTHS.filter(w => Number.isFinite(w));

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

          const filenameOnly = raw.split('/').pop();
          const cleanName = filenameOnly
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

  // ——— SNIPCART (FIXED FOR PORT 8080 HYDRATION) ———
  if (setup.general?.include_e_commerce && setup.general?.snipcart) {
    const snipcart = setup.general.snipcart;
    const version = snipcart.version?.trim() || '3.0';

    // 1. Create the settings object
    const settings = {
      publicApiKey: snipcart.publicApiKey,
      loadStrategy: snipcart.loadStrategy || 'on-user-interaction',
      modalStyle: snipcart.modalStyle,
      templatesUrl: snipcart.templatesUrl,
      currency: snipcart.currency,
      loadCSS: snipcart.loadCSS !== false,
      version: version
    };

    // 2. CRITICAL: Physically inject settings into a script tag.
    // This ensures window.SnipcartSettings exists in the static HTML on Port 8080.
    const settingsScript = document.createElement('script');
    settingsScript.textContent = `window.SnipcartSettings = ${JSON.stringify(settings)};`;
    criticalFrag.appendChild(settingsScript);

    // 3. Official loader script (keep your existing minified string)
    const loaderScript = document.createElement('script');
    loaderScript.textContent = `(function(){var c,d;(d=(c=window.SnipcartSettings).version)!=null||(c.version="3.0");var s,S;(S=(s=window.SnipcartSettings).timeoutDuration)!=null||(s.timeoutDuration=2750);var l,p;(p=(l=window.SnipcartSettings).domain)!=null||(l.domain="cdn.snipcart.com");var w,u;(u=(w=window.SnipcartSettings).protocol)!=null||(w.protocol="https");var m,g;(g=(m=window.SnipcartSettings).loadCSS)!=null||(m.loadCSS=!0);var y=window.SnipcartSettings.version.includes("v3.0.0-ci")||window.SnipcartSettings.version!="3.0"&&window.SnipcartSettings.version.localeCompare("3.4.0",void 0,{numeric:!0,sensitivity:"base"})===-1,f=["focus","mouseover","touchmove","scroll","keydown"];window.LoadSnipcart=o;document.readyState==="loading"?document.addEventListener("DOMContentLoaded",r):r();function r(){window.SnipcartSettings.loadStrategy?window.SnipcartSettings.loadStrategy==="on-user-interaction"&&(f.forEach(function(t){return document.addEventListener(t,o)}),setTimeout(o,window.SnipcartSettings.timeoutDuration)):o()}var a=!1;function o(){if(a)return;a=!0;let t=document.getElementsByTagName("head")[0],n=document.querySelector("#snipcart"),i=document.querySelector('script[src^="'.concat(window.SnipcartSettings.protocol,"://").concat(window.SnipcartSettings.domain,'"][src$="snipcart.js"]')),e=document.querySelector('link[href^="'.concat(window.SnipcartSettings.protocol,"://").concat(window.SnipcartSettings.domain,'"][href$="snipcart.css"]'));n||(n=document.createElement("div"),n.id="snipcart",n.setAttribute("hidden","true"),document.body.appendChild(n)),h(n),i||(i=document.createElement("script"),i.src="".concat(window.SnipcartSettings.protocol,"://").concat(window.SnipcartSettings.domain,"/themes/v").concat(window.SnipcartSettings.version,"/default/snipcart.js"),i.async=!0,t.appendChild(i)),!e&&window.SnipcartSettings.loadCSS&&(e=document.createElement("link"),e.rel="stylesheet",e.type="text/css",e.href="".concat(window.SnipcartSettings.protocol,"://").concat(window.SnipcartSettings.domain,"/themes/v").concat(window.SnipcartSettings.version,"/default/snipcart.css"),t.prepend(e)),f.forEach(function(v){return document.removeEventListener(v,o)})}function h(t){!y||(t.dataset.apiKey=window.SnipcartSettings.publicApiKey,window.SnipcartSettings.addProductBehavior&&(t.dataset.configAddProductBehavior=window.SnipcartSettings.addProductBehavior),window.SnipcartSettings.modalStyle&&(t.dataset.configModalStyle=window.SnipcartSettings.modalStyle),window.SnipcartSettings.currency&&(t.dataset.currency=window.SnipcartSettings.currency),window.SnipcartSettings.templatesUrl&&(t.dataset.templatesUrl=window.SnipcartSettings.templatesUrl))}})();`;
    deferredFrag.appendChild(loaderScript);

    logger.log('Snipcart settings physically injected for static hydration', settings);
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
        const setupPromise = getConfig();
        const customHead = document.querySelector('data-custom-head');
        if (!customHead) return;

        const attributes = {};
        for (const [key, value] of Object.entries(customHead.dataset)) {
            const trimmed = value?.trim();
            if (trimmed) attributes[key] = trimmed;
        }

        // 1. Auto-load components and their dependencies
        if (attributes.components) {
            await loadComponents(attributes.components);
        }

        // 2. Process the rest of the head
        const setup = await setupPromise;
        await updateHead(attributes, setup);
        
        customHead.remove();
        window.__PAGE_FULLY_RENDERED__ = true;
        document.documentElement.setAttribute('data-page-ready', 'true');
    } catch (err) {
        logger.error('Critical Fail', err);
    }
})();
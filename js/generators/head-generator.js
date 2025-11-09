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

const DEPENDENCIES = {
  'shared': [],
  'config': [],
  'image-generator': ['shared'],
  'video-generator': ['shared'],
  'custom-block': ['image-generator', 'video-generator', 'shared'],
  'custom-nav': ['shared'],
  'custom-logo': ['image-generator', 'shared'],
  'custom-header': ['image-generator', 'shared'],
  'custom-slider': ['custom-block']  // New: Depends on custom-block
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
  'custom-slider': '../components/custom-slider.js'  // New
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
  
  // New: Load SwiperJS CDN scripts/styles before custom-slider
  if (componentName === 'custom-slider') {
    const head = document.head;
    const criticalFrag = document.createDocumentFragment();
    
    // Core Swiper CSS
    const swiperCss = document.createElement('link');
    swiperCss.rel = 'stylesheet';
    swiperCss.href = 'https://unpkg.com/swiper@10/swiper-bundle.min.css';
    criticalFrag.appendChild(swiperCss);
    logger.log('Added Swiper CSS', { href: swiperCss.href });

    // Core Swiper JS
    const swiperJs = document.createElement('script');
    swiperJs.src = 'https://unpkg.com/swiper@10/swiper-bundle.min.js';
    swiperJs.defer = true;
    criticalFrag.appendChild(swiperJs);
    logger.log('Added Swiper JS', { src: swiperJs.src });

    head.appendChild(criticalFrag);
  }

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
  logger.log('Head before update:', Array.from(head.children).map(el => el.outerHTML));
  const criticalFrag = document.createDocumentFragment();
  const deferredFrag = document.createDocumentFragment();
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
  const styleLink = document.createElement('link');
  styleLink.rel = 'stylesheet';
  styleLink.href = './styles.css';
  criticalFrag.appendChild(styleLink);
  logger.log('Applied stylesheet: ./styles.css');

  // Add custom.css after styles.css
  const customStyleLink = document.createElement('link');
  customStyleLink.rel = 'stylesheet';
  customStyleLink.href = './custom.css';
  criticalFrag.appendChild(customStyleLink);
  logger.log('Applied custom stylesheet: ./custom.css');

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
  // Updated: Conditional OG meta tags based on presence of page attributes
  let metaTags = [];
  const hasPageAttributes = Object.keys(attributes).length > 0;

  if (hasPageAttributes) {
    // Full set with overrides and fallbacks
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
    // Minimal set: Critical, non-page-specific OG properties from setup.json
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
    logger.log(`Added ${property ? 'property' : 'name'} "${name}" with content: ${content}`);
  });
  const canonicalUrl = attributes.canonical ?? setup.general?.canonical ?? window.location.href;
  const canonicalLink = document.createElement('link');
  canonicalLink.rel = 'canonical';
  canonicalLink.href = canonicalUrl;
  criticalFrag.appendChild(canonicalLink);
  logger.log('Added canonical link: ' + canonicalUrl);

  // Delayed: Query CSS vars for theme colors after a microtask (to ensure CSS is parsed)
  setTimeout(() => {
    const rootStyles = getComputedStyle(document.documentElement);
    const lightTheme = rootStyles.getPropertyValue('--color-light-scale-1').trim();
    const darkTheme = rootStyles.getPropertyValue('--color-dark-scale-1').trim();

    // Fallback: If CSS vars are empty, skip adding meta tags (browser defaults)
    if (lightTheme) {
      const themeMetaLight = document.createElement('meta');
      themeMetaLight.name = 'theme-color';
      themeMetaLight.content = lightTheme;
      themeMetaLight.media = '(prefers-color-scheme: light)';
      head.appendChild(themeMetaLight);
      logger.log(`Updated theme-color (light): ${lightTheme}`);
    } else {
      logger.log('Light theme CSS var empty; skipping meta tag for browser defaults');
    }

    if (darkTheme && darkTheme !== lightTheme) {
      const themeMetaDark = document.createElement('meta');
      themeMetaDark.name = 'theme-color';
      themeMetaDark.content = darkTheme;
      themeMetaDark.media = '(prefers-color-scheme: dark)';
      head.appendChild(themeMetaDark);
      logger.log(`Updated theme-color (dark): ${darkTheme}`);
    } else if (darkTheme) {
      logger.log('Dark theme same as light; no additional meta tag needed');
    } else {
      logger.log('Dark theme CSS var empty; skipping meta tag for browser defaults');
    }
  }, 0);

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
    logger.log('Added Organization JSON-LD schema (deferred)', {
      name: cleanedJsonLd.name,
      url: cleanedJsonLd.url,
      sameAsCount: cleanedJsonLd.sameAs?.length || 0
    });
  } else {
    logger.log('Skipped empty JSON-LD schema');
  }
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
  head.appendChild(criticalFrag);
  logger.log('Appended critical elements to head', { count: criticalFrag.childNodes.length });
  logger.log('Head after critical append:', Array.from(head.children).map(el => el.outerHTML));
  logger.log('Body children:', Array.from(document.body.children).map(el => el.outerHTML));
  const appendDeferred = () => {
    head.appendChild(deferredFrag);
    logger.log('Appended deferred elements to head', { count: deferredFrag.childNodes.length });
    logger.log('Head after deferred append:', Array.from(head.children).map(el => el.outerHTML));
  };
  if (window.requestIdleCallback) {
    requestIdleCallback(appendDeferred, { timeout: 2000 });
  } else {
    setTimeout(appendDeferred, 0);
  }
}

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

    // Ensure all <style> elements are in <head>
    const styles = document.querySelectorAll('style');
    let movedStyleCount = 0;
    styles.forEach(style => {
      if (style.parentNode !== document.head && style.parentNode !== null) {
        logger.log(`Moving <style> from ${style.parentNode.tagName} to <head>`);
        document.head.appendChild(style);
        movedStyleCount++;
      }
    });
    if (movedStyleCount > 0) {
      logger.log(`Moved ${movedStyleCount} <style> element(s) to <head>`);
    } else {
      logger.log('All <style> elements already in <head>');
    }

    // Ensure all <link> elements are in <head>
    const links = document.querySelectorAll('link');
    let movedLinkCount = 0;
    links.forEach(link => {
      if (link.parentNode !== document.head && link.parentNode !== null) {
        logger.log(`Moving <link> from ${link.parentNode.tagName} to <head> (rel="${link.rel}")`);
        document.head.appendChild(link);
        movedLinkCount++;
      }
    });
    if (movedLinkCount > 0) {
      logger.log(`Moved ${movedLinkCount} <link> element(s) to <head>`);
    } else {
      logger.log('All <link> elements already in <head>');
    }

    // Ensure all <script> elements are properly placed
    const scripts = document.querySelectorAll('script');
    logger.log('Found scripts before processing:', Array.from(scripts).map(s => ({
      tagName: s.tagName,
      src: s.src || 'inline',
      parent: s.parentNode?.tagName || 'null',
      outerHTML: (s.outerHTML || s.textContent || '').substring(0, 150) + '...'
    })));
    let movedScriptCount = 0;
    let deferredScriptCount = 0;
    scripts.forEach(script => {
      const isExternal = script.src;
      const targetParent = isExternal ? document.head : document.body;
      if (script.parentNode !== targetParent && script.parentNode !== null) {
        logger.log(`Moving <script> from ${script.parentNode.tagName} to ${targetParent.tagName} (external: ${isExternal ? 'yes' : 'no'})`);
        if (isExternal && !script.hasAttribute('defer') && !script.hasAttribute('async')) {
          script.defer = true;
          logger.log('Added defer to external <script> for head placement');
        }
        targetParent.appendChild(script);
        movedScriptCount++;
        if (isExternal) deferredScriptCount++;
      }
    });
    if (movedScriptCount > 0) {
      logger.log(`Moved ${movedScriptCount} <script> element(s): ${deferredScriptCount} external to <head> (deferred), ${movedScriptCount - deferredScriptCount} inline to <body>`);
    } else {
      logger.log('All <script> elements already in valid positions');
    }

    // Rescue misparsed <script> content
    logger.log('Scanning body for text nodes resembling scripts...');
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    let node;
    let rescuedScriptCount = 0;
    const rescuedScripts = [];
    while ((node = walker.nextNode())) {
      const text = node.textContent || '';
      const scriptMatch = text.match(/<script\b[^>]*>[\s\S]*?<\/script>/i);
      if (scriptMatch) {
        const scriptText = scriptMatch[0];
        logger.log(`Found potential misparsed script in text node (parent: ${node.parentNode.tagName}):`, { snippet: scriptText.substring(0, 100) + '...' });
        const innerMatch = scriptText.match(/<script\b[^>]*>([\s\S]*?)<\/script>/i);
        if (innerMatch) {
          const jsCode = innerMatch[1].trim();
          if (jsCode) {
            const newScript = document.createElement('script');
            newScript.textContent = jsCode;
            document.body.appendChild(newScript);
            if (text === scriptText) {
              node.parentNode.removeChild(node);
            } else {
              node.textContent = text.replace(scriptMatch[0], '').trim();
            }
            rescuedScripts.push({ codeSnippet: jsCode.substring(0, 100) + '...', parent: node.parentNode.tagName });
            rescuedScriptCount++;
            logger.log(`Rescued and appended script:`, { codeSnippet: jsCode.substring(0, 100) + '...' });
          }
        }
      }
    }
    if (rescuedScriptCount > 0) {
      logger.log(`Rescued ${rescuedScriptCount} misparsed script(s) from text nodes`, { details: rescuedScripts });
    } else {
      logger.log('No misparsed scripts found in text nodes');
    }

    // Rescue misparsed <style> content
    logger.log('Scanning body for text nodes resembling styles...');
    const walkerStyle = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    let nodeStyle;
    let rescuedStyleCount = 0;
    const rescuedStyles = [];
    while ((nodeStyle = walkerStyle.nextNode())) {
      const text = nodeStyle.textContent || '';
      const styleMatch = text.match(/<style\b[^>]*>[\s\S]*?<\/style>/i);
      if (styleMatch) {
        const styleText = styleMatch[0];
        logger.log(`Found potential misparsed style in text node (parent: ${nodeStyle.parentNode.tagName}):`, { snippet: styleText.substring(0, 100) + '...' });
        const innerMatch = styleText.match(/<style\b[^>]*>([\s\S]*?)<\/style>/i);
        if (innerMatch) {
          const cssCode = innerMatch[1].trim();
          if (cssCode) {
            const newStyle = document.createElement('style');
            newStyle.textContent = cssCode;
            document.head.appendChild(newStyle);
            if (text === styleText) {
              nodeStyle.parentNode.removeChild(nodeStyle);
            } else {
              nodeStyle.textContent = text.replace(styleMatch[0], '').trim();
            }
            rescuedStyles.push({ codeSnippet: cssCode.substring(0, 100) + '...', parent: nodeStyle.parentNode.tagName });
            rescuedStyleCount++;
            logger.log(`Rescued and appended style:`, { codeSnippet: cssCode.substring(0, 100) + '...' });
          }
        }
      }
    }
    if (rescuedStyleCount > 0) {
      logger.log(`Rescued ${rescuedStyleCount} misparsed style(s) from text nodes`, { details: rescuedStyles });
    } else {
      logger.log('No misparsed styles found in text nodes');
    }

    logger.log('HeadGenerator completed successfully');
  } catch (err) {
    logger.error('Error in HeadGenerator', { error: err.message, stack: err.stack });
  }
})();
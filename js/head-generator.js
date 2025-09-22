/* global document, window, console, fetch, Promise, requestIdleCallback */

// Browser-compatible dev detection
const isDev = window.location.href.includes('/dev/') ||
  new URLSearchParams(window.location.search).get('debug') === 'true';

// Debug logging methods (module scope)
const log = (message, data = null) => {
    if (isDev) {
        console.groupCollapsed(`%c[HeadGenerator] ${new Date().toLocaleTimeString()} ${message}`, 'color: #2196F3; font-weight: bold;');
        if (data) {
            console.log('%cData:', 'color: #4CAF50;', data);
        }
        console.trace();
        console.groupEnd();
    }
};

const warn = (message, data = null) => {
    if (isDev) {
        console.groupCollapsed(`%c[HeadGenerator] ⚠️ ${new Date().toLocaleTimeString()} ${message}`, 'color: #FF9800; font-weight: bold;');
        if (data) {
            console.log('%cData:', 'color: #4CAF50;', data);
        }
        console.trace();
        console.groupEnd();
    }
};

const error = (message, data = null) => {
    if (isDev) {
        console.groupCollapsed(`%c[HeadGenerator] ❌ ${new Date().toLocaleTimeString()} ${message}`, 'color: #F44336; font-weight: bold;');
        if (data) {
            console.log('%cData:', 'color: #4CAF50;', data);
        }
        console.trace();
        console.groupEnd();
    }
    // Always log errors to console.error for visibility
    console.error(`[HeadGenerator] ${message}`, data);
};

// Default setup configuration
const defaultSetup = {
    fonts: [],
    general: {
        title: 'Default Title',
        description: 'Default Description',
        canonical: window.location.href,
        themeColor: '#000000',
        ogLocale: 'en_US',
        ogType: 'website',
        siteName: 'Site Name',
        favicons: [],
        robots: 'index, follow',
        x: {
            card: 'summary_large_image',
            domain: window.location.hostname
        },
        theme_colors: {
            light: '#000000',
            dark: '#000000'
        }
    },
    business: {},
    font_awesome: { kitUrl: 'https://kit.fontawesome.com/85d1e578b1.js' },
    media: {
        responsive_images: {
            directory_path: '/Sandbox/img/responsive/'  // Your correct fallback
        }
    }
};

// Global config cache (accessible by other modules)
window.__SETUP_CONFIG__ = null;

// Function to load setup.json using root-relative path
async function loadSetup() {
    // Check if we already have the config cached
    if (window.__SETUP_CONFIG__) {
        log('Using cached setup.json from global');
        return window.__SETUP_CONFIG__;
    }

    // Use root-relative path to match HTML preload
    const setupPath = './JSON/setup.json';

    try {
        log(`Fetching setup.json from: ${setupPath}`);
        const response = await fetch(setupPath, { 
            cache: 'force-cache',
            mode: 'cors',
            credentials: 'omit'
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${setupPath}`);
        
        const jsonText = await response.text();
        const setup = JSON.parse(jsonText);
        
        // Validate JSON structure
        if (!setup || typeof setup !== 'object') {
            throw new Error('Invalid JSON structure in setup.json');
        }
        
        const mergedSetup = {
            ...defaultSetup,
            ...setup,
            general: { ...defaultSetup.general, ...(setup.general || {}) },
            business: { ...defaultSetup.business, ...(setup.business || {}) },
            media: { ...defaultSetup.media, ...(setup.media || {}) },
            fonts: setup.fonts || defaultSetup.fonts,
            font_awesome: { ...defaultSetup.font_awesome, ...(setup.font_awesome || {}) }
        };
        
        window.__SETUP_CONFIG__ = mergedSetup;
        log('Loaded setup.json', { 
            path: setupPath,
            keys: Object.keys(mergedSetup),
            responsivePath: mergedSetup.media?.responsive_images?.directory_path
        });
        return mergedSetup;
    } catch (err) {
        error('Failed to load setup.json', { 
            path: setupPath,
            error: err.message,
            stack: err.stack
        });
        
        window.__SETUP_CONFIG__ = defaultSetup;
        log('Using default setup configuration');
        return defaultSetup;
    }
}

// Dependency mapping: component → required modules
const DEPENDENCIES = {
    // CORE LAYER - BASE FOUNDATION (loaded first if needed)
    'shared': [], // Shared utilities (BASE dependency)
    
    // CONFIG LAYER - Independent (can load anytime)
    'config': [],
    
    // MEDIA LAYER - Depend on shared (validation constants)
    'image-generator': ['shared'],  // Needs VALID_IMAGE_EXTENSIONS
    'video-generator': ['shared'],  // Needs VALID_VIDEO_EXTENSIONS
    
    // LAYOUT COMPONENTS - Depend on appropriate layers
    'custom-block': ['image-generator', 'video-generator', 'shared'],
    'custom-nav': ['shared'],
    'custom-logo': ['image-generator', 'shared'],
    'custom-header': ['image-generator', 'shared']
};

// Path mapping for different module types
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

// Function to load a single module with correct path
async function loadModule(moduleName) {
    const modulePath = PATH_MAP[moduleName];
    if (!modulePath) {
        const err = new Error(`Unknown module: ${moduleName}`);
        error(`Module not found in PATH_MAP`, { 
            moduleName, 
            available: Object.keys(PATH_MAP) 
        });
        throw err;
    }

    try {
        log(`Loading module: ${modulePath}`);
        const module = await import(modulePath);
        log(`Successfully loaded: ${moduleName}`);
        return { name: moduleName, module, path: modulePath };
    } catch (err) {
        error(`Failed to load module ${moduleName}`, { 
            path: modulePath, 
            error: err.message,
            stack: err.stack
        });
        return { name: moduleName, module: null, path: modulePath, error: err };
    }
}

// Function to load a component and ALL its dependencies FIRST
async function loadComponentWithDependencies(componentName) {
    log(`Loading component with dependencies: ${componentName}`);
    
    // Get direct dependencies for this component
    const directDeps = DEPENDENCIES[componentName] || [];
    
    // Recursively get ALL dependencies (including transitive ones)
    const allDependencies = new Set();
    const collectDependencies = (name) => {
        const deps = DEPENDENCIES[name] || [];
        deps.forEach(dep => {
            if (!allDependencies.has(dep)) {
                allDependencies.add(dep);
                collectDependencies(dep); // Recurse for transitive deps
            }
        });
    };
    
    directDeps.forEach(dep => collectDependencies(dep));
    
    // Create loading order: dependencies first, then component
    const loadOrder = [...allDependencies, componentName];
    log(`Load order for ${componentName}:`, loadOrder);

    // Load modules in correct order (dependencies first)
    const results = [];
    for (const moduleName of loadOrder) {
        const result = await loadModule(moduleName);
        results.push(result);
        
        // Early exit on critical failures
        if (result.error && moduleName === componentName) {
            throw result.error; // Component itself failed
        }
    }

    // Verify all critical dependencies loaded
    const missingDeps = directDeps.filter(dep => 
        results.find(r => r.name === dep)?.module === null
    );
    
    if (missingDeps.length > 0) {
        warn(`Component ${componentName} loaded but missing dependencies:`, missingDeps);
    }

    log(`Component ${componentName} loaded successfully with ${results.length} modules`);
    return results;
}

// Function to load components selectively based on data-components attribute
async function loadComponents(componentList) {
    if (!componentList) {
        log('No components specified, skipping');
        return [];
    }

    log('Loading requested components', { components: componentList });
    const components = componentList.split(' ').filter(c => c.trim());
    
    const allResults = [];
    for (const component of components) {
        try {
            const results = await loadComponentWithDependencies(component);
            allResults.push(...results);
        } catch (err) {
            error(`Failed to load component ${component}`, { 
                error: err.message,
                stack: err.stack
            });
            // Continue with other components
        }
    }

    // Summary
    const totalComponents = components.length;
    const successfulComponents = allResults.filter(r => 
        components.includes(r.name) && r.module
    ).length;
    
    const totalModules = allResults.length;
    const successfulModules = allResults.filter(r => r.module).length;
    
    log(`Component loading summary: ${successfulComponents}/${totalComponents} components, ${successfulModules}/${totalModules} modules`, {
        components,
        successful: allResults.filter(r => r.module && components.includes(r.name)).map(r => r.name),
        failed: allResults.filter(r => r.error && components.includes(r.name)).map(r => r.name)
    });

    return allResults;
}

// Function to create and append DOM elements asynchronously
async function updateHead(attributes) {
    log('updateHead called with attributes', attributes);
    const head = document.head;
    const criticalFrag = document.createDocumentFragment();
    const deferredFrag = document.createDocumentFragment();

    // Load setup config
    const setup = await loadSetup();

    // Fonts: Critical for rendering
    let hasValidFonts = false;
    (setup.fonts || []).forEach(font => {
        const fontUrl = font.href ?? font.url ?? '';
        if (fontUrl) {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = fontUrl;
            link.as = font.as ?? 'font';
            link.type = font.type ?? 'font/woff2';
            link.crossOrigin = font.crossorigin ?? 'anonymous';
            criticalFrag.appendChild(link);
            log(`Added font preload: ${fontUrl}`);
            hasValidFonts = true;
        } else {
            warn('Skipping invalid font entry', font);
        }
    });
    if (!hasValidFonts) {
        warn('No valid fonts in setup.json; relying on CSS @font-face');
    }

    // Stylesheet: Critical for FCP (root-relative from page)
    const styleLink = document.createElement('link');
    styleLink.rel = 'stylesheet';
    styleLink.href = './styles.css';  // Relative to page /Sandbox/block.html
    criticalFrag.appendChild(styleLink);
    log('Applied stylesheet: ./styles.css');

    // Font Awesome: Semi-critical
    const faKitUrl = setup.font_awesome?.kit_url ?? setup.font_awesome?.kitUrl ?? 'https://kit.fontawesome.com/85d1e578b1.js';
    if (faKitUrl) {
        const script = document.createElement('script');
        script.src = faKitUrl;
        script.crossOrigin = 'anonymous';
        script.async = true;
        criticalFrag.appendChild(script);
        log(`Added Font Awesome Kit script: ${faKitUrl}`);
    } else {
        warn('No Font Awesome kit URL found; icons may not load');
    }

    // Meta tags: Critical for SEO
    const metaTags = [
        { name: 'robots', content: setup.general?.robots ?? 'index, follow' },
        { name: 'title', content: attributes.title ?? setup.general?.title ?? 'Default Title' },
        { name: 'author', content: setup.business?.author ?? 'Author' },
        { name: 'description', content: attributes.description ?? setup.general?.description ?? 'Default Description' },
        { name: 'og:locale', property: true, content: setup.general?.og?.locale ?? 'en_US' },
        { name: 'og:url', property: true, content: attributes.canonical ?? setup.general?.canonical ?? window.location.href },
        { name: 'og:type', property: true, content: setup.general?.ogType ?? 'website' },
        { name: 'og:title', property: true, content: attributes.title ?? setup.general?.title ?? 'Default Title' },
        { name: 'og:description', property: true, content: attributes.description ?? setup.general?.description ?? 'Default Description' },
        { name: 'og:image', property: true, content: setup.business?.image ?? '' },
        { name: 'og:site_name', property: true, content: setup.general?.og?.site_name ?? 'Site Name' },
        { name: 'twitter:card', content: setup.general?.x?.card ?? 'summary_large_image' },
        { name: 'twitter:domain', content: setup.general?.x?.domain ?? window.location.hostname },
        { name: 'twitter:url', content: attributes.canonical ?? setup.general?.canonical ?? window.location.href },
        { name: 'twitter:title', content: attributes.title ?? setup.general?.title ?? 'Default Title' },
        { name: 'twitter:description', content: attributes.description ?? setup.general?.description ?? 'Default Description' },
        { name: 'twitter:image', content: setup.business?.image ?? '' }
    ].filter(({ content }) => content);

    metaTags.forEach(({ name, property, content }) => {
        const meta = document.createElement('meta');
        if (property) {
            meta.setAttribute('property', name);
        } else {
            meta.name = name;
        }
        meta.content = content;
        criticalFrag.appendChild(meta);
        log(`Added ${property ? 'property' : 'name'} "${name}" with content: ${content}`);
    });

    // Canonical link: Critical for SEO
    const canonicalUrl = attributes.canonical ?? setup.general?.canonical ?? window.location.href;
    if (canonicalUrl) {
        const link = document.createElement('link');
        link.rel = 'canonical';
        link.href = canonicalUrl;
        criticalFrag.appendChild(link);
        log('Added canonical link: ' + canonicalUrl);
    }

    // Theme color: Critical for visual
    const themeColor = setup.general?.theme_colors?.light ?? '#000000';
    if (themeColor && themeColor !== '#000000') {
        const meta = document.createElement('meta');
        meta.name = 'theme-color';
        meta.content = themeColor;
        meta.media = '(prefers-color-scheme: light)';
        criticalFrag.appendChild(meta);
        log(`Updated theme-color (light): ${themeColor}`);
        
        const darkTheme = setup.general?.theme_colors?.dark ?? themeColor;
        if (darkTheme !== themeColor) {
            const darkMeta = document.createElement('meta');
            darkMeta.name = 'theme-color';
            darkMeta.content = darkTheme;
            darkMeta.media = '(prefers-color-scheme: dark)';
            criticalFrag.appendChild(darkMeta);
            log(`Updated theme-color (dark): ${darkTheme}`);
        }
    }

    // JSON-LD schema: Non-critical, defer
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": setup.business?.name ?? '',
        "url": setup.business?.url ?? '',
        "telephone": setup.business?.telephone ?? '',
        "address": setup.business?.address ? {
            "@type": "PostalAddress",
            "streetAddress": setup.business.address.streetAddress,
            "addressLocality": setup.business.address.addressLocality,
            "addressRegion": setup.business.address.addressRegion,
            "postalCode": setup.business.address.postalCode,
            "addressCountry": setup.business.address.addressCountry
        } : null,
        "openingHours": setup.business?.openingHours?.split(',') || [],
        "geo": setup.business?.geo ? {
            "@type": "GeoCoordinates",
            "latitude": setup.business.geo.latitude,
            "longitude": setup.business.geo.longitude
        } : null,
        "image": setup.business?.image ?? '',
        "logo": setup.business?.logo ?? '',
        "sameAs": setup.business?.sameAs || []
    };
    
    // Filter out empty values
    const cleanedJsonLd = Object.fromEntries(
        Object.entries(jsonLd).filter(([_, value]) => value && (Array.isArray(value) ? value.length > 0 : true))
    );
    
    if (Object.keys(cleanedJsonLd).length > 1) {  // At least @context + one more
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(cleanedJsonLd, null, 2);
        deferredFrag.appendChild(script);
        log('Added Organization JSON-LD schema (deferred)', { 
            name: cleanedJsonLd.name,
            url: cleanedJsonLd.url,
            sameAsCount: cleanedJsonLd.sameAs?.length || 0
        });
    } else {
        log('Skipped empty JSON-LD schema');
    }

    // Favicons: Critical for branding (root-relative from page)
    const faviconPaths = (setup.general?.favicons ?? [
        { rel: 'apple-touch-icon', sizes: '180x180', href: './img/icons/apple-touch-icon.png' },
        { rel: 'icon', type: 'image/png', sizes: '32x32', href: './img/icons/favicon-32x32.png' },
        { rel: 'icon', type: 'image/png', sizes: '16x16', href: './img/icons/favicon-16x16.png' },
        { rel: 'icon', type: 'image/x-icon', href: './img/icons/favicon.ico' }
    ]).filter(f => f.href && !f.href.includes('...'));

    faviconPaths.forEach(favicon => {
        const link = document.createElement('link');
        link.rel = favicon.rel;
        link.href = favicon.href;
        if (favicon.sizes) link.sizes = favicon.sizes;
        if (favicon.type) link.type = favicon.type;
        criticalFrag.appendChild(link);
        log(`Added favicon: ${favicon.href}`);
    });

    // Snipcart: Non-critical, defer
    if (setup.general?.include_e_commerce && setup.general?.snipcart) {
        const snipcart = setup.general.snipcart;
        const script = document.createElement('script');
        script.id = 'snipcart';
        script.src = `https://cdn.snipcart.com/themes/v${snipcart.version}/default/snipcart.${snipcart.version}.js`;
        script.setAttribute('data-api-key', snipcart.publicApiKey);
        script.setAttribute('data-config-modal-style', snipcart.modalStyle);
        script.setAttribute('data-config-load-strategy', snipcart.loadStrategy);
        if (snipcart.templatesUrl) {
            script.setAttribute('data-templates-url', snipcart.templatesUrl);
        }
        deferredFrag.appendChild(script);
        log('Added Snipcart script (deferred)', { version: snipcart.version });
    }

    // Append critical elements immediately
    head.appendChild(criticalFrag);
    log('Appended critical elements to head', { count: criticalFrag.childNodes.length });

    // Defer non-critical appends
    const appendDeferred = () => {
        head.appendChild(deferredFrag);
        log('Appended deferred elements to head', { count: deferredFrag.childNodes.length });
    };
    if (window.requestIdleCallback) {
        requestIdleCallback(appendDeferred, { timeout: 2000 });
    } else {
        setTimeout(appendDeferred, 0);
    }
}

// Main execution (async IIFE)
(async () => {
    try {
        log('Starting HeadGenerator');
        
        const customHead = document.querySelector('data-custom-head');
        if (!customHead) {
            warn('No data-custom-head element found');
            return;
        }

        log(`Found data-custom-head elements: ${document.querySelectorAll('data-custom-head').length}`);

        // Gather attributes
        const attributes = {};
        for (const attr of customHead.attributes) {
            const key = attr.name.replace(/^data-/, '');
            const value = attr.value?.trim();
            if (value) {  // Truthy check
                attributes[key] = value;
            }
        }
        log('Merged attributes', attributes);

        // Load components selectively based on data-components
        if (attributes.components) {
            await loadComponents(attributes.components);
        }

        // Update head
        await updateHead(attributes);

        // Remove data-custom-head element
        customHead.remove();
        log('Removed data-custom-head element');
        
        log('HeadGenerator completed successfully');
    } catch (err) {
        error('Error in HeadGenerator', { 
            error: err.message, 
            stack: err.stack 
        });
    }
})();
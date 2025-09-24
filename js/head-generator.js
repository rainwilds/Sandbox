// Browser-compatible dev detection
const isDev = window.location.href.includes('/dev/') ||
    new URLSearchParams(window.location.search).get('debug') === 'true';

// Debug logging methods
const timestamp = new Date().toLocaleTimeString();
const log = (message, data = null) => {
    if (isDev) {
        console.groupCollapsed(`%c[HeadGenerator] ${timestamp} ${message}`, 'color: #2196F3; font-weight: bold;');
        if (data) {
            console.log('%cData:', 'color: #4CAF50;', data);
        }
        console.groupEnd();
    }
};

const warn = (message, data = null) => {
    if (isDev) {
        console.groupCollapsed(`%c[HeadGenerator] ⚠️ ${timestamp} ${message}`, 'color: #FF9800; font-weight: bold;');
        if (data) {
            console.log('%cData:', 'color: #4CAF50;', data);
        }
        console.groupEnd();
    }
};

const error = (message, data = null) => {
    if (isDev) {
        console.groupCollapsed(`%c[HeadGenerator] ❌ ${timestamp} ${message}`, 'color: #F44336; font-weight: bold;');
        if (data) {
            console.log('%cData:', 'color: #4CAF50;', data);
        }
        console.trace();
        console.groupEnd();
    }
    console.error(`[HeadGenerator] ${message}`, data);
};

// Function to load setup.json
async function loadSetup() {
    if (window.__SETUP_CONFIG__) {
        log('Using cached setup.json from global');
        return window.__SETUP_CONFIG__;
    }

    const setupPath = './JSON/setup.json';
    try {
        log(`Fetching setup.json from: ${setupPath}`);
        const response = await fetch(setupPath);
        if (!response.ok) throw new Error(`HTTP ${response.status}: ${setupPath}`);
        
        const jsonText = await response.text();
        const setup = JSON.parse(jsonText);
        
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

// Function to create and append DOM elements asynchronously
async function updateHead(attributes, setup) {
    log('updateHead called with attributes', attributes);
    const head = document.head;
    const criticalFrag = document.createDocumentFragment();
    const deferredFrag = document.createDocumentFragment();

    // Fonts
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

    // Stylesheet
    const styleLink = document.createElement('link');
    styleLink.rel = 'stylesheet';
    styleLink.href = './styles.css';
    criticalFrag.appendChild(styleLink);
    log('Applied stylesheet: ./styles.css');

    // Font Awesome
    if (setup.font_awesome?.kitUrl && document.querySelector('[class*="fa-"]')) {
        const script = document.createElement('script');
        script.src = setup.font_awesome.kitUrl;
        script.crossOrigin = 'anonymous';
        script.async = true;
        criticalFrag.appendChild(script);
        log(`Added Font Awesome Kit script: ${setup.font_awesome.kitUrl}`);
    } else {
        log('Skipped Font Awesome script: no icons detected or no kit URL');
    }

    // Meta tags
    const existingMetas = new Map(Array.from(head.querySelectorAll('meta')).map(m => [m.name || m.getAttribute('property'), m]));
    const metaTags = [
        // ... existing metaTags array
    ].filter(({ content }) => content);

    metaTags.forEach(({ name, property, content }) => {
        const key = property ? name : name;
        if (existingMetas.has(key)) {
            log(`Skipping duplicate meta ${key}`);
            return;
        }
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

    // Canonical link
    const canonicalUrl = attributes.canonical ?? setup.general?.canonical ?? window.location.href;
    if (canonicalUrl && !head.querySelector(`link[rel="canonical"][href="${canonicalUrl}"]`)) {
        const link = document.createElement('link');
        link.rel = 'canonical';
        link.href = canonicalUrl;
        criticalFrag.appendChild(link);
        log('Added canonical link: ' + canonicalUrl);
    }

    // Theme color
    const themeColor = setup.general?.theme_colors?.light ?? '#000000';
    if (themeColor && themeColor !== '#000000' && !head.querySelector(`meta[name="theme-color"][content="${themeColor}"]`)) {
        const meta = document.createElement('meta');
        meta.name = 'theme-color';
        meta.content = themeColor;
        meta.media = '(prefers-color-scheme: light)';
        criticalFrag.appendChild(meta);
        log(`Updated theme-color (light): ${themeColor}`);
        
        const darkTheme = setup.general?.theme_colors?.dark ?? themeColor;
        if (darkTheme !== themeColor && !head.querySelector(`meta[name="theme-color"][content="${darkTheme}"]`)) {
            const darkMeta = document.createElement('meta');
            darkMeta.name = 'theme-color';
            darkMeta.content = darkTheme;
            darkMeta.media = '(prefers-color-scheme: dark)';
            criticalFrag.appendChild(darkMeta);
            log(`Updated theme-color (dark): ${darkTheme}`);
        }
    }

    // JSON-LD schema
    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": setup.business?.name ?? '',
        "url": setup.business?.url ?? ''
    };

    if (jsonLd.name || jsonLd.url) {
        jsonLd.telephone = setup.business?.telephone ?? '';
        jsonLd.address = setup.business?.address ? {
            "@type": "PostalAddress",
            "streetAddress": setup.business.address.streetAddress,
            "addressLocality": setup.business.address.addressLocality,
            "addressRegion": setup.business.address.addressRegion,
            "postalCode": setup.business.address.postalCode,
            "addressCountry": setup.business.address.addressCountry
        } : null;
        jsonLd.openingHours = setup.business?.openingHours?.split(',') || [];
        jsonLd.geo = setup.business?.geo ? {
            "@type": "GeoCoordinates",
            "latitude": setup.business.geo.latitude,
            "longitude": setup.business.geo.longitude
        } : null;
        jsonLd.image = setup.business?.image ?? '';
        jsonLd.logo = setup.business?.logo ?? '';
        jsonLd.sameAs = setup.business?.sameAs || [];

        const cleanedJsonLd = Object.fromEntries(
            Object.entries(jsonLd).filter(([_, value]) => value && (Array.isArray(value) ? value.length > 0 : true))
        );
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(cleanedJsonLd);
        deferredFrag.appendChild(script);
        log('Added Organization JSON-LD schema (deferred)', { 
            name: cleanedJsonLd.name,
            url: cleanedJsonLd.url,
            sameAsCount: cleanedJsonLd.sameAs?.length || 0
        });
    } else {
        log('Skipped JSON-LD schema due to missing required fields');
    }

    // Favicons
    const faviconPaths = (setup.general?.favicons ?? [
        // ... existing faviconPaths
    ]).filter(f => f.href && !f.href.includes('...'));

    faviconPaths.forEach(favicon => {
        if (head.querySelector(`link[rel="${favicon.rel}"][href="${favicon.href}"]`)) {
            log(`Skipping duplicate favicon: ${favicon.href}`);
            return;
        }
        const link = document.createElement('link');
        link.rel = favicon.rel;
        link.href = favicon.href;
        if (favicon.sizes) link.sizes = favicon.sizes;
        if (favicon.type) link.type = favicon.type;
        criticalFrag.appendChild(link);
        log(`Added favicon: ${favicon.href}`);
    });

    // Snipcart
    if (setup.general?.include_e_commerce && setup.general?.snipcart && document.querySelector('[data-snipcart]')) {
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
    } else {
        log('Skipped Snipcart script: e-commerce not enabled or no Snipcart elements');
    }

    // Append fragments
    head.appendChild(criticalFrag);
    log('Appended critical elements to head', { count: criticalFrag.childNodes.length });

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

// Main execution
(async () => {
    const setupPromise = loadSetup();
    try {
        log('Starting HeadGenerator');
        
        const customHead = document.querySelector('data-custom-head');
        if (!customHead) {
            warn('No data-custom-head element found');
            return;
        }
        log(`Found data-custom-head element`);

        const attributes = {};
        for (const attr of customHead.attributes) {
            const key = attr.name.replace(/^data-/, '');
            const value = attr.value?.trim();
            if (value) {
                attributes[key] = value;
            }
        }
        log('Merged attributes', attributes);

        if (attributes.components) {
            await loadComponents(attributes.components.trim().split(/\s+/).filter(Boolean));
        }

        const setup = await setupPromise;
        await updateHead(attributes, setup);
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
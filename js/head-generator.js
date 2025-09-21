/* global document, window, console, fetch, Promise, requestIdleCallback */
(async () => {
    // Browser-compatible dev detection
    const isDev = window.location.href.includes('/dev/') ||
      new URLSearchParams(window.location.search).get('debug') === 'true';

    // Debug logging methods
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
    };

    // Cache for setup.json
    let setupCache = null;

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
            favicons: []
        },
        business: {},
        font_awesome: { kitUrl: 'https://kit.fontawesome.com/85d1e578b1.js' }
    };

    // Function to fetch and cache setup.json
    async function fetchSetup() {
        if (setupCache) {
            log('Using cached setup.json');
            return setupCache;
        }
        try {
            log('Fetching setup.json');
            const response = await fetch('./JSON/setup.json', { cache: 'force-cache' });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const jsonText = await response.text();
            setupCache = JSON.parse(jsonText);
            log('Loaded setup.json', setupCache);
            return setupCache;
        } catch (err) {
            error('Failed to load setup.json', { error: err.message });
            return defaultSetup;
        }
    }

    // Function to load components in parallel
    async function loadComponents(components) {
        log('Loading components', { components });
        const componentImports = components.split(' ').map(async (component) => {
            try {
                const module = await import(`./components/${component}.js`);
                log(`Loaded module: ./components/${component}.js`);
                return module;
            } catch (err) {
                error(`Failed to load component ${component}`, { error: err.message });
                return null;
            }
        });
        return Promise.all(componentImports);
    }

    // Function to create and append DOM elements asynchronously
    async function updateHead(attributes) {
        log('updateHead called with attributes', attributes);
        const head = document.head;
        const criticalFrag = document.createDocumentFragment();  // For SEO-critical and render-critical
        const deferredFrag = document.createDocumentFragment();  // For non-critical (JSON-LD, Snipcart)

        // Fonts: Critical for rendering
        const setup = await fetchSetup();
        let hasValidFonts = false;
        setup.fonts.forEach(font => {
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

        // Stylesheet: Critical for FCP
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = './styles.css';
        criticalFrag.appendChild(styleLink);
        log('Applied stylesheet: ./styles.css');

        // Font Awesome: Semi-critical (icons may be visible early)
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
            { name: 'robots', content: setup.general.robots ?? 'index, follow' },
            { name: 'title', content: attributes.title ?? setup.general.title },
            { name: 'author', content: setup.business.author ?? 'Author' },
            { name: 'description', content: attributes.description ?? setup.general.description },
            { name: 'og:locale', content: setup.general.og?.locale ?? 'en_US' },
            { name: 'og:url', content: attributes.canonical ?? setup.general.canonical },
            { name: 'og:type', content: setup.general.ogType ?? 'website' },
            { name: 'og:title', content: attributes.title ?? setup.general.title },
            { name: 'og:description', content: attributes.description ?? setup.general.description },
            { name: 'og:image', content: setup.business.image ?? '' },
            { name: 'og:site_name', content: setup.general.og?.site_name ?? 'Site Name' },
            { name: 'twitter:card', content: setup.general.x?.card ?? 'summary_large_image' },
            { name: 'twitter:domain', content: setup.general.x?.domain ?? window.location.hostname },
            { name: 'twitter:url', content: attributes.canonical ?? setup.general.canonical },
            { name: 'twitter:title', content: attributes.title ?? setup.general.title },
            { name: 'twitter:description', content: attributes.description ?? setup.general.description },
            { name: 'twitter:image', content: setup.business.image ?? '' }
        ].filter(({ content }) => content);

        metaTags.forEach(({ name, content }) => {
            const meta = document.createElement('meta');
            if (name.startsWith('og:')) {
                meta.setAttribute('property', name);
            } else {
                meta.name = name;
            }
            meta.content = content;
            criticalFrag.appendChild(meta);
            log(`Added ${name} meta with content: ${content}`);
        });

        // Canonical link: Critical for SEO
        const canonicalUrl = attributes.canonical ?? setup.general.canonical ?? window.location.href;
        if (canonicalUrl) {
            const link = document.createElement('link');
            link.rel = 'canonical';
            link.href = canonicalUrl;
            criticalFrag.appendChild(link);
            log('Added canonical link: ' + canonicalUrl);
        }

        // Theme color: Critical for visual
        const themeColor = setup.general.theme_colors?.light ?? '#000000';
        if (themeColor) {
            const meta = document.createElement('meta');
            meta.name = 'theme-color';
            meta.content = themeColor;
            meta.media = '(prefers-color-scheme: light)';
            criticalFrag.appendChild(meta);
            log(`Updated theme-color (light): ${themeColor}`);
            const darkTheme = setup.general.theme_colors?.dark ?? '#000000';
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
            "name": setup.business.name ?? '',
            "url": setup.business.url ?? '',
            "telephone": setup.business.telephone ?? '',
            "address": setup.business.address ?? '',
            "openingHours": setup.business.openingHours ?? '',
            "geo": setup.business.geo ?? '',
            "image": setup.business.image ?? '',
            "logo": setup.business.logo ?? '',
            "sameAs": setup.business.sameAs ?? ''
        };
        const hasValidData = Object.values(jsonLd).some(v => v && v !== '');
        if (hasValidData) {
            const script = document.createElement('script');
            script.type = 'application/ld+json';
            script.textContent = JSON.stringify(jsonLd);
            deferredFrag.appendChild(script);
            log('Added Organization JSON-LD schema (deferred)');
        }

        // Favicons: Critical for branding
        const faviconPaths = (setup.general.favicons ?? [
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
        if (setup.general.include_e_commerce && setup.general.snipcart) {
            const snipcart = setup.general.snipcart;
            const script = document.createElement('script');
            script.id = 'snipcart';
            script.src = `https://cdn.snipcart.com/themes/v${snipcart.version}/default/snipcart.${snipcart.version}.js`;
            script.dataApiKey = snipcart.publicApiKey;
            script.dataConfigModalStyle = snipcart.modalStyle;
            script.dataConfigLoadStrategy = snipcart.loadStrategy;
            if (snipcart.templatesUrl) script.setAttribute('data-templates-url', snipcart.templatesUrl);
            deferredFrag.appendChild(script);
            log('Added Snipcart script (deferred)');
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

    // Main execution
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
            if (value ?? false) {
                attributes[key] = value;
            }
        }
        log('Merged attributes', attributes);

        // Load components
        if (attributes.components) {
            await loadComponents(attributes.components);
        }

        // Update head
        await updateHead(attributes);

        // Remove data-custom-head element
        customHead.remove();
        log('Removed data-custom-head element');
    } catch (err) {
        error('Error in HeadGenerator', { error: err.message, stack: err.stack });
    }
})();
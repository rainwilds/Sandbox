/* global document, window, console, fetch, Promise */
(async () => {
    // Browser-compatible dev detection (e.g., URL includes '/dev/')
    const isDev = window.location.href.includes('/dev/');
    const log = (message) => { if (isDev) console.log(`[HeadGenerator] ${new Date().toLocaleTimeString()} ${message}`); };

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
            const response = await fetch('./JSON/setup.json', { cache: 'force-cache' });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const jsonText = await response.text();
            setupCache = JSON.parse(jsonText);
            if (isDev) log('Loaded setup.json: ' + JSON.stringify(setupCache, null, 2));
            return setupCache;
        } catch (error) {
            console.error('Failed to load setup.json:', error);
            return defaultSetup;
        }
    }

    // Function to load components in parallel
    async function loadComponents(components) {
        const componentImports = components.split(' ').map(async (component) => {
            try {
                const module = await import(`./components/${component}.js`);
                log(`Loaded module: ./components/${component}.js`);
                return module;
            } catch (error) {
                console.error(`Failed to load component ${component}:`, error);
                return null;
            }
        });
        return Promise.all(componentImports);
    }

    // Function to create and append DOM elements asynchronously
    async function updateHead(attributes) {
        if (isDev) log('updateHead called with attributes: ' + JSON.stringify(attributes, null, 2));
        const head = document.head;
        const frag = document.createDocumentFragment();  // Batch all appends

        // Fonts: Pre-fetch setup once
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
                frag.appendChild(link);  // Batch
                if (isDev) log(`Added font preload: ${fontUrl}`);
                hasValidFonts = true;
            } else {
                console.warn('Skipping invalid font entry:', font);
            }
        });
        if (!hasValidFonts) {
            log('No valid fonts in setup.json; relying on CSS @font-face');
        }

        // Stylesheet
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = './styles.css';
        frag.appendChild(styleLink);  // Batch
        log('Applied stylesheet: ./styles.css');

        // Font Awesome
        const faKitUrl = setup.font_awesome?.kit_url ?? setup.font_awesome?.kitUrl ?? 'https://kit.fontawesome.com/85d1e578b1.js';
        if (faKitUrl) {
            const script = document.createElement('script');
            script.src = faKitUrl;
            script.crossOrigin = 'anonymous';
            script.async = true;
            frag.appendChild(script);  // Batch
            log(`Added Font Awesome Kit script: ${faKitUrl}`);
        } else {
            console.warn('No Font Awesome kit URL found; icons may not load');
        }

        // Meta tags: Pre-build array with nullish coalescing
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
            frag.appendChild(meta);  // Batch
            if (isDev) log(`Added ${name} meta with content: ${content}`);
        });

        // Canonical link
        const canonicalUrl = attributes.canonical ?? setup.general.canonical ?? window.location.href;
        if (canonicalUrl) {
            const link = document.createElement('link');
            link.rel = 'canonical';
            link.href = canonicalUrl;
            frag.appendChild(link);  // Batch
            log('Added canonical link: ' + canonicalUrl);
        }

        // Theme color
        const themeColor = setup.general.theme_colors?.light ?? '#000000';
        if (themeColor) {
            const meta = document.createElement('meta');
            meta.name = 'theme-color';
            meta.content = themeColor;
            meta.media = '(prefers-color-scheme: light)';
            frag.appendChild(meta);  // Batch
            log(`Updated theme-color (light): ${themeColor}`);
            const darkTheme = setup.general.theme_colors?.dark ?? '#000000';
            if (darkTheme !== themeColor) {
                const darkMeta = document.createElement('meta');
                darkMeta.name = 'theme-color';
                darkMeta.content = darkTheme;
                darkMeta.media = '(prefers-color-scheme: dark)';
                frag.appendChild(darkMeta);  // Batch
                log(`Updated theme-color (dark): ${darkTheme}`);
            }
        }

        // JSON-LD schema
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
            frag.appendChild(script);  // Batch
            log('Added Organization JSON-LD schema');
        }

        // Favicons: Filter invalid upfront
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
            frag.appendChild(link);  // Batch
            if (isDev) log(`Added favicon: ${favicon.href}`);
        });

        // Snipcart
        if (setup.general.include_e_commerce && setup.general.snipcart) {
            const snipcart = setup.general.snipcart;
            const script = document.createElement('script');
            script.id = 'snipcart';
            script.src = `https://cdn.snipcart.com/themes/v${snipcart.version}/default/snipcart.${snipcart.version}.js`;
            script.dataApiKey = snipcart.publicApiKey;
            script.dataConfigModalStyle = snipcart.modalStyle;
            script.dataConfigLoadStrategy = snipcart.loadStrategy;
            if (snipcart.templatesUrl) script.setAttribute('data-templates-url', snipcart.templatesUrl);
            frag.appendChild(script);  // Batch
            log('Added Snipcart script');
        }

        // Single batch append at end
        head.appendChild(frag);
    }

    // Main execution
    try {
        const customHead = document.querySelector('data-custom-head');
        if (!customHead) {
            log('No data-custom-head element found');
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
        if (isDev) log('Merged attributes: ' + JSON.stringify(attributes, null, 2));

        // Load components
        if (attributes.components) {
            await loadComponents(attributes.components);
        }

        // Update head
        await updateHead(attributes);

        // Remove data-custom-head element
        customHead.remove();
        log('Removed data-custom-head element');
    } catch (error) {
        console.error('Error in HeadGenerator:', error);
    }
})();
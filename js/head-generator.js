/* global document, window, console, fetch, Promise */
(async () => {
    const log = (message) => console.log(`[HeadGenerator] ${new Date().toLocaleTimeString()} ${message}`);

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
            siteName: 'Site Name'
        },
        business: {},
        font_awesome: { kitUrl: 'https://kit.fontawesome.com/85d1e578b1.js' }
    };

    // Function to fetch and cache setup.json (simplified—no preload hints needed now)
    async function fetchSetup() {
        if (setupCache) {
            log('Using cached setup.json');
            return setupCache;
        }
        try {
            const response = await fetch('./JSON/setup.json', { cache: 'force-cache' });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            setupCache = await response.json();
            log('Loaded setup.json: ' + JSON.stringify(setupCache, null, 2));
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
        log('manageHead called with attributes: ' + JSON.stringify(attributes, null, 2));
        const head = document.head;

        // Fonts
        const setup = await fetchSetup();
        setup.fonts.forEach(font => {
            // Guard: Skip if URL undefined
            if (!font.url || font.url.includes('undefined')) {
                console.error('Skipping invalid font URL:', font.url);
                return;
            }
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = font.url;
            link.as = 'font';
            link.type = 'font/woff2';
            link.crossOrigin = 'anonymous';
            head.appendChild(link);
            log(`Added font preload: ${font.url}`);
        });

        // Stylesheet
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = './styles.css';
        head.appendChild(styleLink);
        log('Applied stylesheet: ./styles.css');

        // Font Awesome
        if (setup.font_awesome?.kitUrl) {
            const script = document.createElement('script');
            script.src = setup.font_awesome.kitUrl;
            script.crossOrigin = 'anonymous';
            head.appendChild(script);
            log(`Added Font Awesome Kit script: ${setup.font_awesome.kitUrl}`);
        }

        // Meta tags (guard dynamic content)
        const metaTags = [
            { name: 'robots', content: 'index, follow' },
            { name: 'title', content: attributes.title || setup.general.title },
            { name: 'author', content: setup.business.author || 'Author' },
            { name: 'description', content: attributes.description || setup.general.description },
            { name: 'og:locale', content: attributes['og-locale'] || setup.general.ogLocale },
            { name: 'og:url', content: attributes.canonical || setup.general.canonical },
            { name: 'og:type', content: attributes['og-type'] || setup.general.ogType },
            { name: 'og:title', content: attributes.title || setup.general.title },
            { name: 'og:description', content: attributes.description || setup.general.description },
            { name: 'og:image', content: attributes['og-image'] || setup.general.ogImage || '' },
            { name: 'og:site_name', content: attributes['site-name'] || setup.general.siteName },
            { name: 'x:card', content: attributes['x-card'] || 'summary_large_image' },
            { name: 'x:domain', content: attributes['x-domain'] || window.location.hostname },
            { name: 'x:url', content: attributes.canonical || setup.general.canonical },
            { name: 'x:title', content: attributes.title || setup.general.title },
            { name: 'x:description', content: attributes.description || setup.general.description },
            { name: 'x:image', content: attributes['x-image'] || setup.general.ogImage || '' }
        ];

        metaTags.forEach(({ name, content }) => {
            if (content && !content.includes('undefined')) {  // Guard undefined
                const meta = document.createElement('meta');
                if (name.startsWith('og:')) meta.setAttribute('property', name);
                else meta.name = name;
                meta.content = content;
                head.appendChild(meta);
                log(`Added ${name} meta with content: ${content}`);
            }
        });

        // Canonical link (guard against undefined)
        const canonicalUrl = attributes.canonical || setup.general.canonical;
        if (canonicalUrl && !canonicalUrl.includes('undefined')) {
            const link = document.createElement('link');
            link.rel = 'canonical';
            link.href = canonicalUrl;
            head.appendChild(link);
            log('Added canonical link');
        }

        // Theme color (guard)
        const themeColor = attributes['theme-color'] || setup.general.themeColor;
        if (themeColor && !themeColor.includes('undefined')) {
            const meta = document.createElement('meta');
            meta.name = 'theme-color';
            meta.content = themeColor;
            head.appendChild(meta);
            log(`Updated theme-color: ${meta.content}`);
        }

        // JSON-LD schema (guard)
        const jsonLd = attributes['json-ld'] || setup.general.jsonLd;
        if (jsonLd && !JSON.stringify(jsonLd).includes('undefined')) {
            const script = document.createElement('script');
            script.type = 'application/ld+json';
            script.textContent = JSON.stringify(jsonLd);
            head.appendChild(script);
            log('Added JSON-LD schema');
        }

        // Favicons (guard paths from setup.json or defaults)
        const faviconPaths = [
            { rel: 'apple-touch-icon', href: setup.general.faviconApple || './img/icons/apple-touch-icon.png' },
            { rel: 'icon', href: setup.general.favicon32 || './img/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
            { rel: 'icon', href: setup.general.favicon16 || './img/icons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
            { rel: 'icon', href: setup.general.faviconIco || './img/icons/favicon.ico', type: 'image/x-icon' }
        ];

        faviconPaths.forEach(({ rel, href, sizes, type }) => {
            if (href && !href.includes('undefined')) {  // Guard undefined paths
                const link = document.createElement('link');
                link.rel = rel;
                link.href = href;
                if (sizes) link.sizes = sizes;
                if (type) link.type = type;
                head.appendChild(link);
                log(`Added favicon: ${href}`);
            }
        });
    }

    // Main execution
    try {
        const customHead = document.querySelector('data-custom-head');
        if (!customHead) {
            log('No data-custom-head element found');
            return;
        }

        log(`Found data-custom-head elements: ${document.querySelectorAll('data-custom-head').length}`);

        // Gather attributes from data-custom-head (guard undefined values)
        const attributes = {};
        for (const attr of customHead.attributes) {
            const key = attr.name.replace(/^data-/, '');
            const value = attr.value?.trim();  // Trim to avoid whitespace issues
            if (value !== undefined && value !== 'undefined') {
                attributes[key] = value;
            }
        }
        log('Merged attributes: ' + JSON.stringify(attributes, null, 2));

        // Load components in parallel
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
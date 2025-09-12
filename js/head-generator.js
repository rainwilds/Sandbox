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
        font_awesome: { kit_url: 'https://kit.fontawesome.com/85d1e578b1.js' }
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
            if (font.href) {
                const link = document.createElement('link');
                link.rel = 'preload';
                link.href = font.href;
                link.as = font.as || 'font';
                link.type = font.type || 'font/woff2';
                link.crossOrigin = font.crossorigin || 'anonymous';
                head.appendChild(link);
                log(`Added font preload: ${font.href}`);
            }
        });

        // Stylesheet
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = './styles.css';
        head.appendChild(styleLink);
        log('Applied stylesheet: ./styles.css');

        // Font Awesome
        if (setup.font_awesome?.kit_url) {
            const script = document.createElement('script');
            script.src = setup.font_awesome.kit_url;
            script.crossOrigin = 'anonymous';
            head.appendChild(script);
            log(`Added Font Awesome Kit script: ${setup.font_awesome.kit_url}`);
        }

        // Meta tags
        const metaTags = [
            { name: 'robots', content: attributes.robots || setup.general.robots || 'index, follow' },
            { name: 'title', content: attributes.title || setup.general.title },
            { name: 'author', content: attributes.author || setup.business.author || 'Author' },
            { name: 'description', content: attributes.description || setup.general.description },
            { name: 'og:locale', content: attributes['og-locale'] || setup.general.og?.locale || 'en_AU' },
            { name: 'og:url', content: attributes.canonical || setup.general.canonical },
            { name: 'og:type', content: attributes['og-type'] || setup.general.ogType || 'website' },
            { name: 'og:title', content: attributes.title || setup.general.title },
            { name: 'og:description', content: attributes.description || setup.general.description },
            { name: 'og:image', content: attributes['og-image'] || setup.business.image || '' },
            { name: 'og:site_name', content: attributes['site-name'] || setup.general.og?.site_name || 'Behive' },
            { name: 'x:card', content: attributes['x-card'] || setup.general.x?.card || 'summary_large_image' },
            { name: 'x:domain', content: attributes['x-domain'] || setup.general.x?.domain || window.location.hostname },
            { name: 'x:url', content: attributes.canonical || setup.general.canonical },
            { name: 'x:title', content: attributes.title || setup.general.title },
            { name: 'x:description', content: attributes.description || setup.general.description },
            { name: 'x:image', content: attributes['x-image'] || setup.business.image || '' }
        ];

        metaTags.forEach(({ name, content }) => {
            if (content) {
                const meta = document.createElement('meta');
                if (name.startsWith('og:')) meta.setAttribute('property', name);
                else meta.name = name;
                meta.content = content;
                head.appendChild(meta);
                log(`Added ${name} meta with content: ${content}`);
            }
        });

        // Canonical link
        if (attributes.canonical || setup.general.canonical) {
            const link = document.createElement('link');
            link.rel = 'canonical';
            link.href = attributes.canonical || setup.general.canonical;
            head.appendChild(link);
            log('Added canonical link');
        }

        // Theme color
        if (attributes['theme-color'] || setup.general.theme_colors) {
            const meta = document.createElement('meta');
            meta.name = 'theme-color';
            meta.content = attributes['theme-color'] || setup.general.theme_colors?.dark || '#141b32';
            head.appendChild(meta);
            log(`Updated theme-color: ${meta.content}`);
        }

        // JSON-LD schema
        if (attributes['json-ld'] || setup.business) {
            const script = document.createElement('script');
            script.type = 'application/ld+json';
            script.textContent = JSON.stringify(attributes['json-ld'] || {
                "@context": "http://schema.org",
                "@type": "Organization",
                name: setup.business.name || 'Behive',
                url: setup.business.url || window.location.origin,
                logo: setup.business.logo || '',
                sameAs: setup.business.sameAs || []
            });
            head.appendChild(script);
            log('Added JSON-LD schema');
        }

        // Favicons
        const favicons = setup.general.favicons || [
            { rel: 'apple-touch-icon', href: './img/icons/apple-touch-icon.png', sizes: '180x180' },
            { rel: 'icon', href: './img/icons/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
            { rel: 'icon', href: './img/icons/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
            { rel: 'icon', href: './img/icons/favicon.ico', type: 'image/x-icon' }
        ];

        favicons.forEach(({ rel, href, sizes, type }) => {
            const link = document.createElement('link');
            link.rel = rel;
            link.href = href.replace('.../', './img/icons/');
            if (sizes) link.sizes = sizes;
            if (type) link.type = type;
            head.appendChild(link);
            log(`Added favicon: ${href}`);
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

        // Gather attributes from data-custom-head
        const attributes = {};
        for (const attr of customHead.attributes) {
            attributes[attr.name.replace(/^data-/, '')] = attr.value;
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
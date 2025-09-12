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

            // Pre-validate JSON text for common issues (e.g., trailing chars)
            const jsonText = await response.text();
            if (!jsonText.trim().endsWith('}')) {
                throw new Error('Malformed JSON: Missing closing brace or trailing content');
            }

            setupCache = JSON.parse(jsonText);  // Explicit parse for better error context
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
        log('updateHead called with attributes: ' + JSON.stringify(attributes, null, 2));
        const head = document.head;

        // Fonts: Use setup.json if valid; otherwise, skip (CSS @font-face handles)
        const setup = await fetchSetup();
        let hasValidFonts = false;
        setup.fonts.forEach(font => {
            // Align to "href" key from your JSON; guard undefined
            const fontUrl = font.href || font.url;  // Flexible for either key
            if (fontUrl && !fontUrl.includes('undefined')) {
                const link = document.createElement('link');
                link.rel = 'preload';
                link.href = fontUrl;
                link.as = font.as || 'font';
                link.type = font.type || 'font/woff2';
                link.crossOrigin = font.crossorigin || 'anonymous';
                head.appendChild(link);
                log(`Added font preload: ${fontUrl}`);
                hasValidFonts = true;
            } else {
                console.warn('Skipping invalid font entry:', font);  // Warn once per invalid
            }
        });
        if (!hasValidFonts) {
            log('No valid fonts in setup.json; relying on CSS @font-face');
        }

        // Stylesheet (already preloaded in HTML)
        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = './styles.css';
        head.appendChild(styleLink);
        log('Applied stylesheet: ./styles.css');

        // Font Awesome (align to kit_url from JSON)
        const faKitUrl = setup.font_awesome?.kit_url || setup.font_awesome?.kitUrl || 'https://kit.fontawesome.com/85d1e578b1.js'; // Flexible key + fallback
        if (faKitUrl) {
            const script = document.createElement('script');
            script.src = faKitUrl;
            script.crossOrigin = 'anonymous';
            script.async = true; // Non-blocking
            head.appendChild(script);
            log(`Added Font Awesome Kit script: ${faKitUrl}`);
        } else {
            console.warn('No Font Awesome kit URL found; icons may not load');
        }

        // Meta tags (guard dynamic content)
        const metaTags = [
            { name: 'robots', content: setup.general.robots || 'index, follow' },
            { name: 'title', content: attributes.title || setup.general.title },
            { name: 'author', content: setup.business.author || 'Author' },
            { name: 'description', content: attributes.description || setup.general.description },
            { name: 'og:locale', content: setup.general.og?.locale || 'en_US' },
            { name: 'og:url', content: attributes.canonical || setup.general.canonical },
            { name: 'og:type', content: setup.general.ogType || 'website' },
            { name: 'og:title', content: attributes.title || setup.general.title },
            { name: 'og:description', content: attributes.description || setup.general.description },
            { name: 'og:image', content: setup.business.image || '' },
            { name: 'og:site_name', content: setup.general.og?.site_name || 'Site Name' },
            { name: 'twitter:card', content: setup.general.x?.card || 'summary_large_image' },
            { name: 'twitter:domain', content: setup.general.x?.domain || window.location.hostname },
            { name: 'twitter:url', content: attributes.canonical || setup.general.canonical },
            { name: 'twitter:title', content: attributes.title || setup.general.title },
            { name: 'twitter:description', content: attributes.description || setup.general.description },
            { name: 'twitter:image', content: setup.business.image || '' }
        ];

        metaTags.forEach(({ name, content }) => {
            if (content && !content.includes('undefined')) {
                const meta = document.createElement('meta');
                // OG tags use 'property'; Twitter uses 'name'
                if (name.startsWith('og:')) {
                    meta.setAttribute('property', name);
                } else {
                    meta.name = name;  // Covers twitter:, title, description, etc.
                }
                meta.content = content;
                head.appendChild(meta);
                log(`Added ${name} meta with content: ${content}`);
            }
        });

        // Canonical link (guard)
        const canonicalUrl = attributes.canonical || setup.general.canonical || window.location.href;
        if (canonicalUrl && !canonicalUrl.includes('undefined')) {
            const link = document.createElement('link');
            link.rel = 'canonical';
            link.href = canonicalUrl;
            head.appendChild(link);
            log('Added canonical link: ' + canonicalUrl);
        }

        // Theme color (use light/dark from your JSON)
        const themeColor = setup.general.theme_colors?.light || '#000000';
        if (themeColor && !themeColor.includes('undefined')) {
            const meta = document.createElement('meta');
            meta.name = 'theme-color';
            meta.content = themeColor;
            meta.media = '(prefers-color-scheme: light)';
            head.appendChild(meta);
            log(`Updated theme-color (light): ${themeColor}`);
            // Dark mode variant
            const darkTheme = setup.general.theme_colors?.dark || '#000000';
            if (darkTheme !== themeColor) {
                const darkMeta = document.createElement('meta');
                darkMeta.name = 'theme-color';
                darkMeta.content = darkTheme;
                darkMeta.media = '(prefers-color-scheme: dark)';
                head.appendChild(darkMeta);
                log(`Updated theme-color (dark): ${darkTheme}`);
            }
        }

        // JSON-LD schema (using business data from your JSON)
        const jsonLd = {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": setup.business.name,
            "url": setup.business.url,
            "telephone": setup.business.telephone,
            "address": setup.business.address,
            "openingHours": setup.business.openingHours,
            "geo": setup.business.geo,
            "image": setup.business.image,
            "logo": setup.business.logo,
            "sameAs": setup.business.sameAs
        };
        if (Object.keys(jsonLd).length > 1 && !JSON.stringify(jsonLd).includes('undefined')) {
            const script = document.createElement('script');
            script.type = 'application/ld+json';
            script.textContent = JSON.stringify(jsonLd);
            head.appendChild(script);
            log('Added Organization JSON-LD schema');
        }

        // Favicons (use array from your JSON; fallback to defaults)
        const faviconPaths = setup.general.favicons || [
            { rel: 'apple-touch-icon', sizes: '180x180', href: './img/icons/apple-touch-icon.png' },
            { rel: 'icon', type: 'image/png', sizes: '32x32', href: './img/icons/favicon-32x32.png' },
            { rel: 'icon', type: 'image/png', sizes: '16x16', href: './img/icons/favicon-16x16.png' },
            { rel: 'icon', type: 'image/x-icon', href: './img/icons/favicon.ico' }
        ];

        faviconPaths.forEach(favicon => {
            if (favicon.href && !favicon.href.includes('undefined') && !favicon.href.includes('...')) {  // Guard placeholders
                const link = document.createElement('link');
                link.rel = favicon.rel;
                link.href = favicon.href;
                if (favicon.sizes) link.sizes = favicon.sizes;
                if (favicon.type) link.type = favicon.type;
                head.appendChild(link);
                log(`Added favicon: ${favicon.href}`);
            } else {
                console.warn('Skipping invalid favicon entry:', favicon);
            }
        });

        // Snipcart (from your JSON, if e-commerce enabled)
        if (setup.general.include_e_commerce && setup.general.snipcart) {
            const snipcart = setup.general.snipcart;
            const script = document.createElement('script');
            script.id = 'snipcart';
            script.src = `https://cdn.snipcart.com/themes/v${snipcart.version}/default/snipcart.${snipcart.version}.js`;
            script.dataApiKey = snipcart.publicApiKey;
            script.dataConfigModalStyle = snipcart.modalStyle;
            script.dataConfigLoadStrategy = snipcart.loadStrategy;
            if (snipcart.templatesUrl) script.setAttribute('data-templates-url', snipcart.templatesUrl);
            head.appendChild(script);
            log('Added Snipcart script');
        }
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
            if (value !== undefined && value !== 'undefined' && value !== '') {
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
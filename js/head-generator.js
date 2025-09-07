// Debug mode toggle (set to false in production)
const DEBUG_MODE = true; // Set to true for debugging

// Centralized logging function with timestamp
function log(...args) {
    if (DEBUG_MODE) {
        const timestamp = new Date().toLocaleString('en-AU', { timeZone: 'Australia/Sydney', hour12: true, hour: '2-digit', minute: '2-digit' });
        console.log(`[HeadGenerator] ${timestamp}`, ...args);
    }
}

// Error logging function with timestamp
function logError(...args) {
    const timestamp = new Date().toLocaleString('en-AU', { timeZone: 'Australia/Sydney', hour12: true, hour: '2-digit', minute: '2-digit' });
    console.error(`[HeadGenerator] ${timestamp}`, ...args);
}

// Deep clone utility to avoid circular references
function deepClone(obj, seen = new WeakMap()) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (seen.has(obj)) return null; // Prevent circular refs
    seen.set(obj, true);
    if (Array.isArray(obj)) {
        return obj.map(item => deepClone(item, seen)).filter(item => item !== null);
    }
    const cloned = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = deepClone(obj[key], seen);
            if (value !== null) {
                cloned[key] = value;
            }
        }
    }
    return cloned;
}

// Load a script and return a promise that resolves when loaded
async function loadScript(src, type = 'module', defer = true) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.type = type;
        if (defer) script.defer = true;
        script.onload = () => {
            log(`Loaded script: ${src}`);
            resolve();
        };
        script.onerror = () => {
            logError(`Failed to load script: ${src}`);
            reject(new Error(`Failed to load script: ${src}`));
        };
        document.head.appendChild(script);
    });
}

// Manages the <head> section by adding meta tags, styles, scripts, and schema markup
async function manageHead(attributes = {}, config = {}) {
    log('manageHead called with attributes:', attributes);
    // Ensure <head> exists, creating one if necessary
    let head = document.head || document.createElement('head');
    if (!document.head) document.documentElement.prepend(head);

    // Add resource preloads (fonts, styles, etc.) from config
    if (config.fonts && Array.isArray(config.fonts)) {
        config.fonts.forEach(font => {
            if (!font.href) {
                logError('Invalid font preload config, missing href:', font);
                return;
            }
            // Check for existing preload to avoid duplicates
            if (!document.querySelector(`link[rel="preload"][href="${font.href}"]`)) {
                const link = document.createElement('link');
                link.rel = 'preload';
                link.href = font.href;
                link.as = font.as || 'font';
                if (font.type) link.type = font.type;
                if (font.crossorigin) link.crossOrigin = font.crossorigin;
                head.appendChild(link);
                log(`Added font preload: ${font.href}`);
            }
        });
    }

    // Optionally, add general preloads (e.g., JSON fetch, stylesheet)
    if (config.preloads && Array.isArray(config.preloads)) {
        config.preloads.forEach(preload => {
            if (!preload.href) {
                logError('Invalid preload config, missing href:', preload);
                return;
            }
            // Check for existing preload to avoid duplicates
            if (!document.querySelector(`link[href="${preload.href}"][rel="${preload.rel || 'preload'}"]`)) {
                const link = document.createElement('link');
                link.rel = preload.rel || 'preload';
                link.href = preload.href;
                link.as = preload.as;
                if (preload.crossorigin) link.crossOrigin = preload.crossorigin;
                head.appendChild(link);
                log(`Added preload: ${preload.href} as ${preload.as}`);
            }
        });
    }

    // Apply stylesheet (preload hints fetch, but this executes it)
    if (config.preloads) {
        const stylesheet = config.preloads.find(p => p.as === 'style');
        if (stylesheet && stylesheet.href) {
            if (!document.querySelector(`link[href="${stylesheet.href}"][rel="stylesheet"]`)) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = stylesheet.href;
                if (stylesheet.crossorigin) link.crossOrigin = stylesheet.crossorigin;
                head.appendChild(link);
                log(`Applied stylesheet: ${stylesheet.href}`);
            }
        } else {
            logError('No stylesheet found in config.preloads');
        }
    }

    // Add Font Awesome Kit script
    if (config.font_awesome?.kit_url) {
        if (!document.querySelector(`script[src="${config.font_awesome.kit_url}"]`)) {
            const script = document.createElement('script');
            script.src = config.font_awesome.kit_url;
            script.crossOrigin = 'anonymous';
            script.async = true;
            head.appendChild(script);
            log(`Added Font Awesome Kit script: ${config.font_awesome.kit_url}`);
        }
    } else {
        logError('No Font Awesome kit URL found in config.font_awesome.kit_url');
    }

    // Add essential meta tags
    if (!document.querySelector('meta[charset]')) {
        const metaCharset = document.createElement('meta');
        metaCharset.setAttribute('charset', 'UTF-8');
        head.appendChild(metaCharset);
        log('Added charset meta');
    }
    if (!document.querySelector('meta[name="viewport"]')) {
        const metaViewport = document.createElement('meta');
        metaViewport.name = 'viewport';
        metaViewport.content = 'width=device-width, initial-scale=1';
        head.appendChild(metaCharset);
        log('Added viewport meta');
    }
    if (!document.querySelector('meta[name="robots"]')) {
        const metaRobots = document.createElement('meta');
        metaRobots.name = 'robots';
        metaRobots.content = attributes.robots || config.general?.robots || 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
        head.appendChild(metaRobots);
        log('Added robots meta');
    }
    if (!document.querySelector('title')) {
        const title = document.createElement('title');
        title.textContent = attributes.title || 'Behive'; // Page-specific via <data-custom-head>
        head.appendChild(title);
        log('Added title');
    }
    if (!document.querySelector('meta[name="author"]')) {
        const metaAuthor = document.createElement('meta');
        metaAuthor.name = 'author';
        metaAuthor.content = attributes.author || config.general?.author || 'David Dufourq';
        head.appendChild(metaAuthor);
        log('Added author meta');
    }
    if (attributes.description && !document.querySelector('meta[name="description"]')) {
        const metaDesc = document.createElement('meta');
        metaDesc.name = 'description';
        metaDesc.content = attributes.description; // Page-specific via <data-custom-head>
        head.appendChild(metaDesc);
        log('Added description meta with content:', attributes.description);
    }
    if (attributes.keywords && !document.querySelector('meta[name="keywords"]')) {
        const metaKeywords = document.createElement('meta');
        metaKeywords.name = 'keywords';
        metaKeywords.content = attributes.keywords || ''; // Page-specific via <data-custom-head>
        head.appendChild(metaKeywords);
        log('Added keywords meta');
    }
    if (attributes.canonical && !document.querySelector('link[rel="canonical"]')) {
        const linkCanonical = document.createElement('link');
        linkCanonical.rel = 'canonical';
        linkCanonical.href = attributes.canonical || ''; // Page-specific via <data-custom-head>
        head.appendChild(linkCanonical);
        log('Added canonical link');
    }

    // Add theme-color meta tag
    const updateThemeColor = () => {
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');
        if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta');
            metaThemeColor.name = 'theme-color';
            head.appendChild(metaThemeColor);
        }
        const theme = document.documentElement.dataset.theme || document.body.dataset.theme;
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const isDark = theme ? theme === 'dark' : prefersDark;
        const lightColor = attributes['theme-color-light'] || config.general?.theme_colors?.light || '#ffffff';
        const darkColor = attributes['theme-color-dark'] || config.general?.theme_colors?.dark || '#000000';
        metaThemeColor.content = isDark ? darkColor : lightColor;
        log('Updated theme-color:', metaThemeColor.content);
    };
    updateThemeColor();
    const htmlObserver = new MutationObserver(updateThemeColor);
    htmlObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    const bodyObserver = new MutationObserver(updateThemeColor);
    bodyObserver.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateThemeColor);

    // Add Open Graph meta tags
    if (!document.querySelector('meta[property="og:locale"]')) {
        const ogLocale = document.createElement('meta');
        ogLocale.setAttribute('property', 'og:locale');
        ogLocale.setAttribute('content', attributes['og-locale'] || config.general?.og?.locale || 'en_AU');
        head.appendChild(ogLocale);
        log('Added og:locale meta');
    }
    if (!document.querySelector('meta[property="og:url"]')) {
        const ogUrl = document.createElement('meta');
        ogUrl.setAttribute('property', 'og:url');
        ogUrl.setAttribute('content', attributes['og-url'] || 'https://rainwilds.github.io/Sandbox/'); // Page-specific via <data-custom-head>
        head.appendChild(ogUrl);
        log('Added og:url meta');
    }
    if (!document.querySelector('meta[property="og:type"]')) {
        const ogType = document.createElement('meta');
        ogType.setAttribute('property', 'og:type');
        ogType.setAttribute('content', attributes['og-type'] || 'website'); // Page-specific via <data-custom-head>
        head.appendChild(ogType);
        log('Added og:type meta');
    }
    if (!document.querySelector('meta[property="og:title"]')) {
        const ogTitle = document.createElement('meta');
        ogTitle.setAttribute('property', 'og:title');
        ogTitle.setAttribute('content', attributes['og-title'] || attributes.title || 'Behive'); // Page-specific via <data-custom-head>
        head.appendChild(ogTitle);
        log('Added og:title meta');
    }
    if (!document.querySelector('meta[property="og:description"]')) {
        const ogDescription = document.createElement('meta');
        ogDescription.setAttribute('property', 'og:description');
        ogDescription.setAttribute('content', attributes['og-description'] || attributes.description || ''); // Page-specific via <data-custom-head>
        head.appendChild(ogDescription);
        log('Added og:description meta with content:', attributes['og-description'] || attributes.description);
    }
    if (!document.querySelector('meta[property="og:image"]')) {
        const ogImage = document.createElement('meta');
        ogImage.setAttribute('property', 'og:image');
        ogImage.setAttribute('content', attributes['og-image'] || 'https://rainwilds.github.io/Sandbox/img/preview.jpg'); // Page-specific via <data-custom-head>
        head.appendChild(ogImage);
        log('Added og:image meta');
    }
    if (!document.querySelector('meta[property="og:site_name"]')) {
        const ogSiteName = document.createElement('meta');
        ogSiteName.setAttribute('property', 'og:site_name');
        ogSiteName.setAttribute('content', attributes['og-site-name'] || config.general?.og?.site_name || 'Behive');
        head.appendChild(ogSiteName);
        log('Added og:site_name meta');
    }

    // Add X meta tags
    if (!document.querySelector('meta[name="x:card"]')) {
        const xCard = document.createElement('meta');
        xCard.setAttribute('name', 'x:card');
        xCard.setAttribute('content', attributes['x-card'] || config.general?.x?.card || 'summary_large_image');
        head.appendChild(xCard);
        log('Added x:card meta');
    }
    if (!document.querySelector('meta[property="x:domain"]')) {
        const xDomain = document.createElement('meta');
        xDomain.setAttribute('property', 'x:domain');
        xDomain.setAttribute('content', attributes['x-domain'] || config.general?.x?.domain || 'rainwilds.github.io');
        head.appendChild(xDomain);
        log('Added x:domain meta');
    }
    if (!document.querySelector('meta[property="x:url"]')) {
        const xUrl = document.createElement('meta');
        xUrl.setAttribute('property', 'x:url');
        xUrl.setAttribute('content', attributes['x-url'] || 'https://rainwilds.github.io/Sandbox/'); // Page-specific via <data-custom-head>
        head.appendChild(xUrl);
        log('Added x:url meta');
    }
    if (!document.querySelector('meta[name="x:title"]')) {
        const xTitle = document.createElement('meta');
        xTitle.setAttribute('name', 'x:title');
        xTitle.setAttribute('content', attributes['x-title'] || attributes.title || 'Behive'); // Page-specific via <data-custom-head>
        head.appendChild(xTitle);
        log('Added x:title meta');
    }
    if (!document.querySelector('meta[name="x:description"]')) {
        const xDescription = document.createElement('meta');
        xDescription.setAttribute('name', 'x:description');
        xDescription.setAttribute('content', attributes['x-description'] || attributes.description || ''); // Page-specific via <data-custom-head>
        head.appendChild(xDescription);
        log('Added x:description meta with content:', attributes['x-description'] || attributes.description);
    }
    if (!document.querySelector('meta[name="x:image"]')) {
        const xImage = document.createElement('meta');
        xImage.setAttribute('name', 'x:image');
        xImage.setAttribute('content', attributes['x-image'] || attributes['og-image'] || 'https://rainwilds.github.io/Sandbox/img/preview.jpg'); // Page-specific via <data-custom-head>
        head.appendChild(xImage);
        log('Added x:image meta');
    }

    // Add JSON-LD schema markup
    const schemaScript = document.createElement('script');
    schemaScript.type = 'application/ld+json';
    const schemas = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "WebSite",
                "@id": (attributes['schema-site-url'] || 'https://rainwilds.github.io/Sandbox/') + "#website", // Page-specific via <data-custom-head>
                "name": attributes['schema-site-name'] || attributes.title || config.business?.name || 'Behive Media',
                "url": attributes['schema-site-url'] || 'https://rainwilds.github.io/Sandbox/', // Page-specific via <data-custom-head>
                "description": attributes.description || config.business?.description || 'Behive Media offers professional photography, videography, and website services in Australia.',
                "inLanguage": attributes['og-locale'] || config.general?.og?.locale || 'en-AU',
                "publisher": { "@id": (attributes['business-url'] || config.business?.url || 'https://rainwilds.github.io/Sandbox/') + "#business" },
                "potentialAction": [
                    {
                        "@type": "SearchAction",
                        "target": {
                            "@type": "EntryPoint",
                            "urlTemplate": (attributes['schema-site-url'] || 'https://rainwilds.github.io/Sandbox/') + "?s={search_term_string}"
                        },
                        "query-input": {
                            "@type": "PropertyValueSpecification",
                            "valueRequired": true,
                            "valueName": "search_term_string"
                        }
                    }
                ]
            },
            {
                "@type": "LocalBusiness",
                "@id": (attributes['business-url'] || config.business?.url || 'https://rainwilds.github.io/Sandbox/') + "#business",
                "name": attributes['business-name'] || config.business?.name || 'Behive Media',
                "url": attributes['business-url'] || config.business?.url || 'https://rainwilds.github.io/Sandbox/',
                "telephone": attributes['business-telephone'] || config.business?.telephone || '+61-3-9876-5432',
                "address": {
                    "@type": "PostalAddress",
                    "streetAddress": attributes['business-address-street'] || config.business?.address?.streetAddress || '456 Creative Lane',
                    "addressLocality": attributes['business-address-locality'] || config.business?.address?.addressLocality || 'Melbourne',
                    "addressRegion": attributes['business-address-region'] || config.business?.address?.addressRegion || 'VIC',
                    "postalCode": attributes['business-address-postal'] || config.business?.address?.postalCode || '3000',
                    "addressCountry": attributes['business-address-country'] || config.business?.address?.addressCountry || 'AU'
                },
                "geo": {
                    "@type": "GeoCoordinates",
                    "latitude": attributes['business-geo-latitude'] || config.business?.geo?.latitude || -37.8136,
                    "longitude": attributes['business-geo-longitude'] || config.business?.geo?.longitude || 144.9631
                },
                "openingHours": attributes['business-opening-hours'] || config.business?.openingHours || 'Mo-Fr 09:00-18:00',
                "image": attributes['business-image'] || config.business?.image || 'https://rainwilds.github.io/Sandbox/img/logo.jpg',
                "logo": attributes['business-logo'] || config.business?.logo || 'https://rainwilds.github.io/Sandbox/img/logo.jpg',
                "sameAs": attributes['business-same-as']?.split(',') || config.business?.sameAs || [
                    'https://www.facebook.com/behivemedia',
                    'https://www.instagram.com/behivemedia'
                ]
            },
            {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {
                        "@type": "ListItem",
                        "position": 1,
                        "name": "Home",
                        "item": attributes['schema-site-url'] || 'https://rainwilds.github.io/Sandbox/' // Page-specific via <data-custom-head>
                    }
                ]
            }
        ]
    };
    try {
        schemaScript.textContent = JSON.stringify(deepClone(schemas));
        head.appendChild(schemaScript);
        log('Added JSON-LD schema');
    } catch (error) {
        logError('Failed to serialize JSON-LD schema:', error);
    }

    // Add favicon links for various devices
    const favicons = config.general?.favicons || [];
    if (favicons.length === 0) {
        logError('No favicons found in config.general.favicons');
    }
    favicons.forEach(favicon => {
        if (!favicon.href) {
            logError('Invalid favicon configuration, missing href:', favicon);
            return;
        }
        if (!document.querySelector(`link[href="${favicon.href}"]`)) {
            const link = document.createElement('link');
            link.rel = favicon.rel;
            link.href = favicon.href;
            if (favicon.sizes) link.sizes = favicon.sizes;
            if (favicon.type) link.type = favicon.type;
            head.appendChild(link);
            log(`Added favicon: ${favicon.href}`);
        }
    });

    // Initialize Snipcart if enabled
    if (attributes['include-e-commerce'] || config.general?.include_e_commerce) {
        log('Snipcart initialization triggered');
        if (!document.querySelector('script[data-snipcart]')) {
            const addSnipcartScripts = async () => {
                if (!document.body) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    return addSnipcartScripts();
                }
                if (!config.general?.snipcart) {
                    logError('No Snipcart configuration found in config.general.snipcart');
                    return;
                }
                const snipcartSettings = document.createElement('script');
                snipcartSettings.type = 'text/javascript';
                snipcartSettings.textContent = `
                    window.SnipcartSettings = {
                        publicApiKey: '${config.general.snipcart.publicApiKey}',
                        loadStrategy: '${config.general.snipcart.loadStrategy}',
                        version: '${config.general.snipcart.version}',
                        templatesUrl: '${config.general.snipcart.templatesUrl}',
                        modalStyle: '${config.general.snipcart.modalStyle}',
                    };
                `;
                document.body.appendChild(snipcartSettings);
                log('Added Snipcart settings');
                const snipcartScript = document.createElement('script');
                snipcartScript.dataset.snipcart = 'true';
                snipcartScript.type = 'text/javascript';
                snipcartScript.textContent = `
                    (() => {
                        var c, d;
                        (d = (c = window.SnipcartSettings).version) != null || (c.version = "${config.general.snipcart.version}");
                        var s, S;
                        (S = (s = window.SnipcartSettings).timeoutDuration) != null || (s.timeoutDuration = 2750);
                        var l, p;
                        (p = (l = window.SnipcartSettings).domain) != null || (l.domain = "cdn.snipcart.com");
                        var w, u;
                        (u = (w = window.SnipcartSettings).protocol) != null || (w.protocol = "https");
                        var f = window.SnipcartSettings.version.includes("v3.0.0-ci") || window.SnipcartSettings.version != "${config.general.snipcart.version}" && window.SnipcartSettings.version.localeCompare("3.4.0", void 0, { numeric: true, sensitivity: "base" }) === -1,
                            m = ["focus", "mouseover", "touchmove", "scroll", "keydown"];
                        window.LoadSnipcart = o;
                        document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", r) : r();
                        function r() {
                            window.SnipcartSettings.loadStrategy ? window.SnipcartSettings.loadStrategy === "on-user-interaction" && (m.forEach(t => document.addEventListener(t, o)), setTimeout(o, window.SnipcartSettings.timeoutDuration)) : o();
                        }
                        var a = false;
                        function o() {
                            if (a) return;
                            a = true;
                            let t = document.getElementsByTagName("head")[0],
                                e = document.querySelector("#snipcart"),
                                i = document.querySelector(\`src[src^="\${window.SnipcartSettings.protocol}://\${window.SnipcartSettings.domain}"][src$="snipcart.js"]\`),
                                n = document.querySelector(\`link[href^="\${window.SnipcartSettings.protocol}://\${window.SnipcartSettings.domain}"][href$="snipcart.css"]\`);
                            e || (e = document.createElement("div"), e.id = "snipcart", e.setAttribute("hidden", "true"), e.setAttribute("data-snipcart-debug", "true"), document.body.appendChild(e));
                            v(e);
                            i || (i = document.createElement("script"), i.src = \`\${window.SnipcartSettings.protocol}://\${window.SnipcartSettings.domain}/themes/v\${window.SnipcartSettings.version}/default/snipcart.js\`, i.async = true, t.appendChild(i));
                            n || (n = document.createElement("link"), n.rel = "stylesheet", n.type = "text/css", n.href = \`\${window.SnipcartSettings.protocol}://\${window.SnipcartSettings.domain}/themes/v\${window.SnipcartSettings.version}/default/snipcart.css\`, t.appendChild(n));
                            m.forEach(g => document.removeEventListener(g, o));
                        }
                        function v(t) {
                            if (!f) return;
                            t.dataset.apiKey = window.SnipcartSettings.publicApiKey;
                            window.SnipcartSettings.addProductBehavior && (t.dataset.configAddProductBehavior = window.SnipcartSettings.addProductBehavior);
                            window.SnipcartSettings.modalStyle && (t.dataset.configModalStyle = window.SnipcartSettings.modalStyle);
                            window.SnipcartSettings.currency && (t.dataset.currency = window.SnipcartSettings.currency);
                            window.SnipcartSettings.templatesUrl && (t.dataset.templatesUrl = window.SnipcartSettings.templatesUrl);
                        }
                    })();
                `;
                snipcartScript.onload = () => {
                    log('Added Snipcart script successfully');
                };
                snipcartScript.onerror = () => {
                    logError('Failed to add Snipcart script');
                };
                document.body.appendChild(snipcartScript);
                log('Added Snipcart script');
            };
            if (!document.querySelector('link[href="https://cdn.snipcart.com"]')) {
                const preconnect = document.createElement('link');
                preconnect.rel = 'preconnect';
                preconnect.href = 'https://cdn.snipcart.com';
                head.appendChild(preconnect);
                log('Added Snipcart preconnect');
            }
            await addSnipcartScripts();
        }
    }
}

// Initialize head management on DOM load
document.addEventListener('DOMContentLoaded', async () => {
    const dataHeads = document.querySelectorAll('data-custom-head');
    log('Found data-custom-head elements:', dataHeads.length);

    // Fetch setup.json
    let config = {};
    try {
        const response = await fetch('./JSON/setup.json');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status} - ${response.statusText}`);
        }
        config = await response.json();
        log('Loaded setup.json:', config);
    } catch (error) {
        logError('Failed to load setup.json:', error);
        document.body.innerHTML = '<div style="color: red; font-size: 2em; text-align: center;">Error: Failed to load configuration. Please check the console for details.</div>';
        throw error;
    }

    // Merge attributes from all <data-custom-head> elements
    const attributes = {};
    dataHeads.forEach(dataHead => {
        const newAttributes = {
            title: dataHead.dataset.title,
            description: dataHead.dataset.description,
            keywords: dataHead.dataset.keywords,
            author: dataHead.dataset.author,
            canonical: dataHead.dataset.canonical,
            robots: dataHead.dataset.robots,
            'og-title': dataHead.dataset.ogTitle,
            'og-description': dataHead.dataset.ogDescription,
            'og-image': dataHead.dataset.ogImage,
            'og-url': dataHead.dataset.ogUrl,
            'og-type': dataHead.dataset.ogType,
            'og-locale': dataHead.dataset.ogLocale,
            'og-site-name': dataHead.dataset.ogSiteName,
            'x-title': dataHead.dataset.xTitle,
            'x-description': dataHead.dataset.xDescription,
            'x-image': dataHead.dataset.xImage,
            'x-url': dataHead.dataset.xUrl,
            'x-domain': dataHead.dataset.xDomain,
            'x-card': dataHead.dataset.xCard,
            'business-name': dataHead.dataset.businessName,
            'business-url': dataHead.dataset.businessUrl,
            'business-telephone': dataHead.dataset.businessTelephone,
            'business-address-street': dataHead.dataset.businessAddressStreet,
            'business-address-locality': dataHead.dataset.businessAddressLocality,
            'business-address-region': dataHead.dataset.businessAddressRegion,
            'business-address-postal': dataHead.dataset.businessAddressPostal,
            'business-address-country': dataHead.dataset.businessAddressCountry,
            'business-opening-hours': dataHead.dataset.businessOpeningHours,
            'business-geo-latitude': dataHead.dataset.businessGeoLatitude,
            'business-geo-longitude': dataHead.dataset.businessGeoLongitude,
            'business-image': dataHead.dataset.businessImage,
            'business-logo': dataHead.dataset.businessLogo,
            'business-same-as': dataHead.dataset.businessSameAs,
            'schema-site-name': dataHead.dataset.schemaSiteName,
            'schema-site-url': dataHead.dataset.schemaSiteUrl,
            'product-name': dataHead.dataset.productName || null,
            'product-description': dataHead.dataset.productDescription || null,
            'product-image': dataHead.dataset.productImage || null,
            'product-url': dataHead.dataset.productUrl || null,
            'product-price-currency': dataHead.dataset.productPriceCurrency || null,
            'product-price': dataHead.dataset.productPrice || null,
            'product-availability': dataHead.dataset.productAvailability || null,
            'product-sku': dataHead.dataset.productSku || null,
            'product-brand': dataHead.dataset.productBrand || null,
            'collection-name': dataHead.dataset.collectionName || null,
            'collection-description': dataHead.dataset.collectionDescription || null,
            products: dataHead.dataset.products || null,
            'theme-color-light': dataHead.dataset.themeColorLight,
            'theme-color-dark': dataHead.dataset.themeColorDark,
            'include-e-commerce': dataHead.hasAttribute('data-include-e-commerce') || attributes['include-e-commerce'],
            components: dataHead.dataset.components || attributes.components
        };
        Object.keys(newAttributes).forEach(key => {
            if (newAttributes[key] !== undefined && newAttributes[key] !== '') {
                attributes[key] = newAttributes[key];
            }
        });
    });
    log('Merged attributes:', attributes);

    // Remove all <data-custom-head> elements
    dataHeads.forEach(dataHead => {
        if (dataHead.parentNode) {
            dataHead.parentNode.removeChild(dataHead);
            log('Removed data-custom-head element');
        }
    });

    // Load components using await import
    if (attributes.components) {
        const componentList = attributes.components.split(' ').filter(Boolean);
        for (const component of componentList) {
            const scriptPath = `./components/${component}.js`;
            try {
                const module = await import(scriptPath);
                log(`Loaded module: ${scriptPath} at 03:07 PM AEST, September 07, 2025`);
            } catch (error) {
                logError(`Failed to load module: ${scriptPath}`, error);
            }
        }
    }

    // Pass merged attributes and config to manageHead
    await manageHead(attributes, config);
});
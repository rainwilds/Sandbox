(async () => {
    console.log('[HeadGenerator] Initializing');

    const dataHeadElements = document.querySelectorAll('data-bh-head');
    console.log(`[HeadGenerator] Found data-bh-head elements: ${dataHeadElements.length}`);
    if (dataHeadElements.length === 0) return;

    const dataHead = dataHeadElements[0];
    const attributes = {
        title: dataHead.getAttribute('data-title') || '',
        description: dataHead.getAttribute('data-description') || '',
        author: dataHead.getAttribute('data-author') || '',
        canonical: dataHead.getAttribute('data-canonical') || '',
        robots: dataHead.getAttribute('data-robots') || '',
        components: dataHead.getAttribute('data-components')?.split(' ').filter(c => c) || []
    };

    try {
        const response = await fetch('./business-info.json');
        const businessInfo = await response.json();
        console.log('[HeadGenerator] Loaded business-info.json:', businessInfo);
        Object.assign(attributes, businessInfo);
    } catch (error) {
        console.error('[HeadGenerator] Failed to load business-info.json:', error);
    }

    console.log('[HeadGenerator] Merged attributes:', attributes);

    dataHead.remove();
    console.log('[HeadGenerator] Removed data-bh-head element');

    for (const component of attributes.components) {
        const scriptPath = `./js/components/${component}.js`;
        try {
            const module = await import(scriptPath);
            console.log(`[HeadGenerator] Loaded script: ${scriptPath}`);
        } catch (error) {
            console.error(`[HeadGenerator] Failed to load script: ${scriptPath}`, error);
        }
    }

    const manageHead = () => {
        console.log('[HeadGenerator] manageHead called with attributes:', attributes);

        const fontAwesomeScript = document.createElement('script');
        fontAwesomeScript.src = 'https://kit.fontawesome.com/85d1e578b1.js';
        fontAwesomeScript.crossOrigin = 'anonymous';
        document.head.appendChild(fontAwesomeScript);
        console.log('[HeadGenerator] Added Font Awesome Kit script');

        const styleLink = document.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.href = './styles.css';
        document.head.appendChild(styleLink);
        console.log('[HeadGenerator] Added stylesheet: ./styles.css');

        const fonts = [
            './Sandbox/fonts/acumin_pro_bold.woff2',
            './Sandbox/fonts/futura_pt_book.woff2'
        ];
        fonts.forEach(font => {
            const preloadLink = document.createElement('link');
            preloadLink.rel = 'preload';
            preloadLink.href = font;
            preloadLink.as = 'font';
            preloadLink.type = 'font/woff2';
            preloadLink.crossOrigin = 'anonymous';
            document.head.appendChild(preloadLink);
            console.log(`[HeadGenerator] Added font preload: ${font}`);
        });

        const favicons = [
            { href: './Sandbox/img/icons/apple-touch-icon.png', rel: 'apple-touch-icon', sizes: '180x180' },
            { href: './Sandbox/img/icons/favicon-32x32.png', rel: 'icon', type: 'image/png', sizes: '32x32' },
            { href: './Sandbox/img/icons/favicon-16x16.png', rel: 'icon', type: 'image/png', sizes: '16x16' },
            { href: './Sandbox/img/icons/favicon.ico', rel: 'icon', type: 'image/x-icon' }
        ];
        favicons.forEach(favicon => {
            const link = document.createElement('link');
            link.rel = favicon.rel;
            link.href = favicon.href;
            if (favicon.sizes) link.sizes = favicon.sizes;
            if (favicon.type) link.type = favicon.type;
            document.head.appendChild(link);
            console.log(`[HeadGenerator] Added favicon: ${favicon.href}`);
        });

        if (attributes.robots) {
            const robotsMeta = document.createElement('meta');
            robotsMeta.name = 'robots';
            robotsMeta.content = attributes.robots;
            document.head.appendChild(robotsMeta);
            console.log('[HeadGenerator] Added robots meta');
        }

        if (attributes.title) {
            document.title = attributes.title;
            console.log('[HeadGenerator] Added title');
        }

        if (attributes.author) {
            const authorMeta = document.createElement('meta');
            authorMeta.name = 'author';
            authorMeta.content = attributes.author;
            document.head.appendChild(authorMeta);
            console.log('[HeadGenerator] Added author meta');
        }

        if (attributes.description) {
            const descMeta = document.createElement('meta');
            descMeta.name = 'description';
            descMeta.content = attributes.description;
            document.head.appendChild(descMeta);
            console.log(`[HeadGenerator] Added description meta with content: ${attributes.description}`);
        }

        if (attributes.canonical) {
            const canonicalLink = document.createElement('link');
            canonicalLink.rel = 'canonical';
            canonicalLink.href = attributes.canonical;
            document.head.appendChild(canonicalLink);
            console.log('[HeadGenerator] Added canonical link');
        }

        // Add other meta tags (og, twitter, etc.) and JSON-LD
        // ... (simplified for brevity)
    };

    manageHead();
})();
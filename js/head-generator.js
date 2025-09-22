/* global document, window, console, fetch, Promise, requestIdleCallback */
(async () => {
    // ... logging functions unchanged ...

    // Default setup configuration (unchanged)
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
        font_awesome: { kitUrl: 'https://kit.fontawesome.com/85d1e578b1.js' },
        media: {
            responsive_images: {
                directory_path: '/img/responsive/'  // ← Changed fallback to match your structure
            }
        }
    };

    // Global config cache (accessible by other modules)
    window.__SETUP_CONFIG__ = null;

    // Function to load setup.json using relative path from /js/ directory
    async function loadSetup() {
        // Check if we already have the config cached
        if (window.__SETUP_CONFIG__) {
            log('Using cached setup.json from global');
            return window.__SETUP_CONFIG__;
        }

        // Relative path from /js/ to /JSON/setup.json
        const setupPath = '../JSON/setup.json';

        // Try to use the preloaded resource first
        const preloadLink = document.querySelector(`link[rel="preload"][href="${setupPath}"]`);
        if (preloadLink) {
            try {
                const response = await fetch(setupPath, { 
                    cache: 'only-if-cached',
                    mode: 'same-origin'
                });
                
                if (response.ok) {
                    const jsonText = await response.text();
                    const setup = JSON.parse(jsonText);
                    
                    const mergedSetup = {
                        ...defaultSetup,
                        ...setup,
                        general: { ...defaultSetup.general, ...setup.general },
                        business: { ...defaultSetup.business, ...setup.business },
                        media: { ...defaultSetup.media, ...(setup.media || {}) }
                    };
                    
                    window.__SETUP_CONFIG__ = mergedSetup;
                    log('Loaded setup.json from preload', { 
                        path: setupPath,
                        keys: Object.keys(mergedSetup),
                        responsivePath: mergedSetup.media?.responsive_images?.directory_path 
                    });
                    return mergedSetup;
                }
            } catch (preloadError) {
                if (isDev) warn('Preloaded setup.json failed, falling back to regular fetch', { 
                    path: setupPath, 
                    error: preloadError.message 
                });
            }
        }

        // Fallback to regular fetch with relative path
        try {
            log(`Fetching setup.json from: ${setupPath}`);
            const response = await fetch(setupPath, { cache: 'force-cache' });
            if (!response.ok) throw new Error(`HTTP ${response.status}: ${setupPath}`);
            
            const jsonText = await response.text();
            const setup = JSON.parse(jsonText);
            
            const mergedSetup = {
                ...defaultSetup,
                ...setup,
                general: { ...defaultSetup.general, ...setup.general },
                business: { ...defaultSetup.business, ...setup.business },
                media: { ...defaultSetup.media, ...(setup.media || {}) }
            };
            
            window.__SETUP_CONFIG__ = mergedSetup;
            log('Loaded setup.json (fallback)', { 
                path: setupPath,
                keys: Object.keys(mergedSetup),
                responsivePath: mergedSetup.media?.responsive_images?.directory_path 
            });
            return mergedSetup;
        } catch (err) {
            error('Failed to load setup.json', { 
                path: setupPath,
                error: err.message 
            });
            
            window.__SETUP_CONFIG__ = defaultSetup;
            log('Using default setup configuration');
            return defaultSetup;
        }
    }

    // ... rest of the functions unchanged (loadModule, loadComponentWithDependencies, etc.) ...

    // Function to create and append DOM elements asynchronously (unchanged)
    async function updateHead(attributes) {
        // ... unchanged ...
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

        // Load components selectively based on data-components
        if (attributes.components) {
            await loadComponents(attributes.components);
        }

        // Update head
        await updateHead(attributes);

        // Remove data-custom-head element
        customHead.remove();
        log('Removed data-custom-head element');
        
        // Log completion
        log('HeadGenerator completed successfully');
    } catch (err) {
        error('Error in HeadGenerator', { error: err.message, stack: err.stack });
    }
})();
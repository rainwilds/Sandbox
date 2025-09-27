(async () => {
    // Browser-compatible dev detection
    // Checks if the current URL contains '/dev/' or has '?debug=true' in the query string.
    // Enables debug mode for logging without impacting production.
    const isDev = window.location.href.includes('/dev/') ||
      new URLSearchParams(window.location.search).get('debug') === 'true';

    // Debug logging utility
    // Define a logging function that only outputs in debug mode.
    // Uses console.groupCollapsed for organized, collapsible output with color styling.
    // Includes a timestamp, message, optional data, and a stack trace.
    const log = (message, data = null) => {
        if (isDev) {
            console.groupCollapsed(`%c[CustomLogo] ${new Date().toLocaleTimeString()} ${message}`, 'color: #2196F3; font-weight: bold;');
            if (data) {
                console.log('%cData:', 'color: #4CAF50;', data);
            }
            console.trace();
            console.groupEnd();
        }
    };

    // Warning logging utility
    // Similar to log, but with yellow styling and a warning emoji for non-critical issues.
    const warn = (message, data = null) => {
        if (isDev) {
            console.groupCollapsed(`%c[CustomLogo] ⚠️ ${new Date().toLocaleTimeString()} ${message}`, 'color: #FF9800; font-weight: bold;');
            if (data) {
                console.log('%cData:', 'color: #4CAF50;', data);
            }
            console.trace();
            console.groupEnd();
        }
    };

    // Error logging utility
    // Similar to log, but with red styling and an error emoji for critical failures.
    const error = (message, data = null) => {
        if (isDev) {
            console.groupCollapsed(`%c[CustomLogo] ❌ ${new Date().toLocaleTimeString()} ${message}`, 'color: #F44336; font-weight: bold;');
            if (data) {
                console.log('%cData:', 'color: #4CAF50;', data);
            }
            console.trace();
            console.groupEnd();
        }
    };

    try {
        // Asynchronously import required dependencies using dynamic imports for better tree-shaking and loading.
        const { generatePictureMarkup } = await import('../image-generator.js');
        const { VALID_ALIGNMENTS, VALID_ALIGN_MAP } = await import('../shared.js');
        log('Successfully imported generatePictureMarkup and VALID_ALIGN_MAP');

        // Define the CustomLogo web component class.
        // Extends HTMLElement for custom element creation.
        class CustomLogo extends HTMLElement {
            // Observed attributes for reactivity.
            // Triggers attributeChangedCallback on changes.
            static get observedAttributes() {
                return [
                    'logo-full-primary-src',
                    'logo-full-light-src',
                    'logo-full-dark-src',
                    'logo-full-primary-alt',
                    'logo-full-light-alt',
                    'logo-full-dark-alt',
                    'logo-full-position',
                    'logo-icon-primary-src',
                    'logo-icon-light-src',
                    'logo-icon-dark-src',
                    'logo-icon-primary-alt',
                    'logo-icon-light-alt',
                    'logo-icon-dark-alt',
                    'logo-icon-position',
                    'logo-breakpoint',
                    'logo-height'
                ];
            }

            // Constructor: Bind methods for event handlers.
            constructor() {
                super();
                log('Constructor called');
                this.handleThemeChange = this.handleThemeChange.bind(this);
                this.handleResize = this.debouncedHandleResize.bind(this);
                this.handleMutation = this.handleMutation.bind(this);
                this._cachedAttrs = null;
            }

            // Utility to debounce resize events for performance (prevents excessive re-renders).
            debouncedHandleResize() {
                if (this._resizeTimeout) clearTimeout(this._resizeTimeout);
                this._resizeTimeout = setTimeout(async () => {
                    log('Debounced window resize detected');
                    if (this.isConnected) {
                        await this.render();
                    }
                }, 150); // 150ms debounce.
            }

            // Collect and validate attributes with caching for performance.
            // Includes strict validation for sources, alts, positions, breakpoint, and height.
            // Allows flexible breakpoints (any positive integer > 0).
            getAttributes() {
                if (this._cachedAttrs) {
                    log('Using cached attributes');
                    return this._cachedAttrs;
                }
                log('Parsing new attributes');
                const attrs = {
                    fullPrimarySrc: this.getAttribute('logo-full-primary-src') || '',
                    fullLightSrc: this.getAttribute('logo-full-light-src') || '',
                    fullDarkSrc: this.getAttribute('logo-full-dark-src') || '',
                    fullPrimaryAlt: this.getAttribute('logo-full-primary-alt') || '',
                    fullLightAlt: this.getAttribute('logo-full-light-alt') || '',
                    fullDarkAlt: this.getAttribute('logo-full-dark-alt') || '',
                    fullPosition: this.getAttribute('logo-full-position') || '',
                    iconPrimarySrc: this.getAttribute('logo-icon-primary-src') || '',
                    iconLightSrc: this.getAttribute('logo-icon-light-src') || '',
                    iconDarkSrc: this.getAttribute('logo-icon-dark-src') || '',
                    iconPrimaryAlt: this.getAttribute('logo-icon-primary-alt') || '',
                    iconLightAlt: this.getAttribute('logo-icon-light-alt') || '',
                    iconDarkAlt: this.getAttribute('logo-icon-dark-alt') || '',
                    iconPosition: this.getAttribute('logo-icon-position') || '',
                    breakpoint: this.getAttribute('logo-breakpoint') || '',
                    height: this.getAttribute('logo-height') || ''
                };

                // Validate sources: Require at least one valid full or icon set.
                const hasFullSource = attrs.fullPrimarySrc || (attrs.fullLightSrc && attrs.fullDarkSrc);
                const hasIconSource = attrs.iconPrimarySrc || (attrs.iconLightSrc && attrs.iconDarkSrc);
                if (!hasFullSource && !hasIconSource) {
                    error('At least one valid logo source (full or icon) must be provided.');
                    return attrs;
                }

                // Validate light/dark pairs.
                const validatePair = (light, dark, label) => {
                    if ((light || dark) && !(light && dark)) {
                        error(`Both ${label}-light-src and ${label}-dark-src must be provided if one is specified.`);
                        return false;
                    }
                    return true;
                };
                if (!validatePair(attrs.fullLightSrc, attrs.fullDarkSrc, 'logo-full') ||
                    !validatePair(attrs.iconLightSrc, attrs.iconDarkSrc, 'logo-icon')) {
                    return attrs;
                }

                // Validate alt texts for accessibility and SEO.
                attrs.isDecorative = !attrs.fullPrimaryAlt && !attrs.fullLightAlt && !attrs.fullDarkAlt &&
                                     !attrs.iconPrimaryAlt && !attrs.iconLightAlt && !attrs.iconDarkAlt;
                if (!attrs.isDecorative) {
                    if (attrs.fullPrimarySrc && !attrs.fullPrimaryAlt) {
                        error('logo-full-primary-alt is required for accessibility when logo-full-primary-src is provided.');
                    }
                    if (attrs.iconPrimarySrc && !attrs.iconPrimaryAlt) {
                        error('logo-icon-primary-alt is required for accessibility when logo-icon-primary-src is provided.');
                    }
                    if (attrs.fullLightSrc && attrs.fullDarkSrc && !(attrs.fullLightAlt && attrs.fullDarkAlt)) {
                        error('Both logo-full-light-alt and logo-full-dark-alt are required for accessibility.');
                    }
                    if (attrs.iconLightSrc && attrs.iconDarkSrc && !(attrs.iconLightAlt && attrs.iconDarkAlt)) {
                        error('Both logo-icon-light-alt and logo-icon-dark-alt are required for accessibility.');
                    }
                }

                // Validate height: Support modern units, ignore invalid.
                if (attrs.height) {
                    const validLength = attrs.height.match(/^(\d*\.?\d+)(px|rem|em|vh|vw|%)$/);
                    if (!validLength) {
                        warn(`Invalid logo-height "${attrs.height}". Ignoring.`);
                        attrs.height = '';
                    }
                }

                // Validate positions using predefined map.
                if (attrs.fullPosition && !VALID_ALIGNMENTS.includes(attrs.fullPosition)) {
                    warn(`Invalid logo-full-position "${attrs.fullPosition}". Ignoring.`);
                    attrs.fullPosition = '';
                }
                if (attrs.iconPosition && !VALID_ALIGNMENTS.includes(attrs.iconPosition)) {
                    warn(`Invalid logo-icon-position "${attrs.iconPosition}". Ignoring.`);
                    attrs.iconPosition = '';
                }

                // Validate breakpoint: Any positive integer for flexibility.
                const breakpointNum = parseInt(attrs.breakpoint, 10);
                if (attrs.breakpoint && (isNaN(breakpointNum) || breakpointNum <= 0)) {
                    warn(`Invalid logo-breakpoint "${attrs.breakpoint}". Must be a positive integer. Ignoring.`);
                    attrs.breakpoint = '';
                }

                this._cachedAttrs = { ...attrs };
                log('Attributes parsed successfully', attrs);
                return attrs;
            }

            // Render method: Generate markup efficiently.
            // Handles positions, breakpoints, heights; falls back to placeholder on error.
            // Updates light DOM directly without Shadow DOM.
            async render() {
                log('Starting render');
                const attrs = this.getAttributes();
                this.innerHTML = ''; // Clear previous content efficiently.

                const hasValidSource = attrs.fullPrimarySrc || attrs.fullLightSrc || attrs.fullDarkSrc ||
                                       attrs.iconPrimarySrc || attrs.iconLightSrc || attrs.iconDarkSrc;
                if (!hasValidSource) {
                    warn('No valid logo sources provided, rendering placeholder.');
                    this.innerHTML = `
                        <div class="logo-container place-self-center">
                            <a href="/"><img src="https://placehold.co/300x40" alt="No logo sources provided" loading="lazy"></a>
                        </div>
                    `;
                    return;
                }

                let positionClass = attrs.fullPosition ? VALID_ALIGN_MAP[attrs.fullPosition] : 'place-self-center';
                let styleTag = '';
                const hasBreakpoint = attrs.breakpoint;
                const hasIconSource = attrs.iconPrimarySrc || (attrs.iconLightSrc && attrs.iconDarkSrc);
                const hasFullSource = attrs.fullPrimarySrc || (attrs.fullLightSrc && attrs.fullDarkSrc);

                if (hasBreakpoint && hasIconSource && hasFullSource) {
                    styleTag = `
                        <style>
                            @media (max-width: ${parseInt(attrs.breakpoint, 10) - 1}px) {
                                .logo-container {
                                    ${attrs.iconPosition ? `place-self: ${attrs.iconPosition.replace(/-/g, ' ')} !important;` : ''}
                                }
                            }
                        </style>
                    `;
                }

                const extraStyles = attrs.height ? `height: ${attrs.height};` : '';
                try {
                    const logoMarkup = await generatePictureMarkup({
                        src: attrs.fullPrimarySrc,
                        lightSrc: attrs.fullLightSrc,
                        darkSrc: attrs.fullDarkSrc,
                        alt: attrs.fullPrimaryAlt || attrs.fullLightAlt || attrs.fullDarkAlt,
                        lightAlt: attrs.fullLightAlt,
                        darkAlt: attrs.fullDarkAlt,
                        iconSrc: attrs.iconPrimarySrc,
                        iconLightSrc: attrs.iconLightSrc,
                        iconDarkSrc: attrs.iconDarkSrc,
                        iconAlt: attrs.iconPrimaryAlt || attrs.iconLightAlt || attrs.iconDarkAlt,
                        iconLightAlt: attrs.iconLightAlt,
                        iconDarkAlt: attrs.iconDarkAlt,
                        isDecorative: attrs.isDecorative,
                        customClasses: '',
                        loading: 'lazy',
                        fetchPriority: 'high', // Prioritize logo for LCP optimization.
                        extraClasses: [],
                        breakpoint: attrs.breakpoint,
                        extraStyles,
                        noResponsive: attrs.fullPrimarySrc.endsWith('.svg') || attrs.fullLightSrc.endsWith('.svg') || attrs.iconPrimarySrc.endsWith('.svg')
                    });
                    log('Logo markup generated', { markupPreview: logoMarkup.substring(0, 200) + '...' });

                    this.innerHTML = `
                        ${styleTag}
                        <div class="logo-container ${positionClass}">
                            <a href="/">${logoMarkup}</a>
                        </div>
                    `;
                    log('CustomLogo rendered successfully');
                } catch (err) {
                    error('Error generating logo markup', { error: err.message, attrs });
                    this.innerHTML = `
                        ${styleTag}
                        <div class="logo-container ${positionClass}">
                            <a href="/"><img src="https://placehold.co/300x40" alt="Error loading logo" loading="lazy"></a>
                        </div>
                    `;
                }
            }

            // Handle theme changes: Re-render only if connected.
            async handleThemeChange(event) {
                log('Theme change detected', { matchesDark: event.matches });
                if (this.isConnected) {
                    await this.render();
                }
            }

            // Mutation handler: Efficiently update src based on media queries.
            // Queries light DOM directly.
            handleMutation(mutations) {
                log('Mutation observed', { mutationCount: mutations.length });
                mutations.forEach(mutation => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'src') {
                        const img = mutation.target;
                        const picture = this.querySelector('picture');
                        if (!picture) return;
                        const sources = picture.querySelectorAll('source');
                        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                        const attrs = this.getAttributes();
                        const breakpoint = parseInt(attrs.breakpoint, 10);
                        const isBelowBreakpoint = breakpoint && window.matchMedia(`(max-width: ${breakpoint - 1}px)`).matches;
                        let selectedSrc = prefersDark ? (attrs.fullDarkSrc || attrs.iconDarkSrc) : (attrs.fullLightSrc || attrs.iconLightSrc);
                        let matchedMedia = 'none';
                        sources.forEach(source => {
                            const media = source.getAttribute('media');
                            if (media && window.matchMedia(media).matches) {
                                selectedSrc = source.getAttribute('srcset');
                                matchedMedia = media;
                            }
                        });
                        if (img.src !== selectedSrc && selectedSrc) {
                            log('Updating logo src', { selectedSrc, matchedMedia, prefersDark });
                            img.src = selectedSrc;
                        }
                    }
                });
            }

            // connectedCallback: Setup listeners and initial render.
            // Uses ResizeObserver for efficiency.
            async connectedCallback() {
                log('Connected to DOM');
                await this.render();
                const prefersDarkQuery = window.matchMedia('(prefers-color-scheme: dark)');
                prefersDarkQuery.addEventListener('change', this.handleThemeChange);
                this._prefersDarkQuery = prefersDarkQuery; // Store for cleanup.

                const resizeObserver = new ResizeObserver(this.handleResize);
                resizeObserver.observe(document.body);
                this.resizeObserver = resizeObserver;

                const img = this.querySelector('img');
                if (img) {
                    const mutationObserver = new MutationObserver(this.handleMutation);
                    mutationObserver.observe(img, { attributes: true, attributeFilter: ['src'] });
                    this.mutationObserver = mutationObserver;
                }
            }

            // disconnectedCallback: Clean up to prevent memory leaks.
            disconnectedCallback() {
                log('Disconnected from DOM');
                if (this.resizeObserver) {
                    this.resizeObserver.disconnect();
                    this.resizeObserver = null;
                }
                if (this.mutationObserver) {
                    this.mutationObserver.disconnect();
                    this.mutationObserver = null;
                }
                if (this._prefersDarkQuery) {
                    this._prefersDarkQuery.removeEventListener('change', this.handleThemeChange);
                    this._prefersDarkQuery = null;
                }
            }

            // attributeChangedCallback: Invalidate cache and re-render if connected.
            async attributeChangedCallback() {
                log('Attribute changed');
                if (this.isConnected) {
                    this._cachedAttrs = null;
                    await this.render();
                }
            }
        }

        // Define custom element if not already defined.
        // Upgrade existing elements for compliance.
        if (!customElements.get('custom-logo')) {
            customElements.define('custom-logo', CustomLogo);
            log('CustomLogo defined successfully');
        }
        document.querySelectorAll('custom-logo').forEach(element => {
            customElements.upgrade(element);
            log('Upgraded existing custom-logo element');
        });
    } catch (err) {
        error('Failed to import dependencies or define CustomLogo', { error: err.message });
    }
})();
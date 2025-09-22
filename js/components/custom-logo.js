(async () => {
    // Browser-compatible dev detection
    // This checks if the current URL contains '/dev/' or has '?debug=true' in the query string.
    // Enables debug mode for logging without impacting production environments.
    const isDev = window.location.href.includes('/dev/') ||
      new URLSearchParams(window.location.search).get('debug') === 'true';

    // Debug logging VALID_ALIGN_MAP
    // Define a logging function that only outputs in debug mode.
    // Uses console.groupCollapsed for organized, collapsible output with color styling.
    // Includes a timestamp, message, optional data, and a stack trace for easy debugging.
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

    // Define a warning logging function similar to log, but with yellow styling and a warning emoji.
    // Used for non-critical issues like invalid attributes or missing required values.
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

    // Define an error logging function with red styling and an error emoji.
    // Used for critical failures like missing sources or markup generation errors.
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
        // Asynchronously import required dependencies.
        // generatePictureMarkup from image-generator.js for creating responsive logo images.
        // VALID_ALIGNMENTS and VALID_ALIGN_MAP from shared.js for validating and mapping alignment positions.
        const { generatePictureMarkup } = await import('../image-generator.js');
        const { VALID_ALIGNMENTS, VALID_ALIGN_MAP } = await import('../shared.js');
        log('Successfully imported generatePictureMarkup and VALID_ALIGN_MAP');

        // Define the CustomLogo web component class.
        // Extends HTMLElement to create a custom element for responsive logos with light/dark variants and breakpoints.
        class CustomLogo extends HTMLElement {
            // Specify attributes to observe for changes.
            // When any of these change, attributeChangedCallback is triggered to re-render.
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

            // Constructor for initializing the component.
            // Binds event handlers and sets up private cached attributes variable.
            constructor() {
                super();
                log('Constructor called');
                this.handleThemeChange = this.handleThemeChange.bind(this);
                this.handleResize = this.handleResize.bind(this);
                this.handleMutation = this.handleMutation.bind(this);
                this._cachedAttrs = null;
            }

            // Collect and validate all observed attributes.
            // Caches results for performance; includes extensive validation for sources, alts, positions, and sizes.
            // Returns an object with sanitized and defaulted attribute values.
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

                const hasFullSource = attrs.fullPrimarySrc || (attrs.fullLightSrc && attrs.fullDarkSrc);
                const hasIconSource = attrs.iconPrimarySrc || (attrs.iconLightSrc && attrs.iconDarkSrc);
                if (!hasFullSource && !hasIconSource) {
                    error('At least one valid logo source (full or icon) must be provided.');
                    return attrs;
                }

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

                if (!attrs.fullPrimaryAlt && !attrs.fullLightAlt && !attrs.fullDarkAlt &&
                    !attrs.iconPrimaryAlt && !attrs.iconLightAlt && !attrs.iconDarkAlt) {
                    attrs.isDecorative = true;
                } else {
                    if (attrs.fullPrimarySrc && !attrs.fullPrimaryAlt) {
                        error('logo-full-primary-alt is required when logo-full-primary-src is provided.');
                    }
                    if (attrs.iconPrimarySrc && !attrs.iconPrimaryAlt) {
                        error('logo-icon-primary-alt is required when logo-icon-primary-src is provided.');
                    }
                    if (attrs.fullLightSrc && attrs.fullDarkSrc && !(attrs.fullLightAlt && attrs.fullDarkAlt)) {
                        error('Both logo-full-light-alt and logo-full-dark-alt are required.');
                    }
                    if (attrs.iconLightSrc && attrs.iconDarkSrc && !(attrs.iconLightAlt && attrs.iconDarkAlt)) {
                        error('Both logo-icon-light-alt and logo-icon-dark-alt are required.');
                    }
                }

                if (attrs.height) {
                    const validLength = attrs.height.match(/^(\d*\.?\d+)(px|rem|em|vh|vw)$/);
                    if (!validLength) {
                        warn(`Invalid logo-height "${attrs.height}". Ignoring.`);
                        attrs.height = '';
                    }
                }

                if (attrs.fullPosition && !VALID_ALIGNMENTS.includes(attrs.fullPosition)) {
                    warn(`Invalid logo-full-position "${attrs.fullPosition}". Ignoring.`);
                    attrs.fullPosition = '';
                }
                if (attrs.iconPosition && !VALID_ALIGNMENTS.includes(attrs.iconPosition)) {
                    warn(`Invalid logo-icon-position "${attrs.iconPosition}". Ignoring.`);
                    attrs.iconPosition = '';
                }

                this._cachedAttrs = { ...attrs };
                log('Attributes parsed successfully', attrs);
                return attrs;
            }

            // Render the logo HTML using generatePictureMarkup.
            // Handles full/icon variants, breakpoints, positions, and heights.
            // Falls back to placeholder if generation fails.
            async render() {
                log('Starting render');
                const attrs = this.getAttributes();
                let logoHTML = '';
                const hasValidSource = attrs.fullPrimarySrc || attrs.fullLightSrc || attrs.fullDarkSrc ||
                                      attrs.iconPrimarySrc || attrs.iconLightSrc || attrs.iconDarkSrc;
                if (hasValidSource) {
                    let positionClass = attrs.fullPosition ? VALID_ALIGN_MAP[attrs.fullPosition] : 'place-self-center';
                    let styleTag = '';
                    const hasBreakpoint = attrs.breakpoint && [768, 1024, 1366, 1920, 2560].includes(parseInt(attrs.breakpoint, 10));
                    const hasIconSource = attrs.iconPrimarySrc || (attrs.iconLightSrc && attrs.iconDarkSrc);
                    const hasFullSource = attrs.fullPrimarySrc || (attrs.fullLightSrc && attrs.fullDarkSrc);

                    if (hasBreakpoint && hasIconSource && hasFullSource) {
                        styleTag = `
                            <style>
                                @media (max-width: ${parseInt(attrs.breakpoint, 10) - 1}px) {
                                    .place-self-center {
                                        ${attrs.iconPosition ? `place-self: ${attrs.iconPosition.replace(/-/g, ' ')} !important;` : ''}
                                    }
                                }
                            </style>
                        `;
                    }

                    const extraStyles = attrs.height ? `height: ${attrs.height}` : '';
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
                            isDecorative: attrs.isDecorative || false,
                            customClasses: '',
                            loading: 'lazy',
                            fetchPriority: '',
                            extraClasses: [],
                            breakpoint: attrs.breakpoint,
                            extraStyles: extraStyles,
                            noResponsive: attrs.fullLightSrc.includes('.svg') // Skip responsive for SVGs
                        });
                        log('Logo markup generated', { markupPreview: logoMarkup.substring(0, 200) + '...' });
                        logoHTML = `
                            ${styleTag}
                            <div class="${positionClass}">
                                <a href="/">${logoMarkup}</a>
                            </div>
                        `;
                        log('CustomLogo rendered successfully');
                    } catch (err) {
                        error('Error generating logo markup', { error: err.message, attrs });
                        logoHTML = `
                            ${styleTag}
                            <div class="${positionClass}">
                                <a href="/"><img src="https://placehold.co/300x40" alt="Error loading logo" loading="lazy"></a>
                            </div>
                        `;
                    }
                } else {
                    warn('No valid logo sources provided, skipping render.');
                    logoHTML = `
                        <div class="place-self-center">
                            <a href="/"><img src="https://placehold.co/300x40" alt="No logo sources provided" loading="lazy"></a>
                        </div>
                    `;
                }
                this.innerHTML = logoHTML;
                log('Render complete', { innerHTMLPreview: this.innerHTML.substring(0, 200) + '...' });
            }

            // Handle system theme changes (light/dark mode).
            // Re-renders the component to update logo variants if connected.
            async handleThemeChange(event) {
                log('Theme change detected', { matchesDark: event.matches });
                if (this.isConnected) {
                    await this.render();
                }
            }

            // Handle window resize events.
            // Checks breakpoint and re-renders to switch between full/icon logos if applicable.
            async handleResize() {
                log('Window resize detected');
                if (this.isConnected) {
                    const attrs = this.getAttributes();
                    const breakpoint = parseInt(attrs.breakpoint, 10);
                    const isBelowBreakpoint = breakpoint && window.matchMedia(`(max-width: ${breakpoint - 1}px)`).matches;
                    await this.render();
                }
            }

            // Observe mutations on the img element's src attribute.
            // Dynamically updates the image source based on current media queries (theme/breakpoint).
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
                        let selectedSrc = attrs.fullLightSrc || attrs.iconLightSrc;
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

            // Set up event listeners and observers when connected to DOM.
            // Renders initially, listens for theme changes, resizes, and img mutations.
            async connectedCallback() {
                log('Connected to DOM');
                await this.render();
                const prefersDarkQuery = window.matchMedia('(prefers-color-scheme: dark)');
                prefersDarkQuery.addEventListener('change', this.handleThemeChange);
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

            // Clean up event listeners and observers when disconnected from DOM.
            // Prevents memory leaks by removing resize/mutation observers and theme listener.
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
                window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', this.handleThemeChange);
            }

            // Re-render on attribute changes.
            // Clears cache and calls render if the element is connected.
            async attributeChangedCallback() {
                log('Attribute changed');
                if (this.isConnected) {
                    this._cachedAttrs = null;
                    await this.render();
                }
            }
        }

        // Define the custom element if not already defined.
        // Upgrades any existing elements in the document.
        if (!customElements.get('custom-logo')) {
            customElements.define('custom-logo', CustomLogo);
            log('CustomLogo defined successfully');
        }
        document.querySelectorAll('custom-logo').forEach(element => {
            customElements.upgrade(element);
            log('Upgraded existing custom-logo element');
        });
    } catch (err) {
        error('Failed to import generatePictureMarkup or define CustomLogo', { error: err.message });
    }
})();
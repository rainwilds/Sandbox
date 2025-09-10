(async () => {
    try {
        const { generatePictureMarkup } = await import('../image-generator.js');
        console.log('Successfully imported generatePictureMarkup');

        class CustomLogo extends HTMLElement {
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
                    'logo-max-height'
                ];
            }

            constructor() {
                super();
                this.handleThemeChange = this.handleThemeChange.bind(this);
                this.handleResize = this.handleResize.bind(this);
                this.handleMutation = this.handleMutation.bind(this);
            }

            getAttributes() {
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
                    maxHeight: this.getAttribute('logo-max-height') || ''
                };

                // Validate that at least one valid source is provided for full and/or icon
                const hasFullSource = attrs.fullPrimarySrc || (attrs.fullLightSrc && attrs.fullDarkSrc);
                const hasIconSource = attrs.iconPrimarySrc || (attrs.iconLightSrc && attrs.iconDarkSrc);
                if (!hasFullSource && !hasIconSource) {
                    console.error('At least one of logo-full-primary-src, (logo-full-light-src and logo-full-dark-src), logo-icon-primary-src, or (logo-icon-light-src and logo-icon-dark-src) must be provided');
                    return attrs;
                }

                // Validate light/dark pairs if provided
                const validatePair = (light, dark, label) => {
                    if ((light || dark) && !(light && dark)) {
                        console.error(`Both ${label}-light-src and ${label}-dark-src must be provided if one is specified.`);
                        return false;
                    }
                    return true;
                };
                if (!validatePair(attrs.fullLightSrc, attrs.fullDarkSrc, 'logo-full') ||
                    !validatePair(attrs.iconLightSrc, attrs.iconDarkSrc, 'logo-icon')) {
                    return attrs;
                }

                // Validate alt attributes for non-decorative images
                if (!attrs.fullPrimaryAlt && !attrs.fullLightAlt && !attrs.fullDarkAlt && 
                    !attrs.iconPrimaryAlt && !attrs.iconLightAlt && !attrs.iconDarkAlt) {
                    attrs.isDecorative = true;
                } else {
                    if (attrs.fullPrimarySrc && !attrs.fullPrimaryAlt) {
                        console.error('logo-full-primary-alt is required when logo-full-primary-src is provided.');
                    }
                    if (attrs.iconPrimarySrc && !attrs.iconPrimaryAlt) {
                        console.error('logo-icon-primary-alt is required when logo-icon-primary-src is provided.');
                    }
                    if (attrs.fullLightSrc && attrs.fullDarkSrc && !(attrs.fullLightAlt && attrs.fullDarkAlt)) {
                        console.error('Both logo-full-light-alt and logo-full-dark-alt are required when logo-full-light-src and logo-full-dark-src are provided.');
                    }
                    if (attrs.iconLightSrc && attrs.iconDarkSrc && !(attrs.iconLightAlt && attrs.iconDarkAlt)) {
                        console.error('Both logo-icon-light-alt and logo-icon-dark-alt are required when logo-icon-light-src and logo-icon-dark-src are provided.');
                    }
                }

                // Validate max-height
                if (attrs.maxHeight) {
                    const validLength = attrs.maxHeight.match(/^(\d*\.?\d+)(px|rem|em|vh|vw)$/);
                    if (!validLength) {
                        console.warn(`Invalid logo-max-height value "${attrs.maxHeight}". Must be a valid CSS length (e.g., "40px", "2rem"). Ignoring.`);
                        attrs.maxHeight = '';
                    }
                }

                const validPositions = [
                    'center', 'top', 'bottom', 'left', 'right',
                    'top-left', 'top-center', 'top-right',
                    'bottom-left', 'bottom-center', 'bottom-right',
                    'center-left', 'center-right'
                ];
                if (attrs.fullPosition && !validPositions.includes(attrs.fullPosition)) {
                    console.warn(`Invalid logo-full-position "${attrs.fullPosition}". Must be one of ${validPositions.join(', ')}. Ignoring.`);
                    attrs.fullPosition = '';
                }
                if (attrs.iconPosition && !validPositions.includes(attrs.iconPosition)) {
                    console.warn(`Invalid logo-icon-position "${attrs.iconPosition}". Must be one of ${validPositions.join(', ')}. Ignoring.`);
                    attrs.iconPosition = '';
                }

                return attrs;
            }

            render() {
                const attrs = this.getAttributes();
                const alignMap = {
                    'center': 'place-self-center',
                    'top': 'place-self-top',
                    'bottom': 'place-self-bottom',
                    'left': 'place-self-left',
                    'right': 'place-self-right',
                    'top-left': 'place-self-top-left',
                    'top-center': 'place-self-top-center',
                    'top-right': 'place-self-top-right',
                    'bottom-left': 'place-self-bottom-left',
                    'bottom-center': 'place-self-bottom-center',
                    'bottom-right': 'place-self-bottom-right',
                    'center-left': 'place-self-center-left',
                    'center-right': 'place-self-center-right'
                };
                let logoHTML = '';
                const hasValidSource = attrs.fullPrimarySrc || attrs.fullLightSrc || attrs.fullDarkSrc || 
                                      attrs.iconPrimarySrc || attrs.iconLightSrc || attrs.iconDarkSrc;
                if (hasValidSource) {
                    // Determine which position to use based on breakpoint and available sources
                    let positionClass = attrs.fullPosition ? alignMap[attrs.fullPosition] : 'place-self-center';
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

                    const extraStyles = attrs.maxHeight ? `max-height: ${attrs.maxHeight}` : '';
                    const logoMarkup = generatePictureMarkup({
                        fullSrc: attrs.fullPrimarySrc,
                        fullLightSrc: attrs.fullLightSrc,
                        fullDarkSrc: attrs.fullDarkSrc,
                        fullAlt: attrs.fullPrimaryAlt,
                        fullLightAlt: attrs.fullLightAlt,
                        fullDarkAlt: attrs.fullDarkAlt,
                        iconSrc: attrs.iconPrimarySrc,
                        iconLightSrc: attrs.iconLightSrc,
                        iconDarkSrc: attrs.iconDarkSrc,
                        iconAlt: attrs.iconPrimaryAlt,
                        iconLightAlt: attrs.iconLightAlt,
                        iconDarkAlt: attrs.iconDarkAlt,
                        isDecorative: attrs.isDecorative || false,
                        customClasses: '', // No logo class
                        loading: 'lazy',
                        fetchPriority: '',
                        extraClasses: [],
                        breakpoint: attrs.breakpoint,
                        extraStyles: extraStyles
                    });
                    console.log('generatePictureMarkup output:', logoMarkup);
                    logoHTML = `
                        ${styleTag}
                        <div class="${positionClass}">
                            <a href="/">${logoMarkup}</a>
                        </div>
                    `;
                } else {
                    console.warn('No valid logo sources provided, skipping render.');
                    logoHTML = '<div>No logo sources provided</div>';
                }
                console.log('Rendered logoHTML:', logoHTML);
                this.innerHTML = logoHTML; // Use light DOM
            }

            handleThemeChange(event) {
                if (this.isConnected) {
                    console.log('Theme change detected:', { isDark: event.matches });
                    this.render();
                }
            }

            handleResize() {
                if (this.isConnected) {
                    const attrs = this.getAttributes();
                    const breakpoint = parseInt(attrs.breakpoint, 10);
                    const isBelowBreakpoint = breakpoint && window.matchMedia(`(max-width: ${breakpoint - 1}px)`).matches;
                    console.log('Window resized, breakpoint state:', { isBelowBreakpoint });
                    this.render();
                }
            }

            handleMutation(mutations) {
                mutations.forEach(mutation => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'src') {
                        const img = mutation.target;
                        const picture = this.querySelector('picture');
                        const sources = picture.querySelectorAll('source');
                        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                        const attrs = this.getAttributes();
                        const breakpoint = parseInt(attrs.breakpoint, 10);
                        const isBelowBreakpoint = breakpoint && window.matchMedia(`(max-width: ${breakpoint - 1}px)`).matches;
                        let selectedSrc = attrs.fullLightSrc;
                        let matchedMedia = 'none';
                        sources.forEach(source => {
                            const media = source.getAttribute('media');
                            if (media && window.matchMedia(media).matches) {
                                selectedSrc = source.getAttribute('srcset');
                                matchedMedia = media;
                            }
                        });
                        console.log('Mutation detected:', { selectedSrc, matchedMedia, prefersDark, isBelowBreakpoint });
                        if (img.src !== selectedSrc) {
                            console.log('Mutation updating img src to:', selectedSrc);
                            img.src = selectedSrc;
                        }
                    }
                });
            }

            connectedCallback() {
                this.render();
                // Add listener for prefers-color-scheme changes
                const prefersDarkQuery = window.matchMedia('(prefers-color-scheme: dark)');
                prefersDarkQuery.addEventListener('change', this.handleThemeChange);
                // Add resize observer for breakpoint changes
                const resizeObserver = new ResizeObserver(this.handleResize);
                resizeObserver.observe(document.body);
                this.resizeObserver = resizeObserver;
                // Add mutation observer for img src changes
                const img = this.querySelector('img');
                if (img) {
                    const mutationObserver = new MutationObserver(this.handleMutation);
                    mutationObserver.observe(img, { attributes: true, attributeFilter: ['src'] });
                    this.mutationObserver = mutationObserver;
                }
            }

            disconnectedCallback() {
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

            attributeChangedCallback() {
                if (this.isConnected) {
                    this.render();
                }
            }
        }

        if (!customElements.get('custom-logo')) {
            customElements.define('custom-logo', CustomLogo);
            console.log('CustomLogo defined successfully');
        }
        document.querySelectorAll('custom-logo').forEach(element => {
            customElements.upgrade(element);
        });
    } catch (error) {
        console.error('Failed to import generatePictureMarkup or define CustomLogo:', error);
    }
})();
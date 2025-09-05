(async () => {
    try {
        const { generateLogoMarkup } = await import('../image-generator.js');
        console.log('Successfully imported generateLogoMarkup');

        class CustomLogo extends HTMLElement {
            static get observedAttributes() {
                return [
                    'logo-primary-src',
                    'logo-light-src',
                    'logo-dark-src',
                    'logo-primary-alt',
                    'logo-light-alt',
                    'logo-dark-alt',
                    'logo-position',
                    'logo-mobile-src',
                    'logo-mobile-light-src',
                    'logo-mobile-dark-src',
                    'logo-tablet-src',
                    'logo-tablet-light-src',
                    'logo-tablet-dark-src'
                ];
            }

            constructor() {
                super();
            }

            getAttributes() {
                const attrs = {
                    logoPrimarySrc: this.getAttribute('logo-primary-src') || '',
                    logoLightSrc: this.getAttribute('logo-light-src') || '',
                    logoDarkSrc: this.getAttribute('logo-dark-src') || '',
                    logoPrimaryAlt: this.getAttribute('logo-primary-alt') || '',
                    logoLightAlt: this.getAttribute('logo-light-alt') || '',
                    logoDarkAlt: this.getAttribute('logo-dark-alt') || '',
                    logoPosition: this.getAttribute('logo-position') || '',
                    logoMobileSrc: this.getAttribute('logo-mobile-src') || '',
                    logoMobileLightSrc: this.getAttribute('logo-mobile-light-src') || '',
                    logoMobileDarkSrc: this.getAttribute('logo-mobile-dark-src') || '',
                    logoTabletSrc: this.getAttribute('logo-tablet-src') || '',
                    logoTabletLightSrc: this.getAttribute('logo-tablet-light-src') || '',
                    logoTabletDarkSrc: this.getAttribute('logo-tablet-dark-src') || ''
                };

                const validatePair = (light, dark, label) => {
                    if ((light || dark) && !(light && dark)) {
                        console.error(`Both ${label}-light-src and ${label}-dark-src must be provided if one is specified.`);
                        return false;
                    }
                    return true;
                };
                if (!validatePair(attrs.logoLightSrc, attrs.logoDarkSrc, 'logo') ||
                    !validatePair(attrs.logoMobileLightSrc, attrs.logoMobileDarkSrc, 'logo-mobile') ||
                    !validatePair(attrs.logoTabletLightSrc, attrs.logoTabletDarkSrc, 'logo-tablet')) {
                    return attrs;
                }

                if (attrs.logoLightSrc && !attrs.logoLightAlt) {
                    console.error('logo-light-alt is required when logo-light-src is provided.');
                }
                if (attrs.logoDarkSrc && !attrs.logoDarkAlt) {
                    console.error('logo-dark-alt is required when logo-dark-src is provided.');
                }
                const validPositions = [
                    'center', 'top', 'bottom', 'left', 'right',
                    'top-left', 'top-center', 'top-right',
                    'bottom-left', 'bottom-center', 'bottom-right',
                    'center-left', 'center-right'
                ];
                if (attrs.logoPosition && !validPositions.includes(attrs.logoPosition)) {
                    console.warn(`Invalid logo-position "${attrs.logoPosition}". Must be one of ${validPositions.join(', ')}. Ignoring.`);
                    attrs.logoPosition = '';
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
                const hasValidSource = attrs.logoPrimarySrc || attrs.logoLightSrc || attrs.logoDarkSrc || attrs.logoMobileSrc || attrs.logoTabletSrc;
                if (hasValidSource) {
                    const logoMarkup = generateLogoMarkup({
                        src: attrs.logoPrimarySrc || attrs.logoLightSrc || attrs.logoDarkSrc || attrs.logoMobileSrc || attrs.logoTabletSrc,
                        mobileSrc: attrs.logoMobileSrc,
                        tabletSrc: attrs.logoTabletSrc,
                        desktopSrc: attrs.logoPrimarySrc || attrs.logoLightSrc || attrs.logoDarkSrc || attrs.logoTabletSrc,
                        lightSrc: attrs.logoLightSrc,
                        darkSrc: attrs.logoDarkSrc,
                        mobileLightSrc: attrs.logoMobileLightSrc,
                        mobileDarkSrc: attrs.logoMobileDarkSrc,
                        tabletLightSrc: attrs.logoTabletLightSrc,
                        tabletDarkSrc: attrs.logoTabletDarkSrc,
                        alt: attrs.logoPrimaryAlt || attrs.logoLightAlt || attrs.logoDarkAlt || '',
                        isDecorative: !attrs.logoPrimaryAlt && !attrs.logoLightAlt && !attrs.logoDarkAlt,
                        customClasses: `logo${attrs.logoPosition ? ` logo-${attrs.logoPosition}` : ''}`,
                        loading: 'eager',
                        fetchPriority: 'high',
                        extraClasses: []
                    });
                    console.log('generateLogoMarkup output:', logoMarkup);
                    logoHTML = `
                        <div${attrs.logoPosition ? ` class="${alignMap[attrs.logoPosition]}"` : ''} style="z-index: 100;">
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

            connectedCallback() {
                this.render();
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
        console.error('Failed to import generateLogoMarkup or define CustomLogo:', error);
    }
})();
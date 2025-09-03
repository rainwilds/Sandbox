(async () => {
    try {
        const { generateLogoMarkup } = await import('./js/image-generator.js');
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

            getAttributes() {
                const attrs = {};
                attrs.logoPrimarySrc = this.getAttribute('logo-primary-src') || '';
                attrs.logoLightSrc = this.getAttribute('logo-light-src') || '';
                attrs.logoDarkSrc = this.getAttribute('logo-dark-src') || '';
                attrs.logoPrimaryAlt = this.getAttribute('logo-primary-alt') || '';
                attrs.logoLightAlt = this.getAttribute('logo-light-alt') || '';
                attrs.logoDarkAlt = this.getAttribute('logo-dark-alt') || '';
                attrs.logoPosition = this.getAttribute('logo-position') || '';
                attrs.logoMobileSrc = this.getAttribute('logo-mobile-src') || '';
                attrs.logoMobileLightSrc = this.getAttribute('logo-mobile-light-src') || '';
                attrs.logoMobileDarkSrc = this.getAttribute('logo-mobile-dark-src') || '';
                attrs.logoTabletSrc = this.getAttribute('logo-tablet-src') || '';
                attrs.logoTabletLightSrc = this.getAttribute('logo-tablet-light-src') || '';
                attrs.logoTabletDarkSrc = this.getAttribute('logo-tablet-dark-src') || '';

                // Validation for light/dark pairs with early exit
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
                    return attrs; // Return with errors logged, but allow partial rendering
                }

                if (attrs.logoPrimarySrc && !attrs.logoPrimaryAlt) {
                    console.error('logo-primary-alt is required when logo-primary-src is provided.');
                }
                if (attrs.logoLightSrc && !attrs.logoLightAlt) {
                    console.error('logo-light-alt is required when logo-light-src is provided.');
                }
                if (attrs.logoDarkSrc && !attrs.logoDarkAlt) {
                    console.error('logo-dark-alt is required when logo-dark-src is provided.');
                }
                const validPositions = ['center', 'top', 'bottom', 'left', 'right', 'top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right', 'center-left', 'center-right'];
                if (attrs.logoPosition && !validPositions.includes(attrs.logoPosition)) {
                    console.warn(`Invalid logo-position "${attrs.logoPosition}". Ignoring.`);
                    attrs.logoPosition = '';
                }

                return attrs;
            }

            render() {
                const attrs = this.getAttributes();
                const alignMap = {
                    center: 'place-self-center',
                    'top-center': 'place-self-top-center',
                    right: 'place-self-right'
                };
                let logoHTML = '';
                // Check for at least one valid source
                const hasValidSource = attrs.logoPrimarySrc || attrs.logoLightSrc || attrs.logoDarkSrc || attrs.logoMobileSrc || attrs.logoTabletSrc;
                if (hasValidSource) {
                    const logoMarkup = generateLogoMarkup({
                        src: attrs.logoPrimarySrc || attrs.logoMobileSrc || attrs.logoTabletSrc, // Fallback to first available
                        mobileSrc: attrs.logoMobileSrc,
                        tabletSrc: attrs.logoTabletSrc,
                        desktopSrc: attrs.logoPrimarySrc || attrs.logoTabletSrc, // Prioritize primary or tablet as desktop fallback
                        lightSrc: attrs.logoLightSrc,
                        darkSrc: attrs.logoDarkSrc,
                        mobileLightSrc: attrs.logoMobileLightSrc,
                        mobileDarkSrc: attrs.logoMobileDarkSrc,
                        tabletLightSrc: attrs.logoTabletLightSrc,
                        tabletDarkSrc: attrs.logoTabletDarkSrc,
                        alt: attrs.logoPrimaryAlt || attrs.logoLightAlt || '',
                        isDecorative: !attrs.logoPrimaryAlt && !attrs.logoLightAlt,
                        customClasses: `logo logo-${attrs.logoPosition || 'right'}`,
                        loading: 'eager',
                        fetchPriority: 'high',
                        extraClasses: []
                    });
                    logoHTML = `
                        <div${attrs.logoPosition ? ` class="${alignMap[attrs.logoPosition]}"` : ''} style="z-index: 100;">
                            <a href="/">${logoMarkup}</a>
                        </div>
                    `;
                } else {
                    console.warn('No valid logo sources provided, skipping render.');
                }
                this.innerHTML = logoHTML;
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
        customElements.define('custom-logo', CustomLogo);
        console.log('CustomLogo defined successfully');
    } catch (error) {
        console.error('Failed to import generateLogoMarkup or define CustomLogo:', error);
    }
})();
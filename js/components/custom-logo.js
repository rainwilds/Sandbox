/* global HTMLElement, document, window, matchMedia, console */
import { generatePictureMarkup } from '../image-generator.js';
import { VALID_ALIGNMENTS, alignMap } from '../shared.js';

console.log('Successfully imported generatePictureMarkup and alignMap');

class CustomLogo extends HTMLElement {
    constructor() {
        super();
        this.isInitialized = false;
        this.debounceTimeout = null;
        CustomLogo.#instances.add(this);
        CustomLogo.#resizeObserver.observe(this);
    }

    // Static properties for shared listeners
    static #instances = new WeakSet();
    static #resizeObserver = new ResizeObserver(entries => {
        entries.forEach(entry => {
            const instance = entry.target;
            if (instance instanceof CustomLogo && CustomLogo.#instances.has(instance)) {
                instance.updateSize();
            }
        });
    });

    static #prefersColorScheme = matchMedia('(prefers-color-scheme: dark)');
    static #themeChangeListener = () => {
        CustomLogo.#instances.forEach(instance => {
            if (instance.isInitialized) {
                instance.updateTheme();
            }
        });
    };

    static {
        CustomLogo.#prefersColorScheme.addEventListener('change', CustomLogo.#themeChangeListener);
    }

    connectedCallback() {
        if (!this.isInitialized) {
            this.initialize();
        }
    }

    disconnectedCallback() {
        CustomLogo.#instances.delete(this);
        CustomLogo.#resizeObserver.unobserve(this);
        if (this.debounceTimeout) {
            clearTimeout(this.debounceTimeout);
        }
    }

    initialize() {
        if (this.isInitialized) return;
        console.log('** CustomLogo start...', this.outerHTML);
        this.isInitialized = true;
        try {
            const logoElement = this.render();
            if (logoElement) {
                this.replaceWith(logoElement);
            } else {
                console.error('Failed to render CustomLogo: logoElement is null.', this.outerHTML);
                this.replaceWith(this.render(true));
            }
        } catch (error) {
            console.error('Error initializing CustomLogo:', error, this.outerHTML);
            this.replaceWith(this.render(true));
        }
        console.log('** CustomLogo end...');
    }

    updateTheme() {
        if (!this.isInitialized) return;
        const picture = this.querySelector('picture');
        if (picture) {
            const img = picture.querySelector('img');
            const isDark = CustomLogo.#prefersColorScheme.matches;
            const attrs = this.getAttributes();
            const activeSrc = isDark ? (attrs.fullDarkSrc || attrs.iconDarkSrc || attrs.fullSrc || attrs.iconSrc) : (attrs.fullLightSrc || attrs.iconLightSrc || attrs.fullSrc || attrs.iconSrc);
            if (img && img.src !== activeSrc) {
                img.src = activeSrc;
                console.log('Theme changed, updating logo src to:', activeSrc);
            }
        }
    }

    updateSize() {
        if (!this.isInitialized) return;
        const height = this.getAttribute('logo-height');
        const logoDiv = this.querySelector('div');
        if (logoDiv && height) {
            logoDiv.style.height = height;
        }
    }

    getAttributes() {
        const fullSrc = this.getAttribute('logo-full-primary-src') || '';
        const fullLightSrc = this.getAttribute('logo-full-light-src') || fullSrc;
        const fullDarkSrc = this.getAttribute('logo-full-dark-src') || fullSrc;
        const fullAlt = this.getAttribute('logo-full-primary-alt') || '';
        const fullLightAlt = this.getAttribute('logo-full-light-alt') || fullAlt;
        const fullDarkAlt = this.getAttribute('logo-full-dark-alt') || fullAlt;
        const fullPosition = this.getAttribute('logo-full-position') || 'center';

        const iconSrc = this.getAttribute('logo-icon-primary-src') || '';
        const iconLightSrc = this.getAttribute('logo-icon-light-src') || iconSrc;
        const iconDarkSrc = this.getAttribute('logo-icon-dark-src') || iconSrc;
        const iconAlt = this.getAttribute('logo-icon-primary-alt') || '';
        const iconLightAlt = this.getAttribute('logo-icon-light-alt') || iconAlt;
        const iconDarkAlt = this.getAttribute('logo-icon-dark-alt') || iconAlt;
        const iconPosition = this.getAttribute('logo-icon-position') || 'center';

        const breakpoint = this.getAttribute('logo-breakpoint') || '';
        const height = this.getAttribute('logo-height') || '';

        const hasFullSource = fullSrc || (fullLightSrc && fullDarkSrc);
        const hasIconSource = iconSrc || (iconLightSrc && iconDarkSrc);
        if (!hasFullSource && !hasIconSource) {
            console.error('At least one of logo-full-primary-src, (logo-full-light-src and logo-full-dark-src), logo-icon-primary-src, or (logo-icon-light-src and logo-icon-dark-src) must be provided');
            return null;
        }

        // Validate light/dark pairs
        const validatePair = (light, dark, label) => {
            if ((light || dark) && !(light && dark)) {
                console.error(`Both ${label}-light-src and ${label}-dark-src must be provided if one is specified.`);
                return false;
            }
            return true;
        };
        if (!validatePair(fullLightSrc, fullDarkSrc, 'logo-full') || !validatePair(iconLightSrc, iconDarkSrc, 'logo-icon')) {
            return null;
        }

        // Validate alt attributes for non-decorative images
        const isDecorative = this.hasAttribute('decorative');
        if (!isDecorative) {
            if (fullSrc && !fullAlt) console.error('logo-full-primary-alt is required when logo-full-primary-src is provided.');
            if (iconSrc && !iconAlt) console.error('logo-icon-primary-alt is required when logo-icon-primary-src is provided.');
            if (fullLightSrc && fullDarkSrc && !(fullLightAlt && fullDarkAlt)) console.error('Both logo-full-light-alt and logo-full-dark-alt are required when logo-full-light-src and logo-full-dark-src are provided.');
            if (iconLightSrc && iconDarkSrc && !(iconLightAlt && iconDarkAlt)) console.error('Both logo-icon-light-alt and logo-icon-dark-alt are required when logo-icon-light-src and logo-icon-dark-src are provided.');
        }

        // Validate height
        if (height && !height.match(/^(\d*\.?\d+)(px|rem|em|vh|vw)$/)) {
            console.warn(`Invalid logo-height value "${height}". Must be a valid CSS length (e.g., "40px", "2rem"). Ignoring.`);
        }

        // Validate positions
        if (fullPosition && !VALID_ALIGNMENTS.includes(fullPosition)) {
            console.warn(`Invalid logo-full-position "${fullPosition}". Must be one of ${VALID_ALIGNMENTS.join(', ')}. Ignoring.`);
        }
        if (iconPosition && !VALID_ALIGNMENTS.includes(iconPosition)) {
            console.warn(`Invalid logo-icon-position "${iconPosition}". Must be one of ${VALID_ALIGNMENTS.join(', ')}. Ignoring.`);
        }

        // Validate breakpoint
        const validatedBreakpoint = breakpoint && [768, 1024, 1366, 1920, 2560].includes(parseInt(breakpoint, 10)) ? parseInt(breakpoint, 10) : '';

        return {
            fullSrc,
            fullLightSrc,
            fullDarkSrc,
            fullAlt,
            fullLightAlt,
            fullDarkAlt,
            fullPosition,
            iconSrc,
            iconLightSrc,
            iconDarkSrc,
            iconAlt,
            iconLightAlt,
            iconDarkAlt,
            iconPosition,
            breakpoint: validatedBreakpoint,
            height,
            isDecorative
        };
    }

    render(isFallback = false) {
        const attrs = isFallback ? {
            fullSrc: '',
            fullLightSrc: '',
            fullDarkSrc: '',
            fullAlt: '',
            fullLightAlt: '',
            fullDarkAlt: '',
            fullPosition: 'center',
            iconSrc: '',
            iconLightSrc: '',
            iconDarkSrc: '',
            iconAlt: '',
            iconLightAlt: '',
            iconDarkAlt: '',
            iconPosition: 'center',
            breakpoint: '',
            height: '',
            isDecorative: false
        } : this.getAttributes();

        if (!attrs) return null;

        const hasValidSource = attrs.fullSrc || attrs.fullLightSrc || attrs.fullDarkSrc || attrs.iconSrc || attrs.iconLightSrc || attrs.iconDarkSrc;
        if (!hasValidSource && !isFallback) {
            console.warn('No valid logo sources provided, skipping render.');
            return null;
        }

        const positionClass = attrs.fullPosition ? alignMap[attrs.fullPosition] : 'place-self-center';
        const extraStyles = attrs.height ? `height: ${attrs.height}` : '';

        let logoHTML = '';
        if (hasValidSource) {
            // Determine breakpoint media query
            let styleTag = '';
            const hasBreakpoint = attrs.breakpoint;
            const hasIconSource = attrs.iconSrc || (attrs.iconLightSrc && attrs.iconDarkSrc);
            const hasFullSource = attrs.fullSrc || (attrs.fullLightSrc && attrs.fullDarkSrc);

            if (hasBreakpoint && hasIconSource && hasFullSource) {
                styleTag = `
                    <style>
                        @media (max-width: ${attrs.breakpoint - 1}px) {
                            .place-self-center {
                                ${attrs.iconPosition ? `place-self: ${attrs.iconPosition.replace(/-/g, ' ')} !important;` : ''}
                            }
                        }
                    </style>
                `;
            }

            // Use generatePictureMarkup for responsive logo
            const logoMarkup = generatePictureMarkup({
                fullSrc: attrs.fullSrc,
                fullLightSrc: attrs.fullLightSrc,
                fullDarkSrc: attrs.fullDarkSrc,
                fullAlt: attrs.fullAlt,
                fullLightAlt: attrs.fullLightAlt,
                fullDarkAlt: attrs.fullDarkAlt,
                iconSrc: attrs.iconSrc,
                iconLightSrc: attrs.iconLightSrc,
                iconDarkSrc: attrs.iconDarkSrc,
                iconAlt: attrs.iconAlt,
                iconLightAlt: attrs.iconLightAlt,
                iconDarkAlt: attrs.iconDarkAlt,
                isDecorative: attrs.isDecorative,
                customClasses: '',
                loading: 'eager',
                fetchPriority: 'high',
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
            console.log('Rendered logoHTML:', logoHTML);
        } else {
            logoHTML = '<div>No logo sources provided</div>';
        }

        const logoElement = document.createElement('div');
        logoElement.innerHTML = logoHTML;
        return logoElement;
    }

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
            'logo-height',
            'decorative'
        ];
    }

    attributeChangedCallback(name) {
        if (!this.isInitialized) return;
        // Only re-render for relevant attributes
        if (this.constructor.observedAttributes.includes(name)) {
            if (this.debounceTimeout) {
                clearTimeout(this.debounceTimeout);
            }
            this.debounceTimeout = setTimeout(() => {
                this.initialize();
            }, 100);
        }
    }
}

try {
    if (!customElements.get('custom-logo')) {
        customElements.define('custom-logo', CustomLogo);
        console.log('CustomLogo defined successfully');
    }
    document.querySelectorAll('custom-logo').forEach(element => {
        customElements.upgrade(element);
    });
} catch (error) {
    console.error('Error defining CustomLogo element:', error);
}

console.log('CustomLogo version: 2025-09-09');

export { CustomLogo };
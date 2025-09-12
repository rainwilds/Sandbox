/* global HTMLElement, document, window, matchMedia, ResizeObserver, console */
import { VALID_ALIGNMENTS, alignMap } from '../shared.js';

class CustomLogo extends HTMLElement {
    constructor() {
        super();
        this.isInitialized = false;
        CustomLogo.#instances.add(this);
        CustomLogo.#resizeObserver.observe(this);
    }

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
        const img = this.querySelector('img');
        if (img) {
            const attrs = this.getAttributes();
            const isDark = CustomLogo.#prefersColorScheme.matches;
            const activeSrc = isDark ? (attrs.fullDarkSrc || attrs.iconDarkSrc || attrs.fullSrc || attrs.iconSrc) : (attrs.fullLightSrc || attrs.iconLightSrc || attrs.fullSrc || attrs.iconSrc);
            const activeAlt = isDark ? (attrs.fullDarkAlt || attrs.iconDarkAlt || attrs.fullAlt || attrs.iconAlt) : (attrs.fullLightAlt || attrs.iconLightAlt || attrs.fullAlt || attrs.iconAlt);
            if (img.src !== activeSrc) {
                img.src = activeSrc;
                img.alt = attrs.isDecorative ? '' : activeAlt;
                console.log('Theme changed, updating logo src to:', activeSrc);
            }
        }
    }

    updateSize() {
        if (!this.isInitialized) return;
        const height = this.getAttribute('logo-height');
        const img = this.querySelector('img');
        if (img && height) {
            img.style.height = height;
            img.style.width = 'auto';
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

        const isDecorative = this.hasAttribute('decorative');
        if (!isDecorative) {
            if (fullSrc && !fullAlt) console.error('logo-full-primary-alt is required when logo-full-primary-src is provided.');
            if (iconSrc && !iconAlt) console.error('logo-icon-primary-alt is required when logo-icon-primary-src is provided.');
            if (fullLightSrc && fullDarkSrc && !(fullLightAlt && fullDarkAlt)) console.error('Both logo-full-light-alt and logo-full-dark-alt are required.');
            if (iconLightSrc && iconDarkSrc && !(iconLightAlt && iconDarkAlt)) console.error('Both logo-icon-light-alt and logo-icon-dark-alt are required.');
        }

        if (height && !height.match(/^(\d*\.?\d+)(px|rem|em|vh|vw)$/)) {
            console.warn(`Invalid logo-height value "${height}". Must be a valid CSS length.`);
        }

        if (fullPosition && !VALID_ALIGNMENTS.includes(fullPosition)) {
            console.warn(`Invalid logo-full-position "${fullPosition}". Must be one of ${VALID_ALIGNMENTS.join(', ')}.`);
        }
        if (iconPosition && !VALID_ALIGNMENTS.includes(iconPosition)) {
            console.warn(`Invalid logo-icon-position "${iconPosition}". Must be one of ${VALID_ALIGNMENTS.join(', ')}.`);
        }

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

        const isDark = CustomLogo.#prefersColorScheme.matches;
        const windowWidth = window.innerWidth || 1920;
        const useIcon = attrs.breakpoint && windowWidth < parseInt(attrs.breakpoint, 10);
        const src = isDark
            ? (useIcon ? (attrs.iconDarkSrc || attrs.iconSrc) : (attrs.fullDarkSrc || attrs.fullSrc))
            : (useIcon ? (attrs.iconLightSrc || attrs.iconSrc) : (attrs.fullLightSrc || attrs.fullSrc));
        const alt = isDecorative ? '' : (isDark
            ? (useIcon ? (attrs.iconDarkAlt || attrs.iconAlt) : (attrs.fullDarkAlt || attrs.fullAlt))
            : (useIcon ? (attrs.iconLightAlt || attrs.iconAlt) : (attrs.fullLightAlt || attrs.fullAlt)));

        if (!src) {
            console.warn('No valid logo source for current theme/breakpoint.');
            return null;
        }

        const positionClass = useIcon ? (attrs.iconPosition ? alignMap[attrs.iconPosition] : 'place-self-center') : (attrs.fullPosition ? alignMap[attrs.fullPosition] : 'place-self-center');
        const style = attrs.height ? `height: ${attrs.height}; width: auto;` : '';

        let logoHTML = `
            <div class="${positionClass}">
                <a href="/">
                    <img src="${src}" ${isDecorative ? 'alt="" role="presentation"' : `alt="${alt}"`} loading="eager" style="${style}" onerror="this.src='https://placehold.co/3000x2000';this.alt='${isDecorative ? '' : 'Placeholder logo'};this.onerror=null;">
                </a>
            </div>
        `;

        if (attrs.breakpoint && (attrs.iconSrc || attrs.iconLightSrc || attrs.iconDarkSrc)) {
            logoHTML = `
                <style>
                    @media (max-width: ${attrs.breakpoint - 1}px) {
                        .place-self-center {
                            ${attrs.iconPosition ? `place-self: ${attrs.iconPosition.replace(/-/g, ' ')} !important;` : ''}
                        }
                    }
                </style>
                ${logoHTML}
            `;
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

    attributeChangedCallback(name, oldValue, newValue) {
        if (!this.isInitialized) return;
        if (name.startsWith('logo-') || name === 'decorative') {
            this.initialize();
        }
    }
}

try {
    if (!customElements.get('custom-logo')) {
        customElements.define('custom-logo', CustomLogo);
    }
    document.querySelectorAll('custom-logo').forEach(element => {
        customElements.upgrade(element);
    });
} catch (error) {
    console.error('Error defining CustomLogo element:', error);
}

console.log('CustomLogo version: 2025-09-09');

export { CustomLogo };
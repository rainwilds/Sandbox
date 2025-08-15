import { generatePictureMarkup } from '../picture-generator.js';

class CustomCard extends HTMLElement {
    constructor() {
        super();
        this.isVisible = false;
        this.isInitialized = false;
        this.callbacks = [];
        this.renderCache = null;
        this.lastAttributes = null;
        this.observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                this.isVisible = true;
                this.observer.disconnect();
                this.observer = null;
                this.initialize();
            }
        }, { rootMargin: '50px' });
        this.observer.observe(this);
    }

    getAttributes() {
        const backgroundFetchPriority = this.getAttribute('custom-img-background-fetchpriority') || '';
        const foregroundFetchPriority = this.getAttribute('custom-img-foreground-fetchpriority') || '';
        const validFetchPriorities = ['high', 'low', 'auto', ''];
        if (!validFetchPriorities.includes(backgroundFetchPriority)) {
            console.warn(`Invalid custom-img-background-fetchpriority value "${backgroundFetchPriority}" in <custom-card>. Using default.`);
        }
        if (!validFetchPriorities.includes(foregroundFetchPriority)) {
            console.warn(`Invalid custom-img-foreground-fetchpriority value "${foregroundFetchPriority}" in <custom-card>. Using default.`);
        }

        const foregroundPosition = this.getAttribute('custom-img-foreground-position') || 'none';
        const validPositions = ['none', 'above', 'below', 'left', 'right'];
        if (!validPositions.includes(foregroundPosition)) {
            console.warn(`Invalid custom-img-foreground-position value "${foregroundPosition}" in <custom-card>. Using default 'none'.`);
        }

        const backgroundOverlay = this.getAttribute('background-overlay') || '';
        let backgroundOverlayClass = '';
        if (backgroundOverlay) {
            const match = backgroundOverlay.match(/^background-overlay-(\d+)$/);
            if (match) {
                backgroundOverlayClass = `background-overlay-${match[1]}`;
            } else {
                console.warn(`Invalid background-overlay value "${backgroundOverlay}" in <custom-card>. Expected format: background-overlay-[number]. Using default 'background-overlay-1'.`);
                backgroundOverlayClass = 'background-overlay-1';
            }
        }

        // Process backdrop-filter and inner-backdrop-filter as space-separated class names
        const backdropFilterClasses = this.getAttribute('backdrop-filter')?.split(' ').filter(cls => cls) || [];
        const innerBackdropFilterClasses = this.getAttribute('inner-backdrop-filter')?.split(' ').filter(cls => cls) || [];

        return {
            heading: this.getAttribute('heading') || 'Default Heading',
            description: this.getAttribute('description') || 'Default description text.',
            buttonHref: this.getAttribute('button-href') || '#',
            buttonText: this.getAttribute('button-text') || 'Button',
            hasBackgroundOverlay: !!backgroundOverlay,
            backgroundOverlayClass,
            backgroundImageNoise: this.hasAttribute('background-image-noise'),
            backdropFilterClasses,
            backgroundColorClass: this.hasAttribute('background-color') ? this.getAttribute('background-color') : '',
            borderClass: this.hasAttribute('border') ? this.getAttribute('border') : '',
            borderRadiusClass: this.hasAttribute('border-radius') && this.hasAttribute('border') ? this.getAttribute('border-radius') : '',
            customClasses: this.getAttribute('class') || '',
            styleAttribute: this.getAttribute('style') || '',
            // Background image attributes
            backgroundLightSrc: this.getAttribute('custom-img-background-light-src') || '',
            backgroundDarkSrc: this.getAttribute('custom-img-background-dark-src') || '',
            backgroundAlt: this.getAttribute('custom-img-background-alt') || '',
            backgroundIsDecorative: this.hasAttribute('custom-img-background-decorative'),
            backgroundMobileWidth: this.getAttribute('custom-img-background-mobile-width') || '100vw',
            backgroundTabletWidth: this.getAttribute('custom-img-background-tablet-width') || '100vw',
            backgroundDesktopWidth: this.getAttribute('custom-img-background-desktop-width') || '100vw',
            backgroundAspectRatio: this.getAttribute('custom-img-background-aspect-ratio') || '',
            backgroundIncludeSchema: this.hasAttribute('custom-img-background-include-schema'),
            backgroundFetchPriority: validFetchPriorities.includes(backgroundFetchPriority) ? backgroundFetchPriority : '',
            backgroundLoading: this.getAttribute('custom-img-background-loading') || 'lazy',
            // Foreground image attributes
            foregroundLightSrc: this.getAttribute('custom-img-foreground-light-src') || '',
            foregroundDarkSrc: this.getAttribute('custom-img-foreground-dark-src') || '',
            foregroundAlt: this.getAttribute('custom-img-foreground-alt') || '',
            foregroundIsDecorative: this.hasAttribute('custom-img-foreground-decorative'),
            foregroundMobileWidth: this.getAttribute('custom-img-foreground-mobile-width') || '100vw',
            foregroundTabletWidth: this.getAttribute('custom-img-foreground-tablet-width') || '100vw',
            foregroundDesktopWidth: this.getAttribute('custom-img-foreground-desktop-width') || '100vw',
            foregroundAspectRatio: this.getAttribute('custom-img-foreground-aspect-ratio') || '',
            foregroundIncludeSchema: this.hasAttribute('custom-img-foreground-include-schema'),
            foregroundFetchPriority: validFetchPriorities.includes(foregroundFetchPriority) ? foregroundFetchPriority : '',
            foregroundLoading: this.getAttribute('custom-img-foreground-loading') || 'lazy',
            foregroundPosition: validPositions.includes(foregroundPosition) ? foregroundPosition : 'none',
            // Inner div attributes
            innerBackgroundColorClass: this.hasAttribute('inner-background-color') ? this.getAttribute('inner-background-color') : '',
            innerBackgroundImageNoise: this.hasAttribute('inner-background-image-noise'),
            innerBackdropFilterClasses,
            innerBorderClass: this.hasAttribute('inner-border') ? this.getAttribute('inner-border') : '',
            innerBorderRadiusClass: this.hasAttribute('inner-border-radius') && this.hasAttribute('inner-border') ? this.getAttribute('inner-border-radius') : '',
            innerStyle: this.getAttribute('inner-style') || ''
        };
    }

    initialize() {
        if (this.isInitialized || !this.isVisible) return;
        console.log('** CustomCard start... **');
        this.isInitialized = true;
        try {
            const cardElement = this.render();
            this.replaceWith(cardElement);
            this.callbacks.forEach(callback => callback());
        } catch (error) {
            console.error('Error initializing CustomCard:', error);
            this.replaceWith(this.render(true));
        }
        console.log('** CustomCard end... **');
    }

    connectedCallback() {
        if (this.isVisible) {
            this.initialize();
        }
    }

    disconnectedCallback() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        this.callbacks = [];
        this.renderCache = null;
    }

    addCallback(callback) {
        this.callbacks.push(callback);
    }

    render(isFallback = false) {
        if (!isFallback) {
            const attrString = JSON.stringify(this.getAttributes());
            if (this.renderCache && this.lastAttributes === attrString) {
                return this.renderCache.cloneNode(true);
            }
        }

        const attrs = isFallback ? {
            heading: 'Error',
            description: 'Failed to render card. Check console for details.',
            buttonHref: '#',
            buttonText: 'Button',
            hasBackgroundOverlay: false,
            backgroundOverlayClass: '',
            backgroundImageNoise: false,
            backdropFilterClasses: [],
            backgroundColorClass: '',
            borderClass: '',
            borderRadiusClass: '',
            customClasses: '',
            styleAttribute: '',
            backgroundLightSrc: '',
            backgroundDarkSrc: '',
            backgroundAlt: '',
            backgroundIsDecorative: false,
            backgroundMobileWidth: '100vw',
            backgroundTabletWidth: '100vw',
            backgroundDesktopWidth: '100vw',
            backgroundAspectRatio: '',
            backgroundIncludeSchema: false,
            backgroundFetchPriority: '',
            backgroundLoading: 'lazy',
            foregroundLightSrc: '',
            foregroundDarkSrc: '',
            foregroundAlt: '',
            foregroundIsDecorative: false,
            foregroundMobileWidth: '100vw',
            foregroundTabletWidth: '100vw',
            foregroundDesktopWidth: '100vw',
            foregroundAspectRatio: '',
            foregroundIncludeSchema: false,
            foregroundFetchPriority: '',
            foregroundLoading: 'lazy',
            foregroundPosition: 'none',
            innerBackgroundColorClass: '',
            innerBackgroundImageNoise: false,
            innerBackdropFilterClasses: [],
            innerBorderClass: '',
            innerBorderRadiusClass: '',
            innerStyle: ''
        } : this.getAttributes();

        // Accessibility warnings
        if (!attrs.backgroundAlt && !attrs.backgroundIsDecorative && (attrs.backgroundLightSrc || attrs.backgroundDarkSrc)) {
            console.warn(`<custom-card custom-img-background-light-src="${attrs.backgroundLightSrc || 'not provided'}" custom-img-background-dark-src="${attrs.backgroundDarkSrc || 'not provided'}"> is missing a custom-img-background-alt attribute for accessibility.`);
        }
        if (!attrs.foregroundAlt && !attrs.foregroundIsDecorative && (attrs.foregroundLightSrc || attrs.foregroundDarkSrc)) {
            console.warn(`<custom-card custom-img-foreground-light-src="${attrs.foregroundLightSrc || 'not provided'}" custom-img-foreground-dark-src="${attrs.foregroundDarkSrc || 'not provided'}"> is missing a custom-img-foreground-alt attribute for accessibility.`);
        }

        let backgroundImageHTML = '';
        let foregroundImageHTML = '';
        let overlayHTML = '';
        const hasBackgroundImage = !isFallback && !!(attrs.backgroundLightSrc || attrs.backgroundDarkSrc);
        const hasForegroundImage = !isFallback && !!(attrs.foregroundLightSrc || attrs.foregroundDarkSrc) && ['above', 'below', 'left', 'right'].includes(attrs.foregroundPosition);

        if (hasBackgroundImage) {
            const src = attrs.backgroundLightSrc || attrs.backgroundDarkSrc;
            if (!src) {
                console.warn('No valid background image source provided for <custom-card>. Skipping background image rendering.');
            } else {
                backgroundImageHTML = generatePictureMarkup({
                    src,
                    lightSrc: attrs.backgroundLightSrc,
                    darkSrc: attrs.backgroundDarkSrc,
                    alt: attrs.backgroundAlt,
                    isDecorative: attrs.backgroundIsDecorative,
                    mobileWidth: attrs.backgroundMobileWidth,
                    tabletWidth: attrs.backgroundTabletWidth,
                    desktopWidth: attrs.backgroundDesktopWidth,
                    aspectRatio: attrs.backgroundAspectRatio,
                    includeSchema: attrs.backgroundIncludeSchema,
                    customClasses: '',
                    loading: attrs.backgroundLoading,
                    fetchPriority: attrs.backgroundFetchPriority,
                    onerror: `this.src='https://placehold.co/3000x2000';${attrs.backgroundIsDecorative ? '' : `this.alt='${attrs.backgroundAlt || 'Placeholder image'}';`}this.onerror=null;`
                });
                if (!backgroundImageHTML) {
                    console.warn('Failed to generate picture markup for background image in <custom-card>.');
                }
            }
        }

        if (hasForegroundImage) {
            const src = attrs.foregroundLightSrc || attrs.foregroundDarkSrc;
            if (!src) {
                console.warn('No valid foreground image source provided for <custom-card>. Skipping foreground image rendering.');
            } else {
                foregroundImageHTML = generatePictureMarkup({
                    src,
                    lightSrc: attrs.foregroundLightSrc,
                    darkSrc: attrs.foregroundDarkSrc,
                    alt: attrs.foregroundAlt,
                    isDecorative: attrs.foregroundIsDecorative,
                    mobileWidth: attrs.foregroundMobileWidth,
                    tabletWidth: attrs.foregroundTabletWidth,
                    desktopWidth: attrs.foregroundDesktopWidth,
                    aspectRatio: attrs.foregroundAspectRatio,
                    includeSchema: attrs.foregroundIncludeSchema,
                    customClasses: '',
                    loading: attrs.foregroundLoading,
                    fetchPriority: attrs.foregroundFetchPriority,
                    onerror: `this.src='https://placehold.co/3000x2000';${attrs.foregroundIsDecorative ? '' : `this.alt='${attrs.foregroundAlt || 'Placeholder image'}';`}this.onerror=null;`
                });
                if (!foregroundImageHTML) {
                    console.warn('Failed to generate picture markup for foreground image in <custom-card>.');
                }
            }
        }

        if (!isFallback && attrs.hasBackgroundOverlay && hasBackgroundImage) {
            const overlayClasses = [attrs.backgroundOverlayClass];
            if (attrs.backgroundImageNoise) {
                overlayClasses.push('background-image-noise');
            }
            overlayClasses.push(...attrs.backdropFilterClasses);
            overlayHTML = `<div class="${overlayClasses.filter(cls => cls).join(' ')}"></div>`;
        }

        // Define padding-related classes to exclude from the outer div
        const paddingClasses = ['padding-small', 'padding-medium', 'padding-large'];
        const customClassList = attrs.customClasses.split(' ').filter(cls => cls && !paddingClasses.includes(cls));
        const innerPaddingClasses = attrs.customClasses.split(' ').filter(cls => cls && paddingClasses.includes(cls));

        // Extract padding-related styles from styleAttribute
        let outerStyles = attrs.styleAttribute || '';
        let paddingStyles = '';
        if (!isFallback && outerStyles) {
            const paddingRegex = /(padding[^:]*:[^;]+;)/gi;
            const paddingMatches = outerStyles.match(paddingRegex) || [];
            paddingStyles = paddingMatches.join(' ').trim();
            outerStyles = outerStyles.replace(paddingRegex, '').trim();
        }

        // Inner div classes
        const innerDivClassList = [];
        if (!isFallback) {
            innerDivClassList.push(...innerPaddingClasses);
            if (attrs.customClasses.includes('space-between')) innerDivClassList.push('space-between');
            if (attrs.innerBackgroundColorClass) innerDivClassList.push(attrs.innerBackgroundColorClass);
            if (attrs.innerBackgroundImageNoise) innerDivClassList.push('background-image-noise');
            if (attrs.innerBorderClass) innerDivClassList.push(attrs.innerBorderClass);
            if (attrs.innerBorderRadiusClass) innerDivClassList.push(attrs.innerBorderRadiusClass);
            innerDivClassList.push(...attrs.innerBackdropFilterClasses);
        }
        const innerDivClass = innerDivClassList.join(' ').trim();

        // Combine inner styles
        let innerDivStyle = '';
        if (!isFallback) {
            const combinedStyles = [paddingStyles, attrs.innerStyle].filter(s => s).join('; ').trim();
            innerDivStyle = combinedStyles ? ` style="${combinedStyles}"` : '';
        }

        const contentHTML = `
            <div${innerDivClass ? ` class="${innerDivClass}"` : ''}${innerDivStyle} aria-live="polite">
                <div role="group">
                    <h2>${attrs.heading}</h2>
                    <p>${attrs.description}</p>
                </div>
                <a class="button" href="${attrs.buttonHref || '#'}"${attrs.buttonHref && !isFallback ? '' : ' aria-disabled="true"'}>${attrs.buttonText}</a>
            </div>
        `;

        // Outer div classes
        const mainDivClassList = ['card'];
        if (hasBackgroundImage) mainDivClassList.push('background-image');
        mainDivClassList.push(...customClassList, attrs.backgroundColorClass, attrs.borderClass, attrs.borderRadiusClass);
        const mainDivClass = mainDivClassList.filter(cls => cls).join(' ').trim();

        const cardElement = document.createElement('div');
        cardElement.className = mainDivClass;
        if (outerStyles && !isFallback) {
            cardElement.setAttribute('style', outerStyles);
        }
        if (!isFallback && hasForegroundImage) {
            cardElement.setAttribute('data-foreground-position', attrs.foregroundPosition);
        }

        // Arrange content based on foregroundPosition
        let innerHTML = '';
        if (hasBackgroundImage) {
            innerHTML += backgroundImageHTML || '';
        }
        if (attrs.hasBackgroundOverlay && hasBackgroundImage) {
            innerHTML += overlayHTML;
        }
        if (hasForegroundImage && attrs.foregroundPosition === 'above') {
            innerHTML += foregroundImageHTML || '';
        }
        if (hasForegroundImage && attrs.foregroundPosition === 'left') {
            innerHTML += (foregroundImageHTML || '') + contentHTML;
        } else if (hasForegroundImage && attrs.foregroundPosition === 'right') {
            innerHTML += contentHTML + (foregroundImageHTML || '');
        } else {
            innerHTML += contentHTML;
        }
        if (hasForegroundImage && attrs.foregroundPosition === 'below') {
            innerHTML += foregroundImageHTML || '';
        }

        cardElement.innerHTML = innerHTML;

        // Schema handling for background image
        if (!isFallback && attrs.backgroundIncludeSchema && hasBackgroundImage && backgroundImageHTML) {
            const figure = cardElement.querySelector('figure:not(figure > figure)');
            if (figure) {
                const metaUrl = document.createElement('meta');
                metaUrl.setAttribute('itemprop', 'url');
                metaUrl.setAttribute('content', (attrs.backgroundLightSrc || attrs.backgroundDarkSrc) ? new URL(attrs.backgroundLightSrc || attrs.backgroundDarkSrc, window.location.origin).href : '');
                figure.appendChild(metaUrl);

                const metaDescription = document.createElement('meta');
                metaDescription.setAttribute('itemprop', 'description');
                metaDescription.setAttribute('content', attrs.backgroundAlt);
                figure.appendChild(metaDescription);
            }
        }

        // Schema handling for foreground image
        if (!isFallback && attrs.foregroundIncludeSchema && hasForegroundImage && foregroundImageHTML) {
            const figure = cardElement.querySelector('figure');
            if (figure) {
                const metaUrl = document.createElement('meta');
                metaUrl.setAttribute('itemprop', 'url');
                metaUrl.setAttribute('content', (attrs.foregroundLightSrc || attrs.foregroundDarkSrc) ? new URL(attrs.foregroundLightSrc || attrs.foregroundDarkSrc, window.location.origin).href : '');
                figure.appendChild(metaDescription);
            }
        }

        // Clean up image attributes
        if (!isFallback && cardElement.querySelector('img')) {
            const images = cardElement.querySelectorAll('img');
            images.forEach(img => {
                img.removeAttribute('custom-img-background-light-src');
                img.removeAttribute('custom-img-background-dark-src');
                img.removeAttribute('custom-img-background-alt');
                img.removeAttribute('custom-img-background-decorative');
                img.removeAttribute('custom-img-background-mobile-width');
                img.removeAttribute('custom-img-background-tablet-width');
                img.removeAttribute('custom-img-background-desktop-width');
                img.removeAttribute('custom-img-background-aspect-ratio');
                img.removeAttribute('custom-img-background-include-schema');
                img.removeAttribute('custom-img-background-fetchpriority');
                img.removeAttribute('custom-img-background-loading');
                img.removeAttribute('custom-img-foreground-light-src');
                img.removeAttribute('custom-img-foreground-dark-src');
                img.removeAttribute('custom-img-foreground-alt');
                img.removeAttribute('custom-img-foreground-decorative');
                img.removeAttribute('custom-img-foreground-mobile-width');
                img.removeAttribute('custom-img-foreground-tablet-width');
                img.removeAttribute('custom-img-foreground-desktop-width');
                img.removeAttribute('custom-img-foreground-aspect-ratio');
                img.removeAttribute('custom-img-foreground-include-schema');
                img.removeAttribute('custom-img-foreground-fetchpriority');
                img.removeAttribute('custom-img-foreground-loading');
                img.removeAttribute('custom-img-foreground-position');
            });
        }

        if (!isFallback) {
            this.renderCache = cardElement.cloneNode(true);
            this.lastAttributes = JSON.stringify(attrs);
        }
        return cardElement;
    }

    static get observedAttributes() {
        return [
            'heading', 'description', 'button-href', 'button-text', 'background-overlay', 'background-image-noise', 'backdrop-filter', 'background-color', 'border', 'border-radius', 'class', 'style',
            // Background image attributes
            'custom-img-background-light-src', 'custom-img-background-dark-src', 'custom-img-background-alt', 'custom-img-background-decorative',
            'custom-img-background-mobile-width', 'custom-img-background-tablet-width', 'custom-img-background-desktop-width',
            'custom-img-background-aspect-ratio', 'custom-img-background-include-schema', 'custom-img-background-fetchpriority', 'custom-img-background-loading',
            // Foreground image attributes
            'custom-img-foreground-light-src', 'custom-img-foreground-dark-src', 'custom-img-foreground-alt', 'custom-img-foreground-decorative',
            'custom-img-foreground-mobile-width', 'custom-img-foreground-tablet-width', 'custom-img-foreground-desktop-width',
            'custom-img-foreground-aspect-ratio', 'custom-img-foreground-include-schema', 'custom-img-foreground-fetchpriority', 'custom-img-foreground-loading',
            'custom-img-foreground-position',
            // Inner div attributes
            'inner-background-color', 'inner-background-image-noise', 'inner-border', 'inner-border-radius', 'inner-backdrop-filter', 'inner-style'
        ];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (!this.isInitialized || !this.isVisible) return;
        const criticalAttributes = [
            'heading', 'description', 'button-href', 'button-text', 'background-overlay', 'background-image-noise', 'backdrop-filter',
            'custom-img-background-light-src', 'custom-img-background-dark-src', 'custom-img-background-alt',
            'custom-img-foreground-light-src', 'custom-img-foreground-dark-src', 'custom-img-foreground-alt',
            'custom-img-foreground-position', 'style', 'inner-background-color', 'inner-background-image-noise', 'inner-border', 'inner-border-radius',
            'inner-backdrop-filter', 'inner-style'
        ];
        if (criticalAttributes.includes(name)) {
            this.initialize();
        }
    }
}

try {
    customElements.define('custom-card', CustomCard);
} catch (error) {
    console.error('Error defining CustomCard element:', error);
}
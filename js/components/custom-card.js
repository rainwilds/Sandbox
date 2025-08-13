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
        const fetchPriority = this.getAttribute('img-fetchpriority') || '';
        const validFetchPriorities = ['high', 'low', 'auto', ''];
        if (!validFetchPriorities.includes(fetchPriority)) {
            console.warn(`Invalid img-fetchpriority value "${fetchPriority}" in <custom-card>. Using default.`);
        }

        return {
            heading: this.getAttribute('heading') || 'Default Heading',
            description: this.getAttribute('description') || 'Default description text.',
            buttonHref: this.getAttribute('button-href') || '#',
            buttonText: this.getAttribute('button-text') || 'Button',
            hasBackgroundOverlay: this.hasAttribute('background-overlay'),
            backgroundColorClass: this.hasAttribute('background-color') ? this.getAttribute('background-color') : '',
            borderClass: this.hasAttribute('border') ? this.getAttribute('border') : '',
            borderRadiusClass: this.hasAttribute('border-radius') && this.hasAttribute('border') ? this.getAttribute('border-radius') : '',
            backdropFilterClass: this.hasAttribute('backdrop-filter') ? this.getAttribute('backdrop-filter') : '',
            customClasses: this.getAttribute('class') || '',
            styleAttribute: this.getAttribute('style') || '',
            lightSrc: this.getAttribute('img-light-src') || '',
            darkSrc: this.getAttribute('img-dark-src') || '',
            alt: this.getAttribute('img-alt') || '',
            isDecorative: this.hasAttribute('img-decorative'),
            mobileWidth: this.getAttribute('img-mobile-width') || '100vw',
            tabletWidth: this.getAttribute('img-tablet-width') || '100vw',
            desktopWidth: this.getAttribute('img-desktop-width') || '100vw',
            aspectRatio: this.getAttribute('img-aspect-ratio') || '',
            includeSchema: this.hasAttribute('img-include-schema'),
            fetchPriority: validFetchPriorities.includes(fetchPriority) ? fetchPriority : '',
            loading: this.getAttribute('img-loading') || 'lazy'
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
            backgroundColorClass: '',
            borderClass: '',
            borderRadiusClass: '',
            backdropFilterClass: '',
            customClasses: '',
            styleAttribute: '',
            lightSrc: '',
            darkSrc: '',
            alt: '',
            isDecorative: false,
            mobileWidth: '100vw',
            tabletWidth: '100vw',
            desktopWidth: '100vw',
            aspectRatio: '',
            includeSchema: false,
            fetchPriority: '',
            loading: 'lazy'
        } : this.getAttributes();

        if (!attrs.alt && !attrs.isDecorative && (attrs.lightSrc || attrs.darkSrc)) {
            console.warn(`<custom-card img-light-src="${attrs.lightSrc || 'not provided'}" img-dark-src="${attrs.darkSrc || 'not provided'}"> is missing an img-alt attribute for accessibility.`);
        }

        let backgroundImageHTML = '';
        let overlayHTML = '';
        const hasBackgroundImage = !isFallback && !!(attrs.lightSrc || attrs.darkSrc);
        if (hasBackgroundImage) {
            const src = attrs.lightSrc || attrs.darkSrc;
            if (!src) {
                console.warn('No valid image source provided for <custom-card>. Skipping image rendering.');
            } else {
                backgroundImageHTML = generatePictureMarkup({
                    src,
                    lightSrc: attrs.lightSrc,
                    darkSrc: attrs.darkSrc,
                    alt: attrs.alt,
                    isDecorative: attrs.isDecorative,
                    mobileWidth: attrs.mobileWidth,
                    tabletWidth: attrs.tabletWidth,
                    desktopWidth: attrs.desktopWidth,
                    aspectRatio: attrs.aspectRatio,
                    includeSchema: attrs.includeSchema,
                    customClasses: '',
                    loading: attrs.loading,
                    fetchPriority: attrs.fetchPriority,
                    onerror: `this.src='https://placehold.co/3000x2000';${attrs.isDecorative ? '' : `this.alt='${attrs.alt || 'Placeholder image'}';`}this.onerror=null;`
                });
                if (!backgroundImageHTML) {
                    console.warn('Failed to generate picture markup for <custom-card>.');
                }
            }
        }

        if (!isFallback && attrs.hasBackgroundOverlay) {
            overlayHTML = `<div class="background-overlay ${attrs.backdropFilterClass}"></div>`;
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

        // Outer div classes (exclude padding classes)
        const mainDivClassList = ['card'];
        if (hasBackgroundImage) mainDivClassList.push('background-image');
        mainDivClassList.push(...customClassList, attrs.backgroundColorClass, attrs.borderClass, attrs.borderRadiusClass);
        const mainDivClass = mainDivClassList.filter(cls => cls).join(' ').trim();

        // Inner div classes (include padding and space-between classes)
        const innerDivClassList = [];
        if (!isFallback) {
            innerDivClassList.push(...innerPaddingClasses);
            if (attrs.customClasses.includes('space-between')) innerDivClassList.push('space-between');
        }
        const innerDivClass = innerDivClassList.join(' ').trim();

        // Combine padding styles with any existing inner div styles
        const innerDivStyle = paddingStyles ? ` style="${paddingStyles}"` : '';

        const contentHTML = `
            <div${innerDivClass ? ` class="${innerDivClass}"` : ''}${innerDivStyle} aria-live="polite">
                <div role="group">
                    <h2>${attrs.heading}</h2>
                    <p>${attrs.description}</p>
                </div>
                <a class="button" href="${attrs.buttonHref || '#'}"${attrs.buttonHref && !isFallback ? '' : ' aria-disabled="true"'}>${attrs.buttonText}</a>
            </div>
        `;

        const cardElement = document.createElement('div');
        cardElement.className = mainDivClass;
        if (outerStyles && !isFallback) {
            cardElement.setAttribute('style', outerStyles);
        }
        cardElement.innerHTML = `
            ${isFallback ? '' : (backgroundImageHTML || '')}
            ${isFallback ? '' : overlayHTML}
            ${contentHTML}
        `;

        if (!isFallback && attrs.includeSchema && hasBackgroundImage && backgroundImageHTML) {
            const figure = cardElement.querySelector('figure');
            if (figure) {
                const metaUrl = document.createElement('meta');
                metaUrl.setAttribute('itemprop', 'url');
                metaUrl.setAttribute('content', (attrs.lightSrc || attrs.darkSrc) ? new URL(attrs.lightSrc || attrs.darkSrc, window.location.origin).href : '');
                figure.appendChild(metaUrl);

                const metaDescription = document.createElement('meta');
                metaDescription.setAttribute('itemprop', 'description');
                metaDescription.setAttribute('content', attrs.alt);
                figure.appendChild(metaDescription);
            }
        }

        if (!isFallback && cardElement.querySelector('img')) {
            cardElement.querySelector('img').removeAttribute('img-light-src');
            cardElement.querySelector('img').removeAttribute('img-dark-src');
            cardElement.querySelector('img').removeAttribute('img-aspect-ratio');
            cardElement.querySelector('img').removeAttribute('img-mobile-width');
            cardElement.querySelector('img').removeAttribute('img-tablet-width');
            cardElement.querySelector('img').removeAttribute('img-desktop-width');
            cardElement.querySelector('img').removeAttribute('img-include-schema');
            cardElement.querySelector('img').removeAttribute('img-fetchpriority');
            cardElement.querySelector('img').removeAttribute('img-loading');
            cardElement.querySelector('img').removeAttribute('img-decorative');
        }

        if (!isFallback) {
            this.renderCache = cardElement.cloneNode(true);
            this.lastAttributes = JSON.stringify(attrs);
        }
        return cardElement;
    }

    static get observedAttributes() {
        return [
            'heading', 'description', 'button-href', 'button-text', 'background-overlay', 'background-color', 'border', 'border-radius', 'backdrop-filter', 'class', 'style',
            'img-light-src', 'img-dark-src', 'img-alt', 'img-decorative', 'img-mobile-width', 'img-tablet-width', 'img-desktop-width', 'img-aspect-ratio', 'img-include-schema', 'img-fetchpriority', 'img-loading'
        ];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (!this.isInitialized || !this.isVisible) return;
        const criticalAttributes = ['heading', 'description', 'button-href', 'button-text', 'img-light-src', 'img-dark-src', 'img-alt', 'style'];
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
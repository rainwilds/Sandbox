import { generatePictureMarkup } from '../picture-generator.js';

class CustomCard extends HTMLElement {
    constructor() {
        super();
        this.isVisible = false;
        this.isInitialized = false;
        this.callbacks = [];
        // Set up IntersectionObserver for lazy loading
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                this.isVisible = true;
                observer.disconnect();
                if (!this.isInitialized) {
                    this.connectedCallback();
                }
            }
        }, { rootMargin: '50px' });
        observer.observe(this);
    }

    connectedCallback() {
        if (this.isInitialized || !this.isVisible) return;
        this.isInitialized = true;

        try {
            const cardElement = this.render();
            this.replaceWith(cardElement);
            this.callbacks.forEach(callback => callback());
        } catch (error) {
            console.error('Error in CustomCard connectedCallback:', error);
            this.replaceWith(this.renderFallback());
        }
    }

    disconnectedCallback() {
        this.callbacks = [];
        this.isInitialized = false; // Reset flag on disconnect
    }

    addCallback(callback) {
        this.callbacks.push(callback);
    }

    render() {
        // Get attributes
        const heading = this.getAttribute('heading') || 'Default Heading';
        const description = this.getAttribute('description') || 'Default description text.';
        const buttonHref = this.getAttribute('button-href') || '#';
        const buttonText = this.getAttribute('button-text') || 'Button';
        const hasBackgroundOverlay = this.hasAttribute('background-overlay');
        const hasBackgroundColor = this.hasAttribute('background-color');
        const backgroundColorClass = hasBackgroundColor ? this.getAttribute('background-color') : '';
        const hasBorder = this.hasAttribute('border');
        const borderClass = hasBorder ? this.getAttribute('border') : '';
        const hasBorderRadius = this.hasAttribute('border-radius');
        const borderRadiusClass = hasBorderRadius && hasBorder ? this.getAttribute('border-radius') : '';
        const hasBackdropFilter = this.hasAttribute('backdrop-filter');
        const backdropFilterClass = hasBackdropFilter ? this.getAttribute('backdrop-filter') : '';
        const customClasses = this.getAttribute('class') || '';
        const styleAttribute = this.getAttribute('style') || '';
        const minHeight = this.getAttribute('min-height') || '';
        // Image attributes
        const lightSrc = this.getAttribute('image-light-src') || '';
        const darkSrc = this.getAttribute('image-dark-src') || '';
        const alt = this.getAttribute('image-alt') || '';
        const isDecorative = this.hasAttribute('image-decorative');
        const mobileWidth = this.getAttribute('image-mobile-width') || '100vw';
        const tabletWidth = this.getAttribute('image-tablet-width') || '100vw';
        const desktopWidth = this.getAttribute('image-desktop-width') || '100vw';
        const aspectRatio = this.getAttribute('image-aspect-ratio') || '';
        const includeSchema = this.hasAttribute('image-include-schema');
        const fetchPriority = this.getAttribute('image-fetchpriority') || '';
        const loading = this.getAttribute('image-loading') || 'lazy';

        // Accessibility warning for missing alt text
        if (!alt && !isDecorative && (lightSrc || darkSrc)) {
            console.warn(`<custom-card image-light-src="${lightSrc || 'not provided'}" image-dark-src="${darkSrc || 'not provided'}"> is missing an image-alt attribute for accessibility.`);
        }

        // Build the card with optional background image
        let backgroundImageHTML = '';
        let overlayHTML = '';
        const hasBackgroundImage = !!(lightSrc || darkSrc);
        if (hasBackgroundImage) {
            const src = lightSrc || darkSrc;
            if (!src) {
                console.warn('No valid image source provided for <custom-card>. Skipping image rendering.');
            } else {
                backgroundImageHTML = generatePictureMarkup({
                    src,
                    lightSrc,
                    darkSrc,
                    alt,
                    isDecorative,
                    mobileWidth,
                    tabletWidth,
                    desktopWidth,
                    aspectRatio,
                    includeSchema,
                    customClasses: '',
                    loading,
                    fetchPriority
                });
                if (!backgroundImageHTML) {
                    console.warn('Failed to generate picture markup for <custom-card>.');
                }
            }
        }

        // Add the background-overlay div with only the class if attribute is present
        if (hasBackgroundOverlay) {
            overlayHTML = `<div class="background-overlay ${backdropFilterClass}"></div>`;
        }

        // Determine the main div class and content structure
        let mainDivClass = 'card';
        if (hasBackgroundImage) mainDivClass += ' background-image';
        mainDivClass += ` ${customClasses} ${backgroundColorClass} ${borderClass} ${borderRadiusClass}`;

        // Deduplicate classes
        mainDivClass = [...new Set(mainDivClass.split(' '))].join(' ').trim();

        // Check if 'space-between' and 'padding-medium' are in the classes attribute
        const classList = customClasses.split(' ').filter(cls => cls.length > 0);
        const hasSpaceBetween = classList.includes('space-between');
        const hasPaddingMedium = classList.includes('padding-medium');
        const innerDivClasses = [];
        if (hasPaddingMedium) innerDivClasses.push('padding-medium');
        if (hasSpaceBetween) innerDivClasses.push('space-between');
        const innerDivClass = innerDivClasses.length > 0 ? innerDivClasses.join(' ') : '';

        const contentHTML = hasBackgroundImage
            ? `
                <div${innerDivClass ? ` class="${innerDivClass}"` : ''}>
                    <hgroup>
                        <h2>${heading}</h2>
                        <p>${description}</p>
                    </hgroup>
                    <a class="button" href="${buttonHref}">${buttonText}</a>
                </div>
            `
            : `
                <hgroup>
                    <h2>${heading}</h2>
                    <p>${description}</p>
                </hgroup>
                <a class="button" href="${buttonHref}">${buttonText}</a>
            `;

        // Create the card element
        const cardElement = document.createElement('div');
        cardElement.className = mainDivClass;
        // Combine styleAttribute and minHeight into a single style attribute
        let combinedStyle = styleAttribute;
        if (minHeight) {
            combinedStyle = combinedStyle ? `${styleAttribute}; min-height: ${minHeight}` : `min-height: ${minHeight}`;
        }
        if (combinedStyle) {
            cardElement.setAttribute('style', combinedStyle);
        }
        cardElement.innerHTML = `
            ${backgroundImageHTML || ''}
            ${overlayHTML}
            ${contentHTML}
        `;

        // Add onerror to the background image for fallback
        const backgroundImg = cardElement.querySelector('img');
        if (backgroundImg) {
            backgroundImg.onerror = () => {
                console.warn(`Failed to load image: ${lightSrc || darkSrc}. Falling back to placeholder.`);
                backgroundImg.src = 'https://placehold.co/3000x2000';
                if (!isDecorative) backgroundImg.alt = alt || 'Placeholder image';
                backgroundImg.onerror = null;
            };
        }

        // Add schema meta if includeSchema and image is present
        if (includeSchema && hasBackgroundImage && backgroundImageHTML) {
            const figure = cardElement.querySelector('figure');
            if (figure) {
                const metaUrl = document.createElement('meta');
                metaUrl.setAttribute('itemprop', 'url');
                metaUrl.setAttribute('content', (lightSrc || darkSrc) ? new URL(lightSrc || darkSrc, window.location.origin).href : '');
                figure.appendChild(metaUrl);

                const metaDescription = document.createElement('meta');
                metaDescription.setAttribute('itemprop', 'description');
                metaDescription.setAttribute('content', alt);
                figure.appendChild(metaDescription);
            }
        }

        // Clean up background image attributes if rendered
        if (backgroundImg) {
            backgroundImg.removeAttribute('image-light-src');
            backgroundImg.removeAttribute('image-dark-src');
            backgroundImg.removeAttribute('image-aspect-ratio');
            backgroundImg.removeAttribute('image-mobile-width');
            backgroundImg.removeAttribute('image-tablet-width');
            backgroundImg.removeAttribute('image-desktop-width');
            backgroundImg.removeAttribute('image-include-schema');
            backgroundImg.removeAttribute('image-fetchpriority');
            backgroundImg.removeAttribute('image-loading');
            backgroundImg.removeAttribute('image-decorative');
        }

        return cardElement;
    }

    renderFallback() {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.innerHTML = `
            <hgroup>
                <h2>Error</h2>
                <p>Failed to render card. Check console for details.</p>
            </hgroup>
            <a class="button" href="#">Button</a>
        `;
        return cardElement;
    }

    static getEstimatedDimensions(attributes = {}, containerWidth = window.innerWidth) {
        const temp = document.createElement('custom-card');
        for (const [key, value] of Object.entries(attributes)) {
            temp.setAttribute(key, value);
        }
        // Create an offscreen container to simulate the rendering environment
        const offscreen = document.createElement('div');
        offscreen.style.position = 'absolute';
        offscreen.style.left = '-9999px';
        offscreen.style.top = '0';
        offscreen.style.visibility = 'hidden';
        offscreen.style.width = `${containerWidth}px`; // Simulate parent container width
        offscreen.style.overflow = 'hidden'; // Prevent any overflow issues
        offscreen.appendChild(temp);
        document.body.appendChild(offscreen);
        // Force visibility and initialization to render
        temp.isVisible = true;
        temp.connectedCallback();
        // After replaceWith, the rendered card is now in offscreen
        const renderedCard = offscreen.querySelector('.card');
        const width = renderedCard ? renderedCard.offsetWidth : 0;
        const height = renderedCard ? renderedCard.offsetHeight : 0;
        // Clean up
        offscreen.remove();
        return { width, height };
    }

    static get observedAttributes() {
        return [
            'heading', 'description', 'button-href', 'button-text', 'background-overlay', 'background-color', 'border', 'border-radius', 'backdrop-filter', 'class', 'style',
            'image-light-src', 'image-dark-src', 'image-alt', 'image-decorative', 'image-mobile-width', 'image-tablet-width', 'image-desktop-width', 'image-aspect-ratio', 'image-include-schema', 'image-fetchpriority', 'image-loading', 'min-height'
        ];
    }

    attributeChangedCallback() {
        if (this.isInitialized || !this.isVisible) return;
        this.connectedCallback();
    }
}

// Register the custom element
try {
    customElements.define('custom-card', CustomCard);
} catch (error) {
    console.error('Error defining CustomCard element:', error);
}
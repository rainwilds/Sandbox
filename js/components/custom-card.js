import { generatePictureMarkup } from '../picture-generator.js';

class CustomCard extends HTMLDivElement {
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
            this.render();
            this.callbacks.forEach(callback => callback());
        } catch (error) {
            console.error('Error in CustomCard connectedCallback:', error);
            this.renderFallback();
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
        try {
            // Get attributes
            const heading = this.getAttribute('heading') || 'Default Heading';
            const description = this.getAttribute('description') || 'Default description text.';
            const buttonHref = this.getAttribute('button-href') || '#';
            const buttonText = this.getAttribute('button-text') || 'Button';
            const hasBackgroundOverlay = this.hasAttribute('background-overlay');
            const backgroundOverlayColor = this.getAttribute('background-overlay') || 'light-dark(var(--color-static-light-4), var(--color-static-dark-2))';
            const hasBackgroundColor = this.hasAttribute('background-color');
            const backgroundColorClass = hasBackgroundColor ? this.getAttribute('background-color') : '';
            const hasBorder = this.hasAttribute('border');
            const borderClass = hasBorder ? this.getAttribute('border') : '';
            const hasBorderRadius = this.hasAttribute('border-radius');
            const borderRadiusClass = hasBorderRadius && hasBorder ? this.getAttribute('border-radius') : '';
            const hasBackdropFilter = this.hasAttribute('backdrop-filter');
            const backdropFilterClass = hasBackdropFilter ? this.getAttribute('backdrop-filter') : '';
            const classes = this.getAttribute('class') || '';
            // Image attributes
            const imgSrc = this.getAttribute('image-src') || '';
            const lightSrc = this.getAttribute('image-light-src') || '';
            const darkSrc = this.getAttribute('image-dark-src') || '';
            const alt = this.getAttribute('image-alt') || '';
            const width = this.getAttribute('image-width') || '100vw';
            const aspectRatio = this.getAttribute('image-aspect-ratio') || '';
            const isDecorative = this.hasAttribute('image-is-decorative');
            const mobileWidth = this.getAttribute('image-mobile-width') || '100vw';
            const tabletWidth = this.getAttribute('image-tablet-width') || '100vw';
            const desktopWidth = this.getAttribute('image-desktop-width') || '100vw';
            const loading = this.getAttribute('image-loading') || 'lazy';
            const fetchPriority = this.getAttribute('image-fetch-priority') || 'auto';
            const objectFit = this.getAttribute('image-object-fit') || 'cover';
            const objectPosition = this.getAttribute('image-object-position') || 'center';
            const includeSchema = this.hasAttribute('image-include-schema');
            // Video attributes
            const videoSrc = this.getAttribute('video-src') || '';
            const videoSrcLight = this.getAttribute('video-src-light') || '';
            const videoSrcDark = this.getAttribute('video-src-dark') || '';
            const videoPoster = this.getAttribute('video-poster') || '';
            const videoPosterLight = this.getAttribute('video-poster-light') || '';
            const videoPosterDark = this.getAttribute('video-poster-dark') || '';
            const videoAlt = this.getAttribute('video-alt') || 'Background video';
            const videoLoading = this.getAttribute('video-loading') || 'lazy';
            const videoAutoplay = this.hasAttribute('video-autoplay') ? this.getAttribute('video-autoplay') !== 'false' : true;
            const videoMuted = this.hasAttribute('video-muted') ? this.getAttribute('video-muted') !== 'false' : true;
            const videoLoop = this.hasAttribute('video-loop') ? this.getAttribute('video-loop') !== 'false' : true;
            const videoPlaysinline = this.hasAttribute('video-playsinline') ? this.getAttribute('video-playsinline') !== 'false' : true;
            const videoDisablePictureInPicture = this.hasAttribute('video-disablepictureinpicture') ? this.getAttribute('video-disablepictureinpicture') !== 'false' : false;

            // Accessibility warning for missing alt text
            if (!alt && !isDecorative && imgSrc) {
                console.warn(`<custom-card image-src="${imgSrc || 'not provided'}"> is missing an image-alt attribute for accessibility.`);
            }

            // Build the card with optional background image
            let backgroundImageHTML = '';
            let overlayHTML = '';
            const hasBackgroundImage = !!imgSrc;
            if (hasBackgroundImage) {
                const src = imgSrc || lightSrc || darkSrc;
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
                        fetchPriority,
                        objectFit,
                        objectPosition
                    });
                    if (!backgroundImageHTML) {
                        console.warn('Failed to generate picture markup for <custom-card>.');
                    }
                }
            }

            // Build the card with optional background video
            let backgroundVideoHTML = '';
            const hasBackgroundVideo = !!videoSrc;
            if (hasBackgroundVideo) {
                backgroundVideoHTML = `<bh-video src="${videoSrc}"`;
                if (videoSrcLight) backgroundVideoHTML += ` src-light="${videoSrcLight}"`;
                if (videoSrcDark) backgroundVideoHTML += ` src-dark="${videoSrcDark}"`;
                if (videoPoster) backgroundVideoHTML += ` poster="${videoPoster}"`;
                if (videoPosterLight) backgroundVideoHTML += ` poster-light="${videoPosterLight}"`;
                if (videoPosterDark) backgroundVideoHTML += ` poster-dark="${videoPosterDark}"`;
                backgroundVideoHTML += ` alt="${videoAlt}" loading="${videoLoading}"`;
                if (videoAutoplay) backgroundVideoHTML += ` autoplay`;
                if (videoMuted) backgroundVideoHTML += ` muted`;
                if (videoLoop) backgroundVideoHTML += ` loop`;
                if (videoPlaysinline) backgroundVideoHTML += ` playsinline`;
                if (videoDisablePictureInPicture) backgroundVideoHTML += ` disablepictureinpicture`;
                backgroundVideoHTML += `></bh-video>`;
            }

            // Add the background-overlay div only if the attribute is present
            if (hasBackgroundOverlay) {
                overlayHTML = `<div class="background-overlay ${backdropFilterClass}" style="background-color: ${backgroundOverlayColor};"></div>`;
            }

            // Determine the main div class and content structure
            let mainDivClass = 'card';
            if (hasBackgroundImage) mainDivClass += ' background-image';
            if (hasBackgroundVideo) mainDivClass += ' background-video';
            mainDivClass += ` ${classes} ${backgroundColorClass} ${borderClass} ${borderRadiusClass}`;

            // Deduplicate classes
            mainDivClass = [...new Set(mainDivClass.split(' '))].join(' ').trim();

            // Check if 'space-between' and 'padding-medium' are in the classes attribute
            const classList = classes.split(' ').filter(cls => cls.length > 0);
            const hasSpaceBetween = classList.includes('space-between');
            const hasPaddingMedium = classList.includes('padding-medium');
            const innerDivClasses = [];
            if (hasPaddingMedium) innerDivClasses.push('padding-medium');
            if (hasSpaceBetween) innerDivClasses.push('space-between');
            const innerDivClass = innerDivClasses.length > 0 ? innerDivClasses.join(' ') : '';

            const contentHTML = (hasBackgroundImage || hasBackgroundVideo)
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

            // Set the class and innerHTML directly on this (the div)
            this.className = mainDivClass;
            this.innerHTML = `
                ${backgroundImageHTML || ''}
                ${backgroundVideoHTML || ''}
                ${overlayHTML}
                ${contentHTML}
            `;

            // Add onerror to the background image for fallback
            const backgroundImg = this.querySelector('img');
            if (backgroundImg) {
                backgroundImg.onerror = () => {
                    console.warn(`Failed to load image: ${imgSrc || lightSrc || darkSrc}. Falling back to placeholder.`);
                    backgroundImg.src = 'https://placehold.co/3000x2000';
                    if (!isDecorative) backgroundImg.alt = alt || 'Placeholder image';
                    backgroundImg.onerror = null;
                };
            }

            // Add schema meta if includeSchema and image is present
            if (includeSchema && hasBackgroundImage && backgroundImageHTML) {
                const figure = this.querySelector('figure');
                if (figure) {
                    const metaUrl = document.createElement('meta');
                    metaUrl.setAttribute('itemprop', 'url');
                    metaUrl.setAttribute('content', imgSrc ? new URL(imgSrc, window.location.origin).href : '');
                    figure.appendChild(metaUrl);

                    const metaDescription = document.createElement('meta');
                    metaDescription.setAttribute('itemprop', 'description');
                    metaDescription.setAttribute('content', alt);
                    figure.appendChild(metaDescription);
                }
            }

            // Clean up background image attributes if rendered
            if (backgroundImg) {
                backgroundImg.removeAttribute('light-src');
                backgroundImg.removeAttribute('dark-src');
                backgroundImg.removeAttribute('aspect-ratio');
                backgroundImg.removeAttribute('mobile-width');
                backgroundImg.removeAttribute('tablet-width');
                backgroundImg.removeAttribute('desktop-width');
                backgroundImg.removeAttribute('include-schema');
            }
        } catch (error) {
            console.error('Error rendering CustomCard:', error);
            this.renderFallback();
        }
    }

    renderFallback() {
        this.className = 'card';
        this.innerHTML = `
            <hgroup>
                <h2>Error</h2>
                <p>Failed to render card. Check console for details.</p>
            </hgroup>
            <a class="button" href="#">Button</a>
        `;
    }

    static get observedAttributes() {
        return [
            'heading', 'description', 'button-href', 'button-text', 'background-overlay', 'background-color', 'border', 'border-radius', 'backdrop-filter', 'class',
            'image-src', 'image-light-src', 'image-dark-src', 'image-alt', 'image-width', 'image-aspect-ratio', 'image-is-decorative', 'image-mobile-width', 'image-tablet-width', 'image-desktop-width', 'image-loading', 'image-fetch-priority', 'image-object-fit', 'image-object-position', 'image-include-schema',
            'video-src', 'video-src-light', 'video-src-dark', 'video-poster', 'video-poster-light', 'video-poster-dark', 'video-alt', 'video-loading', 'video-autoplay', 'video-muted', 'video-loop', 'video-playsinline', 'video-disablepictureinpicture'
        ];
    }

    attributeChangedCallback() {
        if (this.isInitialized || !this.isVisible) return;
        this.connectedCallback();
    }
}

// Register the custom element
try {
    customElements.define('custom-card', CustomCard, { extends: 'div' });
} catch (error) {
    console.error('Error defining CustomCard element:', error);
}
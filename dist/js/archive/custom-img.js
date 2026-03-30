import { generatePictureMarkup } from '../picture-generator.js';

class CustomImg extends HTMLElement {
    constructor() {
        super();
        this.isVisible = false;
        this.isInitialized = false;
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
            // Extract attributes
            const lightSrc = this.getAttribute('light-src') || '';
            const darkSrc = this.getAttribute('dark-src') || '';
            const alt = this.getAttribute('alt') || '';
            const isDecorative = this.hasAttribute('decorative');
            const mobileWidth = this.getAttribute('mobile-width') || '100vw';
            const tabletWidth = this.getAttribute('tablet-width') || '100vw';
            const desktopWidth = this.getAttribute('desktop-width') || '100vw';
            const aspectRatio = this.getAttribute('aspect-ratio') || '';
            const customClasses = this.getAttribute('class') || '';
            const includeSchema = this.hasAttribute('include-schema');
            const fetchPriority = this.getAttribute('fetchpriority') || '';
            const loading = this.getAttribute('loading') || 'lazy';

            // Accessibility warning
            if (!alt && !isDecorative) {
                console.warn(`<custom-img light-src="${lightSrc || 'not provided'}" dark-src="${darkSrc || 'not provided'}"> is missing an alt attribute for accessibility.`);
            }

            // Fallback for missing sources
            if (!lightSrc && !darkSrc) {
                console.error('No source attribute (light-src or dark-src) provided for <custom-img>. Using fallback.');
                this.replaceWith(this.createFallbackImg(customClasses, alt, isDecorative, loading, fetchPriority));
                return;
            }

            const src = lightSrc || darkSrc;
            const pictureHTML = generatePictureMarkup({
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
                customClasses,
                loading,
                fetchPriority
            });

            if (!pictureHTML) {
                this.replaceWith(this.createFallbackImg(customClasses, alt, isDecorative, loading, fetchPriority));
                return;
            }

            // Parse and insert the generated HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = pictureHTML;
            const generatedElement = tempDiv.firstChild;

            // Add onerror to the img for fallback
            const img = generatedElement.querySelector('img') || generatedElement.querySelector('figure picture img');
            if (img) {
                img.onerror = () => {
                    console.warn(`Failed to load image: ${src}. Falling back to placeholder.`);
                    img.src = 'https://placehold.co/3000x2000';
                    if (!isDecorative) img.alt = alt || 'Placeholder image';
                    img.onerror = null;
                };
            }

            // Add schema meta if includeSchema
            if (includeSchema && generatedElement.tagName === 'FIGURE') {
                const metaUrl = document.createElement('meta');
                metaUrl.setAttribute('itemprop', 'url');
                metaUrl.setAttribute('content', src ? new URL(src, window.location.origin).href : '');
                generatedElement.appendChild(metaUrl);

                const metaDescription = document.createElement('meta');
                metaDescription.setAttribute('itemprop', 'description');
                metaDescription.setAttribute('content', alt);
                generatedElement.appendChild(metaDescription);
            }

            this.replaceWith(generatedElement);
        } catch (error) {
            console.error('Error in CustomImg connectedCallback:', error);
            this.replaceWith(this.createFallbackImg(customClasses, alt, isDecorative, loading, fetchPriority));
        }
    }

    createFallbackImg(customClasses, alt, isDecorative, loading, fetchPriority) {
        const img = document.createElement('img');
        img.src = 'https://placehold.co/3000x2000';
        img.alt = isDecorative ? '' : alt || 'Placeholder image';
        img.className = customClasses;
        if (loading) img.setAttribute('loading', loading);
        if (fetchPriority) img.setAttribute('fetchpriority', fetchPriority);
        return img;
    }
}

customElements.define('custom-img', CustomImg);
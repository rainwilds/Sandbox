class Img extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        // Add role to custom element before replacement
        this.setAttribute('role', 'img');

        this.waitForImageUtils(() => {
            try {
                const src = this.getAttribute('src');
                const lightSrc = this.getAttribute('light-src');
                const darkSrc = this.getAttribute('dark-src');
                const alt = this.getAttribute('alt') || '';
                const isDecorative = this.hasAttribute('decorative');
                if (!alt && !isDecorative) {
                    console.warn(`<bh-img src="${src}"> is missing an alt attribute for accessibility. Use alt="" if decorative, or add decorative attribute.`);
                }
                const aspectRatio = this.getAttribute('aspect-ratio') || '';
                const mobileWidth = this.getAttribute('mobile-width') || '100vw';
                const tabletWidth = this.getAttribute('tablet-width') || '100vw';
                const desktopWidth = this.getAttribute('desktop-width') || '100vw';
                const customClasses = this.getAttribute('class') || '';
                const loading = this.getAttribute('loading') || null;
                const fetchpriority = this.getAttribute('fetch-priority') || null;
                if (fetchpriority && !['high', 'low', 'auto'].includes(fetchpriority)) {
                    console.warn(`Invalid fetch-priority value "${fetchpriority}" in <bh-img>. Use 'high', 'low', or 'auto'.`);
                }
                const fallbackSrc = this.getAttribute('fallback-src') || 'https://placehold.co/3000x2000';
                const objectFit = this.getAttribute('object-fit') || null;
                const objectPosition = this.getAttribute('object-position') || null;
                const includeSchema = this.hasAttribute('include-schema');
                const caption = this.getAttribute('caption') || null;
                const schemaUrl = this.getAttribute('schema-url') || (src ? new URL(src, window.location.origin).href : '');
                const schemaDescription = this.getAttribute('schema-description') || (isDecorative ? '' : alt);

                if (typeof ImageUtils === 'undefined') {
                    console.error('ImageUtils is not defined. Ensure image-utils.js is loaded before components.js');
                    return;
                }

                const pictureHTML = ImageUtils.generatePictureMarkup({
                    src,
                    lightSrc,
                    darkSrc,
                    alt,
                    isDecorative,
                    mobileWidth,
                    tabletWidth,
                    desktopWidth,
                    aspectRatio,
                    loading,
                    'fetch-priority': fetchpriority,
                    objectFit,
                    objectPosition,
                    includeSchema
                });

                if (!pictureHTML) {
                    return;
                }

                const div = document.createElement('div');
                div.innerHTML = pictureHTML;
                const picture = div.firstChild;

                const img = picture.querySelector('img');
                if (customClasses) {
                    img.className = img.className ? `${img.className} ${customClasses}`.trim() : customClasses;
                }

                if (objectFit) {
                    img.classList.add(`object-fit-${objectFit}`);
                }
                if (objectPosition) {
                    img.style.objectPosition = objectPosition;
                }

                img.onerror = () => {
                    console.warn(`Failed to load primary image: ${src}. Falling back to ${fallbackSrc}.`);
                    img.src = fallbackSrc;
                    if (!isDecorative) {
                        img.setAttribute('alt', alt || 'Placeholder image');
                    }
                    img.onerror = null;
                };

                // Wrap in <figure> with schema.org markup if include-schema is present
                let finalElement = picture;
                if (includeSchema) {
                    const figure = document.createElement('figure');
                    figure.setAttribute('itemscope', '');
                    figure.setAttribute('itemtype', 'https://schema.org/ImageObject');
                    figure.appendChild(picture);
                    if (caption) {
                        const figcaption = document.createElement('figcaption');
                        figcaption.setAttribute('itemprop', 'caption');
                        figcaption.textContent = caption;
                        figure.appendChild(figcaption);
                    }
                    const metaUrl = document.createElement('meta');
                    metaUrl.setAttribute('itemprop', 'url');
                    metaUrl.setAttribute('content', schemaUrl || '');
                    figure.appendChild(metaUrl);
                    const metaDescription = document.createElement('meta');
                    metaDescription.setAttribute('itemprop', 'description');
                    metaDescription.setAttribute('content', schemaDescription || '');
                    figure.appendChild(metaDescription);
                    finalElement = figure;
                }

                this.replaceWith(finalElement);
            } catch (error) {
                console.error('Error in Img connectedCallback:', error);
            }
        });
    }

    waitForImageUtils(callback) {
        if (typeof ImageUtils !== 'undefined') {
            callback();
            return;
        }
        const interval = setInterval(() => {
            if (typeof ImageUtils !== 'undefined') {
                clearInterval(interval);
                callback();
            }
        }, 100);
        setTimeout(() => {
            clearInterval(interval);
            console.error('Timed out waiting for ImageUtils to be defined. Ensure image-shared.js is loaded correctly.');
            callback();
        }, 5000);
    }
}

customElements.define('bh-img', Img);
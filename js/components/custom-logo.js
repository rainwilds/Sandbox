/* global HTMLElement, document, window, matchMedia, ResizeObserver, console */
class CustomLogo extends HTMLElement {
    constructor() {
        super();
        this.isInitialized = false;
        // Add this instance to the shared tracking set
        CustomLogo.#instances.add(this);
        // Observe this instance for size changes
        CustomLogo.#resizeObserver.observe(this);
    }

    // Static properties for shared listeners
    static #instances = new WeakSet();
    static #resizeObserver = new ResizeObserver(entries => {
        entries.forEach(entry => {
            const instance = entry.target;
            if (instance instanceof CustomLogo && CustomLogo.#instances.has(instance)) {
                instance.updateSizeStyles(entry.contentRect);
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

    // Initialize the shared theme listener only once
    static {
        CustomLogo.#prefersColorScheme.addEventListener('change', CustomLogo.#themeChangeListener);
    }

    // Constants for responsive image generation
    static #WIDTHS = [32, 64, 128, 256, 512];
    static #FORMATS = ['webp', 'png'];

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
                console.error('Failed to render CustomLogo: logoElement is null or invalid.', this.outerHTML);
                this.replaceWith(this.render(true));
            }
        } catch (error) {
            console.error('Error initializing CustomLogo:', error, this.outerHTML);
            this.replaceWith(this.render(true));
        }
        console.log('** CustomLogo end...');
    }

    updateTheme() {
        const isDark = CustomLogo.#prefersColorScheme.matches;
        const src = isDark ? this.getAttribute('src-dark') || this.getAttribute('src') : this.getAttribute('src-light') || this.getAttribute('src');
        if (src) {
            const img = this.querySelector('img');
            if (img && img.src !== src) {
                img.src = src;
            }
        }
    }

    updateSizeStyles(contentRect) {
        const width = contentRect.width;
        const heightAttr = this.getAttribute('height');
        const widthAttr = this.getAttribute('width');
        const style = this.querySelector('img')?.style || {};
        if (widthAttr && heightAttr) {
            style.width = `${widthAttr}px`;
            style.height = `${heightAttr}px`;
        } else if (width < 100) {
            style.width = '32px';
            style.height = 'auto';
        } else if (width < 200) {
            style.width = '64px';
            style.height = 'auto';
        } else {
            style.width = '128px';
            style.height = 'auto';
        }
    }

    getAttributes() {
        const src = this.getAttribute('src') || '';
        const srcLight = this.getAttribute('src-light') || src;
        const srcDark = this.getAttribute('src-dark') || src;
        const alt = this.getAttribute('alt') || 'Logo';
        const isDecorative = this.hasAttribute('decorative');
        const width = this.getAttribute('width') || '';
        const height = this.getAttribute('height') || '';
        const customClasses = this.getAttribute('class') || '';

        if (!alt && !isDecorative && (src || srcLight || srcDark)) {
            console.warn(`<custom-logo src="${src || 'not provided'}" src-light="${srcLight || 'not provided'}" src-dark="${srcDark || 'not provided'}"> requires an alt attribute for accessibility unless decorative is present.`);
        }

        if ((srcLight || srcDark) && !(srcLight && srcDark) && !src) {
            throw new Error('Both src-light and src-dark must be present when using light/dark themes, or use src alone.');
        }

        return {
            src,
            srcLight,
            srcDark,
            alt,
            isDecorative,
            width,
            height,
            customClasses
        };
    }

    render(isFallback = false) {
        const attrs = isFallback ? {
            src: '',
            srcLight: '',
            srcDark: '',
            alt: 'Logo',
            isDecorative: false,
            width: '',
            height: '',
            customClasses: ''
        } : this.getAttributes();

        const isDark = CustomLogo.#prefersColorScheme.matches;
        const currentSrc = isDark ? attrs.srcDark || attrs.src : attrs.srcLight || attrs.src;

        if (!currentSrc && !isFallback) {
            console.warn('No valid logo source provided for <custom-logo>. Skipping rendering.');
            return null;
        }

        const blockElement = document.createElement('div');
        blockElement.className = ['custom-logo', attrs.customClasses].filter(cls => cls).join(' ').trim();

        const pictureElement = document.createElement('picture');
        const sourceElements = CustomLogo.#FORMATS.map(format => {
            const source = document.createElement('source');
            source.type = `image/${format}`;
            source.srcset = CustomLogo.#WIDTHS.map(width => {
                const baseSrc = currentSrc.replace(/\.[^/.]+$/, '');
                return `${baseSrc}-${width}.${format} ${width}w`;
            }).join(', ');
            source.sizes = CustomLogo.#WIDTHS.map(width => `(max-width: ${width}px) ${width}px`).join(', ') + ', 512px';
            return source;
        });

        const imgElement = document.createElement('img');
        imgElement.src = currentSrc;
        imgElement.alt = attrs.isDecorative ? '' : attrs.alt;
        imgElement.loading = 'lazy';
        if (attrs.width && attrs.height) {
            imgElement.width = parseInt(attrs.width, 10);
            imgElement.height = parseInt(attrs.height, 10);
        }
        imgElement.onerror = () => {
            imgElement.src = 'https://placehold.co/128x128';
            imgElement.alt = 'Placeholder logo';
            imgElement.onerror = null;
        };

        sourceElements.forEach(source => pictureElement.appendChild(source));
        pictureElement.appendChild(imgElement);
        blockElement.appendChild(pictureElement);

        return blockElement;
    }

    static get observedAttributes() {
        return ['src', 'src-light', 'src-dark', 'alt', 'decorative', 'width', 'height', 'class'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (!this.isInitialized) return;
        if (['src', 'src-light', 'src-dark'].includes(name)) {
            this.updateTheme();
        }
        if (['width', 'height'].includes(name)) {
            const attrs = this.getAttributes();
            const img = this.querySelector('img');
            if (img && attrs.width && attrs.height) {
                img.width = parseInt(attrs.width, 10);
                img.height = parseInt(attrs.height, 10);
            }
        }
        if (name === 'class') {
            const div = this.querySelector('div');
            if (div) {
                div.className = ['custom-logo', this.getAttribute('class') || ''].filter(cls => cls).join(' ').trim();
            }
        }
    }
}

try {
    customElements.define('custom-logo', CustomLogo);
} catch (error) {
    console.error('Error defining CustomLogo element:', error);
}

console.log('CustomLogo version: 2025-09-09');

// Export the CustomLogo class
export { CustomLogo };
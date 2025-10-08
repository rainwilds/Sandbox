/* global HTMLElement, IntersectionObserver, document, window, JSON, console */
class CustomSlider extends HTMLElement {
    #ignoredChangeCount;
    #debug = new URLSearchParams(window.location.search).get('debug') === 'true';
    #isVisible = false;
    #isInitialized = false;
    #callbacks = [];
    #cachedAttributes = null;
    #criticalAttributesHash = null;
    #retryCount = 0;  // NEW: For retry limit

    constructor() {
        super();
        this.#ignoredChangeCount = 0;
        CustomSlider.#observer.observe(this);
        CustomSlider.#observedInstances.add(this);
    }

    static #observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const instance = entry.target;
                if (instance instanceof CustomSlider) {
                    instance.#isVisible = true;
                    CustomSlider.#observer.unobserve(instance);
                    CustomSlider.#observedInstances.delete(instance);
                    instance.initialize();
                }
            }
        });
    }, { rootMargin: '50px' });

    static #observedInstances = new WeakSet();

    static #criticalAttributes = [
        'class', 'slides-per-view', 'space-between', 'free-mode', 'pagination-clickable'
    ];

    #log(message, data = null) {
        if (this.#debug) {
            console.groupCollapsed(`%c[CustomSlider] ${message}`, 'color: #2196F3; font-weight: bold;');
            if (data) console.log('%cData:', 'color: #4CAF50;', data);
            console.trace();
            console.groupEnd();
        }
    }

    #warn(message, data = null) {
        if (this.#debug) {
            console.groupCollapsed(`%c[CustomSlider] ⚠️ ${message}`, 'color: #FF9800; font-weight: bold;');
            if (data) console.log('%cData:', 'color: #4CAF50;', data);
            console.trace();
            console.groupEnd();
        }
    }

    #error(message, data = null) {
        if (this.#debug) {
            console.groupCollapsed(`%c[CustomSlider] ❌ ${message}`, 'color: #F44336; font-weight: bold;');
            if (data) console.log('%cData:', 'color: #4CAF50;', data);
            console.trace();
            console.groupEnd();
        }
    }

    async getAttributes() {
        if (this.#cachedAttributes) {
            this.#log('Using cached attributes', { elementId: this.id || 'no-id' });
            return this.#cachedAttributes;
        }

        this.#log('Parsing new attributes', { elementId: this.id || 'no-id', outerHTML: this.outerHTML.substring(0, 200) + '...' });

        const swiperClass = this.getAttribute('class') || 'mySwiper';
        const slidesPerViewStr = this.getAttribute('slides-per-view') || '3';
        const spaceBetweenStr = this.getAttribute('space-between') || '30';
        const freeMode = this.getAttribute('free-mode') !== 'false';
        const paginationClickable = this.getAttribute('pagination-clickable') !== 'false';

        let slidesPerView = parseFloat(slidesPerViewStr);
        if (isNaN(slidesPerView)) {
            this.#warn('Invalid slides-per-view, defaulting to 3', { value: slidesPerViewStr });
            slidesPerView = 3;
        }

        let spaceBetween = spaceBetweenStr;
        if (spaceBetweenStr.startsWith('var(')) {
            // Treat as CSS variable string directly
            this.#log('Space-between detected as CSS variable', { value: spaceBetweenStr });
        } else {
            const parsedSpace = parseInt(spaceBetweenStr, 10);
            if (!isNaN(parsedSpace) && parsedSpace >= 0) {
                spaceBetween = parsedSpace;
            } else {
                this.#warn('Invalid space-between, defaulting to 30', { value: spaceBetweenStr });
                spaceBetween = 30;
            }
        }

        this.#cachedAttributes = {
            swiperClass,
            slidesPerView,
            spaceBetween,
            freeMode,
            paginationClickable
        };

        const criticalAttrs = {};
        CustomSlider.#criticalAttributes.forEach(attr => {
            criticalAttrs[attr] = this.getAttribute(attr) || '';
        });
        this.#criticalAttributesHash = JSON.stringify(criticalAttrs);

        this.#log('Attributes parsed successfully', {
            elementId: this.id || 'no-id',
            criticalHashLength: this.#criticalAttributesHash.length,
            attrs: this.#cachedAttributes
        });

        return this.#cachedAttributes;
    }

    async initialize() {
        if (this.#isInitialized || !this.#isVisible) {
            this.#log('Skipping initialization', {
                isInitialized: this.#isInitialized,
                isVisible: this.#isVisible,
                elementId: this.id || 'no-id'
            });
            return;
        }

        this.#log('Starting initialization', { elementId: this.id || 'no-id', outerHTML: this.outerHTML });

        this.#isInitialized = true;

        try {
            const attrs = await this.getAttributes();
            const sliderElement = this.#render(attrs);

            this.replaceWith(sliderElement);

            const paginationEl = sliderElement.querySelector('.swiper-pagination');

            // Check if Swiper is loaded; retry if not
            if (typeof Swiper === 'undefined') {
                if (this.#retryCount < 3) {
                    this.#retryCount++;
                    this.#warn('Swiper JS not loaded yet; retrying in 100ms', { retry: this.#retryCount });
                    setTimeout(() => this.initialize(), 100);
                    return;
                } else {
                    this.#error('Swiper failed after 3 retries; falling back');
                    throw new Error('Swiper unavailable');
                }
            }
            this.#retryCount = 0;  // Reset on success

            const options = {
                slidesPerView: attrs.slidesPerView,
                spaceBetween: attrs.spaceBetween,
                freeMode: attrs.freeMode,
                pagination: {
                    el: paginationEl,
                    clickable: attrs.paginationClickable,
                },
            };

            const swiper = new Swiper(sliderElement, options);

            this.#log('Swiper initialized successfully', { options, elementId: this.id || 'no-id' });

            this.#callbacks.forEach(callback => callback());
        } catch (error) {
            this.#error('Initialization failed', {
                error: error.message,
                stack: error.stack,
                elementId: this.id || 'no-id',
                outerHTML: this.outerHTML.substring(0, 200)
            });
            // Fallback: replace with a simple div containing children
            const fallbackElement = document.createElement('div');
            fallbackElement.className = 'slider-fallback';
            while (this.firstChild) {
                fallbackElement.appendChild(this.firstChild);
            }
            this.replaceWith(fallbackElement);
        }
    }

    connectedCallback() {
        this.#log('Connected to DOM', { elementId: this.id || 'no-id' });
        if (this.#isVisible) {
            this.initialize();
        }
    }

    disconnectedCallback() {
        this.#log('Disconnected from DOM', { elementId: this.id || 'no-id' });
        if (CustomSlider.#observedInstances.has(this)) {
            CustomSlider.#observer.unobserve(this);
            CustomSlider.#observedInstances.delete(this);
        }
        this.#callbacks = [];
        this.#cachedAttributes = null;
        this.#criticalAttributesHash = null;
        this.#retryCount = 0;
    }

    addCallback(callback) {
        this.#log('Callback added', { callbackName: callback.name || 'anonymous', elementId: this.id || 'no-id' });
        this.#callbacks.push(callback);
    }

    #render(attrs) {
        this.#log('Starting render', { elementId: this.id || 'no-id' });

        const sliderElement = document.createElement('div');
        sliderElement.className = `swiper ${attrs.swiperClass}`.trim();

        const wrapperElement = document.createElement('div');
        wrapperElement.className = 'swiper-wrapper';

        // Move all children to slides
        while (this.firstChild) {
            const slideElement = document.createElement('div');
            slideElement.className = 'swiper-slide';
            slideElement.appendChild(this.firstChild);
            wrapperElement.appendChild(slideElement);
        }

        sliderElement.appendChild(wrapperElement);

        const paginationElement = document.createElement('div');
        paginationElement.className = 'swiper-pagination';
        sliderElement.appendChild(paginationElement);

        this.#log('Render completed', { elementId: this.id || 'no-id', html: sliderElement.outerHTML.substring(0, 200) });

        return sliderElement;
    }

    static get observedAttributes() {
        return CustomSlider.#criticalAttributes;
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (!this.#isInitialized || !this.#isVisible) {
            this.#ignoredChangeCount++;
            if (this.#debug && this.#ignoredChangeCount % 10 === 0) {
                this.#log('Attribute changes ignored (not ready - batched)', { count: this.#ignoredChangeCount, name, oldValue, newValue });
            }
            return;
        }
        this.#log('Attribute changed', { name, oldValue, newValue });
        if (CustomSlider.#criticalAttributes.includes(name)) {
            this.#cachedAttributes = null;
            this.initialize();
        }
    }
}

try {
    customElements.define('custom-slider', CustomSlider);
} catch (error) {
    console.error('Error defining CustomSlider element:', error);
}

console.log('CustomSlider version: 2025-10-08');

export { CustomSlider };
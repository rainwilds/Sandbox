/* global HTMLElement, IntersectionObserver, document, window, JSON, console */
class CustomSlider extends HTMLElement {
    static #instanceCount = 0; // Track number of slider instances
    #ignoredChangeCount;
    #debug = new URLSearchParams(window.location.search).get('debug') === 'true';
    #uniqueId;

    constructor() {
        super();
        this.isVisible = false;
        this.isInitialized = false;
        this.callbacks = [];
        this.renderCache = null;
        this.lastAttributes = null;
        this.cachedAttributes = null;
        this.criticalAttributesHash = null;
        this.#ignoredChangeCount = 0;
        // Generate numeric unique ID based on instance count
        CustomSlider.#instanceCount += 1;
        this.#uniqueId = `${CustomSlider.#instanceCount}`;
        CustomSlider.#observer.observe(this);
        CustomSlider.#observedInstances.add(this);
        this.#log('Instance created', { instanceCount: CustomSlider.#instanceCount });
    }

    static #observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const instance = entry.target;
                if (instance instanceof CustomSlider) {
                    instance.isVisible = true;
                    CustomSlider.#observer.unobserve(instance);
                    CustomSlider.#observedInstances.delete(instance);
                    instance.initialize();
                }
            }
        });
    }, { rootMargin: '200px' }); // Increased to detect sliders further down

    static #observedInstances = new WeakSet();
    static #renderCacheMap = new WeakMap();
    static #criticalAttributes = [];

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
            console.groupCollapsed(`%c[CustomSlider] Warning: ${message}`, 'color: #FF9800; font-weight: bold;');
            if (data) console.log('%cData:', 'color: #4CAF50;', data);
            console.trace();
            console.groupEnd();
        }
    }

    #error(message, data = null) {
        if (this.#debug) {
            console.groupCollapsed(`%c[CustomSlider] Error: ${message}`, 'color: #F44336; font-weight: bold;');
            if (data) console.log('%cData:', 'color: #4CAF50;', data);
            console.trace();
            console.groupEnd();
        }
    }

    getAttributes() {
        if (this.cachedAttributes) {
            this.#log('Using cached attributes', { elementId: this.#uniqueId });
            return this.cachedAttributes;
        }

        this.#log('Parsing new attributes', { elementId: this.#uniqueId });
        this.cachedAttributes = {};
        this.criticalAttributesHash = '{}';

        this.#log('Attributes parsed successfully', { elementId: this.#uniqueId });
        return this.cachedAttributes;
    }

    async initialize() {
        if (this.isInitialized || !this.isVisible) {
            this.#log('Skipping initialization', {
                isInitialized: this.isInitialized,
                isVisible: this.isVisible,
                elementId: this.#uniqueId
            });
            return;
        }

        this.#log('Starting initialization', { elementId: this.#uniqueId });
        this.isInitialized = true;

        try {
            const sliderElement = await this.render();
            if (sliderElement) {
                this.#log('Render successful, replacing element', { elementId: this.#uniqueId });
                this.replaceWith(sliderElement);
                this.callbacks.forEach(callback => callback());
                this.#log('Initialization completed successfully', {
                    elementId: this.#uniqueId,
                    childCount: sliderElement.childElementCount
                });
            } else {
                this.#error('Render returned null, using fallback', { elementId: this.#uniqueId });
                this.replaceWith(this.render(true));
            }
        } catch (error) {
            this.#error('Initialization failed', {
                error: error.message,
                stack: error.stack,
                elementId: this.#uniqueId
            });
            this.replaceWith(this.render(true));
        }
    }

    connectedCallback() {
        this.#log('Connected to DOM', { elementId: this.#uniqueId });
        if (!this.isInitialized && !this.isVisible) {
            CustomSlider.#observer.observe(this);
            CustomSlider.#observedInstances.add(this);
            this.#log('Re-observing element after reconnect', { elementId: this.#uniqueId });
        }
        if (this.isVisible) {
            this.initialize();
        }
    }

    disconnectedCallback() {
        this.#log('Disconnected from DOM', { elementId: this.#uniqueId });
        if (CustomSlider.#observedInstances.has(this)) {
            CustomSlider.#observer.unobserve(this);
            CustomSlider.#observedInstances.delete(this);
        }
        // Clean up injected styles
        const styleId = `slider-count-${this.#uniqueId}`;
        const styleElement = document.getElementById(styleId);
        if (styleElement) {
            styleElement.remove();
            this.#log('Removed injected style', { styleId });
        }
        this.callbacks = [];
        this.renderCache = null;
        this.cachedAttributes = null;
        this.criticalAttributesHash = null;
        CustomSlider.#renderCacheMap.delete(this);
    }

    addCallback(callback) {
        this.#log('Callback added', { callbackName: callback.name || 'anonymous', elementId: this.#uniqueId });
        this.callbacks.push(callback);
    }

    async render(isFallback = false) {
        this.#log(`Starting render ${isFallback ? '(fallback)' : ''}`, { elementId: this.#uniqueId });

        let newCriticalAttrsHash;
        if (!isFallback) {
            newCriticalAttrsHash = '{}';
            if (CustomSlider.#renderCacheMap.has(this) && this.criticalAttributesHash === newCriticalAttrsHash) {
                this.#log('Using cached render', { elementId: this.#uniqueId });
                return CustomSlider.#renderCacheMap.get(this).cloneNode(true);
            }
        }

        const slides = Array.from(this.children);
        const slideCount = slides.length;

        if (slideCount === 0) {
            this.#warn('No slides found', { elementId: this.#uniqueId });
            const slider = document.createElement('div');
            slider.className = 'slider';
            return slider;
        }

        // Create the main slider container
        const slider = document.createElement('div');
        slider.className = 'slider';
        slider.dataset.sliderId = this.#uniqueId;

        // Inject CSS for slide count
        const styleId = `slider-count-${this.#uniqueId}`;
        if (!document.getElementById(styleId)) {
            try {
                const style = document.createElement('style');
                style.id = styleId;
                style.textContent = `.slider[data-slider-id="${this.#uniqueId}"] { --slide-count: ${slideCount}; }`;
                document.head.appendChild(style);
                this.#log('Slide count style injected', { styleId, slideCount });
            } catch (error) {
                this.#error('Failed to inject slide count style', { styleId, error: error.message });
                throw error; // Rethrow to trigger fallback
            }
        }

        // Wait for all <custom-block> elements to render
        const renderedSlides = await Promise.all(
            slides.map(async (slide, index) => {
                try {
                    if (!(slide instanceof HTMLElement)) {
                        this.#warn('Slide is not an HTMLElement', { index, slide });
                        return null;
                    }

                    if (slide.tagName.toLowerCase() === 'custom-block' && !slide.isInitialized) {
                        this.#log('Waiting for custom-block to initialize', { index, slideId: slide.id || 'no-id' });
                        // Ensure the slide is observed
                        if (!slide.isVisible && !slide.isInitialized) {
                            slide.__observer = slide.__observer || new IntersectionObserver(([entry]) => {
                                if (entry.isIntersecting) {
                                    slide.isVisible = true;
                                    slide.__observer.unobserve(slide);
                                    slide.initialize();
                                }
                            }, { rootMargin: '200px' });
                            slide.__observer.observe(slide);
                        }
                        // Wait for initialization by polling or listening for replacement
                        return new Promise(resolve => {
                            let retries = 0;
                            const maxRetries = 100; // Prevent infinite loop
                            const checkRendered = () => {
                                if (retries >= maxRetries) {
                                    this.#error('Max retries reached waiting for custom-block to render', { index, slideId: slide.id || 'no-id' });
                                    resolve(null);
                                    return;
                                }
                                if (slide.isConnected && slide.classList.contains('block')) {
                                    resolve(slide);
                                } else if (!slide.isConnected) {
                                    // If the slide was replaced, find the new element
                                    const newSlide = document.querySelector(`.block[data-slide-index="${index}"]`) || slide;
                                    if (newSlide.classList.contains('block')) {
                                        resolve(newSlide);
                                    } else {
                                        retries++;
                                        setTimeout(checkRendered, 100);
                                    }
                                } else {
                                    retries++;
                                    setTimeout(checkRendered, 100);
                                }
                            };
                            slide.setAttribute('data-slide-index', index); // Temporary marker
                            checkRendered();
                        });
                    } else {
                        this.#log('Appending non-custom-block slide', { index, tagName: slide.tagName });
                        return slide;
                    }
                } catch (error) {
                    this.#error('Failed to render slide', { index, slideId: slide.id || 'no-id', error: error.message });
                    return null;
                }
            })
        );

        // Append rendered slides
        renderedSlides.forEach((slide, index) => {
            if (slide) {
                slider.appendChild(slide);
                this.#log('Appended slide', { index, slideId: slide.id || 'no-id' });
                // Clean up data-slide-index after appending
                slide.removeAttribute('data-slide-index');
            } else {
                this.#warn('Slide not appended (null)', { index });
            }
        });

        if (slider.childElementCount === 0) {
            this.#error('No slides appended to slider', { elementId: this.#uniqueId });
        }

        if (!isFallback) {
            CustomSlider.#renderCacheMap.set(this, slider.cloneNode(true));
            this.lastAttributes = newCriticalAttrsHash;
        }

        this.#log('Render completed', { elementId: this.#uniqueId, slideCount: slider.childElementCount });
        return slider;
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (!this.isInitialized || !this.isVisible) {
            this.#ignoredChangeCount++;
            if (this.#debug && this.#ignoredChangeCount % 10 === 0) {
                this.#log('Attribute changes ignored (not ready - batched)', { count: this.#ignoredChangeCount, name, oldValue, newValue });
            }
            return;
        }

        this.#log('Attribute changed', { name, oldValue, newValue });
        if (CustomSlider.#criticalAttributes.includes(name)) {
            this.cachedAttributes = null;
            this.initialize();
        }
    }

    static get observedAttributes() {
        return [];
    }
}

try {
    customElements.define('custom-slider', CustomSlider);
} catch (error) {
    console.error('Error defining CustomSlider element:', error);
}

console.log('CustomSlider version: 2025-11-02');
export { CustomSlider };
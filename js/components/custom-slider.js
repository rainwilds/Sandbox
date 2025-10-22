/* global HTMLElement, IntersectionObserver, document, window, console, MutationObserver */
class CustomSlider extends HTMLElement {
    static #instanceCount = 0;
    #ignoredChangeCount;
    #debug = new URLSearchParams(window.location.search).get('debug') === 'true';
    #uniqueId;
    #slidesInitialized = 0;
    #currentSlide = 0;
    #autoSlideInterval = null;
    #mutationObserver = null;

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
        CustomSlider.#instanceCount += 1;
        this.#uniqueId = `${CustomSlider.#instanceCount}`;
        this.setAttribute('data-slider-id', this.#uniqueId);
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
    }, { rootMargin: '200px' });

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
                this.#log('Render successful, preparing to replace element', {
                    elementId: this.#uniqueId,
                    outerHTML: sliderElement.outerHTML.substring(0, 200)
                });
                // Clear existing children
                while (this.firstChild) {
                    this.removeChild(this.firstChild);
                }
                // Queue replacement in next event loop
                setTimeout(() => {
                    const parent = this.parentNode;
                    if (parent) {
                        parent.replaceChild(sliderElement, this);
                        this.#log('Element replaced with slider', {
                            elementId: this.#uniqueId,
                            parentTag: parent.tagName
                        });
                    } else {
                        this.#error('Parent node not found, using fallback replacement', { elementId: this.#uniqueId });
                        this.replaceWith(sliderElement);
                    }
                    // Start MutationObserver to detect re-insertion
                    this.#startMutationObserver(sliderElement);
                    this.#setupAutoSlide(sliderElement);
                }, 0);
                this.callbacks.forEach(callback => callback());
                this.#log('Initialization completed successfully', {
                    elementId: this.#uniqueId,
                    childCount: sliderElement.childElementCount
                });
            } else {
                this.#error('Render returned null, using fallback', { elementId: this.#uniqueId });
                const fallback = await this.render(true);
                this.replaceWith(fallback);
            }
        } catch (error) {
            this.#error('Initialization failed', {
                error: error.message,
                stack: error.stack,
                elementId: this.#uniqueId
            });
            const fallback = await this.render(true);
            this.replaceWith(fallback);
        }
    }

    #startMutationObserver(sliderElement) {
        if (this.#mutationObserver) return;
        this.#mutationObserver = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                if (mutation.addedNodes.length) {
                    mutation.addedNodes.forEach(node => {
                        if (node.tagName && node.tagName.toLowerCase() === 'custom-slider' && node.getAttribute('data-slider-id') === this.#uniqueId) {
                            this.#warn('custom-slider re-inserted into DOM, re-replacing', { elementId: this.#uniqueId });
                            const parent = node.parentNode;
                            if (parent) {
                                parent.replaceChild(sliderElement.cloneNode(true), node);
                            }
                        }
                    });
                }
            });
        });
        this.#mutationObserver.observe(document.body, { childList: true, subtree: true });
        this.#log('MutationObserver started', { elementId: this.#uniqueId });
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
        if (this.#autoSlideInterval) {
            clearInterval(this.#autoSlideInterval);
            this.#autoSlideInterval = null;
        }
        if (this.#mutationObserver) {
            this.#mutationObserver.disconnect();
            this.#mutationObserver = null;
        }
        if (CustomSlider.#observedInstances.has(this)) {
            CustomSlider.#observer.unobserve(this);
            CustomSlider.#observedInstances.delete(this);
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

        // Ensure custom-block is defined
        if (!customElements.get('custom-block')) {
            this.#warn('custom-block not defined, waiting for definition');
            await new Promise(resolve => {
                customElements.whenDefined('custom-block').then(resolve);
            });
        }

        const slides = Array.from(this.children);
        const slideCount = slides.length;

        if (slideCount === 0) {
            this.#warn('No slides found', { elementId: this.#uniqueId });
            const slider = document.createElement('div');
            slider.className = 'slider';
            return slider;
        }

        // Create the slider container
        const slider = document.createElement('div');
        slider.className = 'slider';
        slider.dataset.sliderId = this.#uniqueId;

        // Create wrapper for slides
        const sliderWrapper = document.createElement('div');
        sliderWrapper.className = 'slider-wrapper';
        slider.appendChild(sliderWrapper);

        // Track initialization of slides
        this.#slidesInitialized = 0;

        // Wait for all slides to initialize
        await new Promise(resolve => {
            const checkInitialization = () => {
                if (this.#slidesInitialized === slideCount) {
                    resolve();
                }
            };

            slides.forEach((slide, index) => {
                if (slide.tagName.toLowerCase() === 'custom-block') {
                    this.#log('Waiting for custom-block to initialize', { index, slideId: slide.id || 'no-id' });
                    if (typeof slide.addCallback === 'function') {
                        slide.addCallback((renderedElement) => {
                            this.#appendSlide(renderedElement, index, sliderWrapper);
                            this.#slidesInitialized++;
                            checkInitialization();
                        });
                    } else {
                        this.#warn('addCallback not available on custom-block, appending immediately', { index, slideId: slide.id || 'no-id' });
                        this.#appendSlide(slide.cloneNode(true), index, sliderWrapper);
                        this.#slidesInitialized++;
                        checkInitialization();
                    }
                    if (typeof slide.initialize === 'function' && !slide.isInitialized) {
                        if (!slide.isVisible) {
                            const observer = new IntersectionObserver(([entry]) => {
                                if (entry.isIntersecting) {
                                    slide.isVisible = true;
                                    observer.unobserve(slide);
                                    slide.initialize();
                                }
                            }, { rootMargin: '200px' });
                            observer.observe(slide);
                        } else {
                            slide.initialize();
                        }
                    }
                } else {
                    this.#warn('Slide is not a custom-block', { index, tagName: slide.tagName });
                    this.#appendSlide(slide.cloneNode(true), index, sliderWrapper);
                    this.#slidesInitialized++;
                    checkInitialization();
                }
            });
        });

        if (!isFallback) {
            CustomSlider.#renderCacheMap.set(this, slider.cloneNode(true));
            this.lastAttributes = newCriticalAttrsHash;
        }

        this.#log('Render completed', { elementId: this.#uniqueId, slideCount: sliderWrapper.childElementCount, outerHTML: slider.outerHTML.substring(0, 200) });
        return slider;
    }

    #appendSlide(slide, index, sliderWrapper) {
        this.#log('Appended slide', { index, slideId: slide.id || 'no-id' });
        slide.setAttribute('data-slide-index', index);
        sliderWrapper.appendChild(slide);
        this.#log('Slide appended to DOM', { index, html: slide.outerHTML.substring(0, 200) });
    }

    #setupAutoSlide(sliderElement) {
        const wrapper = sliderElement.querySelector('.slider-wrapper');
        if (!wrapper) {
            this.#error('Slider wrapper not found, auto-slide cannot be set up', { elementId: this.#uniqueId });
            return;
        }
        const slideCount = wrapper.children.length;

        if (slideCount <= 1) {
            this.#log('Auto-slide skipped: insufficient slides', { slideCount });
            return;
        }

        const updateSlider = () => {
            this.#currentSlide = (this.#currentSlide + 1) % slideCount;
            wrapper.style.transform = `translateX(-${this.#currentSlide * 100}%)`;
            this.#log('Auto-slid to next slide', { currentSlide: this.#currentSlide });
        };

        // Start auto-sliding every 5 seconds
        this.#autoSlideInterval = setInterval(updateSlider, 5000);
        this.#log('Auto-slide interval started', { elementId: this.#uniqueId });
    }

    static get observedAttributes() {
        return [];
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
}

try {
    customElements.define('custom-slider', CustomSlider);
} catch (error) {
    console.error('Error defining CustomSlider element:', error);
}

// Fallback: Transform custom-slider elements if custom element fails
document.addEventListener('DOMContentLoaded', () => {
    const sliders = document.querySelectorAll('custom-slider');
    sliders.forEach(slider => {
        const uniqueId = slider.getAttribute('data-slider-id') || `fallback-${Math.random().toString(36).slice(2)}`;
        const debug = new URLSearchParams(window.location.search).get('debug') === 'true';
        const log = (message, data) => {
            if (debug) {
                console.groupCollapsed(`%c[CustomSliderFallback] ${message}`, 'color: #2196F3; font-weight: bold;');
                if (data) console.log('%cData:', 'color: #4CAF50;', data);
                console.trace();
                console.groupEnd();
            }
        };
        const error = (message, data) => {
            if (debug) {
                console.groupCollapsed(`%c[CustomSliderFallback] Error: ${message}`, 'color: #F44336; font-weight: bold;');
                if (data) console.log('%cData:', 'color: #4CAF50;', data);
                console.trace();
                console.groupEnd();
            }
        };

        log('Applying fallback transformation', { sliderId: uniqueId });

        // Create slider structure
        const sliderDiv = document.createElement('div');
        sliderDiv.className = 'slider';
        sliderDiv.dataset.sliderId = uniqueId;
        const wrapper = document.createElement('div');
        wrapper.className = 'slider-wrapper';
        sliderDiv.appendChild(wrapper);

        // Move slides
        Array.from(slider.children).forEach((slide, index) => {
            slide.setAttribute('data-slide-index', index);
            wrapper.appendChild(slide);
        });

        // Replace custom-slider
        const parent = slider.parentNode;
        if (parent) {
            parent.replaceChild(sliderDiv, slider);
            log('Fallback slider replaced', { sliderId: uniqueId });
        } else {
            error('Parent node not found for fallback', { sliderId: uniqueId });
            slider.replaceWith(sliderDiv);
        }

        // Setup auto-slide
        const slideCount = wrapper.children.length;
        if (slideCount > 1) {
            let currentSlide = 0;
            const updateSlider = () => {
                currentSlide = (currentSlide + 1) % slideCount;
                wrapper.style.transform = `translateX(-${currentSlide * 100}%)`;
                log('Fallback auto-slid to next slide', { currentSlide });
            };
            const interval = setInterval(updateSlider, 5000);
            log('Fallback auto-slide started', { sliderId: uniqueId });

            // Clean up interval on page unload
            window.addEventListener('unload', () => clearInterval(interval));
        } else {
            log('Fallback auto-slide skipped: insufficient slides', { slideCount });
        }
    });
});

console.log('CustomSlider version: 2025-11-02');
export { CustomSlider };
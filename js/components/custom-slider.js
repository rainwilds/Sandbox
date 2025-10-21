/* global HTMLElement, IntersectionObserver, document, window, JSON, console */
class CustomSlider extends HTMLElement {
    #ignoredChangeCount;
    #debug = new URLSearchParams(window.location.search).get('debug') === 'true';
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
        CustomSlider.#observer.observe(this);
        CustomSlider.#observedInstances.add(this);
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
    }, { rootMargin: '50px' });

    static #observedInstances = new WeakSet();
    static #renderCacheMap = new WeakMap();
    static #criticalAttributes = ['autoplay', 'duration'];

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
            this.#log('Using cached attributes', { elementId: this.id || 'no-id' });
            return this.cachedAttributes;
        }

        this.#log('Parsing new attributes', { elementId: this.id || 'no-id' });
        const autoplay = this.hasAttribute('autoplay');
        let duration = this.getAttribute('duration') || '5s';
        const durationNum = parseFloat(duration);
        if (isNaN(durationNum)) {
            this.#warn('Invalid duration, using default', { value: duration, default: '5s' });
            duration = '5s';
        }

        this.cachedAttributes = { autoplay, duration };
        const criticalAttrs = {};
        CustomSlider.#criticalAttributes.forEach(attr => {
            criticalAttrs[attr] = this.getAttribute(attr) || '';
        });
        this.criticalAttributesHash = JSON.stringify(criticalAttrs);

        this.#log('Attributes parsed successfully', {
            elementId: this.id || 'no-id',
            autoplay,
            duration
        });
        return this.cachedAttributes;
    }

    async initialize() {
        if (this.isInitialized || !this.isVisible) {
            this.#log('Skipping initialization', {
                isInitialized: this.isInitialized,
                isVisible: this.isVisible,
                elementId: this.id || 'no-id'
            });
            return;
        }

        this.#log('Starting initialization', { elementId: this.id || 'no-id' });
        this.isInitialized = true;

        try {
            const sliderElement = await this.render();
            if (sliderElement) {
                this.#log('Render successful, replacing element', { elementId: this.id || 'no-id' });
                this.replaceWith(sliderElement);
                this.callbacks.forEach(callback => callback());
                this.#log('Initialization completed successfully', {
                    elementId: this.id || 'no-id',
                    childCount: sliderElement.childElementCount
                });
            } else {
                this.#error('Render returned null, using fallback', { elementId: this.id || 'no-id' });
                this.replaceWith(this.render(true));
            }
        } catch (error) {
            this.#error('Initialization failed', {
                error: error.message,
                stack: error.stack,
                elementId: this.id || 'no-id'
            });
            this.replaceWith(this.render(true));
        }
    }

    connectedCallback() {
        this.#log('Connected to DOM', { elementId: this.id || 'no-id' });
        if (!this.isInitialized && !this.isVisible) {
            CustomSlider.#observer.observe(this);
            CustomSlider.#observedInstances.add(this);
            this.#log('Re-observing element after reconnect', { elementId: this.id || 'no-id' });
        }
        if (this.isVisible) {
            this.initialize();
        }
    }

    disconnectedCallback() {
        this.#log('Disconnected from DOM', { elementId: this.id || 'no-id' });
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
        this.#log('Callback added', { callbackName: callback.name || 'anonymous', elementId: this.id || 'no-id' });
        this.callbacks.push(callback);
    }

    async render(isFallback = false) {
        this.#log(`Starting render ${isFallback ? '(fallback)' : ''}`, { elementId: this.id || 'no-id' });

        let newCriticalAttrsHash;
        if (!isFallback) {
            const criticalAttrs = {};
            CustomSlider.#criticalAttributes.forEach(attr => {
                criticalAttrs[attr] = this.getAttribute(attr) || '';
            });
            newCriticalAttrsHash = JSON.stringify(criticalAttrs);
            if (CustomSlider.#renderCacheMap.has(this) && this.criticalAttributesHash === newCriticalAttrsHash) {
                this.#log('Using cached render', { elementId: this.id || 'no-id' });
                return CustomSlider.#renderCacheMap.get(this).cloneNode(true);
            }
        }

        const attrs = isFallback ? { autoplay: false, duration: '5s' } : this.getAttributes();
        const slides = Array.from(this.children);
        const slideCount = slides.length;

        if (slideCount === 0) {
            this.#warn('No slides found', { elementId: this.id || 'no-id' });
            const slider = document.createElement('div');
            slider.className = 'slider';
            return slider;
        }

        // Create the main slider container
        const slider = document.createElement('div');
        slider.className = 'slider';
        slider.style.setProperty('--slide-count', slideCount); // Set custom property for CSS

        // Generate and inject keyframes if autoplay is enabled
        if (!isFallback && attrs.autoplay) {
            const perSlide = parseFloat(attrs.duration);
            const totalDuration = `${perSlide * slideCount}s`;
            const kfName = `slide-${slideCount}`;
            const styleId = `kf-${kfName}`;

            if (!document.getElementById(styleId)) {
                const step = 100 / slideCount;
                let kf = `@keyframes ${kfName} {\n`;
                for (let i = 0; i < slideCount; i++) {
                    const holdStart = (i * step).toFixed(2);
                    const holdEnd = ((i + 1) * step).toFixed(2);
                    const trans = `transform: translateX(-${i * 100}%);`;
                    kf += `  ${holdStart}% { ${trans} }\n`;
                    if (i < slideCount - 1) {
                        kf += `  ${holdEnd}% { ${trans} }\n`;
                    }
                }
                kf += `  100% { transform: translateX(-${(slideCount - 1) * 100}%); }\n}`;
                const style = document.createElement('style');
                style.id = styleId;
                style.textContent = kf;
                document.head.appendChild(style);
                this.#log('Keyframes injected', { kfName, totalDuration });
            }

            slider.style.setProperty('--animation', `${kfName} ${totalDuration} infinite ease-in-out`);
        }

        // Wait for all <custom-block> elements to render
        const renderedSlides = await Promise.all(
            slides.map(async (slide, index) => {
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
                        }, { rootMargin: '50px' });
                        slide.__observer.observe(slide);
                    }
                    // Wait for initialization by polling or listening for replacement
                    return new Promise(resolve => {
                        const checkRendered = () => {
                            if (slide.isConnected && slide.classList.contains('block')) {
                                resolve(slide);
                            } else if (!slide.isConnected) {
                                // If the slide was replaced, find the new element
                                const newSlide = document.querySelector(`.block[data-slide-index="${index}"]`) || slide;
                                if (newSlide.classList.contains('block')) {
                                    resolve(newSlide);
                                } else {
                                    setTimeout(checkRendered, 100);
                                }
                            } else {
                                setTimeout(checkRendered, 100);
                            }
                        };
                        slide.setAttribute('data-slide-index', index); // Temporary marker
                        checkRendered();
                    });
                }
                return slide;
            })
        );

        // Append rendered slides
        renderedSlides.forEach((slide, index) => {
            if (slide) {
                slider.appendChild(slide);
                this.#log('Appended slide', { index, slideId: slide.id || 'no-id' });
            } else {
                this.#warn('Slide not appended (null)', { index });
            }
        });

        if (slider.childElementCount === 0) {
            this.#error('No slides appended to slider', { elementId: this.id || 'no-id' });
        }

        if (!isFallback) {
            CustomSlider.#renderCacheMap.set(this, slider.cloneNode(true));
            this.lastAttributes = newCriticalAttrsHash;
        }

        this.#log('Render completed', { elementId: this.id || 'no-id', slideCount: slider.childElementCount });
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
        return ['autoplay', 'duration'];
    }
}

try {
    customElements.define('custom-slider', CustomSlider);
} catch (error) {
    console.error('Error defining CustomSlider element:', error);
}

console.log('CustomSlider version: 2025-10-24');
export { CustomSlider };
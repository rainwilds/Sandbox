/* global HTMLElement, IntersectionObserver, document, window, console */

class CustomSlider extends HTMLElement {
    #observer;
    #slides = new WeakMap();
    #sliderId;
    #debug = new URLSearchParams(window.location.search).get('debug') === 'true';

    constructor() {
        super();
        this.#sliderId = `slider-${Math.random().toString(36).substr(2, 9)}`;
        this.setAttribute('data-slider-id', this.#sliderId);
        this.#observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const slide = entry.target;
                if (entry.isIntersecting && this.#slides.has(slide) && !slide.isInitialized) {
                    slide.initialize().then(() => {
                        this.#slides.get(slide).initialized = true;
                        this.#checkAllSlidesInitialized();
                    });
                }
            });
        }, { rootMargin: '50px' });
    }

    connectedCallback() {
        this.#log('Connected to DOM');
        if (!this.isInitialized) {
            this.#observer.observe(this);
            this.#log('Re-observing element after reconnect');
        }
        if (this.isVisible) {
            this.initialize();
        }
    }

    disconnectedCallback() {
        this.#log('Disconnected from DOM');
        this.#observer.disconnect();
        this.#removeInjectedStyle();
    }

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

    async initialize() {
        if (this.isInitialized || !this.isVisible) {
            this.#log('Skipping initialization', { isInitialized: this.isInitialized, isVisible: this.isVisible });
            return;
        }
        this.#log('Starting initialization');
        this.isInitialized = true;
        try {
            const sliderElement = await this.render();
            if (sliderElement) {
                this.#log('Render successful, replacing element');
                this.replaceWith(sliderElement);
                this.#log('Initialization completed successfully', { childCount: sliderElement.childElementCount });
            } else {
                this.#error('Render returned null, using fallback');
                const fallbackElement = await this.render(true);
                this.replaceWith(fallbackElement);
            }
        } catch (error) {
            this.#error('Initialization failed', { error: error.message, stack: error.stack });
            const fallbackElement = await this.render(true);
            this.replaceWith(fallbackElement);
        }
    }

    async render(isFallback = false) {
        this.#log('Starting render' + (isFallback ? ' (fallback)' : ''));
        const slider = document.createElement('div');
        slider.className = 'slider';
        slider.setAttribute('data-slider-id', this.#sliderId);

        const slides = this.querySelectorAll('custom-block');
        this.#log('Found slides', { count: slides.length });

        if (!isFallback && slides.length > 0) {
            slides.forEach((slide, index) => {
                const slideData = { initialized: false };
                this.#slides.set(slide, slideData);
                this.#observer.observe(slide);
                slide.addCallback(() => {
                    this.#appendSlide(slide, index);
                });
            });
        } else if (isFallback) {
            slider.textContent = 'Slider unavailable';
        }

        if (!isFallback) {
            this.#injectSlideCountStyle(slides.length);
        }

        this.#log('Render completed');
        return slider;
    }

    #appendSlide(slide, index) {
        this.#log('Appended slide', { index });
        const slider = this.querySelector('.slider');
        if (slider) {
            slide.setAttribute('data-slide-index', index);
            slider.appendChild(slide.cloneNode(true));
        }
    }

    #injectSlideCountStyle(slideCount) {
        this.#log('Slide count style injected', { slideCount });
        let style = document.getElementById(`slider-count-${this.#sliderId}`);
        if (!style) {
            style = document.createElement('style');
            style.id = `slider-count-${this.#sliderId}`;
            document.head.appendChild(style);
        }
        style.textContent = `
            .slider[data-slider-id="${this.#sliderId}"] {
                --slider-count: ${slideCount};
            }
        `;
    }

    #removeInjectedStyle() {
        this.#log('Removed injected style');
        const style = document.getElementById(`slider-count-${this.#sliderId}`);
        if (style) {
            style.remove();
        }
    }

    #checkAllSlidesInitialized() {
        const allInitialized = Array.from(this.#slides.entries()).every(([, data]) => data.initialized);
        if (allInitialized) {
            this.#injectSlideCountStyle(this.#slides.size);
        }
    }

    get isVisible() {
        return this.getBoundingClientRect().top < window.innerHeight && this.getBoundingClientRect().bottom > 0;
    }
}

try {
    customElements.define('custom-slider', CustomSlider);
} catch (error) {
    console.error('Error defining CustomSlider element:', error);
}
console.log('CustomSlider version: 2025-11-02');
export { CustomSlider };
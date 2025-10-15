/* global HTMLElement, IntersectionObserver, document, window, console */
import Swiper from 'https://cdn.jsdelivr.net/npm/swiper@12.0.2/+esm';

class CustomSwiper extends HTMLElement {
    #ignoredChangeCount;
    constructor() {
        super();
        this.isVisible = false;
        this.isInitialized = false;
        this.swiperInstance = null;
        this.renderCache = null;
        this.lastAttributes = null;
        this.callbacks = [];
        this.debug = new URLSearchParams(window.location.search).get('debug') === 'true';
        this.#ignoredChangeCount = 0;
        CustomSwiper.#observer.observe(this);
        CustomSwiper.#observedInstances.add(this);
    }

    static #observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const instance = entry.target;
                if (instance instanceof CustomSwiper) {
                    instance.isVisible = true;
                    CustomSwiper.#observer.unobserve(instance);
                    CustomSwiper.#observedInstances.delete(instance);
                    instance.initialize();
                }
            }
        });
    }, { rootMargin: '50px' });

    static #observedInstances = new WeakSet();
    static #renderCacheMap = new WeakMap();
    static #criticalAttributes = ['slides-per-view', 'space-between', 'loop'];

    #log(message, data = null) {
        if (this.debug) {
            console.groupCollapsed(`%c[CustomSwiper] ${message}`, 'color: #2196F3; font-weight: bold;');
            if (data) console.log('%cData:', 'color: #4CAF50;', data);
            console.trace();
            console.groupEnd();
        }
    }

    #warn(message, data = null) {
        if (this.debug) {
            console.groupCollapsed(`%c[CustomSwiper] ⚠️ ${message}`, 'color: #FF9800; font-weight: bold;');
            if (data) console.log('%cData:', 'color: #4CAF50;', data);
            console.trace();
            console.groupEnd();
        }
    }

    #error(message, data = null) {
        if (this.debug) {
            console.groupCollapsed(`%c[CustomSwiper] ❌ ${message}`, 'color: #F44336; font-weight: bold;');
            if (data) console.log('%cData:', 'color: #4CAF50;', data);
            console.trace();
            console.groupEnd();
        }
    }

    async getAttributes() {
        if (this.cachedAttributes) {
            this.#log('Using cached attributes', { elementId: this.id || 'no-id' });
            return this.cachedAttributes;
        }

        this.#log('Parsing new attributes', { elementId: this.id || 'no-id', outerHTML: this.outerHTML.substring(0, 200) + '...' });

        const slidesPerView = this.getAttribute('slides-per-view') || '1';
        let sanitizedSlidesPerView = parseFloat(slidesPerView);
        if (isNaN(sanitizedSlidesPerView) || sanitizedSlidesPerView < 1) {
            this.#warn('Invalid slides-per-view, defaulting to 1', { value: slidesPerView, element: this.id || 'no-id' });
            sanitizedSlidesPerView = 1;
        }

        const spaceBetween = this.getAttribute('space-between') || '0';
        let sanitizedSpaceBetween = spaceBetween;
        const isValidUnit = spaceBetween.match(/^(\d*\.?\d+)(px|rem|vw|vh|%)?$/);
        const isValidVar = spaceBetween.match(/^var\(--[a-zA-Z0-9-]+\)$/);
        if (!isValidUnit && !isValidVar) {
            this.#warn('Invalid space-between, defaulting to 0', { value: spaceBetween, element: this.id || 'no-id', expected: 'CSS unit (e.g., 10px, 1rem) or var(--variable)' });
            sanitizedSpaceBetween = '0';
        }

        const loop = this.getAttribute('loop') === 'true';

        this.cachedAttributes = {
            slidesPerView: sanitizedSlidesPerView,
            spaceBetween: sanitizedSpaceBetween,
            loop,
        };

        const criticalAttrs = {};
        CustomSwiper.#criticalAttributes.forEach(attr => {
            criticalAttrs[attr] = this.getAttribute(attr) || '';
        });
        this.criticalAttributesHash = JSON.stringify(criticalAttrs);

        this.#log('Attributes parsed successfully', {
            elementId: this.id || 'no-id',
            attributes: this.cachedAttributes,
        });

        return this.cachedAttributes;
    }

    async initialize() {
        if (this.isInitialized || !this.isVisible) {
            this.#log('Skipping initialization', {
                isInitialized: this.isInitialized,
                isVisible: this.isVisible,
                elementId: this.id || 'no-id',
            });
            return;
        }

        this.#log('Starting initialization', { elementId: this.id || 'no-id' });
        this.isInitialized = true;

        try {
            const swiperElement = await this.render();
            if (swiperElement) {
                this.#log('Render successful, replacing element', { elementId: this.id || 'no-id' });
                this.replaceWith(swiperElement);
                this.callbacks.forEach(callback => callback());
                this.#log('Initialization completed successfully', {
                    elementId: this.id || 'no-id',
                    childCount: swiperElement.childElementCount,
                });
            } else {
                this.#error('Render returned null, using fallback', { elementId: this.id || 'no-id' });
                const fallbackElement = await this.render(true);
                this.replaceWith(fallbackElement);
            }
        } catch (error) {
            this.#error('Initialization failed', {
                error: error.message,
                stack: error.stack,
                elementId: this.id || 'no-id',
            });
            const fallbackElement = await this.render(true);
            this.replaceWith(fallbackElement);
        }
    }

    async render(isFallback = false) {
        this.#log(`Starting render ${isFallback ? '(fallback)' : ''}`, { elementId: this.id || 'no-id' });
        let newCriticalAttrsHash;
        if (!isFallback) {
            const criticalAttrs = {};
            CustomSwiper.#criticalAttributes.forEach(attr => {
                criticalAttrs[attr] = this.getAttribute(attr) || '';
            });
            newCriticalAttrsHash = JSON.stringify(criticalAttrs);
            if (CustomSwiper.#renderCacheMap.has(this) && this.criticalAttributesHash === newCriticalAttrsHash) {
                this.#log('Using cached render', { elementId: this.id || 'no-id' });
                return CustomSwiper.#renderCacheMap.get(this).cloneNode(true);
            }
        }

        const attrs = isFallback ? {
            slidesPerView: 1,
            spaceBetween: '0',
            loop: false,
        } : await this.getAttributes();

        const fragment = document.createDocumentFragment();
        const swiperContainer = document.createElement('div');
        swiperContainer.className = 'custom-swiper';
        fragment.appendChild(swiperContainer);

        // Create Swiper structure
        const swiperWrapper = document.createElement('div');
        swiperWrapper.className = 'swiper';
        swiperContainer.appendChild(swiperWrapper);

        const swiperSlideWrapper = document.createElement('div');
        swiperSlideWrapper.className = 'swiper-wrapper';
        swiperWrapper.appendChild(swiperSlideWrapper);

        const pagination = document.createElement('div');
        pagination.className = 'swiper-pagination';
        swiperWrapper.appendChild(pagination);

        const prevButton = document.createElement('div');
        prevButton.className = 'swiper-button-prev';
        swiperWrapper.appendChild(prevButton);

        const nextButton = document.createElement('div');
        nextButton.className = 'swiper-button-next';
        swiperWrapper.appendChild(nextButton);

        // Add custom styles with data-no-move to prevent head-generator.js from relocating
        const style = document.createElement('style');
        style.setAttribute('data-no-move', 'true');
        style.textContent = `
            .custom-swiper {
                position: relative;
                width: 100%;
                max-width: 100%;
                overflow: hidden;
            }
            .swiper {
                width: 100%;
                min-height: 300px;
                height: auto;
            }
            .swiper-slide {
                display: flex;
                justify-content: center;
                align-items: center;
                width: 100%;
                box-sizing: border-box;
                opacity: 1 !important; /* Ensure slides are visible */
            }
            .swiper-slide > .block {
                width: 100%;
                max-width: 1200px;
                min-height: 200px;
            }
            .swiper-button-prev,
            .swiper-button-next {
                color: var(--color-primary, #ffffff);
                z-index: 10;
                cursor: pointer;
            }
            .swiper-pagination-bullet {
                background: var(--color-primary, #ffffff);
                opacity: 0.7;
            }
            .swiper-pagination-bullet-active {
                opacity: 1;
            }
        `;
        swiperContainer.appendChild(style);

        // Move child elements to swiper-wrapper
        const children = Array.from(this.children);
        this.#log('Processing children as slides', { childCount: children.length, elementId: this.id || 'no-id' });

        for (const child of children) {
            if (child.tagName.toLowerCase() === 'custom-block' && typeof child.addCallback === 'function') {
                // Wait for custom-block to render
                await new Promise(resolve => {
                    if (child.isInitialized) {
                        resolve();
                    } else {
                        child.addCallback(resolve);
                    }
                });
                // Find the rendered block (div.block) in the DOM
                let renderedBlock = child.parentElement ? child.parentElement.querySelector('.block') : null;
                if (!renderedBlock && child.nextElementSibling && child.nextElementSibling.classList.contains('block')) {
                    renderedBlock = child.nextElementSibling;
                }
                if (renderedBlock) {
                    const slide = document.createElement('div');
                    slide.className = 'swiper-slide';
                    slide.appendChild(renderedBlock.cloneNode(true));
                    swiperSlideWrapper.appendChild(slide);
                } else {
                    this.#warn('Failed to find rendered custom-block content', { childId: child.id || 'no-id' });
                }
            } else {
                // Handle non-custom-block children
                const slide = document.createElement('div');
                slide.className = 'swiper-slide';
                slide.appendChild(child.cloneNode(true));
                swiperSlideWrapper.appendChild(slide);
            }
        }

        if (swiperSlideWrapper.children.length === 0) {
            this.#error('No valid slides found, rendering fallback', { elementId: this.id || 'no-id' });
            const fallbackSlide = document.createElement('div');
            fallbackSlide.className = 'swiper-slide';
            fallbackSlide.textContent = 'No slides available';
            swiperSlideWrapper.appendChild(fallbackSlide);
        }

        if (!isFallback) {
            // Initialize Swiper after DOM is settled
            await new Promise(resolve => setTimeout(resolve, 200)); // Increased delay
            const slideCount = swiperSlideWrapper.children.length;
            const swiperConfig = {
                slidesPerView: attrs.slidesPerView,
                spaceBetween: attrs.spaceBetween.match(/^\d+\.?\d*$/) ? parseFloat(attrs.spaceBetween) : attrs.spaceBetween,
                loop: attrs.loop && slideCount >= 2,
                pagination: {
                    el: '.swiper-pagination',
                    clickable: true,
                },
                navigation: {
                    nextEl: '.swiper-button-next',
                    prevEl: '.swiper-button-prev',
                },
                autoplay: attrs.loop && slideCount >= 2 ? {
                    delay: 3000,
                    disableOnInteraction: true,
                } : false,
                breakpoints: {
                    640: {
                        slidesPerView: attrs.slidesPerView,
                        spaceBetween: attrs.spaceBetween.match(/^\d+\.?\d*$/) ? parseFloat(attrs.spaceBetween) : attrs.spaceBetween,
                    },
                    768: {
                        slidesPerView: Math.min(attrs.slidesPerView + 1, 3),
                        spaceBetween: attrs.spaceBetween.match(/^\d+\.?\d*$/) ? parseFloat(attrs.spaceBetween) + 10 : attrs.spaceBetween,
                    },
                    1024: {
                        slidesPerView: Math.min(attrs.slidesPerView + 2, 4),
                        spaceBetween: attrs.spaceBetween.match(/^\d+\.?\d*$/) ? parseFloat(attrs.spaceBetween) + 20 : attrs.spaceBetween,
                    },
                },
                on: {
                    init: () => {
                        this.#log('Swiper initialized', { slideCount, elementId: this.id || 'no-id' });
                    },
                    slideChange: () => {
                        this.#log('Slide changed', { activeIndex: this.swiperInstance ? this.swiperInstance.activeIndex : -1, elementId: this.id || 'no-id' });
                    },
                },
            };

            this.#log('Initializing Swiper', { config: swiperConfig, slideCount, elementId: this.id || 'no-id' });
            this.swiperInstance = new Swiper(swiperWrapper, swiperConfig);
            // Multiple updates to ensure slide detection
            this.swiperInstance.update();
            await new Promise(resolve => setTimeout(resolve, 100));
            this.swiperInstance.update();
        }

        if (!isFallback) {
            CustomSwiper.#renderCacheMap.set(this, swiperContainer.cloneNode(true));
            this.lastAttributes = newCriticalAttrsHash;
        }

        this.#log('Render completed', { elementId: this.id || 'no-id', html: swiperContainer.outerHTML.substring(0, 200) });
        return swiperContainer;
    }

    connectedCallback() {
        this.#log('Connected to DOM', { elementId: this.id || 'no-id' });
        if (this.isVisible) {
            this.initialize();
        }
    }

    disconnectedCallback() {
        this.#log('Disconnected from DOM', { elementId: this.id || 'no-id' });
        if (this.swiperInstance) {
            this.swiperInstance.destroy(true, true);
            this.swiperInstance = null;
        }
        if (CustomSwiper.#observedInstances.has(this)) {
            CustomSwiper.#observer.unobserve(this);
            CustomSwiper.#observedInstances.delete(this);
        }
        this.callbacks = [];
        this.renderCache = null;
        this.cachedAttributes = null;
        this.criticalAttributesHash = null;
        CustomSwiper.#renderCacheMap.delete(this);
    }

    addCallback(callback) {
        this.#log('Callback added', { callbackName: callback.name || 'anonymous', elementId: this.id || 'no-id' });
        this.callbacks.push(callback);
    }

    static get observedAttributes() {
        return ['slides-per-view', 'space-between', 'loop'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (!this.isInitialized || !this.isVisible) {
            this.#ignoredChangeCount++;
            if (this.debug && this.#ignoredChangeCount % 10 === 0) {
                this.#log('Attribute changes ignored (not ready - batched)', { count: this.#ignoredChangeCount, name, oldValue, newValue });
            }
            return;
        }

        this.#log('Attribute changed', { name, oldValue, newValue });
        if (CustomSwiper.#criticalAttributes.includes(name)) {
            this.cachedAttributes = null;
            this.initialize();
        }
    }
}

try {
    customElements.define('custom-swiper', CustomSwiper);
} catch (error) {
    console.error('Error defining CustomSwiper element:', error);
}

console.log('CustomSwiper version: 2025-10-15');
export { CustomSwiper };
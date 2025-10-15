/* global HTMLElement, IntersectionObserver, MutationObserver, document, window, console */
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

        const spaceBetween = this.getAttribute('space-between') || '10px';
        let sanitizedSpaceBetween = spaceBetween;
        const isValidUnit = spaceBetween.match(/^(\d*\.?\d+)(px|rem|vw|vh|%)?$/);
        const isValidVar = spaceBetween.match(/^var\(--[a-zA-Z0-9-]+\)$/);
        if (!isValidUnit && !isValidVar) {
            this.#warn('Invalid space-between, defaulting to 10px', { value: spaceBetween, element: this.id || 'no-id', expected: 'CSS unit (e.g., 10px, 1rem) or var(--variable)' });
            sanitizedSpaceBetween = '10px';
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

    async waitForCustomBlockDefinition() {
        if (customElements.get('custom-block')) {
            this.#log('CustomBlock element already defined');
            return true;
        }
        this.#log('Waiting for CustomBlock definition');
        return new Promise(resolve => {
            customElements.whenDefined('custom-block').then(() => {
                this.#log('CustomBlock element defined');
                resolve(true);
            });
        });
    }

    async waitForBlockRender(child, timeout = 2000) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            const checkBlock = () => {
                const block = child.nextElementSibling && child.nextElementSibling.classList.contains('block')
                    ? child.nextElementSibling
                    : child.parentElement.querySelector('.block');
                if (block) {
                    this.#log('CustomBlock rendered', { childId: child.id || 'no-id' });
                    resolve(block);
                    return;
                }
                if (Date.now() - startTime >= timeout) {
                    this.#warn('Timeout waiting for CustomBlock render', { childId: child.id || 'no-id' });
                    resolve(null);
                    return;
                }
                setTimeout(checkBlock, 100);
            };

            if (typeof child.addCallback === 'function') {
                child.addCallback(() => {
                    this.#log('CustomBlock callback triggered', { childId: child.id || 'no-id' });
                    checkBlock();
                });
            } else {
                checkBlock();
            }
        });
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
            spaceBetween: '10px',
            loop: false,
        } : await this.getAttributes();

        const fragment = document.createDocumentFragment();
        const swiperContainer = document.createElement('div');
        swiperContainer.className = 'custom-swiper';
        swiperContainer.id = `custom-swiper-${Math.random().toString(36).substr(2, 9)}`;
        fragment.appendChild(swiperContainer);

        // Create Swiper structure
        const swiperWrapper = document.createElement('div');
        swiperWrapper.className = 'swiper';
        swiperContainer.appendChild(swiperWrapper);

        const swiperSlideWrapper = document.createElement('div');
        swiperSlideWrapper.className = 'swiper-wrapper';
        swiperWrapper.appendChild(swiperSlideWrapper);

        const pagination = document.createElement('div');
        pagination.className = `swiper-pagination swiper-pagination-${swiperContainer.id}`;
        swiperWrapper.appendChild(pagination);

        const prevButton = document.createElement('div');
        prevButton.className = `swiper-button-prev swiper-button-prev-${swiperContainer.id}`;
        swiperWrapper.appendChild(prevButton);

        const nextButton = document.createElement('div');
        nextButton.className = `swiper-button-next swiper-button-next-${swiperContainer.id}`;
        swiperWrapper.appendChild(nextButton);

        // Add custom styles
        const style = document.createElement('style');
        style.setAttribute('data-no-move', 'true');
        style.textContent = `
            #${swiperContainer.id}.custom-swiper {
                position: relative;
                width: 100%;
                max-width: 100%;
                overflow: hidden;
                padding: 0;
                margin: 0;
            }
            #${swiperContainer.id} .swiper {
                width: 100%;
                min-height: 400px;
                height: auto;
                position: relative;
            }
            #${swiperContainer.id} .swiper-slide {
                display: flex;
                justify-content: center;
                align-items: center;
                width: 100%;
                box-sizing: border-box;
                opacity: 1 !important;
                position: relative;
            }
            #${swiperContainer.id} .swiper-slide > .block {
                width: 100%;
                max-width: 1200px;
                min-height: 300px;
            }
            #${swiperContainer.id} .swiper-button-prev-${swiperContainer.id},
            #${swiperContainer.id} .swiper-button-next-${swiperContainer.id} {
                color: var(--color-primary, #ffffff) !important;
                z-index: 10;
                cursor: pointer;
                width: 44px;
                height: 44px;
                margin-top: -22px;
                background: rgba(0, 0, 0, 0.5);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            #${swiperContainer.id} .swiper-button-prev-${swiperContainer.id}:after,
            #${swiperContainer.id} .swiper-button-next-${swiperContainer.id}:after {
                font-size: 20px;
                font-family: 'swiper-icons';
            }
            #${swiperContainer.id} .swiper-pagination-${swiperContainer.id} {
                position: absolute;
                bottom: 10px;
                z-index: 10;
            }
            #${swiperContainer.id} .swiper-pagination-bullet {
                background: var(--color-primary, #ffffff);
                opacity: 0.7;
                width: 8px;
                height: 8px;
                margin: 0 4px;
                cursor: pointer;
            }
            #${swiperContainer.id} .swiper-pagination-bullet-active {
                opacity: 1;
                background: var(--color-primary, #ffffff);
            }
        `;
        swiperContainer.appendChild(style);

        // Wait for CustomBlock definition
        await this.waitForCustomBlockDefinition();

        // Store original children to prevent DOM mutation issues
        const children = Array.from(this.children);
        this.#log('Processing children as slides', { childCount: children.length, elementId: this.id || 'no-id' });

        // Create a temporary container to hold original children
        const tempContainer = document.createElement('div');
        tempContainer.style.display = 'none';
        document.body.appendChild(tempContainer);
        children.forEach(child => tempContainer.appendChild(child.cloneNode(true)));

        for (const child of children) {
            this.#log('Checking child', {
                tagName: child.tagName,
                hasAddCallback: typeof child.addCallback === 'function',
                isCustomElement: !!customElements.get(child.tagName.toLowerCase()),
                isInitialized: child.isInitialized || false
            });
            if (child.tagName.toLowerCase() === 'custom-block' && typeof child.addCallback === 'function') {
                const renderedBlock = await this.waitForBlockRender(child);
                if (renderedBlock) {
                    const slide = document.createElement('div');
                    slide.className = 'swiper-slide';
                    slide.appendChild(renderedBlock.cloneNode(true));
                    swiperSlideWrapper.appendChild(slide);
                } else {
                    this.#warn('Failed to find rendered custom-block content, using fallback', { childId: child.id || 'no-id' });
                    const slide = document.createElement('div');
                    slide.className = 'swiper-slide';
                    slide.appendChild(child.cloneNode(true));
                    swiperSlideWrapper.appendChild(slide);
                }
            } else {
                this.#warn('Non-custom-block child or missing addCallback, cloning directly', {
                    tagName: child.tagName,
                    hasAddCallback: typeof child.addCallback === 'function'
                });
                const slide = document.createElement('div');
                slide.className = 'swiper-slide';
                slide.appendChild(child.cloneNode(true));
                swiperSlideWrapper.appendChild(slide);
            }
        }

        // Clean up temporary container
        tempContainer.remove();

        if (swiperSlideWrapper.children.length === 0) {
            this.#error('No valid slides found, rendering fallback', { elementId: this.id || 'no-id' });
            const fallbackSlide = document.createElement('div');
            fallbackSlide.className = 'swiper-slide';
            fallbackSlide.textContent = 'No slides available';
            swiperSlideWrapper.appendChild(fallbackSlide);
        }

        if (!isFallback) {
            // Initialize Swiper after DOM is settled
            await new Promise(resolve => setTimeout(resolve, 1000));
            const slideCount = swiperSlideWrapper.children.length;
            const swiperConfig = {
                slidesPerView: attrs.slidesPerView,
                spaceBetween: attrs.spaceBetween.match(/^\d+\.?\d*$/) ? parseFloat(attrs.spaceBetween) : attrs.spaceBetween,
                loop: attrs.loop && slideCount >= 2,
                pagination: {
                    el: `.swiper-pagination-${swiperContainer.id}`,
                    clickable: true,
                },
                navigation: {
                    nextEl: `.swiper-button-next-${swiperContainer.id}`,
                    prevEl: `.swiper-button-prev-${swiperContainer.id}`,
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
                        const navButtons = swiperContainer.querySelectorAll(`.swiper-button-prev-${swiperContainer.id}, .swiper-button-next-${swiperContainer.id}`);
                        this.#log('Navigation buttons status', { count: navButtons.length, visible: Array.from(navButtons).every(btn => btn.offsetParent !== null) });
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
            await new Promise(resolve => setTimeout(resolve, 500));
            this.swiperInstance.update();

            // Observe DOM changes to reinitialize Swiper if needed
            const observer = new MutationObserver(() => {
                if (this.swiperInstance) {
                    this.#log('DOM changed, updating Swiper', { elementId: this.id || 'no-id' });
                    this.swiperInstance.update();
                }
            });
            observer.observe(swiperContainer, { childList: true, subtree: true });
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
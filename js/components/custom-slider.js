'use strict';

import { getConfig } from '../config.js';

class CustomSlider extends HTMLElement {
    #ignoredChangeCount = 0;
    #basePath = null;
    #currentIndex = 0;
    #animationFrameId = null;
    #uniqueId = null;
    #autoplayInterval = null;
    #slides = [];
    #childElements = [];

    constructor() {
        super();
        this.isVisible = false;
        this.isInitialized = false;
        this.debug = new URLSearchParams(window.location.search).get('debug') === 'true';
        this.#ignoredChangeCount = 0;
        this.#uniqueId = `slider-${Math.random().toString(36).substr(2, 9)}`;
        this.#childElements = Array.from(this.children).filter(child => child.tagName.toLowerCase() === 'custom-block');
        this.#log('Captured children in constructor', { count: this.#childElements.length, elementId: this.#uniqueId });
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

    #log(message, data = null) {
        if (this.debug) {
            console.groupCollapsed(`%c[CustomSlider] ${message}`, 'color: #2196F3; font-weight: bold;');
            if (data) console.log('%cData:', 'color: #4CAF50;', data);
            console.trace();
            console.groupEnd();
        }
    }

    #warn(message, data = null) {
        if (this.debug) {
            console.groupCollapsed(`%c[CustomSlider] ⚠️ ${message}`, 'color: #FF9800; font-weight: bold;');
            if (data) console.log('%cData:', 'color: #4CAF50;', data);
            console.trace();
            console.groupEnd();
        }
    }

    #error(message, data = null) {
        if (this.debug) {
            console.groupCollapsed(`%c[CustomSlider] ❌ ${message}`, 'color: #F44336; font-weight: bold;');
            if (data) console.log('%cData:', 'color: #4CAF50;', data);
            console.trace();
            console.groupEnd();
        }
        console.error(`[CustomSlider] ${message}`, data);
    }

    async #getBasePath() {
        if (!this.#basePath) {
            const config = await getConfig();
            this.#basePath = config.general?.basePath || '/';
            this.#log('Base path fetched', { basePath: this.#basePath });
        }
        return this.#basePath;
    }

    async getAttributes() {
        this.#log('Parsing attributes', { elementId: this.#uniqueId });
        const autoplayAttr = this.getAttribute('autoplay');
        let autoplay = false;
        let autoplayDelay = 3000;

        if (autoplayAttr) {
            const timeMatch = autoplayAttr.match(/^(\d+)(s|ms)$/);
            if (timeMatch) {
                const value = parseInt(timeMatch[1], 10);
                const unit = timeMatch[2];
                autoplay = true;
                autoplayDelay = unit === 's' ? value * 1000 : value;
            } else if (autoplayAttr === 'true') {
                autoplay = true;
            } else {
                this.#warn('Invalid autoplay format', { value: autoplayAttr, expected: 'true, Ns, or Nms' });
            }
        }

        const slidesPerViewAttr = this.getAttribute('slides-per-view') || '1';
        let slidesPerView = parseInt(slidesPerViewAttr, 10);
        if (isNaN(slidesPerView) || slidesPerView < 1) {
            this.#warn('Invalid slides-per-view', { value: slidesPerViewAttr, defaultingTo: 1 });
            slidesPerView = 1;
        }

        const navigation = this.hasAttribute('navigation');
        let navigationIconLeft = this.getAttribute('navigation-icon-left') || '<i class="fa-chisel fa-regular fa-angle-left"></i>';
        let navigationIconRight = this.getAttribute('navigation-icon-right') || '<i class="fa-chisel fa-regular fa-angle-right"></i>';

        const validateIcon = (icon, position) => {
            if (!icon) return '';
            const parser = new DOMParser();
            const decodedIcon = icon.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
            const doc = parser.parseFromString(decodedIcon, 'text/html');
            const iElement = doc.body.querySelector('i');
            if (!iElement || !iElement.className.includes('fa-')) {
                this.#warn(`Invalid ${position} navigation icon format`, {
                    value: icon,
                    expected: 'Font Awesome <i> tag with fa- classes'
                });
                return '';
            }
            const validClasses = iElement.className.split(' ').filter(cls => cls.startsWith('fa-') || cls === 'fa-chisel');
            if (validClasses.length === 0) {
                this.#warn(`No valid Font Awesome classes in ${position} navigation icon`, {
                    classes: iElement.className
                });
                return '';
            }
            return `<i class="${validClasses.join(' ')}"></i>`;
        };

        navigationIconLeft = validateIcon(navigationIconLeft, 'left');
        navigationIconRight = validateIcon(navigationIconRight, 'right');

        return {
            autoplay,
            autoplayDelay,
            slidesPerView,
            navigation,
            navigationIconLeft,
            navigationIconRight
        };
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
            const attrs = await this.getAttributes();
            const sliderElement = await this.render(attrs);
            if (sliderElement) {
                this.#log('Render successful, replacing element', { elementId: this.#uniqueId });
                this.replaceWith(sliderElement);
                this.#setupSlider(attrs);
                this.#log('Initialization completed successfully', { elementId: this.#uniqueId });
            } else {
                this.#error('Render returned null, using fallback', { elementId: this.#uniqueId });
                const fallbackElement = await this.render({ autoplay: false, slidesPerView: 1, navigation: false });
                this.replaceWith(fallbackElement);
            }
        } catch (error) {
            this.#error('Initialization failed', {
                error: error.message,
                stack: error.stack,
                elementId: this.#uniqueId
            });
            const fallbackElement = await this.render({ autoplay: false, slidesPerView: 1, navigation: false });
            this.replaceWith(fallbackElement);
        }
    }

    #setupSlider(attrs) {
        const sliderContainer = document.getElementById(this.#uniqueId);
        if (!sliderContainer) {
            this.#error('Slider container not found', { elementId: this.#uniqueId });
            return;
        }

        this.#slides = Array.from(sliderContainer.querySelectorAll('.slider-slide'));
        if (this.#slides.length === 0) {
            this.#warn('No slides to initialize', { elementId: this.#uniqueId });
            return;
        }

        if (attrs.navigation) {
            const prevButton = document.getElementById(`${this.#uniqueId}-prev`);
            const nextButton = document.getElementById(`${this.#uniqueId}-next`);
            if (prevButton && nextButton) {
                prevButton.addEventListener('click', () => this.#navigate(-1));
                nextButton.addEventListener('click', () => this.#navigate(1));
                this.#log('Navigation buttons initialized', { elementId: this.#uniqueId });
            }
        }

        if (attrs.autoplay) {
            this.#startAutoplay(attrs.autoplayDelay);
        }

        this.#updateSlider();
    }

    #navigate(direction) {
        const totalSlides = this.#slides.length;
        const slidesPerView = parseInt(this.getAttribute('slides-per-view') || '1', 10);
        this.#currentIndex += direction;

        // Infinite loop logic
        this.#currentIndex = ((this.#currentIndex % totalSlides) + totalSlides) % totalSlides;

        // Adjust for visible slides to avoid empty space
        if (this.#currentIndex + slidesPerView > totalSlides) {
            this.#currentIndex = 0; // Reset to start if exceeding visible range
        } else if (this.#currentIndex < 0) {
            this.#currentIndex = totalSlides - slidesPerView; // Loop to end
        }

        this.#updateSlider();
        this.#log('Navigated', { direction, currentIndex: this.#currentIndex, slidesPerView, totalSlides, elementId: this.#uniqueId });

        if (this.#autoplayInterval) {
            this.#stopAutoplay();
            this.getAttributes().then(attr => {
                if (attr.autoplay) {
                    this.#startAutoplay(attr.autoplayDelay);
                }
            });
        }
    }

    #startAutoplay(delay) {
        this.#stopAutoplay();
        this.#autoplayInterval = setInterval(() => {
            this.#navigate(1);
        }, delay);
        this.#log('Autoplay started', { delay, elementId: this.#uniqueId });
    }

    #stopAutoplay() {
        if (this.#autoplayInterval) {
            clearInterval(this.#autoplayInterval);
            this.#autoplayInterval = null;
            this.#log('Autoplay stopped', { elementId: this.#uniqueId });
        }
    }

    #updateSlider() {
        if (this.#animationFrameId) {
            cancelAnimationFrame(this.#animationFrameId);
        }

        this.#animationFrameId = requestAnimationFrame(() => {
            const slidesPerView = parseInt(this.getAttribute('slides-per-view') || '1', 10);
            const totalSlides = this.#slides.length;
            const sliderContainer = document.getElementById(this.#uniqueId);
            if (!sliderContainer) return;

            const slideWidth = 100 / slidesPerView; // Percentage width per slide
            let translateX = -this.#currentIndex * slideWidth;

            // Ensure translateX stays within the visible range
            if (this.#currentIndex + slidesPerView > totalSlides) {
                translateX = 0; // Reset to start position
                this.#currentIndex = 0; // Sync index
            } else if (this.#currentIndex < 0) {
                translateX = -(totalSlides - slidesPerView) * slideWidth; // Reset to end
                this.#currentIndex = totalSlides - slidesPerView; // Sync index
            }

            const wrapper = sliderContainer.querySelector('.slider-wrapper');
            wrapper.style.transition = 'transform 0.5s'; // Ensure transition is applied
            wrapper.style.transform = `translateX(${translateX}%)`;
            this.#log('Slider updated', { currentIndex: this.#currentIndex, translateX, slidesPerView, totalSlides, elementId: this.#uniqueId });
        });
    }

    async render(attrs) {
        this.#log('Starting render', { elementId: this.#uniqueId, attrs });

        const fragment = document.createDocumentFragment();
        const sliderWrapper = document.createElement('div');
        sliderWrapper.id = this.#uniqueId;
        sliderWrapper.className = 'custom-slider';
        sliderWrapper.style.height = '100%';
        sliderWrapper.style.overflow = 'hidden';

        const innerWrapper = document.createElement('div');
        innerWrapper.className = 'slider-wrapper';
        innerWrapper.style.display = 'grid';
        innerWrapper.style.transition = 'transform 0.5s';
        innerWrapper.style.transform = 'translateX(0%)';
        innerWrapper.style.gridTemplateColumns = `repeat(${this.#childElements.length}, calc(100% / ${attrs.slidesPerView}))`;
        innerWrapper.style.gridAutoFlow = 'column';
        innerWrapper.style.height = '100%';

        if (this.#childElements.length === 0) {
            this.#warn('No valid slides found', { elementId: this.#uniqueId });
            const fallbackSlide = document.createElement('div');
            fallbackSlide.className = 'slider-slide';
            fallbackSlide.innerHTML = '<p>No slides available</p>';
            innerWrapper.appendChild(fallbackSlide);
        } else {
            this.#childElements.forEach((slide, index) => {
                const slideWrapper = document.createElement('div');
                slideWrapper.className = 'slider-slide';
                slideWrapper.appendChild(slide.cloneNode(true));
                innerWrapper.appendChild(slideWrapper);
                this.#log(`Slide ${index + 1} processed`, { elementId: this.#uniqueId });
            });
        }

        sliderWrapper.appendChild(innerWrapper);

        if (attrs.navigation && attrs.navigationIconLeft && attrs.navigationIconRight) {
            const navPrev = document.createElement('div');
            navPrev.id = `${this.#uniqueId}-prev`;
            navPrev.className = 'slider-nav-prev';
            navPrev.innerHTML = attrs.navigationIconLeft;
            navPrev.style.position = 'absolute';
            navPrev.style.zIndex = '10';
            navPrev.style.cursor = 'pointer';
            navPrev.style.left = '10px';
            navPrev.style.top = '50%';
            navPrev.style.transform = 'translateY(-50%)';

            const navNext = document.createElement('div');
            navNext.id = `${this.#uniqueId}-next`;
            navNext.className = 'slider-nav-next';
            navNext.innerHTML = attrs.navigationIconRight;
            navNext.style.position = 'absolute';
            navNext.style.zIndex = '10';
            navNext.style.cursor = 'pointer';
            navNext.style.right = '10px';
            navNext.style.top = '50%';
            navNext.style.transform = 'translateY(-50%)';

            sliderWrapper.appendChild(navPrev);
            sliderWrapper.appendChild(navNext);
            this.#log('Navigation buttons added', { elementId: this.#uniqueId });
        }

        fragment.appendChild(sliderWrapper);
        return sliderWrapper;
    }

    async connectedCallback() {
        this.#log('Connected to DOM', { elementId: this.#uniqueId });
        if (this.isVisible) {
            await this.initialize();
        }
    }

    disconnectedCallback() {
        this.#log('Disconnected from DOM', { elementId: this.#uniqueId });
        this.#stopAutoplay();
        if (this.#animationFrameId) {
            cancelAnimationFrame(this.#animationFrameId);
            this.#animationFrameId = null;
        }
        if (CustomSlider.#observedInstances.has(this)) {
            CustomSlider.#observer.unobserve(this);
            CustomSlider.#observedInstances.delete(this);
        }
        this.#childElements = [];
    }

    static get observedAttributes() {
        return ['autoplay', 'slides-per-view', 'navigation', 'navigation-icon-left', 'navigation-icon-right'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (!this.isInitialized || !this.isVisible) {
            this.#ignoredChangeCount++;
            if (this.debug && this.#ignoredChangeCount % 10 === 0) {
                this.#log('Attribute changes ignored (not ready - batched)', {
                    count: this.#ignoredChangeCount,
                    name,
                    oldValue,
                    newValue,
                    elementId: this.#uniqueId
                });
            }
            return;
        }

        this.#log('Attribute changed', { name, oldValue, newValue, elementId: this.#uniqueId });
        if (oldValue !== newValue) {
            this.isInitialized = false;
            this.#stopAutoplay();
            this.#childElements = Array.from(this.children).filter(child => child.tagName.toLowerCase() === 'custom-block');
            this.initialize();
        }
    }
}

try {
    customElements.define('custom-slider', CustomSlider);
} catch (error) {
    console.error('Error defining CustomSlider element:', error);
}

console.log('CustomSlider version: 2025-10-23');
export { CustomSlider };
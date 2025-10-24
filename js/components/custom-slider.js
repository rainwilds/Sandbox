/* global HTMLElement, IntersectionObserver, document, window, console, requestAnimationFrame */

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
    #lastDirection = 0; // Track the last navigation direction

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
        let autoplayDelay = 0; // Default to disabled if attribute is absent
        if (this.hasAttribute('autoplay')) {
            if (autoplayAttr === '' || autoplayAttr === null) {
                autoplayDelay = 3000; // Default if present but empty/no value
            } else {
                const timeMatch = autoplayAttr.match(/^(\d+)(s|ms)$/);
                if (timeMatch) {
                    const value = parseInt(timeMatch[1], 10);
                    const unit = timeMatch[2];
                    autoplayDelay = unit === 's' ? value * 1000 : value; // Convert seconds to milliseconds
                } else {
                    this.#warn('Invalid autoplay format, using default 3s', { value: autoplayAttr, expected: 'Ns or Nms' });
                    autoplayDelay = 3000;
                }
            }
        }
        this.#log('Parsed autoplay attribute', { autoplayAttr, autoplayDelay });

        const slidesPerViewAttr = this.getAttribute('slides-per-view') || '1';
        let slidesPerView = parseInt(slidesPerViewAttr, 10);
        if (isNaN(slidesPerView) || slidesPerView < 1) {
            this.#warn('Invalid slides-per-view', { value: slidesPerViewAttr, defaultingTo: 1 });
            slidesPerView = 1;
        }

        const navigation = this.hasAttribute('navigation');
        let navigationIconLeft = this.getAttribute('navigation-icon-left') || '<i class="fa-chisel fa-regular fa-angle-left"></i>';
        let navigationIconRight = this.getAttribute('navigation-icon-right') || '<i class="fa-chisel fa-regular fa-angle-right"></i>';

        const gapAttr = this.getAttribute('gap') || '0'; // Default to 0 if no gap attribute
        this.#log('Parsed gap attribute', { gapAttr });

        const paginationAttr = this.hasAttribute('pagination'); // Boolean, true if attribute is present
        this.#log('Parsed pagination attribute', { pagination: paginationAttr });

        let paginationIconActive = this.getAttribute('pagination-icon-active') || '<i class="fa-solid fa-circle"></i>';
        let paginationIconInactive = this.getAttribute('pagination-icon-inactive') || '<i class="fa-regular fa-circle"></i>';
        this.#log('Parsed pagination icons', { paginationIconActive, paginationIconInactive });

        const validateIcon = (icon, position) => {
            if (!icon) return '';
            const parser = new DOMParser();
            const decodedIcon = icon.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
            const doc = parser.parseFromString(decodedIcon, 'text/html');
            const iElement = doc.body.querySelector('i');
            if (!iElement || !iElement.className.includes('fa-')) {
                this.#warn(`Invalid ${position} pagination icon format, ensure Font Awesome is loaded`, {
                    value: icon,
                    expected: 'Font Awesome <i> tag with fa- classes'
                });
                return '<i class="fa-solid fa-circle"></i>'; // Fallback icon
            }
            const validClasses = iElement.className.split(' ').filter(cls => cls.startsWith('fa-') || cls === 'fa-chisel');
            if (validClasses.length === 0) {
                this.#warn(`No valid Font Awesome classes in ${position} pagination icon, ensure Font Awesome is loaded`, {
                    classes: iElement.className
                });
                return '<i class="fa-solid fa-circle"></i>'; // Fallback icon
            }
            return `<i class="${validClasses.join(' ')}"></i>`;
        };

        navigationIconLeft = validateIcon(navigationIconLeft, 'left');
        navigationIconRight = validateIcon(navigationIconRight, 'right');
        paginationIconActive = validateIcon(paginationIconActive, 'active');
        paginationIconInactive = validateIcon(paginationIconInactive, 'inactive');

        return {
            autoplayDelay,
            slidesPerView,
            navigation,
            navigationIconLeft,
            navigationIconRight,
            gap: gapAttr,
            pagination: paginationAttr,
            paginationIconActive,
            paginationIconInactive
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
                const fallbackElement = await this.render({ autoplayDelay: 3000, slidesPerView: 1, navigation: false, gap: '0', pagination: false, paginationIconActive: '<i class="fa-solid fa-circle"></i>', paginationIconInactive: '<i class="fa-regular fa-circle"></i>' });
                this.replaceWith(fallbackElement);
            }
        } catch (error) {
            this.#error('Initialization failed', {
                error: error.message,
                stack: error.stack,
                elementId: this.#uniqueId
            });
            const fallbackElement = await this.render({ autoplayDelay: 3000, slidesPerView: 1, navigation: false, gap: '0', pagination: false, paginationIconActive: '<i class="fa-solid fa-circle"></i>', paginationIconInactive: '<i class="fa-regular fa-circle"></i>' });
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

        if (attrs.autoplayDelay) {
            this.#startAutoplay(attrs.autoplayDelay);
        }

        this.#updateSlider();
    }

    #navigate(direction) {
        const totalSlides = this.#slides.length;
        const slidesPerView = parseInt(this.getAttribute('slides-per-view') || '1', 10);
        this.#lastDirection = direction; // Update last direction
        this.#currentIndex += direction;

        // Boundary check with reset
        const maxVisibleIndex = totalSlides - slidesPerView;
        if (this.#currentIndex > maxVisibleIndex) {
            this.#currentIndex = 0; // Reset to start on "next" overflow
        } else if (this.#currentIndex < 0) {
            this.#currentIndex = maxVisibleIndex; // Reset to end on "previous" overflow
        }

        this.#updateSlider();
        this.#log('Navigated', { direction, currentIndex: this.#currentIndex, lastDirection: this.#lastDirection, slidesPerView, totalSlides, elementId: this.#uniqueId });
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

            const slideWidth = 100 / slidesPerView; // Base width percentage per visible slide
            const computedStyle = window.getComputedStyle(sliderContainer.querySelector('.slider-wrapper'));
            const gapValue = computedStyle.gridColumnGap; // Get the computed gap value
            const containerWidth = sliderContainer.getBoundingClientRect().width;
            const gapInPixels = parseFloat(gapValue) || 0; // Convert gap to pixels
            const gapPercentage = (gapInPixels / containerWidth) * 100; // Convert to percentage
            const effectiveSlideWidth = slideWidth + gapPercentage; // Total width per slide including gap

            this.#log('Gap calculation', { gapValue, gapInPixels, containerWidth, gapPercentage, effectiveSlideWidth });

            let initialTranslateX = -this.#currentIndex * effectiveSlideWidth;
            let initialIndex = this.#currentIndex;

            this.#log('UpdateSlider started', { initialIndex, initialTranslateX, lastDirection: this.#lastDirection, slidesPerView, totalSlides, elementId: this.#uniqueId });

            let translateX = -this.#currentIndex * effectiveSlideWidth;
            this.#log('Final values', { adjustedIndex: this.#currentIndex, translateX, slidesPerView, totalSlides, elementId: this.#uniqueId });

            const wrapper = sliderContainer.querySelector('.slider-wrapper');
            wrapper.style.transition = 'transform 0.5s'; // Ensure transition is applied
            wrapper.style.transform = `translateX(${translateX}%)`;

            // Update pagination if enabled
            if (this.hasAttribute('pagination')) {
                const pagination = sliderContainer.querySelector('.slider-pagination');
                if (pagination) {
                    const dots = pagination.querySelectorAll('.pagination-dot');
                    dots.forEach((dot, index) => {
                        dot.innerHTML = index === this.#currentIndex ? this.getAttribute('pagination-icon-active') : this.getAttribute('pagination-icon-inactive');
                    });
                    this.#log('Pagination updated', { currentIndex: this.#currentIndex, totalSlides, elementId: this.#uniqueId });
                }
            }

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
        sliderWrapper.style.position = 'relative'; // Ensure positioning context for pagination
        sliderWrapper.style.overflow = 'hidden';

        const innerWrapper = document.createElement('div');
        innerWrapper.className = 'slider-wrapper';
        innerWrapper.style.display = 'grid';
        innerWrapper.style.transition = 'transform 0.5s';
        innerWrapper.style.transform = 'translateX(0%)';
        innerWrapper.style.gridTemplateColumns = `repeat(${this.#childElements.length}, calc(100% / ${attrs.slidesPerView}))`;
        innerWrapper.style.gridAutoFlow = 'column';
        innerWrapper.style.height = '100%';
        innerWrapper.style.gridColumnGap = attrs.gap; // Apply gap attribute
        this.#log('Applied gap to slider-wrapper', { gap: attrs.gap });

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

        // Add pagination if enabled
        if (attrs.pagination) {
            const pagination = document.createElement('div');
            pagination.className = 'slider-pagination';
            pagination.style.position = 'absolute';
            pagination.style.bottom = '0';
            pagination.style.left = '50%';
            pagination.style.transform = 'translateX(-50%)';
            pagination.style.zIndex = '15'; // Above slides and navigation
            pagination.style.display = 'flex';
            pagination.style.justifyContent = 'center';
            pagination.style.padding = '5px';

            const totalSlides = this.#childElements.length;
            for (let i = 0; i < totalSlides; i++) {
                const dot = document.createElement('span');
                dot.className = 'pagination-dot';
                dot.style.cursor = 'pointer';
                dot.style.margin = '0 5px';
                dot.innerHTML = i === 0 ? attrs.paginationIconActive : attrs.paginationIconInactive;
                dot.addEventListener('click', () => {
                    this.#currentIndex = i;
                    this.#updateSlider();
                    this.#log('Pagination dot clicked', { newIndex: this.#currentIndex, elementId: this.#uniqueId });
                });
                pagination.appendChild(dot);
            }
            sliderWrapper.appendChild(pagination);
            this.#log('Pagination added', { totalSlides, elementId: this.#uniqueId });
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
        return ['autoplay', 'slides-per-view', 'navigation', 'navigation-icon-left', 'navigation-icon-right', 'gap', 'pagination', 'pagination-icon-active', 'pagination-icon-inactive'];
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
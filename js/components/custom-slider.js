/* global HTMLElement, IntersectionObserver, document, window, console, requestAnimationFrame */

'use strict';

import { getConfig } from '../config.js';
import { VIEWPORT_BREAKPOINTS } from '../shared.js';

class CustomSlider extends HTMLElement {
    // Private fields
    #ignoredChangeCount = 0;
    #basePath = null;
    #currentIndex = 0;
    #animationFrameId = null;
    #uniqueId = null;
    #autoplayInterval = null;
    #slides = [];
    #childElements = [];
    #lastDirection = 0;
    #attrs = null;
    #isDragging = false;
    #isHovering = false;
    #startPos = 0;
    #currentTranslate = 0;
    #prevTranslate = 0;
    #animationID = null;
    #slideWidth = 0;
    #gapPx = 0;
    #debouncedHandleResize = null;
    #originalLength = 0;
    #bufferSize = 0;
    #isAnimating = false;
    #continuousSpeed = 0;
    #lastFrameTime = null;
    #continuousAnimationId = null;
    #lastPaginationUpdate = 0;
    #isProcessingClick = false;
    #currentBreakpoint = null;
    #breakpointMediaQueries = new Map();
    #handleBreakpointChange = this.#onBreakpointChange.bind(this);

    constructor() {
        super();
        this.isVisible = false;
        this.isInitialized = false;
        this.debug = new URLSearchParams(window.location.search).get('debug') === 'true';
        this.#ignoredChangeCount = 0;
        this.#uniqueId = `slider-${Math.random().toString(36).substr(2, 9)}`;
        CustomSlider.#observer.observe(this);
        CustomSlider.#observedInstances.add(this);
        this.#log('Constructor initialized', { elementId: this.#uniqueId, version: '2025-10-29-v4' });
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
            console.groupCollapsed(`%c[CustomSlider] Warning: ${message}`, 'color: #FF9800; font-weight: bold;');
            if (data) console.log('%cData:', 'color: #4CAF50;', data);
            console.trace();
            console.groupEnd();
        }
    }

    #error(message, data = null) {
        if (this.debug) {
            console.groupCollapsed(`%c[CustomSlider] Error: ${message}`, 'color: #F44336; font-weight: bold;');
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
        }
        return this.#basePath;
    }

    #initializeBreakpoints() {
        this.#log('Initializing breakpoints', { elementId: this.#uniqueId });
        this.#breakpointMediaQueries.forEach(mq => {
            mq.removeEventListener('change', this.#handleBreakpointChange);
        });
        this.#breakpointMediaQueries.clear();

        VIEWPORT_BREAKPOINTS.forEach(bp => {
            const mediaQuery = window.matchMedia(bp.query);
            mediaQuery.addEventListener('change', this.#handleBreakpointChange);
            this.#breakpointMediaQueries.set(bp.name, mediaQuery);
        });

        this.#detectCurrentBreakpoint();
        this.#log('Breakpoints initialized', { breakpoints: Array.from(this.#breakpointMediaQueries.keys()) });
    }

    #detectCurrentBreakpoint() {
        if (this.#breakpointMediaQueries.size === 0) {
            this.#warn('Breakpoint media queries not initialized, reinitializing', {
                elementId: this.#uniqueId
            });
            this.#initializeBreakpoints();
        }

        let newBreakpoint = null;
        for (const [name, mediaQuery] of this.#breakpointMediaQueries) {
            if (mediaQuery.matches) {
                newBreakpoint = name;
                break;
            }
        }

        if (newBreakpoint && newBreakpoint !== this.#currentBreakpoint) {
            this.#currentBreakpoint = newBreakpoint;
            this.#log('Current breakpoint detected', { breakpoint: newBreakpoint, elementId: this.#uniqueId });
            this.#applyResponsiveSlidesPerView();
        }
    }

    #onBreakpointChange() {
        this.#detectCurrentBreakpoint();
    }

    #getAttributes() {
        const slidesPerViewAttr = this.getAttribute('slides-per-view');
        const slidesPerView = slidesPerViewAttr ? parseInt(slidesPerViewAttr, 10) : 1;
        const responsiveSlides = {};

        VIEWPORT_BREAKPOINTS.forEach(bp => {
            const attrName = `slides-per-view-${bp.name}`;
            const phoneAttrName = `slides-per-view-phone`; // Backward compatibility
            const value = this.getAttribute(attrName) || (bp.name === 'mobile' ? this.getAttribute(phoneAttrName) : null);
            if (value) {
                responsiveSlides[bp.name] = parseInt(value, 10);
            }
        });

        this.#log('Slides-per-view attributes parsed', {
            slidesPerView,
            responsiveSlides,
            elementId: this.#uniqueId
        });

        return {
            slidesPerView: !isNaN(slidesPerView) ? slidesPerView : 1,
            gap: this.getAttribute('gap') || '0px',
            draggable: this.hasAttribute('draggable'),
            pagination: this.hasAttribute('pagination'),
            navigation: this.hasAttribute('navigation'),
            crossFade: this.hasAttribute('cross-fade'),
            autoplay: this.getAttribute('autoplay') || null,
            navigationIconLeft: this.getAttribute('navigation-icon-left') || '<i class="fa fa-angle-left"></i>',
            navigationIconRight: this.getAttribute('navigation-icon-right') || '<i class="fa fa-angle-right"></i>',
            navigationIconSize: this.getAttribute('navigation-icon-size') || '1rem',
            paginationIconActive: this.getAttribute('pagination-icon-active') || '<i class="fa fa-circle"></i>',
            paginationIconInactive: this.getAttribute('pagination-icon-inactive') || '<i class="fa fa-circle-o"></i>',
            paginationIconSize: this.getAttribute('pagination-icon-size') || '0.5rem',
            responsiveSlides
        };
    }

    async #collectSlides() {
        // Wait for custom-block elements to be defined and rendered
        await customElements.whenDefined('custom-block');
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay for rendering

        this.#childElements = Array.from(this.children).filter(child => child.tagName.toLowerCase() === 'custom-block');
        this.#slides = [...this.#childElements];

        if (this.#slides.length === 0) {
            this.#warn('No valid slides found', { elementId: this.#uniqueId });
            return;
        }

        this.#originalLength = this.#slides.length;
        this.#bufferSize = Math.ceil(this.#attrs.slidesPerView) + 1;
        this.#slides.forEach(slide => slide.classList.add('slider-slide'));

        // Clone slides for continuous scrolling if needed
        if (this.#originalLength > 0 && !this.#attrs.crossFade) {
            const clonesBefore = this.#slides.slice(-this.#bufferSize).map(slide => slide.cloneNode(true));
            const clonesAfter = this.#slides.slice(0, this.#bufferSize).map(slide => slide.cloneNode(true));
            this.#slides = [...clonesBefore, ...this.#slides, ...clonesAfter];
        }

        this.#log('Slides collected', {
            originalSlides: this.#originalLength,
            totalSlides: this.#slides.length,
            elementId: this.#uniqueId
        });
    }

    #applyResponsiveSlidesPerView() {
        const newSlidesPerView = this.#attrs.responsiveSlides[this.#currentBreakpoint] || this.#attrs.slidesPerView;
        if (newSlidesPerView !== this.#attrs.slidesPerView) {
            this.#log('Applying responsive slides-per-view', {
                breakpoint: this.#currentBreakpoint,
                newSlidesPerView,
                previousSlidesPerView: this.#attrs.slidesPerView,
                elementId: this.#uniqueId
            });
            this.#attrs.slidesPerView = newSlidesPerView;
            this.#recalculateDimensions();
            this.#updateSliderLayout(true);
        } else {
            this.#log('No change in slides-per-view', {
                breakpoint: this.#currentBreakpoint,
                newSlidesPerView,
                currentSlidesPerView: this.#attrs.slidesPerView,
                elementId: this.#uniqueId
            });
        }
    }

    #recalculateDimensions() {
        if (!this.#slides.length) return;

        const containerWidth = this.clientWidth;
        this.#gapPx = parseFloat(getComputedStyle(this).getPropertyValue('--space-tiny') || '0px');
        this.#slideWidth = (containerWidth - (this.#attrs.slidesPerView - 1) * this.#gapPx) / this.#attrs.slidesPerView;

        this.#slides.forEach(slide => {
            slide.style.width = `${this.#slideWidth}px`;
            slide.style.marginRight = this.#attrs.gap;
        });

        this.#log('Dimensions recalculated', {
            containerWidth,
            slideWidth: this.#slideWidth,
            gapPx: this.#gapPx,
            slidesPerView: this.#attrs.slidesPerView,
            elementId: this.#uniqueId
        });
    }

    #updateSliderLayout(forceUpdate = false) {
        if (!this.#slides.length) return;

        const translate = -this.#currentIndex * (this.#slideWidth + this.#gapPx);
        this.#currentTranslate = translate;
        this.querySelector('.slider-wrapper').style.transform = `translateX(${translate}px)`;

        this.#updatePagination();
        this.#log('[Slider Updated]', {
            currentIndex: this.#currentIndex,
            translate,
            forceUpdate,
            elementId: this.#uniqueId
        });
    }

    #updatePagination() {
        if (!this.#attrs.pagination || !this.#slides.length) return;

        const totalDots = Math.ceil(this.#originalLength / this.#attrs.slidesPerView);
        const logicalIndex = Math.floor(this.#currentIndex % this.#originalLength);
        const pagination = this.querySelector('.slider-pagination');
        if (pagination) {
            pagination.innerHTML = '';
            for (let i = 0; i < totalDots; i++) {
                const dot = document.createElement('span');
                dot.innerHTML = i === Math.floor(logicalIndex / this.#attrs.slidesPerView) ?
                    this.#attrs.paginationIconActive : this.#attrs.paginationIconInactive;
                dot.style.fontSize = this.#attrs.paginationIconSize;
                dot.addEventListener('click', () => this.#goToSlide(i * this.#attrs.slidesPerView));
                pagination.appendChild(dot);
            }
        }

        this.#log('[Pagination Updated]', {
            currentIndex: this.#currentIndex,
            logicalIndex,
            translate: this.#currentTranslate,
            elementId: this.#uniqueId
        });
    }

    #goToSlide(index) {
        if (this.#isProcessingClick || this.#isAnimating) return;
        this.#isProcessingClick = true;

        this.#currentIndex = index;
        this.#updateSliderLayout();
        this.#isProcessingClick = false;
    }

    async initialize() {
        if (this.isInitialized) return;
        this.isInitialized = true;

        this.#log('Initialization started', { elementId: this.#uniqueId });

        this.#attrs = this.#getAttributes();
        await this.#collectSlides();

        // Initialize breakpoints before rendering
        this.#initializeBreakpoints();

        // Render slider
        this.#renderSlider();
        this.#recalculateDimensions();
        this.#updateSliderLayout(true);

        // Setup event listeners
        this.#setupEventListeners();

        this.#log('Initialization completed', { elementId: this.#uniqueId });
    }

    #renderSlider() {
        this.innerHTML = `
            <div class="slider-container">
                <div class="slider-wrapper"></div>
                ${this.#attrs.navigation ? `
                    <button class="slider-nav slider-nav-left">${this.#attrs.navigationIconLeft}</button>
                    <button class="slider-nav slider-nav-right">${this.#attrs.navigationIconRight}</button>
                ` : ''}
                ${this.#attrs.pagination ? '<div class="slider-pagination"></div>' : ''}
            </div>
        `;

        const wrapper = this.querySelector('.slider-wrapper');
        this.#slides.forEach(slide => wrapper.appendChild(slide));

        this.#log('Rendering slider with attributes', {
            attributes: this.#attrs,
            elementId: this.#uniqueId
        });
    }

    #setupEventListeners() {
        if (this.#attrs.draggable) {
            this.addEventListener('mousedown', this.#startDragging.bind(this));
            this.addEventListener('mousemove', this.#drag.bind(this));
            this.addEventListener('mouseup', this.#stopDragging.bind(this));
            this.addEventListener('mouseleave', this.#stopDragging.bind(this));
        }

        if (this.#attrs.navigation) {
            this.querySelector('.slider-nav-left')?.addEventListener('click', () => this.#goToSlide(this.#currentIndex - this.#attrs.slidesPerView));
            this.querySelector('.slider-nav-right')?.addEventListener('click', () => this.#goToSlide(this.#currentIndex + this.#attrs.slidesPerView));
        }

        this.#debouncedHandleResize = this.#debounce(() => this.#handleResize(), 100);
        window.addEventListener('resize', this.#debouncedHandleResize);
    }

    #startDragging(e) {
        this.#isDragging = true;
        this.#startPos = e.clientX;
        this.#prevTranslate = this.#currentTranslate;
        this.#animationID = requestAnimationFrame(this.#animation.bind(this));
    }

    #drag(e) {
        if (this.#isDragging) {
            const currentPosition = e.clientX;
            this.#currentTranslate = this.#prevTranslate + currentPosition - this.#startPos;
        }
    }

    #stopDragging() {
        if (this.#isDragging) {
            this.#isDragging = false;
            cancelAnimationFrame(this.#animationID);
            const movedBy = this.#currentTranslate - this.#prevTranslate;
            if (Math.abs(movedBy) > this.#slideWidth / 4) {
                this.#currentIndex += movedBy > 0 ? -this.#attrs.slidesPerView : this.#attrs.slidesPerView;
            }
            this.#updateSliderLayout();
        }
    }

    #animation() {
        if (this.#isDragging) {
            this.querySelector('.slider-wrapper').style.transform = `translateX(${this.#currentTranslate}px)`;
            this.#animationID = requestAnimationFrame(this.#animation.bind(this));
        }
    }

    #debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func.apply(this, args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    #handleResize() {
        this.#detectCurrentBreakpoint();
        this.#recalculateDimensions();
        this.#updateSliderLayout(true);
        this.#log('Resize handled', { elementId: this.#uniqueId });
    }

    connectedCallback() {
        this.#childElements = Array.from(this.children);
        this.#log('Connected to DOM, child elements detected', {
            childCount: this.#childElements.length,
            elementId: this.#uniqueId
        });
    }

    disconnectedCallback() {
        this.#breakpointMediaQueries.forEach(mq => {
            mq.removeEventListener('change', this.#handleBreakpointChange);
        });
        window.removeEventListener('resize', this.#debouncedHandleResize);
        this.#log('Disconnected and cleaned up', { elementId: this.#uniqueId });
    }

    static get observedAttributes() {
        return ['slides-per-view', 'slides-per-view-mobile', 'gap', 'draggable', 'pagination', 'navigation', 'cross-fade', 'autoplay', 'navigation-icon-left', 'navigation-icon-right', 'navigation-icon-size', 'pagination-icon-active', 'pagination-icon-inactive', 'pagination-icon-size'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (!this.isInitialized) {
            this.#ignoredChangeCount++;
            this.#log('Attribute change ignored', {
                name,
                oldValue,
                newValue,
                ignoredCount: this.#ignoredChangeCount,
                elementId: this.#uniqueId
            });
            return;
        }

        this.#attrs = this.#getAttributes();
        this.#recalculateDimensions();
        this.#updateSliderLayout(true);
    }
}

try {
    console.log('Attempting to define CustomSlider');
    customElements.define('custom-slider', CustomSlider);
    console.log('CustomSlider defined successfully');
} catch (e) {
    console.error('Failed to define CustomSlider:', e);
}

console.log('CustomSlider version: 2025-10-29-v4 (fixed slide detection, improved responsive handling)');
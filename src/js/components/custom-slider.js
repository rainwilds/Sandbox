'use strict';
import { getConfig } from '../config.js';
import { VIEWPORT_BREAKPOINTS } from '../shared.js';
import { CustomSliderController } from './interactive-controller.js';
import { GridPlacementMixin } from '../mixins/grid-placement.js';

class CustomSlider extends GridPlacementMixin(HTMLElement) {

    static dependencies = ['custom-block'];

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

    constructor() {
        super();
        this.isVisible = false;
        this.isInitialized = false;
        this.debug = new URLSearchParams(window.location.search).get('debug') === 'true';
        this.#ignoredChangeCount = 0;
        this.#uniqueId = `slider-${Math.random().toString(36).substr(2, 9)}`;
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
            try {
                const config = await getConfig();
                this.#basePath = config.general?.basePath || '/';
            } catch (error) {
                this.#basePath = '/';
            }
        }
        return this.#basePath;
    }

    #parseIcon(iconString, fallbackIcon) {
        if (!iconString) return fallbackIcon || '';

        const decodedIcon = iconString
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'");

        const parser = new DOMParser();
        const doc = parser.parseFromString(decodedIcon, 'text/html');

        const svgElement = doc.body.querySelector('svg');
        if (svgElement) {
            if (!svgElement.hasAttribute('fill') && !svgElement.hasAttribute('stroke')) {
                svgElement.setAttribute('fill', 'currentColor');
            }
            svgElement.setAttribute('width', '1em');
            svgElement.setAttribute('height', '1em');
            svgElement.classList.add('builder-inline-svg');

            return svgElement.outerHTML;
        }

        return fallbackIcon || '';
    }

    async getAttributes() {
        const breakpointAttrs = [
            'slides-per-view-mobile',
            'slides-per-view-tablet',
            'slides-per-view-laptop',
            'slides-per-view-desktop',
            'slides-per-view-large'
        ];
        const slidesPerViewConfig = {};
        let defaultSlidesPerView = 1;
        let useBreakpoints = false;
        const definedBreakpoints = breakpointAttrs.filter(attr => this.hasAttribute(attr));

        if (definedBreakpoints.length > 0) {
            useBreakpoints = true;
            for (const attr of breakpointAttrs) {
                if (!this.hasAttribute(attr)) {
                    useBreakpoints = false;
                    break;
                }
                const value = this.getAttribute(attr);
                const num = parseInt(value, 10);
                if (isNaN(num) || num < 1) {
                    useBreakpoints = false;
                    break;
                }
                const breakpointName = attr.replace('slides-per-view-', '');
                slidesPerViewConfig[breakpointName] = num;
            }
        }

        const defaultAttr = this.getAttribute('slides-per-view') || '1';
        defaultSlidesPerView = Math.max(1, parseInt(defaultAttr, 10)) || 1;

        let autoplayType = 'none';
        let autoplayDelay = 0;
        let continuousSpeed = 100;
        const autoplayAttr = this.getAttribute('autoplay');
        if (this.hasAttribute('autoplay')) {
            if (autoplayAttr === '' || autoplayAttr === null) {
                autoplayType = 'interval';
                autoplayDelay = 3000;
            } else if (autoplayAttr.startsWith('continuous')) {
                autoplayType = 'continuous';
                const parts = autoplayAttr.split(/\s+/);
                if (parts.length === 2) {
                    const speedMatch = parts[1].match(/^(\d+)(?:px\/s)?$/);
                    if (speedMatch) {
                        continuousSpeed = parseInt(speedMatch[1], 10);
                        if (continuousSpeed <= 0) continuousSpeed = 100;
                    }
                }
            } else {
                const timeMatch = autoplayAttr.match(/^(\d+)(s|ms)$/);
                if (timeMatch) {
                    autoplayType = 'interval';
                    const value = parseInt(timeMatch[1], 10);
                    const unit = timeMatch[2];
                    autoplayDelay = unit === 's' ? value * 1000 : value;
                } else {
                    autoplayType = 'none';
                }
            }
        }

        const defaultNavLeft = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>';
        const defaultNavRight = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>';
        const defaultDotActive = '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="6"></circle></svg>';
        const defaultDotInactive = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="6"></circle></svg>';

        let navigation = this.hasAttribute('navigation');
        let pagination = this.hasAttribute('pagination');

        if (autoplayType === 'continuous') {
            navigation = false;
            pagination = false;
        }

        let navigationIconLeft = this.getAttribute('navigation-icon-left') || defaultNavLeft;
        let navigationIconRight = this.getAttribute('navigation-icon-right') || defaultNavRight;
        let navigationIconLeftBackground = this.getAttribute('navigation-icon-left-background') || '';
        let navigationIconRightBackground = this.getAttribute('navigation-icon-right-background') || '';
        
        const navigationIconSize = this.getAttribute('navigation-icon-size') || '';
        let iconSizeBackground = '';
        let iconSizeForeground = '';
        if (navigationIconSize) {
            const sizes = navigationIconSize.trim().split(/\s+/);
            const validSizeRegex = /^(\d*\.?\d+(?:px|rem|em|%)|var\(--[a-zA-Z0-9-]+\))$/;
            if (sizes.length === 1 && validSizeRegex.test(sizes[0])) {
                iconSizeBackground = sizes[0];
                iconSizeForeground = sizes[0];
            } else if (sizes.length === 2 && sizes.every(size => validSizeRegex.test(size))) {
                iconSizeBackground = sizes[0];
                iconSizeForeground = sizes[1];
            }
        }

        const paginationIconSize = this.getAttribute('pagination-icon-size') || '';
        let paginationIconSizeActive = '';
        let paginationIconSizeInactive = '';
        if (paginationIconSize) {
            const sizes = paginationIconSize.trim().split(/\s+/);
            const validSizeRegex = /^(\d*\.?\d+(?:px|rem|em|%)|var\(--[a-zA-Z0-9-]+\))$/;
            if (sizes.length === 1 && validSizeRegex.test(sizes[0])) {
                paginationIconSizeActive = sizes[0];
                paginationIconSizeInactive = sizes[0];
            } else if (sizes.length === 2 && sizes.every(size => validSizeRegex.test(size))) {
                paginationIconSizeActive = sizes[0];
                paginationIconSizeInactive = sizes[1];
            }
        }

        const gapAttr = this.getAttribute('gap') || '0';
        let gap = gapAttr;

        let paginationPosition = this.getAttribute('pagination-position') || 'overlay';
        if (!['overlay', 'below'].includes(paginationPosition)) {
            paginationPosition = 'overlay';
        }

        let paginationIconActive = this.getAttribute('pagination-icon-active') || defaultDotActive;
        let paginationIconInactive = this.getAttribute('pagination-icon-inactive') || defaultDotInactive;
        const crossFade = this.hasAttribute('cross-fade');

        if (crossFade && autoplayType === 'continuous') {
            autoplayType = 'none';
            continuousSpeed = 0;
        }

        const infiniteScrolling = this.hasAttribute('infinite-scrolling');
        const pauseOnHover = this.hasAttribute('pause-on-hover');

        const processIconStack = (iconStr, bgIconStr, fallback) => {
            const foreground = this.#parseIcon(iconStr, fallback);
            const background = bgIconStr ? this.#parseIcon(bgIconStr, '') : '';
            
            if (!foreground) return { valid: false, markup: '' };
            if (!background) return { valid: true, markup: foreground };
            
            return {
                valid: true,
                markup: `<span class="icon-stack" style="position: relative; display: inline-flex; align-items: center; justify-content: center;">
                            <span style="position: absolute; display: flex;">${background}</span>
                            <span style="position: relative; z-index: 1; display: flex;">${foreground}</span>
                         </span>`
            };
        };

        let leftIconResult = processIconStack(navigationIconLeft, navigationIconLeftBackground, defaultNavLeft);
        let rightIconResult = processIconStack(navigationIconRight, navigationIconRightBackground, defaultNavRight);

        navigation = navigation && leftIconResult.valid && rightIconResult.valid;
        
        paginationIconActive = this.#parseIcon(paginationIconActive, defaultDotActive);
        paginationIconInactive = this.#parseIcon(paginationIconInactive, defaultDotInactive);

        return {
            autoplayType,
            autoplayDelay,
            continuousSpeed,
            defaultSlidesPerView,
            slidesPerViewConfig,
            useBreakpoints,
            navigation,
            navigationIconLeft: leftIconResult.markup,
            navigationIconRight: rightIconResult.markup,
            gap,
            pagination,
            paginationPosition,
            paginationIconActive,
            paginationIconInactive,
            iconSizeBackground,
            iconSizeForeground,
            paginationIconSizeActive,
            paginationIconSizeInactive,
            crossFade,
            infiniteScrolling,
            pauseOnHover
        };
    }

    #getCurrentBreakpoint() {
        if (!this.#attrs || !this.#attrs.useBreakpoints) return null;
        
        const width = window.innerWidth;
        let selectedBreakpoint = 'large';
        if (!VIEWPORT_BREAKPOINTS || !Array.isArray(VIEWPORT_BREAKPOINTS)) return selectedBreakpoint;
        
        for (const bp of VIEWPORT_BREAKPOINTS) {
            if (width <= bp.maxWidth) {
                selectedBreakpoint = bp.name;
                break;
            }
        }
        return selectedBreakpoint;
    }

    #getSlidesPerView() {
        if (!this.#attrs) return 1;
        if (!this.#attrs.useBreakpoints) return this.#attrs.defaultSlidesPerView;
        
        const bp = this.#getCurrentBreakpoint();
        const spv = this.#attrs.slidesPerViewConfig[bp] ?? this.#attrs.defaultSlidesPerView;
        return spv;
    }

    #applySlidesPerView() {
        const newSpv = this.#getSlidesPerView();

        if (this.#attrs) {
            this.#attrs.slidesPerView = newSpv;
            this.#bufferSize = newSpv;
        }

        this.#recalculateDimensions();
        if (this.#attrs?.useBreakpoints) {
            this.#rebuildInfiniteBuffer();
        }

        if (!this.#attrs.infiniteScrolling) {
            const maxIndex = Math.max(0, this.#originalLength - this.#attrs.slidesPerView);
            this.#currentIndex = Math.min(this.#currentIndex, maxIndex);
        }

        const wrapper = document.getElementById(this.#uniqueId)?.querySelector('.slider-wrapper');
        if (wrapper) {
            wrapper.style.setProperty('--slider-columns', `repeat(${this.#slides.length}, ${100 / newSpv}%)`);
        }

        this.#setPositionByIndex();

        if (this.#attrs?.pagination) {
            this.#updatePagination();
        }

        this.#updateSlider(true);
    }

    #updatePagination() {
        const sliderContainer = document.getElementById(this.#uniqueId);
        if (!sliderContainer || !this.#attrs.pagination) return;

        this.#childElements = Array.from(sliderContainer.querySelectorAll('.slider-slide'))
            .map(slide => slide.cloneNode(true));
        const totalSlides = this.#childElements.length;

        if (!this.#originalLength) {
            this.#originalLength = totalSlides;
        }

        let pagination = sliderContainer.querySelector('.slider-pagination');
        if (!pagination) {
            pagination = document.createElement('div');
            pagination.className = 'slider-pagination';
            sliderContainer.appendChild(pagination);
        } else {
            pagination.innerHTML = ''; 
        }

        // --- PURE CSS PAGINATION SWAPPING ---
        if (!sliderContainer.querySelector('.pagination-styles')) {
            const paginationStyles = document.createElement('style');
            paginationStyles.className = 'pagination-styles';
            paginationStyles.textContent = `
                #${this.#uniqueId} .slider-pagination .icon-active-state { display: none; width: 100%; height: 100%; align-items: center; justify-content: center; }
                #${this.#uniqueId} .slider-pagination .icon.is-active .icon-active-state { display: flex; }
                #${this.#uniqueId} .slider-pagination .icon-inactive-state { display: flex; width: 100%; height: 100%; align-items: center; justify-content: center; }
                #${this.#uniqueId} .slider-pagination .icon.is-active .icon-inactive-state { display: none; }
                #${this.#uniqueId} .slider-pagination .icon { cursor: pointer; }
            `;
            sliderContainer.appendChild(paginationStyles);
        }

        const totalDots = this.#attrs.infiniteScrolling
            ? this.#originalLength
            : Math.max(1, this.#originalLength - this.#attrs.slidesPerView + 1);

        for (let i = 0; i < totalDots; i++) {
            const dot = document.createElement('span');
            dot.className = 'icon';
            
            const logicalIndex = this.#attrs.infiniteScrolling
                ? (this.#currentIndex - this.#bufferSize + this.#originalLength) % this.#originalLength
                : Math.max(0, Math.min(this.#currentIndex, this.#originalLength - this.#attrs.slidesPerView));
            
            const isActive = i === logicalIndex;

            // Notice: No inline display toggling here anymore!
            dot.innerHTML = `
                <span class="icon-active-state">${this.#attrs.paginationIconActive}</span>
                <span class="icon-inactive-state">${this.#attrs.paginationIconInactive}</span>
            `;

            if (isActive) dot.classList.add('is-active');

            const activeSvg = dot.querySelector('.icon-active-state .builder-inline-svg');
            const inactiveSvg = dot.querySelector('.icon-inactive-state .builder-inline-svg');
            
            if (activeSvg && this.#attrs.paginationIconSizeActive) {
                activeSvg.style.fontSize = this.#attrs.paginationIconSizeActive;
                activeSvg.style.width = this.#attrs.paginationIconSizeActive;
                activeSvg.style.height = this.#attrs.paginationIconSizeActive;
            }
            if (inactiveSvg && this.#attrs.paginationIconSizeInactive) {
                inactiveSvg.style.fontSize = this.#attrs.paginationIconSizeInactive;
                inactiveSvg.style.width = this.#attrs.paginationIconSizeInactive;
                inactiveSvg.style.height = this.#attrs.paginationIconSizeInactive;
            }
            
            dot.addEventListener('click', () => {
                if (this.#isProcessingClick) return;
                this.#isProcessingClick = true;
                if (this.#continuousAnimationId) {
                    cancelAnimationFrame(this.#continuousAnimationId);
                    this.#continuousAnimationId = null;
                }
                this.#stopAutoplay();
                if (this.#attrs.infiniteScrolling && this.#attrs.slidesPerView > 1) {
                    this.#currentIndex = i + this.#bufferSize;
                } else {
                    this.#currentIndex = i;
                }
                this.#currentTranslate = this.#calculateTranslate();
                this.#prevTranslate = this.#currentTranslate;
                this.#setSliderPosition('0s');
                setTimeout(() => {
                    this.#updateSlider(true);
                    this.#isProcessingClick = false;
                    if (this.#attrs.autoplayType !== 'none' && !this.#isHovering) {
                        this.#startAutoplay(this.#attrs.autoplayType, this.#attrs.autoplayDelay, this.#attrs.continuousSpeed);
                    }
                }, 50);
            });
            pagination.appendChild(dot);
        }
    }

    #rebuildInfiniteBuffer() {
        if (!this.#attrs.infiniteScrolling || this.#originalLength <= this.#attrs.slidesPerView) return;

        const wrapper = document.getElementById(this.#uniqueId).querySelector('.slider-wrapper');
        const originalSlides = this.#slides.slice(this.#bufferSize, this.#bufferSize + this.#originalLength);
        const leftBuffer = originalSlides.slice(-this.#bufferSize).map(slide => slide.cloneNode(true));
        const rightBuffer = originalSlides.slice(0, this.#bufferSize).map(slide => slide.cloneNode(true));
        wrapper.innerHTML = '';
        [...leftBuffer, ...originalSlides, ...rightBuffer].forEach(s => wrapper.appendChild(s));
        this.#slides = Array.from(wrapper.querySelectorAll('.slider-slide'));
        this.#currentIndex = this.#bufferSize + (this.#currentIndex - this.#bufferSize) % this.#originalLength;
        this.#currentTranslate = this.#calculateTranslate();
        wrapper.style.transition = 'none';
        wrapper.style.transform = `translate3d(${this.#currentTranslate}px, 0, 0)`;
    }

    async initialize() {
        if (this.isInitialized || !this.isVisible) return;

        // VISUAL BUILDER SAFEGUARD
        if (this.closest('#canvas') || this.closest('visual-builder')) {
            this.style.display = 'flex';
            this.style.gap = '16px';
            this.style.overflowX = 'auto';
            this.style.padding = '10px';
            this.style.border = '2px dashed #3b82f6';
            this.isInitialized = true;
            return;
        }

        if (this.#childElements.length === 0) {
            const slides = this.querySelectorAll('custom-block, .block');
            this.#childElements = Array.from(slides).map(child => child.cloneNode(true));
        }

        this.isInitialized = true;

        try {
            const attrs = await this.getAttributes();
            if (!attrs.useBreakpoints && !this.hasAttribute('slides-per-view')) {
                attrs.defaultSlidesPerView = 1;
                attrs.slidesPerView = 1;
            }
            this.#attrs = attrs;
            this.#attrs.slidesPerView = this.#getSlidesPerView();

            const sliderElement = await this.render(attrs);

            if (sliderElement) {
                this.innerHTML = '';
                this.appendChild(sliderElement);

                if (!this.controller) {
                    this.controller = new CustomSliderController(sliderElement);
                }

                this.#setupSlider();
            } else {
                await this.#renderFallback();
            }
        } catch (error) {
            await this.#renderFallback();
        }
    }

    async #renderFallback() {
        const fallback = await this.render({
            autoplayType: 'none',
            autoplayDelay: 0,
            continuousSpeed: 0,
            defaultSlidesPerView: 1,
            slidesPerViewConfig: {},
            useBreakpoints: false,
            navigation: false,
            gap: '0',
            pagination: false,
            paginationPosition: 'overlay',
            paginationIconActive: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="6"></circle></svg>',
            paginationIconInactive: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="6"></circle></svg>',
            iconSizeBackground: '',
            iconSizeForeground: '',
            paginationIconSizeActive: '',
            paginationIconSizeInactive: '',
            crossFade: false,
            infiniteScrolling: false,
            pauseOnHover: false
        });

        this.innerHTML = '';
        this.appendChild(fallback);
    }

    #setupSlider() {
        const sliderContainer = document.getElementById(this.#uniqueId);
        if (!sliderContainer) return;

        this.#slides = Array.from(sliderContainer.querySelectorAll('.slider-slide'));
        if (this.#slides.length === 0) return;

        const originalSlides = this.#slides;
        this.#originalLength = originalSlides.length;
        this.#bufferSize = this.#attrs.slidesPerView;
        const wrapper = sliderContainer.querySelector('.slider-wrapper');
        const enableInfinite = this.#attrs.infiniteScrolling && this.#originalLength > this.#bufferSize;

        if (enableInfinite) {
            const leftBuffer = originalSlides.slice(-this.#bufferSize).map(slide => slide.cloneNode(true));
            const rightBuffer = originalSlides.slice(0, this.#bufferSize).map(slide => slide.cloneNode(true));
            wrapper.innerHTML = '';
            leftBuffer.forEach(slide => wrapper.appendChild(slide));
            originalSlides.forEach(slide => wrapper.appendChild(slide));
            rightBuffer.forEach(slide => wrapper.appendChild(slide));
            this.#slides = Array.from(wrapper.querySelectorAll('.slider-slide'));
            this.#currentIndex = this.#bufferSize;
            this.#currentTranslate = this.#calculateTranslate();
        } else {
            wrapper.innerHTML = '';
            originalSlides.forEach(slide => wrapper.appendChild(slide));
            this.#slides = originalSlides;
            this.#currentIndex = 0;
            this.#currentTranslate = 0;
        }

        this.#recalculateDimensions();
        this.#applySlidesPerView();

        if (this.hasAttribute('draggable')) {
            sliderContainer.setAttribute('draggable', '');
        }

        if (this.#attrs.crossFade && this.#attrs.slidesPerView === 1) {
            sliderContainer.setAttribute('cross-fade', '');
            const displayIndex = this.#currentIndex % this.#originalLength;
            this.#slides.forEach((slide, index) => {
                const isActive = index === displayIndex;
                slide.style.opacity = isActive ? '1' : '0';
                if (isActive) slide.classList.add('active');
            });
        }

        if (this.#attrs.gap && this.#attrs.gap !== '0' && (!this.#attrs.crossFade || this.#attrs.slidesPerView !== 1)) {
            wrapper.style.setProperty('--slider-gap', this.#attrs.gap);
            sliderContainer.setAttribute('gap', '');
        }

        wrapper.style.setProperty('--slider-columns', `repeat(${this.#slides.length}, ${100 / this.#attrs.slidesPerView}%)`);

        if (this.hasAttribute('draggable')) {
            wrapper.addEventListener('pointerdown', this.#pointerDown.bind(this));
            wrapper.addEventListener('pointerup', this.#pointerUp.bind(this));
            wrapper.addEventListener('pointercancel', this.#pointerCancel.bind(this));
            wrapper.addEventListener('pointerleave', this.#pointerCancel.bind(this));
            wrapper.addEventListener('pointermove', this.#pointerMove.bind(this));
            window.addEventListener('contextmenu', (event) => {
                if (event.target.closest('.slider-wrapper')) {
                    event.preventDefault();
                    event.stopPropagation();
                    return false;
                }
            });
        }

        if (this.#attrs.pauseOnHover) {
            sliderContainer.addEventListener('mouseenter', () => {
                this.#isHovering = true;
                this.#stopAutoplay();
            });
            sliderContainer.addEventListener('mouseleave', () => {
                this.#isHovering = false;
                if (this.#attrs.autoplayType !== 'none') {
                    this.#startAutoplay(this.#attrs.autoplayType, this.#attrs.autoplayDelay, this.#attrs.continuousSpeed);
                }
            });
        }

        if (this.#attrs.navigation) {
            const prevButton = document.getElementById(`${this.#uniqueId}-prev`);
            const nextButton = document.getElementById(`${this.#uniqueId}-next`);
            if (prevButton && nextButton) {
                prevButton.addEventListener('click', () => {
                    this.#stopAutoplay();
                    this.#navigate(-1);
                    if (this.#attrs.autoplayType !== 'none' && !this.#isHovering) {
                        this.#startAutoplay(this.#attrs.autoplayType, this.#attrs.autoplayDelay, this.#attrs.continuousSpeed);
                    }
                });
                nextButton.addEventListener('click', () => {
                    this.#stopAutoplay();
                    this.#navigate(1);
                    if (this.#attrs.autoplayType !== 'none' && !this.#isHovering) {
                        this.#startAutoplay(this.#attrs.autoplayType, this.#attrs.autoplayDelay, this.#attrs.continuousSpeed);
                    }
                });
            }
        }

        if (this.#attrs.pagination) {
            const pagination = sliderContainer.querySelector('.slider-pagination');
            if (pagination) {
                const dots = pagination.querySelectorAll('span.icon');
                dots.forEach((dot, index) => {
                    dot.addEventListener('click', () => {
                        if (this.#isProcessingClick) return;
                        this.#isProcessingClick = true;
                        if (this.#continuousAnimationId) {
                            cancelAnimationFrame(this.#continuousAnimationId);
                            this.#continuousAnimationId = null;
                        }
                        this.#stopAutoplay();
                        if (this.#attrs.infiniteScrolling && this.#attrs.slidesPerView > 1) {
                            this.#currentIndex = index + this.#bufferSize;
                        } else {
                            this.#currentIndex = index;
                        }
                        this.#currentTranslate = this.#calculateTranslate();
                        this.#prevTranslate = this.#currentTranslate;
                        this.#setSliderPosition('0s');
                        setTimeout(() => {
                            this.#updateSlider(true);
                            this.#isProcessingClick = false;
                            if (this.#attrs.autoplayType !== 'none' && !this.#isHovering) {
                                this.#startAutoplay(this.#attrs.autoplayType, this.#attrs.autoplayDelay, this.#attrs.continuousSpeed);
                            }
                        }, 50);
                    });
                });
            }
        }

        if (this.#attrs.autoplayType !== 'none' && !this.#isHovering) {
            this.#startAutoplay(this.#attrs.autoplayType, this.#attrs.autoplayDelay, this.#attrs.continuousSpeed);
        }

        this.#debouncedHandleResize = this.#debounce(() => {
            this.#recalculateDimensions();
            this.#applySlidesPerView();
        }, 100);

        window.addEventListener('resize', this.#debouncedHandleResize);
        this.#updateSlider();
    }

    #debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    #recalculateDimensions() {
        const sliderContainer = document.getElementById(this.#uniqueId);
        if (sliderContainer && this.#slides.length > 0) {
            this.#slideWidth = sliderContainer.clientWidth / this.#attrs.slidesPerView;
            const wrapper = sliderContainer.querySelector('.slider-wrapper');
            this.#gapPx = parseFloat(window.getComputedStyle(wrapper).columnGap) || 0;
        }
    }

    #pointerDown(event) {
        if (this.#attrs.crossFade && this.#attrs.slidesPerView === 1) return;
        if (event.pointerType === 'touch' || event.pointerType === 'mouse') {
            this.#stopAutoplay();
            this.#isDragging = true;
            this.#startPos = event.clientX;
            this.#prevTranslate = this.#currentTranslate;
            this.#animationID = requestAnimationFrame(this.#animation.bind(this));
            const wrapper = document.getElementById(this.#uniqueId).querySelector('.slider-wrapper');
            wrapper.classList.add('dragging');
            event.target.setPointerCapture(event.pointerId);
        }
    }

    #pointerMove(event) {
        if (this.#isDragging && !this.#attrs.crossFade) {
            const currentPosition = event.clientX;
            this.#currentTranslate = this.#prevTranslate + currentPosition - this.#startPos;
            const maxIndex = this.#slides.length - this.#attrs.slidesPerView;
            const minTranslate = this.#calculateTranslateForIndex(maxIndex);
            const maxTranslate = this.#calculateTranslateForIndex(0);
            this.#currentTranslate = Math.min(Math.max(this.#currentTranslate, minTranslate), maxTranslate);
        }
    }

    #pointerCancel(event) {
        if (!this.#isDragging) return;
        this.#isDragging = false;
        if (this.#animationID) {
            cancelAnimationFrame(this.#animationID);
            this.#animationID = null;
        }
        const wrapper = document.getElementById(this.#uniqueId).querySelector('.slider-wrapper');
        wrapper.classList.remove('dragging');
        if (event.target.releasePointerCapture) {
            try { event.target.releasePointerCapture(event.pointerId); } catch (e) {}
        }
        if (this.#attrs.autoplayType === 'continuous') {
            const slideWidthTotal = this.#slideWidth + this.#gapPx;
            this.#currentIndex = Math.round((-this.#currentTranslate - (this.#attrs.slidesPerView - 1) / 2 * this.#gapPx) / slideWidthTotal);
            if (this.#attrs.infiniteScrolling) {
                this.#adjustForLoop();
            } else {
                this.#currentIndex = Math.max(0, Math.min(this.#currentIndex, this.#originalLength - this.#attrs.slidesPerView));
            }
            this.#setSliderPosition('0s');
        } else {
            this.#setPositionByIndex();
        }
        this.#updateSlider();
        if (this.#attrs.autoplayType !== 'none' && !this.#isHovering) {
            this.#startAutoplay(this.#attrs.autoplayType, this.#attrs.autoplayDelay, this.#attrs.continuousSpeed);
        }
    }

    #pointerUp(event) {
        if (!this.#isDragging) return;
        this.#isDragging = false;
        if (this.#animationID) {
            cancelAnimationFrame(this.#animationID);
            this.#animationID = null;
        }
        const movedBy = this.#currentTranslate - this.#prevTranslate;
        const threshold = this.#slideWidth / 3;
        if (Math.abs(movedBy) > threshold) {
            if (movedBy < -threshold && (!this.#attrs.infiniteScrolling || this.#currentIndex < this.#slides.length - this.#attrs.slidesPerView)) {
                this.#currentIndex += 1;
            } else if (movedBy > threshold && this.#currentIndex > 0) {
                this.#currentIndex -= 1;
            }
            if (this.#attrs.infiniteScrolling && this.#attrs.autoplayType !== 'continuous') {
                const minIndex = this.#bufferSize;
                const maxIndex = this.#bufferSize + this.#originalLength - this.#attrs.slidesPerView;
                if (this.#currentIndex > maxIndex) {
                    const tempTranslate = this.#calculateTranslateForIndex(this.#currentIndex);
                    const targetIndex = this.#currentIndex - this.#originalLength;
                    this.#animateLoop(tempTranslate, targetIndex, 1);
                    return;
                } else if (this.#currentIndex < minIndex) {
                    const tempTranslate = this.#calculateTranslateForIndex(this.#currentIndex);
                    const targetIndex = this.#currentIndex + this.#originalLength;
                    this.#animateLoop(tempTranslate, targetIndex, -1);
                    return;
                }
            } else {
                this.#currentIndex = Math.max(0, Math.min(this.#currentIndex, this.#originalLength - this.#attrs.slidesPerView));
            }
        }
        const wrapper = document.getElementById(this.#uniqueId).querySelector('.slider-wrapper');
        wrapper.classList.remove('dragging');
        if (event.target.releasePointerCapture) {
            try { event.target.releasePointerCapture(event.pointerId); } catch (e) {}
        }
        if (this.#attrs.autoplayType === 'continuous') {
            const slideWidthTotal = this.#slideWidth + this.#gapPx;
            this.#currentIndex = Math.round((-this.#currentTranslate - (this.#attrs.slidesPerView - 1) / 2 * this.#gapPx) / slideWidthTotal);
            if (this.#attrs.infiniteScrolling) {
                this.#adjustForLoop();
            } else {
                this.#currentIndex = Math.max(0, Math.min(this.#currentIndex, this.#originalLength - this.#attrs.slidesPerView));
            }
            this.#setSliderPosition('0s');
        } else {
            this.#setPositionByIndex();
        }
        this.#updateSlider();
        if (this.#attrs.autoplayType !== 'none' && !this.#isHovering) {
            this.#startAutoplay(this.#attrs.autoplayType, this.#attrs.autoplayDelay, this.#attrs.continuousSpeed);
        }
    }

    #animation() {
        if (!this.#attrs.crossFade && this.#isDragging) {
            this.#setSliderPosition('0s');
            this.#animationID = requestAnimationFrame(this.#animation.bind(this));
        }
    }

    #setSliderPosition(transitionDuration = '0.3s') {
        if (this.#attrs.crossFade && this.#attrs.slidesPerView === 1) return;
        const wrapper = document.getElementById(this.#uniqueId).querySelector('.slider-wrapper');
        wrapper.style.transition = this.#attrs.autoplayType === 'continuous' && !this.#isDragging && !this.#isHovering ? 'none' : `transform ${transitionDuration}`;
        wrapper.style.transform = `translate3d(${this.#currentTranslate}px, 0, 0)`;
    }

    #continuousScroll(timestamp) {
        if (!this.#continuousSpeed || this.#isDragging || this.#isAnimating || this.#isHovering || this.#isProcessingClick) {
            this.#continuousAnimationId = requestAnimationFrame(this.#continuousScroll.bind(this));
            return;
        }
        const deltaTime = (timestamp - (this.#lastFrameTime || timestamp)) / 1000;
        this.#lastFrameTime = timestamp;
        const pixelsPerFrame = this.#continuousSpeed * deltaTime;
        this.#currentTranslate -= pixelsPerFrame;
        
        if (this.#attrs.infiniteScrolling) {
            const totalWidth = this.#originalLength * (this.#slideWidth + this.#gapPx);
            const minTranslate = -totalWidth + this.#slideWidth;
            if (this.#currentTranslate < minTranslate) {
                this.#currentTranslate += totalWidth;
                this.#currentIndex = this.#bufferSize + (this.#currentIndex - this.#bufferSize) % this.#originalLength;
                const wrapper = document.getElementById(this.#uniqueId).querySelector('.slider-wrapper');
                wrapper.style.transition = 'none';
                wrapper.style.transform = `translate3d(${this.#currentTranslate}px, 0, 0)`;
            }
            const slideWidthTotal = this.#slideWidth + this.#gapPx;
            this.#currentIndex = Math.round((-this.#currentTranslate - (this.#attrs.slidesPerView - 1) / 2 * this.#gapPx) / slideWidthTotal);
            this.#adjustForLoop();
        } else {
            const maxIndex = this.#originalLength - this.#attrs.slidesPerView;
            const minTranslate = this.#calculateTranslateForIndex(maxIndex);
            if (this.#currentTranslate < minTranslate) {
                this.#currentTranslate = minTranslate;
                this.#stopAutoplay();
                return;
            }
            const slideWidthTotal = this.#slideWidth + this.#gapPx;
            this.#currentIndex = Math.max(0, Math.min(
                Math.round((-this.#currentTranslate - (this.#attrs.slidesPerView - 1) / 2 * this.#gapPx) / slideWidthTotal),
                maxIndex
            ));
        }
        this.#prevTranslate = this.#currentTranslate;
        this.#setSliderPosition('0s');
        this.#updateSlider();
        this.#continuousAnimationId = requestAnimationFrame(this.#continuousScroll.bind(this));
    }

    #animateLoop(tempTranslate, targetIndex, direction) {
        if (!this.#attrs.infiniteScrolling || this.#attrs.crossFade) {
            this.#setPositionByIndex();
            return;
        }
        this.#isAnimating = true;
        const wrapper = document.getElementById(this.#uniqueId).querySelector('.slider-wrapper');
        wrapper.style.transition = 'transform 0.3s';
        wrapper.style.transform = `translate3d(${tempTranslate}px, 0, 0)`;
        setTimeout(() => {
            this.#currentIndex = targetIndex;
            this.#adjustForLoop();
            wrapper.style.transition = 'none';
            this.#currentTranslate = this.#calculateTranslate();
            this.#prevTranslate = this.#currentTranslate;
            wrapper.style.transform = `translate3d(${this.#currentTranslate}px, 0, 0)`;
            this.#isAnimating = false;
            this.#updateSlider();
        }, 300);
    }

    #setPositionByIndex() {
        if (this.#attrs.crossFade && this.#attrs.slidesPerView === 1) {
            this.#updateSlider();
        } else {
            this.#currentTranslate = this.#calculateTranslate();
            this.#prevTranslate = this.#currentTranslate;
            this.#setSliderPosition('0.3s');
        }
    }

    #calculateTranslate() {
        const addition = (this.#attrs.slidesPerView - 1) / 2;
        return -this.#currentIndex * this.#slideWidth - (this.#currentIndex + addition) * this.#gapPx;
    }

    #calculateTranslateForIndex(index) {
        const addition = (this.#attrs.slidesPerView - 1) / 2;
        return -index * this.#slideWidth - (index + addition) * this.#gapPx;
    }

    #adjustForLoop() {
        if (!this.#attrs.infiniteScrolling) return;
        const minIndex = this.#bufferSize;
        const maxIndex = this.#bufferSize + this.#originalLength - this.#attrs.slidesPerView;
        if (this.#currentIndex < minIndex) {
            this.#currentIndex += this.#originalLength;
        } else if (this.#currentIndex > maxIndex) {
            this.#currentIndex -= this.#originalLength;
        }
    }

    #navigate(direction) {
        if (this.#isAnimating) return;
        const newIndex = this.#currentIndex + direction;
        if (this.#attrs.infiniteScrolling && !this.#attrs.crossFade) {
            const minIndex = this.#bufferSize;
            const maxIndex = this.#bufferSize + this.#originalLength - this.#attrs.slidesPerView;
            if (newIndex > maxIndex) {
                const tempTranslate = this.#calculateTranslateForIndex(this.#currentIndex + direction);
                const targetIndex = newIndex - this.#originalLength;
                this.#animateLoop(tempTranslate, targetIndex, 1);
                return;
            } else if (newIndex < minIndex) {
                const tempTranslate = this.#calculateTranslateForIndex(this.#currentIndex + direction);
                const targetIndex = newIndex + this.#originalLength;
                this.#animateLoop(tempTranslate, targetIndex, -1);
                return;
            }
        }
        if (this.#attrs.infiniteScrolling) {
            this.#currentIndex = newIndex;
            this.#adjustForLoop();
        } else if (this.#attrs.crossFade && this.#attrs.slidesPerView === 1) {
            this.#currentIndex = (newIndex + this.#originalLength) % this.#originalLength;
        } else {
            const maxIndex = this.#originalLength - this.#attrs.slidesPerView;
            this.#currentIndex = Math.max(0, Math.min(newIndex, maxIndex));
        }
        this.#setPositionByIndex();
        this.#lastDirection = direction;
        this.#updateSlider();
    }

    #startAutoplay(autoplayType, autoplayDelay, continuousSpeed) {
        this.#stopAutoplay();
        if (this.#isHovering) return;
        
        if (autoplayType === 'interval' && autoplayDelay > 0) {
            this.#autoplayInterval = setInterval(() => {
                if (!this.#isHovering && !this.#isProcessingClick) {
                    this.#navigate(1);
                }
            }, autoplayDelay);
        } else if (autoplayType === 'continuous' && continuousSpeed > 0 && !this.#attrs.crossFade) {
            this.#continuousSpeed = continuousSpeed;
            this.#lastFrameTime = performance.now();
            this.#continuousAnimationId = requestAnimationFrame(this.#continuousScroll.bind(this));
        }
    }

    #stopAutoplay() {
        if (this.#autoplayInterval) {
            clearInterval(this.#autoplayInterval);
            this.#autoplayInterval = null;
        }
        if (this.#continuousAnimationId) {
            cancelAnimationFrame(this.#continuousAnimationId);
            this.#continuousAnimationId = null;
            this.#lastFrameTime = null;
        }
    }

    #updateSlider(forceUpdate = false) {
        const sliderContainer = document.getElementById(this.#uniqueId);
        if (!sliderContainer) return;

        const wrapper = sliderContainer.querySelector('.slider-wrapper');
        if (this.#attrs.crossFade && this.#attrs.slidesPerView === 1) {
            const displayIndex = this.#attrs.infiniteScrolling
                ? (this.#currentIndex - this.#bufferSize + this.#originalLength) % this.#originalLength
                : this.#currentIndex % this.#originalLength;
            this.#slides.forEach((slide, index) => {
                const isActive = index === displayIndex;
                slide.classList.toggle('active', isActive);
                slide.style.opacity = isActive ? '1' : '0';
            });
        } else if (forceUpdate || this.#attrs.autoplayType !== 'continuous') {
            wrapper.style.transform = `translate3d(${this.#currentTranslate}px, 0, 0)`;
        }

        if (this.#attrs.pagination) {
            const now = performance.now();
            if (!forceUpdate && now - this.#lastPaginationUpdate < 100) return;
            this.#lastPaginationUpdate = now;
            
            const pagination = sliderContainer.querySelector('.slider-pagination');
            if (pagination) {
                const dots = pagination.querySelectorAll('span.icon');
                let logicalIndex;
                if (this.#attrs.infiniteScrolling) {
                    logicalIndex = (this.#currentIndex - this.#bufferSize + this.#originalLength) % this.#originalLength;
                } else {
                    logicalIndex = Math.max(0, Math.min(this.#currentIndex, this.#originalLength - this.#attrs.slidesPerView));
                }
                const maxIndex = this.#attrs.infiniteScrolling
                    ? this.#originalLength - 1
                    : this.#originalLength - this.#attrs.slidesPerView;
                logicalIndex = Math.max(0, Math.min(logicalIndex, maxIndex));
                
                dots.forEach((dot, index) => {
                    const isActive = index === logicalIndex;
                    
                    if (isActive) {
                        dot.classList.add('is-active');
                    } else {
                        dot.classList.remove('is-active');
                    }
                });
            }
        }
    }

    async render(attrs) {
        const sliderWrapper = document.createElement('div');
        sliderWrapper.id = this.#uniqueId;
        sliderWrapper.className = 'custom-slider';

        if (this.#childElements.length === 0) {
            this.#warn('No valid slides found', { elementId: this.#uniqueId });
        } else {
            this.#originalLength = this.#childElements.length;
        }

        sliderWrapper.dataset.breakpoints = JSON.stringify(attrs.slidesPerViewConfig);
        sliderWrapper.dataset.defaultSpv = attrs.defaultSlidesPerView;
        sliderWrapper.dataset.autoplay = attrs.autoplayType;
        sliderWrapper.dataset.delay = attrs.autoplayDelay;
        sliderWrapper.dataset.speed = attrs.continuousSpeed;
        sliderWrapper.dataset.infinite = attrs.infiniteScrolling;
        sliderWrapper.dataset.originalLength = this.#originalLength;
        sliderWrapper.dataset.pauseOnHover = attrs.pauseOnHover;
        sliderWrapper.dataset.draggable = this.hasAttribute('draggable');

        if (attrs.pagination && attrs.paginationPosition) {
            sliderWrapper.setAttribute('pagination-position', attrs.paginationPosition);
        }

        const innerWrapper = document.createElement('div');
        innerWrapper.className = 'slider-wrapper';

        if (!attrs.crossFade || attrs.slidesPerView !== 1) {
            const spv = this.#getSlidesPerView();
            innerWrapper.style.setProperty('--slider-columns', `repeat(${this.#childElements.length}, ${100 / spv}%)`);
            if (attrs.gap && attrs.gap !== '0') {
                innerWrapper.style.setProperty('--slider-gap', attrs.gap);
                sliderWrapper.setAttribute('gap', '');
            }
        }

        if (this.#childElements.length === 0) {
            const fallbackSlide = document.createElement('div');
            fallbackSlide.className = 'slider-slide';
            fallbackSlide.innerHTML = '<p>No slides available</p>';
            innerWrapper.appendChild(fallbackSlide);
        } else {
            this.#childElements.forEach((slide, index) => {
                const slideWrapper = document.createElement('div');
                slideWrapper.className = 'slider-slide';
                if (attrs.crossFade && attrs.slidesPerView === 1) {
                    slideWrapper.style.opacity = index === 0 ? '1' : '0';
                    if (index === 0) slideWrapper.classList.add('active');
                }
                slideWrapper.appendChild(slide.cloneNode(true));
                innerWrapper.appendChild(slideWrapper);
            });
        }

        sliderWrapper.appendChild(innerWrapper);

        if (attrs.navigation && attrs.navigationIconLeft && attrs.navigationIconRight) {
            const navPrev = document.createElement('div');
            navPrev.id = `${this.#uniqueId}-prev`;
            navPrev.className = 'slider-nav-prev';
            navPrev.innerHTML = attrs.navigationIconLeft;
            
            const navNext = document.createElement('div');
            navNext.id = `${this.#uniqueId}-next`;
            navNext.className = 'slider-nav-next';
            navNext.innerHTML = attrs.navigationIconRight;
            
            [navPrev, navNext].forEach((nav) => {
                const icons = nav.querySelectorAll('.builder-inline-svg');
                const isStacked = icons.length === 2;
                icons.forEach((icon, index) => {
                    if (attrs.iconSizeBackground && attrs.iconSizeForeground && isStacked) {
                        const targetSize = index === 0 ? attrs.iconSizeBackground : attrs.iconSizeForeground;
                        icon.style.fontSize = targetSize;
                        icon.style.width = targetSize;
                        icon.style.height = targetSize;
                    } else if (attrs.iconSizeBackground) {
                        icon.style.fontSize = attrs.iconSizeBackground;
                        icon.style.width = attrs.iconSizeBackground;
                        icon.style.height = attrs.iconSizeBackground;
                    }
                });
            });
            sliderWrapper.appendChild(navPrev);
            sliderWrapper.appendChild(navNext);
        }

        if (attrs.pagination) {
            const pagination = document.createElement('div');
            pagination.className = 'slider-pagination';
            
            // --- PURE CSS PAGINATION SWAPPING ---
            const paginationStyles = document.createElement('style');
            paginationStyles.className = 'pagination-styles';
            paginationStyles.textContent = `
                #${this.#uniqueId} .slider-pagination .icon-active-state { display: none; width: 100%; height: 100%; align-items: center; justify-content: center; }
                #${this.#uniqueId} .slider-pagination .icon.is-active .icon-active-state { display: flex; }
                #${this.#uniqueId} .slider-pagination .icon-inactive-state { display: flex; width: 100%; height: 100%; align-items: center; justify-content: center; }
                #${this.#uniqueId} .slider-pagination .icon.is-active .icon-inactive-state { display: none; }
                #${this.#uniqueId} .slider-pagination .icon { cursor: pointer; }
            `;
            sliderWrapper.appendChild(paginationStyles);

            const totalSlides = this.#childElements.length;
            const totalDots = attrs.infiniteScrolling
                ? this.#originalLength
                : Math.max(1, totalSlides - attrs.slidesPerView + 1);
            
            for (let i = 0; i < totalDots; i++) {
                const dot = document.createElement('span');
                dot.className = 'icon';
                
                const logicalIndex = this.#attrs.infiniteScrolling
                    ? (this.#currentIndex - this.#bufferSize + this.#originalLength) % this.#originalLength
                    : Math.max(0, Math.min(this.#currentIndex, this.#originalLength - this.#attrs.slidesPerView));
                
                const isActive = i === logicalIndex;

                dot.innerHTML = `
                    <span class="icon-active-state">${attrs.paginationIconActive}</span>
                    <span class="icon-inactive-state">${attrs.paginationIconInactive}</span>
                `;

                if (isActive) dot.classList.add('is-active');

                const activeSvg = dot.querySelector('.icon-active-state .builder-inline-svg');
                const inactiveSvg = dot.querySelector('.icon-inactive-state .builder-inline-svg');
                
                if (activeSvg && attrs.paginationIconSizeActive) {
                    activeSvg.style.fontSize = attrs.paginationIconSizeActive;
                    activeSvg.style.width = attrs.paginationIconSizeActive;
                    activeSvg.style.height = attrs.paginationIconSizeActive;
                }
                if (inactiveSvg && attrs.paginationIconSizeInactive) {
                    inactiveSvg.style.fontSize = attrs.paginationIconSizeInactive;
                    inactiveSvg.style.width = attrs.paginationIconSizeInactive;
                    inactiveSvg.style.height = attrs.paginationIconSizeInactive;
                }
                
                dot.addEventListener('click', () => {
                    if (this.#isProcessingClick) return;
                    this.#isProcessingClick = true;
                    if (this.#continuousAnimationId) {
                        cancelAnimationFrame(this.#continuousAnimationId);
                        this.#continuousAnimationId = null;
                    }
                    this.#stopAutoplay();
                    if (this.#attrs.infiniteScrolling && this.#attrs.slidesPerView > 1) {
                        this.#currentIndex = i + this.#bufferSize;
                    } else {
                        this.#currentIndex = i;
                    }
                    this.#currentTranslate = this.#calculateTranslate();
                    this.#prevTranslate = this.#currentTranslate;
                    this.#setSliderPosition('0s');
                    setTimeout(() => {
                        this.#updateSlider(true);
                        this.#isProcessingClick = false;
                        if (this.#attrs.autoplayType !== 'none' && !this.#isHovering) {
                            this.#startAutoplay(this.#attrs.autoplayType, this.#attrs.autoplayDelay, this.#attrs.continuousSpeed);
                        }
                    }, 50);
                });
                pagination.appendChild(dot);
            }
            sliderWrapper.appendChild(pagination);
        }

        return sliderWrapper;
    }

    async connectedCallback() {
        if (super.connectedCallback) super.connectedCallback();
        const existingSlider = this.querySelector('.custom-slider');
        if (existingSlider) {
            this.isVisible = true;
            this.isInitialized = true;

            if (!this.controller) {
                this.controller = new CustomSliderController(existingSlider);
            }
            return; 
        }
    }

    disconnectedCallback() {
        this.#stopAutoplay();
        if (this.#animationID) {
            cancelAnimationFrame(this.#animationID);
            this.#animationID = null;
        }
        if (this.#debouncedHandleResize) {
            window.removeEventListener('resize', this.#debouncedHandleResize);
        }
        if (CustomSlider.#observedInstances.has(this)) {
            CustomSlider.#observer.unobserve(this);
            CustomSlider.#observedInstances.delete(this);
        }
        this.#childElements = [];
    }

    static get builderConfig() {
        return {
            isContainer: true,
            booleans: [
                'navigation', 'pagination', 'draggable',
                'cross-fade', 'infinite-scrolling', 'pause-on-hover'
            ],
            groups: {
                'Settings': ['autoplay', 'slides-per-view', 'slides-per-view-mobile', 'slides-per-view-tablet', 'slides-per-view-laptop', 'slides-per-view-desktop', 'slides-per-view-large', 'gap', 'draggable', 'cross-fade', 'infinite-scrolling', 'pause-on-hover'],
                'Navigation': ['navigation', 'navigation-icon-left', 'navigation-icon-right', 'navigation-icon-left-background', 'navigation-icon-right-background', 'navigation-icon-size'],
                'Pagination': ['pagination', 'pagination-position', 'pagination-icon-active', 'pagination-icon-inactive', 'pagination-icon-size']
            }
        };
    }

    static get observedAttributes() {
        return [
            'autoplay', 'slides-per-view', 'slides-per-view-mobile', 'slides-per-view-tablet',
            'slides-per-view-laptop', 'slides-per-view-desktop', 'slides-per-view-large',
            'navigation', 'navigation-icon-left', 'navigation-icon-right',
            'navigation-icon-left-background', 'navigation-icon-right-background', 'gap', 'pagination',
            'pagination-icon-active', 'pagination-icon-inactive', 'navigation-icon-size', 'pagination-icon-size',
            'draggable', 'cross-fade', 'infinite-scrolling', 'pause-on-hover', 'pagination-position',
            ...(super.observedAttributes || [])
        ];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (super.attributeChangedCallback) {
            super.attributeChangedCallback(name, oldValue, newValue);
        }
        if (!this.isInitialized || !this.isVisible) {
            this.#ignoredChangeCount++;
            return;
        }
        if (oldValue !== newValue) {
            this.isInitialized = false;
            this.#stopAutoplay();
            this.initialize();
        }
    }
}

try {
    customElements.define('custom-slider', CustomSlider);
} catch (error) {
    console.error('Error defining CustomSlider element:', error);
}

export { CustomSlider };
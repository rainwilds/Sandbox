/* global HTMLElement, IntersectionObserver, document, window, console, requestAnimationFrame */
'use strict';
import { getConfig } from '../config.js';
import { VIEWPORT_BREAKPOINTS } from '../shared.js';

class CustomSlider extends HTMLElement {
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
        this.#log('Constructor called', { elementId: this.#uniqueId });
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
                this.#error('Failed to fetch base path', { error: error.message });
                this.#basePath = '/';
            }
        }
        return this.#basePath;
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
        this.#log('Checking breakpoint attributes', { definedBreakpoints, elementId: this.#uniqueId });

        if (definedBreakpoints.length > 0) {
            useBreakpoints = true;
            for (const attr of breakpointAttrs) {
                if (!this.hasAttribute(attr)) {
                    this.#error(`Missing required breakpoint attribute: ${attr}`, { definedBreakpoints, elementId: this.#uniqueId });
                    useBreakpoints = false;
                    break;
                }
                const value = this.getAttribute(attr);
                const num = parseInt(value, 10);
                if (isNaN(num) || num < 1) {
                    this.#error(`Invalid ${attr} value, must be integer >= 1`, { value, elementId: this.#uniqueId });
                    useBreakpoints = false;
                    break;
                }
                const breakpointName = attr.replace('slides-per-view-', '');
                slidesPerViewConfig[breakpointName] = num;
            }
        }

        const defaultAttr = this.getAttribute('slides-per-view') || '1';
        defaultSlidesPerView = Math.max(1, parseInt(defaultAttr, 10)) || 1;

        if (!useBreakpoints) {
            this.#log('Using default slides-per-view due to invalid or missing breakpoint attributes', {
                defaultSlidesPerView,
                elementId: this.#uniqueId
            });
        } else {
            this.#log('Breakpoint attributes validated', {
                slidesPerViewConfig,
                elementId: this.#uniqueId
            });
        }

        let autoplayType = 'none';
        let autoplayDelay = 0;
        let continuousSpeed = 100;
        const autoplayAttr = this.getAttribute('autoplay');
        if (this.hasAttribute('autoplay')) {
            if (autoplayAttr === '' || autoplayAttr === null) {
                autoplayType = 'interval';
                autoplayDelay = 3000;
                this.#log('Autoplay: Simple autoplay, defaulting to 3s', { elementId: this.#uniqueId });
            } else if (autoplayAttr.startsWith('continuous')) {
                autoplayType = 'continuous';
                const parts = autoplayAttr.split(/\s+/);
                if (parts.length === 2) {
                    const speedMatch = parts[1].match(/^(\d+)(?:px\/s)?$/);
                    if (speedMatch) {
                        continuousSpeed = parseInt(speedMatch[1], 10);
                        if (continuousSpeed <= 0) {
                            this.#warn('Invalid continuous speed, using default 100px/s', { value: parts[1] });
                            continuousSpeed = 100;
                        }
                    } else {
                        this.#warn('Invalid continuous speed format, using default 100px/s', {
                            value: parts[1],
                            expected: 'Npx/s or N'
                        });
                    }
                }
                this.#log(`Autoplay: Continuous scrolling, speed=${continuousSpeed}px/s`, { elementId: this.#uniqueId });
            } else {
                const timeMatch = autoplayAttr.match(/^(\d+)(s|ms)$/);
                if (timeMatch) {
                    autoplayType = 'interval';
                    const value = parseInt(timeMatch[1], 10);
                    const unit = timeMatch[2];
                    autoplayDelay = unit === 's' ? value * 1000 : value;
                    this.#log(`Autoplay: Interval-based, delay=${autoplayDelay}ms`, { elementId: this.#uniqueId });
                } else {
                    this.#warn('Invalid autoplay format, disabling autoplay', {
                        value: autoplayAttr,
                        expected: 'Ns, Nms, continuous, or continuous N'
                    });
                    autoplayType = 'none';
                }
            }
        }

        let navigation = this.hasAttribute('navigation');
        let navigationIconLeft = this.getAttribute('navigation-icon-left') || '<i class="fa-chisel fa-regular fa-angle-left"></i>';
        let navigationIconRight = this.getAttribute('navigation-icon-right') || '<i class="fa-chisel fa-regular fa-angle-right"></i>';
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
            } else {
                this.#warn('Invalid navigation-icon-size format, ignoring', {
                    value: navigationIconSize,
                    expected: 'One or two CSS font-size values (e.g., "1.5rem" or "2rem 1.5rem")'
                });
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
                this.#warn('Two pagination-icon-size values provided but pagination icons are not stacked, using first size', {
                    paginationIconSize,
                    paginationIconSizeActive,
                    paginationIconSizeInactive
                });
            } else {
                this.#warn('Invalid pagination-icon-size format, ignoring', {
                    value: paginationIconSize,
                    expected: 'One or two CSS font-size values (e.g., "1.5rem" or "1.5rem 1rem")'
                });
            }
        }

        const gapAttr = this.getAttribute('gap') || '0';
        let gap = gapAttr;
        let pagination = this.hasAttribute('pagination');
        let paginationIconActive = this.getAttribute('pagination-icon-active') || '<i class="fa-solid fa-circle"></i>';
        let paginationIconInactive = this.getAttribute('pagination-icon-inactive') || '<i class="fa-regular fa-circle"></i>';
        const crossFade = this.hasAttribute('cross-fade');

        if (crossFade && autoplayType === 'continuous') {
            this.#warn('Continuous autoplay is not supported with cross-fade, disabling autoplay', { elementId: this.#uniqueId });
            autoplayType = 'none';
            continuousSpeed = 0;
        }

        if (crossFade && defaultSlidesPerView !== 1) {
            this.#warn('Cross-fade attribute is only supported for slides-per-view=1, ignoring', { defaultSlidesPerView });
        }

        const infiniteScrolling = this.hasAttribute('infinite-scrolling');
        const pauseOnHover = this.hasAttribute('pause-on-hover');

        const validateIcon = (icon, position, isBackground = false) => {
            if (!icon) {
                this.#warn(`No ${position} icon provided`, { elementId: this.#uniqueId });
                return isBackground ? '' : '<i class="fa-solid fa-circle"></i>';
            }
            const parser = new DOMParser();
            const decodedIcon = icon.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
            const doc = parser.parseFromString(decodedIcon, 'text/html');
            const iElement = doc.body.querySelector('i');
            let classes = iElement ? iElement.className.split(' ').filter(cls => cls) : icon.split(/\s+/).filter(cls => cls);
            const validClasses = classes.filter(cls => cls.startsWith('fa-') || cls === 'fa-chisel' || cls === 'fa-utility' || cls === 'fa-utility-fill' || cls === 'fa-semibold');
            if (validClasses.length === 0) {
                this.#warn(`No valid Font Awesome classes in ${position} icon`, {
                    classes,
                    elementId: this.#uniqueId
                });
                return isBackground ? '' : '<i class="fa-solid fa-circle"></i>';
            }
            validClasses.push('icon');
            const result = `<i class="${validClasses.join(' ')}"></i>`;
            this.#log(`Validated ${position} icon`, { icon: result, elementId: this.#uniqueId });
            return result;
        };

        const processIconStack = (icon, backgroundIcon, position) => {
            const foreground = validateIcon(icon, position);
            const background = validateIcon(backgroundIcon, position, true);
            if (!foreground) {
                this.#warn(`No valid foreground icon for ${position}, navigation disabled`, { icon, backgroundIcon });
                return { valid: false, markup: '' };
            }
            if (iconSizeBackground && iconSizeForeground && iconSizeBackground !== iconSizeForeground && !background) {
                this.#warn(`Two navigation-icon-size values provided but ${position} icons are not stacked, using first size`, {
                    navigationIconSize,
                    iconSizeBackground,
                    iconSizeForeground
                });
            }
            if (!background) {
                return { valid: true, markup: foreground };
            }
            return {
                valid: true,
                markup: `<span class="icon-stack icon">${background}${foreground}</span>`
            };
        };

        let leftIconResult = { valid: true, markup: navigationIconLeft };
        let rightIconResult = { valid: true, markup: navigationIconRight };
        if (navigationIconLeftBackground || navigationIconRightBackground) {
            leftIconResult = processIconStack(navigationIconLeft, navigationIconLeftBackground, 'left');
            rightIconResult = processIconStack(navigationIconRight, navigationIconRightBackground, 'right');
        } else {
            const parser = new DOMParser();
            const leftDoc = parser.parseFromString(navigationIconLeft.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"'), 'text/html');
            const rightDoc = parser.parseFromString(navigationIconRight.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"'), 'text/html');
            const leftIcons = leftDoc.body.querySelectorAll('i');
            const rightIcons = rightDoc.body.querySelectorAll('i');
            if (leftIcons.length === 2) {
                leftIconResult = processIconStack(leftIcons[1].outerHTML, leftIcons[0].outerHTML, 'left');
            } else {
                leftIconResult = { valid: true, markup: validateIcon(navigationIconLeft, 'left') };
            }
            if (rightIcons.length === 2) {
                rightIconResult = processIconStack(rightIcons[1].outerHTML, rightIcons[0].outerHTML, 'right');
            } else {
                rightIconResult = { valid: true, markup: validateIcon(navigationIconRight, 'right') };
            }
        }

        navigation = navigation && leftIconResult.valid && rightIconResult.valid && this.hasAttribute('navigation-icon-left') && this.hasAttribute('navigation-icon-right');
        if (!navigation && this.hasAttribute('navigation')) {
            this.#warn('Navigation disabled due to invalid or missing icon attributes', {
                leftIconValid: leftIconResult.valid,
                rightIconValid: rightIconResult.valid,
                hasLeftIcon: this.hasAttribute('navigation-icon-left'),
                hasRightIcon: this.hasAttribute('navigation-icon-right')
            });
        }

        paginationIconActive = validateIcon(paginationIconActive, 'active');
        paginationIconInactive = validateIcon(paginationIconInactive, 'inactive');
        this.#log('Pagination attributes validated', {
            pagination,
            paginationIconActive,
            paginationIconInactive,
            elementId: this.#uniqueId
        });

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
        if (!this.#attrs || !this.#attrs.useBreakpoints) {
            this.#log('Breakpoints ignored, using fixed slides-per-view', { elementId: this.#uniqueId });
            return null;
        }
        const width = window.innerWidth;
        let selectedBreakpoint = 'large';
        if (!VIEWPORT_BREAKPOINTS || !Array.isArray(VIEWPORT_BREAKPOINTS)) {
            this.#error('VIEWPORT_BREAKPOINTS is undefined or invalid', { elementId: this.#uniqueId });
            return selectedBreakpoint;
        }
        for (const bp of VIEWPORT_BREAKPOINTS) {
            if (width <= bp.maxWidth) {
                selectedBreakpoint = bp.name;
                break;
            }
        }
        this.#log('Current breakpoint detected', {
            viewportWidth: width,
            breakpoint: selectedBreakpoint,
            elementId: this.#uniqueId
        });
        return selectedBreakpoint;
    }

    #getSlidesPerView() {
        if (!this.#attrs) {
            this.#error('Attributes not initialized', { elementId: this.#uniqueId });
            return 1;
        }
        if (!this.#attrs.useBreakpoints) {
            this.#log('Using fixed slides-per-view', {
                slidesPerView: this.#attrs.defaultSlidesPerView,
                elementId: this.#uniqueId
            });
            return this.#attrs.defaultSlidesPerView;
        }
        const bp = this.#getCurrentBreakpoint();
        const spv = this.#attrs.slidesPerViewConfig[bp] ?? this.#attrs.defaultSlidesPerView;
        this.#log('Slides per view determined', {
            breakpoint: bp,
            slidesPerView: spv,
            slidesPerViewConfig: this.#attrs.slidesPerViewConfig,
            defaultSlidesPerView: this.#attrs.defaultSlidesPerView,
            elementId: this.#uniqueId
        });
        return spv;
    }

    #applySlidesPerView() {
        const oldSpv = this.#attrs?.slidesPerView || 0;
        const newSpv = this.#getSlidesPerView();
        this.#log('Applying slides per view', {
            currentSlidesPerView: oldSpv,
            newSlidesPerView: newSpv,
            gap: this.#attrs?.gap,
            elementId: this.#uniqueId
        });

        if (newSpv === 1 && this.#attrs?.gap !== '0') {
            this.#warn('Gap attribute has no visual effect when slides-per-view=1', {
                gap: this.#attrs.gap,
                elementId: this.#uniqueId
            });
        }

        if (this.#attrs) {
            this.#attrs.slidesPerView = newSpv;
            this.#bufferSize = newSpv;
        }

        this.#recalculateDimensions();
        if (this.#attrs?.useBreakpoints) {
            this.#rebuildInfiniteBuffer();
        }

        // Clamp currentIndex to prevent invalid states after slidesPerView change
        if (!this.#attrs.infiniteScrolling) {
            const maxIndex = Math.max(0, this.#originalLength - this.#attrs.slidesPerView);
            this.#currentIndex = Math.min(this.#currentIndex, maxIndex);
        }

        const wrapper = document.getElementById(this.#uniqueId)?.querySelector('.slider-wrapper');
        if (wrapper) {
            wrapper.style.setProperty('--slider-columns', `repeat(${this.#slides.length}, ${100 / newSpv}%)`);
        } else {
            this.#warn('Slider wrapper not found during applySlidesPerView', { elementId: this.#uniqueId });
        }

        // Update slider position to align with new slidesPerView
        this.#setPositionByIndex();

        if (this.#attrs?.pagination) {
            this.#updatePagination();
        }

        this.#updateSlider(true);
        this.#log('Slides per view applied', {
            newSlidesPerView: newSpv,
            currentIndex: this.#currentIndex,
            elementId: this.#uniqueId
        });
    }

    #updatePagination() {
        const sliderContainer = document.getElementById(this.#uniqueId);
        if (!sliderContainer) {
            this.#warn('Slider container not found for pagination update', { elementId: this.#uniqueId });
            return;
        }

        this.#childElements = Array.from(sliderContainer.querySelectorAll('.slider-slide'))
            .map(slide => slide.cloneNode(true));
        const totalSlides = this.#childElements.length;

        if (!this.#originalLength) {
            this.#originalLength = totalSlides;
            this.#warn('originalLength was not set, defaulting to totalSlides', { totalSlides, elementId: this.#uniqueId });
        }

        this.#log('Updating pagination', {
            totalSlides,
            originalLength: this.#originalLength,
            slidesPerView: this.#attrs.slidesPerView,
            infiniteScrolling: this.#attrs.infiniteScrolling,
            currentIndex: this.#currentIndex,
            elementId: this.#uniqueId
        });

        let pagination = sliderContainer.querySelector('.slider-pagination');
        if (!pagination) {
            pagination = document.createElement('div');
            pagination.className = 'slider-pagination';
            sliderContainer.appendChild(pagination);
        } else {
            pagination.innerHTML = ''; // Clear existing dots
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
            dot.innerHTML = i === logicalIndex ? this.#attrs.paginationIconActive : this.#attrs.paginationIconInactive;
            const icon = dot.querySelector('i');
            if (icon && (this.#attrs.paginationIconSizeActive || this.#attrs.paginationIconSizeInactive)) {
                icon.style.fontSize = i === logicalIndex ? this.#attrs.paginationIconSizeActive : this.#attrs.paginationIconSizeInactive;
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
                    this.#log(`[Pagination Click] currentIndex=${this.#currentIndex}, clickedDot=${i + 1}, translate=${this.#currentTranslate}, isHovering=${this.#isHovering}`, { elementId: this.#uniqueId });
                }, 50);
            });
            pagination.appendChild(dot);
        }

        this.#log(`[Pagination Updated] totalDots=${totalDots}, slidesPerView=${this.#attrs.slidesPerView}, originalLength=${this.#originalLength}`, { elementId: this.#uniqueId, totalSlides });
    }

    #rebuildInfiniteBuffer() {
        if (!this.#attrs.infiniteScrolling || this.#originalLength <= this.#attrs.slidesPerView) {
            this.#log('Skipping infinite buffer rebuild', {
                infiniteScrolling: this.#attrs.infiniteScrolling,
                originalLength: this.#originalLength,
                slidesPerView: this.#attrs.slidesPerView,
                elementId: this.#uniqueId
            });
            return;
        }

        const wrapper = document.getElementById(this.#uniqueId).querySelector('.slider-wrapper');
        const currentTranslate = this.#currentTranslate;
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
        this.#log('Infinite buffer rebuilt', {
            bufferSize: this.#bufferSize,
            totalSlides: this.#slides.length,
            currentIndex: this.#currentIndex,
            currentTranslate: this.#currentTranslate,
            elementId: this.#uniqueId
        });
    }

    async initialize() {
        if (this.isInitialized || !this.isVisible) {
            this.#log('Initialization skipped', { isInitialized: this.isInitialized, isVisible: this.isVisible, elementId: this.#uniqueId });
            return;
        }

        this.isInitialized = true;
        this.#log('Initialization started', { elementId: this.#uniqueId });

        try {
            const attrs = await this.getAttributes();
            if (!attrs.useBreakpoints && !this.hasAttribute('slides-per-view')) {
                this.#error('slides-per-view attribute is required when not using breakpoint-specific attributes', { elementId: this.#uniqueId });
                attrs.defaultSlidesPerView = 1;
                attrs.slidesPerView = 1;
            }
            this.#attrs = attrs;
            this.#attrs.slidesPerView = this.#getSlidesPerView();
            const sliderElement = await this.render(attrs);
            if (sliderElement) {
                this.replaceWith(sliderElement);
                this.#setupSlider();
                this.#log('Initialization completed', { elementId: this.#uniqueId });
            } else {
                this.#error('Render returned null, using fallback', { elementId: this.#uniqueId });
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
                    paginationIconActive: '<i class="fa-solid fa-circle"></i>',
                    paginationIconInactive: '<i class="fa-regular fa-circle"></i>',
                    iconSizeBackground: '',
                    iconSizeForeground: '',
                    paginationIconSizeActive: '',
                    paginationIconSizeInactive: '',
                    crossFade: false,
                    infiniteScrolling: false,
                    pauseOnHover: false
                });
                this.replaceWith(fallback);
            }
        } catch (error) {
            this.#error('Initialization failed', {
                error: error.message,
                stack: error.stack,
                elementId: this.#uniqueId
            });
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
                paginationIconActive: '<i class="fa-solid fa-circle"></i>',
                paginationIconInactive: '<i class="fa-regular fa-circle"></i>',
                iconSizeBackground: '',
                iconSizeForeground: '',
                paginationIconSizeActive: '',
                paginationIconSizeInactive: '',
                crossFade: false,
                infiniteScrolling: false,
                pauseOnHover: false
            });
            this.replaceWith(fallback);
        }
    }

    #setupSlider() {
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
            this.#log('Infinite scrolling initialized', {
                elementId: this.#uniqueId,
                bufferSize: this.#bufferSize,
                totalSlides: this.#slides.length,
                initialTranslate: this.#currentTranslate
            });
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
                this.#log('Autoplay paused due to hover (pause-on-hover enabled)', { elementId: this.#uniqueId });
            });
            sliderContainer.addEventListener('mouseleave', () => {
                this.#isHovering = false;
                if (this.#attrs.autoplayType !== 'none') {
                    this.#startAutoplay(this.#attrs.autoplayType, this.#attrs.autoplayDelay, this.#attrs.continuousSpeed);
                    this.#log('Autoplay resumed after hover (pause-on-hover enabled)', { elementId: this.#uniqueId });
                }
            });
        } else {
            this.#log('Hover-to-pause disabled (no pause-on-hover attribute)', { elementId: this.#uniqueId });
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
                            this.#log(`[Pagination Click] currentIndex=${this.#currentIndex}, clickedDot=${index + 1}, translate=${this.#currentTranslate}, isHovering=${this.#isHovering}`, { elementId: this.#uniqueId });
                        }, 50);
                    });
                });
            }
        }

        if (this.#attrs.autoplayType !== 'none' && !this.#isHovering) {
            this.#startAutoplay(this.#attrs.autoplayType, this.#attrs.autoplayDelay, this.#attrs.continuousSpeed);
        }

        this.#debouncedHandleResize = this.#debounce(() => {
            this.#log('Resize event triggered', { viewportWidth: window.innerWidth, elementId: this.#uniqueId });
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
            this.#log('Dimensions recalculated', {
                slideWidth: this.#slideWidth,
                gapPx: this.#gapPx,
                containerWidth: sliderContainer.clientWidth,
                slidesPerView: this.#attrs.slidesPerView,
                elementId: this.#uniqueId
            });
        } else {
            this.#warn('Failed to recalculate dimensions', {
                sliderContainerExists: !!sliderContainer,
                slidesLength: this.#slides.length,
                elementId: this.#uniqueId
            });
        }
    }

    #pointerDown(event) {
        if (this.#attrs.crossFade && this.#attrs.slidesPerView === 1) {
            return;
        }
        if (event.pointerType === 'touch' || event.pointerType === 'mouse') {
            this.#stopAutoplay();
            this.#isDragging = true;
            this.#startPos = event.clientX;
            this.#prevTranslate = this.#currentTranslate;
            this.#animationID = requestAnimationFrame(this.#animation.bind(this));
            const wrapper = document.getElementById(this.#uniqueId).querySelector('.slider-wrapper');
            wrapper.classList.add('dragging');
            event.target.setPointerCapture(event.pointerId);
            this.#log('Pointer down, dragging class added', { elementId: this.#uniqueId });
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
            try {
                event.target.releasePointerCapture(event.pointerId);
            } catch (e) {
                this.#warn('Failed to release pointer capture', { error: e.message });
            }
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
            this.#log('Pointer cancel in continuous mode', {
                elementId: this.#uniqueId,
                currentTranslate: this.#currentTranslate,
                currentIndex: this.#currentIndex
            });
        } else {
            this.#setPositionByIndex();
        }
        this.#updateSlider();
        if (this.#attrs.autoplayType !== 'none' && !this.#isHovering) {
            this.#startAutoplay(this.#attrs.autoplayType, this.#attrs.autoplayDelay, this.#attrs.continuousSpeed);
        }
        this.#log('Pointer cancelled or left', { elementId: this.#uniqueId });
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
        const oldIndex = this.#currentIndex;
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
            try {
                event.target.releasePointerCapture(event.pointerId);
            } catch (e) {
                this.#warn('Failed to release pointer capture', { error: e.message });
            }
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
            this.#log('Drag end in continuous mode', {
                elementId: this.#uniqueId,
                currentTranslate: this.#currentTranslate,
                currentIndex: this.#currentIndex,
                movedBy: movedBy
            });
        } else {
            this.#setPositionByIndex();
        }
        this.#updateSlider();
        if (this.#attrs.autoplayType !== 'none' && !this.#isHovering) {
            this.#startAutoplay(this.#attrs.autoplayType, this.#attrs.autoplayDelay, this.#attrs.continuousSpeed);
        }
        this.#log(`[Drag End] currentIndex=${this.#currentIndex}, oldIndex=${oldIndex}, movedBy=${movedBy}px`, { elementId: this.#uniqueId });
    }

    #animation() {
        if (!this.#attrs.crossFade && this.#isDragging) {
            this.#setSliderPosition('0s');
            this.#animationID = requestAnimationFrame(this.#animation.bind(this));
        }
    }

    #setSliderPosition(transitionDuration = '0.3s') {
        if (this.#attrs.crossFade && this.#attrs.slidesPerView === 1) {
            return;
        }
        const wrapper = document.getElementById(this.#uniqueId).querySelector('.slider-wrapper');
        wrapper.style.transition = this.#attrs.autoplayType === 'continuous' && !this.#isDragging && !this.#isHovering ? 'none' : `transform ${transitionDuration}`;
        wrapper.style.transform = `translate3d(${this.#currentTranslate}px, 0, 0)`;
        this.#log('Slider position set', {
            translate: this.#currentTranslate,
            currentIndex: this.#currentIndex,
            transitionDuration,
            elementId: this.#uniqueId
        });
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
                this.#log('Continuous loop to start', {
                    elementId: this.#uniqueId,
                    currentTranslate: this.#currentTranslate,
                    minTranslate: minTranslate,
                    totalWidth: totalWidth,
                    timestamp: timestamp
                });
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
                this.#log('Continuous scrolling stopped at end', {
                    elementId: this.#uniqueId,
                    currentTranslate: this.#currentTranslate,
                    minTranslate: minTranslate
                });
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
        this.#log('Animating loop', { tempTranslate, currentIndex: this.#currentIndex, targetIndex, direction });
        setTimeout(() => {
            this.#currentIndex = targetIndex;
            this.#adjustForLoop();
            wrapper.style.transition = 'none';
            this.#currentTranslate = this.#calculateTranslate();
            this.#prevTranslate = this.#currentTranslate;
            wrapper.style.transform = `translate3d(${this.#currentTranslate}px, 0, 0)`;
            this.#isAnimating = false;
            this.#updateSlider();
            this.#log('Loop animation completed', { currentIndex: this.#currentIndex });
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
        const translate = -this.#currentIndex * this.#slideWidth - (this.#currentIndex + addition) * this.#gapPx;
        this.#log('Translate calculated', {
            currentIndex: this.#currentIndex,
            slideWidth: this.#slideWidth,
            gapPx: this.#gapPx,
            translate,
            elementId: this.#uniqueId
        });
        return translate;
    }

    #calculateTranslateForIndex(index) {
        const addition = (this.#attrs.slidesPerView - 1) / 2;
        const translate = -index * this.#slideWidth - (index + addition) * this.#gapPx;
        this.#log('Translate for index calculated', {
            index,
            slideWidth: this.#slideWidth,
            gapPx: this.#gapPx,
            translate,
            elementId: this.#uniqueId
        });
        return translate;
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
        this.#log('Adjusted for loop', {
            currentIndex: this.#currentIndex,
            minIndex,
            maxIndex,
            elementId: this.#uniqueId
        });
    }

    #navigate(direction) {
        if (this.#isAnimating) return;
        const oldIndex = this.#currentIndex;
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
        this.#log(`[Navigation] currentIndex=${this.#currentIndex}, direction=${direction}, oldIndex=${oldIndex}`, { elementId: this.#uniqueId });
    }

    #startAutoplay(autoplayType, autoplayDelay, continuousSpeed) {
        this.#stopAutoplay();
        if (this.#isHovering) {
            this.#log('Autoplay start skipped due to hover', { elementId: this.#uniqueId });
            return;
        }
        if (autoplayType === 'interval' && autoplayDelay > 0) {
            this.#autoplayInterval = setInterval(() => {
                if (!this.#isHovering && !this.#isProcessingClick) {
                    this.#navigate(1);
                }
            }, autoplayDelay);
            this.#log(`Started interval autoplay with delay ${autoplayDelay}ms`, { elementId: this.#uniqueId });
        } else if (autoplayType === 'continuous' && continuousSpeed > 0 && !this.#attrs.crossFade) {
            this.#continuousSpeed = continuousSpeed;
            this.#lastFrameTime = performance.now();
            this.#continuousAnimationId = requestAnimationFrame(this.#continuousScroll.bind(this));
            this.#log(`Started continuous autoplay with speed ${continuousSpeed}px/s`, {
                elementId: this.#uniqueId,
                currentTranslate: this.#currentTranslate
            });
        }
    }

    #stopAutoplay() {
        if (this.#autoplayInterval) {
            clearInterval(this.#autoplayInterval);
            this.#autoplayInterval = null;
            this.#log('Stopped interval autoplay', { elementId: this.#uniqueId });
        }
        if (this.#continuousAnimationId) {
            cancelAnimationFrame(this.#continuousAnimationId);
            this.#continuousAnimationId = null;
            this.#lastFrameTime = null;
            this.#log('Stopped continuous autoplay', { elementId: this.#uniqueId });
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
            this.#log(`[Cross-Fade Updated] currentIndex=${this.#currentIndex}, displayIndex=${displayIndex}`, { elementId: this.#uniqueId });
        } else if (forceUpdate || this.#attrs.autoplayType !== 'continuous') {
            wrapper.style.transform = `translate3d(${this.#currentTranslate}px, 0, 0)`;
        }

        if (this.#attrs.pagination) {
            const now = performance.now();
            if (!forceUpdate && now - this.#lastPaginationUpdate < 100) {
                return;
            }
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
                    dot.innerHTML = isActive ? this.#attrs.paginationIconActive : this.#attrs.paginationIconInactive;
                    const icon = dot.querySelector('i');
                    if (icon) {
                        icon.style.fontSize = isActive ? this.#attrs.paginationIconSizeActive : this.#attrs.paginationIconSizeInactive;
                    }
                });
                const firstVisibleSlide = this.#currentIndex - this.#bufferSize + 1;
                const lastVisibleSlide = firstVisibleSlide + this.#attrs.slidesPerView - 1;
                const visibleSlides = `${Math.max(1, firstVisibleSlide)}-${Math.min(this.#originalLength, lastVisibleSlide)}`;
                if (logicalIndex > maxIndex) {
                    this.#warn('Unexpected logicalIndex value', {
                        logicalIndex,
                        currentIndex: this.#currentIndex,
                        normalizedIndex: (this.#currentIndex - this.#bufferSize + this.#originalLength) % this.#originalLength,
                        visibleSlides,
                        elementId: this.#uniqueId
                    });
                }
                this.#log(`[Pagination Updated] currentIndex=${this.#currentIndex}, logicalIndex=${logicalIndex}, translate=${this.#currentTranslate}, forceUpdate=${forceUpdate}`, {
                    elementId: this.#uniqueId,
                    visibleSlides
                });
            } else {
                this.#warn('Pagination element not found in updateSlider', { elementId: this.#uniqueId });
            }
        }

        this.#log(`[Slider Updated] currentIndex=${this.#currentIndex}, translate=${this.#currentTranslate}, forceUpdate=${forceUpdate}`, { elementId: this.#uniqueId });
    }

    async render(attrs) {
        const sliderWrapper = document.createElement('div');
        sliderWrapper.id = this.#uniqueId;
        sliderWrapper.className = 'custom-slider';
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
            this.#warn('No valid slides found', { elementId: this.#uniqueId });
            const fallbackSlide = document.createElement('div');
            fallbackSlide.className = 'slider-slide';
            fallbackSlide.innerHTML = '<p>No slides available</p>';
            innerWrapper.appendChild(fallbackSlide);
        } else {
            this.#originalLength = this.#childElements.length;
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
                const icons = nav.querySelectorAll('i');
                const isStacked = icons.length === 2;
                icons.forEach((icon, index) => {
                    if (!icon.classList.contains('icon')) {
                        icon.classList.add('icon');
                    }
                    if (attrs.iconSizeBackground && attrs.iconSizeForeground && isStacked) {
                        icon.style.fontSize = index === 0 ? attrs.iconSizeBackground : attrs.iconSizeForeground;
                    } else if (attrs.iconSizeBackground) {
                        icon.style.fontSize = attrs.iconSizeBackground;
                    }
                });
            });
            sliderWrapper.appendChild(navPrev);
            sliderWrapper.appendChild(navNext);
        }

        if (attrs.pagination) {
            const pagination = document.createElement('div');
            pagination.className = 'slider-pagination';
            const totalSlides = this.#childElements.length;
            const totalDots = attrs.infiniteScrolling
                ? this.#originalLength
                : Math.max(1, totalSlides - attrs.slidesPerView + 1);
            for (let i = 0; i < totalDots; i++) {
                const dot = document.createElement('span');
                dot.className = 'icon';
                dot.innerHTML = i === 0 ? attrs.paginationIconActive : attrs.paginationIconInactive;
                const icon = dot.querySelector('i');
                if (icon && (attrs.paginationIconSizeActive || attrs.paginationIconSizeInactive)) {
                    icon.style.fontSize = i === 0 ? attrs.paginationIconSizeActive : attrs.paginationIconSizeInactive;
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
                        this.#log(`[Pagination Click] currentIndex=${this.#currentIndex}, clickedDot=${i + 1}, translate=${this.#currentTranslate}, isHovering=${this.#isHovering}`, { elementId: this.#uniqueId });
                    }, 50);
                });
                pagination.appendChild(dot);
            }
            sliderWrapper.appendChild(pagination);
            this.#log(`[Pagination Added] totalDots=${totalDots}, originalLength=${this.#originalLength}, totalSlides=${totalSlides}`, { elementId: this.#uniqueId });
        } else {
            this.#log('Pagination not added', { pagination: attrs.pagination, elementId: this.#uniqueId });
        }

        return sliderWrapper;
    }

    async connectedCallback() {
        this.#childElements = Array.from(this.children)
            .filter(child => child.tagName.toLowerCase() === 'custom-block' || child.classList.contains('block'))
            .map(child => child.cloneNode(true));
        this.#log('Connected to DOM', { childElementsCount: this.#childElements.length, elementId: this.#uniqueId });
        if (this.isVisible) {
            await this.initialize();
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
        this.#log('Disconnected from DOM', { elementId: this.#uniqueId });
    }

    static get observedAttributes() {
        return [
            'autoplay', 'slides-per-view', 'slides-per-view-mobile', 'slides-per-view-tablet',
            'slides-per-view-laptop', 'slides-per-view-desktop', 'slides-per-view-large',
            'navigation', 'navigation-icon-left', 'navigation-icon-right',
            'navigation-icon-left-background', 'navigation-icon-right-background', 'gap', 'pagination',
            'pagination-icon-active', 'pagination-icon-inactive', 'navigation-icon-size', 'pagination-icon-size',
            'draggable', 'cross-fade', 'infinite-scrolling', 'pause-on-hover'
        ];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (!this.isInitialized || !this.isVisible) {
            this.#ignoredChangeCount++;
            this.#log('Attribute change ignored', { name, oldValue, newValue, ignoredCount: this.#ignoredChangeCount, elementId: this.#uniqueId });
            return;
        }
        if (oldValue !== newValue) {
            this.#log('Attribute changed, reinitializing', { name, oldValue, newValue, elementId: this.#uniqueId });
            this.isInitialized = false;
            this.#stopAutoplay();
            this.#childElements = Array.from(this.children)
                .filter(child => child.tagName.toLowerCase() === 'custom-block' || child.classList.contains('block'))
                .map(child => child.cloneNode(true));
            this.initialize();
        }
    }
}

try {
    customElements.define('custom-slider', CustomSlider);
    console.log('CustomSlider defined successfully');
} catch (error) {
    console.error('Error defining CustomSlider element:', error);
}

console.log('CustomSlider version: 2025-10-29 (responsive slides-per-view with strict breakpoint validation, infinite-scrolling animation fix, navigation clamping, cross-fade loop, enhanced continuous autoplay with seamless loop, drag resumption, pagination restoration, fixed pagination dots for infinite scrolling with unique slide navigation, fixed pagination clicks during autoplay, optional pause-on-hover, fixed pagination navigation during active autoplay, mobile breakpoint fix, gap attribute fix, dynamic pagination update on resize, enhanced error handling, fixed validateIcon typo, fixed pagination dot count on viewport resize, fixed navigationIconRight typo)');

export { CustomSlider };
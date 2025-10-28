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
    #lastDirection = 0;
    #attrs = null;
    #isDragging = false;
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
            const config = await getConfig();
            this.#basePath = config.general?.basePath || '/';
        }
        return this.#basePath;
    }

    async getAttributes() {
        const autoplayAttr = this.getAttribute('autoplay');
        let autoplayDelay = 0;
        if (this.hasAttribute('autoplay')) {
            if (autoplayAttr === '' || autoplayAttr === null) {
                autoplayDelay = 3000;
            } else {
                const timeMatch = autoplayAttr.match(/^(\d+)(s|ms)$/);
                if (timeMatch) {
                    const value = parseInt(timeMatch[1], 10);
                    const unit = timeMatch[2];
                    autoplayDelay = unit === 's' ? value * 1000 : value;
                } else {
                    this.#warn('Invalid autoplay format, using default 3s', { value: autoplayAttr, expected: 'Ns or Nms' });
                    autoplayDelay = 3000;
                }
            }
        }

        const slidesPerViewAttr = this.getAttribute('slides-per-view') || '1';
        let slidesPerView = parseInt(slidesPerViewAttr, 10);
        if (isNaN(slidesPerView) || slidesPerView < 1) {
            this.#warn('Invalid slides-per-view', { value: slidesPerViewAttr, defaultingTo: 1 });
            slidesPerView = 1;
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
        if (slidesPerView === 1 && this.hasAttribute('gap')) {
            this.#warn('Gap attribute ignored for slides-per-view=1', { gap: gapAttr });
            gap = '0';
        }

        let pagination = this.hasAttribute('pagination');
        let paginationIconActive = this.getAttribute('pagination-icon-active') || '<i class="fa-solid fa-circle"></i>';
        let paginationIconInactive = this.getAttribute('pagination-icon-inactive') || '<i class="fa-regular fa-circle"></i>';

        const crossFade = this.hasAttribute('cross-fade');
        if (crossFade && slidesPerView !== 1) {
            this.#warn('Cross-fade attribute is only supported for slides-per-view=1, ignoring', { slidesPerView });
        }

        const infiniteScrolling = this.hasAttribute('infinite-scrolling');

        const validateIcon = (icon, position, isBackground = false) => {
            if (!icon) return '';
            const parser = new DOMParser();
            const decodedIcon = icon.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
            const doc = parser.parseFromString(decodedIcon, 'text/html');
            const iElement = doc.body.querySelector('i');
            let classes = iElement ? iElement.className.split(' ').filter(cls => cls) : icon.split(/\s+/).filter(cls => cls);
            if (!iElement && !icon.match(/fa-/)) {
                classes = icon.split(/\s+/).filter(cls => cls);
                if (!classes.some(cls => cls.startsWith('fa-'))) {
                    this.#warn(`Invalid ${position} ${isBackground ? 'background ' : ''}icon format, ensure Font Awesome classes are provided`, {
                        value: icon,
                        expected: 'Font Awesome classes (fa-*) or <i> tag with fa- classes'
                    });
                    return isBackground ? '' : '<i class="fa-solid fa-circle"></i>';
                }
            }
            const validClasses = classes.filter(cls => cls.startsWith('fa-') || cls === 'fa-chisel' || cls === 'fa-utility' || cls === 'fa-utility-fill' || cls === 'fa-semibold');
            if (validClasses.length === 0) {
                this.#warn(`No valid Font Awesome classes in ${position} ${isBackground ? 'background ' : ''}icon`, {
                    classes,
                    elementId: this.#uniqueId
                });
                return isBackground ? '' : '<i class="fa-solid fa-circle"></i>';
            }
            validClasses.push('icon');
            return `<i class="${validClasses.join(' ')}"></i>`;
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

        navigationIconLeft = leftIconResult.markup;
        navigationIconRight = rightIconResult.markup;
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

        if (pagination && (!this.hasAttribute('pagination-icon-active') || !this.hasAttribute('pagination-icon-inactive'))) {
            this.#warn('Pagination requires explicit pagination-icon-active and pagination-icon-inactive attributes. Ignoring pagination.');
            pagination = false;
        }

        return {
            autoplayDelay,
            slidesPerView,
            navigation,
            navigationIconLeft,
            navigationIconRight,
            gap,
            pagination,
            paginationIconActive,
            paginationIconInactive,
            iconSizeBackground,
            iconSizeForeground,
            paginationIconSizeActive,
            paginationIconSizeInactive,
            crossFade,
            infiniteScrolling
        };
    }

    async initialize() {
        if (this.isInitialized || !this.isVisible) {
            return;
        }

        this.isInitialized = true;
        this.#log('Initialization started', { elementId: this.#uniqueId });

        try {
            const attrs = await this.getAttributes();
            this.#attrs = attrs;
            const sliderElement = await this.render(attrs);
            if (sliderElement) {
                this.replaceWith(sliderElement);
                this.#setupSlider();
                this.#log('Initialization completed', { elementId: this.#uniqueId });
            } else {
                this.#error('Render returned null, using fallback', { elementId: this.#uniqueId });
                const fallback = await this.render({
                    autoplayDelay: 3000,
                    slidesPerView: 1,
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
                    infiniteScrolling: false
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
                autoplayDelay: 3000,
                slidesPerView: 1,
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
                infiniteScrolling: false
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
        } else {
            wrapper.innerHTML = '';
            originalSlides.forEach(slide => wrapper.appendChild(slide));
            this.#slides = originalSlides;
            this.#currentIndex = 0;
            this.#bufferSize = 0;
        }

        this.#recalculateDimensions();

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

        if (this.#attrs.navigation) {
            const prevButton = document.getElementById(`${this.#uniqueId}-prev`);
            const nextButton = document.getElementById(`${this.#uniqueId}-next`);
            if (prevButton && nextButton) {
                prevButton.addEventListener('click', () => this.#navigate(-1));
                nextButton.addEventListener('click', () => this.#navigate(1));
            }
        }

        if (this.#attrs.pagination) {
            const pagination = sliderContainer.querySelector('.slider-pagination');
            if (pagination) {
                const dots = pagination.querySelectorAll('span.icon');
                dots.forEach((dot, index) => {
                    dot.addEventListener('click', () => {
                        this.#currentIndex = index + (this.#attrs.infiniteScrolling ? this.#bufferSize : 0);
                        this.#setPositionByIndex();
                        this.#updateSlider();
                    });
                });
            }
        }

        if (this.#attrs.autoplayDelay) {
            this.#startAutoplay(this.#attrs.autoplayDelay);
        }

        this.#debouncedHandleResize = this.#debounce(this.#handleResize.bind(this), 100);
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
                slidesPerView: this.#attrs.slidesPerView
            });
        }
    }

    #pointerDown(event) {
        if (this.#attrs.crossFade && this.#attrs.slidesPerView === 1) {
            return;
        }
        if (event.pointerType === 'touch' || event.pointerType === 'mouse') {
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
        this.#setPositionByIndex();
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

            if (this.#attrs.infiniteScrolling) {
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

        this.#setPositionByIndex();
        const wrapper = document.getElementById(this.#uniqueId).querySelector('.slider-wrapper');
        wrapper.classList.remove('dragging');
        if (event.target.releasePointerCapture) {
            try {
                event.target.releasePointerCapture(event.pointerId);
            } catch (e) {
                this.#warn('Failed to release pointer capture', { error: e.message });
            }
        }
        this.#updateSlider();
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
        wrapper.style.transition = `transform ${transitionDuration}`;
        wrapper.style.transform = `translate3d(${this.#currentTranslate}px, 0, 0)`;
        this.#log('Slider position set', {
            translate: this.#currentTranslate,
            currentIndex: this.#currentIndex,
            transitionDuration
        });
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
            this.#setSliderPosition();
        }
    }

    #calculateTranslate() {
        const addition = (this.#attrs.slidesPerView - 1) / 2;
        const translate = -this.#currentIndex * this.#slideWidth - (this.#currentIndex + addition) * this.#gapPx;
        this.#log('Translate calculated', {
            currentIndex: this.#currentIndex,
            slideWidth: this.#slideWidth,
            gapPx: this.#gapPx,
            translate
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
            translate
        });
        return translate;
    }

    #handleResize() {
        this.#recalculateDimensions();
        this.#setPositionByIndex();
        this.#log('Resize handled', {
            currentIndex: this.#currentIndex,
            translate: this.#currentTranslate
        });
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

        const oldIndex = this.#currentIndex;
        const newIndex = this.#currentIndex + direction;

        if (this.#attrs.infiniteScrolling && !this.#attrs.crossFade) {
            const minIndex = this.#bufferSize;
            const maxIndex = this.#bufferSize + this.#originalLength - this.#attrs.slidesPerView;

            if (newIndex > maxIndex) {
                // Next: animate right to left
                const tempTranslate = this.#calculateTranslateForIndex(this.#currentIndex + direction);
                const targetIndex = newIndex - this.#originalLength;
                this.#animateLoop(tempTranslate, targetIndex, 1);
                return;
            } else if (newIndex < minIndex) {
                // Prev: animate left to right
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

    #startAutoplay(delay) {
        this.#stopAutoplay();
        this.#autoplayInterval = setInterval(() => {
            this.#navigate(1);
        }, delay);
    }

    #stopAutoplay() {
        if (this.#autoplayInterval) {
            clearInterval(this.#autoplayInterval);
            this.#autoplayInterval = null;
        }
    }

    #updateSlider() {
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
        } else {
            wrapper.style.transform = `translate3d(${this.#calculateTranslate()}px, 0, 0)`;
        }

        if (this.#attrs.pagination) {
            const pagination = sliderContainer.querySelector('.slider-pagination');
            if (pagination) {
                const dots = pagination.querySelectorAll('span.icon');
                const logicalIndex = this.#attrs.infiniteScrolling
                    ? Math.max(0, Math.min((this.#currentIndex - this.#bufferSize), this.#originalLength - this.#attrs.slidesPerView))
                    : this.#currentIndex;

                dots.forEach((dot, index) => {
                    const isActive = index === logicalIndex;
                    dot.innerHTML = isActive ? this.#attrs.paginationIconActive : this.#attrs.paginationIconInactive;
                    const icon = dot.querySelector('i');
                    if (icon) {
                        icon.style.fontSize = isActive ? this.#attrs.paginationIconSizeActive : this.#attrs.paginationIconSizeInactive;
                    }
                });
                this.#log(`[Pagination Updated] currentIndex=${this.#currentIndex}, logicalIndex=${logicalIndex}`, { elementId: this.#uniqueId });
            }
        }

        this.#log(`[Slider Updated] currentIndex=${this.#currentIndex}`, { elementId: this.#uniqueId });
    }

    async render(attrs) {
        const sliderWrapper = document.createElement('div');
        sliderWrapper.id = this.#uniqueId;
        sliderWrapper.className = 'custom-slider';

        const innerWrapper = document.createElement('div');
        innerWrapper.className = 'slider-wrapper';
        if (!attrs.crossFade || attrs.slidesPerView !== 1) {
            innerWrapper.style.setProperty('--slider-columns', `repeat(${this.#childElements.length}, ${100 / attrs.slidesPerView}%)`);
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
            const totalDots = Math.max(1, totalSlides - attrs.slidesPerView + 1);
            for (let i = 0; i < totalDots; i++) {
                const dot = document.createElement('span');
                dot.className = 'icon';
                dot.innerHTML = i === 0 ? attrs.paginationIconActive : attrs.paginationIconInactive;
                const icon = dot.querySelector('i');
                if (icon && (attrs.paginationIconSizeActive || attrs.paginationIconSizeInactive)) {
                    icon.style.fontSize = i === 0 ? attrs.paginationIconSizeActive : attrs.paginationIconSizeInactive;
                }
                dot.addEventListener('click', () => {
                    const oldIndex = this.#currentIndex;
                    this.#currentIndex = i + (this.#attrs.infiniteScrolling ? this.#bufferSize : 0);
                    this.#setPositionByIndex();
                    this.#updateSlider();
                    this.#log(`[Pagination Click] currentIndex=${this.#currentIndex}, oldIndex=${oldIndex}, clickedDot=${i + 1}`, { elementId: this.#uniqueId });
                });
                pagination.appendChild(dot);
            }
            sliderWrapper.appendChild(pagination);
            this.#log(`[Pagination Added] totalDots=${totalDots}`, { elementId: this.#uniqueId, totalSlides });
        }

        return sliderWrapper;
    }

    async connectedCallback() {
        this.#childElements = Array.from(this.children)
            .filter(child => child.tagName.toLowerCase() === 'custom-block' || child.classList.contains('block'))
            .map(child => child.cloneNode(true));

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
    }

    static get observedAttributes() {
        return [
            'autoplay', 'slides-per-view', 'navigation', 'navigation-icon-left', 'navigation-icon-right',
            'navigation-icon-left-background', 'navigation-icon-right-background', 'gap', 'pagination',
            'pagination-icon-active', 'pagination-icon-inactive', 'navigation-icon-size', 'pagination-icon-size',
            'draggable', 'cross-fade', 'infinite-scrolling'
        ];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (!this.isInitialized || !this.isVisible) {
            this.#ignoredChangeCount++;
            return;
        }

        if (oldValue !== newValue) {
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
} catch (error) {
    console.error('Error defining CustomSlider element:', error);
}

console.log('CustomSlider version: 2025-10-28 (infinite-scrolling animation fix, navigation clamping, cross-fade loop)');
export { CustomSlider };
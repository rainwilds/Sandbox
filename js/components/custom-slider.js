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
            const validClasses = classes.filter(cls => cls.startsWith('fa-') || cls === 'fa-chisel');
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
            crossFade
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
                const fallbackElement = await this.render({ autoplayDelay: 3000, slidesPerView: 1, navigation: false, gap: '0', pagination: false, paginationIconActive: '<i class="fa-solid fa-circle"></i>', paginationIconInactive: '<i class="fa-regular fa-circle"></i>', iconSizeBackground: '', iconSizeForeground: '', paginationIconSizeActive: '', paginationIconSizeInactive: '', crossFade: false });
                this.replaceWith(fallbackElement);
            }
        } catch (error) {
            this.#error('Initialization failed', {
                error: error.message,
                stack: error.stack,
                elementId: this.#uniqueId
            });
            const fallbackElement = await this.render({ autoplayDelay: 3000, slidesPerView: 1, navigation: false, gap: '0', pagination: false, paginationIconActive: '<i class="fa-solid fa-circle"></i>', paginationIconInactive: '<i class="fa-regular fa-circle"></i>', iconSizeBackground: '', iconSizeForeground: '', paginationIconSizeActive: '', paginationIconSizeInactive: '', crossFade: false });
            this.replaceWith(fallbackElement);
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

        this.#recalculateDimensions();

        const wrapper = sliderContainer.querySelector('.slider-wrapper');
        if (this.hasAttribute('draggable')) {
            sliderContainer.setAttribute('draggable', '');
        }
        if (this.#attrs.crossFade && this.#attrs.slidesPerView === 1) {
            sliderContainer.setAttribute('cross-fade', '');
            this.#slides.forEach((slide, index) => {
                slide.style.opacity = index === 0 ? '1' : '0';
                if (index === 0) slide.classList.add('active');
            });
        }
        if (this.#attrs.gap && this.#attrs.gap !== '0' && (!this.#attrs.crossFade || this.#attrs.slidesPerView !== 1)) {
            wrapper.style.setProperty('--slider-gap', this.#attrs.gap);
        }
        wrapper.style.setProperty('--slider-columns', `repeat(${this.#slides.length}, calc(100% / ${this.#attrs.slidesPerView}))`);

        if (this.hasAttribute('draggable')) {
            wrapper.addEventListener('pointerdown', this.#pointerDown.bind(this));
            wrapper.addEventListener('pointerup', this.#pointer
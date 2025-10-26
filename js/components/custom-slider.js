/* global HTMLElement, IntersectionObserver, document, window, console, requestAnimationFrame, MutationObserver, Promise */

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
    #cachedAttributes = null;
    #criticalAttributesHash = null;
    #mutationObserver = null;

    constructor() {
        super();
        this.isVisible = false;
        this.isInitialized = false;
        this.debug = new URLSearchParams(window.location.search).get('debug') === 'true';
        this.#ignoredChangeCount = 0;
        this.#uniqueId = `slider-${Math.random().toString(36).substr(2, 9)}`;
        this.#log('Constructor called', { elementId: this.#uniqueId });
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
    static #renderCacheMap = new WeakMap();
    static #criticalAttributes = [
        'autoplay', 'slides-per-view', 'navigation', 'navigation-icon-left', 'navigation-icon-right',
        'navigation-icon-left-background', 'navigation-icon-right-background', 'gap', 'pagination',
        'pagination-icon-active', 'pagination-icon-inactive', 'navigation-icon-size'
    ];

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

    #observeChildren() {
        if (this.#mutationObserver) return;
        this.#mutationObserver = new MutationObserver(() => {
            this.#childElements = Array.from(this.children)
                .filter(child => child.tagName.toLowerCase() === 'custom-block')
                .map(child => child.cloneNode(true));
            this.#log('Children updated via MutationObserver', { count: this.#childElements.length, elementId: this.#uniqueId });
        });
        this.#mutationObserver.observe(this, { childList: true });
    }

    async getAttributes() {
        if (this.#cachedAttributes) {
            this.#log('Using cached attributes', { elementId: this.#uniqueId });
            return this.#cachedAttributes;
        }
        this.#log('Parsing new attributes', { elementId: this.#uniqueId, outerHTML: this.outerHTML.substring(0, 200) });

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
                    this.#warn('Invalid autoplay format, using default 3s', { value: autoplayAttr, expected: 'Ns or Nms', elementId: this.#uniqueId });
                    autoplayDelay = 3000;
                }
            }
        }
        this.#log('Parsed autoplay attribute', { autoplayAttr, autoplayDelay });

        const slidesPerViewAttr = this.getAttribute('slides-per-view') || '1';
        let slidesPerView = parseInt(slidesPerViewAttr, 10);
        if (isNaN(slidesPerView) || slidesPerView < 1 || !Number.isInteger(Number(slidesPerViewAttr))) {
            this.#warn('Invalid slides-per-view, defaulting to 1. Check HTML or CMS for correct attribute value.', { 
                value: slidesPerViewAttr, 
                expected: 'Positive integer (e.g., "3")',
                elementId: this.#uniqueId,
                outerHTML: this.outerHTML
            });
            slidesPerView = 1;
        }
        this.#log('Parsed slides-per-view attribute', { slidesPerViewAttr, slidesPerView });

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
                    expected: 'One or two CSS font-size values (e.g., "1.5rem" or "2rem 1.5rem")',
                    elementId: this.#uniqueId
                });
            }
        }
        this.#log('Parsed navigation-icon-size', { navigationIconSize, iconSizeBackground, iconSizeForeground });

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
                    paginationIconSizeInactive,
                    elementId: this.#uniqueId
                });
            } else {
                this.#warn('Invalid pagination-icon-size format, ignoring', {
                    value: paginationIconSize,
                    expected: 'One or two CSS font-size values (e.g., "1.5rem" or "1.5rem 1rem")',
                    elementId: this.#uniqueId
                });
            }
        }
        this.#log('Parsed pagination-icon-size', { paginationIconSize, paginationIconSizeActive, paginationIconSizeInactive });

        const gapAttr = this.getAttribute('gap') || '0';
        let gap = gapAttr;
        if (slidesPerView === 1 && this.hasAttribute('gap')) {
            this.#warn('Gap attribute ignored for slides-per-view=1', { gap: gapAttr, elementId: this.#uniqueId });
            gap = '0';
        } else if (gapAttr && !gapAttr.match(/^(\d*\.?\d+(?:px|rem|em|%)|var\(--[a-zA-Z0-9-]+\))$/)) {
            this.#warn('Invalid gap format, defaulting to 0', { value: gapAttr, expected: 'CSS length (e.g., "10px", "var(--space-small)")', elementId: this.#uniqueId });
            gap = '0';
        }
        this.#log('Parsed gap attribute', { gapAttr, effectiveGap: gap });

        let pagination = this.hasAttribute('pagination');
        let paginationIconActive = this.getAttribute('pagination-icon-active') || '<i class="fa-solid fa-circle"></i>';
        let paginationIconInactive = this.getAttribute('pagination-icon-inactive') || '<i class="fa-regular fa-circle"></i>';

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
                    this.#warn(`Invalid ${position} ${isBackground ? 'background ' : ''}icon format`, {
                        value: icon,
                        expected: 'Font Awesome classes (fa-*) or <i> tag with fa- classes',
                        elementId: this.#uniqueId
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
                this.#warn(`No valid foreground icon for ${position}, navigation disabled`, { icon, backgroundIcon, elementId: this.#uniqueId });
                return { valid: false, markup: '' };
            }
            if (iconSizeBackground && iconSizeForeground && iconSizeBackground !== iconSizeForeground && !background) {
                this.#warn(`Two navigation-icon-size values provided but ${position} icons are not stacked, using first size`, {
                    navigationIconSize,
                    iconSizeBackground,
                    iconSizeForeground,
                    elementId: this.#uniqueId
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
        navigation = navigation && leftIconResult.valid && rightIconResult.valid;

        paginationIconActive = validateIcon(paginationIconActive, 'active');
        paginationIconInactive = validateIcon(paginationIconInactive, 'inactive');

        if (pagination && (!this.hasAttribute('pagination-icon-active') || !this.hasAttribute('pagination-icon-inactive'))) {
            this.#warn('Pagination requires explicit pagination-icon-active and pagination-icon-inactive attributes. Ignoring pagination.', { elementId: this.#uniqueId });
            pagination = false;
        }

        this.#cachedAttributes = {
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
            paginationIconSizeInactive
        };

        const criticalAttrs = {};
        CustomSlider.#criticalAttributes.forEach(attr => {
            criticalAttrs[attr] = this.getAttribute(attr) || '';
        });
        this.#criticalAttributesHash = JSON.stringify(criticalAttrs);
        this.#log('Attributes parsed successfully', {
            elementId: this.#uniqueId,
            criticalHashLength: this.#criticalAttributesHash.length,
            slidesPerView,
            childCount: this.#childElements.length
        });

        return this.#cachedAttributes;
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
            this.#observeChildren();
            const sliderElement = await this.render();
            if (sliderElement) {
                this.#log('Render successful, replacing element', { elementId: this.#uniqueId });
                this.replaceWith(sliderElement);
                this.#setupSlider(await this.getAttributes());
                this.#log('Initialization completed successfully', { elementId: this.#uniqueId });
            } else {
                this.#error('Render returned null, using fallback', { elementId: this.#uniqueId });
                const fallbackElement = await this.render(true);
                this.replaceWith(fallbackElement);
            }
        } catch (error) {
            this.#error('Initialization failed', {
                error: error.message,
                stack: error.stack,
                elementId: this.#uniqueId
            });
            const fallbackElement = await this.render(true);
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
            this.#warn('No slides to initialize', { elementId: this.#uniqueId, childCount: this.#childElements.length });
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

        this.#updateSlider(attrs);
    }

    #navigate(direction) {
        const totalSlides = this.#slides.length;
        const slidesPerView = this.#cachedAttributes?.slidesPerView || parseInt(this.getAttribute('slides-per-view') || '1', 10);
        this.#lastDirection = direction;
        const newIndex = this.#currentIndex + direction;

        const maxVisibleIndex = totalSlides - slidesPerView;
        if (newIndex > maxVisibleIndex) {
            this.#currentIndex = 0;
        } else if (newIndex < 0) {
            this.#currentIndex = maxVisibleIndex;
        } else {
            this.#currentIndex = newIndex;
        }

        this.#log('Navigation requested', { direction, newIndex: this.#currentIndex, totalSlides, slidesPerView });
        this.#debounceUpdateSlider();
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

    #debounceUpdateSlider = (() => {
        let timeout;
        return () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                this.getAttributes().then(attrs => {
                    this.#updateSlider(attrs);
                });
            }, 50);
        };
    })();

    #updateSlider(attrs) {
        if (this.#animationFrameId) {
            cancelAnimationFrame(this.#animationFrameId);
        }

        this.#animationFrameId = requestAnimationFrame(() => {
            const sliderContainer = document.getElementById(this.#uniqueId);
            if (!sliderContainer) {
                this.#error('Slider container not found during update', { elementId: this.#uniqueId });
                return;
            }

            const slideWidth = 100 / attrs.slidesPerView;
            const gap = attrs.gap && attrs.gap !== '0' ? attrs.gap : '0';
            const addition = (attrs.slidesPerView - 1) / 2;
            const gapOffset = gap === '0' ? '0' : `(${this.#currentIndex} + ${addition}) * ${gap}`;
            const translateX = gap === '0' ? `-${this.#currentIndex * slideWidth}%` : `calc(-${this.#currentIndex * slideWidth}% - ${gapOffset})`;
            this.#log('Applying slider transform', { currentIndex: this.#currentIndex, translateX, slideWidth, gap });

            const wrapper = sliderContainer.querySelector('.slider-wrapper');
            wrapper.style.transform = `translateX(${translateX})`;

            if (attrs.pagination) {
                const pagination = sliderContainer.querySelector('.slider-pagination');
                if (pagination) {
                    const dots = pagination.querySelectorAll('.icon');
                    dots.forEach((dot, index) => {
                        const isActive = index === this.#currentIndex;
                        dot.innerHTML = isActive ? attrs.paginationIconActive : attrs.paginationIconInactive;
                        const icon = dot.querySelector('i');
                        if (icon && (attrs.paginationIconSizeActive || attrs.paginationIconSizeInactive)) {
                            icon.style.fontSize = isActive ? attrs.paginationIconSizeActive : attrs.paginationIconSizeInactive;
                        }
                    });
                    this.#log('Pagination dots updated', { currentIndex: this.#currentIndex, totalDots: dots.length });
                }
            }

            this.#log('Slider update completed', { currentIndex: this.#currentIndex, elementId: this.#uniqueId });
        });
    }

    async render(isFallback = false) {
        this.#log(`Starting render ${isFallback ? '(fallback)' : ''}`, { elementId: this.#uniqueId });
        let newCriticalAttrsHash;
        if (!isFallback) {
            const criticalAttrs = {};
            CustomSlider.#criticalAttributes.forEach(attr => {
                criticalAttrs[attr] = this.getAttribute(attr) || '';
            });
            newCriticalAttrsHash = JSON.stringify(criticalAttrs);
            if (CustomSlider.#renderCacheMap.has(this) && this.#criticalAttributesHash === newCriticalAttrsHash) {
                this.#log('Using cached render', { elementId: this.#uniqueId });
                return CustomSlider.#renderCacheMap.get(this).cloneNode(true);
            }
        }

        const attrs = isFallback ? {
            autoplayDelay: 3000,
            slidesPerView: 1,
            navigation: false,
            navigationIconLeft: '<i class="fa-solid fa-circle"></i>',
            navigationIconRight: '<i class="fa-solid fa-circle"></i>',
            gap: '0',
            pagination: false,
            paginationIconActive: '<i class="fa-solid fa-circle"></i>',
            paginationIconInactive: '<i class="fa-regular fa-circle"></i>',
            iconSizeBackground: '',
            iconSizeForeground: '',
            paginationIconSizeActive: '',
            paginationIconSizeInactive: ''
        } : await this.getAttributes();

        const fragment = document.createDocumentFragment();
        const sliderWrapper = document.createElement('div');
        sliderWrapper.id = this.#uniqueId;
        sliderWrapper.className = 'custom-slider';

        const innerWrapper = document.createElement('div');
        innerWrapper.className = 'slider-wrapper';
        const gridTemplateColumns = `repeat(${this.#childElements.length || 1}, calc(100% / ${attrs.slidesPerView}))`;
        innerWrapper.style.gridTemplateColumns = gridTemplateColumns;
        if (attrs.gap && attrs.gap !== '0') {
            innerWrapper.style.columnGap = attrs.gap;
        }
        this.#log('Applied styles to slider-wrapper', { gap: attrs.gap, gridTemplateColumns });

        if (this.#childElements.length === 0) {
            this.#warn('No valid slides found', { elementId: this.#uniqueId, childCount: this.#childElements.length });
            const fallbackSlide = document.createElement('div');
            fallbackSlide.className = 'slider-slide';
            fallbackSlide.innerHTML = `<p>No slides available (expected ${this.#childElements.length} slides)</p>`;
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

            const navNext = document.createElement('div');
            navNext.id = `${this.#uniqueId}-next`;
            navNext.className = 'slider-nav-next';
            navNext.innerHTML = attrs.navigationIconRight;

            [navPrev, navNext].forEach((nav, index) => {
                const icons = nav.querySelectorAll('i');
                const isLeftNav = index === 0;
                const isStacked = icons.length === 2;
                icons.forEach((icon, iconIndex) => {
                    if (!icon.classList.contains('icon')) {
                        icon.classList.add('icon');
                    }
                    if (attrs.iconSizeBackground && attrs.iconSizeForeground) {
                        if (isStacked) {
                            icon.style.fontSize = iconIndex === 0 ? attrs.iconSizeBackground : attrs.iconSizeForeground;
                        } else {
                            icon.style.fontSize = attrs.iconSizeBackground;
                        }
                    } else if (attrs.iconSizeBackground) {
                        icon.style.fontSize = attrs.iconSizeBackground;
                    }
                });
                this.#log(`Navigation ${isLeftNav ? 'prev' : 'next'} icon styled`, { isStacked, iconCount: icons.length });
            });

            sliderWrapper.appendChild(navPrev);
            sliderWrapper.appendChild(navNext);
            this.#log('Navigation buttons added', { elementId: this.#uniqueId });
        }

        if (attrs.pagination) {
            const pagination = document.createElement('div');
            pagination.className = 'slider-pagination';

            const totalSlides = this.#childElements.length || 1;
            for (let i = 0; i < totalSlides; i++) {
                const dot = document.createElement('span');
                dot.className = 'icon';
                dot.innerHTML = i === 0 ? attrs.paginationIconActive : attrs.paginationIconInactive;
                const icon = dot.querySelector('i');
                if (icon && (attrs.paginationIconSizeActive || attrs.paginationIconSizeInactive)) {
                    icon.style.fontSize = i === 0 ? attrs.paginationIconSizeActive : attrs.paginationIconSizeInactive;
                }
                dot.addEventListener('click', () => {
                    this.#currentIndex = i;
                    this.#debounceUpdateSlider();
                    this.#log('Pagination dot clicked', { newIndex: this.#currentIndex, elementId: this.#uniqueId });
                });
                pagination.appendChild(dot);
            }
            sliderWrapper.appendChild(pagination);
            this.#log('Pagination added', { totalSlides, elementId: this.#uniqueId });
        }

        fragment.appendChild(sliderWrapper);
        if (!isFallback) {
            CustomSlider.#renderCacheMap.set(this, sliderWrapper.cloneNode(true));
            this.#criticalAttributesHash = newCriticalAttrsHash;
        }
        this.#log('Render completed', { elementId: this.#uniqueId, html: sliderWrapper.outerHTML.substring(0, 200) });
        return sliderWrapper;
    }

    async connectedCallback() {
        this.#log('Connected to DOM', { elementId: this.#uniqueId });
        Promise.resolve().then(() => {
            if (!this.#childElements.length) {
                this.#childElements = Array.from(this.children)
                    .filter(child => child.tagName.toLowerCase() === 'custom-block')
                    .map(child => child.cloneNode(true));
                this.#log('Captured children in connectedCallback', { count: this.#childElements.length, elementId: this.#uniqueId });
            }
            if (this.isVisible) {
                this.initialize();
            }
        });
    }

    disconnectedCallback() {
        this.#log('Disconnected from DOM', { elementId: this.#uniqueId });
        this.#stopAutoplay();
        if (this.#animationFrameId) {
            cancelAnimationFrame(this.#animationFrameId);
            this.#animationFrameId = null;
        }
        if (this.#mutationObserver) {
            this.#mutationObserver.disconnect();
            this.#mutationObserver = null;
        }
        if (CustomSlider.#observedInstances.has(this)) {
            CustomSlider.#observer.unobserve(this);
            CustomSlider.#observedInstances.delete(this);
        }
        this.#childElements = [];
        CustomSlider.#renderCacheMap.delete(this);
        this.#cachedAttributes = null;
        this.#criticalAttributesHash = null;
    }

    static get observedAttributes() {
        return [
            'autoplay', 'slides-per-view', 'navigation', 'navigation-icon-left', 'navigation-icon-right',
            'navigation-icon-left-background', 'navigation-icon-right-background', 'gap', 'pagination',
            'pagination-icon-active', 'pagination-icon-inactive', 'navigation-icon-size', 'pagination-icon-size'
        ];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;
        if (!this.isInitialized || !this.isVisible) {
            this.#ignoredChangeCount++;
            if (this.debug && this.#ignoredChangeCount % 10 === 0) {
                this.#log('Attribute changes ignored (not ready - batched)', {
                    count: this.#ignoredChangeCount,
                    name, oldValue, newValue, elementId: this.#uniqueId
                });
            }
            return;
        }
        this.#log('Attribute changed', { name, oldValue, newValue, elementId: this.#uniqueId });
        if (CustomSlider.#criticalAttributes.includes(name)) {
            this.#cachedAttributes = null;
            this.#criticalAttributesHash = null;
            this.isInitialized = false;
            this.#childElements = Array.from(this.children)
                .filter(child => child.tagName.toLowerCase() === 'custom-block')
                .map(child => child.cloneNode(true));
            this.initialize();
        } else if (name === 'pagination-icon-size') {
            this.#debounceUpdateSlider();
        }
    }
}

try {
    customElements.define('custom-slider', CustomSlider);
} catch (error) {
    console.error('Error defining CustomSlider element:', error);
}

console.log('CustomSlider version: 2025-10-26');
export { CustomSlider };
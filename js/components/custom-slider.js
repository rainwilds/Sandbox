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
    #attrs = null;
    #isDragging = false;
    #startPos = 0;
    #currentTranslate = 0;
    #prevTranslate = 0;
    #animationID = null;
    #slideWidth = 0;
    #gapPx = 0;

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

        let navigation = this.hasAttribute('navigation');
        let navigationIconLeft = this.getAttribute('navigation-icon-left') || '<i class="fa-chisel fa-regular fa-angle-left"></i>';
        let navigationIconRight = this.getAttribute('navigation-icon-right') || '<i class="fa-chisel fa-regular fa-angle-right"></i>';
        let navigationIconLeftBackground = this.getAttribute('navigation-icon-left-background') || '';
        let navigationIconRightBackground = this.getAttribute('navigation-icon-right-background') || '';

        // Parse navigation-icon-size
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
        this.#log('Parsed navigation-icon-size', { navigationIconSize, iconSizeBackground, iconSizeForeground });

        // Parse pagination-icon-size
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
                // Warn if two sizes are provided (pagination icons are always single)
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
        this.#log('Parsed pagination-icon-size', { paginationIconSize, paginationIconSizeActive, paginationIconSizeInactive });

        const gapAttr = this.getAttribute('gap') || '0'; // Default to 0 if no gap attribute
        let gap = gapAttr;
        if (slidesPerView === 1 && this.hasAttribute('gap')) {
            this.#warn('Gap attribute ignored for slides-per-view=1', { gap: gapAttr });
            gap = '0';
        }
        this.#log('Parsed gap attribute', { gapAttr, effectiveGap: gap });

        let pagination = this.hasAttribute('pagination'); // Boolean, true if attribute is present
        this.#log('Parsed pagination attribute', { pagination });

        let paginationIconActive = this.getAttribute('pagination-icon-active') || '<i class="fa-solid fa-circle"></i>';
        let paginationIconInactive = this.getAttribute('pagination-icon-inactive') || '<i class="fa-regular fa-circle"></i>';
        this.#log('Parsed pagination icons', { paginationIconActive, paginationIconInactive });

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
            validClasses.push('icon'); // Always add 'icon' class
            return `<i class="${validClasses.join(' ')}"></i>`;
        };

        const processIconStack = (icon, backgroundIcon, position) => {
            const foreground = validateIcon(icon, position);
            const background = validateIcon(backgroundIcon, position, true);
            if (!foreground) {
                this.#warn(`No valid foreground icon for ${position}, navigation disabled`, { icon, backgroundIcon });
                return { valid: false, markup: '' };
            }
            // Check if two sizes were provided but no stack is present
            if (iconSizeBackground && iconSizeForeground && iconSizeBackground !== iconSizeForeground && !background) {
                this.#warn(`Two navigation-icon-size values provided but ${position} icons are not stacked, using first size`, {
                    navigationIconSize,
                    iconSizeBackground,
                    iconSizeForeground
                });
            }
            if (!background) {
                return { valid: true, markup: foreground }; // Single icon
            }
            // Create stacked icon markup with only .icon-stack and .icon classes
            return {
                valid: true,
                markup: `<span class="icon-stack icon">${background}${foreground}</span>`
            };
        };

        // Parse navigation icons for potential stacks
        let leftIconResult = { valid: true, markup: navigationIconLeft };
        let rightIconResult = { valid: true, markup: navigationIconRight };

        if (navigationIconLeftBackground || navigationIconRightBackground) {
            leftIconResult = processIconStack(navigationIconLeft, navigationIconLeftBackground, 'left');
            rightIconResult = processIconStack(navigationIconRight, navigationIconRightBackground, 'right');
        } else {
            // Check if main icon attributes contain stacked icons
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

        // Check for required attributes for pagination
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
            paginationIconSizeInactive
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
            this.#attrs = attrs;
            const sliderElement = await this.render(attrs);
            if (sliderElement) {
                this.#log('Render successful, replacing element', { elementId: this.#uniqueId });
                this.replaceWith(sliderElement);
                this.#setupSlider();
                this.#log('Initialization completed successfully', { elementId: this.#uniqueId });
            } else {
                this.#error('Render returned null, using fallback', { elementId: this.#uniqueId });
                const fallbackElement = await this.render({ autoplayDelay: 3000, slidesPerView: 1, navigation: false, gap: '0', pagination: false, paginationIconActive: '<i class="fa-solid fa-circle"></i>', paginationIconInactive: '<i class="fa-regular fa-circle"></i>', iconSizeBackground: '', iconSizeForeground: '', paginationIconSizeActive: '', paginationIconSizeInactive: '' });
                this.replaceWith(fallbackElement);
            }
        } catch (error) {
            this.#error('Initialization failed', {
                error: error.message,
                stack: error.stack,
                elementId: this.#uniqueId
            });
            const fallbackElement = await this.render({ autoplayDelay: 3000, slidesPerView: 1, navigation: false, gap: '0', pagination: false, paginationIconActive: '<i class="fa-solid fa-circle"></i>', paginationIconInactive: '<i class="fa-regular fa-circle"></i>', iconSizeBackground: '', iconSizeForeground: '', paginationIconSizeActive: '', paginationIconSizeInactive: '' });
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

        // Calculate slideWidth and gapPx from actual DOM
        this.#recalculateDimensions();

        const wrapper = sliderContainer.querySelector('.slider-wrapper');
        wrapper.style.willChange = 'transform';
        wrapper.style.userSelect = 'none';
        wrapper.style.touchAction = 'pan-y';

        if (this.hasAttribute('draggable')) {
            // Add dragging events
            wrapper.addEventListener('pointerdown', this.#pointerDown.bind(this));
            wrapper.addEventListener('pointerup', this.#pointerUp.bind(this));
            wrapper.addEventListener('pointercancel', this.#pointerUp.bind(this));
            wrapper.addEventListener('pointerleave', this.#pointerUp.bind(this));
            wrapper.addEventListener('pointermove', this.#pointerMove.bind(this));

            // Prevent context menu on long touch
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
                this.#log('Navigation buttons initialized', { elementId: this.#uniqueId });
            }
        }

        if (this.#attrs.autoplayDelay) {
            this.#startAutoplay(this.#attrs.autoplayDelay);
        }

        // Initial update
        this.#updateSlider();

        // Handle resize
        window.addEventListener('resize', this.#handleResize.bind(this));
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
        if (event.pointerType === 'touch' || event.pointerType === 'mouse') {
            this.#isDragging = true;
            this.#startPos = event.clientX;
            this.#animationID = requestAnimationFrame(this.#animation.bind(this));
            const wrapper = document.getElementById(this.#uniqueId).querySelector('.slider-wrapper');
            wrapper.style.transition = 'none';
            event.target.setPointerCapture(event.pointerId);
            this.#log(`[Drag Start] currentIndex=${this.#currentIndex}`, { elementId: this.#uniqueId, startPos: this.#startPos });
        }
    }

    #pointerMove(event) {
        if (this.#isDragging) {
            const currentPosition = event.clientX;
            this.#currentTranslate = this.#prevTranslate + currentPosition - this.#startPos;
            // Clamp to bounds
            const maxIndex = this.#slides.length - this.#attrs.slidesPerView;
            const minTranslate = this.#calculateTranslateForIndex(maxIndex);
            const maxTranslate = this.#calculateTranslateForIndex(0);
            this.#currentTranslate = Math.min(Math.max(this.#currentTranslate, minTranslate), maxTranslate);
            this.#log(`[Drag Move] currentIndex=${this.#currentIndex}, translate=${this.#currentTranslate}px`, { elementId: this.#uniqueId, currentPos: currentPosition });
        }
    }

    #pointerUp(event) {
        cancelAnimationFrame(this.#animationID);
        this.#isDragging = false;
        const movedBy = this.#currentTranslate - this.#prevTranslate;
        const threshold = this.#slideWidth / 3; // Adjust as needed
        const maxIndex = this.#slides.length - this.#attrs.slidesPerView;
        const oldIndex = this.#currentIndex;

        if (movedBy < -threshold && this.#currentIndex < maxIndex) {
            this.#currentIndex += 1;
        } else if (movedBy > threshold && this.#currentIndex > 0) {
            this.#currentIndex -= 1;
        }

        this.#setPositionByIndex();
        const wrapper = document.getElementById(this.#uniqueId).querySelector('.slider-wrapper');
        wrapper.style.transition = 'transform 0.5s ease-out';
        event.target.releasePointerCapture(event.pointerId);
        this.#updateSlider();
        this.#log(`[Drag End] currentIndex=${this.#currentIndex}, oldIndex=${oldIndex}, movedBy=${movedBy}px`, { elementId: this.#uniqueId, expectedActiveDot: this.#currentIndex + 1 });
    }

    #animation() {
        this.#setSliderPosition();
        if (this.#isDragging) requestAnimationFrame(this.#animation.bind(this));
    }

    #setSliderPosition() {
        const wrapper = document.getElementById(this.#uniqueId).querySelector('.slider-wrapper');
        wrapper.style.transform = `translate3d(${this.#currentTranslate}px, 0, 0)`;
    }

    #setPositionByIndex() {
        this.#currentTranslate = this.#calculateTranslate();
        this.#prevTranslate = this.#currentTranslate;
        this.#setSliderPosition();
    }

    #calculateTranslate() {
        const addition = (this.#attrs.slidesPerView - 1) / 2;
        return - this.#currentIndex * this.#slideWidth - (this.#currentIndex + addition) * this.#gapPx;
    }

    #calculateTranslateForIndex(index) {
        const addition = (this.#attrs.slidesPerView - 1) / 2;
        return - index * this.#slideWidth - (index + addition) * this.#gapPx;
    }

    #handleResize() {
        this.#recalculateDimensions();
        this.#setPositionByIndex();
    }

    #navigate(direction) {
        const totalSlides = this.#slides.length;
        const slidesPerView = this.#attrs.slidesPerView;
        const oldIndex = this.#currentIndex;
        this.#lastDirection = direction; // Update the last navigation direction
        this.#currentIndex += direction;

        // Boundary check with reset
        const maxIndex = totalSlides - slidesPerView;
        if (this.#currentIndex > maxIndex) {
            this.#currentIndex = 0; // Reset to start on "next" overflow
        } else if (this.#currentIndex < 0) {
            this.#currentIndex = maxIndex; // Reset to end on "previous" overflow
        }

        this.#updateSlider();
        this.#log(`[Navigation] currentIndex=${this.#currentIndex}, direction=${direction}, oldIndex=${oldIndex}`, { elementId: this.#uniqueId, expectedActiveDot: this.#currentIndex + 1 });
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
        const sliderContainer = document.getElementById(this.#uniqueId);
        if (!sliderContainer) return;

        const wrapper = sliderContainer.querySelector('.slider-wrapper');
        wrapper.style.transform = `translate3d(${this.#calculateTranslate()}px, 0, 0)`;

        // Update pagination if enabled
        if (this.#attrs.pagination) {
            const pagination = sliderContainer.querySelector('.slider-pagination');
            if (pagination) {
                const dots = pagination.querySelectorAll('.icon');
                const totalDots = dots.length;
                const expectedActiveDot = this.#currentIndex + 1; // 1-based for logging
                dots.forEach((dot, index) => {
                    const isActive = index === this.#currentIndex;
                    dot.innerHTML = isActive ? this.#attrs.paginationIconActive : this.#attrs.paginationIconInactive;
                    // Apply font-size to pagination icons
                    const icon = dot.querySelector('i');
                    if (icon) {
                        icon.style.fontSize = isActive ? this.#attrs.paginationIconSizeActive : this.#attrs.paginationIconSizeInactive;
                    }
                });
                this.#log(`[Pagination Updated] currentIndex=${this.#currentIndex}, totalDots=${totalDots}, expectedActiveDot=${expectedActiveDot}`, { elementId: this.#uniqueId, totalSlides: this.#slides.length });
            }
        }

        this.#log(`[Slider Updated] currentIndex=${this.#currentIndex}`, { elementId: this.#uniqueId });
    }

    async render(attrs) {
        this.#log('Starting render', { elementId: this.#uniqueId, attrs });

        const fragment = document.createDocumentFragment();
        const sliderWrapper = document.createElement('div');
        sliderWrapper.id = this.#uniqueId;
        sliderWrapper.className = 'custom-slider';
        sliderWrapper.style.overflow = 'hidden';
        sliderWrapper.style.position = 'relative';
        sliderWrapper.style.userSelect = 'none';
        sliderWrapper.style.touchAction = 'pan-y';

        const innerWrapper = document.createElement('div');
        innerWrapper.className = 'slider-wrapper';
        innerWrapper.style.display = 'grid';
        innerWrapper.style.gridTemplateRows = '1fr';
        innerWrapper.style.gridAutoFlow = 'column';
        innerWrapper.style.gridTemplateColumns = `repeat(${this.#childElements.length}, calc(100% / ${attrs.slidesPerView}))`;
        innerWrapper.style.transition = 'transform 0.5s';
        innerWrapper.style.height = '100%';
        innerWrapper.style.alignContent = 'center';
        innerWrapper.style.willChange = 'transform';
        if (attrs.gap && attrs.gap !== '0') {
            innerWrapper.style.columnGap = attrs.gap;
        }
        this.#log('Applied styles to slider-wrapper', { gap: attrs.gap, gridTemplateColumns: innerWrapper.style.gridTemplateColumns });

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

            const navNext = document.createElement('div');
            navNext.id = `${this.#uniqueId}-next`;
            navNext.className = 'slider-nav-next';
            navNext.innerHTML = attrs.navigationIconRight;

            // Add 'icon' class and apply font-size styles to navigation icons
            [navPrev, navNext].forEach((nav, index) => {
                const icons = nav.querySelectorAll('i');
                const isStacked = icons.length === 2;
                icons.forEach((icon, iconIndex) => {
                    if (!icon.classList.contains('icon')) {
                        icon.classList.add('icon');
                    }
                    // Apply font-size based on stacking and navigation-icon-size
                    if (attrs.iconSizeBackground && attrs.iconSizeForeground) {
                        if (isStacked) {
                            icon.style.fontSize = iconIndex === 0 ? attrs.iconSizeBackground : attrs.iconSizeForeground;
                        } else {
                            icon.style.fontSize = attrs.iconSizeBackground; // Use first size for single icon
                        }
                    } else if (attrs.iconSizeBackground) {
                        icon.style.fontSize = attrs.iconSizeBackground; // Single size for all
                    }
                });
            });

            sliderWrapper.appendChild(navPrev);
            sliderWrapper.appendChild(navNext);
            this.#log('Navigation buttons added', { elementId: this.#uniqueId });
        }

        // Add pagination if enabled
        if (attrs.pagination) {
            const pagination = document.createElement('div');
            pagination.className = 'slider-pagination';

            const totalSlides = this.#childElements.length;
            const totalDots = Math.max(1, totalSlides - attrs.slidesPerView + 1);
            for (let i = 0; i < totalDots; i++) {
                const dot = document.createElement('span');
                dot.className = 'icon';
                dot.innerHTML = i === 0 ? attrs.paginationIconActive : attrs.paginationIconInactive;
                // Apply font-size to pagination icon
                const icon = dot.querySelector('i');
                if (icon && (attrs.paginationIconSizeActive || attrs.paginationIconSizeInactive)) {
                    icon.style.fontSize = i === 0 ? attrs.paginationIconSizeActive : attrs.paginationIconSizeInactive;
                }
                dot.addEventListener('click', () => {
                    const oldIndex = this.#currentIndex;
                    this.#currentIndex = i;
                    this.#updateSlider();
                    this.#log(`[Pagination Click] currentIndex=${this.#currentIndex}, oldIndex=${oldIndex}, clickedDot=${i + 1}`, { elementId: this.#uniqueId, expectedActiveDot: this.#currentIndex + 1 });
                });
                pagination.appendChild(dot);
            }
            sliderWrapper.appendChild(pagination);
            this.#log(`[Pagination Added] totalDots=${totalDots}`, { elementId: this.#uniqueId, totalSlides });
        }

        fragment.appendChild(sliderWrapper);
        return sliderWrapper;
    }

    async connectedCallback() {
        this.#log('Connected to DOM', { elementId: this.#uniqueId });
        // Capture child elements here to ensure they're available before initialization
        this.#childElements = Array.from(this.children).filter(child => child.tagName.toLowerCase() === 'custom-block' || child.classList.contains('block')).map(child => child.cloneNode(true));
        this.#log('Captured children in connectedCallback', { count: this.#childElements.length, elementId: this.#uniqueId });
        if (this.isVisible) {
            await this.initialize();
        }
    }

    disconnectedCallback() {
        this.#log('Disconnected from DOM', { elementId: this.#uniqueId });
        this.#stopAutoplay();
        if (this.#animationID) {
            cancelAnimationFrame(this.#animationID);
            this.#animationID = null;
        }
        window.removeEventListener('resize', this.#handleResize.bind(this));
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
            'pagination-icon-active', 'pagination-icon-inactive', 'navigation-icon-size', 'pagination-icon-size', 'draggable'
        ];
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
            this.#childElements = Array.from(this.children).filter(child => child.tagName.toLowerCase() === 'custom-block' || child.classList.contains('block')).map(child => child.cloneNode(true));
            this.initialize();
        }
    }
}

try {
    customElements.define('custom-slider', CustomSlider);
} catch (error) {
    console.error('Error defining CustomSlider element:', error);
}

console.log('CustomSlider version: 2025-10-27');
export { CustomSlider };
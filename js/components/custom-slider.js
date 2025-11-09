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
                if ( Wii(parts.length === 2)) {
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

        // ——— ROBUST validateIcon – accepts ANY Font Awesome style/class ———
        const validateIcon = (icon, position, isBackground = false) => {
            if (!icon) {
                this.#warn(`No ${position} icon provided`, { elementId: this.#uniqueId });
                return isBackground ? '' : '<i class="fa-solid fa-circle"></i>';
            }
            const parser = new DOMParser();
            const decodedIcon = icon
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"');
            const doc = parser.parseFromString(decodedIcon, 'text/html');
            const iElement = doc.body.querySelector('i');
            const rawClasses = iElement
                ? iElement.className.split(/\s+/)
                : decodedIcon.split(/\s+/);
            const validClasses = rawClasses.filter(cls =>
                /^fa-/.test(cls) || cls === 'fa-chisel'
            );
            if (validClasses.length === 0) {
                this.#warn(`No valid Font Awesome classes in ${position} icon`, {
                    rawClasses,
                    elementId: this.#uniqueId
                });
                return isBackground ? '' : '<i class="fa-solid fa-circle"></i>';
            }
            validClasses.push('icon');
            const result = `<i class="${validClasses.join(' ')}"></i>`;
            this.#log(`Validated ${position} icon`, { result, elementId: this.#uniqueId });
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

        // ——— NAVIGATION WITH DYNAMIC SIZING ———
        if (attrs.navigation && attrs.navigationIconLeft && attrs.navigationIconRight) {
            const navPrev = document.createElement('div');
            navPrev.id = `${this.#uniqueId}-prev`;
            navPrev.className = 'slider-nav-prev';
            navPrev.innerHTML = attrs.navigationIconLeft;

            const navNext = document.createElement('div');
            navNext.id = `${this.#uniqueId}-next`;
            navNext.className = 'slider-nav-next';
            navNext.innerHTML = attrs.navigationIconRight;

            // ——— DYNAMIC NAVIGATION ICON SIZING (USE width/height) ———
            if (attrs.iconSizeBackground && attrs.iconSizeForeground) {
                const bgSize = attrs.iconSizeBackground;
                const fgSize = attrs.iconSizeForeground;

                navPrev.style.width = bgSize;
                navPrev.style.height = bgSize;
                navNext.style.width = bgSize;
                navNext.style.height = bgSize;

                const applySizes = (container) => {
                    const check = () => {
                        const svgs = container.querySelectorAll('svg');
                        if (svgs.length === 2) {
                            svgs[0].style.width = bgSize;
                            svgs[0].style.height = bgSize;
                            svgs[1].style.width = fgSize;
                            svgs[1].style.height = fgSize;
                        } else {
                            setTimeout(check, 10);
                        }
                    };
                    check();
                };

                applySizes(navPrev);
                applySizes(navNext);
            } else if (attrs.iconSizeBackground) {
                navPrev.style.width = attrs.iconSizeBackground;
                navPrev.style.height = attrs.iconSizeBackground;
                navNext.style.width = attrs.iconSizeBackground;
                navNext.style.height = attrs.iconSizeBackground;
            }

            sliderWrapper.appendChild(navPrev);
            sliderWrapper.appendChild(navNext);
        }

        // ——— PAGINATION WITH DYNAMIC SIZING ———
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

                // ——— DYNAMIC PAGINATION ICON SIZE ———
                if (attrs.paginationIconSizeActive) {
                    const applySize = () => {
                        const svg = dot.querySelector('svg');
                        if (svg) {
                            const size = i === 0
                                ? attrs.paginationIconSizeActive
                                : (attrs.paginationIconSizeInactive || attrs.paginationIconSizeActive);
                            svg.style.width = size;
                            svg.style.height = size;
                        } else {
                            setTimeout(applySize, 10);
                        }
                    };
                    applySize();
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
    }  // ← THIS WAS MISSING

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
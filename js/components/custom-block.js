/* global HTMLElement, document, window, JSON, console */
import { generatePictureMarkup } from '../generators/image-generator.js';
import { generateVideoMarkup } from '../generators/video-generator.js';
import { VALID_ALIGNMENTS, VALID_ALIGN_MAP, BACKDROP_FILTER_MAP } from '../shared.js';
import { getConfig, getImagePrimaryPath } from '../config.js';

class CustomBlock extends HTMLElement {
    #ignoredChangeCount;
    #basePath = null;

    constructor() {
        super();
        this.isVisible = true; // Always consider visible for immediate init
        this.isInitialized = false;
        this.callbacks = [];
        this.renderCache = null;
        this.lastAttributes = null;
        this.cachedAttributes = null;
        this.criticalAttributesHash = null;
        this.debug = new URLSearchParams(window.location.search).get('debug') === 'true';
        this.#ignoredChangeCount = 0;
    }

    static #renderCacheMap = new WeakMap();

    static #criticalAttributes = [
        'backdrop-filter', 'background-color', 'background-gradient', 'background-image-noise',
        'background-overlay', 'border', 'border-radius', 'button-aria-label', 'button-class',
        'button-href', 'button-icon', 'button-icon-offset', 'button-icon-position', 'button-icon-size',
        'button-rel', 'button-style', 'button-target', 'button-text', 'button-type', 'class', 'effects',
        'heading', 'heading-tag', 'icon', 'icon-class', 'icon-size', 'icon-style',
        'img-background-alt', 'img-background-aspect-ratio', 'img-background-desktop-width',
        'img-background-light-src', 'img-background-mobile-width', 'img-background-position',
        'img-background-src', 'img-background-tablet-width', 'inner-alignment', 'inner-backdrop-filter',
        'inner-background-color', 'inner-background-gradient', 'inner-background-image-noise',
        'inner-background-overlay', 'inner-border', 'inner-border-radius', 'inner-class',
        'inner-shadow', 'inner-style', 'section-title', 'style', 'sub-heading', 'sub-heading-tag',
        'text', 'text-alignment', 'video-background-alt', 'video-background-autoplay',
        'video-background-dark-poster', 'video-background-dark-src', 'video-background-disable-pip',
        'video-background-light-poster', 'video-background-light-src', 'video-background-loading',
        'video-background-loop', 'video-background-muted', 'video-background-playsinline',
        'video-background-poster', 'video-background-src', 'video-primary-alt',
        'video-primary-autoplay', 'video-primary-dark-poster', 'video-primary-dark-src',
        'video-primary-disable-pip', 'video-primary-light-poster', 'video-primary-light-src',
        'video-primary-loading', 'video-primary-loop', 'video-primary-muted',
        'video-primary-playsinline', 'video-primary-poster', 'video-primary-src'
    ];

    #log(message, data = null) {
        if (this.debug) {
            console.groupCollapsed(`%c[CustomBlock] ${message}`, 'color: #2196F3; font-weight: bold;');
            if (data) console.log('%cData:', 'color: #4CAF50;', data);
            console.trace();
            console.groupEnd();
        }
    }

    #warn(message, data = null) {
        if (this.debug) {
            console.groupCollapsed(`%c[CustomBlock] ⚠️ ${message}`, 'color: #FF9800; font-weight: bold;');
            if (data) console.log('%cData:', 'color: #4CAF50;', data);
            console.trace();
            console.groupEnd();
        }
    }

    #error(message, data = null) {
        if (this.debug) {
            console.groupCollapsed(`%c[CustomBlock] ❌ ${message}`, 'color: #F44336; font-weight: bold;');
            if (data) console.log('%cData:', 'color: #4CAF50;', data);
            console.trace();
            console.groupEnd();
        }
    }

    async #getBasePath() {
        if (!this.#basePath) {
            const config = await getConfig();
            this.#basePath = config.general?.basePath || '/';
            this.#log('Base path fetched', { basePath: this.#basePath });
        }
        return this.#basePath;
    }

    async validateSrc(url) {
        if (!url || this.debug) {
            this.#log('Skipping validation', { url, reason: this.debug ? 'Debug mode' : 'Empty URL' });
            return true;
        }
        try {
            const basePath = await this.#getBasePath();
            const fullSrc = url.startsWith('http') ? url : new URL(url.startsWith('/') ? url : basePath + url, window.location.origin).href;
            this.#log(`Validating source URL: ${fullSrc}`, { originalUrl: url, elementId: this.id || 'no-id' });
            const res = await fetch(fullSrc, { method: 'HEAD', mode: 'cors' });
            if (!res.ok) throw new Error(`Failed to validate ${url}: ${res.status} ${res.statusText}`);
            this.#log(`Source validation successful: ${fullSrc}`, { status: res.status });
            return true;
        } catch (error) {
            this.#warn(`Source validation failed: ${error.message}`, { url, elementId: this.id || 'no-id' });
            return false;
        }
    }

    async getAttributes() {
        if (this.cachedAttributes) {
            this.#log('Using cached attributes', { elementId: this.id || 'no-id' });
            return this.cachedAttributes;
        }
        this.#log('Parsing new attributes', { elementId: this.id || 'no-id', outerHTML: this.outerHTML.substring(0, 200) + '...' });
        const basePath = await this.#getBasePath();
        const primaryPath = await getImagePrimaryPath();
        const resolveImageSrc = (attrName) => {
            const path = this.getAttribute(attrName) || '';
            if (!path) return '';
            if (path.startsWith('http')) return path;
            return primaryPath + (path.startsWith('/') ? path.slice(1) : path);
        };
        const backgroundFetchPriority = this.getAttribute('img-background-fetchpriority') || '';
        const primaryFetchPriority = this.getAttribute('img-primary-fetchpriority') || '';
        const validFetchPriorities = ['high', 'low', 'auto', ''];
        if (!validFetchPriorities.includes(backgroundFetchPriority)) {
            this.#warn('Invalid background fetch priority', { value: backgroundFetchPriority, element: this.id || 'no-id', validValues: validFetchPriorities });
        }
        if (!validFetchPriorities.includes(primaryFetchPriority)) {
            this.#warn('Invalid primary fetch priority', { value: primaryFetchPriority, element: this.id || 'no-id', validValues: validFetchPriorities });
        }
        let primaryPosition = this.getAttribute('img-primary-position') || 'top';
        if (primaryPosition === 'above') primaryPosition = 'top';
        if (primaryPosition === 'below') primaryPosition = 'bottom';
        const validPositions = ['none', 'top', 'bottom', 'left', 'right'];
        if (!validPositions.includes(primaryPosition)) {
            this.#warn('Invalid primary position', { value: primaryPosition, element: this.id || 'no-id', default: 'top', validValues: validPositions });
            primaryPosition = 'top';
        }
        const backgroundOverlay = this.getAttribute('background-overlay') || '';
        let backgroundOverlayClass = '';
        if (backgroundOverlay) {
            const match = backgroundOverlay.match(/^background-overlay-(\d+)$/);
            if (match) backgroundOverlayClass = `background-overlay-${match[1]}`;
            else this.#warn('Invalid background overlay', { value: backgroundOverlay, element: this.id || 'no-id', expected: 'background-overlay-N (N = number)' });
        }
        const innerBackgroundOverlay = this.getAttribute('inner-background-overlay') || '';
        let innerBackgroundOverlayClass = '';
        if (innerBackgroundOverlay) {
            const match = innerBackgroundOverlay.match(/^background-overlay-(\d+)$/);
            if (match) innerBackgroundOverlayClass = `background-overlay-${match[1]}`;
            else this.#warn('Invalid inner background overlay', { value: innerBackgroundOverlay, element: this.id || 'no-id', expected: 'background-overlay-N (N = number)' });
        }
        const backgroundGradient = this.getAttribute('background-gradient') || '';
        let backgroundGradientClass = '';
        if (backgroundGradient) {
            const match = backgroundGradient.match(/^background-gradient-(\d+)$/);
            if (match) backgroundGradientClass = `background-gradient-${match[1]}`;
            else this.#warn('Invalid background gradient', { value: backgroundGradient, element: this.id || 'no-id', expected: 'background-gradient-N (N = number)' });
        }
        const innerBackgroundGradient = this.getAttribute('inner-background-gradient') || '';
        let innerBackgroundGradientClass = '';
        if (innerBackgroundGradient) {
            const match = innerBackgroundGradient.match(/^background-gradient-(\d+)$/);
            if (match) innerBackgroundGradientClass = `background-gradient-${match[1]}`;
            else this.#warn('Invalid inner background gradient', { value: innerBackgroundGradient, element: this.id || 'no-id', expected: 'background-gradient-N (N = number)' });
        }
        const backdropFilterClasses = this.getAttribute('backdrop-filter')?.split(' ').filter(cls => cls) || [];
        const innerBackdropFilterClasses = this.getAttribute('inner-backdrop-filter')?.split(' ').filter(cls => cls) || [];
        const headingTag = this.getAttribute('heading-tag') || 'h2';
        const subHeadingTag = this.getAttribute('sub-heading-tag') || 'h3';
        const validHeadingTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
        if (!validHeadingTags.includes(headingTag.toLowerCase())) {
            this.#warn('Invalid heading tag', { value: headingTag, element: this.id || 'no-id', default: 'h2', validValues: validHeadingTags });
        }
        if (!validHeadingTags.includes(subHeadingTag.toLowerCase())) {
            this.#warn('Invalid sub-heading tag', { value: subHeadingTag, element: this.id || 'no-id', default: 'h3', validValues: validHeadingTags });
        }
        const innerAlignment = this.getAttribute('inner-alignment') || '';
        if (innerAlignment && !VALID_ALIGNMENTS.includes(innerAlignment)) {
            this.#warn('Invalid inner alignment', { value: innerAlignment, element: this.id || 'no-id', validValues: VALID_ALIGNMENTS });
        }
        const textAlignment = this.getAttribute('text-alignment') || '';
        const validTextAlignments = ['left', 'center', 'right'];
        if (textAlignment && !validTextAlignments.includes(textAlignment)) {
            this.#warn('Invalid text alignment', { value: textAlignment, element: this.id || 'no-id', validValues: validTextAlignments });
        }
        const innerBackgroundColor = this.getAttribute('inner-background-color') || '';
        let innerBackgroundColorClass = '';
        if (innerBackgroundColor) {
            const match = innerBackgroundColor.match(/^background-color-(\d+)$/);
            if (match) innerBackgroundColorClass = `background-color-${match[1]}`;
            else this.#warn('Invalid inner background color', { value: innerBackgroundColor, element: this.id || 'no-id', expected: 'background-color-N (N = number)' });
        }
        const shadow = this.getAttribute('shadow') || '';
        let shadowClass = '';
        const validShadowClasses = ['shadow-light', 'shadow-medium', 'shadow-heavy'];
        if (shadow && validShadowClasses.includes(shadow)) {
            shadowClass = shadow;
        } else if (shadow) {
            this.#warn('Invalid shadow class', { value: shadow, element: this.id || 'no-id', validValues: validShadowClasses });
        }
        const innerShadow = this.getAttribute('inner-shadow') || '';
        let innerShadowClass = '';
        if (innerShadow && validShadowClasses.includes(innerShadow)) {
            innerShadowClass = innerShadow;
        } else if (innerShadow) {
            this.#warn('Invalid inner shadow class', { value: innerShadow, element: this.id || 'no-id', validValues: validShadowClasses });
        }
        const resolvePath = (path) => path ? (path.startsWith('http') ? path : basePath + (path.startsWith('/') ? path.slice(1) : path)) : '';
        const backgroundSrc = resolveImageSrc('img-background-src');
        const backgroundLightSrc = resolveImageSrc('img-background-light-src');
        const backgroundDarkSrc = resolveImageSrc('img-background-dark-src');
        const backgroundAlt = this.getAttribute('img-background-alt') || '';
        if ((backgroundLightSrc || backgroundDarkSrc) && !(backgroundLightSrc && backgroundDarkSrc) && !backgroundSrc) {
            this.#error('Invalid background source configuration', {
                backgroundSrc, backgroundLightSrc, backgroundDarkSrc,
                element: this.id || 'no-id',
                message: 'Both img-background-light-src and img-background-dark-src must be present or use img-background-src alone.'
            });
            throw new Error('Both img-background-light-src and img-background-dark-src must be present or use img-background-src alone.');
        }
        const primarySrc = resolveImageSrc('img-primary-src');
        const primaryLightSrc = resolveImageSrc('img-primary-light-src');
        const primaryDarkSrc = resolveImageSrc('img-primary-dark-src');
        if ((primaryLightSrc || primaryDarkSrc) && !(primaryLightSrc && primaryDarkSrc) && !primarySrc) {
            this.#error('Invalid primary image source configuration', {
                primarySrc, primaryLightSrc, primaryDarkSrc,
                element: this.id || 'no-id',
                message: 'Both img-primary-light-src and img-primary-dark-src must be present or use img-primary-src alone.'
            });
            throw new Error('Both img-primary-light-src and img-primary-dark-src must be present or use img-primary-src alone.');
        }
        const videoBackgroundSrc = resolvePath(this.getAttribute('video-background-src') || '');
        const videoBackgroundLightSrc = resolvePath(this.getAttribute('video-background-light-src') || '');
        const videoBackgroundDarkSrc = resolvePath(this.getAttribute('video-background-dark-src') || '');
        if ((videoBackgroundLightSrc || videoBackgroundDarkSrc) && !(videoBackgroundLightSrc && videoBackgroundDarkSrc) && !videoBackgroundSrc) {
            this.#error('Invalid video background source configuration', {
                videoBackgroundSrc, videoBackgroundLightSrc, videoBackgroundDarkSrc,
                element: this.id || 'no-id',
                message: 'Both video-background-light-src and video-background-dark-src must be present or use video-background-src alone.'
            });
            throw new Error('Both video-background-light-src and video-background-dark-src must be present or use video-background-src alone.');
        }
        const videoPrimarySrc = resolvePath(this.getAttribute('video-primary-src') || '');
        const videoPrimaryLightSrc = resolvePath(this.getAttribute('video-primary-light-src') || '');
        const videoPrimaryDarkSrc = resolvePath(this.getAttribute('video-primary-dark-src') || '');
        if ((videoPrimaryLightSrc || videoPrimaryDarkSrc) && !(videoPrimaryLightSrc && videoPrimaryDarkSrc) && !videoPrimarySrc) {
            this.#error('Invalid video primary source configuration', {
                videoPrimarySrc, videoPrimaryLightSrc, videoPrimaryDarkSrc,
                element: this.id || 'no-id',
                message: 'Both video-primary-light-src and video-primary-dark-src must be present or use video-primary-src alone.'
            });
            throw new Error('Both video-primary-light-src and video-primary-dark-src must be present or use video-primary-src alone.');
        }
        const backgroundPosition = this.getAttribute('img-background-position') || '';
        let sanitizedBackgroundPosition = '';
        if (backgroundPosition) {
            const validPositions = [
                'top-left', 'top-center', 'top-right',
                'bottom-left', 'bottom-center', 'bottom-right',
                'center', 'center-left', 'center-right',
                'left-top', 'left-center', 'left-bottom',
                'right-top', 'right-center', 'right-bottom'
            ];
            const isValidCoordinate = backgroundPosition.match(/^(\d+%|\d+px|\d+rem)\s(\d+%|\d+px|\d+rem)$/);
            const isValidNamedPosition = validPositions.includes(backgroundPosition.replace(/\s/g, '-').toLowerCase());
            if (isValidNamedPosition || isValidCoordinate) {
                sanitizedBackgroundPosition = backgroundPosition;
            } else {
                this.#warn('Invalid background position', {
                    value: backgroundPosition,
                    element: this.id || 'no-id',
                    validValues: validPositions,
                    coordinateFormat: 'Xpx Ypx, X% Y%, or Xrem Yrem'
                });
            }
        }
        let icon = this.getAttribute('icon') || '';
        if (icon) {
            icon = icon.replace(/['"]/g, '&quot;');
            const parser = new DOMParser();
            const decodedIcon = icon.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
            const doc = parser.parseFromString(decodedIcon, 'text/html');
            const iElement = doc.body.querySelector('i');
            if (!iElement || !iElement.className.includes('fa-')) {
                this.#warn('Invalid icon format', {
                    value: icon,
                    element: this.id || 'no-id',
                    expected: 'Font Awesome <i> tag with fa- classes'
                });
                icon = '';
            } else {
                const validClasses = iElement.className.split(' ').filter(cls => cls.startsWith('fa-') || cls === 'fa-chisel');
                if (validClasses.length === 0) {
                    this.#warn('No valid Font Awesome classes in icon', {
                        classes: iElement.className,
                        element: this.id || 'no-id'
                    });
                    icon = '';
                } else {
                    icon = `<i class="${validClasses.join(' ')}"></i>`;
                }
            }
        }
        const iconStyle = this.getAttribute('icon-style') || '';
        let sanitizedIconStyle = '';
        if (iconStyle) {
            const allowedStyles = [
                'color', 'font-size', 'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
                'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
                'display', 'text-align', 'vertical-align', 'line-height', 'width', 'height'
            ];
            const styleParts = iconStyle.split(';').map(s => s.trim()).filter(s => s);
            sanitizedIconStyle = styleParts.filter(part => {
                const [property] = part.split(':').map(s => s.trim());
                return allowedStyles.includes(property);
            }).join('; ');
            if (sanitizedIconStyle !== iconStyle) {
                this.#warn('Unsafe CSS in icon-style sanitized', {
                    original: iconStyle,
                    sanitized: sanitizedIconStyle,
                    element: this.id || 'no-id'
                });
            }
        }
        const iconClass = this.getAttribute('icon-class') || '';
        let sanitizedIconClass = '';
        if (iconClass) {
            sanitizedIconClass = iconClass.split(/\s+/).filter(cls => /^[a-zA-Z0-9\-_]+$/.test(cls)).join(' ');
            if (sanitizedIconClass !== iconClass) {
                this.#warn('Invalid characters in icon-class', {
                    original: iconClass,
                    sanitized: sanitizedIconClass,
                    element: this.id || 'no-id'
                });
            }
        }
        const iconSize = this.getAttribute('icon-size') || '';
        let sanitizedIconSize = '';
        if (iconSize) {
            const remMatch = iconSize.match(/^(\d*\.?\d+)rem$/);
            if (remMatch) sanitizedIconSize = iconSize;
            else this.#warn('Invalid icon size', { value: iconSize, element: this.id || 'no-id', expected: 'Nrem format' });
        }
        const buttonClass = this.getAttribute('button-class') || '';
        let sanitizedButtonClass = '';
        if (buttonClass) {
            sanitizedButtonClass = buttonClass.split(/\s+/).filter(cls => /^[a-zA-Z0-9\-_]+$/.test(cls)).join(' ');
            if (sanitizedButtonClass !== buttonClass) {
                this.#warn('Invalid characters in button-class', {
                    original: buttonClass,
                    sanitized: sanitizedButtonClass,
                    element: this.id || 'no-id'
                });
            }
        }
        const buttonStyle = this.getAttribute('button-style') || '';
        let sanitizedButtonStyle = '';
        if (buttonStyle) {
            const allowedStyles = ['color', 'background-color', 'border', 'border-radius', 'padding', 'margin', 'font-size', 'font-weight', 'text-align', 'display', 'width', 'height'];
            const styleParts = buttonStyle.split(';').map(s => s.trim()).filter(s => s);
            sanitizedButtonStyle = styleParts.filter(part => {
                const [property] = part.split(':').map(s => s.trim());
                return allowedStyles.includes(property);
            }).join('; ');
            if (sanitizedButtonStyle !== buttonStyle) {
                this.#warn('Unsafe CSS in button-style sanitized', {
                    original: buttonStyle,
                    sanitized: sanitizedButtonStyle,
                    element: this.id || 'no-id'
                });
            }
        }
        const buttonRel = this.getAttribute('button-rel') || '';
        let sanitizedButtonRel = '';
        if (buttonRel) {
            const validRels = ['alternate', 'author', 'bookmark', 'external', 'help', 'license', 'next', 'nofollow', 'noopener', 'noreferrer', 'prev', 'search', 'tag'];
            sanitizedButtonRel = buttonRel.split(/\s+/).filter(rel => validRels.includes(rel)).join(' ');
            if (sanitizedButtonRel !== buttonRel) {
                this.#warn('Invalid button-rel values', {
                    original: buttonRel,
                    sanitized: sanitizedButtonRel,
                    validValues: validRels,
                    element: this.id || 'no-id'
                });
            }
        }
        const buttonType = this.getAttribute('button-type') || '';
        const buttonHref = this.getAttribute('button-href') || '';
        const validButtonTypes = ['button', 'submit', 'reset'];
        let sanitizedButtonType = buttonHref && !buttonType ? 'link' : 'button';
        if (buttonType && validButtonTypes.includes(buttonType)) {
            sanitizedButtonType = buttonType;
        } else if (buttonType) {
            this.#warn('Invalid button type', {
                value: buttonType,
                element: this.id || 'no-id',
                default: buttonHref ? "'link'" : "'button'",
                validValues: validButtonTypes
            });
        }
        let buttonIcon = this.getAttribute('button-icon') || '';
        if (buttonIcon) {
            buttonIcon = buttonIcon.replace(/['"]/g, '&quot;');
            const parser = new DOMParser();
            const decodedIcon = buttonIcon.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
            const doc = parser.parseFromString(decodedIcon, 'text/html');
            const iElement = doc.body.querySelector('i');
            if (!iElement || !iElement.className.includes('fa-')) {
                this.#warn('Invalid button icon format', {
                    value: buttonIcon,
                    element: this.id || 'no-id',
                    expected: 'Font Awesome <i> tag with fa- classes'
                });
                buttonIcon = '';
            } else {
                const validClasses = iElement.className.split(' ').filter(cls => cls.startsWith('fa-') || cls === 'fa-chisel');
                if (validClasses.length === 0) {
                    this.#warn('No valid Font Awesome classes in button icon', {
                        classes: iElement.className,
                        element: this.id || 'no-id'
                    });
                    buttonIcon = '';
                } else {
                    buttonIcon = `<i class="${validClasses.join(' ')}"></i>`;
                }
            }
        }
        const buttonIconPosition = this.getAttribute('button-icon-position') || '';
        let sanitizedButtonIconPosition = '';
        if (buttonIconPosition) {
            const validPositions = ['left', 'right'];
            if (validPositions.includes(buttonIconPosition)) {
                sanitizedButtonIconPosition = buttonIconPosition;
            } else {
                this.#warn('Invalid button icon position', {
                    value: buttonIconPosition,
                    element: this.id || 'no-id',
                    validValues: validPositions
                });
            }
        }
        const buttonIconOffset = this.getAttribute('button-icon-offset') || '';
        let sanitizedButtonIconOffset = '';
        if (buttonIconOffset && sanitizedButtonIconPosition) {
            const validOffset = buttonIconOffset.match(/^var\(--space-[a-z]+\)$/);
            if (validOffset) sanitizedButtonIconOffset = buttonIconOffset;
            else this.#warn('Invalid button icon offset', {
                value: buttonIconOffset,
                element: this.id || 'no-id',
                expected: 'var(--space-*) format'
            });
        }
        const buttonIconSize = this.getAttribute('button-icon-size') || '';
        let sanitizedButtonIconSize = '';
        if (buttonIconSize) {
            const remMatch = buttonIconSize.match(/^(\d*\.?\d+)rem$/);
            if (remMatch) sanitizedButtonIconSize = buttonIconSize;
            else this.#warn('Invalid button icon size', { value: buttonIconSize, element: this.id || 'no-id', expected: 'Nrem format' });
        }
        const effects = this.getAttribute('effects') || '';
        let sanitizedEffects = '';
        if (effects) {
            sanitizedEffects = effects.split(/\s+/).filter(cls => /^[a-zA-Z0-9\-]+$/.test(cls)).join(' ');
            if (sanitizedEffects !== effects) {
                this.#warn('Invalid effects classes', {
                    original: effects,
                    sanitized: sanitizedEffects,
                    element: this.id || 'no-id'
                });
            }
        }
        this.cachedAttributes = {
            effects: sanitizedEffects,
            sectionTitle: this.hasAttribute('heading') && !this.hasAttribute('button-text'),
            heading: this.getAttribute('heading') || '',
            headingTag: validHeadingTags.includes(headingTag.toLowerCase()) ? headingTag.toLowerCase() : 'h2',
            subHeading: this.getAttribute('sub-heading') || '',
            subHeadingTag: validHeadingTags.includes(subHeadingTag.toLowerCase()) ? subHeadingTag.toLowerCase() : 'h3',
            icon,
            iconStyle: sanitizedIconStyle,
            iconClass: sanitizedIconClass,
            iconSize: sanitizedIconSize,
            text: this.getAttribute('text') || '',
            buttonHref: this.getAttribute('button-href') || '#',
            buttonText: this.hasAttribute('button-text') ? (this.getAttribute('button-text') || 'Default') : '',
            buttonClass: sanitizedButtonClass,
            buttonStyle: sanitizedButtonStyle,
            buttonTarget: this.getAttribute('button-target') || '',
            buttonRel: sanitizedButtonRel,
            buttonAriaLabel: this.getAttribute('button-aria-label') || '',
            buttonType: sanitizedButtonType,
            buttonIcon,
            buttonIconPosition: sanitizedButtonIconPosition,
            buttonIconOffset: sanitizedButtonIconOffset,
            buttonIconSize: sanitizedButtonIconSize,
            hasBackgroundOverlay: !!backgroundOverlay,
            backgroundOverlayClass,
            innerBackgroundOverlayClass,
            backgroundGradientClass,
            innerBackgroundGradientClass,
            backgroundImageNoise: this.hasAttribute('background-image-noise'),
            backdropFilterClasses,
            backgroundColorClass: this.getAttribute('background-color') || '',
            borderClass: this.getAttribute('border') || '',
            borderRadiusClass: this.hasAttribute('border') && this.hasAttribute('border-radius') ? this.getAttribute('border-radius') : '',
            customClasses: this.getAttribute('class') || '',
            innerCustomClasses: this.getAttribute('inner-class') || '',
            styleAttribute: this.getAttribute('style') || '',
            backgroundSrc,
            backgroundLightSrc,
            backgroundDarkSrc,
            backgroundAlt,
            backgroundLightAlt: backgroundAlt,
            backgroundDarkAlt: backgroundAlt,
            backgroundIsDecorative: this.hasAttribute('img-background-decorative'),
            backgroundMobileWidth: this.getAttribute('img-background-mobile-width') || '100vw',
            backgroundTabletWidth: this.getAttribute('img-background-tablet-width') || '100vw',
            backgroundDesktopWidth: this.getAttribute('img-background-desktop-width') || '100vw',
            backgroundAspectRatio: this.getAttribute('img-background-aspect-ratio') || '',
            backgroundIncludeSchema: this.hasAttribute('img-background-include-schema'),
            backgroundFetchPriority: validFetchPriorities.includes(backgroundFetchPriority) ? backgroundFetchPriority : '',
            backgroundLoading: this.getAttribute('img-background-loading') || 'lazy',
            primarySrc,
            primaryLightSrc,
            primaryDarkSrc,
            primaryAlt: this.getAttribute('img-primary-alt') || '',
            primaryLightAlt: this.getAttribute('img-primary-alt') || '',
            primaryDarkAlt: this.getAttribute('img-primary-alt') || '',
            primaryIsDecorative: this.hasAttribute('img-primary-decorative'),
            primaryMobileWidth: this.getAttribute('img-primary-mobile-width') || '100vw',
            primaryTabletWidth: this.getAttribute('img-primary-tablet-width') || '100vw',
            primaryDesktopWidth: this.getAttribute('img-primary-desktop-width') || '100vw',
            primaryAspectRatio: this.getAttribute('img-primary-aspect-ratio') || '',
            primaryIncludeSchema: this.hasAttribute('img-primary-include-schema'),
            primaryFetchPriority: validFetchPriorities.includes(primaryFetchPriority) ? primaryFetchPriority : '',
            primaryLoading: this.getAttribute('img-primary-loading') || 'lazy',
            primaryPosition,
            videoBackgroundSrc,
            videoBackgroundLightSrc,
            videoBackgroundDarkSrc,
            videoBackgroundPoster: resolveImageSrc('video-background-poster'),
            videoBackgroundLightPoster: resolveImageSrc('video-background-light-poster'),
            videoBackgroundDarkPoster: resolveImageSrc('video-background-dark-poster'),
            videoBackgroundAlt: this.getAttribute('video-background-alt') || 'Video content',
            videoBackgroundLoading: this.getAttribute('video-background-loading') || 'lazy',
            videoBackgroundAutoplay: this.hasAttribute('video-background-autoplay'),
            videoBackgroundMuted: this.hasAttribute('video-background-muted') || this.hasAttribute('video-background-autoplay'),
            videoBackgroundLoop: this.hasAttribute('video-background-loop'),
            videoBackgroundPlaysinline: this.hasAttribute('video-background-playsinline'),
            videoBackgroundDisablePip: this.hasAttribute('video-background-disable-pip'),
            videoPrimarySrc,
            videoPrimaryLightSrc,
            videoPrimaryDarkSrc,
            videoPrimaryPoster: resolveImageSrc('video-primary-poster'),
            videoPrimaryLightPoster: resolveImageSrc('video-primary-light-poster'),
            videoPrimaryDarkPoster: resolveImageSrc('video-primary-dark-poster'),
            videoPrimaryAlt: this.getAttribute('video-primary-alt') || 'Video content',
            videoPrimaryLoading: this.getAttribute('video-primary-loading') || 'lazy',
            videoPrimaryAutoplay: this.hasAttribute('video-primary-autoplay'),
            videoPrimaryMuted: this.hasAttribute('video-primary-muted') || this.hasAttribute('video-primary-autoplay'),
            videoPrimaryLoop: this.hasAttribute('video-primary-loop'),
            videoPrimaryPlaysinline: this.hasAttribute('video-primary-playsinline'),
            videoPrimaryDisablePip: this.hasAttribute('video-primary-disable-pip'),
            backgroundPosition: sanitizedBackgroundPosition,
            innerBackgroundColorClass,
            innerBackgroundImageNoise: this.hasAttribute('inner-background-image-noise'),
            innerBackdropFilterClasses,
            innerBorderClass: this.getAttribute('inner-border') || '',
            innerBorderRadiusClass: this.hasAttribute('inner-border') && this.hasAttribute('inner-border-radius') ? this.getAttribute('inner-border-radius') : '',
            innerStyle: this.getAttribute('inner-style') || '',
            innerAlignment: innerAlignment && VALID_ALIGNMENTS.includes(innerAlignment) ? innerAlignment : '',
            textAlignment: textAlignment && validTextAlignments.includes(textAlignment) ? textAlignment : '',
            shadowClass,
            innerShadowClass
        };
        const criticalAttrs = {};
        CustomBlock.#criticalAttributes.forEach(attr => {
            criticalAttrs[attr] = this.getAttribute(attr) || '';
        });
        this.criticalAttributesHash = JSON.stringify(criticalAttrs);
        this.#log('Attributes parsed successfully', {
            elementId: this.id || 'no-id',
            criticalHashLength: this.criticalAttributesHash.length,
            hasMedia: !!(this.cachedAttributes.backgroundSrc || this.cachedAttributes.primarySrc || this.cachedAttributes.videoBackgroundSrc || this.cachedAttributes.videoPrimarySrc)
        });
        return this.cachedAttributes;
    }

    async initialize() {
        if (this.isInitialized) {
            this.#log('Skipping initialization', {
                isInitialized: this.isInitialized,
                elementId: this.id || 'no-id'
            });
            return;
        }
        this.#log('Starting initialization', { elementId: this.id || 'no-id', outerHTML: this.outerHTML });
        this.isInitialized = true;
        try {
            const cardElement = await this.render();
            if (cardElement) {
                this.#log('Render successful, replacing element', { elementId: this.id || 'no-id', cardElement: cardElement.outerHTML.substring(0, 200) });
                this.replaceWith(cardElement);
                this.callbacks.forEach(callback => callback());
                this.#log('Initialization completed successfully', {
                    elementId: this.id || 'no-id',
                    childCount: cardElement.childElementCount
                });
            } else {
                this.#error('Render returned null, using fallback', { elementId: this.id || 'no-id' });
                const fallbackElement = await this.render(true);
                this.replaceWith(fallbackElement);
            }
        } catch (error) {
            this.#error('Initialization failed', {
                error: error.message,
                stack: error.stack,
                elementId: this.id || 'no-id',
                outerHTML: this.outerHTML.substring(0, 200)
            });
            const fallbackElement = await this.render(true);
            this.replaceWith(fallbackElement);
        }
    }

    async connectedCallback() {
        this.#log('Connected to DOM', { elementId: this.id || 'no-id' });
        await this.initialize();
    }

    disconnectedCallback() {
        this.#log('Disconnected from DOM', { elementId: this.id || 'no-id' });
        this.callbacks = [];
        this.renderCache = null;
        this.cachedAttributes = null;
        this.criticalAttributesHash = null;
        CustomBlock.#renderCacheMap.delete(this);
    }

    addCallback(callback) {
        this.#log('Callback added', { callbackName: callback.name || 'anonymous', elementId: this.id || 'no-id' });
        this.callbacks.push(callback);
    }

    async render(isFallback = false) {
        this.#log(`Starting render ${isFallback ? '(fallback)' : ''}`, { elementId: this.id || 'no-id' });
        let newCriticalAttrsHash;
        if (!isFallback) {
            const criticalAttrs = {};
            CustomBlock.#criticalAttributes.forEach(attr => {
                criticalAttrs[attr] = this.getAttribute(attr) || '';
            });
            newCriticalAttrsHash = JSON.stringify(criticalAttrs);
            if (CustomBlock.#renderCacheMap.has(this) && this.criticalAttributesHash === newCriticalAttrsHash) {
                this.#log('Using cached render', { elementId: this.id || 'no-id' });
                return CustomBlock.#renderCacheMap.get(this).cloneNode(true);
            }
        }
        const attrs = isFallback ? {
            effects: '',
            sectionTitle: false,
            heading: '',
            headingTag: 'h2',
            subHeading: '',
            subHeadingTag: 'h3',
            icon: '',
            iconStyle: '',
            iconClass: '',
            iconSize: '',
            text: '',
            buttonHref: '#',
            buttonText: '',
            buttonClass: '',
            buttonStyle: '',
            buttonTarget: '',
            buttonRel: '',
            buttonAriaLabel: '',
            buttonType: 'button',
            buttonIcon: '',
            buttonIconPosition: '',
            buttonIconOffset: '',
            buttonIconSize: '',
            hasBackgroundOverlay: false,
            backgroundOverlayClass: '',
            innerBackgroundOverlayClass: '',
            backgroundGradientClass: '',
            innerBackgroundGradientClass: '',
            backgroundImageNoise: false,
            backdropFilterClasses: [],
            backgroundColorClass: '',
            borderClass: '',
            borderRadiusClass: '',
            customClasses: '',
            innerCustomClasses: '',
            styleAttribute: '',
            backgroundSrc: '',
            backgroundLightSrc: '',
            backgroundDarkSrc: '',
            backgroundAlt: '',
            backgroundIsDecorative: false,
            backgroundMobileWidth: '100vw',
            backgroundTabletWidth: '100vw',
            backgroundDesktopWidth: '100vw',
            backgroundAspectRatio: '',
            backgroundIncludeSchema: false,
            backgroundFetchPriority: '',
            backgroundLoading: 'lazy',
            primarySrc: '',
            primaryLightSrc: '',
            primaryDarkSrc: '',
            primaryAlt: '',
            primaryIsDecorative: false,
            primaryMobileWidth: '100vw',
            primaryTabletWidth: '100vw',
            primaryDesktopWidth: '100vw',
            primaryAspectRatio: '',
            primaryIncludeSchema: false,
            primaryFetchPriority: '',
            primaryLoading: 'lazy',
            primaryPosition: 'top',
            videoBackgroundSrc: '',
            videoBackgroundLightSrc: '',
            videoBackgroundDarkSrc: '',
            videoBackgroundPoster: '',
            videoBackgroundLightPoster: '',
            videoBackgroundDarkPoster: '',
            videoBackgroundAlt: 'Video content',
            videoBackgroundLoading: 'lazy',
            videoBackgroundAutoplay: false,
            videoBackgroundMuted: false,
            videoBackgroundLoop: false,
            videoBackgroundPlaysinline: false,
            videoBackgroundDisablePip: false,
            videoPrimarySrc: '',
            videoPrimaryLightSrc: '',
            videoPrimaryDarkSrc: '',
            videoPrimaryPoster: '',
            videoPrimaryLightPoster: '',
            videoPrimaryDarkPoster: '',
            videoPrimaryAlt: 'Video content',
            videoPrimaryLoading: 'lazy',
            videoPrimaryAutoplay: false,
            videoPrimaryMuted: false,
            videoPrimaryLoop: false,
            videoPrimaryPlaysinline: false,
            videoPrimaryDisablePip: false,
            backgroundPosition: '',
            innerBackgroundColorClass: '',
            innerBackgroundImageNoise: false,
            innerBackdropFilterClasses: [],
            innerBorderClass: '',
            innerBorderRadiusClass: '',
            innerStyle: '',
            innerAlignment: '',
            textAlignment: '',
            shadowClass: '',
            innerShadowClass: ''
        } : await this.getAttributes();
        this.#log('Render attributes prepared', {
            elementId: this.id || 'no-id',
            isFallback,
            attrs: {
                heading: attrs.heading,
                text: attrs.text,
                imgPrimarySrc: attrs.primarySrc,
                buttonText: attrs.buttonText,
                buttonHref: attrs.buttonHref
            }
        });
        if (!attrs.backgroundAlt && !attrs.backgroundIsDecorative && (attrs.backgroundSrc || attrs.backgroundLightSrc || attrs.backgroundDarkSrc)) {
            this.#error('Missing background alt text', {
                backgroundSrc: attrs.backgroundSrc || 'not provided',
                backgroundLightSrc: attrs.backgroundLightSrc || 'not provided',
                backgroundDarkSrc: attrs.backgroundDarkSrc || 'not provided',
                element: this.id || 'no-id'
            });
        }
        if (!attrs.primaryAlt && !attrs.primaryIsDecorative && (attrs.primarySrc || attrs.primaryLightSrc || attrs.primaryDarkSrc)) {
            this.#error('Missing primary alt text', {
                primarySrc: attrs.primarySrc || 'not provided',
                primaryLightSrc: attrs.primaryLightSrc || 'not provided',
                primaryDarkSrc: attrs.primaryDarkSrc || 'not provided',
                element: this.id || 'no-id'
            });
        }
        const hasVideoBackground = !isFallback && !!(attrs.videoBackgroundSrc || attrs.videoBackgroundLightSrc || attrs.videoBackgroundDarkSrc);
        const hasBackgroundImage = !isFallback && !!(attrs.backgroundSrc || attrs.backgroundLightSrc || attrs.backgroundDarkSrc) && !hasVideoBackground;
        const hasPrimaryImage = !isFallback && !!(attrs.primarySrc || attrs.primaryLightSrc || attrs.primaryDarkSrc);
        const hasVideoPrimary = !isFallback && !!(attrs.videoPrimarySrc || attrs.videoPrimaryLightSrc || attrs.videoPrimaryDarkSrc);
        this.#log('Media detection complete', {
            elementId: this.id || 'no-id',
            hasVideoBackground,
            hasBackgroundImage,
            hasPrimaryImage,
            hasVideoPrimary,
            primaryPosition: attrs.primaryPosition
        });
        const isMediaOnly = !isFallback &&
            !attrs.heading &&
            !attrs.subHeading &&
            !attrs.icon &&
            !attrs.text &&
            !attrs.buttonText &&
            (hasBackgroundImage || hasVideoBackground || hasVideoPrimary);
        const isButtonOnly = !isFallback &&
            !attrs.heading &&
            !attrs.subHeading &&
            !attrs.icon &&
            !attrs.text &&
            !hasBackgroundImage &&
            !hasVideoBackground &&
            !hasPrimaryImage &&
            !hasVideoPrimary &&
            attrs.buttonText;
        this.#log('Content type detection', {
            elementId: this.id || 'no-id',
            isMediaOnly,
            isButtonOnly,
            hasContent: !!(attrs.heading || attrs.subHeading || attrs.text || attrs.buttonText || attrs.icon)
        });
        const paddingClasses = ['padding-small', 'padding-medium', 'padding-large'];
        const borderClasses = ['border-small', 'border-medium', 'border-large', 'border-radius-small', 'border-radius-medium', 'border-radius-large'];
        const borderRadiusClasses = attrs.customClasses
            .split(' ')
            .filter(cls => cls && borderClasses.includes(cls) && cls.startsWith('border-radius'))
            .join(' ')
            .trim();
        const mediaClasses = attrs.customClasses
            .split(' ')
            .filter(cls => cls && !paddingClasses.includes(cls) && !borderClasses.includes(cls))
            .join(' ')
            .trim();
        const fragment = document.createDocumentFragment();
        const blockElement = document.createElement('div');
        fragment.appendChild(blockElement);
        const mainDivClassList = ['block'];
        if (hasBackgroundImage) mainDivClassList.push('background-image');
        else if (hasVideoBackground || hasVideoPrimary) mainDivClassList.push('background-video');
        const customClassList = attrs.customClasses.split(' ').filter(cls => cls && !paddingClasses.includes(cls));
        mainDivClassList.push(...customClassList, attrs.backgroundColorClass, attrs.borderClass, attrs.borderRadiusClass, attrs.shadowClass);
        if (attrs.effects) mainDivClassList.push(attrs.effects);
        blockElement.className = mainDivClassList.filter(cls => cls).join(' ').trim();
        this.#log('Block element created', {
            elementId: this.id || 'no-id',
            classes: blockElement.className,
            classCount: mainDivClassList.length
        });
        if (attrs.styleAttribute && !isFallback) {
            let outerStyles = attrs.styleAttribute;
            const paddingRegex = /(padding[^:]*:[^;]+;?)/gi;
            outerStyles = outerStyles.replace(paddingRegex, '').trim();
            if (outerStyles && outerStyles !== ';') {
                outerStyles = outerStyles.replace(/^;|;$/g, '').trim();
                if (outerStyles) {
                    blockElement.setAttribute('style', outerStyles);
                    this.#log('Style attribute applied', {
                        elementId: this.id || 'no-id',
                        styles: outerStyles
                    });
                }
            }
        }
        if (!isFallback && (hasPrimaryImage || hasVideoPrimary)) {
            blockElement.setAttribute('data-primary-position', attrs.primaryPosition);
        }
        if (!isFallback && attrs.sectionTitle && !attrs.buttonText) {
            blockElement.setAttribute('data-section-title', 'true');
        }
        if (hasVideoBackground) {
            this.#log('Rendering video background', {
                elementId: this.id || 'no-id',
                sources: [attrs.videoBackgroundSrc, attrs.videoBackgroundLightSrc, attrs.videoBackgroundDarkSrc].filter(Boolean)
            });
            const videoAttrs = {
                videoBackgroundSrc: attrs.videoBackgroundSrc?.trim() || '',
                videoBackgroundLightSrc: attrs.videoBackgroundLightSrc?.trim() || '',
                videoBackgroundDarkSrc: attrs.videoBackgroundDarkSrc?.trim() || '',
                videoBackgroundPoster: attrs.videoBackgroundPoster?.trim() || '',
                videoBackgroundLightPoster: attrs.videoBackgroundLightPoster?.trim() || '',
                videoBackgroundDarkPoster: attrs.videoBackgroundDarkPoster?.trim() || '',
                videoBackgroundAlt: attrs.videoBackgroundAlt?.trim() || 'Video content',
                videoBackgroundLoading: attrs.videoBackgroundLoading || 'lazy',
                videoBackgroundAutoplay: attrs.videoBackgroundAutoplay,
                videoBackgroundMuted: attrs.videoBackgroundMuted,
                videoBackgroundLoop: attrs.videoBackgroundLoop,
                videoBackgroundPlaysinline: attrs.videoBackgroundPlaysinline,
                videoBackgroundDisablePip: attrs.videoBackgroundDisablePip,
            };
            const sources = [videoAttrs.videoBackgroundSrc, videoAttrs.videoBackgroundLightSrc, videoAttrs.videoBackgroundDarkSrc].filter(Boolean);
            const validations = await Promise.all(sources.map(src => this.validateSrc(src)));
            if (validations.every(v => v)) {
                try {
                    const videoMarkup = await generateVideoMarkup({
                        src: videoAttrs.videoBackgroundSrc,
                        lightSrc: videoAttrs.videoBackgroundLightSrc,
                        darkSrc: videoAttrs.videoBackgroundDarkSrc,
                        poster: videoAttrs.videoBackgroundPoster,
                        lightPoster: videoAttrs.videoBackgroundLightPoster,
                        darkPoster: videoAttrs.videoBackgroundDarkPoster,
                        alt: videoAttrs.videoBackgroundAlt,
                        customClasses: mediaClasses,
                        extraClasses: borderRadiusClasses ? [borderRadiusClasses] : [],
                        loading: videoAttrs.videoBackgroundLoading,
                        autoplay: videoAttrs.videoBackgroundAutoplay,
                        muted: videoAttrs.videoBackgroundMuted,
                        loop: videoAttrs.videoBackgroundLoop,
                        playsinline: videoAttrs.videoBackgroundPlaysinline,
                        disablePip: videoAttrs.videoBackgroundDisablePip,
                        preload: videoAttrs.videoBackgroundLoading === 'lazy' ? 'metadata' : videoAttrs.videoBackgroundLoading,
                        controls: false
                    });
                    this.#log('Video markup generated successfully', {
                        elementId: this.id || 'no-id',
                        markupLength: videoMarkup.length,
                        markupPreview: videoMarkup.substring(0, 100)
                    });
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = videoMarkup;
                    const videoElement = tempDiv.querySelector('video');
                    if (videoElement) {
                        blockElement.appendChild(videoElement);
                        this.#log('Video background element appended', { elementId: this.id || 'no-id' });
                    } else {
                        this.#warn('Failed to parse video markup', {
                            markup: videoMarkup,
                            elementId: this.id || 'no-id'
                        });
                        blockElement.appendChild(document.createElement('p')).textContent = 'Video unavailable';
                    }
                } catch (error) {
                    this.#error('Video markup generation failed', {
                        error: error.message,
                        sources,
                        elementId: this.id || 'no-id'
                    });
                    blockElement.appendChild(document.createElement('p')).textContent = 'Video unavailable';
                }
            } else {
                this.#warn('Video validation failed', {
                    sources: sources.filter((_, i) => !validations[i]),
                    elementId: this.id || 'no-id'
                });
                blockElement.appendChild(document.createElement('p')).textContent = 'Video unavailable';
            }
        } else if (hasBackgroundImage) {
            this.#log('Rendering background image', {
                elementId: this.id || 'no-id',
                sources: [attrs.backgroundSrc, attrs.backgroundLightSrc, attrs.backgroundDarkSrc].filter(Boolean)
            });
            const sources = [attrs.backgroundSrc, attrs.backgroundLightSrc, attrs.backgroundDarkSrc].filter(Boolean);
            const validations = await Promise.all(sources.map(src => this.validateSrc(src)));
            if (sources.length && validations.every(v => v)) {
                try {
                    const extraStyles = attrs.backgroundPosition ? `object-position: ${attrs.backgroundPosition};` : '';
                    const pictureMarkup = await generatePictureMarkup({
                        src: attrs.backgroundSrc,
                        lightSrc: attrs.backgroundLightSrc,
                        darkSrc: attrs.backgroundDarkSrc,
                        alt: attrs.backgroundAlt,
                        lightAlt: attrs.backgroundLightAlt,
                        darkAlt: attrs.backgroundDarkAlt,
                        isDecorative: attrs.backgroundIsDecorative,
                        customClasses: mediaClasses,
                        extraClasses: borderRadiusClasses ? [borderRadiusClasses] : [],
                        loading: attrs.backgroundLoading,
                        fetchPriority: attrs.backgroundFetchPriority,
                        mobileWidth: attrs.backgroundMobileWidth,
                        tabletWidth: attrs.backgroundTabletWidth,
                        desktopWidth: attrs.backgroundDesktopWidth,
                        noResponsive: attrs.backgroundSrc?.endsWith('.svg') || attrs.backgroundLightSrc?.endsWith('.svg') || attrs.backgroundDarkSrc?.endsWith('.svg'),
                        aspectRatio: attrs.backgroundAspectRatio,
                        includeSchema: attrs.backgroundIncludeSchema,
                        extraStyles,
                        isBackground: true
                    });
                    this.#log('Background image markup generated', {
                        elementId: this.id || 'no-id',
                        markupLength: pictureMarkup.length,
                        markupPreview: pictureMarkup.substring(0, 100)
                    });
                    const pictureDiv = document.createElement('div');
                    pictureDiv.innerHTML = pictureMarkup;
                    const pictureElement = pictureDiv.querySelector('picture');
                    if (pictureElement) {
                        blockElement.appendChild(pictureElement);
                        this.#log('Background image appended successfully');
                    } else {
                        this.#warn('Failed to parse picture markup', { markup: pictureMarkup.substring(0, 200) });
                        const fallbackImg = document.createElement('img');
                        fallbackImg.src = 'https://placehold.co/3000x2000';
                        fallbackImg.alt = attrs.backgroundAlt || 'Error loading background image';
                        fallbackImg.onerror = "this.src='https://placehold.co/3000x2000'; this.alt='Nature landscape background'; this.onerror=null;";
                        if (borderRadiusClasses) fallbackImg.className = borderRadiusClasses;
                        fallbackImg.style.width = '100%';
                        blockElement.appendChild(fallbackImg);
                        this.#log('Fallback background image appended', { src: fallbackImg.src });
                    }
                } catch (error) {
                    this.#error('Error generating picture markup', { error, sources });
                    const fallbackImg = document.createElement('img');
                    fallbackImg.src = 'https://placehold.co/3000x2000';
                    fallbackImg.alt = attrs.backgroundAlt || 'Error loading background image';
                    fallbackImg.onerror = "this.src='https://placehold.co/3000x2000'; this.alt='Nature landscape background'; this.onerror=null;";
                    if (borderRadiusClasses) fallbackImg.className = borderRadiusClasses;
                    fallbackImg.style.width = '100%';
                    blockElement.appendChild(fallbackImg);
                    this.#log('Fallback background image appended', { src: fallbackImg.src });
                }
            } else {
                this.#warn('Invalid background image sources', { invalidSources: sources.filter((_, i) => !validations[i]) });
                const fallbackImg = document.createElement('img');
                fallbackImg.src = 'https://placehold.co/3000x2000';
                fallbackImg.alt = attrs.backgroundAlt || 'Error loading background image';
                fallbackImg.onerror = "this.src='https://placehold.co/3000x2000'; this.alt='Nature landscape background'; this.onerror=null;";
                if (borderRadiusClasses) fallbackImg.className = borderRadiusClasses;
                fallbackImg.style.width = '100%';
                blockElement.appendChild(fallbackImg);
                this.#log('Fallback background image appended', { src: fallbackImg.src });
            }
        }
        if (attrs.hasBackgroundOverlay && (hasBackgroundImage || hasVideoBackground)) {
            const overlayClasses = [attrs.backgroundOverlayClass];
            if (attrs.backgroundImageNoise) overlayClasses.push('background-image-noise');
            if (attrs.backgroundGradientClass) overlayClasses.push(attrs.backgroundGradientClass);
            if (borderRadiusClasses) overlayClasses.push(borderRadiusClasses);
            const backdropFilterValues = attrs.backdropFilterClasses
                .filter(cls => cls.startsWith('backdrop-filter'))
                .map(cls => BACKDROP_FILTER_MAP[cls] || '')
                .filter(val => val);
            const filteredOverlayClasses = attrs.backdropFilterClasses
                .filter(cls => !cls.startsWith('backdrop-filter'))
                .concat(overlayClasses)
                .filter(cls => cls);
            const overlayDiv = document.createElement('div');
            overlayDiv.classList.add('overlay-position');
            if (filteredOverlayClasses.length) {
                overlayDiv.className = filteredOverlayClasses.join(' ').trim();
            }
            if (backdropFilterValues.length) {
                overlayDiv.style.backdropFilter = backdropFilterValues.join(' ');
            }
            blockElement.appendChild(overlayDiv);
        }
        if (isMediaOnly && !hasPrimaryImage && !hasVideoPrimary) {
            this.#log('Media-only block detected', { elementId: this.id || 'no-id' });
            if (!isFallback && !blockElement.hasChildNodes()) {
                this.#error('Media-only block has no valid content, falling back', { outerHTML: this.outerHTML });
                return await this.render(true);
            }
            if (!isFallback) {
                CustomBlock.#renderCacheMap.set(this, blockElement.cloneNode(true));
                this.lastAttributes = newCriticalAttrsHash;
            }
            return blockElement;
        }
        if (isButtonOnly) {
            this.#log('Button-only block detected', { elementId: this.id || 'no-id' });
            const buttonClasses = ['button', attrs.buttonClass].filter(cls => cls).join(' ').trim();
            const buttonElement = document.createElement(attrs.buttonType === 'button' ? 'button' : 'a');
            buttonElement.className = buttonClasses;
            if (attrs.buttonStyle) buttonElement.setAttribute('style', attrs.buttonStyle);
            if (attrs.buttonType === 'button') {
                buttonElement.type = attrs.buttonType;
                if (!attrs.buttonHref || isFallback) buttonElement.setAttribute('disabled', '');
            } else {
                buttonElement.href = attrs.buttonHref || '#';
                if (!attrs.buttonHref || isFallback) buttonElement.setAttribute('aria-disabled', 'true');
            }
            if (attrs.buttonTarget) buttonElement.setAttribute(attrs.buttonType === 'button' ? 'formtarget' : 'target', attrs.buttonTarget);
            if (attrs.buttonRel) buttonElement.setAttribute('rel', attrs.buttonRel);
            if (attrs.buttonAriaLabel) buttonElement.setAttribute('aria-label', attrs.buttonAriaLabel);
            let buttonIconStyle = attrs.buttonIconSize ? `font-size: ${attrs.buttonIconSize}` : '';
            if (attrs.buttonIconOffset && attrs.buttonIconPosition) {
                const marginProperty = attrs.buttonIconPosition === 'left' ? 'margin-right' : 'margin-left';
                buttonIconStyle = buttonIconStyle ? `${buttonIconStyle}; ${marginProperty}: ${attrs.buttonIconOffset}` : `${marginProperty}: ${attrs.buttonIconOffset}`;
            }
            if (attrs.buttonIcon && attrs.buttonIconPosition === 'left') {
                const iconSpan = document.createElement('span');
                iconSpan.className = 'button-icon';
                if (buttonIconStyle) iconSpan.setAttribute('style', buttonIconStyle);
                iconSpan.innerHTML = attrs.buttonIcon;
                buttonElement.appendChild(iconSpan);
                buttonElement.appendChild(document.createTextNode(attrs.buttonText));
            } else if (attrs.buttonIcon && attrs.buttonIconPosition === 'right') {
                buttonElement.appendChild(document.createTextNode(attrs.buttonText));
                const iconSpan = document.createElement('span');
                iconSpan.className = 'button-icon';
                if (buttonIconStyle) iconSpan.setAttribute('style', buttonIconStyle);
                iconSpan.innerHTML = attrs.buttonIcon;
                buttonElement.appendChild(iconSpan);
            } else {
                buttonElement.textContent = attrs.buttonText;
            }
            if (attrs.innerCustomClasses) {
                const innerDiv = document.createElement('div');
                const innerDivClassList = attrs.innerCustomClasses.split(' ').filter(cls => cls && !cls.includes('flex-'));
                if (innerDivClassList.length) innerDiv.className = innerDivClassList.join(' ').trim();
                innerDiv.appendChild(buttonElement);
                blockElement.appendChild(innerDiv);
            } else {
                blockElement.appendChild(buttonElement);
            }
            if (!isFallback) {
                CustomBlock.#renderCacheMap.set(this, blockElement.cloneNode(true));
                this.lastAttributes = newCriticalAttrsHash;
            }
            return blockElement;
        }
        this.#log('Rendering content block', { elementId: this.id || 'no-id', hasContent: !!(attrs.heading || attrs.text || attrs.buttonText) });
        const innerPaddingClasses = attrs.innerCustomClasses.split(' ').filter(cls => cls && paddingClasses.includes(cls));
        const innerDivClassList = [...innerPaddingClasses, ...attrs.innerCustomClasses.split(' ').filter(cls => cls && !cls.includes('flex-') && !paddingClasses.includes(cls))];
        if (attrs.customClasses.includes('space-between')) innerDivClassList.push('space-between');
        if (attrs.innerBackgroundColorClass) innerDivClassList.push(attrs.innerBackgroundColorClass);
        if (attrs.innerBackgroundImageNoise) innerDivClassList.push('background-image-noise');
        if (attrs.innerBorderClass) innerDivClassList.push(attrs.innerBorderClass);
        if (attrs.innerBorderRadiusClass) innerDivClassList.push(attrs.innerBorderRadiusClass);
        if (attrs.innerBackgroundOverlayClass) innerDivClassList.push(attrs.innerBackgroundOverlayClass);
        if (attrs.innerBackgroundGradientClass) innerDivClassList.push(attrs.innerBackgroundGradientClass);
        if (attrs.innerShadowClass) innerDivClassList.push(attrs.innerShadowClass);
        const innerBackdropFilterValues = attrs.innerBackdropFilterClasses
            .filter(cls => cls.startsWith('backdrop-filter'))
            .map(cls => BACKDROP_FILTER_MAP[cls] || '')
            .filter(val => val);
        const filteredInnerBackdropClasses = attrs.innerBackdropFilterClasses
            .filter(cls => !cls.startsWith('backdrop-filter'));
        innerDivClassList.push(...filteredInnerBackdropClasses);
        const innerDiv = document.createElement('div');
        if (innerDivClassList.length) innerDiv.className = innerDivClassList.join(' ').trim();
        if (attrs.innerStyle || innerBackdropFilterValues.length) {
            let styleContent = '';
            if (attrs.innerStyle && attrs.innerStyle.trim()) {
                styleContent += attrs.innerStyle.trim();
            }
            if (innerBackdropFilterValues.length) {
                if (styleContent) styleContent += '; ';
                styleContent += `backdrop-filter: ${innerBackdropFilterValues.join(' ')}`;
            }
            if (styleContent.trim()) {
                innerDiv.setAttribute('style', styleContent.trim());
            }
        }
        if (attrs.innerAlignment) {
            innerDiv.classList.add(VALID_ALIGN_MAP[attrs.innerAlignment]);
        }
        innerDiv.setAttribute('aria-live', 'polite');
        const groupDiv = document.createElement('div');
        groupDiv.setAttribute('role', 'group');
        if (attrs.textAlignment) groupDiv.style.textAlign = attrs.textAlignment;
        if (attrs.icon) {
            const iconSpan = document.createElement('span');
            iconSpan.className = `icon${attrs.iconClass ? ` ${attrs.iconClass}` : ''}`;
            let iconStyles = attrs.iconStyle || '';
            if (attrs.iconSize) iconStyles = iconStyles ? `${iconStyles}; font-size: ${attrs.iconSize}` : `font-size: ${attrs.iconSize}`;
            if (iconStyles) iconSpan.setAttribute('style', iconStyles);
            iconSpan.innerHTML = attrs.icon;
            groupDiv.appendChild(iconSpan);
        }
        if (attrs.subHeading) {
            const subHeadingElement = document.createElement(attrs.subHeadingTag);
            subHeadingElement.textContent = attrs.subHeading;
            groupDiv.appendChild(subHeadingElement);
        }
        if (attrs.heading) {
            const headingElement = document.createElement(attrs.headingTag);
            headingElement.textContent = attrs.heading;
            groupDiv.appendChild(headingElement);
            this.#log('Heading appended', { text: attrs.heading });
        }
        if (attrs.text) {
            const textElement = document.createElement('p');
            textElement.textContent = attrs.text;
            groupDiv.appendChild(textElement);
            this.#log('Text appended', { text: attrs.text });
        }
        if (attrs.buttonText) {
            const buttonElement = document.createElement(attrs.buttonType === 'button' ? 'button' : 'a');
            buttonElement.className = `button ${attrs.buttonClass}`.trim();
            if (attrs.buttonStyle) buttonElement.setAttribute('style', attrs.buttonStyle);
            if (attrs.buttonType === 'button') {
                buttonElement.type = attrs.buttonType;
                if (!attrs.buttonHref || isFallback) buttonElement.setAttribute('disabled', '');
            } else {
                buttonElement.href = attrs.buttonHref || '#';
                if (!attrs.buttonHref || isFallback) buttonElement.setAttribute('aria-disabled', 'true');
            }
            if (attrs.buttonTarget) buttonElement.setAttribute(attrs.buttonType === 'button' ? 'formtarget' : 'target', attrs.buttonTarget);
            if (attrs.buttonRel) buttonElement.setAttribute('rel', attrs.buttonRel);
            if (attrs.buttonAriaLabel) buttonElement.setAttribute('aria-label', attrs.buttonAriaLabel);
            let buttonIconStyle = attrs.buttonIconSize ? `font-size: ${attrs.buttonIconSize}` : '';
            if (attrs.buttonIconOffset && attrs.buttonIconPosition) {
                const marginProperty = attrs.buttonIconPosition === 'left' ? 'margin-right' : 'margin-left';
                buttonIconStyle = buttonIconStyle ? `${buttonIconStyle}; ${marginProperty}: ${attrs.buttonIconOffset}` : `${marginProperty}: ${attrs.buttonIconOffset}`;
            }
            if (attrs.buttonIcon && attrs.buttonIconPosition === 'left') {
                const iconSpan = document.createElement('span');
                iconSpan.className = 'button-icon';
                if (buttonIconStyle) iconSpan.setAttribute('style', buttonIconStyle);
                iconSpan.innerHTML = attrs.buttonIcon;
                buttonElement.appendChild(iconSpan);
                buttonElement.appendChild(document.createTextNode(attrs.buttonText));
            } else if (attrs.buttonIcon && attrs.buttonIconPosition === 'right') {
                buttonElement.appendChild(document.createTextNode(attrs.buttonText));
                const iconSpan = document.createElement('span');
                iconSpan.className = 'button-icon';
                if (buttonIconStyle) iconSpan.setAttribute('style', buttonIconStyle);
                iconSpan.innerHTML = attrs.buttonIcon;
                buttonElement.appendChild(iconSpan);
            } else {
                buttonElement.textContent = attrs.buttonText;
            }
            groupDiv.appendChild(buttonElement);
            this.#log('Button appended', { text: attrs.buttonText, href: attrs.buttonHref });
        }
        innerDiv.appendChild(groupDiv);
        const appendMedia = async (position) => {
            if (!(hasPrimaryImage || hasVideoPrimary)) {
                this.#log('No primary media to append', { elementId: this.id || 'no-id' });
                blockElement.appendChild(innerDiv);
                return;
            }
            const mediaDiv = document.createElement('div');
            const sources = [attrs.primarySrc, attrs.primaryLightSrc, attrs.primaryDarkSrc, attrs.videoPrimarySrc, attrs.videoPrimaryLightSrc, attrs.videoPrimaryDarkSrc].filter(Boolean);
            this.#log('Primary media sources', { sources, elementId: this.id || 'no-id' });
            const validations = await Promise.all(sources.map(src => this.validateSrc(src)));
            if (sources.length && validations.every(v => v)) {
                try {
                    if (hasPrimaryImage) {
                        const pictureMarkup = await generatePictureMarkup({
                            src: attrs.primarySrc,
                            lightSrc: attrs.primaryLightSrc,
                            darkSrc: attrs.primaryDarkSrc,
                            alt: attrs.primaryAlt,
                            lightAlt: attrs.primaryLightAlt,
                            darkAlt: attrs.primaryDarkAlt,
                            isDecorative: attrs.primaryIsDecorative,
                            customClasses: mediaClasses,
                            extraClasses: borderRadiusClasses ? [borderRadiusClasses] : [],
                            loading: attrs.primaryLoading,
                            fetchPriority: attrs.primaryFetchPriority,
                            mobileWidth: attrs.primaryMobileWidth,
                            tabletWidth: attrs.primaryTabletWidth,
                            desktopWidth: attrs.primaryDesktopWidth,
                            noResponsive: attrs.primarySrc?.endsWith('.svg') || attrs.primaryLightSrc?.endsWith('.svg') || attrs.primaryDarkSrc?.endsWith('.svg'),
                            aspectRatio: attrs.primaryAspectRatio,
                            includeSchema: attrs.primaryIncludeSchema
                        });
                        this.#log('Primary picture markup generated', { markup: pictureMarkup.substring(0, 100) });
                        mediaDiv.innerHTML = pictureMarkup;
                        const pictureElement = mediaDiv.querySelector('picture');
                        if (pictureElement) {
                            if (position === 'left' || position === 'right') {
                                if (position === 'left') blockElement.appendChild(pictureElement);
                                blockElement.appendChild(innerDiv);
                                if (position === 'right') blockElement.appendChild(pictureElement);
                            } else {
                                blockElement.appendChild(position === 'top' ? pictureElement : innerDiv);
                                blockElement.appendChild(position === 'top' ? innerDiv : pictureElement);
                            }
                            this.#log(`Primary image (${position}) appended successfully`);
                        } else {
                            this.#warn('Failed to parse primary picture markup', { markup: pictureMarkup.substring(0, 200) });
                            const fallbackImg = document.createElement('img');
                            fallbackImg.src = 'https://placehold.co/3000x2000';
                            fallbackImg.alt = attrs.primaryAlt || 'Error loading primary image';
                            fallbackImg.onerror = "this.src='https://placehold.co/3000x2000'; this.alt='Nature landscape background'; this.onerror=null;";
                            if (borderRadiusClasses) fallbackImg.className = borderRadiusClasses;
                            fallbackImg.style.width = '100%';
                            blockElement.appendChild(fallbackImg);
                            this.#log('Fallback primary image appended', { src: fallbackImg.src });
                        }
                    } else if (hasVideoPrimary) {
                        const videoMarkup = await generateVideoMarkup({
                            src: attrs.videoPrimarySrc,
                            lightSrc: attrs.videoPrimaryLightSrc,
                            darkSrc: attrs.videoPrimaryDarkSrc,
                            poster: attrs.videoPrimaryPoster,
                            lightPoster: attrs.videoPrimaryLightPoster,
                            darkPoster: attrs.videoPrimaryDarkPoster,
                            alt: attrs.videoPrimaryAlt,
                            customClasses: mediaClasses,
                            extraClasses: borderRadiusClasses ? [borderRadiusClasses] : [],
                            loading: attrs.videoPrimaryLoading,
                            autoplay: attrs.videoPrimaryAutoplay,
                            muted: attrs.videoPrimaryMuted,
                            loop: attrs.videoPrimaryLoop,
                            playsinline: attrs.videoPrimaryPlaysinline,
                            disablePip: attrs.videoPrimaryDisablePip,
                            preload: attrs.videoPrimaryLoading === 'lazy' ? 'metadata' : attrs.videoPrimaryLoading,
                            controls: false
                        });
                        this.#log('Primary video markup generated', { markup: videoMarkup.substring(0, 100) });
                        const tempDiv = document.createElement('div');
                        tempDiv.innerHTML = videoMarkup;
                        const videoElement = tempDiv.querySelector('video');
                        if (videoElement) {
                            if (position === 'left' || position === 'right') {
                                if (position === 'left') blockElement.appendChild(videoElement);
                                blockElement.appendChild(innerDiv);
                                if (position === 'right') blockElement.appendChild(videoElement);
                            } else {
                                blockElement.appendChild(position === 'top' ? videoElement : innerDiv);
                                blockElement.appendChild(position === 'top' ? innerDiv : videoElement);
                            }
                            this.#log(`Primary video (${position}) appended successfully`);
                        } else {
                            this.#warn('Failed to parse primary video markup', { markup: videoMarkup.substring(0, 200) });
                            blockElement.appendChild(innerDiv);
                        }
                    }
                } catch (error) {
                    this.#error(`Error generating ${hasPrimaryImage ? 'picture' : 'video'} markup (${position})`, { error: error.message, sources });
                    const fallbackImg = document.createElement('img');
                    fallbackImg.src = 'https://placehold.co/3000x2000';
                    fallbackImg.alt = attrs.primaryAlt || 'Error loading primary image';
                    fallbackImg.onerror = "this.src='https://placehold.co/3000x2000'; this.alt='Nature landscape background'; this.onerror=null;";
                    if (borderRadiusClasses) fallbackImg.className = borderRadiusClasses;
                    fallbackImg.style.width = '100%';
                    blockElement.appendChild(fallbackImg);
                    this.#log('Fallback primary image appended', { src: fallbackImg.src });
                }
            } else {
                this.#warn('Invalid primary sources', { invalidSources: sources.filter((_, i) => !validations[i]) });
                blockElement.appendChild(innerDiv);
                const fallbackImg = document.createElement('img');
                fallbackImg.src = 'https://placehold.co/3000x2000';
                fallbackImg.alt = attrs.primaryAlt || 'Error loading primary image';
                fallbackImg.onerror = "this.src='https://placehold.co/3000x2000'; this.alt='Nature landscape background'; this.onerror=null;";
                if (borderRadiusClasses) fallbackImg.className = borderRadiusClasses;
                fallbackImg.style.width = '100%';
                blockElement.appendChild(fallbackImg);
                this.#log('Fallback primary image appended', { src: fallbackImg.src });
            }
        };
        await appendMedia(attrs.primaryPosition);
        if (!isFallback && blockElement.querySelector('img')) {
            const images = blockElement.querySelectorAll('img');
            images.forEach(img => {
                img.removeAttribute('img-background-light-src');
                img.removeAttribute('img-background-dark-src');
                img.removeAttribute('img-background-alt');
                img.removeAttribute('img-background-decorative');
                img.removeAttribute('img-background-mobile-width');
                img.removeAttribute('img-background-tablet-width');
                img.removeAttribute('img-background-desktop-width');
                img.removeAttribute('img-background-aspect-ratio');
                img.removeAttribute('img-background-include-schema');
                img.removeAttribute('img-background-fetchpriority');
                img.removeAttribute('img-background-loading');
                img.removeAttribute('img-primary-light-src');
                img.removeAttribute('img-primary-dark-src');
                img.removeAttribute('img-primary-alt');
                img.removeAttribute('img-primary-decorative');
                img.removeAttribute('img-primary-mobile-width');
                img.removeAttribute('img-primary-tablet-width');
                img.removeAttribute('img-primary-desktop-width');
                img.removeAttribute('img-primary-aspect-ratio');
                img.removeAttribute('img-primary-include-schema');
                img.removeAttribute('img-primary-fetchpriority');
                img.removeAttribute('img-primary-loading');
                img.removeAttribute('img-primary-position');
            });
        }
        if (!isFallback && !blockElement.hasChildNodes()) {
            this.#error('Block has no valid content, falling back', { outerHTML: this.outerHTML });
            return await this.render(true);
        }
        if (!isFallback) {
            CustomBlock.#renderCacheMap.set(this, blockElement.cloneNode(true));
            this.lastAttributes = newCriticalAttrsHash;
        }
        this.#log('Render completed', { elementId: this.id || 'no-id', html: blockElement.outerHTML.substring(0, 200) });
        return blockElement;
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue === newValue) return;
        if (!this.isInitialized) {
            this.#ignoredChangeCount++;
            if (this.debug && this.#ignoredChangeCount % 10 === 0) {
                this.#log('Attribute changes ignored (not ready - batched)', { count: this.#ignoredChangeCount, name, oldValue, newValue });
            }
            return;
        }
        this.#log('Attribute changed', { name, oldValue, newValue, elementId: this.id || 'no-id' });
        if (CustomBlock.#criticalAttributes.includes(name)) {
            this.cachedAttributes = null;
            this.criticalAttributesHash = null;
            this.initialize();
        }
    }

    static get observedAttributes() {
        return [
            'backdrop-filter', 'background-color', 'background-gradient', 'background-image-noise',
            'background-overlay', 'border', 'border-radius', 'button-aria-label', 'button-class',
            'button-href', 'button-icon', 'button-icon-offset', 'button-icon-position', 'button-icon-size',
            'button-rel', 'button-style', 'button-target', 'button-text', 'button-type', 'class', 'effects',
            'heading', 'heading-tag', 'icon', 'icon-class', 'icon-size', 'icon-style',
            'img-background-alt', 'img-background-aspect-ratio', 'img-background-dark-src',
            'img-background-decorative', 'img-background-desktop-width', 'img-background-fetchpriority',
            'img-background-light-src', 'img-background-loading', 'img-background-mobile-width',
            'img-background-position', 'img-background-src', 'img-background-tablet-width',
            'img-primary-alt', 'img-primary-aspect-ratio', 'img-primary-dark-src', 'img-primary-decorative',
            'img-primary-desktop-width', 'img-primary-fetchpriority', 'img-primary-light-src',
            'img-primary-loading', 'img-primary-mobile-width', 'img-primary-position', 'img-primary-src',
            'img-primary-tablet-width', 'inner-alignment', 'inner-backdrop-filter',
            'inner-background-color', 'inner-background-gradient', 'inner-background-image-noise',
            'inner-background-overlay', 'inner-border', 'inner-border-radius', 'inner-class',
            'inner-shadow', 'inner-style', 'section-title', 'shadow', 'style', 'sub-heading',
            'sub-heading-tag', 'text', 'text-alignment', 'video-background-alt',
            'video-background-autoplay', 'video-background-dark-poster', 'video-background-dark-src',
            'video-background-disable-pip', 'video-background-light-poster', 'video-background-light-src',
            'video-background-loading', 'video-background-loop', 'video-background-muted',
            'video-background-playsinline', 'video-background-poster', 'video-background-src',
            'video-primary-alt', 'video-primary-autoplay', 'video-primary-dark-poster',
            'video-primary-dark-src', 'video-primary-disable-pip', 'video-primary-light-poster',
            'video-primary-light-src', 'video-primary-loading', 'video-primary-loop',
            'video-primary-muted', 'video-primary-playsinline', 'video-primary-poster',
            'video-primary-src'
        ];
    }
}

try {
    customElements.define('custom-block', CustomBlock);
} catch (error) {
    console.error('Error defining CustomBlock element:', error);
}

console.log('CustomBlock version: 2025-09-27');
export { CustomBlock };
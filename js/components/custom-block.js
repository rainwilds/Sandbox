/* global HTMLElement, IntersectionObserver, document, window, JSON, console */
import { generatePictureMarkup } from '../image-generator.js';
import { generateVideoMarkup, generateVideoSources } from '../video-generator.js'; // Added generateVideoSources
import { VALID_ALIGNMENTS, alignMap } from '../shared.js';

class CustomBlock extends HTMLElement {
    constructor() {
        super();
        this.isVisible = false;
        this.isInitialized = false;
        this.callbacks = [];
        this.renderCache = null;
        this.lastAttributes = null;
        this.cachedAttributes = null;
        this.criticalAttributesHash = null;
        this.iconCache = new Map();
        this.buttonIconCache = new Map();
        CustomBlock.#observer.observe(this);
        CustomBlock.#observedInstances.add(this);
    }

    static #observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const instance = entry.target;
                if (instance instanceof CustomBlock) {
                    instance.isVisible = true;
                    CustomBlock.#observer.unobserve(instance);
                    CustomBlock.#observedInstances.delete(instance);
                    instance.initialize();
                }
            }
        });
    }, { rootMargin: '50px' });

    static #observedInstances = new WeakSet();
    static #renderCacheMap = new WeakMap();
    static #WIDTHS = [768, 1024, 1366, 1920, 2560];
    static #FORMATS = ['jxl', 'avif', 'webp', 'jpeg'];
    static #VALID_ASPECT_RATIOS = new Set(['16/9', '9/16', '3/2', '2/3', '1/1', '21/9']);
    static #SIZES_BREAKPOINTS = [
        { maxWidth: 768, baseValue: '100vw' },
        { maxWidth: 1024, baseValue: '100vw' },
        { maxWidth: 1366, baseValue: '100vw' },
        { maxWidth: 1920, baseValue: '100vw' },
        { maxWidth: 2560, baseValue: '100vw' },
    ];
    static #DEFAULT_SIZE_VALUE = 3840;
    static #BASE_PATH = './img/responsive/';
    static BACKDROP_FILTER_MAP = {
        'backdrop-filter-blur-small': 'blur(var(--blur-small))',
        'backdrop-filter-blur-medium': 'blur(var(--blur-medium))',
        'backdrop-filter-blur-large': 'blur(var(--blur-large))',
        'backdrop-filter-grayscale-small': 'grayscale(var(--grayscale-small))',
        'backdrop-filter-grayscale-medium': 'grayscale(var(--grayscale-medium))',
        'backdrop-filter-grayscale-large': 'grayscale(var(--grayscale-large))'
    };
    static #criticalAttributes = [
        'backdrop-filter', 'background-color', 'background-gradient', 'background-image-noise', 'background-overlay',
        'border', 'border-radius', 'button-aria-label', 'button-class', 'button-href', 'button-icon',
        'button-icon-offset', 'button-icon-position', 'button-icon-size', 'button-rel', 'button-style',
        'button-target', 'button-text', 'button-type', 'class', 'effects', 'heading', 'heading-tag',
        'icon', 'icon-class', 'icon-size', 'icon-style', 'img-background-alt', 'img-background-aspect-ratio',
        'img-background-desktop-width', 'img-background-light-src', 'img-background-mobile-width',
        'img-background-position', 'img-background-src', 'img-background-tablet-width', 'img-primary-alt',
        'img-primary-aspect-ratio', 'img-primary-desktop-width', 'img-primary-light-src', 'img-primary-mobile-width',
        'img-primary-position', 'img-primary-src', 'img-primary-tablet-width', 'inner-alignment',
        'inner-backdrop-filter', 'inner-background-color', 'inner-background-gradient', 'inner-background-image-noise',
        'inner-background-overlay', 'inner-border', 'inner-border-radius', 'inner-class', 'inner-shadow',
        'inner-style', 'section-title', 'style', 'sub-heading', 'sub-heading-tag', 'text', 'text-alignment',
        'video-background-alt', 'video-background-autoplay', 'video-background-dark-poster', 'video-background-dark-src',
        'video-background-disable-pip', 'video-background-light-poster', 'video-background-light-src',
        'video-background-loading', 'video-background-loop', 'video-background-muted', 'video-background-playsinline',
        'video-background-poster', 'video-background-src', 'video-primary-alt', 'video-primary-autoplay',
        'video-primary-dark-poster', 'video-primary-dark-src', 'video-primary-disable-pip',
        'video-primary-light-poster', 'video-primary-light-src', 'video-primary-loading', 'video-primary-loop',
        'video-primary-muted', 'video-primary-playsinline', 'video-primary-poster', 'video-primary-src'
    ];

    getAttributes() {
        if (this.cachedAttributes) {
            return this.cachedAttributes;
        }
        const backgroundFetchPriority = this.getAttribute('img-background-fetchpriority') || '';
        const primaryFetchPriority = this.getAttribute('img-primary-fetchpriority') || '';
        const validFetchPriorities = ['high', 'low', 'auto', ''];
        if (!validFetchPriorities.includes(backgroundFetchPriority)) {
            console.warn(`Invalid img-background-fetchpriority value "${backgroundFetchPriority}" in <custom-block>. Using default.`);
        }
        if (!validFetchPriorities.includes(primaryFetchPriority)) {
            console.warn(`Invalid img-primary-fetchpriority value "${primaryFetchPriority}" in <custom-block>. Using default.`);
        }
        let primaryPosition = this.getAttribute('img-primary-position') || 'none';
        if (primaryPosition === 'above') primaryPosition = 'top';
        if (primaryPosition === 'below') primaryPosition = 'bottom';
        const validPositions = ['none', 'top', 'bottom', 'left', 'right'];
        if (!validPositions.includes(primaryPosition)) {
            console.warn(`Invalid img-primary-position value "${primaryPosition}" in <custom-block>. Using default 'none'.`);
            primaryPosition = 'none';
        }
        const backgroundOverlay = this.getAttribute('background-overlay') || '';
        let backgroundOverlayClass = '';
        if (backgroundOverlay) {
            const match = backgroundOverlay.match(/^background-overlay-(\d+)$/);
            if (match) {
                backgroundOverlayClass = `background-overlay-${match[1]}`;
            } else {
                console.warn(`Invalid background-overlay value "${backgroundOverlay}" in <custom-block>. Expected format: background-overlay-[number]. Using default 'background-overlay-1'.`);
                backgroundOverlayClass = 'background-overlay-1';
            }
        }
        const innerBackgroundOverlay = this.getAttribute('inner-background-overlay') || '';
        let innerBackgroundOverlayClass = '';
        if (innerBackgroundOverlay) {
            const match = innerBackgroundOverlay.match(/^background-overlay-(\d+)$/);
            if (match) {
                innerBackgroundOverlayClass = `background-overlay-${match[1]}`;
            } else {
                console.warn(`Invalid inner-background-overlay value "${innerBackgroundOverlay}" in <custom-block>. Expected format: background-overlay-[number]. Using default 'background-overlay-1'.`);
                innerBackgroundOverlayClass = 'background-overlay-1';
            }
        }
        const backgroundGradient = this.getAttribute('background-gradient') || '';
        let backgroundGradientClass = '';
        if (backgroundGradient) {
            const match = backgroundGradient.match(/^background-gradient-(\d+)$/);
            if (match) {
                backgroundGradientClass = `background-gradient-${match[1]}`;
            } else {
                console.warn(`Invalid background-gradient value "${backgroundGradient}" in <custom-block>. Expected format: background-gradient-[number]. Ignoring.`);
            }
        }
        const innerBackgroundGradient = this.getAttribute('inner-background-gradient') || '';
        let innerBackgroundGradientClass = '';
        if (innerBackgroundGradient) {
            const match = innerBackgroundGradient.match(/^background-gradient-(\d+)$/);
            if (match) {
                innerBackgroundGradientClass = `background-gradient-${match[1]}`;
            } else {
                console.warn(`Invalid inner-background-gradient value "${innerBackgroundGradient}" in <custom-block>. Expected format: background-gradient-[number]. Ignoring.`);
            }
        }
        const backdropFilterClasses = this.getAttribute('backdrop-filter')?.split(' ').filter(cls => cls) || [];
        const innerBackdropFilterClasses = this.getAttribute('inner-backdrop-filter')?.split(' ').filter(cls => cls) || [];
        const headingTag = this.getAttribute('heading-tag') || 'h2';
        const subHeadingTag = this.getAttribute('sub-heading-tag') || 'h3';
        const validHeadingTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
        if (!validHeadingTags.includes(headingTag.toLowerCase())) {
            console.warn(`Invalid heading-tag value "${headingTag}" in <custom-block>. Must be one of ${validHeadingTags.join(', ')}. Using default 'h2'.`);
        }
        if (!validHeadingTags.includes(subHeadingTag.toLowerCase())) {
            console.warn(`Invalid sub-heading-tag value "${subHeadingTag}" in <custom-block>. Must be one of ${validHeadingTags.join(', ')}. Using default 'h3'.`);
        }
        const innerAlignment = this.getAttribute('inner-alignment') || '';
        if (innerAlignment && !VALID_ALIGNMENTS.includes(innerAlignment)) {
            console.warn(`Invalid inner-alignment value "${innerAlignment}" in <custom-block>. Must be one of ${VALID_ALIGNMENTS.join(', ')}. Ignoring alignment.`);
        }
        const textAlignment = this.getAttribute('text-alignment') || '';
        const validTextAlignments = ['left', 'center', 'right'];
        if (textAlignment && !validTextAlignments.includes(textAlignment)) {
            console.warn(`Invalid text-alignment value "${textAlignment}" in <custom-block>. Must be one of ${validTextAlignments.join(', ')}. Ignoring text alignment.`);
        }
        const innerBackgroundColor = this.getAttribute('inner-background-color') || '';
        let innerBackgroundColorClass = '';
        if (innerBackgroundColor) {
            const match = innerBackgroundColor.match(/^background-color-(\d+)$/);
            if (match) {
                innerBackgroundColorClass = `background-color-${match[1]}`;
            } else {
                console.warn(`Invalid inner-background-color value "${innerBackgroundColor}" in <custom-block>. Expected format: background-color-[number]. Ignoring.`);
            }
        }
        const shadow = this.getAttribute('shadow') || '';
        let shadowClass = '';
        const validShadowClasses = ['shadow-light', 'shadow-medium', 'shadow-heavy'];
        if (shadow && validShadowClasses.includes(shadow)) {
            shadowClass = shadow;
        } else if (shadow) {
            console.warn(`Invalid shadow value "${shadow}" in <custom-block>. Must be one of ${validShadowClasses.join(', ')}. Ignoring.`);
        }
        const innerShadow = this.getAttribute('inner-shadow') || '';
        let innerShadowClass = '';
        if (innerShadow && validShadowClasses.includes(innerShadow)) {
            innerShadowClass = innerShadow;
        } else if (innerShadow) {
            console.warn(`Invalid inner-shadow value "${innerShadow}" in <custom-block>. Must be one of ${validShadowClasses.join(', ')}. Ignoring.`);
        }
        const backgroundSrc = this.getAttribute('img-background-src') || '';
        const backgroundLightSrc = this.getAttribute('img-background-light-src') || '';
        const backgroundDarkSrc = this.getAttribute('img-background-dark-src') || '';
        const backgroundAlt = this.getAttribute('img-background-alt') || '';
        if ((backgroundLightSrc || backgroundDarkSrc) && !(backgroundLightSrc && backgroundDarkSrc) && !backgroundSrc) {
            throw new Error('Both img-background-light-src and img-background-dark-src must be present when using light/dark themes, or use img-background-src alone.');
        }
        const primarySrc = this.getAttribute('img-primary-src') || '';
        const primaryLightSrc = this.getAttribute('img-primary-light-src') || '';
        const primaryDarkSrc = this.getAttribute('img-primary-dark-src') || '';
        if ((primaryLightSrc || primaryDarkSrc) && !(primaryLightSrc && primaryDarkSrc) && !primarySrc) {
            throw new Error('Both img-primary-light-src and img-primary-dark-src must be present when using light/dark themes, or use img-primary-src alone.');
        }
        const videoBackgroundSrc = this.getAttribute('video-background-src') || '';
        const videoBackgroundLightSrc = this.getAttribute('video-background-light-src') || '';
        const videoBackgroundDarkSrc = this.getAttribute('video-background-dark-src') || '';
        if ((videoBackgroundLightSrc || videoBackgroundDarkSrc) && !(videoBackgroundLightSrc && videoBackgroundDarkSrc) && !videoBackgroundSrc) {
            throw new Error('Both video-background-light-src and video-background-dark-src must be present when using light/dark themes, or use video-background-src alone.');
        }
        const videoPrimarySrc = this.getAttribute('video-primary-src') || '';
        const videoPrimaryLightSrc = this.getAttribute('video-primary-light-src') || '';
        const videoPrimaryDarkSrc = this.getAttribute('video-primary-dark-src') || '';
        if ((videoPrimaryLightSrc || videoPrimaryDarkSrc) && !(videoPrimaryLightSrc && videoPrimaryDarkSrc) && !videoPrimarySrc) {
            throw new Error('Both video-primary-light-src and video-primary-dark-src must be present when using light/dark themes, or use video-primary-src alone.');
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
                console.warn(`Invalid img-background-position value "${backgroundPosition}" in <custom-block>. Must be a valid position (e.g., "top-left", "50% 100%"). Ignoring.`);
            }
        }
        let icon = this.getAttribute('icon') || '';
        if (icon) {
            const cacheKey = icon;
            if (!this.iconCache.has(cacheKey)) {
                icon = icon.replace(/['"]/g, '&quot;');
                const parser = new DOMParser();
                const decodedIcon = icon.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
                const doc = parser.parseFromString(decodedIcon, 'text/html');
                const iElement = doc.body.querySelector('i');
                if (!iElement || !iElement.className.includes('fa-')) {
                    console.warn(`Invalid icon attribute in <custom-block>. Must be a valid Font Awesome <i> tag. Ignoring.`);
                    icon = '';
                } else {
                    const validClasses = iElement.className.split(' ').filter(cls => cls.startsWith('fa-') || cls === 'fa-chisel');
                    if (validClasses.length === 0) {
                        console.warn(`Icon attribute in <custom-block> contains no valid Font Awesome classes. Ignoring.`);
                        icon = '';
                    } else {
                        icon = `<i class="${validClasses.join(' ')}"></i>`;
                    }
                }
                this.iconCache.set(cacheKey, icon);
            } else {
                icon = this.iconCache.get(cacheKey);
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
                console.warn(`Invalid or unsafe CSS in icon-style attribute: "${iconStyle}". Using sanitized styles: "${sanitizedIconStyle}".`);
            }
        }
        const iconClass = this.getAttribute('icon-class') || '';
        let sanitizedIconClass = '';
        if (iconClass) {
            sanitizedIconClass = iconClass.split(/\s+/).filter(cls => /^[a-zA-Z0-9\-_]+$/.test(cls)).join(' ');
            if (sanitizedIconClass !== iconClass) {
                console.warn(`Invalid characters in icon-class attribute: "${iconClass}". Using sanitized classes: "${sanitizedIconClass}".`);
            }
        }
        const iconSize = this.getAttribute('icon-size') || '';
        let sanitizedIconSize = '';
        if (iconSize) {
            const remMatch = iconSize.match(/^(\d*\.?\d+)rem$/);
            if (remMatch) {
                sanitizedIconSize = iconSize;
            } else {
                console.warn(`Invalid icon-size value "${iconSize}" in <custom-block>. Must be a valid rem value (e.g., "2rem"). Ignoring.`);
            }
        }
        const buttonClass = this.getAttribute('button-class') || '';
        let sanitizedButtonClass = '';
        if (buttonClass) {
            sanitizedButtonClass = buttonClass.split(/\s+/).filter(cls => /^[a-zA-Z0-9\-_]+$/.test(cls)).join(' ');
            if (sanitizedButtonClass !== buttonClass) {
                console.warn(`Invalid characters in button-class attribute: "${buttonClass}". Using sanitized classes: "${sanitizedButtonClass}".`);
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
                console.warn(`Invalid or unsafe CSS in button-style attribute: "${buttonStyle}". Using sanitized styles: "${sanitizedButtonStyle}".`);
            }
        }
        const buttonRel = this.getAttribute('button-rel') || '';
        let sanitizedButtonRel = '';
        if (buttonRel) {
            const validRels = ['alternate', 'author', 'bookmark', 'external', 'help', 'license', 'next', 'nofollow', 'noopener', 'noreferrer', 'prev', 'search', 'tag'];
            sanitizedButtonRel = buttonRel.split(/\s+/).filter(rel => validRels.includes(rel)).join(' ');
            if (sanitizedButtonRel !== buttonRel) {
                console.warn(`Invalid button-rel value "${buttonRel}" in <custom-block>. Must be one of ${validRels.join(', ')}. Using sanitized: "${sanitizedButtonRel}".`);
            }
        }
        const buttonType = this.getAttribute('button-type') || '';
        const buttonHref = this.getAttribute('button-href') || '';
        const validButtonTypes = ['button', 'submit', 'reset'];
        let sanitizedButtonType = buttonHref && !buttonType ? 'link' : 'button';
        if (buttonType && validButtonTypes.includes(buttonType)) {
            sanitizedButtonType = buttonType;
        } else if (buttonType) {
            console.warn(`Invalid button-type value "${buttonType}" in <custom-block>. Must be one of ${validButtonTypes.join(', ')}. Using default ${buttonHref ? "'link'" : "'button'"}.`);
        }
        let buttonIcon = this.getAttribute('button-icon') || '';
        if (buttonIcon) {
            const cacheKey = buttonIcon;
            if (!this.buttonIconCache.has(cacheKey)) {
                buttonIcon = buttonIcon.replace(/['"]/g, '&quot;');
                const parser = new DOMParser();
                const decodedIcon = buttonIcon.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
                const doc = parser.parseFromString(decodedIcon, 'text/html');
                const iElement = doc.body.querySelector('i');
                if (!iElement || !iElement.className.includes('fa-')) {
                    console.warn(`Invalid button-icon attribute in <custom-block>. Must be a valid Font Awesome <i> tag. Ignoring.`);
                    buttonIcon = '';
                } else {
                    const validClasses = iElement.className.split(' ').filter(cls => cls.startsWith('fa-') || cls === 'fa-chisel');
                    if (validClasses.length === 0) {
                        console.warn(`Button-icon attribute in <custom-block> contains no valid Font Awesome classes. Ignoring.`);
                        buttonIcon = '';
                    } else {
                        buttonIcon = `<i class="${validClasses.join(' ')}"></i>`;
                    }
                }
                this.buttonIconCache.set(cacheKey, buttonIcon);
            } else {
                buttonIcon = this.buttonIconCache.get(cacheKey);
            }
        }
        const buttonIconPosition = this.getAttribute('button-icon-position') || '';
        let sanitizedButtonIconPosition = '';
        if (buttonIconPosition) {
            const validPositions = ['left', 'right'];
            if (validPositions.includes(buttonIconPosition)) {
                sanitizedButtonIconPosition = buttonIconPosition;
            } else {
                console.warn(`Invalid button-icon-position value "${buttonIconPosition}" in <custom-block>. Must be 'left' or 'right'. Ignoring.`);
            }
        }
        const buttonIconOffset = this.getAttribute('button-icon-offset') || '';
        let sanitizedButtonIconOffset = '';
        if (buttonIconOffset && sanitizedButtonIconPosition) {
            const validOffset = buttonIconOffset.match(/^var\(--space-[a-z]+\)$/);
            if (validOffset) {
                sanitizedButtonIconOffset = buttonIconOffset;
            } else {
                console.warn(`Invalid button-icon-offset value "${buttonIconOffset}" in <custom-block>. Must be a CSS variable like 'var(--space-tiny)'. Ignoring.`);
            }
        }
        const buttonIconSize = this.getAttribute('button-icon-size') || '';
        let sanitizedButtonIconSize = '';
        if (buttonIconSize) {
            const remMatch = buttonIconSize.match(/^(\d*\.?\d+)rem$/);
            if (remMatch) {
                sanitizedButtonIconSize = buttonIconSize;
            } else {
                console.warn(`Invalid button-icon-size value "${buttonIconSize}" in <custom-block>. Must be a valid rem value (e.g., "2rem"). Ignoring.`);
            }
        }
        const effects = this.getAttribute('effects') || '';
        let sanitizedEffects = '';
        if (effects) {
            sanitizedEffects = effects.split(/\s+/).filter(cls => /^[a-zA-Z0-9\-]+$/.test(cls)).join(' ');
            if (sanitizedEffects !== effects) {
                console.warn(`Invalid effects value "${effects}" in <custom-block>. Must be alphanumeric or hyphenated (e.g., "parallax"). Using sanitized: "${sanitizedEffects}".`);
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
            backgroundSrc: backgroundSrc,
            backgroundLightSrc: backgroundLightSrc,
            backgroundDarkSrc: backgroundDarkSrc,
            backgroundAlt: backgroundAlt,
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
            primarySrc: primarySrc,
            primaryLightSrc: primaryLightSrc,
            primaryDarkSrc: primaryDarkSrc,
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
            videoBackgroundSrc: videoBackgroundSrc || (videoBackgroundLightSrc && videoBackgroundDarkSrc ? '' : null),
            videoBackgroundLightSrc: videoBackgroundLightSrc,
            videoBackgroundDarkSrc: videoBackgroundDarkSrc,
            videoBackgroundPoster: this.getAttribute('video-background-poster') || '',
            videoBackgroundLightPoster: this.getAttribute('video-background-light-poster') || '',
            videoBackgroundDarkPoster: this.getAttribute('video-background-dark-poster') || '',
            videoBackgroundAlt: this.getAttribute('video-background-alt') || 'Video content',
            videoBackgroundLoading: this.getAttribute('video-background-loading') || 'lazy',
            videoBackgroundAutoplay: this.hasAttribute('video-background-autoplay'),
            videoBackgroundMuted: this.hasAttribute('video-background-muted') || this.hasAttribute('video-background-autoplay'),
            videoBackgroundLoop: this.hasAttribute('video-background-loop'),
            videoBackgroundPlaysinline: this.hasAttribute('video-background-playsinline'),
            videoBackgroundDisablePip: this.hasAttribute('video-background-disable-pip'),
            videoPrimarySrc: videoPrimarySrc || (videoPrimaryLightSrc && videoPrimaryDarkSrc ? '' : null),
            videoPrimaryLightSrc: videoPrimaryLightSrc,
            videoPrimaryDarkSrc: videoPrimaryDarkSrc,
            videoPrimaryPoster: this.getAttribute('video-primary-poster') || '',
            videoPrimaryLightPoster: this.getAttribute('video-primary-light-poster') || '',
            videoPrimaryDarkPoster: this.getAttribute('video-primary-dark-poster') || '',
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
        return this.cachedAttributes;
    }

    initialize() {
        if (this.isInitialized || !this.isVisible) return;
        this.isInitialized = true;
        try {
            const cardElement = this.render();
            if (cardElement) {
                this.replaceWith(cardElement);
                this.callbacks.forEach(callback => callback());
            } else {
                console.error('Failed to render CustomBlock: cardElement is null or invalid.', this.outerHTML);
                this.replaceWith(this.render(true));
            }
        } catch (error) {
            console.error('Error initializing CustomBlock:', error, this.outerHTML);
            this.replaceWith(this.render(true));
        }
    }

    connectedCallback() {
        if (this.isVisible) {
            this.initialize();
        }
    }

    disconnectedCallback() {
        if (CustomBlock.#observedInstances.has(this)) {
            CustomBlock.#observer.unobserve(this);
            CustomBlock.#observedInstances.delete(this);
        }
        this.callbacks = [];
        this.renderCache = null;
        this.cachedAttributes = null;
        this.criticalAttributesHash = null;
        this.iconCache.clear();
        this.buttonIconCache.clear();
        CustomBlock.#renderCacheMap.delete(this);
    }

    addCallback(callback) {
        this.callbacks.push(callback);
    }

    render(isFallback = false) {
        let newCriticalAttrsHash;
        if (!isFallback) {
            const criticalAttrs = {};
            CustomBlock.#criticalAttributes.forEach(attr => {
                criticalAttrs[attr] = this.getAttribute(attr) || '';
            });
            newCriticalAttrsHash = JSON.stringify(criticalAttrs);
            if (CustomBlock.#renderCacheMap.has(this) && this.criticalAttributesHash === newCriticalAttrsHash) {
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
            primaryPosition: 'none',
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
        } : this.getAttributes();
        if (!isFallback && (attrs.videoBackgroundSrc || attrs.videoBackgroundLightSrc || attrs.videoBackgroundDarkSrc)) {
            console.log('Video attrs:', {
                src: attrs.videoBackgroundSrc,
                lightSrc: attrs.videoBackgroundLightSrc,
                darkSrc: attrs.videoBackgroundDarkSrc,
                autoplay: attrs.videoBackgroundAutoplay
            });
        }
        if (!attrs.backgroundAlt && !attrs.backgroundIsDecorative && (attrs.backgroundSrc || attrs.backgroundLightSrc || attrs.backgroundDarkSrc)) {
            console.error(`<custom-block img-background-src="${attrs.backgroundSrc || 'not provided'}" img-background-light-src="${attrs.backgroundLightSrc || 'not provided'}" img-background-dark-src="${attrs.backgroundDarkSrc || 'not provided'}"> requires an img-background-alt attribute for accessibility unless img-background-decorative is present.`);
        }
        if (!attrs.primaryAlt && !attrs.primaryIsDecorative && (attrs.primarySrc || attrs.primaryLightSrc || attrs.primaryDarkSrc)) {
            console.error(`<custom-block img-primary-src="${attrs.primarySrc || 'not provided'}" img-primary-light-src="${attrs.primaryLightSrc || 'not provided'}" img-primary-dark-src="${attrs.primaryDarkSrc || 'not provided'}"> requires an img-primary-alt attribute for accessibility unless img-primary-decorative is present.`);
        }
        const hasVideoBackground = !isFallback && !!(attrs.videoBackgroundSrc || attrs.videoBackgroundLightSrc || attrs.videoBackgroundDarkSrc);
        const hasBackgroundImage = !isFallback && !!(attrs.backgroundSrc || attrs.backgroundLightSrc || attrs.backgroundDarkSrc) && !hasVideoBackground;
        const hasPrimaryImage = !isFallback && !!(attrs.primarySrc || attrs.primaryLightSrc || attrs.primaryDarkSrc) && ['top', 'bottom', 'left', 'right'].includes(attrs.primaryPosition);
        const hasVideoPrimary = !isFallback && !!(attrs.videoPrimarySrc || attrs.videoPrimaryLightSrc || attrs.videoPrimaryDarkSrc) && ['top', 'bottom', 'left', 'right'].includes(attrs.primaryPosition);
        const isMediaOnly = !isFallback &&
            !this.hasAttribute('heading') &&
            !this.hasAttribute('sub-heading') &&
            !this.hasAttribute('icon') &&
            !this.hasAttribute('text') &&
            !this.hasAttribute('button-text') &&
            (hasBackgroundImage || hasVideoBackground || hasVideoPrimary);
        const isButtonOnly = !isFallback &&
            !this.hasAttribute('heading') &&
            !this.hasAttribute('sub-heading') &&
            !this.hasAttribute('icon') &&
            !this.hasAttribute('text') &&
            !hasBackgroundImage &&
            !hasVideoBackground &&
            !hasPrimaryImage &&
            !hasVideoPrimary &&
            this.hasAttribute('button-text') &&
            attrs.buttonText;
        const fragment = document.createDocumentFragment();
        const blockElement = document.createElement('div');
        fragment.appendChild(blockElement);
        const mainDivClassList = ['block'];
        if (hasBackgroundImage) mainDivClassList.push('background-image');
        else if (hasVideoBackground || hasVideoPrimary) mainDivClassList.push('background-video');
        const paddingClasses = ['padding-small', 'padding-medium', 'padding-large'];
        const customClassList = attrs.customClasses.split(' ').filter(cls => cls && !paddingClasses.includes(cls));
        mainDivClassList.push(...customClassList, attrs.backgroundColorClass, attrs.borderClass, attrs.borderRadiusClass, attrs.shadowClass);
        if (attrs.effects) mainDivClassList.push(attrs.effects);
        blockElement.className = mainDivClassList.filter(cls => cls).join(' ').trim();
        if (attrs.styleAttribute && !isFallback && !attrs.styleAttribute.includes('padding')) {
            blockElement.setAttribute('style', attrs.styleAttribute);
        }
        if (!isFallback && (hasPrimaryImage || hasVideoPrimary)) {
            blockElement.setAttribute('data-primary-position', attrs.primaryPosition);
        }
        if (!isFallback && attrs.sectionTitle && !attrs.buttonText) {
            blockElement.setAttribute('data-section-title', 'true');
        }
        if (isMediaOnly && !hasPrimaryImage && !hasVideoPrimary) {
            if (hasVideoBackground) {
                const videoMarkup = generateVideoMarkup({
                    src: attrs.videoBackgroundSrc,
                    lightSrc: attrs.videoBackgroundLightSrc,
                    darkSrc: attrs.videoBackgroundDarkSrc,
                    poster: attrs.videoBackgroundPoster,
                    lightPoster: attrs.videoBackgroundLightPoster,
                    darkPoster: attrs.videoBackgroundDarkPoster,
                    alt: attrs.videoBackgroundAlt,
                    customClasses: '',
                    extraClasses: [],
                    loading: attrs.videoBackgroundLoading,
                    autoplay: attrs.videoBackgroundAutoplay,
                    muted: attrs.videoBackgroundMuted,
                    loop: attrs.videoBackgroundLoop,
                    playsinline: attrs.videoBackgroundPlaysinline,
                    disablePip: attrs.videoBackgroundDisablePip,
                    preload: attrs.videoBackgroundLoading === 'lazy' ? 'metadata' : attrs.videoBackgroundLoading,
                    controls: false
                });
                console.log('Generated video markup length:', videoMarkup.length, 'Content preview:', videoMarkup.substring(0, 100));
                const videoDiv = document.createElement('div');
                videoDiv.innerHTML = videoMarkup;
                if (videoDiv.hasChildNodes()) {
                    blockElement.appendChild(videoDiv.firstChild);
                } else {
                    console.warn('Video markup empty—check sources:', { src: attrs.videoBackgroundSrc, lightSrc: attrs.videoBackgroundLightSrc, darkSrc: attrs.videoBackgroundDarkSrc });
                }
            } else if (hasBackgroundImage) {
                const src = attrs.backgroundSrc || attrs.backgroundLightSrc || attrs.backgroundDarkSrc;
                if (src) {
                    const pictureMarkup = generatePictureMarkup({
                        src: attrs.backgroundSrc,
                        lightSrc: attrs.backgroundLightSrc,
                        darkSrc: attrs.backgroundDarkSrc,
                        alt: attrs.backgroundAlt,
                        lightAlt: attrs.backgroundLightAlt,
                        darkAlt: attrs.backgroundDarkAlt,
                        isDecorative: attrs.backgroundIsDecorative,
                        customClasses: '',
                        loading: attrs.backgroundLoading,
                        fetchPriority: attrs.backgroundFetchPriority,
                        extraClasses: [],
                        mobileWidth: attrs.backgroundMobileWidth,
                        tabletWidth: attrs.backgroundTabletWidth,
                        desktopWidth: attrs.backgroundDesktopWidth,
                        aspectRatio: attrs.backgroundAspectRatio,
                        includeSchema: attrs.backgroundIncludeSchema,
                        extraStyles: attrs.backgroundPosition ? `object-position: ${attrs.backgroundPosition}; object-fit: cover;` : ''
                    });
                    const pictureDiv = document.createElement('div');
                    pictureDiv.innerHTML = pictureMarkup;
                    blockElement.appendChild(pictureDiv.firstChild);
                } else {
                    console.warn('No valid background image source provided for <custom-block>. Skipping background image rendering.');
                }
            }
            if (attrs.hasBackgroundOverlay && (hasBackgroundImage || hasVideoBackground)) {
                const overlayClasses = [attrs.backgroundOverlayClass];
                if (attrs.backgroundImageNoise) overlayClasses.push('background-image-noise');
                if (attrs.backgroundGradientClass) overlayClasses.push(attrs.backgroundGradientClass);
                const backdropFilterValues = attrs.backdropFilterClasses
                    .filter(cls => cls.startsWith('backdrop-filter'))
                    .map(cls => CustomBlock.BACKDROP_FILTER_MAP[cls] || '')
                    .filter(val => val);
                const filteredOverlayClasses = attrs.backdropFilterClasses
                    .filter(cls => !cls.startsWith('backdrop-filter'))
                    .concat(overlayClasses)
                    .filter(cls => cls);
                const overlayDiv = document.createElement('div');
                if (filteredOverlayClasses.length) overlayDiv.className = filteredOverlayClasses.join(' ').trim();
                if (backdropFilterValues.length) overlayDiv.style.backdropFilter = backdropFilterValues.join(' ');
                blockElement.appendChild(overlayDiv);
            }
            if (!isFallback && !blockElement.hasChildNodes()) {
                console.error('Media-only block has no valid content:', this.outerHTML);
                return this.render(true);
            }
            if (!isFallback) {
                CustomBlock.#renderCacheMap.set(this, blockElement.cloneNode(true));
                this.lastAttributes = newCriticalAttrsHash;
            }
            return blockElement;
        }
        if (isButtonOnly) {
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
            blockElement.appendChild(buttonElement);
            if (!isFallback) {
                CustomBlock.#renderCacheMap.set(this, blockElement.cloneNode(true));
                this.lastAttributes = newCriticalAttrsHash;
            }
            return blockElement;
        }
        let innerPaddingClasses = attrs.customClasses.split(' ').filter(cls => cls && paddingClasses.includes(cls));
        const innerDivClassList = [...innerPaddingClasses, ...attrs.innerCustomClasses.split(' ').filter(cls => cls)];
        if (attrs.customClasses.includes('space-between')) innerDivClassList.push('space-between');
        if (attrs.innerBackgroundColorClass) innerDivClassList.push(attrs.innerBackgroundColorClass);
        if (attrs.innerBackgroundImageNoise) innerDivClassList.push('background-image-noise');
        if (attrs.innerBorderClass) innerDivClassList.push(attrs.innerBorderClass);
        if (attrs.innerBorderRadiusClass) innerDivClassList.push(attrs.innerBorderRadiusClass);
        if (attrs.innerBackgroundOverlayClass) innerDivClassList.push(attrs.innerBackgroundOverlayClass);
        if (attrs.innerBackgroundGradientClass) innerDivClassList.push(attrs.innerBackgroundGradientClass);
        if (attrs.innerAlignment) innerDivClassList.push(alignMap[attrs.innerAlignment]);
        if (attrs.innerShadowClass) innerDivClassList.push(attrs.innerShadowClass);
        const innerBackdropFilterValues = attrs.innerBackdropFilterClasses
            .filter(cls => cls.startsWith('backdrop-filter'))
            .map(cls => CustomBlock.BACKDROP_FILTER_MAP[cls] || '')
            .filter(val => val);
        const filteredInnerBackdropClasses = attrs.innerBackdropFilterClasses
            .filter(cls => !cls.startsWith('backdrop-filter'));
        innerDivClassList.push(...filteredInnerBackdropClasses);
        const innerDiv = document.createElement('div');
        if (innerDivClassList.length) innerDiv.className = innerDivClassList.join(' ').trim();
        if (attrs.innerStyle || innerBackdropFilterValues.length) {
            const style = innerBackdropFilterValues.length ? `${attrs.innerStyle}; backdrop-filter: ${innerBackdropFilterValues.join(' ')}` : attrs.innerStyle;
            innerDiv.setAttribute('style', style);
        }
        innerDiv.setAttribute('aria-live', 'polite');
        const textAlignMap = {
            'left': 'flex-column-left text-align-left',
            'center': 'flex-column-center text-align-center',
            'right': 'flex-column-right text-align-right'
        };
        const groupDiv = document.createElement('div');
        groupDiv.setAttribute('role', 'group');
        if (attrs.textAlignment) groupDiv.className = textAlignMap[attrs.textAlignment];
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
        }
        if (attrs.text) {
            const textElement = document.createElement('p');
            textElement.textContent = attrs.text;
            groupDiv.appendChild(textElement);
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
        }
        innerDiv.appendChild(groupDiv);
        if (hasBackgroundImage || hasVideoBackground) {
            const mediaDiv = document.createElement('div');
            if (hasVideoBackground) {
                const video = document.createElement('video');
                video.id = `custom-video-${Math.random().toString(36).substring(2, 11)}`;
                if (attrs.videoBackgroundAutoplay) video.autoplay = true;
                if (attrs.videoBackgroundMuted || attrs.videoBackgroundAutoplay) video.muted = true;
                if (attrs.videoBackgroundLoop) video.loop = true;
                if (attrs.videoBackgroundPlaysinline) video.playsInline = true;
                if (attrs.videoBackgroundDisablePip) video.disablePictureInPicture = true;
                if (attrs.videoBackgroundPoster) video.poster = attrs.videoBackgroundPoster;
                video.preload = attrs.videoBackgroundLoading === 'lazy' ? 'metadata' : attrs.videoBackgroundLoading;
                video.loading = attrs.videoBackgroundLoading || 'lazy';
                video.title = attrs.videoBackgroundAlt;
                video.setAttribute('aria-label', attrs.videoBackgroundAlt);
                video.className = ''; // No leaks

                // Append sources manually (reliable)
                const sources = generateVideoSources({ src: attrs.videoBackgroundSrc, lightSrc: attrs.videoBackgroundLightSrc, darkSrc: attrs.videoBackgroundDarkSrc });
                sources.forEach(source => video.appendChild(source));

                // Fallback p
                const fallbackP = document.createElement('p');
                fallbackP.innerHTML = `Your browser does not support the video tag. <a href="${attrs.videoBackgroundSrc || ''}">Download video</a>`;
                video.appendChild(fallbackP);

                console.log('Appended video with sources:', sources.length);
                blockElement.appendChild(video);
            } else if (hasBackgroundImage) {
                const src = attrs.backgroundSrc || attrs.backgroundLightSrc || attrs.backgroundDarkSrc;
                if (src) {
                    const pictureMarkup = generatePictureMarkup({
                        src: attrs.backgroundSrc,
                        lightSrc: attrs.backgroundLightSrc,
                        darkSrc: attrs.backgroundDarkSrc,
                        alt: attrs.backgroundAlt,
                        lightAlt: attrs.backgroundLightAlt,
                        darkAlt: attrs.backgroundDarkAlt,
                        isDecorative: attrs.backgroundIsDecorative,
                        customClasses: '',
                        loading: attrs.backgroundLoading,
                        fetchPriority: attrs.backgroundFetchPriority,
                        extraClasses: [],
                        mobileWidth: attrs.backgroundMobileWidth,
                        tabletWidth: attrs.backgroundTabletWidth,
                        desktopWidth: attrs.backgroundDesktopWidth,
                        aspectRatio: attrs.backgroundAspectRatio,
                        includeSchema: attrs.backgroundIncludeSchema,
                        extraStyles: attrs.backgroundPosition ? `object-position: ${attrs.backgroundPosition}; object-fit: cover;` : ''
                    });
                    const pictureDiv = document.createElement('div');
                    pictureDiv.innerHTML = pictureMarkup;
                    blockElement.appendChild(pictureDiv.firstChild);
                } else {
                    console.warn('No valid background image source provided for <custom-block>. Skipping background image rendering.');
                }
            }
            if (attrs.hasBackgroundOverlay && (hasBackgroundImage || hasVideoBackground)) {
                const overlayClasses = [attrs.backgroundOverlayClass];
                if (attrs.backgroundImageNoise) overlayClasses.push('background-image-noise');
                if (attrs.backgroundGradientClass) overlayClasses.push(attrs.backgroundGradientClass);
                const backdropFilterValues = attrs.backdropFilterClasses
                    .filter(cls => cls.startsWith('backdrop-filter'))
                    .map(cls => CustomBlock.BACKDROP_FILTER_MAP[cls] || '')
                    .filter(val => val);
                const filteredOverlayClasses = attrs.backdropFilterClasses
                    .filter(cls => !cls.startsWith('backdrop-filter'))
                    .concat(overlayClasses)
                    .filter(cls => cls);
                const overlayDiv = document.createElement('div');
                if (filteredOverlayClasses.length) overlayDiv.className = filteredOverlayClasses.join(' ').trim();
                if (backdropFilterValues.length) overlayDiv.style.backdropFilter = backdropFilterValues.join(' ');
                blockElement.appendChild(overlayDiv);
            }
        }
        if ((hasPrimaryImage || hasVideoPrimary) && attrs.primaryPosition === 'top') {
            const mediaDiv = document.createElement('div');
            const src = attrs.primarySrc || attrs.primaryLightSrc || attrs.primaryDarkSrc || attrs.videoPrimarySrc || attrs.videoPrimaryLightSrc || attrs.videoPrimaryDarkSrc;
            if (src) {
                if (hasPrimaryImage) {
                    mediaDiv.innerHTML = generatePictureMarkup({
                        src: src,
                        lightSrc: attrs.primaryLightSrc || attrs.primarySrc,
                        darkSrc: attrs.primaryDarkSrc || attrs.primarySrc,
                        alt: attrs.primaryAlt,
                        isDecorative: attrs.primaryIsDecorative,
                        customClasses: '',
                        loading: attrs.primaryLoading,
                        fetchPriority: attrs.primaryFetchPriority,
                        extraClasses: [],
                        mobileWidth: attrs.primaryMobileWidth,
                        tabletWidth: attrs.primaryTabletWidth,
                        desktopWidth: attrs.primaryDesktopWidth,
                        aspectRatio: attrs.primaryAspectRatio,
                        includeSchema: attrs.primaryIncludeSchema
                    });
                    blockElement.appendChild(mediaDiv.firstChild);
                } else if (hasVideoPrimary) {
                    const videoMarkup = generateVideoMarkup({
                        src: attrs.videoPrimarySrc,
                        lightSrc: attrs.videoPrimaryLightSrc,
                        darkSrc: attrs.videoPrimaryDarkSrc,
                        poster: attrs.videoPrimaryPoster,
                        lightPoster: attrs.videoPrimaryLightPoster,
                        darkPoster: attrs.videoPrimaryDarkPoster,
                        alt: attrs.videoPrimaryAlt,
                        customClasses: '',
                        extraClasses: [],
                        loading: attrs.videoPrimaryLoading,
                        autoplay: attrs.videoPrimaryAutoplay,
                        muted: attrs.videoPrimaryMuted,
                        loop: attrs.videoPrimaryLoop,
                        playsinline: attrs.videoPrimaryPlaysinline,
                        disablePip: attrs.videoPrimaryDisablePip,
                        preload: attrs.videoPrimaryLoading === 'lazy' ? 'metadata' : attrs.videoPrimaryLoading,
                        controls: false
                    });
                    console.log('Generated primary video markup length:', videoMarkup.length, 'Content preview:', videoMarkup.substring(0, 100));
                    const videoDiv = document.createElement('div');
                    videoDiv.innerHTML = videoMarkup;
                    if (videoDiv.hasChildNodes()) {
                        blockElement.appendChild(videoDiv.firstChild);
                    } else {
                        console.warn('Primary video markup empty—check sources:', { src: attrs.videoPrimarySrc, lightSrc: attrs.videoPrimaryLightSrc, darkSrc: attrs.videoPrimaryDarkSrc });
                    }
                }
            } else {
                console.warn('No valid primary source provided for <custom-block>. Skipping primary rendering.');
            }
        }
        if ((hasPrimaryImage || hasVideoPrimary) && attrs.primaryPosition === 'left') {
            const mediaDiv = document.createElement('div');
            const src = attrs.primarySrc || attrs.primaryLightSrc || attrs.primaryDarkSrc || attrs.videoPrimarySrc || attrs.videoPrimaryLightSrc || attrs.videoPrimaryDarkSrc;
            if (src) {
                if (hasPrimaryImage) {
                    mediaDiv.innerHTML = generatePictureMarkup({
                        src: src,
                        lightSrc: attrs.primaryLightSrc || attrs.primarySrc,
                        darkSrc: attrs.primaryDarkSrc || attrs.primarySrc,
                        alt: attrs.primaryAlt,
                        isDecorative: attrs.primaryIsDecorative,
                        customClasses: '',
                        loading: attrs.primaryLoading,
                        fetchPriority: attrs.primaryFetchPriority,
                        extraClasses: [],
                        mobileWidth: attrs.primaryMobileWidth,
                        tabletWidth: attrs.primaryTabletWidth,
                        desktopWidth: attrs.primaryDesktopWidth,
                        aspectRatio: attrs.primaryAspectRatio,
                        includeSchema: attrs.primaryIncludeSchema
                    });
                    blockElement.appendChild(mediaDiv.firstChild);
                } else if (hasVideoPrimary) {
                    const videoMarkup = generateVideoMarkup({
                        src: attrs.videoPrimarySrc,
                        lightSrc: attrs.videoPrimaryLightSrc,
                        darkSrc: attrs.videoPrimaryDarkSrc,
                        poster: attrs.videoPrimaryPoster,
                        lightPoster: attrs.videoPrimaryLightPoster,
                        darkPoster: attrs.videoPrimaryDarkPoster,
                        alt: attrs.videoPrimaryAlt,
                        customClasses: '',
                        extraClasses: [],
                        loading: attrs.videoPrimaryLoading,
                        autoplay: attrs.videoPrimaryAutoplay,
                        muted: attrs.videoPrimaryMuted,
                        loop: attrs.videoPrimaryLoop,
                        playsinline: attrs.videoPrimaryPlaysinline,
                        disablePip: attrs.videoPrimaryDisablePip,
                        preload: attrs.videoPrimaryLoading === 'lazy' ? 'metadata' : attrs.videoPrimaryLoading,
                        controls: false
                    });
                    console.log('Generated primary video markup length:', videoMarkup.length, 'Content preview:', videoMarkup.substring(0, 100));
                    const videoDiv = document.createElement('div');
                    videoDiv.innerHTML = videoMarkup;
                    if (videoDiv.hasChildNodes()) {
                        blockElement.appendChild(videoDiv.firstChild);
                    } else {
                        console.warn('Primary video markup empty—check sources:', { src: attrs.videoPrimarySrc, lightSrc: attrs.videoPrimaryLightSrc, darkSrc: attrs.videoPrimaryDarkSrc });
                    }
                }
            } else {
                console.warn('No valid primary source provided for <custom-block>. Skipping primary rendering.');
            }
            blockElement.appendChild(innerDiv);
        } else if ((hasPrimaryImage || hasVideoPrimary) && attrs.primaryPosition === 'right') {
            blockElement.appendChild(innerDiv);
            const mediaDiv = document.createElement('div');
            const src = attrs.primarySrc || attrs.primaryLightSrc || attrs.primaryDarkSrc || attrs.videoPrimarySrc || attrs.videoPrimaryLightSrc || attrs.videoPrimaryDarkSrc;
            if (src) {
                if (hasPrimaryImage) {
                    mediaDiv.innerHTML = generatePictureMarkup({
                        src: src,
                        lightSrc: attrs.primaryLightSrc || attrs.primarySrc,
                        darkSrc: attrs.primaryDarkSrc || attrs.primarySrc,
                        alt: attrs.primaryAlt,
                        isDecorative: attrs.primaryIsDecorative,
                        customClasses: '',
                        loading: attrs.primaryLoading,
                        fetchPriority: attrs.primaryFetchPriority,
                        extraClasses: [],
                        mobileWidth: attrs.primaryMobileWidth,
                        tabletWidth: attrs.primaryTabletWidth,
                        desktopWidth: attrs.primaryDesktopWidth,
                        aspectRatio: attrs.primaryAspectRatio,
                        includeSchema: attrs.primaryIncludeSchema
                    });
                    blockElement.appendChild(mediaDiv.firstChild);
                } else if (hasVideoPrimary) {
                    const videoMarkup = generateVideoMarkup({
                        src: attrs.videoPrimarySrc,
                        lightSrc: attrs.videoPrimaryLightSrc,
                        darkSrc: attrs.videoPrimaryDarkSrc,
                        poster: attrs.videoPrimaryPoster,
                        lightPoster: attrs.videoPrimaryLightPoster,
                        darkPoster: attrs.videoPrimaryDarkPoster,
                        alt: attrs.videoPrimaryAlt,
                        customClasses: '',
                        extraClasses: [],
                        loading: attrs.videoPrimaryLoading,
                        autoplay: attrs.videoPrimaryAutoplay,
                        muted: attrs.videoPrimaryMuted,
                        loop: attrs.videoPrimaryLoop,
                        playsinline: attrs.videoPrimaryPlaysinline,
                        disablePip: attrs.videoPrimaryDisablePip,
                        preload: attrs.videoPrimaryLoading === 'lazy' ? 'metadata' : attrs.videoPrimaryLoading,
                        controls: false
                    });
                    console.log('Generated primary video markup length:', videoMarkup.length, 'Content preview:', videoMarkup.substring(0, 100));
                    const videoDiv = document.createElement('div');
                    videoDiv.innerHTML = videoMarkup;
                    if (videoDiv.hasChildNodes()) {
                        blockElement.appendChild(mediaDiv.firstChild);
                    } else {
                        console.warn('Primary video markup empty—check sources:', { src: attrs.videoPrimarySrc, lightSrc: attrs.videoPrimaryLightSrc, darkSrc: attrs.videoPrimaryDarkSrc });
                    }
                }
            } else {
                console.warn('No valid primary source provided for <custom-block>. Skipping primary rendering.');
            }
        } else {
            blockElement.appendChild(innerDiv);
        }
        if ((hasPrimaryImage || hasVideoPrimary) && attrs.primaryPosition === 'bottom') {
            const mediaDiv = document.createElement('div');
            const src = attrs.primarySrc || attrs.primaryLightSrc || attrs.primaryDarkSrc || attrs.videoPrimarySrc || attrs.videoPrimaryLightSrc || attrs.videoPrimaryDarkSrc;
            if (src) {
                if (hasPrimaryImage) {
                    mediaDiv.innerHTML = generatePictureMarkup({
                        src: src,
                        lightSrc: attrs.primaryLightSrc || attrs.primarySrc,
                        darkSrc: attrs.primaryDarkSrc || attrs.primarySrc,
                        alt: attrs.primaryAlt,
                        isDecorative: attrs.primaryIsDecorative,
                        customClasses: '',
                        loading: attrs.primaryLoading,
                        fetchPriority: attrs.primaryFetchPriority,
                        extraClasses: [],
                        mobileWidth: attrs.primaryMobileWidth,
                        tabletWidth: attrs.primaryTabletWidth,
                        desktopWidth: attrs.primaryDesktopWidth,
                        aspectRatio: attrs.primaryAspectRatio,
                        includeSchema: attrs.primaryIncludeSchema
                    });
                    blockElement.appendChild(mediaDiv.firstChild);
                } else if (hasVideoPrimary) {
                    const videoMarkup = generateVideoMarkup({
                        src: attrs.videoPrimarySrc,
                        lightSrc: attrs.videoPrimaryLightSrc,
                        darkSrc: attrs.videoPrimaryDarkSrc,
                        poster: attrs.videoPrimaryPoster,
                        lightPoster: attrs.videoPrimaryLightPoster,
                        darkPoster: attrs.videoPrimaryDarkPoster,
                        alt: attrs.videoPrimaryAlt,
                        customClasses: '',
                        extraClasses: [],
                        loading: attrs.videoPrimaryLoading,
                        autoplay: attrs.videoPrimaryAutoplay,
                        muted: attrs.videoPrimaryMuted,
                        loop: attrs.videoPrimaryLoop,
                        playsinline: attrs.videoPrimaryPlaysinline,
                        disablePip: attrs.videoPrimaryDisablePip,
                        preload: attrs.videoPrimaryLoading === 'lazy' ? 'metadata' : attrs.videoPrimaryLoading,
                        controls: false
                    });
                    console.log('Generated primary video markup length:', videoMarkup.length, 'Content preview:', videoMarkup.substring(0, 100));
                    const videoDiv = document.createElement('div');
                    videoDiv.innerHTML = videoMarkup;
                    if (videoDiv.hasChildNodes()) {
                        blockElement.appendChild(mediaDiv.firstChild);
                    } else {
                        console.warn('Primary video markup empty—check sources:', { src: attrs.videoPrimarySrc, lightSrc: attrs.videoPrimaryLightSrc, darkSrc: attrs.videoPrimaryDarkSrc });
                    }
                }
            } else {
                console.warn('No valid primary source provided for <custom-block>. Skipping primary rendering.');
            }
        }
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
            console.error('Block has no valid content, falling back:', this.outerHTML);
            return this.render(true);
        }
        if (!isFallback) {
            CustomBlock.#renderCacheMap.set(this, blockElement.cloneNode(true));
            this.lastAttributes = newCriticalAttrsHash;
        }
        return blockElement;
    }

    static get observedAttributes() {
        return [
            'backdrop-filter', 'background-color', 'background-gradient', 'background-image-noise', 'background-overlay',
            'border', 'border-radius', 'button-aria-label', 'button-class', 'button-href', 'button-icon',
            'button-icon-offset', 'button-icon-position', 'button-icon-size', 'button-rel', 'button-style',
            'button-target', 'button-text', 'button-type', 'class', 'effects', 'heading', 'heading-tag',
            'icon', 'icon-class', 'icon-size', 'icon-style', 'img-background-alt', 'img-background-aspect-ratio',
            'img-background-dark-src', 'img-background-decorative', 'img-background-desktop-width',
            'img-background-fetchpriority', 'img-background-light-src', 'img-background-loading',
            'img-background-mobile-width', 'img-background-position', 'img-background-src',
            'img-background-tablet-width', 'img-primary-alt', 'img-primary-aspect-ratio', 'img-primary-dark-src',
            'img-primary-decorative', 'img-primary-desktop-width', 'img-primary-fetchpriority',
            'img-primary-light-src', 'img-primary-loading', 'img-primary-mobile-width', 'img-primary-position',
            'img-primary-src', 'img-primary-tablet-width', 'inner-alignment', 'inner-backdrop-filter',
            'inner-background-color', 'inner-background-gradient', 'inner-background-image-noise',
            'inner-background-overlay', 'inner-border', 'inner-border-radius', 'inner-class', 'inner-shadow',
            'inner-style', 'section-title', 'style', 'sub-heading', 'sub-heading-tag', 'text', 'text-alignment',
            'video-background-alt', 'video-background-autoplay', 'video-background-dark-poster',
            'video-background-dark-src', 'video-background-disable-pip', 'video-background-light-poster',
            'video-background-light-src', 'video-background-loading', 'video-background-loop',
            'video-background-muted', 'video-background-playsinline', 'video-background-poster',
            'video-background-src', 'video-primary-alt', 'video-primary-autoplay', 'video-primary-dark-poster',
            'video-primary-dark-src', 'video-primary-disable-pip', 'video-primary-light-poster',
            'video-primary-light-src', 'video-primary-loading', 'video-primary-loop', 'video-primary-muted',
            'video-primary-playsinline', 'video-primary-poster', 'video-primary-src'
        ];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (!this.isInitialized || !this.isVisible) return;
        if (CustomBlock.#criticalAttributes.includes(name)) {
            this.cachedAttributes = null;
            this.initialize();
        }
    }
}

try {
    customElements.define('custom-block', CustomBlock);
} catch (error) {
    console.error('Error defining CustomBlock element:', error);
}
export { CustomBlock };
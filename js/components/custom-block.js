import { generatePictureMarkup } from '../picture-generator.js';

class CustomBlock extends HTMLElement {
    constructor() {
        super();
        this.isVisible = false;
        this.isInitialized = false;
        this.callbacks = [];
        this.renderCache = null;
        this.lastAttributes = null;
        this.observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                this.isVisible = true;
                this.observer.disconnect();
                this.observer = null;
                this.initialize();
            }
        }, { rootMargin: '50px' });
        this.observer.observe(this);
    }

    getAttributes() {
        const backgroundFetchPriority = this.getAttribute('custom-img-background-fetchpriority') || '';
        const foregroundFetchPriority = this.getAttribute('custom-img-foreground-fetchpriority') || '';
        const validFetchPriorities = ['high', 'low', 'auto', ''];
        if (!validFetchPriorities.includes(backgroundFetchPriority)) {
            console.warn(`Invalid custom-img-background-fetchpriority value "${backgroundFetchPriority}" in <custom-block>. Using default.`);
        }
        if (!validFetchPriorities.includes(foregroundFetchPriority)) {
            console.warn(`Invalid custom-img-foreground-fetchpriority value "${foregroundFetchPriority}" in <custom-block>. Using default.`);
        }

        const foregroundPosition = this.getAttribute('custom-img-foreground-position') || 'none';
        const validPositions = ['none', 'above', 'below', 'left', 'right'];
        if (!validPositions.includes(foregroundPosition)) {
            console.warn(`Invalid custom-img-foreground-position value "${foregroundPosition}" in <custom-block>. Using default 'none'.`);
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

        const backdropFilterClasses = this.getAttribute('backdrop-filter')?.split(' ').filter(cls => cls) || [];
        const innerBackdropFilterClasses = this.getAttribute('inner-backdrop-filter')?.split(' ').filter(cls => cls) || [];

        const headingTag = this.getAttribute('heading-tag') || 'h2';
        const validHeadingTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
        if (!validHeadingTags.includes(headingTag.toLowerCase())) {
            console.warn(`Invalid heading-tag value "${headingTag}" in <custom-block>. Must be one of ${validHeadingTags.join(', ')}. Using default 'h2'.`);
        }

        const innerAlign = this.getAttribute('inner-align') || '';
        const validAlignments = [
            'center', 'top', 'bottom', 'left', 'right',
            'top-left', 'top-center', 'top-right',
            'bottom-left', 'bottom-center', 'bottom-right',
            'center-left', 'center-right'
        ];
        if (innerAlign && !validAlignments.includes(innerAlign)) {
            console.warn(`Invalid inner-align value "${innerAlign}" in <custom-block>. Must be one of ${validAlignments.join(', ')}. Ignoring alignment.`);
        }

        const innerTextAlign = this.getAttribute('inner-text-align') || '';
        const validTextAlignments = ['left', 'center', 'right'];
        if (innerTextAlign && !validTextAlignments.includes(innerTextAlign)) {
            console.warn(`Invalid inner-text-align value "${innerTextAlign}" in <custom-block>. Must be one of ${validTextAlignments.join(', ')}. Ignoring text alignment.`);
        }

        return {
            sectionTitle: this.hasAttribute('section-title'),
            heading: this.getAttribute('heading') || 'Default Heading',
            headingTag: validHeadingTags.includes(headingTag.toLowerCase()) ? headingTag.toLowerCase() : 'h2',
            description: this.getAttribute('description') || 'Default description text.',
            buttonHref: this.getAttribute('button-href') || '#',
            buttonText: this.getAttribute('button-text') || '',
            hasBackgroundOverlay: !!backgroundOverlay,
            backgroundOverlayClass,
            innerBackgroundOverlayClass,
            backgroundImageNoise: this.hasAttribute('background-image-noise'),
            backdropFilterClasses,
            backgroundColorClass: this.hasAttribute('background-color') ? this.getAttribute('background-color') : '',
            borderClass: this.hasAttribute('border') ? this.getAttribute('border') : '',
            borderRadiusClass: this.hasAttribute('border-radius') && this.hasAttribute('border') ? this.getAttribute('border-radius') : '',
            customClasses: this.getAttribute('class') || '',
            styleAttribute: this.getAttribute('style') || '',
            backgroundLightSrc: this.getAttribute('custom-img-background-light-src') || '',
            backgroundDarkSrc: this.getAttribute('custom-img-background-dark-src') || '',
            backgroundAlt: this.getAttribute('custom-img-background-alt') || '',
            backgroundIsDecorative: this.hasAttribute('custom-img-background-decorative'),
            backgroundMobileWidth: this.getAttribute('custom-img-background-mobile-width') || '100vw',
            backgroundTabletWidth: this.getAttribute('custom-img-background-tablet-width') || '100vw',
            backgroundDesktopWidth: this.getAttribute('custom-img-background-desktop-width') || '100vw',
            backgroundAspectRatio: this.getAttribute('custom-img-background-aspect-ratio') || '',
            backgroundIncludeSchema: this.hasAttribute('custom-img-background-include-schema'),
            backgroundFetchPriority: validFetchPriorities.includes(backgroundFetchPriority) ? backgroundFetchPriority : '',
            backgroundLoading: this.getAttribute('custom-img-background-loading') || 'lazy',
            foregroundLightSrc: this.getAttribute('custom-img-foreground-light-src') || '',
            foregroundDarkSrc: this.getAttribute('custom-img-foreground-dark-src') || '',
            foregroundAlt: this.getAttribute('custom-img-foreground-alt') || '',
            foregroundIsDecorative: this.hasAttribute('custom-img-foreground-decorative'),
            foregroundMobileWidth: this.getAttribute('custom-img-foreground-mobile-width') || '100vw',
            foregroundTabletWidth: this.getAttribute('custom-img-foreground-tablet-width') || '100vw',
            foregroundDesktopWidth: this.getAttribute('custom-img-foreground-desktop-width') || '100vw',
            foregroundAspectRatio: this.getAttribute('custom-img-foreground-aspect-ratio') || '',
            foregroundIncludeSchema: this.hasAttribute('custom-img-foreground-include-schema'),
            foregroundFetchPriority: validFetchPriorities.includes(foregroundFetchPriority) ? foregroundFetchPriority : '',
            foregroundLoading: this.getAttribute('custom-img-foreground-loading') || 'lazy',
            foregroundPosition: validPositions.includes(foregroundPosition) ? foregroundPosition : 'none',
            videoBackgroundSrc: this.getAttribute('custom-video-background-src') || '', // For video support
            innerBackgroundColorClass: this.hasAttribute('inner-background-color') ? this.getAttribute('inner-background-color') : '',
            innerBackgroundImageNoise: this.hasAttribute('inner-background-image-noise'),
            innerBackdropFilterClasses,
            innerBorderClass: this.hasAttribute('inner-border') ? this.getAttribute('inner-border') : '',
            innerBorderRadiusClass: this.hasAttribute('inner-border-radius') && this.hasAttribute('inner-border') ? this.getAttribute('inner-border-radius') : '',
            innerStyle: this.getAttribute('inner-style') || '',
            innerAlign: innerAlign && validAlignments.includes(innerAlign) ? innerAlign : '',
            innerTextAlign: innerTextAlign && validTextAlignments.includes(innerTextAlign) ? innerTextAlign : ''
        };
    }

    initialize() {
        if (this.isInitialized || !this.isVisible) return;
        console.log('** CustomBlock start...', this.outerHTML);
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
        console.log('** CustomBlock end...');
    }

    connectedCallback() {
        if (this.isVisible) {
            this.initialize();
        }
    }

    disconnectedCallback() {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
        this.callbacks = [];
        this.renderCache = null;
    }

    addCallback(callback) {
        this.callbacks.push(callback);
    }

    render(isFallback = false) {
        if (!isFallback) {
            const attrString = JSON.stringify(this.getAttributes());
            if (this.renderCache && this.lastAttributes === attrString) {
                console.log('Using cached render for CustomBlock:', this.outerHTML);
                return this.renderCache.cloneNode(true);
            }
        }

        const attrs = isFallback ? {
            sectionTitle: false,
            heading: 'Error',
            headingTag: 'h2',
            description: 'Failed to render block. Check console for details.',
            buttonHref: '#',
            buttonText: '',
            hasBackgroundOverlay: false,
            backgroundOverlayClass: '',
            innerBackgroundOverlayClass: '',
            backgroundImageNoise: false,
            backdropFilterClasses: [],
            backgroundColorClass: '',
            borderClass: '',
            borderRadiusClass: '',
            customClasses: '',
            styleAttribute: '',
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
            foregroundLightSrc: '',
            foregroundDarkSrc: '',
            foregroundAlt: '',
            foregroundIsDecorative: false,
            foregroundMobileWidth: '100vw',
            foregroundTabletWidth: '100vw',
            foregroundDesktopWidth: '100vw',
            foregroundAspectRatio: '',
            foregroundIncludeSchema: false,
            foregroundFetchPriority: '',
            foregroundLoading: 'lazy',
            foregroundPosition: 'none',
            videoBackgroundSrc: '',
            innerBackgroundColorClass: '',
            innerBackgroundImageNoise: false,
            innerBackdropFilterClasses: [],
            innerBorderClass: '',
            innerBorderRadiusClass: '',
            innerStyle: '',
            innerAlign: '',
            innerTextAlign: ''
        } : this.getAttributes();

        console.log('Rendering CustomBlock with attrs:', attrs);

        if (!attrs.backgroundAlt && !attrs.backgroundIsDecorative && (attrs.backgroundLightSrc || attrs.backgroundDarkSrc)) {
            console.warn(`<custom-block custom-img-background-light-src="${attrs.backgroundLightSrc || 'not provided'}" custom-img-background-dark-src="${attrs.backgroundDarkSrc || 'not provided'}"> is missing a custom-img-background-alt attribute for accessibility.`);
        }
        if (!attrs.foregroundAlt && !attrs.foregroundIsDecorative && (attrs.foregroundLightSrc || attrs.foregroundDarkSrc)) {
            console.warn(`<custom-block custom-img-foreground-light-src="${attrs.foregroundLightSrc || 'not provided'}" custom-img-foreground-dark-src="${attrs.foregroundDarkSrc || 'not provided'}"> is missing a custom-img-foreground-alt attribute for accessibility.`);
        }

        let backgroundContentHTML = '';
        let foregroundImageHTML = '';
        let overlayHTML = '';
        const hasBackgroundImage = !isFallback && !!(attrs.backgroundLightSrc || attrs.backgroundDarkSrc);
        const hasVideoBackground = !isFallback && !!attrs.videoBackgroundSrc;
        const hasForegroundImage = !isFallback && !!(attrs.foregroundLightSrc || attrs.foregroundDarkSrc) && ['above', 'below', 'left', 'right'].includes(attrs.foregroundPosition);

        // Check if only image or video-related attributes are provided
        const isMediaOnly = !isFallback &&
            !this.hasAttribute('heading') &&
            !this.hasAttribute('description') &&
            !this.hasAttribute('button-text') &&
            (hasBackgroundImage || hasVideoBackground);

        // Filter out padding classes for media markup
        const paddingClasses = ['padding-small', 'padding-medium', 'padding-large'];
        const mediaCustomClasses = attrs.customClasses.split(' ').filter(cls => cls && !paddingClasses.includes(cls)).join(' ');

        if (hasBackgroundImage) {
            const src = attrs.backgroundLightSrc || attrs.backgroundDarkSrc;
            if (!src) {
                console.warn('No valid background image source provided for <custom-block>. Skipping background image rendering.');
            } else {
                backgroundContentHTML = generatePictureMarkup({
                    src,
                    lightSrc: attrs.backgroundLightSrc,
                    darkSrc: attrs.backgroundDarkSrc,
                    alt: attrs.backgroundAlt,
                    isDecorative: attrs.backgroundIsDecorative,
                    mobileWidth: attrs.backgroundMobileWidth,
                    tabletWidth: attrs.backgroundTabletWidth,
                    desktopWidth: attrs.backgroundDesktopWidth,
                    aspectRatio: attrs.backgroundAspectRatio,
                    includeSchema: attrs.backgroundIncludeSchema,
                    customClasses: isMediaOnly ? attrs.customClasses : mediaCustomClasses,
                    loading: attrs.backgroundLoading,
                    fetchPriority: attrs.backgroundFetchPriority,
                    onerror: `this.src='https://placehold.co/3000x2000';${attrs.backgroundIsDecorative ? '' : `this.alt='${attrs.backgroundAlt || 'Placeholder image'}';`}this.onerror=null;`
                });
                if (!backgroundContentHTML || backgroundContentHTML.trim() === '') {
                    console.error('generatePictureMarkup returned invalid or empty HTML for background image.');
                }
            }
        } else if (hasVideoBackground) {
            // Placeholder for video support (assuming generateVideoMarkup is defined elsewhere)
            try {
                const generateVideoMarkup = typeof window.generateVideoMarkup === 'function' ? window.generateVideoMarkup : null;
                if (generateVideoMarkup) {
                    backgroundContentHTML = generateVideoMarkup({
                        src: attrs.videoBackgroundSrc,
                        customClasses: isMediaOnly ? attrs.customClasses : mediaCustomClasses,
                        controls: true,
                        preload: 'metadata'
                    });
                } else {
                    console.error('generateVideoMarkup is not defined. Using fallback image.');
                    backgroundContentHTML = `<img src="https://placehold.co/3000x2000" alt="Video placeholder" class="${isMediaOnly ? attrs.customClasses : mediaCustomClasses}">`;
                }
            } catch (error) {
                console.error('Error generating video markup:', error);
                backgroundContentHTML = `<img src="https://placehold.co/3000x2000" alt="Video fallback" class="${isMediaOnly ? attrs.customClasses : mediaCustomClasses}">`;
            }
        }

        if (hasForegroundImage) {
            const src = attrs.foregroundLightSrc || attrs.foregroundDarkSrc;
            if (!src) {
                console.warn('No valid foreground image source provided for <custom-block>. Skipping foreground image rendering.');
            } else {
                foregroundImageHTML = generatePictureMarkup({
                    src,
                    lightSrc: attrs.foregroundLightSrc,
                    darkSrc: attrs.foregroundDarkSrc,
                    alt: attrs.foregroundAlt,
                    isDecorative: attrs.foregroundIsDecorative,
                    mobileWidth: attrs.foregroundMobileWidth,
                    tabletWidth: attrs.foregroundTabletWidth,
                    desktopWidth: attrs.foregroundDesktopWidth,
                    aspectRatio: attrs.foregroundAspectRatio,
                    includeSchema: attrs.foregroundIncludeSchema,
                    customClasses: mediaCustomClasses,
                    loading: attrs.foregroundLoading,
                    fetchPriority: attrs.foregroundFetchPriority,
                    onerror: `this.src='https://placehold.co/3000x2000';${attrs.foregroundIsDecorative ? '' : `this.alt='${attrs.foregroundAlt || 'Placeholder image'}';`}this.onerror=null;`
                });
                if (!foregroundImageHTML || foregroundImageHTML.trim() === '') {
                    console.error('generatePictureMarkup returned invalid or empty HTML for foreground image.');
                }
            }
        }

        if (!isFallback && attrs.hasBackgroundOverlay && (hasBackgroundImage || hasVideoBackground)) {
            const overlayClasses = [attrs.backgroundOverlayClass];
            if (attrs.backgroundImageNoise) {
                overlayClasses.push('background-image-noise');
            }
            overlayClasses.push(...attrs.backdropFilterClasses);
            const overlayClassString = overlayClasses.filter(cls => cls).join(' ').trim();
            overlayHTML = `<div class="${overlayClassString}"></div>`;
        }

        // If media-only mode, return just the background content with optional overlay
        if (isMediaOnly && !hasForegroundImage) {
            const blockElement = document.createElement('div');
            blockElement.className = ['block', hasBackgroundImage ? 'background-image' : 'background-video', attrs.backgroundColorClass, attrs.borderClass, attrs.borderRadiusClass].filter(cls => cls).join(' ').trim();
            if (attrs.styleAttribute && !isFallback) {
                blockElement.setAttribute('style', attrs.styleAttribute);
            }
            if (!isFallback && attrs.sectionTitle) {
                blockElement.setAttribute('data-section-title', 'true');
            }

            let innerHTML = backgroundContentHTML || '';
            if (attrs.hasBackgroundOverlay && (hasBackgroundImage || hasVideoBackground)) {
                innerHTML += overlayHTML;
            }

            blockElement.innerHTML = innerHTML;

            if (!isFallback && (attrs.backgroundIncludeSchema && hasBackgroundImage) && backgroundContentHTML) {
                const figure = blockElement.querySelector('figure:not(figure > figure)');
                if (figure) {
                    const metaUrl = document.createElement('meta');
                    metaUrl.setAttribute('itemprop', 'url');
                    metaUrl.setAttribute('content', (attrs.backgroundLightSrc || attrs.backgroundDarkSrc) ? new URL(attrs.backgroundLightSrc || attrs.backgroundDarkSrc, window.location.origin).href : '');
                    figure.appendChild(metaUrl);

                    const metaDescription = document.createElement('meta');
                    metaDescription.setAttribute('itemprop', 'description');
                    metaDescription.setAttribute('content', attrs.backgroundAlt);
                    figure.appendChild(metaDescription);
                }
            }

            if (!isFallback && !blockElement.innerHTML.trim()) {
                console.error('Media-only block has no valid content:', this.outerHTML);
                return this.render(true);
            }

            if (!isFallback) {
                this.renderCache = blockElement.cloneNode(true);
                this.lastAttributes = JSON.stringify(attrs);
            }
            return blockElement;
        }

        const customClassList = attrs.customClasses.split(' ').filter(cls => cls && !paddingClasses.includes(cls));
        const innerPaddingClasses = attrs.customClasses.split(' ').filter(cls => cls && paddingClasses.includes(cls));

        let outerStyles = attrs.styleAttribute || '';
        let paddingStyles = '';
        if (!isFallback && outerStyles) {
            const paddingRegex = /(padding[^:]*:[^;]+;)/gi;
            const paddingMatches = outerStyles.match(paddingRegex) || [];
            paddingStyles = paddingMatches.join(' ').trim();
            outerStyles = outerStyles.replace(paddingRegex, '').trim();
        }

        const alignMap = {
            'center': 'place-self-center',
            'top': 'place-self-top',
            'bottom': 'place-self-bottom',
            'left': 'place-self-left',
            'right': 'place-self-right',
            'top-left': 'place-self-top-left',
            'top-center': 'place-self-top-center',
            'top-right': 'place-self-top-right',
            'bottom-left': 'place-self-bottom-left',
            'bottom-center': 'place-self-bottom-center',
            'bottom-right': 'place-self-bottom-right',
            'center-left': 'place-self-center-left',
            'center-right': 'place-self-center-right'
        };

        const textAlignMap = {
            'left': 'flex-column-left text-align-left',
            'center': 'flex-column-center text-align-center',
            'right': 'flex-column-right text-align-right'
        };

        const innerDivClassList = [];
        if (!isFallback) {
            innerDivClassList.push(...innerPaddingClasses);
            if (attrs.customClasses.includes('space-between')) innerDivClassList.push('space-between');
            if (attrs.innerBackgroundColorClass) innerDivClassList.push(attrs.innerBackgroundColorClass);
            if (attrs.innerBackgroundImageNoise) innerDivClassList.push('background-image-noise');
            if (attrs.innerBorderClass) innerDivClassList.push(attrs.innerBorderClass);
            if (attrs.innerBorderRadiusClass) innerDivClassList.push(attrs.innerBorderRadiusClass);
            if (attrs.innerBackgroundOverlayClass) innerDivClassList.push(attrs.innerBackgroundOverlayClass);
            innerDivClassList.push(...attrs.innerBackdropFilterClasses);
            if (attrs.innerAlign) innerDivClassList.push(alignMap[attrs.innerAlign]);
            if (attrs.innerTextAlign) innerDivClassList.push(textAlignMap[attrs.innerTextAlign].split(' ')[0]);
        }

        const innerDivClass = innerDivClassList.join(' ').trim();

        let innerDivStyle = '';
        if (!isFallback && attrs.innerStyle) {
            innerDivStyle = ` style="${attrs.innerStyle}"`;
        }

        const buttonHTML = attrs.buttonText ?
            `<a class="button" href="${attrs.buttonHref || '#'}"${attrs.buttonHref && !isFallback ? '' : ' aria-disabled="true"'}>${attrs.buttonText}</a>` :
            '';

        const contentHTML = `
        <div${innerDivClass ? ` class="${innerDivClass}"` : ''}${innerDivStyle} aria-live="polite">
            <div role="group"${attrs.innerTextAlign ? ` class="${textAlignMap[attrs.innerTextAlign].split(' ')[1]}"` : ''}>
                <${attrs.headingTag}>${attrs.heading}</${attrs.headingTag}>
                <p>${attrs.description}</p>
            </div>
            ${buttonHTML}
        </div>
    `;

        const mainDivClassList = ['block'];
        if (hasBackgroundImage) mainDivClassList.push('background-image');
        else if (hasVideoBackground) mainDivClassList.push('background-video');
        mainDivClassList.push(...customClassList, attrs.backgroundColorClass, attrs.borderClass, attrs.borderRadiusClass);
        const mainDivClass = mainDivClassList.filter(cls => cls).join(' ').trim();

        const blockElement = document.createElement('div');
        blockElement.className = mainDivClass;
        if (outerStyles && !isFallback) {
            blockElement.setAttribute('style', outerStyles);
        }
        if (!isFallback && hasForegroundImage) {
            blockElement.setAttribute('data-foreground-position', attrs.foregroundPosition);
        }
        if (!isFallback && attrs.sectionTitle) {
            blockElement.setAttribute('data-section-title', 'true');
        }

        let innerHTML = '';
        if (hasBackgroundImage || hasVideoBackground) {
            innerHTML += backgroundContentHTML || '';
        }
        if (attrs.hasBackgroundOverlay && (hasBackgroundImage || hasVideoBackground)) {
            innerHTML += overlayHTML;
        }
        if (hasForegroundImage && attrs.foregroundPosition === 'above') {
            innerHTML += foregroundImageHTML || '';
        }
        if (hasForegroundImage && attrs.foregroundPosition === 'left') {
            innerHTML += (foregroundImageHTML || '') + contentHTML;
        } else if (hasForegroundImage && attrs.foregroundPosition === 'right') {
            innerHTML += contentHTML + (foregroundImageHTML || '');
        } else {
            innerHTML += contentHTML;
        }
        if (hasForegroundImage && attrs.foregroundPosition === 'below') {
            innerHTML += foregroundImageHTML || '';
        }

        blockElement.innerHTML = innerHTML;

        if (!isFallback && attrs.backgroundIncludeSchema && hasBackgroundImage && backgroundContentHTML) {
            const figure = blockElement.querySelector('figure:not(figure > figure)');
            if (figure) {
                const metaUrl = document.createElement('meta');
                metaUrl.setAttribute('itemprop', 'url');
                metaUrl.setAttribute('content', (attrs.backgroundLightSrc || attrs.backgroundDarkSrc) ? new URL(attrs.backgroundLightSrc || attrs.backgroundDarkSrc, window.location.origin).href : '');
                figure.appendChild(metaUrl);

                const metaDescription = document.createElement('meta');
                metaDescription.setAttribute('itemprop', 'description');
                metaDescription.setAttribute('content', attrs.backgroundAlt);
                figure.appendChild(metaDescription);
            }
        }

        if (!isFallback && attrs.foregroundIncludeSchema && hasForegroundImage && foregroundImageHTML) {
            const figure = blockElement.querySelector('figure:not(figure > figure):last-child');
            if (figure) {
                const metaUrl = document.createElement('meta');
                metaUrl.setAttribute('itemprop', 'url');
                metaUrl.setAttribute('content', (attrs.foregroundLightSrc || attrs.foregroundDarkSrc) ? new URL(attrs.foregroundLightSrc || attrs.foregroundDarkSrc, window.location.origin).href : '');
                figure.appendChild(metaUrl);

                const metaDescription = document.createElement('meta');
                metaDescription.setAttribute('itemprop', 'description');
                metaDescription.setAttribute('content', attrs.foregroundAlt);
                figure.appendChild(metaDescription);
            }
        }

        if (!isFallback && blockElement.querySelector('img')) {
            const images = blockElement.querySelectorAll('img');
            images.forEach(img => {
                img.removeAttribute('custom-img-background-light-src');
                img.removeAttribute('custom-img-background-dark-src');
                img.removeAttribute('custom-img-background-alt');
                img.removeAttribute('custom-img-background-decorative');
                img.removeAttribute('custom-img-background-mobile-width');
                img.removeAttribute('custom-img-background-tablet-width');
                img.removeAttribute('custom-img-background-desktop-width');
                img.removeAttribute('custom-img-background-aspect-ratio');
                img.removeAttribute('custom-img-background-include-schema');
                img.removeAttribute('custom-img-background-fetchpriority');
                img.removeAttribute('custom-img-background-loading');
                img.removeAttribute('custom-img-foreground-light-src');
                img.removeAttribute('custom-img-foreground-dark-src');
                img.removeAttribute('custom-img-foreground-alt');
                img.removeAttribute('custom-img-foreground-decorative');
                img.removeAttribute('custom-img-foreground-mobile-width');
                img.removeAttribute('custom-img-foreground-tablet-width');
                img.removeAttribute('custom-img-foreground-desktop-width');
                img.removeAttribute('custom-img-foreground-aspect-ratio');
                img.removeAttribute('custom-img-foreground-include-schema');
                img.removeAttribute('custom-img-foreground-fetchpriority');
                img.removeAttribute('custom-img-foreground-loading');
                img.removeAttribute('custom-img-foreground-position');
            });
        }

        if (!isFallback && !blockElement.innerHTML.trim()) {
            console.error('Block has no valid content, falling back:', this.outerHTML);
            return this.render(true);
        }

        if (!isFallback) {
            this.renderCache = blockElement.cloneNode(true);
            this.lastAttributes = JSON.stringify(attrs);
        }
        return blockElement;
    }

    static get observedAttributes() {
        return [
            'section-title',
            'heading',
            'heading-tag',
            'description',
            'button-href',
            'button-text',
            'background-overlay',
            'inner-background-overlay',
            'background-image-noise',
            'backdrop-filter',
            'background-color',
            'border',
            'border-radius',
            'class',
            'style',
            'custom-img-background-light-src',
            'custom-img-background-dark-src',
            'custom-img-background-alt',
            'custom-img-background-decorative',
            'custom-img-background-mobile-width',
            'custom-img-background-tablet-width',
            'custom-img-background-desktop-width',
            'custom-img-background-aspect-ratio',
            'custom-img-background-include-schema',
            'custom-img-background-fetchpriority',
            'custom-img-background-loading',
            'custom-img-foreground-light-src',
            'custom-img-foreground-dark-src',
            'custom-img-foreground-alt',
            'custom-img-foreground-decorative',
            'custom-img-foreground-mobile-width',
            'custom-img-foreground-tablet-width',
            'custom-img-foreground-desktop-width',
            'custom-img-foreground-aspect-ratio',
            'custom-img-foreground-include-schema',
            'custom-img-foreground-fetchpriority',
            'custom-img-foreground-loading',
            'custom-img-foreground-position',
            'custom-video-background-src', // For video support
            'inner-background-color',
            'inner-background-image-noise',
            'inner-border',
            'inner-border-radius',
            'inner-backdrop-filter',
            'inner-style',
            'inner-align',
            'inner-text-align'
        ];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (!this.isInitialized || !this.isVisible) return;
        const criticalAttributes = [
            'section-title',
            'heading',
            'heading-tag',
            'description',
            'button-href',
            'button-text',
            'background-overlay',
            'inner-background-overlay',
            'background-image-noise',
            'backdrop-filter',
            'custom-img-background-light-src',
            'custom-img-background-dark-src',
            'custom-img-background-alt',
            'custom-img-foreground-light-src',
            'custom-img-foreground-dark-src',
            'custom-img-foreground-alt',
            'custom-img-foreground-position',
            'custom-video-background-src',
            'style',
            'inner-background-color',
            'inner-background-image-noise',
            'inner-border',
            'inner-border-radius',
            'inner-backdrop-filter',
            'inner-style',
            'inner-align',
            'inner-text-align'
        ];
        if (criticalAttributes.includes(name)) {
            this.initialize();
        }
    }
}

try {
    customElements.define('custom-block', CustomBlock);
} catch (error) {
    console.error('Error defining CustomBlock element:', error);
}
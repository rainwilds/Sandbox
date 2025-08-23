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

    generatePictureMarkup({ src, lightSrc, darkSrc, alt, isDecorative, customClasses, loading, fetchPriority, extraClasses, primaryPosition }) {
        const classList = [customClasses, ...extraClasses].filter(cls => cls).join(' ').trim();
        const sources = [];
        if (lightSrc) sources.push(`<source srcset="${lightSrc}" media="(prefers-color-scheme: light)">`);
        if (darkSrc) sources.push(`<source srcset="${darkSrc}" media="(prefers-color-scheme: dark)">`);
        if (src) sources.push(`<source srcset="${src}">`);
        return `
            <picture${primaryPosition === 'top' ? ' style="grid-row: 1;"' : primaryPosition === 'bottom' ? ' style="grid-row: 2;"' : ''}>
                ${sources.join('')}
                <img src="${src || lightSrc || darkSrc || 'https://placehold.co/3000x2000'}" 
                     alt="${isDecorative ? '' : alt || 'Placeholder image'}" 
                     loading="${loading || 'lazy'}" 
                     ${fetchPriority ? `fetchpriority="${fetchPriority}"` : ''} 
                     class="${classList}" 
                     onerror="this.src='https://placehold.co/3000x2000';${isDecorative ? '' : `this.alt='${alt || 'Placeholder image'}';`}this.onerror=null;">
            </picture>
        `;
    }

    generateVideoMarkup({ src, lightSrc, darkSrc, poster, lightPoster, darkPoster, alt, customClasses, extraClasses, loading, autoplay, muted, loop, playsinline, disablePip, preload, controls, primaryPosition }) {
        const classList = [customClasses, ...extraClasses].filter(cls => cls).join(' ').trim();
        const validExtensions = ['mp4', 'webm'];

        const addSourcesHTML = (videoSrc, mediaQuery) => {
            if (!videoSrc) return '';
            const ext = videoSrc.split('.').pop()?.toLowerCase();
            if (!ext || !validExtensions.includes(ext)) {
                console.warn(`Invalid video file extension: ${videoSrc}`);
                return '';
            }
            const baseSrc = videoSrc.slice(0, -(ext.length + 1));
            const mediaAttr = mediaQuery ? ` media="${mediaQuery}"` : '';
            return `
                <source src="${baseSrc}.webm" type="video/webm"${mediaAttr}>
                <source src="${baseSrc}.mp4" type="video/mp4"${mediaAttr}>
            `;
        };

        let innerHTML = '';
        if (lightSrc) innerHTML += addSourcesHTML(lightSrc, '(prefers-color-scheme: light)');
        if (darkSrc) innerHTML += addSourcesHTML(darkSrc, '(prefers-color-scheme: dark)');
        const defaultSrc = lightSrc || darkSrc || src;
        innerHTML += addSourcesHTML(defaultSrc);
        innerHTML += `<p>Your browser does not support the video tag. <a href="${defaultSrc}">Download video</a></p>`;

        const posterAttr = poster ? `poster="${poster}"` : '';
        const isMuted = autoplay || muted ? 'muted' : '';

        return `
            <video 
                id="{VIDEO_ID_PLACEHOLDER}" 
                ${autoplay ? 'autoplay' : ''} 
                ${isMuted} 
                ${loop ? 'loop' : ''} 
                ${playsinline ? 'playsinline' : ''} 
                ${disablePip ? 'disablepictureinpicture' : ''} 
                ${controls ? 'controls' : ''} 
                preload="${preload || 'metadata'}" 
                loading="${loading || 'lazy'}" 
                class="${classList}"
                title="${alt}" 
                aria-label="${alt}"
                ${posterAttr}${primaryPosition === 'top' ? ' style="grid-row: 1;"' : primaryPosition === 'bottom' ? ' style="grid-row: 2;"' : ''}>
                ${innerHTML}
            </video>
        `;
    }

    getAttributes() {
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
        // Map legacy values for backward compatibility
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
        const validHeadingTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
        if (!validHeadingTags.includes(headingTag.toLowerCase())) {
            console.warn(`Invalid heading-tag value "${headingTag}" in <custom-block>. Must be one of ${validHeadingTags.join(', ')}. Using default 'h2'.`);
        }
        const innerAlignment = this.getAttribute('inner-alignment') || '';
        const validAlignments = [
            'center', 'top', 'bottom', 'left', 'right',
            'top-left', 'top-center', 'top-right',
            'bottom-left', 'bottom-center', 'bottom-right',
            'center-left', 'center-right'
        ];
        if (innerAlignment && !validAlignments.includes(innerAlignment)) {
            console.warn(`Invalid inner-alignment value "${innerAlignment}" in <custom-block>. Must be one of ${validAlignments.join(', ')}. Ignoring alignment.`);
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

        return {
            sectionTitle: this.hasAttribute('heading'),
            heading: this.getAttribute('heading') || 'Default Heading',
            headingTag: validHeadingTags.includes(headingTag.toLowerCase()) ? headingTag.toLowerCase() : 'h2',
            text: this.getAttribute('text') || 'Default description text.',
            buttonHref: this.getAttribute('button-href') || '#',
            buttonText: this.getAttribute('button-text') || 'Button',
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
            backgroundSrc: backgroundSrc || (backgroundLightSrc && backgroundDarkSrc ? '' : null),
            backgroundLightSrc: backgroundLightSrc,
            backgroundDarkSrc: backgroundDarkSrc,
            backgroundAlt: this.getAttribute('img-background-alt') || '',
            backgroundIsDecorative: this.hasAttribute('img-background-decorative'),
            backgroundMobileWidth: this.getAttribute('img-background-mobile-width') || '100vw',
            backgroundTabletWidth: this.getAttribute('img-background-tablet-width') || '100vw',
            backgroundDesktopWidth: this.getAttribute('img-background-desktop-width') || '100vw',
            backgroundAspectRatio: this.getAttribute('img-background-aspect-ratio') || '',
            backgroundIncludeSchema: this.hasAttribute('img-background-include-schema'),
            backgroundFetchPriority: validFetchPriorities.includes(backgroundFetchPriority) ? backgroundFetchPriority : '',
            backgroundLoading: this.getAttribute('img-background-loading') || 'lazy',
            primarySrc: primarySrc || (primaryLightSrc && primaryDarkSrc ? '' : null),
            primaryLightSrc: primaryLightSrc,
            primaryDarkSrc: primaryDarkSrc,
            primaryAlt: this.getAttribute('img-primary-alt') || '',
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
            innerBackgroundColorClass,
            innerBackgroundImageNoise: this.hasAttribute('inner-background-image-noise'),
            innerBackdropFilterClasses,
            innerBorderClass: this.getAttribute('inner-border') || '',
            innerBorderRadiusClass: this.hasAttribute('inner-border') && this.hasAttribute('inner-border-radius') ? this.getAttribute('inner-border-radius') : '',
            innerStyle: this.getAttribute('inner-style') || '',
            innerAlignment: innerAlignment && validAlignments.includes(innerAlignment) ? innerAlignment : '',
            textAlignment: textAlignment && validTextAlignments.includes(textAlignment) ? textAlignment : '',
            shadowClass,
            innerShadowClass
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
            heading: 'Default Heading',
            headingTag: 'h2',
            text: 'Default description text.',
            buttonHref: '#',
            buttonText: 'Button',
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

        console.log('Rendering CustomBlock with attrs:', attrs);

        if (!attrs.backgroundAlt && !attrs.backgroundIsDecorative && (attrs.backgroundSrc || attrs.backgroundLightSrc || attrs.backgroundDarkSrc)) {
            console.error(`<custom-block img-background-src="${attrs.backgroundSrc || 'not provided'}" img-background-light-src="${attrs.backgroundLightSrc || 'not provided'}" img-background-dark-src="${attrs.backgroundDarkSrc || 'not provided'}"> requires an img-background-alt attribute for accessibility unless img-background-decorative is present.`);
        }

        if (!attrs.primaryAlt && !attrs.primaryIsDecorative && (attrs.primarySrc || attrs.primaryLightSrc || attrs.primaryDarkSrc)) {
            console.error(`<custom-block img-primary-src="${attrs.primarySrc || 'not provided'}" img-primary-light-src="${attrs.primaryLightSrc || 'not provided'}" img-primary-dark-src="${attrs.primaryDarkSrc || 'not provided'}"> requires an img-primary-alt attribute for accessibility unless img-primary-decorative is present.`);
        }

        let backgroundContentHTML = '';
        let primaryImageHTML = '';
        let overlayHTML = '';
        const hasVideoBackground = !isFallback && !!(attrs.videoBackgroundSrc || attrs.videoBackgroundLightSrc || attrs.videoBackgroundDarkSrc);
        const hasBackgroundImage = !isFallback && !!(attrs.backgroundSrc || attrs.backgroundLightSrc || attrs.backgroundDarkSrc) && !hasVideoBackground;
        const hasPrimaryImage = !isFallback && !!(attrs.primarySrc || attrs.primaryLightSrc || attrs.primaryDarkSrc) && ['top', 'bottom', 'left', 'right'].includes(attrs.primaryPosition);
        const hasVideoPrimary = !isFallback && !!(attrs.videoPrimarySrc || attrs.videoPrimaryLightSrc || attrs.videoPrimaryDarkSrc) && ['top', 'bottom', 'left', 'right'].includes(attrs.primaryPosition);

        const isMediaOnly = !isFallback &&
            !this.hasAttribute('heading') &&
            !this.hasAttribute('text') &&
            !this.hasAttribute('button-text') &&
            (hasBackgroundImage || hasVideoBackground || hasVideoPrimary);

        const paddingClasses = ['padding-small', 'padding-medium', 'padding-large'];
        const mediaCustomClasses = attrs.customClasses.split(' ').filter(cls => cls && !paddingClasses.includes(cls)).join(' ');
        const innerCustomClassesList = attrs.innerCustomClasses.split(' ').filter(cls => cls);

        if (hasVideoBackground) {
            const videoId = 'custom-video-' + Math.random().toString(36).substring(2, 11);
            let videoMarkup = this.generateVideoMarkup({
                src: attrs.videoBackgroundSrc,
                lightSrc: attrs.videoBackgroundLightSrc,
                darkSrc: attrs.videoBackgroundDarkSrc,
                poster: attrs.videoBackgroundPoster,
                lightPoster: attrs.videoBackgroundLightPoster,
                darkPoster: attrs.videoBackgroundDarkPoster,
                alt: attrs.videoBackgroundAlt,
                customClasses: isMediaOnly ? attrs.customClasses : mediaCustomClasses,
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
            videoMarkup = videoMarkup.replace('{VIDEO_ID_PLACEHOLDER}', videoId);
            backgroundContentHTML = videoMarkup;

            if (attrs.videoBackgroundLightPoster || attrs.videoBackgroundDarkPoster || attrs.videoBackgroundLightSrc || attrs.videoBackgroundDarkSrc) {
                const scriptContent = `
                    (function() {
                        const video = document.getElementById('${videoId}');
                        if (!video) return;
                        const lightPoster = '${attrs.videoBackgroundLightPoster || attrs.videoBackgroundPoster || ''}';
                        const darkPoster = '${attrs.videoBackgroundDarkPoster || attrs.videoBackgroundPoster || ''}';
                        const lightSrc = '${attrs.videoBackgroundLightSrc || ''}';
                        const darkSrc = '${attrs.videoBackgroundDarkSrc || ''}';
                        const defaultSrc = '${attrs.videoBackgroundSrc || attrs.videoBackgroundLightSrc || attrs.videoBackgroundDarkSrc || ''}';
                        const prefersDarkQuery = window.matchMedia('(prefers-color-scheme: dark)');
                        const validExtensions = ['mp4', 'webm'];
                        function addSources(video, videoSrc, mediaQuery) {
                            if (!videoSrc) return;
                            const ext = videoSrc.split('.').pop().toLowerCase();
                            if (!validExtensions.includes(ext)) return;
                            const baseSrc = videoSrc.slice(0, -(ext.length + 1));
                            const mediaAttr = mediaQuery ? \` media="\${mediaQuery}"\` : '';
                            const webmSource = document.createElement('source');
                            webmSource.src = \`\${baseSrc}.webm\`;
                            webmSource.type = 'video/webm';
                            if (mediaQuery) webmSource.media = mediaQuery;
                            video.appendChild(webmSource);
                            const mp4Source = document.createElement('source');
                            mp4Source.src = \`\${baseSrc}.mp4\`;
                            mp4Source.type = 'video/mp4';
                            if (mediaQuery) mp4Source.media = mediaQuery;
                            video.appendChild(mp4Source);
                        }
                        function updateVideo() {
                            const prefersDark = prefersDarkQuery.matches;
                            const newPoster = prefersDark ? darkPoster : lightPoster;
                            if (newPoster && video.poster !== newPoster) {
                                video.poster = newPoster;
                            }
                            const activeSrc = prefersDark ? (darkSrc || lightSrc) : (lightSrc || darkSrc);
                            if (activeSrc && video.currentSrc.indexOf(activeSrc) === -1) {
                                const wasPlaying = !video.paused;
                                const currentTime = video.currentTime;
                                while (video.firstChild) {
                                    video.removeChild(video.firstChild);
                                }
                                if (lightSrc) addSources(video, lightSrc, '(prefers-color-scheme: light)');
                                if (darkSrc) addSources(video, darkSrc, '(prefers-color-scheme: dark)');
                                addSources(video, defaultSrc);
                                const fallbackP = document.createElement('p');
                                fallbackP.innerHTML = \`Your browser does not support the video tag. <a href="\${defaultSrc}">Download video</a>\`;
                                video.appendChild(fallbackP);
                                video.load();
                                video.currentTime = currentTime;
                                if (wasPlaying) video.play().catch(() => console.warn('Auto-play failed after theme change'));
                            }
                        }
                        updateVideo();
                        prefersDarkQuery.addEventListener('change', updateVideo);
                        if ('${attrs.videoBackgroundLoading}' === 'lazy' && ${attrs.videoBackgroundAutoplay}) {
                            const observer = new IntersectionObserver((entries) => {
                                if (entries[0].isIntersecting) {
                                    video.play().catch(() => console.warn('Auto-play failed on lazy load'));
                                    observer.disconnect();
                                }
                            });
                            observer.observe(video);
                        }
                        video.addEventListener('error', () => {
                            console.warn(\`Video source "\${video.currentSrc}" failed to load.\`);
                        });
                    })();
                `;
                backgroundContentHTML += `<script>${scriptContent}</script>`;
            }
        } else if (hasBackgroundImage) {
            const src = attrs.backgroundSrc || attrs.backgroundLightSrc || attrs.backgroundDarkSrc;
            if (!src) {
                console.warn('No valid background image source provided for <custom-block>. Skipping background image rendering.');
            } else {
                backgroundContentHTML = this.generatePictureMarkup({
                    src: src,
                    lightSrc: attrs.backgroundLightSrc || attrs.backgroundSrc,
                    darkSrc: attrs.backgroundDarkSrc || attrs.backgroundSrc,
                    alt: attrs.backgroundAlt,
                    isDecorative: attrs.backgroundIsDecorative,
                    customClasses: isMediaOnly ? attrs.customClasses : mediaCustomClasses,
                    loading: attrs.backgroundLoading,
                    fetchPriority: attrs.backgroundFetchPriority,
                    extraClasses: [],
                    primaryPosition: attrs.primaryPosition
                });
            }
        }
        if (hasPrimaryImage || hasVideoPrimary) {
            const src = attrs.primarySrc || attrs.primaryLightSrc || attrs.primaryDarkSrc || attrs.videoPrimarySrc || attrs.videoPrimaryLightSrc || attrs.videoPrimaryDarkSrc;
            if (!src) {
                console.warn('No valid primary source provided for <custom-block>. Skipping primary rendering.');
            } else if (hasPrimaryImage) {
                primaryImageHTML = this.generatePictureMarkup({
                    src: src,
                    lightSrc: attrs.primaryLightSrc || attrs.primarySrc,
                    darkSrc: attrs.primaryDarkSrc || attrs.primarySrc,
                    alt: attrs.primaryAlt,
                    isDecorative: attrs.primaryIsDecorative,
                    customClasses: mediaCustomClasses,
                    loading: attrs.primaryLoading,
                    fetchPriority: attrs.primaryFetchPriority,
                    extraClasses: [],
                    primaryPosition: attrs.primaryPosition
                });
            } else if (hasVideoPrimary) {
                const videoId = 'custom-video-' + Math.random().toString(36).substring(2, 11);
                let videoMarkup = this.generateVideoMarkup({
                    src: attrs.videoPrimarySrc,
                    lightSrc: attrs.videoPrimaryLightSrc,
                    darkSrc: attrs.videoPrimaryDarkSrc,
                    poster: attrs.videoPrimaryPoster,
                    lightPoster: attrs.videoPrimaryLightPoster,
                    darkPoster: attrs.videoPrimaryDarkPoster,
                    alt: attrs.videoPrimaryAlt,
                    customClasses: mediaCustomClasses,
                    extraClasses: [],
                    loading: attrs.videoPrimaryLoading,
                    autoplay: attrs.videoPrimaryAutoplay,
                    muted: attrs.videoPrimaryMuted,
                    loop: attrs.videoPrimaryLoop,
                    playsinline: attrs.videoPrimaryPlaysinline,
                    disablePip: attrs.videoPrimaryDisablePip,
                    preload: attrs.videoPrimaryLoading === 'lazy' ? 'metadata' : attrs.videoPrimaryLoading,
                    controls: false,
                    primaryPosition: attrs.primaryPosition
                });
                videoMarkup = videoMarkup.replace('{VIDEO_ID_PLACEHOLDER}', videoId);
                primaryImageHTML = videoMarkup;

                if (attrs.videoPrimaryLightPoster || attrs.videoPrimaryDarkPoster || attrs.videoPrimaryLightSrc || attrs.videoPrimaryDarkSrc) {
                    const scriptContent = `
                        (function() {
                            const video = document.getElementById('${videoId}');
                            if (!video) return;
                            const lightPoster = '${attrs.videoPrimaryLightPoster || attrs.videoPrimaryPoster || ''}';
                            const darkPoster = '${attrs.videoPrimaryDarkPoster || attrs.videoPrimaryPoster || ''}';
                            const lightSrc = '${attrs.videoPrimaryLightSrc || ''}';
                            const darkSrc = '${attrs.videoPrimaryDarkSrc || ''}';
                            const defaultSrc = '${attrs.videoPrimarySrc || attrs.videoPrimaryLightSrc || attrs.videoPrimaryDarkSrc || ''}';
                            const prefersDarkQuery = window.matchMedia('(prefers-color-scheme: dark)');
                            const validExtensions = ['mp4', 'webm'];
                            function addSources(video, videoSrc, mediaQuery) {
                                if (!videoSrc) return;
                                const ext = videoSrc.split('.').pop().toLowerCase();
                                if (!validExtensions.includes(ext)) return;
                                const baseSrc = videoSrc.slice(0, -(ext.length + 1));
                                const mediaAttr = mediaQuery ? \` media="\${mediaQuery}"\` : '';
                                const webmSource = document.createElement('source');
                                webmSource.src = \`\${baseSrc}.webm\`;
                                webmSource.type = 'video/webm';
                                if (mediaQuery) webmSource.media = mediaQuery;
                                video.appendChild(webmSource);
                                const mp4Source = document.createElement('source');
                                mp4Source.src = \`\${baseSrc}.mp4\`;
                                mp4Source.type = 'video/mp4';
                                if (mediaQuery) mp4Source.media = mediaQuery;
                                video.appendChild(mp4Source);
                            }
                            function updateVideo() {
                                const prefersDark = prefersDarkQuery.matches;
                                const newPoster = prefersDark ? darkPoster : lightPoster;
                                if (newPoster && video.poster !== newPoster) {
                                    video.poster = newPoster;
                                }
                                const activeSrc = prefersDark ? (darkSrc || lightSrc) : (lightSrc || darkSrc);
                                if (activeSrc && video.currentSrc.indexOf(activeSrc) === -1) {
                                    const wasPlaying = !video.paused;
                                    const currentTime = video.currentTime;
                                    while (video.firstChild) {
                                        video.removeChild(video.firstChild);
                                    }
                                    if (lightSrc) addSources(video, lightSrc, '(prefers-color-scheme: light)');
                                    if (darkSrc) addSources(video, darkSrc, '(prefers-color-scheme: dark)');
                                    addSources(video, defaultSrc);
                                    const fallbackP = document.createElement('p');
                                    fallbackP.innerHTML = \`Your browser does not support the video tag. <a href="\${defaultSrc}">Download video</a>\`;
                                    video.appendChild(fallbackP);
                                    video.load();
                                    video.currentTime = currentTime;
                                    if (wasPlaying) video.play().catch(() => console.warn('Auto-play failed after theme change'));
                                }
                            }
                            updateVideo();
                            prefersDarkQuery.addEventListener('change', updateVideo);
                            if ('${attrs.videoPrimaryLoading}' === 'lazy' && ${attrs.videoPrimaryAutoplay}) {
                                const observer = new IntersectionObserver((entries) => {
                                    if (entries[0].isIntersecting) {
                                        video.play().catch(() => console.warn('Auto-play failed on lazy load'));
                                        observer.disconnect();
                                    }
                                });
                                observer.observe(video);
                            }
                            video.addEventListener('error', () => {
                                console.warn(\`Video source "\${video.currentSrc}" failed to load.\`);
                            });
                        })();
                    `;
                    primaryImageHTML += `<script>${scriptContent}</script>`;
                }
            }
        }
        if (!isFallback && attrs.hasBackgroundOverlay && (hasBackgroundImage || hasVideoBackground)) {
            const overlayClasses = [attrs.backgroundOverlayClass];
            if (attrs.backgroundImageNoise) {
                overlayClasses.push('background-image-noise');
            }
            if (attrs.backgroundGradientClass) {
                overlayClasses.push(attrs.backgroundGradientClass);
            }
            overlayClasses.push(...attrs.backdropFilterClasses);
            const overlayClassString = overlayClasses.filter(cls => cls).join(' ').trim();
            overlayHTML = `<div class="${overlayClassString}"></div>`;
        }
        if (isMediaOnly && !hasPrimaryImage && !hasVideoPrimary) {
            const blockElement = document.createElement('div');
            blockElement.className = ['block', hasBackgroundImage ? 'background-image' : 'background-video', attrs.backgroundColorClass, attrs.borderClass, attrs.borderRadiusClass, attrs.shadowClass].filter(cls => cls).join(' ').trim();
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
            innerDivClassList.push(...innerPaddingClasses, ...innerCustomClassesList);
            if (attrs.customClasses.includes('space-between')) innerDivClassList.push('space-between');
            if (attrs.innerBackgroundColorClass) innerDivClassList.push(attrs.innerBackgroundColorClass);
            if (attrs.innerBackgroundImageNoise) innerDivClassList.push('background-image-noise');
            if (attrs.innerBorderClass) innerDivClassList.push(attrs.innerBorderClass);
            if (attrs.innerBorderRadiusClass) innerDivClassList.push(attrs.innerBorderRadiusClass);
            if (attrs.innerBackgroundOverlayClass) innerDivClassList.push(attrs.innerBackgroundOverlayClass);
            if (attrs.innerBackgroundGradientClass) innerDivClassList.push(attrs.innerBackgroundGradientClass);
            innerDivClassList.push(...attrs.innerBackdropFilterClasses);
            if (attrs.innerAlignment) innerDivClassList.push(alignMap[attrs.innerAlignment]);
            if (attrs.innerShadowClass) innerDivClassList.push(attrs.innerShadowClass);
        }
        const innerDivClass = innerDivClassList.join(' ').trim();
        let innerDivStyle = '';
        if (!isFallback) {
            let gridRowStyle = '';
            if (attrs.primaryPosition === 'left' || attrs.primaryPosition === 'right') {
                gridRowStyle = 'grid-row: 1;';
            } else if (attrs.primaryPosition === 'top' || attrs.primaryPosition === 'bottom') {
                gridRowStyle = 'grid-row: 2;';
            }
            innerDivStyle = attrs.innerStyle ? `${attrs.innerStyle};${gridRowStyle}` : gridRowStyle;
        }
        const buttonHTML = attrs.buttonText ?
            `<a class="button" href="${attrs.buttonHref || '#'}"${attrs.buttonHref && !isFallback ? '' : ' aria-disabled="true"'}>${attrs.buttonText}</a>` :
            '';
        const contentHTML = `
        <div${innerDivClass ? ` class="${innerDivClass}"` : ''}${innerDivStyle ? ` style="${innerDivStyle}"` : ''} aria-live="polite">
            <div role="group"${attrs.textAlignment ? ` class="${textAlignMap[attrs.textAlignment]}"` : ''}>
                <${attrs.headingTag}>${attrs.heading}</${attrs.headingTag}>
                <p>${attrs.text}</p>
                ${buttonHTML}
            </div>
        </div>
    `;
        const mainDivClassList = ['block'];
        if (hasBackgroundImage) mainDivClassList.push('background-image');
        else if (hasVideoBackground || hasVideoPrimary) mainDivClassList.push('background-video');
        mainDivClassList.push(...customClassList, attrs.backgroundColorClass, attrs.borderClass, attrs.borderRadiusClass, attrs.shadowClass);
        const mainDivClass = mainDivClassList.filter(cls => cls).join(' ').trim();
        const blockElement = document.createElement('div');
        blockElement.className = mainDivClass;
        if (outerStyles && !isFallback) {
            blockElement.setAttribute('style', outerStyles);
        }
        if (!isFallback && (hasPrimaryImage || hasVideoPrimary)) {
            blockElement.setAttribute('data-primary-position', attrs.primaryPosition);
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
        if ((hasPrimaryImage || hasVideoPrimary) && attrs.primaryPosition === 'top') {
            innerHTML += primaryImageHTML || '';
        }
        if ((hasPrimaryImage || hasVideoPrimary) && attrs.primaryPosition === 'left') {
            innerHTML += (primaryImageHTML || '') + contentHTML;
        } else if ((hasPrimaryImage || hasVideoPrimary) && attrs.primaryPosition === 'right') {
            innerHTML += contentHTML + (primaryImageHTML || '');
        } else {
            innerHTML += contentHTML;
        }
        if ((hasPrimaryImage || hasVideoPrimary) && attrs.primaryPosition === 'bottom') {
            innerHTML += primaryImageHTML || '';
        }
        blockElement.innerHTML = innerHTML;
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
            'text',
            'button-href',
            'button-text',
            'background-overlay',
            'inner-background-overlay',
            'background-gradient',
            'inner-background-gradient',
            'background-image-noise',
            'backdrop-filter',
            'background-color',
            'border',
            'border-radius',
            'class',
            'style',
            'img-background-src',
            'img-background-light-src',
            'img-background-dark-src',
            'img-background-alt',
            'img-background-decorative',
            'img-background-mobile-width',
            'img-background-tablet-width',
            'img-background-desktop-width',
            'img-background-aspect-ratio',
            'img-background-include-schema',
            'img-background-fetchpriority',
            'img-background-loading',
            'img-primary-src',
            'img-primary-light-src',
            'img-primary-dark-src',
            'img-primary-alt',
            'img-primary-decorative',
            'img-primary-mobile-width',
            'img-primary-tablet-width',
            'img-primary-desktop-width',
            'img-primary-aspect-ratio',
            'img-primary-include-schema',
            'img-primary-fetchpriority',
            'img-primary-loading',
            'img-primary-position',
            'video-background-src',
            'video-background-light-src',
            'video-background-dark-src',
            'video-background-poster',
            'video-background-light-poster',
            'video-background-dark-poster',
            'video-background-alt',
            'video-background-loading',
            'video-background-autoplay',
            'video-background-muted',
            'video-background-loop',
            'video-background-playsinline',
            'video-background-disable-pip',
            'video-primary-src',
            'video-primary-light-src',
            'video-primary-dark-src',
            'video-primary-poster',
            'video-primary-light-poster',
            'video-primary-dark-poster',
            'video-primary-alt',
            'video-primary-loading',
            'video-primary-autoplay',
            'video-primary-muted',
            'video-primary-loop',
            'video-primary-playsinline',
            'video-primary-disable-pip',
            'inner-background-color',
            'inner-background-image-noise',
            'inner-border',
            'inner-border-radius',
            'inner-backdrop-filter',
            'inner-style',
            'inner-alignment',
            'text-alignment',
            'inner-class',
            'shadow',
            'inner-shadow'
        ];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (!this.isInitialized || !this.isVisible) return;
        const criticalAttributes = [
            'section-title',
            'heading',
            'heading-tag',
            'text',
            'button-href',
            'button-text',
            'background-overlay',
            'inner-background-overlay',
            'background-gradient',
            'inner-background-gradient',
            'background-image-noise',
            'backdrop-filter',
            'img-background-src',
            'img-background-light-src',
            'img-background-dark-src',
            'img-background-alt',
            'img-primary-src',
            'img-primary-light-src',
            'img-primary-dark-src',
            'img-primary-alt',
            'img-primary-position',
            'video-background-src',
            'video-background-light-src',
            'video-background-dark-src',
            'video-background-poster',
            'video-background-light-poster',
            'video-background-dark-poster',
            'video-background-alt',
            'video-background-loading',
            'video-background-autoplay',
            'video-background-muted',
            'video-background-loop',
            'video-background-playsinline',
            'video-background-disable-pip',
            'video-primary-src',
            'video-primary-light-src',
            'video-primary-dark-src',
            'video-primary-poster',
            'video-primary-light-poster',
            'video-primary-dark-poster',
            'video-primary-alt',
            'video-primary-loading',
            'video-primary-autoplay',
            'video-primary-muted',
            'video-primary-loop',
            'video-primary-playsinline',
            'video-primary-disable-pip',
            'style',
            'inner-background-color',
            'inner-background-image-noise',
            'inner-border',
            'inner-border-radius',
            'inner-backdrop-filter',
            'inner-style',
            'inner-alignment',
            'text-alignment',
            'inner-class',
            'shadow',
            'inner-shadow'
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

console.log('CustomBlock version: 2025-08-22');
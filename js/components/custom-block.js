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

    generatePictureMarkup({ src, lightSrc, darkSrc, alt, isDecorative, customClasses, loading, fetchPriority, extraClasses }) {
        const classList = [customClasses, ...extraClasses].filter(cls => cls).join(' ').trim();
        const sources = [];
        if (lightSrc) sources.push(`<source srcset="${lightSrc}" media="(prefers-color-scheme: light)">`);
        if (darkSrc) sources.push(`<source srcset="${darkSrc}" media="(prefers-color-scheme: dark)">`);
        if (src) sources.push(`<source srcset="${src}">`);
        return `
            <picture>
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

    generateVideoMarkup({ src, lightSrc, darkSrc, poster, lightPoster, darkPoster, alt, customClasses, extraClasses, loading, autoplay, muted, loop, playsinline, disablepictureinpicture, preload, controls }) {
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

        return `
            <video 
                id="{VIDEO_ID_PLACEHOLDER}" 
                ${autoplay ? 'autoplay' : ''} 
                ${muted ? 'muted' : ''} 
                ${loop ? 'loop' : ''} 
                ${playsinline ? 'playsinline' : ''} 
                ${disablepictureinpicture ? 'disablepictureinpicture' : ''} 
                ${controls ? 'controls' : ''} 
                preload="${preload || 'metadata'}" 
                loading="${loading || 'lazy'}" 
                class="${classList}"
                title="${alt}" 
                aria-label="${alt}"
                ${posterAttr}>
                ${innerHTML}
            </video>
        `;
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
            backgroundGradientClass,
            innerBackgroundGradientClass,
            backgroundImageNoise: this.hasAttribute('background-image-noise'),
            backdropFilterClasses,
            backgroundColorClass: this.getAttribute('background-color') || '',
            borderClass: this.getAttribute('border') || '',
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
            videoBackgroundSrc: this.getAttribute('custom-video-background-src') || '',
            videoBackgroundLightSrc: this.getAttribute('custom-video-background-light-src') || '',
            videoBackgroundDarkSrc: this.getAttribute('custom-video-background-dark-src') || '',
            videoBackgroundPoster: this.getAttribute('custom-video-background-poster') || '',
            videoBackgroundLightPoster: this.getAttribute('custom-video-background-light-poster') || '',
            videoBackgroundDarkPoster: this.getAttribute('custom-video-background-dark-poster') || '',
            videoBackgroundAlt: this.getAttribute('custom-video-background-alt') || 'Video content',
            videoBackgroundLoading: this.getAttribute('custom-video-background-loading') || 'lazy',
            videoBackgroundAutoplay: this.getAttribute('custom-video-background-autoplay') !== 'false',
            videoBackgroundMuted: this.getAttribute('custom-video-background-muted') !== 'false',
            videoBackgroundLoop: this.getAttribute('custom-video-background-loop') !== 'false',
            videoBackgroundPlaysinline: this.getAttribute('custom-video-background-playsinline') !== 'false',
            videoBackgroundDisablePictureInPicture: this.getAttribute('custom-video-background-disablepictureinpicture') === 'true',
            innerBackgroundColorClass,
            innerBackgroundImageNoise: this.hasAttribute('inner-background-image-noise'),
            innerBackdropFilterClasses,
            innerBorderClass: this.getAttribute('inner-border') || '',
            innerBorderRadiusClass: this.hasAttribute('inner-border-radius') && this.hasAttribute('inner-border') ? this.getAttribute('inner-border-radius') : '',
            innerStyle: this.getAttribute('inner-style') || '',
            innerAlignment: innerAlignment && validAlignments.includes(innerAlignment) ? innerAlignment : '',
            textAlignment: textAlignment && validTextAlignments.includes(textAlignment) ? textAlignment : ''
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
            description: 'Default description text.',
            buttonHref: '#',
            buttonText: '',
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
            videoBackgroundLightSrc: '',
            videoBackgroundDarkSrc: '',
            videoBackgroundPoster: '',
            videoBackgroundLightPoster: '',
            videoBackgroundDarkPoster: '',
            videoBackgroundAlt: 'Video content',
            videoBackgroundLoading: 'lazy',
            videoBackgroundAutoplay: true,
            videoBackgroundMuted: true,
            videoBackgroundLoop: true,
            videoBackgroundPlaysinline: true,
            videoBackgroundDisablePictureInPicture: false,
            innerBackgroundColorClass: '',
            innerBackgroundImageNoise: false,
            innerBackdropFilterClasses: [],
            innerBorderClass: '',
            innerBorderRadiusClass: '',
            innerStyle: '',
            innerAlignment: '',
            textAlignment: ''
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
        const hasVideoBackground = !isFallback && !!(attrs.videoBackgroundLightSrc || attrs.videoBackgroundDarkSrc || attrs.videoBackgroundSrc);
        const hasForegroundImage = !isFallback && !!(attrs.foregroundLightSrc || attrs.foregroundDarkSrc) && ['above', 'below', 'left', 'right'].includes(attrs.foregroundPosition);

        const isMediaOnly = !isFallback &&
            !this.hasAttribute('heading') &&
            !this.hasAttribute('description') &&
            !this.hasAttribute('button-text') &&
            (hasBackgroundImage || hasVideoBackground);

        const paddingClasses = ['padding-small', 'padding-medium', 'padding-large'];
        const mediaCustomClasses = attrs.customClasses.split(' ').filter(cls => cls && !paddingClasses.includes(cls)).join(' ');

        if (hasBackgroundImage) {
            const src = attrs.backgroundLightSrc || attrs.backgroundDarkSrc;
            if (!src) {
                console.warn('No valid background image source provided for <custom-block>. Skipping background image rendering.');
            } else {
                backgroundContentHTML = this.generatePictureMarkup({
                    src,
                    lightSrc: attrs.backgroundLightSrc,
                    darkSrc: attrs.backgroundDarkSrc,
                    alt: attrs.backgroundAlt,
                    isDecorative: attrs.backgroundIsDecorative,
                    customClasses: isMediaOnly ? attrs.customClasses : mediaCustomClasses,
                    loading: attrs.backgroundLoading,
                    fetchPriority: attrs.backgroundFetchPriority,
                    extraClasses: []
                });
            }
        } else if (hasVideoBackground) {
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
                disablepictureinpicture: attrs.videoBackgroundDisablePictureInPicture,
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
        }

        if (hasForegroundImage) {
            const src = attrs.foregroundLightSrc || attrs.foregroundDarkSrc;
            if (!src) {
                console.warn('No valid foreground image source provided for <custom-block>. Skipping foreground image rendering.');
            } else {
                foregroundImageHTML = this.generatePictureMarkup({
                    src,
                    lightSrc: attrs.foregroundLightSrc,
                    darkSrc: attrs.foregroundDarkSrc,
                    alt: attrs.foregroundAlt,
                    isDecorative: attrs.foregroundIsDecorative,
                    customClasses: mediaCustomClasses,
                    loading: attrs.foregroundLoading,
                    fetchPriority: attrs.foregroundFetchPriority,
                    extraClasses: []
                });
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
            'left': 'text-align-left',
            'center': 'text-align-center',
            'right': 'text-align-right'
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
            if (attrs.innerBackgroundGradientClass) innerDivClassList.push(attrs.innerBackgroundGradientClass);
            innerDivClassList.push(...attrs.innerBackdropFilterClasses);
            if (attrs.innerAlignment) innerDivClassList.push(alignMap[attrs.innerAlignment]);
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
            <div role="group"${attrs.textAlignment ? ` class="${textAlignMap[attrs.textAlignment]}"` : ''}>
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
            'background-gradient',
            'inner-background-gradient',
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
            'custom-video-background-src',
            'custom-video-background-light-src',
            'custom-video-background-dark-src',
            'custom-video-background-poster',
            'custom-video-background-light-poster',
            'custom-video-background-dark-poster',
            'custom-video-background-alt',
            'custom-video-background-loading',
            'custom-video-background-autoplay',
            'custom-video-background-muted',
            'custom-video-background-loop',
            'custom-video-background-playsinline',
            'custom-video-background-disablepictureinpicture',
            'inner-background-color',
            'inner-background-image-noise',
            'inner-border',
            'inner-border-radius',
            'inner-backdrop-filter',
            'inner-style',
            'inner-alignment',
            'text-alignment'
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
            'background-gradient',
            'inner-background-gradient',
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
            'custom-video-background-light-src',
            'custom-video-background-dark-src',
            'custom-video-background-poster',
            'custom-video-background-light-poster',
            'custom-video-background-dark-poster',
            'custom-video-background-alt',
            'custom-video-background-loading',
            'custom-video-background-autoplay',
            'custom-video-background-muted',
            'custom-video-background-loop',
            'custom-video-background-playsinline',
            'custom-video-background-disablepictureinpicture',
            'style',
            'inner-background-color',
            'inner-background-image-noise',
            'inner-border',
            'inner-border-radius',
            'inner-backdrop-filter',
            'inner-style',
            'inner-alignment',
            'text-alignment'
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

console.log('CustomBlock version: 2025-08-20');
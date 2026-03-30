class CustomVideo extends HTMLVideoElement {
    constructor() {
        super();
        this.isInitialized = false;
    }

    getAttributes() {
        const lightSrc = this.getAttribute('light-src');
        const darkSrc = this.getAttribute('dark-src');
        const poster = this.getAttribute('poster');
        const lightPoster = this.getAttribute('light-poster');
        const darkPoster = this.getAttribute('dark-poster');
        const alt = this.getAttribute('alt') || 'Video content';
        const loading = this.getAttribute('loading');
        const autoplay = this.hasAttribute('autoplay');
        const muted = this.hasAttribute('muted');
        const loop = this.hasAttribute('loop');
        const playsinline = this.hasAttribute('playsinline');
        const disablepictureinpicture = this.hasAttribute('disablepictureinpicture');
        const backgroundGradient = this.getAttribute('background-gradient') || '';
        let backgroundGradientClass = '';

        // Validate background-gradient attribute
        if (backgroundGradient) {
            const match = backgroundGradient.match(/^background-gradient-(\d+)$/);
            if (match) {
                backgroundGradientClass = `background-gradient-${match[1]}`;
            } else {
                console.warn(`Invalid background-gradient value "${backgroundGradient}" in <custom-video>. Expected format: background-gradient-[number]. Ignoring.`);
            }
        }

        return {
            lightSrc,
            darkSrc,
            poster,
            lightPoster,
            darkPoster,
            alt,
            loading,
            autoplay,
            muted,
            loop,
            playsinline,
            disablepictureinpicture,
            backgroundGradientClass,
            customClasses: this.getAttribute('class') || '',
            styleAttribute: this.getAttribute('style') || ''
        };
    }

    initialize() {
        if (this.isInitialized) return;
        this.isInitialized = true;

        const attrs = this.getAttributes();

        // Validate that at least one source is provided
        if (!attrs.lightSrc && !attrs.darkSrc) {
            console.error('At least one of "light-src" or "dark-src" attributes is required for <custom-video>');
            return;
        }

        // Validate file extensions
        const validExtensions = ['mp4', 'webm'];
        const validateExtension = (videoSrc, attrName) => {
            if (videoSrc) {
                const ext = videoSrc.split('.').pop()?.toLowerCase();
                if (ext && !validExtensions.includes(ext)) {
                    console.error(`Invalid video file extension in "${attrName}": ${videoSrc}`);
                    return false;
                }
            }
            return true;
        };

        if (!validateExtension(attrs.lightSrc, 'light-src') || !validateExtension(attrs.darkSrc, 'dark-src')) {
            return;
        }

        // Set title and aria-label if not already set
        if (!this.hasAttribute('title')) this.setAttribute('title', attrs.alt);
        if (!this.hasAttribute('aria-label')) this.setAttribute('aria-label', attrs.alt);

        // Set preload if loading is provided
        if (attrs.loading) this.setAttribute('preload', attrs.loading === 'lazy' ? 'metadata' : attrs.loading);

        // Explicitly set video attributes
        this.autoplay = attrs.autoplay;
        this.muted = attrs.muted;
        this.loop = attrs.loop;
        this.playsInline = attrs.playsinline;
        this.disablePictureInPicture = attrs.disablepictureinpicture;

        // Apply classes
        const classList = [
            attrs.customClasses,
            attrs.backgroundGradientClass
        ].filter(cls => cls).join(' ').trim();
        if (classList) {
            this.className = classList;
        }

        // Apply styles
        if (attrs.styleAttribute) {
            this.setAttribute('style', attrs.styleAttribute);
        }

        // Function to update poster based on current theme
        const updatePoster = (prefersDark) => {
            const activePoster = prefersDark ? (attrs.darkPoster || attrs.poster) : (attrs.lightPoster || attrs.poster);
            if (activePoster) {
                const img = new Image();
                img.src = activePoster;
                img.onload = () => {
                    this.setAttribute('poster', activePoster);
                };
                img.onerror = () => {
                    if (activePoster !== attrs.poster && attrs.poster) {
                        this.setAttribute('poster', attrs.poster);
                    } else {
                        console.warn(`Poster "${activePoster}" failed to load; no poster will be set.`);
                        this.removeAttribute('poster');
                    }
                };
            }
        };

        // Set initial poster
        if (attrs.poster) this.setAttribute('poster', attrs.poster);
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        updatePoster(prefersDark);

        // Build inner HTML for sources and fallback
        let innerHTML = '';
        const addSourcesHTML = (videoSrc, mediaQuery) => {
            if (!videoSrc) return '';
            const ext = videoSrc.split('.').pop()?.toLowerCase();
            if (!ext || !validExtensions.includes(ext)) return '';
            const baseSrc = videoSrc.slice(0, -(ext.length + 1));
            const mediaAttr = mediaQuery ? ` media="${mediaQuery}"` : '';
            let sources = '';
            // Prioritize webm over mp4
            sources += `<source src="${baseSrc}.webm" type="video/webm"${mediaAttr}>`;
            sources += `<source src="${baseSrc}.mp4" type="video/mp4"${mediaAttr}>`;
            return sources;
        };

        // Default source (used as fallback)
        const defaultSrc = attrs.lightSrc || attrs.darkSrc;

        // Add theme-specific sources
        if (attrs.lightSrc) innerHTML += addSourcesHTML(attrs.lightSrc, '(prefers-color-scheme: light)');
        if (attrs.darkSrc) innerHTML += addSourcesHTML(attrs.darkSrc, '(prefers-color-scheme: dark)');
        // Always add default sources to ensure playability
        innerHTML += addSourcesHTML(defaultSrc, null);

        // Add fallback message
        innerHTML += `<p>Your browser does not support the video tag. <a href="${defaultSrc}">Download video</a></p>`;

        // Set inner HTML and remove non-native attributes
        this.innerHTML = innerHTML;
        this.removeAttribute('light-src');
        this.removeAttribute('dark-src');
        this.removeAttribute('light-poster');
        this.removeAttribute('dark-poster');
        this.removeAttribute('background-gradient'); // Remove non-native attribute

        // Handle video source errors
        this.addEventListener('error', () => {
            console.warn(`Video source "${this.currentSrc}" failed to load.`);
            if (this.currentSrc !== defaultSrc) {
                this.innerHTML = addSourcesHTML(defaultSrc, null) + `<p>Your browser does not support the video tag. <a href="${defaultSrc}">Download video</a></p>`;
                this.load();
            }
        });

        // Listen for theme changes with playback state preservation
        let debounceTimeout;
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', (e) => {
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(() => {
                const wasPlaying = !this.paused;
                const currentTime = this.currentTime;
                updatePoster(e.matches);
                // Only reload if sources would change
                const activeSrc = e.matches ? (attrs.darkSrc || attrs.lightSrc) : (attrs.lightSrc || attrs.darkSrc);
                if (activeSrc !== this.currentSrc) {
                    this.innerHTML = innerHTML; // Rebuild sources
                    this.load();
                    this.currentTime = currentTime;
                    if (wasPlaying) this.play().catch(() => console.warn('Auto-play failed after theme change'));
                }
            }, 100);
        });

        // Enhance lazy loading with IntersectionObserver for autoplay
        if (attrs.loading === 'lazy' && attrs.autoplay) {
            const observer = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting) {
                    this.play().catch(() => console.warn('Auto-play failed on lazy load'));
                    observer.disconnect();
                }
            });
            observer.observe(this);
        }
    }

    connectedCallback() {
        this.initialize();
    }

    static get observedAttributes() {
        return [
            'light-src',
            'dark-src',
            'poster',
            'light-poster',
            'dark-poster',
            'alt',
            'loading',
            'autoplay',
            'muted',
            'loop',
            'playsinline',
            'disablepictureinpicture',
            'background-gradient',
            'class',
            'style'
        ];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (this.isInitialized && oldValue !== newValue) {
            this.initialize();
        }
    }
}

try {
    customElements.define('custom-video', CustomVideo, { extends: 'video' });
} catch (error) {
    console.error('Error defining CustomVideo element:', error);
}
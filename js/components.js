class CustomVideo extends HTMLVideoElement {
    constructor() {
        super();
    }

    connectedCallback() {
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

        // Validate that at least one source is provided
        if (!lightSrc && !darkSrc) {
            console.error('At least one of "light-src" or "dark-src" attributes is required for <video is="custom-video">');
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

        if (!validateExtension(lightSrc, 'light-src') || !validateExtension(darkSrc, 'dark-src')) {
            return;
        }

        // Set title and aria-label if not already set
        if (!this.hasAttribute('title')) this.setAttribute('title', alt);
        if (!this.hasAttribute('aria-label')) this.setAttribute('aria-label', alt);

        // Set preload if loading is provided
        if (loading) this.setAttribute('preload', loading === 'lazy' ? 'metadata' : loading);

        // Explicitly set video attributes
        this.autoplay = autoplay;
        this.muted = muted;
        this.loop = loop;
        this.playsInline = playsinline;
        this.disablePictureInPicture = disablepictureinpicture;

        // Function to update poster based on current theme
        const updatePoster = (prefersDark) => {
            const activePoster = prefersDark ? (darkPoster || poster) : (lightPoster || poster);
            if (activePoster) {
                const img = new Image();
                img.src = activePoster;
                img.onload = () => {
                    this.setAttribute('poster', activePoster);
                };
                img.onerror = () => {
                    if (activePoster !== poster && poster) {
                        this.setAttribute('poster', poster);
                    } else {
                        console.warn(`Poster "${activePoster}" failed to load; no poster will be set.`);
                        this.removeAttribute('poster');
                    }
                };
            }
        };

        // Set initial poster
        if (poster) this.setAttribute('poster', poster);
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
        const defaultSrc = lightSrc || darkSrc;

        // Add theme-specific sources
        if (lightSrc) innerHTML += addSourcesHTML(lightSrc, '(prefers-color-scheme: light)');
        if (darkSrc) innerHTML += addSourcesHTML(darkSrc, '(prefers-color-scheme: dark)');
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
                const activeSrc = e.matches ? (darkSrc || lightSrc) : (lightSrc || darkSrc);
                if (activeSrc !== this.currentSrc) {
                    this.innerHTML = innerHTML; // Rebuild sources
                    this.load();
                    this.currentTime = currentTime;
                    if (wasPlaying) this.play().catch(() => console.warn('Auto-play failed after theme change'));
                }
            }, 100);
        });

        // Enhance lazy loading with IntersectionObserver for autoplay
        if (loading === 'lazy' && autoplay) {
            const observer = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting) {
                    this.play().catch(() => console.warn('Auto-play failed on lazy load'));
                    observer.disconnect();
                }
            });
            observer.observe(this);
        }
    }
}

customElements.define('custom-video', CustomVideo, { extends: 'video' });





class Footer extends HTMLElement {
    connectedCallback() {
        this.innerHTML = `
            <footer class="min-height-two-thirds">
                <p>© ${new Date().getFullYear()} My Site. All rights reserved.</p>
                <nav>
                    <a href="/about">About</a> | <a href="/contact">Contact</a>
                </nav>
            </footer>
        `;
    }
}

customElements.define('bh-footer', Footer);




class Nav extends HTMLElement {
    connectedCallback() {
        const hasDropdown = this.hasAttribute('dropdown') && this.getAttribute('dropdown') !== 'false';
        const menuItemHtml = hasDropdown
            ? `
                <li class="dropdown-toggle">
                    <a href="./item2.html">Item 2</a>
                    <div class="dropdown-menu">
                        <a href="./item2/subitem1.html">Subitem 1</a>
                        <a href="./item2/subitem2.html">Subitem 2</a>
                    </div>
                </li>
            `
            : `<li><a href="./item2.html">Item 2</a></li>`;

        this.innerHTML = `
            <nav ${hasDropdown ? 'class="dropdown"' : ''}>
                <ul>
                    <li><a href="./item1.html">Item 1</a></li>
                    ${menuItemHtml}
                    <li><a href="./item3.html">Item 3</a></li>
                    <li><a href="./item4.html">Item 4</a></li>
                    <li><a href="./item5.html">Item 5</a></li>
                    <li><a href="./item6.html">Item 6</a></li>
                </ul>
                <i class="fa-sharp fa-light fa-bars font-size-medium"></i>
            </nav>
        `;
    }
}

customElements.define('bh-nav', Nav);
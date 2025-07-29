class CustomCard extends HTMLDivElement {
    constructor() {
        super();
        this.callbacks = [];
        this.isRendered = false; // Flag to prevent multiple renders
    }

    connectedCallback() {
        this.waitForImageUtils(() => {
            try {
                this.render();
                this.callbacks.forEach(callback => callback());
            } catch (error) {
                console.error('Error in CustomCard connectedCallback:', error);
            }
        });
    }

    disconnectedCallback() {
        this.callbacks = [];
        this.isRendered = false; // Reset flag on disconnect
    }

    addCallback(callback) {
        this.callbacks.push(callback);
    }

    waitForImageUtils(callback) {
        if (typeof ImageUtils !== 'undefined') {
            callback();
            return;
        }
        const interval = setInterval(() => {
            if (typeof ImageUtils !== 'undefined') {
                clearInterval(interval);
                callback();
            }
        }, 100);
        setTimeout(() => {
            clearInterval(interval);
            console.error('Timed out waiting for ImageUtils to be defined. Ensure image-utils.js is loaded correctly.');
            callback(); // Proceed with rendering, even if ImageUtils is missing
        }, 5000);
    }

    render() {
        if (this.isRendered) return; // Prevent multiple renders
        this.isRendered = true;

        try {
            // Get attributes
            const heading = this.getAttribute('heading') || 'Default Heading';
            const description = this.getAttribute('description') || 'Default description text.';
            const buttonHref = this.getAttribute('button-href') || '#';
            const buttonText = this.getAttribute('button-text') || 'Button';
            const hasBackgroundOverlay = this.hasAttribute('background-overlay');
            const backgroundOverlayColor = this.getAttribute('background-overlay') || 'light-dark(var(--color-static-light-4), var(--color-static-dark-2))';
            const hasBackgroundColor = this.hasAttribute('background-color');
            const backgroundColorClass = hasBackgroundColor ? this.getAttribute('background-color') : '';
            const hasBorder = this.hasAttribute('border');
            const borderClass = hasBorder ? this.getAttribute('border') : '';
            const hasBorderRadius = this.hasAttribute('border-radius');
            const borderRadiusClass = hasBorderRadius && hasBorder ? this.getAttribute('border-radius') : '';
            const hasBackdropFilter = this.hasAttribute('backdrop-filter');
            const backdropFilterClass = hasBackdropFilter ? this.getAttribute('backdrop-filter') : '';
            const classes = this.getAttribute('class') || '';
            // Image attributes
            const imgSrc = this.getAttribute('image-src') || '';
            const lightSrc = this.getAttribute('image-light-src') || '';
            const darkSrc = this.getAttribute('image-dark-src') || '';
            const alt = this.getAttribute('image-alt') || '';
            const width = this.getAttribute('image-width') || '100vw';
            const aspectRatio = this.getAttribute('image-aspect-ratio') || '';
            const isDecorative = this.hasAttribute('image-is-decorative');
            const mobileWidth = this.getAttribute('image-mobile-width') || '';
            const tabletWidth = this.getAttribute('image-tablet-width') || '';
            const desktopWidth = this.getAttribute('image-desktop-width') || '';
            const loading = this.getAttribute('image-loading') || 'lazy';
            const fetchPriority = this.getAttribute('image-fetch-priority') || 'auto';
            const objectFit = this.getAttribute('image-object-fit') || 'cover';
            const objectPosition = this.getAttribute('image-object-position') || 'center';
            const includeSchema = this.hasAttribute('image-include-schema');
            // Video attributes
            const videoSrc = this.getAttribute('video-src') || '';
            const videoSrcLight = this.getAttribute('video-src-light') || '';
            const videoSrcDark = this.getAttribute('video-src-dark') || '';
            const videoPoster = this.getAttribute('video-poster') || '';
            const videoPosterLight = this.getAttribute('video-poster-light') || '';
            const videoPosterDark = this.getAttribute('video-poster-dark') || '';
            const videoAlt = this.getAttribute('video-alt') || 'Background video';
            const videoLoading = this.getAttribute('video-loading') || 'lazy';
            const videoAutoplay = this.hasAttribute('video-autoplay') ? this.getAttribute('video-autoplay') !== 'false' : true;
            const videoMuted = this.hasAttribute('video-muted') ? this.getAttribute('video-muted') !== 'false' : true;
            const videoLoop = this.hasAttribute('video-loop') ? this.getAttribute('video-loop') !== 'false' : true;
            const videoPlaysinline = this.hasAttribute('video-playsinline') ? this.getAttribute('video-playsinline') !== 'false' : true;
            const videoDisablePictureInPicture = this.hasAttribute('video-disablepictureinpicture') ? this.getAttribute('video-disablepictureinpicture') !== 'false' : false;

            // Build the card with optional background image
            let backgroundImageHTML = '';
            let overlayHTML = '';
            const hasBackgroundImage = !!imgSrc;
            if (hasBackgroundImage) {
                if (typeof ImageUtils === 'undefined') {
                    console.error('ImageUtils is not defined during render. Ensure image-utils.js is loaded before components.js');
                } else {
                    backgroundImageHTML = ImageUtils.generatePictureMarkup({
                        src: imgSrc,
                        lightSrc: lightSrc,
                        darkSrc: darkSrc,
                        alt: alt,
                        width: width,
                        aspectRatio: aspectRatio,
                        isDecorative: isDecorative,
                        mobileWidth: mobileWidth,
                        tabletWidth: tabletWidth,
                        desktopWidth: desktopWidth,
                        loading: loading,
                        fetchPriority: fetchPriority,
                        objectFit: objectFit,
                        objectPosition: objectPosition,
                        includeSchema: includeSchema
                    });
                    console.log('Generated backgroundImageHTML:', backgroundImageHTML); // Debug log
                }
            } else if (hasBackgroundImage) {
                console.warn('background-image attribute is present, but image-src is missing. Image will not be displayed.');
            }

            // Build the card with optional background video
            let backgroundVideoHTML = '';
            const hasBackgroundVideo = !!videoSrc;
            if (hasBackgroundVideo) {
                backgroundVideoHTML = `<bh-video src="${videoSrc}"`;
                if (videoSrcLight) backgroundVideoHTML += ` src-light="${videoSrcLight}"`;
                if (videoSrcDark) backgroundVideoHTML += ` src-dark="${videoSrcDark}"`;
                if (videoPoster) backgroundVideoHTML += ` poster="${videoPoster}"`;
                if (videoPosterLight) backgroundVideoHTML += ` poster-light="${videoPosterLight}"`;
                if (videoPosterDark) backgroundVideoHTML += ` poster-dark="${videoPosterDark}"`;
                backgroundVideoHTML += ` alt="${videoAlt}" loading="${videoLoading}"`;
                if (videoAutoplay) backgroundVideoHTML += ` autoplay`;
                if (videoMuted) backgroundVideoHTML += ` muted`;
                if (videoLoop) backgroundVideoHTML += ` loop`;
                if (videoPlaysinline) backgroundVideoHTML += ` playsinline`;
                if (videoDisablePictureInPicture) backgroundVideoHTML += ` disablepictureinpicture`;
                backgroundVideoHTML += `></bh-video>`;
            }

            // Add the background-overlay div only if the attribute is present
            if (hasBackgroundOverlay) {
                // Apply backdrop-filter classes to the background-overlay div
                overlayHTML = `<div class="background-overlay ${backdropFilterClass}" style="background-color: ${backgroundOverlayColor};"></div>`;
            }

            // Determine the main div class and content structure
            let mainDivClass = 'card';
            if (hasBackgroundImage) mainDivClass += ' background-image';
            if (hasBackgroundVideo) mainDivClass += ' background-video';
            mainDivClass += ` ${classes} ${backgroundColorClass} ${borderClass} ${borderRadiusClass}`;

            // Deduplicate classes
            mainDivClass = [...new Set(mainDivClass.split(' '))].join(' ').trim();

            // Check if 'space-between' and 'padding-medium' are in the classes attribute
            const classList = classes.split(' ').filter(cls => cls.length > 0); // Split and filter out empty strings
            const hasSpaceBetween = classList.includes('space-between');
            const hasPaddingMedium = classList.includes('padding-medium');
            // Construct the inner div class dynamically
            const innerDivClasses = [];
            if (hasPaddingMedium) innerDivClasses.push('padding-medium');
            if (hasSpaceBetween) innerDivClasses.push('space-between');
            const innerDivClass = innerDivClasses.length > 0 ? innerDivClasses.join(' ') : '';
            
            const contentHTML = (hasBackgroundImage || hasBackgroundVideo)
                ? `
                    <div${innerDivClass ? ` class="${innerDivClass}"` : ''}>
                        <hgroup>
                            <h2>${heading}</h2>
                            <p>${description}</p>
                        </hgroup>
                        <a class="button" href="${buttonHref}">${buttonText}</a>
                    </div>
                `
                : `
                    <hgroup>
                        <h2>${heading}</h2>
                        <p>${description}</p>
                    </hgroup>
                    <a class="button" href="${buttonHref}">${buttonText}</a>
                `;

            // Set the class and innerHTML directly on this (the div)
            this.className = mainDivClass;
            this.innerHTML = `
                ${backgroundImageHTML || ''}
                ${backgroundVideoHTML || ''}
                ${overlayHTML}
                ${contentHTML}
            `;

            // Clean up background image attributes if rendered
            const backgroundImg = this.querySelector('img');
            if (backgroundImg) {
                backgroundImg.removeAttribute('light-src');
                backgroundImg.removeAttribute('dark-src');
                backgroundImg.removeAttribute('aspect-ratio');
                backgroundImg.removeAttribute('mobile-width');
                backgroundImg.removeAttribute('tablet-width');
                backgroundImg.removeAttribute('desktop-width');
                backgroundImg.removeAttribute('include-schema');
                // Add other custom attributes to remove if needed
            }
        } catch (error) {
            console.error('Error rendering CustomCard:', error);
            // Fallback rendering
            this.className = 'card';
            this.innerHTML = `
                <hgroup>
                    <h2>Error</h2>
                    <p>Failed to render card. Check console for details.</p>
                </hgroup>
                <a class="button" href="#">Button</a>
            `;
        }
    }

    static get observedAttributes() {
        return [
            'heading', 'description', 'button-href', 'button-text', 'background-overlay', 'background-color', 'border', 'border-radius', 'backdrop-filter', 'classes',
            'image-src', 'image-light-src', 'image-dark-src', 'image-alt', 'image-width', 'image-aspect-ratio', 'image-is-decorative', 'image-mobile-width', 'image-tablet-width', 'image-desktop-width', 'image-loading', 'image-fetch-priority', 'image-object-fit', 'image-object-position', 'image-include-schema',
            'video-src', 'video-src-light', 'video-src-dark', 'video-poster', 'video-poster-light', 'video-poster-dark', 'video-alt', 'video-loading', 'video-autoplay', 'video-muted', 'video-loop', 'video-playsinline', 'video-disablepictureinpicture'
        ];
    }

    attributeChangedCallback() {
        if (this.isRendered) return; // Prevent re-render on attribute change after initial render
        this.waitForImageUtils(() => {
            try {
                this.render();
            } catch (error) {
                console.error('Error in CustomCard attributeChangedCallback:', error);
            }
        });
    }
}

customElements.define('custom-card', CustomCard, { extends: 'div' });

class CustomImg extends HTMLImageElement {
    constructor() {
        super();
        this.isVisible = false;
        this.isInitialized = false; // Moved here for clarity
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                this.isVisible = true;
                observer.disconnect();
                if (!this.isInitialized) {
                    this.connectedCallback(); // Trigger render only if not initialized
                }
            }
        }, { rootMargin: '50px' });
        observer.observe(this);
    }

    connectedCallback() {
        if (this.isInitialized || !this.isVisible) return;
        this.isInitialized = true;

        // Add role if not present and no alt
        if (!this.hasAttribute('role') && !this.hasAttribute('alt')) {
            this.setAttribute('role', 'img');
        }

        this.waitForImageUtils(() => {
            try {
                const lightSrc = this.getAttribute('light-src');
                const darkSrc = this.getAttribute('dark-src');
                const alt = this.getAttribute('alt') || '';
                const isDecorative = this.hasAttribute('decorative');
                if (!alt && !isDecorative) {
                    console.warn(`<img is="custom-img" light-src="${lightSrc || 'not provided'}" dark-src="${darkSrc || 'not provided'}"> is missing an alt attribute for accessibility.`);
                }
                const mobileWidth = this.getAttribute('mobile-width') || '100vw';
                const tabletWidth = this.getAttribute('tablet-width') || '100vw';
                const desktopWidth = this.getAttribute('desktop-width') || '100vw';
                const customClasses = this.getAttribute('class') || '';
                const includeSchema = this.hasAttribute('include-schema');
                const caption = this.getAttribute('caption') || null;

                // Check if at least one theme source is provided
                if (!lightSrc && !darkSrc) {
                    console.error('No source attribute (light-src or dark-src) provided for <img is="custom-img">. Using fallback.');
                    this.src = 'https://placehold.co/3000x2000';
                    if (!isDecorative) this.setAttribute('alt', alt || 'Placeholder image');
                    // Clean up custom attributes on fallback
                    this.removeAttribute('light-src');
                    this.removeAttribute('dark-src');
                    this.removeAttribute('mobile-width');
                    this.removeAttribute('tablet-width');
                    this.removeAttribute('desktop-width');
                    this.removeAttribute('include-schema');
                    this.removeAttribute('caption');
                    return;
                }

                if (typeof ImageUtils === 'undefined') {
                    console.error('ImageUtils is not defined. Ensure image-utils.js is loaded.');
                    return;
                }

                const pictureHTML = ImageUtils.generatePictureMarkup({
                    src: lightSrc || darkSrc,
                    lightSrc,
                    darkSrc,
                    alt,
                    isDecorative,
                    mobileWidth,
                    tabletWidth,
                    desktopWidth,
                    includeSchema
                });

                if (!pictureHTML) {
                    console.warn('No valid picture HTML generated. Falling back to theme source or fallback.');
                    this.src = lightSrc || darkSrc || 'https://placehold.co/3000x2000';
                    if (!isDecorative) this.setAttribute('alt', alt || 'Placeholder image');
                    // Clean up custom attributes on fallback
                    this.removeAttribute('light-src');
                    this.removeAttribute('dark-src');
                    this.removeAttribute('mobile-width');
                    this.removeAttribute('tablet-width');
                    this.removeAttribute('desktop-width');
                    this.removeAttribute('include-schema');
                    this.removeAttribute('caption');
                    return;
                }

                // Parse the generated picture HTML
                const div = document.createElement('div');
                div.innerHTML = pictureHTML;
                const generatedPicture = div.firstChild;
                const generatedSources = generatedPicture.querySelectorAll('source');
                let generatedImg = generatedPicture.querySelector('img');

                // Create new picture element
                const picture = document.createElement('picture');

                // Insert generated sources into the new picture
                generatedSources.forEach(source => {
                    picture.appendChild(source.cloneNode(true));
                });

                // Create a new img element to replace the original, transferring only native attributes
                generatedImg = document.createElement('img');
                generatedImg.setAttribute('alt', this.getAttribute('alt') || '');
                generatedImg.setAttribute('class', this.className);
                if (this.hasAttribute('fetchpriority')) {
                    generatedImg.setAttribute('fetchpriority', this.getAttribute('fetchpriority'));
                }
                if (this.hasAttribute('loading')) {
                    generatedImg.setAttribute('loading', this.getAttribute('loading'));
                }

                // Determine the initial src based on theme
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                generatedImg.src = prefersDark && darkSrc ? darkSrc : lightSrc || darkSrc || 'https://placehold.co/3000x2000';

                // Apply custom classes to the new img
                if (customClasses) {
                    generatedImg.className = generatedImg.className ? `${generatedImg.className} ${customClasses}`.trim() : customClasses;
                }

                // Deduplicate classes
                generatedImg.className = [...new Set(generatedImg.className.split(' '))].join(' ').trim();

                this.onerror = () => {
                    console.warn(`Failed to load primary image: ${lightSrc || darkSrc}. Falling back to ${'https://placehold.co/3000x2000'}.`);
                    generatedImg.src = 'https://placehold.co/3000x2000';
                    if (!isDecorative) {
                        generatedImg.setAttribute('alt', alt || 'Placeholder image');
                    }
                    this.onerror = null;
                };

                // Wrap the new img in the picture
                picture.appendChild(generatedImg);

                // Replace the original img with the picture
                this.parentNode.insertBefore(picture, this);
                this.parentNode.removeChild(this); // Remove the original custom element

                // If includeSchema, wrap in <figure> with schema.org markup
                if (includeSchema) {
                    const figure = document.createElement('figure');
                    figure.setAttribute('itemscope', '');
                    figure.setAttribute('itemtype', 'https://schema.org/ImageObject');
                    picture.parentNode.insertBefore(figure, picture);
                    figure.appendChild(picture);
                    if (caption) {
                        const figcaption = document.createElement('figcaption');
                        figcaption.setAttribute('itemprop', 'caption');
                        figcaption.textContent = caption;
                        figure.appendChild(figcaption);
                    }
                    const metaUrl = document.createElement('meta');
                    metaUrl.setAttribute('itemprop', 'url');
                    metaUrl.setAttribute('content', generatedImg.src ? new URL(generatedImg.src, window.location.origin).href : '');
                    figure.appendChild(metaUrl);
                    const metaDescription = document.createElement('meta');
                    metaDescription.setAttribute('itemprop', 'description');
                    metaDescription.setAttribute('content', alt);
                    figure.appendChild(metaDescription);
                }
            } catch (error) {
                console.error('Error in CustomImg connectedCallback:', error);
            }
        });
    }

    waitForImageUtils(callback) {
        if (typeof ImageUtils !== 'undefined') {
            callback();
            return;
        }
        const interval = setInterval(() => {
            if (typeof ImageUtils !== 'undefined') {
                clearInterval(interval);
                callback();
            }
        }, 50); // Reduced from 100ms
        setTimeout(() => {
            clearInterval(interval);
            console.error('Timed out waiting for ImageUtils to be defined. Ensure image-utils.js is preloaded.');
            callback();
        }, 3000); // Reduced from 5000ms
    }
}

customElements.define('custom-img', CustomImg, { extends: 'img' });

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
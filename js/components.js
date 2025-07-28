class CustomCard extends HTMLDivElement {
    constructor() {
        super();
        this.callbacks = [];
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
    }

    connectedCallback() {
        if (this.isInitialized) return; // Prevent multiple initializations
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
                const aspectRatio = this.getAttribute('aspect-ratio') || '';
                const mobileWidth = this.getAttribute('mobile-width') || '100vw';
                const tabletWidth = this.getAttribute('tablet-width') || '100vw';
                const desktopWidth = this.getAttribute('desktop-width') || '100vw';
                const customClasses = this.getAttribute('class') || '';
                const fallbackSrc = this.getAttribute('fallback-src') || 'https://placehold.co/3000x2000';
                const includeSchema = this.hasAttribute('include-schema');
                const caption = this.getAttribute('caption') || null;
                const schemaUrl = this.getAttribute('schema-url') || ((lightSrc || darkSrc) ? new URL(lightSrc || darkSrc, window.location.origin).href : '');
                const schemaDescription = this.getAttribute('schema-description') || (isDecorative ? '' : alt);

                // Check if at least one theme source is provided
                if (!lightSrc && !darkSrc) {
                    console.error('No source attribute (light-src or dark-src) provided for <img is="custom-img">. Using fallback.');
                    this.src = fallbackSrc;
                    if (!isDecorative) this.setAttribute('alt', alt || 'Placeholder image');
                    return;
                }

                if (typeof ImageUtils === 'undefined') {
                    console.error('ImageUtils is not defined. Ensure image-utils.js is loaded before components.js');
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
                    aspectRatio,
                    includeSchema
                });

                if (!pictureHTML) {
                    console.warn('No valid picture HTML generated. Falling back to theme source or fallback.');
                    this.src = lightSrc || darkSrc || fallbackSrc;
                    if (!isDecorative) this.setAttribute('alt', alt || 'Placeholder image');
                    return;
                }

                // Parse the generated picture HTML
                const div = document.createElement('div');
                div.innerHTML = pictureHTML;
                const generatedPicture = div.firstChild;
                const generatedSources = generatedPicture.querySelectorAll('source');

                // Create new picture element
                const picture = document.createElement('picture');

                // Insert generated sources into the new picture
                generatedSources.forEach(source => {
                    picture.appendChild(source.cloneNode(true));
                });

                // Apply custom classes to the current img (this)
                if (customClasses) {
                    this.className = this.className ? `${this.className} ${customClasses}`.trim() : customClasses;
                }

                // Deduplicate classes
                this.className = [...new Set(this.className.split(' '))].join(' ').trim();

                this.onerror = () => {
                    console.warn(`Failed to load primary image: ${lightSrc || darkSrc}. Falling back to ${fallbackSrc}.`);
                    this.src = fallbackSrc;
                    if (!isDecorative) {
                        this.setAttribute('alt', alt || 'Placeholder image');
                    }
                    this.onerror = null;
                };

                // Set initial src based on theme source
                if (!this.src) {
                    this.src = lightSrc || darkSrc;
                    if (!this.src) this.src = fallbackSrc; // Only use fallback if no theme source
                }

                // Remove custom attributes from the final img to clean up
                this.removeAttribute('light-src');
                this.removeAttribute('dark-src');
                this.removeAttribute('aspect-ratio');
                this.removeAttribute('mobile-width');
                this.removeAttribute('tablet-width');
                this.removeAttribute('desktop-width');
                this.removeAttribute('include-schema');
                this.removeAttribute('caption');
                this.removeAttribute('schema-url');
                this.removeAttribute('schema-description');

                // Wrap this img in the picture
                this.parentNode.insertBefore(picture, this);
                picture.appendChild(this);

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
                    metaUrl.setAttribute('content', schemaUrl); // Use provided schema-url or computed image URL
                    figure.appendChild(metaUrl);
                    const metaDescription = document.createElement('meta');
                    metaDescription.setAttribute('itemprop', 'description');
                    metaDescription.setAttribute('content', schemaDescription);
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
        }, 100);
        setTimeout(() => {
            clearInterval(interval);
            console.error('Timed out waiting for ImageUtils to be defined. Ensure image-utils.js is loaded correctly.');
            callback();
        }, 5000);
    }
}

customElements.define('custom-img', CustomImg, { extends: 'img' });

class CustomVideo extends HTMLVideoElement {
    constructor() {
        super();
    }

    connectedCallback() {
        const src = this.getAttribute('src');
        const srcLight = this.getAttribute('src-light');
        const srcDark = this.getAttribute('src-dark');
        const poster = this.getAttribute('poster');
        const posterLight = this.getAttribute('poster-light');
        const posterDark = this.getAttribute('poster-dark');
        const alt = this.getAttribute('alt') || 'Video content';
        const loading = this.getAttribute('loading');
        const autoplay = this.hasAttribute('autoplay');
        const muted = this.hasAttribute('muted');
        const loop = this.hasAttribute('loop');
        const playsinline = this.hasAttribute('playsinline');
        const disablepictureinpicture = this.hasAttribute('disablepictureinpicture');

        // Validate src
        if (!src) {
            console.error('The "src" attribute is required for <video is="custom-video">');
            return;
        }

        // Validate file extensions
        const validExtensions = ['mp4', 'webm', 'ogg'];
        const validateExtension = (videoSrc, attrName) => {
            if (videoSrc) {
                const ext = videoSrc.split('.').pop().toLowerCase();
                if (!validExtensions.includes(ext)) {
                    console.error(`Invalid video file extension in "${attrName}": ${videoSrc}`);
                    return false;
                }
            }
            return true;
        };

        if (!validateExtension(src, 'src') ||
            !validateExtension(srcLight, 'src-light') ||
            !validateExtension(srcDark, 'src-dark')) {
            return;
        }

        // Set title and aria-label if not already set
        if (!this.hasAttribute('title')) this.setAttribute('title', alt);
        if (!this.hasAttribute('aria-label')) this.setAttribute('aria-label', alt);

        // Set preload if loading is provided
        if (loading) this.setAttribute('preload', loading === 'lazy' ? 'metadata' : loading);

        // Function to update poster based on current theme
        const updatePoster = (prefersDark) => {
            const activePoster = prefersDark ? (posterDark || poster) : (posterLight || poster);
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

        // Set initial poster (default first, then theme-specific asynchronously)
        if (poster) {
            this.setAttribute('poster', poster);
        }
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        updatePoster(prefersDark);

        // Listen for theme changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', (e) => {
            updatePoster(e.matches);
            this.load(); // Reload to potentially apply new sources
        });

        // Build inner HTML for sources and fallback message
        let innerHTML = '';

        // Function to add sources as HTML strings, with webm before mp4 before ogg
        const addSourcesHTML = (videoSrc, mediaQuery) => {
            if (!videoSrc) return '';
            let baseSrc = videoSrc;
            const ext = videoSrc.split('.').pop().toLowerCase();
            if (validExtensions.includes(ext)) {
                baseSrc = videoSrc.slice(0, -(ext.length + 1));
            }
            const mediaAttr = mediaQuery ? ` media="${mediaQuery}"` : '';
            let sources = '';
            sources += `<source src="${baseSrc}.webm" type="video/webm"${mediaAttr}>`;
            sources += `<source src="${baseSrc}.mp4" type="video/mp4"${mediaAttr}>`;
            sources += `<source src="${baseSrc}.ogg" type="video/ogg"${mediaAttr}>`;
            return sources;
        };

        // Add sources for light theme if provided
        if (srcLight) {
            innerHTML += addSourcesHTML(srcLight, '(prefers-color-scheme: light)');
        }

        // Add sources for dark theme if provided
        if (srcDark) {
            innerHTML += addSourcesHTML(srcDark, '(prefers-color-scheme: dark)');
        }

        // Default sources (always included as fallback)
        innerHTML += addSourcesHTML(src, null);

        // Add fallback message with a class for styling
        innerHTML += `<p class="bh-video-fallback">Your browser does not support the video tag. <a href="${src}">Download video</a></p>`;

        // Set inner HTML all at once and remove original src
        this.removeAttribute('src');
        this.innerHTML = innerHTML;

        // Handle video source errors
        this.addEventListener('error', () => {
            console.warn(`Video source "${this.currentSrc}" failed to load; falling back to default src "${src}".`);
            if (this.currentSrc && this.currentSrc !== src) {
                this.src = src;
                this.load();
            }
        });
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
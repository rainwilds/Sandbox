class Card extends HTMLElement {
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
                console.error('Error in Card connectedCallback:', error);
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
        // Fallback timeout to prevent infinite waiting
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
            const classes = this.getAttribute('classes') || '';
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

            // Create the rendered element
            const renderedDiv = document.createElement('div');
            renderedDiv.className = mainDivClass;
            renderedDiv.innerHTML = `
                ${backgroundImageHTML || ''}
                ${backgroundVideoHTML || ''}
                ${overlayHTML}
                ${contentHTML}
            `;

            // Replace the custom element with the rendered div
            this.replaceWith(renderedDiv);
        } catch (error) {
            console.error('Error rendering Card:', error);
            // Fallback rendering
            const fallbackDiv = document.createElement('div');
            fallbackDiv.className = 'card';
            fallbackDiv.innerHTML = `
                <hgroup>
                    <h2>Error</h2>
                    <p>Failed to render card. Check console for details.</p>
                </hgroup>
                <a class="button" href="#">Button</a>
            `;
            this.replaceWith(fallbackDiv);
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
                console.error('Error in Card attributeChangedCallback:', error);
            }
        });
    }
}

customElements.define('bh-card', Card);


class Img extends HTMLElement {
    constructor() {
        super();
    }

    connectedCallback() {
        // Add role to custom element before replacement
        this.setAttribute('role', 'img');

        this.waitForImageUtils(() => {
            try {
                const src = this.getAttribute('src');
                const lightSrc = this.getAttribute('light-src');
                const darkSrc = this.getAttribute('dark-src');
                const alt = this.getAttribute('alt') || '';
                const isDecorative = this.hasAttribute('decorative');
                if (!alt && !isDecorative) {
                    console.warn(`<bh-img src="${src}"> is missing an alt attribute for accessibility. Use alt="" if decorative, or add decorative attribute.`);
                }
                const aspectRatio = this.getAttribute('aspect-ratio') || '';
                const mobileWidth = this.getAttribute('mobile-width') || '100vw';
                const tabletWidth = this.getAttribute('tablet-width') || '100vw';
                const desktopWidth = this.getAttribute('desktop-width') || '100vw';
                const customClasses = this.getAttribute('class') || '';
                const loading = this.getAttribute('loading') || null;
                const fetchpriority = this.getAttribute('fetch-priority') || null;
                if (fetchpriority && !['high', 'low', 'auto'].includes(fetchpriority)) {
                    console.warn(`Invalid fetch-priority value "${fetchpriority}" in <bh-img>. Use 'high', 'low', or 'auto'.`);
                }
                const fallbackSrc = this.getAttribute('fallback-src') || 'https://placehold.co/3000x2000';
                const objectFit = this.getAttribute('object-fit') || null;
                const objectPosition = this.getAttribute('object-position') || null;
                const includeSchema = this.hasAttribute('include-schema');
                const caption = this.getAttribute('caption') || null;
                const schemaUrl = this.getAttribute('schema-url') || (src ? new URL(src, window.location.origin).href : '');
                const schemaDescription = this.getAttribute('schema-description') || (isDecorative ? '' : alt);

                if (typeof ImageUtils === 'undefined') {
                    console.error('ImageUtils is not defined. Ensure image-utils.js is loaded before components.js');
                    return;
                }

                const pictureHTML = ImageUtils.generatePictureMarkup({
                    src,
                    lightSrc,
                    darkSrc,
                    alt,
                    isDecorative,
                    mobileWidth,
                    tabletWidth,
                    desktopWidth,
                    aspectRatio,
                    loading,
                    'fetch-priority': fetchpriority,
                    objectFit,
                    objectPosition,
                    includeSchema
                });

                if (!pictureHTML) {
                    return;
                }

                const div = document.createElement('div');
                div.innerHTML = pictureHTML;
                const picture = div.firstChild;

                const img = picture.querySelector('img');
                if (customClasses) {
                    img.className = img.className ? `${img.className} ${customClasses}`.trim() : customClasses;
                }

                if (objectFit) {
                    img.classList.add(`object-fit-${objectFit}`);
                }
                if (objectPosition) {
                    img.style.objectPosition = objectPosition;
                }

                img.onerror = () => {
                    console.warn(`Failed to load primary image: ${src}. Falling back to ${fallbackSrc}.`);
                    img.src = fallbackSrc;
                    if (!isDecorative) {
                        img.setAttribute('alt', alt || 'Placeholder image');
                    }
                    img.onerror = null;
                };

                // Wrap in <figure> with schema.org markup if include-schema is present
                let finalElement = picture;
                if (includeSchema) {
                    const figure = document.createElement('figure');
                    figure.setAttribute('itemscope', '');
                    figure.setAttribute('itemtype', 'https://schema.org/ImageObject');
                    figure.appendChild(picture);
                    if (caption) {
                        const figcaption = document.createElement('figcaption');
                        figcaption.setAttribute('itemprop', 'caption');
                        figcaption.textContent = caption;
                        figure.appendChild(figcaption);
                    }
                    const metaUrl = document.createElement('meta');
                    metaUrl.setAttribute('itemprop', 'url');
                    metaUrl.setAttribute('content', schemaUrl || '');
                    figure.appendChild(metaUrl);
                    const metaDescription = document.createElement('meta');
                    metaDescription.setAttribute('itemprop', 'description');
                    metaDescription.setAttribute('content', schemaDescription || '');
                    figure.appendChild(metaDescription);
                    finalElement = figure;
                }

                this.replaceWith(finalElement);
            } catch (error) {
                console.error('Error in Img connectedCallback:', error);
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
            console.error('Timed out waiting for ImageUtils to be defined. Ensure image-shared.js is loaded correctly.');
            callback();
        }, 5000);
    }
}

customElements.define('bh-img', Img);

class Video extends HTMLElement {
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
        const loading = this.getAttribute('loading') || 'lazy';
        const autoplay = this.hasAttribute('autoplay');
        const muted = this.hasAttribute('muted');
        const loop = this.hasAttribute('loop');
        const playsinline = this.hasAttribute('playsinline');
        const disablepictureinpicture = this.hasAttribute('disablepictureinpicture');

        // Validate src
        if (!src) {
            console.error('The "src" attribute is required for <bh-video>');
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

        // Create video element
        const video = document.createElement('video');
        video.setAttribute('preload', loading === 'lazy' ? 'metadata' : 'auto');
        video.setAttribute('title', alt);
        video.setAttribute('aria-label', alt);
        if (autoplay) video.setAttribute('autoplay', '');
        if (muted) video.setAttribute('muted', '');
        if (loop) video.setAttribute('loop', '');
        if (playsinline) video.setAttribute('playsinline', '');
        if (disablepictureinpicture) video.setAttribute('disablepictureinpicture', '');

        // Apply classes to the video element
        const hostClasses = this.classList;
        hostClasses.forEach(cls => {
            if (cls) video.classList.add(cls);
        });

        // Function to update poster based on current theme
        const updatePoster = (prefersDark) => {
            const activePoster = prefersDark ? (posterDark || poster) : (posterLight || poster);
            if (activePoster) {
                const img = new Image();
                img.src = activePoster;
                img.onload = () => {
                    video.setAttribute('poster', activePoster);
                };
                img.onerror = () => {
                    if (activePoster !== poster && poster) {
                        video.setAttribute('poster', poster);
                    } else {
                        console.warn(`Poster "${activePoster}" failed to load; no poster will be set.`);
                        video.removeAttribute('poster');
                    }
                };
            }
        };

        // Set initial poster (default first, then theme-specific asynchronously)
        if (poster) {
            video.setAttribute('poster', poster);
        }
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        updatePoster(prefersDark);

        // Listen for theme changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', (e) => {
            updatePoster(e.matches);
            video.load(); // Reload to potentially apply new sources
        });

        // Build inner HTML for sources and fallback message
        let innerHTML = '';

        // Function to add sources as HTML strings, with webm before mp4
        const addSourcesHTML = (videoSrc, mediaQuery) => {
            if (!videoSrc) return '';
            const mediaAttr = mediaQuery ? ` media="${mediaQuery}"` : '';
            return `
                <source src="${videoSrc}" type="video/webm"${mediaAttr}>
                <source src="${videoSrc}" type="video/mp4"${mediaAttr}>
            `;
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

        // Set inner HTML all at once
        video.innerHTML = innerHTML;

        // Handle video source errors
        video.addEventListener('error', () => {
            console.warn(`Video source "${video.currentSrc}" failed to load; falling back to default src "${src}".`);
            if (video.currentSrc && video.currentSrc !== src) {
                video.src = src; // Force default src
                video.load();
                if (autoplay) video.play();
            }
        });

        // Replace the custom element with the video element
        this.replaceWith(video);
    }
}

customElements.define('bh-video', Video);

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
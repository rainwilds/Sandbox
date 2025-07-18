class BhCard extends HTMLElement {
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
                console.error('Error in BhCard connectedCallback:', error);
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
            console.error('Timed out waiting for ImageUtils to be defined. Ensure image-shared.js is loaded correctly.');
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
            const hasBackgroundImage = this.hasAttribute('background-image');
            const hasBackgroundOverlay = this.hasAttribute('background-overlay');
            const backgroundOverlayColor = this.getAttribute('background-overlay') || 'light-dark(var(--color-static-light-4), var(--color-static-dark-2))';
            const hasBackgroundColor = this.hasAttribute('background-color');
            const backgroundColorClass = hasBackgroundColor ? this.getAttribute('background-color') : '';
            const hasBorder = this.hasAttribute('border');
            const borderClass = hasBorder ? this.getAttribute('border') : '';
            const hasBorderRadius = this.hasAttribute('border-radius');
            const borderRadiusClass = hasBorderRadius && hasBorder ? this.getAttribute('border-radius') : '';
            const hasBackdropFilter = this.hasAttribute('backdrop-filter');
            // backdropFilterClass can be a space-separated list of classes (e.g., "backdrop-filter-blur-medium backdrop-filter-grayscale-large")
            const backdropFilterClass = hasBackdropFilter ? this.getAttribute('backdrop-filter') : '';
            const classes = this.getAttribute('classes') || '';
            const imgSrc = this.getAttribute('src') || '';
            const lightSrc = this.getAttribute('light-src') || '';
            const darkSrc = this.getAttribute('dark-src') || '';
            const alt = this.getAttribute('alt') || '';
            const width = this.getAttribute('width') || '100vw';
            const aspectRatio = this.getAttribute('aspect-ratio') || '';

            // Build the card with optional background image
            let backgroundImageHTML = '';
            let overlayHTML = '';
            if (hasBackgroundImage && imgSrc) {
                if (typeof ImageUtils === 'undefined') {
                    console.error('ImageUtils is not defined during render. Ensure image-shared.js is loaded before components.js');
                } else {
                    backgroundImageHTML = ImageUtils.generatePictureMarkup({
                        src: imgSrc,
                        lightSrc: lightSrc,
                        darkSrc: darkSrc,
                        alt: alt,
                        width: width,
                        aspectRatio: aspectRatio
                    });
                    console.log('Generated backgroundImageHTML:', backgroundImageHTML); // Debug log
                    // Add the background-overlay div only if the attribute is present
                    if (hasBackgroundOverlay) {
                        // Apply backdrop-filter classes to the background-overlay div
                        overlayHTML = `<div class="background-overlay ${backdropFilterClass}" style="background-color: ${backgroundOverlayColor};"></div>`;
                    }
                }
            } else if (hasBackgroundImage) {
                console.warn('background-image attribute is present, but src is missing. Image will not be displayed.');
                if (hasBackgroundOverlay) {
                    // Apply backdrop-filter classes to the background-overlay div
                    overlayHTML = `<div class="background-overlay ${backdropFilterClass}" style="background-color: ${backgroundOverlayColor};"></div>`;
                }
            }

            // Determine the main div class and content structure
            const mainDivClass = hasBackgroundImage 
                ? `card background-image ${classes} ${backgroundColorClass} ${borderClass} ${borderRadiusClass}`
                : `card ${classes} ${backgroundColorClass} ${borderClass} ${borderRadiusClass}`;
            
            // Check if 'space-between' and 'padding-medium' are in the classes attribute
            const classList = classes.split(' ').filter(cls => cls.length > 0); // Split and filter out empty strings
            const hasSpaceBetween = classList.includes('space-between');
            const hasPaddingMedium = classList.includes('padding-medium');
            // Construct the inner div class dynamically
            const innerDivClasses = [];
            if (hasPaddingMedium) innerDivClasses.push('padding-medium');
            if (hasSpaceBetween) innerDivClasses.push('space-between');
            const innerDivClass = innerDivClasses.length > 0 ? innerDivClasses.join(' ') : '';
            
            const contentHTML = hasBackgroundImage
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

            // Render the HTML structure
            this.innerHTML = `
                <div class="${mainDivClass}">
                    ${backgroundImageHTML || ''}
                    ${overlayHTML}
                    ${contentHTML}
                </div>
            `;
        } catch (error) {
            console.error('Error rendering BhCard:', error);
            // Fallback rendering
            this.innerHTML = `
                <div class="card">
                    <hgroup>
                        <h2>Error</h2>
                        <p>Failed to render card. Check console for details.</p>
                    </hgroup>
                    <a class="button" href="#">Button</a>
                </div>
            `;
        }
    }

    static get observedAttributes() {
        return ['heading', 'description', 'button-href', 'button-text', 'background-image', 'background-overlay', 'background-color', 'border', 'border-radius', 'backdrop-filter', 'classes', 'src', 'light-src', 'dark-src', 'alt', 'width', 'aspect-ratio'];
    }

    attributeChangedCallback() {
        this.waitForImageUtils(() => {
            try {
                this.render();
            } catch (error) {
                console.error('Error in BhCard attributeChangedCallback:', error);
            }
        });
    }
}

customElements.define('bh-card', BhCard);

class Img extends HTMLElement {
    constructor() {
        super();
    }

connectedCallback() {
    this.waitForImageUtils(() => {
        try {
            const src = this.getAttribute('src');
            const lightSrc = this.getAttribute('light-src');
            const darkSrc = this.getAttribute('dark-src');
            const alt = this.getAttribute('alt') || '';
            const aspectRatio = this.getAttribute('aspect-ratio') || '';
            const mobileWidth = this.getAttribute('mobileWidth') || '100vw';  // Default full-width for mobile
            const desktopWidth = this.getAttribute('desktopWidth') || '100vw';  // Default full-width for desktop (adjust if needed)
            const customClasses = this.getAttribute('class') || '';
            const loading = this.hasAttribute('loadingLazy') ? 'lazy' : null;
            const fetchpriority = this.hasAttribute('fetchPriorityHigh') ? 'high' : null;

            if (typeof ImageUtils === 'undefined') {
                console.error('ImageUtils is not defined. Ensure image-utils.js is loaded before components.js');
                return;
            }

            const pictureHTML = ImageUtils.generatePictureMarkup({
                src: src,
                lightSrc: lightSrc,
                darkSrc: darkSrc,
                alt: alt,
                mobileWidth: mobileWidth,
                desktopWidth: desktopWidth,
                aspectRatio: aspectRatio,
                loading: loading,
                fetchpriority: fetchpriority
            });

            if (!pictureHTML) {
                return;
            }

            const div = document.createElement('div');
            div.innerHTML = pictureHTML;
            const picture = div.firstChild;

            const img = picture.querySelector('img');
            if (customClasses) {
                img.className = img.className ? `${img.className} ${customClasses}` : customClasses;
            }

            img.onerror = () => {
                console.warn(`Failed to load primary image: ${src}. Falling back to placeholder.`);
                img.src = 'https://placehold.co/3000x2000';
                img.onerror = null;
            };

            this.replaceWith(picture);
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

class BHVideo extends HTMLElement {
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

        // Extract base filename from src (remove path and extension)
        const baseFilename = src.split('/').pop().split('.')[0];
        if (!baseFilename) {
            console.error('Invalid "src" attribute for <bh-video>: unable to extract base filename');
            return;
        }

        // Extract base filenames for light and dark themes (if provided)
        const lightBaseFilename = srcLight ? srcLight.split('/').pop().split('.')[0] : null;
        const darkBaseFilename = srcDark ? srcDark.split('/').pop().split('.')[0] : null;

        if (srcLight && !lightBaseFilename) {
            console.error('Invalid "src-light" attribute for <bh-video>: unable to extract base filename');
            return;
        }
        if (srcDark && !darkBaseFilename) {
            console.error('Invalid "src-dark" attribute for <bh-video>: unable to extract base filename');
            return;
        }

        // Create video element
        const video = document.createElement('video');
        video.setAttribute('preload', loading === 'lazy' ? 'metadata' : 'auto');
        video.setAttribute('title', alt);
        if (autoplay) video.setAttribute('autoplay', '');
        if (muted) video.setAttribute('muted', '');
        if (loop) video.setAttribute('loop', '');
        if (playsinline) video.setAttribute('playsinline', '');
        if (disablepictureinpicture) video.setAttribute('disablepictureinpicture', '');

        // Apply classes to the video element using classList (without bh-video-inner)
        const hostClasses = this.classList;
        hostClasses.forEach(cls => {
            if (cls) video.classList.add(cls);
        });

        // Select initial poster based on prefers-color-scheme (optimistic)
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        let activePoster = prefersDark ? (posterDark || poster) : (posterLight || poster);

        // Set up poster fallback without blocking
        if (activePoster) {
            const img = new Image();
            img.src = activePoster;
            img.onerror = () => {
                if (activePoster !== poster) {
                    activePoster = poster;
                    if (activePoster) {
                        const fallbackImg = new Image();
                        fallbackImg.src = activePoster;
                        fallbackImg.onerror = () => {
                            console.warn(`Default poster "${activePoster}" failed to load; no poster will be set.`);
                            video.removeAttribute('poster');
                        };
                        fallbackImg.onload = () => {
                            video.setAttribute('poster', activePoster);
                        };
                    }
                }
            };
            img.onload = () => {
                video.setAttribute('poster', activePoster);
            };
        }

        // Build inner HTML for sources and fallback message
        let innerHTML = '';

        // Function to add WEBM and MP4 sources as HTML strings
        const addSourcesHTML = (videoSrc, mediaQuery) => {
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

        // Append video element to the DOM
        this.appendChild(video);

        // Handle video source errors (simplified)
        video.addEventListener('error', () => {
            if (video.currentSrc && video.currentSrc !== src) {
                video.src = src; // Force default src
                video.load();
                if (autoplay) video.play();
            }
        });
    }
}

customElements.define('bh-video', BHVideo);

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
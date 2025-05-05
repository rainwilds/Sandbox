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


class Img extends HTMLElement {
  // Configuration constants
  static WIDTHS = [768, 980, 1366, 1920, 2560, 3840];
  static FORMATS = ['avif', 'webp', 'jpeg'];
  static VALID_ASPECT_RATIOS = ['16/9', '9/16', '3/2', '2/3', '1/1'];
  static SIZES_BREAKPOINTS = [
    { maxWidth: 768, baseValue: '100vw' },
    { maxWidth: 980, baseValue: '100vw' },
    { maxWidth: 1366, baseValue: '100vw' },
    { maxWidth: 1920, baseValue: '100vw' },
    { maxWidth: 2560, baseValue: '100vw' },
    { maxWidth: 3840, baseValue: '100vw' },
  ];

  // Extract DEFAULT_SIZE directly from the last breakpoint's maxWidth
  static DEFAULT_SIZE = `${Img.SIZES_BREAKPOINTS[Img.SIZES_BREAKPOINTS.length - 1].maxWidth}px`; // 3840px

  constructor() {
    super();
  }

  connectedCallback() {
    const src = this.getAttribute('src');
    const lightSrc = this.getAttribute('light-src');
    const darkSrc = this.getAttribute('dark-src');
    const alt = this.getAttribute('alt') || '';
    const aspectRatio = this.getAttribute('aspect-ratio') || '';
    const width = this.getAttribute('width') || '100vw'; // Default to 100vw for hero image assumption
    const customClasses = this.getAttribute('class') || ''; // Get custom classes from the class attribute

    // Validate src
    if (!src) {
      console.error('The "src" attribute is required for <bh-img>');
      return;
    }

    // Extract base filename from src (remove path and extension)
    let baseFilename = src.split('/').pop().split('.')[0];
    if (!baseFilename) {
      console.error('Invalid "src" attribute for <bh-img>: unable to extract base filename');
      return;
    }

    // Extract base filenames for light and dark themes (if provided)
    let lightBaseFilename = lightSrc ? lightSrc.split('/').pop().split('.')[0] : null;
    let darkBaseFilename = darkSrc ? darkSrc.split('/').pop().split('.')[0] : null;

    if (lightSrc && !lightBaseFilename) {
      console.error('Invalid "light-src" attribute for <bh-img>: unable to extract base filename');
      return;
    }
    if (darkSrc && !darkBaseFilename) {
      console.error('Invalid "dark-src" attribute for <bh-img>: unable to extract base filename');
      return;
    }

    // Use the src directly as the primary image path (fallback for <img>)
    const primaryImagePath = src;

    // Parse width (e.g., "100vw" or "40vw")
    const widthMatch = width.match(/(\d+)vw/);
    let widthPercentage = widthMatch ? parseInt(widthMatch[1]) / 100 : 1.0; // Default to 1.0 (100vw) if invalid

    // Validate widthPercentage (between 0.1 and 2.0)
    widthPercentage = Math.max(0.1, Math.min(2.0, widthPercentage));

    // Generate sizes attribute dynamically, scaling based on width (no multiplier, DPR handles scaling)
    const sizes = [
      ...Img.SIZES_BREAKPOINTS.map(bp => `(max-width: ${bp.maxWidth}px) ${widthPercentage * 100}vw`),
      `${parseInt(Img.DEFAULT_SIZE) * widthPercentage}px`
    ].join(', ');

    // Create picture element
    const picture = document.createElement('picture');
    picture.className = 'animate animate-fade-in';

    // Use DocumentFragment to batch DOM operations
    const fragment = document.createDocumentFragment();
    Img.FORMATS.forEach(format => {
      // If both lightSrc and darkSrc are provided, add theme-specific sources
      if (lightSrc && darkSrc) {
        // Source for light theme
        const sourceLight = document.createElement('source');
        const srcsetLight = Img.WIDTHS.map(w => `./img/responsive/${lightBaseFilename}-${w}.${format} ${w}w`).join(', ');
        sourceLight.srcset = srcsetLight;
        sourceLight.sizes = sizes;
        sourceLight.type = `image/${format}`;
        sourceLight.media = '(prefers-color-scheme: light)';
        fragment.appendChild(sourceLight);

        // Source for dark theme
        const sourceDark = document.createElement('source');
        const srcsetDark = Img.WIDTHS.map(w => `./img/responsive/${darkBaseFilename}-${w}.${format} ${w}w`).join(', ');
        sourceDark.srcset = srcsetDark;
        sourceDark.sizes = sizes;
        sourceDark.type = `image/${format}`;
        sourceDark.media = '(prefers-color-scheme: dark)';
        fragment.appendChild(sourceDark);
      }

      // Default source (used if no theme match or if light/dark src not provided)
      const source = document.createElement('source');
      const srcset = Img.WIDTHS.map(w => `./img/responsive/${baseFilename}-${w}.${format} ${w}w`).join(', ');
      source.srcset = srcset;
      source.sizes = sizes;
      source.type = `image/${format}`;
      fragment.appendChild(source);
    });
    picture.appendChild(fragment);

    // Create img element
    const img = document.createElement('img');
    img.src = primaryImagePath;
    if (alt) img.alt = alt; // Only set alt if non-empty
    img.setAttribute('loading', 'lazy'); // Explicitly set for clarity

    // Combine aspect ratio class (if present) with custom classes
    let imgClasses = [];
    if (aspectRatio && Img.VALID_ASPECT_RATIOS.includes(aspectRatio)) {
      const aspectRatioClass = `aspect-ratio-${aspectRatio.replace('/', '-')}`;
      imgClasses.push(aspectRatioClass);
    }
    if (customClasses) {
      imgClasses.push(customClasses);
    }
    if (imgClasses.length > 0) {
      img.className = imgClasses.join(' ');
    }

    // Re-enable onerror handler with a console warning for debugging
    img.onerror = () => {
      console.warn(`Failed to load primary image: ${primaryImagePath}. Falling back to placeholder.`);
      img.src = 'https://placehold.co/3000x2000';
      img.onerror = null; // Prevent infinite loop if placeholder also fails
    };

    picture.appendChild(img);
    this.appendChild(picture);
  }
}

customElements.define('bh-img', Img);


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

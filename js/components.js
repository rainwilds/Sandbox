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
    const className = this.getAttribute('class') || '';

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
    if (className) video.className = className;

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

    // Add fallback message
    innerHTML += `<p>Your browser does not support the video tag. <a href="${src}">Download video</a></p>`;

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

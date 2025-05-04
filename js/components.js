class BHVideo extends HTMLElement {
  constructor() {
    super();
  }

  async connectedCallback() {
    const src = this.getAttribute('src');
    const srcLight = this.getAttribute('src-light');
    const srcDark = this.getAttribute('src-dark');
    const poster = this.getAttribute('poster');
    const posterLight = this.getAttribute('poster-light');
    const posterDark = this.getAttribute('poster-dark');
    const alt = this.getAttribute('alt') || 'Video content';
    const loading = this.getAttribute('loading') || 'lazy';
    const autoplay = this.hasAttribute('autoplay') ? 'autoplay' : '';
    const muted = this.hasAttribute('muted') ? 'muted' : '';
    const loop = this.hasAttribute('loop') ? 'loop' : '';
    const playsinline = this.hasAttribute('playsinline') ? 'playsinline' : '';
    const disablepictureinpicture = this.hasAttribute('disablepictureinpicture') ? 'disablepictureinpicture' : '';
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

    // Function to check if an image is loadable
    const canLoadImage = (url) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = url;
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
      });
    };

    // Select poster based on prefers-color-scheme and check availability
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    let activePoster = prefersDark ? (posterDark || poster) : (posterLight || poster);
    if (activePoster) {
      const canLoadPoster = await canLoadImage(activePoster);
      if (!canLoadPoster) {
        activePoster = poster; // Fall back to default poster if light/dark fails
        if (activePoster) {
          const canLoadDefaultPoster = await canLoadImage(activePoster);
          if (!canLoadDefaultPoster) {
            activePoster = null; // No poster if both fail
          }
        }
      }
      if (activePoster) video.setAttribute('poster', activePoster);
    }

    // Use DocumentFragment to batch DOM operations
    const fragment = document.createDocumentFragment();

    // Add source for light theme if provided
    if (srcLight) {
      const sourceLight = document.createElement('source');
      sourceLight.src = srcLight;
      sourceLight.type = srcLight.endsWith('.webm') ? 'video/webm' : 'video/mp4';
      sourceLight.media = '(prefers-color-scheme: light)';
      fragment.appendChild(sourceLight);
    }

    // Add source for dark theme if provided
    if (srcDark) {
      const sourceDark = document.createElement('source');
      sourceDark.src = srcDark;
      sourceDark.type = srcDark.endsWith('.webm') ? 'video/webm' : 'video/mp4';
      sourceDark.media = '(prefers-color-scheme: dark)';
      fragment.appendChild(sourceDark);
    }

    // Default source (always included as fallback)
    const sourceDefault = document.createElement('source');
    sourceDefault.src = src;
    sourceDefault.type = src.endsWith('.webm') ? 'video/webm' : 'video/mp4';
    fragment.appendChild(sourceDefault);

    // Fallback message
    const fallback = document.createElement('p');
    fallback.innerHTML = `Your browser does not support the video tag. <a href="${src}">Download video</a>`;
    fragment.appendChild(fallback);

    video.appendChild(fragment);
    this.appendChild(video);

    // Handle video source errors and ensure playback
    video.addEventListener('error', () => {
      if (video.currentSrc && video.currentSrc !== src) {
        const sources = video.querySelectorAll('source');
        for (const source of sources) {
          if (source.src === video.currentSrc) {
            source.remove();
            break;
          }
        }
        video.src = src; // Force default src
        video.load();
        if (autoplay) video.play();
      }
    });

    // Ensure playback starts once the video is ready
    video.addEventListener('loadeddata', () => {
      if (autoplay) {
        video.play().catch((err) => {
          console.warn('Autoplay failed:', err);
        });
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

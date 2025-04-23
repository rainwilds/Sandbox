class Img extends HTMLElement {
  // Configuration constants
  static WIDTHS = [768, 980, 1366, 1920, 2560, 3840];
  static FORMATS = ['avif', 'webp', 'jpeg'];
  static VALID_ASPECT_RATIOS = ['16/9', '9/16', '3/2', '2/3', '1/1'];
  static SIZES_BREAKPOINTS = [
    { maxWidth: 768, baseValue: '100vw' }, // At 768px, this evaluates to 768px (100vw = 768)
    { maxWidth: 980, baseValue: '100vw' }, // At 980px, this evaluates to 980px (100vw = 980)
    { maxWidth: 1366, baseValue: '100vw' }, // At 1366px, this evaluates to 1366px (100vw = 1366)
    { maxWidth: 1920, baseValue: '100vw' }, // At 1920px, this evaluates to 1920px (100vw = 1920)
    { maxWidth: 2560, baseValue: '100vw' }, // At 2560px, this evaluates to 2560px (100vw = 2560)
    { maxWidth: 3840, baseValue: '100vw' }, // At 3840px, this evaluates to 3840px (100vw = 3840)
  ];

  // Calculate DEFAULT_SIZE based on the last breakpoint (actual layout size, no multiplier)
  static DEFAULT_SIZE = (() => {
    const lastBreakpoint = Img.SIZES_BREAKPOINTS[Img.SIZES_BREAKPOINTS.length - 1];
    const viewportWidth = lastBreakpoint.maxWidth;
    const percentageMatch = lastBreakpoint.baseValue.match(/(\d+)vw/);
    const percentage = percentageMatch ? parseInt(percentageMatch[1]) / 100 : 1;
    const defaultSize = viewportWidth * percentage; // 3840 * 1.0 = 3840
    return `${defaultSize}px`; // '3840px'
  })();

  constructor() {
    super();
  }

  connectedCallback() {
    const src = this.getAttribute('src');
    const alt = this.getAttribute('alt') || '';
    const aspectRatio = this.getAttribute('aspect-ratio') || '';
    const imageWidth = this.getAttribute('image-width') || '100vw'; // Default to 100vw for hero image assumption

    // Validate src
    if (!src) {
      console.error('The "src" attribute is required for <bh-img>');
      return;
    }

    // Normalize src to extract base filename (remove path, extension, and -3840)
    let baseFilename = src.split('/').pop().split('.')[0];
    baseFilename = baseFilename.replace(/-3840$/, '');
    if (!baseFilename) {
      console.error('Invalid "src" attribute for <bh-img>: unable to extract base filename');
      return;
    }

    // Construct primary image path
    const primaryImagePath = `img/primary/${baseFilename}-3840.jpg`;

    // Parse image-width (e.g., "100vw" or "40vw")
    const widthMatch = imageWidth.match(/(\d+)vw/);
    let widthPercentage = widthMatch ? parseInt(widthMatch[1]) / 100 : 1.0; // Default to 1.0 (100vw) if invalid

    // Validate widthPercentage (between 0.1 and 2.0)
    widthPercentage = Math.max(0.1, Math.min(2.0, widthPercentage));

    // Generate sizes attribute dynamically, scaling based on image-width (no multiplier, DPR handles scaling)
    const sizes = [
      ...Img.SIZES_BREAKPOINTS.map(bp => {
        const baseMatch = bp.baseValue.match(/(\d+)vw/);
        const basePercentage = baseMatch ? parseInt(baseMatch[1]) / 100 : 1;
        const scaledPercentage = basePercentage * widthPercentage;
        return `(max-width: ${bp.maxWidth}px) ${scaledPercentage * 100}vw`;
      }),
      `${parseInt(Img.DEFAULT_SIZE) * widthPercentage}px`
    ].join(', ');

    // Generate the base srcset string once (without format)
    const srcsetBase = Img.WIDTHS.map(w => `img/responsive/${baseFilename}-${w}`).join(', ');

    // Create picture element
    const picture = document.createElement('picture');
    picture.className = 'animate animate-fade-in';

    // Use DocumentFragment to batch DOM operations
    const fragment = document.createDocumentFragment();
    Img.FORMATS.forEach(format => {
      const source = document.createElement('source');
      source.srcset = `${srcsetBase}.${format}`.replace(/,/g, `.${format},`) + ` ${Img.WIDTHS.join('w, ')}w`;
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

    // Apply aspect ratio class if valid
    if (aspectRatio && Img.VALID_ASPECT_RATIOS.includes(aspectRatio)) {
      const aspectRatioClass = `aspect-ratio-${aspectRatio.replace('/', '-')}`;
      img.className = aspectRatioClass;
    }

    // Add onerror handler to fall back to placeholder
    img.onerror = () => {
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


class Img extends HTMLElement {
  // Configuration constants
  static WIDTHS = [768, 980, 1366, 1920, 2560, 3840];
  static FORMATS = ['avif', 'webp', 'jpeg'];
  static VALID_ASPECT_RATIOS = ['16/9', '9/16', '3/2', '2/3', '1/1'];
  static SIZES_BREAKPOINTS = [
    { maxWidth: 768, value: 'calc(100vw * 1.5)' }, // At 768px, this evaluates to 1152px (100vw * 1.5 = 1.0 * 768 * 1.5)
    { maxWidth: 980, value: 'calc(60vw * 1.5)' }, // At 980px, this evaluates to 882px (60vw * 1.5 = 0.6 * 980 * 1.5)
    { maxWidth: 1366, value: 'calc(75vw * 1.5)' }, // At 1366px, this evaluates to 1537px (75vw * 1.5 = 0.75 * 1366 * 1.5)
    { maxWidth: 1920, value: 'calc(75vw * 1.5)' }, // At 1920px, this evaluates to 2160px (75vw * 1.5 = 0.75 * 1920 * 1.5)
    { maxWidth: 2560, value: 'calc(75vw * 1.5)' }, // At 2560px, this evaluates to 2880px (75vw * 1.5 = 0.75 * 2560 * 1.5)
    { maxWidth: 3840, value: 'calc(75vw * 1.5)' }, // At 3840px, this evaluates to 4320px (75vw * 1.5 = 0.75 * 3840 * 1.5)
  ];

  // Calculate DEFAULT_SIZE based on the last breakpoint
  static DEFAULT_SIZE = (() => {
    const lastBreakpoint = Img.SIZES_BREAKPOINTS[Img.SIZES_BREAKPOINTS.length - 1];
    const viewportWidth = lastBreakpoint.maxWidth;
    const value = lastBreakpoint.value; // 'calc(75vw * 1.5)'
    // Extract the percentage (75vw) and multiplier (1.5) from the calc expression
    const percentage = 0.75; // 75vw
    const multiplier = 1.5; // * 1.5
    const defaultSize = viewportWidth * percentage * multiplier; // 3840 * 0.75 * 1.5 = 4320
    return `${defaultSize}px`; // '4320px'
  })();

  constructor() {
    super();
  }

  connectedCallback() {
    const src = this.getAttribute('src');
    const alt = this.getAttribute('alt') || '';
    const aspectRatio = this.getAttribute('aspect-ratio') || '';

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

    // Generate sizes attribute dynamically
    const sizes = [
      ...Img.SIZES_BREAKPOINTS.map(bp => `(max-width: ${bp.maxWidth}px) ${bp.value}`),
      Img.DEFAULT_SIZE
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


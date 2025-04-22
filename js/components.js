class Img extends HTMLElement {
  constructor() {
    super();
  }

  connectedCallback() {
    const src = this.getAttribute('src') || '';
    const alt = this.getAttribute('alt') || '';
    const aspectRatio = this.getAttribute('aspect-ratio') || '';

    // Normalize src to extract base filename (remove path, extension, and -3840)
    let baseFilename = src.split('/').pop().split('.')[0]; // Get filename without path or extension
    baseFilename = baseFilename.replace(/-3840$/, ''); // Remove -3840 if present
    // Construct primary image path with -3840 in img/primary/ using relative path
    const primaryImagePath = `img/primary/${baseFilename}-3840.jpg`;

    const widths = [768, 980, 1366, 1920, 2560, 3840];
    const formats = ['avif', 'webp', 'jpeg'];

    const generateSrcset = (format) => 
      widths.map(w => `img/responsive/${baseFilename}-${w}.${format} ${w}w`).join(',\n');

    const sizes = `(max-width: 768px) calc(100vw * 1.5),
                   (max-width: 980px) calc(60vw * 1.5),
                   (max-width: 1366px) calc(75vw * 1.5),
                   (max-width: 1920px) calc(75vw * 1.5),
                   (max-width: 2560px) calc(75vw * 1.5),
                   (max-width: 3840px) calc(75vw * 1.5),
                   2880px`;

    const picture = document.createElement('picture');
    picture.className = 'animate animate-fade-in';

    formats.forEach(format => {
      const source = document.createElement('source');
      source.srcset = generateSrcset(format);
      source.sizes = sizes;
      source.type = `image/${format}`;
      picture.appendChild(source);
    });

    const img = document.createElement('img');
    img.src = primaryImagePath; // Use relative path for the primary image
    img.alt = alt;
    img.loading = 'lazy';
    if (aspectRatio) {
      // Convert the aspect-ratio value (e.g., "16/9") to a class name (e.g., "aspect-ratio-16-9")
      const aspectRatioClass = `aspect-ratio-${aspectRatio.replace('/', '-')}`;
      img.className = aspectRatioClass;
    }

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


import { generatePictureMarkup } from '../image-generator.js';
import { VALID_ALIGNMENTS, alignMap, VALID_HEADING_TAGS, sanitizeClassNames, sanitizeStyles, withLazyLoading, withRenderCaching } from '../shared.js';

(async () => {
  try {
    console.log('Successfully imported dependencies for CustomHeader');

    await Promise.all([
      customElements.whenDefined('custom-logo'),
      customElements.whenDefined('custom-nav')
    ]);
    console.log('CustomLogo and CustomNav defined');

    class CustomHeaderBase extends HTMLElement {
      constructor() {
        super();
        this.isVisible = false;
        this.isInitialized = false;
        this.callbacks = [];
        this.cachedAttributes = null;
      }

      getAttributes() {
        if (this.cachedAttributes) {
          console.log('Using cached attributes for CustomHeader');
          return this.cachedAttributes;
        }
        const attrs = {
          heading: this.getAttribute('heading') || '',
          headingTag: this.getAttribute('heading-tag') || 'h2',
          innerAlignment: this.getAttribute('inner-alignment') || 'center',
          textAlignment: this.getAttribute('text-alignment') || 'center',
          backgroundSrc: this.getAttribute('img-background-src') || '',
          backgroundLightSrc: this.getAttribute('img-background-light-src') || '',
          backgroundDarkSrc: this.getAttribute('img-background-dark-src') || '',
          backgroundAlt: this.getAttribute('img-background-alt') || '',
          backgroundOverlay: this.getAttribute('background-overlay') || '',
          customClasses: sanitizeClassNames(this.getAttribute('class') || ''),
          styleAttribute: sanitizeStyles(this.getAttribute('style') || '', [
            'color', 'background-color', 'border', 'border-radius', 'padding', 'margin',
            'font-size', 'font-weight', 'text-align', 'display', 'width', 'height'
          ]),
          sticky: this.hasAttribute('sticky'),
          logoPlacement: this.getAttribute('logo-placement') || 'independent',
          navLogoContainerStyle: sanitizeStyles(this.getAttribute('nav-logo-container-style') || '', [
            'color', 'background-color', 'border', 'border-radius', 'padding', 'margin',
            'font-size', 'font-weight', 'text-align', 'display', 'width', 'height'
          ]),
          navLogoContainerClass: sanitizeClassNames(this.getAttribute('nav-logo-container-class') || ''),
          navAlignment: this.getAttribute('nav-alignment') || 'center'
        };

        if (!VALID_HEADING_TAGS.includes(attrs.headingTag.toLowerCase())) {
          console.warn(`Invalid heading-tag "${attrs.headingTag}". Must be one of ${VALID_HEADING_TAGS.join(', ')}. Defaulting to 'h2'.`);
          attrs.headingTag = 'h2';
        }
        if (attrs.innerAlignment && !VALID_ALIGNMENTS.includes(attrs.innerAlignment)) {
          console.warn(`Invalid inner-alignment "${attrs.innerAlignment}". Must be one of ${VALID_ALIGNMENTS.join(', ')}. Defaulting to 'center'.`);
          attrs.innerAlignment = 'center';
        }
        if (attrs.textAlignment && !['left', 'center', 'right'].includes(attrs.textAlignment)) {
          console.warn(`Invalid text-alignment "${attrs.textAlignment}". Must be one of left, center, right. Defaulting to 'center'.`);
          attrs.textAlignment = 'center';
        }
        if (!['independent', 'nav'].includes(attrs.logoPlacement)) {
          console.warn(`Invalid logo-placement "${attrs.logoPlacement}". Must be 'independent' or 'nav'. Defaulting to 'independent'.`);
          attrs.logoPlacement = 'independent';
        }
        if (!VALID_ALIGNMENTS.includes(attrs.navAlignment)) {
          console.warn(`Invalid nav-alignment "${attrs.navAlignment}". Must be one of ${VALID_ALIGNMENTS.join(', ')}. Defaulting to 'center'.`);
          attrs.navAlignment = 'center';
        }
        if ((attrs.backgroundLightSrc || attrs.backgroundDarkSrc) && !(attrs.backgroundLightSrc && attrs.backgroundDarkSrc) && !attrs.backgroundSrc) {
          console.error('Both img-background-light-src and img-background-dark-src must be present when using light/dark themes, or use img-background-src alone.');
          attrs.backgroundSrc = '';
          attrs.backgroundLightSrc = '';
          attrs.backgroundDarkSrc = '';
        }
        if ((attrs.backgroundLightSrc || attrs.backgroundDarkSrc) && !attrs.backgroundAlt) {
          console.error('img-background-alt is required when img-background-light-src or img-background-dark-src is provided.');
          attrs.backgroundLightSrc = '';
          attrs.backgroundDarkSrc = '';
        }
        this.cachedAttributes = attrs;
        console.log('CustomHeader attributes:', attrs);
        return attrs;
      }

      initialize() {
        if (this.isInitialized || !this.isVisible) return;
        console.log('** CustomHeader start...', this.outerHTML);
        this.isInitialized = true;
        try {
          const headerElement = this.render();
          if (headerElement) {
            console.log('Replacing CustomHeader with:', headerElement.outerHTML);
            this.replaceWith(headerElement);
            this.callbacks.forEach(callback => callback());
          } else {
            console.error('Failed to render CustomHeader: headerElement is null or invalid.', this.outerHTML);
            this.replaceWith(this.render(true));
          }
        } catch (error) {
          console.error('Error initializing CustomHeader:', error, this.outerHTML);
          this.replaceWith(this.render(true));
        }
        console.log('** CustomHeader end...');
      }

      render(isFallback = false) {
        console.log('Rendering CustomHeader, isFallback:', isFallback);
        const attrs = isFallback ? {
          heading: '',
          headingTag: 'h2',
          innerAlignment: 'center',
          textAlignment: 'center',
          backgroundSrc: '',
          backgroundLightSrc: '',
          backgroundDarkSrc: '',
          backgroundAlt: '',
          backgroundOverlay: '',
          customClasses: '',
          styleAttribute: '',
          sticky: false,
          logoPlacement: 'independent',
          navLogoContainerStyle: '',
          navLogoContainerClass: '',
          navAlignment: 'center'
        } : this.getAttributes();

        const blockElement = document.createElement('header');
        blockElement.setAttribute('role', 'banner');
        const headerClasses = [
          'block',
          attrs.backgroundSrc || attrs.backgroundLightSrc || attrs.backgroundDarkSrc ? 'background-image' : '',
          attrs.customClasses,
          attrs.sticky ? 'sticky' : ''
        ].filter(cls => cls).join(' ').trim();
        blockElement.className = headerClasses;

        if (attrs.sticky) {
          blockElement.style.position = 'sticky';
          blockElement.style.top = '0';
          blockElement.style.zIndex = '1000';
        }
        if (attrs.styleAttribute) {
          blockElement.setAttribute('style', attrs.styleAttribute);
        }

        let backgroundContentHTML = '';
        let overlayHTML = '';
        const hasBackgroundImage = attrs.backgroundSrc || attrs.backgroundLightSrc || attrs.backgroundDarkSrc;
        if (!isFallback && hasBackgroundImage) {
          const src = attrs.backgroundSrc || attrs.backgroundLightSrc || attrs.backgroundDarkSrc;
          if (!src) {
            console.warn('No valid background image source provided for <custom-header>. Skipping background image rendering.');
          } else {
            console.log('Generating hero image for:', { src, lightSrc: attrs.backgroundLightSrc, darkSrc: attrs.backgroundDarkSrc });
            backgroundContentHTML = generatePictureMarkup({
              src: attrs.backgroundSrc,
              lightSrc: attrs.backgroundLightSrc,
              darkSrc: attrs.backgroundDarkSrc,
              alt: attrs.backgroundAlt,
              lightAlt: attrs.backgroundAlt,
              darkAlt: attrs.backgroundAlt,
              isDecorative: false,
              customClasses: '',
              loading: 'lazy',
              fetchPriority: '',
              extraClasses: [],
              mobileWidth: '100vw',
              tabletWidth: '100vw',
              desktopWidth: '100vw',
              aspectRatio: '',
              includeSchema: false,
              extraStyles: 'object-fit: cover; width: 100%; height: 100%;'
            });
            console.log('Generated hero image markup:', backgroundContentHTML);
          }
        }
        if (attrs.backgroundOverlay && hasBackgroundImage) {
          const overlayClasses = [attrs.backgroundOverlay];
          overlayHTML = `<div class="${overlayClasses.join(' ').trim()}"></div>`;
          console.log('Generated overlay HTML:', overlayHTML);
        }

        const customLogo = this.querySelector('custom-logo');
        const customNav = this.querySelector('custom-nav');
        let logoHTML = '';
        let navHTML = '';

        if (customLogo && !isFallback) {
          if (customElements.get('custom-logo')) {
            customElements.upgrade(customLogo);
            if (typeof customLogo.initialize === 'function') {
              customLogo.initialize();
            }
            logoHTML = customLogo.render ? customLogo.render() : customLogo.outerHTML;
            console.log('Generated logo HTML:', logoHTML);
          } else {
            console.warn('custom-logo not defined, using placeholder.');
            logoHTML = '<div>Logo placeholder</div>';
          }
        }

        if (customNav && !isFallback) {
          if (customElements.get('custom-nav')) {
            customElements.upgrade(customNav);
            if (typeof customNav.initialize === 'function') {
              customNav.initialize();
            }
            navHTML = customNav.render ? customNav.render() : customNav.outerHTML;
            console.log('Generated nav HTML:', navHTML);
          } else {
            console.warn('custom-nav not defined, using placeholder.');
            navHTML = '<div>Navigation placeholder</div>';
          }
        }

        const textAlignMap = {
          'left': 'flex-column-left text-align-left',
          'center': 'flex-column-center text-align-center',
          'right': 'flex-column-right text-align-right'
        };
        const contentHTML = `
          <div${attrs.innerAlignment ? ` class="${alignMap[attrs.innerAlignment]}"` : ''}>
            <div role="group"${attrs.textAlignment ? ` class="${textAlignMap[attrs.textAlignment]}"` : ''}>
              ${attrs.heading ? `<${attrs.headingTag}>${attrs.heading}</${attrs.headingTag}>` : ''}
            </div>
          </div>
        `;
        console.log('Generated content HTML:', contentHTML);

        let innerHTML = '';
        if (hasBackgroundImage) {
          innerHTML += backgroundContentHTML || '';
          if (attrs.backgroundOverlay) {
            innerHTML += overlayHTML;
          }
        }

        if (attrs.logoPlacement === 'nav' && logoHTML && navHTML) {
          const navAlignClass = attrs.navAlignment ? alignMap[attrs.navAlignment] : '';
          innerHTML += `
            <div${attrs.navLogoContainerClass ? ` class="${attrs.navLogoContainerClass}"` : ''}${attrs.navLogoContainerStyle ? ` style="${attrs.navLogoContainerStyle}"` : ''}>
              ${logoHTML}
              <div${navAlignClass ? ` class="${navAlignClass}"` : ''}>
                ${navHTML}
              </div>
            </div>
          `;
        } else {
          innerHTML += logoHTML + navHTML;
        }
        innerHTML += contentHTML;

        blockElement.innerHTML = innerHTML;
        console.log('Final header HTML:', blockElement.outerHTML);
        return blockElement;
      }

      addCallback(callback) {
        this.callbacks.push(callback);
      }

      connectedCallback() {
        if (this.isVisible) {
          this.initialize();
        }
      }

      disconnectedCallback() {
        this.callbacks = [];
        this.cachedAttributes = null;
      }

      static get observedAttributes() {
        return [
          'heading', 'heading-tag', 'inner-alignment', 'text-alignment',
          'img-background-src', 'img-background-light-src', 'img-background-dark-src',
          'img-background-alt', 'background-overlay', 'class', 'style', 'sticky',
          'logo-placement', 'nav-logo-container-style', 'nav-logo-container-class',
          'nav-alignment'
        ];
      }

      attributeChangedCallback(name, oldValue, newValue) {
        if (!this.isInitialized || !this.isVisible) return;
        console.log('CustomHeader attribute changed:', name, oldValue, newValue);
        this.cachedAttributes = null;
        this.initialize();
      }
    }

    const CustomHeader = withRenderCaching(withLazyLoading(CustomHeaderBase));

    if (!customElements.get('custom-header')) {
      customElements.define('custom-header', CustomHeader);
      console.log('CustomHeader defined successfully');
    }
    document.querySelectorAll('custom-header').forEach(element => {
      customElements.upgrade(element);
    });
  } catch (error) {
    console.error('Failed to define CustomHeader:', error);
  }
})();
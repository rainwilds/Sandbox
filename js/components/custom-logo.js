import { generatePictureMarkup } from '../image-generator.js';
import {
  VALID_ALIGNMENTS, alignMap, IMAGE_WIDTHS, validateCssLength,
  withLazyLoading, withRenderCaching
} from '../shared.js';

class CustomLogoBase extends HTMLElement {
  constructor() {
    super();
    this.handleThemeChange = this.handleThemeChange.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.handleMutation = this.handleMutation.bind(this);
    this.cachedAttributes = null;
  }

  getAttributes() {
    if (this.cachedAttributes) {
      return this.cachedAttributes;
    }
    const attrs = {
      fullPrimarySrc: this.getAttribute('logo-full-primary-src') || '',
      fullLightSrc: this.getAttribute('logo-full-light-src') || '',
      fullDarkSrc: this.getAttribute('logo-full-dark-src') || '',
      fullPrimaryAlt: this.getAttribute('logo-full-primary-alt') || '',
      fullLightAlt: this.getAttribute('logo-full-light-alt') || '',
      fullDarkAlt: this.getAttribute('logo-full-dark-alt') || '',
      fullPosition: this.getAttribute('logo-full-position') || '',
      iconPrimarySrc: this.getAttribute('logo-icon-primary-src') || '',
      iconLightSrc: this.getAttribute('logo-icon-light-src') || '',
      iconDarkSrc: this.getAttribute('logo-icon-dark-src') || '',
      iconPrimaryAlt: this.getAttribute('logo-icon-primary-alt') || '',
      iconLightAlt: this.getAttribute('logo-icon-light-alt') || '',
      iconDarkAlt: this.getAttribute('logo-icon-dark-alt') || '',
      iconPosition: this.getAttribute('logo-icon-position') || '',
      breakpoint: this.getAttribute('logo-breakpoint') || '',
      height: validateCssLength(this.getAttribute('logo-height') || '')
    };

    const hasFullSource = attrs.fullPrimarySrc || (attrs.fullLightSrc && attrs.fullDarkSrc);
    const hasIconSource = attrs.iconPrimarySrc || (attrs.iconLightSrc && attrs.iconDarkSrc);
    if (!hasFullSource && !hasIconSource) {
      console.error('At least one of logo-full-primary-src, (logo-full-light-src and logo-full-dark-src), logo-icon-primary-src, or (logo-icon-light-src and logo-icon-dark-src) must be provided');
      return attrs;
    }

    const validatePair = (light, dark, label) => {
      if ((light || dark) && !(light && dark)) {
        console.error(`Both ${label}-light-src and ${label}-dark-src must be provided if one is specified.`);
        return false;
      }
      return true;
    };
    if (!validatePair(attrs.fullLightSrc, attrs.fullDarkSrc, 'logo-full') ||
        !validatePair(attrs.iconLightSrc, attrs.iconDarkSrc, 'logo-icon')) {
      return attrs;
    }

    if (!attrs.fullPrimaryAlt && !attrs.fullLightAlt && !attrs.fullDarkAlt &&
        !attrs.iconPrimaryAlt && !attrs.iconLightAlt && !attrs.iconDarkAlt) {
      attrs.isDecorative = true;
    } else {
      if (attrs.fullPrimarySrc && !attrs.fullPrimaryAlt) {
        console.error('logo-full-primary-alt is required when logo-full-primary-src is provided.');
      }
      if (attrs.iconPrimarySrc && !attrs.iconPrimaryAlt) {
        console.error('logo-icon-primary-alt is required when logo-icon-primary-src is provided.');
      }
      if (attrs.fullLightSrc && attrs.fullDarkSrc && !(attrs.fullLightAlt && attrs.fullDarkAlt)) {
        console.error('Both logo-full-light-alt and logo-full-dark-alt are required when logo-full-light-src and logo-full-dark-src are provided.');
      }
      if (attrs.iconLightSrc && attrs.iconDarkSrc && !(attrs.iconLightAlt && attrs.iconDarkAlt)) {
        console.error('Both logo-icon-light-alt and logo-icon-dark-alt are required when logo-icon-light-src and logo-icon-dark-src are provided.');
      }
    }

    if (attrs.fullPosition && !VALID_ALIGNMENTS.includes(attrs.fullPosition)) {
      console.warn(`Invalid logo-full-position "${attrs.fullPosition}". Must be one of ${VALID_ALIGNMENTS.join(', ')}. Ignoring.`);
      attrs.fullPosition = '';
    }
    if (attrs.iconPosition && !VALID_ALIGNMENTS.includes(attrs.iconPosition)) {
      console.warn(`Invalid logo-icon-position "${attrs.iconPosition}". Must be one of ${VALID_ALIGNMENTS.join(', ')}. Ignoring.`);
      attrs.iconPosition = '';
    }

    if (attrs.breakpoint) {
      const bp = parseInt(attrs.breakpoint, 10);
      if (!IMAGE_WIDTHS.includes(bp)) {
        console.warn(`Invalid logo-breakpoint "${attrs.breakpoint}". Must be one of ${IMAGE_WIDTHS.join(', ')}. Ignoring.`);
        attrs.breakpoint = '';
      }
    }

    this.cachedAttributes = attrs;
    return attrs;
  }

  initialize() {
    if (this.isInitialized || !this.isVisible) return;
    console.log('** CustomLogo start...', this.outerHTML);
    this.isInitialized = true;
    try {
      this.render();
    } catch (error) {
      console.error('Error initializing CustomLogo:', error, this.outerHTML);
      this.render(true);
    }
    console.log('** CustomLogo end...');
  }

  render(isFallback = false) {
    const attrs = isFallback ? {
      fullPrimarySrc: '',
      fullLightSrc: '',
      fullDarkSrc: '',
      fullPrimaryAlt: '',
      fullLightAlt: '',
      fullDarkAlt: '',
      fullPosition: '',
      iconPrimarySrc: '',
      iconLightSrc: '',
      iconDarkSrc: '',
      iconPrimaryAlt: '',
      iconLightAlt: '',
      iconDarkAlt: '',
      iconPosition: '',
      breakpoint: '',
      height: '',
      isDecorative: true
    } : this.getAttributes();
    let logoHTML = '';
    const hasValidSource = attrs.fullPrimarySrc || attrs.fullLightSrc || attrs.fullDarkSrc ||
                          attrs.iconPrimarySrc || attrs.iconLightSrc || attrs.iconDarkSrc;
    if (hasValidSource) {
      let positionClass = attrs.fullPosition ? alignMap[attrs.fullPosition] : 'place-self-center';
      let styleTag = '';
      const hasBreakpoint = attrs.breakpoint && IMAGE_WIDTHS.includes(parseInt(attrs.breakpoint, 10));
      const hasIconSource = attrs.iconPrimarySrc || (attrs.iconLightSrc && attrs.iconDarkSrc);
      const hasFullSource = attrs.fullPrimarySrc || (attrs.fullLightSrc && attrs.fullDarkSrc);

      if (hasBreakpoint && hasIconSource && hasFullSource) {
        styleTag = `
          <style>
            @media (max-width: ${parseInt(attrs.breakpoint, 10) - 1}px) {
              .place-self-center {
                ${attrs.iconPosition ? `place-self: ${attrs.iconPosition.replace(/-/g, ' ')} !important;` : ''}
              }
            }
          </style>
        `;
      }

      const extraStyles = attrs.height ? `height: ${attrs.height}; max-width: 100%; object-fit: contain;` : 'max-width: 100%; object-fit: contain;';
      const logoMarkup = generatePictureMarkup({
        fullSrc: attrs.fullPrimarySrc,
        fullLightSrc: attrs.fullLightSrc,
        fullDarkSrc: attrs.fullDarkSrc,
        fullAlt: attrs.fullPrimaryAlt,
        fullLightAlt: attrs.fullLightAlt,
        fullDarkAlt: attrs.fullDarkAlt,
        iconSrc: attrs.iconPrimarySrc,
        iconLightSrc: attrs.iconLightSrc,
        iconDarkSrc: attrs.iconDarkSrc,
        iconAlt: attrs.iconPrimaryAlt,
        iconLightAlt: attrs.iconLightAlt,
        iconDarkAlt: attrs.iconDarkAlt,
        isDecorative: attrs.isDecorative || false,
        customClasses: '',
        loading: 'lazy',
        fetchPriority: '',
        extraClasses: [],
        breakpoint: attrs.breakpoint,
        extraStyles: extraStyles
      });
      if (!logoMarkup) {
        console.warn('No valid logo markup generated, using placeholder.');
        logoHTML = '<div>No logo sources provided</div>';
      } else {
        console.log('generatePictureMarkup output:', logoMarkup);
        logoHTML = `
          ${styleTag}
          <div class="${positionClass}">
            <a href="/">${logoMarkup}</a>
          </div>
        `;
      }
    } else {
      console.warn('No valid logo sources provided, using placeholder.');
      logoHTML = '<div>No logo sources provided</div>';
    }
    console.log('Rendered logoHTML:', logoHTML);
    this.innerHTML = logoHTML;
    return this;
  }

  handleThemeChange(event) {
    if (this.isConnected) {
      console.log('Theme change detected:', { isDark: event.matches });
      this.cachedAttributes = null;
      this.render();
    }
  }

  handleResize() {
    if (this.isConnected) {
      const attrs = this.getAttributes();
      const breakpoint = parseInt(attrs.breakpoint, 10);
      const isBelowBreakpoint = breakpoint && window.matchMedia(`(max-width: ${breakpoint - 1}px)`).matches;
      console.log('Window resized, breakpoint state:', { isBelowBreakpoint });
      this.cachedAttributes = null;
      this.render();
    }
  }

  handleMutation(mutations) {
    mutations.forEach(mutation => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'src') {
        const img = mutation.target;
        const picture = this.querySelector('picture');
        const sources = picture.querySelectorAll('source');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const attrs = this.getAttributes();
        const breakpoint = parseInt(attrs.breakpoint, 10);
        const isBelowBreakpoint = breakpoint && window.matchMedia(`(max-width: ${breakpoint - 1}px)`).matches;
        let selectedSrc = attrs.fullLightSrc || attrs.iconLightSrc || attrs.fullPrimarySrc || attrs.iconPrimarySrc;
        let matchedMedia = 'none';
        sources.forEach(source => {
          const media = source.getAttribute('media');
          if (media && window.matchMedia(media).matches) {
            selectedSrc = source.getAttribute('srcset');
            matchedMedia = media;
          }
        });
        console.log('Mutation detected:', { selectedSrc, matchedMedia, prefersDark, isBelowBreakpoint });
        if (img.src !== selectedSrc && selectedSrc) {
          console.log('Mutation updating img src to:', selectedSrc);
          img.src = selectedSrc;
        }
      }
    });
  }

  connectedCallback() {
    if (this.isVisible) {
      this.initialize();
    }
    const prefersDarkQuery = window.matchMedia('(prefers-color-scheme: dark)');
    prefersDarkQuery.addEventListener('change', this.handleThemeChange);
    const resizeObserver = new ResizeObserver(this.handleResize);
    resizeObserver.observe(document.body);
    this.resizeObserver = resizeObserver;
    const img = this.querySelector('img');
    if (img) {
      const mutationObserver = new MutationObserver(this.handleMutation);
      mutationObserver.observe(img, { attributes: true, attributeFilter: ['src'] });
      this.mutationObserver = mutationObserver;
    }
  }

  disconnectedCallback() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }
    window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', this.handleThemeChange);
    this.cachedAttributes = null;
  }

  static get observedAttributes() {
    return [
      'logo-full-primary-src', 'logo-full-light-src', 'logo-full-dark-src',
      'logo-full-primary-alt', 'logo-full-light-alt', 'logo-full-dark-alt',
      'logo-full-position', 'logo-icon-primary-src', 'logo-icon-light-src',
      'logo-icon-dark-src', 'logo-icon-primary-alt', 'logo-icon-light-alt',
      'logo-icon-dark-alt', 'logo-icon-position', 'logo-breakpoint', 'logo-height'
    ];
  }

  attributeChangedCallback() {
    if (!this.isInitialized || !this.isVisible) return;
    this.cachedAttributes = null;
    this.initialize();
  }
}

export const CustomLogo = withRenderCaching(withLazyLoading(CustomLogoBase));

(async () => {
  try {
    if (!customElements.get('custom-logo')) {
      customElements.define('custom-logo', CustomLogo);
      console.log('CustomLogo defined successfully');
    }
    document.querySelectorAll('custom-logo').forEach(element => {
      customElements.upgrade(element);
    });
  } catch (error) {
    console.error('Failed to define CustomLogo:', error);
  }
})();
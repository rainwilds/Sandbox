import {
  VALID_ALIGNMENTS, alignMap, BACKDROP_FILTER_MAP, sanitizeClassNames,
  sanitizeStyles, validateFontAwesomeIcon, withLazyLoading, withRenderCaching
} from '../shared.js';

class CustomNavBase extends HTMLElement {
  constructor() {
    super();
    this.isInitialized = false;
    this.isVisible = false;
    this.cachedAttributes = null;
  }

  getAttributes() {
    if (this.cachedAttributes) {
      return this.cachedAttributes;
    }
    const attrs = {};
    try {
      attrs.nav = this.getAttribute('nav') ? JSON.parse(this.getAttribute('nav')) : null;
    } catch (error) {
      console.warn(`Invalid JSON in nav attribute: ${error}`);
      attrs.nav = null;
    }
    attrs.navPosition = this.getAttribute('nav-position') || '';
    attrs.navClass = sanitizeClassNames(this.getAttribute('nav-class') || '');
    attrs.navStyle = sanitizeStyles(this.getAttribute('nav-style') || '', [
      'color', 'background-color', 'border', 'border-radius', 'padding', 'margin',
      'font-size', 'font-weight', 'text-align', 'display', 'width', 'height'
    ]);
    attrs.navAriaLabel = this.getAttribute('nav-aria-label') || 'Main navigation';
    attrs.navToggleClass = sanitizeClassNames(this.getAttribute('nav-toggle-class') || '');
    attrs.navToggleIcon = validateFontAwesomeIcon(this.getAttribute('nav-toggle-icon') || '<i class="fa-light fa-bars"></i>');
    attrs.navOrientation = this.getAttribute('nav-orientation') || 'horizontal';
    attrs.navContainerClass = sanitizeClassNames(this.getAttribute('nav-container-class') || '');
    attrs.navContainerStyle = sanitizeStyles(this.getAttribute('nav-container-style') || '', [
      'color', 'background-color', 'border', 'border-radius', 'padding', 'margin',
      'font-size', 'font-weight', 'text-align', 'display', 'width', 'height'
    ]);
    attrs.navBackgroundColor = this.getAttribute('nav-background-color') || '';
    attrs.navBackgroundImageNoise = this.hasAttribute('nav-background-image-noise');
    attrs.navBorder = this.getAttribute('nav-border') || '';
    attrs.navBorderRadius = this.getAttribute('nav-border-radius') || '';
    attrs.navBackdropFilter = this.getAttribute('nav-backdrop-filter')?.split(' ').filter(cls => cls) || [];

    if (!VALID_ALIGNMENTS.includes(attrs.navPosition)) {
      console.warn(`Invalid nav-position "${attrs.navPosition}". Must be one of ${VALID_ALIGNMENTS.join(', ')}. Ignoring.`);
      attrs.navPosition = '';
    }
    this.cachedAttributes = attrs;
    return attrs;
  }

  initialize() {
    if (this.isInitialized || !this.isVisible) return;
    console.log('** CustomNav start...', this.outerHTML);
    this.isInitialized = true;
    try {
      const navElement = this.render();
      if (navElement) {
        this.replaceWith(navElement);
      } else {
        console.error('Failed to render CustomNav: navElement is null or invalid.', this.outerHTML);
        this.replaceWith(this.render(true));
      }
    } catch (error) {
      console.error('Error initializing CustomNav:', error, this.outerHTML);
      this.replaceWith(this.render(true));
    }
    console.log('** CustomNav end...');
  }

  render(isFallback = false) {
    const attrs = isFallback ? {
      nav: null,
      navPosition: '',
      navClass: '',
      navStyle: '',
      navAriaLabel: 'Main navigation',
      navToggleClass: '',
      navToggleIcon: '<i class="fa-light fa-bars"></i>',
      navOrientation: 'horizontal',
      navContainerClass: '',
      navContainerStyle: '',
      navBackgroundColor: '',
      navBackgroundImageNoise: false,
      navBorder: '',
      navBorderRadius: '',
      navBackdropFilter: []
    } : this.getAttributes();

    const navAlignClass = attrs.navPosition ? alignMap[attrs.navPosition] : '';
    const navClasses = [
      attrs.navClass,
      `nav-${attrs.navOrientation}`,
      attrs.navBackgroundImageNoise ? 'background-image-noise' : '',
      attrs.navBorder,
      attrs.navBorderRadius,
      ...attrs.navBackdropFilter.filter(cls => !cls.startsWith('backdrop-filter'))
    ].filter(cls => cls).join(' ').trim();
    const navBackdropFilterStyle = attrs.navBackdropFilter
      .filter(cls => cls.startsWith('backdrop-filter'))
      .map(cls => BACKDROP_FILTER_MAP[cls] || '')
      .filter(val => val)
      .join(' ');
    const navStyle = [attrs.navStyle, navBackdropFilterStyle].filter(s => s).join('; ').trim();

    const navElement = document.createElement('div');
    navElement.innerHTML = `
      <div class="${navAlignClass} ${attrs.navContainerClass}"${attrs.navContainerStyle ? ` style="${attrs.navContainerStyle}"` : ''}>
        <nav aria-label="${attrs.navAriaLabel}"${navClasses ? ` class="${navClasses}"` : ''}${navStyle ? ` style="${navStyle}"` : ''}>
          <button${attrs.navToggleClass ? ` class="${attrs.navToggleClass}"` : ''} aria-expanded="false" aria-controls="nav-menu" aria-label="Toggle navigation">
            <span class="hamburger-icon">${attrs.navToggleIcon}</span>
          </button>
          <ul class="nav-links" id="nav-menu">
            ${attrs.nav?.map(link => `
              <li><a href="${link.href || '#'}"${link.href ? '' : ' aria-disabled="true"'}>${link.text || 'Link'}</a></li>
            `).join('') || ''}
          </ul>
        </nav>
      </div>
    `;

    const hamburger = navElement.querySelector('button[aria-controls="nav-menu"]');
    const navMenu = navElement.querySelector('#nav-menu');
    if (hamburger && navMenu) {
      hamburger.addEventListener('click', () => {
        const isExpanded = hamburger.getAttribute('aria-expanded') === 'true';
        hamburger.setAttribute('aria-expanded', !isExpanded);
        navMenu.style.display = isExpanded ? 'none' : 'block';
      });
    }

    return navElement;
  }

  connectedCallback() {
    if (this.isVisible) {
      this.initialize();
    }
  }

  static get observedAttributes() {
    return [
      'nav', 'nav-position', 'nav-class', 'nav-style', 'nav-aria-label',
      'nav-toggle-class', 'nav-toggle-icon', 'nav-orientation',
      'nav-container-class', 'nav-container-style', 'nav-background-color',
      'nav-background-image-noise', 'nav-border', 'nav-border-radius',
      'nav-backdrop-filter'
    ];
  }

  attributeChangedCallback() {
    if (!this.isInitialized || !this.isVisible) return;
    this.cachedAttributes = null;
    this.initialize();
  }
}

export const CustomNav = withRenderCaching(withLazyLoading(CustomNavBase));

(async () => {
  try {
    if (!customElements.get('custom-nav')) {
      customElements.define('custom-nav', CustomNav);
      console.log('CustomNav defined successfully');
    }
    document.querySelectorAll('custom-nav').forEach(element => {
      customElements.upgrade(element);
    });
  } catch (error) {
    console.error('Failed to define CustomNav:', error);
  }
})();
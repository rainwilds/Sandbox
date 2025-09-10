import { CustomBlock } from './custom-block.js';
import { VALID_ALIGNMENTS, alignMap, VALID_POSITIONS } from '../shared.js';

(async () => {
  try {
    console.log('Successfully imported CustomBlock and alignMap');

    await Promise.all([
      customElements.whenDefined('custom-logo'),
      customElements.whenDefined('custom-nav')
    ]);
    console.log('CustomLogo and CustomNav defined');

    class CustomHeader extends CustomBlock {
      static get observedAttributes() {
        return [
          ...super.observedAttributes,
          'sticky',
          'logo-placement',
          'nav-logo-container-style',
          'nav-logo-container-class',
          'nav-alignment'
        ];
      }

      getAttributes() {
        const attrs = super.getAttributes();
        attrs.sticky = this.hasAttribute('sticky');
        attrs.logoPlacement = this.getAttribute('logo-placement') || 'independent';
        attrs.navLogoContainerStyle = this.getAttribute('nav-logo-container-style') || '';
        attrs.navLogoContainerClass = this.getAttribute('nav-logo-container-class') || '';
        attrs.navAlignment = this.getAttribute('nav-alignment') || 'center';
        const validLogoPlacements = ['independent', 'nav'];
        if (!VALID_ALIGNMENTS.includes(attrs.navAlignment)) {
          console.warn(`Invalid nav-alignment "${attrs.navAlignment}". Must be one of ${VALID_ALIGNMENTS.join(', ')}. Defaulting to 'center'.`);
          attrs.navAlignment = 'center';
        }
        if (!validLogoPlacements.includes(attrs.logoPlacement)) {
          console.warn(`Invalid logo-placement "${attrs.logoPlacement}". Defaulting to 'independent'.`);
          attrs.logoPlacement = 'independent';
        }
        return attrs;
      }

      initialize() {
        if (this.isInitialized || !this.isVisible) return;
        console.log('** CustomHeader start...', this.outerHTML);
        this.isInitialized = true;
        try {
          const headerElement = this.render();
          if (headerElement) {
            this.replaceWith(headerElement);
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
        const attrs = this.getAttributes();
        let blockElement = super.render(isFallback);
        if (!blockElement) {
          blockElement = document.createElement('div');
        }
        blockElement.setAttribute('role', 'banner');

        const existingClasses = blockElement.className.split(' ').filter(cls => cls);
        const headerClasses = [
          ...existingClasses,
          attrs.backgroundColorClass,
          attrs.borderClass,
          attrs.borderRadiusClass,
          attrs.shadowClass,
          attrs.sticky ? 'sticky' : ''
        ].filter(cls => cls).join(' ').trim();

        if (headerClasses) {
          blockElement.className = headerClasses;
        }

        if (attrs.sticky) {
          blockElement.style.position = 'sticky';
          blockElement.style.top = '0';
          blockElement.style.zIndex = '1000';
        }

        const customLogo = this.querySelector('custom-logo');
        const customNav = this.querySelector('custom-nav');
        let logoHTML = '';
        let navHTML = '';

        if (customLogo && !isFallback) {
          if (customElements.get('custom-logo')) {
            customElements.upgrade(customLogo);
            customLogo.initialize?.();
            logoHTML = customLogo.outerHTML || customLogo.render?.() || '';
          } else {
            console.warn('custom-logo not defined, skipping rendering.');
            logoHTML = '<div>Logo placeholder</div>';
          }
        }

        if (customNav && !isFallback) {
          if (customElements.get('custom-nav')) {
            customElements.upgrade(customNav);
            customNav.initialize?.();
            navHTML = customNav.outerHTML || customNav.render?.() || '';
          } else {
            console.warn('custom-nav not defined, skipping rendering.');
            navHTML = '<div>Navigation placeholder</div>';
          }
        }

        let innerHTML = blockElement.innerHTML;
        if (attrs.logoPlacement === 'nav' && logoHTML && navHTML) {
          const combinedStyles = [
            attrs.navLogoContainerStyle,
            'z-index: 2'
          ].filter(s => s).join('; ').trim();
          const navAlignClass = attrs.navAlignment ? alignMap[attrs.navAlignment] : '';
          innerHTML = `
            <div${attrs.navLogoContainerClass ? ` class="${attrs.navLogoContainerClass}"` : ''}${combinedStyles ? ` style="${combinedStyles}"` : ''}>
              ${logoHTML}
              <div${navAlignClass ? ` class="${navAlignClass}"` : ''}>
                ${navHTML}
              </div>
            </div>
            ${innerHTML}
          `;
        } else {
          innerHTML = logoHTML + navHTML + innerHTML;
        }
        blockElement.innerHTML = innerHTML;

        return blockElement;
      }

      connectedCallback() {
        super.connectedCallback();
        if (this.isVisible) {
          this.initialize();
        }
      }

      attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback(name, oldValue, newValue);
        if (this.isInitialized && this.isVisible) {
          this.initialize();
        }
      }
    }

    if (!customElements.get('custom-header')) {
      customElements.define('custom-header', CustomHeader);
      console.log('CustomHeader defined successfully');
    }
    document.querySelectorAll('custom-header').forEach(element => {
      customElements.upgrade(element);
    });
  } catch (error) {
    console.error('Failed to import CustomBlock or define CustomHeader:', error);
  }
})();
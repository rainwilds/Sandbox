(async () => {
    try {
        const { CustomBlock } = await import('./custom-block.js');
        console.log('Successfully imported CustomBlock');

        class CustomHeader extends CustomBlock {
            static get observedAttributes() {
                return [
                    ...super.observedAttributes,
                    'sticky',
                    'logo-placement'
                ];
            }

            getAttributes() {
                const attrs = super.getAttributes();
                attrs.sticky = this.hasAttribute('sticky');
                attrs.logoPlacement = this.getAttribute('logo-placement') || 'independent';
                const validLogoPlacements = ['independent', 'nav'];
                if (!validLogoPlacements.includes(attrs.logoPlacement)) {
                    console.warn(`Invalid logo-placement "${attrs.logoPlacement}". Defaulting to 'independent'.`);
                    attrs.logoPlacement = 'independent';
                }
                return attrs;
            }

            render(isFallback = false) {
                const attrs = this.getAttributes();
                let blockElement = super.render(isFallback);
                if (!blockElement) {
                    blockElement = document.createElement('div');
                }
                blockElement.setAttribute('role', 'banner');

                const headerClasses = [
                    'block',
                    attrs.backgroundColorClass,
                    attrs.borderClass,
                    attrs.borderRadiusClass,
                    attrs.shadowClass,
                    attrs.sticky ? 'sticky' : ''
                ].filter(cls => cls).join(' ').trim();
                if (headerClasses) {
                    blockElement.className = headerClasses;
                }

                const customLogo = this.querySelector('custom-logo');
                const customNav = this.querySelector('custom-nav');
                let logoHTML = customLogo && !isFallback ? customLogo.outerHTML : '';
                let navHTML = customNav && !isFallback ? customNav.outerHTML : '';
                let containerClasses = '';
                let containerStyle = '';

                if (customNav && !isFallback) {
                    containerClasses = customNav.getAttribute('nav-container-class') || '';
                    containerStyle = customNav.getAttribute('nav-container-style') || '';
                }

                let innerHTML = blockElement.innerHTML;
                if (attrs.logoPlacement === 'nav' && logoHTML && navHTML) {
                    innerHTML = `
                        <div${containerClasses ? ` class="${containerClasses}"` : ''}${containerStyle ? ` style="${containerStyle}"` : ''}>
                            ${logoHTML}
                            ${navHTML}
                        </div>
                        ${innerHTML}
                    `;
                } else {
                    innerHTML = logoHTML + navHTML + innerHTML;
                }
                blockElement.innerHTML = innerHTML;

                if (attrs.sticky) {
                    this.style.position = 'sticky';
                    this.style.top = '0';
                    this.style.zIndex = '1000';
                }

                return blockElement;
            }

            connectedCallback() {
                super.connectedCallback();
                this.render();
            }

            attributeChangedCallback(name, oldValue, newValue) {
                super.attributeChangedCallback(name, oldValue, newValue);
                if (this.isInitialized && this.isVisible) {
                    this.render();
                }
            }
        }
        customElements.define('custom-header', CustomHeader);
        console.log('CustomHeader defined successfully');
    } catch (error) {
        console.error('Failed to import CustomBlock or define CustomHeader:', error);
    }
})();
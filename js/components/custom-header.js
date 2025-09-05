(async () => {
    try {
        const { CustomBlock } = await import('./custom-block.js');
        console.log('Successfully imported CustomBlock');

        // Wait for CustomLogo and CustomNav to be defined
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

                // Preserve classes from CustomBlock
                const existingClasses = blockElement.className.split(' ').filter(cls => cls);
                const headerClasses = [
                    ...existingClasses, // Includes background-image if set by CustomBlock
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
                let logoHTML = '';
                let navHTML = '';
                let containerClasses = '';
                let containerStyle = '';

                if (customLogo && !isFallback) {
                    // Ensure custom-logo is defined and upgraded
                    if (customElements.get('custom-logo')) {
                        customElements.upgrade(customLogo);
                        logoHTML = customLogo.innerHTML || customLogo.render?.() || '';
                    } else {
                        console.warn('custom-logo not defined, skipping rendering.');
                        logoHTML = '<div>Logo placeholder</div>';
                    }
                }

                if (customNav && !isFallback) {
                    // Ensure custom-nav is defined and upgraded
                    if (customElements.get('custom-nav')) {
                        customElements.upgrade(customNav);
                        navHTML = customNav.innerHTML || customNav.render?.() || '';
                        containerClasses = customNav.getAttribute('nav-container-class') || '';
                        containerStyle = customNav.getAttribute('nav-container-style') || '';
                    } else {
                        console.warn('custom-nav not defined, skipping rendering.');
                        navHTML = '<div>Navigation placeholder</div>';
                    }
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
                    blockElement.style.position = 'sticky';
                    blockElement.style.top = '0';
                    blockElement.style.zIndex = '1000';
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
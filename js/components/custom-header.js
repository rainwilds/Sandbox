(async () => {
    try {
        const { CustomBlock } = await import('./custom-block.js');
        const { VALID_ALIGNMENTS, alignMap } = await import('./shared.js');
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
                    attrs.navAlignment = '';
                }
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

                const customLogo = this.querySelector('custom-logo');
                const customNav = this.querySelector('custom-nav');
                let logoHTML = '';
                let navHTML = '';
                let navContainerClasses = '';
                let navContainerStyle = '';

                if (customLogo && !isFallback) {
                    if (customElements.get('custom-logo')) {
                        customElements.upgrade(customLogo);
                        logoHTML = customLogo.innerHTML || customLogo.render?.() || '';
                    } else {
                        console.warn('custom-logo not defined, skipping rendering.');
                        logoHTML = '<div>Logo placeholder</div>';
                    }
                }

                if (customNav && !isFallback) {
                    if (customElements.get('custom-nav')) {
                        customElements.upgrade(customNav);
                        navHTML = customNav.innerHTML || customNav.render?.() || '';
                        navContainerClasses = customNav.getAttribute('nav-container-class') || '';
                        navContainerStyle = customNav.getAttribute('nav-container-style') || '';
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
                            <div${navAlignClass ? ` class="${navAlignClass} ${navContainerClasses}"` : navContainerClasses ? ` class="${navContainerClasses}"` : ''}${navContainerStyle ? ` style="${navContainerStyle}"` : ''}>
                                ${navHTML}
                            </div>
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
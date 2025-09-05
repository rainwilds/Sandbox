(async () => {
    try {
        const { CustomBlock } = await import('./custom-block.js');
        console.log('Successfully imported CustomBlock');

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
                const validAlignments = [
                    'center', 'top', 'bottom', 'left', 'right',
                    'top-left', 'top-center', 'top-right',
                    'bottom-left', 'bottom-center', 'bottom-right',
                    'center-left', 'center-right'
                ];
                if (!validAlignments.includes(attrs.navAlignment)) {
                    console.warn(`Invalid nav-alignment "${attrs.navAlignment}". Must be one of ${validAlignments.join(', ')}. Defaulting to 'center'.`);
                    attrs.navAlignment = '';
                }
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

                const alignMap = {
                    'center': 'place-self-center',
                    'top': 'place-self-top',
                    'bottom': 'place-self-bottom',
                    'left': 'place-self-left',
                    'right': 'place-self-right',
                    'top-left': 'place-self-top-left',
                    'top-center': 'place-self-top-center',
                    'top-right': 'place-self-top-right',
                    'bottom-left': 'place-self-bottom-left',
                    'bottom-center': 'place-self-bottom-center',
                    'bottom-right': 'place-self-bottom-right',
                    'center-left': 'place-self-center-left',
                    'center-right': 'place-self-center-right'
                };

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
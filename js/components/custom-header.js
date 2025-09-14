(async () => {
    try {
        const { CustomBlock } = await import('./custom-block.js');
        const { VALID_ALIGNMENTS, alignMap } = await import('../shared.js');
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

            async render(isFallback = false) {  // Made async to await super.render()
                const isDev = window.location.href.includes('/dev/');
                const attrs = this.getAttributes();
                let blockElement = await super.render(isFallback);  // Await the Promise from parent
                if (!blockElement || !(blockElement instanceof HTMLElement)) {
                    console.warn('Super render failed; creating fallback block element.');
                    blockElement = document.createElement('div');
                }

                // Set role
                blockElement.setAttribute('role', 'banner');

                // Update classes (merge with existing)
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

                // Await child renders if not fallback (children like custom-logo/custom-nav are slotted)
                if (!isFallback) {
                    // Query and await upgrade/render of direct children
                    const customLogo = this.querySelector('custom-logo');
                    const customNav = this.querySelector('custom-nav');
                    if (customLogo && customElements.get('custom-logo')) {
                        if (isDev) console.log('Upgrading custom-logo child');
                        customElements.upgrade(customLogo);
                        // If child has async render, await it (assume it has initialize like parent)
                        if (customLogo.initialize && !customLogo.isInitialized) {
                            await customLogo.initialize();
                        }
                    }
                    if (customNav && customElements.get('custom-nav')) {
                        if (isDev) console.log('Upgrading custom-nav child');
                        customElements.upgrade(customNav);
                        if (customNav.initialize && !customNav.isInitialized) {
                            await customNav.initialize();
                        }
                    }
                }

                // Get composed innerHTML from children (they render into this)
                let innerHTML = this.innerHTML;  // Leverages slotted children's output

                // Handle logo placement in nav
                if (attrs.logoPlacement === 'nav') {
                    const customLogo = this.querySelector('custom-logo');
                    const customNav = this.querySelector('custom-nav');
                    if (customLogo && customNav && !isFallback) {
                        const logoHTML = customLogo.outerHTML || '';  // Full rendered logo
                        const navHTML = customNav.outerHTML || '';     // Full rendered nav
                        const combinedStyles = [
                            attrs.navLogoContainerStyle,
                            'z-index: 2'
                        ].filter(s => s).join('; ').trim();
                        const navAlignClass = attrs.navAlignment ? alignMap[attrs.navAlignment] : '';
                        const navContainerClasses = customNav.getAttribute('nav-container-class') || '';
                        const navContainerStyle = customNav.getAttribute('nav-container-style') || '';

                        innerHTML = `
                            <div${attrs.navLogoContainerClass ? ` class="${attrs.navLogoContainerClass}"` : ''}${combinedStyles ? ` style="${combinedStyles}"` : ''}>
                                ${logoHTML}
                                <div${navAlignClass ? ` class="${navAlignClass} ${navContainerClasses}"` : navContainerClasses ? ` class="${navContainerClasses}"` : ''}${navContainerStyle ? ` style="${navContainerStyle}"` : ''}>
                                    ${navHTML}
                                </div>
                            </div>
                            ${innerHTML}  <!-- Preserve any other content -->
                        `;
                        if (isDev) console.log('Composed nav-with-logo HTML');
                    }
                } else {
                    // Independent: Just use innerHTML (logo + nav side-by-side)
                    if (isDev) console.log('Using independent placement with innerHTML');
                }

                // Set the composed innerHTML
                blockElement.innerHTML = innerHTML;

                // Apply sticky styles
                if (attrs.sticky) {
                    blockElement.style.position = 'sticky';
                    blockElement.style.top = '0';
                    blockElement.style.zIndex = '1000';
                }

                if (isDev) console.log('CustomHeader render complete:', blockElement.outerHTML.substring(0, 200) + '...');
                return blockElement;
            }

            connectedCallback() {
                // Remove direct render() call; let parent's initialize() handle it
                super.connectedCallback();
            }

            async attributeChangedCallback(name, oldValue, newValue) {
                super.attributeChangedCallback(name, oldValue, newValue);
                if (this.isInitialized && this.isVisible) {
                    // Await re-render on changes
                    await this.render();
                }
            }
        }

        customElements.define('custom-header', CustomHeader);
        console.log('CustomHeader defined successfully');
    } catch (error) {
        console.error('Failed to import CustomBlock or define CustomHeader:', error);
    }
})();
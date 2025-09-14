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

            async render(isFallback = false) {  // Async to await super & children
                const isDev = window.location.href.includes('/dev/');
                const attrs = this.getAttributes();
                let blockElement = await super.render(isFallback);  // Await parent's render
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

                // Await/upgrade children to ensure they render (trigger their render/initialize)
                if (!isFallback) {
                    const customLogo = this.querySelector('custom-logo');
                    const customNav = this.querySelector('custom-nav');
                    if (customLogo) {
                        if (isDev) console.log('Triggering custom-logo render');
                        customElements.upgrade(customLogo);
                        if (customLogo.render) await customLogo.render();  // Explicitly call if not auto
                    }
                    if (customNav) {
                        if (isDev) console.log('Triggering custom-nav render');
                        customElements.upgrade(customNav);
                        if (customNav.render) await customNav.render();
                    }
                    // Small delay for async child renders (if any)
                    await new Promise(resolve => setTimeout(resolve, 0));
                }

                // Extract pure innerHTML from children (flattens, removes wrapper tags)
                let logoHTML = '';
                let navHTML = '';
                const customLogo = this.querySelector('custom-logo');
                const customNav = this.querySelector('custom-nav');
                if (customLogo && !isFallback) {
                    logoHTML = customLogo.innerHTML;  // Pure content, no <custom-logo> tag
                }
                if (customNav && !isFallback) {
                    navHTML = customNav.innerHTML;  // Pure content, no <custom-nav> tag
                    // Append nav-container attrs to the extracted div (if present)
                }

                // Compose innerHTML using extracted HTML
                let innerHTML = blockElement.innerHTML || '';  // Preserve parent's content (e.g., heading/text)
                if (attrs.logoPlacement === 'nav' && logoHTML && navHTML) {
                    const combinedStyles = [
                        attrs.navLogoContainerStyle,
                        'z-index: 2'
                    ].filter(s => s).join('; ').trim();
                    const navAlignClass = attrs.navAlignment ? alignMap[attrs.navAlignment] : '';
                    const navContainerClasses = customNav ? (customNav.getAttribute('nav-container-class') || '') : '';
                    const navContainerStyle = customNav ? (customNav.getAttribute('nav-container-style') || '') : '';

                    innerHTML = `
                        <div${attrs.navLogoContainerClass ? ` class="${attrs.navLogoContainerClass}"` : ''}${combinedStyles ? ` style="${combinedStyles}"` : ''}>
                            ${logoHTML}
                            <div${navAlignClass ? ` class="${navAlignClass} ${navContainerClasses}"` : navContainerClasses ? ` class="${navContainerClasses}"` : ''}${navContainerStyle ? ` style="${navContainerStyle}"` : ''}>
                                ${navHTML}
                            </div>
                        </div>
                        ${innerHTML}
                    `;
                    if (isDev) console.log('Composed nav-with-logo (flattened HTML):', innerHTML.substring(0, 200) + '...');
                } else {
                    // Independent: Concat extracted HTML + parent's inner
                    innerHTML = `${logoHTML}${navHTML}${innerHTML}`;
                    if (isDev) console.log('Composed independent (flattened HTML):', innerHTML.substring(0, 200) + '...');
                }

                // Set the composed innerHTML (now pure HTML, no child tags)
                blockElement.innerHTML = innerHTML;

                // Apply sticky styles
                if (attrs.sticky) {
                    blockElement.style.position = 'sticky';
                    blockElement.style.top = '0';
                    blockElement.style.zIndex = '1000';
                }

                if (isDev) console.log('CustomHeader render complete (flattened):', blockElement.outerHTML.substring(0, 300) + '...');
                return blockElement;
            }

            connectedCallback() {
                super.connectedCallback();  // Let parent handle async init
            }

            async attributeChangedCallback(name, oldValue, newValue) {
                super.attributeChangedCallback(name, oldValue, newValue);
                if (this.isInitialized && this.isVisible) {
                    await this.render();  // Re-render async
                }
            }
        }

        customElements.define('custom-header', CustomHeader);
        console.log('CustomHeader defined successfully');
    } catch (error) {
        console.error('Failed to import CustomBlock or define CustomHeader:', error);
    }
})();
/* global customElements, console, HTMLElement */
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
                const isDev = window.location.href.includes('/dev/');
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
                if (isDev) console.log('CustomHeader attributes:', attrs);
                return attrs;
            }

            async render(isFallback = false) {
                const isDev = window.location.href.includes('/dev/');
                const attrs = this.getAttributes();
                let blockElement;
                try {
                    blockElement = await super.render(isFallback);
                    if (!blockElement || !(blockElement instanceof HTMLElement)) {
                        console.warn('Super render failed; creating fallback block element.');
                        blockElement = document.createElement('div');
                    }
                } catch (error) {
                    console.error('Error in super.render:', error);
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

                let logoHTML = '';
                let navHTML = '';
                if (!isFallback) {
                    const customLogo = this.querySelector('custom-logo');
                    const customNav = this.querySelector('custom-nav');
                    if (customLogo) {
                        if (isDev) console.log('Triggering custom-logo render');
                        customElements.upgrade(customLogo);
                        if (customLogo.render) {
                            try {
                                await customLogo.render();
                                logoHTML = customLogo.innerHTML;
                            } catch (error) {
                                console.error('Error rendering custom-logo:', error);
                                logoHTML = '<div>Error rendering logo</div>';
                            }
                        }
                    }
                    if (customNav) {
                        if (isDev) console.log('Triggering custom-nav render');
                        customElements.upgrade(customNav);
                        if (customNav.render) {
                            try {
                                await customNav.render();
                                navHTML = customNav.innerHTML;
                            } catch (error) {
                                console.error('Error rendering custom-nav:', error);
                                navHTML = '<div>Error rendering nav</div>';
                            }
                        }
                    }
                    await new Promise(resolve => setTimeout(resolve, 0));
                }

                let innerHTML = blockElement.innerHTML || '';
                if (attrs.logoPlacement === 'nav' && logoHTML && navHTML) {
                    const combinedStyles = [
                        attrs.navLogoContainerStyle,
                        'z-index: 2'
                    ].filter(s => s).join('; ').trim();
                    const navAlignClass = attrs.navAlignment ? alignMap[attrs.navAlignment] : '';
                    const navContainerClasses = this.querySelector('custom-nav')?.getAttribute('nav-container-class') || '';
                    const navContainerStyle = this.querySelector('custom-nav')?.getAttribute('nav-container-style') || '';

                    innerHTML = `
                        <div${attrs.navLogoContainerClass ? ` class="${attrs.navLogoContainerClass}"` : ''}${combinedStyles ? ` style="${combinedStyles}"` : ''}>
                            ${logoHTML}
                            <div${navAlignClass || navContainerClasses ? ` class="${[navAlignClass, navContainerClasses].filter(cls => cls).join(' ')}"` : ''}${navContainerStyle ? ` style="${navContainerStyle}"` : ''}>
                                ${navHTML}
                            </div>
                        </div>
                        ${innerHTML}
                    `;
                    if (isDev) console.log('Composed nav-with-logo:', innerHTML.substring(0, 200) + '...');
                } else {
                    innerHTML = `${logoHTML}${navHTML}${innerHTML}`;
                    if (isDev) console.log('Composed independent:', innerHTML.substring(0, 200) + '...');
                }

                blockElement.innerHTML = innerHTML;

                if (attrs.sticky) {
                    blockElement.style.position = 'sticky';
                    blockElement.style.top = '0';
                    blockElement.style.zIndex = '1000';
                }

                if (isDev) console.log('CustomHeader render complete:', blockElement.outerHTML.substring(0, 300) + '...');
                return blockElement;
            }

            async connectedCallback() {
                await super.connectedCallback();
            }

            async attributeChangedCallback(name, oldValue, newValue) {
                if (!this.isInitialized || !this.isVisible) return;
                const isDev = window.location.href.includes('/dev/');
                if (super.observedAttributes.includes(name) || this.constructor.observedAttributes.includes(name)) {
                    this.cachedAttributes = null;
                    try {
                        const cardElement = await this.render();
                        this.replaceWith(cardElement);
                        if (isDev) console.log('CustomHeader re-rendered due to attribute change:', name);
                    } catch (error) {
                        console.error('Error re-rendering CustomHeader:', error);
                        this.replaceWith(await this.render(true));
                    }
                }
            }
        }

        customElements.define('custom-header', CustomHeader);
        console.log('CustomHeader defined successfully');
    } catch (error) {
        console.error('Failed to import CustomBlock or define CustomHeader:', error);
    }
})();
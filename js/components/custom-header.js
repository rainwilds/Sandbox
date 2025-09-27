(async () => {
    // Browser-compatible dev detection
    const isDev = window.location.href.includes('/dev/') ||
      new URLSearchParams(window.location.search).get('debug') === 'true';

    // Debug logging methods
    const log = (message, data = null) => {
        if (isDev) {
            console.groupCollapsed(`%c[CustomHeader] ${new Date().toLocaleTimeString()} ${message}`, 'color: #2196F3; font-weight: bold;');
            if (data) {
                console.log('%cData:', 'color: #4CAF50;', data);
            }
            console.trace();
            console.groupEnd();
        }
    };

    const warn = (message, data = null) => {
        if (isDev) {
            console.groupCollapsed(`%c[CustomHeader] ⚠️ ${new Date().toLocaleTimeString()} ${message}`, 'color: #FF9800; font-weight: bold;');
            if (data) {
                console.log('%cData:', 'color: #4CAF50;', data);
            }
            console.trace();
            console.groupEnd();
        }
    };

    const error = (message, data = null) => {
        if (isDev) {
            console.groupCollapsed(`%c[CustomHeader] ❌ ${new Date().toLocaleTimeString()} ${message}`, 'color: #F44336; font-weight: bold;');
            if (data) {
                console.log('%cData:', 'color: #4CAF50;', data);
            }
            console.trace();
            console.groupEnd();
        }
    };

    try {
        const { CustomBlock } = await import('./custom-block.js');
        const { VALID_ALIGNMENTS, VALID_ALIGN_MAP } = await import('../shared.js');
        log('Successfully imported CustomBlock and VALID_ALIGN_MAP');

        await Promise.all([
            customElements.whenDefined('custom-logo'),
            customElements.whenDefined('custom-nav')
        ]);
        log('CustomLogo and CustomNav defined');

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
                    warn(`Invalid nav-alignment "${attrs.navAlignment}". Must be one of ${VALID_ALIGNMENTS.join(', ')}. Defaulting to 'center'.`);
                    attrs.navAlignment = 'center';
                }
                if (!validLogoPlacements.includes(attrs.logoPlacement)) {
                    warn(`Invalid logo-placement "${attrs.logoPlacement}". Defaulting to 'independent'.`);
                    attrs.logoPlacement = 'independent';
                }
                log('CustomHeader attributes', attrs);
                return attrs;
            }

            async render(isFallback = false) {
                log(`Starting render ${isFallback ? '(fallback)' : ''}`);
                const attrs = this.getAttributes();
                let blockElement;
                try {
                    blockElement = await super.render(isFallback);
                    if (!blockElement || !(blockElement instanceof HTMLElement)) {
                        warn('Super render failed; creating fallback block element.');
                        blockElement = document.createElement('header');
                    }
                } catch (err) {
                    error('Error in super.render', { error: err.message });
                    blockElement = document.createElement('header');
                }

                if (blockElement.tagName !== 'HEADER') {
                    const newBlockElement = document.createElement('header');
                    for (const attr of blockElement.attributes) {
                        newBlockElement.setAttribute(attr.name, attr.value);
                    }
                    newBlockElement.innerHTML = blockElement.innerHTML;
                    blockElement = newBlockElement;
                }

                blockElement.removeAttribute('role');

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
                    log('Applied header classes', { classes: headerClasses });
                }

                let logoHTML = '';
                let navHTML = '';
                if (!isFallback) {
                    const customLogo = this.querySelector('custom-logo');
                    const customNav = this.querySelector('custom-nav');
                    if (customLogo) {
                        log('Triggering custom-logo render');
                        customElements.upgrade(customLogo);
                        if (customLogo.render) {
                            try {
                                await customLogo.render();
                                logoHTML = customLogo.innerHTML;
                                log('CustomLogo rendered successfully', { htmlLength: logoHTML.length });
                            } catch (err) {
                                error('Error rendering custom-logo', { error: err.message });
                                logoHTML = '<div>Error rendering logo</div>';
                            }
                        }
                    }
                    if (customNav) {
                        log('Triggering custom-nav render');
                        customElements.upgrade(customNav);
                        if (customNav.render) {
                            try {
                                await customNav.render();
                                navHTML = customNav.innerHTML;
                                log('CustomNav rendered successfully', { htmlLength: navHTML.length });
                            } catch (err) {
                                error('Error rendering custom-nav', { error: err.message });
                                navHTML = '<div>Error rendering nav</div>';
                            }
                        }
                    }
                }

                let innerHTML = blockElement.innerHTML || '';
                if (attrs.logoPlacement === 'nav' && logoHTML && navHTML) {
                    const combinedStyles = [
                        attrs.navLogoContainerStyle,
                        'z-index: 2'
                    ].filter(s => s).join('; ').trim();
                    const navAlignClass = attrs.navAlignment ? VALID_ALIGN_MAP[attrs.navAlignment] : '';
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
                    log('Composed nav-with-logo', { htmlPreview: innerHTML.substring(0, 200) + '...' });
                } else {
                    innerHTML = `${logoHTML}${navHTML}${innerHTML}`;
                    log('Composed independent', { htmlPreview: innerHTML.substring(0, 200) + '...' });
                }

                blockElement.innerHTML = innerHTML;

                log('CustomHeader render complete', { outerHTMLPreview: blockElement.outerHTML.substring(0, 300) + '...' });
                return blockElement;
            }

            async connectedCallback() {
                log('Connected to DOM');
                await super.connectedCallback();
            }

            async attributeChangedCallback(name, oldValue, newValue) {
                if (!this.isInitialized || !this.isVisible) return;
                log('Attribute changed', { name, oldValue, newValue });
                if (super.observedAttributes.includes(name) || this.constructor.observedAttributes.includes(name)) {
                    this.cachedAttributes = null;
                    try {
                        const blockElement = await this.render();
                        this.replaceWith(blockElement);
                        log('CustomHeader re-rendered due to attribute change', { name });
                    } catch (err) {
                        error('Error re-rendering CustomHeader', { error: err.message });
                        this.replaceWith(await this.render(true));
                    }
                }
            }
        }

        customElements.define('custom-header', CustomHeader);
        log('CustomHeader defined successfully');
    } catch (err) {
        error('Failed to import CustomBlock or define CustomHeader', { error: err.message });
    }
})();
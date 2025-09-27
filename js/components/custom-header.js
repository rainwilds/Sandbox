(async () => {
    // Browser-compatible dev detection
    // This checks if the current URL contains '/dev/' or has '?debug=true' in the query string.
    // Enables debug mode for logging without impacting production environments.
    const isDev = window.location.href.includes('/dev/') ||
      new URLSearchParams(window.location.search).get('debug') === 'true';

    // Debug logging methods
    // Define a logging function that only outputs in debug mode.
    // Uses console.groupCollapsed for organized, collapsible output with color styling.
    // Includes a timestamp, message, optional data, and a stack trace for easy debugging.
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

    // Define a warning logging function similar to log, but with yellow styling and a warning emoji.
    // Used for non-critical issues like invalid attributes.
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

    // Define an error logging function with red styling and an error emoji.
    // Used for critical failures like rendering errors or import failures.
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
        // Asynchronously import required dependencies.
        // CustomBlock from custom-block.js as the base class for extension.
        // VALID_ALIGNMENTS and VALID_ALIGN_MAP from shared.js for validating and mapping alignment attributes.
        const { CustomBlock } = await import('./custom-block.js');
        const { VALID_ALIGNMENTS, VALID_ALIGN_MAP } = await import('../shared.js');
        log('Successfully imported CustomBlock and VALID_ALIGN_MAP');

        // Wait for dependent custom elements to be defined.
        // Ensures custom-logo and custom-nav are ready before proceeding, as they are rendered within the header.
        await Promise.all([
            customElements.whenDefined('custom-logo'),
            customElements.whenDefined('custom-nav')
        ]);
        log('CustomLogo and CustomNav defined');

        // Define the CustomHeader web component class.
        // Extends CustomBlock to inherit base functionality like rendering and attribute handling.
        // Customizes for header-specific features like sticky positioning and logo/nav integration.
        class CustomHeader extends CustomBlock {
            // Specify additional attributes to observe beyond those in the base CustomBlock class.
            // When any of these change, attributeChangedCallback is triggered to re-render.
            static get observedAttributes() {
                return [
                    ...super.observedAttributes,
                    'sticky',
                    'logo-placement',
                    'nav-logo-container-style',
                    'nav-logo-container-class',
                    'nav-alignment',
                    'inner-alignment'
                ];
            }

            // Extend base getAttributes to include header-specific attributes.
            // Validates and defaults values like sticky, logo placement, navigation alignment, and inner alignment.
            getAttributes() {
                const attrs = super.getAttributes();
                attrs.sticky = this.hasAttribute('sticky');
                attrs.logoPlacement = this.getAttribute('logo-placement') || 'independent';
                attrs.navLogoContainerStyle = this.getAttribute('nav-logo-container-style') || '';
                attrs.navLogoContainerClass = this.getAttribute('nav-logo-container-class') || '';
                attrs.navAlignment = this.getAttribute('nav-alignment') || 'center';
                attrs.innerAlignment = this.getAttribute('inner-alignment') || 'center';
                const validLogoPlacements = ['independent', 'nav'];
                if (!VALID_ALIGNMENTS.includes(attrs.navAlignment)) {
                    warn(`Invalid nav-alignment "${attrs.navAlignment}". Must be one of ${VALID_ALIGNMENTS.join(', ')}. Defaulting to 'center'.`);
                    attrs.navAlignment = 'center';
                }
                if (!validLogoPlacements.includes(attrs.logoPlacement)) {
                    warn(`Invalid logo-placement "${attrs.logoPlacement}". Defaulting to 'independent'.`);
                    attrs.logoPlacement = 'independent';
                }
                if (!VALID_ALIGNMENTS.includes(attrs.innerAlignment)) {
                    warn(`Invalid inner-alignment "${attrs.innerAlignment}". Must be one of ${VALID_ALIGNMENTS.join(', ')}. Defaulting to 'center'.`);
                    attrs.innerAlignment = 'center';
                }
                log('CustomHeader attributes', attrs);
                return attrs;
            }

            // Render the header by first calling the base render, then customizing.
            // Handles fallback rendering, applies classes/roles, renders child components (logo/nav),
            // and composes layout based on logo placement (independent or within nav).
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

                blockElement.setAttribute('role', 'banner');

                // Safely add classes only if they are non-empty strings
                if (attrs.backgroundColorClass) blockElement.classList.add(attrs.backgroundColorClass);
                if (attrs.borderClass) blockElement.classList.add(attrs.borderClass);
                if (attrs.borderRadiusClass) blockElement.classList.add(attrs.borderRadiusClass);
                if (attrs.shadowClass) blockElement.classList.add(attrs.shadowClass);
                if (attrs.sticky) blockElement.classList.add('sticky');
                if (attrs.innerAlignment) blockElement.classList.add(VALID_ALIGN_MAP[attrs.innerAlignment]);
                // Ensure blockElement supports centering
                blockElement.style.display = 'grid';
                blockElement.style.placeItems = 'center';
                blockElement.style.height = '100%';
                log('Applied header classes and styles', { classes: blockElement.className, styles: blockElement.style.cssText });

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
                            } catch (error) {
                                error('Error rendering custom-logo', { error: error.message });
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
                            } catch (error) {
                                error('Error rendering custom-nav', { error: error.message });
                                navHTML = '<div>Error rendering nav</div>';
                            }
                        }
                    }
                }

                let innerHTML = blockElement.innerHTML || '';
                if (attrs.logoPlacement === 'nav' && logoHTML && navHTML) {
                    const navAlignClass = attrs.navAlignment ? VALID_ALIGN_MAP[attrs.navAlignment] : '';
                    const navContainerClasses = this.querySelector('custom-nav')?.getAttribute('nav-container-class') || '';
                    const navContainerStyle = this.querySelector('custom-nav')?.getAttribute('nav-container-style') || '';
                    const combinedNavClasses = navAlignClass || navContainerClasses ? `${navAlignClass} ${navContainerClasses}`.trim() : '';
                    const combinedStyles = attrs.navLogoContainerStyle ? `${attrs.navLogoContainerStyle}; z-index: 2` : 'z-index: 2';

                    innerHTML = `
                        <div${attrs.navLogoContainerClass ? ` class="${attrs.navLogoContainerClass}"` : ''}${combinedStyles ? ` style="${combinedStyles}"` : ''}>
                            ${logoHTML}
                            <div${combinedNavClasses ? ` class="${combinedNavClasses}"` : ''}${navContainerStyle ? ` style="${navContainerStyle}"` : ''}>
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

                if (attrs.sticky) {
                    blockElement.style.position = 'sticky';
                    blockElement.style.top = '0';
                    blockElement.style.zIndex = '1000';
                    log('Applied sticky positioning');
                }

                log('CustomHeader render complete', { outerHTMLPreview: blockElement.outerHTML.substring(0, 300) + '...' });
                return blockElement;
            }

            // Extend base connectedCallback.
            // Calls super to handle base connection logic.
            async connectedCallback() {
                log('Connected to DOM');
                await super.connectedCallback();
            }

            // Handle changes to observed attributes.
            // Clears cache and re-renders if the element is initialized and visible.
            // Falls back to safe render on errors.
            async attributeChangedCallback(name, oldValue, newValue) {
                if (!this.isInitialized || !this.isVisible) return;
                log('Attribute changed', { name, oldValue, newValue });
                if (super.observedAttributes.includes(name) || this.constructor.observedAttributes.includes(name)) {
                    this.cachedAttributes = null;
                    try {
                        const cardElement = await this.render();
                        this.replaceWith(cardElement);
                        log('CustomHeader re-rendered due to attribute change', { name });
                    } catch (error) {
                        error('Error re-rendering CustomHeader', { error: error.message });
                        this.replaceWith(await this.render(true));
                    }
                }
            }
        }

        // Define the custom element.
        // Logs success for confirmation.
        customElements.define('custom-header', CustomHeader);
        log('CustomHeader defined successfully');
    } catch (err) {
        error('Failed to import CustomBlock or define CustomHeader', { error: err.message });
    }
})();
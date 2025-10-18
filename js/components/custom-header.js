(async () => {
    // Browser-compatible dev detection
    const isDev = window.location.href.includes('/dev/') ||
      new URLSearchParams(window.location.search).get('debug') === 'true';

    try {
        const { CustomBlock } = await import('./custom-block.js');
        const { VALID_ALIGNMENTS, VALID_ALIGN_MAP, BACKDROP_FILTER_MAP } = await import('../shared.js');

        // Wait for dependent custom elements
        await Promise.all([
            customElements.whenDefined('custom-logo'),
            customElements.whenDefined('custom-nav')
        ]);

        class CustomHeader extends CustomBlock {
            // Private logging helpers
            #log(message, data = null) {
                if (this.debug) {
                    console.groupCollapsed(`%c[CustomHeader] ${message}`, 'color: #2196F3; font-weight: bold;');
                    if (data) console.log('%cData:', 'color: #4CAF50;', data);
                    console.trace();
                    console.groupEnd();
                }
            }
            #warn(message, data = null) {
                if (this.debug) {
                    console.groupCollapsed(`%c[CustomHeader] Warning: ${message}`, 'color: #FF9800; font-weight: bold;');
                    if (data) console.log('%cData:', 'color: #4CAF50;', data);
                    console.trace();
                    console.groupEnd();
                }
            }
            #error(message, data = null) {
                if (this.debug) {
                    console.groupCollapsed(`%c[CustomHeader] Error: ${message}`, 'color: #F44336; font-weight: bold;');
                    if (data) console.log('%cData:', 'color: #4CAF50;', data);
                    console.trace();
                    console.groupEnd();
                }
            }

            static #renderCacheMap = new WeakMap();

            // All attributes that affect rendering (used for cache-busting)
            static #criticalAttributes = [
                'backdrop-filter', 'background-color', 'background-gradient', 'background-image-noise',
                'background-overlay', 'border', 'border-radius', 'button-aria-label', 'button-class',
                'button-href', 'button-icon', 'button-icon-offset', 'button-icon-position', 'button-icon-size',
                'button-rel', 'button-style', 'button-target', 'button-text', 'button-type', 'class', 'effects',
                'heading', 'heading-tag', 'icon', 'icon-class', 'icon-size', 'icon-style',
                'img-background-alt', 'img-background-aspect-ratio', 'img-background-desktop-width',
                'img-background-light-src', 'img-background-mobile-width', 'img-background-position',
                'img-background-src', 'img-background-tablet-width', 'inner-alignment', 'inner-backdrop-filter',
                'inner-background-color', 'inner-background-gradient', 'inner-background-image-noise',
                'inner-background-overlay', 'inner-border', 'inner-border-radius', 'inner-class',
                'inner-shadow', 'inner-style', 'section-title', 'style', 'sub-heading', 'sub-heading-tag',
                'text', 'text-alignment', 'video-background-alt', 'video-background-autoplay',
                'video-background-dark-poster', 'video-background-dark-src', 'video-background-disable-pip',
                'video-background-light-poster', 'video-background-light-src', 'video-background-loading',
                'video-background-loop', 'video-background-muted', 'video-background-playsinline',
                'video-background-poster', 'video-background-src', 'video-primary-alt',
                'video-primary-autoplay', 'video-primary-dark-poster', 'video-primary-dark-src',
                'video-primary-disable-pip', 'video-primary-light-poster', 'video-primary-light-src',
                'video-primary-loading', 'video-primary-loop', 'video-primary-muted',
                'video-primary-playsinline', 'video-primary-poster', 'video-primary-src',
                'position',
                'logo-placement',
                'nav-logo-container-style',
                'nav-logo-container-class',
                'nav-alignment',
                'backdrop-filter'
            ];

            static get observedAttributes() {
                return [
                    ...super.observedAttributes,
                    'position',
                    'logo-placement',
                    'nav-logo-container-style',
                    'nav-logo-container-class',
                    'nav-alignment',
                    'backdrop-filter'
                ];
            }

            async getAttributes() {
                if (this.cachedAttributes) {
                    this.#log('Using cached attributes');
                    return this.cachedAttributes;
                }

                const attrs = await super.getAttributes();

                // POSITION handling
                const rawPos = this.getAttribute('position')?.trim().toLowerCase() || '';
                const validPositions = ['sticky-top', 'sticky-bottom', 'absolute', 'fixed'];
                if (rawPos && !validPositions.includes(rawPos)) {
                    this.#warn(`Invalid position value "${rawPos}". Falling back to normal flow.`);
                    attrs.position = null;
                } else {
                    attrs.position = rawPos || null;
                }

                attrs.logoPlacement = this.getAttribute('logo-placement') || 'independent';
                attrs.navLogoContainerStyle = this.getAttribute('nav-logo-container-style') || '';
                attrs.navLogoContainerClass = this.getAttribute('nav-logo-container-class') || '';
                attrs.navAlignment = this.getAttribute('nav-alignment') || 'center';
                attrs.backdropFilter = this.getAttribute('backdrop-filter') || '';

                const validLogoPlacements = ['independent', 'nav'];
                if (!VALID_ALIGNMENTS.includes(attrs.navAlignment)) {
                    this.#warn(`Invalid nav-alignment "${attrs.navAlignment}". Defaulting to 'center'.`);
                    attrs.navAlignment = 'center';
                }
                if (!validLogoPlacements.includes(attrs.logoPlacement)) {
                    this.#warn(`Invalid logo-placement "${attrs.logoPlacement}". Defaulting to 'independent'.`);
                    attrs.logoPlacement = 'independent';
                }
                if (attrs.backdropFilter && !Object.keys(BACKDROP_FILTER_MAP).includes(`backdrop-filter-${attrs.backdropFilter}`)) {
                    this.#warn(`Invalid backdrop-filter "${attrs.backdropFilter}". Clearing it.`);
                    attrs.backdropFilter = '';
                }

                // Build hash for cache-busting
                const criticalAttrs = {};
                CustomHeader.#criticalAttributes.forEach(attr => {
                    criticalAttrs[attr] = this.getAttribute(attr) || '';
                });
                this.criticalAttributesHash = JSON.stringify(criticalAttrs);

                this.cachedAttributes = attrs;
                this.#log('Header attributes parsed', { attrs });
                return attrs;
            }

            async render(isFallback = false) {
                this.#log(`Starting render ${isFallback ? '(fallback)' : ''}`);
                let newCriticalAttrsHash;
                if (!isFallback) {
                    const criticalAttrs = {};
                    CustomHeader.#criticalAttributes.forEach(attr => {
                        criticalAttrs[attr] = this.getAttribute(attr) || '';
                    });
                    newCriticalAttrsHash = JSON.stringify(criticalAttrs);
                    if (CustomHeader.#renderCacheMap.has(this) && this.criticalAttributesHash === newCriticalAttrsHash) {
                        this.#log('Using cached render');
                        return CustomHeader.#renderCacheMap.get(this).cloneNode(true);
                    }
                }

                const attrs = isFallback ? {} : await this.getAttributes();
                let blockElement;
                try {
                    blockElement = await super.render(isFallback);
                    if (!blockElement || !(blockElement instanceof HTMLElement)) {
                        this.#warn('Super render failed; creating fallback block element.');
                        blockElement = document.createElement('header');
                    }
                } catch (err) {
                    this.#error('Error in super.render', { error: err.message });
                    blockElement = document.createElement('header');
                }

                blockElement.setAttribute('role', 'banner');

                // Batch class additions
                const classesToAdd = [];
                if (attrs.backgroundColorClass) classesToAdd.push(attrs.backgroundColorClass);
                if (attrs.borderClass) classesToAdd.push(attrs.borderClass);
                if (attrs.borderRadiusClass) classesToAdd.push(attrs.borderRadiusClass);
                if (attrs.shadowClass) classesToAdd.push(attrs.shadowClass);
                if (attrs.position) classesToAdd.push(`position-${attrs.position}`); // Add position-sticky-top, position-sticky-bottom, position-absolute, or position-fixed
                if (classesToAdd.length) {
                    blockElement.classList.add(...classesToAdd);
                    this.#log('Applied header classes', { classes: classesToAdd });
                }

                // Apply backdrop filter
                if (attrs.backdropFilter) {
                    const filterClass = `backdrop-filter-${attrs.backdropFilter}`;
                    blockElement.style.backdropFilter = BACKDROP_FILTER_MAP[filterClass] || '';
                    this.#log('Applied backdrop filter', { filter: blockElement.style.backdropFilter });
                }

                let logoHTML = '';
                let navHTML = '';
                if (!isFallback) {
                    const customLogo = this.querySelector('custom-logo');
                    const customNav = this.querySelector('custom-nav');

                    if (customLogo) {
                        this.#log('Triggering custom-logo render');
                        customElements.upgrade(customLogo);
                        if (customLogo.render) {
                            try {
                                await customLogo.render();
                                logoHTML = customLogo.innerHTML;
                                this.#log('CustomLogo rendered', { htmlLength: logoHTML.length });
                            } catch (err) {
                                this.#error('Error rendering custom-logo', { error: err.message });
                                logoHTML = '<div>Error rendering logo</div>';
                            }
                        }
                    }

                    if (customNav) {
                        this.#log('Triggering custom-nav render');
                        customElements.upgrade(customNav);
                        if (customNav.render) {
                            try {
                                await customNav.render();
                                navHTML = customNav.innerHTML;
                                this.#log('CustomNav rendered', { htmlLength: navHTML.length });
                            } catch (err) {
                                this.#error('Error rendering custom-nav', { error: err.message });
                                navHTML = '<div>Error rendering nav</div>';
                            }
                        }
                    }
                }

                // Check for content attributes to decide whether to include super.render() content
                const hasContent = attrs.heading || attrs.subHeading || attrs.text || attrs.buttonText || attrs.icon;

                let innerHTML = '';
                if (attrs.logoPlacement === 'nav' && logoHTML && navHTML) {
                    const styleHTML = `
                        <style>
                            @media (max-width: 1023px) {
                                .logo-container {
                                    place-self: center !important;
                                }
                            }
                        </style>
                    `;
                    const navAlignClass = attrs.navAlignment ? VALID_ALIGN_MAP[attrs.navAlignment] : '';
                    const navContainerClasses = this.querySelector('custom-nav')?.getAttribute('nav-container-class') || '';
                    const navContainerStyle = this.querySelector('custom-nav')?.getAttribute('nav-container-style') || '';
                    const combinedNavClasses = `${navAlignClass} ${navContainerClasses}`.trim();
                    const combinedStyles = attrs.navLogoContainerStyle ? `${attrs.navLogoContainerStyle}; z-index: 2` : 'z-index: 2';

                    innerHTML = `
                        ${styleHTML}
                        <div${attrs.navLogoContainerClass ? ` class="${attrs.navLogoContainerClass}"` : ''}${combinedStyles ? ` style="${combinedStyles}"` : ''}>
                            ${logoHTML}
                            <div${combinedNavClasses ? ` class="${combinedNavClasses}"` : ''}${navContainerStyle ? ` style="${navContainerStyle}"` : ''}>
                                ${navHTML}
                            </div>
                        </div>
                    `;
                    if (hasContent) innerHTML += blockElement.innerHTML;
                    this.#log('Composed nav-with-logo', { htmlPreview: innerHTML.substring(0, 200) + '...' });
                } else {
                    innerHTML = `${logoHTML}${navHTML}`;
                    if (hasContent) innerHTML += blockElement.innerHTML;
                    this.#log('Composed independent', { htmlPreview: innerHTML.substring(0, 200) + '...' });
                }

                blockElement.innerHTML = innerHTML;

                // Only adjust aria-live div if content exists
                if (hasContent) {
                    const ariaLiveDiv = blockElement.querySelector('div[aria-live="polite"]');
                    if (ariaLiveDiv) {
                        ariaLiveDiv.style.display = 'grid';
                        ariaLiveDiv.style.placeContent = '';
                        this.#log('Adjusted aria-live div styles');
                    }

                    const groupDiv = blockElement.querySelector('div[role="group"]');
                    if (groupDiv) {
                        const textAlignClass = Array.from(groupDiv.classList).find(cls => cls.startsWith('text-align-'));
                        if (textAlignClass) {
                            groupDiv.classList.remove(textAlignClass);
                            const alignment = textAlignClass.replace('text-align-', '');
                            if (VALID_ALIGNMENTS.includes(alignment)) {
                                groupDiv.classList.add(VALID_ALIGN_MAP[alignment]);
                                groupDiv.style.width = 'fit-content';
                                this.#log('Replaced text-align with place-self', { alignment });
                            }
                        }
                    }
                }

                if (!isFallback) {
                    CustomHeader.#renderCacheMap.set(this, blockElement.cloneNode(true));
                    this.criticalAttributesHash = newCriticalAttrsHash;
                }

                this.#log('Render complete', { outerHTMLPreview: blockElement.outerHTML.substring(0, 300) + '...' });
                return blockElement;
            }

            async connectedCallback() {
                this.#log('Connected to DOM');
                await super.connectedCallback();
            }

            disconnectedCallback() {
                super.disconnectedCallback();
                CustomHeader.#renderCacheMap.delete(this);
            }

            async attributeChangedCallback(name, oldValue, newValue) {
                if (!this.isInitialized || !this.isVisible) return;
                this.#log('Attribute changed', { name, oldValue, newValue });
                if (CustomHeader.observedAttributes.includes(name)) {
                    this.cachedAttributes = null;
                    try {
                        const cardElement = await this.render();
                        this.replaceWith(cardElement);
                        this.#log('Re-rendered due to attribute change', { name });
                    } catch (err) {
                        this.#error('Error re-rendering', { error: err.message });
                        this.replaceWith(await this.render(true));
                    }
                }
            }
        }

        customElements.define('custom-header', CustomHeader);
    } catch (err) {
        console.error('Failed to define CustomHeader', { error: err.message });
    }
})();
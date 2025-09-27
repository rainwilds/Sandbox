(async () => {
    const isDev = window.location.href.includes('/dev/') ||
      new URLSearchParams(window.location.search).get('debug') === 'true';

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
                    'nav-alignment',
                    'heading',
                    'heading-tag',
                    'inner-alignment',
                    'text-alignment',
                    'img-background-alt',
                    'img-background-light-src',
                    'img-background-dark-src',
                    'background-overlay'
                ];
            }

            getAttributes() {
                const attrs = super.getAttributes();
                attrs.sticky = this.hasAttribute('sticky');
                attrs.logoPlacement = this.getAttribute('logo-placement') || 'independent';
                attrs.navLogoContainerStyle = this.getAttribute('nav-logo-container-style') || '';
                attrs.navLogoContainerClass = this.getAttribute('nav-logo-container-class') || '';
                attrs.navAlignment = this.getAttribute('nav-alignment') || 'center';
                attrs.heading = this.getAttribute('heading') || '';
                attrs.headingTag = this.getAttribute('heading-tag') || 'h1';
                attrs.innerAlignment = this.getAttribute('inner-alignment') || 'center';
                attrs.textAlignment = this.getAttribute('text-alignment') || 'center';
                attrs.imgBackgroundAlt = this.getAttribute('img-background-alt') || 'Background image';
                attrs.imgBackgroundLightSrc = this.getAttribute('img-background-light-src') || '';
                attrs.imgBackgroundDarkSrc = this.getAttribute('img-background-dark-src') || '';
                attrs.backgroundOverlay = this.getAttribute('background-overlay') || '';
                const validLogoPlacements = ['independent', 'nav'];
                if (!VALID_ALIGNMENTS.includes(attrs.navAlignment)) {
                    warn(`Invalid nav-alignment "${attrs.navAlignment}". Must be one of ${VALID_ALIGNMENTS.join(', ')}. Defaulting to 'center'.`);
                    attrs.navAlignment = 'center';
                }
                if (!VALID_ALIGNMENTS.includes(attrs.innerAlignment)) {
                    warn(`Invalid inner-alignment "${attrs.innerAlignment}". Must be one of ${VALID_ALIGNMENTS.join(', ')}. Defaulting to 'center'.`);
                    attrs.innerAlignment = 'center';
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

                blockElement.setAttribute('data-section-title', 'true');
                const existingClasses = blockElement.className.split(' ').filter(cls => cls);
                const headerClasses = [
                    ...existingClasses,
                    'block',
                    'background-image',
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
                let pictureHTML = '';
                let headingHTML = '';
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

                    if (attrs.imgBackgroundLightSrc || attrs.imgBackgroundDarkSrc) {
                        pictureHTML = `
                            <picture class="animate animate-fade-in">
                                ${attrs.imgBackgroundLightSrc ? `
                                    <source media="(prefers-color-scheme: light)" type="image/jxl" srcset="/Sandbox/img/responsive/tourism-photography-light-4.jxl 3840w, /Sandbox/img/responsive/tourism-photography-light-4-768.jxl 768w, /Sandbox/img/responsive/tourism-photography-light-4-1024.jxl 1024w, /Sandbox/img/responsive/tourism-photography-light-4-1366.jxl 1366w, /Sandbox/img/responsive/tourism-photography-light-4-1920.jxl 1920w, /Sandbox/img/responsive/tourism-photography-light-4-2560.jxl 2560w" sizes="(max-width: 768px) 100vw, (max-width: 1024px) 100vw, (max-width: 1366px) 100vw, (max-width: 1920px) 100vw, (max-width: 2560px) 100vw, 3840px" data-alt="${attrs.imgBackgroundAlt}">
                                    <source media="(prefers-color-scheme: light)" type="image/avif" srcset="/Sandbox/img/responsive/tourism-photography-light-4.avif 3840w, /Sandbox/img/responsive/tourism-photography-light-4-768.avif 768w, /Sandbox/img/responsive/tourism-photography-light-4-1024.avif 1024w, /Sandbox/img/responsive/tourism-photography-light-4-1366.avif 1366w, /Sandbox/img/responsive/tourism-photography-light-4-1920.avif 1920w, /Sandbox/img/responsive/tourism-photography-light-4-2560.avif 2560w" sizes="(max-width: 768px) 100vw, (max-width: 1024px) 100vw, (max-width: 1366px) 100vw, (max-width: 1920px) 100vw, (max-width: 2560px) 100vw, 3840px" data-alt="${attrs.imgBackgroundAlt}">
                                    <source media="(prefers-color-scheme: light)" type="image/webp" srcset="/Sandbox/img/responsive/tourism-photography-light-4.webp 3840w, /Sandbox/img/responsive/tourism-photography-light-4-768.webp 768w, /Sandbox/img/responsive/tourism-photography-light-4-1024.webp 1024w, /Sandbox/img/responsive/tourism-photography-light-4-1366.webp 1366w, /Sandbox/img/responsive/tourism-photography-light-4-1920.webp 1920w, /Sandbox/img/responsive/tourism-photography-light-4-2560.webp 2560w" sizes="(max-width: 768px) 100vw, (max-width: 1024px) 100vw, (max-width: 1366px) 100vw, (max-width: 1920px) 100vw, (max-width: 2560px) 100vw, 3840px" data-alt="${attrs.imgBackgroundAlt}">
                                    <source media="(prefers-color-scheme: light)" type="image/jpeg" srcset="/Sandbox/img/responsive/tourism-photography-light-4.jpeg 3840w, /Sandbox/img/responsive/tourism-photography-light-4-768.jpeg 768w, /Sandbox/img/responsive/tourism-photography-light-4-1024.jpeg 1024w, /Sandbox/img/responsive/tourism-photography-light-4-1366.jpeg 1366w, /Sandbox/img/responsive/tourism-photography-light-4-1920.jpeg 1920w, /Sandbox/img/responsive/tourism-photography-light-4-2560.jpeg 2560w" sizes="(max-width: 768px) 100vw, (max-width: 1024px) 100vw, (max-width: 1366px) 100vw, (max-width: 1920px) 100vw, (max-width: 2560px) 100vw, 3840px" data-alt="${attrs.imgBackgroundAlt}">
                                ` : ''}
                                ${attrs.imgBackgroundDarkSrc ? `
                                    <source media="(prefers-color-scheme: dark)" type="image/jxl" srcset="/Sandbox/img/responsive/tourism-photography-dark-6.jxl 3840w, /Sandbox/img/responsive/tourism-photography-dark-6-768.jxl 768w, /Sandbox/img/responsive/tourism-photography-dark-6-1024.jxl 1024w, /Sandbox/img/responsive/tourism-photography-dark-6-1366.jxl 1366w, /Sandbox/img/responsive/tourism-photography-dark-6-1920.jxl 1920w, /Sandbox/img/responsive/tourism-photography-dark-6-2560.jxl 2560w" sizes="(max-width: 768px) 100vw, (max-width: 1024px) 100vw, (max-width: 1366px) 100vw, (max-width: 1920px) 100vw, (max-width: 2560px) 100vw, 3840px" data-alt="${attrs.imgBackgroundAlt}">
                                    <source media="(prefers-color-scheme: dark)" type="image/avif" srcset="/Sandbox/img/responsive/tourism-photography-dark-6.avif 3840w, /Sandbox/img/responsive/tourism-photography-dark-6-768.avif 768w, /Sandbox/img/responsive/tourism-photography-dark-6-1024.avif 1024w, /Sandbox/img/responsive/tourism-photography-dark-6-1366.avif 1366w, /Sandbox/img/responsive/tourism-photography-dark-6-1920.avif 1920w, /Sandbox/img/responsive/tourism-photography-dark-6-2560.avif 2560w" sizes="(max-width: 768px) 100vw, (max-width: 1024px) 100vw, (max-width: 1366px) 100vw, (max-width: 1920px) 100vw, (max-width: 2560px) 100vw, 3840px" data-alt="${attrs.imgBackgroundAlt}">
                                    <source media="(prefers-color-scheme: dark)" type="image/webp" srcset="/Sandbox/img/responsive/tourism-photography-dark-6.webp 3840w, /Sandbox/img/responsive/tourism-photography-dark-6-768.webp 768w, /Sandbox/img/responsive/tourism-photography-dark-6-1024.webp 1024w, /Sandbox/img/responsive/tourism-photography-dark-6-1366.webp 1366w, /Sandbox/img/responsive/tourism-photography-dark-6-1920.webp 1920w, /Sandbox/img/responsive/tourism-photography-dark-6-2560.webp 2560w" sizes="(max-width: 768px) 100vw, (max-width: 1024px) 100vw, (max-width: 1366px) 100vw, (max-width: 1920px) 100vw, (max-width: 2560px) 100vw, 3840px" data-alt="${attrs.imgBackgroundAlt}">
                                    <source media="(prefers-color-scheme: dark)" type="image/jpeg" srcset="/Sandbox/img/responsive/tourism-photography-dark-6.jpeg 3840w, /Sandbox/img/responsive/tourism-photography-dark-6-768.jpeg 768w, /Sandbox/img/responsive/tourism-photography-dark-6-1024.jpeg 1024w, /Sandbox/img/responsive/tourism-photography-dark-6-1366.jpeg 1366w, /Sandbox/img/responsive/tourism-photography-dark-6-1920.jpeg 1920w, /Sandbox/img/responsive/tourism-photography-dark-6-2560.jpeg 2560w" sizes="(max-width: 768px) 100vw, (max-width: 1024px) 100vw, (max-width: 1366px) 100vw, (max-width: 1920px) 100vw, (max-width: 2560px) 100vw, 3840px" data-alt="${attrs.imgBackgroundAlt}">
                                ` : ''}
                                <img src="${attrs.imgBackgroundDarkSrc || attrs.imgBackgroundLightSrc}" alt="${attrs.imgBackgroundAlt}" loading="lazy" onerror="this.src='https://placehold.co/3000x2000'; this.alt='${attrs.imgBackgroundAlt}'; this.onerror=null;">
                            </picture>
                        `;
                        log('Generated picture element', { htmlLength: pictureHTML.length });
                    }

                    if (attrs.heading) {
                        const alignClass = VALID_ALIGN_MAP[attrs.innerAlignment] || 'place-self-center';
                        headingHTML = `
                            <div class="${alignClass}" aria-live="polite">
                                <div role="group" class="flex-column-center text-align-${attrs.textAlignment}">
                                    <${attrs.headingTag}>${attrs.heading}</${attrs.headingTag}>
                                </div>
                            </div>
                        `;
                        log('Generated heading', { htmlLength: headingHTML.length });
                    }

                    await new Promise(resolve => setTimeout(resolve, 0));
                }

                let innerContent = '';
                if (attrs.logoPlacement === 'nav' && logoHTML && navHTML) {
                    const combinedStyles = [
                        attrs.navLogoContainerStyle,
                        'z-index: 2'
                    ].filter(s => s).join('; ').trim();
                    const navAlignClass = attrs.navAlignment ? VALID_ALIGN_MAP[attrs.navAlignment] : 'place-self-center';
                    const navContainerClasses = this.querySelector('custom-nav')?.getAttribute('nav-container-class') || '';
                    const navContainerStyle = this.querySelector('custom-nav')?.getAttribute('nav-container-style') || '';

                    innerContent = `
                        <div${attrs.navLogoContainerClass ? ` class="${attrs.navLogoContainerClass}"` : ''}${combinedStyles ? ` style="${combinedStyles}"` : ''}>
                            ${logoHTML}
                            <div${navAlignClass || navContainerClasses ? ` class="${[navAlignClass, navContainerClasses].filter(cls => cls).join(' ')}"` : ''}${navContainerStyle ? ` style="${navContainerStyle}"` : ''}>
                                ${navHTML}
                            </div>
                        </div>
                    `;
                    log('Composed nav-with-logo', { htmlPreview: innerContent.substring(0, 200) + '...' });
                } else {
                    innerContent = `${logoHTML}${navHTML}`;
                    log('Composed independent', { htmlPreview: innerContent.substring(0, 200) + '...' });
                }

                blockElement.innerHTML = `
                    <div>
                        ${innerContent}
                        ${pictureHTML}
                        ${attrs.backgroundOverlay ? `<div class="${attrs.backgroundOverlay}"></div>` : ''}
                        ${headingHTML}
                    </div>
                `;

                if (attrs.sticky) {
                    blockElement.classList.add('sticky');
                    log('Applied sticky positioning');
                }

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
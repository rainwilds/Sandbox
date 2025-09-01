/* global HTMLElement, document, DOMParser */

(async () => {
    try {
        const { CustomBlock } = await import('./custom-block.js');
        console.log('Successfully imported CustomBlock');

        class CustomHeader extends CustomBlock {
            constructor() {
                super();
                this.setAttribute('heading-tag', this.getAttribute('heading-tag') || 'h1');
                this.setAttribute('inner-alignment', this.getAttribute('inner-alignment') || 'center');
                this.setAttribute('text-alignment', this.getAttribute('text-alignment') || 'center');
                this.setAttribute('role', 'banner');
            }

            static get observedAttributes() {
                return [
                    ...super.observedAttributes,
                    'nav',
                    'sticky',
                    'logo-primary-src',
                    'logo-light-src',
                    'logo-dark-src',
                    'logo-primary-alt',
                    'logo-light-alt',
                    'logo-dark-alt',
                    'nav-position',
                    'nav-class',
                    'nav-style',
                    'nav-aria-label',
                    'nav-toggle-class',
                    'nav-toggle-icon',
                    'nav-orientation',
                    'logo-position',
                    'logo-placement',
                    'nav-container-class',
                    'nav-container-style',
                    'nav-background-color', // New
                    'nav-background-image-noise', // New
                    'nav-border', // New
                    'nav-border-radius', // New
                    'nav-backdrop-filter' // New
                ];
            }

            getAttributes() {
                const attrs = super.getAttributes();

                // Existing attributes...
                attrs.nav = this.getAttribute('nav') ? JSON.parse(this.getAttribute('nav')) : null;
                attrs.sticky = this.hasAttribute('sticky');
                attrs.logoPrimarySrc = this.getAttribute('logo-primary-src') || '';
                attrs.logoLightSrc = this.getAttribute('logo-light-src') || '';
                attrs.logoDarkSrc = this.getAttribute('logo-dark-src') || '';
                if ((attrs.logoLightSrc || attrs.logoDarkSrc) && !(attrs.logoLightSrc && attrs.logoDarkSrc)) {
                    console.error('Both logo-light-src and logo-dark-src must be provided when using light/dark themes for the logo.');
                }
                attrs.logoPrimaryAlt = this.getAttribute('logo-primary-alt') || '';
                attrs.logoLightAlt = this.getAttribute('logo-light-alt') || '';
                attrs.logoDarkAlt = this.getAttribute('logo-dark-alt') || '';
                if (attrs.logoPrimarySrc && !attrs.logoPrimaryAlt) {
                    console.error('logo-primary-alt is required when logo-primary-src is provided.');
                }
                if (attrs.logoLightSrc && !attrs.logoLightAlt) {
                    console.error('logo-light-alt is required when logo-light-src is provided.');
                }
                if (attrs.logoDarkSrc && !attrs.logoDarkAlt) {
                    console.error('logo-dark-alt is required when logo-dark-src is provided.');
                }
                attrs.navPosition = this.getAttribute('nav-position') || 'right';
                const validNavPositions = ['center', 'top', 'bottom', 'left', 'right', 'top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right', 'center-left', 'center-right', 'above', 'below'];
                if (!validNavPositions.includes(attrs.navPosition)) {
                    console.warn(`Invalid nav-position "${attrs.navPosition}" in <custom-header>. Must be one of ${validNavPositions.join(', ')}. Defaulting to 'right'.`);
                    attrs.navPosition = 'right';
                }
                attrs.logoPosition = this.getAttribute('logo-position') || '';
                if (attrs.logoPosition && !validNavPositions.includes(attrs.logoPosition)) {
                    console.warn(`Invalid logo-position "${attrs.logoPosition}" in <custom-header>. Must be one of ${validNavPositions.join(', ')}. Ignoring.`);
                    attrs.logoPosition = '';
                }
                attrs.logoPlacement = this.getAttribute('logo-placement') || 'independent';
                const validLogoPlacements = ['independent', 'nav'];
                if (!validLogoPlacements.includes(attrs.logoPlacement)) {
                    console.warn(`Invalid logo-placement "${attrs.logoPlacement}" in <custom-header>. Must be 'independent' or 'nav'. Defaulting to 'independent'.`);
                    attrs.logoPlacement = 'independent';
                }
                attrs.navClass = this.getAttribute('nav-class') || '';
                if (attrs.navClass) {
                    const sanitizedNavClass = attrs.navClass.split(/\s+/).filter(cls => /^[a-zA-Z0-9\-_]+$/.test(cls)).join(' ');
                    if (sanitizedNavClass !== attrs.navClass) {
                        console.warn(`Invalid characters in nav-class attribute: "${attrs.navClass}". Using sanitized classes: "${sanitizedNavClass}".`);
                        attrs.navClass = sanitizedNavClass;
                    }
                }
                attrs.navStyle = this.getAttribute('nav-style') || '';
                if (attrs.navStyle) {
                    const allowedStyles = [
                        'color', 'background', 'background-color', 'border', 'border-radius', 'padding', 'margin', 'font-size', 'font-weight',
                        'text-align', 'display', 'width', 'height', 'flex', 'justify-content', 'align-items'
                    ];
                    const styleParts = attrs.navStyle.split(';').map(s => s.trim()).filter(s => s);
                    const sanitizedNavStyle = styleParts.filter(part => {
                        const [property] = part.split(':').map(s => s.trim());
                        return allowedStyles.includes(property);
                    }).join('; ');
                    if (sanitizedNavStyle !== attrs.navStyle) {
                        console.warn(`Invalid or unsafe CSS in nav-style attribute: "${attrs.navStyle}". Using sanitized styles: "${sanitizedNavStyle}".`);
                        attrs.navStyle = sanitizedNavStyle;
                    }
                }
                attrs.navAriaLabel = this.getAttribute('nav-aria-label') || 'Main navigation';
                attrs.navToggleClass = this.getAttribute('nav-toggle-class') || '';
                if (attrs.navToggleClass) {
                    const sanitizedNavToggleClass = attrs.navToggleClass.split(/\s+/).filter(cls => /^[a-zA-Z0-9\-_]+$/.test(cls)).join(' ');
                    if (sanitizedNavToggleClass !== attrs.navToggleClass) {
                        console.warn(`Invalid characters in nav-toggle-class attribute: "${attrs.navToggleClass}". Using sanitized classes: "${sanitizedNavToggleClass}".`);
                        attrs.navToggleClass = sanitizedNavToggleClass;
                    }
                }
                attrs.navToggleIcon = this.getAttribute('nav-toggle-icon') || '<i class="fa-light fa-bars"></i>';
                if (attrs.navToggleIcon) {
                    const parser = new DOMParser();
                    const decodedIcon = attrs.navToggleIcon.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
                    const doc = parser.parseFromString(decodedIcon, 'text/html');
                    const iElement = doc.body.querySelector('i');
                    if (!iElement || !iElement.className.includes('fa-')) {
                        console.warn(`Invalid nav-toggle-icon attribute in <custom-header>. Must be a valid Font Awesome <i> tag. Defaulting to <i class="fa-light fa-bars"></i>.`);
                        attrs.navToggleIcon = '<i class="fa-light fa-bars"></i>';
                    } else {
                        const validClasses = iElement.className.split(' ').filter(cls => cls.startsWith('fa-') || cls === 'fa-chisel');
                        if (validClasses.length === 0) {
                            console.warn(`nav-toggle-icon attribute contains no valid Font Awesome classes. Defaulting to <i class="fa-light fa-bars"></i>.`);
                            attrs.navToggleIcon = '<i class="fa-light fa-bars"></i>';
                        } else {
                            attrs.navToggleIcon = `<i class="${validClasses.join(' ')}"></i>`;
                        }
                    }
                }
                attrs.navOrientation = this.getAttribute('nav-orientation') || 'horizontal';
                const validOrientations = ['horizontal', 'vertical'];
                if (!validOrientations.includes(attrs.navOrientation)) {
                    console.warn(`Invalid nav-orientation "${attrs.navOrientation}" in <custom-header>. Must be 'horizontal' or 'vertical'. Defaulting to 'horizontal'.`);
                    attrs.navOrientation = 'horizontal';
                }
                attrs.navContainerClass = this.getAttribute('nav-container-class') || '';
                if (attrs.navContainerClass) {
                    const sanitizedNavContainerClass = attrs.navContainerClass.split(/\s+/).filter(cls => /^[a-zA-Z0-9\-_]+$/.test(cls)).join(' ');
                    if (sanitizedNavContainerClass !== attrs.navContainerClass) {
                        console.warn(`Invalid characters in nav-container-class attribute: "${attrs.navContainerClass}". Using sanitized classes: "${sanitizedNavContainerClass}".`);
                        attrs.navContainerClass = sanitizedNavContainerClass;
                    }
                }
                attrs.navContainerStyle = this.getAttribute('nav-container-style') || '';
                if (attrs.navContainerStyle) {
                    const allowedStyles = [
                        'color', 'background', 'background-color', 'border', 'border-radius', 'padding', 'margin', 'font-size', 'font-weight',
                        'text-align', 'display', 'width', 'height', 'flex', 'justify-content', 'align-items', 'gap'
                    ];
                    const styleParts = attrs.navContainerStyle.split(';').map(s => s.trim()).filter(s => s);
                    const sanitizedNavContainerStyle = styleParts.filter(part => {
                        const [property] = part.split(':').map(s => s.trim());
                        return allowedStyles.includes(property);
                    }).join('; ');
                    if (sanitizedNavContainerStyle !== attrs.navContainerStyle) {
                        console.warn(`Invalid or unsafe CSS in nav-container-style attribute: "${attrs.navContainerStyle}". Using sanitized styles: "${sanitizedNavContainerStyle}".`);
                        attrs.navContainerStyle = sanitizedNavContainerStyle;
                    }
                }

                // New nav attributes, reusing logic from custom-block.js
                attrs.navBackgroundColor = this.getAttribute('nav-background-color') || '';
                attrs.navBackgroundColorClass = '';
                if (attrs.navBackgroundColor) {
                    const match = attrs.navBackgroundColor.match(/^background-color-(\d+)$/);
                    if (match) {
                        attrs.navBackgroundColorClass = `background-color-${match[1]}`;
                    } else {
                        console.warn(`Invalid nav-background-color value "${attrs.navBackgroundColor}" in <custom-header>. Expected format: background-color-[number]. Ignoring.`);
                    }
                }

                attrs.navBackgroundImageNoise = this.hasAttribute('nav-background-image-noise');

                attrs.navBorder = this.getAttribute('nav-border') || '';
                attrs.navBorderClass = '';
                if (attrs.navBorder) {
                    const validBorders = ['border-thin', 'border-medium', 'border-thick']; // Adjust based on your CSS
                    if (validBorders.includes(attrs.navBorder)) {
                        attrs.navBorderClass = attrs.navBorder;
                    } else {
                        console.warn(`Invalid nav-border value "${attrs.navBorder}" in <custom-header>. Must be one of ${validBorders.join(', ')}. Ignoring.`);
                    }
                }

                attrs.navBorderRadius = this.hasAttribute('nav-border') && this.hasAttribute('nav-border-radius') ? this.getAttribute('nav-border-radius') : '';
                attrs.navBorderRadiusClass = '';
                if (attrs.navBorderRadius) {
                    const validRadii = ['border-radius-small', 'border-radius-medium', 'border-radius-large']; // Adjust based on your CSS
                    if (validRadii.includes(attrs.navBorderRadius)) {
                        attrs.navBorderRadiusClass = attrs.navBorderRadius;
                    } else {
                        console.warn(`Invalid nav-border-radius value "${attrs.navBorderRadius}" in <custom-header>. Must be one of ${validRadii.join(', ')}. Ignoring.`);
                    }
                }

                attrs.navBackdropFilterClasses = this.getAttribute('nav-backdrop-filter')?.split(' ').filter(cls => cls) || [];

                return attrs;
            }

            render(isFallback = false) {
                const attrs = this.getAttributes();
                let blockElement = super.render(isFallback);
                if (!blockElement) {
                    console.error('Failed to render base CustomBlock for CustomHeader');
                    blockElement = document.createElement('div');
                }

                blockElement.setAttribute('role', 'banner');
                const hasVideoBackground = !isFallback && !!(attrs.videoBackgroundSrc || attrs.videoBackgroundLightSrc || attrs.videoBackgroundDarkSrc);
                const hasBackgroundImage = !isFallback && !!(attrs.backgroundSrc || attrs.backgroundLightSrc || attrs.backgroundDarkSrc) && !hasVideoBackground;
                const headerClasses = [
                    'block',
                    attrs.backgroundColorClass,
                    attrs.borderClass,
                    attrs.borderRadiusClass,
                    attrs.shadowClass,
                    attrs.sticky ? 'sticky' : '',
                    hasBackgroundImage ? 'background-image' : '',
                    hasVideoBackground ? 'background-video' : '',
                    ...attrs.customClasses.split(' ').filter(cls => cls)
                ].filter(cls => cls).join(' ').trim();
                if (headerClasses) {
                    blockElement.className = headerClasses;
                }

                if (attrs.styleAttribute && !isFallback) {
                    blockElement.setAttribute('style', attrs.styleAttribute);
                }

                if (blockElement.hasAttribute('data-section-title')) {
                    blockElement.removeAttribute('data-section-title');
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

                let logoHTML = '';
                if ((attrs.logoPrimarySrc || (attrs.logoLightSrc && attrs.logoDarkSrc)) && !isFallback) {
                    logoHTML = `
            <div${attrs.logoPosition ? ` class="${alignMap[attrs.logoPosition]}"` : ''} style="z-index: 100;">
                <a href="/">
                    ${this.generatePictureMarkup({
                        src: attrs.logoPrimarySrc || attrs.logoLightSrc,
                        lightSrc: attrs.logoLightSrc || attrs.logoPrimarySrc,
                        darkSrc: attrs.logoDarkSrc || attrs.logoPrimarySrc,
                        alt: attrs.logoPrimaryAlt || attrs.logoLightAlt,
                        isDecorative: !attrs.logoPrimaryAlt && !attrs.logoLightAlt,
                        customClasses: `logo logo-${attrs.navPosition}`,
                        loading: 'eager',
                        fetchPriority: 'high',
                        noResponsive: true
                    })}
                </a>
            </div>
        `;
                }

                let navHTML = '';
                if (attrs.nav && Array.isArray(attrs.nav) && !isFallback) {
                    const navAlignClass = alignMap[attrs.navPosition] || '';
                    // Apply new nav attributes to the <nav> element
                    const navClasses = [
                        attrs.navClass,
                        `nav-${attrs.navOrientation}`,
                        attrs.navBackgroundColorClass,
                        attrs.navBackgroundImageNoise ? 'background-image-noise' : '',
                        attrs.navBorderClass,
                        attrs.navBorderRadiusClass,
                        ...attrs.navBackdropFilterClasses.filter(cls => !cls.startsWith('backdrop-filter'))
                    ].filter(cls => cls).join(' ').trim();

                    // Handle backdrop-filter for nav
                    const navBackdropFilterValues = attrs.navBackdropFilterClasses
                        .filter(cls => cls.startsWith('backdrop-filter'))
                        .map(cls => CustomBlock.#BACKDROP_FILTER_MAP[cls] || '')
                        .filter(val => val);
                    const navBackdropFilterStyle = navBackdropFilterValues.length > 0 ? `backdrop-filter: ${navBackdropFilterValues.join(' ')}` : '';
                    const navStyle = [attrs.navStyle, navBackdropFilterStyle].filter(s => s).join('; ').trim();

                    if (attrs.logoPlacement === 'nav') {
                        navHTML = `
                <nav aria-label="${attrs.navAriaLabel}"${navClasses ? ` class="${navClasses}"` : ''}${navStyle ? ` style="${navStyle}"` : ''}>
                    <button${attrs.navToggleClass ? ` class="${attrs.navToggleClass}"` : ''} aria-expanded="false" aria-controls="nav-menu" aria-label="Toggle navigation">
                        <span class="hamburger-icon">${attrs.navToggleIcon}</span>
                    </button>
                    <ul class="nav-links" id="nav-menu">
                        ${attrs.nav.map(link => `
                            <li><a href="${link.href || '#'}"${link.href ? '' : ' aria-disabled="true"'}>${link.text || 'Link'}</a></li>
                        `).join('')}
                    </ul>
                </nav>
            `;
                    } else {
                        navHTML = `
                <div${navAlignClass ? ` class="${navAlignClass}"` : ''}${attrs.navStyle ? ` style="${attrs.navStyle}"` : ''}>
                    <nav aria-label="${attrs.navAriaLabel}"${navClasses ? ` class="${navClasses}"` : ''}${navStyle ? ` style="${navStyle}"` : ''}>
                        <button${attrs.navToggleClass ? ` class="${attrs.navToggleClass}"` : ''} aria-expanded="false" aria-controls="nav-menu" aria-label="Toggle navigation">
                            <span class="hamburger-icon">${attrs.navToggleIcon}</span>
                        </button>
                        <ul class="nav-links" id="nav-menu">
                            ${attrs.nav.map(link => `
                                <li><a href="${link.href || '#'}"${link.href ? '' : ' aria-disabled="true"'}>${link.text || 'Link'}</a></li>
                            `).join('')}
                        </ul>
                    </nav>
                </div>
            `;
                    }
                }

                let innerHTML = blockElement.innerHTML;
                if (attrs.logoPlacement === 'nav' && navHTML && logoHTML) {
                    const navContainerClass = attrs.navPosition ?

                        connectedCallback() {
                            super.connectedCallback();
                    if (this.hasAttribute('sticky')) {
                        this.style.position = 'sticky';
                        this.style.top = '0';
                        this.style.zIndex = '1000';
                    }
                }

                attributeChangedCallback(name, oldValue, newValue) {
                    super.attributeChangedCallback(name, oldValue, newValue);
                    if ([
                        'nav',
                        'sticky',
                        'logo-primary-src',
                        'logo-light-src',
                        'logo-dark-src',
                        'logo-primary-alt',
                        'logo-light-alt',
                        'logo-dark-alt',
                        'nav-position',
                        'nav-class',
                        'nav-style',
                        'nav-aria-label',
                        'nav-toggle-class',
                        'nav-toggle-icon',
                        'nav-orientation',
                        'logo-position',
                        'logo-placement',
                        'nav-container-class',
                        'nav-container-style',
                        'nav-background-color', // New
                        'nav-background-image-noise', // New
                        'nav-border', // New
                        'nav-border-radius', // New
                        'nav-backdrop-filter' // New
                    ].includes(name) && this.isInitialized && this.isVisible) {
                        this.initialize();
                    }
                }
            }

        try {
            customElements.define('custom-header', CustomHeader);
            console.log('CustomHeader defined successfully');
        } catch (error) {
            console.error('Error defining CustomHeader element:', error);
        }

        console.log('CustomHeader version: 2025-08-27');
    } catch (error) {
        console.error('Failed to import CustomBlock:', error);
    }
})();
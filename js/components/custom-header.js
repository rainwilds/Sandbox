/* global HTMLElement, document, DOMParser */

(async () => {
    try {
        // Import CustomBlock from the local file
        const { CustomBlock } = await import('./custom-block.js');
        console.log('Successfully imported CustomBlock');

        class CustomHeader extends CustomBlock {
            constructor() {
                super();
                // Set header-specific default attributes
                this.setAttribute('heading-tag', this.getAttribute('heading-tag') || 'h1');
                this.setAttribute('inner-alignment', this.getAttribute('inner-alignment') || 'center');
                this.setAttribute('text-alignment', this.getAttribute('text-alignment') || 'center');
                this.setAttribute('class', this.getAttribute('class') || 'padding-large');
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
                    'logo-placement' // Add logo-placement to observed attributes
                ];
            }

            getAttributes() {
                const attrs = super.getAttributes();
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
                attrs.logoPosition = this.getAttribute('logo-position') || ''; // New attribute, no default
                if (attrs.logoPosition && !validNavPositions.includes(attrs.logoPosition)) {
                    console.warn(`Invalid logo-position "${attrs.logoPosition}" in <custom-header>. Must be one of ${validNavPositions.join(', ')}. Ignoring.`);
                    attrs.logoPosition = '';
                }
                attrs.logoPlacement = this.getAttribute('logo-placement') || 'independent'; // Default to 'independent'
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
        ...attrs.customClasses.split(' ').filter(cls => cls && cls !== 'padding-medium')
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
                        noResponsive: true // Use non-responsive mode for logo
                    })}
                </a>
            </div>
        `;
    }

    let navHTML = '';
    if (attrs.nav && Array.isArray(attrs.nav) && !isFallback) {
        const navAlignClass = alignMap[attrs.navPosition] || '';
        const navClasses = [
            attrs.navClass,
            `nav-${attrs.navOrientation}`
        ].filter(cls => cls).join(' ').trim();
        
        if (attrs.logoPlacement === 'nav') {
            // When logo-placement is 'nav', place logo and nav as siblings
            navHTML = `
                <nav aria-label="${attrs.navAriaLabel}"${navClasses ? ` class="${navClasses}"` : ''}${attrs.navStyle ? ` style="${attrs.navStyle}"` : ''}>
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
            // When logo-placement is 'independent', wrap nav in its own div
            navHTML = `
                <div${navAlignClass ? ` class="${navAlignClass}"` : ''}${attrs.navStyle ? ` style="${attrs.navStyle}"` : ''}>
                    <nav aria-label="${attrs.navAriaLabel}"${navClasses ? ` class="${navClasses}"` : ''}>
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
        // Wrap logo and nav in a container to make them siblings, respecting nav-position
        const navContainerClass = attrs.navPosition ? alignMap[attrs.navPosition] : '';
        innerHTML = `
            <div${navContainerClass ? ` class="${navContainerClass}"` : ''} style="display: flex; align-items: center;">
                ${logoHTML}
                ${navHTML}
            </div>
            ${innerHTML}
        `;
    } else {
        // When logo-placement is 'independent' (default), maintain original order
        if (attrs.navPosition === 'above') {
            innerHTML = navHTML + logoHTML + innerHTML;
        } else if (attrs.navPosition === 'below') {
            innerHTML = logoHTML + innerHTML + navHTML;
        } else {
            innerHTML = logoHTML + navHTML + innerHTML;
        }
    }
    blockElement.innerHTML = innerHTML;

    if (attrs.nav && !isFallback) {
        const hamburger = blockElement.querySelector(`.${attrs.navToggleClass || 'button[aria-controls="nav-menu"]'}`);
        const navMenu = blockElement.querySelector('#nav-menu');
        if (hamburger && navMenu) {
            hamburger.addEventListener('click', () => {
                const isExpanded = hamburger.getAttribute('aria-expanded') === 'true';
                hamburger.setAttribute('aria-expanded', !isExpanded);
                navMenu.style.display = isExpanded ? 'none' : 'block';
            });
        }
    }

    if (!isFallback) {
        super.render(isFallback);
    }

    return blockElement;
}

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
                    'logo-placement' // Add logo-placement to trigger re-render
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
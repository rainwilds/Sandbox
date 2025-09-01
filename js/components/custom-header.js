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
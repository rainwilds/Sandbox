/* global HTMLElement, document */
(async () => {
    // Dynamically import custom-block.js with relative path
    const { CustomBlock } = await import('./js/components/custom-block.js');

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
            return [...super.observedAttributes, 'nav-links', 'sticky', 'logo-src', 'logo-alt', 'nav-position', 'mobile-menu-breakpoint', 'search-enabled'];
        }

        getAttributes() {
            const attrs = super.getAttributes();
            attrs.navLinks = this.getAttribute('nav-links') ? JSON.parse(this.getAttribute('nav-links')) : null;
            attrs.sticky = this.hasAttribute('sticky');
            attrs.logoSrc = this.getAttribute('logo-src') || '';
            attrs.logoAlt = this.getAttribute('logo-alt') || '';
            attrs.navPosition = this.getAttribute('nav-position') || 'right';
            attrs.mobileMenuBreakpoint = this.getAttribute('mobile-menu-breakpoint') || '768px';
            attrs.searchEnabled = this.hasAttribute('search-enabled');
            const validNavPositions = ['left', 'center', 'right', 'below', 'above'];
            if (!validNavPositions.includes(attrs.navPosition)) {
                console.warn(`Invalid nav-position "${attrs.navPosition}" in <custom-header>. Must be one of ${validNavPositions.join(', ')}. Defaulting to 'right'.`);
                attrs.navPosition = 'right';
            }
            if (!/^\d+px$/.test(attrs.mobileMenuBreakpoint)) {
                console.warn(`Invalid mobile-menu-breakpoint "${attrs.mobileMenuBreakpoint}" in <custom-header>. Must be a pixel value (e.g., "768px"). Defaulting to "768px".`);
                attrs.mobileMenuBreakpoint = '768px';
            }
            if (attrs.primarySrc || attrs.primaryLightSrc || attrs.primaryDarkSrc || attrs.videoPrimarySrc) {
                console.warn('Primary images or videos are not recommended for headers in <custom-header>. Consider using background media.');
                attrs.primaryPosition = 'none';
            }
            return attrs;
        }

        render(isFallback = false) {
            const attrs = this.getAttributes();
            const headerElement = document.createElement('header');
            headerElement.setAttribute('role', 'banner');

            // Get the base block content from CustomBlock
            const blockElement = super.render(isFallback);
            if (!blockElement) {
                console.error('Failed to render base CustomBlock for CustomHeader');
                return headerElement;
            }

            // Combine header classes
            const headerClasses = [
                attrs.backgroundColorClass,
                attrs.borderClass,
                attrs.borderRadiusClass,
                attrs.shadowClass,
                attrs.sticky ? 'sticky' : '',
                ...attrs.customClasses.split(' ').filter(cls => cls)
            ].filter(cls => cls).join(' ').trim();
            if (headerClasses) {
                headerElement.className = headerClasses;
            }

            // Transfer styles from block to header
            if (attrs.styleAttribute && !isFallback) {
                headerElement.setAttribute('style', attrs.styleAttribute);
            }

            // Set CSS variable for mobile menu breakpoint
            if (attrs.mobileMenuBreakpoint && !isFallback) {
                headerElement.style.setProperty('--mobile-menu-breakpoint', attrs.mobileMenuBreakpoint);
            }

            // Generate logo markup
            let logoHTML = '';
            if (attrs.logoSrc && !isFallback) {
                logoHTML = `
                    <a href="/" class="logo-link">
                        ${this.generatePictureMarkup({
                            src: attrs.logoSrc,
                            alt: attrs.logoAlt,
                            isDecorative: !attrs.logoAlt,
                            customClasses: `logo logo-${attrs.navPosition}`,
                            loading: 'eager',
                            fetchPriority: 'high'
                        })}
                    </a>
                `;
            }

            // Generate navigation markup with hamburger toggle
            let navHTML = '';
            if (attrs.navLinks && Array.isArray(attrs.navLinks) && !isFallback) {
                navHTML = `
                    <nav aria-label="Main navigation" class="nav-${attrs.navPosition}">
                        <button class="hamburger" aria-expanded="false" aria-controls="nav-menu" aria-label="Toggle navigation">
                            <span class="hamburger-icon">☰</span>
                        </button>
                        <ul class="nav-links" id="nav-menu">
                            ${attrs.navLinks.map(link => `
                                <li><a href="${link.href || '#'}"${link.href ? '' : ' aria-disabled="true"'}>${link.text || 'Link'}</a></li>
                            `).join('')}
                        </ul>
                    </nav>
                `;
            }

            // Generate search form
            let searchHTML = '';
            if (attrs.searchEnabled && !isFallback) {
                const searchUrl = attrs['schema-site-url'] || 'https://rainwilds.github.io/Sandbox/';
                searchHTML = `
                    <form action="${searchUrl}?s=" class="search-form">
                        <input type="search" name="s" placeholder="Search..." aria-label="Search the site">
                        <button type="submit" aria-label="Submit search">🔍</button>
                    </form>
                `;
            }

            // Combine content based on nav-position
            let innerHTML = '';
            if (attrs.navPosition === 'above') {
                innerHTML = navHTML + logoHTML + blockElement.innerHTML + searchHTML;
            } else if (attrs.navPosition === 'below') {
                innerHTML = logoHTML + blockElement.innerHTML + navHTML + searchHTML;
            } else {
                innerHTML = `<div class="header-content nav-${attrs.navPosition}">${logoHTML}${blockElement.innerHTML}${navHTML}${searchHTML}</div>`;
            }

            headerElement.innerHTML = innerHTML;

            // Add event listener for hamburger menu
            if (attrs.navLinks && !isFallback) {
                const hamburger = headerElement.querySelector('.hamburger');
                const navMenu = headerElement.querySelector('#nav-menu');
                if (hamburger && navMenu) {
                    hamburger.addEventListener('click', () => {
                        const isExpanded = hamburger.getAttribute('aria-expanded') === 'true';
                        hamburger.setAttribute('aria-expanded', !isExpanded);
                        navMenu.style.display = isExpanded ? 'none' : 'block';
                    });
                }
            }

            // Cache the result in the parent class
            if (!isFallback) {
                super.render(isFallback); // Ensure parent caching
            }

            return headerElement;
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
            if (['nav-links', 'sticky', 'logo-src', 'logo-alt', 'nav-position', 'mobile-menu-breakpoint', 'search-enabled'].includes(name) && this.isInitialized && this.isVisible) {
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
})();
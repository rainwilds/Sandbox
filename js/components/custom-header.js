/* global HTMLElement, document */

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
                this.setAttribute('role', 'banner'); // Set role on the custom element itself
            }

            static get observedAttributes() {
                return [...super.observedAttributes, 'nav', 'sticky', 'logo-primary-src', 'logo-light-src', 'logo-dark-src', 'logo-primary-alt', 'logo-light-alt', 'logo-dark-alt', 'nav-position'];
            }

            getAttributes() {
                const attrs = super.getAttributes();
                attrs.nav = this.getAttribute('nav') ? JSON.parse(this.getAttribute('nav')) : null;
                attrs.sticky = this.hasAttribute('sticky'); // Makes the header fixed at the top of the viewport with z-index 1000
                attrs.logoPrimarySrc = this.getAttribute('logo-primary-src') || '';
                attrs.logoLightSrc = this.getAttribute('logo-light-src') || '';
                attrs.logoDarkSrc = this.getAttribute('logo-dark-src') || '';
                // Validate logo-light-src and logo-dark-src: both required if either is present
                if ((attrs.logoLightSrc || attrs.logoDarkSrc) && !(attrs.logoLightSrc && attrs.logoDarkSrc)) {
                    console.error('Both logo-light-src and logo-dark-src must be provided when using light/dark themes for the logo.');
                }
                attrs.logoPrimaryAlt = this.getAttribute('logo-primary-alt') || '';
                attrs.logoLightAlt = this.getAttribute('logo-light-alt') || '';
                attrs.logoDarkAlt = this.getAttribute('logo-dark-alt') || '';
                // Validate alt attributes: error if any alt is missing when corresponding src is provided
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
                // Use alignMap from CustomBlock for valid nav-position options
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
                const validNavPositions = Object.keys(alignMap);
                if (!validNavPositions.includes(attrs.navPosition)) {
                    console.warn(`Invalid nav-position "${attrs.navPosition}" in <custom-header>. Must be one of ${validNavPositions.join(', ')}. Defaulting to 'right'.`);
                    attrs.navPosition = 'right';
                }
                return attrs;
            }

            render(isFallback = false) {
                const attrs = this.getAttributes();
                let blockElement = super.render(isFallback); // Get the base element from CustomBlock
                if (!blockElement) {
                    console.error('Failed to render base CustomBlock for CustomHeader');
                    blockElement = document.createElement('div'); // Fallback to a div if rendering fails
                }

                // Set role and classes directly on the blockElement
                blockElement.setAttribute('role', 'banner');
                const headerClasses = [
                    'block', // Explicitly set 'block' class as per desired output
                    attrs.backgroundColorClass,
                    attrs.borderClass,
                    attrs.borderRadiusClass,
                    attrs.shadowClass,
                    attrs.sticky ? 'sticky' : '',
                    ...attrs.customClasses.split(' ').filter(cls => cls && cls !== 'padding-medium') // Exclude padding-medium to avoid redundancy
                ].filter(cls => cls).join(' ').trim();
                if (headerClasses) {
                    blockElement.className = headerClasses;
                }

                // Transfer styles from block to header
                if (attrs.styleAttribute && !isFallback) {
                    blockElement.setAttribute('style', attrs.styleAttribute);
                }

                // Remove any existing data-section-title if not needed
                if (blockElement.hasAttribute('data-section-title')) {
                    blockElement.removeAttribute('data-section-title');
                }

                // Generate logo markup
                let logoHTML = '';
                if (attrs.logoPrimarySrc && !isFallback) {
                    logoHTML = `
                        <div><a href="/" class="logo-link">
                            ${this.generatePictureMarkup({
                                src: attrs.logoPrimarySrc,
                                lightSrc: attrs.logoLightSrc || attrs.logoPrimarySrc,
                                darkSrc: attrs.logoDarkSrc || attrs.logoPrimarySrc,
                                alt: attrs.logoPrimaryAlt,
                                isDecorative: !attrs.logoPrimaryAlt,
                                customClasses: `logo logo-${attrs.navPosition}`,
                                loading: 'eager',
                                fetchPriority: 'high'
                            })}
                        </a></div>
                    `;
                }

                // Generate navigation markup with hamburger toggle
                let navHTML = '';
                if (attrs.nav && Array.isArray(attrs.nav) && !isFallback) {
                    navHTML = `
                        <div><nav aria-label="Main navigation" class="nav-${attrs.navPosition}">
                            <button class="hamburger" aria-expanded="false" aria-controls="nav-menu" aria-label="Toggle navigation">
                                <span class="hamburger-icon">☰</span>
                            </button>
                            <ul class="nav-links" id="nav-menu">
                                ${attrs.nav.map(link => `
                                    <li><a href="${link.href || '#'}"${link.href ? '' : ' aria-disabled="true"'}>${link.text || 'Link'}</a></li>
                                `).join('')}
                            </ul>
                        </nav></div>
                    `;
                }

                // Combine content based on nav-position
                let innerHTML = blockElement.innerHTML; // Start with existing content
                if (attrs.navPosition === 'above') {
                    innerHTML = navHTML + logoHTML + innerHTML;
                } else if (attrs.navPosition === 'below') {
                    innerHTML = logoHTML + innerHTML + navHTML;
                } else {
                    innerHTML = logoHTML + innerHTML + navHTML; // No header-content wrapper
                }
                blockElement.innerHTML = innerHTML;

                // Add event listener for hamburger menu
                if (attrs.nav && !isFallback) {
                    const hamburger = blockElement.querySelector('.hamburger');
                    const navMenu = blockElement.querySelector('#nav-menu');
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

                return blockElement; // Return the modified blockElement
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
                if (['nav', 'sticky', 'logo-primary-src', 'logo-light-src', 'logo-dark-src', 'logo-primary-alt', 'logo-light-alt', 'logo-dark-alt', 'nav-position'].includes(name) && this.isInitialized && this.isVisible) {
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
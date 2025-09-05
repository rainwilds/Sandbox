(async () => {
    try {
        const { BACKDROP_FILTER_MAP } = await import('./custom-block.js');
        console.log('Successfully imported BACKDROP_FILTER_MAP');

        class CustomNav extends HTMLElement {
            static get observedAttributes() {
                return [
                    'nav',
                    'nav-position',
                    'nav-class',
                    'nav-style',
                    'nav-aria-label',
                    'nav-toggle-class',
                    'nav-toggle-icon',
                    'nav-orientation',
                    'nav-container-class',
                    'nav-container-style',
                    'nav-background-color',
                    'nav-background-image-noise',
                    'nav-border',
                    'nav-border-radius',
                    'nav-backdrop-filter'
                ];
            }

            getAttributes() {
                const attrs = {};
                attrs.nav = this.getAttribute('nav') ? JSON.parse(this.getAttribute('nav')) : null;
                attrs.navPosition = this.getAttribute('nav-position') || '';
                attrs.navClass = this.getAttribute('nav-class') || '';
                attrs.navStyle = this.getAttribute('nav-style') || '';
                attrs.navAriaLabel = this.getAttribute('nav-aria-label') || 'Main navigation';
                attrs.navToggleClass = this.getAttribute('nav-toggle-class') || '';
                attrs.navToggleIcon = this.getAttribute('nav-toggle-icon') || '<i class="fa-light fa-bars"></i>';
                attrs.navOrientation = this.getAttribute('nav-orientation') || 'horizontal';
                attrs.navContainerClass = this.getAttribute('nav-container-class') || '';
                attrs.navContainerStyle = this.getAttribute('nav-container-style') || '';
                attrs.navBackgroundColor = this.getAttribute('nav-background-color') || '';
                attrs.navBackgroundImageNoise = this.hasAttribute('nav-background-image-noise');
                attrs.navBorder = this.getAttribute('nav-border') || '';
                attrs.navBorderRadius = this.getAttribute('nav-border-radius') || '';
                attrs.navBackdropFilter = this.getAttribute('nav-backdrop-filter')?.split(' ').filter(cls => cls) || [];

                const validPositions = [
                    'center', 'top', 'bottom', 'left', 'right',
                    'top-left', 'top-center', 'top-right',
                    'bottom-left', 'bottom-center', 'bottom-right',
                    'center-left', 'center-right'
                ];
                if (!validPositions.includes(attrs.navPosition)) {
                    console.warn(`Invalid nav-position "${attrs.navPosition}". Must be one of ${validPositions.join(', ')}. Ignoring.`);
                    attrs.navPosition = '';
                }
                return attrs;
            }

            render() {
                const attrs = this.getAttributes();
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
                const navAlignClass = attrs.navPosition ? alignMap[attrs.navPosition] : '';
                const navClasses = [
                    attrs.navClass,
                    `nav-${attrs.navOrientation}`,
                    attrs.navBackgroundImageNoise ? 'background-image-noise' : '',
                    attrs.navBorder,
                    attrs.navBorderRadius,
                    ...attrs.navBackdropFilter.filter(cls => !cls.startsWith('backdrop-filter'))
                ].filter(cls => cls).join(' ').trim();
                const navBackdropFilterStyle = attrs.navBackdropFilter
                    .filter(cls => cls.startsWith('backdrop-filter'))
                    .map(cls => BACKDROP_FILTER_MAP[cls] || '')
                    .filter(val => val)
                    .join(' ');
                const navStyle = [attrs.navStyle, navBackdropFilterStyle].filter(s => s).join('; ').trim();

                this.innerHTML = `
                    <div class="${navAlignClass} ${attrs.navContainerClass}"${attrs.navContainerStyle ? ` style="${attrs.navContainerStyle}"` : ''}>
                        <nav aria-label="${attrs.navAriaLabel}"${navClasses ? ` class="${navClasses}"` : ''}${navStyle ? ` style="${navStyle}"` : ''}>
                            <button${attrs.navToggleClass ? ` class="${attrs.navToggleClass}"` : ''} aria-expanded="false" aria-controls="nav-menu" aria-label="Toggle navigation">
                                <span class="hamburger-icon">${attrs.navToggleIcon}</span>
                            </button>
                            <ul class="nav-links" id="nav-menu">
                                ${attrs.nav?.map(link => `
                                    <li><a href="${link.href || '#'}"${link.href ? '' : ' aria-disabled="true"'}>${link.text || 'Link'}</a></li>
                                `).join('') || ''}
                            </ul>
                        </nav>
                    </div>
                `;

                const hamburger = this.querySelector('button[aria-controls="nav-menu"]');
                const navMenu = this.querySelector('#nav-menu');
                if (hamburger && navMenu) {
                    hamburger.addEventListener('click', () => {
                        const isExpanded = hamburger.getAttribute('aria-expanded') === 'true';
                        hamburger.setAttribute('aria-expanded', !isExpanded);
                        navMenu.style.display = isExpanded ? 'none' : 'block';
                    });
                }
            }

            connectedCallback() {
                this.render();
            }

            attributeChangedCallback() {
                if (this.isConnected) {
                    this.render();
                }
            }
        }
        if (!customElements.get('custom-nav')) {
            customElements.define('custom-nav', CustomNav);
            console.log('CustomNav defined successfully');
        }
        document.querySelectorAll('custom-nav').forEach(element => {
            customElements.upgrade(element);
        });
    } catch (error) {
        console.error('Failed to import BACKDROP_FILTER_MAP or define CustomNav:', error);
    }
})();
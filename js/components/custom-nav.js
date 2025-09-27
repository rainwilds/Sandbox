(async () => {
    const isDev = window.location.href.includes('/dev/') ||
      new URLSearchParams(window.location.search).get('debug') === 'true';

    const log = (message, data = null) => {
        if (isDev) {
            console.groupCollapsed(`%c[CustomNav] ${new Date().toLocaleTimeString()} ${message}`, 'color: #2196F3; font-weight: bold;');
            if (data) console.log('%cData:', 'color: #4CAF50;', data);
            console.trace();
            console.groupEnd();
        }
    };

    const warn = (message, data = null) => {
        if (isDev) {
            console.groupCollapsed(`%c[CustomNav] ⚠️ ${new Date().toLocaleTimeString()} ${message}`, 'color: #FF9800; font-weight: bold;');
            if (data) console.log('%cData:', 'color: #4CAF50;', data);
            console.trace();
            console.groupEnd();
        }
    };

    const error = (message, data = null) => {
        if (isDev) {
            console.groupCollapsed(`%c[CustomNav] ❌ ${new Date().toLocaleTimeString()} ${message}`, 'color: #F44336; font-weight: bold;');
            if (data) console.log('%cData:', 'color: #4CAF50;', data);
            console.trace();
            console.groupEnd();
        }
    };

    try {
        const { BACKDROP_FILTER_MAP, VALID_ALIGNMENTS, VALID_ALIGN_MAP } = await import('../shared.js');
        log('Imported shared constants successfully');

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

            #cachedAttrs = null;
            #renderTimeout = null;

            getAttributes() {
                if (this.#cachedAttrs) {
                    log('Using cached attributes');
                    return this.#cachedAttrs;
                }
                log('Parsing attributes');
                const attrs = {
                    nav: null,
                    navPosition: this.getAttribute('nav-position') || '',
                    navClass: this.getAttribute('nav-class') || '',
                    navStyle: this.getAttribute('nav-style') || '',
                    navAriaLabel: this.getAttribute('nav-aria-label') || 'Main navigation',
                    navToggleClass: this.getAttribute('nav-toggle-class') || '',
                    navToggleIcon: this.getAttribute('nav-toggle-icon') || '<i class="fa-solid fa-bars"></i>',
                    navOrientation: this.getAttribute('nav-orientation') || 'horizontal',
                    navContainerClass: this.getAttribute('nav-container-class') || '',
                    navContainerStyle: this.getAttribute('nav-container-style') || '',
                    navBackgroundColor: this.getAttribute('nav-background-color') || '',
                    navBackgroundImageNoise: this.hasAttribute('nav-background-image-noise'),
                    navBorder: this.getAttribute('nav-border') || '',
                    navBorderRadius: this.getAttribute('nav-border-radius') || '',
                    navBackdropFilter: this.getAttribute('nav-backdrop-filter')?.trim().split(/\s+/) || []
                };

                try {
                    const navAttr = this.getAttribute('nav');
                    if (navAttr) {
                        const normalizedNav = navAttr.replace(/\s+/g, ' ').trim();
                        attrs.nav = JSON.parse(normalizedNav);
                        if (!Array.isArray(attrs.nav)) {
                            throw new Error('Parsed nav attribute is not an array');
                        }
                        log('Nav attribute parsed successfully', { nav: attrs.nav });
                    } else {
                        warn('No nav attribute provided; rendering empty navigation');
                    }
                } catch (e) {
                    warn('Failed to parse nav JSON; rendering empty navigation', { error: e.message, navAttr: this.getAttribute('nav') });
                    attrs.nav = null;
                }

                if (!VALID_ALIGNMENTS.includes(attrs.navPosition)) {
                    warn(`Invalid nav-position "${attrs.navPosition}". Must be one of ${VALID_ALIGNMENTS.join(', ')}. Ignoring.`);
                    attrs.navPosition = '';
                }

                this.#cachedAttrs = attrs;
                log('Attributes parsed successfully', attrs);
                return attrs;
            }

            debounceRender() {
                if (this.#renderTimeout) clearTimeout(this.#renderTimeout);
                this.#renderTimeout = setTimeout(() => this.render(), 0);
            }

            render() {
                log('Starting render');
                const attrs = this.getAttributes();
                const uniqueId = `nav-menu-${Math.random().toString(36).slice(2, 11)}`;
                const navAlignClass = attrs.navPosition ? VALID_ALIGN_MAP[attrs.navPosition] : '';
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
                const navStyle = [
                    attrs.navStyle,
                    navBackdropFilterStyle,
                    attrs.navBackgroundColor ? `background-color: ${attrs.navBackgroundColor};` : ''
                ].filter(s => s).join('; ').trim();

                this.innerHTML = `
                    <div class="${navAlignClass} ${attrs.navContainerClass}"${attrs.navContainerStyle ? ` style="${attrs.navContainerStyle}"` : ''}>
                        <nav aria-label="${attrs.navAriaLabel}"${navClasses ? ` class="${navClasses}"` : ''}${navStyle ? ` style="${navStyle}"` : ''}>
                            <button${attrs.navToggleClass ? ` class="${attrs.navToggleClass}"` : ''} aria-expanded="false" aria-controls="${uniqueId}" aria-label="Toggle navigation">
                                <span class="hamburger-icon">${attrs.navToggleIcon}</span>
                            </button>
                            <ul class="nav-links" id="${uniqueId}">
                                ${attrs.nav?.map(link => `
                                    <li><a href="${link.href || '#'}"${link.href ? '' : ' aria-disabled="true"'}>${link.text || 'Link'}</a></li>
                                `).join('') || '<li>No navigation links provided</li>'}
                            </ul>
                        </nav>
                    </div>
                `;
                log('Inner HTML set', { innerHTML: this.innerHTML });

                const hamburger = this.querySelector(`button[aria-controls="${uniqueId}"]`);
                const navMenu = this.querySelector(`#${uniqueId}`);
                if (hamburger && navMenu) {
                    hamburger.addEventListener('click', () => {
                        const isExpanded = hamburger.getAttribute('aria-expanded') === 'true';
                        hamburger.setAttribute('aria-expanded', !isExpanded);
                        navMenu.style.display = isExpanded ? 'none' : 'block';
                        log('Toggle navigation clicked', { isExpanded: !isExpanded });
                    });
                } else {
                    warn('Toggle button or menu not found', { hamburger: !!hamburger, navMenu: !!navMenu });
                }
                log('Render complete');
            }

            connectedCallback() {
                log('Connected to DOM');
                this.debounceRender();
            }

            attributeChangedCallback() {
                log('Attribute changed');
                this.#cachedAttrs = null; // Invalidate cache on attribute change
                if (this.isConnected) this.debounceRender();
            }
        }

        if (!customElements.get('custom-nav')) {
            customElements.define('custom-nav', CustomNav);
            log('CustomNav defined successfully');
        }

        document.querySelectorAll('custom-nav:not([defined])').forEach(element => {
            customElements.upgrade(element);
            element.setAttribute('defined', '');
            log('Upgraded existing custom-nav element');
        });
    } catch (err) {
        error('Failed to import shared.js or define CustomNav', { error: err.message });
    }
})();
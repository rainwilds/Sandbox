(async () => {
    // Check for debug mode via URL patterns for conditional logging without production impact.
    const isDev = window.location.href.includes('/dev/') ||
      new URLSearchParams(window.location.search).get('debug') === 'true';

    // Logging utility with collapsible groups, timestamps, and styling; noop in production.
    const log = (message, data = null) => {
        if (isDev) {
            console.groupCollapsed(`%c[CustomNav] ${new Date().toLocaleTimeString()} ${message}`, 'color: #2196F3; font-weight: bold;');
            if (data) console.log('%cData:', 'color: #4CAF50;', data);
            console.trace();
            console.groupEnd();
        }
    };

    // Warning logger for non-critical issues.
    const warn = (message, data = null) => {
        if (isDev) {
            console.groupCollapsed(`%c[CustomNav] ⚠️ ${new Date().toLocaleTimeString()} ${message}`, 'color: #FF9800; font-weight: bold;');
            if (data) console.log('%cData:', 'color: #4CAF50;', data);
            console.trace();
            console.groupEnd();
        }
    };

    // Error logger for critical failures.
    const error = (message, data = null) => {
        if (isDev) {
            console.groupCollapsed(`%c[CustomNav] ❌ ${new Date().toLocaleTimeString()} ${message}`, 'color: #F44336; font-weight: bold;');
            if (data) console.log('%cData:', 'color: #4CAF50;', data);
            console.trace();
            console.groupEnd();
        }
    };

    try {
        // Dynamically import shared constants for tree-shaking and deferred loading.
        const { BACKDROP_FILTER_MAP, VALID_ALIGNMENTS, VALID_ALIGN_MAP } = await import('../shared.js');
        log('Imported shared constants successfully');

        class CustomNav extends HTMLElement {
            // Observed attributes for reactive updates.
            static observedAttributes = [
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

            // Parse and sanitize attributes with defaults and validation.
            #getAttributes() {
                log('Parsing attributes');
                const attrs = {
                    nav: null,
                    navPosition: this.getAttribute('nav-position') || '',
                    navClass: this.getAttribute('nav-class') || '',
                    navStyle: this.getAttribute('nav-style') || '',
                    navAriaLabel: this.getAttribute('nav-aria-label') || 'Main navigation',
                    navToggleClass: this.getAttribute('nav-toggle-class') || '',
                    navToggleIcon: this.getAttribute('nav-toggle-icon') || '<i class="fa-light fa-bars"></i>',
                    navOrientation: this.getAttribute('nav-orientation') || 'horizontal',
                    navContainerClass: this.getAttribute('nav-container-class') || '',
                    navContainerStyle: this.getAttribute('nav-container-style') || '',
                    navBackgroundColor: this.getAttribute('nav-background-color') || '',
                    navBackgroundImageNoise: this.hasAttribute('nav-background-image-noise'),
                    navBorder: this.getAttribute('nav-border') || '',
                    navBorderRadius: this.getAttribute('nav-border-radius') || '',
                    navBackdropFilter: this.getAttribute('nav-backdrop-filter')?.trim().split(/\s+/) || []
                };

                // Safe JSON parsing for nav data.
                try {
                    const navAttr = this.getAttribute('nav');
                    if (navAttr) attrs.nav = JSON.parse(navAttr);
                } catch (e) {
                    warn('Invalid JSON in "nav" attribute; ignoring', { error: e.message });
                }

                if (!VALID_ALIGNMENTS.includes(attrs.navPosition)) {
                    warn(`Invalid nav-position "${attrs.navPosition}". Must be one of ${VALID_ALIGNMENTS.join(', ')}. Using default.`);
                    attrs.navPosition = '';
                }

                log('Attributes parsed', attrs);
                return attrs;
            }

            // Render method: Builds DOM efficiently using template literals.
            #render() {
                log('Rendering component');
                const attrs = this.#getAttributes();
                const uniqueId = `nav-menu-${Math.random().toString(36).slice(2, 11)}`; // Unique ID to avoid conflicts.
                const navAlignClass = attrs.navPosition ? VALID_ALIGN_MAP[attrs.navPosition] : '';
                const navClasses = [
                    attrs.navClass,
                    `nav-${attrs.navOrientation}`,
                    attrs.navBackgroundImageNoise ? 'background-image-noise' : '',
                    attrs.navBorder,
                    attrs.navBorderRadius,
                    ...attrs.navBackdropFilter.filter(cls => !cls.startsWith('backdrop-filter'))
                ].filter(Boolean).join(' ');
                const navBackdropFilterStyle = attrs.navBackdropFilter
                    .filter(cls => cls.startsWith('backdrop-filter'))
                    .map(cls => BACKDROP_FILTER_MAP[cls] || '')
                    .filter(Boolean)
                    .join(' ');
                const navStyle = [attrs.navStyle, navBackdropFilterStyle, attrs.navBackgroundColor ? `background-color: ${attrs.navBackgroundColor};` : '']
                    .filter(Boolean)
                    .join('; ');

                // Use innerHTML for simplicity; small component size minimizes reflows.
                this.innerHTML = `
                    <div class="${navAlignClass} ${attrs.navContainerClass}"${attrs.navContainerStyle ? ` style="${attrs.navContainerStyle}"` : ''}>
                        <nav aria-label="${attrs.navAriaLabel}"${navClasses ? ` class="${navClasses}"` : ''}${navStyle ? ` style="${navStyle}"` : ''}>
                            <button${attrs.navToggleClass ? ` class="${attrs.navToggleClass}"` : ''} aria-expanded="false" aria-controls="${uniqueId}" aria-label="Toggle navigation">
                                <span class="hamburger-icon">${attrs.navToggleIcon}</span>
                            </button>
                            <ul class="nav-links" id="${uniqueId}" style="display: none;">
                                ${attrs.nav?.map(link => `
                                    <li><a href="${link.href || '#'}"${link.href ? '' : ' aria-disabled="true"'}>${link.text || 'Link'}</a></li>
                                `).join('') || ''}
                            </ul>
                        </nav>
                    </div>
                `;

                // Setup toggle event; use class-based toggling for better CSS control and performance.
                const toggle = this.querySelector('button[aria-controls]');
                const menu = this.querySelector('.nav-links');
                if (toggle && menu) {
                    toggle.addEventListener('click', () => {
                        const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
                        toggle.setAttribute('aria-expanded', String(!isExpanded));
                        menu.classList.toggle('is-open', !isExpanded); // Prefer class toggle over inline style for CSSOM efficiency.
                        log('Toggled navigation', { isExpanded: !isExpanded });
                    }, { once: false, passive: true }); // Passive for scroll performance.
                }

                log('Render complete');
            }

            connectedCallback() {
                log('Connected to DOM');
                this.#render();
            }

            attributeChangedCallback() {
                log('Attribute changed');
                if (this.isConnected) this.#render();
            }
        }

        // Define custom element only if not registered, per spec.
        if (!customElements.get('custom-nav')) {
            customElements.define('custom-nav', CustomNav);
            log('Defined custom-nav');
        }

        // Upgrade existing elements if any.
        document.querySelectorAll('custom-nav:not([defined])').forEach(el => {
            customElements.upgrade(el);
            el.setAttribute('defined', '');
            log('Upgraded existing custom-nav');
        });
    } catch (err) {
        error('Initialization failed', { error: err.message });
    }
})();
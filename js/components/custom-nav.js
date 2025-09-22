(async () => {
    // Check if debug mode is enabled by looking for '/dev/' in the URL or '?debug=true' in the query parameters.
    // This allows for conditional logging without affecting production performance.
    const isDev = window.location.href.includes('/dev/') ||
      new URLSearchParams(window.location.search).get('debug') === 'true';

    // Define a logging function that only outputs in debug mode.
    // Uses console.groupCollapsed for organized, collapsible output with color styling.
    // Includes a timestamp, message, optional data, and a stack trace for debugging.
    const log = (message, data = null) => {
        if (isDev) {
            console.groupCollapsed(`%c[CustomNav] ${new Date().toLocaleTimeString()} ${message}`, 'color: #2196F3; font-weight: bold;');
            if (data) {
                console.log('%cData:', 'color: #4CAF50;', data);
            }
            console.trace();
            console.groupEnd();
        }
    };

    // Define a warning logging function similar to log, but with yellow styling and a warning emoji.
    // Used for non-critical issues like invalid attributes.
    const warn = (message, data = null) => {
        if (isDev) {
            console.groupCollapsed(`%c[CustomNav] ⚠️ ${new Date().toLocaleTimeString()} ${message}`, 'color: #FF9800; font-weight: bold;');
            if (data) {
                console.log('%cData:', 'color: #4CAF50;', data);
            }
            console.trace();
            console.groupEnd();
        }
    };

    // Define an error logging function with red styling and an error emoji.
    // Used for critical failures like import errors.
    const error = (message, data = null) => {
        if (isDev) {
            console.groupCollapsed(`%c[CustomNav] ❌ ${new Date().toLocaleTimeString()} ${message}`, 'color: #F44336; font-weight: bold;');
            if (data) {
                console.log('%cData:', 'color: #4CAF50;', data);
            }
            console.trace();
            console.groupEnd();
        }
    };

    try {
        // Asynchronously import required dependencies.
        // BACKDROP_FILTER_MAP from custom-block.js for handling backdrop filter effects.
        // VALID_ALIGNMENTS and VALID_ALIGN_MAP from shared.js for validation and mapping of alignment attributes.
        const { BACKDROP_FILTER_MAP } = await import('./custom-block.js');
        const { VALID_ALIGNMENTS, VALID_ALIGN_MAP } = await import('../shared.js');
        log('Successfully imported BACKDROP_FILTER_MAP and VALID_ALIGN_MAP');

        // Define the CustomNav web component class.
        // Extends HTMLElement to create a custom element for navigation menus.
        class CustomNav extends HTMLElement {
            // Specify attributes to observe for changes.
            // When any of these change, attributeChangedCallback is triggered.
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

            // Collect and validate all observed attributes.
            // Returns an object with sanitized and defaulted attribute values.
            getAttributes() {
                log('Parsing attributes');
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

                if (!VALID_ALIGNMENTS.includes(attrs.navPosition)) {
                    warn(`Invalid nav-position "${attrs.navPosition}". Must be one of ${VALID_ALIGNMENTS.join(', ')}. Ignoring.`);
                    attrs.navPosition = '';
                }
                log('Attributes parsed successfully', attrs);
                return attrs;
            }

            // Render the navigation HTML based on attributes.
            // Constructs the container, nav element, toggle button, and link list.
            // Attaches click event for toggling mobile menu.
            render() {
                log('Starting render');
                const attrs = this.getAttributes();
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
                log('Inner HTML set', { innerHTMLPreview: this.innerHTML.substring(0, 200) + '...' });

                // Set up toggle functionality for mobile/responsive views
                const hamburger = this.querySelector('button[aria-controls="nav-menu"]');
                const navMenu = this.querySelector('#nav-menu');
                if (hamburger && navMenu) {
                    hamburger.addEventListener('click', () => {
                        const isExpanded = hamburger.getAttribute('aria-expanded') === 'true';
                        hamburger.setAttribute('aria-expanded', !isExpanded);
                        navMenu.style.display = isExpanded ? 'none' : 'block';
                        log('Toggle navigation clicked', { isExpanded: !isExpanded });
                    });
                }
                log('Render complete');
            }

            // Render the component when it's added to the DOM
            connectedCallback() {
                log('Connected to DOM');
                this.render();
            }

            // Re-render the component when an observed attribute changes
            attributeChangedCallback() {
                log('Attribute changed');
                if (this.isConnected) {
                    this.render();
                }
            }
        }
        // Define the custom element if not already defined
        if (!customElements.get('custom-nav')) {
            customElements.define('custom-nav', CustomNav);
            log('CustomNav defined successfully');
        }
        // Upgrade any existing custom-nav elements in the document
        document.querySelectorAll('custom-nav').forEach(element => {
            customElements.upgrade(element);
            log('Upgraded existing custom-nav element');
        });
    } catch (err) {
        error('Failed to import BACKDROP_FILTER_MAP or define CustomNav', { error: err.message });
    }
})();
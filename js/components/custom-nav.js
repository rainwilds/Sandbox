/* global HTMLElement, document, window, matchMedia, console */
import { VALID_ALIGNMENTS, alignMap } from '../shared.js';

console.log('Successfully imported VALID_ALIGNMENTS and alignMap');

class CustomNav extends HTMLElement {
    constructor() {
        super();
        this.isInitialized = false;
        CustomNav.#instances.add(this);
    }

    // Static properties for shared listeners
    static #instances = new WeakSet();
    static #toggleListener = (event) => {
        const button = event.target.closest('button[aria-controls="nav-menu"]');
        if (!button) return;
        const nav = button.closest('custom-nav') || Array.from(CustomNav.#instances).find(el => el.contains(button));
        if (nav instanceof CustomNav) {
            nav.toggleMenu(button);
        }
    };

    static #mediaQuery = matchMedia('(max-width: 768px)');
    static #mediaQueryListener = () => {
        CustomNav.#instances.forEach(instance => {
            if (instance.isInitialized) {
                instance.updateOrientation();
            }
        });
    };

    static {
        document.addEventListener('click', CustomNav.#toggleListener);
        CustomNav.#mediaQuery.addEventListener('change', CustomNav.#mediaQueryListener);
    }

    connectedCallback() {
        if (!this.isInitialized) {
            this.initialize();
        }
    }

    disconnectedCallback() {
        CustomNav.#instances.delete(this);
    }

    initialize() {
        if (this.isInitialized) return;
        console.log('** CustomNav start...', this.outerHTML);
        this.isInitialized = true;
        try {
            const navElement = this.render();
            if (navElement) {
                this.replaceWith(navElement);
            } else {
                console.error('Failed to render CustomNav: navElement is null.', this.outerHTML);
                this.replaceWith(this.render(true));
            }
        } catch (error) {
            console.error('Error initializing CustomNav:', error, this.outerHTML);
            this.replaceWith(this.render(true));
        }
        console.log('** CustomNav end...');
    }

    toggleMenu(button) {
        const menu = this.querySelector('#nav-menu');
        if (!menu) return;
        const isExpanded = button.getAttribute('aria-expanded') === 'true';
        button.setAttribute('aria-expanded', !isExpanded);
        menu.style.display = isExpanded ? 'none' : 'block';
        console.log('Toggled menu:', { isExpanded: !isExpanded });
    }

    updateOrientation() {
        const isMobile = CustomNav.#mediaQuery.matches;
        const attrs = this.getAttributes();
        const nav = this.querySelector('nav');
        if (nav) {
            nav.className = isMobile ? 'nav-vertical' : `nav-${attrs.orientation}`;
            console.log('Updated orientation:', { isMobile, orientation: attrs.orientation });
        }
    }

    getAttributes() {
        const navData = this.getAttribute('nav') || '[]';
        let links;
        try {
            links = JSON.parse(navData);
        } catch (error) {
            console.error(`Invalid nav JSON in <custom-nav>: ${navData}`, error);
            links = [];
        }

        const position = this.getAttribute('nav-position') || 'center';
        if (!VALID_ALIGNMENTS.includes(position)) {
            console.warn(`Invalid nav-position "${position}" in <custom-nav>. Must be one of ${VALID_ALIGNMENTS.join(', ')}. Using default 'center'.`);
        }

        const orientation = this.getAttribute('nav-orientation') || 'horizontal';
        const validOrientations = ['horizontal', 'vertical'];
        if (!validOrientations.includes(orientation)) {
            console.warn(`Invalid nav-orientation "${orientation}" in <custom-nav>. Must be one of ${validOrientations.join(', ')}. Using default 'horizontal'.`);
        }

        const containerStyle = this.getAttribute('nav-container-style') || '';
        let sanitizedContainerStyle = '';
        if (containerStyle) {
            const allowedStyles = ['display', 'justify-content', 'align-items', 'height', 'width', 'padding', 'margin'];
            const styleParts = containerStyle.split(';').map(s => s.trim()).filter(s => s);
            sanitizedContainerStyle = styleParts.filter(part => {
                const [property] = part.split(':').map(s => s.trim());
                return allowedStyles.includes(property);
            }).join('; ');
            if (sanitizedContainerStyle !== containerStyle) {
                console.warn(`Invalid nav-container-style "${containerStyle}" in <custom-nav>. Using sanitized: "${sanitizedContainerStyle}".`);
            }
        }

        let toggleIcon = this.getAttribute('nav-toggle-icon') || '';
        if (toggleIcon) {
            toggleIcon = toggleIcon.replace(/['"]/g, '&quot;');
            const parser = new DOMParser();
            const decodedIcon = toggleIcon.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
            const doc = parser.parseFromString(decodedIcon, 'text/html');
            const iElement = doc.body.querySelector('i');
            if (!iElement || !iElement.className.includes('fa-')) {
                console.warn(`Invalid nav-toggle-icon in <custom-nav>. Must be a valid Font Awesome <i> tag. Using default.`);
                toggleIcon = '<i class="fa-chisel fa-regular fa-bars"></i>';
            } else {
                const validClasses = iElement.className.split(' ').filter(cls => cls.startsWith('fa-') || cls === 'fa-chisel');
                toggleIcon = `<i class="${validClasses.join(' ')}"></i>`;
            }
        } else {
            toggleIcon = '<i class="fa-chisel fa-regular fa-bars"></i>';
        }

        return {
            links,
            position: VALID_ALIGNMENTS.includes(position) ? position : 'center',
            orientation: validOrientations.includes(orientation) ? orientation : 'horizontal',
            style: this.getAttribute('nav-style') || '',
            containerStyle: sanitizedContainerStyle,
            toggleIcon,
            ariaLabel: this.getAttribute('nav-aria-label') || 'Navigation'
        };
    }

    render(isFallback = false) {
        const attrs = isFallback ? {
            links: [],
            position: 'center',
            orientation: 'horizontal',
            style: '',
            containerStyle: '',
            toggleIcon: '<i class="fa-chisel fa-regular fa-bars"></i>',
            ariaLabel: 'Navigation'
        } : this.getAttributes();

        // Create DocumentFragment for efficient DOM construction
        const fragment = document.createDocumentFragment();
        const containerDiv = document.createElement('div');
        containerDiv.className = `place-self-${attrs.position}`;
        if (attrs.containerStyle) containerDiv.setAttribute('style', attrs.containerStyle);
        fragment.appendChild(containerDiv);

        const navElement = document.createElement('nav');
        navElement.setAttribute('aria-label', attrs.ariaLabel);
        navElement.className = CustomNav.#mediaQuery.matches ? 'nav-vertical' : `nav-${attrs.orientation}`;
        if (attrs.style) navElement.setAttribute('style', attrs.style);
        containerDiv.appendChild(navElement);

        const toggleButton = document.createElement('button');
        toggleButton.setAttribute('aria-expanded', 'false');
        toggleButton.setAttribute('aria-controls', 'nav-menu');
        toggleButton.setAttribute('aria-label', 'Toggle navigation');
        const iconSpan = document.createElement('span');
        iconSpan.className = 'hamburger-icon';
        iconSpan.innerHTML = attrs.toggleIcon;
        toggleButton.appendChild(iconSpan);
        navElement.appendChild(toggleButton);

        const ulElement = document.createElement('ul');
        ulElement.className = 'nav-links';
        ulElement.id = 'nav-menu';
        navElement.appendChild(ulElement);

        if (attrs.links.length) {
            attrs.links.forEach(link => {
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.href = link.href || '#';
                a.textContent = link.text || '';
                li.appendChild(a);
                ulElement.appendChild(li);
            });
        } else if (isFallback) {
            const li = document.createElement('li');
            li.textContent = 'No navigation links provided';
            ulElement.appendChild(li);
        }

        return containerDiv;
    }

    static get observedAttributes() {
        return [
            'nav',
            'nav-position',
            'nav-orientation',
            'nav-style',
            'nav-container-style',
            'nav-toggle-icon',
            'nav-aria-label'
        ];
    }

    attributeChangedCallback() {
        if (this.isInitialized) {
            this.initialize();
        }
    }
}

try {
    if (!customElements.get('custom-nav')) {
        customElements.define('custom-nav', CustomNav);
        console.log('CustomNav defined successfully');
    }
    document.querySelectorAll('custom-nav').forEach(element => {
        customElements.upgrade(element);
    });
} catch (error) {
    console.error('Error defining CustomNav element:', error);
}
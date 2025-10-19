/* global HTMLElement, IntersectionObserver, document, window, JSON, console */
import { BACKDROP_FILTER_MAP, VALID_ALIGNMENTS, VALID_ALIGN_MAP } from '../shared.js';
import { getConfig } from '../config.js';

class CustomNav extends HTMLElement {
    #renderCacheHTML = null;
    #lastCriticalHash = null;
    #cachedAttributes = null;
    #criticalAttributesHash = null;
    #debug = new URLSearchParams(window.location.search).get('debug') === 'true';
    #ignoredChangeCount = 0;
    #useGlobalNav = false;
    #navType = null;

    constructor() {
        super();
        this.isVisible = false;
        this.isInitialized = false;
        this.callbacks = [];
        CustomNav.#observer.observe(this);
        CustomNav.#observedInstances.add(this);
        this.#useGlobalNav = !this.hasAttribute('nav');
        this.#navType = this.getAttribute('nav-type')?.toLowerCase() || 'header';
        if (this.#useGlobalNav) {
            const eventName = `${this.#navType}-navigation-updated`;
            document.addEventListener(eventName, () => {
                this.#cachedAttributes = null;
                this.#criticalAttributesHash = null;
                if (this.isInitialized && this.isVisible) {
                    this.render();
                }
            });
        }
    }

    static #observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const instance = entry.target;
                if (instance instanceof CustomNav) {
                    instance.isVisible = true;
                    CustomNav.#observer.unobserve(instance);
                    CustomNav.#observedInstances.delete(instance);
                    instance.initialize();
                }
            }
        });
    }, { rootMargin: '50px' });

    static #observedInstances = new WeakSet();
    static #renderCacheMap = new WeakMap();

    static #criticalAttributes = [
        'nav', 'nav-type',
        'nav-position', 'nav-class', 'nav-style', 'nav-aria-label',
        'nav-toggle-class', 'nav-toggle-icon', 'nav-orientation',
        'nav-container-class', 'nav-container-style', 'nav-background-color',
        'nav-background-image-noise', 'nav-border', 'nav-border-radius',
        'nav-backdrop-filter'
    ];

    #log(message, data = null) {
        if (this.#debug) {
            console.groupCollapsed(`%c[CustomNav] ${message}`, 'color: #2196F3; font-weight: bold;');
            if (data) console.log('%cData:', 'color: #4CAF50;', data);
            console.trace();
            console.groupEnd();
        }
    }

    #warn(message, data = null) {
        if (this.#debug) {
            console.groupCollapsed(`%c[CustomNav] ⚠️ ${message}`, 'color: #FF9800; font-weight: bold;');
            if (data) console.log('%cData:', 'color: #4CAF50;', data);
            console.trace();
            console.groupEnd();
        }
    }

    #error(message, data = null) {
        if (this.#debug) {
            console.groupCollapsed(`%c[CustomNav] ❌ ${message}`, 'color: #F44336; font-weight: bold;');
            if (data) console.log('%cData:', 'color: #4CAF50;', data);
            console.trace();
            console.groupEnd();
        }
    }

    #sanitizeClass(classString) {
        return classString.split(/\s+/).filter(cls => /^[a-zA-Z0-9\-_]+$/.test(cls)).join(' ');
    }

    #sanitizeStyle(styleString, allowedProperties) {
        const styleParts = styleString.split(';').map(s => s.trim()).filter(s => s);
        return styleParts.filter(part => {
            const [property] = part.split(':').map(s => s.trim());
            return allowedProperties.includes(property);
        }).join('; ');
    }

    #escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    #sanitizeHref(href) {
        try {
            return new URL(href, window.location.origin).href;
        } catch {
            this.#warn('Invalid href sanitized to #', { href });
            return '#';
        }
    }

    #validateIcon(iconString) {
        if (!iconString) return '';
        const sanitized = iconString.replace(/['"]/g, '&quot;').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
        const parser = new DOMParser();
        const doc = parser.parseFromString(sanitized, 'text/html');
        const iElement = doc.body.querySelector('i');
        if (!iElement || !iElement.className.includes('fa-')) {
            this.#warn('Invalid icon format', { value: iconString, expected: 'Font Awesome <i> tag with fa- classes' });
            return '';
        }
        const validClasses = iElement.className.split(' ').filter(cls => cls.startsWith('fa-') || cls === 'fa-chisel');
        if (validClasses.length === 0) {
            this.#warn('No valid Font Awesome classes in icon', { classes: iElement.className });
            return '';
        }
        return `<i class="${validClasses.join(' ')}"></i>`;
    }

    async getAttributes() {
        if (this.#cachedAttributes) {
            this.#log('Using cached attributes', { elementId: this.id || 'no-id' });
            return this.#cachedAttributes;
        }
        this.#log('Parsing new attributes', { elementId: this.id || 'no-id', outerHTML: this.outerHTML.substring(0, 200) + '...' });

        const attrs = {};
        const navAttr = this.getAttribute('nav') || '';

        if (this.#useGlobalNav) {
            try {
                const config = await getConfig();
                const navKey = this.#navType === 'footer' ? 'footerNavigation' : 'headerNavigation';
                attrs.nav = config[navKey] || [];
                attrs.nav = attrs.nav.map(link => ({
                    href: this.#sanitizeHref(link.href),
                    text: this.#escapeHtml(link.text || 'Link')
                }));
                this.#log(`Nav loaded from global config (${navKey})`, { count: attrs.nav.length });
            } catch (e) {
                this.#warn('Failed to load global nav from config', { error: e.message });
                attrs.nav = [];
            }
        } else if (navAttr) {
            try {
                const normalized = navAttr.replace(/\s+/g, ' ').trim();
                attrs.nav = JSON.parse(normalized);
                if (!Array.isArray(attrs.nav)) throw new Error('nav must be an array');
                attrs.nav = attrs.nav.map(link => ({
                    href: this.#sanitizeHref(link.href),
                    text: this.#escapeHtml(link.text || 'Link')
                }));
                this.#log('Nav parsed and sanitized', { count: attrs.nav.length });
            } catch (e) {
                this.#warn('Failed to parse nav JSON', { error: e.message, navAttr });
                attrs.nav = [];
            }
        } else {
            this.#warn('No nav attribute or global config provided');
            attrs.nav = [];
        }

        attrs.navPosition = this.getAttribute('nav-position') || '';
        if (attrs.navPosition && !VALID_ALIGNMENTS.includes(attrs.navPosition)) {
            this.#warn('Invalid nav-position', { value: attrs.navPosition, valid: VALID_ALIGNMENTS });
            attrs.navPosition = '';
        }

        attrs.navOrientation = this.getAttribute('nav-orientation') || 'horizontal';
        const validOrientations = ['horizontal', 'vertical'];
        if (!validOrientations.includes(attrs.navOrientation)) {
            this.#warn('Invalid nav-orientation', { value: attrs.navOrientation, valid: validOrientations });
            attrs.navOrientation = 'horizontal';
        }

        attrs.navClass = this.#sanitizeClass(this.getAttribute('nav-class') || '');
        attrs.navStyle = this.#sanitizeStyle(this.getAttribute('nav-style') || '', [
            'color', 'background-color', 'border', 'border-radius', 'padding', 'margin',
            'font-size', 'font-weight', 'text-align', 'display', 'width', 'height', 'position'
        ]);
        attrs.navAriaLabel = this.#escapeHtml(this.getAttribute('nav-aria-label') || 'Main navigation');
        attrs.navToggleClass = this.#sanitizeClass(this.getAttribute('nav-toggle-class') || '');
        attrs.navToggleIcon = this.#validateIcon(this.getAttribute('nav-toggle-icon') || '<i class="fa-solid fa-bars"></i>');
        attrs.navContainerClass = this.#sanitizeClass(this.getAttribute('nav-container-class') || '');
        attrs.navContainerStyle = this.#sanitizeStyle(this.getAttribute('nav-container-style') || '', [
            'display', 'justify-content', 'align-items', 'padding', 'margin', 'width', 'height'
        ]);
        attrs.navBackgroundColor = this.getAttribute('nav-background-color') || '';
        if (attrs.navBackgroundColor && !/^#[0-9A-Fa-f]{3,8}$|^rgb/.test(attrs.navBackgroundColor)) {
            this.#warn('Invalid nav-background-color', { value: attrs.navBackgroundColor });
            attrs.navBackgroundColor = '';
        }
        attrs.navBackgroundImageNoise = this.hasAttribute('nav-background-image-noise');
        attrs.navBorder = this.#sanitizeClass(this.getAttribute('nav-border') || '');
        attrs.navBorderRadius = this.#sanitizeClass(this.getAttribute('nav-border-radius') || '');
        attrs.navBackdropFilterClasses = this.getAttribute('nav-backdrop-filter')?.split(/\s+/).filter(cls => cls) || [];

        const criticalAttrs = {};
        CustomNav.#criticalAttributes.forEach(attr => {
            criticalAttrs[attr] = this.getAttribute(attr) || '';
        });
        this.#criticalAttributesHash = JSON.stringify(criticalAttrs);

        const validTypes = ['header', 'footer'];
        if (this.#navType && !validTypes.includes(this.#navType)) {
            this.#warn('Invalid nav-type', { value: this.#navType, valid: validTypes });
            this.#navType = 'header';
        }

        this.#cachedAttributes = attrs;
        this.#log('Attributes parsed successfully', { elementId: this.id || 'no-id', criticalHashLength: this.#criticalAttributesHash.length });
        return attrs;
    }

    async initialize() {
        if (this.isInitialized || !this.isVisible) {
            this.#log('Skipping initialization', { isInitialized: this.isInitialized, isVisible: this.isVisible, elementId: this.id || 'no-id' });
            return;
        }
        this.#log('Starting initialization', { elementId: this.id || 'no-id', outerHTML: this.outerHTML });
        this.isInitialized = true;
        try {
            await this.render();
            this.callbacks.forEach(callback => callback());
            this.#log('Initialization completed successfully', { elementId: this.id || 'no-id', childCount: this.childElementCount });
        } catch (error) {
            this.#error('Initialization failed', { error: error.message, stack: error.stack, elementId: this.id || 'no-id', outerHTML: this.outerHTML.substring(0, 200) });
            await this.render(true);
        }
    }

    connectedCallback() {
        this.#log('Connected to DOM', { elementId: this.id || 'no-id' });
        if (this.isVisible) {
            this.initialize();
        }
    }

    disconnectedCallback() {
        this.#log('Disconnected from DOM', { elementId: this.id || 'no-id' });
        if (CustomNav.#observedInstances.has(this)) {
            CustomNav.#observer.unobserve(this);
            CustomNav.#observedInstances.delete(this);
        }
        this.callbacks = [];
        this.#renderCacheHTML = null;
        this.#cachedAttributes = null;
        this.#criticalAttributesHash = null;
        CustomNav.#renderCacheMap.delete(this);
    }

    addCallback(callback) {
        this.#log('Callback added', { callbackName: callback.name || 'anonymous', elementId: this.id || 'no-id' });
        this.callbacks.push(callback);
    }

    async render(isFallback = false) {
        this.#log(`Starting render ${isFallback ? '(fallback)' : ''}`, { elementId: this.id || 'no-id' });
        let newCriticalHash;
        if (!isFallback) {
            const criticalAttrs = {};
            CustomNav.#criticalAttributes.forEach(attr => {
                criticalAttrs[attr] = this.getAttribute(attr) || '';
            });
            newCriticalHash = JSON.stringify(criticalAttrs);
            if (CustomNav.#renderCacheMap.has(this) && this.#criticalAttributesHash === newCriticalHash) {
                this.#log('Using cached render HTML', { elementId: this.id || 'no-id' });
                this.innerHTML = CustomNav.#renderCacheMap.get(this);
                this.#attachToggleListener();
                return this;
            }
        }

        const attrs = isFallback ? {
            nav: [],
            navPosition: '',
            navClass: '',
            navStyle: '',
            navAriaLabel: 'Main navigation',
            navToggleClass: '',
            navToggleIcon: '<i class="fa-solid fa-bars"></i>',
            navOrientation: 'horizontal',
            navContainerClass: '',
            navContainerStyle: '',
            navBackgroundColor: '',
            navBackgroundImageNoise: false,
            navBorder: '',
            navBorderRadius: '',
            navBackdropFilterClasses: []
        } : await this.getAttributes();

        this.#log('Render attributes prepared', { elementId: this.id || 'no-id', isFallback, navCount: attrs.nav.length });

        const uniqueId = `nav-menu-${Math.random().toString(36).slice(2, 11)}`;
        const containerHTML = [];
        const alignClass = attrs.navPosition ? VALID_ALIGN_MAP[attrs.navPosition] : '';
        const containerClasses = [alignClass, attrs.navContainerClass].filter(cls => cls).join(' ').trim();
        const containerStyleAttr = attrs.navContainerStyle ? ` style="${attrs.navContainerStyle}"` : '';
        containerHTML.push(`<div class="${containerClasses}"${containerStyleAttr}>`);

        const navClasses = [
            attrs.navClass,
            `nav-${attrs.navOrientation}`,
            attrs.navBackgroundImageNoise ? 'background-image-noise' : '',
            attrs.navBorder,
            attrs.navBorderRadius,
            ...attrs.navBackdropFilterClasses.filter(cls => !cls.startsWith('backdrop-filter'))
        ].filter(cls => cls).join(' ').trim();
        const navClassAttr = navClasses ? ` class="${navClasses}"` : '';

        const backdropFilterValues = attrs.navBackdropFilterClasses
            .filter(cls => cls.startsWith('backdrop-filter'))
            .map(cls => BACKDROP_FILTER_MAP[cls] || '')
            .filter(val => val)
            .join(' ');

        const navStyles = [
            attrs.navStyle,
            backdropFilterValues ? `backdrop-filter: ${backdropFilterValues}` : '',
            attrs.navBackgroundColor ? `background-color: ${attrs.navBackgroundColor}` : ''
        ].filter(s => s).join('; ').trim();
        const navStyleAttr = navStyles ? ` style="${navStyles}"` : '';

        containerHTML.push(`<nav aria-label="${attrs.navAriaLabel}"${navClassAttr}${navStyleAttr}>`);

        const toggleClassAttr = attrs.navToggleClass ? ` class="${attrs.navToggleClass}"` : '';
        containerHTML.push(`<button${toggleClassAttr} aria-expanded="false" aria-controls="${uniqueId}" aria-label="Toggle navigation">`);
        containerHTML.push('<span class="hamburger-icon">');
        containerHTML.push(attrs.navToggleIcon);
        containerHTML.push('</span></button>');

        containerHTML.push(`<ul class="nav-links" id="${uniqueId}">`);
        if (attrs.nav.length === 0 && !isFallback) {
            this.#warn('No navigation links, adding placeholder');
            containerHTML.push('<li>No navigation links provided</li>');
        } else {
            attrs.nav.forEach(link => {
                const disabledAttr = link.href === '#' ? ' aria-disabled="true"' : '';
                containerHTML.push(`<li><a href="${link.href}"${disabledAttr}>${link.text}</a></li>`);
            });
        }
        containerHTML.push('</ul></nav></div>');

        const fullHTML = containerHTML.join('');
        this.innerHTML = fullHTML;
        this.#attachToggleListener();

        if (!isFallback) {
            CustomNav.#renderCacheMap.set(this, fullHTML);
            this.#lastCriticalHash = newCriticalHash;
        }

        this.#log('Render completed', { elementId: this.id || 'no-id', html: this.innerHTML.substring(0, 200) });
        return this;
    }

    #attachToggleListener() {
        const toggleButton = this.querySelector('button[aria-controls]');
        const ul = this.querySelector('ul.nav-links');
        if (toggleButton && ul) {
            toggleButton.addEventListener('click', () => {
                const isExpanded = toggleButton.getAttribute('aria-expanded') === 'true';
                toggleButton.setAttribute('aria-expanded', !isExpanded);
                ul.style.display = isExpanded ? 'none' : 'block';
                this.#log('Navigation toggled', { isExpanded: !isExpanded, elementId: this.id || 'no-id' });
            });
        } else {
            this.#warn('Toggle button or menu not found after rendering');
        }
    }

    static get observedAttributes() {
        return CustomNav.#criticalAttributes;
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (!this.isInitialized || !this.isVisible) {
            this.#ignoredChangeCount++;
            if (this.#debug && this.#ignoredChangeCount % 10 === 0) {
                this.#log('Attribute changes ignored (not ready - batched)', { count: this.#ignoredChangeCount, name, oldValue, newValue });
            }
            return;
        }
        this.#log('Attribute changed', { name, oldValue, newValue, elementId: this.id || 'no-id' });
        if (CustomNav.#criticalAttributes.includes(name)) {
            this.#cachedAttributes = null;
            if (name === 'nav-type') {
                this.#navType = newValue?.toLowerCase() || 'header';
                this.#useGlobalNav = !this.hasAttribute('nav');
            }
            this.initialize();
        }
    }
}

try {
    customElements.define('custom-nav', CustomNav);
} catch (error) {
    console.error('Error defining CustomNav element:', error);
}
console.log('CustomNav version: 2025-10-10');
export { CustomNav };
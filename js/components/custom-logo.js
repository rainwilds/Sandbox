/* global HTMLElement, IntersectionObserver, document, window, JSON, console */
import { generatePictureMarkup } from '../generators/image-generator.js';
import { VALID_ALIGNMENTS, VALID_ALIGN_MAP } from '../shared.js';
import { getConfig } from '../config.js';

class CustomLogo extends HTMLElement {
    #ignoredChangeCount;
    #basePath = null;
    constructor() {
        super();
        this.isVisible = false;
        this.isInitialized = false;
        this.callbacks = [];
        this.renderCache = null;
        this.lastAttributes = null;
        this.cachedAttributes = null;
        this.criticalAttributesHash = null;
        this.debug = window.location.href.includes('/dev/') || new URLSearchParams(window.location.search).get('debug') === 'true';
        this.#ignoredChangeCount = 0;
        CustomLogo.#observer.observe(this);
        CustomLogo.#observedInstances.add(this);
    }
    static #observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const instance = entry.target;
                if (instance instanceof CustomLogo) {
                    instance.isVisible = true;
                    CustomLogo.#observer.unobserve(instance);
                    CustomLogo.#observedInstances.delete(instance);
                    instance.initialize();
                }
            }
        });
    }, { rootMargin: '50px' });
    static #observedInstances = new WeakSet();
    static #renderCacheMap = new WeakMap();
    static #criticalAttributes = [
        'logo-full-primary-src', 'logo-full-light-src', 'logo-full-dark-src',
        'logo-full-primary-alt', 'logo-full-light-alt', 'logo-full-dark-alt',
        'logo-full-position', 'logo-icon-primary-src', 'logo-icon-light-src',
        'logo-icon-dark-src', 'logo-icon-primary-alt', 'logo-icon-light-alt',
        'logo-icon-dark-alt', 'logo-icon-position', 'logo-breakpoint', 'logo-height'
    ];
    #log(message, data = null) {
        if (this.debug) {
            console.groupCollapsed(`%c[CustomLogo] ${message}`, 'color: #2196F3; font-weight: bold;');
            if (data) console.log('%cData:', 'color: #4CAF50;', data);
            console.trace();
            console.groupEnd();
        }
    }
    #warn(message, data = null) {
        if (this.debug) {
            console.groupCollapsed(`%c[CustomLogo] ⚠️ ${message}`, 'color: #FF9800; font-weight: bold;');
            if (data) console.log('%cData:', 'color: #4CAF50;', data);
            console.trace();
            console.groupEnd();
        }
    }
    #error(message, data = null) {
        if (this.debug) {
            console.groupCollapsed(`%c[CustomLogo] ❌ ${message}`, 'color: #F44336; font-weight: bold;');
            if (data) console.log('%cData:', 'color: #4CAF50;', data);
            console.trace();
            console.groupEnd();
        }
    }
    async #getBasePath() {
        if (!this.#basePath) {
            const config = await getConfig();
            this.#basePath = config.general?.basePath || '/';
            this.#log('Base path fetched', { basePath: this.#basePath });
        }
        return this.#basePath;
    }
    async validateSrc(url) {
        if (!url || this.debug) {
            this.#log('Skipping validation', { url, reason: this.debug ? 'Debug mode' : 'Empty URL' });
            return true;
        }
        try {
            const fullSrc = window.location.origin + (url.startsWith('/') ? url : '/' + url);
            this.#log(`Validating source URL: ${fullSrc}`, { originalUrl: url, elementId: this.id || 'no-id' });
            const res = await fetch(fullSrc, { method: 'HEAD', mode: 'cors' });
            if (!res.ok) throw new Error(`Failed to validate ${url}: ${res.status} ${res.statusText}`);
            this.#log(`Source validation successful: ${fullSrc}`, { status: res.status });
            return true;
        } catch (error) {
            this.#warn(`Source validation failed: ${error.message}`, { url, elementId: this.id || 'no-id' });
            return false;
        }
    }
    async getAttributes() {
        if (this.cachedAttributes) {
            this.#log('Using cached attributes', { elementId: this.id || 'no-id' });
            return this.cachedAttributes;
        }
        this.#log('Parsing new attributes', { elementId: this.id || 'no-id', outerHTML: this.outerHTML.substring(0, 200) + '...' });
        const resolvePath = async (path) => {
            if (!path) return '';
            if (path.startsWith('http')) return path;
            const base = await this.#getBasePath();
            const relative = path.startsWith('/') ? path.slice(1) : path;
            return new URL(relative, window.location.origin + base).pathname;
        };
        const attrs = {
            fullPrimarySrc: await resolvePath(this.getAttribute('logo-full-primary-src') || ''),
            fullLightSrc: await resolvePath(this.getAttribute('logo-full-light-src') || ''),
            fullDarkSrc: await resolvePath(this.getAttribute('logo-full-dark-src') || ''),
            fullPrimaryAlt: this.getAttribute('logo-full-primary-alt') || '',
            fullLightAlt: this.getAttribute('logo-full-light-alt') || '',
            fullDarkAlt: this.getAttribute('logo-full-dark-alt') || '',
            fullPosition: this.getAttribute('logo-full-position') || '',
            iconPrimarySrc: await resolvePath(this.getAttribute('logo-icon-primary-src') || ''),
            iconLightSrc: await resolvePath(this.getAttribute('logo-icon-light-src') || ''),
            iconDarkSrc: await resolvePath(this.getAttribute('logo-icon-dark-src') || ''),
            iconPrimaryAlt: this.getAttribute('logo-icon-primary-alt') || '',
            iconLightAlt: this.getAttribute('logo-icon-light-alt') || '',
            iconDarkAlt: this.getAttribute('logo-icon-dark-alt') || '',
            iconPosition: this.getAttribute('logo-icon-position') || '',
            breakpoint: this.getAttribute('logo-breakpoint') || '',
            height: this.getAttribute('logo-height') || ''
        };
        const hasFullSource = attrs.fullPrimarySrc || (attrs.fullLightSrc && attrs.fullDarkSrc);
        const hasIconSource = attrs.iconPrimarySrc || (attrs.iconLightSrc && attrs.iconDarkSrc);
        if (!hasFullSource && !hasIconSource) {
            this.#error('At least one valid logo source (full or icon) must be provided.');
        }
        const validatePair = (light, dark, label) => {
            if ((light || dark) && !(light && dark)) {
                this.#error(`Both ${label}-light-src and ${label}-dark-src must be provided if one is specified.`);
                return false;
            }
            return true;
        };
        validatePair(attrs.fullLightSrc, attrs.fullDarkSrc, 'logo-full');
        validatePair(attrs.iconLightSrc, attrs.iconDarkSrc, 'logo-icon');
        attrs.isDecorative = !attrs.fullPrimaryAlt && !attrs.fullLightAlt && !attrs.fullDarkAlt &&
                             !attrs.iconPrimaryAlt && !attrs.iconLightAlt && !attrs.iconDarkAlt;
        if (!attrs.isDecorative) {
            if (attrs.fullPrimarySrc && !attrs.fullPrimaryAlt) this.#error('logo-full-primary-alt is required for accessibility when logo-full-primary-src is provided.');
            if (attrs.iconPrimarySrc && !attrs.iconPrimaryAlt) this.#error('logo-icon-primary-alt is required for accessibility when logo-icon-primary-src is provided.');
            if (attrs.fullLightSrc && attrs.fullDarkSrc && !(attrs.fullLightAlt && attrs.fullDarkAlt)) this.#error('Both logo-full-light-alt and logo-full-dark-alt are required for accessibility.');
            if (attrs.iconLightSrc && attrs.iconDarkSrc && !(attrs.iconLightAlt && attrs.iconDarkAlt)) this.#error('Both logo-icon-light-alt and logo-icon-dark-alt are required for accessibility.');
        }
        if (attrs.height) {
            const validLength = attrs.height.match(/^(\d*\.?\d+)(px|rem|em|vh|vw|%)$/);
            if (!validLength) {
                this.#warn(`Invalid logo-height "${attrs.height}". Ignoring.`);
                attrs.height = '';
            }
        }
        if (attrs.fullPosition && !VALID_ALIGNMENTS.includes(attrs.fullPosition)) {
            this.#warn(`Invalid logo-full-position "${attrs.fullPosition}". Ignoring.`);
            attrs.fullPosition = '';
        }
        if (attrs.iconPosition && !VALID_ALIGNMENTS.includes(attrs.iconPosition)) {
            this.#warn(`Invalid logo-icon-position "${attrs.iconPosition}". Ignoring.`);
            attrs.iconPosition = '';
        }
        const breakpointNum = parseInt(attrs.breakpoint, 10);
        if (attrs.breakpoint && (isNaN(breakpointNum) || breakpointNum <= 0)) {
            this.#warn(`Invalid logo-breakpoint "${attrs.breakpoint}". Must be a positive integer. Ignoring.`);
            attrs.breakpoint = '';
        }
        const criticalAttrs = {};
        CustomLogo.#criticalAttributes.forEach(attr => {
            criticalAttrs[attr] = this.getAttribute(attr) || '';
        });
        this.criticalAttributesHash = JSON.stringify(criticalAttrs);
        this.cachedAttributes = attrs;
        this.#log('Attributes parsed successfully', { attrs });
        return attrs;
    }
    async initialize() {
        if (this.isInitialized || !this.isVisible) {
            this.#log('Skipping initialization', { isInitialized: this.isInitialized, isVisible: this.isVisible });
            return;
        }
        this.#log('Starting initialization');
        this.isInitialized = true;
        try {
            await this.render();
            this.callbacks.forEach(callback => callback());
        } catch (err) {
            this.#error('Initialization failed', { error: err.message });
            this.innerHTML = `
                <div class="logo-container place-self-center">
                    <a href="/"><img src="https://placehold.co/300x40" alt="Error during initialization" loading="lazy"></a>
                </div>
            `;
        }
    }
    async connectedCallback() {
        this.#log('Connected to DOM');
        if (this.isVisible) {
            await this.initialize();
        }
        const prefersDarkQuery = window.matchMedia('(prefers-color-scheme: dark)');
        prefersDarkQuery.addEventListener('change', () => this.#log('Theme change detected (handled by browser)'));
        this._prefersDarkQuery = prefersDarkQuery;
    }
    disconnectedCallback() {
        this.#log('Disconnected from DOM');
        if (CustomLogo.#observedInstances.has(this)) {
            CustomLogo.#observer.unobserve(this);
            CustomLogo.#observedInstances.delete(this);
        }
        this.callbacks = [];
        this.renderCache = null;
        this.cachedAttributes = null;
        this.criticalAttributesHash = null;
        CustomLogo.#renderCacheMap.delete(this);
        if (this._prefersDarkQuery) {
            this._prefersDarkQuery.removeEventListener('change', () => {});
            this._prefersDarkQuery = null;
        }
    }
    addCallback(callback) {
        this.#log('Callback added', { callbackName: callback.name || 'anonymous' });
        this.callbacks.push(callback);
    }
    async render(isFallback = false) {
        this.#log(`Starting render ${isFallback ? '(fallback)' : ''}`);
        let newCriticalAttrsHash;
        if (!isFallback) {
            const criticalAttrs = {};
            CustomLogo.#criticalAttributes.forEach(attr => {
                criticalAttrs[attr] = this.getAttribute(attr) || '';
            });
            newCriticalAttrsHash = JSON.stringify(criticalAttrs);
            if (this.renderCache && this.criticalAttributesHash === newCriticalAttrsHash) {
                this.#log('Using cached render');
                this.innerHTML = this.renderCache;
                return;
            }
        }
        const attrs = isFallback ? {
            fullPrimarySrc: '',
            fullLightSrc: '',
            fullDarkSrc: '',
            fullPrimaryAlt: '',
            fullLightAlt: '',
            fullDarkAlt: '',
            fullPosition: '',
            iconPrimarySrc: '',
            iconLightSrc: '',
            iconDarkSrc: '',
            iconPrimaryAlt: '',
            iconLightAlt: '',
            iconDarkAlt: '',
            iconPosition: '',
            breakpoint: '',
            height: ''
        } : await this.getAttributes();
        const sources = [
            attrs.fullPrimarySrc, attrs.fullLightSrc, attrs.fullDarkSrc,
            attrs.iconPrimarySrc, attrs.iconLightSrc, attrs.iconDarkSrc
        ].filter(Boolean);
        const hasValidSource = sources.length > 0;
        if (!hasValidSource || isFallback) {
            this.#warn('No valid logo sources provided or fallback, rendering placeholder.');
            const markup = `
                <div class="logo-container place-self-center">
                    <a href="/"><img src="https://placehold.co/300x40" alt="No logo sources provided" loading="lazy"></a>
                </div>
            `;
            this.innerHTML = markup;
            if (!isFallback) {
                this.renderCache = markup;
                this.criticalAttributesHash = newCriticalAttrsHash;
            }
            return;
        }
        const validations = await Promise.all(sources.map(src => this.validateSrc(src)));
        if (!validations.every(v => v)) {
            this.#warn('Some sources invalid, rendering placeholder.', { invalid: sources.filter((_, i) => !validations[i]) });
            const markup = `
                <div class="logo-container place-self-center">
                    <a href="/"><img src="https://placehold.co/300x40" alt="Invalid logo sources" loading="lazy"></a>
                </div>
            `;
            this.innerHTML = markup;
            if (!isFallback) {
                this.renderCache = markup;
                this.criticalAttributesHash = newCriticalAttrsHash;
            }
            return;
        }
        let positionClass = attrs.fullPosition ? VALID_ALIGN_MAP[attrs.fullPosition] : 'place-self-center';
        let styleTag = '';
        const hasBreakpoint = attrs.breakpoint && !isNaN(parseInt(attrs.breakpoint));
        if (hasBreakpoint && attrs.iconPosition) {
            styleTag = `
                <style>
                    @media (max-width: ${parseInt(attrs.breakpoint, 10) - 1}px) {
                        .logo-container {
                            place-self: ${VALID_ALIGN_MAP[attrs.iconPosition]} !important;
                        }
                    }
                </style>
            `;
        }
        const hasFull = attrs.fullPrimarySrc || (attrs.fullLightSrc && attrs.fullDarkSrc);
        const hasIcon = attrs.iconPrimarySrc || (attrs.iconLightSrc && attrs.iconDarkSrc);
        let effectiveHasBreakpoint = hasBreakpoint && hasIcon;
        let markup = `<picture>`;
        const addSource = (media, srcset, dataAlt) => {
            const type = 'image/svg+xml';
            markup += `<source${media ? ` media="${media}"` : ''} type="${type}" srcset="${srcset}"${dataAlt ? ` data-alt="${dataAlt}"` : ''}>`;
        };
        let fullSrc = attrs.fullPrimarySrc;
        let fullLightSrc = attrs.fullLightSrc;
        let fullDarkSrc = attrs.fullDarkSrc;
        let fullAlt = attrs.fullPrimaryAlt;
        let fullLightAlt = attrs.fullLightAlt;
        let fullDarkAlt = attrs.fullDarkAlt;
        let iconSrc = attrs.iconPrimarySrc;
        let iconLightSrc = attrs.iconLightSrc;
        let iconDarkSrc = attrs.iconDarkSrc;
        let iconAlt = attrs.iconPrimaryAlt;
        let iconLightAlt = attrs.iconLightAlt;
        let iconDarkAlt = attrs.iconDarkAlt;
        if (effectiveHasBreakpoint) {
            const bpValue = parseInt(attrs.breakpoint, 10);
            const maxSmall = bpValue - 1;
            const minLarge = bpValue;
            // Small screens (icons)
            if (iconLightSrc) addSource(`(max-width: ${maxSmall}px) and (prefers-color-scheme: dark)`, iconLightSrc, iconLightAlt);
            if (iconDarkSrc) addSource(`(max-width: ${maxSmall}px) and (prefers-color-scheme: light)`, iconDarkSrc, iconDarkAlt);
            if (iconSrc) addSource(`(max-width: ${maxSmall}px)`, iconSrc, iconAlt);
            // Large screens (full)
            if (fullLightSrc) addSource(`(min-width: ${minLarge}px) and (prefers-color-scheme: light)`, fullLightSrc, fullLightAlt);
            if (fullDarkSrc) addSource(`(min-width: ${minLarge}px) and (prefers-color-scheme: dark)`, fullDarkSrc, fullDarkAlt);
            if (fullSrc) addSource(`(min-width: ${minLarge}px)`, fullSrc, fullAlt);
        } else {
            // No breakpoint or no icons: use full sources only
            if (fullLightSrc) addSource('(prefers-color-scheme: light)', fullLightSrc, fullLightAlt);
            if (fullDarkSrc) addSource('(prefers-color-scheme: dark)', fullDarkSrc, fullDarkAlt);
            if (!fullLightSrc && !fullDarkSrc && fullSrc) addSource('', fullSrc, fullAlt);
        }
        // Determine primary for fallback img
        let prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        let isBelowBreakpoint = effectiveHasBreakpoint ? window.matchMedia(`(max-width: ${parseInt(attrs.breakpoint) - 1}px)`).matches : false;
        let primarySrc;
        let primaryAlt;
        if (effectiveHasBreakpoint && isBelowBreakpoint) {
            primarySrc = prefersDark ? iconLightSrc : iconDarkSrc || iconSrc;
            primaryAlt = attrs.isDecorative ? '' : (prefersDark ? iconLightAlt : iconDarkAlt || iconAlt);
        } else {
            primarySrc = prefersDark ? fullDarkSrc : fullLightSrc || fullSrc;
            primaryAlt = attrs.isDecorative ? '' : (prefersDark ? fullDarkAlt : fullLightAlt || fullAlt);
        }
        if (!primarySrc) {
            primarySrc = fullLightSrc || iconLightSrc || fullDarkSrc || iconDarkSrc || fullSrc || iconSrc;
            primaryAlt = attrs.isDecorative ? '' : (fullLightAlt || iconLightAlt || fullDarkAlt || iconDarkAlt || fullAlt || iconAlt);
        }
        const styleAttr = attrs.height ? ` style="height: ${attrs.height};"` : '';
        const imgAttrs = [
            `src="${primarySrc}"`,
            attrs.isDecorative ? 'alt="" role="presentation"' : `alt="${primaryAlt}"`,
            styleAttr,
            'loading="lazy"',
            'fetchpriority="high"',
            `onerror="this.src='https://placehold.co/300x40'; this.alt='${primaryAlt || 'Fallback logo'}'; this.onerror=null;"`
        ].join(' ');
        markup += `<img ${imgAttrs}></picture>`;
        this.#log('Logo markup generated', { markupPreview: markup.substring(0, 200) + '...' });
        const fullMarkup = `
            ${styleTag}
            <div class="logo-container ${positionClass}">
                <a href="/">${markup}</a>
            </div>
        `;
        this.innerHTML = fullMarkup;
        if (!isFallback) {
            this.renderCache = fullMarkup;
            this.criticalAttributesHash = newCriticalAttrsHash;
        }
        this.#log('CustomLogo rendered successfully');
    }
    static get observedAttributes() {
        return CustomLogo.#criticalAttributes;
    }
    attributeChangedCallback(name, oldValue, newValue) {
        if (!this.isInitialized || !this.isVisible) {
            this.#ignoredChangeCount++;
            if (this.#ignoredChangeCount % 10 === 0) {
                this.#log('Attribute changes ignored (not ready - batched)', { count: this.#ignoredChangeCount, name, oldValue, newValue });
            }
            return;
        }
        this.#log('Attribute changed', { name, oldValue, newValue });
        if (CustomLogo.#criticalAttributes.includes(name)) {
            this.cachedAttributes = null;
            this.render();
        }
    }
}
try {
    customElements.define('custom-logo', CustomLogo);
} catch (error) {
    console.error('Error defining CustomLogo element:', error);
}
console.log('CustomLogo version: 2025-10-13');
export { CustomLogo };
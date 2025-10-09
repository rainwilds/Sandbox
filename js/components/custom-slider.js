/* global HTMLElement, IntersectionObserver, document, window, JSON, console, customElements */
class CustomSlider extends HTMLElement {
    #ignoredChangeCount;
    #debug = new URLSearchParams(window.location.search).get('debug') === 'true';
    #isVisible = false;
    #isInitialized = false;
    #callbacks = [];
    #cachedAttributes = null;
    #criticalAttributesHash = null;
    #retryCount = 0;
    #replaceRetries = 0;
    #renderedElement = null;
    #originalChildren = null;
    #renderCompleteListeners = [];

    constructor() {
        super();
        this.#ignoredChangeCount = 0;
        this.#replaceRetries = 0;
        this.#renderCompleteListeners = [];
        CustomSlider.#observer.observe(this);
        CustomSlider.#observedInstances.add(this);
    }

    static #observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const instance = entry.target;
                if (instance instanceof CustomSlider) {
                    instance.#isVisible = true;
                    CustomSlider.#observer.unobserve(instance);
                    CustomSlider.#observedInstances.delete(instance);
                    instance.initialize();
                }
            }
        });
    }, { rootMargin: '50px' });

    static #observedInstances = new WeakSet();

    static #criticalAttributes = [
        'class', 'slides-per-view', 'gap', 'free-mode', 'pagination-clickable'
    ];

    #log(message, data = null) {
        if (this.#debug) {
            console.groupCollapsed(`%c[CustomSlider] ${message}`, 'color: #2196F3; font-weight: bold;');
            if (data) console.log('%cData:', 'color: #4CAF50;', data);
            console.trace();
            console.groupEnd();
        }
    }

    #warn(message, data = null) {
        if (this.#debug) {
            console.groupCollapsed(`%c[CustomSlider] ⚠️ ${message}`, 'color: #FF9800; font-weight: bold;');
            if (data) console.log('%cData:', 'color: #4CAF50;', data);
            console.trace();
            console.groupEnd();
        }
    }

    #error(message, data = null) {
        if (this.#debug) {
            console.groupCollapsed(`%c[CustomSlider] ❌ ${message}`, 'color: #F44336; font-weight: bold;');
            if (data) console.log('%cData:', 'color: #4CAF50;', data);
            console.trace();
            console.groupEnd();
        }
    }

    async getAttributes() {
        if (this.#cachedAttributes) {
            this.#log('Using cached attributes', { elementId: this.id || 'no-id' });
            return this.#cachedAttributes;
        }

        this.#log('Parsing new attributes', { elementId: this.id || 'no-id', outerHTML: this.outerHTML.substring(0, 200) + '...' });

        const swiperClass = this.getAttribute('class') || 'mySwiper';
        const slidesPerViewStr = this.getAttribute('slides-per-view') || '3';
        const gapStr = this.getAttribute('gap') || '30';
        const freeMode = this.getAttribute('free-mode') !== 'false';
        const paginationClickable = this.getAttribute('pagination-clickable') !== 'false';

        let slidesPerView = parseFloat(slidesPerViewStr);
        if (isNaN(slidesPerView)) {
            this.#warn('Invalid slides-per-view, defaulting to 3', { value: slidesPerViewStr });
            slidesPerView = 3;
        }

        let spaceBetween = gapStr;
        if (gapStr.startsWith('var(')) {
            this.#log('Gap detected as CSS variable', { value: gapStr });
        } else {
            const parsedGap = parseInt(gapStr, 10);
            if (!isNaN(parsedGap) && parsedGap >= 0) {
                spaceBetween = parsedGap;
            } else {
                this.#warn('Invalid gap, defaulting to 30', { value: gapStr });
                spaceBetween = 30;
            }
        }

        this.#cachedAttributes = {
            swiperClass,
            slidesPerView,
            spaceBetween,
            freeMode,
            paginationClickable
        };

        const criticalAttrs = {};
        CustomSlider.#criticalAttributes.forEach(attr => {
            criticalAttrs[attr] = this.getAttribute(attr) || '';
        });
        this.#criticalAttributesHash = JSON.stringify(criticalAttrs);

        this.#log('Attributes parsed successfully', {
            elementId: this.id || 'no-id',
            criticalHashLength: this.#criticalAttributesHash.length,
            attrs: this.#cachedAttributes
        });

        return this.#cachedAttributes;
    }

    #setupRenderCompleteListeners() {
        // Clean up existing listeners
        this.#renderCompleteListeners.forEach(({ listener }) => document.removeEventListener('render-complete', listener));
        this.#renderCompleteListeners = [];

        const blockElements = Array.from(this.children).filter(child => child.tagName.toLowerCase() === 'custom-block');
        if (blockElements.length === 0) {
            this.#log('No custom-block children to set up listeners for', { elementId: this.id || 'no-id' });
            return [];
        }

        return blockElements.map((block, index) => {
            const listener = (event) => {
                if (event.target.tagName.toLowerCase() === 'div' && event.target.classList.contains('block') && this.contains(event.target)) {
                    this.#log(`Received render-complete for block ${index}`, { elementId: block.id || `block-${index}` });
                    return { index, resolved: true };
                }
            };
            document.addEventListener('render-complete', listener);
            this.#renderCompleteListeners.push({ index, listener });
            return { index, resolved: false };
        });
    }

    async initialize() {
        if (this.#isInitialized) {
            this.#log('Skipping initialization (already done)', { elementId: this.id || 'no-id' });
            return;
        }

        this.#log('Starting initialization', {
            elementId: this.id || 'no-id',
            outerHTML: this.outerHTML.substring(0, 200) + '...',
            isVisible: this.#isVisible,
            swiperDefined: typeof Swiper !== 'undefined',
            customBlockDefined: !!customElements.get('custom-block'),
            parentTag: this.parentNode?.tagName || 'none',
            parentChildren: this.parentNode ? Array.from(this.parentNode.children).map(c => c.tagName) : []
        });

        // Mark as initialized early
        this.#isInitialized = true;

        // Wait for custom-block to be defined
        if (!customElements.get('custom-block')) {
            if (this.#retryCount < 5) {
                this.#retryCount++;
                this.#isInitialized = false;
                this.#warn('custom-block not defined yet; retrying in 100ms', { retry: this.#retryCount });
                setTimeout(() => this.initialize(), 100);
                return;
            } else {
                this.#error('custom-block not defined after 5 retries; falling back', { customBlockDefined: !!customElements.get('custom-block') });
                this.#fallback();
                return;
            }
        }

        // Cache original children
        if (!this.#originalChildren) {
            this.#originalChildren = document.createDocumentFragment();
            Array.from(this.children).forEach(child => this.#originalChildren.appendChild(child.cloneNode(true)));
            this.#log('Original children cached', { count: this.#originalChildren.childNodes.length });
        }

        // Wait for custom-block children to render
        const renderPromises = this.#setupRenderCompleteListeners();
        if (renderPromises.length > 0) {
            try {
                await Promise.all(renderPromises.map(({ index }) =>
                    new Promise((resolve, reject) => {
                        const timeout = setTimeout(() => {
                            this.#warn(`custom-block render timeout for block ${index}`, { elementId: `block-${index}` });
                            reject(new Error(`custom-block render timeout for block ${index}`));
                        }, 2000);

                        // Check for already-rendered blocks
                        const renderedBlocks = Array.from(this.querySelectorAll('div.block[data-rendered="true"]'));
                        if (renderedBlocks.length > index && renderedBlocks[index]) {
                            clearTimeout(timeout);
                            this.#log(`Block ${index} already rendered`, { elementId: `block-${index}` });
                            resolve();
                        }
                    })
                ));
                this.#log('All custom-block children rendered', { count: renderPromises.length });
            } catch (err) {
                this.#warn('Error waiting for custom-block renders; proceeding', { error: err.message });
            }
            // Clean up listeners after resolution
            this.#renderCompleteListeners.forEach(({ listener }) => document.removeEventListener('render-complete', listener));
            this.#renderCompleteListeners = [];
        }

        // Check if Swiper is loaded
        if (typeof Swiper === 'undefined') {
            if (this.#retryCount < 5) {
                this.#retryCount++;
                this.#isInitialized = false;
                this.#warn('Swiper JS not loaded yet; retrying in 750ms', { retry: this.#retryCount, globalSwiper: typeof window.Swiper });
                setTimeout(() => this.initialize(), 750);
                return;
            } else {
                this.#error('Swiper failed after 5 retries; falling back', { globalSwiper: typeof window.Swiper });
                this.#fallback();
                return;
            }
        }

        this.#retryCount = 0;
        this.#log('Swiper available, proceeding with render', { version: Swiper.version || 'unknown' });

        // Render if not cached
        if (!this.#renderedElement) {
            const attrs = await this.getAttributes();
            this.#renderedElement = this.#render(attrs);
            this.#log('Rendered element cached', { elementId: this.id || 'no-id', slideCount: this.#renderedElement.querySelectorAll('.swiper-slide').length });
        }

        // Initialize Swiper
        const paginationEl = this.#renderedElement.querySelector('.swiper-pagination');
        const options = {
            slidesPerView: this.#cachedAttributes.slidesPerView,
            spaceBetween: this.#cachedAttributes.spaceBetween,
            freeMode: this.#cachedAttributes.freeMode,
            pagination: {
                el: paginationEl,
                clickable: this.#cachedAttributes.paginationClickable,
            },
        };

        let swiper;
        try {
            swiper = new Swiper(this.#renderedElement, options);
            this.#log('Swiper initialized successfully', { options, swiperId: swiper.id || 'unknown', elementId: this.id || 'no-id' });
        } catch (err) {
            this.#error('Swiper initialization failed; falling back', { error: err.message });
            this.#fallback();
            return;
        }

        // Attempt to replace with retry mechanism
        const attemptReplace = () => {
            // Check if element and parent are still valid
            if (!document.body.contains(this) || !this.parentNode) {
                if (this.#replaceRetries < 5) {
                    this.#replaceRetries++;
                    this.#warn(`Element or parent not in DOM; retrying replacement (${this.#replaceRetries}/5)`, {
                        elementId: this.id || 'no-id',
                        parentTag: this.parentNode?.tagName || 'none',
                        parentChildren: this.parentNode ? Array.from(this.parentNode.children).map(c => c.tagName) : []
                    });
                    setTimeout(attemptReplace, 50); // Shorter interval for faster retries
                    return;
                } else {
                    this.#error('Element or parent not in DOM after 5 retries; attempting parent append', { elementId: this.id || 'no-id' });
                    // Try appending to parent (<header>) as a last resort
                    const parent = document.querySelector('header');
                    if (parent && this.#renderedElement) {
                        try {
                            parent.appendChild(this.#renderedElement);
                            this.#log('Rendered element appended to parent', { elementId: this.id || 'no-id', slideCount: this.#renderedElement.querySelectorAll('.swiper-slide').length });
                            this.#renderedElement = null;
                            this.#callbacks.forEach(callback => callback());
                            this.#log('Initialization completed', { elementId: this.id || 'no-id' });
                        } catch (err) {
                            this.#error('Parent append failed; falling back', { error: err.message });
                            this.#fallback();
                        }
                    } else {
                        this.#error('No parent header found or rendered element invalid; falling back', { elementId: this.id || 'no-id' });
                        this.#fallback();
                    }
                    return;
                }
            }

            try {
                this.replaceWith(this.#renderedElement);
                this.#log('Element replaced with rendered slider', { elementId: this.id || 'no-id', slideCount: this.#renderedElement.querySelectorAll('.swiper-slide').length });
                this.#renderedElement = null;
                this.#callbacks.forEach(callback => callback());
                this.#log('Initialization completed', { elementId: this.id || 'no-id' });
            } catch (err) {
                this.#error('Replacement failed; retrying', { error: err.message });
                if (this.#replaceRetries < 5) {
                    this.#replaceRetries++;
                    this.#warn(`Replacement retry (${this.#replaceRetries}/5)`, { elementId: this.id || 'no-id' });
                    setTimeout(attemptReplace, 50);
                } else {
                    this.#error('Replacement failed after 5 retries; falling back', { error: err.message });
                    this.#fallback();
                }
            }
        };

        attemptReplace();
    }

    #fallback() {
        this.#log('Creating fallback element', { elementId: this.id || 'no-id' });
        const fallbackElement = document.createElement('div');
        fallbackElement.className = 'slider-fallback';
        fallbackElement.style.display = 'flex';
        fallbackElement.style.overflow = 'hidden';
        fallbackElement.style.gap = '0';
        // Restore original children
        if (this.#originalChildren) {
            while (this.#originalChildren.firstChild) {
                fallbackElement.appendChild(this.#originalChildren.firstChild);
            }
            this.#log('Restored original children to fallback', { count: fallbackElement.children.length });
        } else {
            while (this.firstChild) {
                fallbackElement.appendChild(this.firstChild);
            }
        }
        if (document.body.contains(this) && this.parentNode) {
            try {
                this.replaceWith(fallbackElement);
                this.#log('Fallback element replaced', { elementId: this.id || 'no-id' });
            } catch (err) {
                this.#error('Fallback replacement failed', { error: err.message });
            }
        } else {
            // Try appending to parent (<header>) as a last resort
            const parent = document.querySelector('header');
            if (parent) {
                try {
                    parent.appendChild(fallbackElement);
                    this.#log('Fallback element appended to parent', { elementId: this.id || 'no-id' });
                } catch (err) {
                    this.#error('Fallback parent append failed', { error: err.message });
                }
            } else {
                this.#error('No parent header found; skipping fallback replacement', { elementId: this.id || 'no-id' });
            }
        }
        this.#isInitialized = true;
        // Clean up listeners
        this.#renderCompleteListeners.forEach(({ listener }) => document.removeEventListener('render-complete', listener));
        this.#renderCompleteListeners = [];
    }

    connectedCallback() {
        this.#log('Connected to DOM', {
            elementId: this.id || 'no-id',
            customBlockDefined: !!customElements.get('custom-block'),
            parentTag: this.parentNode?.tagName || 'none',
            parentChildren: this.parentNode ? Array.from(this.parentNode.children).map(c => c.tagName) : []
        });
        if (!this.#isInitialized) {
            this.initialize().catch(err => {
                this.#error('Init Promise rejected', { error: err.message });
                this.#fallback();
            });
        }
    }

    disconnectedCallback() {
        this.#log('Disconnected from DOM', {
            elementId: this.id || 'no-id',
            parentTag: this.parentNode?.tagName || 'none',
            parentChildren: this.parentNode ? Array.from(this.parentNode.children).map(c => c.tagName) : []
        });
        if (CustomSlider.#observedInstances.has(this)) {
            CustomSlider.#observer.unobserve(this);
            CustomSlider.#observedInstances.delete(this);
        }
        this.#callbacks = [];
        this.#cachedAttributes = null;
        this.#criticalAttributesHash = null;
        this.#retryCount = 0;
        this.#replaceRetries = 0;
        this.#isInitialized = false;
        if (this.#renderedElement) {
            this.#renderedElement.remove();
            this.#renderedElement = null;
        }
        // Clean up listeners
        this.#renderCompleteListeners.forEach(({ listener }) => document.removeEventListener('render-complete', listener));
        this.#renderCompleteListeners = [];
        // Keep #originalChildren for potential re-init
    }

    addCallback(callback) {
        this.#log('Callback added', { callbackName: callback.name || 'anonymous', elementId: this.id || 'no-id' });
        this.#callbacks.push(callback);
    }

    #render(attrs) {
        this.#log('Starting render', { elementId: this.id || 'no-id' });

        const sliderElement = document.createElement('div');
        sliderElement.className = `swiper ${attrs.swiperClass}`.trim();

        const wrapperElement = document.createElement('div');
        wrapperElement.className = 'swiper-wrapper';

        // Use existing DOM children (already rendered div.block elements)
        let slideCount = 0;
        const children = Array.from(this.childNodes).filter(node => node.nodeType === Node.ELEMENT_NODE);
        for (const child of children) {
            const slideElement = document.createElement('div');
            slideElement.className = 'swiper-slide';
            slideElement.appendChild(child.cloneNode(true));
            wrapperElement.appendChild(slideElement);
            slideCount++;
        }
        if (slideCount === 0) {
            this.#warn('No element children to render as slides', { elementId: this.id || 'no-id' });
        } else if (slideCount !== 3) {
            this.#warn(`Unexpected slide count: ${slideCount} (expected 3—check for extra elements)`, { elementId: this.id || 'no-id', childTags: children.map(c => c.tagName) });
        }
        this.#log(`Rendered ${slideCount} slides`, { elementId: this.id || 'no-id' });

        sliderElement.appendChild(wrapperElement);

        const paginationElement = document.createElement('div');
        paginationElement.className = 'swiper-pagination';
        sliderElement.appendChild(paginationElement);

        this.#log('Render completed (element cached, not replaced yet)', { elementId: this.id || 'no-id', html: sliderElement.outerHTML.substring(0, 200) });

        return sliderElement;
    }

    static get observedAttributes() {
        return CustomSlider.#criticalAttributes;
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (this.#isInitialized) {
            this.#log('Attribute changed (re-initializing)', { name, oldValue, newValue });
            if (CustomSlider.#criticalAttributes.includes(name)) {
                this.#cachedAttributes = null;
                this.#isInitialized = false;
                this.#renderedElement = null;
                this.initialize().catch(err => {
                    this.#error('Re-init Promise rejected', { error: err.message });
                    this.#fallback();
                });
            }
        } else {
            this.#ignoredChangeCount++;
            if (this.#debug && this.#ignoredChangeCount % 10 === 0) {
                this.#log('Attribute changes ignored (not ready - batched)', { count: this.#ignoredChangeCount, name, oldValue, newValue });
            }
        }
    }
}

try {
    customElements.define('custom-slider', CustomSlider);
} catch (error) {
    console.error('Error defining CustomSlider element:', error);
}

console.log('CustomSlider version: 2025-10-08');

export { CustomSlider };
/* global HTMLElement, IntersectionObserver, document, window, JSON, console, customElements */
class CustomSlider extends HTMLElement {
    #ignoredChangeCount;
    #debug = new URLSearchParams(window.location.search).get('debug') === 'true';
    #isVisible = false;
    #isInitialized = false;
    #initInProgress = false;
    #callbacks = [];
    #cachedAttributes = null;
    #criticalAttributesHash = null;
    #replaceRetries = 0;
    #renderedElement = null;
    #originalChildren = null;
    #renderCompleteListeners = [];

    constructor() {
        super();
        this.#ignoredChangeCount = 0;
        this.#replaceRetries = 0;
        this.#initInProgress = false;
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
        if (this.#isInitialized || this.#initInProgress) {
            this.#log('Skipping initialization (already in progress or done)', { elementId: this.id || 'no-id' });
            return;
        }

        this.#initInProgress = true;

        this.#log('Starting initialization', {
            elementId: this.id || 'no-id',
            outerHTML: this.outerHTML.substring(0, 200) + '...',
            isVisible: this.#isVisible,
            swiperDefined: typeof Swiper !== 'undefined',
            customBlockDefined: !!customElements.get('custom-block'),
            parentTag: this.parentNode?.tagName || 'none',
            parentChildren: this.parentNode ? Array.from(this.parentNode.children).map(c => c.tagName) : []
        });

        const parent = this.parentNode;
        const nextSibling = this.nextSibling;

        // Wait for custom-block to be defined with loop
        let customBlockAttempts = 0;
        while (!customElements.get('custom-block') && customBlockAttempts < 5) {
            customBlockAttempts++;
            this.#warn('custom-block not defined yet; awaiting 100ms', { attempt: customBlockAttempts });
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        if (!customElements.get('custom-block')) {
            this.#error('custom-block not defined after 5 attempts; falling back');
            this.#fallback(parent, nextSibling);
            return;
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

        // Wait for Swiper to be loaded with loop
        let swiperAttempts = 0;
        while (typeof Swiper === 'undefined' && swiperAttempts < 5) {
            swiperAttempts++;
            this.#warn('Swiper JS not loaded yet; awaiting 750ms', { attempt: swiperAttempts, globalSwiper: typeof window.Swiper });
            await new Promise(resolve => setTimeout(resolve, 750));
        }
        if (typeof Swiper === 'undefined') {
            this.#error('Swiper failed after 5 attempts; falling back');
            this.#fallback(parent, nextSibling);
            return;
        }

        this.#log('Swiper available, proceeding with render', { version: Swiper.version || 'unknown' });

        // Render if not cached
        if (!this.#renderedElement) {
            const attrs = await this.getAttributes();
            this.#renderedElement = this.#render(attrs);
            this.#log('Rendered element cached', { elementId: this.id || 'no-id', slideCount: this.#renderedElement.querySelectorAll('.swiper-slide').length });
        }

        // Attempt to replace with retry mechanism
        const attemptReplace = () => {
            try {
                if (parent && this.parentNode === parent && this.#renderedElement) {
                    parent.replaceChild(this.#renderedElement, this);
                    this.#log('Element replaced with rendered slider', { elementId: this.id || 'no-id', slideCount: this.#renderedElement.querySelectorAll('.swiper-slide').length });
                } else if (parent && this.#renderedElement) {
                    parent.insertBefore(this.#renderedElement, nextSibling);
                    if (document.body.contains(this)) this.remove();
                    this.#log('Rendered element inserted at original position', { elementId: this.id || 'no-id', slideCount: this.#renderedElement.querySelectorAll('.swiper-slide').length });
                } else {
                    throw new Error('No parent or rendered element available');
                }

                // Initialize Swiper after insertion
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
                let swiper = new Swiper(this.#renderedElement, options);
                this.#log('Swiper initialized successfully', { options, swiperId: swiper.id || 'unknown', elementId: this.id || 'no-id' });

                this.#renderedElement = null;
                this.#callbacks.forEach(callback => callback());
                this.#log('Initialization completed', { elementId: this.id || 'no-id' });
                this.#isInitialized = true;
                this.#initInProgress = false;
            } catch (err) {
                this.#error('Insertion failed; retrying', { error: err.message });
                if (this.#replaceRetries < 10) {
                    this.#replaceRetries++;
                    this.#warn(`Insertion retry (${this.#replaceRetries}/10)`, { elementId: this.id || 'no-id' });
                    setTimeout(attemptReplace, 100);
                } else {
                    this.#error('Insertion failed after 10 retries; falling back', { error: err.message });
                    this.#fallback(parent, nextSibling);
                }
            }
        };

        attemptReplace();
    }

    #fallback(parent, nextSibling) {
        this.#log('Creating fallback element', { elementId: this.id || 'no-id' });
        const fallbackElement = document.createElement('div');
        fallbackElement.className = 'slider-fallback';
        fallbackElement.style.display = 'flex';
        fallbackElement.style.overflow = 'hidden';
        // Dynamically set gap for consistency
        let gapValue = '0';
        if (this.#cachedAttributes && this.#cachedAttributes.spaceBetween) {
            gapValue = typeof this.#cachedAttributes.spaceBetween === 'number' 
                ? `${this.#cachedAttributes.spaceBetween}px` 
                : this.#cachedAttributes.spaceBetween;
        }
        fallbackElement.style.gap = gapValue;
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
        try {
            if (parent && this.parentNode === parent) {
                parent.replaceChild(fallbackElement, this);
                this.#log('Fallback element replaced', { elementId: this.id || 'no-id' });
            } else if (parent) {
                parent.insertBefore(fallbackElement, nextSibling);
                if (document.body.contains(this)) this.remove();
                this.#log('Fallback element inserted at original position', { elementId: this.id || 'no-id' });
            } else {
                this.#error('No parent found; skipping fallback insertion', { elementId: this.id || 'no-id' });
            }
        } catch (err) {
            this.#error('Fallback insertion failed', { error: err.message });
        }
        this.#isInitialized = true;
        this.#initInProgress = false;
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
        if (!this.#isInitialized && !this.#initInProgress) {
            this.initialize().catch(err => {
                this.#error('Init Promise rejected', { error: err.message });
                this.#fallback(this.parentNode, this.nextSibling);
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
        this.#replaceRetries = 0;
        this.#isInitialized = false;
        this.#initInProgress = false;
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
        } else {
            this.#log(`Rendered ${slideCount} slides`, { elementId: this.id || 'no-id' });
        }
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
                    this.#fallback(this.parentNode, this.nextSibling);
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

console.log('CustomSlider version: 2025-10-09');

export { CustomSlider };
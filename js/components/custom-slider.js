/* global HTMLElement, IntersectionObserver, document, window, JSON, console, customElements */
const privateData = new WeakMap();

class CustomSlider extends HTMLElement {
    constructor() {
        super();
        privateData.set(this, {
            ignoredChangeCount: 0,
            debug: new URLSearchParams(window.location.search).get('debug') === 'true',
            isVisible: false,
            isInitialized: false,
            initInProgress: false,
            callbacks: [],
            cachedAttributes: null,
            criticalAttributesHash: null,
            replaceRetries: 0,
            renderedElement: null,
            originalChildren: null,
            renderCompleteListeners: [],
            debounceTimer: null
        });
        CustomSlider.observer.observe(this);
        CustomSlider.observedInstances.add(this);
    }

    static observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const instance = entry.target;
                if (instance instanceof CustomSlider) {
                    privateData.get(instance).isVisible = true;
                    CustomSlider.observer.unobserve(instance);
                    CustomSlider.observedInstances.delete(instance);
                    instance.initialize();
                }
            }
        });
    }, { rootMargin: '50px' });

    static observedInstances = new WeakSet();

    static criticalAttributes = [
        'class', 'slides-per-view', 'gap', 'free-mode', 'pagination-clickable'
    ];

    log(message, data = null) {
        const state = privateData.get(this);
        if (state.debug) {
            console.groupCollapsed(`%c[CustomSlider] ${message}`, 'color: #2196F3; font-weight: bold;');
            if (data) console.log('%cData:', 'color: #4CAF50;', data);
            console.trace();
            console.groupEnd();
        }
    }

    warn(message, data = null) {
        const state = privateData.get(this);
        if (state.debug) {
            console.groupCollapsed(`%c[CustomSlider] ⚠️ ${message}`, 'color: #FF9800; font-weight: bold;');
            if (data) console.log('%cData:', 'color: #4CAF50;', data);
            console.trace();
            console.groupEnd();
        }
    }

    error(message, data = null) {
        const state = privateData.get(this);
        if (state.debug) {
            console.groupCollapsed(`%c[CustomSlider] ❌ ${message}`, 'color: #F44336; font-weight: bold;');
            if (data) console.log('%cData:', 'color: #4CAF50;', data);
            console.trace();
            console.groupEnd();
        }
    }

    async getAttributes() {
        const state = privateData.get(this);
        if (state.cachedAttributes) {
            this.log('Using cached attributes', { elementId: this.id || 'no-id' });
            return state.cachedAttributes;
        }

        this.log('Parsing new attributes', { elementId: this.id || 'no-id', outerHTML: this.outerHTML.substring(0, 200) + '...' });

        const sliderClass = this.getAttribute('class') || '';
        const slidesPerViewStr = this.getAttribute('slides-per-view') || '1';
        const gapStr = this.getAttribute('gap') || '0';
        const freeMode = this.getAttribute('free-mode') !== 'false';
        const paginationClickable = this.getAttribute('pagination-clickable') !== 'false';

        let slidesPerView = parseFloat(slidesPerViewStr);
        if (isNaN(slidesPerView) || slidesPerView <= 0) {
            this.warn('Invalid slides-per-view, defaulting to 1', { value: slidesPerViewStr });
            slidesPerView = 1;
        }

        let gap = gapStr;
        if (!gapStr.startsWith('var(') && !isNaN(parseInt(gapStr, 10))) {
            gap = parseInt(gapStr, 10) + 'px';
        }

        state.cachedAttributes = {
            sliderClass,
            slidesPerView,
            gap,
            freeMode,
            paginationClickable
        };

        const criticalAttrs = {};
        CustomSlider.criticalAttributes.forEach(attr => {
            criticalAttrs[attr] = this.getAttribute(attr) || '';
        });
        state.criticalAttributesHash = JSON.stringify(criticalAttrs);

        this.log('Attributes parsed successfully', {
            elementId: this.id || 'no-id',
            criticalHashLength: state.criticalAttributesHash.length,
            attrs: state.cachedAttributes
        });

        return state.cachedAttributes;
    }

    setupRenderCompleteListeners() {
        const state = privateData.get(this);
        // Clean up existing listeners
        state.renderCompleteListeners.forEach(({ listener }) => document.removeEventListener('render-complete', listener));
        state.renderCompleteListeners = [];

        const blockElements = Array.from(this.children).filter(child => child.tagName.toLowerCase() === 'custom-block');
        if (blockElements.length === 0) {
            this.log('No custom-block children to set up listeners for', { elementId: this.id || 'no-id' });
            return [];
        }

        return blockElements.map((block, index) => {
            const listener = (event) => {
                if (event.target.tagName.toLowerCase() === 'div' && event.target.classList.contains('block') && block.contains(event.target)) {
                    this.log(`Received render-complete for block ${index}`, { elementId: block.id || `block-${index}` });
                    return { index, resolved: true };
                }
            };
            document.addEventListener('render-complete', listener);
            state.renderCompleteListeners.push({ index, listener });
            return { index, resolved: false };
        });
    }

    async initialize() {
        const state = privateData.get(this);
        if (state.isInitialized || state.initInProgress) {
            this.log('Skipping initialization (already in progress or done)', { elementId: this.id || 'no-id' });
            return;
        }

        state.initInProgress = true;

        const parent = this.parentNode;
        const nextSibling = this.nextSibling;

        this.log('Starting initialization', {
            elementId: this.id || 'no-id',
            outerHTML: this.outerHTML.substring(0, 200) + '...',
            isVisible: state.isVisible,
            customBlockDefined: !!customElements.get('custom-block'),
            parentTag: parent?.tagName || 'none',
            parentChildren: parent ? Array.from(parent.children).map(c => c.tagName) : []
        });

        // Wait for custom-block to be defined
        let customBlockAttempts = 0;
        while (!customElements.get('custom-block') && customBlockAttempts < 5) {
            customBlockAttempts++;
            this.warn('custom-block not defined yet; awaiting 100ms', { attempt: customBlockAttempts });
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        if (!customElements.get('custom-block')) {
            this.error('custom-block not defined after 5 attempts; falling back');
            this.fallback(parent, nextSibling);
            return;
        }

        // Cache original children
        if (!state.originalChildren) {
            state.originalChildren = document.createDocumentFragment();
            Array.from(this.children).forEach(child => state.originalChildren.appendChild(child.cloneNode(true)));
            this.log('Original children cached', { count: state.originalChildren.childNodes.length });
        }

        // Proceed with render
        this.log('Proceeding with render');

        // Render if not cached
        if (!state.renderedElement) {
            const attrs = await this.getAttributes();
            state.renderedElement = this.render(attrs);
            this.log('Rendered element cached', { elementId: this.id || 'no-id', slideCount: state.renderedElement.querySelectorAll('.slider-slide').length });
        }

        // Wait for DOM stability before insertion
        const attemptInsert = () => {
            try {
                if (parent && this.parentNode === parent && state.renderedElement) {
                    parent.replaceChild(state.renderedElement, this);
                    this.log('Element replaced with rendered slider', { elementId: this.id || 'no-id' });
                } else if (parent && state.renderedElement) {
                    parent.insertBefore(state.renderedElement, nextSibling);
                    if (document.body.contains(this)) this.remove();
                    this.log('Rendered element inserted at original position', { elementId: this.id || 'no-id' });
                } else {
                    throw new Error('No parent or rendered element available');
                }

                // Attach slider logic
                this.attachSliderLogic(state.renderedElement);

                state.renderedElement = null;
                state.callbacks.forEach(callback => callback());
                this.log('Initialization completed', { elementId: this.id || 'no-id' });
                state.isInitialized = true;
                state.initInProgress = false;
            } catch (err) {
                this.error('Insertion failed', { error: err.message });
                this.fallback(parent, nextSibling);
            }
        };

        // Use MutationObserver to ensure DOM is ready
        const observer = new MutationObserver(() => {
            if (document.body.contains(this) && parent) {
                attemptInsert();
                observer.disconnect();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    attachSliderLogic(container) {
        const state = privateData.get(this);
        const attrs = state.cachedAttributes;
        const wrapper = container.querySelector('.slider-wrapper');
        const slides = container.querySelectorAll('.slider-slide');
        const pagination = container.querySelector('.slider-pagination');
        const slideCount = slides.length;

        if (slideCount === 0) return;

        // Calculate and set slide widths
        const recalc = () => {
            const computedStyle = getComputedStyle(wrapper);
            const gapPx = parseFloat(computedStyle.gap) || 0;
            const slideWidth = (container.clientWidth - gapPx * (attrs.slidesPerView - 1)) / attrs.slidesPerView;
            slides.forEach(slide => {
                slide.style.width = `${slideWidth}px`;
            });
            return { slideWidth, gapPx };
        };

        let { slideWidth, gapPx } = recalc();

        // Set scroll snap
        container.style.overflowX = 'auto';
        container.style.scrollSnapType = attrs.freeMode ? 'none' : 'x mandatory';
        slides.forEach(slide => {
            slide.style.scrollSnapAlign = 'start';
        });

        // Pagination setup
        if (pagination) {
            const dots = [];
            for (let i = 0; i < slideCount; i++) {
                const dot = document.createElement('span');
                dot.className = 'slider-dot';
                dot.dataset.index = i;
                pagination.appendChild(dot);
                dots.push(dot);
            }

            const updateActiveDot = () => {
                const step = slideWidth + gapPx;
                const index = Math.min(Math.round(container.scrollLeft / step), slideCount - 1);
                dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
            };

            if (attrs.paginationClickable) {
                pagination.addEventListener('click', (e) => {
                    if (e.target.classList.contains('slider-dot')) {
                        const index = parseInt(e.target.dataset.index);
                        const step = slideWidth + gapPx;
                        container.scrollTo({
                            left: index * step,
                            behavior: 'smooth'
                        });
                    }
                });
            }

            // Initial active
            updateActiveDot();

            // On scroll update active
            container.addEventListener('scroll', this.debounce(updateActiveDot, 100));
        }

        // On resize recalc
        window.addEventListener('resize', this.debounce(() => {
            ({ slideWidth, gapPx } = recalc());
            if (pagination) updateActiveDot();
        }, 200));
    }

    debounce(func, delay) {
        const state = privateData.get(this);
        return (...args) => {
            clearTimeout(state.debounceTimer);
            state.debounceTimer = setTimeout(() => func(...args), delay);
        };
    }

    fallback(parent, nextSibling) {
        const state = privateData.get(this);
        this.log('Creating fallback element', { elementId: this.id || 'no-id' });
        const fallbackElement = document.createElement('div');
        fallbackElement.className = 'slider-fallback';
        fallbackElement.style.display = 'flex';
        fallbackElement.style.overflow = 'hidden';

        // Ensure attributes are loaded
        let attrs = state.cachedAttributes;
        if (!attrs) {
            attrs = this.getAttributes();
        }
        const slidesPerView = attrs.slidesPerView || 1;
        fallbackElement.style.gap = attrs.gap || '0';

        // Restore original children
        if (state.originalChildren) {
            while (state.originalChildren.firstChild) {
                const slideElement = document.createElement('div');
                slideElement.className = 'slider-slide';
                slideElement.style.width = `${100 / slidesPerView}%`;
                slideElement.appendChild(state.originalChildren.firstChild);
                fallbackElement.appendChild(slideElement);
            }
            this.log('Restored original children to fallback', { count: fallbackElement.children.length });
        } else {
            while (this.firstChild) {
                const slideElement = document.createElement('div');
                slideElement.className = 'slider-slide';
                slideElement.style.width = `${100 / slidesPerView}%`;
                slideElement.appendChild(this.firstChild);
                fallbackElement.appendChild(slideElement);
            }
        }
        try {
            if (parent && this.parentNode === parent) {
                parent.replaceChild(fallbackElement, this);
                this.log('Fallback element replaced', { elementId: this.id || 'no-id' });
            } else if (parent) {
                parent.insertBefore(fallbackElement, nextSibling);
                if (document.body.contains(this)) this.remove();
                this.log('Fallback element inserted at original position', { elementId: this.id || 'no-id' });
            } else {
                this.error('No parent found; skipping fallback insertion', { elementId: this.id || 'no-id' });
            }
        } catch (err) {
            this.error('Fallback insertion failed', { error: err.message });
        }
        state.isInitialized = true;
        state.initInProgress = false;
        // Clean up listeners
        state.renderCompleteListeners.forEach(({ listener }) => document.removeEventListener('render-complete', listener));
        state.renderCompleteListeners = [];
    }

    connectedCallback() {
        const state = privateData.get(this);
        this.log('Connected to DOM', {
            elementId: this.id || 'no-id',
            customBlockDefined: !!customElements.get('custom-block'),
            parentTag: this.parentNode?.tagName || 'none',
            parentChildren: this.parentNode ? Array.from(this.parentNode.children).map(c => c.tagName) : []
        });
        if (!state.isInitialized && !state.initInProgress) {
            document.addEventListener('DOMContentLoaded', () => {
                this.initialize().catch(err => {
                    this.error('Init Promise rejected', { error: err.message });
                    this.fallback(this.parentNode, this.nextSibling);
                });
            }, { once: true });
        }
    }

    disconnectedCallback() {
        const state = privateData.get(this);
        this.log('Disconnected from DOM', {
            elementId: this.id || 'no-id',
            parentTag: this.parentNode?.tagName || 'none',
            parentChildren: this.parentNode ? Array.from(this.parentNode.children).map(c => c.tagName) : []
        });
        if (CustomSlider.observedInstances.has(this)) {
            CustomSlider.observer.unobserve(this);
            CustomSlider.observedInstances.delete(this);
        }
        state.callbacks = [];
        state.cachedAttributes = null;
        state.criticalAttributesHash = null;
        state.isInitialized = false;
        state.initInProgress = false;
        if (state.renderedElement) {
            state.renderedElement.remove();
            state.renderedElement = null;
        }
        // Clean up listeners
        state.renderCompleteListeners.forEach(({ listener }) => document.removeEventListener('render-complete', listener));
        state.renderCompleteListeners = [];
        // Keep originalChildren for potential re-init
    }

    addCallback(callback) {
        const state = privateData.get(this);
        this.log('Callback added', { callbackName: callback.name || 'anonymous', elementId: this.id || 'no-id' });
        state.callbacks.push(callback);
    }

    render(attrs) {
        this.log('Starting render', { elementId: this.id || 'no-id' });

        const sliderElement = document.createElement('div');
        sliderElement.className = `slider ${attrs.sliderClass}`.trim();

        const wrapperElement = document.createElement('div');
        wrapperElement.className = 'slider-wrapper';
        wrapperElement.style.display = 'flex';
        wrapperElement.style.gap = attrs.gap;

        let slideCount = 0;
        const children = Array.from(this.children).filter(node => node.nodeType === Node.ELEMENT_NODE);
        for (const child of children) {
            const slideElement = document.createElement('div');
            slideElement.className = 'slider-slide';
            slideElement.appendChild(child); // Move original child
            wrapperElement.appendChild(slideElement);
            slideCount++;
        }
        if (slideCount === 0) {
            this.warn('No element children to render as slides', { elementId: this.id || 'no-id' });
        } else {
            this.log(`Rendered ${slideCount} slides`, { elementId: this.id || 'no-id' });
        }
        sliderElement.appendChild(wrapperElement);

        // Add pagination if attribute is present
        if (this.hasAttribute('pagination-clickable')) {
            const paginationElement = document.createElement('div');
            paginationElement.className = 'slider-pagination';
            sliderElement.appendChild(paginationElement);
        }

        this.log('Render completed (element cached, not replaced yet)', { elementId: this.id || 'no-id', html: sliderElement.outerHTML.substring(0, 200) });

        return sliderElement;
    }

    static get observedAttributes() {
        return CustomSlider.criticalAttributes;
    }

    attributeChangedCallback(name, oldValue, newValue) {
        const state = privateData.get(this);
        if (state.isInitialized) {
            this.log('Attribute changed (re-initializing)', { name, oldValue, newValue });
            if (CustomSlider.criticalAttributes.includes(name)) {
                state.cachedAttributes = null;
                state.isInitialized = false;
                state.renderedElement = null;
                this.initialize().catch(err => {
                    this.error('Re-init Promise rejected', { error: err.message });
                    this.fallback(this.parentNode, this.nextSibling);
                });
            }
        } else {
            state.ignoredChangeCount++;
            if (state.debug && state.ignoredChangeCount % 10 === 0) {
                this.log('Attribute changes ignored (not ready - batched)', { count: state.ignoredChangeCount, name, oldValue, newValue });
            }
        }
    }
}

try {
    customElements.define('custom-slider', CustomSlider);
} catch (error) {
    console.error('Error defining CustomSlider element:', error);
}

console.log('CustomSlider version: 2025-10-10-3');

export { CustomSlider };
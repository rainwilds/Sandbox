/* global HTMLElement, document, window, console, MutationObserver */
import { VALID_ALIGNMENTS, VALID_ALIGN_MAP } from '../shared.js';

class CustomFilter extends HTMLElement {
  #isInitialized = false;
  #debug = new URLSearchParams(window.location.search).get('debug') === 'true';
  #observer = null;
  #filterControls = null;
  #childrenCache = new Map();
  #containerId = `filter-${Math.random().toString(36).substr(2, 9)}`;

  constructor() {
    super();
    this.callbacks = [];
    this.activeFilters = new Set();
  }

  #log(message, data = null) {
    if (this.#debug) {
      console.groupCollapsed(`%c[CustomFilter] ${message}`, 'color: #2196F3; font-weight: bold;');
      if (data) console.log('%cData:', 'color: #4CAF50;', data);
      console.trace();
      console.groupEnd();
    }
  }

  #warn(message, data = null) {
    if (this.#debug) {
      console.groupCollapsed(`%c[CustomFilter] ⚠️ ${message}`, 'color: #FF9800; font-weight: bold;');
      if (data) console.log('%cData:', 'color: #4CAF50;', data);
      console.trace();
      console.groupEnd();
    }
  }

  #error(message, data = null) {
    if (this.#debug) {
      console.groupCollapsed(`%c[CustomFilter] ❌ ${message}`, 'color: #F44336; font-weight: bold;');
      if (data) console.log('%cData:', 'color: #4CAF50;', data);
      console.trace();
      console.groupEnd();
    }
  }

  async connectedCallback() {
    if (this.#isInitialized) {
      this.#log('Already initialized, skipping', { elementId: this.id || 'no-id' });
      return;
    }
    this.#log('Connected to DOM', { elementId: this.id || 'no-id' });
    await this.initialize();
  }

  disconnectedCallback() {
    this.#log('Disconnected from DOM', { elementId: this.id || 'no-id' });
    if (this.#observer) {
      this.#observer.disconnect();
      this.#observer = null;
    }
    this.callbacks = [];
    this.#childrenCache.clear();
    this.#filterControls = null;
    this.#isInitialized = false;
  }

  async initialize() {
    this.#isInitialized = true;
    this.#log('Starting initialization', { elementId: this.id || 'no-id' });
    try {
      const filterElement = await this.render();
      if (filterElement) {
        this.replaceWith(filterElement);
        this.#filterControls = filterElement.querySelector('.filter-controls');
        this.setupMutationObserver();
        this.applyFilters();
        this.callbacks.forEach(callback => callback());
        this.#log('Initialization completed', { elementId: this.id || 'no-id' });
      } else {
        this.#error('Render returned null', { elementId: this.id || 'no-id' });
      }
    } catch (error) {
      this.#error('Initialization failed', {
        error: error.message,
        stack: error.stack,
        elementId: this.id || 'no-id'
      });
    }
  }

  async render() {
    this.#log('Rendering filter component', { elementId: this.id || 'no-id' });
    const filterType = this.getAttribute('filter-type') || 'tags';
    const filterValues = this.getAttribute('filter-values')?.split(',').map(v => v.trim()) || [];
    const filterAlignment = this.getAttribute('filter-alignment') || 'center';
    const buttonClass = this.getAttribute('button-class') || '';
    const buttonStyle = this.getAttribute('button-style') || '';

    if (!VALID_ALIGNMENTS.includes(filterAlignment)) {
      this.#warn('Invalid filter alignment', {
        value: filterAlignment,
        validValues: VALID_ALIGNMENTS,
        elementId: this.id || 'no-id'
      });
    }

    const autoValues = filterValues.length
      ? filterValues
      : this.getUniqueFilterValues(filterType);

    if (!autoValues.length) {
      this.#warn('No filter values available', { filterType, elementId: this.id || 'no-id' });
      return null;
    }

    const filterContainer = document.createElement('div');
    filterContainer.className = 'custom-filter';
    filterContainer.id = this.#containerId;

    const controlsContainer = document.createElement('div');
    controlsContainer.className = `filter-controls ${VALID_ALIGN_MAP[filterAlignment] || 'center'}`;
    controlsContainer.setAttribute('role', 'group');
    controlsContainer.setAttribute('aria-label', 'Filter controls');

    const allButton = document.createElement('button');
    allButton.className = `filter-button ${buttonClass}`.trim();
    allButton.setAttribute('aria-label', 'Show all items');
    allButton.textContent = 'All';
    if (buttonStyle) allButton.setAttribute('style', buttonStyle);
    allButton.addEventListener('click', () => {
      this.#log('All button clicked', { activeFiltersBefore: [...this.activeFilters] });
      this.activeFilters.clear();
      Array.from(controlsContainer.querySelectorAll('button')).forEach(btn => 
        btn.removeAttribute('aria-pressed')
      );
      this.applyFilters();
    });
    controlsContainer.appendChild(allButton);

    autoValues.forEach(value => {
      const button = document.createElement('button');
      button.className = `filter-button ${buttonClass}`.trim();
      button.setAttribute('aria-label', `Filter by ${value}`);
      button.textContent = value;
      if (buttonStyle) button.setAttribute('style', buttonStyle);
      button.addEventListener('click', () => {
        this.#log('Filter button clicked', { value, activeFiltersBefore: [...this.activeFilters] });
        if (this.activeFilters.has(value)) {
          this.activeFilters.delete(value);
          button.removeAttribute('aria-pressed');
        } else {
          this.activeFilters.add(value);
          button.setAttribute('aria-pressed', 'true');
        }
        this.applyFilters();
      });
      controlsContainer.appendChild(button);
    });

    filterContainer.appendChild(controlsContainer);

    Array.from(this.children).forEach(child => filterContainer.appendChild(child));

    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.style.position = 'absolute';
    liveRegion.style.width = '1px';
    liveRegion.style.height = '1px';
    liveRegion.style.overflow = 'hidden';
    liveRegion.textContent = 'Filtered to show all items';
    filterContainer.appendChild(liveRegion);

    this.#log('Filter component rendered', { values: autoValues, elementId: this.id || 'no-id' });
    return filterContainer;
  }

  getUniqueFilterValues(filterType) {
    this.#log('Getting unique filter values', { filterType });
    const values = new Set();
    const children = Array.from(this.children).filter(child => child.hasAttribute(`data-${filterType}`));
    children.forEach(child => {
      const value = child.getAttribute(`data-${filterType}`)?.split(',').map(v => v.trim());
      this.#log('Processing child', { tagName: child.tagName, filterValue: value });
      if (value) {
        value.forEach(v => values.add(v));
      }
    });
    const result = [...values].sort();
    this.#log('Unique filter values retrieved', { values: result });
    return result;
  }

  applyFilters() {
    const filterType = this.getAttribute('filter-type') || 'tags';
    this.#log('Applying filters', { filterType, activeFilters: [...this.activeFilters] });
    const container = document.getElementById(this.#containerId);
    const children = container
      ? Array.from(container.children).filter(child => child.hasAttribute(`data-${filterType}`))
      : Array.from(this.children).filter(child => child.hasAttribute(`data-${filterType}`));
    this.#log('Found filterable children', { childCount: children.length, children: children.map(c => ({ tag: c.tagName, tags: c.getAttribute(`data-${filterType}`) })) });

    children.forEach(child => {
      const values = child.getAttribute(`data-${filterType}`)?.split(',').map(v => v.trim()) || [];
      const isVisible = this.activeFilters.size === 0 || values.some(value => this.activeFilters.has(value));
      this.#log('Evaluating child visibility', {
        childTag: child.tagName,
        childTags: values,
        isVisible,
        activeFilters: [...this.activeFilters]
      });
      child.style.display = isVisible ? '' : 'none';
      this.#childrenCache.set(child, isVisible);
    });

    const liveRegion = container?.querySelector('[aria-live="polite"]') || this.querySelector('[aria-live="polite"]') || document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.style.position = 'absolute';
    liveRegion.style.width = '1px';
    liveRegion.style.height = '1px';
    liveRegion.style.overflow = 'hidden';
    liveRegion.textContent = `Filtered to show ${this.activeFilters.size === 0 ? 'all items' : [...this.activeFilters].join(', ')}`;
    if (!liveRegion.parentNode && container) container.appendChild(liveRegion);
    this.#log('Live region updated', { text: liveRegion.textContent });
  }

  setupMutationObserver() {
    this.#observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          this.#log('Child list mutated', { added: mutation.addedNodes.length, removed: mutation.removedNodes.length });
          const container = document.getElementById(this.#containerId);
          if (container) {
            this.#filterControls = container.querySelector('.filter-controls');
            this.render();
            this.applyFilters();
          }
        }
      });
    });
    this.#observer.observe(this, { childList: true });
    this.#log('MutationObserver set up', { elementId: this.id || 'no-id' });
  }

  addCallback(callback) {
    this.#log('Callback added', { callbackName: callback.name || 'anonymous', elementId: this.id || 'no-id' });
    this.callbacks.push(callback);
  }

  static get observedAttributes() {
    return ['filter-type', 'filter-values', 'filter-alignment', 'button-class', 'button-style'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue || !this.#isInitialized) return;
    this.#log('Attribute changed', { name, oldValue, newValue, elementId: this.id || 'no-id' });
    if (['filter-type', 'filter-values', 'filter-alignment', 'button-class', 'button-style'].includes(name)) {
      const container = document.getElementById(this.#containerId);
      if (container) {
        this.render();
        this.applyFilters();
      }
    }
  }
}

try {
  customElements.define('custom-filter', CustomFilter);
} catch (error) {
  console.error('Error defining CustomFilter element:', error);
}

console.log('CustomFilter version: 2025-10-28');
export { CustomFilter };
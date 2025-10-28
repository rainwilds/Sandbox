/* global HTMLElement, document, window, console, MutationObserver */
import { VALID_ALIGNMENTS, VALID_ALIGN_MAP } from '../shared.js';

class CustomFilter extends HTMLElement {
  #isInitialized = false;
  #debug = new URLSearchParams(window.location.search).get('debug') === 'true';
  #observer = null;
  #filterControls = null;
  #childrenCache = new Map();

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
      await this.renderFilterControls();
      this.setupMutationObserver();
      this.applyFilters();
      this.callbacks.forEach(callback => callback());
      this.#log('Initialization completed', { elementId: this.id || 'no-id' });
    } catch (error) {
      this.#error('Initialization failed', {
        error: error.message,
        stack: error.stack,
        elementId: this.id || 'no-id'
      });
    }
  }

  async renderFilterControls() {
    this.#log('Rendering filter controls', { elementId: this.id || 'no-id' });
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
      return;
    }

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
      this.activeFilters.clear();
      this.applyFilters();
      this.#log('Reset filters to show all', { elementId: this.id || 'no-id' });
    });
    controlsContainer.appendChild(allButton);

    autoValues.forEach(value => {
      const button = document.createElement('button');
      button.className = `filter-button ${buttonClass}`.trim();
      button.setAttribute('aria-label', `Filter by ${value}`);
      button.textContent = value;
      if (buttonStyle) button.setAttribute('style', buttonStyle);
      button.addEventListener('click', () => {
        if (this.activeFilters.has(value)) {
          this.activeFilters.delete(value);
          button.removeAttribute('aria-pressed');
        } else {
          this.activeFilters.add(value);
          button.setAttribute('aria-pressed', 'true');
        }
        this.applyFilters();
        this.#log('Filter toggled', { value, activeFilters: [...this.activeFilters] });
      });
      controlsContainer.appendChild(button);
    });

    this.insertBefore(controlsContainer, this.firstChild);
    this.#filterControls = controlsContainer;
    this.#log('Filter controls rendered', { values: autoValues, elementId: this.id || 'no-id' });
  }

  getUniqueFilterValues(filterType) {
    const values = new Set();
    const children = Array.from(this.children).filter(child => child.tagName.toLowerCase() === 'custom-block');
    children.forEach(child => {
      let value;
      if (filterType === 'tags') {
        value = child.getAttribute('data-tags')?.split(',').map(v => v.trim());
      } else if (filterType === 'category') {
        value = child.getAttribute('data-category')?.split(',').map(v => v.trim());
      } else if (filterType === 'snipcart-price') {
        value = child.getAttribute('data-snipcart-price')?.split(',').map(v => v.trim());
      } else {
        value = child.getAttribute(`data-${filterType}`)?.split(',').map(v => v.trim());
      }
      if (value) {
        value.forEach(v => values.add(v));
      }
    });
    return [...values].sort();
  }

  applyFilters() {
    const children = Array.from(this.children).filter(child => child.tagName.toLowerCase() === 'custom-block');
    this.#log('Applying filters', { activeFilters: [...this.activeFilters], childCount: children.length });

    children.forEach(child => {
      const tags = child.getAttribute('data-tags')?.split(',').map(v => v.trim()) || [];
      const category = child.getAttribute('data-category')?.split(',').map(v => v.trim()) || [];
      const price = child.getAttribute('data-snipcart-price')?.split(',').map(v => v.trim()) || [];
      const filterType = this.getAttribute('filter-type') || 'tags';
      const values = filterType === 'tags' ? tags : filterType === 'category' ? category : filterType === 'snipcart-price' ? price : child.getAttribute(`data-${filterType}`)?.split(',').map(v => v.trim()) || [];

      const isVisible = this.activeFilters.size === 0 || values.some(value => this.activeFilters.has(value));
      child.style.display = isVisible ? '' : 'none';
      this.#childrenCache.set(child, isVisible);
    });

    const liveRegion = this.querySelector('[aria-live="polite"]') || document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.style.position = 'absolute';
    liveRegion.style.width = '1px';
    liveRegion.style.height = '1px';
    liveRegion.style.overflow = 'hidden';
    liveRegion.textContent = `Filtered to show ${this.activeFilters.size === 0 ? 'all items' : [...this.activeFilters].join(', ')}`;
    if (!liveRegion.parentNode) this.appendChild(liveRegion);
  }

  setupMutationObserver() {
    this.#observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          this.#log('Child list mutated', { added: mutation.addedNodes.length, removed: mutation.removedNodes.length });
          this.renderFilterControls();
          this.applyFilters();
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
      this.renderFilterControls();
      this.applyFilters();
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
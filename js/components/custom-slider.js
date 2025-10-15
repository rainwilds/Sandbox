/* global HTMLElement, document, window, console, Swiper */

class CustomSlider extends HTMLElement {
  #swiperInstance = null;
  #debug = new URLSearchParams(window.location.search).get('debug') === 'true';

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

  connectedCallback() {
    this.#log('Connected to DOM', { elementId: this.id || 'no-id' });

    if (!window.Swiper) {
      this.#error('Swiper library not loaded', { elementId: this.id || 'no-id' });
      return;
    }

    const hasNavigation = this.hasAttribute('navigation');
    const hasPagination = this.hasAttribute('pagination');

    // Transform this element into the swiper container
    this.classList.add('swiper');

    // Ensure children have swiper-slide class
    Array.from(this.children).forEach(child => {
      if (!child.classList.contains('swiper-slide')) {
        child.classList.add('swiper-slide');
      }
    });

    // Wrap existing children in swiper-wrapper
    const wrapper = document.createElement('div');
    wrapper.classList.add('swiper-wrapper');
    while (this.firstChild) {
      wrapper.appendChild(this.firstChild);
    }
    this.appendChild(wrapper);

    // Conditionally add pagination
    if (hasPagination) {
      const pagination = document.createElement('div');
      pagination.classList.add('swiper-pagination');
      this.appendChild(pagination);
    }

    // Conditionally add navigation buttons
    if (hasNavigation) {
      const prev = document.createElement('div');
      prev.classList.add('swiper-button-prev');
      const next = document.createElement('div');
      next.classList.add('swiper-button-next');
      this.appendChild(prev);
      this.appendChild(next);
    }

    // Prepare Swiper options and modules
    const modules = [];
    const options = {
      loop: true,
    };

    if (hasPagination) {
      modules.push(window.Swiper.Pagination);
      options.pagination = { el: '.swiper-pagination', clickable: true };
    }

    if (hasNavigation) {
      modules.push(window.Swiper.Navigation);
      options.navigation = {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      };
    }

    // Initialize Swiper
    try {
      this.#swiperInstance = new Swiper(this, {
        modules,
        ...options,
      });
      this.#log('Swiper initialized successfully', { options });
    } catch (error) {
      this.#error('Failed to initialize Swiper', { error: error.message });
    }
  }

  disconnectedCallback() {
    this.#log('Disconnected from DOM', { elementId: this.id || 'no-id' });
    if (this.#swiperInstance) {
      this.#swiperInstance.destroy(true, true);
      this.#swiperInstance = null;
      this.#log('Swiper instance destroyed');
    }
  }

  static get observedAttributes() {
    return ['navigation', 'pagination'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue && this.#swiperInstance) {
      this.#log('Attribute changed, reinitializing', { name, oldValue, newValue });
      this.#swiperInstance.destroy(true, true);
      this.connectedCallback();
    }
  }
}

try {
  customElements.define('custom-slider', CustomSlider);
} catch (error) {
  console.error('Error defining CustomSlider element:', error);
}

console.log('CustomSlider version: 2025-10-15');
export { CustomSlider };
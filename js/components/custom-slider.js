/* global HTMLElement, document, window, console, Swiper, DOMParser */

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

  #validateIcon(icon) {
    if (!icon) return '';
    const cleanedIcon = icon.replace(/['"]/g, '&quot;').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    const parser = new DOMParser();
    const doc = parser.parseFromString(cleanedIcon, 'text/html');
    const iElement = doc.body.querySelector('i');
    if (!iElement || !iElement.className.includes('fa-')) {
      this.#warn('Invalid button-icon format', {
        value: icon,
        elementId: this.id || 'no-id',
        expected: 'Font Awesome <i> tag with fa- classes'
      });
      return '';
    }
    const validClasses = iElement.className.split(' ').filter(cls => cls.startsWith('fa-') || cls === 'fa-chisel');
    if (validClasses.length === 0) {
      this.#warn('No valid Font Awesome classes in button-icon', {
        classes: iElement.className,
        elementId: this.id || 'no-id'
      });
      return '';
    }
    return `<i class="${validClasses.join(' ')}"></i>`;
  }

  connectedCallback() {
    this.#log('Connected to DOM', { elementId: this.id || 'no-id' });

    if (!window.Swiper) {
      this.#error('Swiper library not loaded', { elementId: this.id || 'no-id' });
      return;
    }

    const hasPagination = this.hasAttribute('pagination');
    const hasNavigation = this.hasAttribute('navigation');
    const buttonIcon = this.hasAttribute('navigation') ? this.getAttribute('button-icon') || '' : '';

    // Warn if button-icon is used without navigation
    if (this.hasAttribute('button-icon') && !hasNavigation) {
      this.#warn('button-icon attribute ignored without navigation attribute', {
        elementId: this.id || 'no-id',
        buttonIcon
      });
    }

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

    // Add pagination if attribute is present
    if (hasPagination) {
      const pagination = document.createElement('div');
      pagination.classList.add('swiper-pagination');
      this.appendChild(pagination);
      this.#log('Pagination element added', { elementId: this.id || 'no-id' });
    }

    // Add navigation buttons if attribute is present
    if (hasNavigation) {
      const prev = document.createElement('div');
      prev.classList.add('swiper-button-prev');
      const next = document.createElement('div');
      next.classList.add('swiper-button-next');
      
      // Apply Font Awesome icon if valid
      if (buttonIcon) {
        const validatedIcon = this.#validateIcon(buttonIcon);
        if (validatedIcon) {
          prev.innerHTML = validatedIcon;
          next.innerHTML = validatedIcon;
          this.#log('Navigation button icons applied', { icon: validatedIcon, elementId: this.id || 'no-id' });
        }
      }

      this.appendChild(prev);
      this.appendChild(next);
      this.#log('Navigation buttons added', { elementId: this.id || 'no-id' });
    }

    // Prepare Swiper options
    const options = {
      loop: true,
    };

    if (hasPagination) {
      options.pagination = {
        el: '.swiper-pagination',
        clickable: true,
      };
    }

    if (hasNavigation) {
      options.navigation = {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      };
    }

    // Initialize Swiper
    try {
      this.#swiperInstance = new Swiper(this, options);
      this.#log('Swiper initialized successfully', { options, hasPagination, hasNavigation, hasButtonIcon: !!buttonIcon });
    } catch (error) {
      this.#error('Failed to initialize Swiper', { error: error.message, stack: error.stack });
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
    return ['pagination', 'navigation', 'button-icon'];
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
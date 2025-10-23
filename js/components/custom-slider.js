/* global HTMLElement, document, window, console, Swiper, DOMParser */

class CustomSlider extends HTMLElement {
  #swiperInstance = null;
  #debug = new URLSearchParams(window.location.search).get('debug') === 'true';
  #isInitialized = false;

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

  #validateIcon(icon, attributeName) {
    if (!icon) return '';
    const cleanedIcon = icon
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&');
    this.#log(`Validating ${attributeName}`, { rawIcon: icon, cleanedIcon });
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(cleanedIcon, 'text/html');
    const iElement = doc.body.querySelector('i');
    if (!iElement) {
      this.#warn(`Invalid ${attributeName} format: No <i> tag found`, {
        value: cleanedIcon,
        elementId: this.id || 'no-id',
        expected: 'Font Awesome <i> tag with fa- classes'
      });
      return '';
    }
    const classes = iElement.className.split(' ').filter(cls => cls);
    this.#log(`Parsed classes for ${attributeName}`, { classes });
    
    const validClasses = classes.filter(cls => cls.startsWith('fa-') || cls === 'fa-regular' || cls === 'fa-solid' || cls === 'fa-chisel');
    if (validClasses.length === 0) {
      this.#warn(`No valid Font Awesome classes in ${attributeName}`, {
        classes: iElement.className,
        elementId: this.id || 'no-id',
        expected: 'At least one fa- class, fa-regular, fa-solid, or fa-chisel'
      });
      return '';
    }
    const iconHtml = `<i class="${validClasses.join(' ')}"></i>`;
    this.#log(`Validated icon for ${attributeName}`, { iconHtml });
    return iconHtml;
  }

  async #parseSpaceBetween(value, maxAttempts = 30, delay = 500) {
    if (!value) {
      this.#log('No space-between value provided, using 0', { value });
      return { value: 0, cssVariable: null };
    }
    const trimmedValue = value.trim();

    // Wait for DOMContentLoaded to ensure styles are loaded
    await new Promise(resolve => {
      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        resolve();
      } else {
        document.addEventListener('DOMContentLoaded', resolve, { once: true });
      }
    });

    // Log root font size for debugging
    const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    this.#log('Root font size', { rootFontSize });

    // Handle CSS variable (e.g., var(--space-tiny))
    if (trimmedValue.startsWith('var(')) {
      let attempts = 0;
      while (attempts < maxAttempts) {
        try {
          const varName = trimmedValue.match(/var\((--[^)]+)\)/)?.[1];
          if (!varName) {
            this.#warn('Invalid CSS variable format in space-between', { value: trimmedValue, elementId: this.id || 'no-id' });
            return { value: 0, cssVariable: trimmedValue };
          }
          const computedStyle = getComputedStyle(document.documentElement);
          const pixelValue = computedStyle.getPropertyValue(varName).trim();
          this.#log('Raw CSS variable value', { variable: varName, pixelValue });

          // Parse rem or px units
          if (pixelValue.includes('rem')) {
            const remValue = parseFloat(pixelValue);
            if (!isNaN(remValue)) {
              const parsedValue = remValue * rootFontSize;
              this.#log('Parsed rem value for space-between', { variable: varName, remValue, parsedValue });
              return { value: parsedValue, cssVariable: trimmedValue };
            }
          } else if (pixelValue.includes('px')) {
            const parsedValue = parseFloat(pixelValue);
            if (!isNaN(parsedValue)) {
              this.#log('Parsed px value for space-between', { variable: varName, pixelValue: parsedValue });
              return { value: parsedValue, cssVariable: trimmedValue };
            }
          }

          // If pixelValue is invalid, retry
          this.#log(`CSS variable resolution attempt ${attempts + 1}/${maxAttempts}`, { variable: varName, pixelValue });
          await new Promise(resolve => setTimeout(resolve, delay));
          attempts++;
        } catch (error) {
          this.#log(`CSS variable resolution attempt ${attempts + 1}/${maxAttempts} failed`, { value: trimmedValue, error: error.message });
          await new Promise(resolve => setTimeout(resolve, delay));
          attempts++;
        }
      }
      this.#warn('Failed to resolve CSS variable after retries', { value: trimmedValue, elementId: this.id || 'no-id' });
      return { value: 0, cssVariable: trimmedValue };
    }

    // Handle CSS units (px, em, rem, %, vw, vh)
    try {
      const testDiv = document.createElement('div');
      testDiv.style.display = 'none';
      testDiv.style.width = trimmedValue;
      document.body.appendChild(testDiv);
      const pixelValue = parseFloat(window.getComputedStyle(testDiv).width);
      document.body.removeChild(testDiv);
      if (isNaN(pixelValue)) {
        this.#warn('Invalid CSS unit value in space-between', { value: trimmedValue, elementId: this.id || 'no-id' });
        return { value: 0, cssVariable: null };
      }
      this.#log('Parsed CSS unit for space-between', { value: trimmedValue, pixelValue });
      return { value: pixelValue, cssVariable: null };
    } catch (error) {
      this.#warn('Failed to parse CSS unit for space-between', { value: trimmedValue, error: error.message });
      return { value: 0, cssVariable: null };
    }
  }

  async #waitForSwiper(maxAttempts = 10, delay = 100) {
    let attempts = 0;
    while (!window.Swiper && attempts < maxAttempts) {
      this.#log(`Waiting for Swiper library, attempt ${attempts + 1}/${maxAttempts}`);
      await new Promise(resolve => setTimeout(resolve, delay));
      attempts++;
    }
    if (!window.Swiper) {
      this.#error('Swiper library failed to load after maximum attempts', { maxAttempts, elementId: this.id || 'no-id' });
      return false;
    }
    return true;
  }

  async initialize() {
    if (this.#isInitialized) {
      this.#log('Skipping initialization, already initialized', { elementId: this.id || 'no-id' });
      return;
    }
    this.#log('Starting initialization', { elementId: this.id || 'no-id' });

    // Wait for Swiper to load
    const swiperLoaded = await this.#waitForSwiper();
    if (!swiperLoaded) {
      return;
    }

    const hasPagination = this.hasAttribute('pagination');
    const hasNavigation = this.hasAttribute('navigation');
    const navigationIconLeft = hasNavigation ? this.getAttribute('navigation-icon-left') || '' : '';
    const navigationIconRight = hasNavigation ? this.getAttribute('navigation-icon-right') || '' : '';
    const slidesPerView = this.hasAttribute('slides-per-view') ? parseFloat(this.getAttribute('slides-per-view')) || 1 : 1;
    const spaceBetweenResult = await this.#parseSpaceBetween(this.getAttribute('space-between') || '0');
    const spaceBetween = spaceBetweenResult.value;
    const cssVariable = spaceBetweenResult.cssVariable;

    // Log spaceBetween value for debugging
    this.#log('Applying spaceBetween to Swiper', { spaceBetween, cssVariable });

    // Warn if navigation-icon-left or navigation-icon-right are used without navigation
    if (!hasNavigation && this.hasAttribute('navigation-icon-left')) {
      this.#warn('navigation-icon-left attribute ignored without navigation attribute', {
        elementId: this.id || 'no-id',
        navigationIconLeft
      });
    }
    if (!hasNavigation && this.hasAttribute('navigation-icon-right')) {
      this.#warn('navigation-icon-right attribute ignored without navigation attribute', {
        elementId: this.id || 'no-id',
        navigationIconRight
      });
    }

    // Create container for Swiper structure
    const container = document.createElement('div');
    container.classList.add('swiper');

    // Move children to swiper-wrapper
    const wrapper = document.createElement('div');
    wrapper.classList.add('swiper-wrapper');
    const slideCount = this.children.length;
    const customBlockCount = Array.from(this.children).filter(child => child.tagName.toLowerCase() === 'custom-block').length;
    Array.from(this.children).forEach(child => {
      if (!child.classList.contains('swiper-slide')) {
        const slide = document.createElement('div');
        slide.classList.add('swiper-slide');
        slide.appendChild(child);
        wrapper.appendChild(slide);
      } else {
        wrapper.appendChild(child);
      }
      this.#log('Added slide to wrapper', { childTag: child.tagName, hasCustomBlock: child.tagName.toLowerCase() === 'custom-block' });
    });
    container.appendChild(wrapper);
    this.#log('Slides processed', { slideCount, customBlockCount });

    // Add pagination if attribute is present
    if (hasPagination) {
      const pagination = document.createElement('div');
      pagination.classList.add('swiper-pagination');
      container.appendChild(pagination);
      this.#log('Pagination element added', { elementId: this.id || 'no-id' });
    }

    // Add navigation buttons if attribute is present
    if (hasNavigation) {
      const prev = document.createElement('div');
      prev.classList.add('swiper-button-prev');
      const next = document.createElement('div');
      next.classList.add('swiper-button-next');

      // Apply Font Awesome icons if valid, with fallback
      if (navigationIconLeft) {
        const validatedIconLeft = this.#validateIcon(navigationIconLeft, 'navigation-icon-left');
        prev.innerHTML = validatedIconLeft || '<i class="fa-solid fa-angle-left"></i>';
        if (validatedIconLeft) {
          this.#log('Left navigation button icon applied', { icon: validatedIconLeft, elementId: this.id || 'no-id' });
        } else {
          this.#log('Using fallback icon for navigation-icon-left', { icon: '<i class="fa-solid fa-angle-left"></i>', elementId: this.id || 'no-id' });
        }
      } else {
        prev.innerHTML = '<i class="fa-solid fa-angle-left"></i>';
        this.#log('No navigation-icon-left provided, using fallback', { icon: '<i class="fa-solid fa-angle-left"></i>', elementId: this.id || 'no-id' });
      }

      if (navigationIconRight) {
        const validatedIconRight = this.#validateIcon(navigationIconRight, 'navigation-icon-right');
        next.innerHTML = validatedIconRight || '<i class="fa-solid fa-angle-right"></i>';
        if (validatedIconRight) {
          this.#log('Right navigation button icon applied', { icon: validatedIconRight, elementId: this.id || 'no-id' });
        } else {
          this.#log('Using fallback icon for navigation-icon-right', { icon: '<i class="fa-solid fa-angle-right"></i>', elementId: this.id || 'no-id' });
        }
      } else {
        next.innerHTML = '<i class="fa-solid fa-angle-right"></i>';
        this.#log('No navigation-icon-right provided, using fallback', { icon: '<i class="fa-solid fa-angle-right"></i>', elementId: this.id || 'no-id' });
      }

      container.appendChild(prev);
      container.appendChild(next);
      this.#log('Navigation buttons added', { elementId: this.id || 'no-id' });
    }

    // Prepare Swiper options
    const options = {
      loop: true,
      slidesPerView: slidesPerView,
      spaceBetween: spaceBetween
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

    // Log final Swiper options for debugging
    this.#log('Final Swiper options', { options });

    // Replace <custom-slider> with the container
    try {
      this.replaceWith(container);
      this.#log('Replaced custom-slider with rendered container', { elementId: this.id || 'no-id', containerHtml: container.outerHTML.substring(0, 200) });

      // Initialize Swiper on the new container
      this.#swiperInstance = new Swiper(container, options);
      this.#log('Swiper initialized successfully', { 
        options, 
        hasPagination, 
        hasNavigation, 
        hasNavigationIconLeft: !!navigationIconLeft,
        hasNavigationIconRight: !!navigationIconRight 
      });

      // Override margin-right with original CSS variable if provided
      if (cssVariable) {
        const styleElement = document.createElement('style');
        styleElement.textContent = `
          .swiper-slide {
            margin-right: ${cssVariable} !important;
          }
        `;
        document.head.appendChild(styleElement);
        this.#log('Injected CSS variable for space-between', { cssVariable, style: styleElement.textContent });
      }

      this.#isInitialized = true;
    } catch (error) {
      this.#error('Failed to initialize Swiper or replace element', { error: error.message, stack: error.stack });
    }
  }

  connectedCallback() {
    this.#log('Connected to DOM', { elementId: this.id || 'no-id' });
    this.initialize();
  }

  disconnectedCallback() {
    this.#log('Disconnected from DOM', { elementId: this.id || 'no-id' });
    if (this.#swiperInstance) {
      this.#swiperInstance.destroy(true, true);
      this.#swiperInstance = null;
      this.#log('Swiper instance destroyed');
    }
    this.#isInitialized = false;
  }

  static get observedAttributes() {
    return ['pagination', 'navigation', 'navigation-icon-left', 'navigation-icon-right', 'slides-per-view', 'space-between'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue && this.#isInitialized) {
      this.#log('Attribute changed, reinitializing', { name, oldValue, newValue });
      this.#swiperInstance.destroy(true, true);
      this.#isInitialized = false;
      this.initialize();
    }
  }
}

try {
  customElements.define('custom-slider', CustomSlider);
} catch (error) {
  console.error('Error defining CustomSlider element:', error);
}

console.log('CustomSlider version: 2025-10-16');
export { CustomSlider };
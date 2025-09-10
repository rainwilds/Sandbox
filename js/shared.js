export const VALID_ALIGNMENTS = [
  'center', 'top', 'bottom', 'left', 'right',
  'top-left', 'top-center', 'top-right',
  'bottom-left', 'bottom-center', 'bottom-right',
  'center-left', 'center-right'
];

export const alignMap = {
  'center': 'place-self-center',
  'top': 'place-self-top',
  'bottom': 'place-self-bottom',
  'left': 'place-self-left',
  'right': 'place-self-right',
  'top-left': 'place-self-top-left',
  'top-center': 'place-self-top-center',
  'top-right': 'place-self-top-right',
  'bottom-left': 'place-self-bottom-left',
  'bottom-center': 'place-self-bottom-center',
  'bottom-right': 'place-self-bottom-right',
  'center-left': 'place-self-center-left',
  'center-right': 'place-self-center-right'
};

export const VALID_FETCH_PRIORITIES = ['high', 'low', 'auto', ''];
export const VALID_HEADING_TAGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
export const VALID_POSITIONS = ['none', 'top', 'bottom', 'left', 'right'];
export const VALID_BUTTON_TYPES = ['button', 'submit', 'reset'];
export const VALID_BUTTON_RELS = [
  'alternate', 'author', 'bookmark', 'external', 'help', 'license',
  'next', 'nofollow', 'noopener', 'noreferrer', 'prev', 'search', 'tag'
];
export const VALID_VIDEO_EXTENSIONS = ['mp4', 'webm'];
export const VALID_IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|webp|avif|jxl|svg)$/i;
export const IMAGE_WIDTHS = [768, 1024, 1366, 1920, 2560];
export const IMAGE_FORMATS = ['jxl', 'avif', 'webp', 'jpeg'];
export const SIZES_BREAKPOINTS = [
  { maxWidth: 768, baseValue: '100vw' },
  { maxWidth: 1024, baseValue: '100vw' },
  { maxWidth: 1366, baseValue: '100vw' },
  { maxWidth: 1920, baseValue: '100vw' },
  { maxWidth: 2560, baseValue: '100vw' }
];
export const DEFAULT_SIZE_VALUE = 3840;
export const BASE_PATH = './img/responsive/';
export const BACKDROP_FILTER_MAP = {
  'backdrop-filter-blur-small': 'blur(var(--blur-small))',
  'backdrop-filter-blur-medium': 'blur(var(--blur-medium))',
  'backdrop-filter-blur-large': 'blur(var(--blur-large))',
  'backdrop-filter-grayscale-small': 'grayscale(var(--grayscale-small))',
  'backdrop-filter-grayscale-medium': 'grayscale(var(--grayscale-medium))',
  'backdrop-filter-grayscale-large': 'grayscale(var(--grayscale-large))'
};

export function sanitizeClassNames(classString) {
  if (!classString) return '';
  return classString.split(/\s+/).filter(cls => /^[a-zA-Z0-9\-_]+$/.test(cls)).join(' ');
}

export function sanitizeStyles(styleString, allowedProperties) {
  if (!styleString) return '';
  const styleParts = styleString.split(';').map(s => s.trim()).filter(s => s);
  return styleParts.filter(part => {
    const [property] = part.split(':').map(s => s.trim());
    return allowedProperties.includes(property);
  }).join('; ');
}

export function validateCssLength(value, allowedUnits = ['px', 'rem', 'em', 'vh', 'vw']) {
  if (!value) return '';
  const match = value.match(/^(\d*\.?\d+)(px|rem|em|vh|vw)$/);
  return match && allowedUnits.includes(match[2]) ? value : '';
}

export function validateFontAwesomeIcon(iconString) {
  if (!iconString) return '';
  const parser = new DOMParser();
  const decodedIcon = iconString.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
  const doc = parser.parseFromString(decodedIcon, 'text/html');
  const iElement = doc.body.querySelector('i');
  if (!iElement || !iElement.className.includes('fa-')) {
    console.warn(`Invalid icon: "${iconString}". Must be a valid Font Awesome <i> tag.`);
    return '';
  }
  const validClasses = iElement.className.split(' ').filter(cls => cls.startsWith('fa-') || cls === 'fa-chisel');
  if (validClasses.length === 0) {
    console.warn(`Icon "${iconString}" contains no valid Font Awesome classes.`);
    return '';
  }
  return `<i class="${validClasses.join(' ')}"></i>`;
}

export function withLazyLoading(BaseClass) {
  return class extends BaseClass {
    constructor() {
      super();
      this.isVisible = false;
      this.isInitialized = false;
      this.observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          this.isVisible = true;
          this.observer.disconnect();
          this.observer = null;
          this.initialize();
        }
      }, { rootMargin: '50px' });
      this.observer.observe(this);
    }

    initialize() {
      if (this.isInitialized || !this.isVisible) return;
      this.isInitialized = true;
      super.initialize?.();
    }

    disconnectedCallback() {
      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
      }
      super.disconnectedCallback?.();
    }
  };
}

export function withRenderCaching(BaseClass) {
  return class extends BaseClass {
    static #renderCacheMap = new WeakMap();

    constructor() {
      super();
      this.renderCache = null;
      this.lastAttributes = null;
    }

    render(isFallback = false) {
      if (!isFallback && this.lastAttributes) {
        const attrString = JSON.stringify(this.getAttributes());
        if (CustomBlock.#renderCacheMap.has(this) && this.lastAttributes === attrString) {
          console.log('Using cached render:', this.tagName);
          return CustomBlock.#renderCacheMap.get(this).cloneNode(true);
        }
      }
      const element = super.render(isFallback);
      if (!isFallback) {
        CustomBlock.#renderCacheMap.set(this, element.cloneNode(true));
        this.lastAttributes = JSON.stringify(this.getAttributes());
      }
      return element;
    }

    disconnectedCallback() {
      CustomBlock.#renderCacheMap.delete(this);
      this.renderCache = null;
      this.lastAttributes = null;
      super.disconnectedCallback?.();
    }
  };
}
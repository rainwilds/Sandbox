import { GridPlacementMixin } from '../mixins/grid-placement.js';

class CustomLayout extends GridPlacementMixin(HTMLElement) {

  static dependencies = ['shared'];

  constructor() {
    super();
    this.isInitialized = false;
  }

  connectedCallback() {
    if (super.connectedCallback) super.connectedCallback();
    
    // CRITICAL FIX: Use a microtask instead of an animation frame. 
    // This forces Puppeteer to execute the wrapper synchronously 
    // during the build process before the unwrapper runs.
    Promise.resolve().then(() => {
        this.initialize();
    });
  }

  async initialize() {
    if (this.isInitialized) return;

    // Double-check if the visual builder is still constructing the children.
    if (this.children.length === 0) {
        await new Promise(r => setTimeout(r, 10));
    }

    this.isInitialized = true;

    // Prevent double-wrapping
    if (this.querySelector(':scope > section')) return;

    const section = document.createElement('section');
    const div = document.createElement('div');

    // Snapshot the actual HTML elements (ignoring invisible text/whitespace nodes)
    const currentChildren = Array.from(this.children);
    
    // Safely move the slider into the inner div
    for (const child of currentChildren) {
        div.appendChild(child);
    }

    section.appendChild(div);
    this.appendChild(section);

    const subgridAttr = this.getAttribute('subgrid');
    const useSubgrid = this.hasAttribute('subgrid') && subgridAttr !== 'false';

    if (useSubgrid) {
      div.style.gridTemplateColumns = 'subgrid';
    }
    else if (this.hasAttribute('min-col-width')) {
      let minWidth = this.getAttribute('min-col-width').trim();

      if (minWidth) {
        if (!minWidth.includes(',')) {
          minWidth = `${minWidth}, 1fr`;
        }
        div.style.gridTemplateColumns = `repeat(auto-fit, minmax(${minWidth}))`;
      }
    }
  }

  static get builderConfig() {
    return {
      isContainer: true,
      groups: {
        'Grid': ['subgrid', 'min-col-width', 'column-span']
      }
    };
  }
}

try {
  customElements.define('custom-layout', CustomLayout);
} catch (error) {
  console.error('Error defining CustomLayout element:', error);
}

export { CustomLayout };
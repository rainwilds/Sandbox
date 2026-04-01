import { GridPlacementMixin } from '../mixins/grid-placement.js';

/**
 * Boilerplate for Rainwilds Web Components
 * Rename `CustomTemplate` to your component's name (e.g., `CustomGallery`)
 */
class CustomTemplate extends GridPlacementMixin(HTMLElement) {
    constructor() {
        super();
        this.isInitialized = false;
    }

    // 1. Tell the Visual Builder how to display this in the sidebar
    static get builderConfig() {
        return {
            isContainer: false, // Set to true if you drop elements inside it
            groups: {
                'General Settings': ['my-custom-attr'],
                'Advanced Styling': ['another-attr']
            }
        };
    }

    // 2. Define attributes specific to THIS component
    static get observedAttributes() {
        const localAttrs = ['my-custom-attr', 'another-attr'];
        
        // CRITICAL: Merge local attributes with the Mixin's grid attributes
        return [...localAttrs, ...(super.observedAttributes || [])];
    }

    async connectedCallback() {
        if (super.connectedCallback) super.connectedCallback();
        
        if (!this.isInitialized) {
            await this.initialize();
        }
    }

    disconnectedCallback() {
        // Cleanup event listeners here
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (super.attributeChangedCallback) {
            super.attributeChangedCallback(name, oldValue, newValue);
        }
        if (oldValue === newValue) return;

        // Handle specific attribute updates here
    }

    async initialize() {
        this.isInitialized = true;
        // Component rendering logic
    }
}

try {
    customElements.define('custom-template', CustomTemplate);
} catch (error) {
    console.error('Error defining CustomTemplate element:', error);
}

export { CustomTemplate };
import { VIEWPORT_BREAKPOINTS } from '../shared.js';

export const GridPlacementMixin = (BaseClass) => class extends BaseClass {
    static get observedAttributes() {
        const baseAttrs = BaseClass.observedAttributes || [];
        const placementAttrs = ['column-start', 'column-end', 'row-start', 'row-end', 'z-index'];
        
        const breakpointNames = VIEWPORT_BREAKPOINTS.map(bp => bp.name);

        const responsiveAttrs = placementAttrs.flatMap(attr => 
            breakpointNames.map(bpName => `${attr}-${bpName}`)
        );
        
        return [...baseAttrs, ...placementAttrs, ...responsiveAttrs];
    }

    connectedCallback() {
        if (super.connectedCallback) super.connectedCallback();
        this.classList.add('grid-placement-item');
        this.#updateAllGridPlacements();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (super.attributeChangedCallback) {
            super.attributeChangedCallback(name, oldValue, newValue);
        }
        
        const isPlacementAttr = this.constructor.observedAttributes.includes(name) && 
            ['column-', 'row-', 'z-index'].some(prefix => name.startsWith(prefix));
            
        if (isPlacementAttr) {
            this.#updateGridPlacement(name, newValue);
        }
    }

    #updateGridPlacement(name, value) {
        const propName = `--${name}`;
        if (value) {
            this.style.setProperty(propName, value);
        } else {
            this.style.removeProperty(propName);
        }
    }

    #updateAllGridPlacements() {
        this.constructor.observedAttributes.forEach(attr => {
            if (['column-', 'row-', 'z-index'].some(prefix => attr.startsWith(prefix))) {
                this.#updateGridPlacement(attr, this.getAttribute(attr));
            }
        });
    }
};
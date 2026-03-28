class CustomLayout extends HTMLElement {
    static get observedAttributes() {
        return ['column-span', 'column-start', 'column-end'];
    }

    connectedCallback() {
        if (this.dataset.initialized) return;
        this.dataset.initialized = "true";

        // MAGIC FIX 1: The Builder Escape Hatch
        // If we are inside the visual builder, stop! Let the builder handle it natively.
        if (document.querySelector('visual-builder')) {
            return;
        }

        const section = document.createElement('section');
        const div = document.createElement('div');
        
        const colSpan = this.getAttribute('column-span');
        const colStart = this.getAttribute('column-start');
        const colEnd = this.getAttribute('column-end');

        if (colSpan) div.setAttribute('column-span', colSpan);
        if (colStart) div.setAttribute('column-start', colStart);
        if (colEnd) div.setAttribute('column-end', colEnd);

        while (this.firstChild) {
            div.appendChild(this.firstChild);
        }

        section.appendChild(div);
        this.replaceWith(section);
    }
}

customElements.define('custom-layout', CustomLayout);
export { CustomLayout };
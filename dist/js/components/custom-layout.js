class CustomLayout extends HTMLElement {
  connectedCallback() {
    // Prevent double-wrapping if moved in the DOM
    if (this.querySelector(':scope > section')) return;

    const section = document.createElement('section');
    const div = document.createElement('div');
    
    // Move all child components into the div
    while (this.firstChild) {
      div.appendChild(this.firstChild);
    }
    
    section.appendChild(div);
    this.appendChild(section);

    // Apply inline grid styles directly to the div
    div.style.display = 'grid';

    if (this.hasAttribute('subgrid')) {
      div.style.gridTemplateColumns = 'subgrid';
    } else if (this.hasAttribute('min-col-width')) {
      const minWidth = this.getAttribute('min-col-width');
      div.style.gridTemplateColumns = `repeat(auto-fit, minmax(${minWidth}, 1fr))`;
    }
  }
}

customElements.define('custom-layout', CustomLayout);
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

    // Apply grid logic
    div.style.display = 'grid';

    // Safely check for subgrid (ignoring if builder sets it to "false")
    const subgridAttr = this.getAttribute('subgrid');
    const useSubgrid = this.hasAttribute('subgrid') && subgridAttr !== 'false';

    if (useSubgrid) {
      div.style.gridTemplateColumns = 'subgrid';
    } 
    // If not subgrid, use min-col-width
    else if (this.hasAttribute('min-col-width')) {
      let minWidth = this.getAttribute('min-col-width').trim();
      
      if (minWidth) {
          // If user only types "300px", automatically add the 1fr fallback
          if (!minWidth.includes(',')) {
              minWidth = `${minWidth}, 1fr`;
          }
          div.style.gridTemplateColumns = `repeat(auto-fit, minmax(${minWidth}))`;
      }
    }
  }
}

customElements.define('custom-layout', CustomLayout);
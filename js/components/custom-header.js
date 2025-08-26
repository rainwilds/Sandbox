/* global CustomBlock, HTMLElement, document */
class CustomHeader extends CustomBlock {
    constructor() {
        super();
        // Set header-specific default attributes
        this.setAttribute('heading-tag', this.getAttribute('heading-tag') || 'h1');
        this.setAttribute('inner-alignment', this.getAttribute('inner-alignment') || 'center');
        this.setAttribute('text-alignment', this.getAttribute('text-alignment') || 'center');
        this.setAttribute('class', this.getAttribute('class') || 'padding-large');
        this.setAttribute('role', 'banner'); // Accessibility: headers use role="banner"
    }

    static get observedAttributes() {
        // Inherit all attributes from CustomBlock and add nav-links
        return [...super.observedAttributes, 'nav-links'];
    }

    getAttributes() {
        // Extend getAttributes to include nav-links
        const attrs = super.getAttributes();
        attrs.navLinks = this.getAttribute('nav-links') ? JSON.parse(this.getAttribute('nav-links')) : null;
        
        // Warn if primary images/videos are used, as headers typically use background media
        if (attrs.primarySrc || attrs.primaryLightSrc || attrs.primaryDarkSrc || attrs.videoPrimarySrc) {
            console.warn('Primary images or videos are not recommended for headers in <custom-header>. Consider using background media.');
            attrs.primaryPosition = 'none'; // Override to prevent primary media
        }

        return attrs;
    }

    render(isFallback = false) {
        const attrs = this.getAttributes();

        // Create the header element
        const headerElement = document.createElement('header');
        headerElement.setAttribute('role', 'banner');

        // Get the base block content from CustomBlock
        const blockElement = super.render(isFallback);
        if (!blockElement) {
            console.error('Failed to render base CustomBlock for CustomHeader');
            return headerElement;
        }

        // Combine header classes, excluding 'header' class
        const headerClasses = [
            attrs.backgroundColorClass,
            attrs.borderClass,
            attrs.borderRadiusClass,
            attrs.shadowClass,
            ...attrs.customClasses.split(' ').filter(cls => cls)
        ].filter(cls => cls).join(' ').trim();
        if (headerClasses) {
            headerElement.className = headerClasses;
        }

        // Transfer styles from block to header
        if (attrs.styleAttribute && !isFallback) {
            headerElement.setAttribute('style', attrs.styleAttribute);
        }

        // Add navigation if nav-links attribute is provided
        let navHTML = '';
        if (attrs.navLinks && Array.isArray(attrs.navLinks) && !isFallback) {
            navHTML = `
                <nav aria-label="Main navigation">
                    <ul class="nav-links">
                        ${attrs.navLinks.map(link => `
                            <li><a href="${link.href || '#'}"${link.href ? '' : ' aria-disabled="true"'}>${link.text || 'Link'}</a></li>
                        `).join('')}
                    </ul>
                </nav>
            `;
        }

        // Combine content: place nav after block content
        headerElement.innerHTML = blockElement.innerHTML + navHTML;

        // Cache the result
        if (!isFallback) {
            CustomBlock.#renderCacheMap.set(this, headerElement.cloneNode(true));
            this.lastAttributes = JSON.stringify(attrs);
        }

        return headerElement;
    }

    connectedCallback() {
        super.connectedCallback();
    }

    attributeChangedCallback(name, oldValue, newValue) {
        super.attributeChangedCallback(name, oldValue, newValue);
        // Re-render on nav-links change
        if (name === 'nav-links' && this.isInitialized && this.isVisible) {
            this.initialize();
        }
    }
}

try {
    customElements.define('custom-header', CustomHeader);
} catch (error) {
    console.error('Error defining CustomHeader element:', error);
}

console.log('CustomHeader version: 2025-08-27');
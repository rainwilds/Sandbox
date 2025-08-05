import { generatePictureMarkup } from '../picture-generator.js';

class CustomCard extends HTMLElement {
    constructor() {
        super();
        this.isVisible = false;
        this.isInitialized = false;
        this.callbacks = [];
        // Set up IntersectionObserver for lazy loading
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                this.isVisible = true;
                observer.disconnect();
                if (!this.isInitialized) {
                    this.connectedCallback();
                }
            }
        }, { rootMargin: '50px' });
        observer.observe(this);
    }

    connectedCallback() {
        if (this.isInitialized || !this.isVisible) return;
        this.isInitialized = true;

        try {
            const cardElement = this.render();
            this.replaceWith(cardElement);
            this.callbacks.forEach(callback => callback());
        } catch (error) {
            console.error('Error in CustomCard connectedCallback:', error);
            this.replaceWith(this.renderFallback());
        }
    }

    disconnectedCallback() {
        this.callbacks = [];
        this.isInitialized = false; // Reset flag on disconnect
    }

    addCallback(callback) {
        this.callbacks.push(callback);
    }



    renderFallback() {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.innerHTML = `
            <hgroup>
                <h2>Error</h2>
                <p>Failed to render card. Check console for details.</p>
            </hgroup>
            <a class="button" href="#">Button</a>
        `;
        return cardElement;
    }

    static get observedAttributes() {
        return [
            'heading', 'description', 'button-href', 'button-text', 'background-overlay', 'background-color', 'border', 'border-radius', 'backdrop-filter', 'class', 'style',
            'image-light-src', 'image-dark-src', 'image-alt', 'image-decorative', 'image-mobile-width', 'image-tablet-width', 'image-desktop-width', 'image-aspect-ratio', 'image-include-schema', 'image-fetchpriority', 'image-loading'
        ];
    }

    attributeChangedCallback() {
        if (this.isInitialized || !this.isVisible) return;
        this.connectedCallback();
    }
}

// Register the custom element
try {
    customElements.define('custom-card', CustomCard);
} catch (error) {
    console.error('Error defining CustomCard element:', error);
}
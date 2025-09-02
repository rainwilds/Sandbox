class CustomLogo extends HTMLElement {
    static get observedAttributes() {
        return [
            'logo-primary-src',
            'logo-light-src',
            'logo-dark-src',
            'logo-primary-alt',
            'logo-light-alt',
            'logo-dark-alt',
            'logo-position'
        ];
    }

    getAttributes() {
        const attrs = {};
        attrs.logoPrimarySrc = this.getAttribute('logo-primary-src') || '';
        attrs.logoLightSrc = this.getAttribute('logo-light-src') || '';
        attrs.logoDarkSrc = this.getAttribute('logo-dark-src') || '';
        attrs.logoPrimaryAlt = this.getAttribute('logo-primary-alt') || '';
        attrs.logoLightAlt = this.getAttribute('logo-light-alt') || '';
        attrs.logoDarkAlt = this.getAttribute('logo-dark-alt') || '';
        attrs.logoPosition = this.getAttribute('logo-position') || '';

        // Validation (from original CustomHeader)
        if ((attrs.logoLightSrc || attrs.logoDarkSrc) && !(attrs.logoLightSrc && attrs.logoDarkSrc)) {
            console.error('Both logo-light-src and logo-dark-src must be provided when using light/dark themes.');
        }
        if (attrs.logoPrimarySrc && !attrs.logoPrimaryAlt) {
            console.error('logo-primary-alt is required when logo-primary-src is provided.');
        }
        if (attrs.logoLightSrc && !attrs.logoLightAlt) {
            console.error('logo-light-alt is required when logo-light-src is provided.');
        }
        if (attrs.logoDarkSrc && !attrs.logoDarkAlt) {
            console.error('logo-dark-alt is required when logo-dark-src is provided.');
        }
        const validPositions = ['center', 'top', 'bottom', 'left', 'right', 'top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right', 'center-left', 'center-right'];
        if (attrs.logoPosition && !validPositions.includes(attrs.logoPosition)) {
            console.warn(`Invalid logo-position "${attrs.logoPosition}". Ignoring.`);
            attrs.logoPosition = '';
        }

        return attrs;
    }

    render() {
        const attrs = this.getAttributes();
        const alignMap = {
            center: 'place-self-center',
            'top-center': 'place-self-top-center',
            // ... other mappings
            right: 'place-self-right'
        };
        let logoHTML = '';
        if (attrs.logoPrimarySrc || (attrs.logoLightSrc && attrs.logoDarkSrc)) {
            const logoMarkup = this.generatePictureMarkup({
                src: attrs.logoPrimarySrc || attrs.logoLightSrc,
                lightSrc: attrs.logoLightSrc || attrs.logoPrimarySrc,
                darkSrc: attrs.logoDarkSrc || attrs.logoPrimarySrc,
                alt: attrs.logoPrimaryAlt || attrs.logoLightAlt,
                isDecorative: !attrs.logoPrimaryAlt && !attrs.logoLightAlt,
                customClasses: `logo logo-${attrs.logoPosition || 'right'}`,
                loading: 'eager',
                fetchPriority: 'high',
                noResponsive: true
            });
            logoHTML = `
                <div${attrs.logoPosition ? ` class="${alignMap[attrs.logoPosition]}"` : ''} style="z-index: 100;">
                    <a href="/">${logoMarkup}</a>
                </div>
            `;
        }
        this.innerHTML = logoHTML;
    }

    // Assume generatePictureMarkup is available (e.g., from CustomBlock or imported utility)
    generatePictureMarkup({ src, lightSrc, darkSrc, alt, isDecorative, customClasses, loading, fetchPriority, noResponsive }) {
        // Simplified example; reuse CustomBlock's implementation
        return `
            <picture class="${customClasses}">
                ${lightSrc && darkSrc ? `
                    <source media="(prefers-color-scheme: dark)" srcset="${darkSrc}">
                    <source media="(prefers-color-scheme: light)" srcset="${lightSrc}">
                ` : ''}
                <img src="${src}" alt="${alt}"${isDecorative ? ' aria-hidden="true"' : ''} loading="${loading}" fetchpriority="${fetchPriority}"${noResponsive ? '' : ' width="100" height="100"'}>
            </picture>
        `;
    }

    connectedCallback() {
        this.render();
    }

    attributeChangedCallback() {
        if (this.isConnected) {
            this.render();
        }
    }
}
customElements.define('custom-logo', CustomLogo);
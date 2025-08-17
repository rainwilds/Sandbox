render(isFallback = false) {
    if (!isFallback) {
        const attrString = JSON.stringify(this.getAttributes());
        if (this.renderCache && this.lastAttributes === attrString) {
            return this.renderCache.cloneNode(true);
        }
    }

    const attrs = isFallback ? {
        sectionTitle: false,
        heading: 'Error',
        headingTag: 'h2',
        description: 'Failed to render block. Check console for details.',
        buttonHref: '#',
        buttonText: '',
        hasBackgroundOverlay: false,
        backgroundOverlayClass: '',
        backgroundImageNoise: false,
        backdropFilterClasses: [],
        backgroundColorClass: '',
        borderClass: '',
        borderRadiusClass: '',
        customClasses: '',
        styleAttribute: '',
        backgroundLightSrc: '',
        backgroundDarkSrc: '',
        backgroundAlt: '',
        backgroundIsDecorative: false,
        backgroundMobileWidth: '100vw',
        backgroundTabletWidth: '100vw',
        backgroundDesktopWidth: '100vw',
        backgroundAspectRatio: '',
        backgroundIncludeSchema: false,
        backgroundFetchPriority: '',
        backgroundLoading: 'lazy',
        foregroundLightSrc: '',
        foregroundDarkSrc: '',
        foregroundAlt: '',
        foregroundIsDecorative: false,
        foregroundMobileWidth: '100vw',
        foregroundTabletWidth: '100vw',
        foregroundDesktopWidth: '100vw',
        foregroundAspectRatio: '',
        foregroundIncludeSchema: false,
        foregroundFetchPriority: '',
        foregroundLoading: 'lazy',
        foregroundPosition: 'none',
        innerBackgroundColorClass: '',
        innerBackgroundImageNoise: false,
        innerBackdropFilterClasses: [],
        innerBorderClass: '',
        innerBorderRadiusClass: '',
        innerStyle: ''
    } : this.getAttributes();

    if (!attrs.backgroundAlt && !attrs.backgroundIsDecorative && (attrs.backgroundLightSrc || attrs.backgroundDarkSrc)) {
        console.warn(`<custom-block custom-img-background-light-src="${attrs.backgroundLightSrc || 'not provided'}" custom-img-background-dark-src="${attrs.backgroundDarkSrc || 'not provided'}"> is missing a custom-img-background-alt attribute for accessibility.`);
    }
    if (!attrs.foregroundAlt && !attrs.foregroundIsDecorative && (attrs.foregroundLightSrc || attrs.foregroundDarkSrc)) {
        console.warn(`<custom-block custom-img-foreground-light-src="${attrs.foregroundLightSrc || 'not provided'}" custom-img-foreground-dark-src="${attrs.foregroundDarkSrc || 'not provided'}"> is missing a custom-img-foreground-alt attribute for accessibility.`);
    }

    let backgroundImageHTML = '';
    let foregroundImageHTML = '';
    let overlayHTML = '';
    const hasBackgroundImage = !isFallback && !!(attrs.backgroundLightSrc || attrs.backgroundDarkSrc);
    const hasForegroundImage = !isFallback && !!(attrs.foregroundLightSrc || attrs.foregroundDarkSrc) && ['above', 'below', 'left', 'right'].includes(attrs.foregroundPosition);

    if (hasBackgroundImage) {
        const src = attrs.backgroundLightSrc || attrs.backgroundDarkSrc;
        if (!src) {
            console.warn('No valid background image source provided for <custom-block>. Skipping background image rendering.');
        } else {
            backgroundImageHTML = generatePictureMarkup({
                src,
                lightSrc: attrs.backgroundLightSrc,
                darkSrc: attrs.backgroundDarkSrc,
                alt: attrs.backgroundAlt,
                isDecorative: attrs.backgroundIsDecorative,
                mobileWidth: attrs.backgroundMobileWidth,
                tabletWidth: attrs.backgroundTabletWidth,
                desktopWidth: attrs.backgroundDesktopWidth,
                aspectRatio: attrs.backgroundAspectRatio,
                includeSchema: attrs.backgroundIncludeSchema,
                customClasses: '',
                loading: attrs.backgroundLoading,
                fetchPriority: attrs.backgroundFetchPriority,
                onerror: `this.src='https://placehold.co/3000x2000';${attrs.backgroundIsDecorative ? '' : `this.alt='${attrs.backgroundAlt || 'Placeholder image'}';`}this.onerror=null;`
            });
            if (!backgroundImageHTML) {
                console.warn('Failed to generate picture markup for background image in <custom-block>.');
            }
        }
    }

    if (hasForegroundImage) {
        const src = attrs.foregroundLightSrc || attrs.foregroundDarkSrc;
        if (!src) {
            console.warn('No valid foreground image source provided for <custom-block>. Skipping foreground image rendering.');
        } else {
            foregroundImageHTML = generatePictureMarkup({
                src,
                lightSrc: attrs.foregroundLightSrc,
                darkSrc: attrs.foregroundDarkSrc,
                alt: attrs.foregroundAlt,
                isDecorative: attrs.foregroundIsDecorative,
                mobileWidth: attrs.foregroundMobileWidth,
                tabletWidth: attrs.foregroundTabletWidth,
                desktopWidth: attrs.foregroundDesktopWidth,
                aspectRatio: attrs.foregroundAspectRatio,
                includeSchema: attrs.foregroundIncludeSchema,
                customClasses: '',
                loading: attrs.foregroundLoading,
                fetchPriority: attrs.foregroundFetchPriority,
                onerror: `this.src='https://placehold.co/3000x2000';${attrs.foregroundIsDecorative ? '' : `this.alt='${attrs.foregroundAlt || 'Placeholder image'}';`}this.onerror=null;`
            });
            if (!foregroundImageHTML) {
                console.warn('Failed to generate picture markup for foreground image in <custom-block>.');
            }
        }
    }

    if (!isFallback && attrs.hasBackgroundOverlay && hasBackgroundImage) {
        // Map backdrop-filter classes to CSS values
        const backdropFilterMap = {
            'backdrop-filter-blur-small': 'blur(var(--blur-small))',
            'backdrop-filter-blur-medium': 'blur(var(--blur-medium))',
            'backdrop-filter-blur-large': 'blur(var(--blur-large))',
            'backdrop-filter-grayscale-small': 'grayscale(var(--grayscale-small))',
            'backdrop-filter-grayscale-medium': 'grayscale(var(--grayscale-medium))',
            'backdrop-filter-grayscale-large': 'grayscale(var(--grayscale-large))',
            'backdrop-filter-sepia': 'sepia(100%)',
            'backdrop-filter-brightness': 'brightness(0.5)',
            // Add more mappings as needed
        };

        // Filter out backdrop-filter classes and combine their CSS values
        const backdropFilterValues = attrs.backdropFilterClasses
            .filter(cls => cls.startsWith('backdrop-filter-'))
            .map(cls => backdropFilterMap[cls] || '')
            .filter(val => val);

        // Combine into a single backdrop-filter rule
        const backdropFilterStyle = backdropFilterValues.length > 0
            ? `backdrop-filter: ${backdropFilterValues.join(' ')};`
            : '';

        // Keep non-backdrop-filter classes
        const overlayClasses = [attrs.backgroundOverlayClass];
        if (attrs.backgroundImageNoise) {
            overlayClasses.push('background-image-noise');
        }
        const nonBackdropClasses = attrs.backdropFilterClasses
            .filter(cls => !cls.startsWith('backdrop-filter-'));

        overlayClasses.push(...nonBackdropClasses);

        const overlayClassString = overlayClasses.filter(cls => cls).join(' ').trim();
        const overlayStyle = backdropFilterStyle ? ` style="${backdropFilterStyle}"` : '';
        overlayHTML = `<div class="${overlayClassString}"${overlayStyle}></div>`;
    }

    const paddingClasses = ['padding-small', 'padding-medium', 'padding-large'];
    const customClassList = attrs.customClasses.split(' ').filter(cls => cls && !paddingClasses.includes(cls));
    const innerPaddingClasses = attrs.customClasses.split(' ').filter(cls => cls && paddingClasses.includes(cls));

    let outerStyles = attrs.styleAttribute || '';
    let paddingStyles = '';
    if (!isFallback && outerStyles) {
        const paddingRegex = /(padding[^:]*:[^;]+;)/gi;
        const paddingMatches = outerStyles.match(paddingRegex) || [];
        paddingStyles = paddingMatches.join(' ').trim();
        outerStyles = outerStyles.replace(paddingRegex, '').trim();
    }

    const innerDivClassList = [];
    if (!isFallback) {
        innerDivClassList.push(...innerPaddingClasses);
        if (attrs.customClasses.includes('space-between')) innerDivClassList.push('space-between');
        if (attrs.innerBackgroundColorClass) innerDivClassList.push(attrs.innerBackgroundColorClass);
        if (attrs.innerBackgroundImageNoise) innerDivClassList.push('background-image-noise');
        if (attrs.innerBorderClass) innerDivClassList.push(attrs.innerBorderClass);
        if (attrs.innerBorderRadiusClass) innerDivClassList.push(attrs.innerBorderRadiusClass);
        const nonInnerBackdropClasses = attrs.innerBackdropFilterClasses
            .filter(cls => !cls.startsWith('backdrop-filter-'));
        innerDivClassList.push(...nonInnerBackdropClasses);
    }

    // Map inner backdrop-filter classes to CSS values
    const backdropFilterMap = {
        'backdrop-filter-blur-small': 'blur(var(--blur-small))',
        'backdrop-filter-blur-medium': 'blur(var(--blur-medium))',
        'backdrop-filter-blur-large': 'blur(var(--blur-large))',
        'backdrop-filter-grayscale-small': 'grayscale(var(--grayscale-small))',
        'backdrop-filter-grayscale-medium': 'grayscale(var(--grayscale-medium))',
        'backdrop-filter-grayscale-large': 'grayscale(var(--grayscale-large))',
        'backdrop-filter-sepia': 'sepia(100%)',
        'backdrop-filter-brightness': 'brightness(0.5)',
        // Add more mappings as needed
    };

    const innerBackdropFilterValues = attrs.innerBackdropFilterClasses
        .filter(cls => cls.startsWith('backdrop-filter-'))
        .map(cls => backdropFilterMap[cls] || '')
        .filter(val => val);

    const innerBackdropFilterStyle = innerBackdropFilterValues.length > 0
        ? `backdrop-filter: ${innerBackdropFilterValues.join(' ')};`
        : '';

    const innerDivClass = innerDivClassList.join(' ').trim();

    let innerDivStyle = '';
    if (!isFallback) {
        const combinedStyles = [paddingStyles, attrs.innerStyle, innerBackdropFilterStyle]
            .filter(s => s)
            .join('; ')
            .trim();
        innerDivStyle = combinedStyles ? ` style="${combinedStyles}"` : '';
    }

    const buttonHTML = attrs.buttonText ?
        `<a class="button" href="${attrs.buttonHref || '#'}"${attrs.buttonHref && !isFallback ? '' : ' aria-disabled="true"'}>${attrs.buttonText}</a>` :
        '';

    const contentHTML = `
        <div${innerDivClass ? ` class="${innerDivClass}"` : ''}${innerDivStyle} aria-live="polite">
            <div role="group">
                <${attrs.headingTag}>${attrs.heading}</${attrs.headingTag}>
                <p>${attrs.description}</p>
            </div>
            ${buttonHTML}
        </div>
    `;

    const mainDivClassList = ['block'];
    if (hasBackgroundImage) mainDivClassList.push('background-image');
    mainDivClassList.push(...customClassList, attrs.backgroundColorClass, attrs.borderClass, attrs.borderRadiusClass);
    const mainDivClass = mainDivClassList.filter(cls => cls).join(' ').trim();

    const blockElement = document.createElement('div');
    blockElement.className = mainDivClass;
    if (outerStyles && !isFallback) {
        blockElement.setAttribute('style', outerStyles);
    }
    if (!isFallback && hasForegroundImage) {
        blockElement.setAttribute('data-foreground-position', attrs.foregroundPosition);
    }
    if (!isFallback && attrs.sectionTitle) {
        blockElement.setAttribute('data-section-title', 'true');
    }

    let innerHTML = '';
    if (hasBackgroundImage) {
        innerHTML += backgroundImageHTML || '';
    }
    if (attrs.hasBackgroundOverlay && hasBackgroundImage) {
        innerHTML += overlayHTML;
    }
    if (hasForegroundImage && attrs.foregroundPosition === 'above') {
        innerHTML += foregroundImageHTML || '';
    }
    if (hasForegroundImage && attrs.foregroundPosition === 'left') {
        innerHTML += (foregroundImageHTML || '') + contentHTML;
    } else if (hasForegroundImage && attrs.foregroundPosition === 'right') {
        innerHTML += contentHTML + (foregroundImageHTML || '');
    } else {
        innerHTML += contentHTML;
    }
    if (hasForegroundImage && attrs.foregroundPosition === 'below') {
        innerHTML += foregroundImageHTML || '';
    }

    blockElement.innerHTML = innerHTML;

    if (!isFallback && attrs.backgroundIncludeSchema && hasBackgroundImage && backgroundImageHTML) {
        const figure = blockElement.querySelector('figure:not(figure > figure)');
        if (figure) {
            const metaUrl = document.createElement('meta');
            metaUrl.setAttribute('itemprop', 'url');
            metaUrl.setAttribute('content', (attrs.backgroundLightSrc || attrs.backgroundDarkSrc) ? new URL(attrs.backgroundLightSrc || attrs.backgroundDarkSrc, window.location.origin).href : '');
            figure.appendChild(metaUrl);

            const metaDescription = document.createElement('meta');
            metaDescription.setAttribute('itemprop', 'description');
            metaDescription.setAttribute('content', attrs.backgroundAlt);
            figure.appendChild(metaDescription);
        }
    }

    if (!isFallback && attrs.foregroundIncludeSchema && hasForegroundImage && foregroundImageHTML) {
        const figure = blockElement.querySelector('figure');
        if (figure) {
            const metaUrl = document.createElement('meta');
            metaUrl.setAttribute('itemprop', 'url');
            metaUrl.setAttribute('content', (attrs.foregroundLightSrc || attrs.foregroundDarkSrc) ? new URL(attrs.foregroundLightSrc || attrs.foregroundDarkSrc, window.location.origin).href : '');
            figure.appendChild(metaUrl);

            const metaDescription = document.createElement('meta');
            metaDescription.setAttribute('itemprop', 'description');
            metaDescription.setAttribute('content', attrs.foregroundAlt);
            figure.appendChild(metaDescription);
        }
    }

    if (!isFallback && blockElement.querySelector('img')) {
        const images = blockElement.querySelectorAll('img');
        images.forEach(img => {
            img.removeAttribute('custom-img-background-light-src');
            img.removeAttribute('custom-img-background-dark-src');
            img.removeAttribute('custom-img-background-alt');
            img.removeAttribute('custom-img-background-decorative');
            img.removeAttribute('custom-img-background-mobile-width');
            img.removeAttribute('custom-img-background-tablet-width');
            img.removeAttribute('custom-img-background-desktop-width');
            img.removeAttribute('custom-img-background-aspect-ratio');
            img.removeAttribute('custom-img-background-include-schema');
            img.removeAttribute('custom-img-background-fetchpriority');
            img.removeAttribute('custom-img-background-loading');
            img.removeAttribute('custom-img-foreground-light-src');
            img.removeAttribute('custom-img-foreground-dark-src');
            img.removeAttribute('custom-img-foreground-alt');
            img.removeAttribute('custom-img-foreground-decorative');
            img.removeAttribute('custom-img-foreground-mobile-width');
            img.removeAttribute('custom-img-foreground-tablet-width');
            img.removeAttribute('custom-img-foreground-desktop-width');
            img.removeAttribute('custom-img-foreground-aspect-ratio');
            img.removeAttribute('custom-img-foreground-include-schema');
            img.removeAttribute('custom-img-foreground-fetchpriority');
            img.removeAttribute('custom-img-foreground-loading');
            img.removeAttribute('custom-img-foreground-position');
        });
    }

    if (!isFallback) {
        this.renderCache = blockElement.cloneNode(true);
        this.lastAttributes = JSON.stringify(attrs);
    }
    return blockElement;
}
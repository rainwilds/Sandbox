const ImageShared = {
    // Configuration constants
    WIDTHS: [768, 980, 1366, 1920, 2560, 3840],
    FORMATS: ['avif', 'webp', 'jpeg'],
    VALID_ASPECT_RATIOS: ['16/9', '9/16', '3/2', '2/3', '1/1'],
    SIZES_BREAKPOINTS: [
        { maxWidth: 768, baseValue: '100vw' },
        { maxWidth: 980, baseValue: '100vw' },
        { maxWidth: 1366, baseValue: '100vw' },
        { maxWidth: 1920, baseValue: '100vw' },
        { maxWidth: 2560, baseValue: '100vw' },
        { maxWidth: 3840, baseValue: '100vw' },
    ],
    DEFAULT_SIZE: '3840px',

    generatePictureMarkup({ src, lightSrc, darkSrc, alt = '', width = '100vw', aspectRatio = '' }) {
        if (!src) {
            console.error('The "src" parameter is required for generatePictureMarkup');
            return '';
        }

        // Extract base filename from src
        let baseFilename = src.split('/').pop().split('.')[0];
        if (!baseFilename) {
            console.error('Invalid "src" parameter: unable to extract base filename');
            return '';
        }

        // Extract base filenames for light and dark themes (if provided)
        let lightBaseFilename = lightSrc ? lightSrc.split('/').pop().split('.')[0] : null;
        let darkBaseFilename = darkSrc ? darkSrc.split('/').pop().split('.')[0] : null;

        if (lightSrc && !lightBaseFilename) {
            console.error('Invalid "light-src" parameter: unable to extract base filename');
            return '';
        }
        if (darkSrc && !darkBaseFilename) {
            console.error('Invalid "dark-src" parameter: unable to extract base filename');
            return '';
        }

        // Parse width (e.g., "100vw" or "50vw")
        const widthMatch = width.match(/(\d+)vw/);
        let widthPercentage = widthMatch ? parseInt(widthMatch[1]) / 100 : 1.0;
        widthPercentage = Math.max(0.1, Math.min(2.0, widthPercentage));

        // Generate sizes attribute
        const sizes = [
            ...this.SIZES_BREAKPOINTS.map(bp => `(max-width: ${bp.maxWidth}px) ${widthPercentage * 100}vw`),
            `${parseInt(this.DEFAULT_SIZE) * widthPercentage}px`
        ].join(', ');

        // Build the <picture> element HTML
        let pictureHTML = '<picture class="animate animate-fade-in">';

        // Add <source> elements for each format
        this.FORMATS.forEach(format => {
            if (lightSrc && darkSrc) {
                // Source for light theme
                const srcsetLight = this.WIDTHS.map(w => `./img/responsive/${lightBaseFilename}-${w}.${format} ${w}w`).join(', ');
                pictureHTML += `
                    <source srcset="${srcsetLight}" sizes="${sizes}" type="image/${format}" media="(prefers-color-scheme: light)">
                `;

                // Source for dark theme
                const srcsetDark = this.WIDTHS.map(w => `./img/responsive/${darkBaseFilename}-${w}.${format} ${w}w`).join(', ');
                pictureHTML += `
                    <source srcset="${srcsetDark}" sizes="${sizes}" type="image/${format}" media="(prefers-color-scheme: dark)">
                `;
            }

            // Default source
            const srcset = this.WIDTHS.map(w => `./img/responsive/${baseFilename}-${w}.${format} ${w}w`).join(', ');
            pictureHTML += `
                <source srcset="${srcset}" sizes="${sizes}" type="image/${format}">
            `;
        });

        // Add <img> element
        let imgClasses = [];
        if (aspectRatio && this.VALID_ASPECT_RATIOS.includes(aspectRatio)) {
            const aspectRatioClass = `aspect-ratio-${aspectRatio.replace('/', '-')}`;
            imgClasses.push(aspectRatioClass);
        }
        const imgClassAttr = imgClasses.length > 0 ? ` class="${imgClasses.join(' ')}"` : '';
        const altAttr = alt ? ` alt="${alt}"` : '';
        pictureHTML += `
            <img src="${src}"${imgClassAttr}${altAttr} loading="lazy">
        `;
        pictureHTML += '</picture>';

        return pictureHTML;
    }
};
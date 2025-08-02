export const WIDTHS = [768, 1024, 1366, 1920, 2560];
export const FORMATS = ['jxl', 'avif', 'webp', 'jpeg'];
export const VALID_ASPECT_RATIOS = ['16/9', '9/16', '3/2', '2/3', '1/1', '21/9'];
export const SIZES_BREAKPOINTS = [
    { maxWidth: 768, baseValue: '100vw' },
    { maxWidth: 1024, baseValue: '100vw' },
    { maxWidth: 1366, baseValue: '100vw' },
    { maxWidth: 1920, baseValue: '100vw' },
    { maxWidth: 2560, baseValue: '100vw' },
];
export const DEFAULT_SIZE = '3840px';

export function generatePictureMarkup({
    src,
    lightSrc = '',
    darkSrc = '',
    alt = '',
    isDecorative = false,
    mobileWidth = '100vw',
    tabletWidth = '100vw',
    desktopWidth = '100vw',
    aspectRatio = '',
    includeSchema = false,
    customClasses = '',
    loading = 'lazy',
    fetchPriority = ''
} = {}) {
    if (!src) {
        console.error('The "src" parameter is required for generatePictureMarkup');
        return '';
    }

    // Extract base filenames
    let baseFilename = src.split('/').pop().split('.')[0].replace(/-\d+(px)?$/, '');
    let lightBaseFilename = lightSrc ? lightSrc.split('/').pop().split('.')[0].replace(/-\d+(px)?$/, '') : null;
    let darkBaseFilename = darkSrc ? darkSrc.split('/').pop().split('.')[0].replace(/-\d+(px)?$/, '') : null;

    if (lightSrc && !lightBaseFilename) {
        console.error('Invalid "lightSrc" parameter');
        return '';
    }
    if (darkSrc && !darkBaseFilename) {
        console.error('Invalid "darkSrc" parameter');
        return '';
    }

    // Parse widths to percentages
    const parseWidth = (widthStr) => {
        const vwMatch = widthStr.match(/(\d+)vw/);
        if (vwMatch) return parseInt(vwMatch[1]) / 100;
        const pxMatch = widthStr.match(/(\d+)px/);
        if (pxMatch) return parseInt(pxMatch[1]) / window.innerWidth;
        return 1.0;
    };
    let mobilePercentage = Math.max(0.1, Math.min(2.0, parseWidth(mobileWidth)));
    let tabletPercentage = Math.max(0.1, Math.min(2.0, parseWidth(tabletWidth)));
    let desktopPercentage = Math.max(0.1, Math.min(2.0, parseWidth(desktopWidth)));

    // Generate sizes attribute
    const sizes = [
        ...SIZES_BREAKPOINTS.map(bp => {
            const percentage = bp.maxWidth <= 768 ? mobilePercentage : (bp.maxWidth <= 1024 ? tabletPercentage : desktopPercentage);
            return `(max-width: ${bp.maxWidth}px) ${percentage * 100}vw`;
        }),
        `${parseInt(DEFAULT_SIZE) * desktopPercentage}px`
    ].join(', ');

    // Build picture HTML
    let pictureHTML = '<picture class="animate animate-fade-in">';

    FORMATS.forEach(format => {
        if (lightSrc && darkSrc) {
            const srcsetLight = [
                `./img/responsive/${lightBaseFilename}.${format} 3840w`,
                ...WIDTHS.map(w => `./img/responsive/${lightBaseFilename}-${w}.${format} ${w}w`)
            ].join(', ');
            pictureHTML += `<source srcset="${srcsetLight}" sizes="${sizes}" type="image/${format}" media="(prefers-color-scheme: light)">`;

            const srcsetDark = [
                `./img/responsive/${darkBaseFilename}.${format} 3840w`,
                ...WIDTHS.map(w => `./img/responsive/${darkBaseFilename}-${w}.${format} ${w}w`)
            ].join(', ');
            pictureHTML += `<source srcset="${srcsetDark}" sizes="${sizes}" type="image/${format}" media="(prefers-color-scheme: dark)">`;
        }

        const srcset = [
            `./img/responsive/${baseFilename}.${format} 3840w`,
            ...WIDTHS.map(w => `./img/responsive/${baseFilename}-${w}.${format} ${w}w`)
        ].join(', ');
        pictureHTML += `<source srcset="${srcset}" sizes="${sizes}" type="image/${format}">`;
    });

    // Add img element
    let imgClasses = [...new Set(customClasses.split(' ').filter(Boolean))];
    if (aspectRatio && VALID_ASPECT_RATIOS.includes(aspectRatio)) {
        imgClasses.push(`aspect-ratio-${aspectRatio.replace('/', '-')}`);
    }
    const imgClassAttr = imgClasses.length ? ` class="${imgClasses.join(' ')}"` : '';
    const altAttr = alt && !isDecorative ? ` alt="${alt}"` : '';
    const ariaHiddenAttr = isDecorative ? ' aria-hidden="true"' : '';
    const loadingAttr = loading ? ` loading="${loading}"` : '';
    const fetchPriorityAttr = fetchPriority ? ` fetchpriority="${fetchPriority}"` : '';
    pictureHTML += `<img src="${src}"${imgClassAttr}${altAttr}${ariaHiddenAttr}${loadingAttr}${fetchPriorityAttr}>`;
    pictureHTML += '</picture>';

    // Wrap in figure if schema included
    if (includeSchema) {
        let figureHTML = '<figure itemscope itemtype="https://schema.org/ImageObject">';
        figureHTML += pictureHTML;
        if (alt) {
            figureHTML += `<figcaption itemprop="name">${alt}</figcaption>`;
        }
        figureHTML += '</figure>';
        return figureHTML;
    }

    return pictureHTML;
}
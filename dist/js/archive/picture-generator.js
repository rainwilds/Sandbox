export const WIDTHS = [768, 1024, 1366, 1920, 2560];
export const FORMATS = ['jxl', 'avif', 'webp', 'jpeg'];
export const VALID_ASPECT_RATIOS = new Set(['16/9', '9/16', '3/2', '2/3', '1/1', '21/9']);
export const SIZES_BREAKPOINTS = [
    { maxWidth: 768, baseValue: '100vw' },
    { maxWidth: 1024, baseValue: '100vw' },
    { maxWidth: 1366, baseValue: '100vw' },
    { maxWidth: 1920, baseValue: '100vw' },
    { maxWidth: 2560, baseValue: '100vw' },
];
export const DEFAULT_SIZE_VALUE = 3840;
const BASE_PATH = './img/responsive/';

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
    fetchPriority = '',
    extraClasses = []
} = {}) {
    const validExtensions = /\.(jpg|jpeg|png|webp|avif|jxl)$/i;
    if (!src || !validExtensions.test(src)) {
        console.error('The "src" parameter must be a valid image path');
        return '';
    }

    let baseFilename = src.split('/').pop().split('.').slice(0, -1).join('.');
    let lightBaseFilename = lightSrc ? lightSrc.split('/').pop().split('.').slice(0, -1).join('.') : null;
    let darkBaseFilename = darkSrc ? darkSrc.split('/').pop().split('.').slice(0, -1).join('.') : null;

    if (lightSrc && !lightBaseFilename) {
        console.error('Invalid "lightSrc" parameter');
        return '';
    }
    if (darkSrc && !darkBaseFilename) {
        console.error('Invalid "darkSrc" parameter');
        return '';
    }

    const parseWidth = (widthStr) => {
        const vwMatch = widthStr.match(/(\d+)vw/);
        if (vwMatch) return parseInt(vwMatch[1]) / 100;
        const pxMatch = widthStr.match(/(\d+)px/);
        if (pxMatch) {
            const winWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
            return parseInt(pxMatch[1]) / winWidth;
        }
        return 1.0;
    };

    const parsedWidths = {
        mobile: Math.max(0.1, Math.min(2.0, parseWidth(mobileWidth))),
        tablet: Math.max(0.1, Math.min(2.0, parseWidth(tabletWidth))),
        desktop: Math.max(0.1, Math.min(2.0, parseWidth(desktopWidth)))
    };

    const sizes = [
        ...SIZES_BREAKPOINTS.map(bp => {
            const percentage = bp.maxWidth <= 768 ? parsedWidths.mobile : (bp.maxWidth <= 1024 ? parsedWidths.tablet : parsedWidths.desktop);
            return `(max-width: ${bp.maxWidth}px) ${percentage * 100}vw`;
        }),
        `${DEFAULT_SIZE_VALUE * parsedWidths.desktop}px`
    ].join(', ');

    const generateSrcset = (filename, format) =>
        `${BASE_PATH}${filename}.${format} 3840w, ` +
        WIDTHS.map(w => `${BASE_PATH}${filename}-${w}.${format} ${w}w`).join(', ');

    const allClasses = [
        ...new Set([
            ...customClasses.trim().split(/\s+/).filter(Boolean),
            ...extraClasses
        ])
    ];
    if (aspectRatio && VALID_ASPECT_RATIOS.has(aspectRatio)) {
        allClasses.push(`aspect-ratio-${aspectRatio.replace('/', '-')}`);
    }
    const classAttr = allClasses.length ? ` class="${allClasses.join(' ')} animate animate-fade-in"` : ' class="animate animate-fade-in"';

    let pictureHTML = `<picture${classAttr}>`;
    FORMATS.forEach(format => {
        if (lightSrc && darkSrc) {
            pictureHTML += `<source srcset="${generateSrcset(lightBaseFilename, format)}" sizes="${sizes}" type="image/${format}" media="(prefers-color-scheme: light)">`;
            pictureHTML += `<source srcset="${generateSrcset(darkBaseFilename, format)}" sizes="${sizes}" type="image/${format}" media="(prefers-color-scheme: dark)">`;
        }
        pictureHTML += `<source srcset="${generateSrcset(baseFilename, format)}" sizes="${sizes}" type="image/${format}">`;
    });

    const altAttr = isDecorative ? ' alt=""' : (alt ? ` alt="${alt}"` : '');
    const ariaHiddenAttr = isDecorative ? ' aria-hidden="true"' : '';
    const validLoading = ['eager', 'lazy'].includes(loading) ? loading : 'lazy';
    const validFetchPriority = ['high', 'low', 'auto'].includes(fetchPriority) ? fetchPriority : '';
    const loadingAttr = validLoading ? ` loading="${validLoading}"` : '';
    const fetchPriorityAttr = validFetchPriority ? ` fetchpriority="${validFetchPriority}"` : '';

    pictureHTML += `<img src="${src}"${altAttr}${ariaHiddenAttr}${loadingAttr}${fetchPriorityAttr} onerror="this.src='https://placehold.co/3000x2000';${isDecorative ? '' : `this.alt='${alt || 'Placeholder image'}';`}this.onerror=null;">`;
    pictureHTML += '</picture>';

    if (includeSchema) {
        let figureHTML = `<figure${classAttr} itemscope itemtype="https://schema.org/ImageObject">`;
        figureHTML += pictureHTML;
        if (alt && alt.trim()) {
            figureHTML += `<figcaption itemprop="name">${alt}</figcaption>`;
        }
        figureHTML += '</figure>';
        return figureHTML;
    }

    return pictureHTML;
}
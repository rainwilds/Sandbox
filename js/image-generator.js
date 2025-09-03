const WIDTHS = [768, 1024, 1366, 1920, 2560];
const FORMATS = ['jxl', 'avif', 'webp', 'jpeg'];
const VALID_ASPECT_RATIOS = new Set(['16/9', '9/16', '3/2', '2/3', '1/1', '21/9']);
const SIZES_BREAKPOINTS = [
    { maxWidth: 768, baseValue: '100vw' },
    { maxWidth: 1024, baseValue: '100vw' },
    { maxWidth: 1366, baseValue: '100vw' },
    { maxWidth: 1920, baseValue: '100vw' },
    { maxWidth: 2560, baseValue: '100vw' },
];
const DEFAULT_SIZE_VALUE = 3840;
const BASE_PATH = './img/responsive/'; // Adjust based on your project structure

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
    extraClasses = [],
    noResponsive = false
} = {}) {
    const validExtensions = /\.(jpg|jpeg|png|webp|avif|jxl|svg)$/i;
    if (!src || !validExtensions.test(src)) {
        console.error('The "src" parameter must be a valid image path');
        return '';
    }
    if (!isDecorative && !alt) {
        console.error('An alt attribute is required for non-decorative images');
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
    const allClasses = [...new Set([...customClasses.trim().split(/\s+/).filter(Boolean), ...extraClasses])];
    if (aspectRatio && VALID_ASPECT_RATIOS.has(aspectRatio)) {
        allClasses.push(`aspect-ratio-${aspectRatio.replace('/', '-')}`);
    }
    const classAttr = allClasses.length ? ` class="${allClasses.join(' ')} animate animate-fade-in"` : ' class="animate animate-fade-in"';
    const altAttr = isDecorative ? ' alt="" role="presentation"' : (alt ? ` alt="${alt}"` : '');
    const validLoading = ['eager', 'lazy'].includes(loading) ? loading : 'lazy';
    const validFetchPriority = ['high', 'low', 'auto'].includes(fetchPriority) ? fetchPriority : '';
    const loadingAttr = validLoading ? ` loading="${validLoading}"` : '';
    const fetchPriorityAttr = validFetchPriority ? ` fetchpriority="${validFetchPriority}"` : '';
    let pictureHTML = `<picture${classAttr}>`;
    if (noResponsive) {
        if (lightSrc) pictureHTML += `<source media="(prefers-color-scheme: light)" srcset="${lightSrc}">`;
        if (darkSrc) pictureHTML += `<source media="(prefers-color-scheme: dark)" srcset="${darkSrc}">`;
        pictureHTML += `<img src="${src}"${altAttr}${loadingAttr}${fetchPriorityAttr} onerror="this.src='https://placehold.co/3000x2000';${isDecorative ? '' : `this.alt='${alt || 'Placeholder image'}';`}this.onerror=null;">`;
    } else {
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
        FORMATS.forEach(format => {
            if (lightSrc && darkSrc) {
                pictureHTML += `<source srcset="${generateSrcset(lightBaseFilename, format)}" sizes="${sizes}" type="image/${format}" media="(prefers-color-scheme: light)">`;
                pictureHTML += `<source srcset="${generateSrcset(darkBaseFilename, format)}" sizes="${sizes}" type="image/${format}" media="(prefers-color-scheme: dark)">`;
            }
            pictureHTML += `<source srcset="${generateSrcset(baseFilename, format)}" sizes="${sizes}" type="image/${format}">`;
        });
        pictureHTML += `<img src="${src}"${altAttr}${loadingAttr}${fetchPriorityAttr} onerror="this.src='https://placehold.co/3000x2000';${isDecorative ? '' : `this.alt='${alt || 'Placeholder image'}';`}this.onerror=null;">`;
    }
    pictureHTML += '</picture>';
    if (includeSchema) {
        let figureHTML = `<figure${classAttr} itemscope itemtype="https://schema.org/ImageObject">`;
        figureHTML += pictureHTML;
        if (alt && alt.trim()) figureHTML += `<figcaption itemprop="name">${alt}</figcaption>`;
        figureHTML += '</figure>';
        return figureHTML;
    }
    return pictureHTML;
}

export function generateLogoMarkup({
    src,
    mobileSrc = '',
    tabletSrc = '',
    desktopSrc = '',
    lightSrc = '',
    darkSrc = '',
    mobileLightSrc = '',
    mobileDarkSrc = '',
    tabletLightSrc = '',
    tabletDarkSrc = '',
    alt = '',
    isDecorative = false,
    customClasses = '',
    loading = 'eager',
    fetchPriority = 'high',
    extraClasses = []
} = {}) {
    const validExtensions = /\.(jpg|jpeg|png|webp|avif|jxl|svg)$/i;
    const validateSrc = (s) => s && validExtensions.test(s);
    if (!validateSrc(src) && !validateSrc(mobileSrc) && !validateSrc(tabletSrc) && !validateSrc(desktopSrc)) {
        console.error('At least one valid logo source must be provided');
        return '';
    }
    if (!isDecorative && !alt) {
        console.error('An alt attribute is required for non-decorative logos');
        return '';
    }
    const validatePair = (light, dark, label) => {
        if ((light || dark) && !(light && dark)) {
            console.error(`Both ${label}-light-src and ${label}-dark-src must be provided if one is specified.`);
            return false;
        }
        return true;
    };
    if (!validatePair(lightSrc, darkSrc, 'logo') ||
        !validatePair(mobileLightSrc, mobileDarkSrc, 'logo-mobile') ||
        !validatePair(tabletLightSrc, tabletDarkSrc, 'logo-tablet')) {
        return '';
    }
    const allClasses = [...new Set([...customClasses.trim().split(/\s+/).filter(Boolean), ...extraClasses])].join(' ');
    const classAttr = allClasses ? ` class="${allClasses} animate animate-fade-in"` : ' class="animate animate-fade-in"';
    const altAttr = isDecorative ? ' alt="" role="presentation"' : (alt ? ` alt="${alt}"` : '');
    const validLoading = ['eager', 'lazy'].includes(loading) ? loading : 'eager';
    const validFetchPriority = ['high', 'low', 'auto'].includes(fetchPriority) ? fetchPriority : 'high';
    const loadingAttr = ` loading="${validLoading}"`;
    const fetchPriorityAttr = ` fetchpriority="${validFetchPriority}"`;

    let pictureHTML = `<picture${classAttr}>`;
    // Mobile sources (max-width: 767px)
    if (validateSrc(mobileSrc) || validateSrc(mobileLightSrc) || validateSrc(mobileDarkSrc)) {
        if (validateSrc(mobileLightSrc)) pictureHTML += `<source media="(prefers-color-scheme: light) and (max-width: 767px)" srcset="${mobileLightSrc}">`;
        if (validateSrc(mobileDarkSrc)) pictureHTML += `<source media="(prefers-color-scheme: dark) and (max-width: 767px)" srcset="${mobileDarkSrc}">`;
        if (validateSrc(mobileSrc)) pictureHTML += `<source media="(max-width: 767px)" srcset="${mobileSrc}">`;
    }
    // Tablet sources (min-width: 768px and max-width: 1023px)
    if (validateSrc(tabletSrc) || validateSrc(tabletLightSrc) || validateSrc(tabletDarkSrc)) {
        if (validateSrc(tabletLightSrc)) pictureHTML += `<source media="(prefers-color-scheme: light) and (min-width: 768px) and (max-width: 1023px)" srcset="${tabletLightSrc}">`;
        if (validateSrc(tabletDarkSrc)) pictureHTML += `<source media="(prefers-color-scheme: dark) and (min-width: 768px) and (max-width: 1023px)" srcset="${tabletDarkSrc}">`;
        if (validateSrc(tabletSrc)) pictureHTML += `<source media="(min-width: 768px) and (max-width: 1023px)" srcset="${tabletSrc}">`;
    }
    // Desktop sources (min-width: 1024px)
    if (validateSrc(desktopSrc) || validateSrc(lightSrc) || validateSrc(darkSrc)) {
        if (validateSrc(lightSrc)) pictureHTML += `<source media="(prefers-color-scheme: light) and (min-width: 1024px)" srcset="${lightSrc}">`;
        if (validateSrc(darkSrc)) pictureHTML += `<source media="(prefers-color-scheme: dark) and (min-width: 1024px)" srcset="${darkSrc}">`;
        if (validateSrc(desktopSrc)) pictureHTML += `<source media="(min-width: 1024px)" srcset="${desktopSrc}">`;
    }
    // Default fallback
    if (validateSrc(lightSrc)) pictureHTML += `<source media="(prefers-color-scheme: light)" srcset="${lightSrc}">`;
    if (validateSrc(darkSrc)) pictureHTML += `<source media="(prefers-color-scheme: dark)" srcset="${darkSrc}">`;
    pictureHTML += `<img src="${validateSrc(desktopSrc) ? desktopSrc : validateSrc(tabletSrc) ? tabletSrc : validateSrc(mobileSrc) ? mobileSrc : src}"${altAttr}${loadingAttr}${fetchPriorityAttr} onerror="this.src='https://placehold.co/300x300';${isDecorative ? '' : `this.alt='${alt || 'Placeholder logo'}';`}this.onerror=null;">`;
    pictureHTML += '</picture>';

    return pictureHTML;
}

export const BACKDROP_FILTER_MAP = {
    'backdrop-filter-blur-small': 'blur(var(--blur-small))',
    'backdrop-filter-blur-medium': 'blur(var(--blur-medium))',
    'backdrop-filter-blur-large': 'blur(var(--blur-large))',
    'backdrop-filter-grayscale-small': 'grayscale(var(--grayscale-small))',
    'backdrop-filter-grayscale-medium': 'grayscale(var(--grayscale-medium))',
    'backdrop-filter-grayscale-large': 'grayscale(var(--grayscale-large))'
};
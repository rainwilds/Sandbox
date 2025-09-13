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
const BASE_PATH = './img/responsive/';
const VALID_EXTENSIONS = /\.(jpg|jpeg|png|webp|avif|jxl|svg)$/i;

// Memoized helpers
const mimeTypeCache = new Map();
const getImageType = (src) => {
  if (!src) return '';
  const cacheKey = src.split('.').pop().toLowerCase();
  if (!mimeTypeCache.has(cacheKey)) {
    mimeTypeCache.set(cacheKey, cacheKey === 'svg' ? 'image/svg+xml' : `image/${cacheKey}`);
  }
  return mimeTypeCache.get(cacheKey);
};

const filenameCache = new Map();
const getBaseFilename = (src) => {
  if (!src) return null;
  const cacheKey = src;
  if (!filenameCache.has(cacheKey)) {
    filenameCache.set(cacheKey, src.split('/').pop().split('.').slice(0, -1).join('.'));
  }
  return filenameCache.get(cacheKey);
};

// Cache parsed widths
const parseWidth = (widthStr, winWidth = typeof window !== 'undefined' ? window.innerWidth : 1920) => {
  if (typeof widthStr === 'number') return Math.max(0.1, Math.min(2.0, widthStr / winWidth));
  const vwMatch = widthStr.match(/(\d+)vw/);
  if (vwMatch) return Math.max(0.1, Math.min(2.0, parseInt(vwMatch[1], 10) / 100));
  const pxMatch = widthStr.match(/(\d+)px/);
  if (pxMatch) return Math.max(0.1, Math.min(2.0, parseInt(pxMatch[1], 10) / winWidth));
  return 1.0;
};

// Generate sizes attribute
const generateSizes = (mobileWidth, tabletWidth, desktopWidth) => {
  const parsedWidths = {
    mobile: parseWidth(mobileWidth),
    tablet: parseWidth(tabletWidth),
    desktop: parseWidth(desktopWidth),
  };
  return [
    ...SIZES_BREAKPOINTS.map(
      (bp) =>
        `(max-width: ${bp.maxWidth}px) ${
          (bp.maxWidth <= 768 ? parsedWidths.mobile : bp.maxWidth <= 1024 ? parsedWidths.tablet : parsedWidths.desktop) * 100
        }vw`
    ),
    `${DEFAULT_SIZE_VALUE * parsedWidths.desktop}px`,
  ].join(', ');
};

// Validate image sources and alts (reverted to original permissive logic)
const validateSources = (params) => {
  const {
    src,
    lightSrc,
    darkSrc,
    fullSrc,
    fullLightSrc,
    fullDarkSrc,
    iconSrc,
    iconLightSrc,
    iconDarkSrc,
    alt,
    lightAlt,
    darkAlt,
    fullAlt,
    fullLightAlt,
    fullDarkAlt,
    iconAlt,
    iconLightAlt,
    iconDarkAlt,
    isDecorative,
  } = params;

  const sources = [src, lightSrc, darkSrc, fullSrc, fullLightSrc, fullDarkSrc, iconSrc, iconLightSrc, iconDarkSrc].filter(Boolean);
  if (!sources.length) throw new Error('At least one valid image source must be provided');

  for (const source of sources) {
    if (!VALID_EXTENSIONS.test(source)) throw new Error(`Invalid image source: ${source}`);
  }

  if (!isDecorative) {
    const isLogo = fullSrc || fullLightSrc || fullDarkSrc || iconSrc || iconLightSrc || iconDarkSrc;
    if (isLogo) {
      if (fullSrc && !fullAlt) throw new Error('fullAlt is required for non-decorative fullSrc');
      if (iconSrc && !iconAlt) throw new Error('iconAlt is required for non-decorative iconSrc');
      if (fullLightSrc && !fullLightAlt) throw new Error('fullLightAlt is required for fullLightSrc');
      if (fullDarkSrc && !fullDarkAlt) throw new Error('fullDarkAlt is required for fullDarkSrc');
      if (iconLightSrc && !iconLightAlt) throw new Error('iconLightAlt is required for iconLightSrc');
      if (iconDarkSrc && !iconDarkAlt) throw new Error('iconDarkAlt is required for non-decorative iconDarkSrc');
    } else if (!alt && !(lightSrc && lightAlt) && !(darkSrc && darkAlt)) {
      throw new Error('Alt attribute is required for non-decorative images');
    }
  }

  return true;
};

export function generatePictureMarkup({
  src = '',
  lightSrc = '',
  darkSrc = '',
  alt = '',
  lightAlt = '',
  darkAlt = '',
  fullSrc = '',
  fullLightSrc = '',
  fullDarkSrc = '',
  fullAlt = '',
  fullLightAlt = '',
  fullDarkAlt = '',
  iconSrc = '',
  iconLightSrc = '',
  iconDarkSrc = '',
  iconAlt = '',
  iconLightAlt = '',
  iconDarkAlt = '',
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
  noResponsive = false,
  breakpoint = '',
  extraStyles = '',
} = {}) {
  try {
    // Validate inputs (now skips non-path placeholders)
    validateSources(arguments[0]);

    // Validate breakpoint
    const validatedBreakpoint = breakpoint && WIDTHS.includes(parseInt(breakpoint, 10)) ? parseInt(breakpoint, 10) : '';

    // Determine primary sources and alts
    const primarySrc = fullSrc || iconSrc || fullLightSrc || iconLightSrc || lightSrc || fullDarkSrc || iconDarkSrc || darkSrc || src;
    const primaryAlt = isDecorative ? '' : fullAlt || iconAlt || alt || lightAlt || darkAlt || fullLightAlt || fullDarkAlt || iconLightAlt || iconDarkAlt;
    const altAttr = isDecorative ? ' alt="" role="presentation"' : ` alt="${primaryAlt}"`;
    const loadingAttr = ['eager', 'lazy'].includes(loading) ? ` loading="${loading}"` : ' loading="lazy"';
    const fetchPriorityAttr = ['high', 'low', 'auto'].includes(fetchPriority) && !(fullSrc || iconSrc || fullLightSrc || iconLightSrc || fullDarkSrc || iconDarkSrc) ? ` fetchpriority="${fetchPriority}"` : '';

    // Combine classes
    const allClasses = [...new Set([customClasses.trim(), ...extraClasses].flatMap((c) => c.split(/\s+/)).filter(Boolean))];
    if (aspectRatio && VALID_ASPECT_RATIOS.has(aspectRatio)) {
      allClasses.push(`aspect-ratio-${aspectRatio.replace('/', '-')}`);
    }
    allClasses.push('animate', 'animate-fade-in');
    const classAttr = allClasses.length ? ` class="${allClasses.join(' ')}"` : '';
    const styleAttr = extraStyles ? ` style="${extraStyles}"` : '';

    // Initialize markup array
    const markup = [`<picture${classAttr}${styleAttr}>`];

    // Generate srcset for responsive images
    const generateSrcset = (filename, format) =>
      [`${BASE_PATH}${filename}.${format} 3840w`, ...WIDTHS.map((w) => `${BASE_PATH}${filename}-${w}.${format} ${w}w`)].join(', ');

    const isLogo = fullSrc || fullLightSrc || fullDarkSrc || iconSrc || iconLightSrc || iconDarkSrc;

    if (isLogo) {
      // Logo case
      if (validatedBreakpoint && (iconSrc || iconLightSrc || iconDarkSrc)) {
        if (iconLightSrc) {
          markup.push(
            `<source media="(max-width: ${validatedBreakpoint - 1}px) and (prefers-color-scheme: dark)" type="${getImageType(iconLightSrc)}" srcset="${iconLightSrc}"${isDecorative ? ' alt="" role="presentation"' : iconLightAlt ? ` alt="${iconLightAlt}"` : ''}>`
          );
        }
        if (iconDarkSrc) {
          markup.push(
            `<source media="(max-width: ${validatedBreakpoint - 1}px) and (prefers-color-scheme: light)" type="${getImageType(iconDarkSrc)}" srcset="${iconDarkSrc}"${isDecorative ? ' alt="" role="presentation"' : iconDarkAlt ? ` alt="${iconDarkAlt}"` : ''}>`
          );
        }
        if (iconSrc) {
          markup.push(
            `<source media="(max-width: ${validatedBreakpoint - 1}px)" type="${getImageType(iconSrc)}" srcset="${iconSrc}"${isDecorative ? ' alt="" role="presentation"' : iconAlt ? ` alt="${iconAlt}"` : ''}>`
          );
        }
      }

      if (fullLightSrc) {
        markup.push(
          `<source media="(prefers-color-scheme: light) and (min-width: ${validatedBreakpoint}px)" type="${getImageType(fullLightSrc)}" srcset="${fullLightSrc}"${isDecorative ? ' alt="" role="presentation"' : fullLightAlt ? ` alt="${fullLightAlt}"` : ''}>`
        );
      }
      if (fullDarkSrc) {
        markup.push(
          `<source media="(prefers-color-scheme: dark) and (min-width: ${validatedBreakpoint}px)" type="${getImageType(fullDarkSrc)}" srcset="${fullDarkSrc}"${isDecorative ? ' alt="" role="presentation"' : fullDarkAlt ? ` alt="${fullDarkAlt}"` : ''}>`
        );
      }
      if (fullSrc || iconSrc) {
        const fallbackSrc = fullSrc || iconSrc;
        markup.push(`<source type="${getImageType(fallbackSrc)}" srcset="${fallbackSrc}"${altAttr}>`);
      }
    } else {
      // Non-logo case
      const sizes = generateSizes(mobileWidth, tabletWidth, desktopWidth);
      const baseFilename = getBaseFilename(lightSrc || darkSrc || src);
      const lightBaseFilename = lightSrc ? getBaseFilename(lightSrc) : null;
      const darkBaseFilename = darkSrc ? getBaseFilename(darkSrc) : null;

      if (noResponsive) {
        if (lightSrc) {
          markup.push(
            `<source media="(prefers-color-scheme: light)" type="${getImageType(lightSrc)}" srcset="${lightSrc}" sizes="${sizes}"${isDecorative ? ' alt="" role="presentation"' : lightAlt ? ` alt="${lightAlt}"` : ''}>`
          );
        }
        if (darkSrc) {
          markup.push(
            `<source media="(prefers-color-scheme: dark)" type="${getImageType(darkSrc)}" srcset="${darkSrc}" sizes="${sizes}"${isDecorative ? ' alt="" role="presentation"' : darkAlt ? ` alt="${darkAlt}"` : ''}>`
          );
        }
        if (src) {
          markup.push(`<source type="${getImageType(src)}" srcset="${src}" sizes="${sizes}"${altAttr}>`);
        }
      } else {
        FORMATS.forEach((format) => {
          if (lightSrc && lightBaseFilename) {
            markup.push(
              `<source media="(prefers-color-scheme: light)" type="image/${format}" srcset="${generateSrcset(lightBaseFilename, format)}" sizes="${sizes}"${isDecorative ? ' alt="" role="presentation"' : lightAlt ? ` alt="${lightAlt}"` : ''}>`
            );
          }
          if (darkSrc && darkBaseFilename) {
            markup.push(
              `<source media="(prefers-color-scheme: dark)" type="image/${format}" srcset="${generateSrcset(darkBaseFilename, format)}" sizes="${sizes}"${isDecorative ? ' alt="" role="presentation"' : darkAlt ? ` alt="${darkAlt}"` : ''}>`
            );
          }
          markup.push(`<source type="image/${format}" srcset="${generateSrcset(baseFilename, format)}" sizes="${sizes}"${altAttr}>`);
        });
      }
    }

    // Add fallback img tag
    markup.push(
      `<img src="${primarySrc}"${altAttr}${loadingAttr}${fetchPriorityAttr} onerror="this.src='https://placehold.co/3000x2000'; this.alt='${primaryAlt ?? 'Placeholder image'}'; this.onerror=null;">`
    );
    markup.push('</picture>');

    // Add schema if requested
    if (includeSchema) {
      markup.unshift(
        `<script type="application/ld+json">{"@context":"http://schema.org","@type":"ImageObject","url":"${primarySrc}","alternateName":"${primaryAlt}"}</script>`
      );
    }

    return markup.join('');
  } catch (error) {
    console.error(`Error generating picture markup: ${error.message}`);
    return `<img src="https://placehold.co/3000x2000" alt="Error loading image" loading="lazy">`;
  }
}

// Global script for source selection (reverted to original matchMedia listeners, with isDev logging)
if (typeof window !== 'undefined') {
  const isDev = window.location.href.includes('/dev/');
  const updatePictureSources = () => {
    document.querySelectorAll('picture').forEach((picture) => {
      const img = picture.querySelector('img');
      const sources = picture.querySelectorAll('source');
      let selectedSrc = img.src;
      let matchedMedia = 'none';
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      sources.forEach((source) => {
        if (source.media && window.matchMedia(source.media).matches) {
          const srcset = source.getAttribute('srcset');
          selectedSrc = srcset.includes(',') ? srcset.split(',')[0].split(' ')[0] : srcset;
          matchedMedia = source.media;
        }
      });
      if (img.src !== selectedSrc && selectedSrc) {
        if (isDev) console.log('Updating img src:', { selectedSrc, matchedMedia, prefersDark });
        img.src = selectedSrc;
      }
    });
  };

  window.addEventListener('DOMContentLoaded', updatePictureSources);

  // Original multiple breakpoint listeners (safe, no loop risk)
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updatePictureSources);
  WIDTHS.forEach((bp) => {
    window.matchMedia(`(max-width: ${bp - 1}px)`).addEventListener('change', updatePictureSources);
  });
}

export const BACKDROP_FILTER_MAP = {
  'backdrop-filter-blur-small': 'blur(var(--blur-small))',
  'backdrop-filter-blur-medium': 'blur(var(--blur-medium))',
  'backdrop-filter-blur-large': 'blur(var(--blur-large))',
  'backdrop-filter-grayscale-small': 'grayscale(var(--grayscale-small))',
  'backdrop-filter-grayscale-medium': 'grayscale(var(--grayscale-medium))',
  'backdrop-filter-grayscale-large': 'grayscale(var(--grayscale-large))',
};
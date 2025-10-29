/* global document, window */

// Import config loader for responsive image path and shared breakpoints
import { getImageResponsivePath, getImagePrimaryPath } from '../config.js';
import { VIEWPORT_BREAKPOINTS, VIEWPORT_BREAKPOINT_WIDTHS } from '../shared.js';

// Internal constants for image validation and responsive generation (not exported).
const VALID_IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|webp|avif|jxl|svg)$/i;
const IMAGE_FORMATS = ['jxl', 'avif', 'webp', 'jpg'];
const VALID_ASPECT_RATIOS = new Set(['16/9', '9/16', '3/2', '2/3', '1/1', '21/9']);
const DEFAULT_IMAGE_SIZE_VALUE = 3840;

// Get responsive directory path from config (with fallback)
let IMAGE_RESPONSIVE_DIRECTORY_PATH = '/img/responsive/'; // Fallback
let IMAGE_PRIMARY_DIRECTORY_PATH = '/img/primary/'; // Fallback
(async () => {
  try {
    IMAGE_RESPONSIVE_DIRECTORY_PATH = await getImageResponsivePath();
    IMAGE_PRIMARY_DIRECTORY_PATH = await getImagePrimaryPath();
  } catch (error) {
    if (typeof window !== 'undefined' && window.console) {
      console.warn('Failed to load image paths from config, using fallbacks:', error);
    }
  }
})();

// Cache for generated markup to improve performance on repeated calls with same parameters.
const markupCache = new Map();

// Main exported function to generate <picture> markup for responsive images.
export async function generatePictureMarkup({
  src = '',
  lightSrc = '',
  darkSrc = '',
  alt = '',
  lightAlt = '',
  darkAlt = '',
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
  isBackground = false,
} = {}) {
  // Check if debug mode is enabled via URL for logging.
  const isDev = typeof window !== 'undefined' && (
    window.location.href.includes('/dev/') ||
    new URLSearchParams(window.location.search).get('debug') === 'true'
  );

  if (isDev) markupCache.clear(); // Clear cache only in dev mode for fresh generations.

  // Trim all input strings to remove leading/trailing whitespace.
  src = src.trim();
  lightSrc = lightSrc.trim();
  darkSrc = darkSrc.trim();
  alt = alt.trim();
  lightAlt = lightAlt.trim();
  darkAlt = darkAlt.trim();
  iconSrc = iconSrc.trim();
  iconLightSrc = iconLightSrc.trim();
  iconDarkSrc = iconDarkSrc.trim();
  iconAlt = iconAlt.trim();
  iconLightAlt = iconLightAlt.trim();
  iconDarkAlt = iconDarkAlt.trim();
  customClasses = customClasses.trim();
  extraStyles = extraStyles.trim();

  // If no alt texts are provided at all, treat as decorative
  if (!alt && !lightAlt && !darkAlt && !iconAlt && !iconLightAlt && !iconDarkAlt) {
    isDecorative = true;
  }

  // Set fallback alts if specific ones not provided
  lightAlt = lightAlt || alt;
  darkAlt = darkAlt || alt;
  iconAlt = iconAlt || alt;
  iconLightAlt = iconLightAlt || iconAlt || alt;
  iconDarkAlt = iconDarkAlt || iconAlt || alt;

  // Determine if the image is SVG, which affects responsive handling.
  const isSvg = src.endsWith('.svg') || lightSrc.endsWith('.svg') || darkSrc.endsWith('.svg') ||
                iconSrc.endsWith('.svg') || iconLightSrc.endsWith('.svg') || iconDarkSrc.endsWith('.svg');
  const effectiveNoResponsive = noResponsive || isSvg;

  // Validate that at least one source is provided.
  const allSources = [src, lightSrc, darkSrc, iconSrc, iconLightSrc, iconDarkSrc].filter(Boolean);
  if (!allSources.length) {
    return '<picture><img src="https://placehold.co/3000x2000" alt="No image source provided" loading="lazy"></picture>';
  }

  // Validate file extensions for all sources.
  for (const source of allSources) {
    if (!VALID_IMAGE_EXTENSIONS.test(source)) {
      return '<picture><img src="' + source + '" alt="Invalid image source" loading="lazy"></picture>';
    }
  }

  // Ensure alt text is provided unless decorative.
  if (!isDecorative) {
    if (src && !alt) return '<picture><img src="https://placehold.co/3000x2000" alt="Missing alt text for primary src" loading="lazy"></picture>';
    if (lightSrc && !lightAlt) return '<picture><img src="https://placehold.co/3000x2000" alt="Missing alt text for light src" loading="lazy"></picture>';
    if (darkSrc && !darkAlt) return '<picture><img src="https://placehold.co/3000x2000" alt="Missing alt text for dark src" loading="lazy"></picture>';
    if (iconSrc && !iconAlt) return '<picture><img src="https://placehold.co/3000x2000" alt="Missing alt text for icon src" loading="lazy"></picture>';
    if (iconLightSrc && !iconLightAlt) return '<picture><img src="https://placehold.co/3000x2000" alt="Missing alt text for icon light src" loading="lazy"></picture>';
    if (iconDarkSrc && !iconDarkAlt) return '<picture><img src="https://placehold.co/3000x2000" alt="Missing alt text for icon dark src" loading="lazy"></picture>';
  }

  // Determine presence of icons and breakpoint.
  const hasIcon = iconSrc || (iconLightSrc && iconDarkSrc);
  const hasFull = src || (lightSrc && darkSrc);
  const hasBreakpoint = breakpoint && Number.isInteger(parseInt(breakpoint, 10)) && VIEWPORT_BREAKPOINT_WIDTHS.includes(parseInt(breakpoint, 10));
  if (hasIcon && !hasBreakpoint && isDev) console.warn('Icon sources provided without a valid breakpoint. Using full sources only.');
  if (!hasIcon && hasBreakpoint && isDev) console.warn('Breakpoint provided without icon sources. Ignoring breakpoint.');

  let prefersDark = false;
  let isBelowBreakpoint = false;
  if (typeof window !== 'undefined') {
    prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (hasBreakpoint) {
      const bp = parseInt(breakpoint, 10);
      isBelowBreakpoint = window.matchMedia(`(max-width: ${bp - 1}px)`).matches;
    }
  }

  // Create a cache key from all parameters for quick lookup.
  const cacheKey = JSON.stringify({
    src, lightSrc, darkSrc, alt, lightAlt, darkAlt,
    iconSrc, iconLightSrc, iconDarkSrc, iconAlt, iconLightAlt, iconDarkAlt,
    isDecorative, mobileWidth, tabletWidth, desktopWidth, aspectRatio,
    includeSchema, customClasses, loading, fetchPriority, extraClasses,
    noResponsive, breakpoint, extraStyles, isBackground, prefersDark, isBelowBreakpoint
  });

  if (markupCache.has(cacheKey)) {
    return markupCache.get(cacheKey);
  }

  try {
    // Determine primary source and alt for fallback.
    let primarySrc = '';
    let primaryAlt = '';
    if (hasBreakpoint && hasIcon && isBelowBreakpoint) {
      primarySrc = prefersDark ? iconDarkSrc : iconLightSrc || iconSrc;
      primaryAlt = isDecorative ? '' : (prefersDark ? iconDarkAlt : iconLightAlt || iconAlt);
    } else {
      primarySrc = prefersDark ? darkSrc : lightSrc || src;
      primaryAlt = isDecorative ? '' : (prefersDark ? darkAlt : lightAlt || alt);
    }

    if (!primarySrc) {
      primarySrc = lightSrc || iconLightSrc || darkSrc || iconDarkSrc || src || iconSrc;
      primaryAlt = isDecorative ? '' : (lightAlt || iconLightAlt || darkAlt || iconDarkAlt || alt || iconAlt);
    }

    // Build classes for picture element (excluding extraClasses).
    const pictureClasses = [...new Set([
      ...customClasses.split(/\s+/),
      ...(aspectRatio && VALID_ASPECT_RATIOS.has(aspectRatio) ? [`aspect-ratio-${aspectRatio.replace('/', '-')}`] : []),
      'animate', 'animate-fade-in'
    ].filter(Boolean))];
    const pictureClassAttr = pictureClasses.length ? ` class="${pictureClasses.join(' ')}"` : '';

    // Build classes for img element (including extraClasses).
    const imgClasses = [...new Set([
      ...(Array.isArray(extraClasses) ? extraClasses : extraClasses.split(/\s+/)).filter(Boolean)
    ])];
    const imgClassAttr = imgClasses.length ? ` class="${imgClasses.join(' ')}"` : '';

    // Generate sizes attribute string based on breakpoints and widths.
    function parseWidth(widthStr) {
      const vwMatch = widthStr.match(/(\d+)vw/);
      return vwMatch ? parseInt(vwMatch[1], 10) / 100 : 1.0;
    }

    const parsedWidths = {
      mobile: parseWidth(mobileWidth),
      tablet: parseWidth(tabletWidth),
      desktop: parseWidth(desktopWidth),
    };

    // Map VIEWPORT_BREAKPOINTS to sizes, using mobileWidth, tabletWidth, desktopWidth
    const sizes = VIEWPORT_BREAKPOINTS.map((bp) => {
      const width = bp.name === 'mobile' ? parsedWidths.mobile :
                    bp.name === 'tablet' ? parsedWidths.tablet : parsedWidths.desktop;
      return `(max-width: ${bp.maxWidth}px) ${width * 100}vw`;
    }).join(', ') + `, ${DEFAULT_IMAGE_SIZE_VALUE * parsedWidths.desktop}px`;

    // Start building the <picture> markup.
    let markup = `<picture${pictureClassAttr}>`;

    // Helper to add a source element.
    const addSource = (media, type, srcset, sizes, dataAlt) => {
      markup += `<source${media ? ` media="${media}"` : ''} type="${type}" srcset="${srcset}" sizes="${sizes}"${dataAlt ? ` data-alt="${dataAlt}"` : ''}>`;
    };

    const bpValue = parseInt(breakpoint, 10);
    const maxSmall = bpValue ? bpValue - 1 : 0;
    const minLarge = bpValue || 0;

    // Helper to get filename with extension from any path/URL.
    const getFilename = (path) => path ? path.split('/').pop() : '';

    if (effectiveNoResponsive) {
      // For non-responsive or SVG images, generate simple <source> elements without width variants.
      if (hasBreakpoint && hasIcon) {
        // Add sources for small screens (icons)
        if (iconLightSrc) addSource(`(max-width: ${maxSmall}px) and (prefers-color-scheme: light)`, getImageType(iconLightSrc), IMAGE_PRIMARY_DIRECTORY_PATH + getFilename(iconLightSrc), sizes, iconLightAlt);
        if (iconDarkSrc) addSource(`(max-width: ${maxSmall}px) and (prefers-color-scheme: dark)`, getImageType(iconDarkSrc), IMAGE_PRIMARY_DIRECTORY_PATH + getFilename(iconDarkSrc), sizes, iconDarkAlt);
        if (iconSrc) addSource(`(max-width: ${maxSmall}px)`, getImageType(iconSrc), IMAGE_PRIMARY_DIRECTORY_PATH + getFilename(iconSrc), sizes, iconAlt);

        // Add sources for large screens (full)
        if (lightSrc) addSource(`(min-width: ${minLarge}px) and (prefers-color-scheme: light)`, getImageType(lightSrc), IMAGE_PRIMARY_DIRECTORY_PATH + getFilename(lightSrc), sizes, lightAlt);
        if (darkSrc) addSource(`(min-width: ${minLarge}px) and (prefers-color-scheme: dark)`, getImageType(darkSrc), IMAGE_PRIMARY_DIRECTORY_PATH + getFilename(darkSrc), sizes, darkAlt);
        if (src) addSource(`(min-width: ${minLarge}px)`, getImageType(src), IMAGE_PRIMARY_DIRECTORY_PATH + getFilename(src), sizes, alt);
      } else {
        // No breakpoint or no icons: use full sources only
        if (lightSrc) addSource('(prefers-color-scheme: light)', getImageType(lightSrc), IMAGE_PRIMARY_DIRECTORY_PATH + getFilename(lightSrc), sizes, lightAlt);
        if (darkSrc) addSource('(prefers-color-scheme: dark)', getImageType(darkSrc), IMAGE_PRIMARY_DIRECTORY_PATH + getFilename(darkSrc), sizes, darkAlt);
        if (!lightSrc && !darkSrc && src) addSource('', getImageType(src), IMAGE_PRIMARY_DIRECTORY_PATH + getFilename(src), sizes, alt);
      }
    } else {
      // For responsive images, generate <source> elements for each format with width variants.
      IMAGE_FORMATS.forEach((format) => {
        if (hasBreakpoint && hasIcon) {
          // Add sources for small screens (icons)
          if (iconLightSrc) {
            const srcset = generateSrcset(iconLightSrc, format, VIEWPORT_BREAKPOINT_WIDTHS);
            addSource(`(max-width: ${maxSmall}px) and (prefers-color-scheme: light)`, `image/${format === 'jpg' ? 'jpeg' : format}`, srcset, sizes, iconLightAlt);
          }
          if (iconDarkSrc) {
            const srcset = generateSrcset(iconDarkSrc, format, VIEWPORT_BREAKPOINT_WIDTHS);
            addSource(`(max-width: ${maxSmall}px) and (prefers-color-scheme: dark)`, `image/${format === 'jpg' ? 'jpeg' : format}`, srcset, sizes, iconDarkAlt);
          }
          if (iconSrc) {
            const srcset = generateSrcset(iconSrc, format, VIEWPORT_BREAKPOINT_WIDTHS);
            addSource(`(max-width: ${maxSmall}px)`, `image/${format === 'jpg' ? 'jpeg' : format}`, srcset, sizes, iconAlt);
          }

          // Add sources for large screens (full)
          if (lightSrc) {
            const srcset = generateSrcset(lightSrc, format, VIEWPORT_BREAKPOINT_WIDTHS);
            addSource(`(min-width: ${minLarge}px) and (prefers-color-scheme: light)`, `image/${format === 'jpg' ? 'jpeg' : format}`, srcset, sizes, lightAlt);
          }
          if (darkSrc) {
            const srcset = generateSrcset(darkSrc, format, VIEWPORT_BREAKPOINT_WIDTHS);
            addSource(`(min-width: ${minLarge}px) and (prefers-color-scheme: dark)`, `image/${format === 'jpg' ? 'jpeg' : format}`, srcset, sizes, darkAlt);
          }
          if (src) {
            const srcset = generateSrcset(src, format, VIEWPORT_BREAKPOINT_WIDTHS);
            addSource(`(min-width: ${minLarge}px)`, `image/${format === 'jpg' ? 'jpeg' : format}`, srcset, sizes, alt);
          }
        } else {
          // No breakpoint or no icons: use full sources only
          if (lightSrc) {
            const srcset = generateSrcset(lightSrc, format, VIEWPORT_BREAKPOINT_WIDTHS);
            addSource('(prefers-color-scheme: light)', `image/${format === 'jpg' ? 'jpeg' : format}`, srcset, sizes, lightAlt);
          }
          if (darkSrc) {
            const srcset = generateSrcset(darkSrc, format, VIEWPORT_BREAKPOINT_WIDTHS);
            addSource('(prefers-color-scheme: dark)', `image/${format === 'jpg' ? 'jpeg' : format}`, srcset, sizes, darkAlt);
          }
          if (!lightSrc && !darkSrc && src) {
            const srcset = generateSrcset(src, format, VIEWPORT_BREAKPOINT_WIDTHS);
            addSource('', `image/${format === 'jpg' ? 'jpeg' : format}`, srcset, sizes, alt);
          }
        }
      });
    }

    // Generate fallback <img> element with JPEG source and error handling.
    const primaryFilename = getFilename(primarySrc).replace(/\.[^/.]+$/, "");
    let fallbackSrc = isSvg ? IMAGE_PRIMARY_DIRECTORY_PATH + getFilename(primarySrc) : IMAGE_PRIMARY_DIRECTORY_PATH + primaryFilename + '.jpg';

    // Only apply extraStyles if it's not a background image
    const styleAttr = (!isBackground && extraStyles) ? ` style="${extraStyles}"` : '';

    const imgAttrs = [
      `src="${fallbackSrc}"`,
      isDecorative ? 'alt="" role="presentation"' : `alt="${primaryAlt}"`,
      imgClassAttr,
      styleAttr,
      `loading="${loading}"`,
      fetchPriority ? `fetchpriority="${fetchPriority}"` : '',
      `onerror="this.src='https://placehold.co/3000x2000'; this.alt='${primaryAlt || 'Fallback image'}'; this.onerror=null;"`
    ].filter(Boolean).join(' ');

    markup += `<img ${imgAttrs}></picture>`;

    // Optionally add JSON-LD schema for the image if requested.
    if (includeSchema && primarySrc && primaryAlt) {
      const schemaUrl = IMAGE_PRIMARY_DIRECTORY_PATH + getFilename(primarySrc);
      markup += `<script type="application/ld+json">{"@context":"https://schema.org","@type":"ImageObject","url":"${schemaUrl}","alternateName":"${primaryAlt}"}</script>`;
    }

    // Cache the generated markup for future use with the same parameters.
    markupCache.set(cacheKey, markup);

    return markup;
  } catch (error) {
    if (isDev) console.error('Error generating picture markup:', error);
    return '<picture><img src="https://placehold.co/3000x2000" alt="Error loading image" loading="lazy"></picture>';
  }
}

// Helper function to determine MIME type based on file extension.
function getImageType(src) {
  if (!src) return '';
  const ext = src.split('.').pop().toLowerCase();
  if (ext === 'svg') return 'image/svg+xml';
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  return `image/${ext}`;
}

// Helper function to generate srcset string for a given source and format.
function generateSrcset(originalSrc, format, widths) {
  if (!originalSrc) return '';

  const responsiveDir = IMAGE_RESPONSIVE_DIRECTORY_PATH;
  const primaryDir = IMAGE_PRIMARY_DIRECTORY_PATH;
  const filename = originalSrc.split('/').pop().replace(/\.[^/.]+$/, "");
  const variants = widths.map(w => `${responsiveDir}${filename}-${w}.${format} ${w}w`);
  const fullSizePath = format === 'jpg' ? `${primaryDir}${filename}.${format}` : `${responsiveDir}${filename}.${format}`;
  return `${fullSizePath} ${DEFAULT_IMAGE_SIZE_VALUE}w, ${variants.join(', ')}`;
}

// Client-side code for handling theme changes and lazy loading.
if (typeof window !== 'undefined') {
  // Function to update <img> src based on current media queries (theme/breakpoint).
  const updatePictureSources = () => {
    document.querySelectorAll('picture').forEach((picture) => {
      const img = picture.querySelector('img');
      const sources = picture.querySelectorAll('source');
      let selectedSrc = img.src;
      let selectedAlt = img.alt;
      sources.forEach((source) => {
        if (source.media && window.matchMedia(source.media).matches) {
          const srcset = source.getAttribute('srcset');
          selectedSrc = srcset.includes(',') ? srcset.split(',')[0].split(' ')[0] : srcset;
          const dataAlt = source.getAttribute('data-alt');
          if (dataAlt !== null) selectedAlt = dataAlt;
        }
      });
      if (img.src !== selectedSrc && selectedSrc) {
        img.src = selectedSrc;
        img.alt = selectedAlt;
      }
    });
  };

  // IntersectionObserver for lazy loading images.
  const lazyLoadObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.tagName === 'IMG' && img.getAttribute('loading') === 'lazy') {
          if (img.dataset.src) {
            img.src = img.dataset.src;
            delete img.dataset.src;
          }
        }
        lazyLoadObserver.unobserve(img);
      }
    });
  }, { rootMargin: '50px' });

  // DOMContentLoaded event to initialize updates and observers.
  document.addEventListener('DOMContentLoaded', () => {
    updatePictureSources();
    document.querySelectorAll('img[loading="lazy"]').forEach(img => {
      lazyLoadObserver.observe(img);
    });
  });

  // Listen for theme changes to update sources.
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updatePictureSources);
  // Listen for breakpoint changes to update sources.
  VIEWPORT_BREAKPOINT_WIDTHS.forEach((bp) => {
    window.matchMedia(`(max-width: ${bp - 1}px)`).addEventListener('change', updatePictureSources);
  });
}
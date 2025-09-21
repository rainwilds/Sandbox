import { VALID_EXTENSIONS } from './shared.js';

const markupCache = new Map();

export async function generatePictureMarkup({
  src = '',
  lightSrc = '',
  darkSrc = '',
  alt = '',
  lightAlt = '',
  darkAlt = '',
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
  const isDev = typeof window !== 'undefined' && (
    window.location.href.includes('/dev/') ||
    new URLSearchParams(window.location.search).get('debug') === 'true'
  );

  // Trim all inputs
  src = src.trim();
  lightSrc = lightSrc.trim();
  darkSrc = darkSrc.trim();
  alt = alt.trim();
  lightAlt = lightAlt.trim();
  darkAlt = darkAlt.trim();
  customClasses = customClasses.trim();
  extraStyles = extraStyles.trim();

  const isSvg = src.endsWith('.svg') || lightSrc.endsWith('.svg') || darkSrc.endsWith('.svg');
  const effectiveNoResponsive = noResponsive || isSvg;

  // Validate inputs
  const sources = [src, lightSrc, darkSrc].filter(Boolean);
  if (!sources.length) {
    return '<picture><img src="https://placehold.co/3000x2000" alt="No image source provided" loading="lazy"></picture>';
  }

  // Validate extensions
  for (const source of sources) {
    if (!VALID_EXTENSIONS.test(source)) {
      return '<picture><img src="' + source + '" alt="Invalid image source" loading="lazy"></picture>';
    }
  }

  // Validate alt text
  if (!isDecorative && !alt && !(lightSrc && lightAlt) && !(darkSrc && darkAlt)) {
    return '<picture><img src="https://placehold.co/3000x2000" alt="Missing alt text" loading="lazy"></picture>';
  }

  const cacheKey = JSON.stringify({
    src, lightSrc, darkSrc, alt, lightAlt, darkAlt,
    isDecorative, mobileWidth, tabletWidth, desktopWidth, aspectRatio,
    includeSchema, customClasses, loading, fetchPriority, extraClasses,
    noResponsive, breakpoint, extraStyles
  });

  if (markupCache.has(cacheKey)) {
    return markupCache.get(cacheKey);
  }

  try {
    // Determine primary source and alt
    const primarySrc = lightSrc || darkSrc || src;
    const primaryAlt = isDecorative ? '' : (lightAlt || darkAlt || alt);

    // Build classes
    const allClasses = [...new Set([
      ...customClasses.split(/\s+/), 
      ...(Array.isArray(extraClasses) ? extraClasses : []).flatMap(c => c.split(/\s+/))
    ].filter(Boolean))];
    
    if (aspectRatio && ['16/9', '9/16', '3/2', '2/3', '1/1', '21/9'].includes(aspectRatio)) {
      allClasses.push(`aspect-ratio-${aspectRatio.replace('/', '-')}`);
    }
    allClasses.push('animate', 'animate-fade-in');
    
    const classAttr = allClasses.length ? ` class="${allClasses.join(' ')}"` : '';

    // Generate sizes
    const WIDTHS = [768, 1024, 1366, 1920, 2560];
    const SIZES_BREAKPOINTS = [
      { maxWidth: 768, baseValue: '100vw' },
      { maxWidth: 1024, baseValue: '100vw' },
      { maxWidth: 1366, baseValue: '100vw' },
      { maxWidth: 1920, baseValue: '100vw' },
      { maxWidth: 2560, baseValue: '100vw' },
    ];
    const DEFAULT_SIZE_VALUE = 3840;

    function parseWidth(widthStr) {
      const vwMatch = widthStr.match(/(\d+)vw/);
      if (vwMatch) return parseInt(vwMatch[1], 10) / 100;
      return 1.0;
    }

    const parsedWidths = {
      mobile: parseWidth(mobileWidth),
      tablet: parseWidth(tabletWidth),
      desktop: parseWidth(desktopWidth),
    };

    const sizes = SIZES_BREAKPOINTS.map((bp) => {
      const width = bp.maxWidth <= 768 ? parsedWidths.mobile : 
                   bp.maxWidth <= 1024 ? parsedWidths.tablet : parsedWidths.desktop;
      return `(max-width: ${bp.maxWidth}px) ${width * 100}vw`;
    }).join(', ') + `, ${DEFAULT_SIZE_VALUE * parsedWidths.desktop}px`;

    // Build markup
    let markup = `<picture${classAttr}>`;

    const FORMATS = ['jxl', 'avif', 'webp', 'jpeg'];

    if (effectiveNoResponsive || primarySrc.endsWith('.svg')) {
      // Simple sources for SVG or no-responsive
      if (lightSrc) {
        markup += `<source media="(prefers-color-scheme: light)" type="${getImageType(lightSrc)}" srcset="${lightSrc}" sizes="${sizes}"${lightAlt ? ` alt="${lightAlt}"` : ''}>`;
      }
      if (darkSrc) {
        markup += `<source media="(prefers-color-scheme: dark)" type="${getImageType(darkSrc)}" srcset="${darkSrc}" sizes="${sizes}"${darkAlt ? ` alt="${darkAlt}"` : ''}>`;
      }
      if (src) {
        markup += `<source type="${getImageType(src)}" srcset="${src}" sizes="${sizes}"${isDecorative ? ' alt="" role="presentation"' : ` alt="${primaryAlt}"`}>`;
      }
    } else {
      // Responsive sources for each format
      FORMATS.forEach((format) => {
        if (lightSrc && !lightSrc.endsWith('.svg')) {
          const lightSrcset = generateSrcset(lightSrc, format, WIDTHS);
          markup += `<source media="(prefers-color-scheme: light)" type="image/${format}" srcset="${lightSrcset}" sizes="${sizes}"${lightAlt ? ` alt="${lightAlt}"` : ''}>`;
        }
        if (darkSrc && !darkSrc.endsWith('.svg')) {
          const darkSrcset = generateSrcset(darkSrc, format, WIDTHS);
          markup += `<source media="(prefers-color-scheme: dark)" type="image/${format}" srcset="${darkSrcset}" sizes="${sizes}"${darkAlt ? ` alt="${darkAlt}"` : ''}>`;
        }
        if (!primarySrc.endsWith('.svg')) {
          const primarySrcset = generateSrcset(primarySrc, format, WIDTHS);
          markup += `<source type="image/${format}" srcset="${primarySrcset}" sizes="${sizes}"${isDecorative ? ' alt="" role="presentation"' : ` alt="${primaryAlt}"`}>`;
        }
      });
    }

    // Generate fallback img
    const fallbackSrc = primarySrc
      .replace(/\.[^/.]+$/, '.jpg');

    const imgAttrs = [
      `src="${fallbackSrc}"`,
      isDecorative ? 'alt="" role="presentation"' : `alt="${primaryAlt}"`,
      `loading="${loading}"`,
      fetchPriority ? `fetchpriority="${fetchPriority}"` : '',
      `onerror="this.src='https://placehold.co/3000x2000'; this.alt='${primaryAlt || 'Fallback image'}'; this.onerror=null;"`
    ].filter(Boolean).join(' ');

    markup += `<img ${imgAttrs}></picture>`;

    // Add schema if requested
    if (includeSchema && primarySrc && primaryAlt) {
      markup += `<script type="application/ld+json">{"@context":"http://schema.org","@type":"ImageObject","url":"${primarySrc}","alternateName":"${primaryAlt}"}</script>`;
    }

    // Cache the result
    markupCache.set(cacheKey, markup);

    if (isDev) {
      console.log('Generated picture markup preview:');
      console.log(markup.substring(0, 400) + (markup.length > 400 ? '...' : ''));
    }

    return markup;

  } catch (error) {
    return '<picture><img src="https://placehold.co/3000x2000" alt="Error loading image" loading="lazy"></picture>';
  }
}

// Helper functions
function getImageType(src) {
  if (!src) return '';
  const ext = src.split('.').pop().toLowerCase();
  return ext === 'svg' ? 'image/svg+xml' : `image/${ext}`;
}

function generateSrcset(originalSrc, format, widths) {
  if (!originalSrc) return '';

  // Use relative path for responsive variants
  const responsiveDir = './img/responsive/';
  
  // Get filename without extension
  const filename = originalSrc.split('/').pop().replace(/\.[^/.]+$/, "");

  // Generate variants
  const variants = widths.map(w => {
    const variantName = `${filename}-${w}`;
    return `${responsiveDir}${variantName}.${format} ${w}w`;
  });

  // Full-size version
  const fullSizePath = `${responsiveDir}${filename}.${format}`;

  return `${fullSizePath} 3840w, ${variants.join(', ')}`;
}

if (typeof window !== 'undefined') {
  const isDev = window.location.href.includes('/dev/') ||
    new URLSearchParams(window.location.search).get('debug') === 'true';
  const WIDTHS = [768, 1024, 1366, 1920, 2560];

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

  document.addEventListener('DOMContentLoaded', () => {
    updatePictureSources();
    document.querySelectorAll('img[loading="lazy"]').forEach(img => {
      lazyLoadObserver.observe(img);
    });
  });

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updatePictureSources);
  WIDTHS.forEach((bp) => {
    window.matchMedia(`(max-width: ${bp - 1}px)`).addEventListener('change', updatePictureSources);
  });
}

export const BACKDROP_FILTER_MAP = {
  'backdrop-filter-blur-small': 'blur(var(--blur-small))',
  'backdrop-filter-blur-medium': 'blur(var--blur-medium))',
  'backdrop-filter-blur-large': 'blur(var(--blur-large))',
  'backdrop-filter-grayscale-small': 'grayscale(var(--grayscale-small))',
  'backdrop-filter-grayscale-medium': 'grayscale(var(--grayscale-medium))',
  'backdrop-filter-grayscale-large': 'grayscale(var(--grayscale-large))',
};
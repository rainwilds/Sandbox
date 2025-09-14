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
  markupCache.clear(); // Clear cache for debugging
  const isDev = typeof window !== 'undefined' && (
    window.location.href.includes('/dev/') ||
    new URLSearchParams(window.location.search).get('debug') === 'true'
  );

  const cacheKey = JSON.stringify({
    src, lightSrc, darkSrc, alt, lightAlt, darkAlt,
    isDecorative, mobileWidth, tabletWidth, desktopWidth, aspectRatio,
    includeSchema, customClasses, loading, fetchPriority, extraClasses,
    noResponsive, breakpoint, extraStyles
  });

  if (markupCache.has(cacheKey)) {
    if (isDev) console.log('Using cached picture markup for:', { src, lightSrc, darkSrc });
    return markupCache.get(cacheKey);
  }

  src = src.trim().replace('./', '/Sandbox/');
  lightSrc = lightSrc.trim().replace('./', '/Sandbox/');
  darkSrc = darkSrc.trim().replace('./', '/Sandbox/');
  alt = alt.trim();
  lightAlt = lightAlt.trim();
  darkAlt = darkAlt.trim();
  customClasses = customClasses.trim();
  extraStyles = extraStyles.trim();

  const isSvg = src.endsWith('.svg') || lightSrc.endsWith('.svg') || darkSrc.endsWith('.svg');
  const effectiveNoResponsive = noResponsive || isSvg;

  if (isDev) console.log('Generating picture markup for:', { src, lightSrc, darkSrc, alt, lightAlt, darkAlt, noResponsive, effectiveNoResponsive });

  const workerCode = `
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
    const BASE_PATH = '/Sandbox/img/responsive/';
    const VALID_EXTENSIONS = /\\.(jpg|jpeg|png|webp|avif|jxl|svg)$/i;

    function getImageType(src) {
      if (!src) return '';
      const ext = src.split('.').pop().toLowerCase();
      return ext === 'svg' ? 'image/svg+xml' : 'image/' + ext;
    };

    function getBaseFilename(src) {
      if (!src) return null;
      return src.split('/').pop().split('.').slice(0, -1).join('.');
    };

    function parseWidth(widthStr, winWidth) {
      winWidth = winWidth || 1920;
      if (typeof widthStr === 'number') return Math.max(0.1, Math.min(2.0, widthStr / winWidth));
      const vwMatch = widthStr.match(/(\\d+)vw/);
      if (vwMatch) return Math.max(0.1, Math.min(2.0, parseInt(vwMatch[1], 10) / 100));
      const pxMatch = widthStr.match(/(\\d+)px/);
      if (pxMatch) return Math.max(0.1, Math.min(2.0, parseInt(pxMatch[1], 10) / winWidth));
      return 1.0;
    };

    function generateSizes(mobileWidth, tabletWidth, desktopWidth) {
      const parsedWidths = {
        mobile: parseWidth(mobileWidth),
        tablet: parseWidth(tabletWidth),
        desktop: parseWidth(desktopWidth),
      };
      return [
        SIZES_BREAKPOINTS.map((bp) =>
          '(max-width: ' + bp.maxWidth + 'px) ' +
          ((bp.maxWidth <= 768 ? parsedWidths.mobile : bp.maxWidth <= 1024 ? parsedWidths.tablet : parsedWidths.desktop) * 100) + 'vw'
        ).join(', '),
        (DEFAULT_SIZE_VALUE * parsedWidths.desktop) + 'px'
      ].join(', ');
    };

    self.addEventListener('message', (e) => {
      const {
        src, lightSrc, darkSrc, alt, lightAlt, darkAlt,
        isDecorative, mobileWidth, tabletWidth, desktopWidth, aspectRatio,
        includeSchema, customClasses, loading, fetchPriority, extraClasses,
        noResponsive, breakpoint
      } = e.data;

      try {
        const sources = [src, lightSrc, darkSrc].filter(Boolean);
        if (!sources.length) {
          self.postMessage({ markup: '<img src="https://placehold.co/3000x2000" alt="No image source provided" loading="lazy">', error: 'No valid image sources' });
          return;
        }
        for (const source of sources) {
          if (!VALID_EXTENSIONS.test(source)) {
            self.postMessage({ markup: `<img src="${source}" alt="Invalid image source" loading="lazy">`, error: 'Invalid image source: ' + source });
            return;
          }
        }
        if (!isDecorative && !alt && !(lightSrc && lightAlt) && !(darkSrc && darkAlt)) {
          self.postMessage({ markup: '<img src="https://placehold.co/3000x2000" alt="Missing alt text" loading="lazy">', error: 'Alt attribute required' });
          return;
        }

        const validatedBreakpoint = breakpoint && WIDTHS.includes(parseInt(breakpoint, 10)) ? parseInt(breakpoint, 10) : '';
        const primarySrc = lightSrc || darkSrc || src;
        const primaryAlt = isDecorative ? '' : (lightAlt || darkAlt || alt);
        const altAttr = isDecorative ? ' alt="" role="presentation"' : ' alt="' + primaryAlt + '"';
        const loadingAttr = ['eager', 'lazy'].includes(loading) ? ' loading="' + loading + '"' : ' loading="lazy"';
        const fetchPriorityAttr = ['high', 'low', 'auto'].includes(fetchPriority) ? ' fetchpriority="' + fetchPriority + '"' : '';

        const allClasses = [...new Set([customClasses, ...extraClasses].flatMap((c) => c.split(/\\s+/)).filter(Boolean))];
        if (aspectRatio && VALID_ASPECT_RATIOS.has(aspectRatio)) {
          allClasses.push('aspect-ratio-' + aspectRatio.replace('/', '-'));
        }
        allClasses.push('animate', 'animate-fade-in');
        const classAttr = allClasses.length ? ' class="' + allClasses.join(' ') + '"' : '';

        const markup = ['<picture' + classAttr + '>'];

        const generateSrcset = (filename, format) =>
          BASE_PATH + filename + '.' + format + ' 3840w' + ', ' + WIDTHS.map((w) => BASE_PATH + filename + '-' + w + '.' + format + ' ' + w + 'w').join(', ');

        const sizes = generateSizes(mobileWidth, tabletWidth, desktopWidth);
        const baseFilename = getBaseFilename(lightSrc || darkSrc || src);
        const lightBaseFilename = lightSrc ? getBaseFilename(lightSrc) : null;
        const darkBaseFilename = darkSrc ? getBaseFilename(darkSrc) : null;

        if (noResponsive || primarySrc.endsWith('.svg')) {
          if (lightSrc) {
            markup.push(
              '<source media="(prefers-color-scheme: light)" type="' + getImageType(lightSrc) + '" srcset="' + lightSrc + '" sizes="' + sizes + '"' + (isDecorative ? ' alt="" role="presentation"' : lightAlt ? ' alt="' + lightAlt + '"' : '') + '>');
          }
          if (darkSrc) {
            markup.push(
              '<source media="(prefers-color-scheme: dark)" type="' + getImageType(darkSrc) + '" srcset="' + darkSrc + '" sizes="' + sizes + '"' + (isDecorative ? ' alt="" role="presentation"' : darkAlt ? ' alt="' + darkAlt + '"' : '') + '>');
          }
          if (src) {
            markup.push('<source type="' + getImageType(src) + '" srcset="' + src + '" sizes="' + sizes + '"' + altAttr + '>');
          }
        } else {
          FORMATS.forEach((format) => {
            if (lightSrc && lightBaseFilename && !lightSrc.endsWith('.svg')) {
              markup.push(
                '<source media="(prefers-color-scheme: light)" type="image/' + format + '" srcset="' + generateSrcset(lightBaseFilename, format) + '" sizes="' + sizes + '"' + (isDecorative ? ' alt="" role="presentation"' : lightAlt ? ' alt="' + lightAlt + '"' : '') + '>');
            }
            if (darkSrc && darkBaseFilename && !darkSrc.endsWith('.svg')) {
              markup.push(
                '<source media="(prefers-color-scheme: dark)" type="image/' + format + '" srcset="' + generateSrcset(darkBaseFilename, format) + '" sizes="' + sizes + '"' + (isDecorative ? ' alt="" role="presentation"' : darkAlt ? ' alt="' + darkAlt + '"' : '') + '>');
            }
            if (!primarySrc.endsWith('.svg')) {
              markup.push('<source type="image/' + format + '" srcset="' + generateSrcset(baseFilename, format) + '" sizes="' + sizes + '"' + altAttr + '>');
            }
          });
        }

        markup.push(
          '<img src="' + primarySrc + '"' + altAttr + loadingAttr + fetchPriorityAttr + ' onerror="this.src=\'https://placehold.co/3000x2000\'; this.alt=\'' + (primaryAlt || 'Placeholder image') + '\'; this.onerror=null;">'
        );
        markup.push('</picture>');

        if (includeSchema) {
          markup.push(
            '<script type="application/ld+json">{"@context":"http://schema.org","@type":"ImageObject","url":"' + primarySrc + '","alternateName":"' + primaryAlt + '"}</script>'
          );
        }

        const result = markup.join('');
        self.postMessage({ markup: result });
      } catch (error) {
        const primarySrc = lightSrc || darkSrc || src;
        const primaryAlt = lightAlt || darkAlt || alt || 'Error loading image';
        const fallbackImg = `<img src="${primarySrc || 'https://placehold.co/3000x2000'}" alt="${primaryAlt}" loading="lazy">`;
        self.postMessage({ markup: fallbackImg, error: error.message });
      }
    });
  `;

  if (isDev) {
    console.log('Worker code:', workerCode);
    const lines = workerCode.split('\n');
    console.log('Line 118:', lines[117]);
    console.log('Line 119:', lines[118]);
    console.log('Line 120:', lines[119]);
    console.log('Line 121:', lines[120]);
    try {
      new Function(workerCode);
      console.log('Worker code syntax is valid');
    } catch (syntaxError) {
      console.error('Syntax error in workerCode:', syntaxError);
    }
  }

  const blob = new Blob([workerCode], { type: 'application/javascript' });
  const workerUrl = URL.createObjectURL(blob);

  return new Promise((resolve) => {
    const worker = new Worker(workerUrl);
    worker.onmessage = (e) => {
      const { markup, error, src: workerSrc, lightSrc: workerLightSrc, darkSrc: workerDarkSrc } = e.data;
      if (error) {
        if (isDev) console.error('Image Worker error:', error, { workerSrc, workerLightSrc, workerDarkSrc });
        resolve(markup);
      } else {
        markupCache.set(cacheKey, markup);
        if (isDev) console.log('Image Worker generated markup:', markup.substring(0, 200));
        resolve(markup);
      }
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
    };
    worker.onerror = (err) => {
      if (isDev) console.error('Image Worker failed:', err, {
        message: err.message,
        filename: err.filename,
        lineno: err.lineno,
        colno: err.colno,
        src, lightSrc, darkSrc
      });
      const primarySrc = lightSrc || darkSrc || src;
      const primaryAlt = lightAlt || darkAlt || alt || 'Error loading image';
      const fallbackImg = `<img src="${primarySrc || 'https://placehold.co/3000x2000'}" alt="${primaryAlt}" loading="lazy">`;
      resolve(fallbackImg);
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
    };
    worker.postMessage({
      src, lightSrc, darkSrc, alt, lightAlt, darkAlt,
      isDecorative, mobileWidth, tabletWidth, desktopWidth, aspectRatio,
      includeSchema, customClasses, loading, fetchPriority, extraClasses,
      noResponsive, breakpoint
    });
  }).catch((error) => {
    if (isDev) console.error('Promise failed in generatePictureMarkup:', error);
    const primarySrc = lightSrc || darkSrc || src;
    const primaryAlt = lightAlt || darkAlt || alt || 'Error loading image';
    return `<img src="${primarySrc || 'https://placehold.co/3000x2000'}" alt="${primaryAlt}" loading="lazy">`;
  });
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
  'backdrop-filter-blur-medium': 'blur(var(--blur-medium))',
  'backdrop-filter-blur-large': 'blur(var(--blur-large))',
  'backdrop-filter-grayscale-small': 'grayscale(var(--grayscale-small))',
  'backdrop-filter-grayscale-medium': 'grayscale(var(--grayscale-medium))',
  'backdrop-filter-grayscale-large': 'grayscale(var(--grayscale-large))',
};
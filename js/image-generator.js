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

  if (isDev) console.log('Generating picture markup for:', { src, lightSrc, darkSrc, alt, lightAlt, darkAlt, noResponsive });

  const workerCode = `
    self.addEventListener('message', (e) => {
      const { src } = e.data;
      self.postMessage({ markup: '<img src="' + src + '" alt="Test">', error: null });
    });
  `;

  if (isDev) {
    console.log('Worker code:', workerCode);
    const lines = workerCode.split('\n');
    console.log('Line 1:', lines[0]);
    console.log('Line 2:', lines[1]);
    console.log('Line 3:', lines[2]);
    console.log('Line 4:', lines[3]);
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
      noResponsive: effectiveNoResponsive, breakpoint
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
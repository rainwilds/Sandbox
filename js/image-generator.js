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
  breakpoint = ''
} = {}) {
  const validExtensions = /\.(jpg|jpeg|png|webp|avif|jxl|svg)$/i;

  // Validate image sources
  if (!src && !fullSrc && !iconSrc && !lightSrc && !darkSrc && !fullLightSrc && !fullDarkSrc && !iconLightSrc && !iconDarkSrc) {
    console.error('At least one valid image source must be provided');
    return '';
  }
  if (src && !validExtensions.test(src)) {
    console.error('The "src" parameter must be a valid image path');
    return '';
  }
  if (fullSrc && !validExtensions.test(fullSrc)) {
    console.error('The "fullSrc" parameter must be a valid image path');
    return '';
  }
  if (iconSrc && !validExtensions.test(iconSrc)) {
    console.error('The "iconSrc" parameter must be a valid image path');
    return '';
  }
  if (lightSrc && !validExtensions.test(lightSrc)) {
    console.error('Invalid "lightSrc" parameter');
    return '';
  }
  if (darkSrc && !validExtensions.test(darkSrc)) {
    console.error('Invalid "darkSrc" parameter');
    return '';
  }
  if (fullLightSrc && !validExtensions.test(fullLightSrc)) {
    console.error('Invalid "fullLightSrc" parameter');
    return '';
  }
  if (fullDarkSrc && !validExtensions.test(fullDarkSrc)) {
    console.error('Invalid "fullDarkSrc" parameter');
    return '';
  }
  if (iconLightSrc && !validExtensions.test(iconLightSrc)) {
    console.error('Invalid "iconLightSrc" parameter');
    return '';
  }
  if (iconDarkSrc && !validExtensions.test(iconDarkSrc)) {
    console.error('Invalid "iconDarkSrc" parameter');
    return '';
  }

  // Validate alt attributes for non-decorative images
  const isLogo = fullSrc || fullLightSrc || fullDarkSrc || iconSrc || iconLightSrc || iconDarkSrc;
  if (!isDecorative) {
    if (isLogo) {
      // Logo-specific validation
      if (fullSrc && !fullAlt) {
        console.error('An alt attribute is required for non-decorative full logos when using fullSrc');
        return '';
      }
      if (iconSrc && !iconAlt) {
        console.error('An alt attribute is required for non-decorative icon logos when using iconSrc');
        return '';
      }
      if (fullLightSrc && !fullLightAlt) {
        console.error('fullLightAlt is required when fullLightSrc is provided');
        return '';
      }
      if (fullDarkSrc && !fullDarkAlt) {
        console.error('fullDarkAlt is required when fullDarkSrc is provided');
        return '';
      }
      if (iconLightSrc && !iconLightAlt) {
        console.error('iconLightAlt is required when iconLightSrc is provided');
        return '';
      }
      if (iconDarkSrc && !iconDarkAlt) {
        console.error('iconDarkAlt is required when iconDarkSrc is provided');
        return '';
      }
    } else {
      // Non-logo validation
      if (!alt && !(lightSrc && lightAlt) && !(darkSrc && darkAlt)) {
        console.error('An alt attribute (or lightAlt for lightSrc, or darkAlt for darkSrc) is required for non-decorative images');
        return '';
      }
    }
  }

  // Validate breakpoint
  let validatedBreakpoint = '';
  if (breakpoint) {
    const bp = parseInt(breakpoint, 10);
    if (WIDTHS.includes(bp)) {
      validatedBreakpoint = bp;
    } else {
      console.warn(`Invalid breakpoint "${breakpoint}". Must be one of ${WIDTHS.join(', ')}. Ignoring.`);
    }
  }

  // Determine primary sources and alts
  const primarySrc = fullSrc || fullLightSrc || fullDarkSrc || iconSrc || iconLightSrc || iconDarkSrc || src;
  const primaryLightSrc = fullLightSrc || iconLightSrc || lightSrc;
  const primaryDarkSrc = fullDarkSrc || iconDarkSrc || darkSrc;
  const primaryAlt = fullAlt || iconAlt || alt;
  const primaryLightAlt = fullLightAlt || iconLightAlt || lightAlt;
  const primaryDarkAlt = fullDarkAlt || iconDarkAlt || darkAlt;

  // Combine classes
  const allClasses = [...new Set([...customClasses.trim().split(/\s+/).filter(Boolean), ...extraClasses])];
  if (aspectRatio && VALID_ASPECT_RATIOS.has(aspectRatio)) {
    allClasses.push(`aspect-ratio-${aspectRatio.replace('/', '-')}`);
  }
  const classAttr = allClasses.length ? ` class="${allClasses.join(' ')} animate animate-fade-in"` : ' class="animate animate-fade-in"';

  // Handle alt attributes
  const altAttr = isDecorative ? ' alt="" role="presentation"' : (primaryAlt ? ` alt="${primaryAlt}"` : (primaryLightAlt ? ` alt="${primaryLightAlt}"` : ''));

  const validLoading = ['eager', 'lazy'].includes(loading) ? loading : 'lazy';
  const validFetchPriority = ['high', 'low', 'auto'].includes(fetchPriority) ? fetchPriority : '';
  const loadingAttr = validLoading ? ` loading="${validLoading}"` : '';
  const fetchPriorityAttr = validFetchPriority ? ` fetchpriority="${validFetchPriority}"` : '';

  // Generate <picture> markup
  let pictureMarkup = `<picture${classAttr}>`;

  if (isLogo) {
    // Logo case: Use original source URLs without responsive srcset
    console.log('Generating logo markup with sources:', { iconSrc, iconLightSrc, iconDarkSrc, fullSrc, fullLightSrc, fullDarkSrc, breakpoint: validatedBreakpoint });
    if (validatedBreakpoint && (iconSrc || iconLightSrc || iconDarkSrc)) {
      // Add sources for icon logo (below breakpoint)
      if (iconSrc) {
        pictureMarkup += `
          <source media="(max-width: ${validatedBreakpoint - 1}px)" src="${iconSrc}" sizes="${desktopWidth}" ${isDecorative ? ' alt="" role="presentation"' : (iconAlt ? ` alt="${iconAlt}"` : '')}>`;
      }
      if (iconLightSrc) {
        pictureMarkup += `
          <source media="(max-width: ${validatedBreakpoint - 1}px) and (prefers-color-scheme: light)" src="${iconLightSrc}" sizes="${desktopWidth}" ${isDecorative ? ' alt="" role="presentation"' : (iconLightAlt ? ` alt="${iconLightAlt}"` : '')}>`;
      }
      if (iconDarkSrc) {
        pictureMarkup += `
          <source media="(max-width: ${validatedBreakpoint - 1}px) and (prefers-color-scheme: dark)" src="${iconDarkSrc}" sizes="${desktopWidth}" ${isDecorative ? ' alt="" role="presentation"' : (iconDarkAlt ? ` alt="${iconDarkAlt}"` : '')}>`;
      }
    }

    // Add sources for full logo (above breakpoint or default)
    if (fullSrc || (!iconSrc && !iconLightSrc && !iconDarkSrc)) {
      pictureMarkup += `
        <source src="${fullSrc || primarySrc}" sizes="${desktopWidth}" ${altAttr}>`;
    }
    if (fullLightSrc || (!iconLightSrc && primaryLightSrc)) {
      pictureMarkup += `
        <source media="(prefers-color-scheme: light)" src="${fullLightSrc || primaryLightSrc}" sizes="${desktopWidth}" ${isDecorative ? ' alt="" role="presentation"' : (primaryLightAlt ? ` alt="${primaryLightAlt}"` : '')}>`;
    }
    if (fullDarkSrc || (!iconDarkSrc && primaryDarkSrc)) {
      pictureMarkup += `
        <source media="(prefers-color-scheme: dark)" src="${fullDarkSrc || primaryDarkSrc}" sizes="${desktopWidth}" ${isDecorative ? ' alt="" role="presentation"' : (primaryDarkAlt ? ` alt="${primaryDarkAlt}"` : '')}>`;
    }
  } else {
    // Non-logo case: Generate responsive srcset
    console.log('Generating non-logo markup with sources:', { src, lightSrc, darkSrc });
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

    if (noResponsive) {
      if (lightSrc) {
        pictureMarkup += `<source media="(prefers-color-scheme: light)" src="${lightSrc}" sizes="${sizes}" ${isDecorative ? ' alt="" role="presentation"' : (lightAlt ? ` alt="${lightAlt}"` : '')}>`;
      }
      if (darkSrc) {
        pictureMarkup += `<source media="(prefers-color-scheme: dark)" src="${darkSrc}" sizes="${sizes}" ${isDecorative ? ' alt="" role="presentation"' : (darkAlt ? ` alt="${darkAlt}"` : '')}>`;
      }
      pictureMarkup += `<source src="${src}" sizes="${sizes}" ${altAttr}>`;
    } else {
      FORMATS.forEach(format => {
        const baseFilename = src.split('/').pop().split('.').slice(0, -1).join('.');
        let lightBaseFilename = lightSrc ? lightSrc.split('/').pop().split('.').slice(0, -1).join('.') : null;
        let darkBaseFilename = darkSrc ? darkSrc.split('/').pop().split('.').slice(0, -1).join('.') : null;
        pictureMarkup += `<source type="image/${format}" srcset="${generateSrcset(baseFilename, format)}" sizes="${sizes}" ${altAttr}>`;
        if (lightSrc && lightBaseFilename) {
          pictureMarkup += `<source media="(prefers-color-scheme: light)" type="image/${format}" srcset="${generateSrcset(lightBaseFilename, format)}" sizes="${sizes}" ${isDecorative ? ' alt="" role="presentation"' : (lightAlt ? ` alt="${lightAlt}"` : '')}>`;
        }
        if (darkSrc && darkBaseFilename) {
          pictureMarkup += `<source media="(prefers-color-scheme: dark)" type="image/${format}" srcset="${generateSrcset(darkBaseFilename, format)}" sizes="${sizes}" ${isDecorative ? ' alt="" role="presentation"' : (darkAlt ? ` alt="${darkAlt}"` : '')}>`;
        }
      });
    }
  }

  // Add fallback img tag
  pictureMarkup += `
    <img src="${primarySrc}" ${altAttr} ${loadingAttr} ${fetchPriorityAttr} width="${desktopWidth}" height="auto" onerror="this.src='https://placehold.co/3000x2000';${isDecorative ? '' : `this.alt='${primaryAlt || primaryLightAlt || primaryDarkAlt || 'Placeholder image'}';`}this.onerror=null;">
  </picture>`;

  // Add schema if requested
  if (includeSchema) {
    pictureMarkup = `<script type="application/ld+json">
      {
        "@context": "http://schema.org",
        "@type": "ImageObject",
        "url": "${primarySrc}",
        "alternateName": "${primaryAlt || primaryLightAlt || primaryDarkAlt || ''}"
      }
    </script>` + pictureMarkup;
  }

  console.log('Generated picture markup:', pictureMarkup);
  return pictureMarkup;
}

export const BACKDROP_FILTER_MAP = {
  'backdrop-filter-blur-small': 'blur(var(--blur-small))',
  'backdrop-filter-blur-medium': 'blur(var(--blur-medium))',
  'backdrop-filter-blur-large': 'blur(var(--blur-large))',
  'backdrop-filter-grayscale-small': 'grayscale(var(--grayscale-small))',
  'backdrop-filter-grayscale-medium': 'grayscale(var(--grayscale-medium))',
  'backdrop-filter-grayscale-large': 'grayscale(var(--grayscale-large))'
};
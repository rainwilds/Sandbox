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
  if (!src && !fullSrc && !iconSrc && !(fullLightSrc && fullDarkSrc) && !(iconLightSrc && iconDarkSrc)) {
    console.error('At least one of "src", "fullSrc", "iconSrc", or both "fullLightSrc" and "fullDarkSrc", or both "iconLightSrc" and "iconDarkSrc" must be provided');
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
  if (!isDecorative) {
    if (fullSrc && !fullAlt) {
      console.error('An alt attribute is required for non-decorative full logos when using fullSrc');
      return '';
    }
    if (iconSrc && !iconAlt) {
      console.error('An alt attribute is required for non-decorative icon logos when using iconSrc');
      return '';
    }
    if (fullLightSrc && fullDarkSrc && !(fullLightAlt && fullDarkAlt)) {
      console.error('Both fullLightAlt and fullDarkAlt are required when fullLightSrc and fullDarkSrc are provided');
      return '';
    }
    if (iconLightSrc && iconDarkSrc && !(iconLightAlt && iconDarkAlt)) {
      console.error('Both iconLightAlt and iconDarkAlt are required when iconLightSrc and iconDarkSrc are provided');
      return '';
    }
    if (src && !alt) {
      console.error('An alt attribute is required for non-decorative images when using src');
      return '';
    }
    if (lightSrc && darkSrc && !(lightAlt && darkAlt)) {
      console.error('Both lightAlt and darkAlt are required when lightSrc and darkSrc are provided');
      return '';
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

  // Determine if this is a logo call (full or icon sources provided)
  const isLogo = fullSrc || fullLightSrc || fullDarkSrc || iconSrc || iconLightSrc || iconDarkSrc;

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
  const altAttr = isDecorative ? ' alt="" role="presentation"' : (primaryAlt ? ` alt="${primaryAlt}"` : (primaryLightAlt && primaryDarkAlt ? ` alt="${primaryLightAlt}"` : ''));

  const validLoading = ['eager', 'lazy'].includes(loading) ? loading : 'lazy';
  const validFetchPriority = ['high', 'low', 'auto'].includes(fetchPriority) ? fetchPriority : '';
  const loadingAttr = validLoading ? ` loading="${validLoading}"` : '';
  const fetchPriorityAttr = validFetchPriority ? ` fetchpriority="${validFetchPriority}"` : '';

  // Generate <picture> markup
  let pictureMarkup = '<picture>';

  if (isLogo) {
    // Logo case: Use original source URLs without responsive srcset
    if (validatedBreakpoint && (iconSrc || iconLightSrc || iconDarkSrc)) {
      // Add sources for icon logo (below breakpoint)
      if (iconSrc) {
        pictureMarkup += `
          <source media="(max-width: ${validatedBreakpoint - 1}px)" src="${iconSrc}" ${isDecorative ? ' alt="" role="presentation"' : (iconAlt ? ` alt="${iconAlt}"` : '')}>`;
      }
      if (iconLightSrc) {
        pictureMarkup += `
          <source media="(max-width: ${validatedBreakpoint - 1}px) and (prefers-color-scheme: light)" src="${iconLightSrc}" ${isDecorative ? ' alt="" role="presentation"' : (iconLightAlt ? ` alt="${iconLightAlt}"` : '')}>`;
      }
      if (iconDarkSrc) {
        pictureMarkup += `
          <source media="(max-width: ${validatedBreakpoint - 1}px) and (prefers-color-scheme: dark)" src="${iconDarkSrc}" ${isDecorative ? ' alt="" role="presentation"' : (iconDarkAlt ? ` alt="${iconDarkAlt}"` : '')}>`;
      }
    }

    // Add sources for full logo (above breakpoint or default)
    if (fullSrc || (!iconSrc && !iconLightSrc && !iconDarkSrc)) {
      pictureMarkup += `
        <source src="${fullSrc || primarySrc}" ${altAttr}>`;
    }
    if (fullLightSrc || (!iconLightSrc && primaryLightSrc)) {
      pictureMarkup += `
        <source media="(prefers-color-scheme: light)" src="${fullLightSrc || primaryLightSrc}" ${altAttr}>`;
    }
    if (fullDarkSrc || (!iconDarkSrc && primaryDarkSrc)) {
      pictureMarkup += `
        <source media="(prefers-color-scheme: dark)" src="${fullDarkSrc || primaryDarkSrc}" ${altAttr}>`;
    }
  } else {
    // Non-logo case: Generate responsive srcset
    let sourceSets = [];
    FORMATS.forEach(format => {
      WIDTHS.forEach(width => {
        if (!noResponsive) {
          const baseFilename = src.split('/').pop().split('.').slice(0, -1).join('.');
          sourceSets.push(`${BASE_PATH}${baseFilename}-${width}.${format} ${width}w`);
          if (lightSrc) {
            const lightBaseFilename = lightSrc.split('/').pop().split('.').slice(0, -1).join('.');
            sourceSets.push(`${BASE_PATH}${lightBaseFilename}-${width}.${format} ${width}w`);
          }
          if (darkSrc) {
            const darkBaseFilename = darkSrc.split('/').pop().split('.').slice(0, -1).join('.');
            sourceSets.push(`${BASE_PATH}${darkBaseFilename}-${width}.${format} ${width}w`);
          }
        }
      });
    });

    FORMATS.forEach(format => {
      if (sourceSets.length) {
        pictureMarkup += `
          <source type="image/${format}" srcset="${sourceSets.join(', ')}" ${altAttr}>`;
      }
      if (lightSrc) {
        pictureMarkup += `
          <source media="(prefers-color-scheme: light)" type="image/${format}" srcset="${sourceSets.join(', ')}" ${altAttr}>`;
      }
      if (darkSrc) {
        pictureMarkup += `
          <source media="(prefers-color-scheme: dark)" type="image/${format}" srcset="${sourceSets.join(', ')}" ${altAttr}>`;
      }
    });
  }

  // Add fallback img tag
  pictureMarkup += `
    <img src="${primarySrc}" ${altAttr} ${classAttr} ${loadingAttr} ${fetchPriorityAttr} width="${desktopWidth}" height="auto">
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

  return pictureMarkup;
}
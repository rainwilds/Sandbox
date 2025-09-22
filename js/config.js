/* global fetch, document, window */

// Global config cache (populated by head-generator.js)
let cachedConfig = null;

/**
 * Get the full configuration object
 * @returns {Promise<Object>} The configuration object
 */
export async function getConfig() {
  // Check if head-generator already loaded it globally
  if (window.__SETUP_CONFIG__) {
    cachedConfig = window.__SETUP_CONFIG__;
    return cachedConfig;
  }

  // Check local cache
  if (cachedConfig) {
    return cachedConfig;
  }

  // Relative path from /js/ to /JSON/setup.json
  const setupPath = '../JSON/setup.json';

  try {
    // Default setup for merging
    const defaultSetup = {
      fonts: [],
      general: {
        title: 'Default Title',
        description: 'Default Description',
        canonical: window.location.href,
        themeColor: '#000000',
        ogLocale: 'en_US',
        ogType: 'website',
        siteName: 'Site Name',
        favicons: []
      },
      business: {},
      font_awesome: { kitUrl: 'https://kit.fontawesome.com/85d1e578b1.js' },
      media: {
        responsive_images: {
          directory_path: '/img/responsive/'  // Fallback
        }
      }
    };

    // Try to use the preloaded resource first
    const preloadLink = document.querySelector(`link[rel="preload"][href="${setupPath}"]`);
    let response;
    
    if (preloadLink) {
      response = await fetch(setupPath, { 
        cache: 'only-if-cached',
        mode: 'same-origin'
      });
    } else {
      // Fallback to regular fetch
      response = await fetch(setupPath, { cache: 'force-cache' });
    }

    if (!response.ok) throw new Error(`HTTP ${response.status}: ${setupPath}`);

    const jsonText = await response.text();
    const setup = JSON.parse(jsonText);
    
    // Merge with defaults to ensure required structure
    cachedConfig = {
      ...defaultSetup,
      ...setup,
      general: { ...defaultSetup.general, ...setup.general },
      business: { ...defaultSetup.business, ...setup.business },
      media: { ...defaultSetup.media, ...(setup.media || {}) }
    };

    // Cache globally for other modules if not already set
    if (!window.__SETUP_CONFIG__) {
      window.__SETUP_CONFIG__ = cachedConfig;
    }

    if (typeof window !== 'undefined' && window.console && window.console.debug) {
      console.debug('Loaded configuration from:', setupPath, { 
        keys: Object.keys(cachedConfig),
        hasMedia: !!cachedConfig.media,
        responsivePath: cachedConfig.media?.responsive_images?.directory_path,
        businessName: cachedConfig.business?.name
      });
    }

    return cachedConfig;
  } catch (error) {
    console.warn(`Failed to load config from ${setupPath}, using defaults:`, error);
    
    // Use defaults and cache globally
    cachedConfig = defaultSetup;
    if (!window.__SETUP_CONFIG__) {
      window.__SETUP_CONFIG__ = cachedConfig;
    }
    return cachedConfig;
  }
}

/**
 * Get the responsive image directory path
 * @returns {Promise<string>} The directory path
 */
export async function getImageResponsivePath() {
  const config = await getConfig();
  return config.media?.responsive_images?.directory_path || '/img/responsive/';
}

/**
 * Get business information
 * @returns {Promise<Object>} Business configuration
 */
export async function getBusinessInfo() {
  const config = await getConfig();
  return config.business || {};
}

/**
 * Get theme colors
 * @returns {Promise<Object>} Theme color configuration
 */
export async function getThemeColors() {
  const config = await getConfig();
  return config.general?.theme_colors || {};
}

/**
 * Get general configuration
 * @returns {Promise<Object>} General configuration
 */
export async function getGeneralConfig() {
  const config = await getConfig();
  return config.general || {};
}

// Synchronous access for immediate use (with global fallback)
export function getSyncImageResponsivePath() {
  return window.__SETUP_CONFIG__?.media?.responsive_images?.directory_path || '/img/responsive/';
}
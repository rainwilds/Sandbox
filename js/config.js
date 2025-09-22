/* global fetch, document, window, console */

// Browser-compatible dev detection
const isDev = typeof window !== 'undefined' && (
  window.location.href.includes('/dev/') ||
  new URLSearchParams(window.location.search).get('debug') === 'true'
);

// Debug logging methods
const log = (message, data = null) => {
    if (isDev) {
        console.groupCollapsed(`%c[Config] ${new Date().toLocaleTimeString()} ${message}`, 'color: #2196F3; font-weight: bold;');
        if (data) {
            console.log('%cData:', 'color: #4CAF50;', data);
        }
        console.trace();
        console.groupEnd();
    }
};

const warn = (message, data = null) => {
    if (isDev) {
        console.groupCollapsed(`%c[Config] ⚠️ ${new Date().toLocaleTimeString()} ${message}`, 'color: #FF9800; font-weight: bold;');
        if (data) {
            console.log('%cData:', 'color: #4CAF50;', data);
        }
        console.trace();
        console.groupEnd();
    }
};

const error = (message, data = null) => {
    if (isDev) {
        console.groupCollapsed(`%c[Config] ❌ ${new Date().toLocaleTimeString()} ${message}`, 'color: #F44336; font-weight: bold;');
        if (data) {
            console.log('%cData:', 'color: #4CAF50;', data);
        }
        console.trace();
        console.groupEnd();
    }
    // Always log errors to console.error for visibility
    console.error(`[Config] ${message}`, data);
};

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
    log('Using cached config from global');
    return cachedConfig;
  }

  // Check local cache
  if (cachedConfig) {
    log('Using local config cache');
    return cachedConfig;
  }

  // Use ROOT-relative path to match HTML preload (from /js/ perspective, this is ../JSON/)
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
          directory_path: '/Sandbox/img/responsive/'  // Your correct path!
        }
      }
    };

    // Try to use the preloaded resource first
    const preloadLink = document.querySelector('link[rel="preload"][href="./JSON/setup.json"]');
    let response;
    
    if (preloadLink) {
      log('Found preload link, attempting to use cached resource');
      // Use the path that matches the preload (root-relative)
      response = await fetch('./JSON/setup.json', { 
        cache: 'only-if-cached',
        mode: 'cors',
        credentials: 'omit'
      });
    } else {
      // Fallback to regular fetch with relative path from /js/
      log(`No preload found, fetching from: ${setupPath}`);
      response = await fetch(setupPath, { 
        cache: 'force-cache',
        mode: 'cors',
        credentials: 'omit'
      });
    }

    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.url || setupPath}`);

    const jsonText = await response.text();
    const setup = JSON.parse(jsonText);
    
    // Merge with defaults to ensure required structure
    cachedConfig = {
      ...defaultSetup,
      ...setup,
      general: { ...defaultSetup.general, ...(setup.general || {}) },
      business: { ...defaultSetup.business, ...(setup.business || {}) },
      media: { ...defaultSetup.media, ...(setup.media || {}) }
    };

    // Cache globally for other modules if not already set
    if (!window.__SETUP_CONFIG__) {
      window.__SETUP_CONFIG__ = cachedConfig;
    }

    log('Configuration loaded successfully', { 
      path: preloadLink ? './JSON/setup.json' : setupPath,
      keys: Object.keys(cachedConfig),
      hasMedia: !!cachedConfig.media,
      responsivePath: cachedConfig.media?.responsive_images?.directory_path,
      businessName: cachedConfig.business?.name
    });

    return cachedConfig;
  } catch (err) {
    error(`Failed to load config from ${setupPath}:`, { 
      error: err.message,
      stack: err.stack 
    });
    
    // Use defaults and cache globally
    cachedConfig = defaultSetup;
    if (!window.__SETUP_CONFIG__) {
      window.__SETUP_CONFIG__ = cachedConfig;
    }
    warn('Using default configuration');
    return cachedConfig;
  }
}

/**
 * Get the responsive image directory path
 * @returns {Promise<string>} The directory path
 */
export async function getImageResponsivePath() {
  log('Getting image responsive path');
  const config = await getConfig();
  const path = config.media?.responsive_images?.directory_path || '/Sandbox/img/responsive/';
  log(`Responsive image path: ${path}`);
  return path;
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
  return window.__SETUP_CONFIG__?.media?.responsive_images?.directory_path || '/Sandbox/img/responsive/';
}
/* global fetch, document, window, console */

// Use strict mode for better compliance and error catching
'use strict';

// Browser-compatible dev detection (modernized with URL API)
const isDev = typeof window !== 'undefined' && (
  window.location.pathname.includes('/dev/') ||
  new URLSearchParams(window.location.search).get('debug') === 'true'
);

// Debug logging methods (consolidated and optimized)
const createLogger = (prefix) => ({
  log: (message, data = null) => {
    if (isDev) {
      console.groupCollapsed(`%c[${prefix}] ${new Date().toLocaleTimeString()} ${message}`, 'color: #2196F3; font-weight: bold;');
      if (data) console.log('%cData:', 'color: #4CAF50;', data);
      console.trace();
      console.groupEnd();
    }
  },
  warn: (message, data = null) => {
    if (isDev) {
      console.groupCollapsed(`%c[${prefix}] ⚠️ ${new Date().toLocaleTimeString()} ${message}`, 'color: #FF9800; font-weight: bold;');
      if (data) console.log('%cData:', 'color: #4CAF50;', data);
      console.trace();
      console.groupEnd();
    }
  },
  error: (message, data = null) => {
    if (isDev) {
      console.groupCollapsed(`%c[${prefix}] ❌ ${new Date().toLocaleTimeString()} ${message}`, 'color: #F44336; font-weight: bold;');
      if (data) console.log('%cData:', 'color: #4CAF50;', data);
      console.trace();
      console.groupEnd();
    }
    console.error(`[${prefix}] ${message}`, data);
  }
});

const logger = createLogger('Config');

// Global config cache (populated by head-generator.js or this module)
let cachedConfig = null;

// Default setup for merging (optimized structure, paths relative to base)
const defaultSetup = {
  fonts: [],
  general: {
    basePath: '/', // Fallback to root; overridden by setup.json
    title: 'Default Title',
    description: 'Default Description',
    canonical: window.location.href,
    themeColor: '#000000',
    ogLocale: 'en_US',
    ogType: 'website',
    siteName: 'Site Name',
    favicons: [
      { rel: 'apple-touch-icon', sizes: '180x180', href: './img/icons/apple-touch-icon.png' },
      { rel: 'icon', type: 'image/png', sizes: '32x32', href: './img/icons/favicon-32x32.png' },
      { rel: 'icon', type: 'image/png', sizes: '16x16', href: './img/icons/favicon-16x16.png' },
      { rel: 'icon', type: 'image/x-icon', href: './img/icons/favicon.ico' }
    ],
    robots: 'index, follow',
    x: {
      card: 'summary_large_image',
      domain: window.location.hostname
    },
    theme_colors: {
      light: '#000000',
      dark: '#000000'
    }
  },
  business: {},
  font_awesome: { kitUrl: 'https://kit.fontawesome.com/85d1e578b1.js' },
  media: {
    responsive_images: {
      directory_path: 'img/responsive/' // Relative to basePath
    },
    primary_images: {
      directory_path: 'img/primary/' // Relative to basePath
    }
  }
};

/**
 * Get the full configuration object
 * @returns {Promise<Object>} The configuration object
 */
export async function getConfig() {
  // Check global cache first (set by head-generator or others)
  if (window.__SETUP_CONFIG__) {
    cachedConfig = window.__SETUP_CONFIG__;
    logger.log('Using cached config from global');
    return cachedConfig;
  }

  // Check local cache
  if (cachedConfig) {
    logger.log('Using local config cache');
    return cachedConfig;
  }

  // Root-relative path for consistency with HTML preload
  const setupPath = './JSON/setup.json';

  try {
    logger.log(`Fetching config with force-cache from: ${setupPath}`);
    const response = await fetch(setupPath, {
      cache: 'force-cache'
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}: ${setupPath}`);

    const setup = await response.json();

    // Merge with defaults using modern spread (ensures deep merge for objects)
    cachedConfig = {
      ...defaultSetup,
      ...setup,
      general: { ...defaultSetup.general, ...(setup.general || {}) },
      business: { ...defaultSetup.business, ...(setup.business || {}) },
      media: { ...defaultSetup.media, ...(setup.media || {}) },
      fonts: setup.fonts || defaultSetup.fonts,
      font_awesome: { ...defaultSetup.font_awesome, ...(setup.font_awesome || {}) }
    };

    // Cache globally for other modules
    window.__SETUP_CONFIG__ = cachedConfig;

    logger.log('Configuration loaded successfully', {
      path: setupPath,
      keys: Object.keys(cachedConfig),
      hasMedia: !!cachedConfig.media,
      responsivePath: cachedConfig.media?.responsive_images?.directory_path,
      primaryPath: cachedConfig.media?.primary_images?.directory_path,
      basePath: cachedConfig.general?.basePath,
      businessName: cachedConfig.business?.name
    });

    return cachedConfig;
  } catch (err) {
    logger.error(`Failed to load config from ${setupPath}:`, {
      error: err.message,
      stack: err.stack
    });

    // Fallback to defaults and cache
    cachedConfig = defaultSetup;
    window.__SETUP_CONFIG__ = cachedConfig;
    logger.warn('Using default configuration');
    return cachedConfig;
  }
}

/**
 * Get the responsive image directory path (derived from basePath)
 * @returns {Promise<string>} The directory path
 */
export async function getImageResponsivePath() {
  const config = await getConfig();
  const relativePath = config.media?.responsive_images?.directory_path || 'img/responsive/';
  return config.general?.basePath + relativePath;
}

/**
 * Get the primary images directory path (derived from basePath)
 * @returns {Promise<string>} The directory path
 */
export async function getImagePrimaryPath() {
  const config = await getConfig();
  const relativePath = config.media?.primary_images?.directory_path || 'img/primary/';
  return config.general?.basePath + relativePath;
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
  const relativePath = window.__SETUP_CONFIG__?.media?.responsive_images?.directory_path || 'img/responsive/';
  return window.__SETUP_CONFIG__?.general?.basePath + relativePath;
}

// Synchronous access for primary images
export function getSyncImagePrimaryPath() {
  const relativePath = window.__SETUP_CONFIG__?.media?.primary_images?.directory_path || 'img/primary/';
  return window.__SETUP_CONFIG__?.general?.basePath + relativePath;
}
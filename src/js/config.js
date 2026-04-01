/* global fetch, window, console */
'use strict';

/**
 * Rainwilds 2026 Config Module
 * Dynamically adapts paths using context-aware relative routing.
 */

// Helper to determine the relative path to the site root
function getSiteRoot() {
  const pathname = window.location.pathname;
  // If we are in the blog directory, step up one level to the root
  if (pathname.includes('/blog/')) {
    return '../';
  }
  // Default for root level pages (index, about, etc.)
  return './';
}

export async function getConfig() {
  if (window.__SETUP_CONFIG__) return window.__SETUP_CONFIG__;

  const root = getSiteRoot();
  const setupPath = `${root}JSON/setup.json`;

  try {
    const response = await fetch(setupPath, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const setup = await response.json();

    // Force the base path to be our dynamic relative root
    setup.general.basePath = root;
    console.log(`[Config] Adaptive Environment Set. Base Path: '${root}'`);

    window.__SETUP_CONFIG__ = setup;
    return setup;
  } catch (err) {
    console.error('[Config] ❌ Error loading setup.json:', err);
    // Fallback safely to relative root instead of a broken absolute path
    const root = getSiteRoot();
    return { general: { basePath: root }, media: {} };
  }
}

// Adaptive path helpers for Web Components
export async function getImageResponsivePath() {
  const config = await getConfig();
  return (config.general?.basePath || getSiteRoot()) + (config.media?.responsive_images?.directory_path || 'img/responsive/');
}

export async function getImagePrimaryPath() {
  const config = await getConfig();
  return (config.general?.basePath || getSiteRoot()) + (config.media?.primary_images?.directory_path || 'img/primary/');
}

export async function getVideoPath() {
  const config = await getConfig();
  return (config.general?.basePath || getSiteRoot()) + (config.media?.videos?.directory_path || 'video/');
}

export async function getLogoPath() {
  const config = await getConfig();
  return (config.general?.basePath || getSiteRoot()) + (config.media?.logos?.directory_path || 'img/logos/');
}
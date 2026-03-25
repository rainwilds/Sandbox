/* global fetch, window, console */
'use strict';

/**
 * Rainwilds 2026 Config Module
 * Dynamically adapts basePath for Local, GitHub, and SiteGround.
 */

export async function getConfig() {
  if (window.__SETUP_CONFIG__) return window.__SETUP_CONFIG__;

  const setupPath = './JSON/setup.json';

  try {
    const response = await fetch(setupPath, { cache: 'no-cache' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const setup = await response.json();

    const hostname = window.location.hostname;
    const pathname = window.location.pathname;

    // --- ADAPTIVE PATH LOGIC ---
    if (hostname.includes('github.io')) {
      // Extracts repo name from URL on GitHub Pages
      const repoName = pathname.split('/')[1]; 
      setup.general.basePath = `/${repoName}/`;
      console.log(`[Config] GitHub Environment: ${setup.general.basePath}`);
    } else {
      // Forces root path for Localhost and SiteGround
      setup.general.basePath = '/';
      console.log('[Config] Root Environment Detected (Local/SiteGround)');
    }

    window.__SETUP_CONFIG__ = setup;
    return setup;
  } catch (err) {
    console.error('[Config] ❌ Error loading setup.json:', err);
    return { general: { basePath: '/' }, media: {} };
  }
}

// Adaptive path helpers for Web Components
export async function getImageResponsivePath() {
  const config = await getConfig();
  return (config.general?.basePath || '/') + (config.media?.responsive_images?.directory_path || 'img/responsive/');
}

export async function getImagePrimaryPath() {
  const config = await getConfig();
  return (config.general?.basePath || '/') + (config.media?.primary_images?.directory_path || 'img/primary/');
}

export async function getVideoPath() {
  const config = await getConfig();
  return (config.general?.basePath || '/') + (config.media?.videos?.directory_path || 'video/');
}

export async function getLogoPath() {
  const config = await getConfig();
  return (config.general?.basePath || '/') + (config.media?.logos?.directory_path || 'img/logos/');
}
/* global document */

// Internal constants for video validation and responsive generation (not exported).
const VALID_VIDEO_EXTENSIONS = /\.(mp4|webm)$/i;

// Cache for generated video markup to improve performance on repeated calls with same parameters.
const markupCache = new Map();

// Main exported function to generate <video> markup asynchronously using a Web Worker.
// Supports light/dark theme variants, posters, custom classes, autoplay, mute, loop, and more.
// Clears cache for debugging; uses Worker to offload computation from main thread.
export async function generateVideoMarkup({
  src = '',
  lightSrc = '',
  darkSrc = '',
  poster = '',
  lightPoster = '',
  darkPoster = '',
  alt = 'Video content',
  customClasses = '',
  extraClasses = [],
  loading = 'lazy',
  autoplay = false,
  muted = false,
  loop = false,
  playsinline = false,
  disablePip = false,
  preload = 'metadata',
  controls = false
} = {}) {
  // Clear cache explicitly for debugging purposes to ensure fresh generation each time in dev mode.
  markupCache.clear(); // Clear cache for debugging
  // Check if debug mode is enabled via URL for logging.
  const isDev = window.location.href.includes('/dev/') ||
    new URLSearchParams(window.location.search).get('debug') === 'true';
  // Create cache key from all parameters for quick lookup.
  const cacheKey = JSON.stringify({ src, lightSrc, darkSrc, poster, lightPoster, darkPoster, alt, customClasses, extraClasses, loading, autoplay, muted, loop, playsinline, disablePip, preload, controls });
  if (markupCache.has(cacheKey)) {
    if (isDev) console.log('Using cached video markup:', { src, lightSrc, darkSrc });
    return markupCache.get(cacheKey);
  }

  // Trim all input strings to remove leading/trailing whitespace.
  src = src.trim();
  lightSrc = lightSrc.trim();
  darkSrc = darkSrc.trim();
  poster = poster.trim();
  lightPoster = lightPoster.trim();
  darkPoster = darkPoster.trim();

  // Log inputs in dev mode for debugging.
  if (isDev) console.log('Generating video markup for:', { src, lightSrc, darkSrc, poster, lightPoster, darkPoster });

  // Blob of JavaScript code that runs in the Web Worker.
  // Defines validation and markup generation logic isolated from main thread.
  const workerCode = `
  const VALID_VIDEO_EXTENSIONS = ['mp4', 'webm'];

  function isValidVideoExt(videoSrc) {
    if (!videoSrc) return false;
    const ext = videoSrc.split('.').pop()?.toLowerCase();
    return ext && VALID_VIDEO_EXTENSIONS.includes(ext);
  };

  self.addEventListener('message', (e) => {
    const { src, lightSrc, darkSrc, poster, lightPoster, darkPoster, alt, customClasses, extraClasses, loading, autoplay, muted, loop, playsinline, disablePip, preload, controls } = e.data;

    try {
      const classList = [customClasses, ...extraClasses].filter(Boolean).join(' ').trim();
      const videoId = \`custom-video-\${Math.random().toString(36).substring(2, 11)}\`;
      const isMuted = (autoplay || muted) ? 'muted' : '';
      const posterAttr = poster ? \`poster="\${poster}"\` : '';
      const dataAttrs = [
        lightPoster ? \`data-light-poster="\${lightPoster}"\` : '',
        darkPoster ? \`data-dark-poster="\${darkPoster}"\` : '',
        lightSrc ? \`data-light-src="\${lightSrc}"\` : '',
        darkSrc ? \`data-dark-src="\${darkSrc}"\` : '',
        src ? \`data-default-src="\${src}"\` : ''
      ].filter(Boolean).join(' ');

      let innerHTML = '';
      const addSourcesHTML = (videoSrc, mediaQuery) => {
        const trimmedSrc = (videoSrc || '').trim();
        if (!trimmedSrc || !isValidVideoExt(trimmedSrc)) {
          return '';
        }
        const ext = trimmedSrc.split('.').pop().toLowerCase();
        const baseSrc = trimmedSrc.slice(0, -(ext.length + 1));
        const mediaAttr = mediaQuery ? \` media="\${mediaQuery}"\` : '';
        return \`
          <source src="\${baseSrc}.webm" type="video/webm"\${mediaAttr}>
          <source src="\${baseSrc}.mp4" type="video/mp4"\${mediaAttr}>
        \`;
      };
      if (lightSrc) innerHTML += addSourcesHTML(lightSrc, '(prefers-color-scheme: light)');
      if (darkSrc) innerHTML += addSourcesHTML(darkSrc, '(prefers-color-scheme: dark)');
      const defaultSrc = lightSrc || darkSrc || src;
      innerHTML += addSourcesHTML(defaultSrc);
      innerHTML += \`<p>Your browser does not support the video tag. <a href="\${defaultSrc || '#'}" >Download video</a></p>\`;

      const markup = \`
        <video
          id="\${videoId}"
          \${autoplay ? 'autoplay' : ''}
          \${isMuted}
          \${loop ? 'loop' : ''}
          \${playsinline ? 'playsinline' : ''}
          \${disablePip ? 'disablepictureinpicture' : ''}
          \${controls ? 'controls' : ''}
          preload="\${preload}"
          loading="\${loading === 'lazy' ? 'lazy' : 'eager'}"
          class="\${classList}"
          title="\${alt}"
          aria-label="\${alt}"
          \${posterAttr}
          \${dataAttrs}>
          \${innerHTML}
        </video>
      \`;
      self.postMessage({ markup });
    } catch (error) {
      const primarySrc = lightSrc || darkSrc || src;
      const fallbackVideo = \`<video><p>Error generating video: \${error.message}</p><a href="\${primarySrc || '#'}" >Download video</a></video>\`;
      self.postMessage({ markup: fallbackVideo, error: error.message });
    }
  });
  `;

  // Log worker code and specific lines in dev mode for inspection.
  // Validate syntax with new Function to catch errors early.
  if (isDev) {
    console.log('Video Worker code:', workerCode);
    const lines = workerCode.split('\n');
    console.log('Line 105:', lines[104]);
    console.log('Line 106:', lines[105]);
    console.log('Line 107:', lines[106]);
    console.log('Line 108:', lines[107]);
    try {
      new Function(workerCode);
      console.log('Video Worker code syntax is valid');
    } catch (syntaxError) {
      console.error('Syntax error in Video Worker code:', syntaxError);
    }
  }

  // Create Blob from worker code and generate object URL for Worker instantiation.
  const blob = new Blob([workerCode], { type: 'application/javascript' });
  const workerUrl = URL.createObjectURL(blob);

  // Return a Promise that resolves with the generated markup or fallback on error.
  // Uses Worker to compute markup off-main-thread; terminates and revokes URL after use.
  return new Promise((resolve) => {
    const worker = new Worker(workerUrl);
    worker.onmessage = (e) => {
      const { markup, error, src: workerSrc, lightSrc: workerLightSrc, darkSrc: workerDarkSrc } = e.data;
      if (error) {
        if (isDev) console.error('Video Worker error:', error, { workerSrc, workerLightSrc, workerDarkSrc });
        resolve(markup);
      } else {
        markupCache.set(cacheKey, markup);
        if (isDev) console.log('Video Worker generated markup:', markup.substring(0, 200));
        resolve(markup);
      }
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
    };
    worker.onerror = (err) => {
      if (isDev) console.error('Video Worker failed:', err, { src, lightSrc, darkSrc });
      const primarySrc = lightSrc || darkSrc || src;
      const fallbackVideo = `<video><p>Error generating video</p><a href="${primarySrc || '#'}" >Download video</a></video>`;
      resolve(fallbackVideo);
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
    };
    worker.postMessage({
      src, lightSrc, darkSrc, poster, lightPoster, darkPoster, alt, customClasses,
      extraClasses, loading, autoplay, muted, loop, playsinline, disablePip, preload, controls
    });
  });
}

// Client-side code for handling theme changes and lazy autoplay.
// Runs only in browser; updates video sources/posters on theme switch and autoplays when in view.
if (typeof window !== 'undefined') {
  // Check debug mode for potential logging (though not used here).
  const isDev = window.location.href.includes('/dev/') ||
    new URLSearchParams(window.location.search).get('debug') === 'true';
  // Function to update video posters and sources based on current color scheme.
  // Reloads video if source changes while preserving play state and time.
  const updateVideos = () => {
    document.querySelectorAll('video[id^="custom-video"]').forEach(video => {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      let lightPoster = video.dataset.lightPoster ?? '';
      let darkPoster = video.dataset.darkPoster ?? '';
      let lightSrc = (video.dataset.lightSrc ?? '').trim();
      let darkSrc = (video.dataset.darkSrc ?? '').trim();
      let defaultSrc = (video.dataset.defaultSrc ?? '').trim();

      const newPoster = prefersDark ? darkPoster : lightPoster;
      if (newPoster && video.poster !== newPoster) {
        video.poster = newPoster;
      }

      const activeSrc = prefersDark ? (darkSrc || lightSrc) : (lightSrc || darkSrc);
      if (activeSrc && !video.currentSrc.includes(activeSrc)) {
        const wasPlaying = !video.paused;
        const currentTime = video.currentTime;
        while (video.firstChild) video.removeChild(video.firstChild);

        const addSources = (videoSrc, mediaQuery) => {
          const trimmedSrc = (videoSrc || '').trim();
          if (!trimmedSrc || !VALID_VIDEO_EXTENSIONS.some(ext => trimmedSrc.endsWith('.' + ext))) {
            return;
          }
          const ext = trimmedSrc.split('.').pop().toLowerCase();
          const baseSrc = trimmedSrc.slice(0, -(ext.length + 1));
          const mediaAttr = mediaQuery ? ` media="${mediaQuery}"` : '';

          const webmSource = document.createElement('source');
          webmSource.src = `${baseSrc}.webm`;
          webmSource.type = 'video/webm';
          if (mediaQuery) webmSource.media = mediaQuery;
          video.appendChild(webmSource);

          const mp4Source = document.createElement('source');
          mp4Source.src = `${baseSrc}.mp4`;
          mp4Source.type = 'video/mp4';
          if (mediaQuery) mp4Source.media = mediaQuery;
          video.appendChild(mp4Source);
        };

        if (lightSrc) addSources(lightSrc, '(prefers-color-scheme: light)');
        if (darkSrc) addSources(darkSrc, '(prefers-color-scheme: dark)');
        addSources(defaultSrc);

        const fallbackP = document.createElement('p');
        fallbackP.innerHTML = `Your browser does not support the video tag. <a href="${defaultSrc || '#'}">Download video</a>`;
        video.appendChild(fallbackP);

        video.load();
        video.currentTime = currentTime;
        if (wasPlaying) video.play().catch(() => console.warn('Auto-play failed after theme change'));
      }
    });
  };

  // IntersectionObserver for lazy autoplay of videos.
  // Plays videos when they enter the viewport (with margin); unobserves after.
  const lazyAutoplayObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const video = entry.target;
        video.play().catch(e => console.warn('Autoplay failed:', e));
        lazyAutoplayObserver.unobserve(video);
      }
    });
  }, { rootMargin: '50px' });

  // DOMContentLoaded event to initialize updates and observers.
  document.addEventListener('DOMContentLoaded', () => {
    updateVideos();
    document.querySelectorAll('video[autoplay]').forEach(video => {
      lazyAutoplayObserver.observe(video);
    });
  });

  // Listen for theme changes to update videos.
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateVideos);
}
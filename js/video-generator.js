import { VALID_VIDEO_EXTENSIONS } from './shared.js';

const markupCache = new Map();

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
  const isDev = window.location.href.includes('/dev/');
  const cacheKey = JSON.stringify({ src, lightSrc, darkSrc, poster, lightPoster, darkPoster, alt, customClasses, extraClasses, loading, autoplay, muted, loop, playsinline, disablePip, preload, controls });
  if (markupCache.has(cacheKey)) {
    if (isDev) console.log('Using cached video markup:', { src, lightSrc, darkSrc });
    return markupCache.get(cacheKey);
  }

  src = src.trim();
  lightSrc = lightSrc.trim();
  darkSrc = darkSrc.trim();
  poster = poster.trim();
  lightPoster = lightPoster.trim();
  darkPoster = darkPoster.trim();

  if (isDev) console.log('Generating video markup for:', { src, lightSrc, darkSrc, poster, lightPoster, darkPoster });

  const workerCode = `
    const VALID_VIDEO_EXTENSIONS = ['mp4', 'webm'];

    function isValidVideoExt(videoSrc) {
      if (!videoSrc) return false;
      const ext = videoSrc.split('.').pop()?.toLowerCase();
      return ext && VALID_VIDEO_EXTENSIONS.includes(ext);
    }

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
            loading="\${loading}"
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
        self.postMessage({ error: error.message, src, lightSrc, darkSrc });
      }
    });
  `;

  const blob = new Blob([workerCode], { type: 'application/javascript' });
  const workerUrl = URL.createObjectURL(blob);

  return new Promise((resolve) => {
    const worker = new Worker(workerUrl);
    worker.onmessage = (e) => {
      const { markup, error, src: workerSrc, lightSrc: workerLightSrc, darkSrc: workerDarkSrc } = e.data;
      if (error) {
        if (isDev) console.error('Video Worker error:', error, { workerSrc, workerLightSrc, workerDarkSrc });
        const primarySrc = lightSrc || darkSrc || src;
        const fallbackVideo = `<video><p>Error generating video: ${error}</p><a href="${primarySrc || '#'}" >Download video</a></video>`;
        resolve(fallbackVideo);
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

function isValidVideoExt(videoSrc) {
  if (!videoSrc) return false;
  const ext = videoSrc.split('.').pop()?.toLowerCase();
  return ext && VALID_VIDEO_EXTENSIONS.includes(ext);
}

if (typeof window !== 'undefined') {
  const updateVideos = () => {
    const isDev = window.location.href.includes('/dev/');
    document.querySelectorAll('video[id^="custom-video"]').forEach(video => {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      let lightPoster = video.dataset.lightPoster ?? '';
      let darkPoster = video.dataset.darkPoster ?? '';
      let lightSrc = (video.dataset.lightSrc ?? '').trim();
      let darkSrc = (video.dataset.darkSrc ?? '').trim();
      let defaultSrc = (video.dataset.defaultSrc ?? '').trim();

      if (!defaultSrc && video.dataset.defaultSrc) {
        defaultSrc = video.dataset.defaultSrc.trim();
      }

      const newPoster = prefersDark ? darkPoster : lightPoster;
      if (newPoster && video.poster !== newPoster) {
        video.poster = newPoster;
      }

      const activeSrc = prefersDark ? (darkSrc || lightSrc) : (lightSrc || darkSrc);
      if (activeSrc && !video.currentSrc.includes(activeSrc)) {
        const wasPlaying = !video.paused;
        const currentTime = video.currentTime;
        while (video.firstChild) video.removeChild(video.firstChild);

        const addSource = (videoSrc, mediaQuery) => {
          const trimmedSrc = (videoSrc || '').trim();
          if (!trimmedSrc || !isValidVideoExt(trimmedSrc)) {
            const ext = trimmedSrc.split('.').pop()?.toLowerCase() || '';
            if (isDev) console.warn(`Invalid video source in update: "${trimmedSrc}" (length: ${trimmedSrc.length}, ext: '${ext}')`);
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

        if (lightSrc) addSource(lightSrc, '(prefers-color-scheme: light)');
        if (darkSrc) addSource(darkSrc, '(prefers-color-scheme: dark)');
        addSource(defaultSrc);

        const fallbackP = document.createElement('p');
        fallbackP.innerHTML = `Your browser does not support the video tag. <a href="${defaultSrc || '#'}">Download video</a>`;
        video.appendChild(fallbackP);

        video.load();
        video.currentTime = currentTime;
        if (wasPlaying) video.play().catch(() => console.warn('Auto-play failed after theme change'));
      }
    });
  };

  const lazyAutoplayObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const video = entry.target;
        video.play().catch(e => console.warn('Autoplay failed:', e));
        lazyAutoplayObserver.unobserve(video);
      }
    });
  }, { rootMargin: '50px' });

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('video[autoplay]').forEach(video => {
      lazyAutoplayObserver.observe(video);
    });
  });

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateVideos);
}
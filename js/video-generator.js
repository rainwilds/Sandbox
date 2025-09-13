import { VALID_VIDEO_EXTENSIONS } from './shared.js';

export function generateVideoMarkup({
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
  const classList = [customClasses, ...extraClasses].filter(Boolean).join(' ').trim();
  const videoId = `custom-video-${Math.random().toString(36).substring(2, 11)}`;
  const isMuted = (autoplay || muted) ? 'muted' : '';
  const posterAttr = poster ? `poster="${poster}"` : '';
  const dataAttrs = [
    lightPoster ? `data-light-poster="${lightPoster}"` : '',
    darkPoster ? `data-dark-poster="${darkPoster}"` : '',
    lightSrc ? `data-light-src="${lightSrc}"` : '',
    darkSrc ? `data-dark-src="${darkSrc}"` : '',
    src ? `data-default-src="${src}"` : ''
  ].filter(Boolean).join(' ');

  const innerHTML = generateVideoSources({ src, lightSrc, darkSrc });

  return `
    <video
      id="${videoId}"
      ${autoplay ? 'autoplay' : ''}
      ${isMuted}
      ${loop ? 'loop' : ''}
      ${playsinline ? 'playsinline' : ''}
      ${disablePip ? 'disablepictureinpicture' : ''}
      ${controls ? 'controls' : ''}
      preload="${preload}"
      loading="${loading}"
      class="${classList}"
      title="${alt}"
      aria-label="${alt}"
      ${posterAttr}
      ${dataAttrs}>
      ${innerHTML}
    </video>
  `;
}

function isValidVideoExt(videoSrc) {
  if (!videoSrc) return false;
  const ext = videoSrc.split('.').pop()?.toLowerCase();
  return VALID_VIDEO_EXTENSIONS.includes(ext ?? '');
}

export function generateVideoSources({ src = '', lightSrc = '', darkSrc = '' }) {
  const addSourcesHTML = (videoSrc, mediaQuery) => {
    if (!isValidVideoExt(videoSrc)) {
      console.warn(`Invalid video file extension: ${videoSrc}. Expected: ${VALID_VIDEO_EXTENSIONS.join(', ')}`);
      return '';
    }
    const ext = videoSrc.split('.').pop().toLowerCase();
    const baseSrc = videoSrc.slice(0, -(ext.length + 1));
    const mediaAttr = mediaQuery ? ` media="${mediaQuery}"` : '';
    return `
      <source src="${baseSrc}.webm" type="video/webm"${mediaAttr}>
      <source src="${baseSrc}.mp4" type="video/mp4"${mediaAttr}>
    `;
  };
  let innerHTML = '';
  if (lightSrc) innerHTML += addSourcesHTML(lightSrc, '(prefers-color-scheme: light)');
  if (darkSrc) innerHTML += addSourcesHTML(darkSrc, '(prefers-color-scheme: dark)');
  const defaultSrc = lightSrc ?? darkSrc ?? src;
  innerHTML += addSourcesHTML(defaultSrc);
  innerHTML += `<p>Your browser does not support the video tag. <a href="${defaultSrc ?? ''}">Download video</a></p>`;
  return innerHTML;
}

// Shared global handler
if (typeof window !== 'undefined') {
  const updateVideos = () => {
    document.querySelectorAll('video[id^="custom-video"]').forEach(video => {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const lightPoster = video.dataset.lightPoster ?? '';
      const darkPoster = video.dataset.darkPoster ?? '';
      const lightSrc = video.dataset.lightSrc ?? '';
      const darkSrc = video.dataset.darkSrc ?? '';
      const defaultSrc = video.dataset.defaultSrc ?? '';

      const newPoster = prefersDark ? darkPoster : lightPoster;
      if (newPoster && video.poster !== newPoster) {
        video.poster = newPoster;
      }

      const activeSrc = prefersDark ? (darkSrc ?? lightSrc) : (lightSrc ?? darkSrc);
      if (activeSrc && !video.currentSrc.includes(activeSrc)) {
        const wasPlaying = !video.paused;
        const currentTime = video.currentTime;
        while (video.firstChild) video.removeChild(video.firstChild);

        const addSource = (videoSrc, mediaQuery) => {
          if (!isValidVideoExt(videoSrc)) return;
          const ext = videoSrc.split('.').pop().toLowerCase();
          const baseSrc = videoSrc.slice(0, -(ext.length + 1));
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
        fallbackP.innerHTML = `Your browser does not support the video tag. <a href="${defaultSrc}">Download video</a>`;
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
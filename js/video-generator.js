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
  const classList = [customClasses, ...extraClasses].filter(cls => cls).join(' ').trim();
  const videoId = `custom-video-${Math.random().toString(36).substring(2, 11)}`;
  const isMuted = autoplay || muted ? 'muted' : '';
  const posterAttr = poster ? `poster="${poster}"` : '';

  const innerHTML = generateVideoSources({ src, lightSrc, darkSrc });

  let videoMarkup = `
    <video
      id="${videoId}"
      ${autoplay ? 'autoplay' : ''}
      ${isMuted}
      ${loop ? 'loop' : ''}
      ${playsinline ? 'playsinline' : ''}
      ${disablePip ? 'disablepictureinpicture' : ''}
      ${controls ? 'controls' : ''}
      preload="${preload || 'metadata'}"
      loading="${loading || 'lazy'}"
      class="${classList}"
      title="${alt}"
      aria-label="${alt}"
      ${posterAttr}>
      ${innerHTML}
    </video>
  `;

  if (lightSrc || darkSrc || lightPoster || darkPoster) {
    const scriptContent = `
      (function() {
        const video = document.getElementById('${videoId}');
        if (!video) return;
        const lightPoster = '${lightPoster || poster || ''}';
        const darkPoster = '${darkPoster || poster || ''}';
        const lightSrc = '${lightSrc || ''}';
        const darkSrc = '${darkSrc || ''}';
        const defaultSrc = '${src || lightSrc || darkSrc || ''}';
        const prefersDarkQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const validExtensions = ${JSON.stringify(VALID_VIDEO_EXTENSIONS)};
        function addSources(video, videoSrc, mediaQuery) {
          if (!videoSrc) return;
          const ext = videoSrc.split('.').pop().toLowerCase();
          if (!validExtensions.includes(ext)) return;
          const baseSrc = videoSrc.slice(0, -(ext.length + 1));
          const mediaAttr = mediaQuery ? \` media="\${mediaQuery}"\` : '';
          const webmSource = document.createElement('source');
          webmSource.src = \`\${baseSrc}.webm\`;
          webmSource.type = 'video/webm';
          if (mediaQuery) webmSource.media = mediaQuery;
          video.appendChild(webmSource);
          const mp4Source = document.createElement('source');
          mp4Source.src = \`\${baseSrc}.mp4\`;
          mp4Source.type = 'video/mp4';
          if (mediaQuery) mp4Source.media = mediaQuery;
          video.appendChild(mp4Source);
        }
        function updateVideo() {
          const prefersDark = prefersDarkQuery.matches;
          const newPoster = prefersDark ? darkPoster : lightPoster;
          if (newPoster && video.poster !== newPoster) {
            video.poster = newPoster;
          }
          const activeSrc = prefersDark ? (darkSrc || lightSrc) : (lightSrc || darkSrc);
          if (activeSrc && video.currentSrc.indexOf(activeSrc) === -1) {
            const wasPlaying = !video.paused;
            const currentTime = video.currentTime;
            while (video.firstChild) {
              video.removeChild(video.firstChild);
            }
            if (lightSrc) addSources(video, lightSrc, '(prefers-color-scheme: light)');
            if (darkSrc) addSources(video, darkSrc, '(prefers-color-scheme: dark)');
            addSources(video, defaultSrc);
            const fallbackP = document.createElement('p');
            fallbackP.innerHTML = \`Your browser does not support the video tag. <a href="\${defaultSrc}">Download video</a>\`;
            video.appendChild(fallbackP);
            video.load();
            video.currentTime = currentTime;
            if (wasPlaying) video.play().catch(() => console.warn('Auto-play failed after theme change'));
          }
        }
        updateVideo();
        prefersDarkQuery.addEventListener('change', updateVideo);
        if ('${loading}' === 'lazy' && ${autoplay}) {
          const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
              video.play().catch(() => console.warn('Auto-play failed on lazy load'));
              observer.disconnect();
            }
          });
          observer.observe(video);
        }
        video.addEventListener('error', () => {
          console.warn(\`Video source "\${video.currentSrc}" failed to load. Falling back to poster.\`);
          if (newPoster) {
            const img = document.createElement('img');
            img.src = newPoster;
            img.alt = '${alt}';
            img.className = video.className;
            img.loading = '${loading}';
            video.replaceWith(img);
          }
        });
      })();
    `;
    videoMarkup += `<script>${scriptContent}</script>`;
  }

  return videoMarkup;
}

export function generateVideoSources({ src = '', lightSrc = '', darkSrc = '', validExtensions = VALID_VIDEO_EXTENSIONS }) {
  const addSourcesHTML = (videoSrc, mediaQuery) => {
    if (!videoSrc) return '';
    const ext = videoSrc.split('.').pop()?.toLowerCase();
    if (!ext || !validExtensions.includes(ext)) {
      console.warn(`Invalid video file extension: ${videoSrc}`);
      return '';
    }
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
  const defaultSrc = lightSrc || darkSrc || src;
  innerHTML += addSourcesHTML(defaultSrc);
  innerHTML += `<p>Your browser does not support the video tag. <a href="${defaultSrc}">Download video</a></p>`;
  return innerHTML;
}
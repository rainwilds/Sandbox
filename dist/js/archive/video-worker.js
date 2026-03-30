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

    let innerHTML = '';
    const addSourcesHTML = (videoSrc, mediaQuery) => {
      const trimmedSrc = (videoSrc || '').trim();
      if (!trimmedSrc || !isValidVideoExt(trimmedSrc)) {
        return '';
      }
      const ext = trimmedSrc.split('.').pop().toLowerCase();
      const baseSrc = trimmedSrc.slice(0, -(ext.length + 1));
      const mediaAttr = mediaQuery ? ` media="${mediaQuery}"` : '';
      return `
        <source src="${baseSrc}.webm" type="video/webm"${mediaAttr}>
        <source src="${baseSrc}.mp4" type="video/mp4"${mediaAttr}>
      `;
    };
    if (lightSrc) innerHTML += addSourcesHTML(lightSrc, '(prefers-color-scheme: light)');
    if (darkSrc) innerHTML += addSourcesHTML(darkSrc, '(prefers-color-scheme: dark)');
    const defaultSrc = lightSrc || darkSrc || src;
    innerHTML += addSourcesHTML(defaultSrc);
    innerHTML += `<p>Your browser does not support the video tag. <a href="${defaultSrc || '#'}">Download video</a></p>`;

    const markup = `
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
    self.postMessage({ markup });
  } catch (error) {
    self.postMessage({ error: error.message });
  }
});
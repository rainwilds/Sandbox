/* global document, window, console */

const VALID_VIDEO_EXTENSIONS = ['mp4', 'webm'];
const markupCache = new Map();

function isValidVideoExt(videoSrc) {
    if (!videoSrc) return false;
    const ext = videoSrc.split('.').pop()?.toLowerCase();
    return ext && VALID_VIDEO_EXTENSIONS.includes(ext);
}

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
    const debug = new URLSearchParams(window.location.search).get('debug') === 'true';
    const log = (message, data) => {
        if (debug) {
            console.groupCollapsed(`%c[VideoGenerator] ${message}`, 'color: #2196F3; font-weight: bold;');
            if (data) console.log('%cData:', 'color: #4CAF50;', data);
            console.trace();
            console.groupEnd();
        }
    };
    const warn = (message, data) => {
        if (debug) {
            console.groupCollapsed(`%c[VideoGenerator] ⚠️ ${message}`, 'color: #FF9800; font-weight: bold;');
            if (data) console.log('%cData:', 'color: #4CAF50;', data);
            console.trace();
            console.groupEnd();
        }
    };
    const error = (message, data) => {
        if (debug) {
            console.groupCollapsed(`%c[VideoGenerator] ❌ ${message}`, 'color: #F44336; font-weight: bold;');
            if (data) console.log('%cData:', 'color: #4CAF50;', data);
            console.trace();
            console.groupEnd();
        }
    };

    if (debug) markupCache.clear();

    const cacheKey = JSON.stringify({ src, lightSrc, darkSrc, poster, lightPoster, darkPoster, alt, customClasses, extraClasses, loading, autoplay, muted, loop, playsinline, disablePip, preload, controls });
    if (markupCache.has(cacheKey)) {
        log('Using cached video markup', { cacheKey });
        return markupCache.get(cacheKey);
    }

    src = src.trim();
    lightSrc = lightSrc.trim();
    darkSrc = darkSrc.trim();
    poster = poster.trim();
    lightPoster = lightPoster.trim();
    darkPoster = darkPoster.trim();

    log('Generating video markup', { src, lightSrc, darkSrc, poster, lightPoster, darkPoster, alt });

    try {
        if (!src && !lightSrc && !darkSrc) {
            warn('No video sources provided', { src, lightSrc, darkSrc });
            return '<p aria-live="polite">Video unavailable</p>';
        }

        const classList = ['video', customClasses, ...extraClasses].filter(Boolean).join(' ').trim();
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
        innerHTML += `<p aria-live="polite">Your browser does not support the video tag. <a href="${defaultSrc || '#'}">Download video</a></p>`;

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
                loading="${loading === 'lazy' ? 'lazy' : 'eager'}"
                class="${classList}"
                aria-label="${alt}"
                ${posterAttr}
                ${dataAttrs}
                style="width: 100%; height: auto;">
                ${innerHTML}
            </video>
        `;
        markupCache.set(cacheKey, markup);
        log('Video markup generated', { markup: markup.substring(0, 200) });
        return markup;
    } catch (err) {
        error('Error generating video markup', { error: err.message });
        const primarySrc = lightSrc || darkSrc || src;
        return `<p aria-live="polite">Error loading video: ${err.message}. <a href="${primarySrc || '#'}">Download video</a></p>`;
    }
}

if (typeof window !== 'undefined') {
    const updateVideos = () => {
        document.querySelectorAll('video[id^="custom-video"]').forEach(video => {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const lightPoster = video.dataset.lightPoster ?? '';
            const darkPoster = video.dataset.darkPoster ?? '';
            const lightSrc = (video.dataset.lightSrc ?? '').trim();
            const darkSrc = (video.dataset.darkSrc ?? '').trim();
            const defaultSrc = (video.dataset.defaultSrc ?? '').trim();

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
                    if (!trimmedSrc || !VALID_VIDEO_EXTENSIONS.some(ext => trimmedSrc.endsWith(`.${ext}`))) {
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
                fallbackP.setAttribute('aria-live', 'polite');
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
        updateVideos();
        document.querySelectorAll('video[autoplay]').forEach(video => {
            lazyAutoplayObserver.observe(video);
        });
    });

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', updateVideos);
}
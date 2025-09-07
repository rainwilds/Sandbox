// Function to create picture tag string (unchanged)
function createPictureTagString(id, imageUrl) {
    return `
        <picture>
            <!-- light -->
            <source srcset="${imageUrl}"
                    media="(max-width: 767px) and (resolution < 1.5dppx) and (prefers-color-scheme: light)" />
            <source srcset="${imageUrl}"
                    media="(max-width: 767px) and (resolution >= 1.5dppx) and (prefers-color-scheme: light)" />
            <source srcset="${imageUrl}"
                    media="(min-width: 768px) and (max-width: 1366px) and (resolution < 1.5dppx) and (prefers-color-scheme: light)" />
            <source srcset="${imageUrl}"
                    media="(min-width: 768px) and (max-width: 1366px) and (resolution >= 1.5dppx) and (resolution < 2dppx) and (prefers-color-scheme: light)" />
            <source srcset="${imageUrl}"
                    media="(min-width: 768px) and (max-width: 1366px) and (resolution >= 2dppx) and (prefers-color-scheme: light)" />
            <source srcset="${imageUrl}"
                    media="(min-width: 1367px) and (resolution < 1.2dppx) and (prefers-color-scheme: light)" />
            <source srcset="${imageUrl}"
                    media="(min-width: 1367px) and (resolution >= 1.2dppx) and (resolution < 2dppx) and (prefers-color-scheme: light)" />
            <source srcset="${imageUrl}"
                    media="(min-width: 1367px) and (resolution >= 2dppx) and (prefers-color-scheme: light)" />
            <!-- dark -->
            <source srcset="${imageUrl}"
                    media="(max-width: 767px) and (resolution < 1.5dppx) and (prefers-color-scheme: dark)" />
            <source srcset="${imageUrl}"
                    media="(max-width: 767px) and (resolution >= 1.5dppx) and (prefers-color-scheme: dark)" />
            <source srcset="${imageUrl}"
                    media="(min-width: 768px) and (max-width: 1366px) and (resolution < 1.5dppx) and (prefers-color-scheme: dark)" />
            <source srcset="${imageUrl}"
                    media="(min-width: 768px) and (max-width: 1366px) and (resolution >= 1.5dppx) and (resolution < 2dppx) and (prefers-color-scheme: dark)" />
            <source srcset="${imageUrl}"
                    media="(min-width: 768px) and (max-width: 1366px) and (resolution >= 2dppx) and (prefers-color-scheme: dark)" />
            <source srcset="${imageUrl}"
                    media="(min-width: 1367px) and (resolution < 1.2dppx) and (prefers-color-scheme: dark)" />
            <source srcset="${imageUrl}"
                    media="(min-width: 1367px) and (resolution >= 1.2dppx) and (resolution < 2dppx) and (prefers-color-scheme: dark)" />
            <source srcset="${imageUrl}"
                    media="(min-width: 1367px) and (resolution >= 2dppx) and (prefers-color-scheme: dark)" />
            <img width="100%" src="${imageUrl}" alt="Alt title" title="Image title" loading="lazy"
                 id="${id}" />
        </picture>
    `;
}



// Function to create video tag string
function createVideoTagString(id, videoUrl, posterUrl) {
    return `
        <video autoplay muted loop disablepictureinpicture playsinline poster="${posterUrl}" data-full="${videoUrl}" class="gallery-item">
            <source src="${videoUrl}" type="video/mp4">
            <source src="${videoUrl.replace('.mp4', '.webm')}" type="video/webm">
        </video>
    `;
}

// Updated function to create picture tag string
function createPictureTagString(id, imageUrl) {
    return `
        <picture>
            <img width="100%" src="${imageUrl}" data-full="${imageUrl}" alt="Alt title" title="Image title" loading="lazy" id="${id}" class="gallery-item" />
        </picture>
    `;
}

// Define gallery arrays (unchanged)
const gallery_1_Images = [
    { type: 'image', url: '/Sandbox/img/gallery/gallery-item-1.jpg' },
    { type: 'video', url: '/Sandbox/video/video1.mp4', poster: '/Sandbox/img/gallery/gallery-item-2.jpg' },
    { type: 'image', url: '/Sandbox/img/gallery/gallery-item-3.jpg' },
    { type: 'image', url: '/Sandbox/img/gallery/gallery-item-4.jpg' },
    { type: 'video', url: '/Sandbox/video/video2.mp4', poster: '/Sandbox/img/gallery/gallery-item-5.jpg' },
    { type: 'image', url: '/Sandbox/img/gallery/gallery-item-6.jpg' },
    { type: 'image', url: '/Sandbox/img/gallery/gallery-item-7.jpg' },
    { type: 'image', url: '/Sandbox/img/gallery/gallery-item-8.jpg' },
    { type: 'image', url: '/Sandbox/img/gallery/gallery-item-9.jpg' }
];

const gallery_2_Images = [
    { type: 'image', url: '/Sandbox/img/gallery/gallery-item-1.jpg' },
    { type: 'image', url: '/Sandbox/img/gallery/gallery-item-2.jpg' },
    { type: 'video', url: '/Sandbox/video/video1.mp4', poster: '/Sandbox/img/gallery/gallery-item-3.jpg' },
    { type: 'image', url: '/Sandbox/img/gallery/gallery-item-4.jpg' },
    { type: 'image', url: '/Sandbox/img/gallery/gallery-item-5.jpg' },
    { type: 'image', url: '/Sandbox/img/gallery/gallery-item-6.jpg' },
    { type: 'video', url: '/Sandbox/video/video2.mp4', poster: '/Sandbox/img/gallery/gallery-item-7.jpg' },
    { type: 'image', url: '/Sandbox/img/gallery/gallery-item-8.jpg' },
    { type: 'image', url: '/Sandbox/img/gallery/gallery-item-9.jpg' }
];

const galleryMap = {
    'gallery-main': gallery_1_Images,
    'gallery-scroll': gallery_2_Images
};

// Updated insertAndStyleGallery function with lightbox initialization
function insertAndStyleGallery(selector) {
    const containers = document.querySelectorAll(selector);

    containers.forEach((container) => {
        let galleryArray = null;
        let matchedClass = null;
        for (const [className, items] of Object.entries(galleryMap)) {
            if (container.classList.contains(className)) {
                galleryArray = items;
                matchedClass = className;
                break;
            }
        }

        if (!matchedClass) return;

        // Insert media items
        galleryArray.forEach((item) => {
            const id = item.url.split('/').pop().replace(/\.[^/.]+$/, '');
            let mediaString;
            if (item.type === 'video') {
                mediaString = createVideoTagString(id, item.url, item.poster);
            } else {
                mediaString = createPictureTagString(id, item.url);
            }
            container.insertAdjacentHTML('beforeend', mediaString);
        });

        if (!container.classList.contains('gallery-scroll')) {
            styleGallery(container);
        }
    });

    // Initialize lightbox after gallery is populated
    initLightbox();
}

function styleGallery(galleryContainer) {
    const galleryItems = galleryContainer.querySelectorAll('picture');
    const columns = 4;
    const totalItems = galleryItems.length;
    const completeRows = Math.floor(totalItems / columns);
    const itemsInLastRow = totalItems % columns || columns;
    const lastRowStart = totalItems - itemsInLastRow;

    galleryItems.forEach((item, index) => {
        let spanCols = 1;
        let spanRows = 1;

        if (index < lastRowStart) {
            spanRows = Math.random() < 0.3 ? 2 : 1;
            if (spanRows === 2) {
                spanCols = Math.random() < 0.5 ? 2 : 1;
            }
        }

        item.style.gridColumn = `span ${spanCols}`;
        item.style.gridRow = `span ${spanRows}`;
    });
}

// Lightbox initialization
function initLightbox() {
    const galleryItems = document.querySelectorAll('.gallery-item');
    const lightbox = document.getElementById('lightbox');
    const lightboxContent = document.querySelector('.lightbox-content');
    const closeBtn = document.querySelector('.close');
    const prevBtn = document.querySelector('.prev');
    const nextBtn = document.querySelector('.next');

    let currentIndex = 0;
    let touchStartX = 0;
    let touchEndX = 0;

    // Create a <style> element to manage :root styles dynamically
    const styleSheet = document.createElement('style');
    document.head.appendChild(styleSheet);

    // Define the CSS to hide scrollbars on :root
    const hideScrollbarsCSS = `
        :root.lightbox-active {
            @supports selector(scrollbar-width) {
                scrollbar-width: none;
            }
            &::-webkit-scrollbar {
                display: none;
            }
        }
    `;

    // Add the CSS to the stylesheet
    styleSheet.textContent = hideScrollbarsCSS;

    // Function to toggle :root class
    function toggleRootScrollbars(active) {
        document.documentElement.classList.toggle('lightbox-active', active);
    }

    // Open lightbox on item click
    galleryItems.forEach((item, index) => {
        item.addEventListener('click', () => {
            currentIndex = index;
            updateLightboxContent(item);
            lightbox.classList.add('active');
            toggleRootScrollbars(true); // Hide scrollbars
            lightbox.focus(); // Focus for keyboard accessibility
        });
    });

    // Close lightbox
    closeBtn.addEventListener('click', () => {
        lightbox.classList.remove('active');
        toggleRootScrollbars(false); // Show scrollbars
    });

    // Click outside to close
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            lightbox.classList.remove('active');
            toggleRootScrollbars(false); // Show scrollbars
        }
    });

    // Next/Prev buttons
    nextBtn.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % galleryItems.length;
        updateLightboxContent(galleryItems[currentIndex]);
    });

    prevBtn.addEventListener('click', () => {
        currentIndex = (currentIndex - 1 + galleryItems.length) % galleryItems.length;
        updateLightboxContent(galleryItems[currentIndex]);
    });

    // Swipe support
    lightboxContent.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    });

    lightboxContent.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });

    // Keyboard navigation
    lightbox.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;

        switch (e.key) {
            case 'ArrowRight':
                e.preventDefault();
                currentIndex = (currentIndex + 1) % galleryItems.length;
                updateLightboxContent(galleryItems[currentIndex]);
                break;
            case 'ArrowLeft':
                e.preventDefault();
                currentIndex = (currentIndex - 1 + galleryItems.length) % galleryItems.length;
                updateLightboxContent(galleryItems[currentIndex]);
                break;
            case 'Escape':
                e.preventDefault();
                lightbox.classList.remove('active');
                toggleRootScrollbars(false); // Show scrollbars
                break;
        }
    });

    // Ensure lightbox is focusable for keyboard events
    lightbox.setAttribute('tabindex', '0');

    function handleSwipe() {
        const swipeThreshold = 50;
        if (touchStartX - touchEndX > swipeThreshold) {
            currentIndex = (currentIndex + 1) % galleryItems.length;
            updateLightboxContent(galleryItems[currentIndex]);
        } else if (touchEndX - touchStartX > swipeThreshold) {
            currentIndex = (currentIndex - 1 + galleryItems.length) % galleryItems.length;
            updateLightboxContent(galleryItems[currentIndex]);
        }
    }

    // Update lightbox content (image or video)
    function updateLightboxContent(item) {
        const fullUrl = item.dataset.full;
        lightboxContent.innerHTML = '';
        if (item.tagName === 'VIDEO') {
            lightboxContent.innerHTML = `
                <video autoplay muted loop disablepictureinpicture playsinline src="${fullUrl}">
                    <source src="${fullUrl}" type="video/mp4">
                    <source src="${fullUrl.replace('.mp4', '.webm')}" type="video/webm">
                </video>
            `;
        } else {
            lightboxContent.innerHTML = `<img src="${fullUrl}" alt="Full size image">`;
        }
    }
}

// Call the function
insertAndStyleGallery('div[class*="gallery"]');


// Add scrolling functionality for elements with class "scroll"
function addScrollFunctionality() {
    document.querySelectorAll('.scroll').forEach(scroll => {
        let isDown = false;
        let startX;
        let scrollLeft;

        scroll.addEventListener('mousedown', (e) => {
            isDown = true;
            scroll.style.cursor = 'grabbing';
            startX = e.pageX - scroll.offsetLeft;
            scrollLeft = scroll.scrollLeft;
            e.preventDefault();
        });

        scroll.addEventListener('mouseleave', () => {
            isDown = false;
            scroll.style.cursor = 'grab';
        });

        scroll.addEventListener('mouseup', () => {
            isDown = false;
            scroll.style.cursor = 'grab';
        });

        scroll.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - scroll.offsetLeft;
            const walk = (x - startX) * 2; // Adjust multiplier for scroll speed
            scroll.scrollLeft = scrollLeft - walk;
        });

        scroll.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            startX = touch.pageX - scroll.offsetLeft;
            scrollLeft = scroll.scrollLeft;
        });

        scroll.addEventListener('touchmove', (e) => {
            if (scroll.scrollWidth <= scroll.clientWidth) return;
            const touch = e.touches[0];
            const x = touch.pageX - scroll.offsetLeft;
            const walk = (x - startX) * 2;
            scroll.scrollLeft = scrollLeft - walk;
            e.stopPropagation();
        }, { passive: false });
    });
}

// Enable scrolling
addScrollFunctionality();

// const PH_RE_Int_Ext_Daylight = {
//     1: 65, 2: 76, 3: 88, 4: 99, 5: 111, 6: 122, 7: 134, 8: 145, 
//     9: 168, 10: 190, 11: 213, 12: 235, 13: 240, 14: 245, 15: 250, 
//     16: 255, 17: 261, 18: 268, 19: 274, 20: 280, 21: 288, 22: 296, 
//     23: 304, 24: 312, 25: 320, 26: 328, 27: 336, 28: 344, 29: 352, 
//     30: 360, 31: 366, 32: 374, 33: 381, 34: 389, 35: 397, 36: 404, 
//     37: 412, 38: 419, 39: 427, 40: 435, 41: 442, 42: 450, 43: 458, 
//     44: 465, 45: 473, 46: 480, 47: 488, 48: 496, 49: 503, 50: 511, 
//     51: 519, 52: 526, 53: 534, 54: 541, 55: 549, 56: 557, 57: 564, 
//     58: 572, 59: 579, 60: 587, 61: 595, 62: 602, 63: 610, 64: 618, 
//     65: 625, 66: 633, 67: 640, 68: 648, 69: 656, 70: 663, 71: 671, 
//     72: 678, 73: 686, 74: 694, 75: 701, 76: 709, 77: 717, 78: 724, 
//     79: 732, 80: 739, 81: 747, 82: 755, 83: 762, 84: 770, 85: 778, 
//     86: 785, 87: 793, 88: 800, 89: 808, 90: 816, 91: 823, 92: 831, 
//     93: 838, 94: 846, 95: 854, 96: 861, 97: 869, 98: 877, 99: 884, 
//     100: 892
// };

// const PH_RE_Exterior_Twilight = {
//     1: 95, 2: 114, 3: 132, 4: 151, 5: 169, 6: 169, 7: 188, 8: 225, 
//     9: 244, 10: 263, 11: 281, 12: 300, 13: 306, 14: 313, 15: 319, 
//     16: 325, 17: 329, 18: 333, 19: 336, 20: 340, 21: 346, 22: 351, 
//     23: 357, 24: 362, 25: 368, 26: 373, 27: 379, 28: 384, 29: 390, 
//     30: 395, 31: 401, 32: 406, 33: 412, 34: 417, 35: 423, 36: 428, 
//     37: 434, 38: 439, 39: 445, 40: 450
// };

// const PH_RE_Drone_Daylight = {
//     1: 110, 2: 130, 3: 150, 4: 170, 5: 190, 6: 210, 7: 230, 8: 250, 
//     9: 270, 10: 290, 11: 310, 12: 330, 13: 350, 14: 370, 15: 390
// };

// const PH_RE_Drone_Sunrise_Sunset = {
//     1: 155, 2: 180, 3: 210, 4: 240, 5: 265, 6: 295, 7: 320, 8: 350, 
//     9: 377, 10: 405, 11: 433, 12: 461, 13: 489, 14: 517, 15: 545
// };

// const PH_RE_Lifestyle = {
//     1: 65, 2: 76, 3: 88, 4: 99, 5: 111, 6: 122, 7: 134, 8: 145, 
//     9: 168, 10: 190, 11: 213, 12: 235, 13: 240, 14: 245, 15: 250, 
//     16: 255, 17: 261, 18: 268, 19: 274, 20: 280, 21: 288, 22: 296, 
//     23: 304, 24: 312, 25: 320, 26: 328, 27: 336, 28: 344, 29: 352, 
//     30: 360, 31: 368, 32: 376, 33: 384, 34: 392, 35: 400, 36: 408, 
//     37: 416, 38: 424, 39: 432, 40: 440
// };



// Function to shuffle an array (Fisher-Yates shuffle)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // Swap elements
    }
    return array;
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

// Updated insertAndStyleGallery function with randomization
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

        // Create a copy of the galleryArray and shuffle it
        const shuffledGalleryArray = shuffleArray([...galleryArray]);

        // Insert media items from the shuffled array
        shuffledGalleryArray.forEach((item) => {
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
    const galleryItems = galleryContainer.querySelectorAll('picture, video'); // Include video elements
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

// Lightbox initialization (with null checks added)
function initLightbox() {
    const galleryItems = document.querySelectorAll('.gallery-item');
    const lightbox = document.getElementById('lightbox');
    const lightboxContent = document.querySelector('.lightbox-content');
    const closeBtn = document.querySelector('.close');
    const prevBtn = document.querySelector('.prev');
    const nextBtn = document.querySelector('.next');

    if (!lightbox) {
        console.log('Lightbox element not found; skipping lightbox initialization.');
        return;
    }

    let currentIndex = 0;
    let touchStartX = 0;
    let touchEndX = 0;

    const styleSheet = document.createElement('style');
    document.head.appendChild(styleSheet);

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
    styleSheet.textContent = hideScrollbarsCSS;

    function toggleRootScrollbars(active) {
        document.documentElement.classList.toggle('lightbox-active', active);
    }

    galleryItems.forEach((item, index) => {
        item.addEventListener('click', () => {
            currentIndex = index;
            updateLightboxContent(item);
            lightbox.classList.add('active');
            toggleRootScrollbars(true);
            lightbox.focus();
        });
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            lightbox.classList.remove('active');
            toggleRootScrollbars(false);
        });
    }

    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox) {
            lightbox.classList.remove('active');
            toggleRootScrollbars(false);
        }
    });

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            currentIndex = (currentIndex + 1) % galleryItems.length;
            updateLightboxContent(galleryItems[currentIndex]);
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            currentIndex = (currentIndex - 1 + galleryItems.length) % galleryItems.length;
            updateLightboxContent(galleryItems[currentIndex]);
        });
    }

    if (lightboxContent) {
        lightboxContent.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        });

        lightboxContent.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        });
    }

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
                toggleRootScrollbars(false);
                break;
        }
    });

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
            const baseName = fullUrl.split('/').pop().replace(/\.[^/.]+$/, '');
            const resolutions = [768, 980, 1366, 1920, 2560, 3840];
            const sizes = `(max-width: 768px) 100vw,
                           (max-width: 980px) 100vw,
                           (max-width: 1366px) 100vw,
                           (max-width: 1920px) 100vw,
                           (max-width: 2560px) 100vw,
                           (max-width: 3840px) 100vw,
                           3840px`;

            const avifSources = resolutions.map(res => `./img/gallery/${baseName}-${res}.avif ${res}w`).join(', ');
            const webpSources = resolutions.map(res => `./img/gallery/${baseName}-${res}.webp ${res}w`).join(', ');
            const jpgSources = resolutions.map(res => `./img/gallery/${baseName}-${res}.jpg ${res}w`).join(', ');

            lightboxContent.innerHTML = `
                <picture class="animate animate-fade-in">
                    <source srcset="${avifSources}" sizes="${sizes}" type="image/avif">
                    <source srcset="${webpSources}" sizes="${sizes}" type="image/webp">
                    <source srcset="${jpgSources}" sizes="${sizes}" type="image/jpeg">
                    <img src="./img/gallery/${baseName}-3840.jpg" alt="">
                </picture>
            `;
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



// Accordion
document.querySelectorAll('.accordion-trigger').forEach(trigger => {
        trigger.addEventListener('click', () => {
            const item = trigger.closest('.accordion-item');
            const isActive = item.classList.contains('active');
            item.classList.toggle('active');
            trigger.setAttribute('aria-expanded', !isActive);
        });
});

// Modal Open
document.querySelectorAll('.modal-open').forEach(openBtn => {
        openBtn.addEventListener('click', () => {
            document.querySelector('.modal').classList.add('active');
        });
});

// Modal Close
document.querySelectorAll('.modal-close').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            const modal = closeBtn.closest('.modal');
            modal.classList.remove('active');
        });
});


// removed untill adding back
// const showNumber = document.getElementById("showNumber");
// const favDialog = document.getElementById("favDialog");
// const number = document.getElementById("number");

// showNumber.addEventListener("click", () => {
//   number.innerText = Math.floor(Math.random() * 1000);
//   favDialog.showModal();
// });


// Image compare - before and after
// const slider = document.querySelector('.image-compare > input[type=range]');
// const afterImage = document.querySelector('.image-compare > img:last-of-type');

// function updateClipPath(value) {
//     afterImage.style.clipPath = `inset(0 ${100 - value}% 0 0)`;
// }

// slider.addEventListener('input', (e) => {
//     const sliderValue = parseFloat(e.target.value);
//     updateClipPath(sliderValue);
// });

// Optional: Touch support
// slider.addEventListener('touchmove', (e) => {
//     e.preventDefault();
//     const touch = e.touches[0];
//     const sliderRect = slider.getBoundingClientRect();
//     const value = ((touch.clientX - sliderRect.left) / sliderRect.width) * 100;
//     slider.value = Math.max(0, Math.min(100, value));
//     updateClipPath(parseFloat(slider.value));
// });
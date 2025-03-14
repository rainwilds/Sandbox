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

// Define multiple gallery arrays
const gallery_1_Images = [
    { url: '/Sandbox/img/gallery/gallery-item-1.jpg' },
    { url: '/Sandbox/img/gallery/gallery-item-2.jpg' },
    { url: '/Sandbox/img/gallery/gallery-item-3.jpg' },
    { url: '/Sandbox/img/gallery/gallery-item-4.jpg' },
    { url: '/Sandbox/img/gallery/gallery-item-5.jpg' },
    { url: '/Sandbox/img/gallery/gallery-item-6.jpg' },
    { url: '/Sandbox/img/gallery/gallery-item-7.jpg' },
    { url: '/Sandbox/img/gallery/gallery-item-8.jpg' },
    { url: '/Sandbox/img/gallery/gallery-item-9.jpg' }
];

const gallery_2_Images = [
    { url: '/Sandbox/img/gallery/gallery-item-1.jpg' },
    { url: '/Sandbox/img/gallery/gallery-item-2.jpg' },
    { url: '/Sandbox/img/gallery/gallery-item-3.jpg' },
    { url: '/Sandbox/img/gallery/gallery-item-4.jpg' },
    { url: '/Sandbox/img/gallery/gallery-item-5.jpg' },
    { url: '/Sandbox/img/gallery/gallery-item-6.jpg' },
    { url: '/Sandbox/img/gallery/gallery-item-7.jpg' },
    { url: '/Sandbox/img/gallery/gallery-item-8.jpg' },
    { url: '/Sandbox/img/gallery/gallery-item-9.jpg' }
];

// Mapping of selectors to gallery arrays
const galleryMap = {
    'gallery-main': gallery_1_Images,
    'gallery-scroll': gallery_2_Images
};

function insertAndStyleGallery(selector) {
    const containers = document.querySelectorAll(selector); // Select all matching containers

    containers.forEach((container) => {
        // Determine which gallery array to use based on the container's class
        let galleryArray = null;
        let matchedClass = null;
        for (const [className, images] of Object.entries(galleryMap)) {
            if (container.classList.contains(className)) {
                galleryArray = images;
                matchedClass = className;
                break;
            }
        }

        // Only proceed if a specific gallery type is matched
        if (!matchedClass) {
            return; // Skip this container if it doesn't match a specific gallery type
        }

        // Add gallery class to container if it doesn't have it
        if (!container.classList.contains('gallery')) {
            container.classList.add('gallery');
        }

        // Insert images
        galleryArray.forEach((image) => {
            const imageUrl = image.url;
            const id = image.url.split('/').pop().replace(/\.[^/.]+$/, '');
            const pictureTagString = createPictureTagString(id, imageUrl);
            container.insertAdjacentHTML('beforeend', pictureTagString);
        });

        // Check if the container has the "gallery-scroll" class
        const hasScrollClass = container.classList.contains('gallery-scroll');

        // Only apply styleGallery if the container does NOT have "gallery-scroll" class
        if (!hasScrollClass) {
            styleGallery(container);
        }
    });
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

// Call the combined function for all elements with class containing "gallery"
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
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
            <video autoplay muted loop disablepictureinpicture playsinline poster="${posterUrl}">
                <source src="${videoUrl}" type="video/mp4">
                <source src="${videoUrl.replace('.mp4', '.webm')}" type="video/webm">
            </video>
        `;
    }
    
    // Updated function to create picture tag string (simplified for brevity)
    function createPictureTagString(id, imageUrl) {
        return `
            <picture>
                <img width="100%" src="${imageUrl}" alt="Alt title" title="Image title" loading="lazy" id="${id}" />
            </picture>
        `;
    }
    
    // Define multiple gallery arrays with type support
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
    
    // Mapping of selectors to gallery arrays
    const galleryMap = {
        'gallery-main': gallery_1_Images,
        'gallery-scroll': gallery_2_Images
    };
    
    // Updated insertAndStyleGallery function
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
    
            if (!container.classList.contains('gallery')) {
                container.classList.add('gallery');
            }
    
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
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



// code for galleries

function getRandomSpan() {
    return Math.random() < 0.3 ? 2 : 1; // 30% chance of spanning 2, 70% chance of 1
}

const galleryItems = document.querySelectorAll('div[class*="gallery"] > picture');
const columns = 4; // This will be overridden by CSS media queries, but kept for reference
const totalItems = galleryItems.length;
const completeRows = Math.floor(totalItems / columns);
const maxItems = completeRows * columns;
const lastRowStart = maxItems;

galleryItems.forEach((item, index) => {
    let spanCols = 1; // Default to 1 column
    let spanRows = getRandomSpan(); // Can be 1 or 2 rows

    // Limit row spanning for items in the last row to prevent protrusion
    if (index >= lastRowStart) {
        spanRows = 1; // Force 1 row for last row items
    }

    // If spanning 2 rows, decide if it should also span 2 columns (only for non-last-row items)
    if (spanRows === 2) {
        spanCols = Math.random() < 0.5 ? 2 : 1; // 50% chance of 2x2, 50% chance of 1x2
    }

    // Apply the grid spanning
    item.style.gridColumn = `span ${spanCols}`;
    item.style.gridRow = `span ${spanRows}`;
});


// code for scrolling sections

// const scrollContainer = document.querySelector('.scroll-container');
//         let isDown = false;
//         let startX;
//         let scrollLeft;

//         // Mouse drag scrolling - capture clicks anywhere in container
//         scrollContainer.addEventListener('mousedown', (e) => {
//             isDown = true;
//             scrollContainer.style.cursor = 'grabbing';
//             startX = e.pageX - scrollContainer.offsetLeft;
//             scrollLeft = scrollContainer.scrollLeft;
//             e.preventDefault(); // Prevent text selection
//         });

//         scrollContainer.addEventListener('mouseleave', () => {
//             isDown = false;
//             scrollContainer.style.cursor = 'grab';
//         });

//         scrollContainer.addEventListener('mouseup', () => {
//             isDown = false;
//             scrollContainer.style.cursor = 'grab';
//         });

//         scrollContainer.addEventListener('mousemove', (e) => {
//             if (!isDown) return;
//             e.preventDefault();
//             const x = e.pageX - scrollContainer.offsetLeft;
//             const walk = (x - startX) * 2; // Adjust multiplier for scroll speed
//             scrollContainer.scrollLeft = scrollLeft - walk;
//         });

//         // Touch handling
//         scrollContainer.addEventListener('touchstart', (e) => {
//             const touch = e.touches[0];
//             startX = touch.pageX - scrollContainer.offsetLeft;
//             scrollLeft = scrollContainer.scrollLeft;
//         });

//         scrollContainer.addEventListener('touchmove', (e) => {
//             if (scrollContainer.scrollWidth <= scrollContainer.clientWidth) return;
//             const touch = e.touches[0];
//             const x = touch.pageX - scrollContainer.offsetLeft;
//             const walk = (x - startX) * 2;
//             scrollContainer.scrollLeft = scrollLeft - walk;
//             e.stopPropagation();
//         }, { passive: false });

const scrollContainer = document.querySelector('.scroll-container');
        
        function checkGridColumns() {
            const parent = scrollContainer.parentElement; // body in this case, will be your section
            const computedStyle = window.getComputedStyle(parent);
            const gridTemplateColumns = computedStyle.gridTemplateColumns.split(' ');
            const columnCount = gridTemplateColumns.length;
            
            return columnCount < 4;
        }

        function initializeScroll() {
            let isDown = false;
            let startX;
            let scrollLeft;

            const mouseDownHandler = (e) => {
                isDown = true;
                scrollContainer.style.cursor = 'grabbing';
                startX = e.pageX - scrollContainer.offsetLeft;
                scrollLeft = scrollContainer.scrollLeft;
                e.preventDefault();
            };

            const mouseLeaveHandler = () => {
                isDown = false;
                scrollContainer.style.cursor = 'grab';
            };

            const mouseUpHandler = () => {
                isDown = false;
                scrollContainer.style.cursor = 'grab';
            };

            const mouseMoveHandler = (e) => {
                if (!isDown) return;
                e.preventDefault();
                const x = e.pageX - scrollContainer.offsetLeft;
                const walk = (x - startX) * 2;
                scrollContainer.scrollLeft = scrollLeft - walk;
            };

            const touchStartHandler = (e) => {
                const touch = e.touches[0];
                startX = touch.pageX - scrollContainer.offsetLeft;
                scrollLeft = scrollContainer.scrollLeft;
            };

            const touchMoveHandler = (e) => {
                if (scrollContainer.scrollWidth <= scrollContainer.clientWidth) return;
                const touch = e.touches[0];
                const x = touch.pageX - scrollContainer.offsetLeft;
                const walk = (x - startX) * 2;
                scrollContainer.scrollLeft = scrollLeft - walk;
                e.stopPropagation();
            };

            // Add event listeners
            scrollContainer.addEventListener('mousedown', mouseDownHandler);
            scrollContainer.addEventListener('mouseleave', mouseLeaveHandler);
            scrollContainer.addEventListener('mouseup', mouseUpHandler);
            scrollContainer.addEventListener('mousemove', mouseMoveHandler);
            scrollContainer.addEventListener('touchstart', touchStartHandler);
            scrollContainer.addEventListener('touchmove', touchMoveHandler, { passive: false });

            // Return cleanup function to remove listeners
            return function cleanup() {
                scrollContainer.removeEventListener('mousedown', mouseDownHandler);
                scrollContainer.removeEventListener('mouseleave', mouseLeaveHandler);
                scrollContainer.removeEventListener('mouseup', mouseUpHandler);
                scrollContainer.removeEventListener('mousemove', mouseMoveHandler);
                scrollContainer.removeEventListener('touchstart', touchStartHandler);
                scrollContainer.removeEventListener('touchmove', touchMoveHandler);
            };
        }

        // Initialize and manage scroll behavior
        let cleanupScroll = null;
        function updateScrollBehavior() {
            const shouldScroll = checkGridColumns();
            
            if (shouldScroll && !cleanupScroll) {
                cleanupScroll = initializeScroll();
            } else if (!shouldScroll && cleanupScroll) {
                cleanupScroll();
                cleanupScroll = null;
                scrollContainer.style.cursor = 'default'; // Reset cursor
            }
        }

        // Initial check and resize listener
        updateScrollBehavior();
        window.addEventListener('resize', updateScrollBehavior);
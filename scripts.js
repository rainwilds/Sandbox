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

function getColumnCount() {
    // Dynamically determine the number of columns based on current media query
    const gallery = document.querySelector('.gallery-large');
    const computedStyle = window.getComputedStyle(gallery);
    const gridColumns = computedStyle.gridTemplateColumns.split(' ').length;
    return gridColumns;
}

const galleryItems = document.querySelectorAll('div[class*="gallery"] > picture');
const columns = getColumnCount();
const totalItems = galleryItems.length;
const completeRows = Math.floor(totalItems / columns);
const maxItems = completeRows * columns;
const lastRowItems = totalItems - maxItems;

// Apply random spanning to each item
galleryItems.forEach((item, index) => {
    let spanCols = 1; // Default to 1 column
    const spanRows = getRandomSpan(); // Can be 1 or 2 rows

    // If spanning 2 rows, decide if it should also span 2 columns
    if (spanRows === 2) {
        spanCols = Math.random() < 0.5 ? 2 : 1; // 50% chance of 2x2, 50% chance of 1x2
    }

    // Apply the grid spanning
    item.style.gridColumn = `span ${spanCols}`;
    item.style.gridRow = `span ${spanRows}`;

    // Remove orphan picture if last row has only 1 item
    if (index >= maxItems && lastRowItems === 1) {
        item.classList.add('hidden');
    }
});
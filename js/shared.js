// Regular expression for validating image file extensions.
// Matches common formats like jpg, jpeg, png, webp, avif, jxl, svg (case-insensitive).
// Used to ensure source URLs in image generators are valid images.
export const VALID_IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|webp|avif|jxl|svg)$/i;

// Array of valid alignment strings for positioning elements.
// Includes basic directions and combinations for flexible grid placements.
// Used in validation to prevent invalid layout configurations.
export const VALID_ALIGNMENTS = [
    'center', 'top', 'bottom', 'left', 'right',
    'top-left', 'top-center', 'top-right',
    'bottom-left', 'bottom-center', 'bottom-right',
    'center-left', 'center-right'
];

// Object mapping alignment strings to CSS class names.
// Translates semantic alignments to place-self utilities for CSS Grid.
// Enables easy application of positioning in components like logos or navs.
export const VALID_ALIGN_MAP = {
    'center': 'place-self-center',
    'top': 'place-self-top',
    'bottom': 'place-self-bottom',
    'left': 'place-self-left',
    'right': 'place-self-right',
    'top-left': 'place-self-top-left',
    'top-center': 'place-self-top-center',
    'top-right': 'place-self-top-right',
    'bottom-left': 'place-self-bottom-left',
    'bottom-center': 'place-self-bottom-center',
    'bottom-right': 'place-self-bottom-right',
    'center-left': 'place-self-center-left',
    'center-right': 'place-self-center-right'
};

// Regular expression for validating video file extensions.
// Matches common formats like mp4, webm (case-insensitive) for broad browser compatibility.
// Used in video generators to validate and process video URLs.
export const VALID_VIDEO_EXTENSIONS = /\.(mp4|webm)$/i;
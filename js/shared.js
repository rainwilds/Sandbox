// shared.js

// Standard viewport breakpoints for consistent responsive behavior across components
export const VIEWPORT_BREAKPOINTS = [
    { name: 'mobile', maxWidth: 768 },
    { name: 'tablet', maxWidth: 1024 },
    { name: 'laptop', maxWidth: 1366 },
    { name: 'desktop', maxWidth: 1920 },
    { name: 'large', maxWidth: 2560 },
    { name: 'ultra', maxWidth: 3840 }
];

// Array of just the maxWidth values for quick lookups
export const VIEWPORT_BREAKPOINT_WIDTHS = VIEWPORT_BREAKPOINTS.map(bp => bp.maxWidth);

// Array of valid alignment strings for positioning elements.
// Includes basic directions and combinations for flexible grid placements.
// Used in validation to prevent invalid layout configurations.
export const VALID_ALIGNMENTS = [
    'center', 'top', 'bottom', 'top-left', 'top-center', 'top-right',
    'bottom-left', 'bottom-center', 'bottom-right',
    'center-left', 'center-right'
];

// Object mapping alignment strings to CSS class names.
// Translates semantic alignments to place-content utilities for CSS Grid.
// Enables easy application of positioning in components like logos or navs.
export const VALID_ALIGN_MAP = {
    'center': 'place-content-center',
    'top': 'place-content-top',
    'bottom': 'place-content-bottom',
    'top-left': 'place-content-top-left',
    'top-center': 'place-content-top-center',
    'top-right': 'place-content-top-right',
    'bottom-left': 'place-content-bottom-left',
    'bottom-center': 'place-content-bottom-center',
    'bottom-right': 'place-content-bottom-right',
    'center-left': 'place-content-center-left',
    'center-right': 'place-content-center-right'
};

// Object mapping backdrop filter class names to their CSS values.
// Translates semantic backdrop filter classes to actual CSS filter properties.
// Used in components for applying effects like blur or grayscale to overlays and backgrounds.
export const BACKDROP_FILTER_MAP = {
    'backdrop-filter-blur-small': 'blur(var(--blur-small))',
    'backdrop-filter-blur-medium': 'blur(var(--blur-medium))',
    'backdrop-filter-blur-large': 'blur(var(--blur-large))',
    'backdrop-filter-grayscale-small': 'grayscale(var(--grayscale-small))',
    'backdrop-filter-grayscale-medium': 'grayscale(var(--grayscale-medium))',
    'backdrop-filter-grayscale-large': 'grayscale(var(--grayscale-large))'
};

// Allowed styles for icons (semantic, text/layout-focused)
export const ALLOWED_ICON_STYLES = [
    'color', 'font-size', 'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
    'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
    'display', 'text-align', 'vertical-align', 'line-height', 'width', 'height'
];

// Allowed styles for buttons (includes background/border, shorthands for padding/margin)
export const ALLOWED_BUTTON_STYLES = [
    'color', 'background-color', 'border', 'border-radius', 'padding', 'margin', 'font-size', 'font-weight', 'text-align', 'display', 'width', 'height'
];

// Allowed styles for lists (ul/ol) - includes list-specific props and grid layout additions
export const ALLOWED_LIST_STYLES = [
    'color', 'background-color', 'border', 'border-radius', 'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left', 'font-size', 'font-weight',
    'text-align', 'display', 'width', 'height', 'list-style', 'list-style-position', 'list-style-type',
    'grid-template-columns', 'justify-content', 'text-align'  // Added for grid support as per your update
];
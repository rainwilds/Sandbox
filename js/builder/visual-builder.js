import * as Shared from '../shared.js';

// --- 1. DROPDOWN MAPPINGS ---
const ATTR_DROPDOWNS = {
    'subgrid': ['true', 'false'],
    'inner-alignment': Shared.VALID_ALIGNMENTS,
    'text-alignment': ['left', 'center', 'right'],
    'heading-tag': Shared.VALID_HEADING_TAGS,
    'sub-heading-tag': Shared.VALID_HEADING_TAGS,
    'shadow': Shared.VALID_SHADOW_CLASSES,
    'inner-shadow': Shared.VALID_SHADOW_CLASSES,
    'img-background-aspect-ratio': Shared.VALID_ASPECT_RATIOS,
    'img-primary-aspect-ratio': Shared.VALID_ASPECT_RATIOS,
    'border': Shared.VALID_BORDER_CLASSES.filter(c => !c.includes('radius')),
    'inner-border': Shared.VALID_BORDER_CLASSES.filter(c => !c.includes('radius')),
    'border-radius': Shared.VALID_BORDER_CLASSES.filter(c => c.includes('radius')),
    'inner-border-radius': Shared.VALID_BORDER_CLASSES.filter(c => c.includes('radius')),
    'backdrop-filter': Shared.VALID_BACKDROP_CLASSES,
    'inner-backdrop-filter': Shared.VALID_BACKDROP_CLASSES
};

// --- 2. COMPONENT SCHEMAS & CONFIG ---
const COMPONENT_CONFIG = {
    'custom-block': {
        isContainer: false,
        groups: {
            'Placement': ['column-start', 'column-end', 'row-start', 'row-end', 'z-index'],
            'Content': ['heading', 'sub-heading', 'paragraph', 'button-text', 'button-href', 'button-class', 'button-type', 'button-style', 'button-aria-label', 'button-rel', 'button-target', 'button-icon', 'button-icon-position', 'button-icon-offset', 'button-icon-size', 'icon', 'icon-class', 'icon-size', 'icon-style', 'text-alignment', 'section-title'],
            'Styling': ['class', 'style', 'effects', 'shadow', 'border', 'border-radius', 'background-color', 'background-gradient', 'background-image-noise', 'background-overlay', 'backdrop-filter', 'inner-class', 'inner-style', 'inner-alignment', 'inner-background-color', 'inner-background-gradient', 'inner-background-image-noise', 'inner-background-overlay', 'inner-backdrop-filter', 'inner-border', 'inner-border-radius', 'inner-shadow'],
            'Media (Background)': ['img-background-src', 'img-background-light-src', 'img-background-dark-src', 'img-background-alt', 'img-background-aspect-ratio', 'img-background-decorative', 'img-background-desktop-width', 'img-background-fetchpriority', 'img-background-loading', 'img-background-mobile-width', 'img-background-position', 'img-background-tablet-width', 'video-background-src', 'video-background-light-src', 'video-background-dark-src', 'video-background-poster', 'video-background-light-poster', 'video-background-dark-poster', 'video-background-alt', 'video-background-autoplay', 'video-background-loop', 'video-background-muted', 'video-background-playsinline', 'video-background-disable-pip', 'video-background-loading'],
            'Media (Primary)': ['img-primary-src', 'img-primary-light-src', 'img-primary-dark-src', 'img-primary-alt', 'img-primary-aspect-ratio', 'img-primary-decorative', 'img-primary-desktop-width', 'img-primary-fetchpriority', 'img-primary-loading', 'img-primary-mobile-width', 'img-primary-position', 'img-primary-tablet-width', 'video-primary-src', 'video-primary-light-src', 'video-primary-dark-src', 'video-primary-poster', 'video-primary-light-poster', 'video-primary-dark-poster', 'video-primary-alt', 'video-primary-autoplay', 'video-primary-loop', 'video-primary-muted', 'video-primary-playsinline', 'video-primary-disable-pip', 'video-primary-loading'],
            'Lists': ['ul-items', 'ol-items', 'content-order', 'ul-icon', 'ol-icon', 'ul-icon-position', 'ol-icon-position', 'ul-style', 'ol-style', 'ul-icon-offset', 'ol-icon-offset']
        }
    },
    'custom-slider': {
        isContainer: true,
        groups: {
            'Slider Settings': ['autoplay', 'slides-per-view', 'slides-per-view-mobile', 'slides-per-view-tablet', 'slides-per-view-laptop', 'slides-per-view-desktop', 'slides-per-view-large', 'gap', 'draggable', 'cross-fade', 'infinite-scrolling', 'pause-on-hover'],
            'Navigation': ['navigation', 'navigation-icon-left', 'navigation-icon-right', 'navigation-icon-left-background', 'navigation-icon-right-background', 'navigation-icon-size'],
            'Pagination': ['pagination', 'pagination-position', 'pagination-icon-active', 'pagination-icon-inactive', 'pagination-icon-size']
        }
    },
    'custom-layout': {
        isContainer: true,
        groups: {
            'Layout Grid': ['subgrid', 'min-col-width', 'column-span']
        }
    }
};

class VisualBuilder extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        this.state = { roots: [], items: {} };
        this.selectedId = null;
        this.draggedLibraryType = null;
        this.placeholder = null;
        this.currentViewport = 'base';

        // 1. Text-based Viewport Buttons
        const dynamicViewportButtons = [...Shared.VIEWPORT_BREAKPOINTS].reverse().map(bp => {
            const label = bp.name.charAt(0).toUpperCase() + bp.name.slice(1);
            return `<button class="vp-btn" data-vp="${bp.name}">${label}</button>`;
        }).join('');

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    position: fixed; inset: 0; pointer-events: none;
                    font-family: 'Inter', system-ui, sans-serif; z-index: 9999;
                    color: #a1a1aa;
                    /* Base variables for sidebar widths */
                    --left-width: 260px;
                    --right-width: 300px;
                }

                .panel { pointer-events: auto; position: fixed; background: #18181b; border-color: #27272a; border-style: solid; box-sizing: border-box; }
                
                #top-bar { top: 0; left: 0; right: 0; height: 60px; border-bottom-width: 1px; display: flex; align-items: center; justify-content: space-between; padding: 0 20px; z-index: 100; }
                
                /* 2. Sidebars use variables */
/* 2. Sidebars use variables */
                #left-sidebar { top: 60px; left: 0; bottom: 0; width: var(--left-width); border-right-width: 1px; display: flex; flex-direction: column; }
                #right-sidebar { top: 60px; right: 0; bottom: 0; width: var(--right-width); border-left-width: 1px; display: flex; flex-direction: column; overflow-y: auto; padding: 15px; }
                /* 3. Resizer Styles */
                .resizer { position: absolute; top: 0; bottom: 0; width: 6px; cursor: col-resize; z-index: 100; transition: background 0.2s; }
                .resizer:hover, .resizer.active { background: #3b82f6; }
                #left-resizer { right: -3px; }
                #right-resizer { left: -3px; }

                /* Top Bar Elements */
                .logo { font-size: 1.1rem; font-weight: 700; color: #fafafa; letter-spacing: -0.5px; display: flex; align-items: center; gap: 8px;}
                .logo-icon { color: #3b82f6; }
                
                #viewport-bar { display: flex; gap: 4px; background: #09090b; padding: 4px; border-radius: 6px; border: 1px solid #27272a; }
                .vp-btn { background: transparent; border: none; padding: 6px 10px; border-radius: 4px; color: #71717a; cursor: pointer; transition: all 0.2s; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
                .vp-btn:hover { color: #fafafa; }
                .vp-btn.active { background: #27272a; color: #fafafa; box-shadow: 0 1px 3px rgba(0,0,0,0.5); }

                /* Buttons */
                button { font-family: inherit; font-size: 0.8rem; font-weight: 500; border: 1px solid transparent; cursor: pointer; transition: all 0.2s; border-radius: 6px; }
                .btn-primary { background: #3b82f6; color: white; padding: 6px 12px; }
                .btn-primary:hover { background: #2563eb; }
                .btn-secondary { background: #27272a; color: #fafafa; border-color: #3f3f46; padding: 6px 12px; }
                .btn-secondary:hover { background: #3f3f46; }
                .top-actions { display: flex; gap: 8px; }

                /* Left Sidebar Tabs */
                .tabs-header { display: flex; border-bottom: 1px solid #27272a; }
                .tab-btn { flex: 1; background: transparent; color: #71717a; padding: 12px 0; border-radius: 0; font-weight: 600; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; }
                .tab-btn.active { color: #fafafa; border-bottom: 2px solid #3b82f6; }
                .tab-pane { display: none; padding: 15px; overflow-y: auto; flex-grow: 1; }
                .tab-pane.active { display: block; }

                /* Left: Components */
                .component-item { background: #27272a; color: #fafafa; padding: 12px; border-radius: 6px; margin-bottom: 8px; cursor: grab; font-size: 0.85rem; border: 1px solid #3f3f46; display: flex; align-items: center; gap: 8px; transition: border-color 0.2s; }
                .component-item:hover { border-color: #52525b; background: #3f3f46;}
                
                /* Left: Layers Tree */
                .layer-item { padding: 6px; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 8px; border-radius: 4px; margin-bottom: 2px; color: #a1a1aa; }
                .layer-item:hover { background: #27272a; color: #fafafa; }
                .layer-item.selected { background: #3b82f620; color: #3b82f6; font-weight: 500; }
                .layer-icon { opacity: 0.7; font-size: 0.9em; }

                /* Right: Inspector Compact Inputs */
                h3 { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; color: #fafafa; margin: 20px 0 10px 0; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #27272a; padding-bottom: 6px; }
                .form-group { display: grid; grid-template-columns: 90px 1fr; align-items: center; margin-bottom: 8px; gap: 10px; }
                .form-group.stacked { grid-template-columns: 1fr; gap: 4px; align-items: stretch; }
                label { font-size: 0.75rem; color: #a1a1aa; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                input, select, textarea { width: 100%; background: #09090b; border: 1px solid #27272a; color: #fafafa; padding: 6px 8px; border-radius: 4px; font-size: 0.8rem; box-sizing: border-box; transition: border-color 0.2s; }
                input:focus, select:focus, textarea:focus { outline: none; border-color: #3b82f6; }
                
                /* Modals / Utility */
                #breadcrumbs { font-size: 0.75rem; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #27272a; }
                #breadcrumbs span.crumb:hover { color: #fafafa !important; }
                #empty-state { text-align: center; margin-top: 40px; font-size: 0.85rem; }
                .color-picker-wrap { display: flex; align-items: center; gap: 8px; }
                .color-picker-wrap input[type="color"] { width: 30px; height: 30px; padding: 0; cursor: pointer; border: none; border-radius: 4px; }
            /* Export Modal Styles */
                /* Export Modal Styles */
            #export-modal { 
                display: none; 
                position: fixed; 
                inset: 0; 
                background: rgba(0,0,0,0.8); 
                z-index: 10000; 
                place-content: center; 
                padding: 2rem; 
                pointer-events: auto; /* <-- THIS IS THE FIX! */
            }
                #export-modal.active { display: grid; }
                .modal-content { background: #18181b; padding: 2rem; border-radius: 8px; width: 80vw; max-width: 800px; display: flex; flex-direction: column; position: relative; border: 1px solid #27272a; }
                .code-wrapper { position: relative; margin: 1rem 0; flex-grow: 1; }
                textarea#export-code { width: 100%; height: 50vh; box-sizing: border-box; font-family: monospace; white-space: pre; resize: none; background: #09090b; color: #3b82f6; padding: 1rem; border-radius: 6px; border: 1px solid #27272a;}
                #btn-copy { position: absolute; top: 15px; right: 25px; width: auto; background: #3b82f6; color: white; font-size: 0.8rem; box-shadow: 0 2px 4px rgba(0,0,0,0.5); }
                #btn-copy:hover { background: #2563eb; }
                </style>

            <div id="top-bar" class="panel">
                <div class="logo"><span class="logo-icon">✦</span> NovaForge</div>
                <div id="viewport-bar">
                    <button class="vp-btn active" data-vp="base">Base</button>
                    ${dynamicViewportButtons}
                </div>
                <div class="top-actions">
                    <button id="btn-toggle-guides" class="btn-secondary">Guides: Off</button>
                    <button id="btn-clear" class="btn-secondary" style="color: #ef4444; border-color: #7f1d1d;">Clear</button>
                    <button id="btn-export" class="btn-primary">Export HTML</button>
                </div>
            </div>

            <div id="left-sidebar" class="panel">
                <div id="left-resizer" class="resizer"></div>
                
                <div class="tabs-header">
                    <button class="tab-btn active" data-target="tab-elements">Add</button>
                    <button class="tab-btn" data-target="tab-layers">Layers</button>
                    <button class="tab-btn" data-target="tab-globals">Globals</button>
                </div>
                
                <div id="tab-elements" class="tab-pane active">
                    <div class="component-item" draggable="true" data-type="custom-layout">⚏ Layout Grid</div>
                    <div class="component-item" draggable="true" data-type="custom-block">◻ Content Block</div>
                    <div class="component-item" draggable="true" data-type="custom-slider">◫ Media Slider</div>
                </div>

                <div id="tab-layers" class="tab-pane">
                    <div id="layers-tree"></div>
                </div>

                <div id="tab-globals" class="tab-pane">
                    <p style="font-size: 0.75rem; margin-top: 0; margin-bottom: 15px;">Variables map directly to styles.css</p>
                    <div class="form-group stacked">
                        <label>Business Name</label>
                        <input type="text" id="global-business-name" value="My Business">
                    </div>
                    <div class="form-group stacked">
                        <label>Primary Brand Color</label>
                        <div class="color-picker-wrap">
                            <input type="color" id="global-color-primary" value="#4f46e5">
                            <input type="text" id="global-color-primary-text" value="#4f46e5" style="flex-grow: 1;">
                        </div>
                    </div>
                </div>
            </div>

            <div id="right-sidebar" class="panel">
                <div id="right-resizer" class="resizer"></div>
                
                <div id="inspector">
                    <p id="empty-state">Select an element on the canvas to edit its properties.</p>
                    <div id="edit-form" style="display: none;">
                        <div id="breadcrumbs"></div>
                        <div style="display: flex; gap: 8px; margin-bottom: 10px;">
                            <button id="btn-up" class="btn-secondary" style="flex:1;">↑ Up</button>
                            <button id="btn-down" class="btn-secondary" style="flex:1;">↓ Down</button>
                            <button id="btn-delete" class="btn-secondary" style="flex:1; color:#ef4444;">🗑</button>
                        </div>
                        <div id="dynamic-inputs"></div>
                    </div>
                </div>
            </div>

            <div id="export-modal">
                <div class="modal-content">
                    <h2 style="color: #fafafa; margin-top: 0; font-size: 1.2rem;">Exported HTML</h2>
                    <p style="margin: 0 0 10px 0; color: #a1a1aa; font-size: 0.9rem;">Review and copy your layout code below.</p>
                    <div class="code-wrapper">
                        <button id="btn-copy">📋 Copy</button>
                        <textarea id="export-code" readonly></textarea>
                    </div>
                    <div style="display: flex; justify-content: flex-end;">
                        <button id="close-modal" class="btn-secondary">Close</button>
                    </div>
                </div>
            </div>
        `;
    }

    connectedCallback() {
        this.canvas = document.getElementById('canvas');

        const style = document.createElement('style');
        style.innerHTML = `
/* The Master Grid on the canvas */
            #canvas {
                display: grid;
                grid-template-columns: repeat(12, 1fr);
                gap: 16px; /* Match your site's standard gap */
                padding: 2rem;
                align-content: start;
                min-height: 100vh;
                position: relative;
            }



.builder-grid-overlay {
                position: absolute;
                top: 0; left: 0; right: 0; bottom: 0;
                padding: 2rem; /* Must exactly match #canvas padding */
                box-sizing: border-box;
                display: none; /* Hidden by default */
                grid-template-columns: repeat(12, 1fr);
                gap: 16px; /* Must exactly match #canvas gap */
                pointer-events: none; /* Lets you click completely through it */
                z-index: 9998; /* Sits over components, under dragged items */
            }

            #canvas.show-guides .builder-grid-overlay {
                display: grid;
            }

            .builder-guide-col {
                /* Matches the indigo builder theme (looks like DevTools) */
                background: rgba(129, 140, 248, 0.08); 
                border-left: 1px dashed rgba(129, 140, 248, 0.4);
                border-right: 1px dashed rgba(129, 140, 248, 0.4);
                height: 100%;
            }            

            /* Make wrappers invisible to the CSS Grid */
            .builder-wrapper { 
                display: contents; 
            }
            
            /* Apply outlines to the ACTUAL component inside the wrapper */
            .builder-wrapper > * { 
                position: relative; cursor: pointer; transition: all 0.2s; 
                outline: 1px dashed transparent; pointer-events: auto !important; 
            }
            .builder-wrapper:hover > * { outline: 2px dashed #94a3b8; outline-offset: -2px; z-index: 5; }
            .builder-selected > * { outline: 3px solid #2196F3 !important; outline-offset: -3px; z-index: 10; overflow: visible !important;}
            .builder-wrapper * { pointer-events: none; }
            .builder-wrapper.is-dragging > * { opacity: 0.5; }

/* Add this below your .builder-selected CSS rule */
            .resize-handle {
                position: absolute;
                top: 50%;
                width: 14px;
                height: 28px;
                background: #4f46e5;
                border: 2px solid white;
                border-radius: 4px;
                transform: translateY(-50%);
                z-index: 20;
                cursor: ew-resize;
                pointer-events: auto !important;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            }
            .handle-left { left: -7px; }
            .handle-right { right: -7px; }            
            
            /* Give custom-layout its layout rules while inside the builder */
            custom-layout {
                display: contents; /* Become invisible to grid */
            }
            
            custom-layout > section {
                display: grid;
                grid-column: 1 / -1; /* Span the whole canvas grid */
                grid-template-columns: subgrid; /* Inherit the 12 columns */
                min-height: 100px;
                border: 2px dashed #475569; /* Visual aid for empty drop zones */
                background: rgba(0,0,0,0.02);

                pointer-events: auto !important;
            }
            
            custom-layout > section > div {
                grid-column: 1 / -1; 
                /* Inner div inherits grid-template-columns from the component's JS */
            }
            
            .builder-wrapper.drop-target > custom-layout > section { 
                outline: 4px dashed #10b981 !important; outline-offset: -4px; background: rgba(16, 185, 129, 0.1); 
            }
        `;
        document.head.appendChild(style);

        this.setupDragAndDrop();
        this.setupCanvasSelection();
        this.setupResizeHandles();
        this.setupControls();
        this.loadState();
    }

    saveState() {
        localStorage.setItem('rainwildsBuilderTree', JSON.stringify(this.state));
    }

    loadState() {
        const saved = localStorage.getItem('rainwildsBuilderTree');
        if (saved) {
            this.state = JSON.parse(saved);
        }
        this.rebuildCanvas();
    }

    rebuildCanvas() {
        this.canvas.innerHTML = '';

        this.state.roots.forEach(rootId => {
            const el = this.renderNode(rootId);
            if (el) this.canvas.appendChild(el);
        });

        if (this.selectedId) {
            this.canvas.querySelectorAll(`[data-id="${this.selectedId}"]`).forEach(el => {
                el.classList.add('builder-selected');

                if (el.dataset.type === 'custom-block') {
                    const targetEl = el.firstElementChild; // <-- FIX: Target the actual block
                    if (targetEl) {
                        const leftH = document.createElement('div');
                        leftH.className = 'resize-handle handle-left';
                        leftH.dataset.dir = 'left';

                        const rightH = document.createElement('div');
                        rightH.className = 'resize-handle handle-right';
                        rightH.dataset.dir = 'right';

                        targetEl.appendChild(leftH);
                        targetEl.appendChild(rightH);
                    }
                }
            });
        }

        const overlay = document.createElement('div');
        overlay.className = 'builder-grid-overlay';
        for (let i = 0; i < 12; i++) {
            const col = document.createElement('div');
            col.className = 'builder-guide-col';
            overlay.appendChild(col);
        }
        this.canvas.appendChild(overlay);

        this.saveState();
    }

    setupResizeHandles() {
        let isResizing = false;
        let resizeDir = null;
        let currentWrapper = null;
        let containerRect = null;
        let startLine = 1;
        let endLine = 13;

        const getLineFromX = (clientX) => {
            let x = clientX - containerRect.left;
            x = Math.max(0, Math.min(x, containerRect.width));
            return Math.round((x / containerRect.width) * 12) + 1;
        };

        this.canvas.addEventListener('mousedown', (e) => {
            if (e.target.classList.contains('resize-handle')) {
                e.preventDefault();
                e.stopPropagation();

                isResizing = true;
                resizeDir = e.target.dataset.dir;
                currentWrapper = e.target.closest('.builder-wrapper');

                const targetEl = currentWrapper.firstElementChild; // <-- FIX: Get the real DOM element
                const container = currentWrapper.closest('custom-layout > section') || this.canvas;
                containerRect = container.getBoundingClientRect();

                // FIX: Get the width and position from the actual block, NOT the display:contents wrapper
                const elRect = targetEl.getBoundingClientRect();

                startLine = getLineFromX(elRect.left);
                endLine = getLineFromX(elRect.right);

                document.body.style.cursor = 'ew-resize';
            }
        });

        window.addEventListener('mousemove', (e) => {
            if (!isResizing || !currentWrapper) return;
            e.preventDefault();

            let newLine = getLineFromX(e.clientX);
            const vpSuffix = this.currentViewport === 'base' ? '' : `-${this.currentViewport}`;
            const targetEl = currentWrapper.firstElementChild;

            if (resizeDir === 'left') {
                newLine = Math.min(newLine, endLine - 1);
                startLine = newLine;
                targetEl.style.setProperty(`--column-start${vpSuffix}`, newLine);
            } else {
                newLine = Math.max(newLine, startLine + 1);
                endLine = newLine;
                targetEl.style.setProperty(`--column-end${vpSuffix}`, newLine);
            }
        });

        window.addEventListener('mouseup', (e) => {
            if (isResizing) {
                isResizing = false;
                document.body.style.cursor = '';

                const vpSuffix = this.currentViewport === 'base' ? '' : `-${this.currentViewport}`;
                const compData = this.state.items[currentWrapper.dataset.id];

                compData.attrs[`column-start${vpSuffix}`] = startLine.toString();
                compData.attrs[`column-end${vpSuffix}`] = endLine.toString();

                this.rebuildCanvas();
                this.populateInspector();
            }
        });
    }

    setupSidebarResizing() {
        const leftResizer = this.shadowRoot.getElementById('left-resizer');
        const rightResizer = this.shadowRoot.getElementById('right-resizer');

        let isResizing = false;
        let currentSide = null;

        const startResize = (e, side) => {
            isResizing = true;
            currentSide = side;
            e.target.classList.add('active');
            document.body.style.cursor = 'col-resize';
        };

        leftResizer.addEventListener('mousedown', (e) => startResize(e, 'left'));
        rightResizer.addEventListener('mousedown', (e) => startResize(e, 'right'));

        window.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            e.preventDefault();

            if (currentSide === 'left') {
                let newWidth = e.clientX;
                newWidth = Math.max(200, Math.min(newWidth, 600)); // Min 200px, Max 600px
                this.style.setProperty('--left-width', `${newWidth}px`);
                // Update global HTML variable so body padding adjusts
                document.documentElement.style.setProperty('--builder-left', `${newWidth}px`);
            } else if (currentSide === 'right') {
                let newWidth = window.innerWidth - e.clientX;
                newWidth = Math.max(200, Math.min(newWidth, 600)); // Min 200px, Max 600px
                this.style.setProperty('--right-width', `${newWidth}px`);
                // Update global HTML variable so body padding adjusts
                document.documentElement.style.setProperty('--builder-right', `${newWidth}px`);
            }
        });

        window.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                leftResizer.classList.remove('active');
                rightResizer.classList.remove('active');
                document.body.style.cursor = '';
            }
        });
    }

    renderLayers() {
        const treeContainer = this.shadowRoot.getElementById('layers-tree');
        if (!treeContainer) return;

        treeContainer.innerHTML = '';

        if (this.state.roots.length === 0) {
            treeContainer.innerHTML = '<div style="font-style: italic; font-size: 0.8rem;">Canvas is empty.</div>';
            return;
        }

        const buildTree = (id, depth = 0) => {
            const node = this.state.items[id];
            if (!node) return '';

            const isSelected = this.selectedId === id ? 'selected' : '';
            // Pretty names for the tree
            const cleanName = node.type.replace('custom-', '').charAt(0).toUpperCase() + node.type.replace('custom-', '').slice(1);
            const icon = node.type === 'custom-layout' ? '⚏' : node.type === 'custom-slider' ? '◫' : '◻';

            let html = `
                <div class="layer-item ${isSelected}" data-id="${id}" style="padding-left: ${depth * 15}px;">
                    <span class="layer-icon">${icon}</span> ${cleanName}
                </div>
            `;

            if (node.children && node.children.length > 0) {
                node.children.forEach(childId => {
                    html += buildTree(childId, depth + 1);
                });
            }
            return html;
        };

        let fullHtml = '';
        this.state.roots.forEach(rootId => { fullHtml += buildTree(rootId); });
        treeContainer.innerHTML = fullHtml;

        // Wire up clicks to select elements on the canvas
        treeContainer.querySelectorAll('.layer-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const targetId = e.currentTarget.dataset.id;
                this.selectedId = targetId;

                // Update Canvas Selection Visually
                this.canvas.querySelectorAll('.builder-selected').forEach(el => el.classList.remove('builder-selected'));
                this.canvas.querySelectorAll('.resize-handle').forEach(h => h.remove());

                const targetEl = this.canvas.querySelector(`[data-id="${targetId}"]`);
                if (targetEl) {
                    targetEl.classList.add('builder-selected');
                    // Add handles if it's a block
                    if (targetEl.dataset.type === 'custom-block' && targetEl.firstElementChild) {
                        const leftH = document.createElement('div'); leftH.className = 'resize-handle handle-left'; leftH.dataset.dir = 'left';
                        const rightH = document.createElement('div'); rightH.className = 'resize-handle handle-right'; rightH.dataset.dir = 'right';
                        targetEl.firstElementChild.appendChild(leftH);
                        targetEl.firstElementChild.appendChild(rightH);
                    }
                }

                this.populateInspector();
                this.renderLayers(); // Re-render to highlight the active layer
            });
        });
    }

    renderNode(id) {
        const nodeData = this.state.items[id];
        if (!nodeData) return null;

        const wrapper = document.createElement('div');
        wrapper.className = 'builder-wrapper';
        wrapper.dataset.id = id;
        wrapper.dataset.type = nodeData.type;
        wrapper.dataset.isContainer = COMPONENT_CONFIG[nodeData.type]?.isContainer ? "true" : "false";
        wrapper.setAttribute('draggable', 'true');

        if (nodeData.parentId && this.state.items[nodeData.parentId]?.type === 'custom-slider') {
            wrapper.classList.add('block', 'is-slide');
        }

        const component = document.createElement(nodeData.type);
        for (const [key, value] of Object.entries(nodeData.attrs)) {
            component.setAttribute(key, value);
        }

        if (nodeData.children && nodeData.children.length > 0) {
            nodeData.children.forEach(childId => {
                const childEl = this.renderNode(childId);
                if (childEl) component.appendChild(childEl);
            });
        }

        wrapper.appendChild(component);

        wrapper.addEventListener('dragstart', (e) => {
            e.stopPropagation();
            wrapper.classList.add('is-dragging');
            e.dataTransfer.setData('text/plain', 'move:' + wrapper.dataset.id);
        });

        wrapper.addEventListener('dragend', () => {
            wrapper.classList.remove('is-dragging');
            this.canvas.querySelectorAll('.drop-target').forEach(el => el.classList.remove('drop-target'));
        });

        return wrapper;
    }

    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll(':scope > .builder-wrapper:not(.is-dragging)')];
        return draggableElements.reduce((closest, child) => {
            // Measure the actual component, not the invisible wrapper!
            const elToMeasure = child.firstElementChild || child;
            const box = elToMeasure.getBoundingClientRect();

            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    setupDragAndDrop() {
        // --- 1. HANDLE DRAGGING FROM THE LIBRARY PANEL ---
        const items = this.shadowRoot.querySelectorAll('.component-item');
        items.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', 'new:' + e.target.dataset.type);
                this.draggedLibraryType = e.target.dataset.type;
            });
            item.addEventListener('dragend', () => {
                this.draggedLibraryType = null;
                if (this.placeholder) { this.placeholder.remove(); this.placeholder = null; }
            });
        });

        // --- 2. HANDLE DRAGGING OVER THE CANVAS ---
        this.canvas.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.canvas.querySelectorAll('.drop-target').forEach(el => el.classList.remove('drop-target'));

            const draggingWrapper = this.canvas.querySelector('.is-dragging');
            const draggingType = this.draggedLibraryType || (draggingWrapper ? draggingWrapper.dataset.type : null);
            const isDraggingLayout = draggingType === 'custom-layout';

            let dropContainer = this.canvas;
            let dropTargetWrapper = null;

            // Only allow targeting inner containers if we are NOT dragging a custom-layout
            if (!isDraggingLayout) {
                dropTargetWrapper = e.target.closest('.builder-wrapper[data-is-container="true"]');
                if (dropTargetWrapper) {
                    dropTargetWrapper.classList.add('drop-target');
                    if (dropTargetWrapper.dataset.type === 'custom-layout') {
                        const innerDiv = dropTargetWrapper.querySelector('custom-layout > section > div');
                        if (innerDiv) dropContainer = innerDiv;
                    } else {
                        dropContainer = dropTargetWrapper.firstElementChild;
                    }
                }
            }

            if (this.draggedLibraryType && !this.placeholder) {
                this.placeholder = document.createElement('div');
                this.placeholder.className = 'builder-wrapper is-dragging placeholder';
                this.placeholder.innerText = `Drop ${this.draggedLibraryType} Here`;
                this.canvas.appendChild(this.placeholder);
            }

            const afterElement = this.getDragAfterElement(dropContainer, e.clientY);

            if (draggingWrapper || this.placeholder) {
                const elToMove = draggingWrapper || this.placeholder;
                if (afterElement == null) {
                    dropContainer.appendChild(elToMove);
                } else {
                    dropContainer.insertBefore(elToMove, afterElement);
                }
            }
        });

        // --- 3. HANDLE DROPPING THE ITEM ---
        this.canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            this.canvas.querySelectorAll('.drop-target').forEach(el => el.classList.remove('drop-target'));
            if (this.placeholder) { this.placeholder.remove(); this.placeholder = null; }

            const payload = e.dataTransfer.getData('text/plain');
            if (!payload) return;

            // Determine if the item being dropped is a Layout
            let isLayout = false;
            const payloadType = payload.split(':')[1];
            if (payload.startsWith('new:')) isLayout = payloadType === 'custom-layout';
            else if (payload.startsWith('move:')) isLayout = this.state.items[payloadType]?.type === 'custom-layout';

            let newParentId = null;
            // Only find a new parent if it's NOT a layout
            if (!isLayout) {
                const dropTarget = e.target.closest('.builder-wrapper[data-is-container="true"]');
                if (dropTarget) newParentId = dropTarget.dataset.id;
            }

            if (payload.startsWith('new:')) {
                const componentType = payloadType;
                const uniqueId = 'comp-' + Date.now();

                const initialAttrs = {};
                if (componentType === 'custom-layout') {
                    initialAttrs['column-span'] = '12';
                    initialAttrs['subgrid'] = 'true';
                } else if (componentType === 'custom-block') {
                    initialAttrs['heading'] = 'New Block';
                    initialAttrs['class'] = 'background-color-1';
                    initialAttrs['inner-class'] = 'padding-large';
                }

                this.state.items[uniqueId] = { id: uniqueId, type: componentType, attrs: initialAttrs, children: [], parentId: newParentId };

                if (newParentId) this.state.items[newParentId].children.push(uniqueId);
                else this.state.roots.push(uniqueId);

                this.selectedId = uniqueId;

            } else if (payload.startsWith('move:')) {
                const itemId = payloadType;
                if (itemId === newParentId) return;

                const item = this.state.items[itemId];

                if (item.parentId) {
                    const oldParent = this.state.items[item.parentId];
                    oldParent.children = oldParent.children.filter(id => id !== itemId);
                } else {
                    this.state.roots = this.state.roots.filter(id => id !== itemId);
                }

                item.parentId = newParentId;

                // CRITICAL: We need to figure out the exact new index based on where it was dropped in the DOM
                const dropContainer = newParentId ? this.canvas.querySelector(`[data-id="${newParentId}"]`).firstElementChild : this.canvas;
                const afterElement = this.getDragAfterElement(dropContainer, e.clientY);

                const targetArray = newParentId ? this.state.items[newParentId].children : this.state.roots;

                if (afterElement == null) {
                    targetArray.push(itemId); // Append to end
                } else {
                    const afterId = afterElement.dataset.id;
                    const insertIndex = targetArray.indexOf(afterId);
                    targetArray.splice(insertIndex, 0, itemId); // Insert before the hovered element
                }
            }

            this.draggedLibraryType = null;
            this.rebuildCanvas();
            this.populateInspector();
            if (this.renderLayers) this.renderLayers();
        });
    }

    setupCanvasSelection() {
        this.canvas.addEventListener('click', (e) => {
            if (e.target.classList.contains('resize-handle')) return;

            const clickedWrapper = e.target.closest('.builder-wrapper');

            if (clickedWrapper) {
                e.stopPropagation();
                this.selectedId = clickedWrapper.dataset.id;

                this.canvas.querySelectorAll('.builder-selected').forEach(el => el.classList.remove('builder-selected'));
                this.canvas.querySelectorAll('.resize-handle').forEach(h => h.remove());

                clickedWrapper.classList.add('builder-selected');

                if (clickedWrapper.dataset.type === 'custom-block') {
                    const targetEl = clickedWrapper.firstElementChild; // <-- FIX: Target the actual block
                    if (targetEl) {
                        const leftH = document.createElement('div');
                        leftH.className = 'resize-handle handle-left';
                        leftH.dataset.dir = 'left';

                        const rightH = document.createElement('div');
                        rightH.className = 'resize-handle handle-right';
                        rightH.dataset.dir = 'right';

                        targetEl.appendChild(leftH);
                        targetEl.appendChild(rightH);
                    }
                }

                this.populateInspector();
            } else {
                this.selectedId = null;
                this.canvas.querySelectorAll('.builder-selected').forEach(el => el.classList.remove('builder-selected'));
                this.canvas.querySelectorAll('.resize-handle').forEach(h => h.remove());
                this.hideInspector();
            }
        });
    }

    populateInspector() {
        this.shadowRoot.getElementById('empty-state').style.display = 'none';
        this.shadowRoot.getElementById('edit-form').style.display = 'block';

        const compData = this.state.items[this.selectedId];
        if (!compData) return;

        // Breadcrumbs
        const breadcrumbs = this.shadowRoot.getElementById('breadcrumbs');
        breadcrumbs.innerHTML = '';
        let currentId = this.selectedId;
        const trail = [];
        while (currentId) {
            const node = this.state.items[currentId];
            trail.unshift({ id: node.id, type: node.type });
            currentId = node.parentId;
        }

        trail.forEach((step, index) => {
            const span = document.createElement('span');
            span.textContent = step.type;
            span.className = 'crumb';
            span.style.color = (index === trail.length - 1) ? '#818cf8' : '#cbd5e1';
            span.style.cursor = 'pointer';

            span.addEventListener('click', () => {
                this.selectedId = step.id;
                this.canvas.querySelectorAll('.builder-selected').forEach(el => el.classList.remove('builder-selected'));
                this.canvas.querySelectorAll(`[data-id="${step.id}"]`).forEach(el => el.classList.add('builder-selected'));
                this.populateInspector();
            });

            breadcrumbs.appendChild(span);
            if (index < trail.length - 1) {
                const sep = document.createElement('span');
                sep.textContent = ' > ';
                sep.style.color = '#475569';
                breadcrumbs.appendChild(sep);
            }
        });

        // DYNAMIC INPUTS
        const dynamicContainer = this.shadowRoot.getElementById('dynamic-inputs');
        dynamicContainer.innerHTML = '';

        const config = COMPONENT_CONFIG[compData.type];
        if (!config || !config.groups) return;

        // Determine viewport suffix for placement attributes
        const vpSuffix = this.currentViewport === 'base' ? '' : `-${this.currentViewport}`;
        const placementAttrs = ['column-start', 'column-end', 'row-start', 'row-end', 'z-index'];

        for (const [groupName, attributes] of Object.entries(config.groups)) {
            // Group Header
            const groupHeader = document.createElement('h3');
            groupHeader.textContent = groupName;
            groupHeader.style.cssText = 'color: #818cf8; font-size: 0.85rem; border-bottom: 1px solid #475569; padding-bottom: 4px; margin-top: 20px; text-transform: uppercase;';
            dynamicContainer.appendChild(groupHeader);

            attributes.forEach(baseAttrName => {
                // If it's a placement attribute, attach the viewport suffix
                const isPlacement = placementAttrs.includes(baseAttrName);
                const attrName = isPlacement ? `${baseAttrName}${vpSuffix}` : baseAttrName;

                const formGroup = document.createElement('div');
                formGroup.className = 'form-group';

                const label = document.createElement('label');
                label.textContent = attrName.replace(/-/g, ' ');
                if (isPlacement && this.currentViewport !== 'base') label.style.color = '#10b981'; // Highlight responsive overrides

                let input;

                if (ATTR_DROPDOWNS[baseAttrName]) {
                    input = document.createElement('select');
                    const defaultOption = document.createElement('option');
                    defaultOption.value = ''; defaultOption.textContent = '-- None --';
                    input.appendChild(defaultOption);

                    ATTR_DROPDOWNS[baseAttrName].forEach(val => {
                        const opt = document.createElement('option');
                        opt.value = val; opt.textContent = val;
                        if (compData.attrs[attrName] === val) opt.selected = true;
                        input.appendChild(opt);
                    });
                } else if (isPlacement || attrName === 'column-span') {
                    // CHANGED: Back to type="text" so you can type "span 4" or "-1"
                    input = document.createElement('input');
                    input.type = 'text';
                    input.placeholder = 'e.g., 4, -1, or span 6';
                    input.value = compData.attrs[attrName] || '';
                } else if (attrName.includes('paragraph') || attrName.includes('items') || attrName.includes('icon')) {
                    input = document.createElement('textarea');
                    input.rows = 3;
                    input.value = compData.attrs[attrName] || '';
                } else {
                    input = document.createElement('input');
                    input.type = 'text';
                    input.value = compData.attrs[attrName] || '';
                    if (attrName === 'class' || attrName === 'inner-class') input.placeholder = "e.g. padding-large block";
                }

                if (!this.debounceTimers) this.debounceTimers = {};

                input.addEventListener('input', (e) => {
                    const newValue = e.target.value;
                    if (newValue.trim() === '') {
                        delete compData.attrs[attrName];
                    } else {
                        compData.attrs[attrName] = newValue;
                    }

                    // NEW: Debounce the canvas rebuild!
                    if (this.debounceTimers[attrName]) {
                        clearTimeout(this.debounceTimers[attrName]);
                    }

                    // Wait 300ms after the last keystroke before rebuilding the canvas
                    this.debounceTimers[attrName] = setTimeout(() => {
                        this.rebuildCanvas();
                    }, 300);
                });

                // THIS WAS MISSING: Actually append the elements to the sidebar!
                formGroup.appendChild(label);
                formGroup.appendChild(input);
                dynamicContainer.appendChild(formGroup);

            }); // THIS WAS INCORRECT: Needed to be }); to close the forEach loop properly
        }
    }

    hideInspector() {
        this.shadowRoot.getElementById('empty-state').style.display = 'block';
        this.shadowRoot.getElementById('edit-form').style.display = 'none';
    }

    setupControls() {
        const root = this.shadowRoot;

        const vpButtons = root.querySelectorAll('.vp-btn');
        const viewportWidths = { 'base': '100%' };
        Shared.VIEWPORT_BREAKPOINTS.forEach(bp => {
            viewportWidths[bp.name] = `${bp.maxWidth}px`;
        });

        vpButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Update active button styling
                vpButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Update State
                this.currentViewport = btn.dataset.vp;

                // Resize Canvas Wrapper using our dynamically generated map
                this.canvas.style.maxWidth = viewportWidths[this.currentViewport];
                this.canvas.style.transition = 'max-width 0.3s ease';

                // Repopulate Inspector so it dynamically updates input fields
                if (this.selectedId) this.populateInspector();
            });
        });

        const btnToggleGuides = root.getElementById('btn-toggle-guides');
        btnToggleGuides.addEventListener('click', () => {
            this.canvas.classList.toggle('show-guides');

            // Update button UI state
            if (this.canvas.classList.contains('show-guides')) {
                btnToggleGuides.textContent = 'Hide Grid';
                btnToggleGuides.style.background = '#4338ca'; // Active darker purple
            } else {
                btnToggleGuides.textContent = 'Show Grid';
                btnToggleGuides.style.background = '#4f46e5'; // Default purple
            }
        });

        root.getElementById('btn-up').addEventListener('click', () => {
            if (!this.selectedId) return;
            const item = this.state.items[this.selectedId];
            const arrayToEdit = item.parentId ? this.state.items[item.parentId].children : this.state.roots;
            const index = arrayToEdit.indexOf(this.selectedId);
            if (index > 0) {
                [arrayToEdit[index - 1], arrayToEdit[index]] = [arrayToEdit[index], arrayToEdit[index - 1]];
                this.rebuildCanvas();
            }
        });

        root.getElementById('btn-down').addEventListener('click', () => {
            if (!this.selectedId) return;
            const item = this.state.items[this.selectedId];
            const arrayToEdit = item.parentId ? this.state.items[item.parentId].children : this.state.roots;
            const index = arrayToEdit.indexOf(this.selectedId);
            if (index > -1 && index < arrayToEdit.length - 1) {
                [arrayToEdit[index + 1], arrayToEdit[index]] = [arrayToEdit[index], arrayToEdit[index + 1]];
                this.rebuildCanvas();
            }
        });

        root.getElementById('btn-delete').addEventListener('click', () => {
            if (!this.selectedId) return;
            const item = this.state.items[this.selectedId];

            if (item.parentId) {
                const parent = this.state.items[item.parentId];
                parent.children = parent.children.filter(id => id !== this.selectedId);
            } else {
                this.state.roots = this.state.roots.filter(id => id !== this.selectedId);
            }

            delete this.state.items[this.selectedId];
            this.selectedId = null;
            this.hideInspector();
            this.rebuildCanvas();
        });

        root.getElementById('btn-clear').addEventListener('click', () => {
            if (confirm('Are you sure you want to clear the canvas?')) {
                this.state = { roots: [], items: {} };
                this.selectedId = null;
                this.hideInspector();
                this.rebuildCanvas();
            }
        });

        // Add this inside setupControls()

        // --- Left Sidebar Tabs Logic ---
        const tabBtns = root.querySelectorAll('.tab-btn');
        const tabPanes = root.querySelectorAll('.tab-pane');

        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                tabBtns.forEach(b => b.classList.remove('active'));
                tabPanes.forEach(p => p.classList.remove('active'));

                btn.classList.add('active');
                root.getElementById(btn.dataset.target).classList.add('active');
            });
        });

        // --- Global Settings Live Update ---
        const primaryColorPicker = root.getElementById('global-color-primary');
        const primaryColorText = root.getElementById('global-color-primary-text');

        const updatePrimaryColor = (val) => {
            primaryColorPicker.value = val;
            primaryColorText.value = val;
            // Write directly to the document root to update all components live!
            document.documentElement.style.setProperty('--color-primary', val);
        };

        primaryColorPicker.addEventListener('input', (e) => updatePrimaryColor(e.target.value));
        primaryColorText.addEventListener('input', (e) => updatePrimaryColor(e.target.value));

        const generateHTML = (id, indentLevel = 0) => {
            const node = this.state.items[id];
            const indent = '  '.repeat(indentLevel);
            let attrString = Object.entries(node.attrs).map(([k, v]) => `${k}="${v}"`).join(' ');
            if (attrString) attrString = ' ' + attrString;

            let html = `${indent}<${node.type}${attrString}>\n`;

            if (node.children && node.children.length > 0) {
                node.children.forEach(childId => {
                    html += generateHTML(childId, indentLevel + 1);
                });
            }

            html += `${indent}</${node.type}>\n`;
            return html;
        };

        root.getElementById('btn-export').addEventListener('click', () => {
            const modal = root.getElementById('export-modal');
            const textarea = root.getElementById('export-code');

            let exportHtml = '\n';
            this.state.roots.forEach(rootId => {
                exportHtml += generateHTML(rootId) + '\n';
            });

            textarea.value = exportHtml;
            modal.classList.add('active');
        });

        const copyBtn = root.getElementById('btn-copy');
        const textarea = root.getElementById('export-code');
        copyBtn.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(textarea.value);
                copyBtn.textContent = '✅ Copied!';
                copyBtn.style.background = '#059669';
                setTimeout(() => {
                    copyBtn.textContent = '📋 Copy';
                    copyBtn.style.background = '#4f46e5';
                }, 2000);
            } catch (err) {
                alert('Failed to copy text.');
            }
        });

        root.getElementById('close-modal').addEventListener('click', () => {
            root.getElementById('export-modal').classList.remove('active');
        });
    }
} // Closes VisualBuilder class

customElements.define('visual-builder', VisualBuilder);
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



class VisualBuilder extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        this.state = { roots: [], items: {} };
        this.globalParts = {}; // NEW: Holds the master global components
        // Add cache slots for the history timeline
        this.isolationMode = { active: false, partId: null, cachedState: null, cachedHistory: null, cachedHistoryIndex: -1 };

        this.history = [];
        this.historyIndex = -1;
        this.isScrubbing = false;

        this.selectedId = null;
        this.draggedLibraryType = null;
        this.placeholder = null;
        this.currentViewport = 'laptop'; // Default to standard desktop

        // 1. Text-based Viewport Buttons
        const dynamicViewportButtons = [...Shared.VIEWPORT_BREAKPOINTS].reverse().map(bp => {
            const label = bp.name.charAt(0).toUpperCase() + bp.name.slice(1);
            const isActive = bp.name === this.currentViewport ? 'active' : '';
            return `<button class="vp-btn ${isActive}" data-vp="${bp.name}">${label}</button>`;
        }).join('');

        this.shadowRoot.innerHTML = `
          <style>
                :host {
                    position: fixed; inset: 0; pointer-events: none;
                    font-family: 'Inter', system-ui, sans-serif; z-index: 9999;
                    
                    /* --- THEME ENGINE START --- */
                    --theme-bg-panel: #232733;       /* Main panel background */
                    --theme-bg-bar: #1c1f2b;         /* Top/Bottom bars */
                    --theme-bg-input: #151822;       /* Input backgrounds */
                    --theme-border: #353b4d;         /* Standard borders */
                    --theme-border-light: #444b61;   /* Lighter borders for buttons */
                    --theme-text: #e2e8f0;           /* Primary text */
                    --theme-text-muted: #8b97ab;     /* Secondary text */
                    --theme-accent: #6b8cb3;         /* Steel Blue Primary */
                    --theme-accent-hover: #85a5cc;   /* Steel Blue Hover */
                    --theme-item-bg: #2a2f3d;        /* List items/components */
                    --theme-item-hover: #353b4d;     /* List item hover */
                    /* --- THEME ENGINE END --- */

                    color: var(--theme-text-muted);
                    --left-width: 260px;
                    --right-width: 300px;
                }

                /* ISOLATION MODE: Shift UI to Amber/Gold */
                :host(.isolation-mode) {
                    --theme-accent: #f59e0b;         /* Amber 500 */
                    --theme-accent-hover: #fbbf24;   /* Amber 400 */
                    --theme-bg-panel: #292015;       /* Warm dark tint */
                    --theme-bg-bar: #1c140c;         /* Warmer dark bar */
                    --theme-border: #523719;         /* Amber tinted borders */
                }

               /* Layout & Panels */
                .panel { pointer-events: auto; position: fixed; background: var(--theme-bg-panel); border-color: var(--theme-border); border-style: solid; box-sizing: border-box; }
                #top-bar { top: 0; left: 0; right: 0; height: 60px; border-bottom-width: 1px; display: flex; align-items: center; justify-content: space-between; padding: 0 20px; z-index: 100; background: var(--theme-bg-bar); }
                #left-sidebar { top: 60px; left: 0; bottom: 60px; width: var(--left-width); border-right-width: 1px; display: flex; flex-direction: column; }
                #right-sidebar { top: 60px; right: 0; bottom: 60px; width: var(--right-width); border-left-width: 1px; display: flex; flex-direction: column; overflow-y: auto; padding: 15px; }
                
                #bottom-panel { bottom: 0; left: 0; right: 0; height: 60px; border-top-width: 1px; display: flex; flex-direction: column; z-index: 100; background: var(--theme-bg-bar); }
                #scrubber-bar { height: 25px; border-bottom: 1px solid var(--theme-border); display: flex; align-items: center; padding: 0 20px; position: relative; }
                #bottom-bar { height: 35px; display: flex; align-items: center; justify-content: space-between; padding: 0 20px; font-size: 0.75rem; color: var(--theme-text-muted); }
                
              /* Scrubber Input */
                .timeline-scrubber { -webkit-appearance: none; width: 100%; background: transparent; cursor: pointer; outline: none; margin: 0; position: relative; z-index: 2; }
                .timeline-scrubber:focus { outline: none !important; box-shadow: none !important; }
                .timeline-scrubber::-webkit-slider-runnable-track { width: 100%; height: 4px; background: var(--theme-border); border-radius: 2px; }

                /* Timeline Ticks */
                #scrubber-ticks { position: absolute; left: 20px; right: 20px; top: 0; bottom: 0; pointer-events: none; z-index: 1; }
                .scrubber-tick { position: absolute; top: 50%; transform: translateY(-50%); width: 2px; height: 10px; background: var(--theme-border-light); border-radius: 1px; }
                .timeline-scrubber::-webkit-slider-thumb { 
                    -webkit-appearance: none; 
                    height: 14px; 
                    width: 14px; 
                    /* Tweak 1, 2, 3: SVG icon, no hover scaling, fixed cursor */
                    background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="%236b8cb3"><path d="M0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z"/></svg>') no-repeat center center;
                    background-size: contain;
                    border-radius: 0; 
                    margin-top: -5px; 
                    box-shadow: none; 
                    cursor: grab;
                }
                .timeline-scrubber:active::-webkit-slider-thumb { cursor: grabbing; }
                .timeline-scrubber:disabled::-webkit-slider-thumb { filter: grayscale(1) opacity(0.5); cursor: not-allowed; }
                
                /* Tooltip Preview */
                /* Tweak 6: Removed border radius */
                #scrubber-tooltip { position: absolute; bottom: 30px; left: 50%; transform: translateX(-50%); background: var(--theme-bg-panel); border: 1px solid var(--theme-accent); padding: 8px 12px; border-radius: 0; font-size: 0.75rem; color: white; display: none; white-space: nowrap; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.5); pointer-events: none; z-index: 1000; flex-direction: column; align-items: center; }
                #scrubber-tooltip::after { content: ''; position: absolute; bottom: -5px; left: 50%; transform: translateX(-50%); border-width: 5px 5px 0; border-style: solid; border-color: var(--theme-accent) transparent transparent transparent; }
                .tooltip-action { font-weight: 600; color: #fbbf24; margin-bottom: 2px; }
                .tooltip-time { font-size: 0.65rem; color: var(--theme-text-muted); }

                /* History Panel Items */
                .history-item { padding: 8px 12px; font-size: 0.8rem; border-bottom: 1px solid var(--theme-border); cursor: pointer; display: flex; justify-content: space-between; color: var(--theme-text-muted); transition: background 0.2s; }
                .history-item:hover { background: var(--theme-item-bg); }
                .history-item.active { background: rgba(107, 140, 179, 0.15); color: var(--theme-text); border-left: 3px solid var(--theme-accent); }
                .history-item.future { opacity: 0.4; } 
                /* Resizers */
                .resizer { position: absolute; top: 0; bottom: 0; width: 6px; cursor: col-resize; z-index: 100; transition: background 0.2s; }
                .resizer:hover, .resizer.active { background: var(--theme-accent); }
                #left-resizer { right: -3px; }
                #right-resizer { left: -3px; }

                /* Top Bar Elements */
                .logo { font-size: 1.1rem; font-weight: 700; color: var(--theme-text); letter-spacing: -0.5px; display: flex; align-items: center; gap: 8px;}
                .logo-icon { color: var(--theme-accent); }
                #viewport-bar { display: flex; gap: 4px; background: var(--theme-bg-input); padding: 4px; border-radius: 6px; border: 1px solid var(--theme-border); }
                .vp-btn { background: transparent; border: none; padding: 6px 10px; border-radius: 4px; color: var(--theme-text-muted); cursor: pointer; transition: all 0.2s; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
                .vp-btn:hover { color: var(--theme-text); }
                .vp-btn.active { background: var(--theme-border); color: var(--theme-text); box-shadow: 0 1px 3px rgba(0,0,0,0.3); }

                /* Buttons */
                button { font-family: inherit; font-size: 0.8rem; font-weight: 500; border: 1px solid transparent; cursor: pointer; transition: all 0.2s; border-radius: 4px; }
                .btn-primary { background: var(--theme-accent); color: white; padding: 6px 12px; }
                .btn-primary:hover { background: var(--theme-accent-hover); }
                .btn-secondary { background: var(--theme-item-bg); color: var(--theme-text); border-color: var(--theme-border-light); padding: 6px 12px; }
                .btn-secondary:hover { background: var(--theme-item-hover); }
                .top-actions { display: flex; gap: 8px; }

                /* Tabs */
                .tabs-header { display: flex; border-bottom: 1px solid var(--theme-border); }
                .tab-btn { flex: 1; background: transparent; color: var(--theme-text-muted); padding: 10px 2px; border-radius: 0; font-weight: 600; font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                .tab-btn.active { color: var(--theme-text); border-bottom: 2px solid var(--theme-accent); }
                .tab-pane { display: none; padding: 15px; overflow-y: auto; flex-grow: 1; }
                .tab-pane.active { display: block; }

                /* Components & Layers */
                .component-item { background: var(--theme-item-bg); color: var(--theme-text); padding: 10px 12px; border-radius: 4px; margin-bottom: 8px; cursor: grab; font-size: 0.85rem; border: 1px solid var(--theme-border-light); display: flex; align-items: center; gap: 8px; transition: border-color 0.2s; }
                .component-item:hover { border-color: var(--theme-accent); background: var(--theme-item-hover); }
                .layer-item { padding: 6px; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; gap: 8px; border-radius: 4px; margin-bottom: 2px; color: var(--theme-text-muted); }
                .layer-item:hover { background: var(--theme-item-bg); color: var(--theme-text); }
                .layer-item.selected { background: rgba(107, 140, 179, 0.15); color: var(--theme-accent-hover); font-weight: 500; }
                .layer-icon { opacity: 0.7; font-size: 0.9em; }

                /* Inspector Forms */
                h3 { font-size: 0.75rem; text-transform: none; letter-spacing: 0.5px; color: var(--theme-text); margin: 20px 0 10px 0; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--theme-border); padding-bottom: 6px; }
                .form-group, .form-group.stacked { display: flex; flex-direction: column; align-items: stretch; margin-bottom: 12px; gap: 6px; }
                label { font-size: 0.75rem; color: var(--theme-text-muted); white-space: normal; word-break: break-word; line-height: 1.3; font-weight: 500; }
                
                /* Tweak 4: Removed default border, added box-shadow for focus state */
                input, select, textarea { width: 100%; background: var(--theme-bg-input); border: none; color: var(--theme-text); padding: 6px 8px; border-radius: 4px; font-size: 0.8rem; box-sizing: border-box; transition: box-shadow 0.2s; }
                input:focus, select:focus, textarea:focus { outline: none; box-shadow: 0 0 0 1px var(--theme-accent); }
                  .color-picker-wrap { display: flex; align-items: center; gap: 8px; }
                .color-picker-wrap input[type="color"] { width: 30px; height: 30px; padding: 0; cursor: pointer; border: none; border-radius: 4px; }
                
                #breadcrumbs { font-size: 0.75rem; display: flex; align-items: center; }
                #breadcrumbs span.crumb:hover { color: var(--theme-text) !important; }
                #empty-state { text-align: center; margin-top: 40px; font-size: 0.85rem; color: var(--theme-text-muted); }

              /* Modals */
                #cms-dashboard, #export-modal { display: none; position: fixed; inset: 0; background: rgba(28, 31, 43, 0.8); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); z-index: 10000; place-content: center; padding: 2rem; pointer-events: auto; }
                
                /* NEW: Unified Modal Fade-In Animation (0.4s matches isolation mode) */
                @keyframes modalFadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                #cms-dashboard.active, #export-modal.active { display: grid; animation: modalFadeIn 0.4s ease-out forwards; }
                .cms-container, .modal-content { background: var(--theme-bg-panel); border: 1px solid var(--theme-border); border-radius: 6px; width: 90vw; max-width: 1000px; max-height: 85vh; display: flex; flex-direction: column; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); position: relative; }
                
                .cms-header { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem; border-bottom: 1px solid var(--theme-border); }
                .cms-header h2 { margin: 0; color: var(--theme-text); font-size: 1.25rem; border: none; padding: 0; }
                .cms-list-header { display: grid; grid-template-columns: 3fr 2fr 1fr 1.5fr auto; padding: 1rem 1.5rem; border-bottom: 1px solid var(--theme-border); font-size: 0.75rem; color: var(--theme-text-muted); text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
                #cms-content-list { overflow-y: auto; padding: 0; margin: 0; list-style: none; flex-grow: 1; }
                .cms-list-item { display: grid; grid-template-columns: 3fr 2fr 1fr 1.5fr auto; padding: 1rem 1.5rem; border-bottom: 1px solid var(--theme-border); align-items: center; font-size: 0.85rem; color: var(--theme-text); transition: background 0.2s; }
                .cms-list-item:hover { background: var(--theme-item-bg); }
                .cms-badge { padding: 2px 8px; border-radius: 12px; font-size: 0.7rem; font-weight: 600; text-transform: uppercase; }
                .cms-badge.page { background: rgba(107, 140, 179, 0.2); color: var(--theme-accent-hover); }
                .cms-badge.post { background: rgba(16, 185, 129, 0.15); color: #34d399; }           
                
               .code-wrapper { position: relative; margin: 1rem 0; flex-grow: 1; }
                textarea#export-code { height: 50vh; font-family: monospace; white-space: pre; resize: none; background: var(--theme-bg-input); color: var(--theme-accent-hover); }
                #btn-copy { position: absolute; top: 15px; right: 25px; width: auto; background: var(--theme-accent); color: white; box-shadow: 0 2px 4px rgba(0,0,0,0.5); }
                #btn-copy:hover { background: var(--theme-accent-hover); }

              /* Media Modal Styles */
                #media-modal { display: none; position: fixed; inset: 0; background: rgba(28, 31, 43, 0.8); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); z-index: 10000; place-content: center; padding: 2rem; pointer-events: auto; } 
                #media-modal.active { display: grid; animation: modalFadeIn 0.4s ease-out forwards; }
                
                .media-layout { display: flex; height: 65vh; overflow: hidden; border-top: 1px solid var(--theme-border); }
                .media-grid-area { flex: 1; overflow-y: auto; padding: 15px; display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 10px; align-content: start; }
                .media-sidebar { width: 300px; background: var(--theme-bg-input); border-left: 1px solid var(--theme-border); padding: 15px; overflow-y: auto; display: flex; flex-direction: column; gap: 15px; }
                
                .media-thumbnail { border: 2px solid transparent; border-radius: 4px; overflow: hidden; cursor: pointer; transition: all 0.2s; background: var(--theme-bg-input); position: relative; }
                .media-thumbnail:hover, .media-thumbnail.selected { border-color: var(--theme-accent); }
                .media-thumbnail.selected { transform: scale(1.02); box-shadow: 0 0 15px rgba(107, 140, 179, 0.3); }
                .media-thumbnail img { width: 100%; height: 100px; object-fit: cover; display: block; }
                .media-label { font-size: 0.65rem; color: var(--theme-text-muted); padding: 4px; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
                
             /* EXIF Camera HUD */
                .exif-hud { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; background: var(--theme-bg-panel); padding: 15px; border-radius: 6px; border: 1px solid var(--theme-border); }
                .exif-stat { display: flex; align-items: center; gap: 10px; font-size: 0.85rem; color: var(--theme-text); font-weight: 500; }
                .exif-stat svg { width: 18px; height: 18px; fill: var(--theme-text-muted); }
                .exif-list { font-size: 0.75rem; color: var(--theme-text-muted); display: flex; flex-direction: column; gap: 6px; }
                
                /* FIX: Converted to a strict 2-column grid to force clean text wrapping */
                .exif-row { display: grid; grid-template-columns: 90px 1fr; gap: 10px; border-bottom: 1px solid var(--theme-border); padding-bottom: 4px; align-items: start; }
                .exif-row span:last-child { color: var(--theme-text); font-family: monospace; text-align: right; line-height: 1.4; word-break: break-word; }
             
             
                /* Cinematic Fade Transition Overlay */
                /* UPDATED: Sped up from 0.5s to 0.4s (20% faster) */
                #transition-overlay { position: fixed; inset: 0; background: #050505; z-index: 20000; opacity: 0; pointer-events: none; transition: opacity 0.4s ease-in-out; }
                #transition-overlay.active { opacity: 1; pointer-events: auto; }
                /* Status Indicator Light */
                .status-light { width: 8px; height: 8px; border-radius: 50%; background: #4b5563; transition: background 0.3s; flex-shrink: 0; }
                .status-light.working { background: #f59e0b; animation: pulse 1s infinite; }
                .status-light.success { background: #10b981; }
                .status-light.error { background: #ef4444; }
                @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.3; } 100% { opacity: 1; } }
            </style>

        <div id="top-bar" class="panel">
                <div class="logo">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" style="width:18px; height:18px; fill:var(--theme-accent);"><path d="M0 0l448 0 0 384-32 0 0 64 32 0 0 64-448 0 0-512zM64 416l0 32 288 0 0-64-256 0c-17.7 0-32 14.3-32 32zM272.8 109c5.2 8.6 8.2 18.7 8.2 29.5 0 15.1-5.9 28.8-15.5 39.1l-4.2 4.5 3.3 5.2c4.6 7.3 7.3 15.9 7.4 25.2l0 .6c-.1 21.5-14.4 39.7-34 45.6L237 234c7.1-4.4 11.8-12.2 11.8-21.1 0-9.6-5.5-18-13.5-22.1l-3.3-81.8-16 0-3.3 81.8c-8 4.1-13.5 12.4-13.5 22.1 0 8.9 4.7 16.7 11.8 21.1l-1 24.8c-19.7-6-34-24.3-34-45.9 0-9.4 2.7-18.2 7.4-25.5l3.3-5.2-4.2-4.5c-9.6-10.2-15.5-23.9-15.5-39.1 0-10.8 3-20.9 8.2-29.5L164.1 98.1c-32.1 20-53.4 55.6-53.4 96.2 0 62.6 50.7 113.3 113.3 113.3s113.3-50.7 113.3-113.3c0-40.6-21.4-76.2-53.4-96.2L272.8 109z"/></svg>
                    Fable
                </div>
                <div id="viewport-bar">
                    ${dynamicViewportButtons}
                </div>
<div class="top-actions">
<button id="btn-cms" class="btn-secondary" style="border-color: #8b5cf6; color: #a78bfa;">Dashboard</button>
    <button id="btn-toggle-guides" class="btn-secondary">Guides: Off</button>
    <button id="btn-clear" class="btn-secondary" style="color: #ef4444; border-color: #7f1d1d;">Clear</button>
    <button id="btn-view-html" class="btn-secondary">View HTML</button>
    <button id="btn-preview" class="btn-secondary">Live Preview</button> <button id="btn-save" class="btn-primary">Save</button>
    <button id="btn-publish" class="btn-primary" style="background: #10b981; border-color: #059669;">Publish</button>
</div>
            </div>

            <div id="left-sidebar" class="panel">
                <div id="left-resizer" class="resizer"></div>
                
<div class="tabs-header">
                    <button class="tab-btn active" data-target="tab-elements">Add</button>
                    <button class="tab-btn" data-target="tab-layers">Layers</button>
                    <button class="tab-btn" data-target="tab-meta">Meta</button> 
                    <button class="tab-btn" data-target="tab-globals">Global</button>
                    <button class="tab-btn" data-target="tab-history">History</button>
                </div>
                
                <div id="tab-elements" class="tab-pane active">
                    <div class="component-item" draggable="true" data-type="custom-layout">⚏ Layout Grid</div>
                    <div class="component-item" draggable="true" data-type="custom-block">◻ Content Block</div>
                    <div class="component-item" draggable="true" data-type="custom-slider">◫ Media Slider</div>
                </div>

                <div id="tab-layers" class="tab-pane">
                    <div id="layers-tree"></div>
                </div>

 <div id="tab-meta" class="tab-pane">
                    <p style="font-size: 0.75rem; margin-top: 0; margin-bottom: 15px; color: #818cf8;">Document Metadata</p>
                    
                    <div class="form-group stacked">
                        <label>Content Type</label>
                        <select id="meta-contentType">
                            <option value="post">Blog Post (/blog/)</option>
                            <option value="page">Standard Page (Root /)</option>
                        </select>
                    </div>
                    
                    <div class="form-group stacked">
                        <label>Hide from Search Engines</label>
                        <select id="meta-hidden">
                            <option value="">No (Index)</option>
                            <option value="true">Yes (NoIndex)</option>
                        </select>
                    </div>

                    <div class="form-group stacked"><label>URL Slug (Required)</label><input type="text" id="meta-slug" placeholder="my-new-post"></div>
                    <div class="form-group stacked"><label>Title</label><input type="text" id="meta-title"></div>
                    
                    <div id="meta-post-fields">
                        <div class="form-group stacked"><label>Date</label><input type="date" id="meta-date"></div>
                        <div class="form-group stacked"><label>Author</label><input type="text" id="meta-author" placeholder="Author Name"></div>
                        <div class="form-group stacked"><label>Categories</label><input type="text" id="meta-categories" placeholder="e.g., Tech, News"></div>
                    </div>

                    <div class="form-group stacked"><label>Description / Excerpt</label><textarea id="meta-description" rows="3"></textarea></div>
                    <div class="form-group stacked"><label>OG/Featured Image</label><input type="text" id="meta-ogImage" placeholder="e.g., image.jpg"></div>
                    
                    <p style="font-size: 0.75rem; margin-top: 15px; margin-bottom: 10px; color: #818cf8; border-bottom: 1px solid #27272a; padding-bottom: 4px;">Social Media Overrides</p>
                    <div class="form-group stacked"><label>Social Title</label><input type="text" id="meta-socialTitle" placeholder="Optional punchy title"></div>
                    <div class="form-group stacked"><label>Social Description</label><textarea id="meta-socialDescription" rows="2" placeholder="Optional punchy description"></textarea></div>

                    <p style="font-size: 0.75rem; margin-top: 15px; margin-bottom: 10px; color: #818cf8; border-bottom: 1px solid #27272a; padding-bottom: 4px;">Advanced (Head Generator)</p>
                    <div class="form-group stacked"><label>Canonical URL</label><input type="text" id="meta-canonical"></div>
                    <div class="form-group stacked"><label>Theme</label><input type="text" id="meta-theme" placeholder="dark or light"></div>
                    <div class="form-group stacked"><label>Hero Image Preload</label><input type="text" id="meta-heroImage"></div>
                    <div class="form-group stacked"><label>Hero Count</label><input type="number" id="meta-heroCount"></div>
                    <div class="form-group stacked"><label>Hero Widths</label><input type="text" id="meta-heroWidths"></div>
                    <div class="form-group stacked"><label>Hero Size</label><input type="text" id="meta-heroSize"></div>
                    <div class="form-group stacked"><label>Hero Format</label><input type="text" id="meta-heroFormat"></div>
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
                <div id="tab-history" class="tab-pane" style="padding: 0;">
                    <div id="history-list" style="display: flex; flex-direction: column;"></div>
                </div>
            </div>

           <div id="right-sidebar" class="panel">
                <div id="right-resizer" class="resizer"></div>
                
                <div id="inspector">
                    <p id="empty-state">Select an element on the canvas to edit its properties.</p>
                    <div id="edit-form" style="display: none;">
                        <div style="display: flex; gap: 8px; margin-bottom: 10px;">
                            <button id="btn-up" class="btn-secondary" style="flex:1;">↑ Up</button>
                            <button id="btn-down" class="btn-secondary" style="flex:1;">↓ Down</button>
                            <button id="btn-delete" class="btn-secondary" style="flex:1; color:#ef4444;">🗑</button>
                        </div>
                        <div id="dynamic-inputs"></div>
                    </div>
                </div>
            </div>

<div id="bottom-panel" class="panel">
                <div id="scrubber-bar">
                    <div id="scrubber-ticks"></div>
                    <input type="range" id="history-scrubber" class="timeline-scrubber" min="0" max="0" value="0" disabled>
                    <div id="scrubber-tooltip">
                        <span class="tooltip-action">Action</span>
                        <span class="tooltip-time">Time</span>
                    </div>
                </div>
                <div id="bottom-bar">
                    <div id="breadcrumbs">Canvas</div>
                    <div id="zoom-indicator" style="font-weight: 600; color: #8b5cf6;">Zoom: 100%</div>
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <div id="status-light" class="status-light idle"></div>
                        <div id="doc-status">Unsaved Document</div>
                    </div>
                </div>
            </div>
           <div id="cms-dashboard">
                <div class="cms-container">
                    <div class="cms-header">
                        <h2>Content Dashboard</h2>
                        <button id="close-cms" class="btn-secondary">Close</button>
                    </div>
                    <div class="cms-list-header">
                        <span>Title</span><span>Slug</span><span>Type</span><span>Date</span><span>Action</span>
                    </div>
                    <div id="cms-content-list">
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

           <div id="media-modal">
                <div class="modal-content" style="max-width: 1000px; width: 90vw;">
                    <div class="cms-header">
                        <h2>Media Library</h2>
                        <div style="display: flex; gap: 10px;">
                            <button id="btn-apply-media" class="btn-primary" disabled>Apply Image</button>
                            <button id="close-media-modal" class="btn-secondary">Close</button>
                        </div>
                    </div>
                    <div class="media-layout">
                        <div id="media-gallery" class="media-grid-area"></div>
                        <div id="media-sidebar" class="media-sidebar">
                            <div style="text-align: center; color: var(--theme-text-muted); font-size: 0.8rem; margin-top: 50px;">Select an image to view details</div>
                        </div>
                    </div>
                </div>
            </div>

            <div id="transition-overlay"></div>
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
                grid-auto-rows: min-content; 
                gap: 0; 
                padding: 0; 
                align-content: start;
                align-items: start; 
                min-height: 200px; /* Hugs content tightly, but won't vanish when completely empty */
                box-sizing: border-box;
                position: relative;
            }

           .builder-grid-overlay {
                position: absolute;
                top: 0; left: 0; right: 0; bottom: 0;
                padding: 0;
                box-sizing: border-box;
                display: none; 
                grid-template-columns: repeat(12, 1fr);
                gap: 0; 
                pointer-events: none; 
                z-index: 9998; 
                /* Makes the dashed lines cast a dark halo over light images */
                filter: drop-shadow(0 0 3px rgba(0, 0, 0, 0.8)); 
            }

            #canvas.show-guides .builder-grid-overlay {
                display: grid;
            }

            /* Extended Horizontal Bounding Lines */
            .builder-grid-overlay::before,
            .builder-grid-overlay::after {
                content: '';
                position: absolute;
                left: -5000px; right: -5000px; 
                height: 1px;
                z-index: 10;
            }
            .builder-grid-overlay::before { top: 0; border-top: 1px dashed rgba(129, 140, 248, 1); }
            .builder-grid-overlay::after { bottom: 0; border-bottom: 1px dashed rgba(129, 140, 248, 1); }

            .builder-guide-col {
                background: rgba(129, 140, 248, 0.05); /* Reduced fill so it doesn't cast a heavy shadow */
                height: 100%;
                border-left: 1px dashed rgba(129, 140, 248, 1); /* Max opacity for lines */
            }
            .builder-guide-col:last-child {
                border-right: 1px dashed rgba(129, 140, 248, 1);
            }

          /* Show dynamic row boundaries when guides are active */
            #canvas.show-guides .builder-wrapper {
                outline: 1px dashed rgba(129, 140, 248, 1);
                outline-offset: -1px;
                /* Inner black shadow gives contrast to the dashed outline over light backgrounds */
                box-shadow: inset 0 0 0 1px rgba(0,0,0,0.4);
            }

            /* Draw infinite horizontal lines at the start of every top-level row */
            #canvas.show-guides > .builder-wrapper::after {
                content: '';
                position: absolute;
                top: 0;
                left: -5000px;
                right: -5000px;
                height: 1px;
                border-top: 1px dashed rgba(129, 140, 248, 1);
                pointer-events: none;
                z-index: 9998;
                filter: drop-shadow(0 0 3px rgba(0, 0, 0, 0.8));
            }
            
            custom-layout {
                display: contents !important; 
            }

            /* Prevent nested flex/grid elements (like sliders) from causing horizontal blowouts */
            .builder-wrapper {
                min-width: 0; 
                position: relative; /* Anchor for extended row lines */
            }

          /* Image hover buttons on custom-block (Light DOM Injection) */
            .img-hover-actions { 
                position: absolute; 
                top: 12px; 
                left: 12px; 
                display: none; 
                gap: 6px; 
                z-index: 9999; 
                /* THE FIX: Apply an inverse scale to counter-act the canvas scaling */
                transform: scale(var(--builder-inverse-scale)) !important;
                transform-origin: top left !important;
            }
            .builder-wrapper[data-type="custom-block"]:hover .img-hover-actions { 
                display: flex; 
            }
            .img-action-btn { 
                background: #232733 !important; 
                color: #8b97ab !important; 
                border: 1px solid #353b4d !important; 
                width: 36px !important; 
                height: 36px !important; 
                display: flex !important; 
                align-items: center !important; 
                justify-content: center !important; 
                border-radius: 6px !important; 
                cursor: pointer !important; 
                box-shadow: 0 2px 8px rgba(0,0,0,0.2) !important; 
                transition: all 0.2s !important; 
                padding: 0 !important; 
            }
            .img-action-btn svg { 
                width: 18px !important; 
                height: 18px !important; 
                fill: currentColor !important; 
                display: block !important;
            }
            .img-action-btn:hover { 
                background: #6b8cb3 !important; 
                color: #ffffff !important; 
                border-color: #6b8cb3 !important; 
            }
            .img-action-btn.danger-btn:hover {
                background: #ef4444 !important;
                border-color: #ef4444 !important;
            }

            /* Warning Badge for Template Overrides */
            .override-badge {
                position: absolute !important;
                top: 8px !important;
                right: 8px !important;
                width: 18px !important;
                height: 18px !important;
                color: #fbbf24 !important; 
                fill: currentColor !important;
                z-index: 9999 !important;
                pointer-events: none !important; 
                background: transparent !important;
                border: none !important;
                filter: drop-shadow(0 2px 4px rgba(0,0,0,0.6)) !important;
                /* THE FIX: Apply an inverse scale to counter-act the canvas scaling */
                transform: scale(var(--builder-inverse-scale)) !important;
                transform-origin: top right !important;
            }
            .override-badge svg {
                width: 100% !important;
                height: 100% !important;
                display: block !important;
            }

            /* Global Part Square Badge */
            .global-part-badge {
                position: absolute !important;
                bottom: 12px !important;
                left: 12px !important;
                width: 36px !important;
                height: 36px !important;
                background: #232733 !important;
                border: 1px solid #b45309 !important; /* Amber tint */
                border-radius: 6px !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                color: #f59e0b !important;
                fill: currentColor !important;
                z-index: 9999 !important;
                pointer-events: none !important;
                box-shadow: 0 2px 8px rgba(0,0,0,0.4) !important;
                transform: scale(var(--builder-inverse-scale)) !important;
                transform-origin: bottom left !important;
            }
                /* Prevent selecting elements inside a Global Part on the main canvas */
            .global-pointer-wrapper > * { pointer-events: none !important; }
            .global-part-badge svg {
                width: 18px !important;
                height: 18px !important;
                display: block !important;
            }

            /* THE FIX: The wrapper itself becomes the subgrid bridge! */
            .builder-wrapper[data-type="custom-layout"] {
                display: grid;
                grid-column: 1 / -1; 
                grid-template-columns: subgrid; 
                min-height: 100px;
                align-content: start;
                
                /* Diagonal Pattern for Layout boundaries */
                background: repeating-linear-gradient(
                    45deg,
                    rgba(129, 140, 248, 0.05),
                    rgba(129, 140, 248, 0.05) 10px,
                    transparent 10px,
                    transparent 20px
                );
                border: 1px dashed rgba(129, 140, 248, 0.4);
                border-radius: 8px;
            }

           .builder-wrapper.drop-target[data-type="custom-layout"] { 
                outline: 4px dashed #10b981 !important; 
                outline-offset: -4px; 
                background: rgba(16, 185, 129, 0.1); 
            }

            /* RECONNECT SECTION: The Web Component's internal section must also pass the grid down */
            custom-layout > section {
                display: grid;
                grid-column: 1 / -1;
                grid-template-columns: subgrid;
            }

            /* THE MISSING LINK: Reconnects the subgrid chain for blocks inside layouts! */
            custom-layout > section > div {
                display: grid;
                grid-column: 1 / -1; 
                grid-template-columns: subgrid;
            }

            #canvas custom-slider {
                display: flex !important;
                flex-direction: row !important;
                gap: 16px !important;
                overflow-x: auto !important;
                padding: 1rem !important;
                border: none !important;
                background: transparent !important;
                align-items: stretch !important;
            }
            
            #canvas custom-slider > .builder-wrapper {
                flex: 1 0 300px !important; 
                max-width: 100% !important;
            }
            
            .builder-wrapper.drop-target > custom-slider {
                outline: 4px dashed #10b981 !important; 
                outline-offset: -4px; 
                background: rgba(16, 185, 129, 0.1) !important; 
            }
        `;
        document.head.appendChild(style);


        this.setupDragAndDrop();
        this.setupCanvasSelection();
        this.setupResizeHandles();
        this.setupSidebarResizing();

        this.loadState();
        this.setupControls();
        this.fetchComponents();
        this.updateCanvasScale();
    }

    saveState(actionName = null) {
        // Prevent the Sandbox state from overwriting the main document!
        if (this.isolationMode && this.isolationMode.active && this.isolationMode.cachedState) {
            localStorage.setItem('rainwildsBuilderTree', JSON.stringify(this.isolationMode.cachedState));
        } else {
            localStorage.setItem('rainwildsBuilderTree', JSON.stringify(this.state));

            // Only push to history if an action name is provided AND we aren't isolated
            if (actionName && !this.isScrubbing) {
                this.pushHistory(actionName);
            }
        }
    }

    pushHistory(actionName) {
        // If we are back in time and make a change, truncate the "future"
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }

        // Deep clone state
        const stateSnapshot = JSON.parse(JSON.stringify(this.state));

        this.history.push({
            action: actionName,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            state: stateSnapshot
        });

        // Cap history at 50 steps to prevent massive memory usage
        if (this.history.length > 50) {
            this.history.shift();
        }

        this.historyIndex = this.history.length - 1;
        this.updateHistoryUI();
    }

    goToHistoryStep(index) {
        if (index < 0 || index >= this.history.length || index === this.historyIndex) return;
        this.historyIndex = index;

        // Restore state
        this.state = JSON.parse(JSON.stringify(this.history[index].state));
        this.selectedId = null;

        // Visual rebuild
        this.isScrubbing = true;
        this.hideInspector();
        this.rebuildCanvas();
        if (this.renderLayers) this.renderLayers();
        this.isScrubbing = false;

        this.updateHistoryUI();
    }

    updateHistoryUI() {
        const scrubber = this.shadowRoot.getElementById('history-scrubber');
        const list = this.shadowRoot.getElementById('history-list');

        if (!scrubber || !list) return;

        // Update Scrubber
        if (this.history.length > 1) {
            scrubber.disabled = false;
            scrubber.max = this.history.length - 1;
            scrubber.value = this.historyIndex;
        } else {
            scrubber.disabled = true;
        }

        // Update Photoshop-style Panel
        list.innerHTML = '';
        this.history.forEach((step, idx) => {
            const item = document.createElement('div');
            item.className = `history-item ${idx === this.historyIndex ? 'active' : ''} ${idx > this.historyIndex ? 'future' : ''}`;
            item.innerHTML = `<span>${step.action}</span> <span>${step.time}</span>`;
            item.addEventListener('click', () => this.goToHistoryStep(idx));
            // Prepend so newest is at the top (or append for chronological)
            list.prepend(item);
        });

        // --- NEW: Draw Scrubber Ticks ---
        const ticksContainer = this.shadowRoot.getElementById('scrubber-ticks');
        if (ticksContainer && scrubber.offsetWidth > 0) {
            ticksContainer.innerHTML = '';
            const max = this.history.length - 1;

            if (max > 0) {
                const thumbWidth = 14;
                const trackWidth = scrubber.offsetWidth - thumbWidth;

                // Density control: ensure at least 6px between ticks
                const stepPx = trackWidth / max;
                const stride = Math.max(1, Math.ceil(6 / stepPx));

                for (let i = 0; i <= max; i += stride) {
                    const percent = i / max;
                    // Formula maps exactly to the thumb center
                    const offset = (thumbWidth / 2) + (percent * trackWidth);

                    const tick = document.createElement('div');
                    tick.className = 'scrubber-tick';
                    tick.style.left = `${offset}px`;

                    // Highlight the active step
                    if (i === this.historyIndex) {
                        tick.style.background = 'var(--theme-accent)';
                        tick.style.zIndex = '5';
                    }

                    ticksContainer.appendChild(tick);
                }

                // Always draw the final tick if it got skipped by the stride
                if (max % stride !== 0) {
                    const tick = document.createElement('div');
                    tick.className = 'scrubber-tick';
                    tick.style.left = `${(thumbWidth / 2) + trackWidth}px`;
                    if (max === this.historyIndex) tick.style.background = 'var(--theme-accent)';
                    ticksContainer.appendChild(tick);
                }
            }
        }

    }

    startTerminalSequence(type) {
        // Technically accurate descriptions based on your build.js architecture
        this.terminalQueue = type === 'global' ? [
            "Initializing Global Sync Engine...",
            "Mapping master component dictionary...",
            "Scanning page manifests for dependencies...",
            "Spawning headless browser cluster...",
            "Unwrapping Shadow DOM components...",
            "Flattening CSS grid boundaries...",
            "Injecting updated Global Parts...",
            "Writing static HTML payloads...",
            "Optimizing asset delivery paths..."
        ] : [
            "Initializing Adaptive Build Engine...",
            "Syncing workspace assets to /dist...",
            "Compiling JSON component tree...",
            "Spawning headless browser...",
            "Injecting custom element definitions...",
            "Unwrapping Shadow DOM layers...",
            "Flattening layout grids...",
            "Parsing relative asset paths...",
            "Writing final HTML document..."
        ];

        this.terminalActive = true;
        this.terminalIndex = 0;

        // --- NEW: Save state so we survive a Live Server hot-reload! ---
        sessionStorage.setItem('activeTerminal', JSON.stringify({ type: type, timestamp: Date.now() }));

        // Set light to flashing amber
        this.shadowRoot.getElementById('status-light').className = 'status-light working';
        this.playNextTerminalMessage();
    }

    playNextTerminalMessage() {
        if (!this.terminalActive) return;

        const statusEl = this.shadowRoot.getElementById('doc-status');

        if (this.terminalIndex < this.terminalQueue.length) {
            statusEl.textContent = this.terminalQueue[this.terminalIndex];
            this.terminalIndex++;
            this.terminalTimer = setTimeout(() => this.playNextTerminalMessage(), 1500);
        } else {
            // Queue finished. If server is STILL working, show waiting message.
            if (this.shadowRoot.getElementById('status-light').classList.contains('working')) {
                statusEl.textContent = "Finalizing server operations...";
            } else {
                // Server finished, show the final success/fail state
                statusEl.textContent = this.terminalFinalMessage || "Ready";
                this.terminalActive = false; // <-- Mark animation as fully complete
            }
        }
    }

    finishTerminalSequence(success, finalMessage) {
        // --- NEW: Clear the tracking token ---
        sessionStorage.removeItem('activeTerminal');

        // Stop the flashing, switch to solid green or red
        const light = this.shadowRoot.getElementById('status-light');
        light.className = success ? 'status-light success' : 'status-light error';
        this.terminalFinalMessage = finalMessage;

        if (this.terminalIndex >= this.terminalQueue.length) {
            this.shadowRoot.getElementById('doc-status').textContent = finalMessage;
            this.terminalActive = false; // <-- Mark animation as fully complete
        }
    }

    resetStatusToIdle() {
        // Only reset if an animation isn't currently playing
        if (!this.terminalActive) {
            const light = this.shadowRoot.getElementById('status-light');
            if (light && (light.classList.contains('success') || light.classList.contains('error'))) {
                light.className = 'status-light idle';
                const slug = this.state.headData?.slug;
                const type = this.state.headData?.contentType || 'post';
                const statusEl = this.shadowRoot.getElementById('doc-status');
                if (statusEl) {
                    statusEl.textContent = slug ? `Editing ${type.toUpperCase()}: /${slug}` : 'Unsaved Document';
                }
            }
        }
    }

    updateCanvasScale() {
        if (!this.canvas) return;
        const workspace = document.getElementById('workspace');
        if (!workspace) return;

        const zoomIndicator = this.shadowRoot.getElementById('zoom-indicator');
        const safeWidth = workspace.clientWidth - 64; // Available width minus 32px padding on each side

        // Fetch the exact width for the active breakpoint from shared.js
        const bp = Shared.VIEWPORT_BREAKPOINTS.find(b => b.name === this.currentViewport);
        const targetWidthPx = bp ? bp.maxWidth : 1366; // Fallback
        const label = bp ? bp.name.charAt(0).toUpperCase() + bp.name.slice(1) : 'Viewport';

        // Lock the canvas to the physical target width
        this.canvas.style.width = `${targetWidthPx}px`;

        // Calculate if we need to scale down to fit the screen
        let scale = 1;
        if (targetWidthPx > safeWidth) {
            scale = safeWidth / targetWidthPx;
        }

        // Apply the scale and update UI
        this.canvas.style.transform = `scale(${scale})`;

        // THE FIX: Set a CSS variable with the inverse scale so overlay elements can remain uniform
        this.canvas.style.setProperty('--builder-inverse-scale', 1 / scale);

        // Remove the artificial height override so the canvas tightly hugs your content
        this.canvas.style.minHeight = '';

        if (zoomIndicator) zoomIndicator.textContent = `${label} (${targetWidthPx}px) — Zoom: ${Math.round(scale * 100)}%`;
    }

    async loadGlobalTemplates() {
        try {
            const response = await fetch('http://localhost:3000/api/templates');
            if (response.ok) {
                this.state.presets = await response.json();
                this.renderPresets();
            }
        } catch (err) {
            console.error("Failed to load global templates", err);
            if (!this.state.presets) this.state.presets = {};
        }
    }

    async saveGlobalTemplates() {
        try {
            await fetch('http://localhost:3000/api/templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.state.presets)
            });
        } catch (err) {
            console.error("Failed to save global templates", err);
        }
    }

    async loadGlobalParts() {
        try {
            const response = await fetch('http://localhost:3000/api/global-parts');
            if (response.ok) {
                this.globalParts = await response.json();
            }
        } catch (err) {
            console.error("Failed to load global parts", err);
            if (!this.globalParts) this.globalParts = {};
        }
    }

    async saveGlobalParts() {
        try {
            await fetch('http://localhost:3000/api/global-parts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.globalParts)
            });
        } catch (err) {
            console.error("Failed to save global parts", err);
        }
    }

    async enterIsolationMode(partId) {
        // 0. Trigger Fade to Black
        const overlay = this.shadowRoot.getElementById('transition-overlay');
        overlay.classList.add('active');
        await new Promise(r => setTimeout(r, 400)); // 20% faster (matches 0.4s CSS)

        // 1. Cache the current page state AND history so we don't lose the user's work
        this.isolationMode.cachedState = JSON.parse(JSON.stringify(this.state));
        this.isolationMode.cachedHistory = JSON.parse(JSON.stringify(this.history));
        this.isolationMode.cachedHistoryIndex = this.historyIndex;

        this.isolationMode.partId = partId;
        this.isolationMode.active = true;

        // 2. Load the Global Part's flat dictionary as the ONLY thing in the state
        const masterPart = this.globalParts[partId];
        this.state = {
            roots: [masterPart.data.rootId],
            items: JSON.parse(JSON.stringify(masterPart.data.items)),
            headData: this.state.headData
        };

        // 3. Shift the UI to Amber/Gold
        this.classList.add('isolation-mode');
        this.shadowRoot.getElementById('doc-status').innerHTML = `<span style="color: #fbbf24;">⚡ ISOLATION MODE: Editing Global Part '${masterPart.name}'</span>`;

        // 4. Update Header Buttons (Hide publish, add Exit button)
        const topActions = this.shadowRoot.querySelector('.top-actions');
        topActions.style.display = 'none';

        if (!this.shadowRoot.getElementById('isolation-actions')) {
            const isoActions = document.createElement('div');
            isoActions.id = 'isolation-actions';
            isoActions.className = 'top-actions';
            isoActions.innerHTML = `
                <button id="btn-exit-isolation" class="btn-secondary" style="color: #ef4444; border-color: #7f1d1d;">Exit Isolation Mode</button>
                <button id="btn-save-isolation" class="btn-primary" style="background: #f59e0b; border-color: #b45309; color: #fff;">Save Part</button>
                <button id="btn-sync-isolation" class="btn-primary" style="background: #10b981; border-color: #059669; color: #fff;">Save & Sync Site</button>
            `;
            this.shadowRoot.getElementById('top-bar').appendChild(isoActions);

            this.shadowRoot.getElementById('btn-exit-isolation').addEventListener('click', () => this.exitIsolationMode());

            // Standard Save (Just updates JSON, doesn't build)
            this.shadowRoot.getElementById('btn-save-isolation').addEventListener('click', () => {
                const rootId = this.state.roots[0];
                this.globalParts[this.isolationMode.partId].data = { rootId: rootId, items: JSON.parse(JSON.stringify(this.state.items)) };
                this.saveGlobalParts();
                alert(`Global Part '${masterPart.name}' saved! Click 'Save & Sync Site' when ready to go live.`);
            });

            // Save & Sync (Updates JSON and triggers Puppeteer to rebuild everything)
            this.shadowRoot.getElementById('btn-sync-isolation').addEventListener('click', async () => {
                const syncBtn = this.shadowRoot.getElementById('btn-sync-isolation');
                syncBtn.textContent = 'Syncing...';
                syncBtn.disabled = true;

                // Start the animated terminal log
                this.startTerminalSequence('global');

                // 1. Save data first
                const rootId = this.state.roots[0];
                this.globalParts[this.isolationMode.partId].data = { rootId: rootId, items: JSON.parse(JSON.stringify(this.state.items)) };
                await this.saveGlobalParts();

                // 2. Trigger Global Build
                try {
                    const response = await fetch('http://localhost:3000/api/publish', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ globalSync: true })
                    });

                    if (response.ok) {
                        syncBtn.textContent = '✅ Synced!';
                        this.finishTerminalSequence(true, "Global site sync complete.");
                    } else {
                        throw new Error('Build failed');
                    }
                } catch (err) {
                    syncBtn.textContent = '❌ Error';
                    syncBtn.style.background = '#ef4444';
                    this.finishTerminalSequence(false, "Global sync failed.");
                } finally {
                    setTimeout(() => {
                        syncBtn.textContent = 'Save & Sync Site';
                        syncBtn.style.background = '#10b981';
                        syncBtn.disabled = false;
                        this.shadowRoot.getElementById('status-light').className = 'status-light idle';
                    }, 4000);
                }
            });
        } else {
            this.shadowRoot.getElementById('isolation-actions').style.display = 'flex';
        }

        // 5. Rebuild
        this.selectedId = this.state.roots[0];
        this.rebuildCanvas();
        this.populateInspector();

        // --- NEW: Start a fresh history timeline for this specific Global Part ---
        this.history = [];
        this.historyIndex = -1;
        this.pushHistory(`Opened '${masterPart.name}'`);

        // 6. Reveal new UI
        overlay.classList.remove('active');
    }

    async exitIsolationMode() {
        if (!this.isolationMode.active) return;

        // 0. Trigger Fade to Black
        const overlay = this.shadowRoot.getElementById('transition-overlay');
        overlay.classList.add('active');
        await new Promise(r => setTimeout(r, 640)); // 20% faster (matches new CSS pacing)

        // Restore the cached page state AND history timeline
        this.state = this.isolationMode.cachedState;
        this.history = this.isolationMode.cachedHistory;
        this.historyIndex = this.isolationMode.cachedHistoryIndex;

        // Reset isolation tracking
        this.isolationMode = { active: false, partId: null, cachedState: null, cachedHistory: null, cachedHistoryIndex: -1 };
        this.classList.remove('isolation-mode');

        // Restore UI
        this.shadowRoot.querySelector('.top-actions').style.display = 'flex';
        this.shadowRoot.getElementById('isolation-actions').style.display = 'none';

        const slug = this.state.headData?.slug || 'Unsaved Document';
        this.shadowRoot.getElementById('doc-status').textContent = `Editing: /${slug}`;

        // Rebuild the normal page & restore the history panel UI
        this.selectedId = null;
        this.hideInspector();
        this.rebuildCanvas();
        this.updateHistoryUI(); // <-- Force the scrubber and panel to reflect the restored timeline

        // Reveal new UI
        overlay.classList.remove('active');
    }

    async loadState() {
        const saved = localStorage.getItem('rainwildsBuilderTree');
        if (saved) {
            this.state = JSON.parse(saved);
        }

        if (!this.state.presets) this.state.presets = {};
        if (!this.globalParts) this.globalParts = {};

        // --- NEW: Restore the doc status text so it doesn't default to "Unsaved Document" ---
        const slug = this.state.headData?.slug;
        const type = this.state.headData?.contentType || 'post';
        if (slug) {
            this.shadowRoot.getElementById('doc-status').textContent = `Editing ${type.toUpperCase()}: /${slug}`;
        }

        // Wait for global data to load BEFORE rebuilding the canvas
        await Promise.all([
            this.loadGlobalTemplates(),
            this.loadGlobalParts()
        ]);

        this.rebuildCanvas();
        this.renderGlobalPartsList(); // Render sidebar list on boot

        // --- NEW: Resume Animation if Live Server Reloaded the Page ---
        const activeTerminal = sessionStorage.getItem('activeTerminal');
        if (activeTerminal) {
            const data = JSON.parse(activeTerminal);
            // If the animation started less than 10 seconds ago, resume it!
            if (Date.now() - data.timestamp < 10000) {
                this.startTerminalSequence(data.type);
                this.terminalIndex = 3; // Fast-forward past the initial steps

                // Pre-load the success state so it glows green and finishes gracefully
                const finalMsg = data.type === 'global' ? "Global site sync complete." : `Published: /${slug}.html`;
                this.finishTerminalSequence(true, finalMsg);
            } else {
                sessionStorage.removeItem('activeTerminal');
            }
        }

        // --- NEW: Ensure Meta fields match loaded state ---
        const contentTypeSelect = this.shadowRoot.getElementById('meta-contentType');
        if (contentTypeSelect) {
            contentTypeSelect.dispatchEvent(new Event('change'));
        }

        // --- NEW: Take initial history snapshot ---
        if (this.history.length === 0) {
            this.pushHistory('Document Opened');
        }


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
                this.addResizeHandles(el); // <-- NEW CENTRALIZED CALL
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
        this.resetStatusToIdle(); // <-- Clear the green light if the user edits the canvas
    }


    async fetchComponents() {
        try {
            const response = await fetch('http://localhost:3000/api/list-components');
            if (!response.ok) throw new Error('Server unreachable');

            const tags = await response.json();
            const container = this.shadowRoot.getElementById('tab-elements');

            if (tags.length === 0) {
                container.innerHTML = '<p style="font-size:0.7rem; padding:10px;">No .js components found.</p>';
                return;
            }

            container.innerHTML = '';
            tags.forEach(tag => {
                // 1. DYNAMICALLY LOAD THE SCRIPT IF IT DOESN'T EXIST
                if (!customElements.get(tag)) {
                    const script = document.createElement('script');
                    script.type = 'module';
                    script.src = `./js/components/${tag}.js`;
                    document.head.appendChild(script);
                }

                // 2. Build the sidebar UI (Grouped Component & Nested Templates)
                const groupDiv = document.createElement('div');
                groupDiv.className = 'component-group';
                groupDiv.dataset.type = tag;
                groupDiv.style.marginBottom = '8px';

                const mainBtn = document.createElement('div');
                mainBtn.className = 'component-item';
                mainBtn.setAttribute('draggable', 'true');
                mainBtn.dataset.type = tag;
                mainBtn.style.position = 'relative';
                mainBtn.style.marginBottom = '0';
                mainBtn.title = "Double-click to view templates";

                // Custom naming override for 'nav'
                let name = tag.replace('custom-', '').split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
                if (tag === 'custom-nav') name = 'Navigation';

                let icon = '';
                const svgStyle = 'style="width:14px; height:14px; fill:currentColor;"';

                if (tag.includes('layout')) {
                    icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" ${svgStyle}><path d="M320 64l0 384 96 0 0-384-96 0zm-32 0l-128 0 0 384 128 0 0-384zM128 448l0-384-96 0 0 384 96 0zM0 32l448 0 0 448-448 0 0-448z"/></svg>`;
                } else if (tag.includes('header')) {
                    icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" ${svgStyle}><path d="M0 32l448 0 0 32-448 0 0-32zM8 168l48 0 0 48-48 0 0-48zm432 0l0 48-48 0 0-48 48 0zM8 296l48 0 0 48-48 0 0-48zm432 0l0 48-48 0 0-48 48 0zM8 424l48 0 0 48-48 0 0-48zm432 0l0 48-48 0 0-48 48 0zm-304 0l48 0 0 48-48 0 0-48zm176 0l0 48-48 0 0-48 48 0z"/></svg>`;
                } else if (tag.includes('slider')) {
                    icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" ${svgStyle}><path d="M240 32l0 448 208 0 0-448-208 0zM208 0l272 0 0 512-272 0 0-512zM104 48l32 0 0 416-32 0 0-416zM0 96l32 0 0 320-32 0 0-320z"/></svg>`;
                } else if (tag.includes('logo')) {
                    icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" ${svgStyle}><path d="M480 256a224 224 0 1 0 -448 0 224 224 0 1 0 448 0zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z"/></svg>`;
                } else if (tag.includes('nav')) {
                    icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" ${svgStyle}><path d="M0 64l448 0 0 32-448 0 0-32zM0 240l448 0 0 32-448 0 0-32zM448 416l0 32-448 0 0-32 448 0z"/></svg>`;
                } else if (tag.includes('filter')) {
                    icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" ${svgStyle}><path d="M352 272l208-208-544 0 208 208 0 128 128 128 0-256zM320 450.7l-64-64 0-128-9.4-9.4-153.4-153.4 389.5 0-153.4 153.4-9.4 9.4 0 192z"/></svg>`;
                } else if (tag.includes('block')) {
                    icon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" ${svgStyle}><path d="M416 64l0 384-384 0 0-384 384 0zM32 32l-32 0 0 448 448 0 0-448-416 0z"/></svg>`;
                } else {
                    icon = '◻';
                }
                // Add the template indicator icon (hidden by default)
                mainBtn.innerHTML = `
                    <span class="layer-icon">${icon}</span> ${name}
                    <span class="template-indicator" style="display:none; position:absolute; top: 50%; right: 10px; transform: translateY(-50%); width: 14px; height: 14px; fill: #fbbf24;" title="Templates Available">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M169 409l119-119 119 119-119 119-119-119zM135 375L16 256 135 137 254.1 256 135 375zM169 103l119-119 119 119-119 119-119-119zM441 137l119 119-119 119-119-119 119-119z"/></svg>
                    </span>
                `;

                mainBtn.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('text/plain', 'new:' + tag);
                    this.draggedLibraryType = tag;
                });

                // The nested container for templates
                const templateList = document.createElement('div');
                templateList.className = 'template-list';
                templateList.style.display = 'none';
                templateList.style.flexDirection = 'column';
                templateList.style.gap = '4px';
                templateList.style.marginTop = '4px';
                templateList.style.paddingLeft = '12px';
                templateList.style.borderLeft = '1px solid #3f3f46';
                templateList.style.marginLeft = '6px';

                // Double click to toggle templates
                mainBtn.addEventListener('dblclick', () => {
                    const isHidden = templateList.style.display === 'none';
                    templateList.style.display = isHidden ? 'flex' : 'none';
                });

                groupDiv.appendChild(mainBtn);
                groupDiv.appendChild(templateList);
                container.appendChild(groupDiv);
            });

            // --- FIX: RE-RENDER PRESETS & GLOBALS AFTER WIPING THE TAB ---
            this.renderPresets();
            this.renderGlobalPartsList();

        } catch (err) {
            this.shadowRoot.getElementById('tab-elements').innerHTML = '<p style="color:#ef4444; font-size:0.7rem;">API Error</p>';
        }
    }

    setupResizeHandles() {
        this.isResizing = false; // Make it a class property
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

                this.isResizing = true;
                resizeDir = e.target.dataset.dir;
                currentWrapper = e.target.closest('.builder-wrapper');

                const targetEl = currentWrapper.firstElementChild;
                const container = currentWrapper.closest('custom-layout > section') || this.canvas;
                containerRect = container.getBoundingClientRect();

                const elRect = targetEl.getBoundingClientRect();

                startLine = getLineFromX(elRect.left);
                endLine = getLineFromX(elRect.right);

                document.body.style.cursor = 'ew-resize';
            }
        });

        window.addEventListener('mousemove', (e) => {
            if (!this.isResizing || !currentWrapper) return;
            e.preventDefault();

            let newLine = getLineFromX(e.clientX);
            const vpSuffix = this.currentViewport === 'mobile' ? '' : `-${this.currentViewport}`;
            const targetEl = currentWrapper.firstElementChild;

            if (resizeDir === 'left') {
                newLine = Math.min(newLine, endLine - 1);
                startLine = newLine;
                targetEl.style.setProperty(`--column-start${vpSuffix}`, newLine);
                currentWrapper.style.setProperty(`--column-start${vpSuffix}`, newLine); // Sync to wrapper
            } else {
                newLine = Math.max(newLine, startLine + 1);
                endLine = newLine;
                targetEl.style.setProperty(`--column-end${vpSuffix}`, newLine);
                currentWrapper.style.setProperty(`--column-end${vpSuffix}`, newLine); // Sync to wrapper
            }
        });

        window.addEventListener('mouseup', (e) => {
            if (this.isResizing) {
                this.isResizing = false;
                document.body.style.cursor = '';

                if (currentWrapper) {
                    const vpSuffix = this.currentViewport === 'mobile' ? '' : `-${this.currentViewport}`;
                    const compData = this.state.items[currentWrapper.dataset.id];

                    // FIX: Use localAttrs instead of attrs!
                    if (!compData.localAttrs) compData.localAttrs = {};
                    compData.localAttrs[`column-start${vpSuffix}`] = startLine.toString();
                    compData.localAttrs[`column-end${vpSuffix}`] = endLine.toString();
                }

                this.saveState('Resized layout grid'); // <-- Add Snapshot
                this.rebuildCanvas();
                this.populateInspector();
            }
        });
    }

    addResizeHandles(wrapperElement) {
        if (!wrapperElement || wrapperElement.dataset.type === 'custom-layout') return;

        const targetEl = wrapperElement.firstElementChild;
        if (!targetEl) return;

        targetEl.querySelectorAll('.resize-handle').forEach(h => h.remove());

        const leftH = document.createElement('div');
        leftH.className = 'resize-handle handle-left';
        leftH.dataset.dir = 'left';

        const rightH = document.createElement('div');
        rightH.className = 'resize-handle handle-right';
        rightH.dataset.dir = 'right';

        targetEl.appendChild(leftH);
        targetEl.appendChild(rightH);
    }

    setupSidebarResizing() {
        const leftResizer = this.shadowRoot.getElementById('left-resizer');
        const rightResizer = this.shadowRoot.getElementById('right-resizer');

        // Load Persistent UI Settings
        const savedSettings = localStorage.getItem('fable_ui_settings');
        if (savedSettings) {
            try {
                const settings = JSON.parse(savedSettings);
                if (settings.sidebarWidth) {
                    this.style.setProperty('--left-width', settings.sidebarWidth);
                    this.style.setProperty('--right-width', settings.sidebarWidth);
                    document.documentElement.style.setProperty('--builder-left', settings.sidebarWidth);
                    document.documentElement.style.setProperty('--builder-right', settings.sidebarWidth);
                }
            } catch (e) { }
        }

        let isResizing = false;

        const startResize = (e) => {
            isResizing = true;
            e.target.classList.add('active');
            document.body.style.cursor = 'col-resize';
        };

        leftResizer.addEventListener('mousedown', startResize);
        rightResizer.addEventListener('mousedown', startResize);

        window.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            e.preventDefault();

            // Calculate distance based on which half of the screen the mouse is on
            let newWidth = e.clientX < window.innerWidth / 2 ? e.clientX : window.innerWidth - e.clientX;

            // Enforce Min/Max (240px to 450px)
            newWidth = Math.max(240, Math.min(newWidth, 450));

            // Apply concurrently to BOTH sidebars
            const widthStr = `${newWidth}px`;
            this.style.setProperty('--left-width', widthStr);
            this.style.setProperty('--right-width', widthStr);
            document.documentElement.style.setProperty('--builder-left', widthStr);
            document.documentElement.style.setProperty('--builder-right', widthStr);

            this.updateCanvasScale();
        });

        window.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                leftResizer.classList.remove('active');
                rightResizer.classList.remove('active');
                document.body.style.cursor = '';

                // Save preference
                const currentWidth = this.style.getPropertyValue('--left-width');
                localStorage.setItem('fable_ui_settings', JSON.stringify({ sidebarWidth: currentWidth }));
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
                    this.addResizeHandles(targetEl); // <-- NEW CENTRALIZED CALL
                }

                this.populateInspector();
                this.renderLayers(); // Re-render to highlight the active layer
            });
        });
    }

    // Accept an optional dataSource (defaults to standard canvas state)
    renderNode(id, dataSource = this.state.items) {
        let nodeData = dataSource[id];
        if (!nodeData) return null;

        let targetData = nodeData;
        let targetSource = dataSource;
        let isPointer = false;

        // If this is a Global Part pointer, swap the data source to the Master component!
        if (nodeData.globalPartId) {
            isPointer = true;
            const master = this.globalParts[nodeData.globalPartId];
            if (master && master.data && master.data.items) {
                targetSource = master.data.items;
                targetData = targetSource[master.data.rootId];
            } else {
                const div = document.createElement('div');
                div.className = 'builder-wrapper';
                div.dataset.id = id;
                div.innerHTML = `<div style="padding: 10px; background: #fee2e2; color: #ef4444; border: 1px dashed #ef4444;">Missing Global Part</div>`;
                return div;
            }
        }

        const wrapper = document.createElement('div');
        wrapper.className = 'builder-wrapper';
        // CRITICAL: Always use the pointer's actual ID so selection works
        wrapper.dataset.id = nodeData.id;
        wrapper.dataset.type = targetData.type;
        const ElementClass = customElements.get(targetData.type); wrapper.dataset.isContainer = (ElementClass && ElementClass.builderConfig?.isContainer) ? "true" : "false";
        wrapper.setAttribute('draggable', 'true');

        if (nodeData.parentId && this.state.items[nodeData.parentId]?.type === 'custom-slider') {
            wrapper.classList.add('block', 'is-slide');
        }

        // --- NEW MERGING LOGIC STARTS HERE ---
        let resolvedAttrs = {};
        // Use targetData (the master content) for attributes
        if (targetData.presetId && this.state.presets && this.state.presets[targetData.presetId]) {
            resolvedAttrs = { ...this.state.presets[targetData.presetId].baseAttrs };
        }
        resolvedAttrs = { ...resolvedAttrs, ...(targetData.localAttrs || targetData.attrs || {}) };

        const component = document.createElement(targetData.type);

        // Turn the wrapper into an active grid item
        wrapper.classList.add('grid-placement-item');

        // Apply placement data from the pointer (nodeData), and styling data from the master (targetData)
        for (const [key, value] of Object.entries(resolvedAttrs)) {
            component.setAttribute(key, value);
        }

        // Ensure the pointer retains its placement on the layout grid!
        for (const [key, value] of Object.entries(nodeData.localAttrs || {})) {
            if (Shared.PLACEMENT_ATTRS.some(base => key.startsWith(base)) || key === 'column-span') {
                wrapper.setAttribute(key, value);
                wrapper.style.setProperty(`--${key}`, value);
            }
        }

        const hasOverrides = targetData.presetId && targetData.localAttrs &&
            Object.keys(targetData.localAttrs).filter(key => !Shared.PLACEMENT_ATTRS.some(base => key.startsWith(base))).length > 0;

        if (hasOverrides) {
            const badge = document.createElement('div');
            badge.className = 'override-badge';
            badge.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M560 480L16 480 288-16 560 480zM260 356l0 56 56 0 0-56-56 0zm-4-196l12.8 160 38.4 0 12.8-160-64 0z"/></svg>';
            badge.title = 'This instance has local overrides';
            wrapper.appendChild(badge);
        }

        // --- NEW: VISUAL MEDIA MANAGER BUTTONS ---
        // Hide these buttons if we are looking at a locked Global Part pointer!
        if (targetData.type === 'custom-block' && !isPointer) {
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'img-hover-actions';

            const bgBtn = document.createElement('button');
            bgBtn.className = 'img-action-btn';
            bgBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M416 64l0 384-384 0 0-384 384 0zM32 32l-32 0 0 448 448 0 0-448-416 0zM143.3 267.8L64 400 384 400 365.7 368 273.9 207.3 256 176c-29 45.1-54.8 85.2-60.3 93.8-15.7-13.1-32.3-26.9-35.7-29.8l-16.7 27.8zm24.9 20.7c1.2 1 12.8 10.7 34.8 29 11-17.2 28.1-43.8 51.3-79.9l74.5 130.3-208.3 0 47.7-79.5zM144 160a16 16 0 1 1 -32 0 16 16 0 1 1 32 0zm-16-48a48 48 0 1 0 0 96 48 48 0 1 0 0-96z"/></svg>';
            bgBtn.title = "Set Background Image";
            bgBtn.addEventListener('click', (e) => { e.stopPropagation(); this.openMediaManager(id, 'img-background-src'); });

            const primaryBtn = document.createElement('button');
            primaryBtn.className = 'img-action-btn';
            primaryBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M448 32l-448 0 0 448 448 0 0-448zM128 112a48 48 0 1 1 0 96 48 48 0 1 1 0-96zm16 160l46.1 69.1 81.9-133.1 128 208-352 0 96-144z"/></svg>';
            primaryBtn.title = "Set Primary Image";
            primaryBtn.addEventListener('click', (e) => { e.stopPropagation(); this.openMediaManager(id, 'img-primary-src'); });

            const removeBtn = document.createElement('button');
            removeBtn.className = 'img-action-btn danger-btn';
            removeBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M235.6 38.6l81.4 112 7.3 10.1-8 9.6-152 182.4c58.7 80.7 89.5 123.2 92.6 127.3L0 480 0 32 230.7 32 235.6 38.6zM448 480l-131.8 0-23.3-32 123.1 0 0-384-102.6 0-23.3-32 157.9 0 0 448zM32 448l162 0-62.9-86.6-7.3-10.1 8-9.6 152-182.4-69.3-95.3-182.4 0 0 384zm352-48l-126 0-23.3-32 94.1 0-46.8-81.8 21.9-26.3 80 140.1zM128 208a48 48 0 1 1 0-96 48 48 0 1 1 0 96zm0-64a16 16 0 1 0 0 32 16 16 0 1 0 0-32z"/></svg>';
            removeBtn.title = "Remove All Images";
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (targetData.localAttrs) {
                    ['img-background-src', 'img-primary-src'].forEach(attr => {
                        if (targetData.presetId) { targetData.localAttrs[attr] = ""; component.setAttribute(attr, ""); }
                        else { delete targetData.localAttrs[attr]; component.removeAttribute(attr); }
                    });
                    this.saveState(); this.rebuildCanvas(); if (this.selectedId === id) this.populateInspector();
                }
            });

            actionsDiv.appendChild(bgBtn); actionsDiv.appendChild(primaryBtn); actionsDiv.appendChild(removeBtn);
            wrapper.appendChild(actionsDiv);
        }

        // Pass the targetSource down recursively!
        if (targetData.children && targetData.children.length > 0) {
            targetData.children.forEach(childId => {
                const childEl = this.renderNode(childId, targetSource);
                if (childEl) component.appendChild(childEl);
            });
        }

        if (isPointer) {
            wrapper.classList.add('global-pointer-wrapper'); // <-- Blocks inner clicks!
            const globalBadge = document.createElement('div');
            globalBadge.className = 'global-part-badge';
            globalBadge.title = 'Global Part';
            globalBadge.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M55.7 199.7l40.3 40.3 48 0 48 48 0 64 32 32 0 64 64 0 0-48 64-64 0-80-128 0-32-32 0-32 80 0 0-32-32-32 0-16 32-32 0-31.4c-5.3-.4-10.6-.6-16-.6-95.4 0-175.7 64.2-200.3 151.7zM464 256c0-36.9-9.6-71.5-26.4-101.6l-37.6 37.6 0 80 63.4 0c.4-5.3 .6-10.6 .6-16zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z"/></svg>';
            wrapper.appendChild(globalBadge);
        }

        wrapper.appendChild(component);

        wrapper.addEventListener('dragstart', (e) => {
            // THE FIX: Explicitly abort the HTML5 drag if we are resizing!
            if (this.isResizing) {
                e.preventDefault();
                return;
            }

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

    renderPresets() {
        // Find or create a container for the starred templates
        let starredContainer = this.shadowRoot.getElementById('starred-templates-list');

        if (!starredContainer) {
            const tabElements = this.shadowRoot.getElementById('tab-elements');

            const divider = document.createElement('h4');
            divider.textContent = 'Starred Templates';
            divider.style.cssText = 'color: #f59e0b; font-size: 0.75rem; margin-top: 15px; margin-bottom: 8px; border-bottom: 1px solid #27272a; padding-bottom: 4px; font-weight: 600;';

            starredContainer = document.createElement('div');
            starredContainer.id = 'starred-templates-list';

            tabElements.appendChild(divider);
            tabElements.appendChild(starredContainer);
        }

        // 1. Clear existing starred items and nested template lists
        starredContainer.innerHTML = '';
        this.shadowRoot.querySelectorAll('.template-list').forEach(list => list.innerHTML = '');
        this.shadowRoot.querySelectorAll('.template-indicator').forEach(ind => ind.style.display = 'none');

        if (!this.state.presets || Object.keys(this.state.presets).length === 0) {
            starredContainer.innerHTML = '<p style="font-size:0.7rem; padding:10px; color: #71717a;">No templates saved yet.</p>';
            return;
        }

        let starredCount = 0;

        // 2. Build the template items
        Object.values(this.state.presets).forEach(preset => {
            const isStarred = preset.isStarred === true;
            const starColor = isStarred ? '#f59e0b' : '#71717a';

            // Function to generate the preset drag item
            // NEW: Added useParentIcon parameter
            const createPresetNode = (useParentIcon = false) => {
                const presetDiv = document.createElement('div');
                presetDiv.className = 'component-item';
                presetDiv.setAttribute('draggable', 'true');
                presetDiv.style.padding = '8px 10px';
                presetDiv.style.fontSize = '0.75rem';
                presetDiv.style.marginBottom = '0';
                presetDiv.style.display = 'flex';
                presetDiv.style.justifyContent = 'space-between';
                presetDiv.style.alignItems = 'center';

                // Determine icon based on useParentIcon (for Starred list) vs Arrow (for Nested list)
                let iconSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M32.1 80l0-16-32 0 0 208 457.4 0-116.7 116.7-11.3 11.3 22.6 22.6 11.3-11.3 144-144 11.3-11.3-11.3-11.3-144-144-11.3-11.3-22.6 22.6 11.3 11.3 116.7 116.7-425.4 0 0-160z"/></svg>`;

                if (useParentIcon) {
                    const tag = preset.type;
                    if (tag.includes('layout')) iconSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M320 64l0 384 96 0 0-384-96 0zm-32 0l-128 0 0 384 128 0 0-384zM128 448l0-384-96 0 0 384 96 0zM0 32l448 0 0 448-448 0 0-448z"/></svg>`;
                    else if (tag.includes('header')) iconSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M0 32l448 0 0 32-448 0 0-32zM8 168l48 0 0 48-48 0 0-48zm432 0l0 48-48 0 0-48 48 0zM8 296l48 0 0 48-48 0 0-48zm432 0l0 48-48 0 0-48 48 0zM8 424l48 0 0 48-48 0 0-48zm432 0l0 48-48 0 0-48 48 0zm-304 0l48 0 0 48-48 0 0-48zm176 0l0 48-48 0 0-48 48 0z"/></svg>`;
                    else if (tag.includes('slider')) iconSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M240 32l0 448 208 0 0-448-208 0zM208 0l272 0 0 512-272 0 0-512zM104 48l32 0 0 416-32 0 0-416zM0 96l32 0 0 320-32 0 0-320z"/></svg>`;
                    else if (tag.includes('logo')) iconSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M480 256a224 224 0 1 0 -448 0 224 224 0 1 0 448 0zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z"/></svg>`;
                    else if (tag.includes('nav')) iconSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M0 64l448 0 0 32-448 0 0-32zM0 240l448 0 0 32-448 0 0-32zM448 416l0 32-448 0 0-32 448 0z"/></svg>`;
                    else if (tag.includes('filter')) iconSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M352 272l208-208-544 0 208 208 0 128 128 128 0-256zM320 450.7l-64-64 0-128-9.4-9.4-153.4-153.4 389.5 0-153.4 153.4-9.4 9.4 0 192z"/></svg>`;
                    else if (tag.includes('block')) iconSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M416 64l0 384-384 0 0-384 384 0zM32 32l-32 0 0 448 448 0 0-448-416 0z"/></svg>`;
                }

                presetDiv.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 6px; overflow: hidden;">
                        <span class="layer-icon" style="width: 12px; height: 12px; fill: currentColor; display: flex;">
                            ${iconSVG}
                        </span> 
                        <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${preset.name}">${preset.name}</span>
                    </div>
                    <button class="star-btn" style="background: none; border: none; padding: 0; cursor: pointer; color: ${starColor}; width: 14px; height: 14px; fill: currentColor; display: flex; align-items: center;" title="Toggle Star">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512"><path d="M311.3 32.7L288.4-39.2C277.2-3.8 254 69.2 218.8 179.9l-216.3 0c25.9 20.1 84.6 65.8 176.1 136.9-35.3 111-58.8 184.9-70.5 221.6 31-24.1 91.1-70.9 180.4-140.3 89.3 69.4 149.4 116.2 180.4 140.3-11.7-36.8-35.2-110.7-70.5-221.6 91.5-71.2 150.2-116.8 176.1-136.9l-216.3 0-46.8-147.1z"/></svg>
                    </button>
                `;

                // Star toggle event
                presetDiv.querySelector('.star-btn').addEventListener('click', (e) => {
                    e.stopPropagation();
                    preset.isStarred = !preset.isStarred;
                    this.saveGlobalTemplates();
                    this.saveState();
                    this.renderPresets();
                });

                // Drag events
                presetDiv.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('text/plain', `preset:${preset.type}:${preset.id}`);
                    this.draggedLibraryType = preset.type;
                });

                presetDiv.addEventListener('dragend', () => {
                    this.draggedLibraryType = null;
                    if (this.placeholder) { this.placeholder.remove(); this.placeholder = null; }
                });

                return presetDiv;
            };

            // A) Append to nested component list
            const groupDiv = this.shadowRoot.querySelector(`.component-group[data-type="${preset.type}"]`);
            if (groupDiv) {
                const list = groupDiv.querySelector('.template-list');
                list.appendChild(createPresetNode(false)); // Use Arrow Icon (false)
                // Reveal the ❖ template indicator icon on the main button
                groupDiv.querySelector('.template-indicator').style.display = 'block';
            }

            // B) Append to Starred list if applicable
            if (isStarred) {
                starredCount++;
                starredContainer.appendChild(createPresetNode(true)); // Use Parent Icon (true)
            }
        });

        if (starredCount === 0) {
            starredContainer.innerHTML = '<p style="font-size:0.7rem; padding:10px; color: #71717a;">No starred templates.</p>';
        }
    }

    renderGlobalPartsList() {
        let globalsContainer = this.shadowRoot.getElementById('global-parts-list');

        if (!globalsContainer) {
            const tabElements = this.shadowRoot.getElementById('tab-elements');
            const divider = document.createElement('h4');
            divider.textContent = 'Global Parts';
            divider.style.cssText = 'color: #f59e0b; font-size: 0.75rem; margin-top: 15px; margin-bottom: 8px; border-bottom: 1px solid #27272a; padding-bottom: 4px; font-weight: 600;';

            globalsContainer = document.createElement('div');
            globalsContainer.id = 'global-parts-list';

            tabElements.appendChild(divider);
            tabElements.appendChild(globalsContainer);
        }

        globalsContainer.innerHTML = '';
        const parts = Object.values(this.globalParts);

        if (parts.length === 0) {
            globalsContainer.innerHTML = '<p style="font-size:0.7rem; padding:10px; color: #71717a;">No global parts saved yet.</p>';
            return;
        }

        parts.forEach(part => {
            const partDiv = document.createElement('div');
            partDiv.className = 'component-item';
            partDiv.setAttribute('draggable', 'true');
            // Give it an amber tint to differentiate it from regular components
            partDiv.style.cssText = 'padding: 8px 10px; font-size: 0.75rem; margin-bottom: 4px; display: flex; align-items: center; gap: 8px; border-color: rgba(245, 158, 11, 0.4); background: rgba(245, 158, 11, 0.05);';

            const iconSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M55.7 199.7l40.3 40.3 48 0 48 48 0 64 32 32 0 64 64 0 0-48 64-64 0-80-128 0-32-32 0-32 80 0 0-32-32-32 0-16 32-32 0-31.4c-5.3-.4-10.6-.6-16-.6-95.4 0-175.7 64.2-200.3 151.7zM464 256c0-36.9-9.6-71.5-26.4-101.6l-37.6 37.6 0 80 63.4 0c.4-5.3 .6-10.6 .6-16zM0 256a256 256 0 1 1 512 0 256 256 0 1 1 -512 0z"/></svg>`;

            partDiv.innerHTML = `
                <span class="layer-icon" style="width: 14px; height: 14px; fill: #f59e0b; display: flex;">${iconSVG}</span>
                <span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex-grow: 1;" title="${part.name}">${part.name}</span>
            `;

            partDiv.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', `global:${part.id}`);
                // Extract the root type so the dragover logic knows if it's a layout!
                this.draggedLibraryType = part.data.items[part.data.rootId].type;
            });

            partDiv.addEventListener('dragend', () => {
                this.draggedLibraryType = null;
                if (this.placeholder) { this.placeholder.remove(); this.placeholder = null; }
            });

            globalsContainer.appendChild(partDiv);
        });
    }

    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll(':scope > .builder-wrapper:not(.is-dragging)')]; return draggableElements.reduce((closest, child) => {
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
            const parts = payload.split(':');
            const payloadPrefix = parts[0];
            const payloadData = parts[1];

            if (payloadPrefix === 'new') isLayout = payloadData === 'custom-layout';
            else if (payloadPrefix === 'move') isLayout = this.state.items[payloadData]?.type === 'custom-layout';
            else if (payloadPrefix === 'preset') isLayout = payloadData === 'custom-layout';
            else if (payloadPrefix === 'global') {
                const masterPart = this.globalParts[payloadData];
                if (masterPart) isLayout = masterPart.data.items[masterPart.data.rootId].type === 'custom-layout';
            }

            let newParentId = null;
            // Only find a new parent if it's NOT a layout
            if (!isLayout) {
                const dropTarget = e.target.closest('.builder-wrapper[data-is-container="true"]');
                if (dropTarget) newParentId = dropTarget.dataset.id;
            }

            if (payload.startsWith('new:')) {
                const componentType = payloadData; // <-- THE FIX
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

                // UPDATED: Shifted to the new architecture using localAttrs and presetId
                this.state.items[uniqueId] = {
                    id: uniqueId,
                    type: componentType,
                    presetId: null,
                    localAttrs: initialAttrs,
                    children: [],
                    parentId: newParentId
                };

                if (newParentId) this.state.items[newParentId].children.push(uniqueId);
                else this.state.roots.push(uniqueId);

                this.selectedId = uniqueId;

                // --- NEW PRESET DROP LOGIC ADDED HERE ---
            } else if (payload.startsWith('preset:')) {
                const [_, componentType, presetId] = payload.split(':');
                const uniqueId = 'comp-' + Date.now();

                // Instantiate with the linked ID and empty local overrides
                this.state.items[uniqueId] = {
                    id: uniqueId,
                    type: componentType,
                    presetId: presetId,
                    localAttrs: {}, // Starts empty because it inherits from the preset
                    children: [],
                    parentId: newParentId
                };

                if (newParentId) this.state.items[newParentId].children.push(uniqueId);
                else this.state.roots.push(uniqueId);

                this.selectedId = uniqueId;
                // ----------------------------------------

                // --- NEW GLOBAL PART DROP LOGIC ---
            } else if (payload.startsWith('global:')) {
                const partId = payload.split(':')[1];
                const masterPart = this.globalParts[partId];
                if (!masterPart) return;

                const uniqueId = 'comp-' + Date.now();

                this.state.items[uniqueId] = {
                    id: uniqueId,
                    type: masterPart.data.items[masterPart.data.rootId].type,
                    globalPartId: partId,
                    localAttrs: {}, // Global parts don't allow local overrides
                    children: [],
                    parentId: newParentId
                };

                if (newParentId) this.state.items[newParentId].children.push(uniqueId);
                else this.state.roots.push(uniqueId);

                this.selectedId = uniqueId;
                // ----------------------------------

            } else if (payload.startsWith('move:')) {
                const itemId = payloadData; // <-- THE FIX
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
            this.saveState(`Dropped ${isLayout ? 'Layout' : 'Component'}`);
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
                this.addResizeHandles(clickedWrapper);



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

        // --- AUTO-MIGRATE OLD DATA TO NEW ARCHITECTURE ---
        if (!compData.localAttrs) {
            compData.localAttrs = compData.attrs || {};
            delete compData.attrs;
        }

        // --- 1. BREADCRUMBS ---
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

        // --- 1.5 TEMPLATE CONTROLS ---
        // Remove old template controls if re-rendering inspector
        const oldControls = this.shadowRoot.getElementById('template-controls');
        if (oldControls) oldControls.remove();

        const templateControls = document.createElement('div');
        templateControls.id = 'template-controls';
        templateControls.style.cssText = 'display: flex; gap: 8px; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #27272a;';

        // Check if this component IS a Global Part pointer
        if (compData.globalPartId) {
            const editGlobalBtn = document.createElement('button');
            editGlobalBtn.className = 'btn-primary';
            editGlobalBtn.style.flex = '1';
            editGlobalBtn.style.background = '#f59e0b'; // Amber
            editGlobalBtn.style.borderColor = '#b45309';
            editGlobalBtn.textContent = '⚡ Edit in Isolation Mode';
            editGlobalBtn.addEventListener('click', () => {
                this.enterIsolationMode(compData.globalPartId);
            });
            templateControls.appendChild(editGlobalBtn);

            // Hide the standard properties! Global Parts are locked.
            this.shadowRoot.getElementById('edit-form').insertBefore(templateControls, this.shadowRoot.getElementById('dynamic-inputs'));
            this.shadowRoot.getElementById('dynamic-inputs').innerHTML = '<div style="padding: 15px; text-align: center; color: #fbbf24; border: 1px dashed #523719; border-radius: 6px; background: rgba(245, 158, 11, 0.1);">This is a Global Part. Enter Isolation Mode to edit its contents.</div>';
            return; // Abort the rest of the inspector population
        }

        if (compData.presetId) {
            const updateBtn = document.createElement('button');
            updateBtn.className = 'btn-primary';
            updateBtn.style.flex = '1';
            updateBtn.style.background = '#10b981';
            updateBtn.style.borderColor = '#059669';
            updateBtn.textContent = '⟳ Update Template';
            updateBtn.addEventListener('click', () => {
                this.state.presets[compData.presetId].baseAttrs = {
                    ...this.state.presets[compData.presetId].baseAttrs,
                    ...compData.localAttrs
                };
                compData.localAttrs = {};
                this.saveGlobalTemplates();
                this.rebuildCanvas();
                this.populateInspector();
                alert('Template updated across all instances!');
            });

            const resetBtn = document.createElement('button');
            resetBtn.className = 'btn-secondary';
            resetBtn.style.flex = '1';
            resetBtn.style.color = '#ef4444';
            resetBtn.style.borderColor = '#7f1d1d';
            resetBtn.textContent = '↺ Reset';
            resetBtn.title = 'Revert all local changes to match the template';
            resetBtn.addEventListener('click', () => {
                if (confirm('Revert all local overrides to match the template defaults?')) {
                    compData.localAttrs = {};
                    this.rebuildCanvas();
                    this.populateInspector();
                }
            });

            templateControls.appendChild(updateBtn);
            templateControls.appendChild(resetBtn);

        } else {
            const saveTemplateBtn = document.createElement('button');
            saveTemplateBtn.className = 'btn-secondary';
            saveTemplateBtn.style.flex = '1';
            saveTemplateBtn.style.borderColor = '#818cf8';
            saveTemplateBtn.style.color = '#818cf8';
            saveTemplateBtn.textContent = '★ Save as Template';
            saveTemplateBtn.addEventListener('click', () => {
                const presetName = prompt("Enter a name for this template:");
                if (!presetName) return;

                const newPresetId = 'preset-' + Date.now();
                this.state.presets[newPresetId] = {
                    id: newPresetId,
                    type: compData.type,
                    name: presetName,
                    isStarred: false,
                    baseAttrs: { ...compData.localAttrs }
                };

                compData.presetId = newPresetId;
                compData.localAttrs = {};
                this.saveGlobalTemplates();
                const groupDiv = this.shadowRoot.querySelector(`.component-group[data-type="${compData.type}"]`);
                if (groupDiv) groupDiv.querySelector('.template-list').style.display = 'flex';
                this.renderPresets();
                this.populateInspector();
            });

            const saveGlobalBtn = document.createElement('button');
            saveGlobalBtn.className = 'btn-secondary';
            saveGlobalBtn.style.flex = '1';
            saveGlobalBtn.style.borderColor = '#f59e0b';
            saveGlobalBtn.style.color = '#f59e0b';
            saveGlobalBtn.textContent = '⚡ Save as Global';
            saveGlobalBtn.title = "Creates a linked master component";
            saveGlobalBtn.addEventListener('click', () => {
                const partName = prompt("Enter a name for this Global Part (e.g., Main Header):");
                if (!partName) return;

                const newPartId = 'global-' + Date.now();

                // Build a flat dictionary of items for the master component
                const flatItems = {};
                const recurse = (id) => {
                    const node = JSON.parse(JSON.stringify(this.state.items[id]));
                    // The root element inside the sandbox shouldn't have a parent
                    if (id === compData.id) node.parentId = null;
                    flatItems[id] = node;
                    if (node.children) {
                        node.children.forEach(childId => recurse(childId));
                    }
                };
                recurse(compData.id);

                this.globalParts[newPartId] = {
                    id: newPartId,
                    name: partName,
                    data: {
                        rootId: compData.id,
                        items: flatItems
                    }
                };

                // Preserve placement attributes so it doesn't jump out of the layout!
                const preservedPlacement = {};
                Shared.PLACEMENT_ATTRS.forEach(attr => {
                    ['', '-mobile', '-tablet', '-laptop', '-desktop', '-large', '-ultra'].forEach(bp => {
                        const key = `${attr}${bp}`;
                        if (compData.localAttrs && compData.localAttrs[key]) preservedPlacement[key] = compData.localAttrs[key];
                    });
                });
                if (compData.localAttrs && compData.localAttrs['column-span']) preservedPlacement['column-span'] = compData.localAttrs['column-span'];

                // Convert the current canvas item into a lightweight pointer
                this.state.items[compData.id] = {
                    id: compData.id,
                    type: compData.type,
                    globalPartId: newPartId,
                    localAttrs: preservedPlacement,
                    children: [],
                    parentId: compData.parentId
                };

                this.saveGlobalParts();
                this.saveState();
                this.rebuildCanvas();
                this.populateInspector();
                this.renderGlobalPartsList(); // Update sidebar immediately
            });

            templateControls.appendChild(saveTemplateBtn);
            templateControls.appendChild(saveGlobalBtn);
        }

        // Insert right above the dynamic inputs
        this.shadowRoot.getElementById('edit-form').insertBefore(templateControls, this.shadowRoot.getElementById('dynamic-inputs'));


        // --- 2. FETCH DYNAMIC CONFIGURATION ---
        const ElementClass = customElements.get(compData.type);

        let config = ElementClass && ElementClass.builderConfig
            ? JSON.parse(JSON.stringify(ElementClass.builderConfig))
            : { groups: { 'General': [] }, booleans: [] };

        // Extract the component's declared booleans (fallback to empty array)
        const componentBooleans = config.booleans || [];

        // Auto-inject Placement for ALL components uniformly
        config.groups = {
            'Placement': Shared.PLACEMENT_ATTRS,
            ...config.groups
        };

        let liveAttrs = ElementClass && ElementClass.observedAttributes ? [...ElementClass.observedAttributes] : [];

        if (liveAttrs.length === 0 && config.groups) {
            liveAttrs = Object.values(config.groups).flat();
        }

        const vpSuffix = this.currentViewport === 'mobile' ? '' : `-${this.currentViewport}`;

        // Ensure placement attributes are always editable for UI dragging purposes
        Shared.PLACEMENT_ATTRS.forEach(pa => {
            if (!liveAttrs.includes(pa)) liveAttrs.push(pa);
        });

        // Filter out the responsive grid variants from the liveAttrs list
        const viewports = ['mobile', 'tablet', 'laptop', 'desktop', 'large', 'ultra'];
        liveAttrs = liveAttrs.filter(attr => {
            const isPlacementBase = Shared.PLACEMENT_ATTRS.some(base => attr.startsWith(base));
            const hasViewportSuffix = viewports.some(vp => attr.endsWith(`-${vp}`));
            return !(isPlacementBase && hasViewportSuffix);
        });

        // --- 3. GROUP ATTRIBUTES ---
        const groupedAttrs = {};
        liveAttrs.forEach(attr => {
            let foundGroup = 'General';
            if (config.groups) {
                for (const [groupName, attributes] of Object.entries(config.groups)) {
                    if (attributes.includes(attr)) {
                        foundGroup = groupName;
                        break;
                    }
                }
            }
            if (!groupedAttrs[foundGroup]) groupedAttrs[foundGroup] = [];
            groupedAttrs[foundGroup].push(attr);
        });

        const predefinedOrder = ['Placement', 'Layout Grid', 'Slider Settings', 'Content', 'Lists', 'Navigation', 'Pagination', 'Styling', 'Media (Background)', 'Media (Primary)'];
        const sortedGroupNames = Object.keys(groupedAttrs).sort((a, b) => {
            const indexA = predefinedOrder.indexOf(a);
            const indexB = predefinedOrder.indexOf(b);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return a.localeCompare(b);
        });

        // --- 4. RENDER UI ---
        const dynamicContainer = this.shadowRoot.getElementById('dynamic-inputs');
        dynamicContainer.innerHTML = '';

        for (const groupName of sortedGroupNames) {
            const attributes = groupedAttrs[groupName];

            const groupHeader = document.createElement('h3');
            groupHeader.textContent = groupName;
            groupHeader.style.cssText = 'color: #818cf8; font-size: 0.85rem; border-bottom: 1px solid #475569; padding-bottom: 4px; margin-top: 20px; font-weight: 600;';
            dynamicContainer.appendChild(groupHeader);

            attributes.forEach(baseAttrName => {
                const isPlacement = Shared.PLACEMENT_ATTRS.includes(baseAttrName); // <--- FIXED
                const attrName = isPlacement ? `${baseAttrName}${vpSuffix}` : baseAttrName;

                // Fetch inherited preset value if it exists
                const inheritedVal = compData.presetId && this.state.presets && this.state.presets[compData.presetId]
                    ? this.state.presets[compData.presetId].baseAttrs[attrName]
                    : undefined;

                // Determine if this specific field has been overridden locally
                const isOverridden = compData.presetId && compData.localAttrs[attrName] !== undefined;

                const formGroup = document.createElement('div');
                formGroup.className = 'form-group';

                const label = document.createElement('label');

                // FIX: Create a reusable function to update the label icon dynamically
                const updateLabelBadge = (hasOverride) => {
                    // Suppress the warning icon for any Placement attributes
                    if (hasOverride && compData.presetId && !isPlacement) {
                        label.innerHTML = `${attrName.replace(/-/g, ' ')} <span style="margin-left: 6px; font-size: 12px; cursor: help;" title="Local override applied">⚠️</span>`;
                    } else {
                        label.textContent = attrName.replace(/-/g, ' ');
                    }
                    if (isPlacement && this.currentViewport !== 'mobile') label.style.color = '#10b981';
                };

                // Set initial state
                updateLabelBadge(isOverridden);

                let input;

                // --- 1. DYNAMIC BOOLEAN TOGGLES ---
                if (componentBooleans.includes(baseAttrName)) {
                    formGroup.classList.remove('stacked');
                    formGroup.style.flexDirection = 'row';
                    formGroup.style.justifyContent = 'space-between';
                    formGroup.style.alignItems = 'center';

                    input = document.createElement('label');
                    input.className = 'toggle-switch';

                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';

                    // Checked if local override exists, OR if preset value is present (and local hasn't explicitly disabled it)
                    checkbox.checked = compData.localAttrs[attrName] !== undefined || (compData.localAttrs[attrName] !== 'false' && inheritedVal !== undefined);

                    const slider = document.createElement('span');
                    slider.className = 'slider';

                    input.appendChild(checkbox);
                    input.appendChild(slider);

                    if (!this.debounceTimers) this.debounceTimers = {};

                    checkbox.addEventListener('change', (e) => {
                        if (e.target.checked) {
                            compData.localAttrs[attrName] = ''; // Empty string satisfies HTML boolean presence
                            updateLabelBadge(true); // Instantly add warning icon
                        } else {
                            if (inheritedVal !== undefined) {
                                compData.localAttrs[attrName] = 'false'; // Explicitly override preset
                                updateLabelBadge(true); // Instantly add warning icon
                            } else {
                                delete compData.localAttrs[attrName];
                                updateLabelBadge(false); // Instantly remove warning icon
                            }
                        }

                        if (this.debounceTimers[attrName]) clearTimeout(this.debounceTimers[attrName]);
                        this.debounceTimers[attrName] = setTimeout(() => {
                            this.saveState(`Toggled ${attrName}`);
                            this.rebuildCanvas();
                        }, 300);
                    });
                }
                // --- 2. STANDARD INPUTS ---
                else {
                    const currentValue = compData.localAttrs[attrName] !== undefined
                        ? compData.localAttrs[attrName]
                        : (inheritedVal || '');

                    if (ATTR_DROPDOWNS[baseAttrName]) {
                        input = document.createElement('select');
                        const defaultOption = document.createElement('option');
                        defaultOption.value = ''; defaultOption.textContent = '-- None --';
                        input.appendChild(defaultOption);

                        ATTR_DROPDOWNS[baseAttrName].forEach(val => {
                            const opt = document.createElement('option');
                            opt.value = val; opt.textContent = val;
                            if (currentValue === val) opt.selected = true;
                            input.appendChild(opt);
                        });
                    } else if (isPlacement || attrName === 'column-span') {
                        input = document.createElement('input');
                        input.type = 'text';
                        input.placeholder = 'e.g., 4, -1, or span 6';
                        input.value = currentValue;
                    } else if (attrName.includes('paragraph') || attrName.includes('items') || attrName.includes('icon')) {
                        input = document.createElement('textarea');
                        input.rows = 3;
                        input.value = currentValue;
                        if (attrName.includes('icon')) input.placeholder = 'e.g., <i class="fa-solid fa-star"></i>';
                        else if (attrName.includes('items')) input.placeholder = 'e.g., Item 1, Item 2, Item 3';
                        else input.placeholder = 'Enter ' + attrName.replace(/-/g, ' ') + '...';
                    } else {
                        input = document.createElement('input');
                        input.type = 'text';
                        input.value = currentValue;
                        if (attrName.includes('class') || attrName.includes('effects') || attrName.includes('border') || attrName.includes('shadow')) input.placeholder = 'e.g., padding-large shadow-2';
                        else if (attrName.includes('src') || attrName.includes('poster')) input.placeholder = 'e.g., /img/media.jpg';
                        else if (attrName.includes('color')) input.placeholder = 'e.g., #ffffff or var(--primary)';
                        else if (attrName.includes('width') || attrName.includes('size') || attrName.includes('height') || attrName.includes('gap')) input.placeholder = 'e.g., 100% or 2rem';
                        else if (attrName.includes('href')) input.placeholder = 'e.g., /about-us or https://...';
                        else if (attrName.includes('aspect-ratio')) input.placeholder = 'e.g., 16/9 or 1/1';
                        else input.placeholder = 'e.g., ' + attrName.replace(/-/g, ' ') + ' value';
                    }

                    if (!this.debounceTimers) this.debounceTimers = {};

                    input.addEventListener('input', (e) => {
                        const newValue = e.target.value;
                        if (newValue.trim() === '') {
                            delete compData.localAttrs[attrName];
                            updateLabelBadge(false); // Instantly remove warning icon
                        } else {
                            compData.localAttrs[attrName] = newValue;
                            updateLabelBadge(true); // Instantly add warning icon
                        }

                        // 1. Fast visual update & silent local save (300ms)
                        if (this.debounceTimers[attrName]) clearTimeout(this.debounceTimers[attrName]);
                        this.debounceTimers[attrName] = setTimeout(() => {
                            this.saveState(); // Saves locally without triggering history
                            this.rebuildCanvas();
                        }, 300);

                        // 2. Slower history snapshot to prevent typing spam (1500ms)
                        if (!this.historyDebounceTimers) this.historyDebounceTimers = {};
                        if (this.historyDebounceTimers[attrName]) clearTimeout(this.historyDebounceTimers[attrName]);
                        this.historyDebounceTimers[attrName] = setTimeout(() => {
                            this.pushHistory(`Changed ${attrName}`);
                        }, 1500);
                    });
                }

                formGroup.appendChild(label);
                formGroup.appendChild(input);
                dynamicContainer.appendChild(formGroup);
            });
        }
    }

    hideInspector() {
        this.shadowRoot.getElementById('empty-state').style.display = 'block';
        this.shadowRoot.getElementById('edit-form').style.display = 'none';
    }

    async openMediaManager(nodeId, targetAttr) {
        const modal = this.shadowRoot.getElementById('media-modal');
        const gallery = this.shadowRoot.getElementById('media-gallery');
        const sidebar = this.shadowRoot.getElementById('media-sidebar');
        const applyBtn = this.shadowRoot.getElementById('btn-apply-media');

        let selectedFilename = null;

        modal.classList.add('active');
        applyBtn.disabled = true;
        sidebar.innerHTML = '<div style="text-align: center; color: var(--theme-text-muted); font-size: 0.8rem; margin-top: 50px;">Select an image to view details</div>';
        gallery.innerHTML = '<div style="color: var(--theme-text-muted); grid-column: 1 / -1; text-align: center;">Loading images...</div>';

        // Bind Apply button (Clear previous listeners first to avoid stacking)
        const newApplyBtn = applyBtn.cloneNode(true);
        applyBtn.parentNode.replaceChild(newApplyBtn, applyBtn);
        newApplyBtn.addEventListener('click', () => {
            if (!selectedFilename) return;
            const compData = this.state.items[nodeId];
            if (!compData.localAttrs) compData.localAttrs = {};
            compData.localAttrs[targetAttr] = selectedFilename;
            this.saveState('Changed media image');
            this.rebuildCanvas();
            if (this.selectedId === nodeId) this.populateInspector();
            modal.classList.remove('active');
        });

        try {
            const response = await fetch('http://localhost:3000/api/images');
            if (!response.ok) throw new Error('Failed to load images');
            const imagesData = await response.json();

            gallery.innerHTML = '';
            if (imagesData.length === 0) {
                gallery.innerHTML = '<div style="color: var(--theme-text-muted); grid-column: 1 / -1; text-align: center;">No images found in /src/img/primary/</div>';
                return;
            }

            imagesData.forEach(imgData => {
                const thumb = document.createElement('div');
                thumb.className = 'media-thumbnail';

                const baseName = imgData.filename.replace(/\.[^/.]+$/, "");
                const isSvg = imgData.filename.endsWith('.svg');

                // Dynamically fetch the lowest breakpoint and format list from shared.js
                const smallestWidth = Shared.VIEWPORT_BREAKPOINT_WIDTHS[0];
                let sourceTags = '';

                Shared.IMAGE_FORMATS.forEach(fmt => {
                    if (fmt !== 'jpg') {
                        sourceTags += `<source type="image/${fmt}" srcset="./img/responsive/${baseName}-${smallestWidth}.${fmt}">\n`;
                    }
                });

                // Advanced Fallback: Try to load tiny modern formats from /responsive, fallback to /primary
                // FIX: Only output <picture> sources if the server confirmed the thumbnail actually exists
                const imgHtml = (isSvg || !imgData.hasThumb) ?
                    `<img src="./img/primary/${imgData.filename}" loading="lazy" alt="${imgData.filename}">` :
                    `<picture>
                        ${sourceTags}
                        <img src="./img/responsive/${baseName}-${smallestWidth}.jpg" loading="lazy" onerror="this.onerror=null; this.src='./img/primary/${imgData.filename}';" alt="${imgData.filename}">
                    </picture>`;

                thumb.innerHTML = `
                    ${imgHtml}
                    <div class="media-label" title="${imgData.filename}">${imgData.filename}</div>
                `;

                thumb.addEventListener('click', () => {
                    // UI Selection
                    gallery.querySelectorAll('.media-thumbnail').forEach(el => el.classList.remove('selected'));
                    thumb.classList.add('selected');
                    selectedFilename = imgData.filename;
                    newApplyBtn.disabled = false;

                    // Populate Sidebar EXIF
                    const e = imgData.exif || {};
                    const sizeMB = (imgData.size / (1024 * 1024)).toFixed(2);

                    const aperture = e.FNumber ? `ƒ/${e.FNumber}` : '-';
                    const shutter = e.ExposureTime ? `1/${Math.round(1 / e.ExposureTime)}` : '-';
                    const iso = e.ISO ? `ISO ${e.ISO}` : '-';
                    const focal = e.FocalLength ? `${e.FocalLength}mm` : '-';

                    // Adobe Bridge Style HUD
                    sidebar.innerHTML = `
                        <div style="margin-bottom: 10px;">
                            <img src="./img/primary/${imgData.filename}" style="width:100%; border-radius:4px; max-height: 180px; object-fit: contain; background: #000;">
                            <h3 style="margin: 10px 0 0 0; font-size: 0.9rem; color: white; border: none; padding: 0;">${imgData.filename}</h3>
                            <div style="font-size: 0.7rem; color: var(--theme-text-muted);">${sizeMB} MB</div>
                        </div>

                        <div class="exif-hud">
                            <div class="exif-stat" title="Aperture">
                                <svg viewBox="0 0 512 512"><path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM216 336h24V272H216c-13.3 0-24-10.7-24-24s10.7-24 24-24h48c13.3 0 24 10.7 24 24v88h8c13.3 0 24 10.7 24 24s-10.7 24-24 24H216c-13.3 0-24-10.7-24-24s10.7-24 24-24zM256 192a32 32 0 1 1 0-64 32 32 0 1 1 0 64z"/></svg>
                                ${aperture}
                            </div>
                            <div class="exif-stat" title="Shutter Speed">
                                <svg viewBox="0 0 512 512"><path d="M464 256A208 208 0 1 1 48 256a208 208 0 1 1 416 0zM0 256a256 256 0 1 0 512 0A256 256 0 1 0 0 256zM232 120V256c0 8 4 15.5 10.7 20l96 64c11.4 7.6 26.9 4.6 34.6-6.9s4.6-26.9-6.9-34.6L288 243.9V120c0-13.3-10.7-24-24-24s-24 10.7-24 24z"/></svg>
                                ${shutter}
                            </div>
                            <div class="exif-stat" title="Focal Length">
                                <svg viewBox="0 0 512 512"><path d="M224 96a160 160 0 1 0 0 320 160 160 0 1 0 0-320zM44.7 256a179.3 179.3 0 1 1 358.6 0 179.3 179.3 0 1 1 -358.6 0zM336 256a112 112 0 1 0 -224 0 112 112 0 1 0 224 0zM192 256a32 32 0 1 1 64 0 32 32 0 1 1 -64 0z"/></svg>
                                ${focal}
                            </div>
                            <div class="exif-stat" title="ISO">
                                <svg viewBox="0 0 512 512"><path d="M0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256zm256-96a96 96 0 1 0 0 192 96 96 0 1 0 0-192zm0 144a48 48 0 1 1 0-96 48 48 0 1 1 0 96z"/></svg>
                                ${iso}
                            </div>
                        </div>

                        <div class="exif-list">
                            ${e.Make ? `<div class="exif-row"><span>Make</span><span>${e.Make}</span></div>` : ''}
                            ${e.Model ? `<div class="exif-row"><span>Model</span><span>${e.Model}</span></div>` : ''}
                            ${e.ColorSpace ? `<div class="exif-row"><span>Color Space</span><span>${e.ColorSpace === 1 ? 'sRGB' : e.ColorSpace}</span></div>` : ''}
                            ${e.ExposureCompensation ? `<div class="exif-row"><span>Exp Comp</span><span>${e.ExposureCompensation}</span></div>` : ''}
                            ${e.LensModel ? `<div class="exif-row"><span>Lens</span><span>${e.LensModel}</span></div>` : ''}
                            ${e.DateTimeOriginal ? `<div class="exif-row"><span>Date</span><span>${new Date(e.DateTimeOriginal).toLocaleDateString()}</span></div>` : ''}
                        </div>
                    `;
                });

                gallery.appendChild(thumb);
            });
        } catch (err) {
            console.error(err);
            gallery.innerHTML = '<div style="color: #ef4444; grid-column: 1 / -1; text-align: center;">Failed to load images. Check server connection.</div>';
        }
    }

    async openCmsDashboard() {
        const dashboard = this.shadowRoot.getElementById('cms-dashboard');
        const listContainer = this.shadowRoot.getElementById('cms-content-list');
        dashboard.classList.add('active');
        listContainer.innerHTML = '<div style="padding: 2rem; text-align: center; color: #a1a1aa;">Loading content...</div>';

        try {
            const response = await fetch('http://localhost:3000/api/list-content');
            if (!response.ok) throw new Error('Failed to fetch content');
            const items = await response.json();

            if (items.length === 0) {
                listContainer.innerHTML = '<div style="padding: 2rem; text-align: center; color: #a1a1aa;">No pages or posts found.</div>';
                return;
            }

            listContainer.innerHTML = '';
            items.forEach(item => {
                const row = document.createElement('div');
                row.className = 'cms-list-item';

                const date = new Date(item.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

                row.innerHTML = `
                    <div style="font-weight: 500; color: #fafafa; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-right: 15px;" title="${item.title}">${item.title}</div>
                    <div style="color: #a1a1aa; font-family: monospace; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-right: 15px;" title="${item.slug}">/${item.slug}</div>
                    <div><span class="cms-badge ${item.type}">${item.type}</span></div>
                    <div style="color: #a1a1aa;">${date}</div>
                    <div>
                        <button class="btn-primary edit-btn" data-slug="${item.slug}" data-type="${item.type}">Edit</button>
                    </div>
                `;

                // Edit button event listener (Placeholder for Step 3!)
                row.querySelector('.edit-btn').addEventListener('click', (e) => {
                    const slug = e.target.dataset.slug;
                    const type = e.target.dataset.type;
                    this.loadContentIntoBuilder(slug, type); // We will build this in Step 3
                });

                listContainer.appendChild(row);
            });

        } catch (err) {
            console.error(err);
            listContainer.innerHTML = `<div style="padding: 2rem; text-align: center; color: #ef4444;">Error loading content. Is server.js running?</div>`;
        }
    }

    closeCmsDashboard() {
        this.shadowRoot.getElementById('cms-dashboard').classList.remove('active');
    }

    async loadContentIntoBuilder(slug, type) {
        // Give the user visual feedback that it's loading
        const btn = this.shadowRoot.querySelector(`button[data-slug="${slug}"]`);
        const originalText = btn ? btn.textContent : 'Edit';
        if (btn) btn.textContent = 'Loading...';

        try {
            // 1. Fetch the raw JSON state from the server
            const response = await fetch(`http://localhost:3000/api/load-post?slug=${slug}&type=${type}`);
            if (!response.ok) throw new Error('Failed to load content');

            const fetchedState = await response.json();

            // 2. Preserve live global presets! 
            // We don't want historical page data to overwrite our live global templates.
            const livePresets = this.state.presets || {};

            // 3. Hydrate the builder state
            this.state = fetchedState;
            this.state.presets = livePresets; // Re-inject the live presets

            // Ensure headData exists so the Meta tab doesn't crash
            if (!this.state.headData) this.state.headData = {};

            // 4. Update the Meta Tab UI inputs to reflect the newly loaded data
            const metaFields = [
                'contentType', 'slug', 'title', 'date', 'categories', 'description',
                'ogImage', 'canonical', 'theme', 'components', 'heroImage',
                'heroCount', 'heroWidths', 'heroSize', 'heroFormat'
            ];

            metaFields.forEach(field => {
                const input = this.shadowRoot.getElementById(`meta-${field}`);
                if (input) {
                    input.value = this.state.headData[field] || '';
                }
            });

            // 5. Reset Builder UI selections
            this.selectedId = null;
            this.hideInspector();

            // 6. Rebuild the visual canvas and the layers tree
            this.rebuildCanvas();
            if (this.renderLayers) this.renderLayers();

            // 7. Close the dashboard to reveal the loaded page
            this.closeCmsDashboard();

            // 8. Update Status Bar
            this.shadowRoot.getElementById('doc-status').textContent = `Editing ${type.toUpperCase()}: /${slug}`;

            // --- NEW: Ensure Meta fields match loaded state ---
            const contentTypeSelect = this.shadowRoot.getElementById('meta-contentType');
            if (contentTypeSelect) {
                contentTypeSelect.dispatchEvent(new Event('change'));
            }

            console.log(`✅ Successfully loaded ${type}: ${slug}`)


        } catch (err) {
            console.error("Error loading content:", err);
            alert("Failed to load content. Check the console for details.");
            if (btn) btn.textContent = originalText;
        }
    }

    setupControls() {
        const root = this.shadowRoot;

        // --- NEW: History Scrubber & Keyboard Shortcuts ---
        const scrubber = root.getElementById('history-scrubber');
        const tooltip = root.getElementById('scrubber-tooltip');

        scrubber.addEventListener('input', (e) => {
            const index = parseInt(e.target.value);
            const step = this.history[index];

            // Update tooltip text
            tooltip.querySelector('.tooltip-action').textContent = step.action;
            tooltip.querySelector('.tooltip-time').textContent = step.time;

            // Math to prevent edge clipping AND lock perfectly to thumb
            tooltip.style.display = 'flex'; // Display first to calculate offsetWidth
            const tooltipWidth = tooltip.offsetWidth;
            const panelWidth = scrubber.parentElement.offsetWidth;

            // Standard WebKit Thumb-Center Formula
            const thumbWidth = 14;
            const trackWidth = scrubber.offsetWidth;
            const max = parseInt(scrubber.max);
            const percent = max > 0 ? (index / max) : 0;

            // Thumb center travels from (width/2) to (trackWidth - width/2)
            const thumbCenter = (thumbWidth / 2) + percent * (trackWidth - thumbWidth);

            let offset = thumbCenter + 20; // +20 adds the parent container's padding

            // Clamp to boundaries so tooltip doesn't bleed off screen
            if (offset - (tooltipWidth / 2) < 10) offset = (tooltipWidth / 2) + 10;
            if (offset + (tooltipWidth / 2) > panelWidth - 10) offset = panelWidth - (tooltipWidth / 2) - 10;

            tooltip.style.left = `${offset}px`;

            // LIVE PREVIEW: Instantly update the main canvas
            this.isScrubbing = true;
            this.state = JSON.parse(JSON.stringify(step.state));
            this.selectedId = null;
            this.hideInspector();
            this.rebuildCanvas();

            // Tweak 7: Sync History Panel with Scrubber
            const list = this.shadowRoot.getElementById('history-list');
            if (list) {
                const items = list.querySelectorAll('.history-item');
                items.forEach((item, i) => {
                    const reverseIdx = (this.history.length - 1) - i;
                    if (reverseIdx === index) {
                        item.classList.add('active');
                        item.classList.remove('future');
                        item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
                    } else if (reverseIdx > index) {
                        item.classList.remove('active');
                        item.classList.add('future');
                    } else {
                        item.classList.remove('active', 'future');
                    }
                });
            }
        });

        scrubber.addEventListener('change', (e) => {
            tooltip.style.display = 'none';
            this.isScrubbing = false;
            this.goToHistoryStep(parseInt(e.target.value));
        });

        // Global Keyboard Listeners for Undo/Redo
        document.addEventListener('keydown', (e) => {
            // Ignore if typing in an input/textarea
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'z' && !e.shiftKey) {
                    e.preventDefault();
                    this.goToHistoryStep(this.historyIndex - 1);
                } else if (e.key === 'z' && e.shiftKey || e.key === 'y') {
                    e.preventDefault();
                    this.goToHistoryStep(this.historyIndex + 1);
                }
            }
        });

        // --- 1. Viewport Logic ---
        const vpButtons = root.querySelectorAll('.vp-btn');
        const viewportWidths = { 'base': '100%' };
        Shared.VIEWPORT_BREAKPOINTS.forEach(bp => { viewportWidths[bp.name] = `${bp.maxWidth}px`; });

        // --- BUTTON: CMS DASHBOARD ---
        this.shadowRoot.getElementById('btn-cms').addEventListener('click', () => {
            this.openCmsDashboard();
        });

        this.shadowRoot.getElementById('close-cms').addEventListener('click', () => {
            this.closeCmsDashboard();
        });

        // --- BUTTON: CLOSE MEDIA MODAL ---
        this.shadowRoot.getElementById('close-media-modal').addEventListener('click', () => {
            this.shadowRoot.getElementById('media-modal').classList.remove('active');
        });

        vpButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                vpButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentViewport = btn.dataset.vp;

                this.updateCanvasScale();

                if (this.selectedId) this.populateInspector();
            });
        });

        window.addEventListener('resize', () => this.updateCanvasScale());

        // --- 2. UI Toggles ---
        root.getElementById('btn-toggle-guides').addEventListener('click', () => {
            this.canvas.classList.toggle('show-guides');
            const btn = root.getElementById('btn-toggle-guides');
            btn.textContent = this.canvas.classList.contains('show-guides') ? 'Hide Grid' : 'Show Grid';
        });

        root.getElementById('btn-clear').addEventListener('click', () => {
            if (confirm('Clear canvas?')) {
                this.state = { roots: [], items: {}, headData: this.state.headData };
                this.selectedId = null;
                this.hideInspector();
                this.rebuildCanvas();
            }
        });

        // --- 3. Tab Logic ---
        const tabBtns = root.querySelectorAll('.tab-btn');
        const tabPanes = root.querySelectorAll('.tab-pane');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                tabBtns.forEach(b => b.classList.remove('active'));
                tabPanes.forEach(p => p.classList.remove('active'));
                btn.classList.add('active');
                root.getElementById(btn.dataset.target).classList.add('active');
            });
        });

        // --- 4. Node Ordering & Deletion ---
        root.getElementById('btn-up').addEventListener('click', () => {
            if (!this.selectedId) return;
            const item = this.state.items[this.selectedId];
            const array = item.parentId ? this.state.items[item.parentId].children : this.state.roots;
            const idx = array.indexOf(this.selectedId);
            if (idx > 0) { [array[idx - 1], array[idx]] = [array[idx], array[idx - 1]]; this.saveState('Moved item up'); this.rebuildCanvas(); }
        });

        root.getElementById('btn-down').addEventListener('click', () => {
            if (!this.selectedId) return;
            const item = this.state.items[this.selectedId];
            const array = item.parentId ? this.state.items[item.parentId].children : this.state.roots;
            const idx = array.indexOf(this.selectedId);
            if (idx > -1 && idx < array.length - 1) { [array[idx + 1], array[idx]] = [array[idx], array[idx + 1]]; this.saveState('Moved item down'); this.rebuildCanvas(); }
        });

        root.getElementById('btn-delete').addEventListener('click', () => {
            if (!this.selectedId) return;
            const item = this.state.items[this.selectedId];
            if (item.parentId) this.state.items[item.parentId].children = this.state.items[item.parentId].children.filter(id => id !== this.selectedId);
            else this.state.roots = this.state.roots.filter(id => id !== this.selectedId);
            delete this.state.items[this.selectedId];
            this.selectedId = null; this.hideInspector(); this.saveState('Deleted component'); this.rebuildCanvas();
        });

        // --- 5. Metadata Binding ---
        // REMOVED 'components' from array
        const metaFields = ['contentType', 'hidden', 'slug', 'title', 'date', 'author', 'categories', 'description', 'ogImage', 'socialTitle', 'socialDescription', 'canonical', 'theme', 'heroImage', 'heroCount', 'heroWidths', 'heroSize', 'heroFormat'];
        const contentTypeSelect = root.getElementById('meta-contentType');
        const postFieldsWrapper = root.getElementById('meta-post-fields');

        const toggleMetaFields = () => {
            if (contentTypeSelect.value === 'page') {
                postFieldsWrapper.style.display = 'none';
            } else {
                postFieldsWrapper.style.display = 'block';
            }
        };

        // Attach listener for manual UI toggling
        contentTypeSelect.addEventListener('change', toggleMetaFields);

        metaFields.forEach(field => {
            const input = root.getElementById(`meta-${field}`);
            if (input) {
                input.value = (this.state.headData && this.state.headData[field]) || '';
                input.addEventListener('input', (e) => {
                    if (!this.state.headData) this.state.headData = {};
                    this.state.headData[field] = e.target.value;

                    this.saveState(); // Silent local save
                    this.resetStatusToIdle();

                    // Tweak 8: Slower history snapshot to prevent typing spam
                    if (!this.metaHistoryTimers) this.metaHistoryTimers = {};
                    if (this.metaHistoryTimers[field]) clearTimeout(this.metaHistoryTimers[field]);
                    this.metaHistoryTimers[field] = setTimeout(() => {
                        this.pushHistory(`Updated ${field}`);
                    }, 1500);
                });
            }
        });

        // --- 6. Internal Logic: Reusable Save Helper ---
        const performSave = async (silent = false) => {
            const slug = this.state.headData?.slug?.trim();
            if (!slug) {
                alert("Please enter a URL Slug in the Meta tab first!");
                return false;
            }

            const btnSave = root.getElementById('btn-save');
            if (!silent) btnSave.textContent = 'Saving...';

            try {
                const response = await fetch('http://localhost:3000/api/save-post', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer rainwilds-builder-2026' },
                    body: JSON.stringify({
                        contentType: this.state.headData.contentType || 'post',
                        slug,
                        title: this.state.headData.title || 'Untitled',
                        date: this.state.headData.date || new Date().toISOString().split('T')[0],
                        author: this.state.headData.author || '', // <-- NEW: Send Author
                        categories: this.state.headData.categories ? this.state.headData.categories.split(',').map(c => c.trim()) : [],
                        excerpt: this.state.headData.description || '',
                        featuredImage: this.state.headData.ogImage || '',
                        builderState: this.state
                    })
                });

                if (response.ok) {
                    if (!silent) {
                        btnSave.textContent = '✅ Saved';
                        btnSave.style.background = '#059669';
                        setTimeout(() => { btnSave.textContent = 'Save'; btnSave.style.background = '#3b82f6'; }, 2000);
                    }
                    return true;
                }
            } catch (err) {
                console.error('Save failed:', err);
                if (!silent) alert('Save failed. Is server.js running?');
            }
            return false;
        };

        // --- BUTTON: VIEW HTML ---
        const generateHTMLString = (id, indentLevel = 0, sourceItems = this.state.items) => {
            let node = sourceItems[id];
            if (!node) return '';
            const indent = '  '.repeat(indentLevel);

            let targetNode = node;
            let targetItems = sourceItems;

            // Unpack Global Parts for the HTML viewer
            if (node.globalPartId && this.globalParts[node.globalPartId]) {
                const master = this.globalParts[node.globalPartId];
                targetItems = master.data.items;
                targetNode = targetItems[master.data.rootId];
            }

            // Resolve attributes (Preset + Local Overrides)
            let resolvedAttrs = {};
            if (targetNode.presetId && this.state.presets && this.state.presets[targetNode.presetId]) {
                resolvedAttrs = { ...this.state.presets[targetNode.presetId].baseAttrs };
            }
            resolvedAttrs = { ...resolvedAttrs, ...(targetNode.localAttrs || targetNode.attrs || {}) };

            // Retain layout placement
            if (node.localAttrs) {
                for (const [key, value] of Object.entries(node.localAttrs)) {
                    if (key.includes('column') || key.includes('row') || key.includes('index')) resolvedAttrs[key] = value;
                }
            }

            let attrString = Object.entries(resolvedAttrs).map(([k, v]) => `${k}="${v.replace(/"/g, '&quot;')}"`).join(' ');
            if (attrString) attrString = ' ' + attrString;
            let html = `${indent}<${targetNode.type}${attrString}>\n`;

            if (targetNode.children) {
                targetNode.children.forEach(childId => html += generateHTMLString(childId, indentLevel + 1, targetItems));
            }
            html += `${indent}</${targetNode.type}>\n`;
            return html;
        };

        root.getElementById('btn-view-html').addEventListener('click', () => {
            const textarea = root.getElementById('export-code');
            let exportHtml = '\n';
            this.state.roots.forEach(rootId => exportHtml += generateHTMLString(rootId) + '\n');
            textarea.value = exportHtml;
            root.getElementById('export-modal').classList.add('active');
        });

        root.getElementById('btn-copy').addEventListener('click', () => {
            navigator.clipboard.writeText(root.getElementById('export-code').value);
            const btn = root.getElementById('btn-copy');
            btn.textContent = '✅ Copied!';
            setTimeout(() => btn.textContent = '📋 Copy', 2000);
        });

        root.getElementById('close-modal').addEventListener('click', () => root.getElementById('export-modal').classList.remove('active'));

        // --- BUTTON: LIVE PREVIEW ---
        root.getElementById('btn-preview').addEventListener('click', () => {
            const slug = this.state.headData?.slug?.trim();
            if (!slug) return alert("Please enter a slug and Publish the post first.");

            const type = this.state.headData?.contentType || 'post';
            // Pages preview at /dist/slug.html, Posts at /dist/blog/slug.html
            const previewUrl = type === 'page' ? `/dist/${slug}.html` : `/dist/blog/${slug}.html`;
            window.open(previewUrl, '_blank');
        });

        // --- BUTTON: SAVE ---
        root.getElementById('btn-save').addEventListener('click', () => performSave(false));

        // --- BUTTON: PUBLISH (Auto-Saves First) ---
        const btnPublish = root.getElementById('btn-publish');
        btnPublish.addEventListener('click', async () => {
            btnPublish.disabled = true;
            btnPublish.textContent = 'Publishing...';

            // Start the animated terminal log in the status bar
            this.startTerminalSequence('page');

            // 1. Silent Save
            const isSaved = await performSave(true);
            if (!isSaved) {
                btnPublish.disabled = false;
                btnPublish.textContent = 'Publish';
                this.finishTerminalSequence(false, "Save aborted.");
                return;
            }

            // 2. Trigger Build Logic
            try {
                const slug = this.state.headData.slug.trim();
                const response = await fetch('http://localhost:3000/api/publish', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ slug, contentType: this.state.headData.contentType || 'post' })
                });

                if (response.ok) {
                    btnPublish.textContent = '✅ Published!';
                    btnPublish.style.background = '#059669';
                    this.finishTerminalSequence(true, `Published: /${slug}.html`);
                } else {
                    btnPublish.textContent = '❌ Error';
                    this.finishTerminalSequence(false, "Server build failed.");
                }
            } catch (err) {
                btnPublish.textContent = '❌ Error';
                this.finishTerminalSequence(false, "Network connection lost.");
            } finally {
                btnPublish.disabled = false;
                setTimeout(() => {
                    btnPublish.textContent = 'Publish';
                    btnPublish.style.background = '#10b981';
                    // Removed hardcoded light reset!
                }, 4000);
            }
        });
    }
}

customElements.define('visual-builder', VisualBuilder);
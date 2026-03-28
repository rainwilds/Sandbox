import * as Shared from '../shared.js';

// --- 1. DROPDOWN MAPPINGS ---
const ATTR_DROPDOWNS = {
    'column-span': ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14'],
    'column-start': ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14'],
    'column-end': ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14'],
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
        attrs: [
            'heading', 'sub-heading', 'paragraph', 'button-text', 'button-href', 'button-class', 'button-type', 'button-style', 'button-aria-label', 'button-rel', 'button-target', 'button-icon', 'button-icon-position', 'button-icon-offset', 'button-icon-size',
            'class', 'style', 'effects', 'text-alignment', 'section-title', 'shadow', 'border', 'border-radius', 'background-color', 'background-gradient', 'background-image-noise', 'background-overlay', 'backdrop-filter',
            'inner-class', 'inner-style', 'inner-alignment', 'inner-background-color', 'inner-background-gradient', 'inner-background-image-noise', 'inner-background-overlay', 'inner-backdrop-filter', 'inner-border', 'inner-border-radius', 'inner-shadow',
            'icon', 'icon-class', 'icon-size', 'icon-style',
            'img-background-src', 'img-background-light-src', 'img-background-dark-src', 'img-background-alt', 'img-background-aspect-ratio', 'img-background-decorative', 'img-background-desktop-width', 'img-background-fetchpriority', 'img-background-loading', 'img-background-mobile-width', 'img-background-position', 'img-background-tablet-width',
            'img-primary-src', 'img-primary-light-src', 'img-primary-dark-src', 'img-primary-alt', 'img-primary-aspect-ratio', 'img-primary-decorative', 'img-primary-desktop-width', 'img-primary-fetchpriority', 'img-primary-loading', 'img-primary-mobile-width', 'img-primary-position', 'img-primary-tablet-width',
            'video-background-src', 'video-background-light-src', 'video-background-dark-src', 'video-background-poster', 'video-background-light-poster', 'video-background-dark-poster', 'video-background-alt', 'video-background-autoplay', 'video-background-loop', 'video-background-muted', 'video-background-playsinline', 'video-background-disable-pip', 'video-background-loading',
            'video-primary-src', 'video-primary-light-src', 'video-primary-dark-src', 'video-primary-poster', 'video-primary-light-poster', 'video-primary-dark-poster', 'video-primary-alt', 'video-primary-autoplay', 'video-primary-loop', 'video-primary-muted', 'video-primary-playsinline', 'video-primary-disable-pip', 'video-primary-loading',
            'ul-items', 'ol-items', 'content-order', 'ul-icon', 'ol-icon', 'ul-icon-position', 'ol-icon-position', 'ul-style', 'ol-style', 'ul-icon-offset', 'ol-icon-offset'
        ]
    },
    'custom-slider': {
        isContainer: true,
        attrs: [
            'autoplay', 'slides-per-view', 'slides-per-view-mobile', 'slides-per-view-tablet', 'slides-per-view-laptop', 'slides-per-view-desktop', 'slides-per-view-large', 
            'navigation', 'navigation-icon-left', 'navigation-icon-right', 'navigation-icon-left-background', 'navigation-icon-right-background', 'navigation-icon-size', 
            'gap', 'pagination', 'pagination-position', 'pagination-icon-active', 'pagination-icon-inactive', 'pagination-icon-size', 
            'draggable', 'cross-fade', 'infinite-scrolling', 'pause-on-hover'
        ]
    },
    'custom-layout': {
        isContainer: true,
        attrs: [
            'column-span', 
            'column-start', 
            'column-end'
        ]
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

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    position: fixed; right: 0; top: 0; width: 340px; height: 100vh;
                    background: #1e293b; color: #f1f5f9; font-family: sans-serif;
                    box-shadow: -2px 0 10px rgba(0,0,0,0.2); display: flex; flex-direction: column; z-index: 9999;
                }
                .panel { padding: 20px; border-bottom: 1px solid #334155; }
                h2 { margin-top: 0; font-size: 1.2rem; color: #818cf8; display: flex; justify-content: space-between; }
                
                .component-item {
                    background: #334155; padding: 10px; border-radius: 6px; margin-bottom: 8px;
                    cursor: grab; text-align: center; font-weight: bold; transition: background 0.2s;
                }
                .component-item:hover { background: #475569; }
                
                .form-group { margin-bottom: 12px; display: flex; flex-direction: column; }
                label { font-size: 0.75rem; margin-bottom: 4px; color: #cbd5e1; text-transform: uppercase; letter-spacing: 0.5px;}
                input, textarea, select {
                    padding: 8px; border-radius: 4px; border: 1px solid #475569;
                    background: #0f172a; color: white; font-family: inherit; font-size: 0.85rem; width: 100%; box-sizing: border-box;
                }
                input:focus, textarea:focus, select:focus { outline: 2px solid #818cf8; }
                
                .btn-group { display: flex; gap: 5px; margin-bottom: 15px; }
                button {
                    background: #334155; color: white; border: none; padding: 8px 12px;
                    border-radius: 4px; cursor: pointer; flex-grow: 1; font-weight: bold;
                    transition: background 0.2s;
                }
                button:hover { background: #475569; }
                .btn-danger { background: #7f1d1d; }
                .btn-danger:hover { background: #991b1b; }
                .btn-primary { background: #4f46e5; width: 100%; margin-top: 10px;}
                .btn-primary:hover { background: #4338ca; }

                #empty-state { color: #94a3b8; font-size: 0.9rem; font-style: italic; text-align: center; margin-top: 2rem;}
                .scrollable { flex-grow: 1; overflow-y: auto; padding: 20px; }

                #breadcrumbs { font-size: 0.8rem; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #334155; }
                #breadcrumbs span.crumb:hover { text-decoration: underline; }

                .placeholder {
                    border: 2px dashed #818cf8 !important;
                    background-color: rgba(129, 140, 248, 0.1) !important;
                    min-height: 100px; display: flex; align-items: center; justify-content: center;
                    color: #818cf8; font-weight: bold; border-radius: 8px; margin-bottom: 1rem;
                }

                #export-modal {
                    display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.8);
                    z-index: 10000; place-content: center; padding: 2rem;
                }
                #export-modal.active { display: grid; }
                .modal-content {
                    background: #1e293b; padding: 2rem; border-radius: 8px; width: 80vw; max-width: 800px;
                    display: flex; flex-direction: column; position: relative;
                }
                .code-wrapper { position: relative; margin: 1rem 0; flex-grow: 1;}
                textarea#export-code { 
                    width: 100%; height: 50vh; box-sizing: border-box;
                    font-family: monospace; white-space: pre; resize: none;
                }
                #btn-copy {
                    position: absolute; top: 10px; right: 25px; width: auto;
                    background: #4f46e5; font-size: 0.8rem; box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                }
                #btn-copy:hover { background: #4338ca; }
            </style>

            <div id="export-modal">
                <div class="modal-content">
                    <h2>Exported HTML</h2>
                    <p style="margin: 0 0 10px 0; color: #cbd5e1; font-size: 0.9rem;">Review and copy your code below.</p>
                    <div class="code-wrapper">
                        <button id="btn-copy">📋 Copy</button>
                        <textarea id="export-code" readonly></textarea>
                    </div>
                    <button id="close-modal" class="btn-primary">Close</button>
                </div>
            </div>

            <div class="panel">
                <h2>Library <button id="btn-export" style="width: auto; padding: 4px 8px; font-size:0.8rem;">Export</button></h2>
                <div class="component-item" draggable="true" data-type="custom-layout">+ Custom Layout</div>
                <div class="component-item" draggable="true" data-type="custom-block">+ Custom Block</div>
                <div class="component-item" draggable="true" data-type="custom-slider">+ Custom Slider</div>
                <button id="btn-clear" class="btn-danger" style="width: 100%; margin-top: 10px;">Clear Canvas</button>
            </div>

            <div class="scrollable">
                <h2>Properties</h2>
                <div id="inspector">
                    <p id="empty-state">Select a block on the canvas to edit.</p>
                    <div id="edit-form" style="display: none;">
                        <div id="breadcrumbs"></div>
                        <div class="btn-group">
                            <button id="btn-up">⬆️ Up</button>
                            <button id="btn-down">⬇️ Down</button>
                            <button id="btn-delete" class="btn-danger">🗑️ Delete</button>
                        </div>
                        <hr style="border:0; border-top:1px solid #334155; margin-bottom:15px;">
                        <div id="dynamic-inputs"></div>
                    </div>
                </div>
            </div>
        `;
    }

    connectedCallback() {
        this.canvas = document.getElementById('canvas');
        
        const style = document.createElement('style');
style.innerHTML = `
            /* Mimic the body grid on the canvas */
            #canvas {
                display: grid;
                grid-template-columns: var(--side-gutter) repeat(12, 1fr) var(--side-gutter);
                align-content: start;
            }

            /* MAGIC FIX 2: display: contents makes wrappers invisible to CSS Grid */
            .builder-wrapper { 
                display: contents; 
            }
            
            /* Apply outlines and pointer events to the ACTUAL component inside the wrapper */
            .builder-wrapper > * { 
                position: relative; cursor: pointer; transition: all 0.2s; 
                outline: 1px dashed transparent; pointer-events: auto !important; 
            }
            .builder-wrapper:hover > * { outline: 2px dashed #94a3b8; outline-offset: -2px; z-index: 5; }
            .builder-selected > * { outline: 3px solid #2196F3 !important; outline-offset: -3px; z-index: 10; }
            .builder-wrapper * { pointer-events: none; }
            .builder-wrapper.is-dragging > * { opacity: 0.5; }
            .builder-wrapper.drop-target > * { outline: 4px dashed #10b981 !important; outline-offset: -4px; background: rgba(16, 185, 129, 0.1); }
            
            /* Give custom-layout its layout rules while inside the builder */
custom-layout {
                display: flex;
                flex-direction: column; /* Stacks blocks vertically and stretches them to 100% width */
                grid-column: 2 / -2; 
                gap: var(--space-medium); /* Keeps your vertical spacing between multiple blocks! */
                min-height: 100px;
                background: rgba(0,0,0,0.02); 
            }

            /* Map spans to custom-layout for the builder canvas */
            custom-layout[column-span="1"] { grid-column-end: span 1; }
            custom-layout[column-span="2"] { grid-column-end: span 2; }
            custom-layout[column-span="3"] { grid-column-end: span 3; }
            custom-layout[column-span="4"] { grid-column-end: span 4; }
            custom-layout[column-span="5"] { grid-column-end: span 5; }
            custom-layout[column-span="6"] { grid-column-end: span 6; }
            custom-layout[column-span="7"] { grid-column-end: span 7; }
            custom-layout[column-span="8"] { grid-column-end: span 8; }
            custom-layout[column-span="9"] { grid-column-end: span 9; }
            custom-layout[column-span="10"] { grid-column-end: span 10; }
            custom-layout[column-span="11"] { grid-column-end: span 11; }
            custom-layout[column-span="12"] { grid-column-end: span 12; }
            custom-layout[column-span="13"] { grid-column-end: span 13; }
            custom-layout[column-span="14"] { grid-column-end: span 14; }

            custom-layout[column-start="1"] { grid-column-start: 1; }
            custom-layout[column-start="2"] { grid-column-start: 2; }
            custom-layout[column-start="3"] { grid-column-start: 3; }
            custom-layout[column-start="4"] { grid-column-start: 4; }
            custom-layout[column-start="5"] { grid-column-start: 5; }
            custom-layout[column-start="6"] { grid-column-start: 6; }
            custom-layout[column-start="7"] { grid-column-start: 7; }
            custom-layout[column-start="8"] { grid-column-start: 8; }
            custom-layout[column-start="9"] { grid-column-start: 9; }
            custom-layout[column-start="10"] { grid-column-start: 10; }
            custom-layout[column-start="11"] { grid-column-start: 11; }
            custom-layout[column-start="12"] { grid-column-start: 12; }
            custom-layout[column-start="13"] { grid-column-start: 13; }
            custom-layout[column-start="14"] { grid-column-start: 14; }
        `;
        document.head.appendChild(style);

        this.setupDragAndDrop();
        this.setupCanvasSelection();
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
            this.canvas.querySelectorAll(`[data-id="${this.selectedId}"]`).forEach(el => el.classList.add('builder-selected'));
        }
        
        this.saveState();
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

        this.canvas.addEventListener('dragover', (e) => {
            e.preventDefault(); 
            this.canvas.querySelectorAll('.drop-target').forEach(el => el.classList.remove('drop-target'));
            
            const dropTargetWrapper = e.target.closest('.builder-wrapper[data-is-container="true"]');
            const dropContainer = dropTargetWrapper ? dropTargetWrapper : this.canvas;

            if (dropTargetWrapper) {
                dropTargetWrapper.classList.add('drop-target');
            }

            if (this.draggedLibraryType && !this.placeholder) {
                this.placeholder = document.createElement('div');
                this.placeholder.className = 'builder-wrapper is-dragging placeholder';
                this.placeholder.innerText = `Drop ${this.draggedLibraryType} Here`;
                this.canvas.appendChild(this.placeholder);
            }

            const afterElement = this.getDragAfterElement(dropContainer, e.clientY);
            const draggingWrapper = this.canvas.querySelector('.is-dragging');
            
            if (draggingWrapper) {
                if (afterElement == null) {
                    dropContainer.appendChild(draggingWrapper);
                } else {
                    dropContainer.insertBefore(draggingWrapper, afterElement);
                }
            }
        });

        this.canvas.addEventListener('drop', (e) => {
            e.preventDefault();
            this.canvas.querySelectorAll('.drop-target').forEach(el => el.classList.remove('drop-target'));
            if (this.placeholder) { this.placeholder.remove(); this.placeholder = null; }
            
            const payload = e.dataTransfer.getData('text/plain');
            if (!payload) return;

            let newParentId = null;
            const dropTarget = e.target.closest('.builder-wrapper[data-is-container="true"]');
            if (dropTarget) newParentId = dropTarget.dataset.id;

            if (payload.startsWith('new:')) {
                const componentType = payload.split(':')[1];
                const uniqueId = 'comp-' + Date.now();
                
                const initialAttrs = {};
                if (componentType === 'custom-layout') {
                    initialAttrs['column-span'] = '12';
                } else if (componentType === 'custom-block') {
                    initialAttrs['heading'] = 'New Block';
                    initialAttrs['class'] = 'background-color-1';
                    initialAttrs['inner-class'] = 'padding-large';
                } else if (componentType === 'custom-slider') {
                    initialAttrs['slides-per-view'] = '1';
                }

                this.state.items[uniqueId] = { id: uniqueId, type: componentType, attrs: initialAttrs, children: [], parentId: newParentId };

                if (newParentId) {
                    this.state.items[newParentId].children.push(uniqueId);
                } else {
                    this.state.roots.push(uniqueId);
                }

                this.selectedId = uniqueId;

            } else if (payload.startsWith('move:')) {
                const itemId = payload.split(':')[1];
                if (itemId === newParentId) return; 
                
                const item = this.state.items[itemId];
                
                if (item.parentId) {
                    const oldParent = this.state.items[item.parentId];
                    oldParent.children = oldParent.children.filter(id => id !== itemId);
                } else {
                    this.state.roots = this.state.roots.filter(id => id !== itemId);
                }

                item.parentId = newParentId;
                if (newParentId) {
                    this.state.items[newParentId].children.push(itemId);
                } else {
                    this.state.roots.push(itemId);
                }
            }

            this.draggedLibraryType = null;
            this.rebuildCanvas();
            this.populateInspector();
        });
    }

    setupCanvasSelection() {
        this.canvas.addEventListener('click', (e) => {
            const clickedWrapper = e.target.closest('.builder-wrapper');

            if (clickedWrapper) {
                e.stopPropagation(); 
                this.selectedId = clickedWrapper.dataset.id;
                
                this.canvas.querySelectorAll('.builder-selected').forEach(el => el.classList.remove('builder-selected'));
                this.canvas.querySelectorAll(`[data-id="${this.selectedId}"]`).forEach(el => el.classList.add('builder-selected'));
                
                this.populateInspector();
            } else {
                this.selectedId = null;
                this.canvas.querySelectorAll('.builder-selected').forEach(el => el.classList.remove('builder-selected'));
                this.hideInspector();
            }
        });
    }

    populateInspector() {
        this.shadowRoot.getElementById('empty-state').style.display = 'none';
        this.shadowRoot.getElementById('edit-form').style.display = 'block';

        const compData = this.state.items[this.selectedId];
        if(!compData) return;

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

        // 1. Get live attributes from the component source
        const CustomClass = customElements.get(compData.type);
        const liveAttrs = (CustomClass && CustomClass.observedAttributes) ? CustomClass.observedAttributes : [];
        
        // 2. Get fallback/layout attributes from our config
        const configAttrs = COMPONENT_CONFIG[compData.type] ? COMPONENT_CONFIG[compData.type].attrs : [];

        // 3. Merge them together and remove duplicates
        const schema = [...new Set([...configAttrs, ...liveAttrs])];
        
        schema.forEach(attrName => {
            const formGroup = document.createElement('div');
            formGroup.className = 'form-group';
            
            const label = document.createElement('label');
            label.textContent = attrName.replace(/-/g, ' '); 
            
            let input;

            if (ATTR_DROPDOWNS[attrName]) {
                input = document.createElement('select');
                const defaultOption = document.createElement('option');
                defaultOption.value = '';
                defaultOption.textContent = '-- None --';
                input.appendChild(defaultOption);

                ATTR_DROPDOWNS[attrName].forEach(val => {
                    const opt = document.createElement('option');
                    opt.value = val;
                    opt.textContent = val;
                    if (compData.attrs[attrName] === val) opt.selected = true;
                    input.appendChild(opt);
                });
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
            
            input.dataset.attr = attrName;

            input.addEventListener('input', (e) => {
                const newValue = e.target.value;
                if (newValue.trim() === '') {
                    delete compData.attrs[attrName];
                } else {
                    compData.attrs[attrName] = newValue;
                }
                this.rebuildCanvas(); 
            });

            formGroup.appendChild(label);
            formGroup.appendChild(input);
            dynamicContainer.appendChild(formGroup);
        });
    }

    hideInspector() {
        this.shadowRoot.getElementById('empty-state').style.display = 'block';
        this.shadowRoot.getElementById('edit-form').style.display = 'none';
    }

    setupControls() {
        const root = this.shadowRoot;

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
            if(confirm('Are you sure you want to clear the canvas?')) {
                this.state = { roots: [], items: {} };
                this.selectedId = null;
                this.hideInspector();
                this.rebuildCanvas();
            }
        });

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
}

customElements.define('visual-builder', VisualBuilder);
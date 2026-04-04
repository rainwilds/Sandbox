const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const targetSlug = args.find(arg => arg.startsWith('--slug='))?.split('=')[1];

// Helper to convert JSON state to raw tags
function generateHtmlFromJson(items, nodeId, presets = {}, globalParts = {}) {
    let node = items[nodeId];
    if (!node) return '';

    let targetNode = node;
    let targetItems = items;

    // --- THE FIX: Unpack Global Part Pointers ---
    if (node.globalPartId && globalParts[node.globalPartId]) {
        const master = globalParts[node.globalPartId];
        targetItems = master.data.items;
        targetNode = targetItems[master.data.rootId];
    }

    // 1. Resolve base attributes from the preset using the target content
    let resolvedAttrs = {};
    if (targetNode.presetId && presets[targetNode.presetId]) {
        resolvedAttrs = { ...presets[targetNode.presetId].baseAttrs };
    }

    // 2. Merge local overrides safely
    resolvedAttrs = { ...resolvedAttrs, ...(targetNode.localAttrs || targetNode.attrs || {}) };

    // 3. Retain the layout grid placement attributes from the original pointer!
    if (node.localAttrs) {
        for (const [key, value] of Object.entries(node.localAttrs)) {
            if (key.includes('column') || key.includes('row') || key.includes('index')) {
                resolvedAttrs[key] = value;
            }
        }
    }

    // --- NEW: Automatically inject the grid-placement-item class and CSS variables ---
    let inlineStyles = [];
    let isGridItem = false;

    const finalAttrs = {};
    for (const [k, v] of Object.entries(resolvedAttrs)) {
        // Identify grid placement attributes
        if (k.includes('column') || k.includes('row') || k.includes('index')) {
            inlineStyles.push(`--${k}: ${v}`);
            isGridItem = true;
            finalAttrs[k] = v; // Keep original attribute for standard processing
        } else if (k === 'class') {
            finalAttrs[k] = v;
        } else if (k === 'style') {
            inlineStyles.push(v);
        } else {
            finalAttrs[k] = v;
        }
    }

    if (isGridItem) {
        finalAttrs['class'] = finalAttrs['class'] ? `${finalAttrs['class']} grid-placement-item` : 'grid-placement-item';
    }
    if (inlineStyles.length > 0) {
        finalAttrs['style'] = inlineStyles.join('; ');
    }

    let attrString = Object.entries(finalAttrs).map(([k, v]) => `${k}="${String(v).replace(/"/g, '&quot;')}"`).join(' ');
    let html = `<${targetNode.type} ${attrString}>`;

    if (targetNode.children) {
        targetNode.children.forEach(id => html += generateHtmlFromJson(targetItems, id, presets, globalParts));
    }
    return html + `</${targetNode.type}>`;
}

async function runBuild() {
    console.log('🚀 Starting Rainwilds 2026 Adaptive Build Engine (DEBUG MODE)...');

    const srcPath = path.join(__dirname, 'src');
    const distPath = path.join(__dirname, 'dist');
    const folders = ['img', 'video', 'fonts', 'js', 'JSON', 'plugins', 'icons', 'css']; //
    const rootFilesToCopy = ['robots.txt', 'sitemap.xml', 'llms.txt'];

    // Detect components for the unwrapper
    const componentsPath = path.join(srcPath, 'js', 'components');
    const autoTags = fs.readdirSync(componentsPath)
        .filter(file => file.endsWith('.js') && file !== 'interactive-controller.js')
        .map(file => file.replace('.js', ''));

    console.log(`🔍 Detected ${autoTags.length} components:`, autoTags);

    // --- THE FIX: Load Global Parts into memory for the build ---
    const globalPartsPath = path.join(srcPath, 'JSON', 'global-parts.json');
    const globalParts = fs.existsSync(globalPartsPath) ? JSON.parse(fs.readFileSync(globalPartsPath, 'utf8')) : {};

    const sharedHeadPath = path.join(srcPath, '_templates', '_shared-head.html');
    const sharedHead = fs.existsSync(sharedHeadPath) ? fs.readFileSync(sharedHeadPath, 'utf8') : '';

    if (!targetSlug) {
        // 🛡️ SAFETY NET: If this is a single-page build but the /dist/css folder is missing, 
        // force an asset sync anyway to prevent unstyled pages on a fresh setup.
        if (targetSlug && !fs.existsSync(path.join(distPath, 'css'))) {
            console.log('⚠️  Missing global assets in /dist. Forcing asset sync...');
            if (!fs.existsSync(distPath)) fs.mkdirSync(distPath);
            folders.forEach(folder => {
                const srcFolder = path.join(srcPath, folder);
                if (fs.existsSync(srcFolder)) fs.cpSync(srcFolder, path.join(distPath, folder), { recursive: true });
            });
            // Copy root files too
            rootFilesToCopy.forEach(file => {
                const srcFile = path.join(srcPath, file);
                if (fs.existsSync(srcFile)) fs.copyFileSync(srcFile, path.join(distPath, file));
            });
        }

        if (fs.existsSync(distPath)) fs.rmSync(distPath, { recursive: true, force: true });
        fs.mkdirSync(distPath);
        console.log('📁 Syncing all assets...');
        folders.forEach(folder => {
            const srcFolder = path.join(srcPath, folder);
            if (fs.existsSync(srcFolder)) fs.cpSync(srcFolder, path.join(distPath, folder), { recursive: true });
        });
        rootFilesToCopy.forEach(file => {
            const srcFile = path.join(srcPath, file);
            if (fs.existsSync(srcFile)) fs.copyFileSync(srcFile, path.join(distPath, file));
        });

        const distCssPath = path.join(distPath, 'css');
        if (fs.existsSync(distCssPath)) {
            const cssFiles = fs.readdirSync(distCssPath).filter(f => f.endsWith('.css'));
            cssFiles.forEach(file => {
                const filePath = path.join(distCssPath, file);
                let cssContent = fs.readFileSync(filePath, 'utf8');
                cssContent = cssContent.replace(/url\((["']?)(\.\/)?fonts\//g, "url($1../fonts/");
                fs.writeFileSync(filePath, cssContent);
            });
        }
    }

    const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });

    // --- PHASE 3: GENERATE HTML ---
    // Parse the type argument passed from server.js
    const targetType = args.find(arg => arg.startsWith('--type='))?.split('=')[1] || null;

    // Define configurations for both Page and Post builds
    const buildConfigs = [
        {
            type: 'page',
            srcDir: path.join(srcPath, 'pages'),
            distDir: distPath,
            depthPrefix: './',
            puppeteerRoute: 'pages'
        },
        {
            type: 'post',
            srcDir: path.join(srcPath, 'blog'),
            distDir: path.join(distPath, 'blog'),
            depthPrefix: '../',
            puppeteerRoute: 'blog'
        }
    ];

    for (const config of buildConfigs) {
        // If a specific target is requested, skip the other config
        if (targetType && targetType !== config.type) continue;

        const manifestPath = path.join(config.srcDir, 'manifest.json');
        if (!fs.existsSync(manifestPath)) continue;

        if (!fs.existsSync(config.distDir)) fs.mkdirSync(config.distDir, { recursive: true });
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

        for (const item of manifest) {
            if (targetSlug && item.slug !== targetSlug) continue;

            const jsonPath = path.join(config.srcDir, `${item.slug}.json`);
            if (!fs.existsSync(jsonPath)) continue;

            const distHtmlPath = path.join(config.distDir, `${item.slug}.html`);

            console.log(`\n==========================================`);
            console.log(`  -> Building ${config.type.toUpperCase()}: ${item.slug}`);
            console.log(`==========================================`);

            const postData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

            // Inject dynamic pathing into the shared head
            let activeSharedHead = sharedHead;
            folders.forEach(f => {
                const hrefRegex = new RegExp(`href="(\\./)?${f}/`, 'g');
                const srcRegex = new RegExp(`src="(\\./)?${f}/`, 'g');
                activeSharedHead = activeSharedHead.replace(hrefRegex, `href="${config.depthPrefix}${f}/`).replace(srcRegex, `src="${config.depthPrefix}${f}/`);
            });

            const h = postData.headData || {};

            // --- THE FIX: Deeply scan for used components, including inside Global Parts! ---
            const componentSet = new Set();
            Object.values(postData.items).forEach(item => {
                componentSet.add(item.type);
                if (item.globalPartId && globalParts[item.globalPartId]) {
                    const masterItems = globalParts[item.globalPartId].data.items;
                    Object.values(masterItems).forEach(mItem => componentSet.add(mItem.type));
                }
            });
            const usedComponents = Array.from(componentSet).join(' ');

            // Build customHead with optional new attributes
            let customHeadAttrs = `data-components="${usedComponents}" data-title="${h.title || item.title}" data-description="${h.description || item.excerpt}"`;

            // Check the JSON state and output the valueless boolean attribute
            if (h.hidden === 'true') customHeadAttrs += ` data-hidden-page`;
            if (h.author) customHeadAttrs += ` data-author="${h.author}"`;
            if (h.socialTitle) customHeadAttrs += ` data-social-title="${h.socialTitle}"`;
            if (h.socialDescription) customHeadAttrs += ` data-social-description="${h.socialDescription}"`;
            
            const customHead = `<data-custom-head ${customHeadAttrs}></data-custom-head>`;

            let rawContent = '';
            const presets = postData.presets || {}; // Safely grab presets from the JSON
            // --- THE FIX: Pass globalParts into the recursive generator ---
            postData.roots.forEach(rId => rawContent += generateHtmlFromJson(postData.items, rId, presets, globalParts));
            const fullHtml = `<!DOCTYPE html><html><head>${activeSharedHead}${customHead}</head><body><main>${rawContent}</main></body></html>`;

            const page = await browser.newPage();

            page.on('console', msg => {
                const type = msg.type();
                const text = msg.text();
                if (type === 'error') console.log(`[PUPPETEER ERROR] 🛑 ${text}`);
                else if (type === 'warning') console.log(`[PUPPETEER WARN] ⚠️ ${text}`);
            });

            await page.setRequestInterception(true);
            page.on('request', r => {
                let url = r.url();

                // Route interception matches the current config type
                if (url.replace(/\/$/, '') === `http://localhost:5500/${config.puppeteerRoute}/${item.slug}`) {
                    return r.respond({ status: 200, contentType: 'text/html', body: fullHtml });
                }

                folders.forEach(f => {
                    // Match standard root paths (used by blog posts via ../)
                    const searchStr = `http://localhost:5500/${f}/`;
                    // Match route-relative paths (used by pages via ./)
                    const routeSearchStr = `http://localhost:5500/${config.puppeteerRoute}/${f}/`;

                    if (url.startsWith(searchStr)) {
                        url = url.replace(searchStr, `http://localhost:5500/src/${f}/`);
                    } else if (url.startsWith(routeSearchStr)) {
                        url = url.replace(routeSearchStr, `http://localhost:5500/src/${f}/`);
                    }
                });

                if (url.endsWith('styles.css')) url = 'http://localhost:5500/src/css/styles.css';
                if (url.endsWith('custom.css')) url = 'http://localhost:5500/src/css/custom.css';
                if (url.endsWith('setup.json')) url = 'http://localhost:5500/src/JSON/setup.json';

                r.continue({ url });
            });

            await page.goto(`http://localhost:5500/${config.puppeteerRoute}/${item.slug}`, { waitUntil: 'networkidle0' });
            await page.waitForFunction(() => window.__PAGE_FULLY_RENDERED__ === true, { timeout: 8000 }).catch(() => { });

            // THE UNWRAPPER - Remains the same, passing in tags and folders
            await page.evaluate(async (tags, assetFolders) => {
                for (const t of tags) {
                    const elements = document.querySelectorAll(t);
                    for (const el of elements) {
                        if (typeof el.initialize === 'function') {
                            el.isVisible = true;
                            await el.initialize();
                        }
                    }
                }

                assetFolders.forEach(f => {
                    document.querySelectorAll(`[src^="./${f}/"], [src^="${f}/"], [href^="./${f}/"], [href^="${f}/"]`).forEach(el => {
                        const attr = el.hasAttribute('src') ? 'src' : 'href';
                        const old = el.getAttribute(attr);
                        el.setAttribute(attr, old.startsWith('./') ? old.replace('./', '../') : '../' + old);
                    });
                });
                document.querySelectorAll('script[src*="head-generator.js"], data-custom-head').forEach(el => el.remove());

                let els = document.querySelectorAll(tags.join(', '));
                let sanityCheck = 0;
                while (els.length > 0 && sanityCheck < 100) {
                    sanityCheck++;
                    els.forEach(el => {
                        const child = el.firstElementChild;
                        if (child) {
                            if (el.style.cssText) child.style.cssText = (child.style.cssText ? child.style.cssText + ' ' : '') + el.style.cssText;
                            if (el.classList.contains('grid-placement-item')) child.classList.add('grid-placement-item');
                        }
                        while (el.firstChild) el.parentNode.insertBefore(el.firstChild, el);
                        el.remove();
                    });
                    els = document.querySelectorAll(tags.join(', '));
                }
            }, autoTags, folders);

            let finalHtml = await page.content();
            const assetFolders = ['css', 'js', 'fonts', 'img', 'video', 'JSON', 'plugins', 'icons'];

            // Replace paths using the dynamic depthPrefix (./ for pages, ../ for posts)
            assetFolders.forEach(folder => {
                const relRegex = new RegExp(`(href|src)="(\\.\\/|\\.\\.\\/)?${folder}/`, 'g');
                finalHtml = finalHtml.replace(relRegex, `$1="${config.depthPrefix}${folder}/`);
                const absRegex = new RegExp(`(href|src)="/${folder}/`, 'g');
                finalHtml = finalHtml.replace(absRegex, `$1="${config.depthPrefix}${folder}/`);
            });

            finalHtml = finalHtml.replace(/"(\.\/|\.\.\/)?plugins\//g, `"${config.depthPrefix}plugins/`);
            finalHtml = finalHtml.replace(/"(\.\/|\.\.\/)?JSON\//g, `"${config.depthPrefix}JSON/`);
            finalHtml = finalHtml.replace(/href="(\.\/|\.\.\/)?css\/styles\.css"/g, `href="${config.depthPrefix}css/styles.css"`);
            finalHtml = finalHtml.replace(/href="(\.\/|\.\.\/)?css\/custom\.css"/g, `href="${config.depthPrefix}css/custom.css"`);

            fs.writeFileSync(distHtmlPath, finalHtml);
            await page.close();
            console.log(`[NODE] Successfully wrote: ${distHtmlPath}`);
        }
    }

    await browser.close();
    console.log(`✅ Build Complete!`);
}

runBuild();
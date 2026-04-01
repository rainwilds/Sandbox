const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const targetSlug = args.find(arg => arg.startsWith('--slug='))?.split('=')[1];

// Helper to convert JSON state to raw tags
function generateHtmlFromJson(items, nodeId) {
    const node = items[nodeId];
    if (!node) return '';
    let attrString = Object.entries(node.attrs).map(([k, v]) => `${k}="${v.replace(/"/g, '&quot;')}"`).join(' ');
    let html = `<${node.type} ${attrString}>`;
    if (node.children) node.children.forEach(id => html += generateHtmlFromJson(items, id));
    return html + `</${node.type}>`;
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

    const sharedHeadPath = path.join(srcPath, '_templates', '_shared-head.html');
    const sharedHead = fs.existsSync(sharedHeadPath) ? fs.readFileSync(sharedHeadPath, 'utf8') : '';

    if (!targetSlug) {
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
            const usedComponents = [...new Set(Object.values(postData.items).map(i => i.type))].join(' ');
            const customHead = `<data-custom-head data-components="${usedComponents}" data-title="${h.title || item.title}" data-description="${h.description || item.excerpt}"></data-custom-head>`;

            let rawContent = '';
            postData.roots.forEach(rId => rawContent += generateHtmlFromJson(postData.items, rId));

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
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
    console.log('🚀 Starting Rainwilds 2026 Adaptive Build Engine...');

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

    // Only wipe dist if doing a full build
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

        // UPDATED: Repair Font Paths with Quote Preservation
        const distCssPath = path.join(distPath, 'css');
        if (fs.existsSync(distCssPath)) {
            const cssFiles = fs.readdirSync(distCssPath).filter(f => f.endsWith('.css'));
            cssFiles.forEach(file => {
                const filePath = path.join(distCssPath, file);
                let cssContent = fs.readFileSync(filePath, 'utf8');

                // This Regex captures the quote type ($1) and puts it back, 
                // preventing the quote mismatch error.
                cssContent = cssContent.replace(/url\((["']?)(\.\/)?fonts\//g, "url($1../fonts/");

                fs.writeFileSync(filePath, cssContent);
            });
            console.log('✅ Repaired font paths (Fixed Quote Mismatch)');
        }
    }

    const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });

    // --- PHASE 2: ROOT PAGES ---
    if (!targetSlug) {
        const pagesToBuild = fs.readdirSync(srcPath).filter(f => f.endsWith('.html') && !f.startsWith('_') && f !== 'builder.html');
        for (const file of pagesToBuild) {
            console.log(`  -> Rendering Root Page: ${file}`);
            const page = await browser.newPage();
            await page.goto(`http://localhost:5500/src/${file}`, { waitUntil: 'networkidle0' });
            await page.waitForFunction(() => window.__PAGE_FULLY_RENDERED__ === true, { timeout: 5000 }).catch(() => { });

            await page.evaluate(async (tags) => {
                for (const t of tags) {
                    for (const el of document.querySelectorAll(t)) {
                        if (typeof el.initialize === 'function') { el.isVisible = true; await el.initialize(); }
                    }
                }
                document.querySelectorAll('script[src*="head-generator.js"], data-custom-head').forEach(el => el.remove());
                let els = document.querySelectorAll(tags.join(', '));
                while (els.length > 0) {
                    els.forEach(el => {
                        while (el.firstChild) el.parentNode.insertBefore(el.firstChild, el);
                        el.remove();
                    });
                    els = document.querySelectorAll(tags.join(', '));
                }
            }, autoTags);

            fs.writeFileSync(path.join(distPath, file), await page.content());
            await page.close();
        }
    }

    // --- PHASE 3: BLOG POSTS ---
    const manifestPath = path.join(srcPath, 'blog', 'manifest.json');
    if (fs.existsSync(manifestPath)) {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        const distBlogDir = path.join(distPath, 'blog');
        if (!fs.existsSync(distBlogDir)) fs.mkdirSync(distBlogDir, { recursive: true });

        for (const post of manifest) {
            if (targetSlug && post.slug !== targetSlug) continue;

            const jsonPath = path.join(srcPath, 'blog', `${post.slug}.json`);
            const distHtmlPath = path.join(distPath, 'blog', `${post.slug}.html`);
            if (!fs.existsSync(jsonPath)) continue;

            console.log(`  -> Flattening Blog Post: ${post.slug}`);
            const postData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

            // --- UPDATED PATH FIXING ---
            let blogSharedHead = sharedHead;

            // 1. Fix folder-prefixed paths (e.g., css/styles.css -> ../css/styles.css)
            folders.forEach(f => {
                const hrefRegex = new RegExp(`href="(\\./)?${f}/`, 'g');
                const srcRegex = new RegExp(`src="(\\./)?${f}/`, 'g');
                blogSharedHead = blogSharedHead.replace(hrefRegex, `href="../${f}/`).replace(srcRegex, `src="../${f}/`);
            });

            // 2. THE CRITICAL ADDITION: Fix root-level files specifically
            // This catches cases where the head doesn't use the 'css/' folder prefix
            blogSharedHead = blogSharedHead.replace(/href="(\.\/)?styles\.css"/g, 'href="../css/styles.css"');
            blogSharedHead = blogSharedHead.replace(/href="(\.\/)?custom\.css"/g, 'href="../css/custom.css"');
            blogSharedHead = blogSharedHead.replace(/href="(\.\/)?setup\.json"/g, 'href="../JSON/setup.json"');

            const h = postData.headData || {};
            const customHead = `<data-custom-head data-components="${h.components || 'custom-block'}" data-title="${h.title || post.title}" data-description="${h.description || post.excerpt}"></data-custom-head>`;
            let rawContent = '';
            postData.roots.forEach(rId => rawContent += generateHtmlFromJson(postData.items, rId));

            const fullHtml = `<!DOCTYPE html><html><head>${blogSharedHead}${customHead}</head><body><main>${rawContent}</main></body></html>`;

            const page = await browser.newPage();
            await page.setRequestInterception(true);
            page.on('request', r => {
                let url = r.url();
                if (url.replace(/\/$/, '') === `http://localhost:5500/blog/${post.slug}`) {
                    return r.respond({ status: 200, contentType: 'text/html', body: fullHtml });
                }

                // Redirect folder-prefixed assets to /src/
                folders.forEach(f => {
                    const searchStr = `http://localhost:5500/${f}/`;
                    if (url.startsWith(searchStr)) {
                        url = url.replace(searchStr, `http://localhost:5500/src/${f}/`);
                    }
                });

                // NEW: Redirect specific root-level files to their /src/ subfolders
                if (url.endsWith('styles.css')) url = 'http://localhost:5500/src/css/styles.css';
                if (url.endsWith('custom.css')) url = 'http://localhost:5500/src/css/custom.css';
                if (url.endsWith('setup.json')) url = 'http://localhost:5500/src/JSON/setup.json';

                r.continue({ url });
            });

            await page.goto(`http://localhost:5500/blog/${post.slug}`, { waitUntil: 'networkidle0' });
            await page.waitForFunction(() => window.__PAGE_FULLY_RENDERED__ === true, { timeout: 8000 }).catch(() => { });

            await page.evaluate(async (tags, assetFolders) => {
                for (const t of tags) {
                    for (const el of document.querySelectorAll(t)) {
                        if (typeof el.initialize === 'function') { el.isVisible = true; await el.initialize(); }
                    }
                }
                // Fix internal content paths
                assetFolders.forEach(f => {
                    document.querySelectorAll(`[src^="./${f}/"], [src^="${f}/"], [href^="./${f}/"], [href^="${f}/"]`).forEach(el => {
                        const attr = el.hasAttribute('src') ? 'src' : 'href';
                        const old = el.getAttribute(attr);
                        el.setAttribute(attr, old.startsWith('./') ? old.replace('./', '../') : '../' + old);
                    });
                });
                document.querySelectorAll('script[src*="head-generator.js"], data-custom-head').forEach(el => el.remove());
                let els = document.querySelectorAll(tags.join(', '));
                while (els.length > 0) {
                    els.forEach(el => {
                        while (el.firstChild) el.parentNode.insertBefore(el.firstChild, el);
                        el.remove();
                    });
                    els = document.querySelectorAll(tags.join(', '));
                }
            }, autoTags, folders);

            // --- UPDATED NUCLEAR PATH FIXER ---
            let finalHtml = await page.content();
            const assetFolders = ['css', 'js', 'fonts', 'img', 'video', 'JSON', 'plugins', 'icons'];

            assetFolders.forEach(folder => {
                // 1. Fix relative links: href="css/" -> href="../css/"
                const relRegex = new RegExp(`(href|src)="(\\./)?${folder}/`, 'g');
                finalHtml = finalHtml.replace(relRegex, `$1="../${folder}/`);

                // 2. Fix absolute links: src="/img/..." -> src="../img/..."
                const absRegex = new RegExp(`(href|src)="/${folder}/`, 'g');
                finalHtml = finalHtml.replace(absRegex, `$1="../${folder}/`);
            });

            // 3. Fix strings INSIDE script tags (e.g., Snipcart templatesUrl)
            finalHtml = finalHtml.replace(/"\.\/plugins\//g, '"../plugins/');
            finalHtml = finalHtml.replace(/"\.\/JSON\//g, '"../JSON/');

            // 4. Naked file fixes
            finalHtml = finalHtml.replace(/href="(\.\/)?styles\.css"/g, 'href="../css/styles.css"');
            finalHtml = finalHtml.replace(/href="(\.\/)?custom\.css"/g, 'href="../css/custom.css"');

            fs.writeFileSync(distHtmlPath, finalHtml);
            await page.close();
        }
    }

    await browser.close(); // Correctly placed inside the async function
    console.log(`✅ Build Complete!`);
}

runBuild();
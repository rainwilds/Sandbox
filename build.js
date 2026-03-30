const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function runBuild() {
    console.log('🚀 Starting Rainwilds 2026 Adaptive Build Engine...');

    const distPath = path.join(__dirname, 'dist');
    
    // THE CARGO LIST: Folders and files to sync to /dist
    const foldersToCopy = ['img', 'video', 'fonts', 'js', 'JSON', 'plugins', 'icons'];
    const rootFilesToCopy = ['styles.css', 'custom.css', 'robots.txt', 'sitemap.xml', 'llms.txt'];

    // 1. Determine current GitHub prefix from setup.json
    const setup = JSON.parse(fs.readFileSync(path.join(__dirname, 'JSON', 'setup.json'), 'utf8'));
    const repoPrefix = setup.general.basePath; 

    // --- NEW: Read the shared head partial once ---
    const sharedHeadPath = path.join(__dirname, '_shared-head.html');
    const sharedHead = fs.existsSync(sharedHeadPath) ? fs.readFileSync(sharedHeadPath, 'utf8') : '';

    // 2. Refresh /dist folder
    if (fs.existsSync(distPath)) fs.rmSync(distPath, { recursive: true, force: true });
    fs.mkdirSync(distPath);

    // --- PHASE 1: ASSET SYNC ---
    console.log('📁 Syncing assets...');

    // Copy Folders
    foldersToCopy.forEach(folder => {
        const src = path.join(__dirname, folder);
        if (fs.existsSync(src)) {
            fs.cpSync(src, path.join(distPath, folder), { recursive: true });
            
            // SPECIAL FIX: If it's the icons folder, also copy contents to root
            // This prevents 404s when the browser looks for /favicon.ico
            if (folder === 'icons') {
                fs.readdirSync(src).forEach(file => {
                    const filePath = path.join(src, file);
                    if (fs.lstatSync(filePath).isFile()) {
                        fs.copyFileSync(filePath, path.join(distPath, file));
                    }
                });
            }
        }
    });

    // Copy Root Files
    rootFilesToCopy.forEach(file => {
        const src = path.join(__dirname, file);
        if (fs.existsSync(src)) fs.copyFileSync(src, path.join(distPath, file));
    });

    // --- PHASE 2: RENDERING & FLATTENING ---
    const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });

    const pagesToBuild = fs.readdirSync(__dirname).filter(file => 
        file.endsWith('.html') && !file.startsWith('_')
    );

    for (const file of pagesToBuild) {
        try {
            const page = await browser.newPage();
            await page.setRequestInterception(true);
            
            page.on('request', r => {
                let url = r.url();
                
                // --- NEW: Intercept the specific HTML file and inject the shared head ---
                if (url === `http://localhost:5500/${file}`) {
                    let sourceHtml = fs.readFileSync(path.join(__dirname, file), 'utf8');
                    if (sharedHead) {
                        sourceHtml = sourceHtml.replace('', sharedHead);
                    }
                    return r.respond({
                        status: 200,
                        contentType: 'text/html',
                        body: sourceHtml
                    });
                }

                // Existing logic for adaptive paths
                if (url.includes(repoPrefix)) url = url.replace(repoPrefix, '/');
                r.continue({ url });
            });

            console.log(`  -> Rendering: ${file}`);
            await page.goto(`http://localhost:5500/${file}`, { waitUntil: 'networkidle0' });

            await page.evaluate(() => {
                document.querySelectorAll('custom-block, bh-img, bh-video').forEach(el => {
                    el.insertAdjacentHTML('afterend', el.innerHTML);
                    el.remove(); 
                });
                // Note: custom-slider, custom-nav, custom-header remain as tags for logic
            });

            let content = await page.content();
            const cleanRegex = new RegExp(repoPrefix.replace(/\//g, '\\/'), 'g');
            content = content.replace(cleanRegex, '/');

            fs.writeFileSync(path.join(distPath, file), content);
            await page.close();
        } catch (err) {
            console.error(`  ❌ Failed ${file}:`, err.message);
        }
    }

    await browser.close();
    console.log(`✅ Build Complete! Preview on Port 8080.`);
}

runBuild();
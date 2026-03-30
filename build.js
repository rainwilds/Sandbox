const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function runBuild() {
    console.log('🚀 Starting Rainwilds 2026 Adaptive Build Engine...');

    const srcPath = path.join(__dirname, 'src');
    const distPath = path.join(__dirname, 'dist');
    
    // THE CARGO LIST: Folders inside /src to sync to /dist
    const foldersToCopy = ['img', 'video', 'fonts', 'js', 'JSON', 'plugins', 'icons', 'css'];
    const rootFilesToCopy = ['robots.txt', 'sitemap.xml', 'llms.txt'];

    // 1. Determine current GitHub prefix from setup.json
    const setupPath = path.join(srcPath, 'JSON', 'setup.json');
    const setup = JSON.parse(fs.readFileSync(setupPath, 'utf8'));
    const repoPrefix = setup.general.basePath; 

    // --- Read the shared head partial once ---
    const sharedHeadPath = path.join(srcPath, '_templates', '_shared-head.html');
    let sharedHead = '';
    if (fs.existsSync(sharedHeadPath)) {
        sharedHead = fs.readFileSync(sharedHeadPath, 'utf8');
        console.log('✅ Found _shared-head.html successfully!');
    } else {
        console.log('⚠️ WARNING: Could not find _templates/_shared-head.html');
    }

    // 2. Refresh /dist folder
    if (fs.existsSync(distPath)) fs.rmSync(distPath, { recursive: true, force: true });
    fs.mkdirSync(distPath);

    // --- PHASE 1: ASSET SYNC ---
    console.log('📁 Syncing assets...');

    foldersToCopy.forEach(folder => {
        const srcFolder = path.join(srcPath, folder);
        if (fs.existsSync(srcFolder)) {
            fs.cpSync(srcFolder, path.join(distPath, folder), { recursive: true });
            
            if (folder === 'icons') {
                fs.readdirSync(srcFolder).forEach(file => {
                    const filePath = path.join(srcFolder, file);
                    if (fs.lstatSync(filePath).isFile()) {
                        fs.copyFileSync(filePath, path.join(distPath, file));
                    }
                });
            }
        }
    });

    rootFilesToCopy.forEach(file => {
        const srcFile = path.join(srcPath, file);
        if (fs.existsSync(srcFile)) fs.copyFileSync(srcFile, path.join(distPath, file));
    });

    if (fs.existsSync(path.join(srcPath, 'css'))) {
        fs.readdirSync(path.join(srcPath, 'css')).forEach(file => {
             if (file.endsWith('.css')) {
                 fs.copyFileSync(path.join(srcPath, 'css', file), path.join(distPath, file));
             }
        });
    }

    // --- PHASE 2: RENDERING & FLATTENING ---
    const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });

    // ONLY scan the root of /src for actual pages.
    const pagesToBuild = fs.readdirSync(srcPath).filter(file => 
        file.endsWith('.html') && !file.startsWith('_')
    );

    for (const file of pagesToBuild) {
        try {
            const page = await browser.newPage();
            await page.setRequestInterception(true);
            
            page.on('request', r => {
                let url = r.url();
                
                if (url === `http://localhost:5500/${file}`) {
                    let sourceHtml = fs.readFileSync(path.join(srcPath, file), 'utf8');
                    
                    if (sharedHead) {
                        sourceHtml = sourceHtml.replace(/<data-custom-head/i, sharedHead + '\n    <data-custom-head');
                    }
                    
                    // Inject Global Navigation Data
                    const headerNavStr = JSON.stringify(setup.headerNavigation || []);
                    const footerNavStr = JSON.stringify(setup.footerNavigation || []);
                    sourceHtml = sourceHtml.replace(/{{HEADER_NAV}}/g, headerNavStr);
                    sourceHtml = sourceHtml.replace(/{{FOOTER_NAV}}/g, footerNavStr);

                    return r.respond({
                        status: 200,
                        contentType: 'text/html',
                        body: sourceHtml
                    });
                }

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
    console.log(`✅ Build Complete! Preview your /dist folder.`);
}

runBuild();
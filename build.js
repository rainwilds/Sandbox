const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function runBuild() {
    console.log('🚀 Starting Cross-Platform 2026 Build Engine...');
    
    const distPath = path.join(__dirname, 'dist');
    const assetsToCopy = ['img', 'video', 'fonts', 'js', 'JSON', 'styles.css', 'custom.css', 'robots.txt', 'sitemap.xml', 'llms.txt'];

    if (fs.existsSync(distPath)) fs.rmSync(distPath, { recursive: true, force: true });
    fs.mkdirSync(distPath);

    const pagesToBuild = fs.readdirSync(__dirname).filter(file => 
        file.endsWith('.html') && !file.startsWith('_')
    );

    // ASSET SYNC
    assetsToCopy.forEach(asset => {
        const src = path.join(__dirname, asset);
        const dest = path.join(distPath, asset);
        if (fs.existsSync(src)) fs.cpSync(src, dest, { recursive: true });
    });

    // --- CROSS-PLATFORM PUPPETEER LAUNCH ---
    const browser = await puppeteer.launch({ 
        headless: "new",
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage', // Essential for Linux stability
            '--font-render-hinting=none' // Prevents font jank on Linux
        ]
    });

    for (const file of pagesToBuild) {
        try {
            const page = await browser.newPage();

            await page.setRequestInterception(true);
            page.on('request', request => {
                let url = request.url();
                if (url.includes('/Sandbox/')) url = url.replace('/Sandbox/', '/');
                request.continue({ url });
            });

            console.log(`  -> Finalizing: ${file}`);
            await page.goto(`http://localhost:5500/${file}`, { waitUntil: 'networkidle0' });

            // Selective Flattening
            await page.evaluate(() => {
                const contentBlocks = document.querySelectorAll('custom-block, bh-img');
                contentBlocks.forEach(el => {
                    const content = el.innerHTML;
                    el.insertAdjacentHTML('afterend', content);
                    el.remove(); 
                });
            });

            let content = await page.content();
            
            // Final Path Cleaning
            content = content.replace(/\/Sandbox\//g, '/');
            content = content.replace(/\/img\/primary\/img\/primary\//g, '/img/primary/');
            content = content.replace(/\/video\/video\//g, '/video/');

            fs.writeFileSync(path.join(distPath, file), content);
            await page.close();
        } catch (err) {
            console.error(`  ❌ Failed ${file}:`, err.message);
        }
    }

    await browser.close();
    console.log('✅ Build Complete! Preview using port 8080.');
}

runBuild();
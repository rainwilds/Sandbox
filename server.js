const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = process.env.PORT || 3000;
const SECRET_TOKEN = 'rainwilds-builder-2026';
const SRC_DIR = path.join(__dirname, 'src');
const BLOG_DIR = path.join(SRC_DIR, 'blog');
const PAGES_DIR = path.join(SRC_DIR, 'pages');
const JSON_DIR = path.join(SRC_DIR, 'JSON');
const TEMPLATES_FILE = path.join(JSON_DIR, 'templates.json');
const GLOBAL_PARTS_FILE = path.join(JSON_DIR, 'global-parts.json'); // NEW: Centralized global components

if (!fs.existsSync(BLOG_DIR)) fs.mkdirSync(BLOG_DIR, { recursive: true });
if (!fs.existsSync(PAGES_DIR)) fs.mkdirSync(PAGES_DIR, { recursive: true });
if (!fs.existsSync(JSON_DIR)) fs.mkdirSync(JSON_DIR, { recursive: true });
if (!fs.existsSync(GLOBAL_PARTS_FILE)) fs.writeFileSync(GLOBAL_PARTS_FILE, JSON.stringify({}));

const server = http.createServer((req, res) => {
    // 1. Set CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // 2. Handle Pre-flight
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        return res.end();
    }

    // 3. Handle GET: List Components
    if (req.method === 'GET' && req.url === '/api/list-components') {
        const componentsPath = path.join(SRC_DIR, 'js', 'components');
        try {
            const files = fs.readdirSync(componentsPath);
            const componentTags = files
                .filter(file => file.endsWith('.js') && file !== 'interactive-controller.js')
                .map(file => file.replace('.js', ''));

            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify(componentTags));
        } catch (err) {
            res.writeHead(500);
            return res.end(JSON.stringify({ error: 'Could not read components' }));
        }
    }

    // --- NEW: CMS DASHBOARD ROUTES ---
    // 3.5 Handle GET: Load Global Templates
    if (req.method === 'GET' && req.url === '/api/templates') {
        if (fs.existsSync(TEMPLATES_FILE)) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(fs.readFileSync(TEMPLATES_FILE, 'utf8'));
        } else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({})); // Return empty object if no templates exist yet
        }
    }

    // 3.5.5 Handle GET: Load Global Parts
    if (req.method === 'GET' && req.url === '/api/global-parts') {
        if (fs.existsSync(GLOBAL_PARTS_FILE)) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(fs.readFileSync(GLOBAL_PARTS_FILE, 'utf8'));
        } else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({}));
        }
    }

    // 3.6 Handle GET: List All Content (Combines Pages and Posts manifests)
    if (req.method === 'GET' && req.url === '/api/list-content') {
        try {
            let combinedManifest = [];

            // Read Pages
            const pagesManifestPath = path.join(PAGES_DIR, 'manifest.json');
            if (fs.existsSync(pagesManifestPath)) {
                const pages = JSON.parse(fs.readFileSync(pagesManifestPath, 'utf8'));
                // Ensure the type is explicitly set for older entries
                pages.forEach(p => p.type = 'page');
                combinedManifest = combinedManifest.concat(pages);
            }

            // Read Posts
            const blogManifestPath = path.join(BLOG_DIR, 'manifest.json');
            if (fs.existsSync(blogManifestPath)) {
                const posts = JSON.parse(fs.readFileSync(blogManifestPath, 'utf8'));
                // Ensure the type is explicitly set for older entries
                posts.forEach(p => p.type = 'post');
                combinedManifest = combinedManifest.concat(posts);
            }

            // Sort everything by date descending (newest first)
            combinedManifest.sort((a, b) => new Date(b.date) - new Date(a.date));

            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify(combinedManifest));
        } catch (err) {
            console.error("❌ Error reading manifests:", err);
            res.writeHead(500);
            return res.end(JSON.stringify({ error: 'Could not load content list' }));
        }
    }

    // 3.7 Handle GET: Load Specific Post/Page JSON
    if (req.method === 'GET' && req.url.startsWith('/api/load-post')) {
        try {
            // Native Node URL parsing to grab query parameters like ?slug=foo&type=page
            const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
            const slug = parsedUrl.searchParams.get('slug');
            const type = parsedUrl.searchParams.get('type') || 'post';

            if (!slug) {
                res.writeHead(400);
                return res.end(JSON.stringify({ error: 'Slug is required' }));
            }

            // Route to the correct directory based on type
            const targetDir = type === 'page' ? PAGES_DIR : BLOG_DIR;
            const jsonPath = path.join(targetDir, `${slug}.json`);

            if (fs.existsSync(jsonPath)) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                return res.end(fs.readFileSync(jsonPath, 'utf8'));
            } else {
                res.writeHead(404);
                return res.end(JSON.stringify({ error: 'Content not found' }));
            }
        } catch (err) {
            console.error("❌ Error loading post:", err);
            res.writeHead(500);
            return res.end(JSON.stringify({ error: 'Could not load content' }));
        }
    }

    // 3.8 Handle GET: List Primary Images
    if (req.method === 'GET' && req.url === '/api/images') {
        const imgPath = path.join(SRC_DIR, 'img', 'primary');
        try {
            if (!fs.existsSync(imgPath)) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify([]));
            }

            const files = fs.readdirSync(imgPath);
            // Filter to ensure we only send image files
            const images = files.filter(file => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(file));

            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify(images));
        } catch (err) {
            console.error("❌ Error reading images:", err);
            res.writeHead(500);
            return res.end(JSON.stringify({ error: 'Could not list images' }));
        }
    }

    // 4. Handle POST: Save and Publish
    if (req.method === 'POST') {
        let body = '';

        // 👈 FIX 2: Added the data listener back so 'data' exists!
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            let data;
            try {
                data = JSON.parse(body);
            } catch (err) {
                res.writeHead(400);
                return res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
            }

            // ROUTE: SAVE TEMPLATES
            if (req.url === '/api/templates') {
                fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(data, null, 2));
                console.log(`✅ Global templates saved!`);
                res.writeHead(200);
                return res.end(JSON.stringify({ message: 'Templates saved!' }));
            }

            // ROUTE: SAVE GLOBAL PARTS
            if (req.url === '/api/global-parts') {
                fs.writeFileSync(GLOBAL_PARTS_FILE, JSON.stringify(data, null, 2));
                console.log(`✅ Global parts saved!`);
                res.writeHead(200);
                return res.end(JSON.stringify({ message: 'Global parts saved!' }));
            }

            // ROUTE: SAVE
            if (req.url === '/api/save-post') {
                const { contentType, slug, title, date, categories, excerpt, featuredImage, builderState } = data; console.log(`💾 Saving ${contentType.toUpperCase()}: ${slug}...`);

                // Determine target directory based on content type
                const targetDir = contentType === 'page' ? PAGES_DIR : BLOG_DIR;
                fs.writeFileSync(path.join(targetDir, `${slug}.json`), JSON.stringify(builderState, null, 2));

                const manifestPath = path.join(targetDir, 'manifest.json');
                let manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : [];
                manifest = manifest.filter(p => p.slug !== slug);
                manifest.push({ slug, title, date, categories, excerpt, featuredImage, type: contentType });
                manifest.sort((a, b) => new Date(b.date) - new Date(a.date));
                fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

                console.log(`✅ Saved ${slug}.json to ${targetDir}`);
                res.writeHead(200);
                return res.end(JSON.stringify({ message: 'Saved!' }));
            }

            // ROUTE: PUBLISH
            else if (req.url === '/api/publish') {
                const { slug, contentType, globalSync } = data;
                
                // If globalSync is true, rebuild the ENTIRE site
                if (globalSync) {
                    console.log(`🚀 Global Sync Triggered! Rebuilding entire site...`);
                    exec(`node build.js`, (error, stdout, stderr) => {
                        if (error) {
                            console.error(`❌ Build Error: ${error.message}`);
                            res.writeHead(500);
                            return res.end(JSON.stringify({ error: 'Global sync failed' }));
                        }
                        console.log(`✅ Global Sync Complete!`);
                        res.writeHead(200);
                        return res.end(JSON.stringify({ message: 'Site synced!' }));
                    });
               } else {
                    console.log(`🚀 Publishing HTML: ${slug}...`);

                    // Pass the type flag to the build script
                    const typeFlag = contentType ? `--type=${contentType}` : '--type=post';

                    exec(`node build.js --slug=${slug} ${typeFlag}`, (error, stdout, stderr) => {
                        if (error) {
                            console.error(`❌ Build Error: ${error.message}`);
                            res.writeHead(500);
                            return res.end(JSON.stringify({ error: 'Build failed' }));
                        }
                        console.log(`✅ Build Success: ${slug}`);
                        res.writeHead(200);
                        return res.end(JSON.stringify({ message: 'Published!' }));
                    });
                } // <--- THIS WAS THE MISSING BRACKET!
            } else {
                res.writeHead(404);
                return res.end(JSON.stringify({ error: 'Endpoint not found' }));
            }
        });
    }
});

// Final Step: Listen
server.listen(PORT, () => console.log(`🚀 CMS running on http://localhost:${PORT}`));
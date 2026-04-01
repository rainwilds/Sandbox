const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = process.env.PORT || 3000;
const SECRET_TOKEN = 'rainwilds-builder-2026';
const SRC_DIR = path.join(__dirname, 'src');
const BLOG_DIR = path.join(SRC_DIR, 'blog');
const PAGES_DIR = path.join(SRC_DIR, 'pages'); // 👈 FIX 1: Added missing directory definition

if (!fs.existsSync(BLOG_DIR)) fs.mkdirSync(BLOG_DIR, { recursive: true });
if (!fs.existsSync(PAGES_DIR)) fs.mkdirSync(PAGES_DIR, { recursive: true });

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

            // ROUTE: SAVE
            if (req.url === '/api/save-post') {
                const { contentType, slug, title, date, categories, excerpt, featuredImage, builderState } = data;
                console.log(`💾 Saving ${contentType.toUpperCase()}: ${slug}...`);

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
                const { slug, contentType } = data;
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
            } else {
                res.writeHead(404);
                return res.end(JSON.stringify({ error: 'Endpoint not found' }));
            }
        });
    }
});

// Final Step: Listen
server.listen(PORT, () => console.log(`🚀 CMS running on http://localhost:${PORT}`));
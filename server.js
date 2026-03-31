const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = process.env.PORT || 3000;
const SECRET_TOKEN = 'rainwilds-builder-2026';
const SRC_DIR = path.join(__dirname, 'src');
const BLOG_DIR = path.join(SRC_DIR, 'blog');

if (!fs.existsSync(BLOG_DIR)) fs.mkdirSync(BLOG_DIR, { recursive: true });

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

    // 3. Handle GET: List Components (No Auth/Body required)
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

    // 4. Handle POST: Save and Publish (Requires Auth)
    if (req.method === 'POST') {
        const authHeader = req.headers['authorization'];
        if (authHeader !== `Bearer ${SECRET_TOKEN}`) {
            res.writeHead(401);
            return res.end(JSON.stringify({ error: 'Unauthorized' }));
        }

        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);

                // ROUTE: SAVE
                if (req.url === '/api/save-post') {
                    const { slug, title, date, categories, excerpt, featuredImage, builderState } = data;
                    console.log(`💾 Saving JSON: ${slug}...`);

                    fs.writeFileSync(path.join(BLOG_DIR, `${slug}.json`), JSON.stringify(builderState, null, 2));

                    const manifestPath = path.join(BLOG_DIR, 'manifest.json');
                    let manifest = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : [];
                    manifest = manifest.filter(p => p.slug !== slug);
                    manifest.push({ slug, title, date, categories, excerpt, featuredImage });
                    manifest.sort((a, b) => new Date(b.date) - new Date(a.date));
                    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

                    console.log(`✅ Saved ${slug}.json`);
                    res.writeHead(200);
                    return res.end(JSON.stringify({ message: 'Saved!' }));
                }

                // ROUTE: PUBLISH
                else if (req.url === '/api/publish') {
                    const { slug } = data;
                    console.log(`🚀 Publishing HTML: ${slug}...`);
                    
                    exec(`node build.js --slug=${slug}`, (error, stdout, stderr) => {
                        if (error) {
                            console.error(`❌ Build Error: ${error.message}`);
                            res.writeHead(500);
                            return res.end(JSON.stringify({ error: 'Build failed' }));
                        }
                        console.log(`✅ Build Success: ${slug}`);
                        res.writeHead(200);
                        return res.end(JSON.stringify({ message: 'Published!' }));
                    });
                }
                else {
                    res.writeHead(404);
                    res.end(JSON.stringify({ error: 'Not found' }));
                }
            } catch (e) {
                res.writeHead(400);
                res.end(JSON.stringify({ error: 'Invalid JSON data' }));
            }
        });
    } else if (req.method !== 'GET') {
        res.writeHead(405);
        res.end(JSON.stringify({ error: 'Method not allowed' }));
    }
});

// Final Step: Listen (Outside the createServer callback)
server.listen(PORT, () => console.log(`🚀 CMS running on http://localhost:${PORT}`));
const http = require('http');
const fs = require('fs');
const path = require('path');

// --- Configuration ---
const PORT = process.env.PORT || 3000;
const SECRET_TOKEN = 'rainwilds-builder-2026'; // IMPORTANT: Change this to a secure password later
const SRC_DIR = path.join(__dirname, 'src');
const BLOG_DIR = path.join(SRC_DIR, 'blog');

// Ensure the blog directory exists
if (!fs.existsSync(BLOG_DIR)) {
    fs.mkdirSync(BLOG_DIR, { recursive: true });
}

const server = http.createServer((req, res) => {
    // 1. CORS Headers (Allows your local visual builder to talk to this server)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        return res.end();
    }

    // 2. Route: Save Post
    if (req.method === 'POST' && req.url === '/api/save-post') {
        // ... (Keep all your existing Save logic here) ...
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            // ... (Your existing Save file and manifest logic) ...
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Post saved successfully!' }));
        });

    }
    // 3. Route: Publish Post (ADD THIS SECTION HERE)
    else if (req.method === 'POST' && req.url === '/api/publish') {
        const authHeader = req.headers['authorization'];
        if (authHeader !== `Bearer ${SECRET_TOKEN}`) {
            res.writeHead(401);
            return res.end(JSON.stringify({ error: 'Unauthorized' }));
        }

        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            try {
                const { slug } = JSON.parse(body);
                console.log(`🚀 Received publish request for: ${slug}`);

                const { exec } = require('child_process');
                // Execute build.js and pass the slug as an argument
                exec(`node build.js --slug=${slug}`, (error, stdout, stderr) => {
                    if (error) {
                        console.error(`❌ Build Error: ${error.message}`);
                        res.writeHead(500);
                        return res.end(JSON.stringify({ error: 'Build failed', details: error.message }));
                    }
                    console.log(`✅ Build successful for ${slug}`);
                    res.writeHead(200);
                    res.end(JSON.stringify({ message: `Published ${slug} successfully!` }));
                });
            } catch (err) {
                res.writeHead(400); res.end(JSON.stringify({ error: 'Invalid payload' }));
            }
        });

    }
    // 4. Fallback for unknown routes
    else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
    }

});

server.listen(PORT, () => {
    console.log(`\n=========================================`);
    console.log(`🚀 Zero-Dependency CMS Backend Running`);
    console.log(`📡 Listening on: http://localhost:${PORT}`);
    console.log(`=========================================\n`);
});
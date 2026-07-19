const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 31415;
// Target log file in the parent directory as requested by the user
const LOG_FILE = path.join(__dirname, '..', 'drive-sync.log');

const server = http.createServer((req, res) => {
    // Add CORS headers to allow requests from the browser extension
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.method === 'POST' && req.url === '/log') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });

        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const timestamp = new Date().toISOString();
                
                // Format the log line
                let logLine = `[${timestamp}] [Drive API] - URL: ${data.url} - Success: ${data.success} - Status: ${data.status}`;
                if (data.error) {
                    logLine += ` - Error: ${data.error}`;
                }
                logLine += '\n';

                // Append to the log file
                fs.appendFile(LOG_FILE, logLine, (err) => {
                    if (err) {
                        console.error('Failed to write to log file:', err);
                        res.writeHead(500);
                        res.end(JSON.stringify({ success: false, error: 'Failed to write log' }));
                    } else {
                        console.log('Logged:', logLine.trim());
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ success: true }));
                    }
                });
            } catch (err) {
                console.error('Invalid JSON received:', err);
                res.writeHead(400);
                res.end(JSON.stringify({ success: false, error: 'Bad Request' }));
            }
        });
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

server.listen(PORT, () => {
    console.log(`SideKick Logger Server is running on http://localhost:${PORT}`);
    console.log(`Logging to: ${LOG_FILE}`);
});

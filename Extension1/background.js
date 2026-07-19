chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'FETCH_DRIVE_API') {
        const fetchOptions = {
            method: message.method || 'GET',
            headers: message.headers || {}
        };
        
        if (message.body) {
            fetchOptions.body = message.body;
        }
        
        fetch(message.url, fetchOptions)
        .then(async r => {
            const status = r.status;
            const text = await r.text();
            
            // Log connection attempt
            logToLocalServer(message.url, r.ok, status, r.ok ? null : text);
            
            sendResponse({ success: r.ok, status, text });
        })
        .catch(err => {
            // Log failure
            logToLocalServer(message.url, false, 0, err.message);
            
            sendResponse({ success: false, error: err.message });
        });
        return true; // Keep message channel open for async sendResponse
    }
});

// Helper function to send log to the local server
function logToLocalServer(url, success, status, error = null) {
    const payload = { url, success, status, error };
    fetch('http://localhost:31415/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }).catch(err => console.error("Logging server failed:", err));
}

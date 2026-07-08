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
            sendResponse({ success: r.ok, status, text });
        })
        .catch(err => {
            sendResponse({ success: false, error: err.message });
        });
        return true; // Keep message channel open for async sendResponse
    }
});

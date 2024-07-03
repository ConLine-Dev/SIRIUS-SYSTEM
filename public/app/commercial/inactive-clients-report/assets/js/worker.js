self.addEventListener('message', async (event) => {
    const { url, method, body } = event.data;
    
    try {
        const response = await fetch(url, {
            method: method || 'GET',
            headers: { 'Content-Type': 'application/json' },
            body: body ? JSON.stringify(body) : null
        });
        const data = await response.json();
        self.postMessage({ status: 'success', data });
    } catch (error) {
        self.postMessage({ status: 'error', error: error.message });
    }
});

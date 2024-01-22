async function makeRequest(url, method = 'GET', body = null) {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json', // Pode ser ajustado conforme suas necessidades
      },
    };
  
    if (body) {
      if (method === 'GET') {
        console.warn('GET request does not support a request body.');
      } else {
        options.body = JSON.stringify(body);
      }
    }
  
    try {
      const response = await fetch(url, options);
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }
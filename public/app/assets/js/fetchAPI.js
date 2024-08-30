async function makeRequest(url, method = 'GET', body = null) {
  const options = {
    method,
    headers: {}
  };

  if (body) {
    if (method === 'GET') {
      console.warn('GET request does not support a request body.');
    } else {
      // Se body for uma instância de FormData, não defina o Content-Type
      if (body instanceof FormData) {
        options.body = body;
        // O fetch automaticamente definirá o Content-Type como multipart/form-data
      } else {
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(body);
      }
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

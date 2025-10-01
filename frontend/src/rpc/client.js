const SERVER_URL = 'http://localhost:8443';
const TIMEOUT_MS = 10000;
const MAX_RETRIES = 3;

class RpcClient {
  constructor(endpoint = SERVER_URL) {
    this.endpoint = endpoint;
  }

  async call(method, params = {}, retries = 0) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const url = `${this.endpoint}${method}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error.name === 'AbortError') {
        if (retries < MAX_RETRIES) {
          return this.call(method, params, retries + 1);
        }
        throw new Error('Request timeout after retries');
      }

      if (error.message.includes('fetch') || error.message.includes('network')) {
        if (retries < MAX_RETRIES) {
          return this.call(method, params, retries + 1);
        }
        throw new Error('Network error after retries');
      }

      throw error;
    }
  }

  async health() {
    const response = await fetch(`${this.endpoint}/health`);
    if (!response.ok) {
      throw new Error(`Health check failed: ${response.status}`);
    }
    return response.json();
  }
}

export default RpcClient;

const SERVER_URL = window.ENV?.SERVER_URL || 'http://173.249.60.72:8443';
const TIMEOUT_MS = 10000;
const MAX_RETRIES = 3;

class RpcClient {
  constructor(endpoint = SERVER_URL) {
    this.endpoint = endpoint;
    this.requestId = 1;
  }

  async call(method, params = {}, retries = 0) {
    const payload = {
      jsonrpc: '2.0',
      id: this.requestId++,
      method,
      params
    };

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const response = await fetch(`${this.endpoint}/rpc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.error) {
          throw new Error(errorData.error.message || 'RPC Error');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        const error = new Error(data.error.message || 'RPC Error');
        error.code = data.error.code;
        error.data = data.error.data;
        throw error;
      }

      return data.result;
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
    return this.call('health');
  }
}

export default RpcClient;

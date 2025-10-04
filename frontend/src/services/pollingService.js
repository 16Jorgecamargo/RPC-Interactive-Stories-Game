export class PollingService {
  constructor(pollingFunction, interval = 2000, backoffMultiplier = 1.5, maxInterval = 30000) {
    this.pollingFunction = pollingFunction;
    this.interval = interval;
    this.baseInterval = interval;
    this.backoffMultiplier = backoffMultiplier;
    this.maxInterval = maxInterval;
    this.isPolling = false;
    this.timeoutId = null;
  }

  start() {
    if (this.isPolling) return;
    this.isPolling = true;
    this.interval = this.baseInterval;
    this.poll();
  }

  stop() {
    this.isPolling = false;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  reset() {
    this.interval = this.baseInterval;
  }

  async poll() {
    if (!this.isPolling) return;

    try {
      const hasUpdate = await this.pollingFunction();
      
      if (hasUpdate) {
        this.reset();
      } else {
        this.interval = Math.min(this.interval * this.backoffMultiplier, this.maxInterval);
      }
    } catch (error) {
      console.error('Polling error:', error);
      this.interval = Math.min(this.interval * this.backoffMultiplier, this.maxInterval);
    }

    if (this.isPolling) {
      this.timeoutId = setTimeout(() => this.poll(), this.interval);
    }
  }
}

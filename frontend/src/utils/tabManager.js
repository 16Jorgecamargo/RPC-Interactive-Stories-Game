const TAB_ID_KEY = 'rpc_active_tab_id';
const TAB_HEARTBEAT_KEY = 'rpc_tab_heartbeat';
const HEARTBEAT_INTERVAL = 2000; 
const HEARTBEAT_TIMEOUT = 5000; 

class TabManager {
  constructor() {
    this.tabId = this.generateTabId();
    this.isLeader = false;
    this.heartbeatInterval = null;
    this.checkInterval = null;
    this.onBlockedCallback = null;
    this.onUnblockedCallback = null;
  }

  generateTabId() {
    return `tab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  init(onBlocked, onUnblocked) {
    this.onBlockedCallback = onBlocked;
    this.onUnblockedCallback = onUnblocked;

    this.tryBecomeLeader();

    window.addEventListener('storage', this.handleStorageChange.bind(this));

    this.checkInterval = setInterval(() => {
      this.checkLeadership();
    }, 1000);

    if (this.isLeader) {
      this.startHeartbeat();
    }

    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });

    console.log(`[TAB MANAGER] Aba inicializada: ${this.tabId}, Líder: ${this.isLeader}`);
  }

  tryBecomeLeader() {
    const currentLeader = localStorage.getItem(TAB_ID_KEY);
    const lastHeartbeat = localStorage.getItem(TAB_HEARTBEAT_KEY);

    if (currentLeader && lastHeartbeat) {
      const timeSinceHeartbeat = Date.now() - parseInt(lastHeartbeat);
      
      if (timeSinceHeartbeat < HEARTBEAT_TIMEOUT) {
        this.isLeader = false;
        if (this.onBlockedCallback) {
          this.onBlockedCallback();
        }
        return;
      }
    }

    localStorage.setItem(TAB_ID_KEY, this.tabId);
    localStorage.setItem(TAB_HEARTBEAT_KEY, Date.now().toString());
    this.isLeader = true;
    this.startHeartbeat();

    if (this.onUnblockedCallback) {
      this.onUnblockedCallback();
    }
  }

  checkLeadership() {
    const currentLeader = localStorage.getItem(TAB_ID_KEY);

    if (this.isLeader && currentLeader !== this.tabId) {
      console.log(`[TAB MANAGER] Perdi a liderança para ${currentLeader}`);
      this.isLeader = false;
      this.stopHeartbeat();
      
      if (this.onBlockedCallback) {
        this.onBlockedCallback();
      }
    }

    if (this.isLeader) {
      localStorage.setItem(TAB_HEARTBEAT_KEY, Date.now().toString());
    }

    if (!this.isLeader) {
      const lastHeartbeat = localStorage.getItem(TAB_HEARTBEAT_KEY);
      if (lastHeartbeat) {
        const timeSinceHeartbeat = Date.now() - parseInt(lastHeartbeat);
        if (timeSinceHeartbeat > HEARTBEAT_TIMEOUT) {
          console.log('[TAB MANAGER] Líder morto detectado, assumindo liderança');
          this.tryBecomeLeader();
        }
      }
    }
  }

  handleStorageChange(event) {
    if (event.key === TAB_ID_KEY) {
      const newLeader = event.newValue;
      
      if (newLeader !== this.tabId && this.isLeader) {
        console.log(`[TAB MANAGER] Outra aba assumiu liderança: ${newLeader}`);
        this.isLeader = false;
        this.stopHeartbeat();
        
        if (this.onBlockedCallback) {
          this.onBlockedCallback();
        }
      }
    }
  }

  startHeartbeat() {
    if (this.heartbeatInterval) return;

    this.heartbeatInterval = setInterval(() => {
      if (this.isLeader) {
        localStorage.setItem(TAB_HEARTBEAT_KEY, Date.now().toString());
      }
    }, HEARTBEAT_INTERVAL);
  }

  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  cleanup() {
    if (this.isLeader) {
      const currentLeader = localStorage.getItem(TAB_ID_KEY);
      if (currentLeader === this.tabId) {
        localStorage.removeItem(TAB_ID_KEY);
        localStorage.removeItem(TAB_HEARTBEAT_KEY);
        console.log('[TAB MANAGER] Líder saiu, liderança liberada');
      }
    }

    this.stopHeartbeat();
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  getTabId() {
    return this.tabId;
  }

  isLeaderTab() {
    return this.isLeader;
  }
}

const tabManager = new TabManager();
export default tabManager;

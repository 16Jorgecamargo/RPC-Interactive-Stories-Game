import RpcClient from '../rpc/client.js';
import { getToken } from '../utils/auth.js';

/**
 * Serviço unificado de long polling que gerencia múltiplas verificações simultâneas:
 * - Mensagens novas nos chats
 * - Jogadores entrando/saindo das sessões
 * - Status das sessões
 * - Criação de personagens
 * - Status online/offline dos jogadores
 * - Atualizações na home (número de jogadores, última atividade, etc)
 */
export class UnifiedPollingService {
  constructor() {
    this.client = new RpcClient();
    this.pollers = new Map(); // Map<pollerId, PollerConfig>
    this.intervals = new Map(); // Map<pollerId, intervalId>
    this.lastIds = new Map(); // Map<pollerId, lastId>
    this.callbacks = new Map(); // Map<pollerId, callback>
    this.isActive = false;
  }

  /**
   * Inicia polling para mensagens de chat
   * @param {string} sessionId - ID da sessão
   * @param {function} callback - Função chamada quando há novas mensagens
   * @param {number} interval - Intervalo em ms (padrão: 5000)
   */
  startChatPolling(sessionId, callback, interval = 5000) {
    const pollerId = `chat_${sessionId}`;
    
    this.callbacks.set(pollerId, callback);
    
    const pollFunction = async () => {
      try {
        const token = getToken();
        const lastMessageId = this.lastIds.get(pollerId);
        
        const result = await this.client.call('checkMessages', {
          token,
          sessionId,
          lastMessageId
        });

        if (result.messages && result.messages.length > 0) {
          // Atualiza último ID
          const lastMsg = result.messages[result.messages.length - 1];
          this.lastIds.set(pollerId, lastMsg.id);
          
          // Chama callback com mensagens novas
          callback({
            type: 'NEW_MESSAGES',
            data: result.messages
          });
          
          return true; // Indica que houve atualização
        }
        
        return false;
      } catch (error) {
        console.error('Erro no polling de chat:', error);
        return false;
      }
    };

    this._startPoller(pollerId, pollFunction, interval);
  }

  /**
   * Inicia polling para atualizações de sessão (jogadores, status, personagens)
   * @param {string} sessionId - ID da sessão
   * @param {function} callback - Função chamada quando há atualizações
   * @param {number} interval - Intervalo em ms (padrão: 2000 para responsividade em tempo real)
   */
  startSessionPolling(sessionId, callback, interval = 2000) {
    const pollerId = `session_${sessionId}`;

    this.callbacks.set(pollerId, callback);

    const pollFunction = async () => {
      try {
        const token = getToken();
        const lastUpdateId = this.lastIds.get(pollerId);

        const result = await this.client.call('checkGameUpdates', {
          token,
          sessionId,
          lastUpdateId
        });

        if (result.updates && result.updates.length > 0) {
          // Atualiza último ID
          this.lastIds.set(pollerId, result.lastUpdateId);

          // Processa cada tipo de atualização
          result.updates.forEach(update => {
            callback({
              type: update.type,
              data: update.data,
              timestamp: update.timestamp
            });
          });

          return true;
        }

        return false;
      } catch (error) {
        console.error('Erro no polling de sessão:', error);
        return false;
      }
    };

    this._startPoller(pollerId, pollFunction, interval);
  }

  /**
   * Inicia polling de heartbeat (mantém status online)
   * @param {string} sessionId - ID da sessão
   * @param {number} interval - Intervalo em ms (padrão: 10000)
   */
  startHeartbeat(sessionId, interval = 10000) {
    const pollerId = `heartbeat_${sessionId}`;
    
    const pollFunction = async () => {
      try {
        const token = getToken();
        
        await this.client.call('updatePlayerStatus', {
          token,
          sessionId
        });
        
        return false; // Heartbeat não precisa resetar backoff
      } catch (error) {
        console.error('Erro no heartbeat:', error);
        return false;
      }
    };

    this._startPoller(pollerId, pollFunction, interval, false); // Sem backoff para heartbeat
  }

  /**
   * Inicia polling para lista de sessões na home
   * @param {function} callback - Função chamada quando há atualizações
   * @param {number} interval - Intervalo em ms (padrão: 15000)
   */
  startHomePolling(callback, interval = 15000) {
    const pollerId = 'home_sessions';
    
    this.callbacks.set(pollerId, callback);
    
    const pollFunction = async () => {
      try {
        const token = getToken();
        
        const result = await this.client.call('listMySessions', { token });
        
        // Callback recebe lista atualizada
        callback({
          type: 'SESSIONS_UPDATE',
          data: result.sessions
        });
        
        return false; // Home polling não precisa de backoff agressivo
      } catch (error) {
        console.error('Erro no polling da home:', error);
        return false;
      }
    };

    this._startPoller(pollerId, pollFunction, interval, false);
  }

  /**
   * Inicia polling para detalhes de uma sessão específica
   * @param {string} sessionId - ID da sessão
   * @param {function} callback - Função chamada quando há atualizações
   * @param {number} interval - Intervalo em ms (padrão: 5000)
   */
  startSessionDetailsPolling(sessionId, callback, interval = 5000) {
    const pollerId = `details_${sessionId}`;
    
    this.callbacks.set(pollerId, callback);
    
    const pollFunction = async () => {
      try {
        const token = getToken();
        
        const result = await this.client.call('getSessionDetails', {
          token,
          sessionId
        });
        
        // Callback recebe detalhes atualizados
        callback({
          type: 'SESSION_DETAILS_UPDATE',
          data: result.session
        });
        
        return false;
      } catch (error) {
        console.error('Erro no polling de detalhes:', error);
        return false;
      }
    };

    this._startPoller(pollerId, pollFunction, interval, false);
  }

  /**
   * Para um poller específico
   * @param {string} pollerId - ID do poller
   */
  stopPoller(pollerId) {
    const intervalId = this.intervals.get(pollerId);
    if (intervalId) {
      clearInterval(intervalId);
      this.intervals.delete(pollerId);
      this.callbacks.delete(pollerId);
      this.lastIds.delete(pollerId);
      this.pollers.delete(pollerId);
    }
  }

  /**
   * Para todos os pollers de uma sessão
   * @param {string} sessionId - ID da sessão
   */
  stopSessionPollers(sessionId) {
    this.stopPoller(`chat_${sessionId}`);
    this.stopPoller(`session_${sessionId}`);
    this.stopPoller(`heartbeat_${sessionId}`);
    this.stopPoller(`details_${sessionId}`);
  }

  /**
   * Para todos os pollers ativos
   */
  stopAll() {
    this.intervals.forEach((intervalId) => {
      clearInterval(intervalId);
    });
    
    this.intervals.clear();
    this.callbacks.clear();
    this.lastIds.clear();
    this.pollers.clear();
    this.isActive = false;
  }

  /**
   * Verifica se um poller está ativo
   * @param {string} pollerId - ID do poller
   * @returns {boolean}
   */
  isPollerActive(pollerId) {
    return this.intervals.has(pollerId);
  }

  /**
   * Retorna estatísticas dos pollers ativos
   * @returns {object}
   */
  getStats() {
    return {
      activePollers: this.intervals.size,
      pollers: Array.from(this.intervals.keys())
    };
  }

  // Método privado para iniciar um poller
  _startPoller(pollerId, pollFunction, interval, useBackoff = true) {
    // Para poller existente se houver
    this.stopPoller(pollerId);
    
    let currentInterval = interval;
    const baseInterval = interval;
    const maxInterval = 30000;
    const backoffMultiplier = 1.5;
    
    const poll = async () => {
      const hasUpdate = await pollFunction();
      
      if (useBackoff) {
        if (hasUpdate) {
          // Reset para intervalo base quando há atualização
          currentInterval = baseInterval;
        } else {
          // Aumenta intervalo quando não há atualização
          currentInterval = Math.min(
            currentInterval * backoffMultiplier,
            maxInterval
          );
        }
      }
    };
    
    // Primeira execução imediata
    poll();
    
    // Configurar intervalo
    const intervalId = setInterval(poll, interval);
    this.intervals.set(pollerId, intervalId);
    this.pollers.set(pollerId, {
      pollFunction,
      interval,
      useBackoff,
      startedAt: new Date().toISOString()
    });
    
    this.isActive = true;
  }
}

// Instância singleton
export const unifiedPolling = new UnifiedPollingService();

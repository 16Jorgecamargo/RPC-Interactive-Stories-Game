import { v4 as uuidv4 } from 'uuid';
import * as eventStore from '../stores/event_store.js';
import * as sessionStore from '../stores/session_store.js';
import { logInfo, logError } from './logger.js';
import type { GameUpdate } from '../models/update_schemas.js';
import type { Participant } from '../models/session_schemas.js';

const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;
const OLD_UPDATES_HOURS = 24;
const OLD_EVENTS_DAYS = 30;

const HEARTBEAT_CHECK_INTERVAL_MS = 60 * 1000;
const OFFLINE_THRESHOLD_MS = 5 * 60 * 1000;

export function startCleanupScheduler() {
  logInfo('[SCHEDULER] Iniciando limpeza periódica de dados antigos');

  setInterval(() => {
    try {
      const deletedUpdates = eventStore.clearOldUpdates(OLD_UPDATES_HOURS);
      if (deletedUpdates > 0) {
        logInfo('[SCHEDULER] Updates antigos removidos', { count: deletedUpdates });
      }

      const deletedEvents = eventStore.clearOldEvents(OLD_EVENTS_DAYS);
      if (deletedEvents > 0) {
        logInfo('[SCHEDULER] Eventos antigos removidos', { count: deletedEvents });
      }
    } catch (error) {
      logError(error, { context: 'cleanup scheduler' });
    }
  }, CLEANUP_INTERVAL_MS);

  logInfo('[SCHEDULER] Limpeza agendada', {
    intervalMinutes: CLEANUP_INTERVAL_MS / 1000 / 60,
  });
}

export function startHeartbeatChecker() {
  logInfo('[SCHEDULER] Iniciando verificação de heartbeat');

  setInterval(() => {
    try {
      checkOfflinePlayers();
    } catch (error) {
      logError(error, { context: 'heartbeat checker' });
    }
  }, HEARTBEAT_CHECK_INTERVAL_MS);

  logInfo('[SCHEDULER] Heartbeat verificado', {
    intervalSeconds: HEARTBEAT_CHECK_INTERVAL_MS / 1000,
  });
}

function checkOfflinePlayers() {
  const now = Date.now();
  const sessions = sessionStore.findAll();

  sessions.forEach((session) => {
    if (session.status === 'COMPLETED') {
      return;
    }

    let hasChanges = false;
    const updates: GameUpdate[] = [];

    session.participants.forEach((participant: Participant) => {
      if (!participant.isOnline) {
        return;
      }

      if (!participant.lastActivity) {
        return;
      }

      const lastActivityTime = new Date(participant.lastActivity).getTime();
      const timeSinceLastActivity = now - lastActivityTime;

      if (timeSinceLastActivity > OFFLINE_THRESHOLD_MS) {
        participant.isOnline = false;
        hasChanges = true;

        const disconnectUpdate: GameUpdate = {
          id: `update_${uuidv4()}`,
          type: 'PLAYER_LEFT',
          timestamp: new Date().toISOString(),
          sessionId: session.id,
          data: {
            userId: participant.userId,
            reason: 'timeout',
            lastActivity: participant.lastActivity,
          },
        };
        updates.push(disconnectUpdate);
      }
    });

    if (hasChanges) {
      sessionStore.updateSession(session.id, {
        participants: session.participants,
      });

      updates.forEach((update) => {
        eventStore.addUpdate(update);
      });

      logInfo('[SCHEDULER] Jogadores marcados como offline', {
        sessionId: session.id,
        count: updates.length,
      });
    }
  });
}

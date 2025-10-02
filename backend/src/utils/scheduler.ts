import * as eventStore from '../stores/event_store.js';

const CLEANUP_INTERVAL_MS = 60 * 60 * 1000;
const OLD_UPDATES_HOURS = 24;
const OLD_EVENTS_DAYS = 30;

export function startCleanupScheduler() {
  console.log('[Scheduler] Iniciando limpeza periódica de dados antigos...');

  setInterval(() => {
    try {
      const deletedUpdates = eventStore.clearOldUpdates(OLD_UPDATES_HOURS);
      if (deletedUpdates > 0) {
        console.log(`[Scheduler] ${deletedUpdates} updates antigos removidos`);
      }

      const deletedEvents = eventStore.clearOldEvents(OLD_EVENTS_DAYS);
      if (deletedEvents > 0) {
        console.log(`[Scheduler] ${deletedEvents} eventos antigos removidos`);
      }
    } catch (error) {
      console.error('[Scheduler] Erro ao limpar dados antigos:', error);
    }
  }, CLEANUP_INTERVAL_MS);

  console.log(
    `[Scheduler] Limpeza agendada a cada ${CLEANUP_INTERVAL_MS / 1000 / 60} minutos`
  );
}

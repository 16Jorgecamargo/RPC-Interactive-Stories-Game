// Sistema de Dialogs Customizados - Ponto de Entrada Principal
import { DialogManager } from './DialogManager.js';
import { showSuccess } from './SuccessDialog.js';
import { showError } from './ErrorDialog.js';
import { showStoryCatalog } from './StoryCatalogDialog.js';
import { showJoinSession } from './JoinSessionDialog.js';

// Criar instância do DialogManager
const manager = new DialogManager();

// Adicionar métodos ao manager
manager.showSuccess = (config) => showSuccess(manager, config);
manager.showError = (config) => showError(manager, config);
manager.showStoryCatalog = (config) => showStoryCatalog(manager, config);
manager.showJoinSession = (config) => showJoinSession(manager, config);

// Exportar singleton instance
export const dialogManager = manager;

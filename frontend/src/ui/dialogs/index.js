import { DialogManager } from './DialogManager.js';
import { showSuccess } from './SuccessDialog.js';
import { showError } from './ErrorDialog.js';
import { showStoryCatalog } from './StoryCatalogDialog.js';
import { showJoinSession } from './JoinSessionDialog.js';
import { showStoryInfo } from './StoryInfoDialog.js';

const manager = new DialogManager();

manager.showSuccess = (config) => showSuccess(manager, config);
manager.showError = (config) => showError(manager, config);
manager.showStoryCatalog = (config) => showStoryCatalog(manager, config);
manager.showJoinSession = (config) => showJoinSession(manager, config);
manager.showStoryInfo = (config) => showStoryInfo(manager, config);

export const dialogManager = manager;

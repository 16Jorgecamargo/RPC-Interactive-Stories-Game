import pino from 'pino';

const isDevelopment = process.env.NODE_ENV !== 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
});

export function createRequestLogger(requestId: string) {
  return logger.child({ requestId });
}

const METHOD_CATEGORIES: Record<string, string> = {
  login: 'AUTH',
  register: 'AUTH',
  getMe: 'USER',
  updateProfile: 'USER',
  changePassword: 'USER',
  getCharacterOptions: 'CHARACTER',
  createCharacter: 'CHARACTER',
  getCharacters: 'CHARACTER',
  getCharacter: 'CHARACTER',
  updateCharacter: 'CHARACTER',
  deleteCharacter: 'CHARACTER',
  createStory: 'STORY',
  uploadMermaid: 'STORY',
  listStories: 'STORY',
  getStoryCatalog: 'STORY',
  getStory: 'STORY',
  updateStory: 'STORY',
  deleteStory: 'STORY',
  toggleStoryStatus: 'STORY',
  createSession: 'SESSION',
  joinSession: 'SESSION',
  getSessions: 'SESSION',
  getSessionDetails: 'SESSION',
  deleteSession: 'SESSION',
  leaveSession: 'SESSION',
  transitionToCreatingCharacters: 'SESSION',
  canStartSession: 'SESSION',
  startSession: 'SESSION',
  getGameState: 'GAME',
  getTimeline: 'GAME',
  vote: 'VOTE',
  getVoteStatus: 'VOTE',
  resolveTie: 'VOTE',
  configureVoteTimeout: 'VOTE',
  getVoteTimer: 'VOTE',
  extendVoteTimer: 'VOTE',
  sendMessage: 'CHAT',
  getMessages: 'CHAT',
  checkGameUpdates: 'UPDATES',
  updatePlayerStatus: 'UPDATES',
  checkMessages: 'UPDATES',
  initiateCombat: 'COMBAT',
  getCombatState: 'COMBAT',
  rollInitiative: 'COMBAT',
  getCurrentTurn: 'COMBAT',
  performAttack: 'COMBAT',
  attemptRevive: 'COMBAT',
  getAllUsers: 'ADMIN',
  deleteUser: 'ADMIN',
  promoteUser: 'ADMIN',
  demoteUser: 'ADMIN',
  getAllSessions: 'ADMIN',
  getSessionDetail: 'ADMIN',
  deleteSessionAdmin: 'ADMIN',
  forceSessionState: 'ADMIN',
  getSystemStats: 'ADMIN',
  getStoryUsage: 'ADMIN',
};

export function logRPCCall(method: string, params: unknown, duration?: number) {
  const safeParams = { ...(params as Record<string, unknown>) };
  if (safeParams.token) safeParams.token = '[REDACTED]';
  if (safeParams.password) safeParams.password = '[REDACTED]';
  if (safeParams.oldPassword) safeParams.oldPassword = '[REDACTED]';
  if (safeParams.newPassword) safeParams.newPassword = '[REDACTED]';
  if (safeParams.confirmPassword) safeParams.confirmPassword = '[REDACTED]';

  const category = METHOD_CATEGORIES[method] || 'RPC';

  if (duration !== undefined) {
    logger.info(
      { method, category, params: safeParams, duration: `${duration}ms` },
      `[${category}] ${method} completed in ${duration}ms`
    );
  } else {
    logger.info({ method, category, params: safeParams }, `[${category}] ${method} started`);
  }
}

export function logError(error: unknown, context?: Record<string, unknown>) {
  const errorMessage = error instanceof Error ? error.message : 'Error occurred';
  logger.error({ error, ...context }, errorMessage);
}

export function logWarning(message: string, context?: Record<string, unknown>) {
  logger.warn({ ...context }, message);
}

export function logInfo(message: string, context?: Record<string, unknown>) {
  logger.info({ ...context }, message);
}

export function logDebug(message: string, context?: Record<string, unknown>) {
  if (context) {
    logger.debug({ ...context }, message);
  } else {
    logger.debug(message);
  }
}

export function logServiceCall(
  serviceName: string,
  methodName: string,
  context?: Record<string, unknown>
) {
  const safeContext = context ? { ...context } : {};
  if (safeContext.token) safeContext.token = '[REDACTED]';
  if (safeContext.password) safeContext.password = '[REDACTED]';
  if (safeContext.oldPassword) safeContext.oldPassword = '[REDACTED]';
  if (safeContext.newPassword) safeContext.newPassword = '[REDACTED]';
  if (safeContext.confirmPassword) safeContext.confirmPassword = '[REDACTED]';
  
  logger.info({ service: serviceName, method: methodName, ...safeContext }, 
    `[${serviceName.toUpperCase()}] ${methodName}()`);
}

export function logServiceComplete(
  serviceName: string,
  methodName: string,
  duration: number,
  context?: Record<string, unknown>
) {
  logger.info({ service: serviceName, method: methodName, duration: `${duration}ms`, ...context }, 
    `[${serviceName.toUpperCase()}] ${methodName}() completed in ${duration}ms`);
}

export function logServiceError(
  serviceName: string,
  methodName: string,
  error: unknown,
  context?: Record<string, unknown>
) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  logger.error({ service: serviceName, method: methodName, error, ...context }, 
    `[${serviceName.toUpperCase()}] ${methodName}() failed: ${errorMessage}`);
}

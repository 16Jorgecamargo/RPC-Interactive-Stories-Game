import RpcClient from '../rpc/client.js';

const client = new RpcClient();

export async function initiateCombat(sessionId, token) {
  return await client.call('initiateCombat', { sessionId, token });
}

export async function getCombatState(sessionId, token) {
  return await client.call('getCombatState', { sessionId, token });
}

export async function rollInitiative(sessionId, characterId, token) {
  return await client.call('rollInitiative', { sessionId, characterId, token });
}

export async function getCurrentTurn(sessionId, token) {
  return await client.call('getCurrentTurn', { sessionId, token });
}

export async function performAttack(sessionId, characterId, targetId, token) {
  return await client.call('performAttack', { sessionId, characterId, targetId, token });
}

export async function skipTurn(sessionId, characterId, token) {
  return await client.call('skipTurn', { sessionId, characterId, token });
}

export async function attemptRevive(sessionId, characterId, reviverId, token) {
  return await client.call('attemptRevive', { sessionId, characterId, reviverId, token });
}

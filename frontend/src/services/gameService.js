import RpcClient from '../rpc/client.js';

const client = new RpcClient();

export async function getGameState(sessionId, token) {
  return await client.call('getGameState', { sessionId, token });
}

export async function vote(sessionId, characterId, opcaoId, token) {
  return await client.call('vote', { sessionId, characterId, opcaoId, token });
}

export async function getVoteStatus(sessionId, token) {
  return await client.call('getVoteStatus', { sessionId, token });
}

export async function resolveTie(sessionId, winnerId, token) {
  return await client.call('resolveTie', { sessionId, winnerId, token });
}

export async function extendVotingTimeout(sessionId, additionalMinutes, token) {
  return await client.call('extendVotingTimeout', { sessionId, additionalMinutes, token });
}

export async function checkGameUpdates(sessionId, lastUpdateId, token) {
  return await client.call('checkGameUpdates', { sessionId, lastUpdateId, token });
}

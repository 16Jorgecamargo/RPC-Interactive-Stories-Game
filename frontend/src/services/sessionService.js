import RpcClient from '../rpc/client.js';

const client = new RpcClient();

export async function createSession(params) {
  const { name, storyId, maxPlayers, tieResolutionStrategy, token } = params;
  return await client.call('createSession', {
    name,
    storyId,
    maxPlayers,
    tieResolutionStrategy,
    token
  });
}

export async function getSessions(token) {
  return await client.call('getSessions', { token });
}

export async function getSessionDetails(sessionId, token) {
  return await client.call('getSessionDetails', { sessionId, token });
}

export async function joinSession(sessionCode, token) {
  return await client.call('joinSession', { sessionCode, token });
}

export async function leaveSession(sessionId, token) {
  return await client.call('leaveSession', { sessionId, token });
}

// [ ] Implementar método kickParticipant no backend
// export async function kickParticipant(sessionId, userId, token) {
//   return await client.call('kickParticipant', { sessionId, userId, token });
// }

export async function transitionToCreatingCharacters(sessionId, token) {
  return await client.call('transitionToCreatingCharacters', { sessionId, token });
}

export async function startSession(sessionId, token) {
  return await client.call('startSession', { sessionId, token });
}

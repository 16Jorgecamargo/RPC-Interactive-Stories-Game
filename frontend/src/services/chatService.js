import RpcClient from '../rpc/client.js';

const client = new RpcClient();

export async function sendMessage(sessionId, characterId, message, token) {
  const params = { sessionId, message, token };
  if (characterId) {
    params.characterId = characterId;
  }
  return await client.call('sendMessage', params);
}

export async function getMessages(sessionId, since, token) {
  const params = { sessionId, token };
  if (since) {
    params.since = since;
  }
  return await client.call('getMessages', params);
}

/**
 * Envia mensagem de chat na sala de espera (não persiste, apenas broadcast)
 * Usado na waiting room antes de criar personagens
 */
export async function sendRoomMessage(sessionId, message, token) {
  return await client.call('sendRoomMessage', { sessionId, message, token });
}

/**
 * Busca mensagens recentes da sala de espera (últimos 5 minutos)
 * Mensagens expiram automaticamente e não persistem no banco
 */
export async function getRoomMessages(sessionId, token) {
  return await client.call('getRoomMessages', { sessionId, token });
}

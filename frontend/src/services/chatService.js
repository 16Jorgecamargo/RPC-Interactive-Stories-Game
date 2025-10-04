import RpcClient from '../rpc/client.js';

const client = new RpcClient();

export async function sendMessage(sessionId, characterId, message, token) {
  return await client.call('sendMessage', { sessionId, characterId, message, token });
}

export async function getMessages(sessionId, lastMessageId, token) {
  return await client.call('getMessages', { sessionId, lastMessageId, token });
}

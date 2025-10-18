import RpcClient from '../rpc/client.js';

const client = new RpcClient();

/**
 * Entra na sala de espera de uma sessão
 * Marca jogador como online e envia evento PLAYER_ROOM_JOINED
 * Use ao clicar no botão "Entrar na Sala" no /home
 */
export async function enterRoom(sessionId, token) {
  return await client.call('enterRoom', { sessionId, token });
}

/**
 * Sai da sala de espera de uma sessão (volta para taverna)
 * Marca jogador como offline e envia evento PLAYER_ROOM_LEFT
 * Use ao clicar no botão "Voltar para Taverna" na waiting-room
 */
export async function leaveRoom(sessionId, token) {
  return await client.call('leaveRoom', { sessionId, token });
}

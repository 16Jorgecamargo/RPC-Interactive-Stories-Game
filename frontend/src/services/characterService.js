import RpcClient from '../rpc/client.js';

const client = new RpcClient();

export async function getCharacter(characterId, token) {
  return client.call('getCharacter', { characterId, token });
}

export async function updateCharacter(payload) {
  return client.call('updateCharacter', payload);
}

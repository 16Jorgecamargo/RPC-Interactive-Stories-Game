import RpcClient from '../rpc/client.js';

const client = new RpcClient();

export async function login(username, password) {
  return await client.call('login', { username, password });
}

export async function register(username, password, confirmPassword) {
  return await client.call('register', { username, password, confirmPassword });
}

export async function getMe(token) {
  return await client.call('me', { token });
}

export async function validateToken(token) {
  return await client.call('validateToken', { token });
}

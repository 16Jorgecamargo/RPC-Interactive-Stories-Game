import RpcClient from '../rpc/client.js';

const SERVER_URL = 'http://localhost:8443';
const rpcClient = new RpcClient(SERVER_URL);

export function getToken() {
  return localStorage.getItem('token');
}

export function getUser() {
  const userJson = localStorage.getItem('user');
  return userJson ? JSON.parse(userJson) : null;
}

export function isAuthenticated() {
  const token = getToken();
  return token !== null && token !== undefined && token !== '';
}

export async function validateTokenWithServer() {
  const token = getToken();
  if (!token) {
    return false;
  }

  try {
    const result = await rpcClient.call('validateToken', { token });
    return result.valid === true;
  } catch (error) {
    console.error('Token validation error:', error);
    return false;
  }
}

export async function requireAuth() {
  if (!isAuthenticated()) {
    window.location.href = '/login.html';
    return null;
  }

  const isValid = await validateTokenWithServer();
  if (!isValid) {
    logout();
    window.location.href = '/login.html';
    return null;
  }

  return getUser();
}

export function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('expiresIn');
  localStorage.removeItem('loginTime');
}

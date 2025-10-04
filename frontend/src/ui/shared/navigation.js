import { ROUTES } from './constants.js';
import { isAuthenticated, logout } from '../../utils/auth.js';

export function initNavigation() {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
}

export function handleLogout() {
  logout();
  window.location.href = ROUTES.LOGIN;
}

export function navigate(route) {
  if (!isAuthenticated() && route !== ROUTES.LOGIN && route !== ROUTES.REGISTER) {
    window.location.href = ROUTES.LOGIN;
    return;
  }
  window.location.href = route;
}

export function getCurrentUser() {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

export function updateUserDisplay() {
  const user = getCurrentUser();
  const userDisplayElement = document.getElementById('userDisplay');
  
  if (userDisplayElement && user) {
    userDisplayElement.textContent = `Olá, ${user.username}`;
  }
}

import RpcClient from '../../rpc/client.js';

const SERVER_URL = 'http://localhost:8443';
const rpcClient = new RpcClient(SERVER_URL);

const form = document.getElementById('loginForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginButton = document.getElementById('loginButton');
const buttonText = document.getElementById('buttonText');
const buttonLoader = document.getElementById('buttonLoader');
const generalError = document.getElementById('generalError');
const usernameError = document.getElementById('usernameError');
const passwordError = document.getElementById('passwordError');

function showError(element, message) {
  element.textContent = message;
  element.classList.add('show');
  const input = element.previousElementSibling;
  if (input && input.tagName === 'INPUT') {
    input.classList.add('error');
  }
}

function clearError(element) {
  element.textContent = '';
  element.classList.remove('show');
  const input = element.previousElementSibling;
  if (input && input.tagName === 'INPUT') {
    input.classList.remove('error');
  }
}

function clearAllErrors() {
  clearError(usernameError);
  clearError(passwordError);
  generalError.textContent = '';
  generalError.classList.remove('show');
}

function setLoading(isLoading) {
  loginButton.disabled = isLoading;
  buttonText.style.display = isLoading ? 'none' : 'inline';
  buttonLoader.style.display = isLoading ? 'inline-block' : 'none';
}

function validateForm(username, password) {
  let isValid = true;
  clearAllErrors();

  if (!username || username.trim().length === 0) {
    showError(usernameError, 'Usuário é obrigatório');
    isValid = false;
  } else if (username.length < 3) {
    showError(usernameError, 'Usuário deve ter no mínimo 3 caracteres');
    isValid = false;
  }

  if (!password || password.trim().length === 0) {
    showError(passwordError, 'Senha é obrigatória');
    isValid = false;
  } else if (password.length < 6) {
    showError(passwordError, 'Senha deve ter no mínimo 6 caracteres');
    isValid = false;
  }

  return isValid;
}

async function handleLogin(username, password) {
  try {
    const response = await rpcClient.call('/rpc/login', {
      username,
      password
    });

    if (response.token) {
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));
      localStorage.setItem('expiresIn', response.expiresIn);
      localStorage.setItem('loginTime', Date.now());

      window.location.href = '/dashboard.html';
    } else {
      throw new Error('Token não recebido do servidor');
    }
  } catch (error) {
    if (error.code === -32000 || error.message.includes('Credenciais inválidas')) {
      showError(generalError, 'Usuário ou senha incorretos');
    } else if (error.message.includes('Network') || error.message.includes('fetch')) {
      showError(generalError, 'Erro de conexão com o servidor. Tente novamente.');
    } else if (error.message.includes('timeout')) {
      showError(generalError, 'Tempo de resposta esgotado. Tente novamente.');
    } else {
      showError(generalError, error.message || 'Erro ao fazer login');
    }
    throw error;
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const username = usernameInput.value.trim();
  const password = passwordInput.value;

  if (!validateForm(username, password)) {
    return;
  }

  setLoading(true);
  clearAllErrors();

  try {
    await handleLogin(username, password);
  } catch (error) {
    console.error('Login error:', error);
  } finally {
    setLoading(false);
  }
});

usernameInput.addEventListener('input', () => {
  if (usernameError.classList.contains('show')) {
    clearError(usernameError);
  }
});

passwordInput.addEventListener('input', () => {
  if (passwordError.classList.contains('show')) {
    clearError(passwordError);
  }
});

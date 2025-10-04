import RpcClient from '../../rpc/client.js';

const rpcClient = new RpcClient();

const form = document.getElementById('registerForm');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');
const registerBtn = document.getElementById('registerBtn');
const errorMessage = document.getElementById('errorMessage');
const loading = document.getElementById('loading');
const passwordStrength = document.querySelector('.password-strength');
const passwordStrengthBar = document.querySelector('.password-strength-bar');

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.add('show');
}

function clearError() {
  errorMessage.textContent = '';
  errorMessage.classList.remove('show');
}

function setLoading(isLoading) {
  registerBtn.disabled = isLoading;
  loading.classList.toggle('show', isLoading);
}

function validateForm() {
  const username = usernameInput.value.trim();
  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  clearError();

  if (username.length < 3) {
    showError('Nome de usuário deve ter no mínimo 3 caracteres');
    usernameInput.classList.add('error');
    return false;
  }

  if (username.length > 20) {
    showError('Nome de usuário deve ter no máximo 20 caracteres');
    usernameInput.classList.add('error');
    return false;
  }

  if (password.length < 6) {
    showError('Senha deve ter no mínimo 6 caracteres');
    passwordInput.classList.add('error');
    return false;
  }

  if (password !== confirmPassword) {
    showError('As senhas não coincidem');
    confirmPasswordInput.classList.add('error');
    return false;
  }

  usernameInput.classList.remove('error');
  passwordInput.classList.remove('error');
  confirmPasswordInput.classList.remove('error');

  return true;
}

function calculatePasswordStrength(password) {
  let strength = 0;

  if (password.length >= 6) strength++;
  if (password.length >= 10) strength++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/\d/.test(password)) strength++;
  if (/[^a-zA-Z0-9]/.test(password)) strength++;

  return Math.min(strength, 3);
}

function updatePasswordStrength() {
  const password = passwordInput.value;

  if (password.length === 0) {
    passwordStrength.classList.remove('show');
    return;
  }

  passwordStrength.classList.add('show');

  const strength = calculatePasswordStrength(password);

  passwordStrengthBar.classList.remove('weak', 'medium', 'strong');

  if (strength === 1) {
    passwordStrengthBar.classList.add('weak');
  } else if (strength === 2) {
    passwordStrengthBar.classList.add('medium');
  } else if (strength >= 3) {
    passwordStrengthBar.classList.add('strong');
  }
}

async function handleRegister(event) {
  event.preventDefault();

  if (!validateForm()) {
    return;
  }

  const username = usernameInput.value.trim();
  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  setLoading(true);
  clearError();

  try {
    const result = await rpcClient.call('register', {
      username,
      password,
      confirmPassword
    });

    if (result.success) {
      alert('Conta criada com sucesso! Redirecionando para o login...');
      window.location.href = '/login.html';
    }
  } catch (error) {
    if (error.code === -32000 && error.message.includes('já existe')) {
      showError('Este nome de usuário já está em uso');
      usernameInput.classList.add('error');
    } else if (error.code === -32602) {
      showError('Dados inválidos. Verifique os campos e tente novamente.');
    } else {
      showError(error.message || 'Erro ao criar conta. Tente novamente.');
    }
  } finally {
    setLoading(false);
  }
}

passwordInput.addEventListener('input', updatePasswordStrength);

confirmPasswordInput.addEventListener('input', () => {
  if (confirmPasswordInput.value.length > 0 && passwordInput.value !== confirmPasswordInput.value) {
    confirmPasswordInput.classList.add('error');
  } else {
    confirmPasswordInput.classList.remove('error');
  }
});

form.addEventListener('submit', handleRegister);

import RpcClient from '../../rpc/client.js';
import { dialogManager } from '../dialogs/index.js';

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
  const buttonText = document.getElementById('buttonText');
  if (buttonText) {
    buttonText.style.display = isLoading ? 'none' : 'inline';
  }
  loading.style.display = isLoading ? 'inline-block' : 'none';
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

  if (!passwordStrength || !passwordStrengthBar) return;

  if (password.length === 0) {
    passwordStrength.style.display = 'none';
    return;
  }

  passwordStrength.style.display = 'block';

  const strength = calculatePasswordStrength(password);

  if (strength === 1) {
    passwordStrengthBar.style.width = '33%';
    passwordStrengthBar.style.backgroundColor = '#8B0000';
  } else if (strength === 2) {
    passwordStrengthBar.style.width = '66%';
    passwordStrengthBar.style.backgroundColor = '#DAA520';
  } else if (strength >= 3) {
    passwordStrengthBar.style.width = '100%';
    passwordStrengthBar.style.backgroundColor = '#228B22';
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
      setLoading(false);

      // Mostrar dialog de sucesso
      dialogManager.showSuccess({
        title: '🎉 Cadastro Concluído!',
        message: `Bem-vindo à guilda, ${username}! Sua conta foi criada com sucesso. Você será redirecionado automaticamente para fazer login.`,
        showConfetti: true,
        showContinue: true,
        continueText: '🚪 Fazer Login Agora',
        continueCallback: async () => {
          // Fazer login automático
          try {
            const loginResult = await rpcClient.call('login', {
              username,
              password
            });

            if (loginResult.token) {
              localStorage.setItem('token', loginResult.token);

              // Salvar dados adicionais do login
              if (loginResult.expiresIn) {
                localStorage.setItem('expiresIn', loginResult.expiresIn);
              }
              localStorage.setItem('loginTime', Date.now());

              // Buscar dados do usuário
              try {
                const userResult = await rpcClient.call('me', {
                  token: loginResult.token
                });

                if (userResult.user || userResult) {
                  const userData = userResult.user || userResult;
                  localStorage.setItem('user', JSON.stringify(userData));
                }
              } catch (meError) {
                console.error('Erro ao buscar dados do usuário:', meError);
                // Se houver erro ao buscar dados, salvar dados básicos
                localStorage.setItem('user', JSON.stringify({ username }));
              }

              window.location.href = '/home.html';
            }
          } catch (loginError) {
            console.error('Erro no login automático:', loginError);
            // Se o login automático falhar, redirecionar para a página de login
            window.location.href = '/login.html';
          }
        }
      });
    }
  } catch (error) {
    setLoading(false);

    let errorTitle = 'Erro no Cadastro';
    let errorMessage = 'Não foi possível criar sua conta. Tente novamente.';

    if (error.code === -32000 && error.message.includes('já existe')) {
      errorTitle = 'Nome de Usuário Indisponível';
      errorMessage = `O nome "${username}" já está em uso. Por favor, escolha outro nome de aventureiro.`;
      usernameInput.classList.add('error');
    } else if (error.code === -32602) {
      errorTitle = 'Dados Inválidos';
      errorMessage = 'Os dados fornecidos são inválidos. Verifique os campos e tente novamente.';
    } else if (error.message) {
      errorMessage = error.message;
    }

    // Mostrar dialog de erro
    dialogManager.showError({
      title: errorTitle,
      message: errorMessage,
      showRetry: true,
      retryCallback: () => {
        // Focar no primeiro campo com erro
        if (usernameInput.classList.contains('error')) {
          usernameInput.focus();
        } else if (passwordInput.classList.contains('error')) {
          passwordInput.focus();
        } else {
          usernameInput.focus();
        }
      }
    });
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

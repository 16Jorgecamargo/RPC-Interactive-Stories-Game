/// Validador de formulários reutilizável
/// Contém métodos estáticos para validação de campos comuns
class FormValidator {
  FormValidator._();

  /// Valida se o nome de usuário não está vazio
  /// Retorna mensagem de erro ou null se válido
  static String? validateUsername(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Por favor digite o nome do usuario';
    }
    return null;
  }

  /// Valida se a senha atende aos requisitos mínimos
  /// [minLength] - comprimento mínimo da senha (padrão: 6)
  /// Retorna mensagem de erro ou null se válido
  static String? validatePassword(String? value, {int minLength = 6}) {
    if (value == null || value.trim().isEmpty) {
      return 'Por favor digite a senha';
    }
    if (value.length < minLength) {
      return 'A senha deve ter pelo menos $minLength caracteres';
    }
    return null;
  }

  /// Valida se duas senhas são iguais
  /// Retorna mensagem de erro ou null se válido
  static String? validatePasswordMatch(
    String? password,
    String? confirmPassword,
  ) {
    if (confirmPassword == null || confirmPassword.trim().isEmpty) {
      return 'Por favor confirme a senha';
    }
    if (password != confirmPassword) {
      return 'As senhas não coincidem';
    }
    return null;
  }

  /// Valida se username e password foram preenchidos
  /// Retorna mensagem de erro apropriada ou null
  static String? validateLoginForm({
    required String username,
    required String password,
  }) {
    final usernameError = validateUsername(username);
    if (usernameError != null) return usernameError;

    final passwordError = validatePassword(password);
    if (passwordError != null) return passwordError;

    return null;
  }

  /// Valida formulário de registro completo
  /// Retorna mensagem de erro apropriada ou null
  static String? validateRegisterForm({
    required String username,
    required String password,
    required String confirmPassword,
    int minPasswordLength = 6,
  }) {
    final usernameError = validateUsername(username);
    if (usernameError != null) return usernameError;

    final passwordError = validatePassword(
      password,
      minLength: minPasswordLength,
    );
    if (passwordError != null) return passwordError;

    final matchError = validatePasswordMatch(password, confirmPassword);
    if (matchError != null) return matchError;

    return null;
  }
}

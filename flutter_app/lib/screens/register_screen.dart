import '../utils/custom_colors.dart';
import 'package:flutter/material.dart';

import '../widgets/app_background.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _isLoading = false;
  String _errorMessage = '';

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _handleRegister() async {
    setState(() => _errorMessage = '');

    // Validação manual dos campos
    final username = _usernameController.text.trim();
    final password = _passwordController.text.trim();
    final confirmPassword = _confirmPasswordController.text.trim();

    if (username.isEmpty && password.isEmpty && confirmPassword.isEmpty) {
      setState(() => _errorMessage = 'Por favor preencha todos os campos');
      return;
    } else if (username.isEmpty) {
      setState(() => _errorMessage = 'Por favor digite o nome do usuario');
      return;
    } else if (password.isEmpty) {
      setState(() => _errorMessage = 'Por favor digite a senha');
      return;
    } else if (confirmPassword.isEmpty) {
      setState(() => _errorMessage = 'Por favor confirme a senha');
      return;
    } else if (password != confirmPassword) {
      setState(() => _errorMessage = 'As senhas nao coincidem');
      return;
    } else if (password.length < 6) {
      setState(() => _errorMessage = 'A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setState(() => _isLoading = true);

    // Mock: Simulando chamada ao backend
    await Future.delayed(const Duration(seconds: 2));

    if (mounted) {
      setState(() => _isLoading = false);

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Conta criada com sucesso!'),
          backgroundColor: CustomColors.success,
        ),
      );

      // Voltar para login após 1 segundo
      await Future.delayed(const Duration(seconds: 1));
      if (mounted) {
        Navigator.pop(context);
      }
    }
  }

  void _navigateToLogin() {
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final screenHeight = MediaQuery.of(context).size.height;
    final isSmallScreen = screenWidth < 600;

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: AppBackground(
        imageAsset: 'assets/backgrounds/register.png',
        overlayColor: Colors.black.withOpacity(0.25),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: EdgeInsets.symmetric(
                horizontal: isSmallScreen ? 20 : 40,
                vertical: 20,
              ),
              child: Form(
                key: _formKey,
                child: SizedBox(
                  width: isSmallScreen ? screenWidth * 0.9 : 400,
                  child: Stack(
                    clipBehavior: Clip.none,
                    alignment: Alignment.topCenter,
                    children: [
                    // Painel de fundo (camada de baixo)
                    Container(
                      width: double.infinity,
                      margin: const EdgeInsets.only(top: 80),
                      padding: const EdgeInsets.only(
                        top: 120,
                        left: 32,
                        right: 32,
                        bottom: 32,
                      ),
                      decoration: BoxDecoration(
                        color: CustomColors.panelBackground,
                        border: Border.all(
                          color: CustomColors.panelBorder,
                          width: 4,
                        ),
                        borderRadius: BorderRadius.circular(8),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.3),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Column(
                        children: [
                          // Campo de Usuário
                          _buildTextField(
                            controller: _usernameController,
                            hintText: 'USUARIO',
                          ),
                          const SizedBox(height: 20),

                          // Campo de Senha
                          _buildTextField(
                            controller: _passwordController,
                            hintText: 'SENHA',
                            obscureText: true,
                          ),
                          const SizedBox(height: 20),

                          // Campo de Confirmar Senha
                          _buildTextField(
                            controller: _confirmPasswordController,
                            hintText: 'CONFIRMAR SENHA',
                            obscureText: true,
                          ),
                          const SizedBox(height: 20),

                          // Mensagem de erro (aparece acima do botão de registro)
                          if (_errorMessage.isNotEmpty)
                            Padding(
                              padding: const EdgeInsets.only(bottom: 12),
                              child: Text(
                                _errorMessage,
                                textAlign: TextAlign.center,
                                style: const TextStyle(
                                  fontFamily: 'Zany',
                                  fontSize: 14,
                                  color: CustomColors.errorText,
                                  shadows: [
                                    Shadow(
                                      color: Colors.black26,
                                      offset: Offset(1, 1),
                                      blurRadius: 2,
                                    ),
                                  ],
                                ),
                              ),
                            ),

                          // Botão de Registrar
                          _buildButton(
                            text: 'REGISTRAR',
                            onPressed: _isLoading ? null : _handleRegister,
                            isLoading: _isLoading,
                          ),
                          const SizedBox(height: 16),

                          // Botão de Voltar ao Login
                          _buildButton(
                            text: 'VOLTAR AO LOGIN',
                            onPressed: _navigateToLogin,
                            isPrimary: false,
                          ),
                        ],
                      ),
                    ),

                    // Logo por cima (camada de cima - overlay)
                    Positioned(
                      top: isSmallScreen ? -25 : -149,
                      child: IgnorePointer(
                        child: Image.asset(
                          'assets/images/LOGO.png',
                          width: isSmallScreen ? screenWidth * 95 : 380,
                          height: isSmallScreen ? 200 : 450,
                          fit: BoxFit.contain,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    ));
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String hintText,
    bool obscureText = false,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: CustomColors.fieldBackground,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: CustomColors.fieldBorder,
          width: 2,
        ),
      ),
      child: TextField(
        controller: controller,
        obscureText: obscureText,
        style: const TextStyle(
          fontFamily: 'Zany',
          color: CustomColors.fieldText,
          fontSize: 16,
        ),
        decoration: InputDecoration(
          hintText: hintText,
          hintStyle: const TextStyle(
            fontFamily: 'Zany',
            color: CustomColors.fieldText,
            fontSize: 14,
          ),
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 16,
            vertical: 12,
          ),
          border: InputBorder.none,
        ),
        cursorColor: CustomColors.fieldText,
      ),
    );
  }

  Widget _buildButton({
    required String text,
    required VoidCallback? onPressed,
    bool isPrimary = true,
    bool isLoading = false,
  }) {
    return GestureDetector(
      onTap: onPressed,
      child: Container(
        width: double.infinity,
        height: 50,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: isPrimary
                ? [
                    CustomColors.buttonGreenLight,
                    CustomColors.buttonGreenMedium,
                    CustomColors.buttonGreenDark,
                  ]
                : [
                    CustomColors.buttonBrownLight,
                    CustomColors.buttonBrownMedium,
                    CustomColors.buttonBrownDark,
                  ],
          ),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: CustomColors.fieldBorder,
            width: 3,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.3),
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Center(
          child: isLoading
              ? const SizedBox(
                  width: 24,
                  height: 24,
                  child: CircularProgressIndicator(
                    valueColor: AlwaysStoppedAnimation<Color>(
                      CustomColors.fieldText,
                    ),
                    strokeWidth: 3,
                  ),
                )
              : Text(
                  text,
                  style: const TextStyle(
                    fontFamily: 'Zany',
                    fontSize: 18,
                    color: CustomColors.fieldText,
                    shadows: [
                      Shadow(
                        color: Colors.black38,
                        offset: Offset(1, 1),
                        blurRadius: 2,
                      ),
                    ],
                  ),
                ),
        ),
      ),
    );
  }
}

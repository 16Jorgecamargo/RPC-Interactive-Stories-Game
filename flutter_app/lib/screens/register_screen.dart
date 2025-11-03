import 'package:flutter/material.dart';
import '../components/animated_background.dart';
import '../components/custom_button.dart';
import '../components/custom_text_field.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _isLoading = false;

  @override
  void dispose() {
    _usernameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _handleRegister() async {
    if (_formKey.currentState!.validate()) {
      setState(() => _isLoading = true);

      // Mock: Simulando chamada ao backend
      await Future.delayed(const Duration(seconds: 2));

      if (mounted) {
        setState(() => _isLoading = false);

        // Mock: Simulando sucesso
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'Conta criada com sucesso!',
              style: TextStyle(fontFamily: 'Zany'),
            ),
            backgroundColor: Color(0xFF4a7c4e),
          ),
        );

        // Voltar para login após registro
        await Future.delayed(const Duration(seconds: 1));
        if (mounted) {
          Navigator.pop(context);
        }
      }
    }
  }

  void _navigateBack() {
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: AnimatedBackground(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Container(
              constraints: const BoxConstraints(maxWidth: 400),
              child: Form(
                key: _formKey,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Logo/Título
                    const Text(
                      'RPG Stories',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontFamily: 'Zany',
                        fontSize: 48,
                        color: Color(0xFFd4a574),
                        shadows: [
                          Shadow(
                            color: Colors.black,
                            offset: Offset(3, 3),
                            blurRadius: 8,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'Crie sua Conta',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontFamily: 'Zany',
                        fontSize: 18,
                        color: Color(0xFF8b7355),
                      ),
                    ),
                    const SizedBox(height: 48),

                    // Painel de Registro com imagem de fundo
                    Stack(
                      children: [
                        // Imagem do painel de pedra
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 32,
                            vertical: 40,
                          ),
                          decoration: const BoxDecoration(
                            image: DecorationImage(
                              image: AssetImage('assets/images/painel_de_pedra.png'),
                              fit: BoxFit.fill,
                            ),
                          ),
                          child: Column(
                            children: [
                              const Text(
                                'Criar Conta',
                                style: TextStyle(
                                  fontFamily: 'Zany',
                                  fontSize: 24,
                                  color: Color(0xFFDACCB0),
                                ),
                              ),
                              const SizedBox(height: 24),

                              // Campo Username
                              CustomTextField(
                                label: 'USUARIO',
                                controller: _usernameController,
                                validator: (value) {
                                  if (value == null || value.isEmpty) {
                                    return 'Por favor, insira um usuário';
                                  }
                                  if (value.length < 3) {
                                    return 'Usuário deve ter pelo menos 3 caracteres';
                                  }
                                  return null;
                                },
                              ),
                              const SizedBox(height: 16),

                              // Campo Email
                              CustomTextField(
                                label: 'EMAIL',
                                controller: _emailController,
                                keyboardType: TextInputType.emailAddress,
                                validator: (value) {
                                  if (value == null || value.isEmpty) {
                                    return 'Por favor, insira seu email';
                                  }
                                  if (!value.contains('@')) {
                                    return 'Email inválido';
                                  }
                                  return null;
                                },
                              ),
                              const SizedBox(height: 16),

                              // Campo Senha
                              CustomTextField(
                                label: 'SENHA',
                                controller: _passwordController,
                                obscureText: true,
                                validator: (value) {
                                  if (value == null || value.isEmpty) {
                                    return 'Por favor, insira uma senha';
                                  }
                                  if (value.length < 6) {
                                    return 'Senha deve ter pelo menos 6 caracteres';
                                  }
                                  return null;
                                },
                              ),
                              const SizedBox(height: 16),

                              // Campo Confirmar Senha
                              CustomTextField(
                                label: 'CONFIRMAR SENHA',
                                controller: _confirmPasswordController,
                                obscureText: true,
                                validator: (value) {
                                  if (value == null || value.isEmpty) {
                                    return 'Por favor, confirme sua senha';
                                  }
                                  if (value != _passwordController.text) {
                                    return 'As senhas não coincidem';
                                  }
                                  return null;
                                },
                              ),
                              const SizedBox(height: 32),

                              // Botão Registrar
                              _isLoading
                                  ? const Center(
                                      child: CircularProgressIndicator(
                                        valueColor: AlwaysStoppedAnimation<Color>(
                                          Color(0xFFd4a574),
                                        ),
                                      ),
                                    )
                                  : CustomButton(
                                      text: 'Registrar',
                                      onPressed: _handleRegister,
                                      width: 200,
                                      height: 60,
                                    ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 32),

                    // Link para Login com seta papiro
                    MouseRegion(
                      cursor: SystemMouseCursors.click,
                      child: GestureDetector(
                        onTap: _navigateBack,
                        child: Stack(
                          alignment: Alignment.center,
                          children: [
                            Image.asset(
                              'assets/images/seta_papiro.png',
                              width: 250,
                              height: 80,
                              fit: BoxFit.contain,
                            ),
                            const Positioned(
                              child: Text(
                                'Já tenho conta',
                                style: TextStyle(
                                  fontFamily: 'Zany',
                                  fontSize: 22,
                                  color: Color(0xFF3B3119),
                                  fontWeight: FontWeight.w400,
                                ),
                              ),
                            ),
                          ],
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
    );
  }
}

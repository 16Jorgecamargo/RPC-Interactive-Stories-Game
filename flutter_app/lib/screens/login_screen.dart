import 'package:flutter/material.dart';
import '../components/animated_background.dart';
import '../components/custom_button.dart';
import '../components/custom_text_field.dart';
import 'register_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
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
              'Login realizado com sucesso!',
              style: TextStyle(fontFamily: 'Zany'),
            ),
            backgroundColor: Color(0xFF4a7c4e),
          ),
        );
      }
    }
  }

  void _navigateToRegister() {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => const RegisterScreen()),
    );
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
                      'Aventuras Interativas',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontFamily: 'Zany',
                        fontSize: 18,
                        color: Color(0xFF8b7355),
                      ),
                    ),
                    const SizedBox(height: 48),

                    // Painel de Login com imagem de fundo
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
                                'Entrar na conta',
                                style: TextStyle(
                                  fontFamily: 'Zany',
                                  fontSize: 24,
                                  color: Color(0xFFDACCB0),
                                ),
                              ),
                              const SizedBox(height: 32),

                              // Campo Username
                              CustomTextField(
                                label: 'USUARIO',
                                controller: _usernameController,
                                validator: (value) {
                                  if (value == null || value.isEmpty) {
                                    return 'Por favor, insira seu usuário';
                                  }
                                  return null;
                                },
                              ),
                              const SizedBox(height: 20),

                              // Campo Senha
                              CustomTextField(
                                label: 'SENHA',
                                controller: _passwordController,
                                obscureText: true,
                                validator: (value) {
                                  if (value == null || value.isEmpty) {
                                    return 'Por favor, insira sua senha';
                                  }
                                  return null;
                                },
                              ),
                              const SizedBox(height: 32),

                              // Botão Entrar
                              _isLoading
                                  ? const Center(
                                      child: CircularProgressIndicator(
                                        valueColor: AlwaysStoppedAnimation<Color>(
                                          Color(0xFFd4a574),
                                        ),
                                      ),
                                    )
                                  : CustomButton(
                                      text: 'Entrar',
                                      onPressed: _handleLogin,
                                      width: 200,
                                      height: 60,
                                    ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 32),

                    // Link para Registrar com seta papiro
                    MouseRegion(
                      cursor: SystemMouseCursors.click,
                      child: GestureDetector(
                        onTap: _navigateToRegister,
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
                                'Criar conta',
                                style: TextStyle(
                                  fontFamily: 'Zany',
                                  fontSize: 24,
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

import 'package:flutter/material.dart';

import '../../../shared/utils/custom_colors.dart';
import '../../../shared/utils/form_validator.dart';
import '../../../shared/utils/screen_helpers.dart';
import '../../../shared/widgets/common/animated_glow_button.dart';
import '../../../shared/widgets/common/app_background.dart';
import '../../../shared/widgets/common/custom_text_field.dart';
import '../../../shared/widgets/particles/floating_particles.dart';
import '../mixins/auth_screen_mixin.dart';
import '../widgets/auth_form_card.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen>
    with TickerProviderStateMixin, AuthScreenMixin {
  final _formKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _isLoading = false;
  String _errorMessage = '';
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  bool _canNavigate = true;

  @override
  void initState() {
    super.initState();
    initAuthAnimations();

    // Inicia com valor 1.0 e anima de volta (entrada reversa)
    entryController.value = 1.0;
    exitController.value = 1.0;

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        exitController.duration = entryDuration;
        exitController.reverse().then((_) {
          if (mounted) {
            exitController.duration = exitDuration;
          }
        });
      }
    });
  }

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    disposeAuthAnimations();
    super.dispose();
  }

  Future<void> _handleRegister() async {
    setState(() => _errorMessage = '');

    final username = _usernameController.text.trim();
    final password = _passwordController.text.trim();
    final confirmPassword = _confirmPasswordController.text.trim();

    // Usa FormValidator para validação
    final validationError = FormValidator.validateRegisterForm(
      username: username,
      password: password,
      confirmPassword: confirmPassword,
    );

    if (validationError != null) {
      setState(() => _errorMessage = validationError);
      return;
    }

    setState(() => _isLoading = true);
    await Future.delayed(const Duration(seconds: 2));

    if (!mounted) return;

    setState(() => _isLoading = false);

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Conta criada com sucesso!'),
        backgroundColor: CustomColors.success,
      ),
    );

    await Future.delayed(const Duration(milliseconds: 600));
    if (!mounted) return;
    await exitController.forward();
    if (!mounted) return;
    Navigator.of(context).pushReplacementNamed('/loading');
  }

  Future<void> _startBackTransition() async {
    if (exitController.isAnimating || _isLoading || !_canNavigate) return;

    setState(() => _canNavigate = false);
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
        setState(() => _canNavigate = true);
      }
    });

    await exitController.forward();
    if (!mounted) return;
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final isSmallScreen = ScreenHelpers.isSmallScreen(context);
    const particleActivity = 1.0;

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: buildAnimatedScene(
        child: Stack(
          children: [
            _buildContent(isSmallScreen),
            const Positioned.fill(
              child: Stack(
                children: <Widget>[
                  FloatingParticles(
                    particleCount: 12,
                    minSize: 6,
                    maxSize: 14,
                    minOpacity: 0.3,
                    maxOpacity: 0.7,
                    speed: 0.2,
                    color: Color(0xFFFFF9C4),
                    glowType: ParticleGlowType.firefly,
                    activity: particleActivity,
                    spawnFromEdges: true,
                    maxActiveParticles: 10,
                    landingZones: [
                      Rect.fromLTRB(0.275, 0.29, 0.725, 0.71),
                    ],
                  ),
                  FloatingParticles(
                    particleCount: 5,
                    minSize: 8,
                    maxSize: 18,
                    minOpacity: 0.4,
                    maxOpacity: 0.8,
                    speed: 0.3,
                    color: Color.fromARGB(255, 218, 238, 185),
                    glowType: ParticleGlowType.firefly,
                    activity: particleActivity,
                    spawnFromEdges: true,
                    maxActiveParticles: 4,
                    landingZones: [
                      Rect.fromLTRB(0.225, 0.26, 0.775, 0.74),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContent(bool isSmallScreen) {
    final screenWidth = ScreenHelpers.getScreenWidth(context);

    return AppBackground(
      imageAsset: 'assets/auth/register_background.png',
      overlayColor: Colors.black.withOpacity(0.25),
      child: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: ScreenHelpers.getResponsivePadding(context: context),
            child: Form(
              key: _formKey,
              child: SizedBox(
                width: ScreenHelpers.getResponsiveContentWidth(
                  context: context,
                ),
                child: Stack(
                  clipBehavior: Clip.none,
                  alignment: Alignment.topCenter,
                  children: [
                    _buildFormCard(),
                    _buildLogo(isSmallScreen, screenWidth),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLogo(bool isSmallScreen, double screenWidth) {
    return Positioned(
      top: isSmallScreen ? -25 : -149,
      child: IgnorePointer(
        child: Image.asset(
          'assets/shared/logo.png',
          width: isSmallScreen ? screenWidth * 0.95 : 380,
          height: isSmallScreen ? 200 : 450,
          fit: BoxFit.contain,
        ),
      ),
    );
  }

  Widget _buildFormCard() {
    return AuthFormCard(
      children: [
        CustomTextField(
          controller: _usernameController,
          hintText: 'USUARIO',
        ),
        const SizedBox(height: 20),
        CustomTextField(
          controller: _passwordController,
          hintText: 'SENHA',
          obscureText: _obscurePassword,
          isPassword: true,
          onToggleVisibility: () {
            setState(() => _obscurePassword = !_obscurePassword);
          },
        ),
        const SizedBox(height: 20),
        CustomTextField(
          controller: _confirmPasswordController,
          hintText: 'CONFIRMAR SENHA',
          obscureText: _obscureConfirmPassword,
          isPassword: true,
          onToggleVisibility: () {
            setState(() => _obscureConfirmPassword = !_obscureConfirmPassword);
          },
        ),
        const SizedBox(height: 20),
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
        AnimatedGlowButton(
          text: 'REGISTRAR',
          onPressed: _isLoading ? null : _handleRegister,
          isLoading: _isLoading,
        ),
        const SizedBox(height: 16),
        AnimatedGlowButton(
          text: 'VOLTAR AO LOGIN',
          onPressed: (_isLoading || !_canNavigate)
              ? null
              : _startBackTransition,
          isPrimary: false,
        ),
      ],
    );
  }
}

import 'package:flutter/material.dart';

import '../../../shared/utils/custom_colors.dart';
import '../../../shared/utils/form_validator.dart';
import '../../../shared/utils/navigation_helpers.dart';
import '../../../shared/utils/screen_helpers.dart';
import '../../../shared/widgets/common/animated_glow_button.dart';
import '../../../shared/widgets/common/app_background.dart';
import '../../../shared/widgets/common/custom_text_field.dart';
import '../../../shared/widgets/particles/floating_particles.dart';
import '../mixins/auth_screen_mixin.dart';
import '../widgets/auth_form_card.dart';


class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen>
    with TickerProviderStateMixin, AuthScreenMixin {
  final _formKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();

  bool _isLoading = false;
  String _errorMessage = '';
  bool _obscurePassword = true;
  bool _canNavigate = true;

  @override
  void initState() {
    super.initState();
    initAuthAnimations();
  }

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    disposeAuthAnimations();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    setState(() => _errorMessage = '');

    final username = _usernameController.text.trim();
    final password = _passwordController.text.trim();

    // Usa FormValidator para validação
    final validationError = FormValidator.validateLoginForm(
      username: username,
      password: password,
    );

    if (validationError != null) {
      setState(() => _errorMessage = validationError);
      return;
    }

    setState(() => _isLoading = true);
    await Future.delayed(const Duration(seconds: 2));

    if (!mounted) return;

    setState(() => _isLoading = false);
    Navigator.pushReplacementNamed(context, '/loading');
  }


  Future<void> _startRegisterTransition() async {
    if (exitController.isAnimating || _isLoading || !_canNavigate) return;

    setState(() => _canNavigate = false);
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
        setState(() => _canNavigate = true);
      }
    });

    // Usa NavigationHelpers para transição com rota nomeada
    await NavigationHelpers.navigateWithTransition(
      context: context,
      routeName: '/register',
      exitController: exitController,
      entryDuration: entryDuration,
      exitDuration: exitDuration,
    );

    if (mounted) {
      entryController.value = 1.0;
    }
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
              child: FloatingParticles(
                particleCount: 14,
                minSize: 4,
                maxSize: 9,
                minOpacity: 0.25,
                maxOpacity: 0.65,
                speed: 0.16,
                color: Color(0xFFFFF9C4),
                glowType: ParticleGlowType.spark,
                activity: particleActivity,
                spawnFromEdges: true,
                maxActiveParticles: 12,
                landingZones: [
                  Rect.fromLTRB(0.29, 0.28, 0.71, 0.68),
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
      imageAsset: 'assets/auth/login_background.png',
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
          text: 'LOGIN',
          onPressed: _isLoading ? null : _handleLogin,
          isLoading: _isLoading,
        ),
        const SizedBox(height: 16),
        AnimatedGlowButton(
          text: 'CRIAR CONTA',
          onPressed: (_isLoading || !_canNavigate)
              ? null
              : _startRegisterTransition,
          isPrimary: false,
        ),
      ],
    );
  }
}

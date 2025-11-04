import 'dart:math' as math;
import 'dart:ui';

import 'package:flutter/material.dart';

import '../utils/custom_colors.dart';
import '../widgets/animated_glow_button.dart';
import '../widgets/app_background.dart';
import '../widgets/floating_particles.dart';
import 'register_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen>
    with TickerProviderStateMixin {
  static const _entryDuration = Duration(milliseconds: 700);
  static const _exitDuration = Duration(milliseconds: 300);
  static const double _startBackgroundScale = 1.4;
  static const double _extraGuiScale = 0.12;
  static const double _exitBackgroundScale = 1.35;
  static const double _exitGuiExtraScale = 0.15;
  static const double _fadeLeadSeconds = 0.5;

  final _formKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();

  bool _isLoading = false;
  String _errorMessage = '';
  bool _obscurePassword = true;
  bool _canNavigate = true;

  late final AnimationController _entryController;
  late final AnimationController _exitController;

  double get _fadeCutoff {
    final total = _entryDuration.inMilliseconds.toDouble();
    final leadMs = (_fadeLeadSeconds * 1000).clamp(0, total - 100);
    return ((total - leadMs) / total).clamp(0.0, 1.0);
  }

  @override
  void initState() {
    super.initState();
    _entryController = AnimationController(
      vsync: this,
      duration: _entryDuration,
    )..forward();

    _exitController = AnimationController(
      vsync: this,
      duration: _exitDuration,
    );
  }

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    _entryController.dispose();
    _exitController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    setState(() => _errorMessage = '');

    final username = _usernameController.text.trim();
    final password = _passwordController.text.trim();

    if (username.isEmpty && password.isEmpty) {
      setState(() =>
          _errorMessage = 'Por favor insira o nome do usuario e a senha');
      return;
    } else if (username.isEmpty) {
      setState(() => _errorMessage = 'Por favor digite o nome do usuario');
      return;
    } else if (password.isEmpty) {
      setState(() => _errorMessage = 'Por favor digite a senha');
      return;
    }

    setState(() => _isLoading = true);
    await Future.delayed(const Duration(seconds: 2));

    if (!mounted) return;

    setState(() => _isLoading = false);
    Navigator.pushReplacementNamed(context, '/session');
  }

  Future<void> _startRegisterTransition() async {
    if (_exitController.isAnimating || _isLoading || !_canNavigate) return;

    setState(() => _canNavigate = false);
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
        setState(() => _canNavigate = true);
      }
    });

    await _exitController.forward();
    if (!mounted) return;

    await Navigator.of(context).push(
      PageRouteBuilder(
        pageBuilder: (_, __, ___) => const RegisterScreen(),
        transitionDuration: Duration.zero,
        reverseTransitionDuration: Duration.zero,
        transitionsBuilder: (_, __, ___, child) => child,
      ),
    );

    if (!mounted) return;

    await Future.delayed(const Duration(milliseconds: 16));
    if (!mounted) return;

    _exitController.duration = _entryDuration;
    await _exitController.reverse();
    if (mounted) {
      _exitController.duration = _exitDuration; 
      _entryController.value = 1.0;
    }
  }

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final isSmallScreen = screenWidth < 600;
    final animationListenable =
        Listenable.merge([_entryController, _exitController]);

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: AnimatedBuilder(
        animation: animationListenable,
        builder: (context, _) {
          final entryProgress = _entryController.value;
          final exitProgress = _exitController.value;

          final entryCurve = Curves.easeOutCubic.transform(entryProgress);
          final exitCurve = Curves.easeIn.transform(exitProgress);

          final backgroundScaleIn = lerpDouble(
                _startBackgroundScale,
                1.0,
                entryCurve,
              )!;
          final backgroundScaleOut = lerpDouble(
                1.0,
                _exitBackgroundScale,
                exitCurve,
              )!;
          final backgroundScale = backgroundScaleIn * backgroundScaleOut;

          final guiRelativeScale =
              (1.0 + _extraGuiScale * (1.0 - entryCurve)) *
                  (1.0 + _exitGuiExtraScale * exitCurve);

          final guiOpacity = _computeGuiOpacity(entryProgress) *
              (1.0 - exitProgress).clamp(0.0, 1.0);

          final blurSigma = exitProgress * 24.0;

          Widget scene = _buildScene(
            screenWidth: screenWidth,
            isSmallScreen: isSmallScreen,
            guiScale: guiRelativeScale,
            guiOpacity: guiOpacity,
          );

          Widget animated = Transform.scale(
            scale: backgroundScale,
            alignment: Alignment.center,
            child: scene,
          );

          if (blurSigma > 0.01) {
            animated = ImageFiltered(
              imageFilter: ImageFilter.blur(
                sigmaX: blurSigma * 0.6,
                sigmaY: blurSigma,
              ),
              child: animated,
            );
            animated = Stack(
              children: [
                animated,
                Positioned.fill(
                  child: IgnorePointer(
                    child: Opacity(
                      opacity: math.min(exitProgress * 0.4, 0.35),
                      child: DecoratedBox(
                        decoration: BoxDecoration(
                          gradient: RadialGradient(
                            center: Alignment.center,
                            colors: [
                              Colors.white.withOpacity(0.18),
                              Colors.white.withOpacity(0.05),
                              Colors.transparent,
                            ],
                            stops: const [0.0, 0.45, 1.0],
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            );
          }

          return Stack(
            children: [
              animated,
              const Positioned.fill(
                child: IgnorePointer(
                  child: Stack(
                    children: [
                      FloatingParticles(
                        particleCount: 14,
                        minSize: 4,
                        maxSize: 9,
                        minOpacity: 0.25,
                        maxOpacity: 0.65,
                        speed: 0.18,
                        color: Color(0xFFFFF9C4),
                        glowType: ParticleGlowType.spark,
                      ),
                      FloatingParticles(
                        particleCount: 6,
                        minSize: 10,
                        maxSize: 22,
                        minOpacity: 0.35,
                        maxOpacity: 0.75,
                        speed: 0.36,
                        color: Color(0xFFFFA726),
                        glowType: ParticleGlowType.spark,
                      ),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  double _computeGuiOpacity(double entryProgress) {
    final cutoff = _fadeCutoff.clamp(0.0, 0.9);
    final returnStart = math.min(0.98, cutoff + 0.25);

    if (cutoff <= 0.0) {
      return 1.0;
    }

    if (entryProgress <= cutoff) {
      final t = (entryProgress / cutoff).clamp(0.0, 1.0);
      return 1.0 - t;
    }

    if (entryProgress <= returnStart) {
      return 0.0;
    }

    final t = ((entryProgress - returnStart) / (1.0 - returnStart))
        .clamp(0.0, 1.0);
    return Curves.easeOut.transform(t);
  }

  Widget _buildScene({
    required double screenWidth,
    required bool isSmallScreen,
    required double guiScale,
    required double guiOpacity,
  }) {
    return AppBackground(
      imageAsset: 'assets/backgrounds/login.png',
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
              child: Transform.scale(
                scale: guiScale,
                alignment: Alignment.topCenter,
                child: Opacity(
                  opacity: guiOpacity,
                  child: SizedBox(
                    width: isSmallScreen ? screenWidth * 0.9 : 400,
                    child: Stack(
                      clipBehavior: Clip.none,
                      alignment: Alignment.topCenter,
                      children: [
                        _buildFormCard(),
                        Positioned(
                          top: isSmallScreen ? -25 : -149,
                          child: IgnorePointer(
                            child: Image.asset(
                              'assets/images/LOGO.png',
                              width: isSmallScreen
                                  ? screenWidth * 0.95
                                  : 380,
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
        ),
      ),
    );
  }

  Widget _buildFormCard() {
    return Container(
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
          _buildTextField(
            controller: _usernameController,
            hintText: 'USUARIO',
          ),
          const SizedBox(height: 20),
          _buildTextField(
            controller: _passwordController,
            hintText: 'SENHA',
            obscureText: _obscurePassword,
            isPassword: true,
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
            onPressed: _isLoading ? null : () => _handleLogin(),
            isLoading: _isLoading,
          ),
          const SizedBox(height: 16),
          AnimatedGlowButton(
            text: 'CRIAR CONTA',
            onPressed: (_isLoading || !_canNavigate)
                ? null
                : () => _startRegisterTransition(),
            isPrimary: false,
          ),
        ],
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String hintText,
    bool obscureText = false,
    bool isPassword = false,
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
          suffixIcon: isPassword
              ? IconButton(
                  icon: Icon(
                    obscureText ? Icons.visibility_off : Icons.visibility,
                    color: CustomColors.fieldText.withOpacity(0.7),
                    size: 20,
                  ),
                  onPressed: () {
                    setState(() {
                      _obscurePassword = !_obscurePassword;
                    });
                  },
                )
              : null,
        ),
        cursorColor: CustomColors.fieldText,
      ),
    );
  }
}




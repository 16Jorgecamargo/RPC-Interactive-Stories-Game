import 'dart:async';

import 'package:flutter/material.dart';

import '../../shared/widgets/common/app_background.dart';
import '../../shared/widgets/particles/fire_sparks.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with TickerProviderStateMixin {
  late AnimationController _logoController;
  late AnimationController _floatController;
  late AnimationController _glowController;

  late Animation<double> _fadeAnimation;
  late Animation<double> _scaleAnimation;
  late Animation<double> _rotateAnimation;
  late Animation<double> _floatAnimation;
  late Animation<double> _glowAnimation;

  @override
  void initState() {
    super.initState();

    // Animação principal da logo
    _logoController = AnimationController(
      duration: const Duration(milliseconds: 2000),
      vsync: this,
    );

    // Animação de flutuação contínua
    _floatController = AnimationController(
      duration: const Duration(milliseconds: 3000),
      vsync: this,
    );

    // Animação de brilho pulsante
    _glowController = AnimationController(
      duration: const Duration(milliseconds: 2000),
      vsync: this,
    );

    // Fade in
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _logoController,
        curve: const Interval(0.0, 0.5, curve: Curves.easeIn),
      ),
    );

    // Scale com bounce
    _scaleAnimation = Tween<double>(begin: 0.3, end: 1.0).animate(
      CurvedAnimation(
        parent: _logoController,
        curve: const Interval(0.0, 0.7, curve: Curves.elasticOut),
      ),
    );

    // Rotação suave
    _rotateAnimation = Tween<double>(begin: -0.1, end: 0.0).animate(
      CurvedAnimation(
        parent: _logoController,
        curve: const Interval(0.3, 0.8, curve: Curves.easeOutCubic),
      ),
    );

    // Flutuação vertical contínua
    _floatAnimation = Tween<double>(begin: -10.0, end: 10.0).animate(
      CurvedAnimation(
        parent: _floatController,
        curve: Curves.easeInOut,
      ),
    );

    // Brilho pulsante
    _glowAnimation = Tween<double>(begin: 0.3, end: 1.0).animate(
      CurvedAnimation(
        parent: _glowController,
        curve: Curves.easeInOut,
      ),
    );

    _logoController.forward();
    _floatController.repeat(reverse: true);
    _glowController.repeat(reverse: true);

    // Navegar para login após 5 segundos (tempo para apreciar as animações)
    Timer(const Duration(seconds: 5), () {
      if (mounted) {
        //Navigator.of(context).pushReplacementNamed('/login');
      }
    });
  }

  @override
  void dispose() {
    _logoController.dispose();
    _floatController.dispose();
    _glowController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        FocusScope.of(context).unfocus();
        FocusManager.instance.primaryFocus?.unfocus();
      },
      child: Scaffold(
        backgroundColor: Colors.transparent,
        body: Stack(
          children: [
            // Background
            AppBackground(
              imageAsset: 'assets/splash/background.png',
              overlayColor: Colors.black.withOpacity(0.3),
              alignment: const Alignment(0.0, 8.0),
              child: const SizedBox.expand(),
            ),

            // Fagulhas de fogo aumentadas
            const Positioned.fill(
              child: FireSparks(
                spawnRate: 0.15, // Mais fagulhas
                maxSparks: 80, // Aumentado de 30 para 80
                activity: 1.0,
              ),
            ),

            // Logo com animações
            SafeArea(
              top: true,
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    // Logo animada
                    AnimatedBuilder(
                      animation: Listenable.merge([
                        _logoController,
                        _floatController,
                        _glowController,
                      ]),
                      builder: (context, child) {
                        return Transform.translate(
                          offset: Offset(0, _floatAnimation.value),
                          child: Transform.rotate(
                            angle: _rotateAnimation.value,
                            child: Transform.scale(
                              scale: _scaleAnimation.value,
                              child: Opacity(
                                opacity: _fadeAnimation.value,
                                child: SizedBox(
                                  width: 400,
                                  height: 400,
                                  child: Stack(
                                    alignment: Alignment.center,
                                    children: [
                                      // Brilho dourado externo (maior)
                                      Container(
                                        width: 300,
                                        height: 300,
                                        decoration: BoxDecoration(
                                          shape: BoxShape.circle,
                                          boxShadow: [
                                            BoxShadow(
                                              color: const Color(0xFFFFD700)
                                                  .withOpacity(_glowAnimation.value * 0.4),
                                              blurRadius: 80 * _glowAnimation.value,
                                              spreadRadius: 30 * _glowAnimation.value,
                                            ),
                                          ],
                                        ),
                                      ),
                                      // Brilho laranja interno (menor)
                                      Container(
                                        width: 250,
                                        height: 250,
                                        decoration: BoxDecoration(
                                          shape: BoxShape.circle,
                                          boxShadow: [
                                            BoxShadow(
                                              color: const Color(0xFFFF6B35)
                                                  .withOpacity(_glowAnimation.value * 0.3),
                                              blurRadius: 50 * _glowAnimation.value,
                                              spreadRadius: 15 * _glowAnimation.value,
                                            ),
                                          ],
                                        ),
                                      ),
                                      // Logo por cima dos brilhos
                                      Image.asset(
                                        'assets/shared/logo.png',
                                        width: 400,
                                        height: 400,
                                        fit: BoxFit.contain,
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ),
                        );
                      },
                    ),

                    const SizedBox(height: 60),

                    // Indicador de loading com animação
                    AnimatedBuilder(
                      animation: _logoController,
                      builder: (context, child) {
                        return Opacity(
                          opacity: _fadeAnimation.value,
                          child: Column(
                            children: [
                              // Loading circular customizado
                              SizedBox(
                                width: 50,
                                height: 50,
                                child: CircularProgressIndicator(
                                  strokeWidth: 3.5,
                                  valueColor: AlwaysStoppedAnimation<Color>(
                                    Color.lerp(
                                      const Color(0xFFFFD700),
                                      const Color(0xFFFF6B35),
                                      _glowAnimation.value,
                                    )!,
                                  ),
                                  backgroundColor:
                                      Colors.white.withOpacity(0.1),
                                ),
                              ),
                              const SizedBox(height: 24),
                              // Texto "Carregando..."
                              Text(
                                'CARREGANDO...',
                                style: TextStyle(
                                  fontFamily: 'Zany',
                                  fontSize: 18,
                                  color: Color.lerp(
                                    const Color(0xFFFFE6C9),
                                    const Color(0xFFFFFFFF),
                                    _glowAnimation.value * 0.5,
                                  ),
                                  letterSpacing: 3,
                                  shadows: [
                                    Shadow(
                                      color: const Color(0xFFFFD700)
                                          .withOpacity(_glowAnimation.value * 0.6),
                                      blurRadius: 10,
                                    ),
                                    const Shadow(
                                      color: Colors.black54,
                                      offset: Offset(2, 2),
                                      blurRadius: 4,
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

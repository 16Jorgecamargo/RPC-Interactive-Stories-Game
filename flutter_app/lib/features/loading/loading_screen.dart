import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../../shared/utils/screen_helpers.dart';
import '../../shared/widgets/common/app_background.dart';
import '../../shared/widgets/particles/floating_particles.dart';

class LoadingScreen extends StatefulWidget {
  const LoadingScreen({super.key});

  @override
  State<LoadingScreen> createState() => _LoadingScreenState();
}

class _LoadingScreenState extends State<LoadingScreen>
    with TickerProviderStateMixin {
  late AnimationController _rotationController;
  late AnimationController _pulseController;
  late AnimationController _fadeController;
  late AnimationController _progressController;

  late Animation<double> _rotationAnimation;
  late Animation<double> _pulseAnimation;
  late Animation<double> _fadeAnimation;
  late Animation<double> _progressAnimation;

  double _currentProgress = 0.0;
  String _loadingText = 'Carregando...';
  final List<String> _loadingMessages = [
    'Preparando sua aventura...',
    'Lançando os dados do destino...',
    'Consultando os pergaminhos antigos...',
    'Invocando espíritos guardiões...',
    'Quase pronto, aventureiro...',
  ];

  @override
  void initState() {
    super.initState();

    // Controlador de rotação contínua
    _rotationController = AnimationController(
      duration: const Duration(seconds: 3),
      vsync: this,
    )..repeat();

    _rotationAnimation = Tween<double>(
      begin: 0,
      end: 2 * math.pi,
    ).animate(_rotationController);

    // Controlador de pulsação
    _pulseController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    )..repeat(reverse: true);

    _pulseAnimation = Tween<double>(
      begin: 0.9,
      end: 1.1,
    ).animate(CurvedAnimation(
      parent: _pulseController,
      curve: Curves.easeInOut,
    ));

    // Controlador de fade in
    _fadeController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );

    _fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _fadeController,
      curve: Curves.easeIn,
    ));

    // Controlador de progresso
    _progressController = AnimationController(
      duration: const Duration(seconds: 4),
      vsync: this,
    );

    _progressAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _progressController,
      curve: Curves.easeInOut,
    ))..addListener(() {
        setState(() {
          _currentProgress = _progressAnimation.value;
        });
      });

    // Inicia as animações
    _fadeController.forward();
    _startLoading();
  }

  Future<void> _startLoading() async {
    // Simula carregamento com mensagens progressivas
    for (int i = 0; i < _loadingMessages.length; i++) {
      await Future.delayed(Duration(milliseconds: 700 + (i * 100)));
      if (!mounted) return;

      setState(() {
        _loadingText = _loadingMessages[i];
      });

      // Incrementa o progresso - deixa 95% para as mensagens
      final targetProgress = (i + 1) / _loadingMessages.length * 0.95;
      await _progressController.animateTo(
        targetProgress,
        duration: const Duration(milliseconds: 700),
      );
    }

    // Completa a barra até 100%
    await _progressController.animateTo(
      1.0,
      duration: const Duration(milliseconds: 600),
    );

    // Aguarda um pouco no 100% antes de navegar
    await Future.delayed(const Duration(milliseconds: 800));

    if (!mounted) return;

    // Navega para a tela de sessão
    Navigator.of(context).pushReplacementNamed('/session');
  }

  @override
  void dispose() {
    _rotationController.dispose();
    _pulseController.dispose();
    _fadeController.dispose();
    _progressController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isSmallScreen = ScreenHelpers.isSmallScreen(context);

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Stack(
        children: [
          // Background com overlay escuro
          AppBackground(
            imageAsset: 'assets/splash/background.png',
            overlayColor: Colors.black.withOpacity(0.5),
            child: const SizedBox.expand(),
          ),

          // Partículas mágicas
          const Positioned.fill(
            child: FloatingParticles(
              particleCount: 20,
              minSize: 4,
              maxSize: 12,
              minOpacity: 0.3,
              maxOpacity: 0.8,
              speed: 0.15,
              color: Color(0xFFFFD700),
              glowType: ParticleGlowType.spark,
              activity: 1.0,
              spawnFromEdges: true,
              maxActiveParticles: 15,
            ),
          ),

          // Conteúdo principal
          FadeTransition(
            opacity: _fadeAnimation,
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Logo com animação
                  _buildAnimatedLogo(isSmallScreen),

                  SizedBox(height: isSmallScreen ? 60 : 80),

                  // Indicador de loading customizado
                  _buildLoadingIndicator(),

                  const SizedBox(height: 40),

                  // Barra de progresso
                  _buildProgressBar(),

                  const SizedBox(height: 24),

                  // Texto de loading
                  _buildLoadingText(),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAnimatedLogo(bool isSmallScreen) {
    return AnimatedBuilder(
      animation: _pulseAnimation,
      builder: (context, child) {
        return Transform.scale(
          scale: _pulseAnimation.value,
          child: SizedBox(
            width: isSmallScreen ? 250 : 350,
            height: isSmallScreen ? 250 : 350,
            child: Stack(
              alignment: Alignment.center,
              children: [
                // Brilho dourado externo (maior)
                Container(
                  width: (isSmallScreen ? 250 : 350) * 0.85,
                  height: (isSmallScreen ? 250 : 350) * 0.85,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFFFFD700)
                            .withOpacity(_pulseAnimation.value * 0.4),
                        blurRadius: 80 * _pulseAnimation.value,
                        spreadRadius: 30 * _pulseAnimation.value,
                      ),
                    ],
                  ),
                ),
                // Brilho laranja interno (menor)
                Container(
                  width: (isSmallScreen ? 250 : 350) * 0.7,
                  height: (isSmallScreen ? 250 : 350) * 0.7,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFFFF6B35)
                            .withOpacity(_pulseAnimation.value * 0.3),
                        blurRadius: 50 * _pulseAnimation.value,
                        spreadRadius: 15 * _pulseAnimation.value,
                      ),
                    ],
                  ),
                ),
                // Logo por cima dos brilhos
                Image.asset(
                  'assets/shared/logo.png',
                  width: isSmallScreen ? 250 : 350,
                  height: isSmallScreen ? 250 : 350,
                  fit: BoxFit.contain,
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildLoadingIndicator() {
    return SizedBox(
      width: 80,
      height: 80,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Anel externo rotativo
          AnimatedBuilder(
            animation: _rotationAnimation,
            builder: (context, child) {
              return Transform.rotate(
                angle: _rotationAnimation.value,
                child: Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: const Color(0xFFFFD700).withOpacity(0.3),
                      width: 3,
                    ),
                  ),
                  child: CustomPaint(
                    painter: _LoadingArcPainter(
                      progress: _currentProgress,
                      color: const Color(0xFFFFD700),
                    ),
                  ),
                ),
              );
            },
          ),

          // Círculo interno pulsante
          AnimatedBuilder(
            animation: _pulseAnimation,
            builder: (context, child) {
              return Container(
                width: 50 * _pulseAnimation.value,
                height: 50 * _pulseAnimation.value,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: const Color(0xFFFFD700).withOpacity(0.2),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFFFFD700).withOpacity(0.4),
                      blurRadius: 20,
                      spreadRadius: 5,
                    ),
                  ],
                ),
              );
            },
          ),

          // Centro brilhante
          Container(
            width: 20,
            height: 20,
            decoration: const BoxDecoration(
              shape: BoxShape.circle,
              color: Color(0xFFFFD700),
              boxShadow: [
                BoxShadow(
                  color: Color(0xFFFFD700),
                  blurRadius: 15,
                  spreadRadius: 3,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProgressBar() {
    return Center(
      child: SizedBox(
        width: 300, // Largura fixa e mais compacta
        child: Column(
          children: [
            // Container decorativo estilo RPG
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.4),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: const Color(0xFFFFD700).withOpacity(0.4),
                  width: 2,
                ),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFFFFD700).withOpacity(0.2),
                    blurRadius: 20,
                    spreadRadius: 2,
                  ),
                ],
              ),
              child: Column(
                children: [
                  // Barra de progresso
                  Container(
                    height: 14,
                    decoration: BoxDecoration(
                      color: const Color(0xFF1a1a1a),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: const Color(0xFFFFD700).withOpacity(0.5),
                        width: 1.5,
                      ),
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(6),
                      child: Stack(
                        children: [
                          // Background pattern (opcional)
                          Container(
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: [
                                  Colors.black.withOpacity(0.3),
                                  Colors.black.withOpacity(0.1),
                                ],
                                begin: Alignment.topCenter,
                                end: Alignment.bottomCenter,
                              ),
                            ),
                          ),
                          // Barra de progresso
                          FractionallySizedBox(
                            widthFactor: _currentProgress,
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 300),
                              decoration: BoxDecoration(
                                gradient: const LinearGradient(
                                  colors: [
                                    Color(0xFFFFD700),
                                    Color(0xFFFFA500),
                                    Color(0xFFFF8C00),
                                  ],
                                  begin: Alignment.centerLeft,
                                  end: Alignment.centerRight,
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: const Color(0xFFFFD700).withOpacity(0.6),
                                    blurRadius: 8,
                                    spreadRadius: 1,
                                  ),
                                ],
                              ),
                              child: Container(
                                decoration: BoxDecoration(
                                  gradient: LinearGradient(
                                    colors: [
                                      Colors.white.withOpacity(0.3),
                                      Colors.transparent,
                                      Colors.black.withOpacity(0.2),
                                    ],
                                    begin: Alignment.topCenter,
                                    end: Alignment.bottomCenter,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 10),
                  // Porcentagem
                  Text(
                    '${(_currentProgress * 100).toInt()}%',
                    style: TextStyle(
                      fontFamily: 'Zany',
                      fontSize: 18,
                      color: const Color(0xFFFFD700),
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.5,
                      shadows: [
                        Shadow(
                          color: Colors.black.withOpacity(0.8),
                          offset: const Offset(2, 2),
                          blurRadius: 4,
                        ),
                        const Shadow(
                          color: Color(0xFFFFD700),
                          offset: Offset(0, 0),
                          blurRadius: 10,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLoadingText() {
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 400),
      child: Text(
        _loadingText,
        key: ValueKey<String>(_loadingText),
        textAlign: TextAlign.center,
        style: TextStyle(
          fontFamily: 'Zany',
          fontSize: 20,
          color: const Color(0xFFFFF9C4),
          fontWeight: FontWeight.bold,
          shadows: [
            Shadow(
              color: Colors.black.withOpacity(0.8),
              offset: const Offset(2, 2),
              blurRadius: 4,
            ),
            const Shadow(
              color: Color(0xFFFFD700),
              offset: Offset(0, 0),
              blurRadius: 20,
            ),
          ],
        ),
      ),
    );
  }
}

// Painter para o arco de loading
class _LoadingArcPainter extends CustomPainter {
  final double progress;
  final Color color;

  _LoadingArcPainter({
    required this.progress,
    required this.color,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 4
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    final rect = Rect.fromLTWH(0, 0, size.width, size.height);
    const startAngle = -math.pi / 2;
    final sweepAngle = 2 * math.pi * progress;

    canvas.drawArc(rect, startAngle, sweepAngle, false, paint);
  }

  @override
  bool shouldRepaint(_LoadingArcPainter oldDelegate) {
    return oldDelegate.progress != progress || oldDelegate.color != color;
  }
}

import 'dart:math' as math;

import 'package:flutter/material.dart';

/// Widget que cria uma animação de luz tremeluzente de vela
/// Simula o efeito de uma chama de vela piscando e oscilando
class CandleLight extends StatefulWidget {
  const CandleLight({
    super.key,
    required this.position,
    this.size = 120.0,
    this.intensity = 0.8,
    this.color = const Color(0xFFFFAA00),
  });

  /// Posição da vela na tela (normalizada 0.0 a 1.0)
  final Offset position;

  /// Tamanho da luz da vela
  final double size;

  /// Intensidade do brilho (0.0 a 1.0)
  final double intensity;

  /// Cor da luz da vela
  final Color color;

  @override
  State<CandleLight> createState() => _CandleLightState();
}

class _CandleLightState extends State<CandleLight>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  final math.Random _random = math.Random();

  // Parâmetros de oscilação aleatória
  double _flickerPhase1 = 0;
  double _flickerPhase2 = 0;
  double _flickerPhase3 = 0;
  double _nextFlickerChange = 0;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500), // Ritmo médio
    )..repeat();

    _flickerPhase1 = _random.nextDouble() * math.pi * 2;
    _flickerPhase2 = _random.nextDouble() * math.pi * 2;
    _flickerPhase3 = _random.nextDouble() * math.pi * 2;
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        final time = _controller.value * 1.5; // Tempo normalizado

        // Atualizar fases com variação moderada
        if (time >= _nextFlickerChange) {
          _flickerPhase1 += (_random.nextDouble() - 0.5) * 0.5;
          _flickerPhase2 += (_random.nextDouble() - 0.5) * 0.4;
          _flickerPhase3 += (_random.nextDouble() - 0.5) * 0.45;
          _nextFlickerChange = time + 0.08 + _random.nextDouble() * 0.15;
        }

        return CustomPaint(
          painter: _CandleLightPainter(
            position: widget.position,
            size: widget.size,
            intensity: widget.intensity,
            color: widget.color,
            time: time,
            flickerPhase1: _flickerPhase1,
            flickerPhase2: _flickerPhase2,
            flickerPhase3: _flickerPhase3,
          ),
          child: const SizedBox.expand(),
        );
      },
    );
  }
}

class _CandleLightPainter extends CustomPainter {
  _CandleLightPainter({
    required this.position,
    required this.size,
    required this.intensity,
    required this.color,
    required this.time,
    required this.flickerPhase1,
    required this.flickerPhase2,
    required this.flickerPhase3,
  });

  final Offset position;
  final double size;
  final double intensity;
  final Color color;
  final double time;
  final double flickerPhase1;
  final double flickerPhase2;
  final double flickerPhase3;

  @override
  void paint(Canvas canvas, Size canvasSize) {
    final centerX = position.dx * canvasSize.width;
    final centerY = position.dy * canvasSize.height;
    final center = Offset(centerX, centerY);

    // Oscilação visível mas natural
    final flicker1 = math.sin(time * 4.0 + flickerPhase1) * 0.5 + 0.5;
    final flicker2 = math.sin(time * 5.5 + flickerPhase2) * 0.5 + 0.5;
    final flicker3 = math.sin(time * 7.0 + flickerPhase3) * 0.5 + 0.5;

    // Intensidade com variação moderada
    final flickerIntensity = (flicker1 * 0.5 + flicker2 * 0.3 + flicker3 * 0.2)
        .clamp(0.65, 1.0);

    // Movimento perceptível
    final windX = math.sin(time * 3.0 + flickerPhase1) * 2.5 +
                  math.cos(time * 4.2 + flickerPhase2) * 1.2;
    final windY = math.sin(time * 2.8 + flickerPhase3) * 2.0;
    final windOffset = Offset(windX, windY);

    // 4 camadas para mais profundidade
    _drawGlowLayer(
      canvas,
      center + windOffset,
      size * 1.4,
      color,
      intensity * 0.25 * flickerIntensity,
      12.0,
    );

    _drawGlowLayer(
      canvas,
      center + windOffset * 0.7,
      size * 1.0,
      color,
      intensity * 0.40 * flickerIntensity,
      8.0,
    );

    _drawGlowLayer(
      canvas,
      center + windOffset * 0.5,
      size * 0.7,
      Color.lerp(color, const Color(0xFFFFDD88), 0.4)!,
      intensity * 0.55 * flickerIntensity,
      5.0,
    );

    _drawGlowLayer(
      canvas,
      center + windOffset * 0.3,
      size * 0.4,
      const Color(0xFFFFFFF0),
      intensity * 0.7 * flickerIntensity,
      3.0,
    );
  }

  void _drawGlowLayer(
    Canvas canvas,
    Offset center,
    double radius,
    Color baseColor,
    double opacity,
    double blurSigma,
  ) {
    final paint = Paint()
      ..maskFilter = MaskFilter.blur(BlurStyle.normal, blurSigma);

    final gradient = RadialGradient(
      colors: [
        baseColor.withOpacity(opacity),
        baseColor.withOpacity(opacity * 0.6),
        baseColor.withOpacity(opacity * 0.3),
        baseColor.withOpacity(0),
      ],
      stops: const [0.0, 0.4, 0.7, 1.0],
    );

    paint.shader = gradient.createShader(
      Rect.fromCircle(center: center, radius: radius),
    );

    canvas.drawCircle(center, radius, paint);
  }

  @override
  bool shouldRepaint(covariant _CandleLightPainter oldDelegate) {
    return oldDelegate.time != time ||
        oldDelegate.position != position ||
        oldDelegate.size != size ||
        oldDelegate.intensity != intensity ||
        oldDelegate.color != color;
  }
}

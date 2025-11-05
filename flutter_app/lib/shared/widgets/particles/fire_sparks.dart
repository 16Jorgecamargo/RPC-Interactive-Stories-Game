import 'dart:math' as math;

import 'package:flutter/material.dart';

class FireSparks extends StatefulWidget {
  const FireSparks({
    super.key,
    this.spawnRate = 0.08,
    this.maxSparks = 30,
    this.activity = 1.0,
  });

  final double spawnRate;
  final int maxSparks;
  final double activity;

  @override
  State<FireSparks> createState() => _FireSparksState();
}

class _FireSparksState extends State<FireSparks>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  final List<_Spark> _sparks = [];
  final math.Random _random = math.Random();
  double _time = 0;
  double _lastValue = 0;
  double _timeSinceLastBurst = 0;

  // Sistema de vento
  double _windStrength = 0.0;
  double _windDirection = 0.0;
  double _nextWindChange = 0.0;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 10),
    );

    if (widget.activity > 0) {
      _controller.repeat();
    }
  }

  @override
  void didUpdateWidget(covariant FireSparks oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.activity > 0 && !_controller.isAnimating) {
      _controller.repeat();
    } else if (widget.activity <= 0 && _controller.isAnimating) {
      _controller.stop();
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _updateSparks(double delta) {
    // Remove fagulhas que já completaram seu ciclo de vida
    _sparks.removeWhere((spark) => spark.age > spark.lifespan);

    // Sistema de vento dinâmico (brisas aleatórias)
    if (_time >= _nextWindChange) {
      // Muda a direção e força do vento periodicamente
      _windStrength = _random.nextDouble() * 0.15; // 0-0.15 força
      _windDirection = (_random.nextDouble() - 0.5) * 2; // -1 a 1 (esquerda/direita)
      _nextWindChange = _time + 1.5 + _random.nextDouble() * 2.5; // 1.5-4 segundos
    }

    // Sistema de burst: cria grupos de fagulhas em intervalos irregulares
    _timeSinceLastBurst += delta;

    // Burst aleatório (simula labaredas)
    final burstInterval = 0.3 + _random.nextDouble() * 0.7; // 0.3-1.0 segundos
    if (_timeSinceLastBurst >= burstInterval && _sparks.length < widget.maxSparks) {
      final burstSize = 2 + _random.nextInt(4); // 2-5 fagulhas por burst
      for (var i = 0; i < burstSize; i++) {
        if (_sparks.length < widget.maxSparks) {
          _sparks.add(_createSpark());
        }
      }
      _timeSinceLastBurst = 0;
    }

    // Spawn contínuo de fagulhas individuais (menos frequente)
    if (_random.nextDouble() < widget.spawnRate && _sparks.length < widget.maxSparks) {
      _sparks.add(_createSpark());
    }

    // Atualiza idade de cada fagulha
    for (final spark in _sparks) {
      spark.age += delta;
    }
  }

  _Spark _createSpark() {
    // Fagulhas aparecem na parte inferior da tela (80-100% da altura)
    final startY = 0.85 + _random.nextDouble() * 0.15;

    // Posição X aleatória (mais concentrada no centro)
    final centerBias = _random.nextDouble();
    final xPos = centerBias < 0.6
        ? 0.3 + _random.nextDouble() * 0.4  // 60% no centro
        : _random.nextDouble();              // 40% em qualquer lugar

    return _Spark(
      startPosition: Offset(xPos, startY),
      // Velocidade aumentada (fagulhas sobem mais rápido)
      velocity: 0.30 + _random.nextDouble() * 0.55, // 0.30-0.85 (dobrou)
      // Oscilação lateral
      drift: (_random.nextDouble() - 0.5) * 0.08,
      // Tamanho pequeno (2-6 pixels)
      size: 2.0 + _random.nextDouble() * 4.0,
      // Tempo de vida (fagulhas desaparecem rápido)
      lifespan: 1.2 + _random.nextDouble() * 1.5, // 1.2-2.7 segundos
      // Rotação aleatória para movimento natural
      rotation: _random.nextDouble() * math.pi * 2,
      rotationSpeed: (_random.nextDouble() - 0.5) * 4,
      // Cor variada (mais laranja ou mais amarela)
      colorMix: _random.nextDouble(),
      // Fase aleatória para variação no movimento
      phase: _random.nextDouble() * math.pi * 2,
    );
  }

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: AnimatedBuilder(
        animation: _controller,
        builder: (context, _) {
          final value = _controller.value;
          var delta = value - _lastValue;
          if (delta < 0) {
            delta += 1.0;
          }
          final activity = widget.activity.clamp(0.0, 1.0);
          delta *= activity;
          _time += delta;
          _lastValue = value;

          if (delta > 0) {
            _updateSparks(delta);
          }

          return SizedBox.expand(
            child: CustomPaint(
              painter: _FireSparksPainter(
                sparks: _sparks,
                time: _time,
                windStrength: _windStrength,
                windDirection: _windDirection,
              ),
            ),
          );
        },
      ),
    );
  }
}

class _FireSparksPainter extends CustomPainter {
  _FireSparksPainter({
    required this.sparks,
    required this.time,
    required this.windStrength,
    required this.windDirection,
  });

  final List<_Spark> sparks;
  final double time;
  final double windStrength;
  final double windDirection;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..style = PaintingStyle.fill
      ..isAntiAlias = true;

    for (final spark in sparks) {
      // Progresso da fagulha em seu ciclo de vida (0.0 a 1.0)
      final lifeProgress = (spark.age / spark.lifespan).clamp(0.0, 1.0);

      // Posição atual com efeito de vento
      final currentY = spark.startPosition.dy - (spark.velocity * spark.age);

      // Oscilação natural + efeito de vento (brisas)
      final naturalDrift = math.sin(spark.age * 3) * spark.drift;
      final windEffect = windDirection * windStrength * spark.age * 0.5;
      final windGust = math.sin(time * 2 + spark.phase) * windStrength * 0.3;
      final currentX = spark.startPosition.dx + naturalDrift + windEffect + windGust;

      // Fagulha some antes de chegar no GUI (mais cedo agora)
      // Começa a desaparecer aos 25% da altura (ajustado para não chegar no GUI)
      final heightProgress = 1.0 - currentY; // 0.0 = bottom, 1.0 = top
      const fadeStart = 0.25;
      const fadeEnd = 0.35;

      double opacity;
      if (heightProgress < fadeStart) {
        // Fase inicial: fade in rápido
        opacity = math.min(1.0, lifeProgress * 4);
      } else if (heightProgress >= fadeEnd) {
        // Já passou do ponto de desaparecimento
        opacity = 0.0;
      } else {
        // Fade out entre 40% e 50% da altura
        final fadeProgress = (heightProgress - fadeStart) / (fadeEnd - fadeStart);
        opacity = (1.0 - fadeProgress) * math.min(1.0, lifeProgress * 4);
      }

      // Também fade out no final da vida
      if (lifeProgress > 0.8) {
        final endFade = (1.0 - lifeProgress) / 0.2;
        opacity *= endFade;
      }

      if (opacity <= 0.01) continue;

      // Posição na tela
      final dx = currentX * size.width;
      final dy = currentY * size.height;
      final center = Offset(dx, dy);

      // Cor da fagulha (gradiente entre laranja e amarelo)
      final color = Color.lerp(
        const Color(0xFFFF6B35), // Laranja avermelhado
        const Color(0xFFFFD23F), // Amarelo dourado
        spark.colorMix,
      )!;

      // Rotação da fagulha
      final rotation = spark.rotation + spark.rotationSpeed * spark.age;

      // Animação de luz pulsante (labaredas cintilantes)
      final flicker1 = math.sin(time * 8 + spark.phase) * 0.5 + 0.5;
      final flicker2 = math.sin(time * 12 + spark.phase * 1.7) * 0.5 + 0.5;
      final lightIntensity = (flicker1 * 0.6 + flicker2 * 0.4).clamp(0.3, 1.0);

      // Desenha a fagulha (formato de losango alongado)
      canvas.save();
      canvas.translate(center.dx, center.dy);
      canvas.rotate(rotation);

      // Brilho da fagulha (glow) com animação de luz
      final glowPaint = Paint()
        ..style = PaintingStyle.fill
        ..maskFilter = MaskFilter.blur(BlurStyle.normal, 2 + lightIntensity * 1.5);

      final glowRadius = spark.size * 2 * (1 + lightIntensity * 0.3);
      final glowGradient = RadialGradient(
        colors: [
          color.withOpacity(opacity * 0.6 * lightIntensity),
          color.withOpacity(opacity * 0.3 * lightIntensity),
          color.withOpacity(opacity * 0.1 * lightIntensity),
          color.withOpacity(0),
        ],
        stops: const [0.0, 0.4, 0.7, 1.0],
      );

      glowPaint.shader = glowGradient.createShader(
        Rect.fromCircle(center: Offset.zero, radius: glowRadius),
      );

      canvas.drawCircle(Offset.zero, glowRadius, glowPaint);

      // Fagulha principal (forma de losango alongado)
      final path = Path();
      final width = spark.size * 0.5;
      final height = spark.size * 2;

      path.moveTo(0, -height / 2);           // Topo
      path.lineTo(width / 2, 0);             // Direita
      path.lineTo(0, height / 2);            // Base
      path.lineTo(-width / 2, 0);            // Esquerda
      path.close();

      // Gradiente na fagulha com variação de luz
      final sparkGradient = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [
          Colors.white.withOpacity(opacity * 0.9 * lightIntensity),
          color.withOpacity(opacity * 0.8 * lightIntensity),
          color.withOpacity(opacity * 0.5 * lightIntensity),
        ],
      );

      paint.shader = sparkGradient.createShader(
        Rect.fromLTRB(-width / 2, -height / 2, width / 2, height / 2),
      );

      canvas.drawPath(path, paint);

      canvas.restore();
    }
  }

  @override
  bool shouldRepaint(covariant _FireSparksPainter oldDelegate) {
    return oldDelegate.time != time ||
        oldDelegate.sparks != sparks ||
        oldDelegate.windStrength != windStrength ||
        oldDelegate.windDirection != windDirection;
  }
}

class _Spark {
  _Spark({
    required this.startPosition,
    required this.velocity,
    required this.drift,
    required this.size,
    required this.lifespan,
    required this.rotation,
    required this.rotationSpeed,
    required this.colorMix,
    required this.phase,
  });

  final Offset startPosition;
  final double velocity;
  final double drift;
  final double size;
  final double lifespan;
  final double rotation;
  final double rotationSpeed;
  final double colorMix;
  final double phase;

  double age = 0.0;
}

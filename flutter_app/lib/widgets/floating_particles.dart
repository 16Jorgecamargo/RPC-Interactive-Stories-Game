import 'dart:math' as math;

import 'package:flutter/material.dart';

enum ParticleGlowType {
  none,
  firefly, 
  spark,
}

class FloatingParticles extends StatefulWidget {
  const FloatingParticles({
    super.key,
    this.particleCount = 24,
    this.minOpacity = 0.15,
    this.maxOpacity = 0.45,
    this.minSize = 18,
    this.maxSize = 42,
    this.speed = 0.4,
    this.color = const Color(0xFFFFE6C9),
    this.glowType = ParticleGlowType.none,
  });

  final int particleCount;
  final double minOpacity;
  final double maxOpacity;
  final double minSize;
  final double maxSize;
  final double speed;
  final Color color;
  final ParticleGlowType glowType;

  @override
  State<FloatingParticles> createState() => _FloatingParticlesState();
}

class _FloatingParticlesState extends State<FloatingParticles>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final List<_Particle> _particles;
  final math.Random _random = math.Random();
  double _time = 0;
  double _lastValue = 0;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 10),
    )..repeat();

    _particles = List.generate(
      widget.particleCount,
      (_) => _randomParticle(),
    );
  }

  _Particle _randomParticle() {
    return _Particle(
      position: Offset(_random.nextDouble(), _random.nextDouble()),
      size: _random.nextDouble() *
              (widget.maxSize - widget.minSize) +
          widget.minSize,
      baseOpacity: _random.nextDouble() *
              (widget.maxOpacity - widget.minOpacity) +
          widget.minOpacity,
      drift: Offset(
        _random.nextDouble() * 2 - 1,
        _random.nextDouble() * 2 - 1,
      ),
      phase: _random.nextDouble() * 2 * math.pi,
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
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
          _time += delta;
          _lastValue = value;

          return SizedBox.expand(
            child: CustomPaint(
              painter: _ParticlePainter(
                particles: _particles,
                time: _time,
                color: widget.color,
                speed: widget.speed,
                glowType: widget.glowType,
              ),
            ),
          );
        },
      ),
    );
  }
}

class _ParticlePainter extends CustomPainter {
  _ParticlePainter({
    required this.particles,
    required this.time,
    required this.color,
    required this.speed,
    required this.glowType,
  });

  final List<_Particle> particles;
  final double time;
  final Color color;
  final double speed;
  final ParticleGlowType glowType;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..style = PaintingStyle.fill;

    for (final particle in particles) {
      final wave = math.sin(time * 2 * math.pi + particle.phase);
      final offsetX =
          (particle.position.dx + particle.drift.dx * time * speed) %
              1.0;
      final offsetY =
          (particle.position.dy + particle.drift.dy * time * speed) %
              1.0;

      final dx = offsetX * size.width;
      final normalizedY =
          (offsetY + wave * 0.02).clamp(0.0, 1.0).toDouble();
      final dy = normalizedY * size.height;

      final opacity =
          (particle.baseOpacity + wave * 0.1).clamp(0.0, 1.0).toDouble();

      final center = Offset(dx, dy);

      if (glowType != ParticleGlowType.none) {
        _drawGlow(canvas, center, particle, wave, opacity);
      }

      paint.color = color.withOpacity(opacity);
      canvas.drawCircle(
        center,
        particle.size / 2,
        paint,
      );
    }
  }

  void _drawGlow(
    Canvas canvas,
    Offset center,
    _Particle particle,
    double wave,
    double baseOpacity,
  ) {
    final paint = Paint()..style = PaintingStyle.fill;

    if (glowType == ParticleGlowType.firefly) {
      final glowWave = math.sin(time * math.pi * 0.8 + particle.phase);
      final glowIntensity = ((glowWave + 1) / 2).clamp(0.0, 1.0);

      final glowRadius = particle.size * (1.5 + glowIntensity * 1.2);
      final gradient = RadialGradient(
        colors: [
          color.withOpacity(baseOpacity * 0.6 * glowIntensity),
          color.withOpacity(baseOpacity * 0.3 * glowIntensity),
          color.withOpacity(0),
        ],
        stops: const [0.0, 0.5, 1.0],
      );

      paint.shader = gradient.createShader(
        Rect.fromCircle(center: center, radius: glowRadius),
      );

      canvas.drawCircle(center, glowRadius, paint);
    } else if (glowType == ParticleGlowType.spark) {
      final sparkWave = math.sin(time * math.pi * 2.5 + particle.phase);
      final sparkIntensity =
          ((sparkWave + 1) / 2 * 0.7 + 0.3).clamp(0.0, 1.0);

      final randomFactor =
          (math.sin(particle.phase * 3.7) * 0.5 + 0.5).clamp(0.0, 1.0);
      final finalIntensity = sparkIntensity * (0.5 + randomFactor * 0.5);

      final sparkRadius = particle.size * (1.8 + finalIntensity * 1.5);
      final gradient = RadialGradient(
        colors: [
          color.withOpacity(baseOpacity * 0.8 * finalIntensity),
          color.withOpacity(baseOpacity * 0.5 * finalIntensity),
          color.withOpacity(baseOpacity * 0.15 * finalIntensity),
          color.withOpacity(0),
        ],
        stops: const [0.0, 0.3, 0.7, 1.0],
      );

      paint.shader = gradient.createShader(
        Rect.fromCircle(center: center, radius: sparkRadius),
      );

      canvas.drawCircle(center, sparkRadius, paint);
    }
  }

  @override
  bool shouldRepaint(covariant _ParticlePainter oldDelegate) {
    return oldDelegate.time != time ||
        oldDelegate.particles != particles ||
        oldDelegate.color != color ||
        oldDelegate.glowType != glowType;
  }
}

class _Particle {
  _Particle({
    required this.position,
    required this.size,
    required this.baseOpacity,
    required this.drift,
    required this.phase,
  });

  final Offset position;
  final double size;
  final double baseOpacity;
  final Offset drift;
  final double phase;
}


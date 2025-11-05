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
    this.speed = 0.3,
    this.color = const Color(0xFFFFE6C9),
    this.glowType = ParticleGlowType.none,
    this.activity = 1.0,
    this.spawnFromEdges = false,
    this.maxActiveParticles,
    this.startDelay = Duration.zero,
    this.landingZones = const <Rect>[],
  });

  final int particleCount;
  final double minOpacity;
  final double maxOpacity;
  final double minSize;
  final double maxSize;
  final double speed;
  final Color color;
  final ParticleGlowType glowType;
  final double activity;
  final bool spawnFromEdges;
  final int? maxActiveParticles;
  final Duration startDelay;
  final List<Rect> landingZones;

  @override
  State<FloatingParticles> createState() => _FloatingParticlesState();
}

class _FloatingParticlesState extends State<FloatingParticles>
    with SingleTickerProviderStateMixin {
  static const double _edgePadding = 0.08;
  static const double _mouseWakeRadius = 0.08;
  static const double _mouseFearRadius = 0.22;

  late final AnimationController _controller;
  late List<_Particle> _particles;
  final math.Random _random = math.Random();

  double _time = 0;
  double _lastValue = 0;
  double _elapsedSinceActivation = 0;

  Offset? _pointerPosition;

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

    _resetParticles();
  }

  @override
  void didUpdateWidget(covariant FloatingParticles oldWidget) {
    super.didUpdateWidget(oldWidget);
    final becameActive = oldWidget.activity <= 0 && widget.activity > 0;
    final shouldReset = becameActive ||
        widget.particleCount != oldWidget.particleCount ||
        widget.spawnFromEdges != oldWidget.spawnFromEdges ||
        widget.maxActiveParticles != oldWidget.maxActiveParticles;

    if (shouldReset) {
      _controller.value = 0.0;
      _resetParticles();
    } else if (widget.startDelay != oldWidget.startDelay) {
      _elapsedSinceActivation = 0;
    }

    if (widget.activity > 0 && !_controller.isAnimating) {
      _controller.repeat();
    } else if (widget.activity <= 0 && _controller.isAnimating) {
      _controller.stop();
    }
  }

  void _resetParticles() {
    final targetCount = math.max(
      0,
      math.min(
        widget.particleCount,
        widget.maxActiveParticles ?? widget.particleCount,
      ),
    );

    _particles = List.generate(
      targetCount,
      (_) => _randomParticle(),
    );

    _time = 0;
    _lastValue = _controller.value;
    _elapsedSinceActivation = 0;
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Size? _lastKnownSize;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        Size? constraintSize;
        final width = constraints.hasBoundedWidth
            ? constraints.maxWidth
            : context.size?.width ?? double.nan;
        final height = constraints.hasBoundedHeight
            ? constraints.maxHeight
            : context.size?.height ?? double.nan;

        if (width.isFinite && height.isFinite && width > 0 && height > 0) {
          constraintSize = Size(width, height);
          _lastKnownSize = constraintSize;
        }

        final renderSize = _lastKnownSize ?? constraintSize ?? Size.zero;
        final hasArea = renderSize.width > 0 && renderSize.height > 0;

        return MouseRegion(
          opaque: false,
          onHover: (event) {
            if (!hasArea) return;
            final normalized = Offset(
              (event.localPosition.dx / renderSize.width)
                  .clamp(-_edgePadding, 1.0 + _edgePadding),
              (event.localPosition.dy / renderSize.height)
                  .clamp(-_edgePadding, 1.0 + _edgePadding),
            );
            if (_pointerPosition == null ||
                (_pointerPosition! - normalized).distanceSquared >
                    0.00005) {
              setState(() {
                _pointerPosition = normalized;
              });
            }
          },
          onExit: (_) {
            if (_pointerPosition != null) {
              setState(() {
                _pointerPosition = null;
              });
            }
          },
          child: IgnorePointer(
            ignoring: true,
            child: AnimatedBuilder(
              animation: _controller,
              builder: (context, _) {
                if (!hasArea) {
                  return const SizedBox.shrink();
                }

                final value = _controller.value;
                var delta = value - _lastValue;
                if (delta < 0) {
                  delta += 1.0;
                }

                final activity = widget.activity.clamp(0.0, 1.0);
                final durationSeconds =
                    (_controller.duration?.inMicroseconds ?? 0) / 1000000.0;
                final scaledDelta =
                    durationSeconds > 0 ? delta * durationSeconds : delta;

                final dt = scaledDelta * activity;
                _elapsedSinceActivation += dt;

                final delaySeconds =
                    widget.startDelay.inMicroseconds / 1000000.0;
                final isBeforeDelay = _elapsedSinceActivation < delaySeconds;

                if (!isBeforeDelay && dt > 0) {
                  _time += dt;
                  _updateParticles(
                    dt,
                    _pointerPosition,
                  );
                }

                _lastValue = value;

                if (isBeforeDelay) {
                  return const SizedBox.expand();
                }

                return SizedBox.expand(
                  child: CustomPaint(
                    painter: _ParticlePainter(
                      particles: _particles,
                      time: _time,
                      color: widget.color,
                      glowType: widget.glowType,
                      edgePadding:
                          widget.spawnFromEdges ? _edgePadding : 0.0,
                      activity: activity,
                    ),
                  ),
                );
              },
            ),
          ),
        );
      },
    );
  }

  void _updateParticles(
    double dt,
    Offset? pointerNormalized,
  ) {
    if (dt <= 0) {
      return;
    }

    final baseSpeed = widget.speed * 0.35;

    for (var i = 0; i < _particles.length; i++) {
      final particle = _particles[i];
      particle.age += dt;

      if (particle.age >= particle.lifetime) {
        _particles[i] = _randomParticle();
        continue;
      }

      if (particle.isResting) {
        _handleRestingParticle(particle, dt, pointerNormalized);
        _wrapPosition(particle);
        continue;
      }

      // Atualizar progresso de lançamento (aceleração suave)
      if (particle.launchProgress < 1.0) {
        particle.launchProgress = (particle.launchProgress + dt * 0.8).clamp(0.0, 1.0);
      }

      // Animar profundidade suavemente
      particle.depth = particle.depth + (particle.targetDepth - particle.depth) * (dt * 0.6).clamp(0.0, 1.0);

      // Ocasionalmente mudar a profundidade alvo para criar movimento 3D
      if (_random.nextDouble() < dt * 0.15) {
        particle.targetDepth = 0.3 + _random.nextDouble() * 0.7;
      }

      if (particle.canRest && widget.landingZones.isNotEmpty) {
        particle.timeUntilRest -= dt;
        if (particle.timeUntilRest <= 0) {
          final restPoint = _pickRestPoint();
          if (restPoint != null) {
            particle.isResting = true;
            particle.restPoint = restPoint;
            particle.restTimer = 3.0 + _random.nextDouble() * 4.0;
            particle.velocity = Offset.zero;
            particle.targetVelocity = Offset.zero;
            particle.timeUntilRest =
                6.0 + _random.nextDouble() * 6.0;
            _wrapPosition(particle);
            continue;
          }
          particle.timeUntilRest =
              4.0 + _random.nextDouble() * 4.0;
        }
      }

      final baseDirection = particle.baseDirection;

      // Aplicar easing suave ao lançamento usando função ease-out-cubic
      final launchEasing = 1 - math.pow(1 - particle.launchProgress, 3);
      final effectiveSpeed = baseSpeed * particle.speedMultiplier * launchEasing;

      particle.targetVelocity = baseDirection * effectiveSpeed;

      if (pointerNormalized != null && particle.isShy) {
        final diff = particle.position - pointerNormalized;
        final distance = diff.distance;
        if (distance > 0 && distance < _mouseFearRadius) {
          final force = ( _mouseFearRadius - distance) / _mouseFearRadius;
          final avoidance =
              (diff / distance) * (baseSpeed * 2.4 * force);
          particle.targetVelocity += avoidance;
        }
      }

      // Ajustar velocidade baseada na profundidade (perspectiva)
      final depthSpeedMultiplier = 0.6 + particle.depth * 0.4;
      particle.targetVelocity *= depthSpeedMultiplier;

      particle.velocity = Offset.lerp(
            particle.velocity,
            particle.targetVelocity,
            (dt * 2.5).clamp(0.0, 1.0),
          ) ??
          particle.targetVelocity;

      particle.wigglePhase += particle.wiggleFrequency * dt;
      final wiggle = Offset(
        math.sin(particle.wigglePhase) * particle.wiggleAmplitude.dx,
        math.cos(particle.wigglePhase * 0.8) * particle.wiggleAmplitude.dy,
      );

      particle.position += (particle.velocity + wiggle) * dt;

      _wrapPosition(particle);
    }
  }

  void _handleRestingParticle(
    _Particle particle,
    double dt,
    Offset? pointerNormalized,
  ) {
    if (particle.restPoint == null) {
      _launchParticle(particle, pointerNormalized);
      return;
    }

    if (pointerNormalized != null) {
      final diff = particle.restPoint! - pointerNormalized;
      final distance = diff.distance;
      if (distance < _mouseWakeRadius) {
        _launchParticle(particle, pointerNormalized);
        return;
      }
    }

    if (particle.restTimer > 0) {
      particle.restTimer -= dt;
      final t = (dt * 2.5).clamp(0.0, 1.0);
      particle.position = Offset.lerp(
            particle.position,
            particle.restPoint!,
            t,
          ) ??
          particle.restPoint!;

      particle.wigglePhase += particle.wiggleFrequency * dt;
      final hover = Offset(
            math.sin(particle.wigglePhase) *
                particle.wiggleAmplitude.dx *
                0.15,
            math.cos(particle.wigglePhase * 0.9) *
                particle.wiggleAmplitude.dy *
                0.15,
          ) *
          dt;
      particle.position += hover;
      return;
    }

    _launchParticle(particle, pointerNormalized);
  }

  void _launchParticle(_Particle particle, Offset? awayFrom) {
    particle.isResting = false;
    particle.restPoint = null;
    particle.restTimer = 0;
    particle.timeUntilRest =
        6.0 + _random.nextDouble() * 5.0;

    // Reiniciar progresso de lançamento para animação suave
    particle.launchProgress = 0.0;

    final newDirection = _randomFlightDirection(
      origin: particle.position,
      awayFrom: awayFrom,
    );
    particle.baseDirection = newDirection;
    final launchSpeed =
        widget.speed * 0.18 * particle.speedMultiplier;
    particle.targetVelocity = newDirection * launchSpeed;
    // Começar com velocidade muito baixa para aceleração suave
    particle.velocity = newDirection * launchSpeed * 0.1;
  }

  void _wrapPosition(_Particle particle) {
    const double range = 1.0 + _edgePadding * 2;
    var x = particle.position.dx;
    var y = particle.position.dy;

    while (x < -_edgePadding) {
      x += range;
    }
    while (x > 1.0 + _edgePadding) {
      x -= range;
    }
    while (y < -_edgePadding) {
      y += range;
    }
    while (y > 1.0 + _edgePadding) {
      y -= range;
    }

    particle.position = Offset(x, y);
  }

  _Particle _randomParticle() {
    final size = _random.nextDouble() *
            (widget.maxSize - widget.minSize) +
        widget.minSize;
    final baseOpacity = _random.nextDouble() *
            (widget.maxOpacity - widget.minOpacity) +
        widget.minOpacity;
    final normalizedSize = widget.maxSize == widget.minSize
        ? 0.5
        : ((size - widget.minSize) /
                (widget.maxSize - widget.minSize))
            .clamp(0.0, 1.0);

    final spawn = _spawnPositionAndDirection();

    final isShy = _random.nextDouble() < 0.55;
    final canRest =
        widget.landingZones.isNotEmpty && _random.nextDouble() < 0.4;

    final speedMultiplier = _calculateSpeedMultiplier(size);

    final wiggleFrequency =
        0.55 + (1.1 - normalizedSize * 0.45) * _random.nextDouble();
    final wiggleAmplitude = Offset(
      0.008 + normalizedSize * 0.02,
      0.006 + normalizedSize * 0.026,
    );

    final launchSpeed = widget.speed * 0.18 * speedMultiplier;

    // Profundidade inicial aleatória (0.2 a 1.0 para evitar spawn muito distante)
    final initialDepth = 0.2 + _random.nextDouble() * 0.8;

    return _Particle(
      position: spawn.position,
      velocity: spawn.direction * launchSpeed * 0.6,
      baseDirection: spawn.direction,
      targetVelocity: spawn.direction * launchSpeed,
      size: size,
      baseOpacity: baseOpacity,
      phase: _random.nextDouble() * 2 * math.pi,
      speedMultiplier: speedMultiplier,
      lifetime: _randomLifetime(),
      wigglePhase: _random.nextDouble() * 2 * math.pi,
      wiggleFrequency: wiggleFrequency,
      wiggleAmplitude: wiggleAmplitude,
      isShy: isShy,
      canRest: canRest,
      timeUntilRest:
          canRest ? 4.0 + _random.nextDouble() * 6.0 : double.infinity,
      depth: initialDepth,
      targetDepth: initialDepth,
    );
  }

  _SpawnData _spawnPositionAndDirection() {
    if (!widget.spawnFromEdges) {
      final position = Offset(
        _random.nextDouble(),
        _random.nextDouble(),
      );

      final direction = _normalize(Offset(
        (_random.nextDouble() - 0.5) * 0.8,
        (_random.nextDouble() - 0.5) * 0.8,
      ));

      return _SpawnData(position: position, direction: direction);
    }

    final roll = _random.nextDouble();
    Offset position;
    Offset direction;

    if (roll < 0.15) {
      position = Offset(_random.nextDouble(), -_edgePadding);
      direction = Offset(
        (_random.nextDouble() - 0.5) * 0.5,
        0.4 + _random.nextDouble() * 0.6,
      );
    } else if (roll < 0.3) {
      position = Offset(_random.nextDouble(), 1.0 + _edgePadding);
      direction = Offset(
        (_random.nextDouble() - 0.5) * 0.5,
        -0.4 - _random.nextDouble() * 0.6,
      );
    } else if (roll < 0.65) {
      position = Offset(-_edgePadding, _random.nextDouble());
      direction = Offset(
        0.4 + _random.nextDouble() * 0.6,
        (_random.nextDouble() - 0.5) * 0.4,
      );
    } else {
      position = Offset(1.0 + _edgePadding, _random.nextDouble());
      direction = Offset(
        -0.4 - _random.nextDouble() * 0.6,
        (_random.nextDouble() - 0.5) * 0.4,
      );
    }

    return _SpawnData(
      position: position,
      direction: _normalize(direction),
    );
  }

  Offset? _pickRestPoint() {
    if (widget.landingZones.isEmpty) {
      return null;
    }

    const sideMargin = 0.30; // 30% de cada lado é zona segura (evita centro)
    const topMargin = 0.25; // Evitar 25% superior (onde há títulos)

    // Tentativas para encontrar um ponto válido nas laterais
    for (var attempt = 0; attempt < 10; attempt++) {
      final zone = widget.landingZones[
          _random.nextInt(widget.landingZones.length)];

      var x = zone.left + zone.width * _random.nextDouble();
      var y = zone.top + zone.height * _random.nextDouble();

      x = x.clamp(0.0, 1.0);
      y = y.clamp(0.0, 1.0);

      // Verificar se o ponto está nas laterais (não no centro)
      final isOnLeftSide = x < sideMargin;
      final isOnRightSide = x > (1.0 - sideMargin);
      final isNotInTopArea = y > topMargin;

      // Aceitar se está nas laterais E não está na área superior
      if ((isOnLeftSide || isOnRightSide) && isNotInTopArea) {
        return Offset(x, y);
      }
    }

    // Fallback: forçar um ponto nas laterais se não encontrar nenhum válido
    final useLeftSide = _random.nextBool();
    final x = useLeftSide
        ? _random.nextDouble() * sideMargin
        : (1.0 - sideMargin) + _random.nextDouble() * sideMargin;
    final y = topMargin + _random.nextDouble() * (1.0 - topMargin);

    return Offset(x.clamp(0.0, 1.0), y.clamp(0.0, 1.0));
  }

  Offset _randomFlightDirection({
    required Offset origin,
    Offset? awayFrom,
  }) {
    Offset direction;

    if (awayFrom != null) {
      final diff = origin - awayFrom;
      if (diff.distanceSquared > 0.0001) {
        direction = diff;
      } else {
        direction = Offset(
          (_random.nextDouble() - 0.5),
          (_random.nextDouble() - 0.5),
        );
      }
    } else {
      direction = Offset(
        (_random.nextDouble() - 0.5) * 0.8,
        (_random.nextDouble() - 0.5) * 0.8,
      );
    }

    direction = _normalize(direction);

    direction += Offset(
      (_random.nextDouble() - 0.5) * 0.25,
      (_random.nextDouble() - 0.5) * 0.25,
    );

    return _normalize(direction);
  }

  double _calculateSpeedMultiplier(double size) {
    final range = (widget.maxSize - widget.minSize).abs();
    if (range <= 0.0001) {
      return 0.6;
    }

    final normalized =
        ((size - widget.minSize) / range).clamp(0.0, 1.0);

    return 0.3 + normalized * 0.9;
  }

  double _randomLifetime() {
    return 12.0 + _random.nextDouble() * 6.0;
  }

  Offset _normalize(Offset vector) {
    final magnitude = vector.distance;
    if (magnitude == 0) {
      return const Offset(0.5, 0.0);
    }

    return vector / magnitude;
  }
}

class _SpawnData {
  const _SpawnData({
    required this.position,
    required this.direction,
  });

  final Offset position;
  final Offset direction;
}

class _ParticlePainter extends CustomPainter {
  _ParticlePainter({
    required this.particles,
    required this.time,
    required this.color,
    required this.glowType,
    required this.edgePadding,
    required this.activity,
  });

  final List<_Particle> particles;
  final double time;
  final Color color;
  final ParticleGlowType glowType;
  final double edgePadding;
  final double activity;

  @override
  void paint(Canvas canvas, Size size) {
    if (activity <= 0 || particles.isEmpty) {
      return;
    }

    final paint = Paint()..style = PaintingStyle.fill;

    for (final particle in particles) {
      final wave = math.sin(time * 2 * math.pi + particle.phase);
      final pos = particle.position;

      final dx = pos.dx * size.width;
      final dy = pos.dy * size.height;

      // Fade progressivo expandido nas bordas (começa mais cedo)
      const fadeZone = 0.20; // 20% da tela nas bordas terá fade
      double edgeFade = 1.0;

      // Fade horizontal
      double fadeX = 1.0;
      if (pos.dx < fadeZone) {
        fadeX = pos.dx / fadeZone;
      } else if (pos.dx > 1.0 - fadeZone) {
        fadeX = (1.0 - pos.dx) / fadeZone;
      }

      // Fade vertical
      double fadeY = 1.0;
      if (pos.dy < fadeZone) {
        fadeY = pos.dy / fadeZone;
      } else if (pos.dy > 1.0 - fadeZone) {
        fadeY = (1.0 - pos.dy) / fadeZone;
      }

      edgeFade = (fadeX.clamp(0.0, 1.0) * fadeY.clamp(0.0, 1.0)).clamp(0.0, 1.0);

      // Aplicar curva de easing ao fade para suavidade extra
      edgeFade = edgeFade * edgeFade; // quadratic ease

      // Fade baseado no lifetime (fade-in e fade-out)
      double lifetimeFade = 1.0;
      const fadeInDuration = 0.8; // segundos para fade-in
      const fadeOutDuration = 2.0; // segundos para fade-out

      if (particle.age < fadeInDuration) {
        lifetimeFade = particle.age / fadeInDuration;
      } else if (particle.age > particle.lifetime - fadeOutDuration) {
        final timeLeft = particle.lifetime - particle.age;
        lifetimeFade = timeLeft / fadeOutDuration;
      }

      // Calcular tamanho baseado na profundidade (0.0 = distante/pequeno, 1.0 = próximo/grande)
      final depthScale = 0.4 + particle.depth * 0.6; // varia de 40% a 100% do tamanho
      final effectiveSize = particle.size * depthScale;

      final opacity =
          ((particle.baseOpacity + wave * 0.1)
                  .clamp(0.0, 1.0)
                  .toDouble()) *
              edgeFade *
              lifetimeFade *
              activity;

      final center = Offset(dx, dy);

      if (glowType != ParticleGlowType.none) {
        _drawGlow(canvas, center, particle, wave, opacity, effectiveSize);
      }

      paint.color = color.withOpacity(opacity);
      canvas.drawCircle(
        center,
        effectiveSize / 2,
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
    double effectiveSize,
  ) {
    final paint = Paint()..style = PaintingStyle.fill;

    if (glowType == ParticleGlowType.firefly) {
      final glowWave = math.sin(time * math.pi * 0.8 + particle.phase);
      final glowIntensity = ((glowWave + 1) / 2).clamp(0.0, 1.0);

      final glowRadius = effectiveSize * (1.5 + glowIntensity * 1.2);
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
      final sparkWave = math.sin(time * math.pi * 2.2 + particle.phase);
      final sparkIntensity =
          ((sparkWave + 1) / 2 * 0.7 + 0.3).clamp(0.0, 1.0);

      final randomFactor =
          (math.sin(particle.phase * 3.7) * 0.5 + 0.5).clamp(0.0, 1.0);
      final finalIntensity = sparkIntensity * (0.5 + randomFactor * 0.5);

      final sparkRadius = effectiveSize * (1.6 + finalIntensity * 1.4);
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
        oldDelegate.glowType != glowType ||
        oldDelegate.edgePadding != edgePadding ||
        oldDelegate.activity != activity;
  }
}

class _Particle {
  _Particle({
    required this.position,
    required this.velocity,
    required this.baseDirection,
    required this.targetVelocity,
    required this.size,
    required this.baseOpacity,
    required this.phase,
    required this.speedMultiplier,
    required this.lifetime,
    required this.wigglePhase,
    required this.wiggleFrequency,
    required this.wiggleAmplitude,
    required this.isShy,
    required this.canRest,
    required this.timeUntilRest,
    required this.depth,
    required this.targetDepth,
  });

  Offset position;
  Offset velocity;
  Offset baseDirection;
  Offset targetVelocity;

  final double size;
  final double baseOpacity;
  final double phase;
  final double speedMultiplier;
  final double lifetime;

  double age = 0;
  double wigglePhase;
  final double wiggleFrequency;
  final Offset wiggleAmplitude;

  bool isShy;
  bool canRest;
  bool isResting = false;

  double restTimer = 0;
  Offset? restPoint;
  double timeUntilRest;

  // Sistema de profundidade 3D (0.0 = distante, 1.0 = próximo)
  double depth;
  double targetDepth;
  double launchProgress = 1.0; // 0.0 = início do lançamento, 1.0 = velocidade normal
}

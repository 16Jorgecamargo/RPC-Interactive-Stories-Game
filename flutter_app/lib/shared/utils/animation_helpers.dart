import 'dart:math' as math;

import 'package:flutter/material.dart';

/// Helpers para animações reutilizáveis
/// Contém constantes e métodos usados em múltiplas telas
class AnimationHelpers {
  AnimationHelpers._();

  // ========== CONSTANTES DE ANIMAÇÃO ==========

  /// Duração padrão de entrada de telas
  static const Duration defaultEntryDuration = Duration(milliseconds: 700);

  /// Duração padrão de saída de telas
  static const Duration defaultExitDuration = Duration(milliseconds: 300);

  /// Escala inicial do background na entrada
  static const double defaultStartBackgroundScale = 1.4;

  /// Escala extra da GUI durante animação
  static const double defaultGuiExtraScale = 0.12;

  /// Escala do background na saída
  static const double defaultExitBackgroundScale = 1.35;

  /// Escala extra da GUI na saída
  static const double defaultExitGuiExtraScale = 0.15;

  /// Tempo de lead do fade em segundos
  static const double defaultFadeLeadSeconds = 0.5;

  // ========== MÉTODOS DE CÁLCULO ==========

  /// Calcula o ponto de corte do fade baseado na duração e lead time
  /// [duration] - duração total da animação
  /// [fadeLeadSeconds] - tempo de antecedência do fade
  static double calculateFadeCutoff({
    required Duration duration,
    double fadeLeadSeconds = defaultFadeLeadSeconds,
  }) {
    final total = duration.inMilliseconds.toDouble();
    final leadMs = (fadeLeadSeconds * 1000).clamp(0.0, total - 100);
    return ((total - leadMs) / total).clamp(0.0, 1.0);
  }

  /// Calcula a opacidade da GUI baseado no progresso da animação
  /// [progress] - progresso da animação (0.0 a 1.0)
  /// [fadeCutoff] - ponto onde o fade começa
  static double computeGuiOpacity({
    required double progress,
    required double fadeCutoff,
  }) {
    final cutoff = fadeCutoff.clamp(0.0, 0.9);
    final returnStart = math.min(0.98, cutoff + 0.25);

    if (cutoff <= 0.0) {
      return 1.0;
    }

    // Fade out inicial
    if (progress <= cutoff) {
      final t = (progress / cutoff).clamp(0.0, 1.0);
      return 1.0 - t;
    }

    // Período invisível
    if (progress <= returnStart) {
      return 0.0;
    }

    // Fade in final
    final t = ((progress - returnStart) / (1.0 - returnStart)).clamp(0.0, 1.0);
    return Curves.easeOut.transform(t);
  }

  /// Calcula a escala do background durante entrada
  /// [progress] - progresso da animação (0.0 a 1.0)
  /// [startScale] - escala inicial
  /// [curve] - curva de animação a aplicar
  static double calculateBackgroundScaleIn({
    required double progress,
    double startScale = defaultStartBackgroundScale,
    Curve curve = Curves.easeOutCubic,
  }) {
    final curvedProgress = curve.transform(progress);
    return lerpDouble(startScale, 1.0, curvedProgress);
  }

  /// Calcula a escala do background durante saída
  /// [progress] - progresso da animação (0.0 a 1.0)
  /// [endScale] - escala final
  /// [curve] - curva de animação a aplicar
  static double calculateBackgroundScaleOut({
    required double progress,
    double endScale = defaultExitBackgroundScale,
    Curve curve = Curves.easeIn,
  }) {
    final curvedProgress = curve.transform(progress);
    return lerpDouble(1.0, endScale, curvedProgress);
  }

  /// Calcula a escala relativa da GUI
  /// [entryProgress] - progresso da entrada (0.0 a 1.0)
  /// [exitProgress] - progresso da saída (0.0 a 1.0)
  /// [extraGuiScale] - escala extra durante entrada
  /// [exitGuiExtraScale] - escala extra durante saída
  static double calculateGuiScale({
    required double entryProgress,
    required double exitProgress,
    double extraGuiScale = defaultGuiExtraScale,
    double exitGuiExtraScale = defaultExitGuiExtraScale,
  }) {
    return (1.0 + extraGuiScale * (1.0 - entryProgress)) *
        (1.0 + exitGuiExtraScale * exitProgress);
  }

  /// Calcula o sigma do blur baseado no progresso
  /// [progress] - progresso da animação (0.0 a 1.0)
  /// [maxBlur] - blur máximo
  static double calculateBlurSigma({
    required double progress,
    double maxBlur = 24.0,
  }) {
    return progress * maxBlur;
  }

  // ========== BUILDERS DE ANIMAÇÃO ==========

  /// Cria um AnimationController padrão para entrada de tela
  static AnimationController createEntryController({
    required TickerProvider vsync,
    Duration duration = defaultEntryDuration,
    bool autoForward = true,
  }) {
    final controller = AnimationController(
      vsync: vsync,
      duration: duration,
    );

    if (autoForward) {
      controller.forward();
    }

    return controller;
  }

  /// Cria um AnimationController padrão para saída de tela
  static AnimationController createExitController({
    required TickerProvider vsync,
    Duration duration = defaultExitDuration,
  }) {
    return AnimationController(
      vsync: vsync,
      duration: duration,
    );
  }
}

/// Helper function para lerp de doubles
double lerpDouble(double a, double b, double t) {
  return a + (b - a) * t;
}

import 'dart:ui';

import 'package:flutter/material.dart';

import '../../../shared/utils/animation_helpers.dart';

/// Mixin que fornece lógica compartilhada de animação para telas de autenticação
/// Elimina duplicação entre LoginScreen e RegisterScreen
mixin AuthScreenMixin<T extends StatefulWidget> on State<T>, TickerProviderStateMixin<T> {
  // Controllers de animação
  late final AnimationController entryController;
  late final AnimationController exitController;

  // Configurações de animação (podem ser sobrescritas)
  Duration get entryDuration => AnimationHelpers.defaultEntryDuration;
  Duration get exitDuration => AnimationHelpers.defaultExitDuration;
  double get startBackgroundScale => AnimationHelpers.defaultStartBackgroundScale;
  double get extraGuiScale => AnimationHelpers.defaultGuiExtraScale;
  double get exitBackgroundScale => AnimationHelpers.defaultExitBackgroundScale;
  double get exitGuiExtraScale => AnimationHelpers.defaultExitGuiExtraScale;
  double get fadeLeadSeconds => AnimationHelpers.defaultFadeLeadSeconds;

  // Valores calculados
  double get fadeCutoff => AnimationHelpers.calculateFadeCutoff(
        duration: entryDuration,
        fadeLeadSeconds: fadeLeadSeconds,
      );

  /// Inicializa os controllers de animação
  /// Deve ser chamado no initState da classe que usa o mixin
  void initAuthAnimations() {
    entryController = AnimationHelpers.createEntryController(
      vsync: this,
      duration: entryDuration,
    );

    exitController = AnimationHelpers.createExitController(
      vsync: this,
      duration: exitDuration,
    );
  }

  /// Descarta os controllers de animação
  /// Deve ser chamado no dispose da classe que usa o mixin
  void disposeAuthAnimations() {
    entryController.dispose();
    exitController.dispose();
  }

  /// Calcula a opacidade da GUI baseado no progresso da animação
  double computeGuiOpacity(double entryProgress) {
    return AnimationHelpers.computeGuiOpacity(
      progress: entryProgress,
      fadeCutoff: fadeCutoff,
    );
  }

  /// Calcula a escala do background durante entrada
  double calculateBackgroundScaleIn(double progress) {
    return AnimationHelpers.calculateBackgroundScaleIn(
      progress: progress,
      startScale: startBackgroundScale,
    );
  }

  /// Calcula a escala do background durante saída
  double calculateBackgroundScaleOut(double progress) {
    return AnimationHelpers.calculateBackgroundScaleOut(
      progress: progress,
      endScale: exitBackgroundScale,
    );
  }

  /// Calcula a escala relativa da GUI
  double calculateGuiScale({
    required double entryProgress,
    required double exitProgress,
  }) {
    return AnimationHelpers.calculateGuiScale(
      entryProgress: entryProgress,
      exitProgress: exitProgress,
      extraGuiScale: extraGuiScale,
      exitGuiExtraScale: exitGuiExtraScale,
    );
  }

  /// Calcula o sigma do blur baseado no progresso de saída
  double calculateBlurSigma(double exitProgress) {
    return AnimationHelpers.calculateBlurSigma(progress: exitProgress);
  }

  /// Constrói o widget com animações aplicadas
  /// [child] - O conteúdo da tela (sem animações)
  /// [applyBlur] - Se deve aplicar blur durante saída (padrão: true)
  Widget buildAnimatedScene({
    required Widget child,
    bool applyBlur = true,
  }) {
    return AnimatedBuilder(
      animation: Listenable.merge([entryController, exitController]),
      builder: (context, _) {
        final entryProgress = entryController.value;
        final exitProgress = exitController.value;

        final entryCurve = Curves.easeOutCubic.transform(entryProgress);
        final exitCurve = Curves.easeIn.transform(exitProgress);

        final backgroundScaleIn = calculateBackgroundScaleIn(entryCurve);
        final backgroundScaleOut = calculateBackgroundScaleOut(exitCurve);
        final backgroundScale = backgroundScaleIn * backgroundScaleOut;

        final guiRelativeScale = calculateGuiScale(
          entryProgress: entryCurve,
          exitProgress: exitCurve,
        );

        final guiOpacity = computeGuiOpacity(entryProgress) *
            (1.0 - exitProgress).clamp(0.0, 1.0);

        Widget scene = Transform.scale(
          scale: guiRelativeScale,
          alignment: Alignment.topCenter,
          child: Opacity(
            opacity: guiOpacity,
            child: child,
          ),
        );

        Widget animated = Transform.scale(
          scale: backgroundScale,
          alignment: Alignment.center,
          child: scene,
        );

        // Aplica blur durante saída se solicitado
        if (applyBlur && exitProgress > 0.01) {
          final blurSigma = calculateBlurSigma(exitProgress);
          animated = ImageFiltered(
            imageFilter: ImageFilter.blur(
              sigmaX: blurSigma * 0.6,
              sigmaY: blurSigma,
            ),
            child: animated,
          );

          // Adiciona overlay de brilho durante blur
          animated = Stack(
            children: [
              animated,
              Positioned.fill(
                child: IgnorePointer(
                  child: Opacity(
                    opacity: (exitProgress * 0.4).clamp(0.0, 0.35),
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

        return animated;
      },
    );
  }
}

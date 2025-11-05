import 'dart:ui';

import 'package:flutter/material.dart';

/// Helpers para navegação e transições entre telas
class NavigationHelpers {
  NavigationHelpers._();

  /// Navega para outra tela com animação de transição customizada
  /// [context] - contexto da navegação
  /// [destination] - widget de destino
  /// [routeName] - nome da rota (opcional, para atualizar URL)
  /// [exitController] - controller de saída da tela atual
  /// [entryDuration] - duração da entrada da próxima tela
  /// [exitDuration] - duração da saída da tela atual
  static Future<T?> navigateWithTransition<T>({
    required BuildContext context,
    Widget? destination,
    String? routeName,
    AnimationController? exitController,
    Duration entryDuration = const Duration(milliseconds: 700),
    Duration exitDuration = const Duration(milliseconds: 300),
  }) async {
    assert(destination != null || routeName != null,
      'Deve fornecer destination ou routeName');

    // Executa animação de saída se fornecido um controller
    if (exitController != null) {
      await exitController.forward();
    }

    if (!context.mounted) return null;

    // Captura o navigator antes do async gap
    final navigator = Navigator.of(context);

    // Navega para a nova tela com fundo escuro
    final result = routeName != null
        ? await navigator.pushNamed<T>(
            routeName,
          )
        : await navigator.push<T>(
            PageRouteBuilder(
              pageBuilder: (_, __, ___) => destination!,
              transitionDuration: Duration.zero,
              reverseTransitionDuration: Duration.zero,
              transitionsBuilder: (_, __, ___, child) => child,
              opaque: false, // Permite transparência
              barrierColor: const Color(0xFF1A0F0A), // Marrom escuro
            ),
          );

    if (!context.mounted) return result;

    // Aguarda um frame antes de reverter a animação
    await Future.delayed(const Duration(milliseconds: 16));
    if (!context.mounted) return result;

    // Reverte a animação de saída com duração de entrada
    if (exitController != null) {
      exitController.duration = entryDuration;
      await exitController.reverse();
      if (context.mounted) {
        exitController.duration = exitDuration;
      }
    }

    return result;
  }

  /// Navega substituindo a tela atual (pushReplacement)
  /// [context] - contexto da navegação
  /// [destination] - widget de destino
  static Future<T?> navigateReplace<T extends Object?, TO extends Object?>({
    required BuildContext context,
    required Widget destination,
  }) {
    return Navigator.of(context).pushReplacement<T, TO>(
      MaterialPageRoute(builder: (_) => destination),
    );
  }

  /// Navega para uma rota nomeada
  /// [context] - contexto da navegação
  /// [routeName] - nome da rota
  /// [arguments] - argumentos opcionais
  static Future<T?> navigateToNamed<T extends Object?>({
    required BuildContext context,
    required String routeName,
    Object? arguments,
  }) {
    return Navigator.of(context).pushNamed<T>(
      routeName,
      arguments: arguments,
    );
  }

  /// Navega para uma rota nomeada substituindo a atual
  /// [context] - contexto da navegação
  /// [routeName] - nome da rota
  /// [arguments] - argumentos opcionais
  static Future<T?> navigateToNamedReplace<T extends Object?, TO extends Object?>({
    required BuildContext context,
    required String routeName,
    Object? arguments,
  }) {
    return Navigator.of(context).pushReplacementNamed<T, TO>(
      routeName,
      arguments: arguments,
    );
  }

  /// Mostra um dialog customizado
  /// [context] - contexto
  /// [builder] - builder do conteúdo do dialog
  /// [barrierDismissible] - se pode fechar clicando fora
  static Future<T?> showCustomDialog<T>({
    required BuildContext context,
    required Widget Function(BuildContext) builder,
    bool barrierDismissible = true,
  }) {
    return showDialog<T>(
      context: context,
      barrierDismissible: barrierDismissible,
      builder: builder,
    );
  }

  /// Mostra um dialog com blur de fundo
  /// [context] - contexto
  /// [builder] - builder do conteúdo do dialog
  /// [blurSigma] - intensidade do blur
  /// [barrierDismissible] - se pode fechar clicando fora
  static Future<T?> showBlurredDialog<T>({
    required BuildContext context,
    required Widget Function(BuildContext) builder,
    double blurSigma = 10.0,
    bool barrierDismissible = true,
  }) {
    return showDialog<T>(
      context: context,
      barrierDismissible: barrierDismissible,
      barrierColor: Colors.black.withOpacity(0.3),
      builder: (context) {
        return BackdropFilter(
          filter: ImageFilter.blur(sigmaX: blurSigma, sigmaY: blurSigma),
          child: builder(context),
        );
      },
    );
  }

  /// Mostra uma SnackBar
  /// [context] - contexto
  /// [message] - mensagem a exibir
  /// [duration] - duração da SnackBar
  static void showSnackBar({
    required BuildContext context,
    required String message,
    Duration duration = const Duration(seconds: 3),
  }) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        duration: duration,
      ),
    );
  }

  /// Fecha o dialog atual
  /// [context] - contexto
  /// [result] - resultado opcional
  static void closeDialog<T>(BuildContext context, [T? result]) {
    Navigator.of(context).pop(result);
  }

  /// Volta para a tela anterior
  /// [context] - contexto
  /// [result] - resultado opcional
  static void goBack<T>(BuildContext context, [T? result]) {
    Navigator.of(context).pop(result);
  }
}

import 'package:flutter/material.dart';

/// Helpers para responsividade e informações de tela
class ScreenHelpers {
  ScreenHelpers._();

  /// Breakpoint para telas pequenas (mobile)
  static const double smallScreenBreakpoint = 600;

  /// Breakpoint para telas médias (tablet)
  static const double mediumScreenBreakpoint = 900;

  /// Breakpoint para telas grandes (desktop)
  static const double largeScreenBreakpoint = 1200;

  /// Verifica se a tela é considerada pequena (mobile)
  /// [context] - contexto para obter MediaQuery
  static bool isSmallScreen(BuildContext context) {
    return MediaQuery.of(context).size.width < smallScreenBreakpoint;
  }

  /// Verifica se a tela é considerada média (tablet)
  /// [context] - contexto para obter MediaQuery
  static bool isMediumScreen(BuildContext context) {
    final width = MediaQuery.of(context).size.width;
    return width >= smallScreenBreakpoint && width < mediumScreenBreakpoint;
  }

  /// Verifica se a tela é considerada grande (desktop)
  /// [context] - contexto para obter MediaQuery
  static bool isLargeScreen(BuildContext context) {
    return MediaQuery.of(context).size.width >= mediumScreenBreakpoint;
  }

  /// Obtém a largura da tela
  /// [context] - contexto para obter MediaQuery
  static double getScreenWidth(BuildContext context) {
    return MediaQuery.of(context).size.width;
  }

  /// Obtém a altura da tela
  /// [context] - contexto para obter MediaQuery
  static double getScreenHeight(BuildContext context) {
    return MediaQuery.of(context).size.height;
  }

  /// Retorna um valor baseado no tamanho da tela
  /// [context] - contexto para obter MediaQuery
  /// [small] - valor para telas pequenas
  /// [medium] - valor para telas médias (opcional, usa small se não fornecido)
  /// [large] - valor para telas grandes (opcional, usa medium se não fornecido)
  static T getResponsiveValue<T>({
    required BuildContext context,
    required T small,
    T? medium,
    T? large,
  }) {
    if (isLargeScreen(context)) {
      return large ?? medium ?? small;
    } else if (isMediumScreen(context)) {
      return medium ?? small;
    } else {
      return small;
    }
  }

  /// Retorna padding horizontal responsivo
  /// [context] - contexto para obter MediaQuery
  static EdgeInsets getResponsiveHorizontalPadding(BuildContext context) {
    return EdgeInsets.symmetric(
      horizontal: isSmallScreen(context) ? 20 : 40,
    );
  }

  /// Retorna padding simétrico responsivo
  /// [context] - contexto para obter MediaQuery
  /// [smallHorizontal] - padding horizontal para telas pequenas
  /// [largeHorizontal] - padding horizontal para telas grandes
  /// [vertical] - padding vertical (mesmo para todos)
  static EdgeInsets getResponsivePadding({
    required BuildContext context,
    double smallHorizontal = 20,
    double largeHorizontal = 40,
    double vertical = 20,
  }) {
    return EdgeInsets.symmetric(
      horizontal: isSmallScreen(context) ? smallHorizontal : largeHorizontal,
      vertical: vertical,
    );
  }

  /// Calcula uma largura máxima responsiva para conteúdo
  /// [context] - contexto para obter MediaQuery
  /// [smallScreenPercentage] - porcentagem da tela em dispositivos pequenos
  /// [maxWidth] - largura máxima em telas grandes
  static double getResponsiveContentWidth({
    required BuildContext context,
    double smallScreenPercentage = 0.9,
    double maxWidth = 400,
  }) {
    final screenWidth = getScreenWidth(context);
    if (isSmallScreen(context)) {
      return screenWidth * smallScreenPercentage;
    } else {
      return maxWidth;
    }
  }

  /// Obtém o tamanho de texto responsivo
  /// [context] - contexto para obter MediaQuery
  /// [baseFontSize] - tamanho base da fonte
  static double getResponsiveFontSize({
    required BuildContext context,
    required double baseFontSize,
  }) {
    final scale = MediaQuery.of(context).textScaleFactor;
    return baseFontSize * scale;
  }

  /// Verifica se o dispositivo está em modo paisagem
  /// [context] - contexto para obter MediaQuery
  static bool isLandscape(BuildContext context) {
    return MediaQuery.of(context).orientation == Orientation.landscape;
  }

  /// Verifica se o dispositivo está em modo retrato
  /// [context] - contexto para obter MediaQuery
  static bool isPortrait(BuildContext context) {
    return MediaQuery.of(context).orientation == Orientation.portrait;
  }

  /// Obtém o padding seguro (safe area)
  /// [context] - contexto para obter MediaQuery
  static EdgeInsets getSafeAreaPadding(BuildContext context) {
    return MediaQuery.of(context).padding;
  }

  /// Verifica se o teclado está visível
  /// [context] - contexto para obter MediaQuery
  static bool isKeyboardVisible(BuildContext context) {
    return MediaQuery.of(context).viewInsets.bottom > 0;
  }
}

import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../../shared/utils/custom_colors.dart';
import '../../shared/widgets/common/app_background.dart';
import '../../shared/widgets/particles/candle_light.dart';

class SessionScreen extends StatefulWidget {
  const SessionScreen({super.key});

  @override
  State<SessionScreen> createState() => _SessionScreenState();
}

class _SessionScreenState extends State<SessionScreen> {
  static const double _bookAspectRatio = 934 / 612;
  static const double _bookReferenceWidth = 934;
  static const double _buttonScale = 0.055;
  static const double _maxButtonReduction = 18;
  static const double _buttonMinSize = 16;
  static const double _buttonMaxSize = 48;
  static const List<Offset> _bookmarkAnchors = [
    Offset(0.636, 0.0507),
    Offset(0.7222, 0.058),
    Offset(0.8164, 0.0727),
  ];
  static const List<List<double>> _cardSlots = [
    [0.107, 0.20, 0.38, 0.20],
    [0.106, 0.38, 0.38, 0.20],
    [0.107, 0.57, 0.38, 0.20],
    [0.524, 0.19, 0.38, 0.20],
    [0.517, 0.38, 0.38, 0.20],
    [0.516, 0.56, 0.38, 0.20],
  ];

  bool _isHovering1 = false;
  bool _isHovering2 = false;
  bool _isHovering3 = false;
  int? _hoveredCard;

  void _showCodeDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: CustomColors.panelBackground,
        title: const Text(
          'Entrar na Sessao',
          style: TextStyle(
            fontFamily: 'Zany',
            color: CustomColors.fieldBorder,
          ),
        ),
        content: TextField(
          decoration: InputDecoration(
            hintText: 'Digite o codigo da sessao',
            hintStyle: const TextStyle(
              fontFamily: 'Zany',
              color: CustomColors.fieldText,
            ),
            filled: true,
            fillColor: CustomColors.fieldBackground,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(
                color: CustomColors.fieldBorder,
              ),
            ),
          ),
          style: const TextStyle(
            fontFamily: 'Zany',
            color: CustomColors.fieldText,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text(
              'Cancelar',
              style: TextStyle(
                fontFamily: 'Zany',
                color: CustomColors.fieldBorder,
              ),
            ),
          ),
          ElevatedButton(
            onPressed: () {
              // Fecha o dialog e navega para a transição em vídeo
              Navigator.pop(context);
              Navigator.pushReplacementNamed(context, '/lobby-transition');
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: CustomColors.buttonGreenMedium,
            ),
            child: const Text(
              'Entrar',
              style: TextStyle(
                fontFamily: 'Zany',
                color: CustomColors.fieldText,
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _logout() {
    Navigator.pushReplacementNamed(context, '/login');
  }

  void _createSession() {
    // Navega para a transição em vídeo antes do lobby
    Navigator.pushReplacementNamed(context, '/lobby-transition');
  }

  Widget _buildBookmarkButton({
    required String assetPath,
    required String tooltip,
    required VoidCallback onPressed,
    required bool isHovering,
    required Function(bool) onHover,
    required double top,
    required double left,
    double size = 50,
    double rotation = 0.0,
  }) {
    return Positioned(
      top: top,
      left: left,
      child: MouseRegion(
        cursor: SystemMouseCursors.click,
        onEnter: (_) => onHover(true),
        onExit: (_) => onHover(false),
        child: Tooltip(
          message: tooltip,
          textStyle: const TextStyle(
            fontFamily: 'Zany',
            color: Colors.white,
            fontSize: 14,
          ),
          decoration: BoxDecoration(
            color: CustomColors.fieldBorder,
            borderRadius: BorderRadius.circular(4),
          ),
          child: AnimatedScale(
            scale: isHovering ? 1.2 : 1.0,
            duration: const Duration(milliseconds: 200),
            curve: Curves.easeInOut,
            child: GestureDetector(
              onTap: onPressed,
              child: Container(
                width: size,
                height: size,
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(8),
                  boxShadow: isHovering
                      ? [
                          BoxShadow(
                            color: Colors.amber.withOpacity(0.5),
                            blurRadius: 15,
                            spreadRadius: 2,
                          ),
                        ]
                      : [],
                ),
                child: rotation != 0.0
                    ? Transform.rotate(
                        angle: rotation,
                        child: Image.asset(
                          assetPath,
                          fit: BoxFit.contain,
                        ),
                      )
                    : Image.asset(
                        assetPath,
                        fit: BoxFit.contain,
                      ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildCardSlot({
    required int index,
    required double bookWidth,
    required double bookHeight,
  }) {
    final slot = _cardSlots[index];
    final left = slot[0] * bookWidth;
    final top = slot[1] * bookHeight;
    final width = slot[2] * bookWidth;
    final height = slot[3] * bookHeight;
    final isHovered = _hoveredCard == index;

    return Positioned(
      left: left,
      top: top,
      child: MouseRegion(
        onEnter: (_) => setState(() => _hoveredCard = index),
        onExit: (_) => setState(() => _hoveredCard = null),
        cursor: SystemMouseCursors.click,
        child: AnimatedScale(
          scale: isHovered ? 1.03 : 1.0,
          duration: const Duration(milliseconds: 150),
          curve: Curves.easeOut,
          child: AnimatedOpacity(
            opacity: isHovered ? 1.0 : 0.92,
            duration: const Duration(milliseconds: 150),
            child: DecoratedBox(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                boxShadow: isHovered
                    ? [
                        BoxShadow(
                          color: Colors.amber.withOpacity(0.25),
                          blurRadius: 18,
                          spreadRadius: 4,
                        ),
                      ]
                    : [],
              ),
              child: SizedBox(
                width: width,
                height: height,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    Image.asset(
                      'assets/session/card_vazio.png',
                      width: width,
                      height: height,
                      fit: BoxFit.contain,
                      filterQuality: FilterQuality.high,
                    ),
                    Padding(
                      padding: EdgeInsets.symmetric(
                        horizontal: width * 0.08,
                        vertical: height * 0.12,
                      ),
                      child: Text(
                        'Espaco disponivel!\nCrie ou entre em uma sessao pelo codigo',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontFamily: 'Zany',
                          fontSize: (height * 0.12).clamp(14, 32),
                          color: CustomColors.textPrimary,
                          shadows: const [
                            Shadow(
                              color: Colors.black26,
                              offset: Offset(1, 1),
                              blurRadius: 2,
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Stack(
        children: [
          // Background com as velas
          AppBackground(
            imageAsset: 'assets/session/background.png',
            overlayColor: Colors.black.withOpacity(0.2),
            child: const SizedBox.expand(),
          ),

          // Conteúdo principal (livro e botões)
          LayoutBuilder(
          builder: (context, constraints) {
            final widthFraction = constraints.maxWidth < 600 ? 0.95 : 0.6;
            var bookWidth = constraints.maxWidth * widthFraction;

            if (constraints.hasBoundedHeight) {
              final heightBasedWidth =
                  constraints.maxHeight * 0.8 * _bookAspectRatio;
              bookWidth = math.min(bookWidth, heightBasedWidth);
            }

            bookWidth = bookWidth.clamp(200.0, constraints.maxWidth);
            final bookHeight = bookWidth / _bookAspectRatio;
            final baseButtonSize = bookWidth * _buttonScale;
            final reductionFactor =
                (bookWidth / _bookReferenceWidth).clamp(0.0, 1.0);
            final buttonSize = (baseButtonSize -
                    (_maxButtonReduction * reductionFactor))
                .clamp(_buttonMinSize, _buttonMaxSize)
                .toDouble();

            double topForAnchor(Offset anchor) =>
                bookHeight * anchor.dy - buttonSize / 2;
            double leftForAnchor(Offset anchor) =>
                bookWidth * anchor.dx - buttonSize / 2;

            return Center(
              child: SizedBox(
                width: bookWidth,
                height: bookHeight,
                child: Stack(
                  clipBehavior: Clip.none,
                  children: [
                    Positioned.fill(
                      child: Image.asset(
                        'assets/session/livro.png',
                        fit: BoxFit.contain,
                      ),
                    ),
                    ...List.generate(
                      _cardSlots.length,
                      (index) => _buildCardSlot(
                        index: index,
                        bookWidth: bookWidth,
                        bookHeight: bookHeight,
                      ),
                    ),
                    _buildBookmarkButton(
                      assetPath: 'assets/session/bookmarks/criar.png',
                      tooltip: 'Criar sessao',
                      onPressed: _createSession,
                      isHovering: _isHovering1,
                      onHover: (hovering) =>
                          setState(() => _isHovering1 = hovering),
                      top: topForAnchor(_bookmarkAnchors[0]) + 2,
                      left: leftForAnchor(_bookmarkAnchors[0]),
                      size: buttonSize,
                    ),
                    _buildBookmarkButton(
                      assetPath: 'assets/session/bookmarks/codigo.png',
                      tooltip: 'Entrar na sessao',
                      onPressed: _showCodeDialog,
                      isHovering: _isHovering2,
                      onHover: (hovering) =>
                          setState(() => _isHovering2 = hovering),
                      top: topForAnchor(_bookmarkAnchors[1]),
                      left: leftForAnchor(_bookmarkAnchors[1]) + 1,
                      size: buttonSize,
                      rotation: 0.09,
                    ),
                    _buildBookmarkButton(
                      assetPath: 'assets/session/bookmarks/deslogar.png',
                      tooltip: 'Deslogar',
                      onPressed: _logout,
                      isHovering: _isHovering3,
                      onHover: (hovering) =>
                          setState(() => _isHovering3 = hovering),
                      top: topForAnchor(_bookmarkAnchors[2]),
                      left: leftForAnchor(_bookmarkAnchors[2]),
                      size: buttonSize,
                    ),
                  ],
                ),
              ),
            );
          },
        ),

          // Animações de luz das velas (por cima do livro para iluminá-lo)
          const Positioned.fill(
            child: IgnorePointer(
              child: Stack(
                children: [
                  // Vela superior esquerda (no topo da chama)
                  CandleLight(
                    position: Offset(0.177, 0.105), // Posicionada na chama
                    size: 140,
                    intensity: 0.85,
                    color: Color(0xFFFFB84D), // Amarelo alaranjado quente
                  ),
                  // Vela inferior direita (no topo da chama)
                  CandleLight(
                    position: Offset(0.750, 0.765), // Posicionada na chama
                    size: 140,
                    intensity: 0.85,
                    color: Color(0xFFFFB84D), // Amarelo alaranjado quente
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

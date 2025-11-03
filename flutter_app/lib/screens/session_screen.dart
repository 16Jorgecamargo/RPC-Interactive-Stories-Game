import 'package:flutter/material.dart';
import '../utils/custom_colors.dart';

class SessionScreen extends StatefulWidget {
  const SessionScreen({super.key});

  @override
  State<SessionScreen> createState() => _SessionScreenState();
}

class _SessionScreenState extends State<SessionScreen> {
  bool _isHovering1 = false;
  bool _isHovering2 = false;
  bool _isHovering3 = false;

  void _showCodeDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: CustomColors.panelBackground,
        title: const Text(
          'Entrar na Sessão',
          style: TextStyle(
            fontFamily: 'Zany',
            color: CustomColors.fieldBorder,
          ),
        ),
        content: TextField(
          decoration: InputDecoration(
            hintText: 'Digite o código da sessão',
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
              // TODO: Implementar lógica de entrar na sessão
              Navigator.pop(context);
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
    // TODO: Implementar lógica de criar sessão
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Criar sessão - Funcionalidade em desenvolvimento'),
        backgroundColor: CustomColors.success,
      ),
    );
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
    double rotation = 0.0, // Rotação em radianos
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

  @override
  Widget build(BuildContext context) {
    // Obter dimensões da tela
    final screenWidth = MediaQuery.of(context).size.width;
    final screenHeight = MediaQuery.of(context).size.height;
    final isSmallScreen = screenWidth < 600;

    // Calcular posições responsivas para alinhar com os marcadores do livro
    final buttonSize = isSmallScreen ? 25.0 : 35.0;
    // Posição vertical: um pouco acima do centro do livro (nos marcadores)
    final topPosition = isSmallScreen ? screenHeight * 6 : 15.0;
    // Posições horizontais: alinhadas com os 3 marcadores coloridos
    final button1Left =
        isSmallScreen ? screenWidth * 0.59 : 577.0; // Marcador verde (esquerda)
    final button2Left =
        isSmallScreen ? screenWidth * 0.67 : 657.0; // Marcador laranja (centro)
    final button3Left = isSmallScreen
        ? screenWidth * 0.78
        : 745.0; // Marcador vermelho (direita)

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [
              CustomColors.backgroundDark,
              CustomColors.background,
              CustomColors.backgroundLight,
            ],
          ),
        ),
        child: Center(
          child: Stack(
            alignment: Alignment.center,
            clipBehavior: Clip.none,
            children: [
              // Imagem do livro
              Image.asset(
                'assets/images/livro.png',
                fit: BoxFit.contain,
              ),

              // Botão 1: Criar Sessão (marcador verde - esquerda)
              _buildBookmarkButton(
                assetPath:
                    'assets/images/criar.png', // Placeholder - precisa de ícone
                tooltip: 'Criar sessao',
                onPressed: _createSession,
                isHovering: _isHovering1,
                onHover: (hovering) => setState(() => _isHovering1 = hovering),
                top: topPosition - 1,
                left: button1Left,
                size: buttonSize - 1,
              ),

              // Botão 2: Entrar na Sessão (marcador laranja - centro)
              _buildBookmarkButton(
                assetPath: 'assets/images/codigo.png',
                tooltip: 'Entrar na sessao',
                onPressed: _showCodeDialog,
                isHovering: _isHovering2,
                onHover: (hovering) => setState(() => _isHovering2 = hovering),
                top: topPosition + 3,
                left: button2Left,
                size: buttonSize,
              ),

              // Botão 3: Deslogar (marcador vermelho - direita)
              _buildBookmarkButton(
                assetPath: 'assets/images/deslogar.png',
                tooltip: 'Deslogar',
                onPressed: _logout,
                isHovering: _isHovering3,
                onHover: (hovering) => setState(() => _isHovering3 = hovering),
                top: topPosition + 12,
                left: button3Left,
                size: buttonSize,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

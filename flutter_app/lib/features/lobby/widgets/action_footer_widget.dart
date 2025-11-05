import 'package:flutter/material.dart';

class ActionFooterWidget extends StatefulWidget {
  final String roomCode;
  final bool isReady;
  final VoidCallback onStart;
  final VoidCallback onBack;
  final VoidCallback onCodeTap;

  const ActionFooterWidget({
    super.key,
    required this.roomCode,
    required this.isReady,
    required this.onStart,
    required this.onBack,
    required this.onCodeTap,
  });

  @override
  State<ActionFooterWidget> createState() => _ActionFooterWidgetState();
}

class _ActionFooterWidgetState extends State<ActionFooterWidget> {
  bool _showCopiedTooltip = false;

  void _handleCodeTap() {
    widget.onCodeTap();
    setState(() => _showCopiedTooltip = true);
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
        setState(() => _showCopiedTooltip = false);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 300, 
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Positioned(
            left: -30,  
            top: 20,  
            child: _buildStartButton(),
          ),

          Positioned(
            left: 170, 
            top: 20,    
            child: _buildCodeButton(),
          ),

          Positioned(
            left: 370,   
            top: 20,     
            child: _buildBackButton(),
          ),

          if (_showCopiedTooltip)
            Positioned(
              left: 200,   
              top: -15,   
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.black87,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: const Text(
                  'Código copiado!',
                  style: TextStyle(
                    fontFamily: 'Zany',
                    fontSize: 14,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildStartButton() {
    return Tooltip(
      message: widget.isReady ? 'Iniciar o jogo' : 'Aguardando todos criarem personagens',
      child: InkWell(
        onTap: widget.isReady ? widget.onStart : null,
        child: Image.asset(
          widget.isReady
              ? 'assets/lobby/ready.png'
              : 'assets/lobby/not_ready.png',
          height: 100, 
          fit: BoxFit.contain,
          errorBuilder: (context, error, stackTrace) {
            return Container(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              decoration: BoxDecoration(
                color: widget.isReady ? const Color(0xFF8B4513) : Colors.grey,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.black, width: 2),
              ),
              child: Text(
                'INICIAR',
                style: TextStyle(
                  fontFamily: 'Zany',
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: widget.isReady ? const Color(0xFFFFD700) : Colors.white54,
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildCodeButton() {
    return Tooltip(
      message: 'Copiar código da sala',
      child: InkWell(
        onTap: _handleCodeTap,
        child: Stack(
          alignment: Alignment.center,
          children: [
            Image.asset(
              'assets/lobby/code.png',
              height: 100,
              fit: BoxFit.contain,
              errorBuilder: (context, error, stackTrace) {
                return Container(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  decoration: BoxDecoration(
                    color: const Color(0xFF8B4513),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.black, width: 2),
                  ),
                  child: Text(
                    widget.roomCode,
                    style: const TextStyle(
                      fontFamily: 'Zany',
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFFE5D4A9),
                    ),
                  ),
                );
              },
            ),
            Positioned(
              left: 80, 
              child: Text(
                widget.roomCode,
                style: const TextStyle(
                  fontFamily: 'Zany',
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFFE5D4A9),
                  shadows: [
                    Shadow(
                      color: Colors.black,
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
    );
  }

  Widget _buildBackButton() {
    return Tooltip(
      message: 'Voltar para seleção de sessão',
      child: InkWell(
        onTap: widget.onBack,
        child: Image.asset(
          'assets/lobby/back.png',
          height: 100, 
          fit: BoxFit.contain,
          errorBuilder: (context, error, stackTrace) {
            return Container(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              decoration: BoxDecoration(
                color: const Color(0xFF8B4513),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.black, width: 2),
              ),
              child: const Row(
                children: [
                  Icon(Icons.home, color: Color(0xFFFFD700), size: 20),
                  SizedBox(width: 8),
                  Text(
                    'VOLTAR',
                    style: TextStyle(
                      fontFamily: 'Zany',
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFFFFD700),
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../shared/utils/custom_colors.dart';

class RoomCodeWidget extends StatefulWidget {
  final String roomCode;

  const RoomCodeWidget({
    super.key,
    required this.roomCode,
  });

  @override
  State<RoomCodeWidget> createState() => _RoomCodeWidgetState();
}

class _RoomCodeWidgetState extends State<RoomCodeWidget>
    with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;
  bool _showCopiedMessage = false;

  @override
  void initState() {
    super.initState();

    _pulseController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );

    _pulseAnimation = Tween<double>(
      begin: 1.0,
      end: 1.1,
    ).animate(CurvedAnimation(
      parent: _pulseController,
      curve: Curves.easeOut,
    ));
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  Future<void> _copyToClipboard() async {
    await Clipboard.setData(ClipboardData(text: widget.roomCode));

    // Animação de pulso
    _pulseController.forward().then((_) => _pulseController.reverse());

    // Mostra mensagem de copiado
    setState(() => _showCopiedMessage = true);

    // Esconde mensagem após 2 segundos
    await Future.delayed(const Duration(seconds: 2));
    if (mounted) {
      setState(() => _showCopiedMessage = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        // Código da sala
        GestureDetector(
          onTap: _copyToClipboard,
          child: AnimatedBuilder(
            animation: _pulseAnimation,
            builder: (context, child) {
              return Transform.scale(
                scale: _pulseAnimation.value,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 10,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.6),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: const Color(0xFFFFD700),
                      width: 2,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFFFFD700).withOpacity(0.3),
                        blurRadius: 10,
                        spreadRadius: 2,
                      ),
                    ],
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(
                        Icons.vpn_key,
                        color: Color(0xFFFFD700),
                        size: 20,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        widget.roomCode,
                        style: const TextStyle(
                          fontFamily: 'Zany',
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFFFFD700),
                          letterSpacing: 2,
                          shadows: [
                            Shadow(
                              color: Colors.black,
                              offset: Offset(2, 2),
                              blurRadius: 4,
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      const Icon(
                        Icons.copy,
                        color: Color(0xFFFFD700),
                        size: 16,
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),

        // Mensagem de copiado
        AnimatedOpacity(
          opacity: _showCopiedMessage ? 1.0 : 0.0,
          duration: const Duration(milliseconds: 300),
          child: Container(
            margin: const EdgeInsets.only(top: 8),
            padding: const EdgeInsets.symmetric(
              horizontal: 12,
              vertical: 6,
            ),
            decoration: BoxDecoration(
              color: CustomColors.success,
              borderRadius: BorderRadius.circular(8),
              boxShadow: [
                BoxShadow(
                  color: CustomColors.success.withOpacity(0.5),
                  blurRadius: 8,
                  spreadRadius: 1,
                ),
              ],
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  Icons.check_circle,
                  color: Colors.white,
                  size: 16,
                ),
                SizedBox(width: 6),
                Text(
                  'Código copiado!',
                  style: TextStyle(
                    fontFamily: 'Zany',
                    fontSize: 12,
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

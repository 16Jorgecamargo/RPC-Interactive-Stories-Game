import 'package:flutter/material.dart';

import '../models/player_model.dart';

class PlayerCard extends StatefulWidget {
  final PlayerModel player;
  final VoidCallback? onViewCharacter;
  final VoidCallback? onCreateCharacter;

  const PlayerCard({
    super.key,
    required this.player,
    this.onViewCharacter,
    this.onCreateCharacter,
  });

  @override
  State<PlayerCard> createState() => _PlayerCardState();
}

class _PlayerCardState extends State<PlayerCard> {
  bool _isHovering = false;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onEnter: (_) => setState(() => _isHovering = true),
      onExit: (_) => setState(() => _isHovering = false),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        margin: const EdgeInsets.all(8),
        child: Stack(
          clipBehavior: Clip.none, 
          children: [
            Positioned(
              left: -45,   
              top: 270,     
              width: 400, 
              height: 100,
              child: Image.asset(
                'assets/lobby/char_tile.png',
                fit: BoxFit.contain, 
                errorBuilder: (context, error, stackTrace) {
                  return Container(
                    decoration: BoxDecoration(
                      color: const Color(0xFFD4AF6A).withOpacity(0.95),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: const Color(0xFF8B6F47),
                        width: 3,
                      ),
                    ),
                  );
                },
              ),
            ),

            Positioned(
              left: 155,     
              top: 310,     
              child: Text(
                widget.player.playerName,
                style: const TextStyle(
                  fontFamily: 'Zany',
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF2D1B00),
                  height: 1.2,
                ),
              ),
            ),

            _buildActionButton(),

            _buildStatusCheck(),
          ],
        ),
      ),
    );
  }

  Widget _buildActionButton() {
    final bool hasCharacter = widget.player.hasCharacter;
    final bool isCurrentUser = widget.player.isCurrentUser;
    final VoidCallback? onPressed = hasCharacter
        ? widget.onViewCharacter
        : widget.onCreateCharacter;

    String assetPath;
    if (isCurrentUser) {
      assetPath = 'assets/lobby/button_create.png';
    } else if (hasCharacter) {
      assetPath = 'assets/lobby/button_show.png';
    } else {
      assetPath = 'assets/lobby/button_no_show.png';
    }

    return Positioned(
      left: 152,     
      top: 330,      
      width: 150,  
      height: 50,  
      child: InkWell(
        onTap: onPressed,
        child: Image.asset(
          assetPath,
          fit: BoxFit.contain,
          errorBuilder: (context, error, stackTrace) {
            return Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: hasCharacter ? Colors.green : const Color(0xFFFFAA00),
                borderRadius: BorderRadius.circular(4),
                border: Border.all(color: Colors.black, width: 2),
              ),
              child: Center(
                child: Text(
                  isCurrentUser ? 'CRIAR' : (hasCharacter ? 'VER' : 'NO SHOW'),
                  style: const TextStyle(
                    fontFamily: 'Zany',
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildStatusCheck() {
    final bool hasCharacter = widget.player.hasCharacter;

    return Positioned(
      left: -20,   
      top: 300,     
      width: 40,   
      height: 40, 
      child: Image.asset(
        hasCharacter
            ? 'assets/lobby/char_check_ready.png'
            : 'assets/lobby/char_check.png',
        fit: BoxFit.contain,
        errorBuilder: (context, error, stackTrace) {
          return Container(
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: hasCharacter ? Colors.green : Colors.grey,
              border: Border.all(color: Colors.black, width: 2),
            ),
            child: Icon(
              hasCharacter ? Icons.check : Icons.circle,
              color: Colors.white,
              size: 20,
            ),
          );
        },
      ),
    );
  }
}

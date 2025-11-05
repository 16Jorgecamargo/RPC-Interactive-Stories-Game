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
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFFD4AF6A).withOpacity(0.95),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: const Color(0xFF8B6F47),
            width: 3,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(_isHovering ? 0.5 : 0.3),
              blurRadius: _isHovering ? 12 : 8,
              spreadRadius: _isHovering ? 2 : 0,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: [
            // Avatar
            _buildAvatar(),
            const SizedBox(width: 16),

            // Informações do jogador
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Nome do jogador
                  Text(
                    widget.player.playerName,
                    style: const TextStyle(
                      fontFamily: 'Zany',
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF2D1B00),
                      height: 1.2,
                    ),
                  ),

                  // Nome do personagem (se tiver)
                  if (widget.player.hasCharacter &&
                      widget.player.characterName != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      widget.player.characterName!,
                      style: TextStyle(
                        fontFamily: 'Zany',
                        fontSize: 18,
                        color: const Color(0xFF2D1B00).withOpacity(0.8),
                        height: 1.2,
                      ),
                    ),
                  ],
                ],
              ),
            ),

            // Botão (só aparece para o usuário atual)
            if (widget.player.isCurrentUser) ...[
              const SizedBox(width: 12),
              _buildActionButton(),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildAvatar() {
    return Container(
      width: 100,
      height: 100,
      decoration: BoxDecoration(
        color: const Color(0xFFE5D4A9),
        borderRadius: BorderRadius.circular(4),
        border: Border.all(
          color: Colors.black,
          width: 3,
        ),
      ),
      child: widget.player.hasCharacter && widget.player.avatarAsset != null
          ? ClipRRect(
              borderRadius: BorderRadius.circular(2),
              child: Image.asset(
                widget.player.avatarAsset!,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) {
                  return _buildPlaceholderAvatar();
                },
              ),
            )
          : _buildPlaceholderAvatar(),
    );
  }

  Widget _buildPlaceholderAvatar() {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            Colors.grey.shade700,
            Colors.grey.shade500,
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      child: const Center(
        child: Icon(
          Icons.person,
          size: 50,
          color: Colors.white54,
        ),
      ),
    );
  }

  Widget _buildActionButton() {
    final bool hasCharacter = widget.player.hasCharacter;
    final String buttonText = hasCharacter ? 'VER PERSONAGEM' : 'CRIAR PERSONAGEM';
    final VoidCallback? onPressed = hasCharacter
        ? widget.onViewCharacter
        : widget.onCreateCharacter;

    return ElevatedButton(
      onPressed: onPressed,
      style: ElevatedButton.styleFrom(
        backgroundColor: const Color(0xFF2D2D2D),
        foregroundColor: const Color(0xFFFFD700),
        padding: const EdgeInsets.symmetric(
          horizontal: 20,
          vertical: 14,
        ),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
          side: const BorderSide(
            color: Color(0xFF1A1A1A),
            width: 2,
          ),
        ),
        elevation: 4,
      ),
      child: Text(
        buttonText,
        style: const TextStyle(
          fontFamily: 'Zany',
          fontSize: 14,
          fontWeight: FontWeight.bold,
          letterSpacing: 0.5,
        ),
      ),
    );
  }
}

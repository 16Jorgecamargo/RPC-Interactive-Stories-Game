import 'package:flutter/material.dart';

import '../models/player_model.dart';

class CharacterModal extends StatelessWidget {
  final PlayerModel player;

  const CharacterModal({
    super.key,
    required this.player,
  });

  static Future<void> show(BuildContext context, PlayerModel player) {
    return showDialog(
      context: context,
      barrierDismissible: true,
      barrierColor: Colors.black.withOpacity(0.7),
      builder: (context) => CharacterModal(player: player),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.transparent,
      child: Container(
        constraints: const BoxConstraints(
          maxWidth: 400,
          maxHeight: 600,
        ),
        decoration: BoxDecoration(
          color: const Color(0xFFD4AF6A),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: const Color(0xFF8B6F47),
            width: 4,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.5),
              blurRadius: 20,
              spreadRadius: 5,
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Cabeçalho com botão fechar
            _buildHeader(context),

            // Conteúdo do personagem
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: _buildCharacterContent(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: const BoxDecoration(
        border: Border(
          bottom: BorderSide(
            color: Color(0xFF8B6F47),
            width: 3,
          ),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          const Text(
            'PERSONAGEM',
            style: TextStyle(
              fontFamily: 'Zany',
              fontSize: 22,
              fontWeight: FontWeight.bold,
              color: Color(0xFF2D1B00),
              letterSpacing: 1.5,
            ),
          ),
          IconButton(
            onPressed: () => Navigator.of(context).pop(),
            icon: const Icon(
              Icons.close,
              color: Color(0xFF2D1B00),
              size: 28,
            ),
            padding: EdgeInsets.zero,
            constraints: const BoxConstraints(),
          ),
        ],
      ),
    );
  }

  Widget _buildCharacterContent() {
    return Column(
      children: [
        // Avatar grande
        Container(
          width: 200,
          height: 200,
          decoration: BoxDecoration(
            color: const Color(0xFFE5D4A9),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: Colors.black,
              width: 4,
            ),
          ),
          child: player.avatarAsset != null
              ? ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: Image.asset(
                    player.avatarAsset!,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) {
                      return _buildPlaceholder();
                    },
                  ),
                )
              : _buildPlaceholder(),
        ),

        const SizedBox(height: 24),

        // Informações do personagem
        _buildInfoSection('NOME DO PERSONAGEM', player.characterName ?? 'N/A'),
        const SizedBox(height: 16),
        _buildInfoSection('CLASSE', player.characterClass ?? 'N/A'),
        const SizedBox(height: 16),
        _buildInfoSection('JOGADOR', player.playerName),

        const SizedBox(height: 24),

        // Nota informativa
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: const Color(0xFFE5D4A9).withOpacity(0.5),
            borderRadius: BorderRadius.circular(6),
            border: Border.all(
              color: const Color(0xFF8B6F47),
              width: 2,
            ),
          ),
          child: const Text(
            'Mais informações do personagem serão exibidas aqui no futuro.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontFamily: 'Zany',
              fontSize: 12,
              color: Color(0xFF2D1B00),
              fontStyle: FontStyle.italic,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildInfoSection(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontFamily: 'Zany',
            fontSize: 12,
            fontWeight: FontWeight.bold,
            color: const Color(0xFF2D1B00).withOpacity(0.7),
            letterSpacing: 1,
          ),
        ),
        const SizedBox(height: 4),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          decoration: BoxDecoration(
            color: const Color(0xFFE5D4A9),
            borderRadius: BorderRadius.circular(6),
            border: Border.all(
              color: const Color(0xFF8B6F47),
              width: 2,
            ),
          ),
          child: Text(
            value,
            style: const TextStyle(
              fontFamily: 'Zany',
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Color(0xFF2D1B00),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildPlaceholder() {
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
          size: 80,
          color: Colors.white54,
        ),
      ),
    );
  }
}

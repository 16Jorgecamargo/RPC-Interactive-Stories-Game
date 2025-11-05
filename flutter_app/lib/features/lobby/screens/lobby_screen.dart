import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../shared/widgets/common/app_background.dart';
import '../models/player_model.dart';
import '../widgets/action_footer_widget.dart';
import '../widgets/character_modal.dart';
import '../widgets/chat_widget.dart';
import '../widgets/player_card.dart';

class LobbyScreen extends StatefulWidget {
  const LobbyScreen({super.key});

  @override
  State<LobbyScreen> createState() => _LobbyScreenState();
}

class _LobbyScreenState extends State<LobbyScreen> {
  final List<PlayerModel> _players = PlayerModel.getMockPlayers();
  final String _roomCode = _generateRoomCode();
  bool _isReady = false;

  static String _generateRoomCode() {
    final random = math.Random();
    final letters = String.fromCharCodes(
      List.generate(3, (_) => random.nextInt(26) + 65),
    );
    final numbers = String.fromCharCodes(
      List.generate(3, (_) => random.nextInt(10) + 48),
    );
    return '$letters$numbers';
  }

  void _handleViewCharacter(PlayerModel player) {
    CharacterModal.show(context, player);
  }

  void _handleCreateCharacter() {
    // TODO: Navegar para tela de criação de personagem
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Tela de criação de personagem em desenvolvimento...'),
        duration: Duration(seconds: 2),
      ),
    );
  }

  void _handleExit() {
    Navigator.of(context).pushReplacementNamed('/session');
  }

  void _handleStart() {
    if (!_isReady) return;

    // TODO: Implementar lógica de iniciar o jogo
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Iniciando o jogo...'),
        duration: Duration(seconds: 2),
      ),
    );
  }

  void _handleCodeTap() {
    Clipboard.setData(ClipboardData(text: _roomCode));
  }

  @override
  Widget build(BuildContext context) {
    _isReady = _players.every((player) => player.hasCharacter);

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Stack(
        children: [
          const AppBackground(
            imageAsset: '/lobby/background.png',
            overlayColor: Colors.black26,
            child: SizedBox.expand(),
          ),

          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Expanded(
                    flex: 4,
                    child: ChatWidget(),
                  ),

                  const SizedBox(width: 20),

                  Expanded(
                    flex: 6,
                    child: _buildAdventurersPanel(),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAdventurersPanel() {
    return Stack(
      children: [
        Positioned(
          left: -15,     
          top: 0,     
          right: 0,
          bottom: 0,
          child: Image.asset(
            'assets/lobby/player_list.png',
            fit: BoxFit.contain, // Mantém a proporção da imagem
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

        Positioned.fill(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(60, 100, 20, 20), 
            child: Column(
              children: [
                Expanded(
                  child: GridView.builder(
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      childAspectRatio: 3,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                    ),
                    itemCount: _players.length,
                    itemBuilder: (context, index) {
                      final player = _players[index];
                      return PlayerCard(
                        player: player,
                        onViewCharacter: player.isCurrentUser
                            ? () => _handleViewCharacter(player)
                            : null,
                        onCreateCharacter:
                            player.isCurrentUser ? _handleCreateCharacter : null,
                      );
                    },
                  ),
                ),

                const SizedBox(height: 20),

                ActionFooterWidget(
                  roomCode: _roomCode,
                  isReady: _isReady,
                  onStart: _handleStart,
                  onBack: _handleExit,
                  onCodeTap: _handleCodeTap,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

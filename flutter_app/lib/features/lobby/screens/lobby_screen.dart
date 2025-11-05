import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../../../shared/utils/screen_helpers.dart';
import '../../../shared/widgets/common/app_background.dart';
import '../../../shared/widgets/particles/floating_particles.dart';
import '../models/player_model.dart';
import '../widgets/character_modal.dart';
import '../widgets/chat_widget.dart';
import '../widgets/player_card.dart';
import '../widgets/room_code_widget.dart';

class LobbyScreen extends StatefulWidget {
  const LobbyScreen({super.key});

  @override
  State<LobbyScreen> createState() => _LobbyScreenState();
}

class _LobbyScreenState extends State<LobbyScreen> {
  final List<PlayerModel> _players = PlayerModel.getMockPlayers();
  final String _roomCode = _generateRoomCode();
  int _unreadMessages = 0;

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

  void _showChatModal() {
    showDialog(
      context: context,
      barrierDismissible: true,
      barrierColor: Colors.black.withOpacity(0.7),
      builder: (context) => Dialog(
        backgroundColor: Colors.transparent,
        insetPadding: const EdgeInsets.all(20),
        child: Container(
          constraints: const BoxConstraints(
            maxWidth: 400,
            maxHeight: 600,
          ),
          child: const ChatWidget(isModal: true),
        ),
      ),
    ).then((_) {
      // Zera mensagens não lidas ao fechar o chat
      setState(() => _unreadMessages = 0);
    });
  }

  @override
  Widget build(BuildContext context) {
    final isSmallScreen = ScreenHelpers.isSmallScreen(context);

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Stack(
        children: [
          // Background
          const AppBackground(
            imageAsset: '/lobby/background.png',
            overlayColor: Colors.black26,
            child: SizedBox.expand(),
          ),

          // Partículas flutuantes
          const Positioned.fill(
            child: FloatingParticles(
              particleCount: 15,
              minSize: 4,
              maxSize: 10,
              minOpacity: 0.2,
              maxOpacity: 0.6,
              speed: 0.12,
              color: Color(0xFFFFF9C4),
              glowType: ParticleGlowType.spark,
              activity: 1.0,
              spawnFromEdges: true,
              maxActiveParticles: 12,
            ),
          ),

          // Conteúdo principal
          SafeArea(
            child: Column(
              children: [
                // Cabeçalho com botões
                _buildHeader(isSmallScreen),

                // Conteúdo (jogadores e chat)
                Expanded(
                  child: isSmallScreen
                      ? _buildMobileLayout()
                      : _buildDesktopLayout(),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader(bool isSmallScreen) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // Botão Sair (X)
          _buildExitButton(),

          const Spacer(),

          // Ícone de chat (apenas mobile) com notificação
          if (isSmallScreen) ...[
            _buildChatIconButton(),
            const SizedBox(width: 12),
          ],

          // Código da sala
          RoomCodeWidget(roomCode: _roomCode),
        ],
      ),
    );
  }

  Widget _buildExitButton() {
    return Container(
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.6),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: const Color(0xFFFFD700).withOpacity(0.4),
          width: 2,
        ),
      ),
      child: IconButton(
        onPressed: _handleExit,
        icon: const Icon(
          Icons.close,
          color: Color(0xFFFFD700),
          size: 28,
        ),
        tooltip: 'Sair do Lobby',
      ),
    );
  }

  Widget _buildChatIconButton() {
    return Stack(
      children: [
        Container(
          decoration: BoxDecoration(
            color: Colors.black.withOpacity(0.6),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: const Color(0xFFFFD700).withOpacity(0.4),
              width: 2,
            ),
          ),
          child: IconButton(
            onPressed: _showChatModal,
            icon: const Icon(
              Icons.chat_bubble,
              color: Color(0xFFFFD700),
              size: 24,
            ),
            tooltip: 'Abrir Chat',
          ),
        ),
        // Badge de notificação
        if (_unreadMessages > 0)
          Positioned(
            right: 0,
            top: 0,
            child: Container(
              padding: const EdgeInsets.all(4),
              decoration: const BoxDecoration(
                color: Colors.red,
                shape: BoxShape.circle,
              ),
              constraints: const BoxConstraints(
                minWidth: 20,
                minHeight: 20,
              ),
              child: Center(
                child: Text(
                  _unreadMessages > 9 ? '9+' : _unreadMessages.toString(),
                  style: const TextStyle(
                    fontFamily: 'Zany',
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildDesktopLayout() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Lista de jogadores (60%)
          Expanded(
            flex: 6,
            child: _buildPlayersList(),
          ),

          const SizedBox(width: 20),

          // Chat (40%)
          Expanded(
            flex: 4,
            child: const ChatWidget(),
          ),
        ],
      ),
    );
  }

  Widget _buildMobileLayout() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: _buildPlayersList(),
    );
  }

  Widget _buildPlayersList() {
    return Column(
      children: [
        // Título "JOGADORES"
        _buildPlayersTitle(),

        const SizedBox(height: 16),

        // Lista de cards
        Expanded(
          child: ListView.builder(
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
      ],
    );
  }

  Widget _buildPlayersTitle() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 20),
      decoration: BoxDecoration(
        color: const Color(0xFFD4AF6A).withOpacity(0.95),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: const Color(0xFF8B6F47),
          width: 3,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.3),
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: const Center(
        child: Text(
          'JOGADORES',
          style: TextStyle(
            fontFamily: 'Zany',
            fontSize: 28,
            fontWeight: FontWeight.bold,
            color: Color(0xFF2D1B00),
            letterSpacing: 3,
          ),
        ),
      ),
    );
  }
}

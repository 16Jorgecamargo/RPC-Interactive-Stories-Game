import 'package:flutter/material.dart';

class ChatMessage {
  final String playerName;
  final String message;
  final DateTime timestamp;

  const ChatMessage({
    required this.playerName,
    required this.message,
    required this.timestamp,
  });

  static List<ChatMessage> getMockMessages() {
    return [
      ChatMessage(
        playerName: 'Fulano',
        message: 'Prontos para a aventura?',
        timestamp: DateTime.now().subtract(const Duration(minutes: 5)),
      ),
      ChatMessage(
        playerName: 'Beltrano',
        message: 'Sim! Mal posso esperar',
        timestamp: DateTime.now().subtract(const Duration(minutes: 3)),
      ),
      ChatMessage(
        playerName: 'Ciclano',
        message: 'Vou criar meu personagem agora',
        timestamp: DateTime.now().subtract(const Duration(minutes: 1)),
      ),
    ];
  }
}

class ChatWidget extends StatefulWidget {
  final bool isModal;

  const ChatWidget({
    super.key,
    this.isModal = false,
  });

  @override
  State<ChatWidget> createState() => _ChatWidgetState();
}

class _ChatWidgetState extends State<ChatWidget> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final List<ChatMessage> _messages = ChatMessage.getMockMessages();

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _sendMessage() {
    if (_messageController.text.trim().isEmpty) return;

    setState(() {
      _messages.add(
        ChatMessage(
          playerName: 'Você',
          message: _messageController.text.trim(),
          timestamp: DateTime.now(),
        ),
      );
      _messageController.clear();
    });

    // Scroll para o final
    Future.delayed(const Duration(milliseconds: 100), () {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
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
      child: Column(
        children: [
          // Cabeçalho "CHAT"
          _buildHeader(),

          // Lista de mensagens
          Expanded(
            child: _buildMessageList(),
          ),

          // Input de mensagem
          _buildMessageInput(),
        ],
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 12),
      decoration: const BoxDecoration(
        border: Border(
          bottom: BorderSide(
            color: Color(0xFF8B6F47),
            width: 2,
          ),
        ),
      ),
      child: const Center(
        child: Text(
          'CHAT',
          style: TextStyle(
            fontFamily: 'Zany',
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: Color(0xFF2D1B00),
            letterSpacing: 2,
          ),
        ),
      ),
    );
  }

  Widget _buildMessageList() {
    return Container(
      padding: const EdgeInsets.all(12),
      child: _messages.isEmpty
          ? Center(
              child: Text(
                'Nenhuma mensagem ainda...',
                style: TextStyle(
                  fontFamily: 'Zany',
                  fontSize: 14,
                  color: const Color(0xFF2D1B00).withOpacity(0.5),
                ),
              ),
            )
          : ListView.builder(
              controller: _scrollController,
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                final message = _messages[index];
                return _buildMessageItem(message);
              },
            ),
    );
  }

  Widget _buildMessageItem(ChatMessage message) {
    final bool isCurrentUser = message.playerName == 'Você';

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Nome do jogador
          Text(
            '${message.playerName}:',
            style: TextStyle(
              fontFamily: 'Zany',
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: isCurrentUser
                  ? const Color(0xFF8B4513)
                  : const Color(0xFF2D1B00),
            ),
          ),
          const SizedBox(width: 6),

          // Mensagem
          Expanded(
            child: Text(
              message.message,
              style: const TextStyle(
                fontFamily: 'Zany',
                fontSize: 14,
                color: Color(0xFF2D1B00),
                height: 1.3,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMessageInput() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: const BoxDecoration(
        border: Border(
          top: BorderSide(
            color: Color(0xFF8B6F47),
            width: 2,
          ),
        ),
      ),
      child: Row(
        children: [
          // Campo de texto
          Expanded(
            child: TextField(
              controller: _messageController,
              style: const TextStyle(
                fontFamily: 'Zany',
                fontSize: 14,
                color: Color(0xFF2D1B00),
              ),
              decoration: InputDecoration(
                hintText: 'Digite sua mensagem...',
                hintStyle: TextStyle(
                  fontFamily: 'Zany',
                  fontSize: 14,
                  color: const Color(0xFF2D1B00).withOpacity(0.5),
                ),
                filled: true,
                fillColor: const Color(0xFFE5D4A9),
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 10,
                ),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(6),
                  borderSide: const BorderSide(
                    color: Color(0xFF8B6F47),
                    width: 2,
                  ),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(6),
                  borderSide: const BorderSide(
                    color: Color(0xFF8B6F47),
                    width: 2,
                  ),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(6),
                  borderSide: const BorderSide(
                    color: Color(0xFF6B5437),
                    width: 2,
                  ),
                ),
              ),
              onSubmitted: (_) => _sendMessage(),
            ),
          ),
          const SizedBox(width: 8),

          // Botão enviar
          ElevatedButton(
            onPressed: _sendMessage,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF2D2D2D),
              foregroundColor: const Color(0xFFFFD700),
              padding: const EdgeInsets.symmetric(
                horizontal: 16,
                vertical: 12,
              ),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(6),
                side: const BorderSide(
                  color: Color(0xFF1A1A1A),
                  width: 2,
                ),
              ),
              elevation: 2,
            ),
            child: const Icon(
              Icons.send,
              size: 20,
            ),
          ),
        ],
      ),
    );
  }
}

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
    return Stack(
      children: [
        Positioned(
          left: 30,     
          top: 0,      
          right: 0,
          bottom: 0,
          child: Image.asset(
            'assets/shared/ui_elements/chat.png',
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
          left: 127,   
          top: 260,  
          width: 280, 
          height: 400, 
          child: _buildMessageList(),
        ),

        Positioned.fill(
          child: Align(
            alignment: Alignment.bottomLeft,
            child: _buildMessageInput(),
          ),
        ),
      ],
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
    return Transform.translate(
      offset: const Offset(122, -205), 
      child: SizedBox(
        width: 280, 
        child: Stack(
          alignment: Alignment.centerRight,
          children: [
            TextField(
              controller: _messageController,
              style: const TextStyle(
                fontFamily: 'Zany',
                fontSize: 14,
                color: Color(0xFFE5D4A9), 
              ),
              decoration: InputDecoration(
                hintText: 'Digite sua mensagem...',
                hintStyle: TextStyle(
                  fontFamily: 'Zany',
                  fontSize: 14,
                  color: const Color(0xFFE5D4A9).withOpacity(0.5),
                ),
                filled: true,
                fillColor: Colors.transparent, 
                contentPadding: const EdgeInsets.only(
                  left: 12,
                  right: 60,
                  top: 10,
                  bottom: 10,
                ),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(6),
                  borderSide: BorderSide.none, 
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(6),
                  borderSide: BorderSide.none, 
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(6),
                  borderSide: BorderSide.none, 
                ),
              ),
              onSubmitted: (_) => _sendMessage(),
            ),

            Positioned(
              right: 15, 
              child: InkWell(
                onTap: _sendMessage,
                child: Image.asset(
                  'assets/shared/ui_elements/arrow.png',
                  width: 35,
                  height: 35,
                  fit: BoxFit.contain,
                  errorBuilder: (context, error, stackTrace) {
                    return Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: const Color(0xFF8B4513),
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: Colors.black, width: 2),
                      ),
                      child: const Icon(
                        Icons.send,
                        color: Color(0xFFFFD700),
                        size: 24,
                      ),
                    );
                  },
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

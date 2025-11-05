import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';

class LobbyTransitionScreen extends StatefulWidget {
  const LobbyTransitionScreen({super.key});

  @override
  State<LobbyTransitionScreen> createState() => _LobbyTransitionScreenState();
}

class _LobbyTransitionScreenState extends State<LobbyTransitionScreen> {
  late VideoPlayerController _controller;
  bool _isInitialized = false;
  bool _hasNavigated = false;

  @override
  void initState() {
    super.initState();
    _initializeVideo();
  }

  Future<void> _initializeVideo() async {
    try {
      // Inicializa o controller com o vídeo do asset
      _controller = VideoPlayerController.asset('assets/movies/lobby_in.mp4');

      await _controller.initialize();

      if (!mounted) return;

      setState(() {
        _isInitialized = true;
      });

      // Define o ponto de início: 00:00:02:30 = 2 segundos e 30 frames (≈ 3 segundos em 30fps)
      await _controller.seekTo(const Duration(seconds: 2, milliseconds: 30));

      // Adiciona listener para quando o vídeo terminar
      _controller.addListener(_videoListener);

      // Inicia a reprodução
      await _controller.play();
    } catch (e) {
      debugPrint('Erro ao inicializar vídeo: $e');
      // Se houver erro, navega direto para o lobby
      if (mounted && !_hasNavigated) {
        _navigateToLobby();
      }
    }
  }

  void _videoListener() {
    // Verifica se o vídeo terminou
    if (_controller.value.position >= _controller.value.duration) {
      if (!_hasNavigated) {
        _navigateToLobby();
      }
    }
  }

  void _navigateToLobby() {
    if (!mounted) return;

    setState(() {
      _hasNavigated = true;
    });

    Navigator.of(context).pushReplacementNamed('/lobby');
  }

  @override
  void dispose() {
    _controller.removeListener(_videoListener);
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: _isInitialized
          ? GestureDetector(
              // Permite pular o vídeo ao clicar
              onTap: () {
                if (!_hasNavigated) {
                  _navigateToLobby();
                }
              },
              child: SizedBox.expand(
                child: FittedBox(
                  fit: BoxFit.cover,
                  child: SizedBox(
                    width: _controller.value.size.width,
                    height: _controller.value.size.height,
                    child: VideoPlayer(_controller),
                  ),
                ),
              ),
            )
          : const Center(
              child: CircularProgressIndicator(
                color: Color(0xFFFFD700),
              ),
            ),
    );
  }
}

import 'package:flutter/material.dart';

import 'features/auth/screens/login_screen.dart';
import 'features/auth/screens/register_screen.dart';
import 'features/loading/loading_screen.dart';
import 'features/lobby/screens/lobby_screen.dart';
import 'features/lobby/screens/lobby_transition_screen.dart';
import 'features/session/session_screen.dart';
import 'features/splash/splash_screen.dart';
import 'shared/utils/custom_colors.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'RPC Stories',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: CustomColors.background,
          brightness: Brightness.dark,
        ),
        scaffoldBackgroundColor: CustomColors.background,
        fontFamily: 'Zany',
      ),
      initialRoute: '/',
      onGenerateRoute: (settings) {
        // Função para criar rotas sem animação
        Widget? page;

        switch (settings.name) {
          case '/':
            page = const SplashScreen();
            break;
          case '/login':
            page = const LoginScreen();
            break;
          case '/register':
            page = const RegisterScreen();
            break;
          case '/loading':
            page = const LoadingScreen();
            break;
          case '/session':
            page = const SessionScreen();
            break;
          case '/lobby-transition':
            page = const LobbyTransitionScreen();
            break;
          case '/lobby':
            page = const LobbyScreen();
            break;
        }

        if (page != null) {
          return PageRouteBuilder(
            pageBuilder: (_, __, ___) => page!,
            transitionDuration: Duration.zero,
            reverseTransitionDuration: Duration.zero,
            settings: settings, // Importante para a URL
          );
        }

        return null;
      },
    );
  }
}

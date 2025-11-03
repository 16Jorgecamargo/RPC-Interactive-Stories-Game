# RPG Stories - Protótipo Flutter

Protótipo de tela de Login/Register para webapp de RPG de histórias interativas desenvolvido em Flutter.

## Características

- **Tema Medieval/Fantasia**: Interface visual com paleta de cores marrom/dourado
- **Fonte Customizada**: Utiliza a fonte "Zany" para dar um toque medieval
- **Background Animado**: Partículas flutuantes no fundo para criar atmosfera
- **Componentes Reutilizáveis**: Botões e campos de texto estilizados
- **Mock de Autenticação**: Simula delay de requisição (2s) sem backend real
- **Validação de Formulários**: Validação básica de campos

## Estrutura do Projeto

```
lib/
├── main.dart                    # Ponto de entrada e rotas
├── components/                  # Componentes reutilizáveis
│   ├── animated_background.dart # Background com partículas animadas
│   ├── custom_button.dart       # Botão estilizado com hover/click
│   └── custom_text_field.dart   # Campo de texto estilizado
└── screens/                     # Telas
    ├── login_screen.dart        # Tela de login
    └── register_screen.dart     # Tela de registro

assets/
├── fonts/
│   └── Zany-yYngM.ttf          # Fonte medieval
└── images/                      # (placeholder para imagens futuras)
```

## Como Executar

### Web (Recomendado para protótipo)

```bash
cd flutter_app
flutter run -d chrome
```

ou para build de produção:

```bash
flutter build web
```

### Requisitos

- Flutter SDK (versão 3.3.4 ou superior)
- Dart SDK incluído no Flutter
- Chrome (para executar versão web)

## Funcionalidades Mockadas

### Tela de Login
- Campo "Usuário"
- Campo "Senha"
- Botão "Entrar" (simula login com delay de 2s)
- Link para criar conta

### Tela de Register
- Campo "Usuário" (mínimo 3 caracteres)
- Campo "Email" (validação básica)
- Campo "Senha" (mínimo 6 caracteres)
- Campo "Confirmar Senha" (verifica se senhas coincidem)
- Botão "Registrar" (simula registro com delay de 2s)
- Link para voltar ao login

## Próximos Passos (Integração com Backend)

1. Criar cliente RPC para comunicação com backend Node.js
2. Implementar AuthService usando JSON-RPC 2.0
3. Armazenar JWT token no localStorage
4. Adicionar gerenciamento de estado (Provider ou MobX)
5. Adicionar mais assets visuais (backgrounds, decorações)
6. Implementar telas de gameplay

## Tecnologias Utilizadas

- **Flutter**: Framework UI
- **Flame**: Engine para elementos animados (background com partículas)
- **Material Design**: Componentes base do Flutter

## Observações

Este é um **protótipo visual** para análise de design e UX. Nenhuma integração real com backend foi implementada. Todas as requisições são mockadas com delays para simular comportamento real.

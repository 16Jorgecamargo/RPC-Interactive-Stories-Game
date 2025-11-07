# 1. Introdução

## 1.1 Propósito
Este documento especifica os requisitos para um sistema simplificado de histórias interativas do tipo "escolha sua própria aventura" que permite múltiplos jogadores participarem colaborativamente através de votação em tempo real, utilizando comunicação via JSON-RPC 2.0.

## 1.2 Escopo
O sistema consistirá em:
- **Servidor JSON-RPC**: Gerencia salas, histórias, votações e chat em tempo real
- **Clientes remotos**: Interface React + TypeScript para jogadores interagirem com as histórias
- **Comunicação JSON-RPC 2.0**: Toda comunicação cliente-servidor via RPC sobre HTTP
- **Sistema de salas**: Criação e gerenciamento de salas multiplayer
- **Sistema de votação**: Para escolhas colaborativas com contagem de votos
- **Chat em tempo real**: Para discussão entre jogadores via long polling
- **Gerenciamento de histórias**: Histórias em formato JSON armazenadas localmente
- **Sistema de eventos**: Long polling para atualizações em tempo real

## 1.3 Características Principais
- **Sem autenticação**: Sistema simplificado sem login, jogadores usam apenas nomes
- **Multiplayer real-time**: Vários jogadores em uma mesma sala de jogo
- **Histórias ramificadas**: Sistema de cards e choices para narrativas interativas
- **Votação colaborativa**: Decisões tomadas por maioria dos jogadores
- **Chat integrado**: Comunicação entre jogadores durante o jogo
- **Sistema de eventos**: Notificações em tempo real de mudanças de estado

## 1.4 Tecnologias Utilizadas

### Backend
- **Node.js**: Runtime JavaScript (ES Modules)
- **TypeScript**: Tipagem estática e desenvolvimento
- **Fastify**: Framework web para servidor HTTP
- **Zod**: Validação de schemas e tipos
- **JSON-RPC 2.0**: Protocolo RPC sobre HTTP para toda comunicação
- **Long Polling**: Técnica para atualizações em tempo real via `waitForEvents`
- **nanoid**: Geração de IDs únicos para salas e jogadores
- **Pino**: Logger de alta performance

### Frontend
- **React 18**: Biblioteca para construção de interfaces reativas
- **TypeScript**: Tipagem estática com inferência de tipos Zod
- **Vite**: Build tool e dev server ultra-rápido com HMR
- **TailwindCSS**: Framework CSS utility-first + animações customizadas
- **shadcn/ui**: Componentes React (Radix UI + CVA) - Button, Input, Card, Dialog, Badge
- **Lucide React**: Biblioteca de ícones SVG
- **clsx + tailwind-merge**: Composição e merge de classes CSS
- **Beacon API**: Cleanup automático de jogadores ao fechar aba
- **SessionStorage**: Persistência do nome do jogador entre reloads
- **Navegação**: State management simples (`useState`) sem React Router

---

[Voltar ao Menu](./README.md) | [Próximo: Descrição Geral →](./02-descricao-geral.md)
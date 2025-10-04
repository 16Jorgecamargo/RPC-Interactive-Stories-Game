# 1. Introdução

## 1.1 Propósito
Este documento especifica os requisitos para um sistema de histórias interativas do tipo "escolha sua própria aventura" que permite múltiplos jogadores participarem colaborativamente através de votação em tempo real, utilizando comunicação via Remote Procedure Calls (RPC).

## 1.2 Escopo
O sistema consistirá em:
- **Servidor central**: Gerencia usuários, autenticação, histórias, sessões de jogo, personagens, votações e chat
- **Clientes remotos**: Interface para jogadores interagirem com as histórias
- **Comunicação RPC**: Toda comunicação entre cliente-servidor via RPC
- **Sistema de autenticação JWT**: Login seguro com tokens
- **Sistema de roles**: Administradores e Usuários Finais
- **Chat via RPC**: Para discussão entre jogadores
- **Sistema de votação**: Para escolhas colaborativas
- **Gerenciamento de personagens**: Personagens vinculados a sessões
- **Import de histórias Mermaid**: Upload e parsing de histórias
- **Documentação Swagger**: APIs autodocumentáveis

## 1.3 Tecnologias Utilizadas
- **Node.js**: Runtime JavaScript para servidor e cliente
- **Fastify**: Framework web para APIs e servidor HTTP
- **Zod**: Validação de esquemas e tipos
- **JWT (jsonwebtoken)**: Autenticação e autorização
- **bcrypt**: Hash de senhas
- **Swagger/OpenAPI**: Documentação automática das APIs
- **JSON-RPC 2.0**: Protocolo RPC sobre HTTP para toda comunicação
- **Long Polling**: Técnica para atualizações em tempo real via RPC
- **Mermaid Parser**: Parse de histórias em formato Mermaid

---

[← Voltar ao Menu](./README.md) | [Próximo: Descrição Geral →](./02-descricao-geral.md)
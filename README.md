# Documentação SRS - Sistema de Histórias Interativas

## Sobre este Projeto

Sistema simplificado de histórias interativas multiplayer do tipo "escolha sua própria aventura" com comunicação via JSON-RPC 2.0. Permite que múltiplos jogadores participem colaborativamente de histórias ramificadas através de votação em tempo real.

**Características principais**:
- Backend JSON-RPC 2.0 com Node.js + TypeScript + Fastify
- Frontend React 18 + TypeScript + Vite + TailwindCSS + shadcn/ui
- Sistema de salas multiplayer
- Votação colaborativa em tempo real
- Chat integrado via long polling
- Histórias em formato JSON

## Índice da Documentação

### 1. [Introdução](./DOCS/01-introducao.md)
Visão geral do sistema, propósito, escopo e tecnologias utilizadas.

---

### 2. [Descrição Geral](./DOCS/02-descricao-geral.md)
Perspectiva do produto, funções, características dos usuários e fluxos.

---

### 3. [Requisitos Funcionais](./DOCS/03-requisitos-funcionais.md)
Especificação detalhada de todos os requisitos funcionais.

---

### 4. [Requisitos Não Funcionais](./DOCS/04-requisitos-nao-funcionais.md)
Requisitos de performance, segurança, qualidade e manutenibilidade.

---

### 5. [Arquitetura](./DOCS/05-arquitetura.md)
Visão geral da arquitetura, componentes, camadas e fluxo de dados.

---

### 6. [APIs JSON-RPC](./DOCS/06-apis-rpc.md)
Especificação completa de todos os métodos RPC disponíveis.

---

### 7. [Estrutura de Dados](./DOCS/07-estrutura-dados.md)
Schemas Zod, interfaces TypeScript e exemplos de estruturas.

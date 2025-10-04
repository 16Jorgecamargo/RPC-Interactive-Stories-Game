# Software Requirements Specification (SRS)
## Sistema de Histórias Interativas Multijogador com RPC

### Informações do Projeto
- **Disciplina**: Sistemas Distribuídos e Tecnologias (CC5SDT)
- **Semestre**: 2025-2
- **Professor**: Rafael Keller Tesser
- **Tecnologias**: Node.js, JavaScript, Zod, Fastify, RPC, JWT, Swagger, Docker

---

## 📑 Índice de Documentação

### [1. Introdução](./SRS/01-introducao.md)
- Propósito do sistema
- Escopo e funcionalidades
- Tecnologias utilizadas

### [2. Descrição Geral](./SRS/02-descricao-geral.md)
- Perspectiva do produto
- Funções principais
- Características dos usuários

### [3. Requisitos Funcionais](./SRS/03-requisitos-funcionais.md)
- RF01-RF16: Todos os requisitos funcionais
- Cadastro, autenticação, personagens, sessões, chat, administração

### [4. Requisitos Não Funcionais](./SRS/04-requisitos-nao-funcionais.md)
- Performance, disponibilidade, usabilidade
- Segurança e escalabilidade

### [5. Arquitetura do Sistema](./SRS/05-arquitetura.md)
- Componentes principais
- Estrutura de dados
- Diagramas de arquitetura

### [6. Fluxos do Sistema](./SRS/06-fluxos.md)
- Diagramas Mermaid de todos os fluxos
- Autenticação, votação, chat, administração

### [7. APIs RPC](./SRS/07-apis-rpc.md)
- Métodos do servidor
- Documentação Swagger
- Tipos de atualizações

### [8. Validação com Zod](./SRS/08-validacao-zod.md)
- Schemas de validação
- Tipos de dados
- Validações de entrada

### [9. Estrutura de Arquivos](./SRS/09-estrutura-arquivos.md)
- Organização completa do projeto
- Estrutura de pastas e arquivos

### [10. Casos de Uso](./SRS/10-casos-de-uso.md)
- Cenários de uso detalhados
- Fluxos de usuário

### [11. Tratamento de Erros](./SRS/11-tratamento-erros.md)
- Tipos de erros
- Estratégias de tratamento

### [12. Considerações de Implementação](./SRS/12-consideracoes-implementacao.md)
- Persistência de dados
- Sincronização e monitoramento

### [13. Cronograma de Desenvolvimento](./SRS/13-cronograma.md)
- Planejamento de 8 semanas
- Marcos e entregas

### [14. Critérios de Aceitação](./SRS/14-criterios-aceitacao.md)
- Checklist de funcionalidades
- Requisitos de entrega

### [15. Deploy Distribuído](./SRS/15-deploy-distribuido.md)
- Configuração VPS + Docker para servidor
- Instruções de uso para clientes GitHub
- Scripts de monitoramento e backup

---

## 🎯 Objetivo do Sistema

Sistema de **histórias interativas multijogador distribuído** que permite:
- **👥 Usuários finais**: Baixar cliente do GitHub, conectar ao servidor remoto, votar colaborativamente
- **🛠️ Administradores**: Gerenciar servidor VPS, usuários, sessões e histórias via Mermaid
- **🌐 Arquitetura**: Cliente-servidor distribuída com comunicação 100% RPC

## 🏗️ Arquitetura Distribuída

### **🖥️ Servidor (VPS + Docker)**
- **Deploy**: VPS rodando 24/7 com Docker containers
- **Tecnologia**: Node.js + Fastify + JSON-RPC 2.0
- **Gerenciamento**: Docker Compose, logs, backup automático
- **Acesso**: HTTP/HTTPS público para clientes remotos

### **💻 Cliente (GitHub + Local)**
- **Distribuição**: Download via GitHub
- **Execução**: `npm start` → abre browser local
- **Conectividade**: RPC remoto para servidor VPS
- **Interface**: HTML/CSS/JS servindo localhost:5173

## 🛠️ Stack Tecnológica

- **Backend**: Node.js + Fastify + JSON-RPC 2.0
- **Deploy**: Docker + VPS + Nginx (opcional)
- **Cliente**: Express + HTML/CSS/JS
- **Comunicação**: RPC over HTTP/HTTPS + CORS
- **Autenticação**: JWT + bcrypt
- **Validação**: Zod schemas
- **Documentação**: Swagger/OpenAPI
- **Histórias**: Parser Mermaid
- **Real-time**: Long Polling via RPC

---

*Desenvolvido para a disciplina CC5SDT - Sistemas Distribuídos e Tecnologias*
## Cliente Web (Frontend)

Um cliente estatico foi adicionado na pasta `client/`, seguindo a estrutura descrita no SRS. Ele oferece paginas isoladas para login, cadastro e listagem dos personagens associados ao usuario.

### Como executar
1. `cd client`
2. `npm install`
3. `npm start`  (abre o lite-server em `http://localhost:3000`)

Por padrão o cliente consome o endpoint RPC configurado em `app-config.js`. é possovel sobrescrever o endereço armazenando `hist-interactive-server-url` no `localStorage` ou editando o arquivo de configuração.

### Funcionalidades atuais
- Formularios responsivos de login e cadastro com feedback em tempo real.
- Persistencia do token JWT em `localStorage` após autenticação.
- Página de "Meus Personagens" com carregamento via RPC e indicação de status (disponível/em sessão) conforme SRS.


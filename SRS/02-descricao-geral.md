# 2. Descrição Geral

## 2.1 Perspectiva do Produto
Sistema distribuído cliente-servidor onde múltiplos jogadores se conectam a um servidor central para participar de histórias interativas. O servidor mantém o estado da história e coordena as decisões coletivas.

## 2.2 Funções do Produto
- **Autenticação e Autorização**: Login/cadastro com JWT, roles de usuário
- **Home Adaptativo**: Interface que se adapta ao estado do usuário
- **Gerenciamento de Histórias**: CRUD completo, import Mermaid com metadados
- **Gerenciamento de Sessões**: Criar, entrar via código, controle de estados
- **Sistema de Personagens D&D**: Criação complexa com raça, classe, história
- **Sistema de votação**: Escolhas colaborativas com polling
- **Chat via RPC**: Mensagens em tempo real via polling
- **Navegação por capítulos**: Baseada em decisões coletivas
- **Controle de Acesso**: Bloqueio de sessões em progresso
- **Painel Administrativo**: Gestão completa para admins
- **Documentação**: APIs autodocumentáveis com Swagger

## 2.3 Características dos Usuários
- **Usuários Finais**:
  - Criam conta com usuário/senha
  - Criam e gerenciam suas próprias sessões
  - Criam e gerenciam seus próprios personagens
  - Participam de sessões de outros usuários
  - Votam e usam chat durante as histórias
- **Administradores**:
  - Todas as funções de usuários finais
  - Gerenciam usuários (visualizar, excluir)
  - Gerenciam todas as sessões (visualizar, excluir)
  - Gerenciam histórias (CRUD completo, import Mermaid)
  - Acesso a paineis administrativos

## 2.4 Fluxo de Experiência do Usuário

### Home Pós-Login
Após autenticação, o usuário é direcionado para uma tela home adaptativa:

#### Cenário 1: Usuário sem Sessões
- Tela exibe botão central "Criar ou Entrar em Sessão"
- Opções: criar nova sessão ou entrar via código

#### Cenário 2: Usuário com Sessões Existentes
- Cards de sessões exibidos com informações:
  - Nome da sessão
  - História sendo jogada + gênero
  - Status atual (Aguardando jogadores, Criando personagens, Em andamento)
  - Número de jogadores (ex: "3/5 jogadores")
  - Progresso na história (capítulo atual)
  - Tempo desde última atividade
- Botões no rodapé para criar nova sessão ou entrar via código

### Estados de Sessão
O sistema gerencia quatro estados principais:

1. **WAITING_PLAYERS**: Aguardando jogadores se conectarem
2. **CREATING_CHARACTERS**: Todos conectados, criando personagens
3. **IN_PROGRESS**: Jogo em andamento, sessão bloqueada para novos usuários
4. **COMPLETED**: História finalizada

### Processo de Criação de Sessão
1. Seleção do nome da sessão
2. Escolha de história a partir de catálogo com:
   - Nome e descrição da história
   - Gênero (Aventura, Horror, Fantasia, etc.)
   - Sinopse detalhada
   - Número recomendado de jogadores
3. Botão "Criar" liberado apenas após seleções válidas

### Sistema de Personagens Estilo D&D
Quando um jogador entra em uma sessão pela primeira vez:

#### Atributos do Personagem
- **Nome**: Identificação do personagem
- **Raça**: Humano, Elfo, Anão, Halfling, etc.
- **Classe**: Guerreiro, Mago, Ladino, Clérigo, etc.
- **História/Background**: Origem e motivações
- **Aparência**: Descrição física detalhada
- **Atributos Adicionais**: Personalidade, medos, objetivos

#### Validação para Início
- Interface mostra lista de jogadores conectados
- Para cada jogador: nome real (da conta) + status de criação
- Indicador visual (✓) quando personagem está completo
- Botão "Iniciar Sessão" habilitado apenas quando todos criaram personagens

### Controle de Acesso
- **Antes do início**: Qualquer jogador pode entrar na sessão
- **Após início**: Sessão bloqueada, apenas jogadores originais podem reconectar
- **Durante o jogo**: Sincronização de estado para todos os participantes

### Navegação Contextual
- Códigos de sessão visíveis para compartilhamento
- Breadcrumbs indicando estado atual
- Transições de estado automáticas baseadas em ações dos jogadores

---

[← Anterior: Introdução](./01-introducao.md) | [Voltar ao Menu](./README.md) | [Próximo: Requisitos Funcionais →](./03-requisitos-funcionais.md)
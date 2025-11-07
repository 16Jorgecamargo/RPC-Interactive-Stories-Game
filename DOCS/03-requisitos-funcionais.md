# 3. Requisitos Funcionais

## RF01 - Listar Histórias Disponíveis
**Descrição**: O sistema deve permitir que clientes listem todas as histórias disponíveis.
- **Entrada**: Nenhuma (método `listStories()`)
- **Processamento**: Leitura dos arquivos JSON da pasta `stories/`
- **Saída**: Lista de histórias com id, title e description

## RF02 - Criação de Salas
**Descrição**: O sistema deve permitir que jogadores criem novas salas de jogo.
- **Entrada**: Nome da sala, ID da história
- **Processamento**: Validação da história, geração de ID único, criação da sala em memória
- **Saída**: ID da sala criada ou erro de validação

## RF03 - Listar Salas Existentes
**Descrição**: O sistema deve permitir listar todas as salas ativas.
- **Entrada**: Nenhuma (método `listRooms()`)
- **Processamento**: Recuperação de todas as salas em memória com metadados
- **Saída**: Lista de salas com id, name, storyTitle, playerCount

## RF04 - Entrar em Sala
**Descrição**: Jogadores devem poder entrar em salas existentes.
- **Entrada**: ID da sala, nome do jogador
- **Processamento**: Validação da sala, criação de player, adição à sala, geração de evento
- **Saída**: ID do jogador, estado completo do jogo (card atual, players, votes, messages)

## RF05 - Sair da Sala
**Descrição**: Jogadores devem poder sair de salas.
- **Entrada**: ID da sala, ID do jogador
- **Processamento**: Remoção do jogador, remoção de votos, geração de evento
- **Saída**: Confirmação de saída ou erro se sala/jogador não existir

## RF06 - Obter Estado do Jogo
**Descrição**: Jogadores devem poder consultar o estado atual da sala.
- **Entrada**: ID da sala
- **Processamento**: Recuperação do card atual, players, votes e messages
- **Saída**: Estado completo do jogo ou erro se sala não existir

## RF07 - Sistema de Votação
**Descrição**: Jogadores devem poder votar nas escolhas disponíveis.
- **Entrada**: ID da sala, ID do jogador, ID da escolha
- **Processamento**:
  - Validação de sala, jogador e escolha
  - Registro do voto (substitui voto anterior se existir)
  - Contagem de votos
  - Se primeiro voto: inicia countdown de 15 segundos
  - Se todos votaram: finaliza votação imediatamente
  - Geração de evento de voto
- **Saída**: Objeto com contagem de votos por escolha `{ voteCount: Record<string, number> }`
- **Observação**: Mudança de card é comunicada via evento `cardChanged` no long polling

## RF08 - Resolução de Votação
**Descrição**: Sistema deve avançar a história quando houver consenso.
- **Entrada**: Votos dos jogadores
- **Processamento**:
  - Verifica se maioria absoluta votou na mesma opção
  - OU verifica se todos jogadores votaram
  - Determina escolha vencedora
  - Atualiza currentCardId
  - Limpa votos
  - Gera evento cardChanged
- **Saída**: Novo card ativo

## RF09 - Chat em Tempo Real
**Descrição**: Jogadores devem poder enviar mensagens de chat.
- **Entrada**: ID da sala, ID do jogador, mensagem
- **Processamento**:
  - Validação de sala e jogador
  - Criação de objeto ChatMessage com ID único
  - Armazenamento na lista de messages
  - Geração de evento de mensagem
- **Saída**: Objeto da mensagem criada ou erro

## RF10 - Sistema de Eventos (Long Polling)
**Descrição**: Clientes devem poder aguardar novos eventos via polling.
- **Entrada**: ID da sala, último ID de evento recebido
- **Processamento**:
  - Validação da sala
  - Aguarda até timeout (30s) ou novos eventos
  - Retorna eventos com ID maior que lastEventId
- **Saída**: Lista de eventos novos e ID do último evento

## RF11 - Detecção de Fim de História
**Descrição**: Sistema deve detectar quando história termina.
- **Entrada**: Card atual
- **Processamento**: Verifica se `choices` está vazio
- **Saída**: Card final exibido, sem opções de voto

## RF12 - Geração de Eventos
**Descrição**: Sistema deve gerar eventos para todas as ações relevantes.
- **Entrada**: Ações dos jogadores (join, leave, vote, message)
- **Processamento**: Criação de objeto GameEvent com ID incremental
- **Saída**: Evento adicionado à lista de events da sala

Tipos de eventos:
- `playerJoined`: Quando jogador entra na sala
- `playerLeft`: Quando jogador sai da sala
- `vote`: Quando jogador vota em escolha
- `cardChanged`: Quando história avança para novo card
- `message`: Quando mensagem de chat é enviada
- `deleteRoomInitiated`: Quando votação para deletar é iniciada
- `deleteRoomVoted`: Quando jogador vota em deletar sala
- `roomDeleted`: Quando sala é deletada
- `countdownStarted`: Quando contagem regressiva inicia
- `countdownFinished`: Quando contagem regressiva termina

## RF13 - Iniciar Votação para Deletar Sala
**Descrição**: Qualquer jogador pode iniciar votação para deletar a sala.
- **Entrada**: ID da sala, ID do jogador
- **Processamento**:
  - Validação de sala e jogador
  - Criação de Map de votos para exclusão
  - Registro do timestamp de início
  - Geração de evento deleteRoomInitiated
  - Timeout de 60 segundos
  - Bloqueia nova votação durante os 60 segundos
- **Saída**: Confirmação de início da votação

## RF14 - Votar em Deletar Sala
**Descrição**: Jogadores devem poder votar sim/não para deletar sala.
- **Entrada**: ID da sala, ID do jogador, voto (boolean)
- **Processamento**:
  - Validação de sala e jogador
  - Verificação de votação ativa
  - Registro do voto (substituível)
  - Contagem de votos SIM e NÃO
  - Geração de evento deleteRoomVoted
  - Se ≥75% votarem SIM: deletar sala
  - Se matematicamente impossível atingir 75%: cancelar votação
  - Se todos votarem e ≥75% SIM: deletar imediatamente
- **Saída**: Confirmação do voto `{ yesVotes, noVotes, total, approved }`

## RF15 - Deletar Sala por Votação
**Descrição**: Sistema deve deletar sala quando 75% ou mais votarem para deletar.
- **Entrada**: Votos dos jogadores
- **Processamento**:
  - Verificação de aprovação (≥75% votaram SIM)
  - Geração de evento roomDeleted
  - Remoção da sala da memória
  - Cancelamento de countdowns ativos
- **Saída**: Sala removida, eventos de exclusão gerados
- **Exemplo**: Sala com 4 jogadores requer 3 votos SIM (75%)

## RF16 - Timeout de Votação para Deletar
**Descrição**: Votação para deletar deve expirar após 60 segundos.
- **Entrada**: Timestamp de início da votação
- **Processamento**:
  - Aguarda 60 segundos
  - Se votação ainda ativa e não atingiu 75%: cancelar votação
  - Limpar dados de deleteRoomVotes
  - Gerar mensagem do sistema informando cancelamento
- **Saída**: Votação cancelada automaticamente

## RF17 - Limpeza de Votos ao Avançar Card
**Descrição**: Sistema deve limpar votos ao mudar de card.
- **Entrada**: Mudança de card
- **Processamento**: Esvaziar Map de votes
- **Saída**: Votos resetados para novo card

## RF18 - Mensagens do Sistema
**Descrição**: Sistema deve enviar mensagens automáticas para eventos importantes.
- **Entrada**: Eventos de jogo (join, leave, card change)
- **Processamento**: Criação de ChatMessage com flag `isSystem: true`
- **Saída**: Mensagem do sistema no chat

## RF19 - Validação de Escolhas
**Descrição**: Sistema deve validar se escolha votada existe no card atual.
- **Entrada**: ID da escolha, card atual
- **Processamento**: Verificação se choiceId existe em currentCard.choices
- **Saída**: Erro se escolha não existir

## RF20 - Health Check
**Descrição**: Sistema deve fornecer endpoint de health check.
- **Entrada**: Requisição GET em `/health`
- **Processamento**: Verificação de status do servidor
- **Saída**: `{ status: 'ok' }` com HTTP 200

## RF21 - Carregamento Dinâmico de Histórias
**Descrição**: Sistema deve carregar histórias dinamicamente da pasta stories/.
- **Entrada**: Inicialização do servidor
- **Processamento**:
  - Leitura de todos arquivos .json em `stories/`
  - Parse e validação com Zod StorySchema
  - Armazenamento em Map de histórias
- **Saída**: Histórias carregadas em memória ou erro de validação

## RF22 - Validação de Parâmetros com Zod
**Descrição**: Todos métodos RPC devem validar parâmetros com Zod.
- **Entrada**: Parâmetros da chamada RPC
- **Processamento**: Validação contra schema Zod apropriado
- **Saída**: Erro -32602 (Invalid params) se validação falhar

## RF23 - Tratamento de Erros JSON-RPC
**Descrição**: Sistema deve retornar erros padronizados JSON-RPC 2.0.
- **Entrada**: Erros durante processamento
- **Processamento**: Mapeamento para códigos de erro JSON-RPC
- **Saída**: Objeto de erro padronizado

Códigos de erro:
- `-32700`: Parse error
- `-32600`: Invalid Request
- `-32601`: Method not found
- `-32602`: Invalid params
- `-32603`: Internal error
- `-32001`: Resource not found (custom)

## RF24 - Sistema de Countdowns Automáticos
**Descrição**: Sistema deve gerenciar timers automáticos para votação e mudança de cards.

**Comportamento da Votação**:
- **Entrada**: Primeiro voto recebido em um card
- **Processamento**: Inicia countdown de 15 segundos (`setTimeout`)
- **Saída**: Evento `countdownStarted` com tipo `vote`
- **Cancelamento**: Se todos votarem antes do timeout, cancela countdown e finaliza votação imediatamente
- **Finalização**: Ao expirar, finaliza votação com votos atuais, gera evento `countdownFinished`

**Comportamento da Mudança de Card**:
- **Entrada**: Votação finalizada (por unanimidade ou timeout)
- **Processamento**: Inicia countdown de 3 segundos antes de mudar card
- **Saída**: Evento `countdownStarted` com tipo `card`
- **Finalização**: Ao expirar, muda card, limpa votos, gera eventos `countdownFinished` e `cardChanged`

**Estrutura de Countdown**:
```typescript
{
  countdownType: 'vote' | 'card',
  durationMs: number,      // 15000 para vote, 3000 para card
  startedAt: number        // Timestamp Unix em ms
}
```

**Integração com GameState**: Campo `countdowns` incluído no retorno de `getGameState()` e `joinRoom()`

## RF25 - Persistência de Metadados de Salas
**Descrição**: Sistema deve persistir metadados de salas em arquivo JSON local.

- **Entrada**: Criação ou modificação de sala (criar, entrar, sair, votar, etc)
- **Processamento**:
  - Serializa apenas metadados: `id`, `name`, `storyId`, `currentCardId`, `createdAt`
  - Escreve em `backend/data/rooms.json`
  - Carrega automaticamente na inicialização do servidor
  - Valida `storyId` ao carregar (ignora salas com histórias inexistentes)
- **Saída**: Arquivo JSON atualizado
- **Limitação**: Players, votos, mensagens e eventos **não são persistidos** (memória volátil)

**Arquivo de Dados**: `backend/data/rooms.json`
```json
[
  {
    "id": "abc123",
    "name": "Aventura Épica",
    "storyId": "reino-perdido",
    "currentCardId": "card-1",
    "createdAt": 1699564800000
  }
]
```

## RF26 - Indicador de Status de Conexão
**Descrição**: Frontend deve exibir status de conexão com servidor em tempo real.

- **Entrada**: Pings periódicos via método RPC
- **Processamento**:
  - Chama `listStories()` a cada 5 segundos como health check
  - Detecta sucesso/falha da requisição
  - Atualiza estado de conexão (conectado/desconectado)
- **Saída**: Badge flutuante no canto superior direito com status visual
  - **Verde**: "Conectado" (requisições bem-sucedidas)
  - **Vermelho**: "Desconectado" (requisições falhando)
- **Componente**: `ServerStatus.tsx`

## RF27 - Persistência de Sessão do Jogador
**Descrição**: Frontend deve manter nome do jogador após refresh da página.

- **Entrada**: Nome informado no login inicial
- **Processamento**:
  - Salva nome em `sessionStorage` do navegador
  - Verifica existência ao carregar aplicação
  - Se existir: pula tela de login, vai direto para lobby
- **Saída**: Login automático após refresh (mantém sessão)
- **Limitação**: SessionStorage é limpo ao fechar aba/navegador (não persiste entre sessões)

## RF28 - Cleanup Automático ao Fechar Aba
**Descrição**: Sistema deve remover jogador automaticamente ao fechar aba/navegador.

- **Entrada**: Evento `beforeunload` do navegador
- **Processamento**:
  - Detecta fechamento de aba/navegador
  - Envia `leaveRoom(roomId, playerId)` via **Beacon API**
  - Beacon API é não-bloqueante (requisição enfileirada mesmo após aba fechar)
- **Saída**: Jogador removido automaticamente da sala, evento `playerLeft` gerado
- **Tecnologia**: `navigator.sendBeacon()` (padrão W3C para requisições no unload)

---

[← Anterior: Descrição Geral](./02-descricao-geral.md) | [Voltar ao Menu](./README.md) | [Próximo: Requisitos Não Funcionais →](./04-requisitos-nao-funcionais.md) 

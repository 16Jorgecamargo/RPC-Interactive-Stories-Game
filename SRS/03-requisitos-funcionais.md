# 3. Requisitos Funcionais

## RF01 - Cadastro de Usuários
**Descrição**: O sistema deve permitir que novos usuários se cadastrem.
- **Entrada**: Usuário (não existente), senha, confirmação de senha
- **Processamento**: Validação de unicidade do usuário, hash da senha
- **Saída**: Usuário criado ou erro de validação

## RF02 - Autenticação JWT
**Descrição**: O sistema deve permitir login com JWT tokens.
- **Entrada**: Usuário e senha
- **Processamento**: Validação de credenciais, geração de token JWT
- **Saída**: Token JWT válido ou erro de autenticação

## RF03 - Gerenciamento de Histórias (Admin)
**Descrição**: Administradores devem poder gerenciar histórias interativas.
- **Entrada**: Código Mermaid (colado ou arquivo), metadados da história
- **Processamento**: Parse do Mermaid, validação da estrutura, armazenamento
- **Saída**: História criada/atualizada/removida ou erro

## RF04 - Import de Histórias Mermaid
**Descrição**: Sistema deve aceitar histórias em formato Mermaid.
- **Entrada**: Código Mermaid ou upload de arquivo .mmd
- **Processamento**: Parse do diagrama Mermaid, conversão para estrutura interna
- **Saída**: Estrutura de história válida ou erro de parse

## RF05 - Criação de Sessões de Jogo
**Descrição**: Usuários devem poder criar sessões para grupos de jogadores.
- **Entrada**: Nome da sessão, história selecionada, token JWT
- **Processamento**: Validação de autenticação, criação de instância
- **Saída**: ID da sessão criada ou erro de autorização

## RF06 - Exclusão de Sessões Próprias
**Descrição**: Usuários podem excluir sessões que criaram.
- **Entrada**: ID da sessão, token JWT
- **Processamento**: Validação de propriedade, exclusão da sessão e personagens
- **Saída**: Confirmação de exclusão ou erro

## RF07 - Gerenciamento de Personagens
**Descrição**: Usuários devem poder criar e gerenciar personagens vinculados a sessões.
- **Entrada**: Dados do personagem, ID da sessão, token JWT
- **Processamento**: Validação, vinculação à sessão, CRUD
- **Saída**: Personagem criado/atualizado/removido

## RF08 - Participação em Sessões
**Descrição**: Usuários devem poder se conectar a sessões existentes com personagens.
- **Entrada**: ID da sessão, ID do personagem, token JWT
- **Processamento**: Validação de personagem, adição à sessão
- **Saída**: Estado atual da história com personagem ativo

## RF09 - Exibição de Capítulos
**Descrição**: O sistema deve exibir o conteúdo do capítulo atual.
- **Entrada**: Estado atual da sessão, token JWT
- **Processamento**: Validação de acesso, recuperação do texto e opções
- **Saída**: Texto da história e opções disponíveis

## RF10 - Sistema de Votação
**Descrição**: Usuários devem poder votar nas opções disponíveis.
- **Entrada**: Voto do personagem (opção escolhida), token JWT
- **Processamento**: Validação de acesso, registro do voto, verificação
- **Saída**: Confirmação do voto ou erro

## RF11 - Resolução de Votação
**Descrição**: O sistema deve determinar a escolha vencedora e avançar na história.
- **Entrada**: Votos de todos os personagens na sessão
- **Processamento**: Contagem de votos, determinação da opção vencedora
- **Saída**: Próximo capítulo da história

## RF12 - Chat via RPC
**Descrição**: Usuários devem poder enviar e receber mensagens através de chamadas RPC.
- **Entrada**: Mensagem de texto via RPC, token JWT
- **Processamento**: Validação, armazenamento da mensagem, notificação
- **Saída**: Mensagem disponível para consulta via RPC

## RF13 - Notificações via RPC
**Descrição**: O sistema deve permitir que clientes consultem mudanças de estado via RPC.
- **Entrada**: Consultas periódicas via RPC, token JWT
- **Processamento**: Validação, verificação de eventos desde última consulta
- **Saída**: Lista de atualizações pendentes retornada via RPC

## RF14 - Finalização de História
**Descrição**: O sistema deve detectar e gerenciar o fim das histórias.
- **Entrada**: Capítulo final alcançado
- **Processamento**: Exibição da conclusão, cálculo de estatísticas
- **Saída**: Tela de finalização e estatísticas da sessão

## RF15 - Gerenciamento Administrativo
**Descrição**: Administradores devem ter acesso a funções de gestão.
- **Entrada**: Ações administrativas, token JWT de admin
- **Processamento**: Validação de role, execução de ações (excluir usuários/sessões)
- **Saída**: Confirmação da ação ou erro de autorização

## RF16 - Cascade Delete de Personagens
**Descrição**: Quando uma sessão é excluída, personagens vinculados devem ser removidos.
- **Entrada**: Exclusão de sessão
- **Processamento**: Identificação e remoção de personagens vinculados
- **Saída**: Sessão e personagens removidos com sucesso

## RF17 - Home Adaptativo Pós-Login
**Descrição**: O sistema deve exibir uma tela home que se adapta ao estado do usuário.
- **Entrada**: Token JWT válido
- **Processamento**: Verificação de sessões do usuário, geração de interface adaptativa
- **Saída**: Home com cards de sessões existentes ou botões para criar/entrar

## RF18 - Cards de Sessão com Metadados
**Descrição**: O sistema deve exibir informações detalhadas sobre cada sessão do usuário.
- **Entrada**: Sessões do usuário
- **Processamento**: Compilação de metadados (estado, jogadores, progresso, história)
- **Saída**: Cards com nome, status, jogadores ativos, capítulo atual e tempo de atividade

## RF19 - Entrada em Sessão via Código
**Descrição**: Usuários devem poder entrar em sessões usando código de identificação.
- **Entrada**: Código da sessão, token JWT
- **Processamento**: Validação do código, verificação de estado da sessão, adição do usuário
- **Saída**: Entrada bem-sucedida na sessão ou erro de código/estado inválido

## RF20 - Criação de Personagens Estilo D&D
**Descrição**: Sistema deve permitir criação detalhada de personagens com atributos RPG.
- **Entrada**: Nome, raça, classe, história, aparência e atributos, token JWT
- **Processamento**: Validação de dados, vinculação à sessão, salvamento
- **Saída**: Personagem criado com todos os atributos ou erro de validação

## RF21 - Catálogo de Histórias com Metadados
**Descrição**: O sistema deve fornecer catálogo de histórias com informações detalhadas.
- **Entrada**: Solicitação de listagem de histórias
- **Processamento**: Recuperação de histórias com metadados (gênero, sinopse, players recomendados)
- **Saída**: Lista de histórias com nome, gênero, sinopse e número recomendado de jogadores

## RF22 - Validação de Personagens para Início de Sessão
**Descrição**: Sistema deve validar que todos os jogadores criaram personagens antes de iniciar.
- **Entrada**: Estado da sessão, lista de jogadores
- **Processamento**: Verificação de personagens criados por todos os participantes
- **Saída**: Habilitação/desabilitação do botão iniciar sessão

## RF23 - Controle de Estados de Sessão
**Descrição**: Sistema deve gerenciar transições automáticas entre estados de sessão.
- **Entrada**: Ações dos jogadores (entrar, criar personagem, votar)
- **Processamento**: Validação de condições para mudança de estado, transição automática
- **Saída**: Atualização de estado (WAITING_PLAYERS → CREATING_CHARACTERS → IN_PROGRESS → COMPLETED)

## RF24 - Bloqueio de Sessão Pós-Início
**Descrição**: Sistema deve bloquear entrada de novos jogadores após início da sessão.
- **Entrada**: Tentativa de entrada em sessão com estado IN_PROGRESS
- **Processamento**: Verificação de estado e lista de participantes originais
- **Saída**: Entrada permitida apenas para jogadores originais (reconexão)

## RF25 - Home Administrativo com Painel de Controle
**Descrição**: Administradores devem ter acesso a home com botão adicional "Gerenciamento".
- **Entrada**: Login de usuário com role ADMIN
- **Processamento**: Verificação de role, geração de home com funcionalidades extras
- **Saída**: Home padrão + botão "Gerenciamento" para acesso ao painel administrativo

## RF26 - Painel de Controle de Usuários com Ações Detalhadas
**Descrição**: Sistema deve fornecer painel administrativo para gestão completa de usuários.
- **Entrada**: Acesso ao painel via botão "Gerenciamento", token JWT admin
- **Processamento**: Listagem de usuários com opções "Visualizar" e "Apagar"
- **Saída**: Interface com lista de usuários e botões de ação para cada usuário

## RF27 - Visualização e Gestão de Sessões por Usuário
**Descrição**: Admin deve poder visualizar todas as sessões criadas por um usuário específico.
- **Entrada**: Clique em "Visualizar" usuário, token JWT admin
- **Processamento**: Busca de todas as sessões criadas pelo usuário selecionado
- **Saída**: Lista de sessões com opções "Ver Detalhes" e "Apagar Sessão"

## RF28 - Detalhamento Completo de Sessão (Admin)
**Descrição**: Admin deve poder visualizar informações completas de qualquer sessão.
- **Entrada**: Clique em "Ver Detalhes" de sessão, token JWT admin
- **Processamento**: Recuperação de dados completos da sessão, participantes e estado
- **Saída**: Dialog com informações detalhadas (nome, história, participantes, progresso, datas)

## RF29 - Exclusão de Sessão com Confirmação (Admin)
**Descrição**: Admin deve poder excluir qualquer sessão com dialog de confirmação.
- **Entrada**: Clique em "Apagar Sessão", token JWT admin
- **Processamento**: Exibição de dialog de confirmação, exclusão se confirmado
- **Saída**: Dialog "Tem certeza que deseja apagar?" e remoção da sessão se confirmado

## RF30 - Exclusão de Usuário com Cascade e Confirmação
**Descrição**: Admin deve poder excluir usuário com remoção automática de suas sessões.
- **Entrada**: Clique em "Apagar" usuário, token JWT admin
- **Processamento**: Dialog de confirmação, exclusão do usuário e cascade de sessões
- **Saída**: Dialog "Tem certeza que deseja apagar?" e remoção completa se confirmado

## RF31 - Interface de Jogo com Timeline Principal
**Descrição**: Sistema deve exibir interface de jogo com timeline central para narrativa.
- **Entrada**: Acesso à sessão em estado IN_PROGRESS, token JWT
- **Processamento**: Recuperação do capítulo atual, renderização da timeline
- **Saída**: Timeline exibindo texto da história e opções disponíveis para votação

## RF32 - Lista de Jogadores com Status e Visualização
**Descrição**: Sistema deve exibir lista de participantes em tiles com informações básicas.
- **Entrada**: Estado da sessão ativa, token JWT
- **Processamento**: Compilação de dados dos jogadores (nome, descrição, status conexão)
- **Saída**: Tiles com mini-descrição do personagem, status online/offline e botão "Visualizar"

## RF33 - Visualização Completa de Ficha de Personagem
**Descrição**: Jogadores devem poder visualizar fichas completas de outros personagens.
- **Entrada**: Clique em "Visualizar" personagem, token JWT
- **Processamento**: Recuperação de dados completos do personagem selecionado
- **Saída**: Dialog com ficha completa (atributos, história, equipamentos, aparência)

## RF34 - Sistema de Votação Temporizada com Progressbar
**Descrição**: Sistema deve gerenciar votação com tempo limite e barra de progresso.
- **Entrada**: Opções do capítulo apresentadas, votos dos jogadores
- **Processamento**: Contagem regressiva iniciada após primeiro voto, monitoramento em tempo real
- **Saída**: Progressbar visual do tempo restante e execução automática quando tempo expira

## RF35 - Resolução Automática de Votação por Maioria
**Descrição**: Sistema deve calcular resultado da votação e avançar história automaticamente.
- **Entrada**: Votos coletados (todos votaram OU tempo expirou)
- **Processamento**: Contagem de votos, determinação da opção vencedora por maioria
- **Saída**: Avanço automático para próximo capítulo baseado na escolha vencedora

## RF36 - Chat Integrado na Tela de Jogo
**Descrição**: Sistema deve fornecer chat em tempo real durante o jogo via RPC.
- **Entrada**: Mensagens dos jogadores durante a sessão, token JWT
- **Processamento**: Armazenamento e distribuição de mensagens via polling RPC
- **Saída**: Feed de chat atualizado em tempo real para coordenação entre jogadores

## RF37 - Monitoramento de Status de Conexão dos Jogadores
**Descrição**: Sistema deve rastrear e exibir status de conexão de cada participante.
- **Entrada**: Atividade dos jogadores, última ação registrada
- **Processamento**: Verificação periódica de atividade, cálculo de status online/offline
- **Saída**: Indicadores visuais de conectado/desconectado para cada jogador

## RF38 - Detecção e Inicialização de Combate
**Descrição**: Sistema deve detectar nodes com flag "fight" e inicializar sistema de combate.
- **Entrada**: Avanço para capítulo com propriedade "fight" na história
- **Processamento**: Inicialização do estado de combate, preparação de inimigos e combatentes
- **Saída**: Interface de combate com dados dos participantes e inimigos

## RF39 - Sistema de Iniciativa com Rolagem D20
**Descrição**: Sistema deve gerenciar rolagem de iniciativa com timer e animações.
- **Entrada**: Combate iniciado, jogadores prontos para rolagem
- **Processamento**: Dialog de iniciativa com timer, rolagem D20 + modificadores, animação de dados
- **Saída**: Ordem de ataque definida do maior para menor resultado de iniciativa

## RF40 - Gestão de Turnos de Combate
**Descrição**: Sistema deve controlar turnos baseado na ordem de iniciativa.
- **Entrada**: Ordem de iniciativa calculada, estado atual do combate
- **Processamento**: Alternância de turnos, controle de ações por combatente
- **Saída**: Indicação visual de turno atual e próximos na fila

## RF41 - Seleção de Alvos para Ataque
**Descrição**: Sistema deve gerenciar seleção de alvos com timer e escolha automática.
- **Entrada**: Turno do combatente, lista de alvos válidos
- **Processamento**: Dialog de seleção para jogadores, escolha aleatória para inimigos, timer automático
- **Saída**: Alvo selecionado para o ataque ou escolha automática por timeout

## RF42 - Sistema de Ataque D20 vs Classe de Armadura
**Descrição**: Sistema deve processar ataques com rolagem D20 contra CA do alvo.
- **Entrada**: Atacante, alvo, modificadores de ataque
- **Processamento**: Rolagem D20, aplicação de modificadores, comparação com CA, detecção de críticos
- **Saída**: Resultado do ataque (acerto/erro/crítico/falha crítica)

## RF43 - Cálculo e Aplicação de Dano
**Descrição**: Sistema deve calcular dano com dados, modificadores e resistências.
- **Entrada**: Ataque bem-sucedido, dados de dano da arma, modificadores
- **Processamento**: Rolagem de dados de dano, aplicação de modificadores, cálculo de resistências/fraquezas
- **Saída**: Dano final aplicado ao alvo com redução de HP

## RF44 - Sistema de Morte e Ressurreição
**Descrição**: Sistema deve gerenciar morte de personagens e tentativas de ressurreição.
- **Entrada**: Personagem com HP ≤ 0, turno do personagem morto
- **Processamento**: Dialog de ressurreição com 2d10, verificação de números iguais, controle de tentativas
- **Saída**: Ressurreição bem-sucedida ou falha com contagem de tentativas restantes

## RF45 - Gestão de Estados de Combatente
**Descrição**: Sistema deve controlar estados dos combatentes durante o combate.
- **Entrada**: Ações de combate, resultados de ataques, tentativas de ressurreição
- **Processamento**: Transição entre estados (ALIVE/DEAD/PERMANENTLY_DEAD), validação de ações
- **Saída**: Estado atualizado do combatente com restrições de ação apropriadas

## RF46 - Resolução e Recompensas de Combate
**Descrição**: Sistema deve finalizar combate com distribuição de XP e recuperação.
- **Entrada**: Todos inimigos derrotados ou todos jogadores mortos permanentemente
- **Processamento**: Cálculo de XP baseado em inimigos derrotados, recuperação de HP para sobreviventes
- **Saída**: Dialog de vitória com XP ganho e HP recuperado, ou tela de derrota

## RF47 - Modo Espectador para Mortos Permanentes
**Descrição**: Sistema deve permitir que jogadores mortos permanentemente continuem como espectadores.
- **Entrada**: Personagem com estado PERMANENTLY_DEAD
- **Processamento**: Restrição de ações de combate, manutenção de acesso ao chat
- **Saída**: Interface de espectador com chat habilitado e ações de combate desabilitadas

## RF48 - Upload de Arquivo Mermaid
**Descrição**: Sistema deve permitir upload de arquivos .mmd para criação de histórias.
- **Entrada**: Arquivo Mermaid (.mmd), título, descrição, configurações de visibilidade
- **Processamento**: Upload para diretório temporário, validação do conteúdo Mermaid, parse e criação da história
- **Saída**: História criada a partir do arquivo ou erro de validação

## RF49 - Sistema de Votação com Timeout Automático
**Descrição**: Sistema deve suportar votações com finalização automática por timeout.
- **Entrada**: Pergunta, opções de resposta, tempo limite (1-60 minutos), configurações de empate
- **Processamento**: Controle de timeout automático, contagem regressiva, finalização automática
- **Saída**: Resultado da votação com resolução automática por timeout

## RF50 - Extensão de Timeout de Votação
**Descrição**: Mestres devem poder estender o tempo de votações ativas.
- **Entrada**: ID da sessão, minutos adicionais (1-30), autorização de mestre
- **Processamento**: Atualização do timeout, cancelamento do timeout anterior, criação de novo timeout
- **Saída**: Novo tempo de finalização ou erro de autorização

## RF51 - Resolução Avançada de Empates
**Descrição**: Sistema deve oferecer múltiplas opções para resolver empates em votações.
- **Entrada**: Votação empatada, método de resolução (REVOTE/RANDOM/MASTER_DECIDES)
- **Processamento**:
  - REVOTE: Nova votação apenas com opções empatadas
  - RANDOM: Escolha aleatória entre empates
  - MASTER_DECIDES: Mestre escolhe manualmente
- **Saída**: Empate resolvido com método apropriado ou nova votação iniciada

## RF52 - Sistema de Re-votação Controlada
**Descrição**: Sistema deve permitir re-votações com opções específicas e timeout reduzido.
- **Entrada**: Opções empatadas, tempo de re-votação (1-30 minutos)
- **Processamento**: Criação de nova votação limitada às opções especificadas, timeout automático
- **Saída**: Nova votação ativa ou resultado da re-votação

## RF53 - Monitoramento de Status de Votação
**Descrição**: Sistema deve fornecer informações detalhadas sobre votações em andamento.
- **Entrada**: ID da sessão, autorização de participante
- **Processamento**: Verificação de votação ativa, cálculo de tempo restante, status de participação
- **Saída**: Informações de timeout, tempo restante, configurações de empate

---

[← Anterior: Descrição Geral](./02-descricao-geral.md) | [Voltar ao Menu](./README.md) | [Próximo: Requisitos Não Funcionais →](./04-requisitos-nao-funcionais.md)
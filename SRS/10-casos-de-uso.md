# 10. Casos de Uso

## UC01 - Cadastro de Novo Usuário
**Ator**: Usuário não registrado
**Pré-condições**: Sistema em funcionamento
**Fluxo**:
1. Usuário acessa tela de cadastro
2. Usuário informa nome de usuário, senha e confirmação
3. Sistema valida unicidade do usuário
4. Sistema valida força da senha e confirmação
5. Sistema cria conta com hash da senha
6. Sistema retorna confirmação de cadastro

## UC02 - Login de Usuário
**Ator**: Usuário registrado
**Pré-condições**: Usuário possui conta no sistema
**Fluxo**:
1. Usuário informa credenciais (usuário e senha)
2. Sistema valida credenciais
3. Sistema gera token JWT
4. Sistema retorna token e dados do usuário

## UC03 - Criar Personagem
**Ator**: Usuário autenticado
**Pré-condições**: Usuário logado
**Fluxo**:
1. Usuário acessa criação de personagem
2. Usuário informa nome e descrição do personagem
3. Sistema valida dados do personagem
4. Sistema salva personagem vinculado ao usuário
5. Sistema retorna dados do personagem criado

## UC04 - Iniciar Nova Sessão
**Ator**: Usuário autenticado
**Pré-condições**: Sistema em funcionamento, histórias carregadas, usuário logado
**Fluxo**:
1. Usuário seleciona "Criar Sessão"
2. Sistema exibe histórias disponíveis
3. Usuário seleciona história e define nome da sessão
4. Sistema cria sessão e retorna ID
5. Usuário pode convidar outros jogadores

## UC05 - Entrar em Sessão com Personagem
**Ator**: Usuário autenticado
**Pré-condições**: Usuário possui personagem, sessão existe
**Fluxo**:
1. Usuário seleciona sessão disponível
2. Sistema exibe personagens do usuário
3. Usuário seleciona personagem para usar na sessão
4. Sistema adiciona personagem à sessão
5. Sistema retorna estado atual da história

## UC06 - Participar de Votação
**Ator**: Usuário com personagem em sessão ativa
**Pré-condições**: Personagem em sessão ativa, capítulo com opções
**Fluxo**:
1. Sistema exibe capítulo atual e opções
2. Jogadores discutem no chat
3. Usuário seleciona uma opção via seu personagem
4. Sistema registra voto
5. Quando todos votaram, sistema calcula resultado
6. Sistema avança para próximo capítulo

## UC07 - Usar Chat da Sessão
**Ator**: Usuário com personagem em sessão ativa
**Pré-condições**: Personagem em sessão ativa
**Fluxo**:
1. Usuário digita mensagem
2. Sistema valida e sanitiza mensagem
3. Sistema armazena mensagem no Message Store
4. Outros jogadores consultam novas mensagens via polling RPC
5. Mensagem é exibida no chat quando detectada via polling

## UC08 - Import de História Mermaid (Admin)
**Ator**: Administrador
**Pré-condições**: Usuário com role ADMIN
**Fluxo**:
1. Admin acessa painel de histórias
2. Admin cola código Mermaid ou faz upload de arquivo
3. Sistema faz parse do código Mermaid
4. Sistema valida estrutura da história
5. Sistema converte para formato interno
6. Sistema salva história para uso nas sessões

## UC09 - Gerenciar Usuários (Admin)
**Ator**: Administrador
**Pré-condições**: Usuário com role ADMIN
**Fluxo**:
1. Admin acessa painel administrativo
2. Sistema exibe lista de usuários
3. Admin pode visualizar detalhes ou excluir usuários
4. Ao excluir usuário, sistema remove sessões e personagens
5. Sistema confirma ação realizada

## UC10 - Excluir Sessão Própria
**Ator**: Usuário autenticado (criador da sessão)
**Pré-condições**: Usuário é dono da sessão
**Fluxo**:
1. Usuário acessa suas sessões
2. Usuário seleciona sessão para excluir
3. Sistema valida propriedade da sessão
4. Sistema remove personagens vinculados (cascade)
5. Sistema remove a sessão
6. Sistema confirma exclusão

## UC11 - Acessar Dashboard Adaptativo
**Ator**: Usuário autenticado
**Pré-condições**: Usuário logado no sistema
**Fluxo**:
1. Usuário faz login no sistema
2. Sistema verifica sessões existentes do usuário
3. Se usuário tem sessões: Sistema exibe cards com metadados das sessões
4. Se usuário não tem sessões: Sistema exibe tela de boas-vindas
5. Sistema sempre exibe botões para "Criar Sessão" e "Entrar em Sessão"
6. Usuário pode navegar para criação ou entrada em sessões

## UC12 - Visualizar Cards de Sessão com Metadados
**Ator**: Usuário autenticado
**Pré-condições**: Usuário possui sessões criadas ou participando
**Fluxo**:
1. Sistema compila metadados de cada sessão do usuário
2. Para cada sessão, sistema exibe:
   - Nome da sessão e história
   - Status atual (Aguardando, Criando personagens, Em progresso, Finalizada)
   - Número de jogadores atual vs máximo
   - Capítulo atual (se em progresso)
   - Tempo desde última atividade
3. Sistema permite acesso direto às sessões via cards
4. Usuário pode clicar no card para entrar na sessão

## UC13 - Entrar em Sessão via Código
**Ator**: Usuário autenticado
**Pré-condições**: Usuário possui código válido de sessão
**Fluxo**:
1. Usuário seleciona "Entrar em Sessão"
2. Sistema solicita código da sessão
3. Usuário insere código alfanumérico
4. Sistema valida formato e existência do código
5. Sistema verifica se sessão permite entrada (estado e vagas)
6. Se válido: Sistema adiciona usuário à sessão
7. Sistema redireciona para estado adequado (sala de espera ou criação de personagem)

**Fluxo Alternativo 5a**: Sessão em progresso
5a.1. Se usuário é participante original: permite reconexão
5a.2. Se usuário não é participante: retorna erro

## UC14 - Criar Personagem D&D Detalhado
**Ator**: Usuário autenticado em sessão
**Pré-condições**: Usuário está em sessão, estado permite criação de personagens
**Fluxo**:
1. Sistema exibe opções de criação (raças, classes, atributos)
2. Usuário seleciona raça e classe
3. Usuário define atributos (Força, Destreza, Constituição, Inteligência, Sabedoria, Carisma)
4. Usuário preenche história pessoal:
   - Nome do personagem
   - Background detalhado
   - Aparência física
   - Personalidade
   - Medos
   - Objetivos
5. Usuário seleciona equipamentos iniciais
6. Sistema valida completude e consistência dos dados
7. Sistema salva personagem completo
8. Sistema notifica outros jogadores sobre criação

## UC15 - Navegar Catálogo de Histórias
**Ator**: Usuário autenticado
**Pré-condições**: Usuário quer criar nova sessão
**Fluxo**:
1. Usuário seleciona "Criar Nova Sessão"
2. Sistema exibe catálogo de histórias com metadados:
   - Título e sinopse
   - Gênero (Aventura, Mistério, Fantasia, etc.)
   - Número recomendado de jogadores (min/max/ideal)
   - Duração estimada
   - Nível de dificuldade
   - Tags descritivas
3. Usuário navega e filtra histórias por critérios
4. Usuário seleciona história desejada
5. Sistema prossegue para criação da sessão

## UC16 - Gerenciar Sala de Espera
**Ator**: Usuário autenticado (owner da sessão)
**Pré-condições**: Sessão criada, aguardando jogadores
**Fluxo**:
1. Sistema exibe sala de espera com:
   - Código da sessão para compartilhar
   - Lista de participantes atuais
   - Status de criação de personagens de cada jogador
   - Informações da história selecionada
2. Outros jogadores entram via código
3. Sistema atualiza lista em tempo real (via polling)
4. Quando jogadores entram, são direcionados para criação de personagens
5. Sistema monitora progresso de criação de personagens
6. Quando todos criaram personagens: habilita botão "Iniciar Sessão"
7. Owner pode iniciar sessão quando todos estão prontos

## UC17 - Validar Requisitos para Início de Sessão
**Ator**: Sistema (processo automático)
**Pré-condições**: Sessão em estado de criação de personagens
**Fluxo**:
1. Sistema monitora continuamente status dos participantes
2. Para cada participante, verifica:
   - Presença na sessão
   - Personagem criado e completo
   - Dados validados
3. Sistema calcula se requisitos mínimos foram atendidos:
   - Número mínimo de jogadores atingido
   - Todos os jogadores criaram personagens
   - Todos os personagens passaram na validação
4. Se todos requisitos atendidos: sistema habilita início da sessão
5. Sistema notifica owner sobre possibilidade de iniciar

## UC18 - Iniciar Sessão de Jogo
**Ator**: Usuário autenticado (owner da sessão)
**Pré-condições**: Todos requisitos atendidos, sessão pronta para início
**Fluxo**:
1. Owner clica em "Iniciar Sessão"
2. Sistema valida propriedade e requisitos finais
3. Sistema muda estado da sessão para "EM_PROGRESSO"
4. Sistema bloqueia entrada de novos jogadores
5. Sistema carrega primeiro capítulo da história
6. Sistema notifica todos jogadores sobre início
7. Sistema redireciona todos para tela de jogo
8. Jogo começa com primeiro capítulo e opções

## UC19 - Reconectar em Sessão em Progresso
**Ator**: Usuário autenticado (participante original)
**Pré-condições**: Usuário perdeu conexão, sessão em progresso
**Fluxo**:
1. Usuário tenta entrar na sessão via código ou dashboard
2. Sistema verifica se usuário é participante original
3. Sistema valida estado atual da sessão
4. Sistema retorna estado atual do jogo:
   - Capítulo atual
   - Opções disponíveis
   - Votos já registrados
   - Mensagens de chat recentes
5. Usuário reconecta e continua jogando normalmente

## UC20 - Gerenciar Transições de Estado
**Ator**: Sistema (processo automático)
**Pré-condições**: Sessão existe e tem atividade
**Fluxo**:
1. Sistema monitora ações dos usuários continuamente
2. Sistema identifica eventos que podem causar mudança de estado:
   - Jogador entra na sessão (WAITING_PLAYERS)
   - Todos jogadores entraram (→ CREATING_CHARACTERS)
   - Jogador cria personagem (CREATING_CHARACTERS)
   - Todos personagens criados (→ pode iniciar)
   - Owner inicia sessão (→ IN_PROGRESS)
   - História chega ao fim (→ COMPLETED)
3. Sistema valida se transição é permitida
4. Sistema atualiza estado da sessão
5. Sistema notifica todos participantes sobre mudança
6. Sistema ajusta interface conforme novo estado

## UC21 - Acessar Dashboard Administrativo
**Ator**: Administrador
**Pré-condições**: Usuário com role ADMIN logado
**Fluxo**:
1. Admin faz login no sistema
2. Sistema verifica role do usuário
3. Sistema retorna dashboard padrão + botão "Gerenciamento"
4. Dashboard exibe as mesmas funcionalidades de usuário comum
5. Botão adicional "Gerenciamento" fica visível para admin
6. Admin pode navegar normalmente ou acessar painel administrativo

## UC22 - Gerenciar Painel de Controle de Usuários
**Ator**: Administrador
**Pré-condições**: Admin logado, acesso ao painel de gerenciamento
**Fluxo**:
1. Admin clica no botão "Gerenciamento" do dashboard
2. Sistema exibe painel de controle com lista de usuários
3. Para cada usuário, sistema mostra:
   - Nome de usuário e role
   - Estatísticas (sessões criadas, personagens, atividade)
   - Botões "Visualizar" e "Apagar"
4. Admin pode navegar pela lista de usuários
5. Admin pode selecionar ações específicas para cada usuário

## UC23 - Visualizar e Gerenciar Sessões de Usuário (Admin)
**Ator**: Administrador
**Pré-condições**: Admin no painel de controle
**Fluxo**:
1. Admin clica em "Visualizar" para um usuário específico
2. Sistema busca todas as sessões criadas pelo usuário
3. Sistema exibe lista de sessões com:
   - Nome da sessão e história utilizada
   - Status atual e número de participantes
   - Datas de criação e última atividade
   - Botões "Ver Detalhes" e "Apagar Sessão"
4. Admin pode visualizar detalhes completos de qualquer sessão
5. Admin pode excluir sessões específicas com confirmação

**Fluxo Alternativo 4a**: Ver detalhes de sessão
4a.1. Admin clica em "Ver Detalhes" de uma sessão
4a.2. Sistema abre dialog com informações completas:
   - Metadados da sessão (nome, história, estado)
   - Lista de participantes e seus personagens
   - Progresso atual (capítulo, votos)
   - Histórico de atividades
4a.3. Admin pode fechar dialog e retornar à lista

## UC24 - Excluir Usuário com Confirmação e Cascade
**Ator**: Administrador
**Pré-condições**: Admin no painel de controle
**Fluxo**:
1. Admin clica em "Apagar" para um usuário
2. Sistema calcula impacto da exclusão:
   - Número de sessões que serão excluídas
   - Número de personagens que serão removidos
3. Sistema exibe dialog de confirmação:
   "Tem certeza que deseja apagar o usuário [nome]?
   Isso excluirá [X] sessões e [Y] personagens."
4. Admin confirma ou cancela a operação
5. Se confirmado: Sistema executa exclusão em cascade
6. Sistema remove usuário, suas sessões e personagens
7. Sistema atualiza lista de usuários no painel

**Fluxo Alternativo 5a**: Exclusão de sessão específica
5a.1. Admin clica em "Apagar Sessão" em vez de usuário
5a.2. Sistema exibe dialog específico:
   "Tem certeza que deseja apagar a sessão [nome]?
   Isso removerá [X] participantes da sessão."
5a.3. Se confirmado: Sistema exclui apenas a sessão
5a.4. Personagens dos participantes não são excluídos

## UC25 - Acessar Tela de Jogo com Interface Completa
**Ator**: Jogador participante da sessão
**Pré-condições**: Sessão em estado IN_PROGRESS, jogador com personagem criado
**Fluxo**:
1. Jogador acessa sessão em andamento
2. Sistema carrega estado completo da tela de jogo:
   - Timeline central com narrativa atual
   - Lista de jogadores em tiles (lateral direita)
   - Chat integrado (lateral inferior/direita)
   - Interface de votação (quando aplicável)
3. Timeline exibe capítulo atual da história
4. Sistema exibe opções disponíveis para votação
5. Jogador pode ver status de outros participantes
6. Interface fica pronta para interação

## UC26 - Visualizar Timeline da Narrativa
**Ator**: Jogador participante da sessão
**Pré-condições**: Sessão em andamento, tela de jogo carregada
**Fluxo**:
1. Sistema exibe timeline central com:
   - Texto do capítulo atual
   - Histórico de capítulos anteriores (rolagem)
   - Resultados de votações passadas
   - Mensagens do sistema (mudanças de capítulo)
2. Jogador pode rolar para ver histórico
3. Timeline é atualizada automaticamente quando história avança
4. Sistema marca visualmente as escolhas feitas pelo grupo

## UC27 - Participar de Sistema de Votação Temporizada
**Ator**: Jogador participante da sessão
**Pré-condições**: Capítulo com opções de escolha apresentado
**Fluxo**:
1. Sistema apresenta opções de escolha na timeline
2. Jogador seleciona uma das opções disponíveis
3. Sistema registra voto e inicia timer (se for primeiro voto)
4. Progressbar aparece mostrando tempo restante
5. Sistema atualiza contadores de votos em tempo real
6. Quando todos votam OU timer expira:
   - Sistema calcula opção vencedora (maioria)
   - Sistema avança automaticamente para próximo capítulo
   - Timeline é atualizada com resultado

**Fluxo Alternativo 6a**: Timeout sem todos os votos
6a.1. Timer expira antes de todos votarem
6a.2. Sistema conta votos existentes
6a.3. Opção com maioria relativa vence
6a.4. Sistema prossegue com próximo capítulo

## UC28 - Visualizar Status e Fichas dos Jogadores
**Ator**: Jogador participante da sessão
**Pré-condições**: Sessão em andamento, múltiplos jogadores
**Fluxo**:
1. Sistema exibe tiles de jogadores com:
   - Nome do personagem
   - Mini-descrição (raça, classe)
   - Status de conexão (online/offline)
   - Indicador se já votou
   - Botão "Visualizar"
2. Jogador clica em "Visualizar" de outro personagem
3. Sistema abre dialog com ficha completa:
   - Atributos D&D (Força, Destreza, etc.)
   - História pessoal detalhada
   - Aparência e personalidade
   - Medos e objetivos
   - Equipamentos
   - Estatísticas de jogo
4. Jogador pode fechar dialog e visualizar outros

## UC29 - Usar Chat Integrado Durante o Jogo
**Ator**: Jogador participante da sessão
**Pré-condições**: Sessão em andamento, chat habilitado
**Fluxo**:
1. Jogador acessa área de chat na interface
2. Sistema exibe mensagens recentes da sessão
3. Jogador digita mensagem
4. Sistema valida e envia mensagem via RPC
5. Outros jogadores recebem mensagem via polling
6. Chat é atualizado em tempo real para coordenação
7. Sistema pode inserir mensagens automáticas (votos, mudanças)

## UC30 - Monitorar Status de Conexão dos Participantes
**Ator**: Sistema (processo automático)
**Pré-condições**: Sessão em andamento, múltiplos participantes
**Fluxo**:
1. Sistema monitora atividade de cada jogador continuamente
2. Cada cliente envia heartbeat periódico via RPC
3. Sistema registra última atividade de cada participante
4. Sistema calcula status online/offline baseado em atividade
5. Sistema atualiza tiles dos jogadores com status atual
6. Outros jogadores veem indicadores visuais de conectividade
7. Sistema pode pausar votação se muitos jogadores offline

## UC31 - Iniciar Combate via Node Fight
**Ator**: Sistema (processo automático)
**Pré-condições**: História alcança capítulo com flag "fight"
**Fluxo**:
1. Sistema detecta que capítulo atual possui propriedade "fight"
2. Sistema inicializa estado de combate para a sessão
3. Sistema carrega dados dos inimigos do capítulo
4. Sistema prepara participantes para combate (HP, atributos, equipamentos)
5. Sistema muda fase da sessão para "COMBAT_INITIATIVE"
6. Sistema notifica todos jogadores sobre início do combate
7. Interface de combate é carregada para todos os participantes

## UC32 - Participar de Rolagem de Iniciativa
**Ator**: Jogador participante da sessão
**Pré-condições**: Combate iniciado, fase de iniciativa ativa
**Fluxo**:
1. Sistema exibe dialog de iniciativa com timer
2. Jogador clica em "Rolar Dados" ou aguarda timer
3. Sistema executa animação de rolagem D20
4. Sistema calcula resultado: D20 + modificador de destreza
5. Sistema registra iniciativa do jogador
6. Sistema atualiza lista de ordem de iniciativa
7. Quando todos rolaram: sistema define ordem final de combate

**Fluxo Alternativo 2a**: Timer expira
2a.1. Sistema rola automaticamente pelos jogadores que não rolaram
2a.2. Sistema usa modificadores dos personagens automaticamente
2a.3. Sistema procede com cálculo da ordem

## UC33 - Executar Turno de Ataque
**Ator**: Jogador participante (em seu turno)
**Pré-condições**: Turno do jogador na ordem de iniciativa
**Fluxo**:
1. Sistema notifica que é turno do jogador
2. Sistema exibe dialog de seleção de alvo com timer
3. Jogador seleciona inimigo para atacar ou aguarda timer
4. Sistema executa rolagem de ataque D20 vs CA do alvo
5. Sistema determina resultado (miss/hit/crítico/falha crítica)
6. Se acertou: sistema rola dados de dano
7. Sistema aplica dano ao alvo considerando resistências
8. Sistema verifica se alvo morreu
9. Sistema passa para próximo turno

**Fluxo Alternativo 3a**: Timer expira
3a.1. Sistema seleciona alvo aleatório automaticamente
3a.2. Sistema executa ataque automaticamente

**Fluxo Alternativo 5a**: Crítico (D20 = 20)
5a.1. Sistema dobra dados de dano
5a.2. Sistema aplica dano crítico ao alvo

**Fluxo Alternativo 5b**: Falha crítica (D20 = 1)
5b.1. Sistema aplica dano ao próprio atacante
5b.2. Sistema registra falha crítica nas estatísticas

## UC34 - Processar Turno de Inimigo
**Ator**: Sistema (processo automático)
**Pré-condições**: Turno de inimigo na ordem de iniciativa
**Fluxo**:
1. Sistema identifica que é turno do inimigo
2. Sistema aplica IA para escolher alvo baseado no padrão (RANDOM/WEAKEST/etc)
3. Sistema executa ataque automático contra alvo escolhido
4. Sistema rola D20 + bônus de ataque vs CA do alvo
5. Sistema calcula e aplica dano se necessário
6. Sistema verifica se jogador alvo morreu
7. Sistema notifica todos jogadores sobre ação do inimigo
8. Sistema avança para próximo turno

## UC35 - Tentar Ressurreição com 2d10
**Ator**: Jogador com personagem morto
**Pré-condições**: Personagem morto (HP ≤ 0), turno do personagem
**Fluxo**:
1. Sistema detecta turno de personagem morto
2. Sistema exibe dialog de ressurreição com timer
3. Jogador clica "Rolar Dados" ou aguarda timer
4. Sistema executa animação de 2d10
5. Sistema verifica se os dois dados têm valores iguais
6. Se iguais: personagem ressuscita com HP parcial
7. Se diferentes: tentativa falha, contador é decrementado
8. Sistema atualiza estado do personagem

**Fluxo Alternativo 6a**: Ressurreição bem-sucedida
6a.1. Sistema restaura personagem ao estado ALIVE
6a.2. Sistema concede HP baseado em porcentagem do máximo
6a.3. Sistema notifica todos sobre ressurreição

**Fluxo Alternativo 7a**: Três tentativas falharam
7a.1. Sistema marca personagem como PERMANENTLY_DEAD
7a.2. Sistema redireciona jogador para modo espectador
7a.3. Personagem não pode mais agir, apenas assistir

## UC36 - Gerenciar Estados de Combatente
**Ator**: Sistema (processo automático)
**Pré-condições**: Combate ativo, ações sendo executadas
**Fluxo**:
1. Sistema monitora HP de todos os combatentes
2. Quando HP ≤ 0: sistema muda estado para DEAD
3. Sistema valida ações baseadas no estado atual
4. ALIVE: pode atacar, usar habilidades
5. DEAD: apenas tentativas de ressurreição
6. PERMANENTLY_DEAD: apenas modo espectador
7. Sistema atualiza interface baseada no estado
8. Sistema previne ações inválidas para cada estado

## UC37 - Finalizar Combate com Recompensas
**Ator**: Sistema (processo automático)
**Pré-condições**: Todos inimigos mortos OU todos jogadores mortos permanentemente
**Fluxo**:
1. Sistema detecta condição de fim de combate
2. Sistema calcula experiência baseada em inimigos derrotados
3. Sistema determina recompensas (ouro, itens)
4. Sistema recupera HP dos sobreviventes
5. Sistema compila estatísticas de combate
6. Sistema exibe dialog de vitória/derrota
7. Sistema aplica recompensas aos personagens sobreviventes
8. Sistema retorna ao jogo normal

**Fluxo Alternativo - Vitória**:
- Dialog mostra XP ganho, itens encontrados, HP recuperado
- Estatísticas pessoais de cada jogador sobrevivente

**Fluxo Alternativo - Derrota**:
- Todos jogadores mortos permanentemente
- Exibe estatísticas da tentativa
- Opções de continuar como espectador ou sair

## UC38 - Operar Modo Espectador para Mortos Permanentes
**Ator**: Jogador com personagem morto permanentemente
**Pré-condições**: Personagem com estado PERMANENTLY_DEAD
**Fluxo**:
1. Sistema redireciona jogador para interface de espectador
2. Sistema remove opções de ação de combate
3. Jogador mantém acesso ao chat para comunicação
4. Jogador pode visualizar todas as ações do combate
5. Sistema exibe estatísticas do combate em tempo real
6. Jogador recebe notificações de eventos importantes
7. Ao final do combate: jogador vê resultados finais
8. Sistema oferece opção de sair da sessão ou continuar assistindo

---

[← Anterior: Estrutura de Arquivos](./09-estrutura-arquivos.md) | [Voltar ao Menu](./README.md) | [Próximo: Tratamento de Erros →](./11-tratamento-erros.md)
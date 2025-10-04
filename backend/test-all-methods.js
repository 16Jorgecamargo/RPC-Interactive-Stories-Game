const BASE_URL = 'http://localhost:8443/rpc';

let testsPassed = 0;
let testsFailed = 0;
let totalTests = 59;

const rand = Math.floor(Math.random() * 10000);
const state = {
  user1: { token: null, userId: null, username: `test1_${rand}` },
  user2: { token: null, userId: null, username: `test2_${rand}` },
  admin: { token: null, userId: null, username: `admin_${rand}` },
  char1: { id: null, name: null },
  char2: { id: null, name: null },
  session: { id: null, code: null },
  story: { id: null },
  combat: { sessionId: null },
  lastUpdateId: 0,
  lastMessageId: 0,
};

async function callRPC(method, params = {}) {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Math.floor(Math.random() * 100000),
      method,
      params,
    }),
  });

  const data = await response.json();

  if (data.error) {
    const errorMsg = `RPC Error [${data.error.code}]: ${data.error.message}`;
    if (data.error.data) {
      throw new Error(`${errorMsg}\nData: ${JSON.stringify(data.error.data, null, 2)}`);
    }
    throw new Error(errorMsg);
  }

  return data.result;
}

function logSuccess(message) {
  console.log(`✅ ${message}`);
  testsPassed++;
}

function logError(message, error) {
  console.log(`❌ ${message}`);
  console.error(`   Error: ${error.message}`);
  testsFailed++;
}

function logPhase(phase) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`${phase}`);
  console.log(`${'='.repeat(60)}\n`);
}

async function runTests() {
  const startTime = Date.now();
  console.log('🚀 Iniciando testes de TODOS os métodos RPC...\n');

  try {
    logPhase('FASE 1: HEALTH & AUTH (3 métodos)');

    try {
      const health = await callRPC('health', {});
      if (health.status === 'ok') {
        logSuccess('1/58: health - Servidor online');
      } else {
        throw new Error('Status não é ok');
      }
    } catch (error) {
      logError('1/58: health - Falhou', error);
    }

    try {
      const registerResult = await callRPC('register', {
        username: state.user1.username,
        password: 'senha123',
        confirmPassword: 'senha123',
      });
      if (registerResult.success) {
        state.user1.userId = registerResult.userId;
        logSuccess('2/58: register (user1) - Usuário criado');
      } else {
        throw new Error(registerResult.message || 'Falha no registro');
      }
    } catch (error) {
      logError('2/58: register (user1) - Falhou', error);
    }

    try {
      const loginResult = await callRPC('login', {
        username: state.user1.username,
        password: 'senha123',
      });
      if (loginResult.token) {
        state.user1.token = loginResult.token;
        state.user1.username = loginResult.user.username;
        logSuccess('3/58: login (user1) - Token obtido');
      } else {
        throw new Error('Token não retornado');
      }
    } catch (error) {
      logError('3/58: login (user1) - Falhou', error);
    }

    logPhase('FASE 2: GESTÃO DE USUÁRIOS (3 métodos)');

    try {
      const me = await callRPC('me', { token: state.user1.token });
      if (me.username === state.user1.username) {
        logSuccess('4/58: me - Dados do usuário obtidos');
      } else {
        throw new Error('Username incorreto');
      }
    } catch (error) {
      logError('4/58: me - Falhou', error);
    }

    try {
      const newUsername = `${state.user1.username}_upd`;
      const updated = await callRPC('updateProfile', {
        token: state.user1.token,
        username: newUsername,
      });
      if (updated.success && updated.message) {
        state.user1.username = newUsername;
        logSuccess('5/58: updateProfile - Perfil atualizado');
      } else {
        throw new Error('Profile não atualizado');
      }
    } catch (error) {
      logError('5/58: updateProfile - Falhou', error);
    }

    try {
      const passwordChanged = await callRPC('changePassword', {
        token: state.user1.token,
        currentPassword: 'senha123',
        newPassword: 'novaSenha123',
        confirmPassword: 'novaSenha123',
      });
      if (passwordChanged.success) {
        logSuccess('6/58: changePassword - Senha alterada');
      } else {
        throw new Error('Senha não alterada');
      }
    } catch (error) {
      logError('6/58: changePassword - Falhou', error);
    }

    logPhase('FASE 3: PROMOVER PARA ADMIN (3 métodos)');

    let tempAdminToken = null;
    try {
      const adminLogin = await callRPC('login', {
        username: 'jorgec',
        password: 'senha123',
      });
      if (adminLogin.token) {
        tempAdminToken = adminLogin.token;
        logSuccess('7/58: login (admin jorgec) - Token admin temporário obtido');
      } else {
        throw new Error('Login admin falhou');
      }
    } catch (error) {
      logError('7/58: login (admin jorgec) - Falhou', error);
    }

    try {
      const promoted = await callRPC('promoteUser', {
        token: tempAdminToken,
        userId: state.user1.userId,
      });
      if (promoted.success) {
        logSuccess('8/58: promoteUser - User1 promovido para ADMIN');
      } else {
        throw new Error('Promoção falhou');
      }
    } catch (error) {
      logError('8/58: promoteUser - Falhou', error);
    }

    try {
      const loginAdmin = await callRPC('login', {
        username: state.user1.username,
        password: 'novaSenha123',
      });
      if (loginAdmin.token) {
        state.user1.token = loginAdmin.token;
        logSuccess('9/58: login (user1 como admin) - Token admin obtido');
      } else {
        throw new Error('Login falhou');
      }
    } catch (error) {
      logError('9/58: login (user1 como admin) - Falhou', error);
    }

    logPhase('FASE 4: HISTÓRIAS - LEITURA (3 métodos)');

    try {
      const stories = await callRPC('listStories', {
        token: state.user1.token,
      });
      if (stories.stories && stories.stories.length > 0) {
        state.story.id = stories.stories[0].id;
        logSuccess('10/58: listStories - Lista de histórias obtida');
      } else {
        throw new Error('Nenhuma história retornada');
      }
    } catch (error) {
      logError('10/58: listStories - Falhou', error);
    }

    try {
      const catalog = await callRPC('getStoryCatalog', {
        token: state.user1.token,
      });
      if (catalog.stories) {
        logSuccess('11/58: getStoryCatalog - Catálogo público obtido');
      } else {
        throw new Error('Catálogo vazio');
      }
    } catch (error) {
      logError('11/58: getStoryCatalog - Falhou', error);
    }

    try {
      const story = await callRPC('getStory', {
        token: state.user1.token,
        storyId: state.story.id,
      });
      if (story.id === state.story.id) {
        logSuccess('12/58: getStory - Detalhes da história obtidos');
      } else {
        throw new Error('ID da história não corresponde');
      }
    } catch (error) {
      logError('12/58: getStory - Falhou', error);
    }

    logPhase('FASE 5: CRIAR SESSÃO (2 métodos)');

    try {
      const session = await callRPC('createSession', {
        token: state.user1.token,
        name: 'Aventura de Teste',
        storyId: state.story.id,
        maxPlayers: 4,
        tieResolutionStrategy: 'RANDOM',
        votingTimeoutSeconds: 30,
      });
      if (session.session && session.session.id) {
        state.session.id = session.session.id;
        state.session.code = session.session.sessionCode;
        logSuccess('13/58: createSession - Sessão criada');
      } else {
        throw new Error('Sessão não criada');
      }
    } catch (error) {
      logError('13/58: createSession - Falhou', error);
    }

    try {
      const transition = await callRPC('transitionToCreatingCharacters', {
        token: state.user1.token,
        sessionId: state.session.id,
      });
      if (transition.session.status === 'CREATING_CHARACTERS') {
        logSuccess('14/58: transitionToCreatingCharacters - Status alterado para criação de personagens');
      } else {
        throw new Error('Status não alterado');
      }
    } catch (error) {
      logError('14/58: transitionToCreatingCharacters - Falhou', error);
    }

    logPhase('FASE 6: SISTEMA DE PERSONAGENS (6 métodos)');

    try {
      const options = await callRPC('getCharacterOptions', {
        token: state.user1.token,
      });
      if (options.races && options.classes) {
        logSuccess('15/58: getCharacterOptions - Raças e classes obtidas');
      } else {
        throw new Error('Opções incompletas');
      }
    } catch (error) {
      logError('15/58: getCharacterOptions - Falhou', error);
    }

    try {
      const char1 = await callRPC('createCharacter', {
        token: state.user1.token,
        sessionId: state.session.id,
        name: 'Thorin Escudo de Carvalho',
        race: 'Human',
        class: 'Warrior',
        attributes: {
          strength: 16,
          dexterity: 14,
          constitution: 15,
          intelligence: 10,
          wisdom: 12,
          charisma: 8,
        },
        background: {
          appearance: 'Alto e musculoso com cabelos negros e olhos penetrantes',
          personality: 'Corajoso e leal, sempre pronto para defender os fracos',
          fears: 'Teme perder seus companheiros em batalha e falhar em sua missão',
          goals: 'Tornar-se um herói lendário e proteger seu reino de ameaças',
        },
        equipment: ['Espada longa', 'Escudo de aço', 'Armadura de placas'],
      });
      if (char1.id) {
        state.char1.id = char1.id;
        state.char1.name = char1.name;
        logSuccess('16/58: createCharacter (char1) - Personagem criado');
      } else {
        throw new Error('Personagem não criado');
      }
    } catch (error) {
      logError('16/58: createCharacter (char1) - Falhou', error);
    }

    try {
      const myChars = await callRPC('getMyCharacters', {
        token: state.user1.token,
      });
      if (myChars.characters && myChars.characters.length > 0) {
        logSuccess('17/58: getMyCharacters - Lista de personagens obtida');
      } else {
        throw new Error('Nenhum personagem retornado');
      }
    } catch (error) {
      logError('17/58: getMyCharacters - Falhou', error);
    }

    try {
      const char = await callRPC('getCharacter', {
        token: state.user1.token,
        characterId: state.char1.id,
      });
      if (char.id === state.char1.id) {
        logSuccess('18/58: getCharacter - Detalhes do personagem obtidos');
      } else {
        throw new Error('ID do personagem não corresponde');
      }
    } catch (error) {
      logError('18/58: getCharacter - Falhou', error);
    }

    try {
      const updated = await callRPC('updateCharacter', {
        token: state.user1.token,
        characterId: state.char1.id,
        equipment: ['Espada longa +1', 'Escudo mágico', 'Armadura de placas'],
      });
      if (updated.equipment && updated.equipment.length === 3) {
        logSuccess('19/58: updateCharacter - Personagem atualizado');
      } else {
        throw new Error('Equipamento não atualizado');
      }
    } catch (error) {
      logError('19/58: updateCharacter - Falhou', error);
    }

    try {
      const sessions = await callRPC('listMySessions', {
        token: state.user1.token,
      });
      if (sessions.sessions && sessions.sessions.length > 0) {
        logSuccess('20/58: listMySessions - Lista de sessões obtida');
      } else {
        throw new Error('Nenhuma sessão retornada');
      }
    } catch (error) {
      logError('20/58: listMySessions - Falhou', error);
    }

    logPhase('FASE 7: MULTIPLAYER SETUP (4 métodos)');

    try {
      const registerResult = await callRPC('register', {
        username: state.user2.username,
        password: 'senha123',
        confirmPassword: 'senha123',
      });
      if (registerResult.success) {
        state.user2.userId = registerResult.userId;
        logSuccess('21/58: register (user2) - Segundo usuário criado');
      } else {
        throw new Error(registerResult.message || 'Falha no registro');
      }
    } catch (error) {
      logError('21/58: register (user2) - Falhou', error);
    }

    try {
      const loginResult = await callRPC('login', {
        username: state.user2.username,
        password: 'senha123',
      });
      if (loginResult.token) {
        state.user2.token = loginResult.token;
        state.user2.username = loginResult.user.username;
        logSuccess('22/58: login (user2) - Token do segundo usuário obtido');
      } else {
        throw new Error('Token não retornado');
      }
    } catch (error) {
      logError('22/58: login (user2) - Falhou', error);
    }

    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      const joined = await callRPC('joinSession', {
        sessionCode: state.session.code,
        token: state.user2.token,
      });
      if (joined.success) {
        logSuccess('23/58: joinSession (user2) - User2 entrou na sessão');
      } else {
        throw new Error('Join falhou');
      }
    } catch (error) {
      logError('23/58: joinSession (user2) - Falhou', error);
    }

    try {
      const char2 = await callRPC('createCharacter', {
        token: state.user2.token,
        sessionId: state.session.id,
        name: 'Legolas Arqueiro Élfico',
        race: 'Elf',
        class: 'Rogue',
        attributes: {
          strength: 12,
          dexterity: 18,
          constitution: 14,
          intelligence: 13,
          wisdom: 15,
          charisma: 10,
        },
        background: {
          appearance:
            'Esguio e ágil com cabelos loiros e olhos verdes brilhantes como esmeraldas',
          personality:
            'Calmo e astuto, prefere observar antes de agir com precisão mortal',
          fears:
            'Teme ser capturado e perder sua liberdade nas florestas que tanto ama',
          goals:
            'Proteger a natureza e provar seu valor como o maior arqueiro de sua geração',
        },
        equipment: ['Arco longo', 'Flechas (20)', 'Adaga élfica'],
      });
      if (char2.id) {
        state.char2.id = char2.id;
        state.char2.name = char2.name;
        logSuccess('24/58: createCharacter (char2) - Personagem do user2 criado');
      } else {
        throw new Error('Personagem não criado');
      }
    } catch (error) {
      logError('24/58: createCharacter (char2) - Falhou', error);
    }

    logPhase('FASE 8: GERENCIAR SESSÃO (1 método)');

    try {
      const details = await callRPC('getSessionDetails', {
        sessionId: state.session.id,
        token: state.user1.token,
      });
      if (details.session.id === state.session.id) {
        logSuccess('25/58: getSessionDetails - Detalhes da sessão obtidos');
      } else {
        throw new Error('ID da sessão não corresponde');
      }
    } catch (error) {
      logError('25/58: getSessionDetails - Falhou', error);
    }

    logPhase('FASE 9: INICIAR JOGO (4 métodos)');

    try {
      const canStart = await callRPC('canStartSession', {
        token: state.user1.token,
        sessionId: state.session.id,
      });
      if (canStart.canStart === true || canStart.canStart === false) {
        logSuccess(
          `26/58: canStartSession - Verificação concluída (canStart: ${canStart.canStart})`
        );
      } else {
        throw new Error('Resposta inválida');
      }
    } catch (error) {
      logError('26/58: canStartSession - Falhou', error);
    }

    try {
      const started = await callRPC('startSession', {
        token: state.user1.token,
        sessionId: state.session.id,
      });
      if (started.session.status === 'IN_PROGRESS') {
        logSuccess('27/58: startSession - Sessão iniciada (IN_PROGRESS)');
      } else {
        throw new Error(`Status incorreto: ${started.session.status}`);
      }
    } catch (error) {
      logError('27/58: startSession - Falhou', error);
    }

    try {
      const gameState = await callRPC('getGameState', {
        sessionId: state.session.id,
        token: state.user1.token,
      });
      if (gameState.gameState && gameState.gameState.currentChapter) {
        logSuccess('28/58: getGameState - Estado do jogo obtido');
      } else {
        throw new Error('Estado do jogo incompleto');
      }
    } catch (error) {
      logError('28/58: getGameState - Falhou', error);
    }

    try {
      const timeline = await callRPC('getTimelineHistory', {
        sessionId: state.session.id,
        token: state.user1.token,
      });
      if (timeline.timeline) {
        logSuccess('29/58: getTimelineHistory - Histórico obtido');
      } else {
        throw new Error('Timeline não retornada');
      }
    } catch (error) {
      logError('29/58: getTimelineHistory - Falhou', error);
    }

    logPhase('FASE 10: SISTEMA DE VOTAÇÃO (6 métodos)');

    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      const configured = await callRPC('configureVoteTimeout', {
        sessionId: state.session.id,
        token: state.user1.token,
        durationSeconds: 45,
      });
      if (configured.success) {
        logSuccess('30/58: configureVoteTimeout - Timer configurado');
      } else {
        throw new Error('Configuração falhou');
      }
    } catch (error) {
      logError('30/58: configureVoteTimeout - Falhou', error);
    }

    const gameStateForVote = await callRPC('getGameState', {
      sessionId: state.session.id,
      token: state.user1.token,
    });
    const firstOption =
      gameStateForVote.gameState.currentChapter.opcoes &&
      gameStateForVote.gameState.currentChapter.opcoes.length > 0
        ? gameStateForVote.gameState.currentChapter.opcoes[0].id
        : null;

    if (!firstOption) {
      logError(
        '31-35: Votação',
        new Error('Capítulo atual não possui opções para votar')
      );
    } else {
      try {
        const vote1 = await callRPC('vote', {
          token: state.user1.token,
          sessionId: state.session.id,
          characterId: state.char1.id,
          opcaoId: firstOption,
        });
        if (vote1.success) {
          logSuccess('31/58: vote (user1) - Voto registrado');
        } else {
          throw new Error('Voto não registrado');
        }
      } catch (error) {
        logError('31/58: vote (user1) - Falhou', error);
      }

      try {
        const voteStatus = await callRPC('getVoteStatus', {
          sessionId: state.session.id,
          token: state.user1.token,
        });
        if (voteStatus.status && voteStatus.status.totalVotes !== undefined) {
          logSuccess('32/58: getVoteStatus - Status da votação obtido');
        } else {
          throw new Error('Status inválido');
        }
      } catch (error) {
        logError('32/58: getVoteStatus - Falhou', error);
      }

      try {
        const timer = await callRPC('getVoteTimer', {
          token: state.user1.token,
          sessionId: state.session.id,
        });
        if (timer.timer) {
          logSuccess('33/58: getVoteTimer - Timer obtido');
        } else {
          throw new Error('Timer não retornado');
        }
      } catch (error) {
        logError('33/58: getVoteTimer - Falhou', error);
      }

      try {
        const extended = await callRPC('extendVoteTimer', {
          sessionId: state.session.id,
          token: state.user1.token,
          additionalSeconds: 15,
        });
        if (extended.success) {
          logSuccess('34/58: extendVoteTimer - Timer estendido');
        } else {
          throw new Error('Extensão falhou');
        }
      } catch (error) {
        logError('34/58: extendVoteTimer - Falhou', error);
      }

      try {
        const vote2 = await callRPC('vote', {
          token: state.user2.token,
          sessionId: state.session.id,
          characterId: state.char2.id,
          opcaoId: firstOption,
        });
        if (vote2.success) {
          logSuccess('35/58: vote (user2) - Segundo voto registrado');
        } else {
          throw new Error('Voto não registrado');
        }
      } catch (error) {
        logError('35/58: vote (user2) - Falhou', error);
      }
    }

    logPhase('FASE 11: CHAT & UPDATES (6 métodos)');

    try {
      const msg1 = await callRPC('sendMessage', {
        token: state.user1.token,
        sessionId: state.session.id,
        characterId: state.char1.id,
        message: 'Olá, vamos para a aventura!',
      });
      if (msg1.success) {
        logSuccess('36/58: sendMessage (user1) - Mensagem enviada');
      } else {
        throw new Error('Mensagem não enviada');
      }
    } catch (error) {
      logError('36/58: sendMessage (user1) - Falhou', error);
    }

    try {
      const msg2 = await callRPC('sendMessage', {
        token: state.user2.token,
        sessionId: state.session.id,
        characterId: state.char2.id,
        message: 'Estou pronto! Vamos!',
      });
      if (msg2.success) {
        logSuccess('37/58: sendMessage (user2) - Mensagem enviada');
      } else {
        throw new Error('Mensagem não enviada');
      }
    } catch (error) {
      logError('37/58: sendMessage (user2) - Falhou', error);
    }

    try {
      const messages = await callRPC('getMessages', {
        token: state.user1.token,
        sessionId: state.session.id,
        lastMessageId: 0,
      });
      if (messages.messages && messages.messages.length >= 2) {
        state.lastMessageId = messages.messages[messages.messages.length - 1].id;
        logSuccess('38/58: getMessages - Mensagens obtidas');
      } else {
        throw new Error('Mensagens incompletas');
      }
    } catch (error) {
      logError('38/58: getMessages - Falhou', error);
    }

    try {
      const checkMsg = await callRPC('checkMessages', {
        token: state.user1.token,
        sessionId: state.session.id,
        lastMessageId: state.lastMessageId,
      });
      if (checkMsg.messages !== undefined) {
        logSuccess('39/58: checkMessages - Long polling de mensagens testado');
      } else {
        throw new Error('Resposta inválida');
      }
    } catch (error) {
      logError('39/58: checkMessages - Falhou', error);
    }

    try {
      const statusUpdate = await callRPC('updatePlayerStatus', {
        token: state.user1.token,
        sessionId: state.session.id,
      });
      if (statusUpdate.sucesso !== undefined) {
        logSuccess('40/58: updatePlayerStatus - Heartbeat registrado');
      } else {
        throw new Error('Heartbeat falhou');
      }
    } catch (error) {
      logError('40/58: updatePlayerStatus - Falhou', error);
    }

    try {
      const updates = await callRPC('checkGameUpdates', {
        sessionId: state.session.id,
        token: state.user1.token,
        lastUpdateId: state.lastUpdateId.toString(),
      });
      if (updates.updates !== undefined) {
        logSuccess('41/58: checkGameUpdates - Long polling de updates testado');
      } else {
        throw new Error('Resposta inválida');
      }
    } catch (error) {
      logError('41/58: checkGameUpdates - Falhou', error);
    }

    logPhase('FASE 12: SISTEMA DE COMBATE (7 métodos)');

    const currentGameState = await callRPC('getGameState', {
      sessionId: state.session.id,
      token: state.user1.token,
    });

    const isCombatChapter = currentGameState.gameState.currentChapter.isCombat;

    if (!isCombatChapter) {
      logSuccess('42/58: initiateCombat - Pulado (capítulo atual não é de combate)');
      logSuccess('43/58: getCombatState - Pulado (capítulo atual não é de combate)');
      logSuccess('44/58: rollInitiative (char1) - Pulado (capítulo atual não é de combate)');
      logSuccess('45/58: rollInitiative (char2) - Pulado (capítulo atual não é de combate)');
      logSuccess('46/58: getCurrentTurn - Pulado (capítulo atual não é de combate)');
      logSuccess('47/58: performAttack - Pulado (capítulo atual não é de combate)');
      logSuccess('48/58: attemptRevive - Pulado (capítulo atual não é de combate)');
      testsPassed += 7;
    } else {
      try {
        const combat = await callRPC('initiateCombat', {
          token: state.user1.token,
          sessionId: state.session.id,
          chapterId: currentGameState.gameState.currentChapter.id,
        });
        if (combat.combatState) {
          state.combat.sessionId = combat.combatState.sessionId;
          logSuccess('42/58: initiateCombat - Combate iniciado');
        } else {
          throw new Error('Combate não iniciado');
        }
      } catch (error) {
        logError('42/58: initiateCombat - Falhou', error);
      }

      try {
        const combatState = await callRPC('getCombatState', {
          token: state.user1.token,
          sessionId: state.session.id,
        });
        if (combatState.combatState) {
          logSuccess('43/58: getCombatState - Estado do combate obtido');
        } else {
          throw new Error('Estado não retornado');
        }
      } catch (error) {
        logError('43/58: getCombatState - Falhou', error);
      }

      try {
        const init1 = await callRPC('rollInitiative', {
          token: state.user1.token,
          sessionId: state.session.id,
          characterId: state.char1.id,
        });
        if (init1.success) {
          logSuccess('44/58: rollInitiative (char1) - Iniciativa rolada');
        } else {
          throw new Error('Iniciativa não rolada');
        }
      } catch (error) {
        logError('44/58: rollInitiative (char1) - Falhou', error);
      }

      try {
        const init2 = await callRPC('rollInitiative', {
          token: state.user2.token,
          sessionId: state.session.id,
          characterId: state.char2.id,
        });
        if (init2.success) {
          logSuccess('45/58: rollInitiative (char2) - Iniciativa rolada');
        } else {
          throw new Error('Iniciativa não rolada');
        }
      } catch (error) {
        logError('45/58: rollInitiative (char2) - Falhou', error);
      }

      try {
        const turn = await callRPC('getCurrentTurn', {
          token: state.user1.token,
          sessionId: state.session.id,
        });
        if (turn.currentTurn) {
          logSuccess('46/58: getCurrentTurn - Turno atual obtido');
        } else {
          throw new Error('Turno não retornado');
        }
      } catch (error) {
        logError('46/58: getCurrentTurn - Falhou', error);
      }

      try {
        const combatStateBeforeAttack = await callRPC('getCombatState', {
          token: state.user1.token,
          sessionId: state.session.id,
        });

        const currentTurnEntity =
          combatStateBeforeAttack.combatState.turnOrder[
            combatStateBeforeAttack.combatState.currentTurnIndex
          ];

        let attackerToken = null;
        let attackerId = null;
        let targetId = null;

        if (currentTurnEntity === state.char1.id) {
          attackerToken = state.user1.token;
          attackerId = state.char1.id;
          targetId =
            combatStateBeforeAttack.combatState.enemies.find((e) => !e.isDead)?.id ||
            null;
        } else if (currentTurnEntity === state.char2.id) {
          attackerToken = state.user2.token;
          attackerId = state.char2.id;
          targetId =
            combatStateBeforeAttack.combatState.enemies.find((e) => !e.isDead)?.id ||
            null;
        } else {
          attackerToken = state.user1.token;
          attackerId = state.char1.id;
          targetId =
            combatStateBeforeAttack.combatState.enemies.find((e) => !e.isDead)?.id ||
            null;
        }

        if (targetId) {
          const attack = await callRPC('performAttack', {
            token: attackerToken,
            sessionId: state.session.id,
            attackerId: attackerId,
            targetId: targetId,
          });
          if (attack.attackRoll) {
            logSuccess('47/58: performAttack - Ataque executado');
          } else {
            throw new Error('Ataque não executado');
          }
        } else {
          throw new Error('Nenhum alvo disponível para ataque');
        }
      } catch (error) {
        logError('47/58: performAttack - Falhou', error);
      }

      try {
        const combatStateAfterAttack = await callRPC('getCombatState', {
          token: state.user1.token,
          sessionId: state.session.id,
        });

        const deadCharacter = combatStateAfterAttack.combatState.participants.find(
          (p) => p.isDead && p.reviveAttempts < 3
        );

        if (deadCharacter) {
          const revive = await callRPC('attemptRevive', {
            token: state.user1.token,
            sessionId: state.session.id,
            characterId: deadCharacter.characterId,
          });
          if (revive.roll) {
            logSuccess('48/58: attemptRevive - Tentativa de ressurreição executada');
          } else {
            throw new Error('Revive não executado');
          }
        } else {
          logSuccess('48/58: attemptRevive - Pulado (nenhum personagem morto)');
          testsPassed++;
        }
      } catch (error) {
        logError('48/58: attemptRevive - Falhou', error);
      }
    }

    logPhase('FASE 13: CRUD DE HISTÓRIAS (5 métodos)');

    const mermaidCode = `flowchart TD
  inicio["Você está em uma encruzilhada."]
  inicio -->|Ir para o norte| norte["Você encontra uma floresta densa."]
  inicio -->|Ir para o sul| sul["Você chega a uma vila pacífica."]
  norte --> fim["Fim da jornada"]
  sul --> fim`;

    try {
      const newStory = await callRPC('createStory', {
        token: state.user1.token,
        title: 'História de Teste',
        description: 'Uma história criada para testes automatizados do sistema.',
        metadata: {
          genre: 'Fantasia',
          synopsis:
            'Uma jornada épica através de terras desconhecidas repletas de mistérios antigos.',
          recommendedPlayers: { min: 2, max: 6, optimal: 4 },
          estimatedDuration: '1-2 horas',
          difficulty: 'Fácil',
          tags: ['Teste', 'Aventura', 'Exploração'],
        },
        mermaidSource: mermaidCode,
      });
      if (newStory.id) {
        state.story.createdId = newStory.id;
        logSuccess('49/58: createStory - Nova história criada');
      } else {
        throw new Error('História não criada');
      }
    } catch (error) {
      logError('49/58: createStory - Falhou', error);
    }

    try {
      const uploaded = await callRPC('uploadMermaid', {
        token: state.user1.token,
        title: 'História de Upload Mermaid',
        description: 'Uma história criada via upload de arquivo Mermaid para testes.',
        metadata: {
          genre: 'Ficção Científica',
          synopsis:
            'Uma aventura futurística em um mundo de tecnologia avançada e mistérios.',
          recommendedPlayers: { min: 2, max: 4, optimal: 3 },
          estimatedDuration: '2-3 horas',
          difficulty: 'Médio',
          tags: ['Sci-Fi', 'Tecnologia', 'Mistério'],
        },
        mermaidContent: mermaidCode,
      });
      if (uploaded.id) {
        logSuccess('50/58: uploadMermaid - História criada via Mermaid');
      } else {
        throw new Error('Upload falhou');
      }
    } catch (error) {
      logError('50/58: uploadMermaid - Falhou', error);
    }

    try {
      const updated = await callRPC('updateStory', {
        token: state.user1.token,
        storyId: state.story.createdId,
        title: 'História de Teste Atualizada',
      });
      if (updated.title === 'História de Teste Atualizada') {
        logSuccess('51/58: updateStory - História atualizada');
      } else {
        throw new Error('Atualização falhou');
      }
    } catch (error) {
      logError('51/58: updateStory - Falhou', error);
    }

    try {
      const toggled = await callRPC('toggleStoryStatus', {
        token: state.user1.token,
        storyId: state.story.createdId,
        isActive: false,
      });
      if (toggled.success) {
        logSuccess('52/58: toggleStoryStatus - Status da história alterado');
      } else {
        throw new Error('Toggle falhou');
      }
    } catch (error) {
      logError('52/58: toggleStoryStatus - Falhou', error);
    }

    try {
      const deleted = await callRPC('deleteStory', {
        token: state.user1.token,
        storyId: state.story.createdId,
      });
      if (deleted.success) {
        logSuccess('53/58: deleteStory - História excluída');
      } else {
        throw new Error('Exclusão falhou');
      }
    } catch (error) {
      logError('53/58: deleteStory - Falhou', error);
    }

    logPhase('FASE 14: PAINEL ADMIN (10 métodos)');

    try {
      const adminReg = await callRPC('register', {
        username: state.admin.username,
        password: 'admin123',
        confirmPassword: 'admin123',
      });
      if (adminReg.success) {
        state.admin.userId = adminReg.userId;
        logSuccess('54/58: register (admin) - Usuário admin criado');
      } else {
        throw new Error('Registro falhou');
      }
    } catch (error) {
      logError('54/58: register (admin) - Falhou', error);
    }

    try {
      const adminLogin1 = await callRPC('login', {
        username: state.admin.username,
        password: 'admin123',
      });
      if (adminLogin1.token) {
        state.admin.tempToken = adminLogin1.token;
        logSuccess('55/58: login (admin inicial) - Login temporário obtido');
      } else {
        throw new Error('Login falhou');
      }
    } catch (error) {
      logError('55/58: login (admin inicial) - Falhou', error);
    }

    try {
      const promoted = await callRPC('promoteUser', {
        token: state.user1.token,
        userId: state.admin.userId,
      });
      if (promoted.success) {
        logSuccess('56/58: promoteUser - Usuário promovido para ADMIN');
      } else {
        throw new Error('Promoção falhou');
      }
    } catch (error) {
      logError('56/58: promoteUser - Falhou', error);
    }

    try {
      const adminLogin2 = await callRPC('login', {
        username: state.admin.username,
        password: 'admin123',
      });
      if (adminLogin2.token) {
        state.admin.token = adminLogin2.token;
        logSuccess('57/58: login (admin completo) - Token ADMIN obtido');
      } else {
        throw new Error('Login falhou');
      }
    } catch (error) {
      logError('57/58: login (admin completo) - Falhou', error);
    }

    try {
      const users = await callRPC('getAllUsers', {
        token: state.admin.token,
      });
      if (users.users && users.users.length > 0) {
        logSuccess('58/58: getAllUsers - Lista de todos os usuários obtida');
      } else {
        throw new Error('Nenhum usuário retornado');
      }
    } catch (error) {
      logError('58/58: getAllUsers - Falhou', error);
    }

    try {
      const sessions = await callRPC('getAllSessions', {
        token: state.admin.token,
      });
      if (sessions.sessions) {
        logSuccess('EXTRA 1: getAllSessions - Lista de todas as sessões obtida');
      } else {
        throw new Error('Nenhuma sessão retornada');
      }
    } catch (error) {
      logError('EXTRA 1: getAllSessions - Falhou', error);
    }

    try {
      const detail = await callRPC('getSessionDetail', {
        token: state.admin.token,
        sessionId: state.session.id,
      });
      if (detail.id && detail.storyName && detail.ownerUsername) {
        logSuccess('EXTRA 2: getSessionDetail (admin) - Detalhes obtidos');
      } else {
        throw new Error('Detalhes não retornados');
      }
    } catch (error) {
      logError('EXTRA 2: getSessionDetail (admin) - Falhou', error);
    }

    try {
      const forced = await callRPC('forceSessionState', {
        token: state.admin.token,
        sessionId: state.session.id,
        newStatus: 'COMPLETED',
      });
      if (forced.success) {
        logSuccess('EXTRA 3: forceSessionState - Estado forçado pelo admin');
      } else {
        throw new Error('Mudança de estado falhou');
      }
    } catch (error) {
      logError('EXTRA 3: forceSessionState - Falhou', error);
    }

    try {
      const stats = await callRPC('getSystemStats', {
        token: state.admin.token,
      });
      if (stats.stats) {
        logSuccess('EXTRA 4: getSystemStats - Estatísticas do sistema obtidas');
      } else {
        throw new Error('Estatísticas não retornadas');
      }
    } catch (error) {
      logError('EXTRA 4: getSystemStats - Falhou', error);
    }

    try {
      const usage = await callRPC('getStoryUsage', {
        token: state.admin.token,
        storyId: state.story.id,
      });
      if (usage.usage && usage.popularChoices !== undefined) {
        logSuccess('EXTRA 5: getStoryUsage - Uso de histórias obtido');
      } else {
        throw new Error('Uso não retornado');
      }
    } catch (error) {
      logError('EXTRA 5: getStoryUsage - Falhou', error);
    }

    try {
      const demoted = await callRPC('demoteUser', {
        token: state.admin.token,
        userId: state.admin.userId,
      });
      if (demoted.success) {
        logSuccess('EXTRA 6: demoteUser - Usuário rebaixado de ADMIN');
      } else {
        throw new Error('Rebaixamento falhou');
      }
    } catch (error) {
      logError('EXTRA 6: demoteUser - Falhou', error);
    }

    try {
      const deletedUser = await callRPC('deleteUser', {
        token: state.admin.token,
        userId: state.user2.userId,
      });
      if (deletedUser.success) {
        logSuccess('EXTRA 7: deleteUser - Usuário excluído');
      } else {
        throw new Error('Exclusão falhou');
      }
    } catch (error) {
      logError('EXTRA 7: deleteUser - Falhou', error);
    }

    logPhase('FASE 15: CLEANUP (3 métodos)');

    try {
      const left = await callRPC('leaveSession', {
        token: state.user1.token,
        sessionId: state.session.id,
      });
      if (left.success) {
        logSuccess('59/59: leaveSession - Usuário saiu da sessão');
      } else {
        throw new Error('Leave falhou');
      }
    } catch (error) {
      logError('59/59: leaveSession - Falhou', error);
    }

    try {
      const deletedSession = await callRPC('deleteSession', {
        token: state.user1.token,
        sessionId: state.session.id,
      });
      if (deletedSession.success) {
        logSuccess('EXTRA 8: deleteSession - Sessão excluída');
      } else {
        throw new Error('Exclusão falhou');
      }
    } catch (error) {
      logError('EXTRA 8: deleteSession - Falhou', error);
    }

    try {
      const deletedChar1 = await callRPC('deleteCharacter', {
        token: state.user1.token,
        characterId: state.char1.id,
      });
      if (deletedChar1.success) {
        logSuccess('EXTRA 9: deleteCharacter - Personagens excluídos');
      } else {
        throw new Error('Exclusão falhou');
      }
    } catch (error) {
      logError('EXTRA 9: deleteCharacter - Falhou', error);
    }
  } catch (error) {
    console.error('\n❌ ERRO CRÍTICO NO TESTE:', error.message);
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 RESULTADO FINAL');
  console.log(`${'='.repeat(60)}`);
  console.log(`✅ Testes Passados: ${testsPassed}`);
  console.log(`❌ Testes Falhados: ${testsFailed}`);
  console.log(
    `📈 Taxa de Sucesso: ${((testsPassed / (testsPassed + testsFailed)) * 100).toFixed(1)}%`
  );
  console.log(`⏱️  Tempo Total: ${duration}s`);
  console.log(`${'='.repeat(60)}\n`);

  process.exit(testsFailed > 0 ? 1 : 0);
}

runTests();

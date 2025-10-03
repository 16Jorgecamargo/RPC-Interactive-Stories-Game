const http = require('http');

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:8443';

let requestId = 1;
const testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

async function rpcCall(method, params = {}) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      jsonrpc: '2.0',
      id: requestId++,
      method,
      params
    });

    const url = new URL(SERVER_URL);
    const options = {
      hostname: url.hostname,
      port: url.port || 80,
      path: '/rpc',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.error) {
            reject(new Error(`RPC Error: ${response.error.message} (code: ${response.error.code})`));
          } else {
            resolve(response.result);
          }
        } catch (err) {
          reject(new Error(`Failed to parse response: ${err.message}`));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function test(name, testFn) {
  testResults.total++;
  try {
    log(colors.cyan, `\n▶ Testing: ${name}`);
    const result = await testFn();
    testResults.passed++;
    log(colors.green, `✓ PASSED: ${name}`);
    return result;
  } catch (error) {
    testResults.failed++;
    testResults.errors.push({ test: name, error: error.message });
    log(colors.red, `✗ FAILED: ${name}`);
    log(colors.red, `  Error: ${error.message}`);
    return null;
  }
}

async function runTests() {
  log(colors.magenta, '\n╔══════════════════════════════════════════════════════╗');
  log(colors.magenta, '║   SUPER TESTE RPC - TODOS OS MÉTODOS DO SISTEMA     ║');
  log(colors.magenta, '╚══════════════════════════════════════════════════════╝\n');
  log(colors.yellow, `Servidor: ${SERVER_URL}\n`);

  let userToken = null;
  let adminToken = null;
  let userId = null;
  let characterId = null;
  let storyId = null;
  let sessionId = null;
  let sessionCode = null;
  let user2Token = null;
  let user2CharacterId = null;

  log(colors.blue, '\n═══ 1. SETUP & AUTH ═══');

  await test('health', async () => {
    const result = await rpcCall('health');
    if (!result.status || result.status !== 'ok') throw new Error('Status não é ok');
    return result;
  });

  await test('register (user1)', async () => {
    const result = await rpcCall('register', {
      username: 'testuser_sprint34',
      password: 'senha123',
      confirmPassword: 'senha123'
    });
    if (!result.success) throw new Error('Registro falhou');
    userId = result.userId;
    return result;
  });

  await test('login (user1)', async () => {
    const result = await rpcCall('login', {
      username: 'testuser_sprint34',
      password: 'senha123'
    });
    if (!result.token) throw new Error('Token não retornado');
    userToken = result.token;
    return result;
  });

  await test('me', async () => {
    const result = await rpcCall('me', { token: userToken });
    if (!result.id) throw new Error('ID do usuário não retornado');
    return result;
  });

  await test('register (admin)', async () => {
    const result = await rpcCall('register', {
      username: 'jorgec',
      password: 'senha123',
      confirmPassword: 'senha123'
    });
    return result;
  });

  await test('login (admin)', async () => {
    const result = await rpcCall('login', {
      username: 'jorgec',
      password: 'senha123'
    });
    if (!result.token) throw new Error('Token admin não retornado');
    adminToken = result.token;
    return result;
  });

  await test('register (user2)', async () => {
    const result = await rpcCall('register', {
      username: 'testuser2_sprint34',
      password: 'senha123',
      confirmPassword: 'senha123'
    });
    return result;
  });

  await test('login (user2)', async () => {
    const result = await rpcCall('login', {
      username: 'testuser2_sprint34',
      password: 'senha123'
    });
    if (!result.token) throw new Error('Token user2 não retornado');
    user2Token = result.token;
    return result;
  });

  log(colors.blue, '\n═══ 2. USER MANAGEMENT ═══');

  await test('updateProfile', async () => {
    const result = await rpcCall('updateProfile', {
      token: userToken,
      username: 'testuser_sprint34'
    });
    if (!result.success) throw new Error('Update falhou');
    return result;
  });

  await test('changePassword', async () => {
    const result = await rpcCall('changePassword', {
      token: userToken,
      currentPassword: 'senha123',
      newPassword: 'novaSenha123',
      confirmPassword: 'novaSenha123'
    });
    if (!result.success) throw new Error('Mudança de senha falhou');
    return result;
  });

  await test('login após mudança de senha', async () => {
    const result = await rpcCall('login', {
      username: 'testuser_sprint34',
      password: 'novaSenha123'
    });
    if (!result.token) throw new Error('Login com nova senha falhou');
    userToken = result.token;
    return result;
  });

  log(colors.blue, '\n═══ 3. CHARACTER CREATION ═══');

  await test('getCharacterOptions', async () => {
    const result = await rpcCall('getCharacterOptions', { token: userToken });
    if (!result.races || !result.classes) throw new Error('Opções não retornadas');
    return result;
  });

  log(colors.blue, '\n═══ 4. STORY MANAGEMENT (ADMIN) ═══');

  await test('createStory', async () => {
    const result = await rpcCall('createStory', {
      token: adminToken,
      title: 'História de Teste Sprint 34',
      description: 'Uma história criada para testar o sistema completo',
      metadata: {
        genre: 'Fantasia',
        synopsis: 'Uma aventura épica através de terras místicas repletas de perigos e tesouros antigos.',
        recommendedPlayers: { min: 2, max: 4, optimal: 3 },
        estimatedDuration: '2-3 horas',
        difficulty: 'Médio',
        tags: ['Exploração', 'Combate', 'Escolhas Morais']
      },
      mermaidSource: `flowchart TD
  inicio["Vocês chegam a uma encruzilhada misteriosa"]
  entrada{O que fazer?}
  esquerda["Seguir pela trilha da esquerda"]
  direita["Seguir pela trilha da direita"]
  combate["Um grupo de goblins aparece!"]
  tesouro["Vocês encontram um baú de tesouros"]
  fim["Fim da aventura"]

  inicio-->entrada
  entrada-->|Ir para esquerda|esquerda
  entrada-->|Ir para direita|direita
  esquerda-->combate
  direita-->tesouro
  combate-->fim
  tesouro-->fim`
    });
    if (!result.id) throw new Error('História não criada');
    storyId = result.id;
    return result;
  });

  await test('uploadMermaid', async () => {
    const result = await rpcCall('uploadMermaid', {
      token: adminToken,
      title: 'História Upload Mermaid',
      description: 'Teste de upload de arquivo Mermaid',
      metadata: {
        genre: 'Aventura',
        synopsis: 'Uma jornada simples para testar upload de Mermaid',
        recommendedPlayers: { min: 2, max: 4, optimal: 3 },
        estimatedDuration: '1 hora',
        difficulty: 'Fácil',
        tags: ['Tutorial', 'Teste']
      },
      mermaidContent: `flowchart TD
  start["Início"]
  end["Fim"]
  start-->end`
    });
    if (!result.id) throw new Error('Upload falhou');
    return result;
  });

  await test('listStories (admin)', async () => {
    const result = await rpcCall('listStories', { token: adminToken });
    if (!result.stories) throw new Error('Lista de histórias não retornada');
    return result;
  });

  await test('getStoryCatalog', async () => {
    const result = await rpcCall('getStoryCatalog', { token: userToken });
    if (!result.stories) throw new Error('Catálogo não retornado');
    return result;
  });

  await test('getStory', async () => {
    const result = await rpcCall('getStory', {
      token: userToken,
      storyId: storyId
    });
    if (!result.id) throw new Error('História não retornada');
    return result;
  });

  await test('updateStory', async () => {
    const result = await rpcCall('updateStory', {
      token: adminToken,
      storyId: storyId,
      title: 'História de Teste Sprint 34 (Atualizada)'
    });
    if (!result.id) throw new Error('Update falhou');
    return result;
  });

  await test('toggleStoryStatus (desativar)', async () => {
    const result = await rpcCall('toggleStoryStatus', {
      token: adminToken,
      storyId: storyId,
      isActive: false
    });
    if (!result.success) throw new Error('Toggle falhou');
    return result;
  });

  await test('toggleStoryStatus (ativar)', async () => {
    const result = await rpcCall('toggleStoryStatus', {
      token: adminToken,
      storyId: storyId,
      isActive: true
    });
    if (!result.success) throw new Error('Toggle falhou');
    return result;
  });

  log(colors.blue, '\n═══ 5. SESSION FLOW ═══');

  await test('createSession', async () => {
    const result = await rpcCall('createSession', {
      token: userToken,
      name: 'Sessão de Teste Sprint 34',
      storyId: storyId,
      maxPlayers: 4,
      tieResolutionStrategy: 'RANDOM',
      votingTimeoutSeconds: 30
    });
    if (!result.session) throw new Error('Sessão não criada');
    sessionId = result.session.id;
    sessionCode = result.session.sessionCode;
    return result;
  });

  await test('joinSession (user2)', async () => {
    const result = await rpcCall('joinSession', {
      token: user2Token,
      sessionCode: sessionCode
    });
    if (!result.session) throw new Error('Join falhou');
    return result;
  });

  await test('listMySessions', async () => {
    const result = await rpcCall('listMySessions', { token: userToken });
    if (!result.sessions) throw new Error('Lista não retornada');
    return result;
  });

  await test('getSessionDetails', async () => {
    const result = await rpcCall('getSessionDetails', {
      token: userToken,
      sessionId: sessionId
    });
    if (!result.session) throw new Error('Detalhes não retornados');
    return result;
  });

  await test('transitionToCreatingCharacters', async () => {
    const result = await rpcCall('transitionToCreatingCharacters', {
      token: userToken,
      sessionId: sessionId
    });
    if (!result.session) throw new Error('Transição falhou');
    return result;
  });

  await test('createCharacter (user1 na sessão)', async () => {
    const result = await rpcCall('createCharacter', {
      token: userToken,
      sessionId: sessionId,
      name: 'Aragorn Teste',
      race: 'Human',
      class: 'Warrior',
      attributes: {
        strength: 16,
        dexterity: 14,
        constitution: 15,
        intelligence: 10,
        wisdom: 12,
        charisma: 13
      },
      background: {
        appearance: 'Um guerreiro alto e forte com cabelos negros',
        personality: 'Corajoso e leal aos amigos',
        fears: 'Perder aqueles que ama',
        goals: 'Proteger o reino de todas as ameaças'
      },
      equipment: ['Espada longa', 'Escudo', 'Armadura de couro']
    });
    if (!result.id) throw new Error('Personagem não criado');
    characterId = result.id;
    return result;
  });

  await test('createCharacter (user2 na sessão)', async () => {
    const result = await rpcCall('createCharacter', {
      token: user2Token,
      sessionId: sessionId,
      name: 'Legolas Teste',
      race: 'Elf',
      class: 'Rogue',
      attributes: {
        strength: 12,
        dexterity: 18,
        constitution: 13,
        intelligence: 14,
        wisdom: 15,
        charisma: 12
      },
      background: {
        appearance: 'Um elfo ágil com cabelos loiros',
        personality: 'Perspicaz e silencioso',
        fears: 'Ser capturado',
        goals: 'Descobrir segredos antigos'
      },
      equipment: ['Arco longo', 'Adagas', 'Capa élfica']
    });
    if (!result.id) throw new Error('Personagem user2 não criado');
    user2CharacterId = result.id;
    return result;
  });

  await test('getMyCharacters', async () => {
    const result = await rpcCall('getMyCharacters', { token: userToken });
    if (!result.characters) throw new Error('Personagens não retornados');
    return result;
  });

  await test('getCharacter', async () => {
    const result = await rpcCall('getCharacter', {
      token: userToken,
      characterId: characterId
    });
    if (!result.id) throw new Error('Personagem não retornado');
    return result;
  });

  await test('updateCharacter', async () => {
    const result = await rpcCall('updateCharacter', {
      token: userToken,
      characterId: characterId,
      equipment: ['Espada longa +1', 'Escudo mágico', 'Armadura de placas']
    });
    if (!result.id) throw new Error('Update falhou');
    return result;
  });

  await test('canStartSession', async () => {
    const result = await rpcCall('canStartSession', {
      token: userToken,
      sessionId: sessionId
    });
    if (result.canStart === undefined) throw new Error('canStart não retornado');
    return result;
  });

  await test('startSession', async () => {
    const result = await rpcCall('startSession', {
      token: userToken,
      sessionId: sessionId
    });
    if (!result.session) throw new Error('Start falhou');
    return result;
  });

  log(colors.blue, '\n═══ 6. GAMEPLAY ═══');

  await test('getGameState', async () => {
    const result = await rpcCall('getGameState', {
      token: userToken,
      sessionId: sessionId
    });
    if (!result.gameState) throw new Error('Estado do jogo não retornado');
    return result;
  });

  await test('getTimelineHistory', async () => {
    const result = await rpcCall('getTimelineHistory', {
      token: userToken,
      sessionId: sessionId,
      limit: 10
    });
    if (!result.timeline) throw new Error('Timeline não retornada');
    return result;
  });

  await test('configureVoteTimeout', async () => {
    const result = await rpcCall('configureVoteTimeout', {
      token: userToken,
      sessionId: sessionId,
      durationSeconds: 30
    });
    if (!result.success) throw new Error('Configuração falhou');
    return result;
  });

  await test('vote (user1)', async () => {
    const result = await rpcCall('vote', {
      token: userToken,
      sessionId: sessionId,
      characterId: characterId,
      opcaoId: 'entrar_esquerda'
    });
    if (!result.success) throw new Error('Voto falhou');
    return result;
  });

  await test('getVoteStatus', async () => {
    const result = await rpcCall('getVoteStatus', {
      token: userToken,
      sessionId: sessionId
    });
    if (!result.status) throw new Error('Status de votação não retornado');
    return result;
  });

  await test('getVoteTimer', async () => {
    const result = await rpcCall('getVoteTimer', {
      token: userToken,
      sessionId: sessionId
    });
    if (!result.timer) throw new Error('Timer não retornado');
    return result;
  });

  await test('extendVoteTimer', async () => {
    const result = await rpcCall('extendVoteTimer', {
      token: userToken,
      sessionId: sessionId,
      additionalSeconds: 10
    });
    if (!result.success) throw new Error('Extensão falhou');
    return result;
  });

  await test('vote (user2)', async () => {
    const result = await rpcCall('vote', {
      token: user2Token,
      sessionId: sessionId,
      characterId: user2CharacterId,
      opcaoId: 'entrar_esquerda'
    });
    if (!result.success) throw new Error('Voto user2 falhou');
    return result;
  });

  log(colors.blue, '\n═══ 7. CHAT ═══');

  await test('sendMessage', async () => {
    const result = await rpcCall('sendMessage', {
      token: userToken,
      sessionId: sessionId,
      characterId: characterId,
      message: 'Olá pessoal, vamos nessa!'
    });
    if (!result.success) throw new Error('Envio de mensagem falhou');
    return result;
  });

  await test('getMessages', async () => {
    const result = await rpcCall('getMessages', {
      token: userToken,
      sessionId: sessionId,
      limit: 50
    });
    if (!result.messages) throw new Error('Mensagens não retornadas');
    return result;
  });

  log(colors.blue, '\n═══ 8. REAL-TIME UPDATES ═══');

  await test('updatePlayerStatus', async () => {
    const result = await rpcCall('updatePlayerStatus', {
      token: userToken,
      sessionId: sessionId
    });
    if (result.sucesso === undefined) throw new Error('Status não atualizado');
    return result;
  });

  await test('checkGameUpdates', async () => {
    const result = await rpcCall('checkGameUpdates', {
      token: userToken,
      sessionId: sessionId
    });
    if (!result.updates) throw new Error('Updates não retornados');
    return result;
  });

  await test('checkMessages', async () => {
    const result = await rpcCall('checkMessages', {
      token: userToken,
      sessionId: sessionId
    });
    if (!result.messages) throw new Error('Mensagens não retornadas');
    return result;
  });

  log(colors.blue, '\n═══ 9. COMBAT ═══');

  await test('initiateCombat', async () => {
    const result = await rpcCall('initiateCombat', {
      token: userToken,
      sessionId: sessionId
    });
    if (!result.success) throw new Error('Combate não iniciado');
    return result;
  });

  await test('getCombatState', async () => {
    const result = await rpcCall('getCombatState', {
      token: userToken,
      sessionId: sessionId
    });
    return result;
  });

  log(colors.blue, '\n═══ 10. CLEANUP ═══');

  await test('leaveSession (user2)', async () => {
    const result = await rpcCall('leaveSession', {
      token: user2Token,
      sessionId: sessionId
    });
    if (!result.success) throw new Error('Leave falhou');
    return result;
  });

  await test('deleteCharacter (user2)', async () => {
    const result = await rpcCall('deleteCharacter', {
      token: user2Token,
      characterId: user2CharacterId
    });
    if (!result.success) throw new Error('Delete personagem user2 falhou');
    return result;
  });

  await test('deleteSession', async () => {
    const result = await rpcCall('deleteSession', {
      token: userToken,
      sessionId: sessionId
    });
    if (!result.success) throw new Error('Delete sessão falhou');
    return result;
  });

  await test('deleteCharacter (user1)', async () => {
    const result = await rpcCall('deleteCharacter', {
      token: userToken,
      characterId: characterId
    });
    if (!result.success) throw new Error('Delete personagem falhou');
    return result;
  });

  await test('deleteStory', async () => {
    const result = await rpcCall('deleteStory', {
      token: adminToken,
      storyId: storyId
    });
    if (!result.success) throw new Error('Delete história falhou');
    return result;
  });

  log(colors.magenta, '\n\n╔══════════════════════════════════════════════════════╗');
  log(colors.magenta, '║              RELATÓRIO FINAL DO TESTE                ║');
  log(colors.magenta, '╚══════════════════════════════════════════════════════╝\n');

  log(colors.cyan, `Total de testes: ${testResults.total}`);
  log(colors.green, `✓ Passou: ${testResults.passed}`);
  log(colors.red, `✗ Falhou: ${testResults.failed}`);
  log(colors.yellow, `Taxa de sucesso: ${((testResults.passed / testResults.total) * 100).toFixed(2)}%\n`);

  if (testResults.errors.length > 0) {
    log(colors.red, '\n═══ ERROS ENCONTRADOS ═══\n');
    testResults.errors.forEach((err, idx) => {
      log(colors.red, `${idx + 1}. ${err.test}`);
      log(colors.red, `   ${err.error}\n`);
    });
  } else {
    log(colors.green, '\n🎉 TODOS OS TESTES PASSARAM COM SUCESSO! 🎉\n');
  }
}

runTests().catch(err => {
  log(colors.red, `\n❌ Erro fatal: ${err.message}`);
  process.exit(1);
});

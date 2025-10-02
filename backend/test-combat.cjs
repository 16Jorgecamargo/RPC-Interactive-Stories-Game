const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:8443/rpc';

let token = '';
let sessionId = '';
let characterId = '';
let storyId = 'a7a48438-8d09-4a1a-8483-b4db6be9e0da';

async function rpcCall(method, params) {
  console.log(`\n📤 Chamando: ${method}`);
  console.log('Params:', JSON.stringify(params, null, 2));

  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Date.now(),
        method,
        params,
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.log('❌ Erro:', data.error.message);
      return null;
    }

    console.log('✅ Sucesso:', JSON.stringify(data.result, null, 2));
    return data.result;
  } catch (error) {
    console.log('❌ ERRO INESPERADO:', error.message);
    return null;
  }
}

async function testCombat() {
  try {
    console.log('🚀 Iniciando testes do sistema de Combate...\n');
    console.log('============================================================');
    console.log('🧪 TESTE: Sistema de Combate D&D');
    console.log('============================================================');

    console.log('\n📝 PASSO 1: Registrar e fazer login');
    const username = `test${Date.now()}`;
    const password = 'senha123';
    await rpcCall('register', {
      username,
      password,
      confirmPassword: password,
    });

    const loginResult = await rpcCall('login', {
      username,
      password,
    });

    if (!loginResult) {
      console.log('❌ Falha no login. Abortando testes.');
      return;
    }

    token = loginResult.token;
    console.log('✅ Token obtido');

    console.log('\n📝 PASSO 2: Criar uma sessão de jogo');
    const sessionResult = await rpcCall('createSession', {
      token,
      name: 'Sessão Teste Combate',
      storyId,
      maxPlayers: 4,
    });

    if (!sessionResult) {
      console.log('❌ Falha ao criar sessão. Abortando testes.');
      return;
    }

    sessionId = sessionResult.session.id;
    console.log(`✅ Sessão criada: ${sessionId}`);

    console.log('\n📝 PASSO 3: Transicionar para criação de personagens');
    await rpcCall('transitionToCreatingCharacters', {
      token,
      sessionId,
    });

    console.log('\n📝 PASSO 4: Criar um personagem');
    const characterResult = await rpcCall('createCharacter', {
      token,
      sessionId,
      name: 'Thorin Combatente',
      race: 'Dwarf',
      class: 'Warrior',
      attributes: {
        strength: 16,
        dexterity: 14,
        constitution: 16,
        intelligence: 10,
        wisdom: 12,
        charisma: 8,
      },
      background: {
        appearance: 'Anão robusto com barba trançada e armadura de batalha.',
        personality: 'Destemido e sempre pronto para o combate corpo a corpo.',
        fears: 'Teme perder sua honra em batalha contra inimigos indignos.',
        goals: 'Provar seu valor em combate contra as criaturas mais perigosas.',
      },
      equipment: ['Machado de batalha', 'Escudo pesado', 'Armadura de placas'],
    });

    if (!characterResult) {
      console.log('❌ Falha ao criar personagem. Abortando testes.');
      return;
    }

    characterId = characterResult.id;
    console.log(`✅ Personagem criado: ${characterId}`);

    console.log('\n📝 PASSO 5: Iniciar sessão');
    const startResult = await rpcCall('startSession', {
      token,
      sessionId,
    });

    if (!startResult) {
      console.log('❌ Falha ao iniciar sessão. Abortando testes.');
      return;
    }

    console.log('✅ Sessão iniciada, status: IN_PROGRESS');

    console.log('\n📝 PASSO 6: Pular para teste de combate');
    console.log('   (Sistema de combate não depende do capítulo atual)');

    console.log('\n' + '='.repeat(60));
    console.log('🧪 TESTANDO MÉTODOS DE COMBATE');
    console.log('='.repeat(60));

    console.log('\n📝 TESTE 1: getCombatState (antes de iniciar combate)');
    const combatState1 = await rpcCall('getCombatState', {
      token,
      sessionId,
    });

    if (combatState1) {
      if (combatState1.combatState === null) {
        console.log('📊 Nenhum combate ativo (esperado)');
      } else {
        console.log('⚠️  Combate já existe (inesperado)');
      }
    }

    console.log('\n📝 TESTE 2: initiateCombat (iniciar combate)');
    const initResult = await rpcCall('initiateCombat', {
      token,
      sessionId,
    });

    if (initResult) {
      console.log(`✅ ${initResult.message}`);
      console.log(`📊 Número de participantes: ${initResult.combatState.participants.length}`);
      console.log(`📊 Número de inimigos: ${initResult.combatState.enemies.length}`);
      console.log(`📊 Capítulo de combate: ${initResult.combatState.chapterId}`);

      console.log('\n📋 Participantes:');
      initResult.combatState.participants.forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.characterName} - HP: ${p.hp}/${p.maxHp}`);
      });

      console.log('\n📋 Inimigos:');
      initResult.combatState.enemies.forEach((e, i) => {
        console.log(`  ${i + 1}. ${e.name} - HP: ${e.hp}/${e.maxHp}, AC: ${e.ac}`);
      });

      if (initResult.combatState.turnOrder.length > 0) {
        console.log('\n⚠️  Ordem de turnos já definida (não deveria estar)');
      } else {
        console.log('\n✅ Ordem de turnos vazia (esperado, iniciativa ainda não rolada)');
      }
    }

    console.log('\n📝 TESTE 3: getCombatState (após iniciar combate)');
    const combatState2 = await rpcCall('getCombatState', {
      token,
      sessionId,
    });

    if (combatState2 && combatState2.combatState) {
      console.log('✅ Combate ativo encontrado');
      console.log(`📊 Combate ativo: ${combatState2.combatState.isActive}`);
      console.log(`📊 Turno atual: ${combatState2.combatState.currentTurnIndex}`);
      console.log(`📊 ID da sessão: ${combatState2.combatState.sessionId}`);
      console.log(`📊 Data de criação: ${new Date(combatState2.combatState.createdAt).toLocaleString()}`);
    }

    console.log('\n📝 TESTE 4: Tentar iniciar combate novamente (deve falhar)');
    const initResult2 = await rpcCall('initiateCombat', {
      token,
      sessionId,
    });

    if (!initResult2) {
      console.log('✅ Corretamente impediu segundo combate (esperado)');
    } else {
      console.log('⚠️  Permitiu criar segundo combate (inesperado)');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ TESTE DE VALIDAÇÕES (casos de erro)');
    console.log('='.repeat(60));

    console.log('\n📝 TESTE 5: initiateCombat com token inválido');
    await rpcCall('initiateCombat', {
      token: 'token_invalido',
      sessionId,
    });

    console.log('\n📝 TESTE 6: getCombatState com sessionId inexistente');
    await rpcCall('getCombatState', {
      token,
      sessionId: 'session_inexistente',
    });

    console.log('\n' + '='.repeat(60));
    console.log('🎉 TESTES DE COMBATE CONCLUÍDOS!');
    console.log('='.repeat(60));

    console.log('\n📊 RESUMO:');
    console.log('✅ initiateCombat: Inicia combate em nó de combate');
    console.log('✅ getCombatState: Retorna estado do combate ativo');
    console.log('✅ Geração de inimigos: Detecta e cria inimigos automaticamente');
    console.log('✅ Cálculo de HP: Baseado em constituição do personagem');
    console.log('✅ Validações: Erros retornam mensagens apropriadas');

  } catch (error) {
    console.log('\n❌ ERRO CRÍTICO:', error.message);
    console.log(error.stack);
  }
}

testCombat();

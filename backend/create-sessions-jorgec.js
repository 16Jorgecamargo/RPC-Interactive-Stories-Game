// Script para criar duas sessões para o usuário jorgec
import fetch from 'node-fetch';

const SERVER_URL = 'http://localhost:8443';

async function rpcCall(method, params) {
  const response = await fetch(`${SERVER_URL}/rpc`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params
    })
  });

  const data = await response.json();
  
  if (data.error) {
    throw new Error(`RPC Error: ${data.error.message}`);
  }
  
  return data.result;
}

async function main() {
  try {
    console.log('🔐 Fazendo login como jorgec...');
    const loginResult = await rpcCall('login', {
      username: 'jorgec',
      password: 'senha123'
    });
    
    const token = loginResult.token;
    console.log('✅ Login bem-sucedido!');
    console.log('Token:', token.substring(0, 20) + '...');
    console.log('User:', loginResult.user);
    
    // Listar histórias disponíveis
    console.log('\n📚 Listando histórias disponíveis...');
    const storiesResult = await rpcCall('listStories', { token });
    console.log('Stories result:', JSON.stringify(storiesResult, null, 2));
    
    const stories = storiesResult.stories || storiesResult;
    console.log(`✅ Encontradas ${stories.length} histórias`);
    
    if (stories.length === 0) {
      console.log('❌ Nenhuma história disponível!');
      return;
    }
    
    const storyId = stories[0].id;
    console.log(`📖 Usando história: "${stories[0].title}" (${storyId})`);
    
    // Criar primeira sessão
    console.log('\n🎮 Criando primeira sessão...');
    const session1 = await rpcCall('createSession', {
      token,
      name: 'Aventura na Caverna - Jorgec #1',
      storyId,
      maxPlayers: 4,
      tieResolutionStrategy: 'RANDOM',
      votingTimeoutMinutes: 10
    });
    
    console.log('✅ Primeira sessão criada!');
    console.log('Session ID:', session1.id);
    console.log('Session Code:', session1.sessionCode);
    console.log('Status:', session1.status);
    
    // Criar segunda sessão
    console.log('\n🎮 Criando segunda sessão...');
    const session2 = await rpcCall('createSession', {
      token,
      name: 'Exploração Épica - Jorgec #2',
      storyId,
      maxPlayers: 5,
      tieResolutionStrategy: 'MASTER_DECIDES',
      votingTimeoutMinutes: 15
    });
    
    console.log('✅ Segunda sessão criada!');
    console.log('Session ID:', session2.id);
    console.log('Session Code:', session2.sessionCode);
    console.log('Status:', session2.status);
    
    // Listar todas as sessões do usuário
    console.log('\n📋 Listando todas as sessões de jorgec...');
    const mySessionsResult = await rpcCall('listMySessions', { token });
    const mySessions = mySessionsResult.sessions || mySessionsResult;
    console.log(`✅ Total de sessões: ${mySessions.length}`);
    
    mySessions.forEach((session, index) => {
      console.log(`\n${index + 1}. ${session.name}`);
      console.log(`   ID: ${session.id}`);
      console.log(`   Code: ${session.sessionCode}`);
      console.log(`   Status: ${session.status}`);
      console.log(`   Story: ${session.storyId}`);
      console.log(`   Players: ${session.participants.length}/${session.maxPlayers}`);
      console.log(`   Created: ${new Date(session.createdAt).toLocaleString('pt-BR')}`);
    });
    
    console.log('\n✅ Processo concluído com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

main();

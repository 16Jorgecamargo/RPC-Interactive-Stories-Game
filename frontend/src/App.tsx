import { useState, useEffect } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { LobbyScreen } from './components/LobbyScreen';
import { GameScreen } from './components/GameScreen';
import { ServerStatus } from './components/ServerStatus';
import { rpc } from './lib/rpc-client';

type Screen = 'login' | 'lobby' | 'game';

function App() {
  const [screen, setScreen] = useState<Screen>('login');
  const [playerName, setPlayerName] = useState('');
  const [playerId, setPlayerId] = useState('');
  const [roomId, setRoomId] = useState('');

  // Recuperar dados do sessionStorage
  useEffect(() => {
    const savedPlayerName = sessionStorage.getItem('playerName');
    if (savedPlayerName) {
      setPlayerName(savedPlayerName);
      setScreen('lobby');
    }
  }, []);

  const handleLogin = (name: string) => {
    setPlayerName(name);
    sessionStorage.setItem('playerName', name);
    setScreen('lobby');
  };

  const handleLogout = () => {
    setPlayerName('');
    setPlayerId('');
    setRoomId('');
    sessionStorage.removeItem('playerName');
    setScreen('login');
  };

  const handleJoinRoom = async (roomIdToJoin: string) => {
    try {
      const result = await rpc.joinRoom(roomIdToJoin, playerName);
      setPlayerId(result.playerId);
      setRoomId(roomIdToJoin);
      setScreen('game');
    } catch (error) {
      console.error('Erro ao entrar na sala:', error);
      alert('Erro ao entrar na sala');
    }
  };

  const handleLeaveRoom = () => {
    setPlayerId('');
    setRoomId('');
    setScreen('lobby');
  };

  return (
    <>
      {screen === 'login' && <LoginScreen onLogin={handleLogin} />}

      {screen === 'lobby' && (
        <LobbyScreen
          playerName={playerName}
          onJoinRoom={handleJoinRoom}
          onLogout={handleLogout}
        />
      )}

      {screen === 'game' && roomId && playerId && (
        <GameScreen
          roomId={roomId}
          playerId={playerId}
          onLeaveRoom={handleLeaveRoom}
        />
      )}

      <ServerStatus />
    </>
  );
}

export default App;

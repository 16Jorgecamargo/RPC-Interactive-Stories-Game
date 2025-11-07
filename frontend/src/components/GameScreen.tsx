import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { rpc } from '@/lib/rpc-client';
import type { GameState, GameEvent, CountdownState } from '@/types';
import { Users, MessageSquare, Send, LogOut, Check, Trash2, AlertTriangle } from 'lucide-react';

interface GameScreenProps {
  roomId: string;
  playerId: string;
  onLeaveRoom: () => void;
}

interface CountdownBarProps {
  label: string;
  remainingMs: number;
  progress: number;
  variant: 'vote' | 'card';
}

function CountdownBar({ label, remainingMs, progress, variant }: CountdownBarProps) {
  const secondsRemaining = Math.max(0, Math.ceil(remainingMs / 1000));
  const barColor = variant === 'vote' ? 'bg-blue-500' : 'bg-emerald-500';
  const width = Math.min(100, Math.max(0, progress));

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm font-medium text-muted-foreground">
        <span>{label}</span>
        <span>{secondsRemaining}s</span>
      </div>
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full ${barColor} transition-all duration-200`}
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

export function GameScreen({ roomId, playerId, onLeaveRoom }: GameScreenProps) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [message, setMessage] = useState('');
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteVoteData, setDeleteVoteData] = useState<{ yesVotes: number; noVotes: number; total: number }>({ yesVotes: 0, noVotes: 0, total: 0 });
  const [hasVotedDelete, setHasVotedDelete] = useState(false);
  const [voteCountdown, setVoteCountdown] = useState<CountdownState | null>(null);
  const [cardCountdown, setCardCountdown] = useState<CountdownState | null>(null);
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Polling for events
  useEffect(() => {
    let active = true;
    let lastEventId = -1;

    const poll = async () => {
      if (!active) return;

      try {
        const result = await rpc.waitForEvents(roomId, lastEventId);

        if (!active) return;

        // Process events
        result.events.forEach((event: GameEvent) => {
          handleEvent(event);
        });

        lastEventId = result.lastEventId;

        // Update game state after events
        if (result.events.length > 0) {
          const newState = await rpc.getGameState(roomId);
          setGameState(newState);
        }
      } catch (error) {
        console.error('Polling error:', error);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Continue polling
      if (active) {
        poll();
      }
    };

    poll();

    return () => {
      active = false;
    };
  }, [roomId]);

  // Load initial state
  useEffect(() => {
    const loadInitialState = async () => {
      try {
        const state = await rpc.getGameState(roomId);
        setGameState(state);
      } catch (error) {
        console.error('Error loading state:', error);
      }
    };
    loadInitialState();
  }, [roomId]);

  useEffect(() => {
    if (!gameState?.countdowns || gameState.countdowns.length === 0) {
      setVoteCountdown(null);
      setCardCountdown(null);
      return;
    }

    const vote = gameState.countdowns.find((c) => c.countdownType === 'vote') ?? null;
    const card = gameState.countdowns.find((c) => c.countdownType === 'card') ?? null;

    setVoteCountdown(vote);
    setCardCountdown(card);
  }, [gameState?.countdowns]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [gameState?.messages]);

  useEffect(() => {
    if (!voteCountdown && !cardCountdown) {
      return;
    }

    setCurrentTime(Date.now());
    const interval = window.setInterval(() => {
      setCurrentTime(Date.now());
    }, 100);

    return () => window.clearInterval(interval);
  }, [voteCountdown, cardCountdown]);

  const handleEvent = (event: GameEvent) => {
    switch (event.type) {
      case 'playerJoined':
        break;
      case 'playerLeft':
        break;
      case 'cardChanged':
        setSelectedChoice(null);
        setVoteCountdown(null);
        setCardCountdown(null);
        break;
      case 'deleteRoomInitiated':
        setHasVotedDelete(false);
        setDeleteDialogOpen(true);
        break;
      case 'deleteRoomVoted':
        setDeleteVoteData({
          yesVotes: event.data.yesVotes,
          noVotes: event.data.noVotes,
          total: event.data.total,
        });
        break;
      case 'roomDeleted':
        setTimeout(() => {
          onLeaveRoom();
        }, 2000);
        break;
      case 'countdownStarted':
        if (event.data.countdownType === 'vote') {
          setVoteCountdown(event.data);
        } else {
          setCardCountdown(event.data);
        }
        break;
      case 'countdownFinished':
        if (event.data.countdownType === 'vote') {
          setVoteCountdown(null);
        } else {
          setCardCountdown(null);
        }
        break;
    }
  };

  const handleVote = async (choiceId: string) => {
    if (!gameState || gameState.playerVoted.includes(playerId)) return;

    try {
      setSelectedChoice(choiceId);
      await rpc.vote(roomId, playerId, choiceId);
      const newState = await rpc.getGameState(roomId);
      setGameState(newState);
    } catch (error) {
      console.error('Error voting:', error);
      setSelectedChoice(null);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      await rpc.sendMessage(roomId, playerId, message.trim());
      setMessage('');
      const newState = await rpc.getGameState(roomId);
      setGameState(newState);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleLeave = async () => {
    try {
      await rpc.leaveRoom(roomId, playerId);
    } catch (error) {
      console.error('Error leaving:', error);
    } finally {
      onLeaveRoom();
    }
  };

  const handleInitiateDelete = async () => {
    try {
      await rpc.initiateDeleteRoom(roomId, playerId);
    } catch (error: any) {
      console.error('Erro ao iniciar votação:', error);
    }
  };

  const handleVoteDelete = async (vote: boolean) => {
    try {
      const result = await rpc.voteDeleteRoom(roomId, playerId, vote);
      setHasVotedDelete(true);
      setDeleteVoteData(result);

      if (result.approved) {
        setDeleteDialogOpen(false);
      }
    } catch (error: any) {
      console.error('Erro ao votar:', error);
    }
  };

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!roomId || !playerId) {
        return;
      }

      const payload = JSON.stringify({
        jsonrpc: '2.0',
        method: 'leaveRoom',
        params: { roomId, playerId },
      });

      navigator.sendBeacon(
        '/rpc',
        new Blob([payload], { type: 'application/json' })
      );
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [roomId, playerId]);

  if (!gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground font-sans">
        <p>Carregando o jogo...</p>
      </div>
    );
  }

  const totalPlayers = gameState.players.length;
  const hasVoted = gameState.playerVoted.includes(playerId);
  const totalVotes = gameState.playerVoted.length;
  const isGameOver = gameState.currentCard.choices.length === 0;

  const getCountdownInfo = (countdown: CountdownState | null) => {
    if (!countdown) return null;
    const elapsed = Math.max(0, currentTime - countdown.startedAt);
    const remainingMs = Math.max(0, countdown.durationMs - elapsed);
    const progress = countdown.durationMs > 0 ? Math.min(100, Math.max(0, (elapsed / countdown.durationMs) * 100)) : 100;
    return { remainingMs, progress };
  };

  const voteCountdownInfo = getCountdownInfo(voteCountdown);
  const cardCountdownInfo = getCountdownInfo(cardCountdown);

  return (
    <>
      <div className="min-h-screen p-4 bg-background text-foreground font-sans">
        <div className="max-w-7xl mx-auto py-4 animate-fade-in">
          {/* Header */}
          <div className="flex justify-between items-center mb-4 border-b-2 border-border pb-4">
            <div>
              <h1 className="text-2xl font-serif text-primary">{gameState.room.name}</h1>
              <p className="text-sm text-muted-foreground">{gameState.room.storyTitle}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="destructive" size="sm" onClick={handleInitiateDelete} className="rounded-md">
                <Trash2 className="w-4 h-4 mr-2" />
                Deletar Sala
              </Button>
              <Button variant="outline" size="sm" onClick={handleLeave} className="bg-transparent border border-border rounded-md hover:bg-primary/10 hover:text-primary">
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-4">
            {/* Main column - Story and choices */}
            <div className="lg:col-span-2 space-y-4 animate-fade-in">
            {/* Story Card */}
            <Card className="bg-card/80 backdrop-blur-sm border border-border rounded-lg shadow-lg animate-pop-in">
              <CardHeader>
                <CardTitle className="text-primary">A História Até Agora</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg leading-relaxed whitespace-pre-line text-foreground">
                  {gameState.currentCard.text}
                </p>
              </CardContent>
            </Card>

            {/* Choices */}
            {!isGameOver ? (
              <Card className="bg-card/80 backdrop-blur-sm border border-border rounded-lg shadow-lg animate-pop-in">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="text-primary">O que você faz?</span>
                    <Badge variant="secondary" className="bg-secondary text-secondary-foreground">
                      {totalVotes}/{totalPlayers} votaram
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    {hasVoted ? 'Você já votou! Aguarde os outros jogadores.' : 'Escolha uma opção:'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {gameState.currentCard.choices.map((choice) => {
                    const votes = gameState.votes[choice.id] || 0;
                    const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
                    const isSelected = selectedChoice === choice.id;

                    return (
                      <div key={choice.id} className="relative">
                        <Button
                          variant={isSelected ? 'default' : 'outline'}
                          className="w-full justify-start text-left h-auto py-3 relative overflow-hidden border border-border rounded-md hover:bg-primary/10 disabled:opacity-70 animate-pop-in"
                          onClick={() => handleVote(choice.id)}
                          disabled={hasVoted}
                        >
                          <div className="flex items-center justify-between w-full relative z-10">
                            <span className="flex-1 pr-4">{choice.text}</span>
                            <div className="flex items-center gap-2">
                              {isSelected && <Check className="w-5 h-5 text-accent" />}
                              <Badge variant="outline" className="border-border text-accent">{votes}</Badge>
                            </div>
                          </div>
                          {/* Progress bar */}
                          {totalVotes > 0 && (
                            <div
                              className="absolute left-0 top-0 h-full bg-primary/20 transition-all duration-500 ease-out"
                              style={{ width: `${percentage}%` }}
                            />
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-card/80 backdrop-blur-sm border border-border rounded-lg shadow-lg animate-pop-in">
                <CardHeader>
                  <CardTitle className="text-accent">Fim da Aventura!</CardTitle>
                  <CardDescription>A jornada chegou ao fim.</CardDescription>
                </CardHeader>
              </Card>
            )}
            </div>

            {/* Sidebar - Chat and Players */}
            <div className="space-y-4 animate-fade-in">
            {/* Players */}
            <Card className="bg-card/80 backdrop-blur-sm border border-border rounded-lg shadow-lg animate-pop-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-primary">
                  <Users className="w-5 h-5" />
                  Companheiros ({totalPlayers})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                  {gameState.players.map((player) => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className={`truncate ${player.id === playerId ? 'font-bold text-accent' : 'text-muted-foreground'}`}>
                        {player.name}
                        {player.id === playerId && ' (você)'}
                      </span>
                      {gameState.playerVoted.includes(player.id) && (
                        <Badge variant="secondary" className="text-xs bg-secondary text-secondary-foreground flex-shrink-0">
                          <Check className="w-3 h-3" />
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Chat */}
            <Card className="bg-card/80 backdrop-blur-sm border border-border rounded-lg shadow-lg flex flex-col animate-pop-in">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-primary">
                  <MessageSquare className="w-5 h-5" />
                  Mensagens
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col gap-2">
                <div className="flex-grow h-64 overflow-y-auto space-y-3 border rounded-md p-2 bg-input/50 border-border">
                  {gameState.messages.map((msg) => (
                    <div key={msg.id} className="text-sm">
                      {msg.isSystem ? (
                        <span className="italic text-muted-foreground">• {msg.message}</span>
                      ) : (
                        <>
                          <span className="font-semibold text-accent">{msg.playerName}: </span>
                          <span className="text-foreground">{msg.message}</span>
                        </>
                      )}
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    placeholder='Digite uma mensagem...'
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    maxLength={200}
                    className="w-full bg-input border border-border rounded-md h-10 px-4 text-base focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <Button type="submit" size="icon" disabled={!message.trim()} className="bg-primary text-primary-foreground rounded-md hover:bg-primary/90 flex-shrink-0">
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </CardContent>
            </Card>
            </div>
          </div>

          {(voteCountdownInfo || cardCountdownInfo) && (
            <div className="mt-6 space-y-3">
              {voteCountdownInfo && voteCountdown && (
                <CountdownBar
                  key={`vote-${voteCountdown.startedAt}`}
                  label="Tempo de votação"
                  remainingMs={voteCountdownInfo.remainingMs}
                  progress={voteCountdownInfo.progress}
                  variant="vote"
                />
              )}
              {cardCountdownInfo && cardCountdown && (
                <CountdownBar
                  key={`card-${cardCountdown.startedAt}`}
                  label="Próxima cena em"
                  remainingMs={cardCountdownInfo.remainingMs}
                  progress={cardCountdownInfo.progress}
                  variant="card"
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Dialog for delete room vote */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-card/80 backdrop-blur-sm border border-border rounded-lg shadow-lg text-foreground">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Votação para Deletar Sala
            </DialogTitle>
            <DialogDescription>
              Uma votação foi iniciada para deletar esta sala. É necessário 75% ou mais de aprovação para deletar.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span>Votos SIM:</span>
              <Badge variant="default" className="bg-destructive text-destructive-foreground">{deleteVoteData.yesVotes}</Badge>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span>Votos NÃO:</span>
              <Badge variant="secondary" className="bg-secondary text-secondary-foreground">{deleteVoteData.noVotes}</Badge>
            </div>
            <div className="w-full bg-muted rounded-full h-2.5 mt-2">
              <div className="bg-destructive h-2.5 rounded-full" style={{ width: `${deleteVoteData.total > 0 ? (deleteVoteData.yesVotes / deleteVoteData.total) * 100 : 0}%` }}></div>
            </div>
            <div className="text-xs text-muted-foreground text-right">{`Atual: ${deleteVoteData.total > 0 ? ((deleteVoteData.yesVotes / deleteVoteData.total) * 100).toFixed(0) : 0}% (Necessário: 75%)`}</div>
          </div>
          <DialogFooter>
            {!hasVotedDelete ? (
              <>
                <Button variant="outline" onClick={() => handleVoteDelete(false)} className="border-border hover:bg-primary/10">
                  NÃO
                </Button>
                <Button variant="destructive" onClick={() => handleVoteDelete(true)}>
                  SIM, deletar
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Você já votou. Aguardando outros jogadores...</p>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

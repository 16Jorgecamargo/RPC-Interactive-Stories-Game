import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { rpc } from '@/lib/rpc-client';
import type { RoomListItem, Story } from '@/types';
import { Users, BookOpen, Plus, RefreshCw, LogOut, ArrowRight } from 'lucide-react';

interface LobbyScreenProps {
  playerName: string;
  onJoinRoom: (roomId: string) => void;
  onLogout: () => void;
}

export function LobbyScreen({ playerName, onJoinRoom, onLogout }: LobbyScreenProps) {
  const [rooms, setRooms] = useState<RoomListItem[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [selectedStory, setSelectedStory] = useState('');

  const loadRooms = async () => {
    try {
      const result = await rpc.listRooms();
      setRooms(result.rooms);
    } catch (error) {
      console.error('Erro ao carregar salas:', error);
    }
  };

  const loadStories = async () => {
    try {
      const result = await rpc.listStories();
      setStories(result.stories);
      if (result.stories.length > 0) {
        setSelectedStory(result.stories[0].id);
      }
    } catch (error) {
      console.error('Erro ao carregar histórias:', error);
    }
  };

  useEffect(() => {
    const init = async () => {
      await Promise.all([loadRooms(), loadStories()]);
      setLoading(false);
    };
    init();

    const interval = setInterval(loadRooms, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim() || !selectedStory) return;

    setCreating(true);
    try {
      const result = await rpc.createRoom(newRoomName.trim(), selectedStory);
      onJoinRoom(result.roomId);
    } catch (error) {
      console.error('Erro ao criar sala:', error);
      alert('Erro ao criar sala');
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground font-sans">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">Carregando informações do reino...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 bg-background text-foreground font-sans">
      <div className="max-w-7xl mx-auto py-8 animate-fade-in">
        <div className="flex justify-between items-center mb-8 border-b-2 border-border pb-4">
          <div>
            <h1 className="text-4xl font-serif text-primary">Taverna</h1>
            <p className="text-lg text-muted-foreground">Bem-vindo, <span className="font-semibold text-accent">{playerName}</span>!</p>
          </div>
          <Button variant="outline" onClick={onLogout} className="bg-transparent border border-border rounded-md hover:bg-primary/10 hover:text-primary">
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Create New Room */}
          <Card className="bg-card/80 backdrop-blur-sm border border-border rounded-lg shadow-lg animate-slide-in-left">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl text-primary">
                <Plus className="w-6 h-6" />
                Criar Nova Missão
              </CardTitle>
              <CardDescription>Comece uma nova jornada</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateRoom} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="roomName" className="text-sm font-medium text-muted-foreground px-1">
                    Nome da Missão
                  </label>
                  <Input
                    id="roomName"
                    placeholder='Ex: A Caverna do Dragão'
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    maxLength={30}
                    className="w-full bg-input border border-border rounded-md h-11 px-4 text-base focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="story" className="text-sm font-medium text-muted-foreground px-1">
                    História
                  </label>
                  <select
                    id="story"
                    className="w-full bg-input border border-border rounded-md h-11 px-3 py-2 text-base ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                    value={selectedStory}
                    onChange={(e) => setSelectedStory(e.target.value)}
                  >
                    {stories.map((story) => (
                      <option key={story.id} value={story.id} className="bg-background text-foreground">
                        {story.title}
                      </option>
                    ))}
                  </select>
                  {stories.find((s) => s.id === selectedStory)?.description && (
                    <p className="text-xs text-muted-foreground pt-1 px-1">
                      {stories.find((s) => s.id === selectedStory)?.description}
                    </p>
                  )}
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 text-base font-bold bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-all duration-300 disabled:opacity-50"
                  disabled={!newRoomName.trim() || creating}
                >
                  {creating ? 'Criando...' : 'Criar e Entrar'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Available Rooms */}
          <Card className="bg-card/80 backdrop-blur-sm border border-border rounded-lg shadow-lg animate-slide-in-right">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2 text-2xl text-primary">
                  <BookOpen className="w-6 h-6" />
                  Missões Disponíveis
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={loadRooms} className="text-muted-foreground hover:text-primary">
                  <RefreshCw className="w-5 h-5" />
                </Button>
              </div>
              <CardDescription>Junte-se a uma aventura em andamento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-2">
                {rooms.length === 0 ? (
                  <div className="text-center text-muted-foreground py-16">
                    <p>Nenhuma missão disponível.</p>
                    <p className="text-sm">Crie uma e chame seus companheiros!</p>
                  </div>
                ) : (
                  rooms.map((room) => (
                    <Card
                      key={room.id}
                      className="cursor-pointer bg-card/50 hover:bg-primary/10 border border-border hover:border-primary/50 transition-all duration-200 group animate-pop-in"
                      onClick={() => onJoinRoom(room.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">{room.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {room.storyTitle}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge variant="secondary" className="flex items-center gap-1.5 bg-secondary text-secondary-foreground">
                              <Users className="w-4 h-4" />
                              {room.playerCount}
                            </Badge>
                            <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-1" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

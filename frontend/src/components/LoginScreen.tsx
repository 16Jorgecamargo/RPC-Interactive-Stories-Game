import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface LoginScreenProps {
  onLogin: (playerName: string) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onLogin(name.trim());
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background text-foreground font-sans">
      <div className="w-full max-w-md bg-card/80 backdrop-blur-sm border border-border rounded-lg shadow-lg shadow-black/20 p-8 animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-serif text-primary">Contos Interativos</h1>
          <p className="text-muted-foreground mt-2">Aventuras cooperativas em um mundo de fantasia</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium text-muted-foreground px-1">
              Nome do Aventureiro
            </label>
            <Input
              id="name"
              type="text"
              placeholder='Seu nome'
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={20}
              autoFocus
              className="w-full bg-input border border-border rounded-md h-12 px-4 text-lg focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <Button type="submit" className="w-full h-12 text-lg font-bold bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-all duration-300 disabled:opacity-50">
            Entrar
          </Button>
        </form>
      </div>
    </div>
  );
}

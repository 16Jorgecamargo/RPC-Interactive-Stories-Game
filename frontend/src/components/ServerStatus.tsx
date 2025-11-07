import { useEffect, useState } from 'react';

export function ServerStatus() {
  const [isOnline, setIsOnline] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        const response = await fetch('/rpc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'listStories',
            id: 'ping',
          }),
        });
        setIsOnline(response.ok);
      } catch {
        setIsOnline(false);
      }
    };

    // Verificar imediatamente
    checkServerStatus();

    // Verificar a cada 5 segundos
    const interval = setInterval(checkServerStatus, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div
        className="relative"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2 shadow-lg cursor-default">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              isOnline ? 'bg-green-500' : 'bg-gray-500'
            } ${isOnline ? 'animate-pulse' : ''}`}
          />
          <span className="text-sm font-medium">
            {isOnline ? 'Conectado' : 'Desconectado'}
          </span>
        </div>

        {/* Tooltip */}
        {showTooltip && (
          <div className="absolute bottom-full left-0 mb-2 px-3 py-1.5 bg-popover text-popover-foreground text-xs rounded-md shadow-md whitespace-nowrap border border-border">
            Status de conexão com o servidor
            <div className="absolute top-full left-4 -mt-1 border-4 border-transparent border-t-popover" />
          </div>
        )}
      </div>
    </div>
  );
}

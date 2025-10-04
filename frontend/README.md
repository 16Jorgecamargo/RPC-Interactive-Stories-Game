# Cliente Frontend - RPC Interactive Stories

Cliente frontend estático para o sistema de histórias interativas multiplayer.

## 🚀 Instalação e Execução

### 1. Instalar Dependências
```bash
cd frontend
npm install
```

### 2. Configurar Ambiente
O arquivo `.env` já está configurado para conectar ao servidor remoto:
```env
SERVER_URL=http://173.249.60.72:8443
PORT=5173
```

### 3. Executar Servidor de Desenvolvimento
```bash
npm run dev
```

O servidor local será iniciado em `http://localhost:5173`

## 📁 Estrutura do Projeto

```
frontend/
├── src/
│   ├── rpc/
│   │   └── client.js              # Cliente RPC HTTP
│   ├── services/                  # Serviços de comunicação
│   ├── ui/                        # Módulos de interface
│   │   ├── auth/                  # Login e registro
│   │   ├── characters/            # Personagens
│   │   ├── sessions/              # Sessões de jogo
│   │   ├── game/                  # Interface do jogo
│   │   ├── chat/                  # Sistema de chat
│   │   ├── admin/                 # Painel admin
│   │   └── shared/                # Componentes compartilhados
│   ├── styles/                    # Estilos CSS
│   ├── assets/                    # Imagens e ícones
│   ├── utils/
│   │   └── auth.js                # Utilitários de autenticação
│   └── server.js                  # Servidor Express local
├── public/                        # Páginas HTML
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   └── home.html
├── .env                           # Configuração
├── example.env                    # Exemplo de configuração
├── package.json
└── README.md
```

## 🔌 Comunicação com Servidor

O cliente usa **JSON-RPC 2.0 puro** para comunicação:

```javascript
import RpcClient from './rpc/client.js';

const client = new RpcClient('http://173.249.60.72:8443');

// Login
const response = await client.call('login', {
  username: 'usuario1',
  password: 'senha123'
});

// Usar token em chamadas subsequentes
const sessions = await client.call('listMySessions', {
  token: response.token
});
```

## 🎮 Fluxo de Uso

1. **Registro/Login**: Usuário cria conta ou faz login
2. **Criar Personagem**: Cria personagem D&D com atributos e background
3. **Criar/Entrar Sessão**: Cria nova sessão ou entra em existente
4. **Jogar**: Vota em opções, participa de combates, interage com chat
5. **Admin** (se role === ADMIN): Gerencia usuários e sessões

## 🔐 Autenticação

- Token JWT armazenado em `localStorage`
- Token incluído em todas as chamadas RPC (exceto `login`, `register`, `health`)
- Token expira após 24 horas
- Páginas protegidas verificam autenticação com `requireAuth()`

## 🌐 Servidor Remoto

Por padrão, o cliente se conecta ao servidor VPS:
- **URL**: `http://173.249.60.72:8443`
- **Endpoint RPC**: `POST /rpc`
- **Documentação Swagger**: `http://173.249.60.72:8443/docs`

## 📚 Documentação Adicional

- [SRS Completo](../SRS/)
- [API Reference](../SRS/07-apis-rpc.md)
- [Cronograma Frontend](../SRS/13-cronograma-frontend.md)

# 9. Estrutura de Arquivos

## 9.1 Arquitetura de Projetos Separados

O sistema utiliza **dois repositórios independentes**:

### **Repositório Servidor (VPS + Docker)**
```
historias-interativas-servidor/
├── src/
│   ├── rpc/
│   │   ├── handlers/
│   │   │   ├── rpc_methods/            # Métodos RPC organizados por domínio
│   │   │   │   ├── auth_methods.ts     # register, login, me, validateToken
│   │   │   │   ├── health_methods.ts   # health
│   │   │   │   ├── users_methods.ts    # listUsers, getUser
│   │   │   │   ├── characters_methods.ts # createCharacter, listCharacters
│   │   │   │   ├── sessions_methods.ts  # createSession, joinSession
│   │   │   │   ├── stories_methods.ts   # listStories, getStory
│   │   │   │   ├── game_methods.ts      # vote, getGameState
│   │   │   │   ├── chat_methods.ts      # sendMessage, getMessages
│   │   │   │   ├── admin_methods.ts     # promoteUser, deleteSession
│   │   │   │   └── index.ts            # Exporta methodRegistry combinado
│   │   │   ├── wrappers/               # Wrappers REST para Swagger UI
│   │   │   │   ├── auth_wrappers.ts    # /rpc/register, /rpc/login, /rpc/me
│   │   │   │   ├── health_wrappers.ts  # /health
│   │   │   │   ├── users_wrappers.ts   # /rpc/users/*
│   │   │   │   ├── characters_wrappers.ts # /rpc/characters/*
│   │   │   │   ├── sessions_wrappers.ts # /rpc/sessions/*
│   │   │   │   └── index.ts            # Registra todos os wrappers
│   │   │   ├── jsonrpc_handler.ts      # Handler principal RPC (POST /rpc)
│   │   │   └── swagger_wrapper_handler.ts # Coordenador de wrappers
│   │   ├── openapi/                    # OpenAPI Registry modular
│   │   │   ├── paths/
│   │   │   │   ├── auth_paths.ts       # Documentação endpoints auth
│   │   │   │   ├── rpc_paths.ts        # Documentação endpoint RPC genérico
│   │   │   │   ├── health_paths.ts     # Documentação health
│   │   │   │   ├── users_paths.ts      
│   │   │   │   ├── characters_paths.ts 
│   │   │   │   └── sessions_paths.ts   
│   │   │   └── registry.ts             # Registry central
│   │   ├── middleware/
│   │   │   ├── auth.ts                 # Autenticação JWT
│   │   │   ├── validation.ts           # Validação customizada
│   │   │   └── errorHandler.ts         # Tratamento de erros
│   │   └── server.ts                   # Servidor Fastify principal
│   ├── services/
│   │   ├── authService.js
│   │   ├── userService.js
│   │   ├── characterService.js
│   │   ├── sessionService.js
│   │   ├── storyService.js
│   │   ├── gameService.js
│   │   ├── chatService.js
│   │   ├── votingService.js
│   │   ├── notificationService.js
│   │   ├── mermaidParser.js
│   │   └── adminService.js
│   ├── stores/
│   │   ├── userStore.js
│   │   ├── characterStore.js
│   │   ├── sessionStore.js
│   │   ├── storyStore.js
│   │   ├── messageStore.js
│   │   └── eventStore.js
│   ├── models/                         # Schemas Zod com .openapi()
│   │   ├── jsonrpc_schemas.ts          # JSON-RPC 2.0, Health schemas
│   │   ├── auth_schemas.ts             # Register, Login, User schemas
│   │   ├── user_schemas.ts             # User CRUD schemas
│   │   ├── character_schemas.ts        # Character D&D schemas
│   │   ├── session_schemas.ts          # Session, Voting schemas
│   │   ├── story_schemas.ts            # Story, Mermaid schemas
│   │   ├── message_schemas.ts          # Chat message schemas
│   │   └── update_schemas.ts           # Real-time update schemas
│   ├── utils/
│   │   ├── jwt.ts                      # JWT sign/verify
│   │   ├── bcrypt.ts                   # Password hashing
│   │   ├── validators.ts               # Validações customizadas
│   │   └── logger.ts                   # Winston logger
│   └── shared/
│       ├── constants.ts                # Constantes do sistema
│       ├── types.ts                    # TypeScript types
│       └── utils.ts                    # Utilidades gerais
├── stories/
│   ├── caverna-misteriosa.mmd
│   ├── floresta-encantada.mmd
│   └── template-exemplo.mmd
├── Dockerfile              # Imagem Docker
├── docker-compose.yml       # Orquestração Docker
├── .env.production
├── .env.example
├── package.json
├── README.md
└── deploy.sh               # Script de deploy VPS
```

### **Repositório Cliente (GitHub + Local)**
```
historias-interativas-cliente/
├── src/
│   ├── rpc/
│   │   └── client.js           # RPC Client HTTP remoto
│   ├── services/
│   │   ├── authService.js
│   │   ├── gameService.js
│   │   ├── chatService.js
│   │   └── unifiedPollingService.js  # Serviço unificado de long polling
│   ├── ui/
│   │   ├── auth/
│   │   │   ├── login.html
│   │   │   ├── login.js
│   │   │   ├── register.html
│   │   │   └── register.js
│   │   ├── characters/
│   │   │   ├── characterList.html
│   │   │   ├── characterList.js
│   │   │   ├── characterForm.html
│   │   │   └── characterForm.js
│   │   ├── sessions/
│   │   │   ├── sessionList.html
│   │   │   ├── sessionList.js
│   │   │   ├── sessionForm.html
│   │   │   └── sessionForm.js
│   │   ├── game/
│   │   │   ├── gameScreen.html
│   │   │   ├── gameScreen.js
│   │   │   ├── votingPanel.js
│   │   │   └── storyDisplay.js
│   │   ├── chat/
│   │   │   ├── chatPanel.html
│   │   │   ├── chatPanel.js
│   │   │   └── messageList.js
│   │   ├── admin/
│   │   │   ├── adminHome.html
│   │   │   ├── adminHome.js
│   │   │   ├── userManagement.js
│   │   │   ├── sessionManagement.js
│   │   │   └── storyManagement.js
│   │   └── shared/
│   │       ├── navigation.js
│   │       ├── utils.js
│   │       └── constants.js
│   ├── styles/
│   │   ├── main.css
│   │   ├── auth.css
│   │   ├── game.css
│   │   └── admin.css
│   └── assets/
│       ├── images/
│       └── icons/
├── public/
│   ├── index.html
│   └── favicon.ico
├── server.js                  # Servidor local para desenvolvimento
├── .env.example              # Configuração servidor remoto
├── package.json
├── README.md                 # Instruções para usuários
└── INSTALL.md               # Guia de instalação
```

## 9.2 Descrição dos Componentes

### **Servidor (VPS)**
- **rpc/handlers/rpc_methods/**: Métodos RPC organizados por domínio (auth, health, game, etc.)
- **rpc/handlers/wrappers/**: Wrappers REST para Swagger UI (endpoints de documentação)
- **rpc/openapi/**: Registry OpenAPI modular com paths separados por domínio
- **rpc/middleware/**: Middlewares (autenticação JWT, validação, etc.)
- **services/**: Lógica de negócio completa separada dos handlers
- **stores/**: Persistência de dados (JSON/SQLite)
- **models/**: Schemas Zod com `.openapi()` para validação e documentação automática
- **utils/**: JWT, bcrypt, validators, logger
- **shared/**: Constantes, types, utilidades gerais
- **stories/**: Histórias Mermaid do servidor
- **Dockerfile**: Configuração da imagem Docker
- **docker-compose.yml**: Orquestração de containers
- **deploy.sh**: Automação de deploy

**Benefícios da Arquitetura Modular:**
- ✅ **Escalabilidade**: Fácil adicionar novos métodos RPC sem arquivos gigantes
- ✅ **Manutenibilidade**: Cada domínio (auth, characters, sessions) tem seu arquivo
- ✅ **Separação de Responsabilidades**: Methods, Wrappers, OpenAPI Paths separados
- ✅ **Facilita Trabalho em Equipe**: Desenvolvedores podem trabalhar em módulos diferentes sem conflitos

### **Cliente (Local)**
- **rpc/**: Cliente HTTP para servidor remoto
- **services/**: Camada de comunicação com servidor
- **ui/**: Interface HTML/CSS/JS modular
- **styles/**: CSS organizado por módulo
- **assets/**: Recursos estáticos
- **public/**: Arquivos servidos publicamente
- **server.js**: Servidor local de desenvolvimento (Express)

## 9.3 Dependências do Servidor

```json
{
  "dependencies": {
    "fastify": "^5.0.0",
    "@fastify/swagger": "^9.0.0",
    "@fastify/swagger-ui": "^5.0.0",
    "fastify-type-provider-zod": "^4.0.0",
    "zod": "^3.23.0",
    "bcrypt": "^5.1.1",
    "jsonwebtoken": "^9.0.2"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "tsx": "^4.0.0",
    "@types/node": "^20.0.0"
  }
}
```

## 9.4 Configuração de Ambientes

### **Servidor (.env.production)**
```env
NODE_ENV=production
PORT=8443
JWT_SECRET=your-secret-key
CORS_ORIGIN=*
LOG_LEVEL=info
SWAGGER_ENABLED=true
```

### **Cliente (.env)**
```env
VITE_SERVER_URL=http://173.249.60.72:8443
VITE_WS_URL=ws://173.249.60.72:8443
DEV_PORT=5173
```

## 9.5 Exemplo de Schema Zod

```typescript
import { z } from "zod";

export const LoginSchema = z.object({
  username: z.string().min(3).max(20).openapi({ example: "usuario1", description: "Nome de usuário" }),
  password: z.string().min(6).openapi({ example: "senha123", description: "Senha do usuário" })
});

export const LoginResponseSchema = z.object({
  token: z.string().openapi({
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    description: "JWT token de autenticação"
  }),
  user: z.object({
    id: z.string().uuid(),
    username: z.string(),
    role: z.enum(["USER", "ADMIN"])
  }),
  expiresIn: z.number().openapi({ example: 86400, description: "Tempo de expiração em segundos (24h)" })
});

export const CharacterSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(50).openapi({ example: "Thorin Escudo-de-Carvalho", description: "Nome do personagem" }),
  race: z.enum(["Humano", "Elfo", "Anão", "Halfling"]),
  class: z.enum(["Guerreiro", "Mago", "Ladino", "Clérigo"]),
  attributes: z.object({
    strength: z.number().min(1).max(20),
    dexterity: z.number().min(1).max(20),
    constitution: z.number().min(1).max(20),
    intelligence: z.number().min(1).max(20),
    wisdom: z.number().min(1).max(20),
    charisma: z.number().min(1).max(20)
  }).openapi({
    example: { strength: 16, dexterity: 12, constitution: 14, intelligence: 10, wisdom: 13, charisma: 8 },
    description: "Atributos D&D do personagem"
  }),
  background: z.string().min(10).openapi({
    example: "Guerreiro anão exilado em busca de redenção...",
    description: "História de background"
  }),
  userId: z.string().uuid(),
  sessionId: z.string().uuid(),
  isComplete: z.boolean()
});
```

## 9.6 Configurações Docker

### **Dockerfile (Servidor)**
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install --production

# Copy source code
COPY src/ ./src/
COPY stories/ ./stories/

# Create necessary directories
RUN mkdir -p logs data

# Expose port
EXPOSE 8443

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8443/health || exit 1

# Start server
CMD ["node", "src/server.js"]
```

### **docker-compose.yml (Desenvolvimento)**
```yaml
version: '3.8'
services:
  historias-server:
    build: .
    ports:
      - "8443:8443"
    environment:
      - NODE_ENV=production
      - PORT=8443
      - JWT_SECRET=${JWT_SECRET}
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8443/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## 9.7 Comandos de Execução

### **Servidor (VPS)**
```bash
# Build e deploy
docker build -t historias-server .
docker run -d -p 8443:8443 \
  --name historias-container \
  --restart unless-stopped \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/logs:/app/logs \
  historias-server

# Monitoramento
docker ps
docker logs historias-container
docker stats historias-container
```

### **Cliente (Local)**
```bash
# Setup do usuário
git clone https://github.com/seu-repo/historias-interativas-cliente
cd historias-interativas-cliente
npm install
npm start  # Abre browser em localhost:5173
```

---

[← Anterior: Validação Zod](./08-validacao-zod.md) | [Voltar ao Menu](./README.md) | [Próximo: Casos de Uso →](./10-casos-de-uso.md)
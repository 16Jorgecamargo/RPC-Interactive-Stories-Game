# 9. Estrutura de Arquivos

## 9.1 Arquitetura de Projetos Separados

O sistema utiliza **dois repositórios independentes**:

### **🖥️ Repositório Servidor (VPS + Docker)**
```
historias-interativas-servidor/
├── src/
│   ├── rpc/
│   │   ├── handlers/
│   │   │   ├── auth.js
│   │   │   ├── users.js
│   │   │   ├── characters.js
│   │   │   ├── sessions.js
│   │   │   ├── stories.js
│   │   │   ├── game.js
│   │   │   ├── chat.js
│   │   │   └── admin.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   ├── validation.js
│   │   │   ├── cors.js
│   │   │   └── errorHandler.js
│   │   └── server.js
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
│   ├── models/
│   │   ├── User.js
│   │   ├── Character.js
│   │   ├── Session.js
│   │   ├── Story.js
│   │   ├── Message.js
│   │   ├── Vote.js
│   │   └── Update.js
│   ├── utils/
│   │   ├── jwt.js
│   │   ├── bcrypt.js
│   │   ├── validators.js
│   │   └── logger.js
│   ├── swagger/
│   │   ├── swaggerConfig.js
│   │   └── swaggerSchemas.js
│   └── shared/
│       ├── schemas.js
│       ├── constants.js
│       ├── types.js
│       └── utils.js
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

### **💻 Repositório Cliente (GitHub + Local)**
```
historias-interativas-cliente/
├── src/
│   ├── rpc/
│   │   └── client.js           # RPC Client HTTP remoto
│   ├── services/
│   │   ├── authService.js
│   │   ├── gameService.js
│   │   ├── chatService.js
│   │   └── pollingService.js
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
│   │   │   ├── adminDashboard.html
│   │   │   ├── adminDashboard.js
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

### **🖥️ Servidor (VPS)**
- **rpc/**: Servidor RPC + CORS para acesso remoto
- **services/**: Lógica de negócio completa
- **stores/**: Persistência de dados (JSON/SQLite)
- **models/**: Tipos e validações
- **utils/**: Autenticação JWT, logging
- **swagger/**: Documentação automática
- **shared/**: Schemas compartilhados
- **stories/**: Histórias Mermaid do servidor
- **Dockerfile**: Configuração da imagem Docker
- **docker-compose.yml**: Orquestração de containers
- **deploy.sh**: Automação de deploy

### **💻 Cliente (Local)**
- **rpc/**: Cliente HTTP para servidor remoto
- **services/**: Camada de comunicação com servidor
- **ui/**: Interface HTML/CSS/JS modular
- **styles/**: CSS organizado por módulo
- **assets/**: Recursos estáticos
- **public/**: Arquivos servidos publicamente
- **server.js**: Servidor local de desenvolvimento (Express)

## 9.3 Configuração de Ambientes

### **Servidor (.env.production)**
```env
NODE_ENV=production
PORT=8443
JWT_SECRET=your-secret-key
CORS_ORIGIN=*
LOG_LEVEL=info
```

### **Cliente (.env)**
```env
VITE_SERVER_URL=http://173.249.60.72:8443
VITE_WS_URL=ws://173.249.60.72:8443
DEV_PORT=5173
```

## 9.4 Configurações Docker

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

## 9.5 Comandos de Execução

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
# 15. Deploy Distribuído

## 15.1 Visão Geral

O sistema utiliza arquitetura **cliente-servidor distribuída** com:

- **🖥️ Servidor**: VPS em produção rodando com Docker (containerizado 24/7)
- **💻 Cliente**: Aplicação local baixada do GitHub pelos usuários

## 15.2 Deploy do Servidor (VPS)

### Pré-requisitos da VPS

**Dados da VPS:**
- **IP**: `173.249.60.72`
- **User**: `root`
- **Access**: SSH configurado

```bash
# Conectar via SSH
ssh root@173.249.60.72

# Sistema Ubuntu 20.04+ LTS
sudo apt update && sudo apt upgrade -y

# Node.js v18+ via NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18

# Docker e Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Nginx (opcional - reverse proxy)
sudo apt install nginx -y

# Git
sudo apt install git -y
```

### Setup do Projeto Servidor

```bash
# Clone do repositório servidor
git clone https://github.com/seu-usuario/historias-interativas-servidor
cd historias-interativas-servidor

# Instalação de dependências
npm install --production

# Configuração de ambiente
cp .env.example .env.production
nano .env.production
```

### Arquivo .env.production

```env
NODE_ENV=production
PORT=8443
HOST=0.0.0.0

# JWT
JWT_SECRET=seu-super-secret-key-aqui-muito-seguro-123456789
JWT_EXPIRES_IN=24h

# CORS - Permitir clientes remotos
CORS_ORIGIN=*
CORS_CREDENTIALS=true

# Logs
LOG_LEVEL=info
LOG_FILE=logs/server.log

# Rate Limiting
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# Database/Storage
STORAGE_TYPE=file
STORAGE_PATH=./data
BACKUP_INTERVAL=300000
```

### Configuração Docker

#### Dockerfile
```dockerfile
FROM node:18-alpine

# Instalar dependências do sistema
RUN apk add --no-cache curl

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

WORKDIR /app

# Copy package files
COPY --chown=nodejs:nodejs package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY --chown=nodejs:nodejs src/ ./src/
COPY --chown=nodejs:nodejs stories/ ./stories/

# Create necessary directories
RUN mkdir -p logs data && chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 8443

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8443/health || exit 1

# Start server
CMD ["node", "src/server.js"]
```

#### docker-compose.yml
```yaml
version: '3.8'

services:
  historias-server:
    build: .
    container_name: historias-container
    restart: unless-stopped
    ports:
      - "8443:8443"
    environment:
      - NODE_ENV=production
      - PORT=8443
      - HOST=0.0.0.0
      - JWT_SECRET=${JWT_SECRET}
      - CORS_ORIGIN=*
      - LOG_LEVEL=info
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8443/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - historias-network

networks:
  historias-network:
    driver: bridge
```

### Deploy e Execução

#### Método 1: Docker Compose (Recomendado)
```bash
# Criar diretórios necessários
mkdir -p logs data

# Deploy com docker-compose
docker-compose up -d

# Verificar status
docker-compose ps
docker-compose logs -f
```

#### Método 2: Docker tradicional
```bash
# Build da imagem
docker build -t historias-server .

# Executar container
docker run -d \
  --name historias-container \
  --restart unless-stopped \
  -p 8443:8443 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/logs:/app/logs \
  --env-file .env.production \
  historias-server

# Verificar status
docker ps
docker logs historias-container
```

### Configuração Firewall

```bash
# UFW (Ubuntu)
sudo ufw allow 22      # SSH
sudo ufw allow 80      # HTTP
sudo ufw allow 443     # HTTPS
sudo ufw allow 8443    # RPC Server
sudo ufw enable

# Verificar
sudo ufw status
```

### Nginx (Opcional - Reverse Proxy)

```nginx
# /etc/nginx/sites-available/historias-server
server {
    listen 80;
    server_name 173.249.60.72;  # IP da VPS

    location / {
        proxy_pass http://localhost:8443;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # CORS headers
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
        add_header Access-Control-Allow-Headers "Content-Type, Authorization";
    }
}
```

```bash
# Ativar site
sudo ln -s /etc/nginx/sites-available/historias-server /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 15.3 Cliente Local (Usuários)

### Estrutura do README do Cliente

```markdown
# Histórias Interativas - Cliente

Sistema de histórias interativas multijogador com votação colaborativa.

## 🚀 Instalação e Uso

### Pré-requisitos
- Node.js 16+
- npm ou yarn
- Browser moderno

### Setup Rápido
```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/historias-interativas-cliente
cd historias-interativas-cliente

# 2. Instale dependências
npm install

# 3. Configure o servidor
cp .env.example .env
nano .env  # Configurar URL do servidor

# 4. Execute o cliente
npm start
```

O browser abrirá automaticamente em `http://localhost:5173`

### Configuração (.env)
```env
# URL do servidor remoto
VITE_SERVER_URL=http://173.249.60.72:8443

# Porta local do cliente
DEV_PORT=5173
```

### Troubleshooting

**Erro de conexão?**
- Verifique se o servidor está rodando
- Confirme a URL no arquivo `.env`
- Teste: `curl http://173.249.60.72:8443/health`

**CORS Error?**
- Servidor pode estar bloqueando origem
- Contate administrador do sistema
```

### Script package.json do Cliente

```json
{
  "name": "historias-interativas-cliente",
  "version": "1.0.0",
  "scripts": {
    "start": "node server.js && open http://localhost:5173",
    "dev": "node server.js",
    "check-server": "curl $VITE_SERVER_URL/health || echo 'Servidor inacessível'"
  },
  "dependencies": {
    "express": "^4.18.0",
    "open": "^8.4.0"
  }
}
```

### Servidor Local do Cliente

```javascript
// server.js
const express = require('express');
const path = require('path');
const open = require('open');

const app = express();
const PORT = process.env.DEV_PORT || 5173;

// Servir arquivos estáticos
app.use(express.static('public'));
app.use('/src', express.static('src'));
app.use('/assets', express.static('assets'));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(PORT, () => {
  console.log(`🎮 Cliente rodando em http://localhost:${PORT}`);
  console.log(`🔗 Conectando ao servidor: ${process.env.VITE_SERVER_URL}`);

  // Abrir browser automaticamente
  if (process.env.NODE_ENV !== 'production') {
    open(`http://localhost:${PORT}`);
  }
});
```

## 15.4 Configuração RPC Remota

### Cliente RPC

```javascript
// src/rpc/client.js
class RPCClient {
  constructor() {
    this.serverUrl = process.env.VITE_SERVER_URL || 'http://173.249.60.72:8443';
    this.timeout = 10000; // 10s timeout
  }

  async call(method, params = {}) {
    const payload = {
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params
    };

    try {
      const response = await fetch(`${this.serverUrl}/rpc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.getAuthToken()
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (result.error) {
        throw new Error(result.error.message);
      }

      return result.result;
    } catch (error) {
      console.error('RPC Error:', error);
      throw error;
    }
  }

  getAuthToken() {
    return localStorage.getItem('auth_token') || '';
  }
}

// Instância global
window.rpcClient = new RPCClient();
```

### Servidor RPC com CORS

```javascript
// src/rpc/middleware/cors.js
const cors = require('cors');

const corsOptions = {
  origin: process.env.CORS_ORIGIN === '*' ? true : process.env.CORS_ORIGIN?.split(','),
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept'
  ],
  optionsSuccessStatus: 200
};

module.exports = cors(corsOptions);
```

## 15.5 Monitoramento e Manutenção

### Comandos Docker Essenciais

#### Docker Compose
```bash
# Status dos containers
docker-compose ps

# Logs em tempo real
docker-compose logs -f --tail=50

# Reiniciar aplicação
docker-compose restart

# Rebuild e restart
docker-compose up -d --build

# Parar todos os serviços
docker-compose down

# Ver métricas de uso
docker-compose exec historias-server docker stats
```

#### Docker Tradicional
```bash
# Status dos containers
docker ps

# Logs em tempo real
docker logs -f --tail=50 historias-container

# Reiniciar container
docker restart historias-container

# Informações detalhadas
docker inspect historias-container

# Executar comandos no container
docker exec -it historias-container /bin/sh

# Métricas de uso
docker stats historias-container
```

### Scripts de Backup

```bash
#!/bin/bash
# backup.sh
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/home/usuario/backups"

# Criar backup dos dados
mkdir -p $BACKUP_DIR
tar -czf $BACKUP_DIR/historias_data_$DATE.tar.gz ./data

# Manter apenas últimos 7 backups
cd $BACKUP_DIR
ls -t historias_data_*.tar.gz | tail -n +8 | xargs -r rm

echo "Backup criado: historias_data_$DATE.tar.gz"
```

### Health Check Endpoint

```javascript
// src/rpc/handlers/health.js
const healthCheck = {
  async ping() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0'
    };
  }
};

module.exports = healthCheck;
```

### Logs Estruturados

```javascript
// src/utils/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: 'logs/combined.log'
    })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

module.exports = logger;
```

## 15.6 Atualizações e Deploy Contínuo

### Script de Update do Servidor

#### Com Docker Compose
```bash
#!/bin/bash
# update.sh
echo "🔄 Atualizando servidor..."

# Backup dos dados
./backup.sh

# Update do código
git pull origin main

# Rebuild e deploy sem downtime
docker-compose pull
docker-compose up -d --build

echo "✅ Servidor atualizado!"
```

#### Com Docker Tradicional
```bash
#!/bin/bash
# update.sh
echo "🔄 Atualizando servidor..."

# Backup dos dados
./backup.sh

# Update do código
git pull origin main

# Build nova imagem
docker build -t historias-server:latest .

# Rolling update (sem downtime)
docker stop historias-container
docker rm historias-container
docker run -d \
  --name historias-container \
  --restart unless-stopped \
  -p 8443:8443 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/logs:/app/logs \
  --env-file .env.production \
  historias-server:latest

echo "✅ Servidor atualizado!"
```

### Update do Cliente (Usuários)

```bash
# Os usuários fazem:
cd historias-interativas-cliente
git pull origin main
npm install
npm start
```

---

[← Anterior: Critérios de Aceitação](./14-criterios-aceitacao.md) | [Voltar ao Menu](./README.md)
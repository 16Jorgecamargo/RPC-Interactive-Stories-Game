# 11. Tratamento de Erros

## 11.1 Erros de Autenticação e Autorização

### Erro de Token Inválido
- **Código**: `AUTH_INVALID_TOKEN`
- **Descrição**: Token JWT inválido ou expirado
- **Tratamento**: Redirecionar para login
- **Resposta HTTP**: 401 Unauthorized

### Erro de Permissão Insuficiente
- **Código**: `AUTH_INSUFFICIENT_PERMISSION`
- **Descrição**: Usuário não tem permissão para ação (ex: usuário tentando acessar função admin)
- **Tratamento**: Exibir mensagem de erro
- **Resposta HTTP**: 403 Forbidden

### Erro de Credenciais Inválidas
- **Código**: `AUTH_INVALID_CREDENTIALS`
- **Descrição**: Usuário/senha incorretos no login
- **Tratamento**: Exibir mensagem de erro
- **Resposta HTTP**: 401 Unauthorized

## 11.2 Erros de Rede e RPC

### Timeout de Conexão RPC
- **Código**: `RPC_TIMEOUT`
- **Descrição**: Chamada RPC excedeu tempo limite
- **Tratamento**: Retry automático (máx 3x), depois exibir erro
- **Resposta**: Erro de timeout

### Falhas em Polling RPC
- **Código**: `RPC_POLLING_FAILED`
- **Descrição**: Erro no polling de atualizações
- **Tratamento**: Backoff exponencial, reconexão automática
- **Resposta**: Erro de conexão

### Erro de Formato RPC
- **Código**: `RPC_INVALID_FORMAT`
- **Descrição**: Payload RPC mal formado
- **Tratamento**: Log do erro, retorno de erro de validação
- **Resposta HTTP**: 400 Bad Request

## 11.3 Erros de Validação

### Dados Inválidos (Zod)
- **Código**: `VALIDATION_ERROR`
- **Descrição**: Dados não passam na validação Zod
- **Tratamento**: Retornar erros específicos de campo
- **Resposta HTTP**: 400 Bad Request

### Nome de Usuário Duplicado
- **Código**: `USER_ALREADY_EXISTS`
- **Descrição**: Tentativa de cadastro com usuário existente
- **Tratamento**: Exibir mensagem específica
- **Resposta HTTP**: 409 Conflict

### Sessão Inexistente
- **Código**: `SESSION_NOT_FOUND`
- **Descrição**: Tentativa de acessar sessão que não existe
- **Tratamento**: Redirecionar para lista de sessões
- **Resposta HTTP**: 404 Not Found

### Personagem Já em Sessão
- **Código**: `CHARACTER_ALREADY_IN_SESSION`
- **Descrição**: Tentativa de adicionar personagem que já está em outra sessão
- **Tratamento**: Exibir mensagem de erro
- **Resposta HTTP**: 409 Conflict

## 11.4 Erros de Estado do Jogo

### Votar Quando Não Há Opções
- **Código**: `GAME_NO_OPTIONS_AVAILABLE`
- **Descrição**: Tentativa de votar em capítulo sem opções
- **Tratamento**: Desabilitar interface de votação
- **Resposta HTTP**: 400 Bad Request

### Entrar em Sessão Cheia
- **Código**: `SESSION_FULL`
- **Descrição**: Tentativa de entrar em sessão com limite de jogadores atingido
- **Tratamento**: Exibir mensagem explicativa
- **Resposta HTTP**: 409 Conflict

### Operações em Sessão Finalizada
- **Código**: `SESSION_COMPLETED`
- **Descrição**: Tentativa de ação em sessão que já foi concluída
- **Tratamento**: Redirecionar para tela de resultados
- **Resposta HTTP**: 409 Conflict

### Voto Duplicado
- **Código**: `VOTE_ALREADY_CAST`
- **Descrição**: Personagem já votou na rodada atual
- **Tratamento**: Desabilitar botão de voto
- **Resposta HTTP**: 409 Conflict

## 11.5 Erros de Histórias e Mermaid

### Erro de Parse Mermaid
- **Código**: `MERMAID_PARSE_ERROR`
- **Descrição**: Código Mermaid inválido ou mal formado
- **Tratamento**: Exibir detalhes do erro para correção
- **Resposta HTTP**: 400 Bad Request

### História Não Encontrada
- **Código**: `STORY_NOT_FOUND`
- **Descrição**: Tentativa de usar história inexistente
- **Tratamento**: Redirecionar para lista de histórias
- **Resposta HTTP**: 404 Not Found

### Estrutura de História Inválida
- **Código**: `STORY_INVALID_STRUCTURE`
- **Descrição**: História não atende aos requisitos estruturais
- **Tratamento**: Exibir erros específicos de validação
- **Resposta HTTP**: 400 Bad Request

## 11.6 Erros do Sistema

### Erro Interno do Servidor
- **Código**: `INTERNAL_SERVER_ERROR`
- **Descrição**: Erro não tratado no servidor
- **Tratamento**: Log completo, mensagem genérica para usuário
- **Resposta HTTP**: 500 Internal Server Error

### Recurso Não Encontrado
- **Código**: `RESOURCE_NOT_FOUND`
- **Descrição**: Endpoint ou recurso inexistente
- **Tratamento**: Exibir mensagem de recurso não encontrado
- **Resposta HTTP**: 404 Not Found

### Limite de Rate Exceeded
- **Código**: `RATE_LIMIT_EXCEEDED`
- **Descrição**: Muitas requisições em pouco tempo
- **Tratamento**: Backoff automático, mensagem de espera
- **Resposta HTTP**: 429 Too Many Requests

## 11.7 Estratégias de Recuperação

### Reconexão Automática
- Implementar backoff exponencial para polling
- Máximo de 3 tentativas de reconexão
- Notificar usuário sobre problemas de conectividade

### Retry de Operações Críticas
- Operações de salvamento com retry automático
- Operações de votação com confirmação
- Chat com retry em caso de falha

### Fallbacks
- Cache local de dados quando possível
- Modo offline limitado para visualização
- Mensagens em fila para reenvio

### Logging e Monitoramento
- Log detalhado de todos os erros
- Métricas de erro por tipo
- Alertas para erros críticos
- Painel de saúde do sistema

---

[← Anterior: Casos de Uso](./10-casos-de-uso.md) | [Voltar ao Menu](./README.md) | [Próximo: Considerações de Implementação →](./12-consideracoes-implementacao.md)
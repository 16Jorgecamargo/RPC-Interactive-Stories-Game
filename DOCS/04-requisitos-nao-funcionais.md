# 4. Requisitos Não Funcionais

## RNF01 - Performance
**Descrição**: O sistema deve responder rapidamente a requisições RPC.
- **Critério**: Requisições RPC devem responder em menos de 100ms (exceto waitForEvents)
- **Justificativa**: Garantir boa experiência de usuário
- **Prioridade**: Alta

## RNF02 - Concorrência
**Descrição**: O sistema deve suportar múltiplas salas simultâneas.
- **Critério**: Suportar pelo menos 10 salas ativas simultaneamente com 5 jogadores cada
- **Justificativa**: Permitir múltiplos grupos jogando ao mesmo tempo
- **Prioridade**: Alta

## RNF03 - Escalabilidade de Eventos
**Descrição**: Sistema de eventos deve lidar com múltiplos clients em polling.
- **Critério**: Suportar até 50 clients em waitForEvents simultâneos
- **Justificativa**: Permitir salas grandes e múltiplas salas
- **Prioridade**: Média

## RNF04 - Timeout de Long Polling
**Descrição**: waitForEvents deve ter timeout razoável.
- **Critério**: Timeout de 30 segundos para evitar bloqueio indefinido
- **Justificativa**: Evitar conexões travadas, permitir reconexão
- **Prioridade**: Alta

## RNF05 - Validação de Dados
**Descrição**: Todos dados de entrada devem ser validados.
- **Critério**: 100% dos parâmetros RPC validados com Zod antes do processamento
- **Justificativa**: Segurança e consistência de dados
- **Prioridade**: Alta

## RNF06 - Tratamento de Erros
**Descrição**: Erros devem ser tratados e retornados adequadamente.
- **Critério**: Todos erros devem retornar códigos JSON-RPC 2.0 padronizados
- **Justificativa**: Facilitar debug e integração com clientes
- **Prioridade**: Alta

## RNF07 - Sistema de Logging Agregado
**Descrição**: Sistema deve logar atividades de salas com agregação temporal.

**Critério**:
- Utiliza Pino com formatação customizada (pino-pretty em desenvolvimento)
- Loggers específicos: `roomLogger`, `storyLogger`, `rpcLogger`
- **Agregação de eventos**: Buffer de 2 segundos agrupa atividades relacionadas da mesma sala
- **Logs consolidados**: Uma única linha resume múltiplas ações sequenciais
- Contexto estruturado (JSON) para análise posterior
- Flush automático ou manual de buffers

**Exemplo de Log Agregado**:
```
[RoomManager room=Xkd9_mK2pQz] Sala Aventura (Xkd9_mK2pQz): +2 jogadores entraram: João, Maria | 5 mensagens no chat (João x3, Maria x2) | 3 votos registrados (investigar: 2) | Avanço de card: dentro-caverna
```

**Justificativa**: Reduzir ruído de logs, facilitar debug e monitoramento de sessões completas

**Prioridade**: Alta

**Status**: ✅ **IMPLEMENTADO** - `room-manager.ts`, linhas 32 + 452-681

**Implementação**:
- Buffer de eventos por sala (`roomLogBuffers`)
- Método `recordRoomActivity()` para agregar eventos
- Método `flushRoomActivity()` para gerar logs consolidados
- Flush automático após 2 segundos de inatividade

## RNF08 - CORS
**Descrição**: Backend deve aceitar requisições de diferentes origens.
- **Critério**: CORS habilitado para desenvolvimento local
- **Justificativa**: Permitir frontend rodando em porta diferente
- **Prioridade**: Alta

## RNF09 - Formato JSON-RPC
**Descrição**: Toda comunicação deve seguir especificação JSON-RPC 2.0.
- **Critério**: 100% de conformidade com JSON-RPC 2.0 spec
- **Justificativa**: Padronização e interoperabilidade
- **Prioridade**: Alta

## RNF10 - Tipagem Forte
**Descrição**: Código TypeScript deve ter tipagem completa.
- **Critério**: Zero erros de tipo no build, uso de tipos Zod inferidos
- **Justificativa**: Prevenir bugs em tempo de desenvolvimento
- **Prioridade**: Alta

## RNF11 - Modularização
**Descrição**: Código deve ser modular e bem organizado.
- **Critério**: Separação clara entre:
  - `index.ts`: Entry point e servidor Fastify
  - `json-rpc-server.ts`: Lógica JSON-RPC
  - `room-manager.ts`: Gerenciamento de salas
  - `story-manager.ts`: Gerenciamento de histórias
  - `types.ts`: Tipos e schemas Zod
- **Justificativa**: Facilitar manutenção e testes
- **Prioridade**: Média

## RNF12 - ES Modules
**Descrição**: Projeto deve usar ES Modules (ESM).
- **Critério**: `"type": "module"` no package.json, imports com extensão .js
- **Justificativa**: Padrão moderno do Node.js
- **Prioridade**: Baixa

## RNF13 - Hot Reload em Desenvolvimento
**Descrição**: Servidor deve recarregar automaticamente ao editar código.
- **Critério**: Uso de `tsx watch` para desenvolvimento
- **Justificativa**: Aumentar produtividade de desenvolvimento
- **Prioridade**: Média

## RNF14 - Build para Produção
**Descrição**: Sistema deve ter build otimizado para produção.
- **Critério**: TypeScript compila para JavaScript otimizado
- **Justificativa**: Performance e compatibilidade
- **Prioridade**: Alta

## RNF15 - Limpeza de Memória
**Descrição**: Sistema deve limpar recursos não utilizados.
- **Critério**: Salas sem jogadores devem ser removidas automaticamente
- **Justificativa**: Evitar vazamento de memória
- **Prioridade**: Média
- **Status**: ⚠️ **NÃO IMPLEMENTADO** - Melhoria futura

## RNF16 - Limite de Mensagens Retornadas
**Descrição**: `getGameState` deve limitar quantidade de mensagens retornadas.

**Critério**:
- Retornar últimas **50 mensagens** via `getGameState()` e `joinRoom()`
- Mensagens completas armazenadas em `room.messages` **sem limite** (crescimento ilimitado)
- Utiliza `slice(-50)` para retornar apenas últimas 50

**Justificativa**: Reduzir payload de rede sem implementar GC completo

**Prioridade**: Baixa

**Status**: ✅ **IMPLEMENTADO** - `room-manager.ts`, linha 266

**Observação**:
- Mensagens antigas não são removidas automaticamente da memória
- Salas com milhares de mensagens podem consumir muita RAM
- **Melhoria Futura**: Implementar limite total de mensagens armazenadas (FIFO)

## RNF17 - Limite de Eventos em Memória
**Descrição**: Eventos antigos devem ser removidos automaticamente.

**Critério**:
- Manter apenas últimos **100 eventos** por sala
- Limitação automática via `slice(-100)` ao adicionar novo evento
- FIFO: Eventos mais antigos são descartados automaticamente

**Justificativa**: Prevenir crescimento infinito de memória

**Prioridade**: Baixa

**Status**: ✅ **IMPLEMENTADO** - `room-manager.ts`, linhas 778-781

**Implementação**:
```typescript
// Método addEvent() - room-manager.ts
if (room.events.length > 100) {
  room.events = room.events.slice(-100);
}
```

**Observação**: Long polling funciona com eventos incrementais (lastEventId), então clientes que ficarem offline por muito tempo podem perder eventos antigos.

## RNF18 - Segurança Básica
**Descrição**: Sistema deve ter proteções básicas contra abuso.
- **Critério**:
  - Validação de tamanhos de strings (nomes, mensagens)
  - Sanitização básica de inputs
- **Justificativa**: Prevenir ataques básicos
- **Prioridade**: Média

## RNF19 - Compatibilidade de Navegadores
**Descrição**: Frontend deve funcionar em navegadores modernos.
- **Critério**: Compatível com Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Justificativa**: Suportar navegadores recentes
- **Prioridade**: Média

## RNF20 - Responsividade (Futuro)
**Descrição**: Interface deve ser responsiva para diferentes telas.
- **Critério**: Layout adaptável para desktop, tablet e mobile
- **Justificativa**: Acessibilidade em diferentes dispositivos
- **Prioridade**: Baixa
- **Status**: ⚠️ **NÃO IMPLEMENTADO** - Planejado para versão futura

## Prioridades

### Alta (Crítico)
- RNF01, RNF02, RNF04, RNF05, RNF06, RNF08, RNF09, RNF10, RNF14

### Média (Importante)
- RNF03, RNF07, RNF11, RNF13, RNF15, RNF18, RNF19

### Baixa (Desejável)
- RNF12, RNF16, RNF17, RNF20

---

[← Anterior: Requisitos Funcionais](./03-requisitos-funcionais.md) | [Voltar ao Menu](./README.md) | [Próximo: Arquitetura →](./05-arquitetura.md) 

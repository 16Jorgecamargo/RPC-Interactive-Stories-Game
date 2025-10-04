# 13. Cronograma de Desenvolvimento

Este cronograma foi **separado em dois arquivos** para melhor organização:

## Cronogramas Especializados

### [Cronograma Backend](./13-cronograma-backend.md)
**~196 cards** | Servidor, API, Lógica de Negócio
- Servidor Fastify + Swagger
- Autenticação JWT
- CRUD de usuários, personagens, sessões, histórias
- Sistema de votação com timeout
- Chat via RPC
- Long polling para updates
- Sistema de combate D&D
- Painel administrativo
- Testes e otimizações
- Deploy Docker + VPS

### [Cronograma Frontend](./13-cronograma-frontend.md)
**~237 cards** | Cliente, UI, Integração
- Setup do cliente (Express + HTML/CSS/JS)
- Cliente RPC HTTP
- Telas de autenticação (login, registro)
- Tela Home do usuário
- CRUD de personagens (criação, edição, listagem)
- Criação e gerenciamento de sessões
- Sala de espera com polling
- Tela de jogo completa (timeline, votação, chat, tiles)
- Sistema de combate (interface)
- Painel administrativo (interface)
- Polish e UX (responsividade, loading states)
- Build e distribuição

---

## Dependências Entre Cards

Cards frontend possuem **dependências explícitas** de cards backend. Exemplo:

```
FE-AUTH-003 (Login no frontend)
└── Depende de: BE-AUTH-006 (Endpoint /rpc/login)

FE-GAME-014 (Votar no frontend)
└── Depende de: BE-VOTE-002 (Endpoint /rpc/game/:sessionId/vote)

FE-CHAT-009 (Enviar mensagem no frontend)
└── Depende de: BE-CHAT-003 (Endpoint /rpc/chat/:sessionId/send)
```

**Regra Geral**: Frontend só pode implementar funcionalidade quando endpoint backend correspondente estiver pronto e testado no Swagger UI.

---

## Visão Geral dos Cards

| Área | Backend | Frontend | Total |
|------|---------|----------|-------|
| Setup/Fundação | 22 | 13 | 35 |
| Autenticação | 9 | 21 | 30 |
| Usuários/Personagens | 23 | 31 | 54 |
| Histórias/Sessões | 36 | 34 | 70 |
| Gameplay Core | 26 | 41 | 67 |
| Chat/Real-time | 19 | 13 | 32 |
| Combate | 20 | 35 | 55 |
| Admin | 16 | 20 | 36 |
| Docs/Testes | 21 | 21 | 42 |
| Deploy/Build | 13 | 8 | 21 |
| **TOTAL** | **~196** | **~237** | **~433** |

---

## Estratégia de Desenvolvimento Recomendada

### Opção 1: Backend-First (Recomendado)
1. **Fase 1-2 Backend**: Setup + Autenticação (31 cards)
2. **Fase 1-2 Frontend**: Setup + Autenticação (34 cards)
3. **Fase 3-4 Backend**: Histórias + Gameplay (62 cards)
4. **Fase 3-5 Frontend**: Sessões + Gameplay (75 cards)
5. **Fase 5-7 Backend**: Chat + Admin (51 cards)
6. **Fase 6-9 Frontend**: Chat + Polish (54 cards)
7. **Fase 8-9 Backend**: Docs + Deploy (34 cards)
8. **Fase 10 Frontend**: Build (8 cards)

**Vantagem**: Endpoints prontos permitem testar frontend com dados reais no Swagger UI antes de criar UI.

### Opção 2: Feature-by-Feature
1. **Autenticação completa** (Backend + Frontend)
2. **Personagens completo** (Backend + Frontend)
3. **Sessões completo** (Backend + Frontend)
4. **Gameplay completo** (Backend + Frontend)
5. **Chat completo** (Backend + Frontend)
6. **Combate completo** (Backend + Frontend)
7. **Admin completo** (Backend + Frontend)
8. **Deploy + Build**

**Vantagem**: Funcionalidades completas testáveis end-to-end desde cedo.

### Opção 3: Parallel (Requer coordenação)
Desenvolver backend e frontend em paralelo com comunicação constante sobre contratos de API.

**Vantagem**: Maior velocidade se houver 2+ desenvolvedores.
**Desvantagem**: Requer sincronização frequente de schemas e endpoints.

---

## Metodologia de Trabalho

### Processo de Desenvolvimento
1. **Escolher Card**: Pegar card do cronograma (backend ou frontend)
2. **Verificar Dependências**: Garantir que cards dependentes estão completos
3. **Desenvolver**: Implementar funcionalidade
4. **Testar**:
   - Backend: Testar no Swagger UI
   - Frontend: Testar no browser conectando ao backend
5. **Marcar Completo**: Checar `[x]` no card
6. **Commitar**: Fazer commit com mensagem descritiva
7. **Próximo Card**: Repetir

### Convenções de Commit
```bash
# Backend
feat(be-auth): implementa middleware de validação JWT [BE-AUTH-007]
fix(be-vote): corrige cálculo de empate [BE-VOTE-007]
docs(be-swagger): atualiza descrições dos endpoints [BE-DOC-003]

# Frontend
feat(fe-auth): adiciona tela de login [FE-AUTH-001]
fix(fe-game): corrige atualização de votos [FE-GAME-017]
style(fe-ui): melhora responsividade da home [FE-STYLE-004]
```

### Priorização de Cards
- **P0 (Bloqueante)**: Impede outras funcionalidades (ex: servidor, auth)
- **P1 (Crítico)**: Core do sistema (ex: votação, sessões, gameplay)
- **P2 (Importante)**: Melhora experiência (ex: chat, timer, polish)
- **P3 (Extras)**: Nice-to-have (ex: otimizações avançadas, features extras)

---

## Riscos e Mitigações

### Risco: Dessincronia Backend-Frontend
- **Probabilidade**: Alta
- **Impacto**: Médio
- **Mitigação**: Documentar schemas Zod e manter Swagger UI atualizado
- **Plano B**: Usar contratos de API (JSON schemas) compartilhados

### Risco: Mudanças de API Após Frontend Pronto
- **Probabilidade**: Média
- **Impacto**: Alto
- **Mitigação**: Versionar API (`/rpc/v1/...`) e manter retrocompatibilidade
- **Plano B**: Refatorar frontend conforme necessário

### Risco: Complexidade de Dependências
- **Probabilidade**: Baixa
- **Impacto**: Médio
- **Mitigação**: Dependências explícitas em cada card
- **Plano B**: Desenvolver feature completa (backend + frontend) antes de próxima

---

## Métricas de Progresso

### Tracking Global
- **Total de Cards**: ~433
- **Cards Críticos (P0+P1)**: ~145
- **Cards Extras (P3)**: ~123

### Estimativa de Tempo (Referência)
- **Backend (196 cards)**: ~60% do tempo total
- **Frontend (237 cards)**: ~40% do tempo total (aproveita endpoints prontos)

---

[← Anterior: Considerações de Implementação](./12-consideracoes-implementacao.md) | [Voltar ao Menu](./README.md) | [Próximo: Critérios de Aceitação →](./14-criterios-aceitacao.md)

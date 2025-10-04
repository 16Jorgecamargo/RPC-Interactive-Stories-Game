# 4. Requisitos Não Funcionais

## RNF01 - Performance
- O sistema deve suportar até 5 jogadores por sessão
- Tempo de resposta para RPC < 500ms
- Consultas de chat via RPC devem retornar em < 300ms
- Polling de notificações deve ocorrer a cada 1-2 segundos

## RNF02 - Disponibilidade
- Sistema deve estar disponível 99% do tempo
- Recuperação automática de falhas temporárias

## RNF03 - Usabilidade
- Interface intuitiva para jogadores não técnicos
- Comandos claros e feedback visual adequado

## RNF04 - Segurança
- Autenticação JWT obrigatória para todas as operações
- Hash seguro de senhas com bcrypt
- Validação de entrada usando Zod
- Autorização baseada em roles (Admin/Usuario)
- Prevenção de ataques de injeção
- Sanitização de mensagens de chat
- Tokens JWT com expiração
- Validação de propriedade de recursos (sessões/personagens)

## RNF05 - Escalabilidade
- Arquitetura deve permitir múltiplas sessões simultâneas
- Capacidade de adicionar novos servidores

---

[← Anterior: Requisitos Funcionais](./03-requisitos-funcionais.md) | [Voltar ao Menu](./README.md) | [Próximo: Arquitetura →](./05-arquitetura.md)
# A Mina Perdida de Phandelver

**Uma Aventura de D&D 5e para Níveis 1-5**

## Visão Geral

A Mina Perdida de Phandelver é uma aventura clássica de D&D ambientada na Costa da Espada dos Reinos Esquecidos. O que começa como uma simples missão de escolta se transforma em uma busca épica envolvendo emboscadas de goblins, conspirações sinistras, ruínas antigas e uma mina perdida lendária.

### Resumo da História

Os aventureiros são contratados por Gundren Rockseeker, um anão prospector, para escoltar uma carroça de suprimentos até o assentamento fronteiriço de Phandalin. Quando Gundren é emboscado e capturado por goblins, o grupo descobre uma conspiração envolvendo a misteriosa "Aranha Negra" que busca reivindicar a lendária Caverna Eco de Onda e sua forja mágica.

---

## Estrutura da Aventura

### Parte 1: Flechas de Goblin (Níveis 1-2)
**Localização:** Trilha Triboar & Esconderijo Cragmaw
**PNJs Principais:** Klarg (chefe bugbear), Sildar Hallwinter
**Objetivo Principal:** Sobreviver à emboscada goblin e resgatar Sildar

A aventura começa com uma emboscada goblin na Trilha Triboar. Seguir as pegadas goblin leva ao Esconderijo Cragmaw, onde o grupo pode resgatar Sildar Hallwinter e aprender sobre a conspiração maior.

**Encontros Principais:**
- Emboscada goblin (4 goblins)
- Exploração do Esconderijo Cragmaw (armadilhas, lobos, goblins)
- Luta contra chefe: Klarg e seus guardas
- Resgate: Sildar Hallwinter

**Recompensas:**
- 10 po cada (de Gundren pela entrega da carroça)
- Morningstar +1 (de Klarg)
- Carta revelando o envolvimento da Aranha Negra

### Parte 2: Phandalin (Níveis 2-3)
**Localização:** Cidade de Phandalin & Esconderijo Redbrand
**PNJs Principais:** Glasstaff (Iarno Albrek), Mestre da Cidade Harbin Wester, vários moradores
**Objetivo Principal:** Libertar Phandalin dos Redbrands

O grupo chega a Phandalin para encontrar a cidade aterrorizada por uma gangue chamada Redbrands. Sua investigação leva ao Mansão Tresendar e um confronto com o líder misterioso da gangue, Glasstaff.

**Encontros Principais:**
- Confrontos com Redbrands na cidade
- Calabouço do Esconderijo Redbrand (nothic, rufiões)
- Luta contra chefe: Glasstaff (mago maligno)
- Opcional: Resgatar a família Dendrar

**Recompensas:**
- Cajado de Defesa (de Glasstaff)
- Anel de Proteção
- Evidências sobre a Aranha Negra e Castelo Cragmaw
- Gratidão de Phandalin

**Missões Secundárias Disponíveis:**
- Poço Velha Coruja (problema de mortos-vivos)
- Monte Tor (saqueadores orcs)
- Thundertree (dragão!)
- Barganha da banshee

### Parte 3: A Teia da Aranha (Níveis 3-4)
**Localização:** Locais selvagens ao redor de Phandalin
**PNJs Principais:** Reidoth (druida), Venomfang (dragão verde jovem), Rei Grol
**Objetivo Principal:** Localizar e assaltar o Castelo Cragmaw para resgatar Gundren

Com pistas dos papéis de Glasstaff, o grupo explora o selvagem para encontrar o Castelo Cragmaw e resgatar Gundren Rockseeker antes que ele seja entregue à Aranha Negra.

**Locais Principais:**

**Thundertree** (Opcional)
- Cidade arruinada tomada por zumbis de cinzas e galhos retorcidos
- Covil do dragão Venomfang (luta contra chefe CR 8!)
- Reidoth o druida pode fornecer informações
- Missão do herança da família Dendrar

**Castelo Cragmaw**
- Fortaleza goblinóide
- Múltiplas opções de abordagem (furtividade, escalada, assalto)
- Luta contra chefe: Rei Grol, doppelganger, lobo
- Resgate: Gundren Rockseeker

**Recompensas:**
- Mapa para a Caverna Eco de Onda
- Informações de Gundren sobre a Forja de Feitiços
- Tesouro do dragão (se Venomfang for derrotado)
- Fama regional como heróis

### Parte 4: Caverna Eco de Onda (Níveis 4-5)
**Localização:** Caverna Eco de Onda (mina anã antiga)
**PNJs Principais:** Nezznar a Aranha Negra, Nundro Rockseeker
**Objetivo Principal:** Derrotar a Aranha Negra e garantir a Forja de Feitiços

O clímax final acontece na Caverna Eco de Onda, a mina lendária contendo a Forja de Feitiços. O grupo deve navegar por túneis perigosos, batalhar monstros e mortos-vivos, e confrontar Nezznar a Aranha Negra em seu covil.

**Encontros Principais:**
- Geleia ocre, stirges, gricks
- Wraiths e guardiões espectrais
- Guardião flameskull
- Bugbears e aranhas gigantes (forças da Aranha Negra)
- Chefe Final: Nezznar a Aranha Negra

**Recompensas:**
- Cajado Aranha (item mágico raro)
- Maça Lightbringer
- Parceria nas operações de mineração da Caverna Eco de Onda
- Acesso à Forja de Feitiços
- Fama como heróis da Costa da Espada

---

## Estrutura de Arquivos

```
backend/stories/lost-mine-phandelver/
├── story.json              # Narrativa completa da aventura (60+ capítulos)
├── monsters.json           # 22 monstros com estatísticas completas de D&D 5e
├── player-options.json     # Sistema de criação de personagem (raças, classes, magias)
└── README.md              # Este arquivo
```

### story.json
Contém a narrativa ramificada completa com:
- 60+ capítulos interativos
- Múltiplas opções de escolha que afetam a história
- Encontros de combate com referências a monstros
- Distribuição de loot e tesouros
- NPCs e diálogos
- Caminhos de sucesso/fracasso
- Epílogo baseado nas escolhas do jogador

### monsters.json
Estatísticas completas de monstros para 22 criaturas:
- **Humanoides:** Goblin, Hobgoblin, Bugbear, Rufião Redbrand
- **Chefes:** Klarg, Glasstaff, Rei Grol, Mosk, Aranha Negra, Venomfang
- **Feras:** Lobo, Aranha Gigante, Owlbear, Stirge
- **Aberrações:** Nothic, Doppelganger, Spectator
- **Morto-vivos:** Zumbi, Esqueleto, Wraith, Flameskull
- **Geleias:** Geleia Ocre
- **Monstruosidades:** Grick

Cada monstro inclui: CA, PV, habilidades, ataques, traços especiais, ND, XP

### player-options.json
Sistema completo de criação de personagem D&D 5e:

**Raças (13):**
- Humano
- Elfo (Elfo Alto, Elfo da Floresta, Drow)
- Anão (Anão da Montanha, Anão da Colina)
- Halfling (Pés Leves, Robusto)
- Draconato (10 ascendências dracônicas)
- Gnomo (Gnomo da Floresta, Gnomo da Pedra)
- Meio-Elfo
- Meio-Orc
- Tiefling

**Classes com Subclasses (6):**
- Bárbaro (Furioso, Guerreiro Totêmico)
- Bardo (Conhecimento, Valor)
- Clérigo (Vida, Guerra)
- Lutador (Campeão, Mestre de Batalha)
- Ladino (Ladrão, Assassino)
- Mago (Evocação, Abjuração)

**Magias:** 20+ magias organizadas por nível (truques até nível 3)

**Antecedentes:** Herói do Povo, Soldado, Acólito

**Equipamento:** Armas, armaduras, itens mágicos específicos desta aventura

---

## PNJs Principais

### Aliados

**Gundren Rockseeker**
- Anão prospector que contratou o grupo
- Um dos três irmãos que descobriram a Caverna Eco de Onda
- Capturado pelos goblins de Cragmaw na Parte 1

**Sildar Hallwinter**
- Guerreiro humano e membro da Aliança dos Lordes
- Capturado com Gundren, resgatado do Esconderijo Cragmaw
- Procurando pelo mago desaparecido Iarno Albrek

**Nundro Rockseeker**
- Irmão de Gundren
- Preso na Caverna Eco de Onda pela Aranha Negra
- Pode ser resgatado na Parte 4

**Reidoth o Druida**
- Vive nas ruínas de Thundertree
- Pode fornecer informações sobre a localização do Castelo Cragmaw
- Oposição a Venomfang o dragão

### Antagonistas

**Klarg** (Chefe da Parte 1)
- Bugbear líder do Esconderijo Cragmaw
- Empunha uma maça estrela +1
- Serve ao Rei Grol e à Aranha Negra

**Glasstaff / Iarno Albrek** (Chefe da Parte 2)
- Mago maligno liderando os Redbrands
- Traidor da Aliança dos Lordes
- Serve à Aranha Negra
- Empunha Cajado de Defesa

**Rei Grol** (Chefe da Parte 3)
- Rei bugbear governando o Castelo Cragmaw
- Mantém Gundren Rockseeker cativo
- Aliado a um conselheiro doppelganger

**Venomfang** (Chefe Opcional da Parte 3)
- Dragão verde jovem (ND 8 - muito perigoso!)
- Vive em Thundertree
- Astuto e traiçoeiro
- Desafio maior com grandes recompensas

**Nezznar a Aranha Negra** (Chefe Final da Parte 4)
- Mestre das trevas drow por trás da conspiração
- Busca reivindicar a Forja de Feitiços da Caverna Eco de Onda
- Comanda aranhas gigantes, bugbears e doppelgangers
- Empunha o Cajado Aranha

---

## Locais Principais

### Phandalin
Uma pequena cidade fronteiriça reconstruída recentemente de ruínas. Locais principais:
- **Provisões Barthen** - Posto comercial, doador de missões
- **Estalagem Stonehill** - Rumores e descanso
- **Salão do Mestre da Cidade** - Mestre da Cidade covarde Harbin Wester
- **Mansão Tresendar** - Mansão arruinada escondendo entrada do esconderijo Redbrand
- **Santuário da Sorte** - Irmã Garaele, missão da banshee

### Esconderijo Cragmaw
Complexo de cavernas servindo como base goblin:
- Entrada armadilhada (armadilha de laço, armadilha de inundação)
- Covil goblin com lobos
- Sala do trono de Klarg através de ponte de madeira
- Células de prisão

### Mansão Tresendar / Esconderijo Redbrand
Complexo subterrâneo abaixo da mansão arruinada:
- Cavernas naturais e pedra trabalhada
- Covil do nothic
- Células de prisão (família Dendrar)
- Câmaras de mago de Glasstaff
- Tesouro escondido

### Thundertree
Aldeia arruinada destruída há 30 anos:
- Tomada por vegetação
- Zumbis de cinzas e galhos retorcidos
- Cultistas do dragão
- Covil da torre de Venomfang
- Cabana do druida Reidoth

### Castelo Cragmaw
Fortaleza arruinada ocupada por goblins:
- Múltiplas entradas (portão, torre, túnel)
- Salão de banquetes, quartéis, sala de troféus
- Owlbear em cativeiro
- Sala do trono do Rei Grol
- Célula de prisão de Gundren

### Caverna Eco de Onda
Mina lendária perdida e masmorra final:
- Cavernas ecoantes (efeito sonoro mágico)
- Campo de batalha antigo (esqueletos de batalha de 500 anos)
- Túneis de mineração e veias de minério
- Templo de Dumathoin
- Forja de Feitiços (oficina mágica)
- Covil da Aranha Negra

---

## Itens Mágicos

**Encontrados na Aventura:**
- Maça Estrela +1 (Klarg)
- Cajado de Defesa (Glasstaff)
- Anel de Proteção (Glasstaff)
- Cajado Aranha (Aranha Negra)
- Lightbringer (Caverna Eco de Onda) - Maça brilhante, +1d6 radiante vs morto-vivos
- Dragonguard (Caverna Eco de Onda) - Peitoral com resistência a dragão
- Poção de Cura (vários locais)
- Pergaminhos e componentes de magia

**Forja de Feitiços:**
A lendária forja mágica pode criar itens mágicos incomuns uma vez operacional. Requer tempo e recursos mas fornece benefícios contínuos.

---

## Progressão de Níveis

**Limites de Experiência Recomendados:**
- **Nível 1:** Início da aventura
- **Nível 2:** Após Esconderijo Cragmaw ou primeiro encontro Redbrand
- **Nível 3:** Após limpar Esconderijo Redbrand
- **Nível 4:** Após Castelo Cragmaw ou missão secundária maior (Venomfang)
- **Nível 5:** Durante ou após Caverna Eco de Onda

**Progressão por Marcos (Alternativa):**
- Nível 2: Resgatar Sildar Hallwinter
- Nível 3: Derrotar Glasstaff e libertar Phandalin
- Nível 4: Resgatar Gundren Rockseeker do Castelo Cragmaw
- Nível 5: Entrar na Caverna Eco de Onda

---

## Tesouros e Recompensas

**Riqueza Monetária:**
- Parte 1: ~200 po
- Parte 2: ~500 po
- Parte 3: ~1.200 po (mais se dragão derrotado)
- Parte 4: ~2.000 po
- **Total:** ~3.900 po + itens mágicos + parceria na Caverna Eco de Onda

**Parceria na Caverna Eco de Onda:**
Se o grupo garantir a mina, Gundren oferece a eles uma parcela de 10% dos lucros. Isso gera aproximadamente 100 po por mês uma vez que as operações de mineração sejam retomadas.

---

## Missões Secundárias

### Poço Velha Coruja
- **Doador:** Daran Edermath
- **Localização:** 50 milhas nordeste de Phandalin
- **Encontro:** Mago maligno erguendo morto-vivos
- **Recompensa:** 100 po

### Monte Tor
- **Doador:** Mestre da Cidade Harbin Wester
- **Localização:** Colinas perto de Phandalin
- **Encontro:** Saqueadores orcs e ogro
- **Recompensa:** 100 po

### Barganha da Banshee
- **Doador:** Irmã Garaele
- **Localização:** Santuário na floresta
- **Encontro:** Agatha a banshee
- **Recompensa:** Poção de cura, informações

### Herança da Família Dendrar
- **Doador:** Mirna Dendrar (se resgatada)
- **Localização:** Ruínas de Thundertree (loja de herbalista)
- **Encontro:** Buscar nas ruínas, possível dragão
- **Recompensa:** Colar de esmeralda (200 po de valor)

---

## Dicas para Executar a Aventura

### Para Jogadores

1. **Exploração é Recompensada:** Muitos tesouros e aliados são encontrados explorando completamente
2. **Escolhas Importam:** Abordagens diferentes para encontros produzem resultados diferentes
3. **Furtividade vs Combate:** Nem todo encontro requer luta
4. **Coleta de Informações:** Fale com PNJs, leia documentos, investigue
5. **Gerenciamento de Recursos:** Descansos curtos e longos são importantes
6. **Trabalho em Equipe:** Coordene habilidades e apoiem uns aos outros

### Para Mestres

1. **Ritmo:** Deixe os jogadores definirem o ritmo; não os apresse pela história
2. **Flexibilidade:** Jogadores encontrarão soluções criativas; adapte-se às escolhas deles
3. **PNJs:** Dê personalidades aos PNJs importantes como Sildar, Gundren, Glasstaff
4. **Atmosfera:** Descreva os sons ecoantes na Caverna Eco de Onda, o declínio de Thundertree
5. **Desafio:** Venomfang é extremamente perigoso em níveis baixos; antecipe a ameaça
6. **Consequências:** Ações em Phandalin afetam como a cidade trata o grupo

---

## Referência de Dificuldade de Combate

**Encontros Fáceis:**
- 2-4 goblins
- 1-2 zumbis
- Stirges

**Encontros Médios:**
- 4-6 goblins
- 2-3 rufiões Redbrand
- Geleia ocre
- Nothic

**Encontros Difíceis:**
- Klarg + guardas
- Glasstaff
- 4+ hobgoblins
- Spectator
- Wraith

**Encontros Mortais:**
- Rei Grol + doppelganger + lobo
- Venomfang (dragão ND 8!)
- Aranha Negra + aranhas gigantes + bugbears
- Flameskull

---

## Conexões com Campanha Mais Ampla

A Mina Perdida de Phandelver é projetada como uma aventura autocontida mas pode levar a:

1. **Príncipes do Apocalipse** - Cultos elementais ameaçam a região
2. **Rei da Tempestade** - Gigantes começam a atacar a Costa da Espada
3. **Aventuras Personalizadas** - O grupo estabeleceu-se como heróis regionais
4. **Operações na Caverna Eco de Onda** - Gerenciar a mina se torna um elemento de campanha contínua

A reputação dos personagens, aliados (Aliança dos Lordes, Harpistas), e recursos (itens mágicos, ouro, mina) fornecem excelentes fundações para futuras aventuras.

---

## Créditos

**Aventura Original:** Wizards of the Coast (Kit Inicial D&D 5e)
**Adaptada para Jogo de Histórias Interativas RPC:** 2025
**Formato:** Escolha-sua-própria-aventura com sistema de combate D&D 5e

---

## Notas de Implementação Técnica

### Integração com Sistema de Jogo RPC

Esta aventura é projetada para funcionar com o backend do Jogo de Histórias Interativas RPC:

- **story.json** integra com sistema de análise de história existente
- **monsters.json** fornece estatísticas de combate para resolução de encontros
- **player-options.json** estende criação de personagem além das 4 raças/classes base
- Todo conteúdo é formatado em JSON para fácil consumo de métodos RPC

### Resolução de Combate

Encontros de combate referenciam IDs de monstros e contagens:
```json
{
  "isCombat": true,
  "monsterId": "goblin",
  "monsterCount": 4,
  "surpriseRound": false
}
```

O sistema de jogo lida com:
- Rolagens de iniciativa
- Ordem de turnos
- Rolagens de ataque vs CA
- Cálculo de dano
- Rastreamento de PV
- Morte/inconsciência
- Condições de vitória

### Ramificação de Escolhas

Cada capítulo oferece múltiplas escolhas que levam a caminhos narrativos diferentes:
- Soluções diplomáticas vs combate
- Furtividade vs assalto direto
- Escolhas morais afetando o final
- Decisões de gerenciamento de recursos

Escolhas do jogador são rastreadas e influenciam:
- PNJs e missões disponíveis
- Reputação na cidade
- Resultados de epílogo
- Tesouros e recompensas

---

## Apêndice: Referência Rápida

### Testes Importantes

**Percepção CD 12:** Notar pegadas goblin, inimigos escondidos
**Furtividade CD 13:** Passar pelos guardas despercebido
**Persuasão CD 15:** Convencer PNJs, negociar
**Intimidação CD 15:** Assustar inimigos para cooperação
**Investigação CD 12:** Encontrar tesouros escondidos, ler pistas

### Tempos de Viagem

- Neverwinter para Phandalin: 3 dias
- Emboscada na Trilha Triboar para Phandalin: Meia dia
- Phandalin para Esconderijo Cragmaw: 2 horas (seguindo trilha)
- Phandalin para Thundertree: 2 dias
- Phandalin para Castelo Cragmaw: 1 dia
- Phandalin para Caverna Eco de Onda: Meia dia

### Descanso e Recuperação

**Descanso Curto:** 1 hora, gaste Dados de Vida para recuperar PV
**Descanso Longo:** 8 horas, recupere todos os PV e metade dos Dados de Vida gastos

Personagens devem ter oportunidades de descansos entre encontros principais.

---

**Duração da Aventura:** 12-16 horas de jogo
**Dificuldade:** Média (adequada para jogadores novos)
**Tom:** Fantasia heroica clássica com exploração de masmorras
**Temas:** Mistério, conspiração, caça ao tesouro, superar o mal

**Que seus dados rolem alto, e suas aventuras sejam lendárias!**

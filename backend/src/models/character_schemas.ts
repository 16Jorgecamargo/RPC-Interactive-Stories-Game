import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const RaceEnum = z.enum(['Human', 'Elf', 'Dwarf', 'Halfling']).openapi({
  example: 'Human',
});

export const ClassEnum = z.enum(['Warrior', 'Mage', 'Rogue', 'Cleric']).openapi({
  example: 'Warrior',
});

export const AbilityScoreIncreaseSchema = z.object({
  strength: z.number().int().optional().openapi({ example: 2 }),
  dexterity: z.number().int().optional().openapi({ example: 0 }),
  constitution: z.number().int().optional().openapi({ example: 1 }),
  intelligence: z.number().int().optional().openapi({ example: 0 }),
  wisdom: z.number().int().optional().openapi({ example: 0 }),
  charisma: z.number().int().optional().openapi({ example: 0 }),
});

export const AttributeBonusPerLevelSchema = z.object({
  level: z.number().int().min(1).max(20).openapi({ example: 1 }),
  strength: z.number().int().openapi({ example: 0 }),
  dexterity: z.number().int().openapi({ example: 0 }),
  constitution: z.number().int().openapi({ example: 1 }),
  intelligence: z.number().int().openapi({ example: 0 }),
  wisdom: z.number().int().openapi({ example: 2 }),
  charisma: z.number().int().openapi({ example: 0 }),
});

export const AttackOptionSchema = z.object({
  id: z.string().openapi({ example: 'staff-strike' }),
  name: z.string().openapi({ example: 'Golpe de Cajado' }),
  damage: z.string().openapi({ example: '1d6' }),
  description: z.string().openapi({ example: 'Ataque corpo a corpo com o cajado' }),
  cooldown: z.number().int().min(0).openapi({ example: 0 }),
  level: z.number().int().min(1).max(20).openapi({ example: 1 }),
});

export const SpellOptionSchema = z.object({
  id: z.string().openapi({ example: 'fireball-spell' }),
  name: z.string().openapi({ example: 'Bola de Fogo' }),
  damage: z.string().openapi({ example: '8d6' }),
  usageLimit: z.number().int().min(1).openapi({ example: 3 }),
  effects: z.array(z.string()).openapi({ example: ['queimação', 'área'] }),
  description: z.string().openapi({ example: 'Explosão de fogo em área de 20 pés' }),
  level: z.number().int().min(1).max(20).openapi({ example: 1 }),
});

export const SelectionRulesSchema = z.object({
  attacksToSelect: z.number().int().min(0).openapi({ example: 3 }),
  spellsToSelect: z.number().int().min(0).openapi({ example: 6 }),
});

export const RaceSchema = z.object({
  id: z.string().openapi({ example: 'human' }),
  name: z.string().openapi({ example: 'Humano' }),
  description: z.string().openapi({ example: 'Humanos são as pessoas mais adaptáveis e ambiciosas entre as raças comuns' }),
  abilityScoreIncrease: AbilityScoreIncreaseSchema.openapi({
    example: { strength: 1, dexterity: 1, constitution: 1, intelligence: 1, wisdom: 1, charisma: 1 }
  }),
  traits: z.array(z.string()).optional().openapi({ example: ['+1 em todos os atributos', 'Versátil'] }),
});

export const ClassSchema = z.object({
  id: z.string().openapi({ example: 'wizard' }),
  name: z.string().openapi({ example: 'Mago' }),
  description: z.string().openapi({ example: 'Conjurador que domina magias arcanas através de estudo e prática intensa' }),
  weaponBase: z.string().openapi({ example: 'Cajado' }),
  primaryAttributes: z.array(z.string()).openapi({ example: ['Inteligência', 'Sabedoria'] }),
  attacksPerLevel: z.array(z.number().int()).openapi({ example: [1, 1, 1, 1, 2] }),
  attributeBonusPerLevel: z.array(AttributeBonusPerLevelSchema).openapi({
    example: [
      { level: 1, strength: 0, dexterity: 0, constitution: 0, intelligence: 2, wisdom: 0, charisma: 0 },
      { level: 2, strength: 0, dexterity: 0, constitution: 0, intelligence: 2, wisdom: 1, charisma: 0 },
    ]
  }),
  attacks: z.array(AttackOptionSchema).openapi({
    example: [
      { id: 'staff-strike', name: 'Golpe de Cajado', damage: '1d6', description: 'Ataque corpo a corpo', cooldown: 0, level: 1 }
    ]
  }),
  spells: z.array(SpellOptionSchema).openapi({
    example: [
      { id: 'fireball', name: 'Bola de Fogo', damage: '8d6', usageLimit: 3, effects: ['fogo', 'área'], description: 'Explosão', level: 1 }
    ]
  }),
  selectionRules: SelectionRulesSchema.openapi({ example: { attacksToSelect: 3, spellsToSelect: 6 } }),
  traits: z.array(z.string()).optional().openapi({ example: ['Proficiência com armas pesadas', 'Alta constituição'] }),
});

export const GetCharacterOptionsSchema = z.object({
  token: z.string().openapi({ example: 'eyJhbGc...' }),
  storyId: z.string().openapi({ example: 'lost-mine-phandelver', description: 'ID da história para buscar opções de personagem' }),
});

export const CharacterOptionsResponseSchema = z.object({
  races: z.array(z.any()),
  classes: z.array(z.any()),
  spells: z.any().optional(),
  backgrounds: z.array(z.any()).optional(),
  equipment: z.any().optional(),
});

export const AttributesSchema = z.object({
  strength: z.number().int().min(3).max(18).openapi({ example: 15 }),
  dexterity: z.number().int().min(3).max(18).openapi({ example: 14 }),
  constitution: z.number().int().min(3).max(18).openapi({ example: 13 }),
  intelligence: z.number().int().min(3).max(18).openapi({ example: 12 }),
  wisdom: z.number().int().min(3).max(18).openapi({ example: 10 }),
  charisma: z.number().int().min(3).max(18).openapi({ example: 8 }),
});

export const BackgroundSchema = z.object({
  appearance: z.string().min(10).max(500).openapi({
    example: 'Alto e musculoso, cabelos negros e olhos azuis penetrantes',
  }),
  personality: z.string().min(10).max(500).openapi({
    example: 'Corajoso e leal, sempre pronto para defender os fracos',
  }),
  fears: z.string().min(10).max(500).openapi({
    example: 'Teme perder seus companheiros em batalha',
  }),
  goals: z.string().min(10).max(500).openapi({
    example: 'Tornar-se um herói lendário e proteger seu reino',
  }),
  personalityTraits: z.string().min(3).max(500).optional().openapi({
    example: 'Sempre otimista e disposto a ajudar, mantém um humor afiado mesmo em perigo.',
  }),
  ideals: z.string().min(3).max(500).optional().openapi({
    example: 'Liberdade acima de tudo; proteger os fracos do abuso de poder.',
  }),
  bonds: z.string().min(3).max(500).optional().openapi({
    example: 'Deve sua vida ao templo que o acolheu quando criança.',
  }),
  flaws: z.string().min(3).max(500).optional().openapi({
    example: 'Confia demais em estranhos e tende a se arriscar por promessas vazias.',
  }),
  featureNotes: z.string().min(3).max(1000).optional().openapi({
    example: 'Abrigo dos Fiéis concede cuidados e abrigo em templos aliados.',
  }),
});

export const CharacterAttackSchema = z.object({
  name: z.string().min(1).max(100).openapi({ example: 'Espada Longa' }),
  type: z.string().min(1).max(50).optional().openapi({ example: 'weapon' }),
  attackBonus: z.string().min(1).max(20).optional().openapi({ example: '+5' }),
  damage: z.string().min(1).max(50).openapi({ example: '1d8 + 3 cortante' }),
  notes: z.string().max(200).optional().openapi({ example: 'Versátil (1d10)' }),
});

export const CharacterSheetProficienciesSchema = z.object({
  armor: z.array(z.string()).default([]),
  weapons: z.array(z.string()).default([]),
  tools: z.array(z.string()).default([]),
  skills: z.array(z.string()).default([]),
  other: z.array(z.string()).default([]),
});

export const CombatStatsSchema = z.object({
  armorClass: z.number().int().min(0).max(50).openapi({ example: 16 }),
  initiative: z.number().min(-10).max(20).openapi({ example: 3 }),
  speed: z.number().int().min(0).max(120).openapi({ example: 30 }),
  hitDice: z.string().min(2).max(20).openapi({ example: '1d10' }),
  maxHp: z.number().int().min(1).max(500).openapi({ example: 12 }),
  currentHp: z.number().int().min(0).max(500).openapi({ example: 12 }),
  tempHp: z.number().int().min(0).max(500).openapi({ example: 0 }),
  deathSaves: z
    .object({
      successes: z.number().int().min(0).max(3).openapi({ example: 0 }),
      failures: z.number().int().min(0).max(3).openapi({ example: 0 }),
    })
    .optional(),
});

export const SelectedAttackSchema = z.object({
  id: z.string().openapi({ example: 'staff-strike' }),
  name: z.string().openapi({ example: 'Golpe de Cajado' }),
  damage: z.string().openapi({ example: '1d6' }),
  description: z.string().optional().openapi({ example: 'Ataque corpo a corpo com o cajado' }),
  cooldown: z.number().int().min(0).openapi({ example: 0 }),
});

export const SelectedSpellSchema = z.object({
  id: z.string().openapi({ example: 'fireball-spell' }),
  name: z.string().openapi({ example: 'Bola de Fogo' }),
  damage: z.string().openapi({ example: '8d6' }),
  usageLimit: z.number().int().min(1).openapi({ example: 3 }),
  effects: z.array(z.string()).optional().openapi({ example: ['queimação', 'área'] }),
  description: z.string().optional().openapi({ example: 'Explosão de fogo em área de 20 pés' }),
});

export const CharacterSheetSchema = z.object({
  raceId: z.string().optional().openapi({ example: 'human' }),
  classId: z.string().optional().openapi({ example: 'warrior' }),
  subclassId: z.string().optional().openapi({ example: 'champion' }),
  backgroundId: z.string().optional().openapi({ example: 'acolyte' }),
  backgroundName: z.string().optional().openapi({ example: 'Acólito' }),
  classLevel: z.string().optional().openapi({ example: 'Guerreiro 1' }),
  playerName: z.string().optional().openapi({ example: 'Ana Jogadora' }),
  alignment: z.string().optional().openapi({ example: 'Leal e Bom' }),
  experiencePoints: z.number().int().min(0).optional().openapi({ example: 0 }),
  proficiencies: CharacterSheetProficienciesSchema.optional(),
  languages: z.array(z.string()).optional().openapi({ example: ['Comum', 'Élfico'] }),
  attacks: z.array(CharacterAttackSchema).optional(),
  combatStats: CombatStatsSchema.optional(),
  feature: z
    .object({
      name: z.string().openapi({ example: 'Abrigo dos Fiéis' }),
      description: z.string().optional().openapi({ example: 'Garantia de abrigo e cuidados gratuitos em templos aliados.' }),
    })
    .optional(),
});

export const CharacterSchema = z.object({
  id: z.string().openapi({ example: 'char_123e4567-e89b-12d3-a456-426614174000' }),
  name: z.string().min(3).max(50).openapi({ example: 'Thorin Escudo de Carvalho' }),
  race: z.string().openapi({ example: 'Human' }),
  class: z.string().openapi({ example: 'Warrior' }),
  subclass: z.string().optional().openapi({ example: 'Champion', description: 'Subclasse/especialização do personagem' }),
  attributes: AttributesSchema.openapi({ description: 'Atributos finais (base + racial + classe nível 1)' }),
  background: BackgroundSchema,
  equipment: z.array(z.string()).openapi({
    example: ['Espada longa', 'Escudo de aço', 'Armadura de placas', 'Poção de cura'],
  }),
  selectedAttacks: z.array(SelectedAttackSchema).optional().openapi({
    example: [{ id: 'staff-strike', name: 'Golpe de Cajado', damage: '1d6', description: 'Ataque corpo a corpo', cooldown: 0 }],
    description: 'Ataques selecionados pelo jogador (formato híbrido: id + dados principais)'
  }),
  selectedSpells: z.array(SelectedSpellSchema).optional().openapi({
    example: [{ id: 'fireball', name: 'Bola de Fogo', damage: '8d6', usageLimit: 3, effects: ['fogo'], description: 'Explosão' }],
    description: 'Magias selecionadas pelo jogador (formato híbrido: id + dados principais)'
  }),
  cantrips: z.array(z.string()).optional().openapi({
    example: ['fire-bolt', 'mage-hand', 'minor-illusion'],
    description: 'IDs dos truques conhecidos (para classes conjuradoras)'
  }),
  knownSpells: z.array(z.string()).optional().openapi({
    example: ['magic-missile', 'shield', 'burning-hands'],
    description: 'IDs das magias conhecidas - grimório para Mago, magias conhecidas para Bardo'
  }),
  preparedSpells: z.array(z.string()).optional().openapi({
    example: ['cure-wounds', 'bless'],
    description: 'IDs das magias preparadas (para Clérigo)'
  }),
  sheet: CharacterSheetSchema.optional().openapi({
    description: 'Informações adicionais da ficha (proficiencias, ataques, estatísticas de combate, etc.)',
  }),
  userId: z.string().openapi({ example: 'user_123e4567-e89b-12d3-a456-426614174000' }),
  sessionId: z
    .string()
    .uuid()
    .nullable()
    .openapi({ example: 'session_123e4567-e89b-12d3-a456-426614174000' }),
  isComplete: z.boolean().openapi({ example: true }),
  createdAt: z.string().datetime().openapi({ example: '2025-01-15T10:30:00Z' }),
});

export const CreateCharacterSchema = z.object({
  token: z.string().openapi({ example: 'eyJhbGc...' }),
  sessionId: z.string().optional().openapi({
    example: 'session_123e4567-e89b-12d3-a456-426614174000',
    description: 'ID da sessão (obrigatório se usuário estiver em uma sessão aguardando criação de personagens)'
  }),
  storyId: z.string().optional().openapi({
    example: 'lost-mine-phandelver',
    description: 'ID da história para carregar player-options.json'
  }),
  name: z.string().min(3).max(50).openapi({ example: 'Thorin Escudo de Carvalho' }),
  race: z.string().openapi({ example: 'human', description: 'ID da raça escolhida' }),
  class: z.string().openapi({ example: 'wizard', description: 'ID da classe escolhida' }),
  subclass: z.string().optional().openapi({ example: 'Champion', description: 'Subclasse/especialização' }),
  attributes: AttributesSchema.openapi({ description: 'Atributos base do point buy (8-15), bônus raciais e de classe serão aplicados automaticamente' }),
  background: BackgroundSchema,
  equipment: z.array(z.string()).min(1).max(10).openapi({
    example: ['Espada longa', 'Escudo de aço', 'Armadura de placas'],
  }),
  selectedAttackIds: z.array(z.string()).optional().openapi({
    example: ['staff-strike', 'arcane-blast', 'force-push'],
    description: 'IDs dos ataques selecionados'
  }),
  selectedSpellIds: z.array(z.string()).optional().openapi({
    example: ['fireball-spell', 'lightning-bolt-spell', 'ice-storm'],
    description: 'IDs das magias selecionadas'
  }),
  cantrips: z.array(z.string()).optional().openapi({
    example: ['fire-bolt', 'mage-hand', 'minor-illusion'],
    description: 'IDs dos truques conhecidos'
  }),
  knownSpells: z.array(z.string()).optional().openapi({
    example: ['magic-missile', 'shield', 'burning-hands'],
    description: 'IDs das magias conhecidas (grimório para Mago, conhecidas para Bardo)'
  }),
  preparedSpells: z.array(z.string()).optional().openapi({
    example: ['cure-wounds', 'bless'],
    description: 'IDs das magias preparadas (para Clérigo)'
  }),
  sheet: CharacterSheetSchema.optional().openapi({
    description: 'Informações adicionais da ficha (proficiencias, ataques, estatísticas de combate, etc.)',
  }),
});

export const UpdateCharacterSchema = z.object({
  token: z.string().openapi({ example: 'eyJhbGc...' }),
  characterId: z.string().openapi({ example: 'char_123e4567-e89b-12d3-a456-426614174000' }),
  name: z.string().min(3).max(50).optional().openapi({ example: 'Thorin Filho do Ferro' }),
  race: z.string().optional(),
  class: z.string().optional(),
  storyId: z.string().optional(),
  attributes: AttributesSchema.optional(),
  background: BackgroundSchema.optional(),
  equipment: z.array(z.string()).min(1).max(10).optional().openapi({
    example: ['Espada longa +1', 'Escudo mágico'],
  }),
  selectedAttackIds: z.array(z.string()).optional().openapi({
    example: ['staff-strike', 'arcane-blast', 'force-push'],
  }),
  selectedSpellIds: z.array(z.string()).optional().openapi({
    example: ['fireball-spell', 'lightning-bolt-spell', 'ice-storm'],
  }),
  sheet: CharacterSheetSchema.optional().openapi({
    description: 'Informações adicionais atualizadas da ficha.',
  }),
});

export const GetCharactersSchema = z.object({
  token: z.string().openapi({ example: 'eyJhbGc...' }),
});

export const GetCharacterSchema = z.object({
  token: z.string().openapi({ example: 'eyJhbGc...' }),
  characterId: z.string().openapi({ example: 'char_123e4567-e89b-12d3-a456-426614174000' }),
});

export const DeleteCharacterSchema = z.object({
  token: z.string().openapi({ example: 'eyJhbGc...' }),
  characterId: z.string().openapi({ example: 'char_123e4567-e89b-12d3-a456-426614174000' }),
});

export const CharacterResponseSchema = CharacterSchema.omit({ userId: true });

export const CharactersListSchema = z.object({
  characters: z.array(CharacterResponseSchema),
  total: z.number().openapi({ example: 3 }),
});

export const DeleteCharacterResponseSchema = z.object({
  success: z.boolean().openapi({ example: true }),
  message: z.string().openapi({ example: 'Personagem excluído com sucesso' }),
});

export type AbilityScoreIncrease = z.infer<typeof AbilityScoreIncreaseSchema>;
export type AttributeBonusPerLevel = z.infer<typeof AttributeBonusPerLevelSchema>;
export type AttackOption = z.infer<typeof AttackOptionSchema>;
export type SpellOption = z.infer<typeof SpellOptionSchema>;
export type SelectionRules = z.infer<typeof SelectionRulesSchema>;
export type SelectedAttack = z.infer<typeof SelectedAttackSchema>;
export type SelectedSpell = z.infer<typeof SelectedSpellSchema>;

export type Race = z.infer<typeof RaceSchema>;
export type Class = z.infer<typeof ClassSchema>;
export type GetCharacterOptions = z.infer<typeof GetCharacterOptionsSchema>;
export type CharacterOptionsResponse = z.infer<typeof CharacterOptionsResponseSchema>;

export type Character = z.infer<typeof CharacterSchema>;
export type CreateCharacter = z.infer<typeof CreateCharacterSchema>;
export type UpdateCharacter = z.infer<typeof UpdateCharacterSchema>;
export type GetCharacters = z.infer<typeof GetCharactersSchema>;
export type GetCharacter = z.infer<typeof GetCharacterSchema>;
export type DeleteCharacter = z.infer<typeof DeleteCharacterSchema>;
export type CharacterResponse = z.infer<typeof CharacterResponseSchema>;
export type CharactersList = z.infer<typeof CharactersListSchema>;
export type DeleteCharacterResponse = z.infer<typeof DeleteCharacterResponseSchema>;

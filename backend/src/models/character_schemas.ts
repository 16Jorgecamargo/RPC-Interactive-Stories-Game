import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';

extendZodWithOpenApi(z);

export const RaceEnum = z.enum(['Human', 'Elf', 'Dwarf', 'Halfling']).openapi({
  example: 'Human',
});

export const ClassEnum = z.enum(['Warrior', 'Mage', 'Rogue', 'Cleric']).openapi({
  example: 'Warrior',
});

export const RaceSchema = z.object({
  id: z.string().openapi({ example: 'human' }),
  name: z.string().openapi({ example: 'Human' }),
  description: z.string().openapi({ example: 'Versáteis e adaptáveis, humanos são a raça mais comum' }),
  traits: z.array(z.string()).openapi({ example: ['+1 em todos os atributos', 'Versátil'] }),
});

export const ClassSchema = z.object({
  id: z.string().openapi({ example: 'warrior' }),
  name: z.string().openapi({ example: 'Warrior' }),
  description: z.string().openapi({ example: 'Guerreiros são mestres do combate corpo a corpo' }),
  traits: z.array(z.string()).openapi({ example: ['Proficiência com armas pesadas', 'Alta constituição'] }),
});

export const GetCharacterOptionsSchema = z.object({
  token: z.string().openapi({ example: 'eyJhbGc...' }),
});

export const CharacterOptionsResponseSchema = z.object({
  races: z.array(RaceSchema),
  classes: z.array(ClassSchema),
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
});

export const CharacterSchema = z.object({
  id: z.string().openapi({ example: 'char_123e4567-e89b-12d3-a456-426614174000' }),
  name: z.string().min(3).max(50).openapi({ example: 'Thorin Escudo de Carvalho' }),
  race: RaceEnum,
  class: ClassEnum,
  attributes: AttributesSchema,
  background: BackgroundSchema,
  equipment: z.array(z.string()).openapi({
    example: ['Espada longa', 'Escudo de aço', 'Armadura de placas', 'Poção de cura'],
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
  name: z.string().min(3).max(50).openapi({ example: 'Thorin Escudo de Carvalho' }),
  race: RaceEnum,
  class: ClassEnum,
  attributes: AttributesSchema,
  background: BackgroundSchema,
  equipment: z.array(z.string()).openapi({
    example: ['Espada longa', 'Escudo de aço', 'Armadura de placas'],
  }),
});

export const UpdateCharacterSchema = z.object({
  token: z.string().openapi({ example: 'eyJhbGc...' }),
  characterId: z.string().openapi({ example: 'char_123e4567-e89b-12d3-a456-426614174000' }),
  name: z.string().min(3).max(50).optional().openapi({ example: 'Thorin Filho do Ferro' }),
  race: RaceEnum.optional(),
  class: ClassEnum.optional(),
  attributes: AttributesSchema.optional(),
  background: BackgroundSchema.optional(),
  equipment: z.array(z.string()).optional().openapi({
    example: ['Espada longa +1', 'Escudo mágico'],
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

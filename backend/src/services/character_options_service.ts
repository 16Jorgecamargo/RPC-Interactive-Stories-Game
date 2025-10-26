import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { verifyToken } from '../utils/jwt.js';
import { JSON_RPC_ERRORS } from '../models/jsonrpc_schemas.js';
import {
  GetCharacterOptions,
  CharacterOptionsResponse,
} from '../models/character_schemas.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const STORIES_DIR = path.join(__dirname, '../../stories');

export async function getCharacterOptions(
  params: GetCharacterOptions
): Promise<CharacterOptionsResponse> {
  verifyToken(params.token);

  const { storyId } = params;

  const playerOptionsPath = path.join(STORIES_DIR, storyId, 'player-options.json');

  if (!fs.existsSync(playerOptionsPath)) {
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: `Opções de personagem não encontradas para a história "${storyId}"`,
      data: { storyId, path: playerOptionsPath },
    };
  }

  try {
    const fileContent = fs.readFileSync(playerOptionsPath, 'utf-8');
    const playerOptions = JSON.parse(fileContent);

    return {
      races: playerOptions.races || [],
      classes: playerOptions.classes || [],
      spells: playerOptions.spells,
      backgrounds: playerOptions.backgrounds,
      equipment: playerOptions.equipment,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    throw {
      ...JSON_RPC_ERRORS.SERVER_ERROR,
      message: `Erro ao carregar opções de personagem: ${errorMessage}`,
      data: { storyId, details: errorMessage },
    };
  }
}

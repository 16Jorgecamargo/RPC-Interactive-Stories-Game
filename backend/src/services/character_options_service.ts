import { verifyToken } from '../utils/jwt.js';
import {
  GetCharacterOptions,
  CharacterOptionsResponse,
  Race,
  Class,
} from '../models/character_schemas.js';

const races: Race[] = [
  {
    id: 'human',
    name: 'Human',
    description: 'Versáteis e adaptáveis, humanos são a raça mais comum e diversificada. Sua ambição e determinação os levam a explorar todos os cantos do mundo.',
    traits: [
      '+1 em todos os atributos',
      'Versátil: pode se adaptar a qualquer classe',
      'Ambicioso: bônus em testes de persuasão',
      'Resiliente: recuperação mais rápida',
    ],
  },
  {
    id: 'elf',
    name: 'Elf',
    description: 'Graciosos e longevos, elfos possuem conexão profunda com a magia e a natureza. Seus sentidos aguçados e agilidade são lendários.',
    traits: [
      '+2 Destreza, +1 Inteligência',
      'Visão no escuro: enxerga até 18m no escuro',
      'Sentidos aguçados: vantagem em Percepção',
      'Transe élfico: medita 4h em vez de dormir 8h',
    ],
  },
  {
    id: 'dwarf',
    name: 'Dwarf',
    description: 'Robustos e resistentes, anões são mestres artesãos e guerreiros destemidos. Sua lealdade ao clã e resistência a venenos são incomparáveis.',
    traits: [
      '+2 Constituição, +1 Força',
      'Visão no escuro: enxerga até 18m no escuro',
      'Resistência anã: vantagem contra venenos',
      'Conhecimento de pedra: especialista em mineração',
    ],
  },
  {
    id: 'halfling',
    name: 'Halfling',
    description: 'Pequenos e ágeis, halflings são conhecidos por sua sorte extraordinária e espírito aventureiro. Sua natureza amigável conquista aliados facilmente.',
    traits: [
      '+2 Destreza, +1 Carisma',
      'Sortudo: pode rerrolar 1 em testes',
      'Corajoso: vantagem contra medo',
      'Agilidade halfling: pode se mover entre criaturas maiores',
    ],
  },
];

const classes: Class[] = [
  {
    id: 'warrior',
    name: 'Warrior',
    description: 'Mestres do combate corpo a corpo, guerreiros são especialistas em táticas de batalha e domínio de armas. Sua resistência e força são incomparáveis.',
    traits: [
      'Proficiência com todas as armas e armaduras',
      'Estilo de combate: especialização em armas',
      'Second Wind: recupera pontos de vida em batalha',
      'Action Surge: ação extra em combate',
    ],
  },
  {
    id: 'mage',
    name: 'Mage',
    description: 'Estudiosos das artes arcanas, magos manipulam a essência da magia para lançar feitiços poderosos. Seu conhecimento místico é vasto.',
    traits: [
      'Lançador de feitiços arcanos',
      'Grimório: aprende novos feitiços estudando',
      'Recuperação arcana: recupera slots de magia',
      'Escola de magia: especialização em tipo de feitiço',
    ],
  },
  {
    id: 'rogue',
    name: 'Rogue',
    description: 'Especialistas em furtividade e precisão, ladinos usam astúcia e agilidade para superar desafios. Mestres do ataque surpresa e infiltração.',
    traits: [
      'Ataque furtivo: dano extra em ataques surpresa',
      'Especialista: dobra bônus de proficiência',
      'Evasão: esquiva ataques em área',
      'Ação ardilosa: esconder/desengajar como bônus',
    ],
  },
  {
    id: 'cleric',
    name: 'Cleric',
    description: 'Servos divinos com poder de cura e proteção, clérigos canalizam energia sagrada para auxiliar aliados e punir inimigos. Sua fé é sua força.',
    traits: [
      'Lançador de feitiços divinos',
      'Canalizar divindade: poder especial da divindade',
      'Domínio divino: especialização em aspecto divino',
      'Curar ferimentos: restaura pontos de vida',
    ],
  },
];

export async function getCharacterOptions(
  params: GetCharacterOptions
): Promise<CharacterOptionsResponse> {
  verifyToken(params.token);

  return {
    races,
    classes,
  };
}

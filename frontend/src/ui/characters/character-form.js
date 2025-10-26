import RpcClient from '../../rpc/client.js';
import { getToken, requireAuth } from '../../utils/auth.js';
import { handleError, showNotification } from '../shared/utils.js';

requireAuth();

const client = new RpcClient();
const token = getToken();

const TOTAL_STEPS = 8;
const MAX_POINTS = 27;
const PROFICIENCY_BONUS = 2;
const POINT_BUY_COSTS = {
  8: 0,
  9: 1,
  10: 2,
  11: 3,
  12: 4,
  13: 5,
  14: 7,
  15: 9,
};

let currentStep = 1;
let sessionId = null;
let storyId = null;
let playerOptions = null;
let characterId = null;
let isEditMode = false;
let originalCharacter = null;

let selectedRace = null;
let selectedClass = null;

let selectedAttackIds = [];
let selectedSpellIds = [];
let maxAttacks = 0;
let maxSpells = 0;

function filterAbilitiesByLevel(items, level = 1) {
  if (!Array.isArray(items)) {
    return [];
  }
  return items.filter((item) => (item.level ?? 1) === level);
}

const derivedState = {
  proficiencies: {
    armor: [],
    weapons: [],
    tools: [],
    skills: [],
    other: [],
  },
  equipment: [],
  attacks: [],
  spells: [],
  combat: {
    armorClass: null,
    armorSource: '',
    initiative: null,
    speed: null,
    hitDice: '',
    maxHp: null,
    currentHp: null,
    tempHp: 0,
  },
};

const elements = {
  form: document.getElementById('characterForm'),
  errorMessage: document.getElementById('errorMessage'),
  storyName: document.getElementById('storyName'),
  storyDescription: document.getElementById('storyDescription'),

  progressSteps: document.querySelectorAll('.progress-step'),
  stepContainers: document.querySelectorAll('.wizard-step'),

  prevBtn: document.getElementById('prevBtn'),
  nextBtn: document.getElementById('nextBtn'),
  cancelBtn: document.getElementById('cancelBtn'),
  submitBtn: document.getElementById('submitBtn'),
  submitText: document.getElementById('submitText'),
  submitLoader: document.getElementById('submitLoader'),

  characterName: document.getElementById('characterName'),

  racesGrid: document.getElementById('racesGrid'),
  classesGrid: document.getElementById('classesGrid'),

  strengthBase: document.getElementById('strength-base'),
  strengthBonus: document.getElementById('strength-bonus'),
  strengthTotal: document.getElementById('strength-total'),
  dexterityBase: document.getElementById('dexterity-base'),
  dexterityBonus: document.getElementById('dexterity-bonus'),
  dexterityTotal: document.getElementById('dexterity-total'),
  constitutionBase: document.getElementById('constitution-base'),
  constitutionBonus: document.getElementById('constitution-bonus'),
  constitutionTotal: document.getElementById('constitution-total'),
  intelligenceBase: document.getElementById('intelligence-base'),
  intelligenceBonus: document.getElementById('intelligence-bonus'),
  intelligenceTotal: document.getElementById('intelligence-total'),
  wisdomBase: document.getElementById('wisdom-base'),
  wisdomBonus: document.getElementById('wisdom-bonus'),
  wisdomTotal: document.getElementById('wisdom-total'),
  charismaBase: document.getElementById('charisma-base'),
  charismaBonus: document.getElementById('charisma-bonus'),
  charismaTotal: document.getElementById('charisma-total'),
  pointsUsed: document.getElementById('pointsUsed'),

  appearance: document.getElementById('appearance'),
  personality: document.getElementById('personality'),
  fears: document.getElementById('fears'),
  goals: document.getElementById('goals'),

  attacksGrid: document.getElementById('attacksGrid'),
  attacksSelected: document.getElementById('attacksSelected'),
  attacksMax: document.getElementById('attacksMax'),
  spellsGrid: document.getElementById('spellsGrid'),
  spellsSelected: document.getElementById('spellsSelected'),
  spellsMax: document.getElementById('spellsMax'),

  statArmorClass: document.getElementById('statArmorClass'),
  statArmorSource: document.getElementById('statArmorSource'),
  statInitiative: document.getElementById('statInitiative'),
  statSpeed: document.getElementById('statSpeed'),
  statHitDice: document.getElementById('statHitDice'),
  statMaxHp: document.getElementById('statMaxHp'),
  statCurrentHp: document.getElementById('statCurrentHp'),

  reviewSummary: document.getElementById('reviewSummary'),

  cancelDialog: document.getElementById('cancelDialog'),
  cancelDialogYes: document.getElementById('cancelDialogYes'),
  cancelDialogNo: document.getElementById('cancelDialogNo'),
};

document.addEventListener('DOMContentLoaded', async () => {
  const urlParams = new URLSearchParams(window.location.search);
  sessionId = urlParams.get('sessionId');
  characterId = urlParams.get('characterId');
  isEditMode = Boolean(characterId);

  try {
    if (isEditMode) {
      try {
        originalCharacter = await client.call('getCharacter', {
          token,
          characterId,
        });
        if (!sessionId && originalCharacter?.sessionId) {
          sessionId = originalCharacter.sessionId;
        }
      } catch (error) {
        console.error('Erro ao carregar personagem para edição:', error);
        handleError(error);
        setTimeout(() => {
          window.location.href = '/home.html';
        }, 2000);
        return;
      }
    }

    if (!sessionId) {
      showNotification('ID da sessão não encontrado', 'error');
      setTimeout(() => {
        window.location.href = '/home.html';
      }, 2000);
      return;
    }

    await loadSessionAndOptions();

    if (isEditMode) {
      await applyCharacterDataForEdit();
      elements.submitText.textContent = 'Salvar Alterações';
    }

    setupEventListeners();
    showStep(1);
    if (isEditMode) {
      updateReviewSummary();
    }
  } catch (error) {
    console.error('Erro na inicialização do formulário:', error);
    handleError(error);
    setTimeout(() => {
      window.location.href = `/waiting-room.html?sessionId=${sessionId ?? ''}`;
    }, 2000);
  }
});

async function loadSessionAndOptions() {
  try {
    const sessionResponse = await client.call('getSessionDetails', {
      token,
      sessionId,
    });

    storyId = sessionResponse.session.storyId;

    if (sessionResponse.story) {
      elements.storyName.textContent = `⚔️ ${sessionResponse.story.title}`;
      elements.storyDescription.textContent = `"${sessionResponse.story.description}"`;
    }

    const optionsResponse = await client.call('getCharacterOptions', {
      token,
      storyId,
    });

    playerOptions = optionsResponse;

    renderRaces();
    renderClasses();
  } catch (error) {
    console.error('Erro ao carregar dados da sessão:', error);
    handleError(error);
    setTimeout(() => {
      window.location.href = `/waiting-room.html?sessionId=${sessionId}`;
    }, 2000);
  }
}

function findRaceOptionByValue(value) {
  if (!playerOptions?.races || !value) return null;
  return (
    playerOptions.races.find((race) => race.id === value || race.name === value) ||
    null
  );
}

function findClassOptionByValue(value) {
  if (!playerOptions?.classes || !value) return null;
  return (
    playerOptions.classes.find((charClass) => charClass.id === value || charClass.name === value) ||
    null
  );
}

function clampBaseAttribute(value) {
  return Math.max(8, Math.min(15, value));
}

function prefillAttributeInputs(character) {
  const attributes = character.attributes || {};
  const raceBonuses = selectedRace?.abilityScoreIncrease || {};
  const classBonuses = getClassBonuses();

  const baseValues = {
    strength: clampBaseAttribute((attributes.strength || 8) - (raceBonuses.strength || 0) - (classBonuses.strength || 0)),
    dexterity: clampBaseAttribute((attributes.dexterity || 8) - (raceBonuses.dexterity || 0) - (classBonuses.dexterity || 0)),
    constitution: clampBaseAttribute((attributes.constitution || 8) - (raceBonuses.constitution || 0) - (classBonuses.constitution || 0)),
    intelligence: clampBaseAttribute((attributes.intelligence || 8) - (raceBonuses.intelligence || 0) - (classBonuses.intelligence || 0)),
    wisdom: clampBaseAttribute((attributes.wisdom || 8) - (raceBonuses.wisdom || 0) - (classBonuses.wisdom || 0)),
    charisma: clampBaseAttribute((attributes.charisma || 8) - (raceBonuses.charisma || 0) - (classBonuses.charisma || 0)),
  };

  elements.strengthBase.value = baseValues.strength;
  elements.dexterityBase.value = baseValues.dexterity;
  elements.constitutionBase.value = baseValues.constitution;
  elements.intelligenceBase.value = baseValues.intelligence;
  elements.wisdomBase.value = baseValues.wisdom;
  elements.charismaBase.value = baseValues.charisma;
}

async function applyCharacterDataForEdit() {
  if (!isEditMode || !characterId) return;

  try {
    if (!originalCharacter) {
      originalCharacter = await client.call('getCharacter', {
        token,
        characterId,
      });
    }

    const character = originalCharacter;
    if (!character) {
      throw new Error('Personagem não encontrado para edição.');
    }

    elements.characterName.value = character.name || '';

    const background = character.background || {};
    elements.appearance.value = background.appearance || '';
    elements.personality.value = background.personality || '';
    elements.fears.value = background.fears || '';
    elements.goals.value = background.goals || '';

    selectedRace = findRaceOptionByValue(character.race) || selectedRace;
    selectedClass = findClassOptionByValue(character.class) || selectedClass;

    if (selectedClass) {
      setupClassAbilities(selectedClass);
    }

    selectedAttackIds = (character.selectedAttacks || [])
      .map((attack) => attack.id)
      .filter(Boolean);
    selectedSpellIds = (character.selectedSpells || [])
      .map((spell) => spell.id)
      .filter(Boolean);

    derivedState.equipment = Array.isArray(character.equipment) ? [...character.equipment] : [];
    derivedState.proficiencies = character.sheet?.proficiencies || {
      armor: [],
      weapons: [],
      tools: [],
      skills: [],
      other: [],
    };
    derivedState.attacks = character.sheet?.attacks || derivedState.attacks;
    derivedState.spells = character.selectedSpells || derivedState.spells;
    derivedState.combat = {
      ...derivedState.combat,
      ...(character.sheet?.combatStats || {}),
    };

    prefillAttributeInputs(character);

    renderRaces();
    renderClasses();
    renderAbilities();
    updateRacialBonuses();
    updateAttributeTotals();
    updateAbilityCounters();
    updateReviewSummary();
  } catch (error) {
    console.error('Erro ao aplicar dados do personagem para edição:', error);
    throw error;
  }
}

function setupEventListeners() {
  elements.prevBtn.addEventListener('click', previousStep);
  elements.nextBtn.addEventListener('click', nextStep);
  elements.cancelBtn.addEventListener('click', () => {
    elements.cancelDialog.style.display = 'flex';
  });
  elements.cancelDialogYes.addEventListener('click', () => {
    window.location.href = `/waiting-room.html?sessionId=${sessionId}`;
  });
  elements.cancelDialogNo.addEventListener('click', () => {
    elements.cancelDialog.style.display = 'none';
  });

  elements.form.addEventListener('submit', handleSubmit);

  [
    elements.strengthBase,
    elements.dexterityBase,
    elements.constitutionBase,
    elements.intelligenceBase,
    elements.wisdomBase,
    elements.charismaBase,
  ].forEach((input) => {
    input.addEventListener('input', () => {
      updateAttributeTotals();
      updateCombatStats();
    });
  });
}

function showStep(step) {
  currentStep = step;

  elements.stepContainers.forEach((container, index) => {
    container.classList.toggle('active', index + 1 === step);
  });

  elements.progressSteps.forEach((progress, index) => {
    if (index + 1 < step) {
      progress.classList.add('completed');
      progress.classList.remove('active');
    } else if (index + 1 === step) {
      progress.classList.add('active');
      progress.classList.remove('completed');
    } else {
      progress.classList.remove('active', 'completed');
    }
  });

  elements.prevBtn.disabled = step === 1;
  if (step === TOTAL_STEPS) {
    elements.nextBtn.style.display = 'none';
    elements.submitBtn.style.display = 'inline-block';
    updateReviewSummary();
  } else {
    elements.nextBtn.style.display = 'inline-block';
    elements.submitBtn.style.display = 'none';
  }

  hideError();
}

function nextStep() {
  if (!validateStep(currentStep)) {
    return;
  }
  if (currentStep < TOTAL_STEPS) {
    showStep(currentStep + 1);
  }
}

function previousStep() {
  if (currentStep > 1) {
    showStep(currentStep - 1);
  }
}

function renderRaces() {
  if (!playerOptions?.races?.length) {
    elements.racesGrid.innerHTML = '<p class="empty-state">Nenhuma raça disponível.</p>';
    return;
  }

  elements.racesGrid.innerHTML = '';

  playerOptions.races.forEach((race) => {
    const card = document.createElement('div');
    card.className = 'option-card';
    card.dataset.raceId = race.id;

    const bonuses = race.abilityScoreIncrease || {};
    const bonusText = Object.entries(bonuses)
      .filter(([, value]) => value > 0)
      .map(([key, value]) => `+${value} ${capitalizeFirst(key)}`)
      .join(', ');

    card.innerHTML = `
      <h3>${race.name}</h3>
      <p>${race.description || ''}</p>
      ${bonusText ? `<p style="color: var(--primary-gold); font-weight: bold;">Bônus: ${bonusText}</p>` : ''}
    `;

    card.addEventListener('click', () => {
      if (selectedRace?.id === race.id) {
        return;
      }
      selectedRace = race;
      elements.racesGrid.querySelectorAll('.option-card').forEach((node) => node.classList.remove('selected'));
      card.classList.add('selected');
      updateRacialBonuses();
      updateDerivedData();
      updateCombatStats();
    });

    elements.racesGrid.appendChild(card);

    if (selectedRace?.id === race.id) {
      card.classList.add('selected');
    }
  });
}

function renderClasses() {
  if (!playerOptions?.classes?.length) {
    elements.classesGrid.innerHTML = '<p class="empty-state">Nenhuma classe disponível.</p>';
    return;
  }

  elements.classesGrid.innerHTML = '';

  playerOptions.classes.forEach((charClass) => {
    const card = document.createElement('div');
    card.className = 'option-card';
    card.dataset.classId = charClass.id;

    const primaryAttrs = charClass.primaryAttributes?.join(', ') || 'N/A';

    card.innerHTML = `
      <h3>${charClass.name}</h3>
      <p>${charClass.description || ''}</p>
      <p style="color: var(--primary-gold);">Atributos Principais: ${primaryAttrs}</p>
      <p style="color: var(--parchment); font-size: 0.9em;">Arma: ${charClass.weaponBase || 'N/A'}</p>
    `;

    card.addEventListener('click', () => {
      if (selectedClass?.id === charClass.id) {
        return;
      }

      selectedClass = charClass;
      elements.classesGrid.querySelectorAll('.option-card').forEach((node) => node.classList.remove('selected'));
      card.classList.add('selected');

      setupClassAbilities(charClass);
      updateDerivedData();
      renderAbilities();
    });

    elements.classesGrid.appendChild(card);

    if (selectedClass?.id === charClass.id) {
      card.classList.add('selected');
    }
  });
}

function setupClassAbilities(charClass) {
  selectedAttackIds = [];
  selectedSpellIds = [];

  if (!charClass || !charClass.selectionRules) {
    maxAttacks = 0;
    maxSpells = 0;
    return;
  }

  maxAttacks = charClass.selectionRules.attacksToSelect || 0;
  maxSpells = charClass.selectionRules.spellsToSelect || 0;
}

function renderAbilities() {
  renderAttackOptions();
  renderSpellOptions();
  updateAbilityCounters();
  syncSelectedAbilities();
}

function renderAttackOptions() {
  elements.attacksGrid.innerHTML = '';

  const levelOneAttacks = filterAbilitiesByLevel(selectedClass?.attacks);

  if (!selectedClass || levelOneAttacks.length === 0) {
    elements.attacksGrid.innerHTML = '<p class="empty-state">Selecione uma classe para visualizar os ataques disponíveis.</p>';
    elements.attacksGrid.classList.add('empty-state');
    return;
  }

  elements.attacksGrid.classList.remove('empty-state');

  levelOneAttacks.forEach((attack) => {
    const isSelected = selectedAttackIds.includes(attack.id);
    const card = document.createElement('div');
    card.className = `spell-card ability-card ability-card--attack${isSelected ? ' selected' : ''}`;
    card.dataset.attackId = attack.id;

    const cooldownText = attack.cooldown === 0 ? 'Sem cooldown' : `Cooldown: ${attack.cooldown} turnos`;

    card.innerHTML = `
      <div class="ability-card__header">
        <span class="ability-card__name">${attack.name}</span>
        <span class="ability-card__damage">${attack.damage}</span>
      </div>
      <div class="ability-card__description">${attack.description}</div>
      <div class="ability-card__usage">${cooldownText}</div>
    `;

    card.addEventListener('click', () => toggleAttackSelection(attack.id));
    elements.attacksGrid.appendChild(card);
  });
}

function renderSpellOptions() {
  elements.spellsGrid.innerHTML = '';

  const levelOneSpells = filterAbilitiesByLevel(selectedClass?.spells);

  if (!selectedClass || levelOneSpells.length === 0) {
    elements.spellsGrid.innerHTML = '<p class="empty-state">Selecione uma classe para visualizar as magias disponíveis.</p>';
    elements.spellsGrid.classList.add('empty-state');
    return;
  }

  elements.spellsGrid.classList.remove('empty-state');

  levelOneSpells.forEach((spell) => {
    const isSelected = selectedSpellIds.includes(spell.id);
    const card = document.createElement('div');
    card.className = `spell-card ability-card ability-card--spell${isSelected ? ' selected' : ''}`;
    card.dataset.spellId = spell.id;

    const effectsText = spell.effects?.join(', ') || '';
    const usageText = `${spell.usageLimit} usos`;

    card.innerHTML = `
      <div class="ability-card__header">
        <span class="ability-card__name">${spell.name}</span>
        <span class="ability-card__damage">${spell.damage}</span>
      </div>
      <div class="ability-card__effect">${effectsText}</div>
      <div class="ability-card__description">${spell.description}</div>
      <div class="ability-card__usage">${usageText}</div>
    `;

    card.addEventListener('click', () => toggleSpellSelection(spell.id));
    elements.spellsGrid.appendChild(card);
  });
}

function toggleAttackSelection(attackId) {
  if (selectedAttackIds.includes(attackId)) {
    selectedAttackIds = selectedAttackIds.filter((id) => id !== attackId);
  } else {
    if (maxAttacks > 0 && selectedAttackIds.length >= maxAttacks) {
      showError(`Selecione exatamente ${maxAttacks} ataques.`);
      return;
    }
    selectedAttackIds.push(attackId);
  }

  renderAbilities();
}

function toggleSpellSelection(spellId) {
  if (selectedSpellIds.includes(spellId)) {
    selectedSpellIds = selectedSpellIds.filter((id) => id !== spellId);
  } else {
    if (maxSpells > 0 && selectedSpellIds.length >= maxSpells) {
      showError(`Selecione exatamente ${maxSpells} magias.`);
      return;
    }
    selectedSpellIds.push(spellId);
  }

  renderAbilities();
}

function updateAbilityCounters() {
  elements.attacksSelected.textContent = selectedAttackIds.length;
  elements.attacksMax.textContent = maxAttacks;
  elements.spellsSelected.textContent = selectedSpellIds.length;
  elements.spellsMax.textContent = maxSpells;
}

function syncSelectedAbilities() {
  if (!selectedClass) {
    derivedState.attacks = [];
    derivedState.spells = [];
    return;
  }

  derivedState.attacks = filterAbilitiesByLevel(selectedClass.attacks)
    .filter((attack) => selectedAttackIds.includes(attack.id))
    .map((attack) => ({
      name: attack.name,
      attackBonus: 'Base da classe',
      damage: attack.damage,
      notes: attack.description || '',
    }));

  derivedState.spells = filterAbilitiesByLevel(selectedClass.spells)
    .filter((spell) => selectedSpellIds.includes(spell.id))
    .map((spell) => ({
      id: spell.id,
      name: spell.name,
      damage: spell.damage,
      effect: spell.effects?.join(', ') || '',
      usageLabel: `${spell.usageLimit} usos`,
      description: spell.description,
    }));
}

function getAttributeCost(value) {
  const val = parseInt(value, 10);
  if (Number.isNaN(val) || val < 8) return 0;
  if (val > 15) return POINT_BUY_COSTS[15];
  return POINT_BUY_COSTS[val] || 0;
}

function calculateTotalPointsUsed() {
  const costs = [
    getAttributeCost(elements.strengthBase.value),
    getAttributeCost(elements.dexterityBase.value),
    getAttributeCost(elements.constitutionBase.value),
    getAttributeCost(elements.intelligenceBase.value),
    getAttributeCost(elements.wisdomBase.value),
    getAttributeCost(elements.charismaBase.value),
  ];
  return costs.reduce((sum, cost) => sum + cost, 0);
}

function formatBonus(value) {
  const bonus = Number(value) || 0;
  return bonus >= 0 ? `+${bonus}` : `${bonus}`;
}

function updateRacialBonuses() {
  const bonuses = selectedRace?.abilityScoreIncrease || {};
  elements.strengthBonus.textContent = formatBonus(bonuses.strength || 0);
  elements.dexterityBonus.textContent = formatBonus(bonuses.dexterity || 0);
  elements.constitutionBonus.textContent = formatBonus(bonuses.constitution || 0);
  elements.intelligenceBonus.textContent = formatBonus(bonuses.intelligence || 0);
  elements.wisdomBonus.textContent = formatBonus(bonuses.wisdom || 0);
  elements.charismaBonus.textContent = formatBonus(bonuses.charisma || 0);
  updateAttributeTotals();
}

function getClassBonuses() {
  if (!selectedClass?.attributeBonusPerLevel) {
    return {
      strength: 0,
      dexterity: 0,
      constitution: 0,
      intelligence: 0,
      wisdom: 0,
      charisma: 0,
    };
  }

  const level1Bonuses = selectedClass.attributeBonusPerLevel.find((b) => b.level === 1);
  if (!level1Bonuses) {
    return {
      strength: 0,
      dexterity: 0,
      constitution: 0,
      intelligence: 0,
      wisdom: 0,
      charisma: 0,
    };
  }

  return level1Bonuses;
}

function updateAttributeTotals() {
  const strBase = parseInt(elements.strengthBase.value, 10) || 8;
  const dexBase = parseInt(elements.dexterityBase.value, 10) || 8;
  const conBase = parseInt(elements.constitutionBase.value, 10) || 8;
  const intBase = parseInt(elements.intelligenceBase.value, 10) || 8;
  const wisBase = parseInt(elements.wisdomBase.value, 10) || 8;
  const chaBase = parseInt(elements.charismaBase.value, 10) || 8;

  const racialBonus = {
    strength: parseInt(elements.strengthBonus.textContent, 10) || 0,
    dexterity: parseInt(elements.dexterityBonus.textContent, 10) || 0,
    constitution: parseInt(elements.constitutionBonus.textContent, 10) || 0,
    intelligence: parseInt(elements.intelligenceBonus.textContent, 10) || 0,
    wisdom: parseInt(elements.wisdomBonus.textContent, 10) || 0,
    charisma: parseInt(elements.charismaBonus.textContent, 10) || 0,
  };

  const classBonus = getClassBonuses();

  elements.strengthTotal.textContent = strBase + racialBonus.strength + classBonus.strength;
  elements.dexterityTotal.textContent = dexBase + racialBonus.dexterity + classBonus.dexterity;
  elements.constitutionTotal.textContent = conBase + racialBonus.constitution + classBonus.constitution;
  elements.intelligenceTotal.textContent = intBase + racialBonus.intelligence + classBonus.intelligence;
  elements.wisdomTotal.textContent = wisBase + racialBonus.wisdom + classBonus.wisdom;
  elements.charismaTotal.textContent = chaBase + racialBonus.charisma + classBonus.charisma;

  const pointsUsed = calculateTotalPointsUsed();
  elements.pointsUsed.textContent = pointsUsed;
  if (pointsUsed !== MAX_POINTS) {
    elements.pointsUsed.classList.add('warning');
  } else {
    elements.pointsUsed.classList.remove('warning');
  }
}

function updateDerivedData() {
  const profs = {
    armor: new Set(),
    weapons: new Set(),
  };

  if (selectedClass?.weaponBase) {
    profs.weapons.add(selectedClass.weaponBase);
  }

  derivedState.proficiencies = {
    armor: Array.from(profs.armor),
    weapons: Array.from(profs.weapons),
    tools: [],
    skills: [],
    other: [],
  };

  derivedState.equipment = selectedClass?.weaponBase ? [selectedClass.weaponBase] : [];

  syncSelectedAbilities();
  updateAbilityCounters();
  updateCombatStats();
}

function getAbilityModifier(value) {
  const number = Number(value);
  if (Number.isNaN(number)) return 0;
  return Math.floor((number - 10) / 2);
}

function updateCombatStats() {
  const dexMod = getAbilityModifier(elements.dexterityTotal.textContent);
  const conMod = getAbilityModifier(elements.constitutionTotal.textContent);

  const hitDie = '1d8';
  const maxHp = Math.max(1, 8 + conMod);
  const speed = 30;
  const armorClass = 10 + dexMod;

  derivedState.combat = {
    armorClass,
    armorSource: 'Sem armadura',
    initiative: dexMod,
    speed,
    hitDice: hitDie,
    maxHp,
    currentHp: maxHp,
    tempHp: 0,
  };

  elements.statArmorClass.textContent = armorClass;
  elements.statArmorSource.textContent = 'Sem armadura';
  elements.statInitiative.textContent = dexMod >= 0 ? `+${dexMod}` : `${dexMod}`;
  elements.statSpeed.textContent = `${speed} ft`;
  elements.statHitDice.textContent = hitDie;
  elements.statMaxHp.textContent = maxHp;
  elements.statCurrentHp.textContent = maxHp;
}

function validateStep(step) {
  switch (step) {
    case 1: {
      const name = elements.characterName.value.trim();
      if (!name || name.length < 3 || name.length > 50) {
        showError('O nome do personagem deve ter entre 3 e 50 caracteres.');
        return false;
      }
      return true;
    }
    case 2:
      if (!selectedRace) {
        showError('Selecione uma raça antes de continuar.');
        return false;
      }
      return true;
    case 3:
      if (!selectedClass) {
        showError('Selecione uma classe antes de continuar.');
        return false;
      }
      return true;
    case 4: {
      const attributes = [
        elements.strengthBase.value,
        elements.dexterityBase.value,
        elements.constitutionBase.value,
        elements.intelligenceBase.value,
        elements.wisdomBase.value,
        elements.charismaBase.value,
      ];
      for (const attr of attributes) {
        const val = parseInt(attr, 10);
        if (Number.isNaN(val) || val < 8 || val > 15) {
          showError('Todos os atributos base devem estar entre 8 e 15.');
          return false;
        }
      }
      const points = calculateTotalPointsUsed();
      if (points !== MAX_POINTS) {
        showError(`Você precisa usar exatamente ${MAX_POINTS} pontos. Atualmente: ${points}.`);
        return false;
      }
      return true;
    }
    case 5: {
      const textFields = [elements.appearance, elements.personality, elements.fears, elements.goals];
      for (const field of textFields) {
        const text = field.value.trim();
        if (text.length < 10 || text.length > 500) {
          showError('Os campos narrativos devem ter entre 10 e 500 caracteres.');
          return false;
        }
      }
      return true;
    }
    case 6: {
      if (maxAttacks > 0 && selectedAttackIds.length !== maxAttacks) {
        showError(`Selecione exatamente ${maxAttacks} ataques.`);
        return false;
      }
      if (maxSpells > 0 && selectedSpellIds.length !== maxSpells) {
        showError(`Selecione exatamente ${maxSpells} magias.`);
        return false;
      }
      return true;
    }
    case 7: {
      if (!derivedState.combat.armorClass || !derivedState.combat.hitDice) {
        showError('Não foi possível calcular as estatísticas de combate. Verifique suas escolhas.');
        return false;
      }
      return true;
    }
    default:
      return true;
  }
}

function updateReviewSummary() {
  const sections = [];

  sections.push(`
    <section>
      <h3>Identidade</h3>
      <ul>
        <li><strong>Nome:</strong> ${elements.characterName.value.trim()}</li>
        <li><strong>Raça:</strong> ${selectedRace?.name || '—'}</li>
        <li><strong>Classe:</strong> ${selectedClass?.name || '—'}</li>
      </ul>
    </section>
  `);

  sections.push(`
    <section>
      <h3>Atributos</h3>
      <ul>
        <li><strong>Força:</strong> ${elements.strengthTotal.textContent}</li>
        <li><strong>Destreza:</strong> ${elements.dexterityTotal.textContent}</li>
        <li><strong>Constituição:</strong> ${elements.constitutionTotal.textContent}</li>
        <li><strong>Inteligência:</strong> ${elements.intelligenceTotal.textContent}</li>
        <li><strong>Sabedoria:</strong> ${elements.wisdomTotal.textContent}</li>
        <li><strong>Carisma:</strong> ${elements.charismaTotal.textContent}</li>
      </ul>
    </section>
  `);

  const loadoutEquipment = derivedState.equipment || [];
  sections.push(`
    <section>
      <h3>Equipamentos</h3>
      <ul>
        ${loadoutEquipment.length ? loadoutEquipment.map((item) => `<li>${item}</li>`).join('') : '<li>Kit padrão da classe</li>'}
      </ul>
    </section>
  `);

  sections.push(`
    <section>
      <h3>Ataques</h3>
      <ul>
        ${derivedState.attacks
          .map((attack) => `<li><strong>${attack.name}:</strong> ${attack.damage} | ${attack.notes}</li>`)
          .join('')}
      </ul>
    </section>
  `);

  if (derivedState.spells.length) {
    sections.push(`
      <section>
        <h3>Magias</h3>
        <ul>
          ${derivedState.spells
            .map(
              (spell) => `<li><strong>${spell.name}:</strong> ${spell.damage} | ${spell.effect} (${spell.usageLabel})</li>`
            )
            .join('')}
        </ul>
      </section>
    `);
  }

  sections.push(`
    <section>
      <h3>Combate</h3>
      <ul>
        <li><strong>Classe de Armadura:</strong> ${derivedState.combat.armorClass} (${derivedState.combat.armorSource})</li>
        <li><strong>Iniciativa:</strong> ${derivedState.combat.initiative >= 0 ? '+' : ''}${derivedState.combat.initiative}</li>
        <li><strong>Deslocamento:</strong> ${derivedState.combat.speed ? `${derivedState.combat.speed} ft` : '—'}</li>
        <li><strong>Dados de Vida:</strong> ${derivedState.combat.hitDice}</li>
        <li><strong>PV Máximos:</strong> ${derivedState.combat.maxHp}</li>
      </ul>
    </section>
  `);

  sections.push(`
    <section>
      <h3>História</h3>
      <ul>
        <li><strong>Aparência:</strong> ${elements.appearance.value.trim()}</li>
        <li><strong>Personalidade:</strong> ${elements.personality.value.trim()}</li>
        <li><strong>Medos:</strong> ${elements.fears.value.trim()}</li>
        <li><strong>Objetivos:</strong> ${elements.goals.value.trim()}</li>
      </ul>
    </section>
  `);

  elements.reviewSummary.innerHTML = sections.join('');
}

function buildBackgroundPayload() {
  return {
    ...(originalCharacter?.background || {}),
    appearance: elements.appearance.value.trim(),
    personality: elements.personality.value.trim(),
    fears: elements.fears.value.trim(),
    goals: elements.goals.value.trim(),
  };
}

function buildSheetPayload() {
  const existingSheet = originalCharacter?.sheet || {};
  return {
    ...existingSheet,
    raceId: selectedRace?.id || existingSheet.raceId,
    classId: selectedClass?.id || existingSheet.classId,
    classLevel: selectedClass ? `${selectedClass.name} 1` : existingSheet.classLevel,
    proficiencies: derivedState.proficiencies,
    attacks: derivedState.attacks,
    combatStats: derivedState.combat,
  };
}

function buildCreatePayload() {
  return {
    token,
    sessionId,
    storyId,
    name: elements.characterName.value.trim(),
    race: selectedRace?.id || selectedRace?.name,
    class: selectedClass?.id || selectedClass?.name,
    attributes: {
      strength: parseInt(elements.strengthBase.value, 10),
      dexterity: parseInt(elements.dexterityBase.value, 10),
      constitution: parseInt(elements.constitutionBase.value, 10),
      intelligence: parseInt(elements.intelligenceBase.value, 10),
      wisdom: parseInt(elements.wisdomBase.value, 10),
      charisma: parseInt(elements.charismaBase.value, 10),
    },
    background: buildBackgroundPayload(),
    equipment: derivedState.equipment,
    selectedAttackIds: selectedAttackIds,
    selectedSpellIds: selectedSpellIds,
    sheet: buildSheetPayload(),
  };
}

function buildUpdatePayload() {
  const raceValue = selectedRace?.id || selectedRace?.name || originalCharacter?.race;
  const classValue = selectedClass?.id || selectedClass?.name || originalCharacter?.class;

  return {
    token,
    characterId,
    storyId,
    name: elements.characterName.value.trim(),
    race: raceValue,
    class: classValue,
    attributes: {
      strength: parseInt(elements.strengthBase.value, 10),
      dexterity: parseInt(elements.dexterityBase.value, 10),
      constitution: parseInt(elements.constitutionBase.value, 10),
      intelligence: parseInt(elements.intelligenceBase.value, 10),
      wisdom: parseInt(elements.wisdomBase.value, 10),
      charisma: parseInt(elements.charismaBase.value, 10),
    },
    background: buildBackgroundPayload(),
    equipment: derivedState.equipment,
    selectedAttackIds,
    selectedSpellIds,
    sheet: buildSheetPayload(),
  };
}

function handleSubmit(event) {
  event.preventDefault();

  if (!validateStep(TOTAL_STEPS)) {
    return;
  }

  const payload = isEditMode ? buildUpdatePayload() : buildCreatePayload();
  const rpcMethod = isEditMode ? 'updateCharacter' : 'createCharacter';
  const successMessage = isEditMode
    ? 'Personagem atualizado com sucesso! Redirecionando...'
    : 'Personagem criado com sucesso! Redirecionando...';
  const targetSessionId = sessionId || originalCharacter?.sessionId || null;

  setLoading(true);

  client
    .call(rpcMethod, payload)
    .then(() => {
      setLoading(false);
      showNotification(successMessage, 'success');
      setTimeout(() => {
        if (targetSessionId) {
          window.location.href = `/waiting-room.html?sessionId=${targetSessionId}`;
        } else {
          window.location.href = '/home.html';
        }
      }, 1500);
    })
    .catch((error) => {
      console.error('Erro ao salvar personagem:', error);
      setLoading(false);
      const errorMessage =
        error?.message || error?.error?.message || 'Não foi possível salvar o personagem. Tente novamente.';
      showError(errorMessage);
    });
}

function setLoading(isLoading) {
  elements.submitBtn.disabled = isLoading;
  elements.prevBtn.disabled = isLoading;
  elements.nextBtn.disabled = isLoading;
  elements.cancelBtn.disabled = isLoading;

  if (isLoading) {
    elements.submitText.style.display = 'none';
    elements.submitLoader.style.display = 'inline-block';
  } else {
    elements.submitText.style.display = 'inline';
    elements.submitLoader.style.display = 'none';
  }
}

function showError(message) {
  elements.errorMessage.textContent = message;
  elements.errorMessage.style.display = 'block';

  setTimeout(() => {
    hideError();
  }, 5000);
}

function hideError() {
  elements.errorMessage.textContent = '';
  elements.errorMessage.style.display = 'none';
}

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

# The Lost Mine of Phandelver

**A D&D 5e Adventure for Levels 1-5**

## Overview

The Lost Mine of Phandelver is a classic D&D adventure set in the Sword Coast of the Forgotten Realms. What begins as a simple escort mission becomes an epic quest involving goblin ambushes, sinister conspiracies, ancient ruins, and a legendary lost mine.

### Story Summary

The adventurers are hired by Gundren Rockseeker, a dwarf prospector, to escort a wagon of supplies to the frontier town of Phandalin. When Gundren is ambushed and captured by goblins, the party discovers a conspiracy involving the mysterious "Black Spider" who seeks to claim the legendary Wave Echo Cave and its magical forge.

---

## Adventure Structure

### Part 1: Goblin Arrows (Levels 1-2)
**Location:** Triboar Trail & Cragmaw Hideout
**Key NPCs:** Klarg (bugbear boss), Sildar Hallwinter
**Main Objective:** Survive the goblin ambush and rescue Sildar

The adventure begins with a goblin ambush on the Triboar Trail. Following the goblin tracks leads to Cragmaw Hideout, where the party can rescue Sildar Hallwinter and learn about the greater conspiracy.

**Key Encounters:**
- Goblin ambush (4 goblins)
- Cragmaw Hideout exploration (traps, wolves, goblins)
- Boss fight: Klarg and his guards
- Rescue: Sildar Hallwinter

**Rewards:**
- 10 gp each (from Gundren for wagon delivery)
- Morningstar +1 (from Klarg)
- Letter revealing the Black Spider's involvement

### Part 2: Phandalin (Levels 2-3)
**Location:** Town of Phandalin & Redbrand Hideout
**Key NPCs:** Glasstaff (Iarno Albrek), Townmaster Harbin Wester, various townsfolk
**Main Objective:** Liberate Phandalin from the Redbrands

The party arrives in Phandalin to find the town terrorized by a gang called the Redbrands. Their investigation leads to Tresendar Manor and a confrontation with the gang's mysterious leader, Glasstaff.

**Key Encounters:**
- Redbrand confrontations in town
- Redbrand Hideout dungeon (nothic, ruffians)
- Boss fight: Glasstaff (evil wizard)
- Optional: Rescue the Dendrar family

**Rewards:**
- Staff of Defense (from Glasstaff)
- Ring of Protection
- Evidence about the Black Spider and Cragmaw Castle
- Gratitude of Phandalin

**Side Quests Available:**
- Old Owl Well (undead problem)
- Wyvern Tor (orc raiders)
- Thundertree (dragon!)
- Banshee's bargain

### Part 3: The Spider's Web (Levels 3-4)
**Location:** Wilderness locations around Phandalin
**Key NPCs:** Reidoth (druid), Venomfang (young green dragon), King Grol
**Main Objective:** Locate and assault Cragmaw Castle to rescue Gundren

With clues from Glasstaff's papers, the party explores the wilderness to find Cragmaw Castle and rescue Gundren Rockseeker before he's delivered to the Black Spider.

**Major Locations:**

**Thundertree** (Optional)
- Ruined town overrun by ash zombies and twig blights
- Venomfang the dragon's lair (CR 8 boss fight!)
- Reidoth the druid can provide information
- Dendrar family heirloom quest

**Cragmaw Castle**
- Goblinoid stronghold
- Multiple approach options (stealth, climb, assault)
- Boss fight: King Grol, doppelganger, wolf
- Rescue: Gundren Rockseeker

**Rewards:**
- Map to Wave Echo Cave
- Gundren's information about the Forge of Spells
- Dragon's hoard (if Venomfang defeated)
- Regional fame as heroes

### Part 4: Wave Echo Cave (Levels 4-5)
**Location:** Wave Echo Cave (ancient dwarven mine)
**Key NPCs:** Nezznar the Black Spider, Nundro Rockseeker
**Main Objective:** Defeat the Black Spider and secure the Forge of Spells

The climactic finale takes place in Wave Echo Cave, the legendary mine containing the Forge of Spells. The party must navigate dangerous tunnels, battle monsters and undead, and confront Nezznar the Black Spider in his lair.

**Key Encounters:**
- Ochre jelly, stirges, gricks
- Wraiths and spectral guardians
- Flameskull guardian
- Bugbears and giant spiders (Black Spider's forces)
- Final Boss: Nezznar the Black Spider

**Rewards:**
- Spider Staff (rare magic item)
- Lightbringer mace
- Partnership in Wave Echo Cave mining operation
- Access to the Forge of Spells
- Fame as heroes of the Sword Coast

---

## File Structure

```
backend/stories/lost-mine-phandelver/
├── story.json              # Complete adventure narrative (60+ chapters)
├── monsters.json           # 22 monsters with full D&D 5e stats
├── player-options.json     # Character creation system (races, classes, spells)
└── README.md              # This file
```

### story.json
Contains the complete branching narrative with:
- 60+ interactive chapters
- Multiple choice options affecting the story
- Combat encounters with monster references
- Loot and treasure distribution
- NPCs and dialogue
- Success/failure paths
- Epilogue based on player choices

### monsters.json
Complete monster statistics for 22 creatures:
- **Humanoids:** Goblin, Hobgoblin, Bugbear, Redbrand Ruffian
- **Bosses:** Klarg, Glasstaff, King Grol, Mosk, Black Spider, Venomfang
- **Beasts:** Wolf, Giant Spider, Owlbear, Stirge
- **Aberrations:** Nothic, Doppelganger, Spectator
- **Undead:** Zombie, Skeleton, Wraith, Flameskull
- **Oozes:** Ochre Jelly
- **Monstrosities:** Grick

Each monster includes: AC, HP, abilities, attacks, special traits, CR, XP

### player-options.json
Complete D&D 5e character creation system:

**Races (13):**
- Human
- Elf (High Elf, Wood Elf, Drow)
- Dwarf (Mountain Dwarf, Hill Dwarf)
- Halfling (Lightfoot, Stout)
- Dragonborn (10 draconic ancestries)
- Gnome (Forest, Rock)
- Half-Elf
- Half-Orc
- Tiefling

**Classes with Subclasses (6):**
- Barbarian (Berserker, Totem Warrior)
- Bard (Lore, Valor)
- Cleric (Life, War)
- Fighter (Champion, Battle Master)
- Rogue (Thief, Assassin)
- Wizard (Evocation, Abjuration)

**Spells:** 20+ spells organized by level (cantrips through level 3)

**Backgrounds:** Folk Hero, Soldier, Acolyte

**Equipment:** Weapons, armor, magic items specific to this adventure

---

## Key NPCs

### Allies

**Gundren Rockseeker**
- Dwarf prospector who hired the party
- One of three brothers who discovered Wave Echo Cave
- Captured by Cragmaw goblins in Part 1

**Sildar Hallwinter**
- Human warrior and member of the Lords' Alliance
- Captured with Gundren, rescued from Cragmaw Hideout
- Seeking the missing wizard Iarno Albrek

**Nundro Rockseeker**
- Gundren's brother
- Imprisoned in Wave Echo Cave by the Black Spider
- Can be rescued in Part 4

**Reidoth the Druid**
- Lives in Thundertree ruins
- Can provide information about Cragmaw Castle location
- Opposes Venomfang the dragon

### Antagonists

**Klarg** (Part 1 Boss)
- Bugbear leader of Cragmaw Hideout
- Wields a morningstar +1
- Serves King Grol and the Black Spider

**Glasstaff / Iarno Albrek** (Part 2 Boss)
- Evil wizard leading the Redbrands
- Traitor to the Lords' Alliance
- Serves the Black Spider
- Wields Staff of Defense

**King Grol** (Part 3 Boss)
- Bugbear king ruling Cragmaw Castle
- Holds Gundren Rockseeker captive
- Allied with a doppelganger advisor

**Venomfang** (Optional Part 3 Boss)
- Young green dragon (CR 8 - very dangerous!)
- Lairs in Thundertree
- Cunning and treacherous
- Major challenge with great rewards

**Nezznar the Black Spider** (Part 4 Final Boss)
- Drow wizard mastermind behind the conspiracy
- Seeks to claim Wave Echo Cave's Forge of Spells
- Commands giant spiders, bugbears, and doppelgangers
- Wields the Spider Staff

---

## Major Locations

### Phandalin
A small frontier town recently rebuilt from ruins. Key locations:
- **Barthen's Provisions** - Trading post, quest giver
- **Stonehill Inn** - Rumors and rest
- **Townmaster's Hall** - Cowardly Townmaster Harbin Wester
- **Tresendar Manor** - Ruined manor hiding Redbrand hideout entrance
- **Shrine of Luck** - Sister Garaele, banshee quest

### Cragmaw Hideout
Cave complex serving as goblin base:
- Trapped entrance (snare, flood trap)
- Goblin den with wolves
- Klarg's throne room across wooden bridge
- Prison cells

### Tresendar Manor / Redbrand Hideout
Underground complex beneath ruined manor:
- Natural caverns and worked stone
- Nothic's lair
- Prison cells (Dendrar family)
- Glasstaff's wizard chambers
- Hidden treasury

### Thundertree
Ruined village destroyed 30 years ago:
- Overgrown with vegetation
- Ash zombies and twig blights
- Cultists of the dragon
- Venomfang's tower lair
- Reidoth the druid's cottage

### Cragmaw Castle
Ruined fortress occupied by goblins:
- Multiple entry points (gate, tower, tunnel)
- Banquet hall, barracks, trophy room
- Owlbear in captivity
- King Grol's throne room
- Gundren's prison cell

### Wave Echo Cave
Legendary lost mine and final dungeon:
- Echoing caverns (magical sound effect)
- Ancient battlefield (skeletons from 500-year-old battle)
- Mining tunnels and ore veins
- Temple of Dumathoin
- Forge of Spells (magical workshop)
- Black Spider's lair

---

## Magic Items

**Found in Adventure:**
- Morningstar +1 (Klarg)
- Staff of Defense (Glasstaff)
- Ring of Protection (Glasstaff)
- Spider Staff (Black Spider)
- Lightbringer (Wave Echo Cave) - Glowing mace, +1d6 radiant vs undead
- Dragonguard (Wave Echo Cave) - Breastplate with dragon resistance
- Potion of Healing (various locations)
- Scrolls and spell components

**Forge of Spells:**
The legendary magical forge can create uncommon magic items once operational. Requires time and resources but provides ongoing benefits.

---

## Level Progression

**Recommended Experience Thresholds:**
- **Level 1:** Start of adventure
- **Level 2:** After Cragmaw Hideout or first Redbrand encounter
- **Level 3:** After clearing Redbrand Hideout
- **Level 4:** After Cragmaw Castle or major side quest (Venomfang)
- **Level 5:** During or after Wave Echo Cave

**Milestone Leveling (Alternative):**
- Level 2: Rescue Sildar Hallwinter
- Level 3: Defeat Glasstaff and liberate Phandalin
- Level 4: Rescue Gundren Rockseeker from Cragmaw Castle
- Level 5: Enter Wave Echo Cave

---

## Treasure and Rewards

**Monetary Wealth:**
- Part 1: ~200 gp
- Part 2: ~500 gp
- Part 3: ~1,200 gp (more if dragon defeated)
- Part 4: ~2,000 gp
- **Total:** ~3,900 gp + magic items + Wave Echo Cave partnership

**Partnership in Wave Echo Cave:**
If the party secures the mine, Gundren offers them a 10% share of profits. This generates approximately 100 gp per month once mining operations resume.

---

## Side Quests

### Old Owl Well
- **Giver:** Daran Edermath
- **Location:** 50 miles northeast of Phandalin
- **Encounter:** Evil wizard raising undead
- **Reward:** 100 gp

### Wyvern Tor
- **Giver:** Townmaster Harbin Wester
- **Location:** Hills near Phandalin
- **Encounter:** Orc raiders and ogre
- **Reward:** 100 gp

### Banshee's Bargain
- **Giver:** Sister Garaele
- **Location:** Woodland shrine
- **Encounter:** Agatha the banshee
- **Reward:** Potion of healing, information

### Dendrar Family Heirloom
- **Giver:** Mirna Dendrar (if rescued)
- **Location:** Thundertree ruins (herbalist shop)
- **Encounter:** Search ruins, possible dragon
- **Reward:** Emerald necklace (200 gp value)

---

## Tips for Running the Adventure

### For Players

1. **Exploration is Rewarded:** Many treasures and allies are found by thoroughly exploring
2. **Choices Matter:** Different approaches to encounters yield different outcomes
3. **Stealth vs Combat:** Not every encounter requires fighting
4. **Information Gathering:** Talk to NPCs, read documents, investigate
5. **Resource Management:** Short and long rests are important
6. **Teamwork:** Coordinate abilities and support each other

### For Game Masters

1. **Pacing:** Let players set the pace; don't rush them through the story
2. **Flexibility:** Players will find creative solutions; adapt to their choices
3. **NPCs:** Give personalities to important NPCs like Sildar, Gundren, Glasstaff
4. **Atmosphere:** Describe the echoing sounds in Wave Echo Cave, the decay of Thundertree
5. **Challenge:** Venomfang is extremely dangerous at low levels; foreshadow the threat
6. **Consequences:** Actions in Phandalin affect how the town treats the party

---

## Combat Difficulty Reference

**Easy Encounters:**
- 2-4 goblins
- 1-2 zombies
- Stirges

**Medium Encounters:**
- 4-6 goblins
- 2-3 Redbrand ruffians
- Ochre jelly
- Nothic

**Hard Encounters:**
- Klarg + guards
- Glasstaff
- 4+ hobgoblins
- Spectator
- Wraith

**Deadly Encounters:**
- King Grol + doppelganger + wolf
- Venomfang (CR 8 dragon!)
- Black Spider + giant spiders + bugbears
- Flameskull

---

## Connections to Broader Campaign

The Lost Mine of Phandelver is designed as a self-contained adventure but can lead to:

1. **Princes of the Apocalypse** - Elemental cults threaten the region
2. **Storm King's Thunder** - Giants begin attacking the Sword Coast
3. **Custom Adventures** - The party has established themselves as regional heroes
4. **Wave Echo Cave Operations** - Managing the mine becomes an ongoing campaign element

The characters' reputation, allies (Lords' Alliance, Harpers), and resources (magic items, gold, mine) provide excellent foundations for future adventures.

---

## Credits

**Original Adventure:** Wizards of the Coast (D&D 5e Starter Set)
**Adapted for RPC Interactive Stories Game:** 2025
**Format:** Choose-your-own-adventure with D&D 5e combat system

---

## Technical Implementation Notes

### Integration with RPC Game System

This adventure is designed to work with the RPC Interactive Stories Game backend:

- **story.json** integrates with existing story parsing system
- **monsters.json** provides combat statistics for encounter resolution
- **player-options.json** extends character creation beyond base 4 classes/races
- All content is JSON-formatted for easy RPC method consumption

### Combat Resolution

Combat encounters reference monster IDs and counts:
```json
{
  "isCombat": true,
  "monsterId": "goblin",
  "monsterCount": 4,
  "surpriseRound": false
}
```

The game system handles:
- Initiative rolls
- Turn order
- Attack rolls vs AC
- Damage calculation
- HP tracking
- Death/unconsciousness
- Victory conditions

### Choice Branching

Each chapter offers multiple choices that lead to different narrative paths:
- Diplomatic solutions vs combat
- Stealth vs direct assault
- Moral choices affecting the ending
- Resource management decisions

Player choices are tracked and influence:
- Available NPCs and quests
- Town reputation
- Epilogue outcomes
- Treasure and rewards

---

## Appendix: Quick Reference

### Important Checks

**Perception DC 12:** Notice goblin tracks, hidden enemies
**Stealth DC 13:** Sneak past guards
**Persuasion DC 15:** Convince NPCs, negotiate
**Intimidation DC 15:** Frighten enemies into cooperation
**Investigation DC 12:** Find hidden treasures, read clues

### Travel Times

- Neverwinter to Phandalin: 3 days
- Triboar Trail ambush to Phandalin: Half day
- Phandalin to Cragmaw Hideout: 2 hours (following trail)
- Phandalin to Thundertree: 2 days
- Phandalin to Cragmaw Castle: 1 day
- Phandalin to Wave Echo Cave: Half day

### Rest and Recovery

**Short Rest:** 1 hour, spend Hit Dice to recover HP
**Long Rest:** 8 hours, recover all HP and half of spent Hit Dice

Characters should have opportunities for rests between major encounters.

---

**Adventure Length:** 12-16 hours of gameplay
**Difficulty:** Medium (suitable for new players)
**Tone:** Classic heroic fantasy with dungeon exploration
**Themes:** Mystery, conspiracy, treasure hunting, overcoming evil

**May your dice roll high, and your adventures be legendary!**

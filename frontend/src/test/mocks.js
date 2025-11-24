// Mock API services for testing
export const mockAuthService = {
  register: vi.fn(),
  login: vi.fn(),
  getProfile: vi.fn(),
  getCultivationLevels: vi.fn(),
  logout: vi.fn(),
  isAuthenticated: vi.fn(),
  getStoredUser: vi.fn(),
  storeUserData: vi.fn(),
};

export const mockCombatService = {
  getMonsters: vi.fn(),
  simulateCombat: vi.fn(),
  getCharacterClasses: vi.fn(),
  getElements: vi.fn(),
};

export const mockEquipmentService = {
  generate: vi.fn(),
  getSlots: vi.fn(),
  getRarities: vi.fn(),
};

export const mockInventoryService = {
  create: vi.fn(),
  equip: vi.fn(),
  unequip: vi.fn(),
  stats: vi.fn(),
};

export const mockDungeonService = {
  getDungeons: vi.fn(),
  getDungeon: vi.fn(),
  enterDungeon: vi.fn(),
  completeDungeon: vi.fn(),
  getDifficulties: vi.fn(),
};

// Mock data for testing
export const mockUser = {
  id: 'test-user-1',
  username: 'TestUser',
  email: 'test@example.com',
  cultivation_level: 'Qi Condensation',
  experience: 150,
  level: 5,
  created_at: '2023-01-01T00:00:00Z'
};

export const mockMonsters = [
  {
    id: 'goblin-1',
    name: 'Goblin Warrior',
    tier: 1,
    level: 5,
    hp: 100,
    attack: 15,
    defense: 8,
    speed: 12,
    element: 'Neutral',
    class: 'Warrior',
    description: 'A weak but numerous foe'
  },
  {
    id: 'dragon-1',
    name: 'Ancient Dragon',
    tier: 4,
    level: 50,
    hp: 1000,
    attack: 100,
    defense: 80,
    speed: 60,
    element: 'Fire',
    class: 'Mage',
    description: 'A powerful boss monster'
  }
];

export const mockCombatResult = {
  winner: 'player',
  turns: [
    {
      turn_number: 1,
      attacker: 'player',
      defender: 'opponent',
      action: 'attack',
      damage: 25,
      effects: [],
      defender_hp: 75
    },
    {
      turn_number: 2,
      attacker: 'opponent',
      defender: 'player',
      action: 'attack',
      damage: 15,
      effects: [],
      defender_hp: 85
    }
  ],
  player_final_hp: 85,
  opponent_final_hp: 0,
  total_damage_dealt: 25,
  total_damage_taken: 15,
  experience_gained: 50,
  loot_dropped: []
};

export const mockEquipment = [
  {
    id: 'sword-1',
    name: 'Iron Sword',
    slot: 'Weapon',
    rarity: 'Common',
    item_level: 10,
    stats: {
      attack: 15,
      defense: 0,
      hp: 0,
      speed: 0
    },
    affixes: [],
    description: 'A basic iron sword'
  },
  {
    id: 'armor-1',
    name: 'Dragon Scale Armor',
    slot: 'Armor',
    rarity: 'Legendary',
    item_level: 50,
    stats: {
      attack: 0,
      defense: 50,
      hp: 100,
      speed: 0
    },
    affixes: ['Fire Resistance', 'Defense Boost'],
    description: 'Armor made from dragon scales'
  }
];

export const mockDungeons = [
  {
    id: 'goblin-caves',
    name: 'Goblin Caves',
    description: 'Infested with goblins and other weak creatures',
    difficulty: 'Easy',
    entry_cost: 10,
    floors: 5,
    reward_multiplier: 1.0,
    daily_attempts: 10,
    image_url: null
  },
  {
    id: 'shadow-realm',
    name: 'Shadow Realm',
    description: 'A dark realm filled with powerful shadows',
    difficulty: 'Nightmare',
    entry_cost: 100,
    floors: 20,
    reward_multiplier: 5.0,
    daily_attempts: 1,
    image_url: null
  }
];

export const mockInventory = {
  player_id: 'test-user-1',
  currency: 500,
  equipped_items: {
    Weapon: mockEquipment[0],
    Armor: mockEquipment[1],
    Accessory: null
  },
  inventory_items: [mockEquipment[0], mockEquipment[1]],
  total_stats: {
    attack: 15,
    defense: 50,
    hp: 100,
    speed: 0
  }
};
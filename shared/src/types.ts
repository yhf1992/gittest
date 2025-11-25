// Core type definitions for the cultivation game API
// These mirror the Prisma schema but are designed for API payloads

export interface Player {
  id: string;
  username: string;
  email?: string;
  level: number;
  experience: bigint;
  cultivationTierId: string;
  currentHp: number;
  maxHp: number;
  currentMp: number;
  maxMp: number;
  attack: number;
  defense: number;
  speed: number;
  critRate: number;
  critDamage: number;
  gold: bigint;
  spiritStones: bigint;
  createdAt: Date;
  updatedAt: Date;
  cultivationTier?: CultivationTier;
  inventory?: PlayerInventory[];
  equipment?: PlayerEquipment[];
  dungeonProgress?: PlayerDungeonProgress[];
  completedDungeons?: PlayerDungeonHistory[];
}

export interface CultivationTier {
  id: string;
  name: string;
  description?: string;
  level: number;
  minExp: bigint;
  maxHp: number;
  maxMp: number;
  attack: number;
  defense: number;
  speed: number;
  multiplier: number;
  createdAt: Date;
}

export interface EquipmentType {
  id: string;
  name: string;
  slot: EquipmentSlot;
  description?: string;
}

export interface Equipment {
  id: string;
  name: string;
  typeId: string;
  rarity: EquipmentRarity;
  level: number;
  baseAttack: number;
  baseDefense: number;
  baseSpeed: number;
  baseHp: number;
  baseMp: number;
  critRate: number;
  critDamage: number;
  effects: Effect[];
  description?: string;
  createdAt: Date;
  type?: EquipmentType;
}

export interface PlayerInventory {
  id: string;
  playerId: string;
  equipmentId: string;
  quantity: number;
  createdAt: Date;
  player?: Player;
  equipment?: Equipment;
}

export interface PlayerEquipment {
  id: string;
  playerId: string;
  equipmentId: string;
  createdAt: Date;
  player?: Player;
  equipment?: Equipment;
}

export interface Monster {
  id: string;
  name: string;
  type: MonsterType;
  level: number;
  hp: number;
  mp: number;
  attack: number;
  defense: number;
  speed: number;
  critRate: number;
  critDamage: number;
  goldReward: bigint;
  expReward: bigint;
  lootTableId?: string;
  description?: string;
  createdAt: Date;
  lootTable?: LootTable;
}

export interface LootTable {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  monsters?: Monster[];
  items?: LootItem[];
}

export interface LootItem {
  id: string;
  lootTableId: string;
  equipmentId?: string;
  gold?: bigint;
  spiritStones?: bigint;
  dropRate: number;
  minQuantity: number;
  maxQuantity: number;
  lootTable?: LootTable;
  equipment?: Equipment;
}

export interface Dungeon {
  id: string;
  name: string;
  description?: string;
  difficulty: DungeonDifficulty;
  minLevel: number;
  maxLevel?: number;
  goldReward: bigint;
  expReward: bigint;
  completionTime?: number;
  energyCost: number;
  rewardMultiplier: number;
  createdAt: Date;
  monsters?: DungeonMonster[];
  playerProgress?: PlayerDungeonProgress[];
  completedBy?: PlayerDungeonHistory[];
}

export interface DungeonMonster {
  id: string;
  dungeonId: string;
  monsterId: string;
  quantity: number;
  position?: number;
  dungeon?: Dungeon;
  monster?: Monster;
}

export interface PlayerDungeonProgress {
  id: string;
  playerId: string;
  dungeonId: string;
  progress: number;
  bestTime?: number;
  attempts: number;
  createdAt: Date;
  updatedAt: Date;
  player?: Player;
  dungeon?: Dungeon;
}

export interface PlayerDungeonHistory {
  id: string;
  playerId: string;
  dungeonId: string;
  completedAt: Date;
  timeSpent: number;
  stars: number;
  goldEarned: bigint;
  expEarned: bigint;
  player?: Player;
  dungeon?: Dungeon;
}

// API Request/Response types
export interface CreatePlayerRequest {
  username: string;
  email?: string;
}

export interface UpdatePlayerRequest {
  username?: string;
  email?: string;
}

export interface EquipItemRequest {
  equipmentId: string;
}

export interface StartDungeonRequest {
  dungeonId: string;
}

export interface CompleteDungeonRequest {
  dungeonId: string;
  timeSpent: number;
}

export interface BattleResult {
  success: boolean;
  playerHp: number;
  playerMp: number;
  goldEarned: bigint;
  expEarned: bigint;
  itemsDropped: LootItem[];
}

export interface DungeonReward {
  gold: bigint;
  exp: bigint;
  items: Equipment[];
  stars: number;
}

// Enums
export enum EquipmentSlot {
  WEAPON = 'WEAPON',
  HELMET = 'HELMET',
  ARMOR = 'ARMOR',
  BOOTS = 'BOOTS',
  ACCESSORY = 'ACCESSORY',
  RING = 'RING',
  NECKLACE = 'NECKLACE'
}

export enum EquipmentRarity {
  COMMON = 'COMMON',
  UNCOMMON = 'UNCOMMON',
  RARE = 'RARE',
  EPIC = 'EPIC',
  LEGENDARY = 'LEGENDARY',
  MYTHIC = 'MYTHIC'
}

export enum MonsterType {
  NORMAL = 'NORMAL',
  ELITE = 'ELITE',
  BOSS = 'BOSS'
}

export enum DungeonDifficulty {
  EASY = 'EASY',
  NORMAL = 'NORMAL',
  HARD = 'HARD',
  EXPERT = 'EXPERT',
  NIGHTMARE = 'NIGHTMARE'
}

export enum Effect {
  HP_REGEN = 'HP_REGEN',
  MP_REGEN = 'MP_REGEN',
  ATTACK_BOOST = 'ATTACK_BOOST',
  DEFENSE_BOOST = 'DEFENSE_BOOST',
  SPEED_BOOST = 'SPEED_BOOST',
  CRIT_BOOST = 'CRIT_BOOST',
  LIFESTEAL = 'LIFESTEAL',
  MANA_BURN = 'MANA_BURN',
  POISON = 'POISON',
  STUN = 'STUN'
}

// Utility types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PlayerStats {
  totalPlayers: number;
  activePlayers: number;
  averageLevel: number;
  topCultivationTier: string;
}

export interface GameStats {
  totalDungeonsCompleted: number;
  totalMonstersDefeated: number;
  totalGoldEarned: bigint;
  totalItemsLooted: number;
}
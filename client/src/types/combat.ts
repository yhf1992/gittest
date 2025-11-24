export enum ElementType {
  FIRE = 'fire',
  WATER = 'water',
  EARTH = 'earth',
  WIND = 'wind',
  NEUTRAL = 'neutral',
}

export enum StatusEffectType {
  STUN = 'stun',
  DOT = 'dot',
  DEFENSE_DEBUFF = 'defense_debuff',
  MULTI_HIT = 'multi_hit',
  ATTACK_BUFF = 'attack_buff',
  DEFENSE_BUFF = 'defense_buff',
  HEAL_OVER_TIME = 'heal_over_time',
}

export enum EquipmentSlot {
  WEAPON = 'weapon',
  ARMOR = 'armor',
  ACCESSORY = 'accessory',
}

export enum ItemRarity {
  COMMON = 'common',
  UNCOMMON = 'uncommon',
  RARE = 'rare',
  EPIC = 'epic',
  LEGENDARY = 'legendary',
}

export enum CharacterClass {
  WARRIOR = 'warrior',
  MAGE = 'mage',
  ROGUE = 'rogue',
  PALADIN = 'paladin',
}

export interface StatusEffect {
  effect_type: StatusEffectType;
  value: number;
  duration: number;
  source_character_id: string;
}

export interface Equipment {
  id: string;
  name: string;
  slot: EquipmentSlot;
  rarity: ItemRarity;
  level: number;
  attack?: number;
  defense?: number;
  hp?: number;
  speed?: number;
  special_effect?: string;
}

export interface CharacterStats {
  attack: number;
  defense: number;
  speed: number;
  hp: number;
  max_hp: number;
}

export interface CombatAction {
  turn: number;
  attacker_id: string;
  attacker_name: string;
  defender_id: string;
  defender_name: string;
  action_type: 'attack' | 'skill' | 'status' | 'heal';
  damage?: number;
  is_crit?: boolean;
  is_miss?: boolean;
  status_effects_applied?: StatusEffect[];
  healing?: number;
  message: string;
}

"""
Combat engine data models for characters, stats, and status effects.
"""
from enum import Enum
from typing import List, Optional, Dict, Any
from dataclasses import dataclass, field, asdict
from datetime import datetime, date


class ElementType(Enum):
    """Element types for elemental modifiers."""
    FIRE = "fire"
    WATER = "water"
    EARTH = "earth"
    WIND = "wind"
    NEUTRAL = "neutral"


class StatusEffectType(Enum):
    """Available status effects."""
    STUN = "stun"
    DOT = "dot"  # Damage over time
    DEFENSE_DEBUFF = "defense_debuff"
    MULTI_HIT = "multi_hit"
    ATTACK_BUFF = "attack_buff"
    DEFENSE_BUFF = "defense_buff"
    HEAL_OVER_TIME = "heal_over_time"


class CharacterClass(Enum):
    """Character classes with tier progression."""
    WARRIOR = "warrior"
    MAGE = "mage"
    ROGUE = "rogue"
    PALADIN = "paladin"


class EquipmentSlot(Enum):
    """Equipment slots for characters."""
    WEAPON = "weapon"
    ARMOR = "armor"
    ACCESSORY = "accessory"


class ItemRarity(Enum):
    """Item rarity levels with drop chance weights."""
    COMMON = "common"
    UNCOMMON = "uncommon"
    RARE = "rare"
    EPIC = "epic"
    LEGENDARY = "legendary"


class AffixType(Enum):
    """Equipment affix types."""
    ATTACK_BONUS = "attack_bonus"
    DEFENSE_BONUS = "defense_bonus"
    HP_BONUS = "hp_bonus"
    SPEED_BONUS = "speed_bonus"
    CRIT_CHANCE = "crit_chance"
    ELEMENTAL_DAMAGE = "elemental_damage"
    LIFESTEAL = "lifesteal"
    PROC_DAMAGE = "proc_damage"


class MonsterTier(Enum):
    """Monster tiers for loot table configuration."""
    TIER_1 = "tier_1"  # Common monsters
    TIER_2 = "tier_2"  # Elite monsters
    TIER_3 = "tier_3"  # Mini-bosses
    TIER_4 = "tier_4"  # Boss monsters


class DungeonDifficulty(Enum):
    """Dungeon difficulty levels."""
    EASY = "easy"
    NORMAL = "normal"
    HARD = "hard"
    NIGHTMARE = "nightmare"


@dataclass
class Stat:
    """Base stat representation."""
    base_value: int
    current_value: int

    def reset_to_base(self):
        """Reset current value to base."""
        self.current_value = self.base_value

    def get_effective_value(self, modifier: float = 1.0) -> int:
        """Get effective value with multiplier."""
        return max(0, int(self.current_value * modifier))


@dataclass
class StatusEffect:
    """Represents a status effect on a character."""
    effect_type: StatusEffectType
    value: int  # Damage per turn for DoT, attack bonus for buff, etc.
    duration: int  # Number of turns remaining
    source_character_id: str

    def tick(self) -> bool:
        """Decrement duration. Returns True if effect is still active."""
        self.duration -= 1
        return self.duration > 0

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "effect_type": self.effect_type.value,
            "value": self.value,
            "duration": self.duration,
            "source_character_id": self.source_character_id,
        }


@dataclass
class Character:
    """Represents a combatant (player or monster)."""
    character_id: str
    name: str
    character_class: CharacterClass
    level: int
    max_hp: int
    current_hp: int
    attack: Stat
    defense: Stat
    speed: Stat
    element: ElementType
    status_effects: List[StatusEffect] = field(default_factory=list)

    def __post_init__(self):
        """Initialize stats after creation."""
        if not isinstance(self.attack, Stat):
            self.attack = Stat(self.attack, self.attack)
        if not isinstance(self.defense, Stat):
            self.defense = Stat(self.defense, self.defense)
        if not isinstance(self.speed, Stat):
            self.speed = Stat(self.speed, self.speed)

    def is_alive(self) -> bool:
        """Check if character is still alive."""
        return self.current_hp > 0

    def take_damage(self, damage: int) -> int:
        """Apply damage and return actual damage taken."""
        actual_damage = max(0, min(damage, self.current_hp))
        self.current_hp -= actual_damage
        return actual_damage

    def heal(self, amount: int) -> int:
        """Apply healing and return actual healing received."""
        old_hp = self.current_hp
        self.current_hp = min(self.current_hp + amount, self.max_hp)
        return self.current_hp - old_hp

    def apply_status_effect(self, effect: StatusEffect) -> None:
        """Apply a status effect."""
        # Check if similar effect exists and stack or replace
        existing_effect_index = None
        for i, existing in enumerate(self.status_effects):
            if existing.effect_type == effect.effect_type:
                existing_effect_index = i
                break

        if existing_effect_index is not None:
            # Replace with longer duration
            if effect.duration > self.status_effects[existing_effect_index].duration:
                self.status_effects[existing_effect_index] = effect
        else:
            self.status_effects.append(effect)

    def remove_expired_status_effects(self) -> List[StatusEffect]:
        """Remove expired status effects. Returns list of removed effects."""
        expired = []
        remaining = []
        for effect in self.status_effects:
            if effect.duration <= 0:
                expired.append(effect)
            else:
                remaining.append(effect)
        self.status_effects = remaining
        return expired

    def has_status_effect(self, effect_type: StatusEffectType) -> bool:
        """Check if character has a specific status effect."""
        return any(e.effect_type == effect_type for e in self.status_effects)

    def get_status_effect(self, effect_type: StatusEffectType) -> Optional[StatusEffect]:
        """Get a specific status effect if it exists."""
        for effect in self.status_effects:
            if effect.effect_type == effect_type:
                return effect
        return None

    def reset_for_combat(self) -> None:
        """Reset character for a new combat."""
        self.current_hp = self.max_hp
        self.status_effects = []
        self.attack.reset_to_base()
        self.defense.reset_to_base()
        self.speed.reset_to_base()

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary representation."""
        return {
            "character_id": self.character_id,
            "name": self.name,
            "character_class": self.character_class.value,
            "level": self.level,
            "max_hp": self.max_hp,
            "current_hp": self.current_hp,
            "attack": self.attack.current_value,
            "defense": self.defense.current_value,
            "speed": self.speed.current_value,
            "element": self.element.value,
            "status_effects": [e.to_dict() for e in self.status_effects],
            "is_alive": self.is_alive(),
        }


@dataclass
class CombatAction:
    """Represents a single action in combat."""
    actor_id: str
    target_id: str
    action_type: str  # "attack", "heal", "defend", "skill"
    damage_dealt: int = 0
    healing_done: int = 0
    status_effects_applied: List[StatusEffect] = field(default_factory=list)
    is_crit: bool = False
    is_miss: bool = False
    is_stun: bool = False
    multi_hit_count: int = 1

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary representation."""
        return {
            "actor_id": self.actor_id,
            "target_id": self.target_id,
            "action_type": self.action_type,
            "damage_dealt": self.damage_dealt,
            "healing_done": self.healing_done,
            "status_effects_applied": [e.to_dict() for e in self.status_effects_applied],
            "is_crit": self.is_crit,
            "is_miss": self.is_miss,
            "is_stun": self.is_stun,
            "multi_hit_count": self.multi_hit_count,
        }


@dataclass
class CombatTurn:
    """Represents a single turn in combat."""
    turn_number: int
    actor_id: str
    actions: List[CombatAction] = field(default_factory=list)
    actor_status_before: Dict[str, Any] = field(default_factory=dict)
    actor_status_after: Dict[str, Any] = field(default_factory=dict)
    target_status_before: Dict[str, Any] = field(default_factory=dict)
    target_status_after: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary representation."""
        return {
            "turn_number": self.turn_number,
            "actor_id": self.actor_id,
            "actions": [a.to_dict() for a in self.actions],
            "actor_status_before": self.actor_status_before,
            "actor_status_after": self.actor_status_after,
            "target_status_before": self.target_status_before,
            "target_status_after": self.target_status_after,
        }


@dataclass
class CombatLog:
    """Complete log of a combat session."""
    combat_id: str
    player: Character
    opponent: Character
    turns: List[CombatTurn] = field(default_factory=list)
    winner_id: Optional[str] = None
    total_turns: int = 0

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary representation."""
        return {
            "combat_id": self.combat_id,
            "player": self.player.to_dict(),
            "opponent": self.opponent.to_dict(),
            "turns": [t.to_dict() for t in self.turns],
            "winner_id": self.winner_id,
            "total_turns": self.total_turns,
        }


@dataclass
class EquipmentAffix:
    """Represents an equipment affix (bonus stat or effect)."""
    affix_type: AffixType
    value: int
    element: Optional[ElementType] = None  # For elemental affixes

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary representation."""
        result = {
            "affix_type": self.affix_type.value,
            "value": self.value,
        }
        if self.element:
            result["element"] = self.element.value
        return result


@dataclass
class Equipment:
    """Represents an equipment item."""
    item_id: str
    name: str
    slot: EquipmentSlot
    rarity: ItemRarity
    level_requirement: int
    base_stats: Dict[str, int]  # Base attack, defense, etc.
    affixes: List[EquipmentAffix] = field(default_factory=list)
    special_proc: Optional[str] = None  # Special effect description

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary representation."""
        return {
            "item_id": self.item_id,
            "name": self.name,
            "slot": self.slot.value,
            "rarity": self.rarity.value,
            "level_requirement": self.level_requirement,
            "base_stats": self.base_stats,
            "affixes": [a.to_dict() for a in self.affixes],
            "special_proc": self.special_proc,
        }


@dataclass
class LootEntry:
    """Represents a single entry in a loot table."""
    item_id: Optional[str] = None  # None for currency/generic rewards
    weight: int = 1
    min_quantity: int = 1
    max_quantity: int = 1
    rarity: Optional[ItemRarity] = None
    is_guaranteed: bool = False

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary representation."""
        result = {
            "weight": self.weight,
            "min_quantity": self.min_quantity,
            "max_quantity": self.max_quantity,
            "is_guaranteed": self.is_guaranteed,
        }
        if self.item_id:
            result["item_id"] = self.item_id
        if self.rarity:
            result["rarity"] = self.rarity.value
        return result


@dataclass
class LootTable:
    """Represents a loot table for monster drops."""
    table_id: str
    name: str
    monster_tier: MonsterTier
    entries: List[LootEntry] = field(default_factory=list)
    currency_drops: List[LootEntry] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary representation."""
        return {
            "table_id": self.table_id,
            "name": self.name,
            "monster_tier": self.monster_tier.value,
            "entries": [e.to_dict() for e in self.entries],
            "currency_drops": [e.to_dict() for e in self.currency_drops],
        }


@dataclass
class PlayerInventory:
    """Represents a player's inventory and equipment."""
    player_id: str
    equipment: Dict[EquipmentSlot, Optional[Equipment]] = field(default_factory=dict)
    inventory: List[Equipment] = field(default_factory=list)
    currency: int = 0

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary representation."""
        return {
            "player_id": self.player_id,
            "equipment": {slot.value: equip.to_dict() if equip else None 
                         for slot, equip in self.equipment.items()},
            "inventory": [item.to_dict() for item in self.inventory],
            "currency": self.currency,
        }


@dataclass
class DungeonRun:
    """Represents a single dungeon run attempt."""
    run_id: str
    player_id: str
    dungeon_id: str
    difficulty: DungeonDifficulty
    start_time: datetime
    end_time: Optional[datetime] = None
    completed: bool = False
    floors_completed: int = 0
    total_floors: int = 0
    rewards_earned: List[Equipment] = field(default_factory=list)
    currency_earned: int = 0
    entry_cost: int = 0

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary representation."""
        return {
            "run_id": self.run_id,
            "player_id": self.player_id,
            "dungeon_id": self.dungeon_id,
            "difficulty": self.difficulty.value,
            "start_time": self.start_time.isoformat(),
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "completed": self.completed,
            "floors_completed": self.floors_completed,
            "total_floors": self.total_floors,
            "rewards_earned": [r.to_dict() for r in self.rewards_earned],
            "currency_earned": self.currency_earned,
            "entry_cost": self.entry_cost,
        }


@dataclass
class Dungeon:
    """Represents a dungeon with configuration."""
    dungeon_id: str
    name: str
    description: str
    difficulty: DungeonDifficulty
    level_requirement: int
    entry_cost: int
    floors: int
    daily_reset_count: int = 3  # Max attempts per day
    reward_multiplier: float = 1.0
    monster_tiers: List[MonsterTier] = field(default_factory=list)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary representation."""
        return {
            "dungeon_id": self.dungeon_id,
            "name": self.name,
            "description": self.description,
            "difficulty": self.difficulty.value,
            "level_requirement": self.level_requirement,
            "entry_cost": self.entry_cost,
            "floors": self.floors,
            "daily_reset_count": self.daily_reset_count,
            "reward_multiplier": self.reward_multiplier,
            "monster_tiers": [t.value for t in self.monster_tiers],
        }


@dataclass
class DailyResetInfo:
    """Tracks daily reset information for players."""
    player_id: str
    date: date
    dungeon_attempts: Dict[str, int] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary representation."""
        return {
            "player_id": self.player_id,
            "date": self.date.isoformat(),
            "dungeon_attempts": self.dungeon_attempts,
        }

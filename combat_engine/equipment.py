"""
Equipment generation and management system.
"""
import random
import uuid
from typing import List, Dict, Optional, Tuple

from .models import (
    Equipment,
    EquipmentAffix,
    EquipmentSlot,
    ItemRarity,
    AffixType,
    ElementType,
    Character,
    PlayerInventory,
)


class EquipmentGenerator:
    """Generates random equipment with affixes and special effects."""

    # Base name components for procedural generation
    WEAPON_PREFIXES = ["Iron", "Steel", "Mythril", "Dragon", "Shadow", "Holy", "Arcane"]
    WEAPON_SUFFIXES = ["Blade", "Sword", "Axe", "Mace", "Dagger", "Staff", "Wand"]
    ARMOR_PREFIXES = ["Leather", "Chain", "Plate", "Robe", "Scale", "Crystal"]
    ARMOR_SUFFIXES = ["Vest", "Mail", "Armor", "Robes", "Guard", "Shield"]
    ACCESSORY_PREFIXES = ["Ring", "Amulet", "Charm", "Talisman", "Orb"]
    ACCESSORY_SUFFIXES = ["Power", "Wisdom", "Protection", "Swift", "Might"]

    # Rarity weights for generation
    RARITY_WEIGHTS = {
        ItemRarity.COMMON: 50,
        ItemRarity.UNCOMMON: 30,
        ItemRarity.RARE: 15,
        ItemRarity.EPIC: 4,
        ItemRarity.LEGENDARY: 1,
    }

    # Affix count by rarity
    AFFIX_COUNT_RANGE = {
        ItemRarity.COMMON: (0, 1),
        ItemRarity.UNCOMMON: (1, 2),
        ItemRarity.RARE: (2, 3),
        ItemRarity.EPIC: (3, 4),
        ItemRarity.LEGENDARY: (4, 5),
    }

    # Special proc chance by rarity
    SPECIAL_PROC_CHANCE = {
        ItemRarity.COMMON: 0.0,
        ItemRarity.UNCOMMON: 0.05,
        ItemRarity.RARE: 0.15,
        ItemRarity.EPIC: 0.30,
        ItemRarity.LEGENDARY: 0.50,
    }

    @staticmethod
    def generate_equipment(
        slot: EquipmentSlot,
        item_level: int,
        rarity: Optional[ItemRarity] = None,
        seed: Optional[int] = None,
    ) -> Equipment:
        """Generate a random piece of equipment."""
        if seed is not None:
            random.seed(seed)

        # Determine rarity if not specified
        if rarity is None:
            rarity = EquipmentGenerator._roll_rarity()

        # Generate name
        name = EquipmentGenerator._generate_name(slot, rarity)

        # Generate base stats
        base_stats = EquipmentGenerator._generate_base_stats(slot, item_level, rarity)

        # Generate affixes
        affix_count = random.randint(*EquipmentGenerator.AFFIX_COUNT_RANGE[rarity])
        affixes = EquipmentGenerator._generate_affixes(affix_count, item_level, rarity)

        # Generate special proc
        special_proc = None
        if random.random() < EquipmentGenerator.SPECIAL_PROC_CHANCE[rarity]:
            special_proc = EquipmentGenerator._generate_special_proc(slot, rarity)

        return Equipment(
            item_id=str(uuid.uuid4()),
            name=name,
            slot=slot,
            rarity=rarity,
            level_requirement=max(1, item_level - 5),
            base_stats=base_stats,
            affixes=affixes,
            special_proc=special_proc,
        )

    @staticmethod
    def _roll_rarity() -> ItemRarity:
        """Roll for item rarity based on weights."""
        total_weight = sum(EquipmentGenerator.RARITY_WEIGHTS.values())
        roll = random.randint(1, total_weight)
        
        current_weight = 0
        for rarity, weight in EquipmentGenerator.RARITY_WEIGHTS.items():
            current_weight += weight
            if roll <= current_weight:
                return rarity
        
        return ItemRarity.COMMON  # Fallback

    @staticmethod
    def _generate_name(slot: EquipmentSlot, rarity: ItemRarity) -> str:
        """Generate a name for the equipment."""
        if slot == EquipmentSlot.WEAPON:
            prefix = random.choice(EquipmentGenerator.WEAPON_PREFIXES)
            suffix = random.choice(EquipmentGenerator.WEAPON_SUFFIXES)
        elif slot == EquipmentSlot.ARMOR:
            prefix = random.choice(EquipmentGenerator.ARMOR_PREFIXES)
            suffix = random.choice(EquipmentGenerator.ARMOR_SUFFIXES)
        else:  # ACCESSORY
            prefix = random.choice(EquipmentGenerator.ACCESSORY_PREFIXES)
            suffix = random.choice(EquipmentGenerator.ACCESSORY_SUFFIXES)

        # Add rarity indicator for higher tiers
        if rarity in [ItemRarity.EPIC, ItemRarity.LEGENDARY]:
            return f"{prefix} {rarity.value.title()} {suffix}"
        else:
            return f"{prefix} {suffix}"

    @staticmethod
    def _generate_base_stats(slot: EquipmentSlot, item_level: int, rarity: ItemRarity) -> Dict[str, int]:
        """Generate base stats for equipment."""
        # Multipliers for different rarities
        rarity_multipliers = {
            ItemRarity.COMMON: 1.0,
            ItemRarity.UNCOMMON: 1.2,
            ItemRarity.RARE: 1.5,
            ItemRarity.EPIC: 2.0,
            ItemRarity.LEGENDARY: 2.5,
        }

        multiplier = rarity_multipliers[rarity]
        base_value = int(item_level * 2 * multiplier)

        stats = {}
        if slot == EquipmentSlot.WEAPON:
            stats["attack"] = base_value
        elif slot == EquipmentSlot.ARMOR:
            stats["defense"] = base_value
            stats["hp"] = base_value // 2
        else:  # ACCESSORY
            # Accessories get smaller balanced stats
            stats["attack"] = base_value // 3
            stats["defense"] = base_value // 3
            stats["speed"] = base_value // 4

        return stats

    @staticmethod
    def _generate_affixes(count: int, item_level: int, rarity: ItemRarity) -> List[EquipmentAffix]:
        """Generate random affixes for equipment."""
        if count == 0:
            return []

        affixes = []
        available_affixes = list(AffixType)
        
        for _ in range(count):
            affix_type = random.choice(available_affixes)
            available_affixes.remove(affix_type)  # Avoid duplicates

            # Generate value based on item level and rarity
            base_value = EquipmentGenerator._calculate_affix_value(affix_type, item_level, rarity)

            # Some affixes have elemental components
            element = None
            if affix_type == AffixType.ELEMENTAL_DAMAGE:
                element = random.choice(list(ElementType))

            affixes.append(EquipmentAffix(affix_type=affix_type, value=base_value, element=element))

        return affixes

    @staticmethod
    def _calculate_affix_value(affix_type: AffixType, item_level: int, rarity: ItemRarity) -> int:
        """Calculate the value of an affix based on type, level, and rarity."""
        rarity_multipliers = {
            ItemRarity.COMMON: 1.0,
            ItemRarity.UNCOMMON: 1.3,
            ItemRarity.RARE: 1.6,
            ItemRarity.EPIC: 2.0,
            ItemRarity.LEGENDARY: 2.5,
        }

        multiplier = rarity_multipliers[rarity]
        base_value = item_level

        if affix_type in [AffixType.ATTACK_BONUS, AffixType.DEFENSE_BONUS, AffixType.HP_BONUS]:
            return int(base_value * 2 * multiplier)
        elif affix_type == AffixType.SPEED_BONUS:
            return int(base_value * multiplier)
        elif affix_type == AffixType.CRIT_CHANCE:
            return min(25, int(base_value * 0.5 * multiplier))  # Cap at 25%
        elif affix_type == AffixType.ELEMENTAL_DAMAGE:
            return int(base_value * 1.5 * multiplier)
        elif affix_type == AffixType.LIFESTEAL:
            return min(20, int(base_value * 0.3 * multiplier))  # Cap at 20%
        elif affix_type == AffixType.PROC_DAMAGE:
            return int(base_value * 3 * multiplier)

        return base_value

    @staticmethod
    def _generate_special_proc(slot: EquipmentSlot, rarity: ItemRarity) -> str:
        """Generate a special proc description."""
        weapon_procs = [
            "Chance to deal double damage",
            "Lightning strikes on hit",
            "Fire damage over time",
            "Heal on hit",
            "Chance to stun target",
        ]
        
        armor_procs = [
            "Thorns damage反射",
            "Damage reduction on low health",
            "Regeneration in combat",
            "Chance to block attacks",
            "Elemental resistance",
        ]
        
        accessory_procs = [
            "Increased critical chance",
            "Movement speed boost",
            "Bonus experience gain",
            "Currency find bonus",
            "Loot rarity bonus",
        ]

        if slot == EquipmentSlot.WEAPON:
            return random.choice(weapon_procs)
        elif slot == EquipmentSlot.ARMOR:
            return random.choice(armor_procs)
        else:
            return random.choice(accessory_procs)


class InventoryManager:
    """Manages player inventory and equipment operations."""

    @staticmethod
    def equip_item(inventory: PlayerInventory, item_id: str) -> Optional[Equipment]:
        """Equip an item from inventory to the appropriate slot."""
        # Find the item in inventory
        item_to_equip = None
        for item in inventory.inventory:
            if item.item_id == item_id:
                item_to_equip = item
                break

        if not item_to_equip:
            return None

        # Remove from inventory
        inventory.inventory.remove(item_to_equip)

        # Get current equipped item (if any)
        current_item = inventory.equipment.get(item_to_equip.slot, None)

        # Equip new item
        inventory.equipment[item_to_equip.slot] = item_to_equip

        # Return the previously equipped item (to be added back to inventory)
        return current_item

    @staticmethod
    def unequip_item(inventory: PlayerInventory, slot: EquipmentSlot) -> Optional[Equipment]:
        """Unequip an item and return it to inventory."""
        current_item = inventory.equipment.get(slot, None)
        if current_item:
            inventory.equipment[slot] = None
            inventory.inventory.append(current_item)
        return current_item

    @staticmethod
    def add_item_to_inventory(inventory: PlayerInventory, item: Equipment) -> None:
        """Add an item to the player's inventory."""
        inventory.inventory.append(item)

    @staticmethod
    def remove_item_from_inventory(inventory: PlayerInventory, item_id: str) -> Optional[Equipment]:
        """Remove an item from inventory by ID."""
        for item in inventory.inventory:
            if item.item_id == item_id:
                inventory.inventory.remove(item)
                return item
        return None

    @staticmethod
    def calculate_total_stats(inventory: PlayerInventory) -> Dict[str, int]:
        """Calculate total stats from all equipped items."""
        total_stats = {
            "attack": 0,
            "defense": 0,
            "hp": 0,
            "speed": 0,
            "crit_chance": 0,
            "lifesteal": 0,
        }

        for equipment in inventory.equipment.values():
            if equipment:
                # Add base stats
                for stat, value in equipment.base_stats.items():
                    if stat in total_stats:
                        total_stats[stat] += value

                # Add affix stats
                for affix in equipment.affixes:
                    if affix.affix_type == AffixType.ATTACK_BONUS:
                        total_stats["attack"] += affix.value
                    elif affix.affix_type == AffixType.DEFENSE_BONUS:
                        total_stats["defense"] += affix.value
                    elif affix.affix_type == AffixType.HP_BONUS:
                        total_stats["hp"] += affix.value
                    elif affix.affix_type == AffixType.SPEED_BONUS:
                        total_stats["speed"] += affix.value
                    elif affix.affix_type == AffixType.CRIT_CHANCE:
                        total_stats["crit_chance"] += affix.value
                    elif affix.affix_type == AffixType.LIFESTEAL:
                        total_stats["lifesteal"] += affix.value

        return total_stats

    @staticmethod
    def apply_equipment_to_character(character: Character, inventory: PlayerInventory) -> Character:
        """Apply equipment stats to a character copy."""
        # Create a deep copy to avoid modifying the original
        from copy import deepcopy
        equipped_character = deepcopy(character)

        total_stats = InventoryManager.calculate_total_stats(inventory)

        # Apply stat bonuses
        equipped_character.attack.current_value += total_stats["attack"]
        equipped_character.defense.current_value += total_stats["defense"]
        equipped_character.speed.current_value += total_stats["speed"]
        equipped_character.max_hp += total_stats["hp"]
        equipped_character.current_hp += total_stats["hp"]  # Also increase current HP

        return equipped_character
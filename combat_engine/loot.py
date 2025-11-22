"""
Loot system for managing drops and loot tables.
"""
import random
from typing import List, Dict, Optional, Tuple

from .models import (
    LootTable,
    LootEntry,
    Equipment,
    ItemRarity,
    MonsterTier,
    EquipmentSlot,
)
from .equipment import EquipmentGenerator


class LootRoller:
    """Handles loot rolling and drop calculations."""

    @staticmethod
    def roll_loot(loot_table: LootTable, seed: Optional[int] = None) -> Tuple[List[Equipment], int]:
        """
        Roll for loot from a loot table.
        Returns (equipment_drops, currency_dropped)
        """
        if seed is not None:
            random.seed(seed)

        equipment_drops = []
        currency_dropped = 0

        # Roll guaranteed drops first
        for entry in loot_table.entries:
            if entry.is_guaranteed:
                drop = LootRoller._generate_drop_from_entry(entry)
                if drop:
                    equipment_drops.append(drop)

        # Roll currency drops
        for entry in loot_table.currency_drops:
            if entry.is_guaranteed or LootRoller._roll_chance(entry.weight):
                quantity = random.randint(entry.min_quantity, entry.max_quantity)
                currency_dropped += quantity

        # Roll regular equipment drops
        total_weight = sum(e.weight for e in loot_table.entries if not e.is_guaranteed)
        if total_weight > 0:
            # Number of drops depends on monster tier
            drop_count = LootRoller._get_drop_count(loot_table.monster_tier)
            
            for _ in range(drop_count):
                roll = random.randint(1, total_weight)
                current_weight = 0
                
                for entry in loot_table.entries:
                    if entry.is_guaranteed:
                        continue
                    
                    current_weight += entry.weight
                    if roll <= current_weight:
                        drop = LootRoller._generate_drop_from_entry(entry)
                        if drop:
                            equipment_drops.append(drop)
                        break

        return equipment_drops, currency_dropped

    @staticmethod
    def _roll_chance(weight: int) -> bool:
        """Roll a chance based on weight (higher weight = higher chance)."""
        # Normalize weight to percentage (assuming max weight of 100)
        chance = min(1.0, weight / 100.0)
        return random.random() < chance

    @staticmethod
    def _get_drop_count(monster_tier: MonsterTier) -> int:
        """Get number of equipment drops based on monster tier."""
        drop_chances = {
            MonsterTier.TIER_1: (1, 1),      # Always 1 drop
            MonsterTier.TIER_2: (1, 2),      # 1-2 drops
            MonsterTier.TIER_3: (2, 3),      # 2-3 drops
            MonsterTier.TIER_4: (3, 5),      # 3-5 drops (bosses)
        }
        
        min_drops, max_drops = drop_chances.get(monster_tier, (1, 1))
        return random.randint(min_drops, max_drops)

    @staticmethod
    def _generate_drop_from_entry(entry: LootEntry) -> Optional[Equipment]:
        """Generate an equipment drop from a loot entry."""
        if not entry.item_id and not entry.rarity:
            return None

        # Determine slot if not specified by item_id
        slot = random.choice(list(EquipmentSlot))
        
        # Determine rarity
        rarity = entry.rarity if entry.rarity else LootRoller._roll_rarity_for_tier()
        
        # Generate equipment
        equipment = EquipmentGenerator.generate_equipment(
            slot=slot,
            item_level=random.randint(1, 50),  # Could be based on monster level
            rarity=rarity
        )
        
        return equipment

    @staticmethod
    def _roll_rarity_for_tier() -> ItemRarity:
        """Roll for rarity based on general weights."""
        # These could be adjusted based on monster tier
        rarity_weights = {
            ItemRarity.COMMON: 60,
            ItemRarity.UNCOMMON: 25,
            ItemRarity.RARE: 10,
            ItemRarity.EPIC: 4,
            ItemRarity.LEGENDARY: 1,
        }
        
        total_weight = sum(rarity_weights.values())
        roll = random.randint(1, total_weight)
        
        current_weight = 0
        for rarity, weight in rarity_weights.items():
            current_weight += weight
            if roll <= current_weight:
                return rarity
        
        return ItemRarity.COMMON


class LootTableManager:
    """Manages loot table configuration and creation."""

    # Default loot table configurations for each monster tier
    DEFAULT_LOOT_TABLES = {
        MonsterTier.TIER_1: {
            "name": "Common Monster Drops",
            "entries": [
                LootEntry(weight=70, rarity=ItemRarity.COMMON),
                LootEntry(weight=25, rarity=ItemRarity.UNCOMMON),
                LootEntry(weight=5, rarity=ItemRarity.RARE),
            ],
            "currency_drops": [
                LootEntry(weight=100, min_quantity=1, max_quantity=5, is_guaranteed=True),
            ],
        },
        MonsterTier.TIER_2: {
            "name": "Elite Monster Drops",
            "entries": [
                LootEntry(weight=50, rarity=ItemRarity.COMMON),
                LootEntry(weight=35, rarity=ItemRarity.UNCOMMON),
                LootEntry(weight=12, rarity=ItemRarity.RARE),
                LootEntry(weight=3, rarity=ItemRarity.EPIC),
            ],
            "currency_drops": [
                LootEntry(weight=100, min_quantity=5, max_quantity=15, is_guaranteed=True),
            ],
        },
        MonsterTier.TIER_3: {
            "name": "Mini-Boss Drops",
            "entries": [
                LootEntry(weight=30, rarity=ItemRarity.COMMON),
                LootEntry(weight=40, rarity=ItemRarity.UNCOMMON),
                LootEntry(weight=20, rarity=ItemRarity.RARE),
                LootEntry(weight=8, rarity=ItemRarity.EPIC),
                LootEntry(weight=2, rarity=ItemRarity.LEGENDARY),
            ],
            "currency_drops": [
                LootEntry(weight=100, min_quantity=10, max_quantity=25, is_guaranteed=True),
                LootEntry(weight=50, min_quantity=1, max_quantity=3),  # Bonus currency chance
            ],
        },
        MonsterTier.TIER_4: {
            "name": "Boss Monster Drops",
            "entries": [
                LootEntry(weight=20, rarity=ItemRarity.COMMON),
                LootEntry(weight=30, rarity=ItemRarity.UNCOMMON),
                LootEntry(weight=25, rarity=ItemRarity.RARE),
                LootEntry(weight=15, rarity=ItemRarity.EPIC),
                LootEntry(weight=10, rarity=ItemRarity.LEGENDARY),
                # Guaranteed rare or better drop
                LootEntry(weight=1, rarity=ItemRarity.RARE, is_guaranteed=True),
            ],
            "currency_drops": [
                LootEntry(weight=100, min_quantity=25, max_quantity=50, is_guaranteed=True),
                LootEntry(weight=75, min_quantity=5, max_quantity=15),  # High bonus chance
                LootEntry(weight=25, min_quantity=1, max_quantity=5),  # Super bonus chance
            ],
        },
    }

    @staticmethod
    def create_default_loot_table(monster_tier: MonsterTier, table_id: str) -> LootTable:
        """Create a default loot table for the given monster tier."""
        config = LootTableManager.DEFAULT_LOOT_TABLES.get(monster_tier)
        if not config:
            raise ValueError(f"No default configuration for monster tier: {monster_tier}")

        return LootTable(
            table_id=table_id,
            name=config["name"],
            monster_tier=monster_tier,
            entries=config["entries"].copy(),
            currency_drops=config["currency_drops"].copy(),
        )

    @staticmethod
    def create_custom_loot_table(
        table_id: str,
        name: str,
        monster_tier: MonsterTier,
        entries: List[LootEntry],
        currency_drops: Optional[List[LootEntry]] = None,
    ) -> LootTable:
        """Create a custom loot table."""
        return LootTable(
            table_id=table_id,
            name=name,
            monster_tier=monster_tier,
            entries=entries,
            currency_drops=currency_drops or [],
        )

    @staticmethod
    def get_drop_probability(loot_table: LootEntry) -> float:
        """Calculate the drop probability for a specific loot entry."""
        # This would need the context of the entire loot table to be accurate
        # For now, return the weight as a percentage
        return min(1.0, loot_table.weight / 100.0)

    @staticmethod
    def validate_loot_table(loot_table: LootTable) -> List[str]:
        """Validate a loot table and return list of issues."""
        issues = []
        
        # Check if table has any entries
        if not loot_table.entries and not loot_table.currency_drops:
            issues.append("Loot table has no entries or currency drops")
        
        # Check for valid weights
        all_entries = loot_table.entries + loot_table.currency_drops
        for entry in all_entries:
            if entry.weight < 0:
                issues.append(f"Entry has negative weight: {entry}")
            if entry.min_quantity < 0 or entry.max_quantity < 0:
                issues.append(f"Entry has negative quantity: {entry}")
            if entry.min_quantity > entry.max_quantity:
                issues.append(f"Entry min_quantity > max_quantity: {entry}")
        
        # Check for guaranteed drops
        guaranteed_drops = [e for e in loot_table.entries if e.is_guaranteed]
        if len(guaranteed_drops) > 3:
            issues.append("Too many guaranteed drops (max 3 recommended)")
        
        return issues
"""
Tests for loot system functionality.
"""
import pytest
from combat_engine.models import (
    LootTable, LootEntry, ItemRarity, MonsterTier, EquipmentSlot
)
from combat_engine.loot import LootRoller, LootTableManager
from combat_engine.equipment import EquipmentGenerator


class TestLootRoller:
    """Test loot rolling functionality."""

    def test_roll_loot_basic(self):
        """Test basic loot rolling."""
        loot_table = LootTableManager.create_default_loot_table(
            MonsterTier.TIER_1, "test_table"
        )
        
        equipment_drops, currency_dropped = LootRoller.roll_loot(loot_table, seed=42)
        
        assert isinstance(equipment_drops, list)
        assert isinstance(currency_dropped, int)
        assert currency_dropped >= 0

    def test_roll_loot_guaranteed_drops(self):
        """Test guaranteed drops are always included."""
        # Create loot table with guaranteed drops
        guaranteed_entry = LootEntry(
            rarity=ItemRarity.RARE,
            is_guaranteed=True
        )
        
        loot_table = LootTable(
            table_id="test_guaranteed",
            name="Test Guaranteed",
            monster_tier=MonsterTier.TIER_1,
            entries=[guaranteed_entry]
        )
        
        equipment_drops, _ = LootRoller.roll_loot(loot_table, seed=42)
        
        # Should have at least one guaranteed drop
        assert len(equipment_drops) >= 1
        
        # Check that guaranteed drop has correct rarity
        guaranteed_drops = [drop for drop in equipment_drops if drop.rarity == ItemRarity.RARE]
        assert len(guaranteed_drops) >= 1

    def test_roll_loot_currency_drops(self):
        """Test currency drop rolling."""
        loot_table = LootTableManager.create_default_loot_table(
            MonsterTier.TIER_1, "test_currency"
        )
        
        # Roll multiple times to check currency drops
        total_currency = 0
        for _ in range(10):
            _, currency = LootRoller.roll_loot(loot_table)
            total_currency += currency
        
        # Should have dropped some currency
        assert total_currency > 0

    def test_roll_loot_by_tier(self):
        """Test that different monster tiers drop different amounts."""
        tier_1_table = LootTableManager.create_default_loot_table(
            MonsterTier.TIER_1, "tier_1_test"
        )
        tier_4_table = LootTableManager.create_default_loot_table(
            MonsterTier.TIER_4, "tier_4_test"
        )
        
        # Roll multiple times for each tier
        tier_1_drops = []
        tier_4_drops = []
        
        for _ in range(10):
            t1_equipment, _ = LootRoller.roll_loot(tier_1_table, seed=42)
            t4_equipment, _ = LootRoller.roll_loot(tier_4_table, seed=42)
            
            tier_1_drops.extend(t1_equipment)
            tier_4_drops.extend(t4_equipment)
        
        # Tier 4 should generally drop more items
        avg_t1_drops = len(tier_1_drops) / 10
        avg_t4_drops = len(tier_4_drops) / 10
        
        assert avg_t4_drops >= avg_t1_drops

    def test_roll_chance_function(self):
        """Test the roll chance function."""
        # Test with weight 100 (should always succeed)
        assert LootRoller._roll_chance(100) == True
        
        # Test with weight 0 (should always fail)
        assert LootRoller._roll_chance(0) == False
        
        # Test multiple rolls with weight 50 (should be around 50% success)
        successes = 0
        for _ in range(1000):
            if LootRoller._roll_chance(50):
                successes += 1
        
        # Should be roughly 50% (allowing for variance)
        assert 400 <= successes <= 600

    def test_deterministic_rolling_with_seed(self):
        """Test that same seed produces identical loot."""
        loot_table = LootTableManager.create_default_loot_table(
            MonsterTier.TIER_2, "deterministic_test"
        )
        
        equipment1, currency1 = LootRoller.roll_loot(loot_table, seed=12345)
        equipment2, currency2 = LootRoller.roll_loot(loot_table, seed=12345)
        
        # Should be identical
        assert len(equipment1) == len(equipment2)
        assert currency1 == currency2
        
        # Check equipment details match
        for i, (item1, item2) in enumerate(zip(equipment1, equipment2)):
            assert item1.rarity == item2.rarity
            assert item1.slot == item2.slot

    def test_get_drop_count_by_tier(self):
        """Test drop count calculation by monster tier."""
        # Test multiple rolls for each tier
        tier_counts = {}
        
        for tier in MonsterTier:
            counts = []
            for _ in range(100):
                count = LootRoller._get_drop_count(tier)
                counts.append(count)
            
            tier_counts[tier] = {
                "min": min(counts),
                "max": max(counts),
                "avg": sum(counts) / len(counts)
            }
        
        # Tier 4 (bosses) should drop more than Tier 1 (common)
        assert tier_counts[MonsterTier.TIER_4]["avg"] > tier_counts[MonsterTier.TIER_1]["avg"]
        assert tier_counts[MonsterTier.TIER_4]["min"] >= tier_counts[MonsterTier.TIER_1]["max"]


class TestLootTableManager:
    """Test loot table management functionality."""

    def test_create_default_loot_table(self):
        """Test creating default loot tables."""
        for tier in MonsterTier:
            loot_table = LootTableManager.create_default_loot_table(tier, f"test_{tier.value}")
            
            assert loot_table.table_id == f"test_{tier.value}"
            assert loot_table.monster_tier == tier
            assert len(loot_table.entries) > 0
            assert len(loot_table.currency_drops) > 0
            
            # Check that entries have valid weights
            for entry in loot_table.entries + loot_table.currency_drops:
                assert entry.weight >= 0
                assert entry.min_quantity >= 0
                assert entry.max_quantity >= entry.min_quantity

    def test_create_custom_loot_table(self):
        """Test creating custom loot tables."""
        entries = [
            LootEntry(rarity=ItemRarity.COMMON, weight=60),
            LootEntry(rarity=ItemRarity.RARE, weight=20),
            LootEntry(rarity=ItemRarity.LEGENDARY, weight=5, is_guaranteed=True),
        ]
        
        currency_drops = [
            LootEntry(weight=100, min_quantity=10, max_quantity=20, is_guaranteed=True),
        ]
        
        loot_table = LootTableManager.create_custom_loot_table(
            table_id="custom_test",
            name="Custom Test Table",
            monster_tier=MonsterTier.TIER_3,
            entries=entries,
            currency_drops=currency_drops
        )
        
        assert loot_table.table_id == "custom_test"
        assert loot_table.name == "Custom Test Table"
        assert loot_table.monster_tier == MonsterTier.TIER_3
        assert len(loot_table.entries) == 3
        assert len(loot_table.currency_drops) == 1
        
        # Check guaranteed drops
        guaranteed_entries = [e for e in loot_table.entries if e.is_guaranteed]
        assert len(guaranteed_entries) == 1
        assert guaranteed_entries[0].rarity == ItemRarity.LEGENDARY

    def test_validate_loot_table_valid(self):
        """Test validation of valid loot tables."""
        loot_table = LootTableManager.create_default_loot_table(
            MonsterTier.TIER_2, "valid_test"
        )
        
        issues = LootTableManager.validate_loot_table(loot_table)
        
        # Should have no issues
        assert len(issues) == 0

    def test_validate_loot_table_invalid_weights(self):
        """Test validation detects invalid weights."""
        loot_table = LootTable(
            table_id="invalid_weights",
            name="Invalid Weights",
            monster_tier=MonsterTier.TIER_1,
            entries=[
                LootEntry(weight=-10),  # Invalid negative weight
                LootEntry(weight=50),
            ]
        )
        
        issues = LootTableManager.validate_loot_table(loot_table)
        
        # Should detect negative weight
        assert any("negative weight" in issue for issue in issues)

    def test_validate_loot_table_invalid_quantities(self):
        """Test validation detects invalid quantities."""
        loot_table = LootTable(
            table_id="invalid_quantities",
            name="Invalid Quantities",
            monster_tier=MonsterTier.TIER_1,
            entries=[
                LootEntry(weight=50, min_quantity=10, max_quantity=5),  # min > max
            ]
        )
        
        issues = LootTableManager.validate_loot_table(loot_table)
        
        # Should detect quantity issue
        assert any("min_quantity > max_quantity" in issue for issue in issues)

    def test_validate_loot_table_too_many_guaranteed(self):
        """Test validation detects too many guaranteed drops."""
        loot_table = LootTable(
            table_id="too_many_guaranteed",
            name="Too Many Guaranteed",
            monster_tier=MonsterTier.TIER_1,
            entries=[
                LootEntry(weight=50, is_guaranteed=True),
                LootEntry(weight=30, is_guaranteed=True),
                LootEntry(weight=20, is_guaranteed=True),
                LootEntry(weight=10, is_guaranteed=True),
                LootEntry(weight=5, is_guaranteed=True),  # 5 guaranteed drops
            ]
        )
        
        issues = LootTableManager.validate_loot_table(loot_table)
        
        # Should detect too many guaranteed drops
        assert any("Too many guaranteed drops" in issue for issue in issues)

    def test_get_drop_probability(self):
        """Test drop probability calculation."""
        entry = LootEntry(weight=25)
        
        probability = LootTableManager.get_drop_probability(entry)
        
        # Should normalize weight to probability
        assert 0 <= probability <= 1
        assert probability == 0.25  # 25/100

    def test_default_loot_table_progression(self):
        """Test that default loot tables progress properly by tier."""
        tables = {}
        for tier in MonsterTier:
            tables[tier] = LootTableManager.create_default_loot_table(
                tier, f"progression_test_{tier.value}"
            )
        
        # Higher tiers should have better drop chances for rare items
        tier_1_rare_weight = 0
        tier_4_rare_weight = 0
        
        for entry in tables[MonsterTier.TIER_1].entries:
            if entry.rarity == ItemRarity.RARE:
                tier_1_rare_weight += entry.weight
        
        for entry in tables[MonsterTier.TIER_4].entries:
            if entry.rarity == ItemRarity.RARE:
                tier_4_rare_weight += entry.weight
        
        # Tier 4 should have higher weight for rare items
        assert tier_4_rare_weight > tier_1_rare_weight

    def test_currency_drop_progression(self):
        """Test that currency drops increase by tier."""
        tables = {}
        for tier in MonsterTier:
            tables[tier] = LootTableManager.create_default_loot_table(
                tier, f"currency_test_{tier.value}"
            )
        
        # Calculate average currency for each tier
        avg_currency = {}
        for tier, table in tables.items():
            total_currency = 0
            for _ in range(10):
                _, currency = LootRoller.roll_loot(table, seed=42)
                total_currency += currency
            avg_currency[tier] = total_currency / 10
        
        # Higher tiers should drop more currency
        assert avg_currency[MonsterTier.TIER_4] > avg_currency[MonsterTier.TIER_1]
        assert avg_currency[MonsterTier.TIER_3] > avg_currency[MonsterTier.TIER_2]


class TestLootIntegration:
    """Integration tests for loot system."""

    def test_full_loot_workflow(self):
        """Test complete loot workflow from table to equipment."""
        # Create loot table
        loot_table = LootTableManager.create_default_loot_table(
            MonsterTier.TIER_3, "workflow_test"
        )
        
        # Roll loot
        equipment_drops, currency = LootRoller.roll_loot(loot_table, seed=42)
        
        # Verify drops
        assert len(equipment_drops) > 0
        assert currency > 0
        
        # Verify equipment properties
        for equipment in equipment_drops:
            assert equipment.item_id is not None
            assert equipment.name is not None
            assert equipment.slot in EquipmentSlot
            assert equipment.rarity in ItemRarity
            assert equipment.level_requirement >= 1
            assert len(equipment.base_stats) > 0

    def test_loot_table_consistency(self):
        """Test that loot tables are consistent across multiple uses."""
        loot_table = LootTableManager.create_default_loot_table(
            MonsterTier.TIER_2, "consistency_test"
        )
        
        # Generate many drops and check for consistency
        all_rarities = []
        all_slots = []
        
        for _ in range(100):
            equipment_drops, _ = LootRoller.roll_loot(loot_table)
            for equipment in equipment_drops:
                all_rarities.append(equipment.rarity)
                all_slots.append(equipment.slot)
        
        # Should have variety but all valid
        assert len(set(all_rarities)) > 1  # Multiple rarities
        assert len(set(all_slots)) > 1  # Multiple slots
        
        # All should be valid enum values
        for rarity in all_rarities:
            assert rarity in ItemRarity
        
        for slot in all_slots:
            assert slot in EquipmentSlot
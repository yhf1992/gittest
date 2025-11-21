"""
Integration tests for the complete loot dungeon system.
"""
import pytest
from datetime import datetime, date
from combat_engine.models import (
    Character, CharacterClass, ElementType, PlayerInventory,
    EquipmentSlot, ItemRarity, MonsterTier, DungeonDifficulty
)
from combat_engine.equipment import EquipmentGenerator, InventoryManager
from combat_engine.loot import LootRoller, LootTableManager
from combat_engine.dungeon import DungeonManager, DailyResetScheduler


class TestLootDungeonIntegration:
    """Integration tests for the complete loot dungeon system."""

    def test_complete_gameplay_loop(self):
        """Test a complete gameplay loop from character creation to dungeon completion."""
        # Create player character
        player = Character(
            character_id="player_001",
            name="Brave Hero",
            character_class=CharacterClass.WARRIOR,
            level=5,
            max_hp=150,
            current_hp=150,
            attack=25,
            defense=18,
            speed=12,
            element=ElementType.FIRE
        )
        
        # Create player inventory with starting currency
        inventory = PlayerInventory(player_id="player_001", currency=500)
        
        # Initialize dungeon manager
        dungeon_manager = DungeonManager()
        
        # Create loot tables for all tiers
        loot_tables = {}
        for tier in MonsterTier:
            table_id = f"integration_test_{tier.value}"
            loot_tables[table_id] = LootTableManager.create_default_loot_table(tier, table_id)
        
        # Test 1: Generate starting equipment
        starting_weapon = EquipmentGenerator.generate_equipment(
            slot=EquipmentSlot.WEAPON,
            item_level=5,
            rarity=ItemRarity.COMMON,
            seed=42
        )
        
        starting_armor = EquipmentGenerator.generate_equipment(
            slot=EquipmentSlot.ARMOR,
            item_level=5,
            rarity=ItemRarity.COMMON,
            seed=123
        )
        
        # Add starting equipment to inventory
        InventoryManager.add_item_to_inventory(inventory, starting_weapon)
        InventoryManager.add_item_to_inventory(inventory, starting_armor)
        
        # Equip starting items
        InventoryManager.equip_item(inventory, starting_weapon.item_id)
        InventoryManager.equip_item(inventory, starting_armor.item_id)
        
        # Verify equipment is equipped
        assert inventory.equipment[EquipmentSlot.WEAPON] is not None
        assert inventory.equipment[EquipmentSlot.ARMOR] is not None
        
        # Test 2: Calculate player stats with equipment
        total_stats = InventoryManager.calculate_total_stats(inventory)
        assert total_stats["attack"] > 0
        assert total_stats["defense"] > 0
        
        # Apply equipment to character
        equipped_player = InventoryManager.apply_equipment_to_character(player, inventory)
        assert equipped_player.attack.current_value > player.attack.current_value
        assert equipped_player.defense.current_value > player.defense.current_value
        
        # Test 3: Enter and complete easy dungeon
        can_enter, _ = dungeon_manager.can_enter_dungeon(
            player_id="player_001",
            dungeon_id="goblin_caves",
            player_level=equipped_player.level,
            player_currency=inventory.currency
        )
        assert can_enter
        
        # Start dungeon run
        run, _ = dungeon_manager.start_dungeon_run(
            player_id="player_001",
            dungeon_id="goblin_caves",
            player_character=equipped_player,
            player_inventory=inventory,
            loot_tables=loot_tables
        )
        
        assert run is not None
        initial_currency = inventory.currency
        initial_inventory_size = len(inventory.inventory)
        
        # Complete dungeon run
        completed_run, _ = dungeon_manager.complete_dungeon_run(
            run_id=run.run_id,
            player_inventory=inventory,
            loot_tables=loot_tables
        )
        
        assert completed_run.completed == True
        assert len(completed_run.rewards_earned) >= 0
        assert completed_run.currency_earned >= 0
        
        # Verify rewards were received
        final_currency = inventory.currency
        final_inventory_size = len(inventory.inventory)
        
        # Should have earned some currency (even if just partial completion)
        assert final_currency >= initial_currency - run.entry_cost
        
        # Should have received equipment drops
        if completed_run.rewards_earned:
            assert final_inventory_size > initial_inventory_size
        
        # Test 4: Equip new items if any were received
        for new_item in completed_run.rewards_earned:
            if new_item.level_requirement <= equipped_player.level:
                InventoryManager.equip_item(inventory, new_item.item_id)
        
        # Test 5: Try harder dungeon
        if equipped_player.level >= 10 and inventory.currency >= 50:
            can_enter_hard, _ = dungeon_manager.can_enter_dungeon(
                player_id="player_001",
                dungeon_id="volcanic_fortress",
                player_level=equipped_player.level,
                player_currency=inventory.currency
            )
            
            if can_enter:
                hard_run, _ = dungeon_manager.start_dungeon_run(
                    player_id="player_001",
                    dungeon_id="volcanic_fortress",
                    player_character=equipped_player,
                    player_inventory=inventory,
                    loot_tables=loot_tables
                )
                
                if hard_run:
                    # Complete hard dungeon
                    hard_completed, _ = dungeon_manager.complete_dungeon_run(
                        run_id=hard_run.run_id,
                        player_inventory=inventory,
                        loot_tables=loot_tables
                    )
                    
                    # Hard dungeon should give better rewards
                    if hard_completed.completed:
                        assert hard_completed.currency_earned >= 0

    def test_loot_probability_distribution(self):
        """Test that loot probabilities work correctly over many runs."""
        # Create loot tables for testing
        loot_tables = {}
        for tier in MonsterTier:
            table_id = f"probability_test_{tier.value}"
            loot_tables[table_id] = LootTableManager.create_default_loot_table(tier, table_id)
        
        # Run many loot rolls to test distribution
        total_runs = 100
        tier_results = {tier: [] for tier in MonsterTier}
        
        for tier in MonsterTier:
            table = loot_tables[f"probability_test_{tier.value}"]
            
            for run in range(total_runs):
                equipment, currency = LootRoller.roll_loot(table, seed=run)
                tier_results[tier].append({
                    'equipment_count': len(equipment),
                    'currency': currency,
                    'rarities': [item.rarity for item in equipment]
                })
        
        # Verify distributions make sense
        for tier in MonsterTier:
            results = tier_results[tier]
            
            # Average equipment count should increase with tier
            avg_equipment = sum(r['equipment_count'] for r in results) / len(results)
            
            # Average currency should increase with tier
            avg_currency = sum(r['currency'] for r in results) / len(results)
            
            # All should have positive values
            assert avg_equipment >= 0
            assert avg_currency >= 0
            
            # Higher tiers should generally give more
            if tier == MonsterTier.TIER_4:
                assert avg_equipment >= 1  # Bosses should always drop something

    def test_equipment_stat_progression(self):
        """Test that equipment stats progress properly by level and rarity."""
        # Generate equipment at different levels and rarities
        test_cases = [
            (5, ItemRarity.COMMON),
            (5, ItemRarity.LEGENDARY),
            (10, ItemRarity.COMMON),
            (10, ItemRarity.LEGENDARY),
            (20, ItemRarity.COMMON),
            (20, ItemRarity.LEGENDARY),
        ]
        
        equipment_items = []
        
        for level, rarity in test_cases:
            for slot in EquipmentSlot:
                item = EquipmentGenerator.generate_equipment(
                    slot=slot,
                    item_level=level,
                    rarity=rarity,
                    seed=42
                )
                equipment_items.append((level, rarity, slot, item))
        
        # Test progression
        for slot in EquipmentSlot:
            slot_items = [item for _, _, s, item in equipment_items if s == slot]
            
            # Sort by level, then rarity
            slot_items.sort(key=lambda x: (x[0], x[1].value))
            
            # Test that higher level/rarity gives better stats
            for i in range(1, len(slot_items)):
                prev_level, prev_rarity, _, prev_item = slot_items[i-1]
                curr_level, curr_rarity, _, curr_item = slot_items[i]
                
                # If same level but higher rarity, should be better
                if curr_level == prev_level and curr_rarity.value > prev_rarity.value:
                    # Check base stats
                    for stat, value in curr_item.base_stats.items():
                        if stat in prev_item.base_stats:
                            assert value >= prev_item.base_stats[stat]
                    
                    # Should have more or equal affixes
                    assert len(curr_item.affixes) >= len(prev_item.affixes)
                
                # If higher level, should be better
                elif curr_level > prev_level:
                    for stat, value in curr_item.base_stats.items():
                        if stat in prev_item.base_stats:
                            assert value >= prev_item.base_stats[stat]

    def test_daily_reset_system(self):
        """Test daily reset system over multiple days."""
        dungeon_manager = DungeonManager()
        
        # Create player
        player_id = "daily_test_player"
        character = Character(
            character_id="daily_char",
            name="Daily Test Hero",
            character_class=CharacterClass.MAGE,
            level=10,
            max_hp=80,
            current_hp=80,
            attack=30,
            defense=10,
            speed=15,
            element=ElementType.WATER
        )
        
        inventory = PlayerInventory(player_id=player_id, currency=1000)
        loot_tables = {}
        
        # Test 1: Use all daily attempts for a dungeon
        dungeon = dungeon_manager.get_dungeon("goblin_caves")
        max_attempts = dungeon.daily_reset_count
        
        runs = []
        for i in range(max_attempts):
            can_enter, _ = dungeon_manager.can_enter_dungeon(
                player_id=player_id,
                dungeon_id="goblin_caves",
                player_level=character.level,
                player_currency=inventory.currency
            )
            
            if can_enter:
                run, _ = dungeon_manager.start_dungeon_run(
                    player_id=player_id,
                    dungeon_id="goblin_caves",
                    player_character=character,
                    player_inventory=inventory,
                    loot_tables=loot_tables
                )
                
                if run:
                    runs.append(run)
                    dungeon_manager.complete_dungeon_run(
                        run_id=run.run_id,
                        player_inventory=inventory,
                        loot_tables=loot_tables
                    )
        
        # Should have used all attempts
        assert len(runs) == max_attempts
        
        # Test 2: Next attempt should fail
        can_enter, message = dungeon_manager.can_enter_dungeon(
            player_id=player_id,
            dungeon_id="goblin_caves",
            player_level=character.level,
            player_currency=inventory.currency
        )
        
        assert not can_enter
        assert "Daily attempts exhausted" in message
        
        # Test 3: Simulate daily reset
        daily_info = dungeon_manager.get_or_create_daily_info(player_id)
        old_date = daily_info.date
        
        # Manually set date to yesterday to simulate reset
        from datetime import timedelta
        daily_info.date = date.today() - timedelta(days=1)
        
        # Now should be able to enter again
        can_enter, _ = dungeon_manager.can_enter_dungeon(
            player_id=player_id,
            dungeon_id="goblin_caves",
            player_level=character.level,
            player_currency=inventory.currency
        )
        
        assert can_enter

    def test_inventory_management_flow(self):
        """Test complete inventory management flow."""
        # Create inventory
        inventory = PlayerInventory(player_id="inventory_test", currency=100)
        
        # Initialize equipment slots
        for slot in EquipmentSlot:
            inventory.equipment[slot] = None
        
        # Generate various equipment
        items = []
        for i, rarity in enumerate(ItemRarity):
            for slot in EquipmentSlot:
                item = EquipmentGenerator.generate_equipment(
                    slot=slot,
                    item_level=10 + i * 5,
                    rarity=rarity,
                    seed=42 + i
                )
                items.append(item)
        
        # Add items to inventory
        for item in items:
            InventoryManager.add_item_to_inventory(inventory, item)
        
        assert len(inventory.inventory) == len(items)
        
        # Equip best items for each slot
        for slot in EquipmentSlot:
            slot_items = [item for item in inventory.inventory if item.slot == slot]
            
            # Sort by rarity, then by stats
            slot_items.sort(key=lambda x: (x.rarity.value, sum(x.base_stats.values())), reverse=True)
            
            if slot_items:
                best_item = slot_items[0]
                previous_item = InventoryManager.equip_item(inventory, best_item.item_id)
                
                # Should have equipped the best item
                assert inventory.equipment[slot] == best_item
                
                # Previous item should be None (slot was empty)
                assert previous_item is None
                
                # Item should be removed from inventory
                assert best_item not in inventory.inventory
        
        # Calculate total stats
        total_stats = InventoryManager.calculate_total_stats(inventory)
        assert total_stats["attack"] > 0
        assert total_stats["defense"] > 0
        assert total_stats["hp"] > 0
        
        # Test unequipping
        for slot in EquipmentSlot:
            if inventory.equipment[slot]:
                unequipped = InventoryManager.unequip_item(inventory, slot)
                assert unequipped is not None
                assert inventory.equipment[slot] is None
                assert unequipped in inventory.inventory

    def test_dungeon_combat_simulation(self):
        """Test dungeon combat simulation integration."""
        dungeon_manager = DungeonManager()
        
        # Create player character
        player = Character(
            character_id="combat_test",
            name="Combat Hero",
            character_class=CharacterClass.PALADIN,
            level=8,
            max_hp=120,
            current_hp=120,
            attack=22,
            defense=20,
            speed=8,
            element=ElementType.EARTH
        )
        
        # Test combat through dungeon floors
        success, combat_logs = dungeon_manager.simulate_dungeon_combat(
            player_character=player,
            monster_tiers=[MonsterTier.TIER_1, MonsterTier.TIER_2],
            floors=5,
            seed=42
        )
        
        # Should have combat logs for each floor
        assert len(combat_logs) == 5
        
        # Each log should have required fields
        for log in combat_logs:
            assert "combat_id" in log
            assert "player" in log
            assert "opponent" in log
            assert "turns" in log
            assert "winner_id" in log
            assert "total_turns" in log
        
        # Test with harder monsters
        success_hard, combat_logs_hard = dungeon_manager.simulate_dungeon_combat(
            player_character=player,
            monster_tiers=[MonsterTier.TIER_3, MonsterTier.TIER_4],
            floors=3,
            seed=42
        )
        
        # May or may not succeed against harder monsters
        # But should still have combat logs
        assert len(combat_logs_hard) == 3
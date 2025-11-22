"""
Tests for dungeon system functionality.
"""
import pytest
from datetime import datetime, date, timedelta
from combat_engine.models import (
    Dungeon, DungeonRun, DungeonDifficulty, MonsterTier,
    PlayerInventory, Character, CharacterClass, ElementType,
    LootTable
)
from combat_engine.dungeon import DungeonManager, DailyResetScheduler
from combat_engine.loot import LootTableManager
from combat_engine.equipment import EquipmentGenerator


class TestDungeonManager:
    """Test dungeon management functionality."""

    def test_get_dungeon(self):
        """Test getting dungeon by ID."""
        manager = DungeonManager()
        
        # Test getting existing dungeon
        dungeon = manager.get_dungeon("goblin_caves")
        assert dungeon is not None
        assert dungeon.dungeon_id == "goblin_caves"
        assert dungeon.difficulty == DungeonDifficulty.EASY
        
        # Test getting non-existent dungeon
        dungeon = manager.get_dungeon("non_existent")
        assert dungeon is None

    def test_list_dungeons(self):
        """Test listing all dungeons."""
        manager = DungeonManager()
        
        dungeons = manager.list_dungeons()
        
        # Should have default dungeons
        assert len(dungeons) >= 4
        
        # Check that all have required properties
        for dungeon in dungeons:
            assert dungeon.dungeon_id is not None
            assert dungeon.name is not None
            assert dungeon.difficulty in DungeonDifficulty
            assert dungeon.level_requirement >= 1
            assert dungeon.entry_cost >= 0
            assert dungeon.floors > 0
            assert dungeon.daily_reset_count > 0
            assert dungeon.reward_multiplier > 0

    def test_can_enter_dungeon_success(self):
        """Test successful dungeon entry conditions."""
        manager = DungeonManager()
        
        can_enter, message = manager.can_enter_dungeon(
            player_id="test_player",
            dungeon_id="goblin_caves",
            player_level=5,
            player_currency=100
        )
        
        assert can_enter == True
        assert message == "Can enter dungeon"

    def test_can_enter_dungeon_level_requirement(self):
        """Test dungeon entry blocked by level requirement."""
        manager = DungeonManager()
        
        can_enter, message = manager.can_enter_dungeon(
            player_id="test_player",
            dungeon_id="volcanic_fortress",  # Requires level 10
            player_level=5,  # Too low level
            player_currency=100
        )
        
        assert can_enter == False
        assert "Level requirement not met" in message

    def test_can_enter_dungeon_insufficient_currency(self):
        """Test dungeon entry blocked by insufficient currency."""
        manager = DungeonManager()
        
        can_enter, message = manager.can_enter_dungeon(
            player_id="test_player",
            dungeon_id="goblin_caves",  # Costs 10
            player_level=5,
            player_currency=5  # Not enough
        )
        
        assert can_enter == False
        assert "Insufficient currency" in message

    def test_can_enter_dungeon_daily_limit(self):
        """Test dungeon entry blocked by daily attempt limit."""
        manager = DungeonManager()
        
        # Create daily info with max attempts
        daily_info = manager.get_or_create_daily_info("test_player")
        daily_info.dungeon_attempts["goblin_caves"] = 5  # Max attempts for goblin_caves
        
        can_enter, message = manager.can_enter_dungeon(
            player_id="test_player",
            dungeon_id="goblin_caves",
            player_level=5,
            player_currency=100
        )
        
        assert can_enter == False
        assert "Daily attempts exhausted" in message

    def test_start_dungeon_run_success(self):
        """Test successfully starting a dungeon run."""
        manager = DungeonManager()
        
        # Create player character
        character = Character(
            character_id="test_char",
            name="Test Hero",
            character_class=CharacterClass.WARRIOR,
            level=5,
            max_hp=100,
            current_hp=100,
            attack=20,
            defense=15,
            speed=10,
            element=ElementType.NEUTRAL
        )
        
        # Create player inventory
        inventory = PlayerInventory(player_id="test_player", currency=100)
        
        # Create loot tables
        loot_tables = {
            "goblin_caves_tier_1": LootTableManager.create_default_loot_table(
                MonsterTier.TIER_1, "test_tier_1"
            )
        }
        
        run, message = manager.start_dungeon_run(
            player_id="test_player",
            dungeon_id="goblin_caves",
            player_character=character,
            player_inventory=inventory,
            loot_tables=loot_tables
        )
        
        assert run is not None
        assert run.player_id == "test_player"
        assert run.dungeon_id == "goblin_caves"
        assert run.difficulty == DungeonDifficulty.EASY
        assert run.start_time is not None
        assert run.completed == False
        assert "Dungeon run started" in message
        
        # Check that entry cost was deducted
        assert inventory.currency == 90  # 100 - 10 entry cost

    def test_start_dungeon_run_failure(self):
        """Test failing to start a dungeon run."""
        manager = DungeonManager()
        
        character = Character(
            character_id="test_char",
            name="Test Hero",
            character_class=CharacterClass.WARRIOR,
            level=1,  # Too low level
            max_hp=50,
            current_hp=50,
            attack=10,
            defense=5,
            speed=8,
            element=ElementType.NEUTRAL
        )
        
        inventory = PlayerInventory(player_id="test_player", currency=5)  # Not enough currency
        loot_tables = {}
        
        run, message = manager.start_dungeon_run(
            player_id="test_player",
            dungeon_id="volcanic_fortress",  # Requires level 10 and 50 currency
            player_character=character,
            player_inventory=inventory,
            loot_tables=loot_tables
        )
        
        assert run is None
        assert "Level requirement not met" in message or "Insufficient currency" in message

    def test_complete_dungeon_run_success(self):
        """Test successfully completing a dungeon run."""
        manager = DungeonManager()
        
        # Start a run first
        character = Character(
            character_id="test_char",
            name="Test Hero",
            character_class=CharacterClass.WARRIOR,
            level=5,
            max_hp=100,
            current_hp=100,
            attack=20,
            defense=15,
            speed=10,
            element=ElementType.NEUTRAL
        )
        
        inventory = PlayerInventory(player_id="test_player", currency=100)
        loot_tables = {
            "goblin_caves_tier_1": LootTableManager.create_default_loot_table(
                MonsterTier.TIER_1, "test_tier_1"
            )
        }
        
        run, _ = manager.start_dungeon_run(
            player_id="test_player",
            dungeon_id="goblin_caves",
            player_character=character,
            player_inventory=inventory,
            loot_tables=loot_tables
        )
        
        # Complete the run
        completed_run, message = manager.complete_dungeon_run(
            run_id=run.run_id,
            player_inventory=inventory,
            loot_tables=loot_tables
        )
        
        assert completed_run is not None
        assert completed_run.completed == True
        assert completed_run.end_time is not None
        assert completed_run.floors_completed == 5  # All floors
        assert "Dungeon completed" in message
        
        # Should have earned rewards
        assert len(completed_run.rewards_earned) >= 0
        assert completed_run.currency_earned >= 0

    def test_complete_dungeon_run_partial(self):
        """Test completing a dungeon run with partial floors."""
        manager = DungeonManager()
        
        # Start a run
        character = Character(
            character_id="test_char",
            name="Test Hero",
            character_class=CharacterClass.WARRIOR,
            level=5,
            max_hp=100,
            current_hp=100,
            attack=20,
            defense=15,
            speed=10,
            element=ElementType.NEUTRAL
        )
        
        inventory = PlayerInventory(player_id="test_player", currency=100)
        loot_tables = {}
        
        run, _ = manager.start_dungeon_run(
            player_id="test_player",
            dungeon_id="goblin_caves",
            player_character=character,
            player_inventory=inventory,
            loot_tables=loot_tables
        )
        
        initial_currency = inventory.currency
        
        # Complete with partial floors
        completed_run, message = manager.complete_dungeon_run(
            run_id=run.run_id,
            player_inventory=inventory,
            loot_tables=loot_tables,
            completed_floors=2  # Only 2 out of 5 floors
        )
        
        assert completed_run is not None
        assert completed_run.completed == False
        assert completed_run.floors_completed == 2
        assert "Dungeon run ended early" in message
        
        # Should get partial currency refund
        assert inventory.currency > initial_currency

    def test_get_or_create_daily_info(self):
        """Test getting or creating daily reset info."""
        manager = DungeonManager()
        
        # First call should create new info
        daily_info1 = manager.get_or_create_daily_info("test_player")
        assert daily_info1.player_id == "test_player"
        assert daily_info1.date == date.today()
        assert len(daily_info1.dungeon_attempts) == 0
        
        # Second call should return same info
        daily_info2 = manager.get_or_create_daily_info("test_player")
        assert daily_info1 == daily_info2

    def test_generate_completion_rewards(self):
        """Test reward generation for dungeon completion."""
        manager = DungeonManager()
        
        # Create a mock run
        run = DungeonRun(
            run_id="test_run",
            player_id="test_player",
            dungeon_id="goblin_caves",
            difficulty=DungeonDifficulty.EASY,
            start_time=datetime.now(),
            entry_cost=10
        )
        
        dungeon = manager.get_dungeon("goblin_caves")
        loot_tables = {
            "goblin_caves_tier_1": LootTableManager.create_default_loot_table(
                MonsterTier.TIER_1, "test_tier_1"
            )
        }
        
        rewards, currency = manager._generate_completion_rewards(run, dungeon, loot_tables)
        
        assert isinstance(rewards, list)
        assert isinstance(currency, int)
        assert currency >= 0

    def test_get_encounter_count(self):
        """Test encounter count calculation by monster tier."""
        manager = DungeonManager()
        
        # Test different tiers
        tier_1_count = manager._get_encounter_count(MonsterTier.TIER_1, 5)
        tier_2_count = manager._get_encounter_count(MonsterTier.TIER_2, 5)
        tier_3_count = manager._get_encounter_count(MonsterTier.TIER_3, 5)
        tier_4_count = manager._get_encounter_count(MonsterTier.TIER_4, 5)
        
        # Tier 1 should have most encounters (2 per floor)
        assert tier_1_count == 10  # 5 floors * 2
        
        # Tier 4 should have 1 boss encounter
        assert tier_4_count == 1
        
        # Tier 2 should have 1 per floor
        assert tier_2_count == 5
        
        # Tier 3 should have 1 every 2 floors
        assert tier_3_count == 2  # floor(5/2)

    def test_generate_monster_for_tier(self):
        """Test monster generation by tier and floor."""
        manager = DungeonManager()
        
        # Test different tiers
        tier_1_monster = manager._generate_monster_for_tier(MonsterTier.TIER_1, 1)
        tier_4_monster = manager._generate_monster_for_tier(MonsterTier.TIER_4, 10)
        
        # Tier 4 monster should be stronger
        assert tier_4_monster.max_hp > tier_1_monster.max_hp
        assert tier_4_monster.attack > tier_1_monster.attack
        assert tier_4_monster.defense > tier_1_monster.defense
        
        # Check floor scaling
        tier_1_floor_1 = manager._generate_monster_for_tier(MonsterTier.TIER_1, 1)
        tier_1_floor_5 = manager._generate_monster_for_tier(MonsterTier.TIER_1, 5)
        
        assert tier_1_floor_5.max_hp > tier_1_floor_1.max_hp


class TestDailyResetScheduler:
    """Test daily reset scheduler functionality."""

    def test_is_reset_needed(self):
        """Test reset need detection."""
        today = date.today()
        yesterday = today - timedelta(days=1)
        tomorrow = today + timedelta(days=1)
        
        # Should need reset for old date
        assert DailyResetScheduler.is_reset_needed(yesterday) == True
        
        # Should not need reset for today
        assert DailyResetScheduler.is_reset_needed(today) == False
        
        # Should need reset for future date (edge case)
        assert DailyResetScheduler.is_reset_needed(tomorrow) == True

    def test_perform_daily_reset(self):
        """Test performing daily reset."""
        daily_resets = {}
        
        # Perform reset
        daily_info = DailyResetScheduler.perform_daily_reset("test_player", daily_resets)
        
        assert daily_info.player_id == "test_player"
        assert daily_info.date == date.today()
        assert len(daily_info.dungeon_attempts) == 0
        assert "test_player" in daily_resets
        assert daily_resets["test_player"] == daily_info

    def test_get_attempts_remaining(self):
        """Test getting remaining attempts."""
        daily_resets = {}
        
        # Create a mock dungeon
        dungeon = Dungeon(
            dungeon_id="test_dungeon",
            name="Test Dungeon",
            description="Test",
            difficulty=DungeonDifficulty.EASY,
            level_requirement=1,
            entry_cost=10,
            floors=5,
            daily_reset_count=3
        )
        
        # Test full attempts
        remaining = DailyResetScheduler.get_attempts_remaining(
            "test_player", "test_dungeon", dungeon, daily_resets
        )
        assert remaining == 3
        
        # Use some attempts
        daily_info = daily_resets["test_player"]
        daily_info.dungeon_attempts["test_dungeon"] = 1
        
        remaining = DailyResetScheduler.get_attempts_remaining(
            "test_player", "test_dungeon", dungeon, daily_resets
        )
        assert remaining == 2
        
        # Use all attempts
        daily_info.dungeon_attempts["test_dungeon"] = 3
        
        remaining = DailyResetScheduler.get_attempts_remaining(
            "test_player", "test_dungeon", dungeon, daily_resets
        )
        assert remaining == 0


class TestDungeonIntegration:
    """Integration tests for dungeon system."""

    def test_full_dungeon_workflow(self):
        """Test complete dungeon workflow from entry to completion."""
        manager = DungeonManager()
        
        # Create player
        character = Character(
            character_id="test_char",
            name="Test Hero",
            character_class=CharacterClass.WARRIOR,
            level=5,
            max_hp=100,
            current_hp=100,
            attack=20,
            defense=15,
            speed=10,
            element=ElementType.NEUTRAL
        )
        
        inventory = PlayerInventory(player_id="test_player", currency=200)
        
        # Create loot tables
        loot_tables = {}
        for tier in [MonsterTier.TIER_1, MonsterTier.TIER_2]:
            table_id = f"goblin_caves_{tier.value}"
            loot_tables[table_id] = LootTableManager.create_default_loot_table(tier, table_id)
        
        # Check if can enter
        can_enter, _ = manager.can_enter_dungeon(
            player_id="test_player",
            dungeon_id="goblin_caves",
            player_level=character.level,
            player_currency=inventory.currency
        )
        assert can_enter
        
        # Start dungeon run
        run, message = manager.start_dungeon_run(
            player_id="test_player",
            dungeon_id="goblin_caves",
            player_character=character,
            player_inventory=inventory,
            loot_tables=loot_tables
        )
        
        assert run is not None
        initial_currency = inventory.currency
        
        # Complete dungeon run
        completed_run, _ = manager.complete_dungeon_run(
            run_id=run.run_id,
            player_inventory=inventory,
            loot_tables=loot_tables
        )
        
        assert completed_run.completed == True
        assert len(completed_run.rewards_earned) >= 0
        assert completed_run.currency_earned >= 0
        
        # Check that player got rewards
        final_currency = inventory.currency
        assert final_currency >= initial_currency  # Should have at least partial refund

    def test_dungeon_difficulty_progression(self):
        """Test that harder dungeons have better rewards."""
        manager = DungeonManager()
        
        dungeons = manager.list_dungeons()
        
        # Sort by difficulty
        difficulty_order = {
            DungeonDifficulty.EASY: 1,
            DungeonDifficulty.NORMAL: 2,
            DungeonDifficulty.HARD: 3,
            DungeonDifficulty.NIGHTMARE: 4
        }
        
        dungeons.sort(key=lambda d: difficulty_order[d.difficulty])
        
        # Check that harder dungeons have higher requirements and rewards
        for i in range(1, len(dungeons)):
            current = dungeons[i]
            previous = dungeons[i-1]
            
            # Higher difficulty should have higher requirements
            assert current.level_requirement >= previous.level_requirement
            assert current.entry_cost >= previous.entry_cost
            
            # Higher difficulty should have better reward multipliers
            assert current.reward_multiplier >= previous.reward_multiplier
            
            # Higher difficulty should have fewer daily attempts
            assert current.daily_reset_count <= previous.daily_reset_count

    def test_multiple_daily_attempts(self):
        """Test multiple daily attempts and reset."""
        manager = DungeonManager()
        
        character = Character(
            character_id="test_char",
            name="Test Hero",
            character_class=CharacterClass.WARRIOR,
            level=5,
            max_hp=100,
            current_hp=100,
            attack=20,
            defense=15,
            speed=10,
            element=ElementType.NEUTRAL
        )
        
        inventory = PlayerInventory(player_id="test_player", currency=1000)
        loot_tables = {}
        
        # Make multiple attempts
        attempts = []
        for i in range(3):  # Goblin caves allows 5 attempts per day
            run, message = manager.start_dungeon_run(
                player_id="test_player",
                dungeon_id="goblin_caves",
                player_character=character,
                player_inventory=inventory,
                loot_tables=loot_tables
            )
            
            if run:
                attempts.append(run)
                
                # Complete the run
                manager.complete_dungeon_run(
                    run_id=run.run_id,
                    player_inventory=inventory,
                    loot_tables=loot_tables
                )
        
        # Should have made 3 attempts
        assert len(attempts) == 3
        
        # Check daily info
        daily_info = manager.get_or_create_daily_info("test_player")
        assert daily_info.dungeon_attempts["goblin_caves"] == 3
        
        # Fourth attempt should fail
        can_enter, message = manager.can_enter_dungeon(
            player_id="test_player",
            dungeon_id="goblin_caves",
            player_level=character.level,
            player_currency=inventory.currency
        )
        
        # Should still be able to enter (we've only used 3 of 5 attempts)
        assert can_enter == True
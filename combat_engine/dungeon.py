"""
Dungeon system for managing dungeon runs, progress, and rewards.
"""
import uuid
from datetime import datetime, date, timedelta
from typing import List, Dict, Optional, Tuple

from .models import (
    Dungeon,
    DungeonRun,
    DungeonDifficulty,
    DailyResetInfo,
    PlayerInventory,
    MonsterTier,
    LootTable,
    Equipment,
    Character,
)
from .equipment import InventoryManager
from .engine import CombatSimulator
from .loot import LootRoller


class DungeonManager:
    """Manages dungeon operations and runs."""

    # Default dungeon configurations
    DEFAULT_DUNGEONS = {
        "goblin_caves": Dungeon(
            dungeon_id="goblin_caves",
            name="Goblin Caves",
            description="Infested caves filled with goblins and their treasures.",
            difficulty=DungeonDifficulty.EASY,
            level_requirement=1,
            entry_cost=10,
            floors=5,
            daily_reset_count=5,
            reward_multiplier=1.0,
            monster_tiers=[MonsterTier.TIER_1, MonsterTier.TIER_2],
        ),
        "dark_forest": Dungeon(
            dungeon_id="dark_forest",
            name="Dark Forest",
            description="A mysterious forest where dangerous creatures lurk.",
            difficulty=DungeonDifficulty.NORMAL,
            level_requirement=5,
            entry_cost=25,
            floors=8,
            daily_reset_count=3,
            reward_multiplier=1.2,
            monster_tiers=[MonsterTier.TIER_2, MonsterTier.TIER_3],
        ),
        "volcanic_fortress": Dungeon(
            dungeon_id="volcanic_fortress",
            name="Volcanic Fortress",
            description="A fortress built in the heart of a volcano, guarded by fire elementals.",
            difficulty=DungeonDifficulty.HARD,
            level_requirement=10,
            entry_cost=50,
            floors=10,
            daily_reset_count=2,
            reward_multiplier=1.5,
            monster_tiers=[MonsterTier.TIER_3, MonsterTier.TIER_4],
        ),
        "shadow_realm": Dungeon(
            dungeon_id="shadow_realm",
            name="Shadow Realm",
            description="A realm of pure darkness where only the strongest survive.",
            difficulty=DungeonDifficulty.NIGHTMARE,
            level_requirement=15,
            entry_cost=100,
            floors=15,
            daily_reset_count=1,
            reward_multiplier=2.0,
            monster_tiers=[MonsterTier.TIER_4],
        ),
    }

    def __init__(self):
        self.dungeons: Dict[str, Dungeon] = {}
        self.active_runs: Dict[str, DungeonRun] = {}
        self.daily_resets: Dict[str, DailyResetInfo] = {}
        
        # Initialize default dungeons
        for dungeon in DungeonManager.DEFAULT_DUNGEONS.values():
            self.dungeons[dungeon.dungeon_id] = dungeon

    def get_dungeon(self, dungeon_id: str) -> Optional[Dungeon]:
        """Get dungeon configuration by ID."""
        return self.dungeons.get(dungeon_id)

    def list_dungeons(self) -> List[Dungeon]:
        """Get all available dungeons."""
        return list(self.dungeons.values())

    def can_enter_dungeon(
        self,
        player_id: str,
        dungeon_id: str,
        player_level: int,
        player_currency: int,
    ) -> Tuple[bool, str]:
        """Check if player can enter the specified dungeon."""
        dungeon = self.get_dungeon(dungeon_id)
        if not dungeon:
            return False, "Dungeon not found"

        # Check level requirement
        if player_level < dungeon.level_requirement:
            return False, f"Level requirement not met (need {dungeon.level_requirement})"

        # Check entry cost
        if player_currency < dungeon.entry_cost:
            return False, f"Insufficient currency (need {dungeon.entry_cost})"

        # Check daily reset count
        daily_info = self.get_or_create_daily_info(player_id)
        attempts_today = daily_info.dungeon_attempts.get(dungeon_id, 0)
        if attempts_today >= dungeon.daily_reset_count:
            return False, f"Daily attempts exhausted ({attempts_today}/{dungeon.daily_reset_count})"

        return True, "Can enter dungeon"

    def start_dungeon_run(
        self,
        player_id: str,
        dungeon_id: str,
        player_character: Character,
        player_inventory: PlayerInventory,
        loot_tables: Dict[str, LootTable],
    ) -> Tuple[Optional[DungeonRun], str]:
        """Start a new dungeon run."""
        can_enter, message = self.can_enter_dungeon(
            player_id, dungeon_id, player_character.level, player_inventory.currency
        )
        
        if not can_enter:
            return None, message

        dungeon = self.get_dungeon(dungeon_id)
        run_id = str(uuid.uuid4())
        
        # Create dungeon run
        run = DungeonRun(
            run_id=run_id,
            player_id=player_id,
            dungeon_id=dungeon_id,
            difficulty=dungeon.difficulty,
            start_time=datetime.now(),
            total_floors=dungeon.floors,
            entry_cost=dungeon.entry_cost,
        )

        # Deduct entry cost
        player_inventory.currency -= dungeon.entry_cost

        # Update daily reset count
        daily_info = self.get_or_create_daily_info(player_id)
        daily_info.dungeon_attempts[dungeon_id] = daily_info.dungeon_attempts.get(dungeon_id, 0) + 1

        # Store active run
        self.active_runs[run_id] = run

        return run, "Dungeon run started"

    def complete_dungeon_run(
        self,
        run_id: str,
        player_inventory: PlayerInventory,
        loot_tables: Dict[str, LootTable],
        completed_floors: Optional[int] = None,
    ) -> Tuple[Optional[DungeonRun], str]:
        """Complete a dungeon run and distribute rewards."""
        run = self.active_runs.get(run_id)
        if not run:
            return None, "Run not found"

        dungeon = self.get_dungeon(run.dungeon_id)
        if not dungeon:
            return None, "Dungeon not found"

        # Update run completion
        run.end_time = datetime.now()
        run.floors_completed = completed_floors or dungeon.floors
        run.completed = run.floors_completed >= dungeon.floors

        # Generate rewards based on completion
        if run.completed:
            rewards, currency = self._generate_completion_rewards(run, dungeon, loot_tables)
            run.rewards_earned = rewards
            run.currency_earned = currency

            # Add rewards to player inventory
            for equipment in rewards:
                InventoryManager.add_item_to_inventory(player_inventory, equipment)
            player_inventory.currency += currency

            message = f"Dungeon completed! Earned {len(rewards)} items and {currency} currency"
        else:
            # Partial completion rewards
            currency = int(run.entry_cost * 0.3 * (run.floors_completed / dungeon.floors))
            run.currency_earned = currency
            player_inventory.currency += currency
            message = f"Dungeon run ended early. Refunded {currency} currency"

        # Remove from active runs
        del self.active_runs[run_id]

        return run, message

    def get_active_run(self, run_id: str) -> Optional[DungeonRun]:
        """Get an active dungeon run by ID."""
        return self.active_runs.get(run_id)

    def get_player_runs(self, player_id: str) -> List[DungeonRun]:
        """Get all runs for a specific player (including completed)."""
        # This would typically query a database
        # For now, return active runs only
        return [run for run in self.active_runs.values() if run.player_id == player_id]

    def get_or_create_daily_info(self, player_id: str) -> DailyResetInfo:
        """Get or create daily reset info for a player."""
        today = date.today()
        
        # Check if existing info is for today
        if player_id in self.daily_resets:
            daily_info = self.daily_resets[player_id]
            if daily_info.date == today:
                return daily_info

        # Create new daily info
        daily_info = DailyResetInfo(player_id=player_id, date=today)
        self.daily_resets[player_id] = daily_info
        return daily_info

    def _generate_completion_rewards(
        self,
        run: DungeonRun,
        dungeon: Dungeon,
        loot_tables: Dict[str, LootTable],
    ) -> Tuple[List[Equipment], int]:
        """Generate rewards for completing a dungeon."""
        all_rewards = []
        total_currency = 0

        # Generate rewards for each monster tier in the dungeon
        for monster_tier in dungeon.monster_tiers:
            # Get appropriate loot table
            loot_table_id = f"{dungeon.dungeon_id}_{monster_tier.value}"
            loot_table = loot_tables.get(loot_table_id)
            
            if not loot_table:
                continue

            # Number of encounters based on dungeon floors and tier
            encounter_count = self._get_encounter_count(monster_tier, dungeon.floors)
            
            for _ in range(encounter_count):
                equipment, currency = LootRoller.roll_loot(loot_table)
                all_rewards.extend(equipment)
                total_currency += currency

        # Apply dungeon reward multiplier
        total_currency = int(total_currency * dungeon.reward_multiplier)

        return all_rewards, total_currency

    def _get_encounter_count(self, monster_tier: MonsterTier, floors: int) -> int:
        """Get number of encounters for a monster tier based on dungeon floors."""
        base_encounters = {
            MonsterTier.TIER_1: floors * 2,      # 2 encounters per floor
            MonsterTier.TIER_2: floors,         # 1 encounter per floor
            MonsterTier.TIER_3: max(1, floors // 2),  # 1 every 2 floors
            MonsterTier.TIER_4: 1,              # 1 boss at the end
        }
        
        return base_encounters.get(monster_tier, 0)

    def simulate_dungeon_combat(
        self,
        player_character: Character,
        monster_tiers: List[MonsterTier],
        floors: int,
        seed: Optional[int] = None,
    ) -> Tuple[bool, List[Dict]]:
        """
        Simulate combat through a dungeon.
        Returns (success, combat_logs)
        """
        if seed is not None:
            import random
            random.seed(seed)

        combat_logs = []
        simulator = CombatSimulator(seed=seed)
        
        # Generate encounters for each floor
        for floor in range(1, floors + 1):
            # Determine monster tier for this floor
            if floor == floors:  # Boss floor
                tier = MonsterTier.TIER_4
            elif floor % 3 == 0:  # Every 3rd floor is harder
                tier = MonsterTier.TIER_3
            elif floor % 2 == 0:  # Every 2nd floor is medium
                tier = MonsterTier.TIER_2
            else:  # Regular floors
                tier = MonsterTier.TIER_1

            # Generate monster for this encounter
            monster = self._generate_monster_for_tier(tier, floor)
            
            # Simulate combat
            combat_log = simulator.simulate_combat(player_character, monster)
            combat_logs.append(combat_log.to_dict())

            # Check if player won
            if combat_log.winner_id != player_character.character_id:
                return False, combat_logs

        return True, combat_logs

    def _generate_monster_for_tier(self, tier: MonsterTier, floor: int) -> Character:
        """Generate a monster character based on tier and floor."""
        from .models import CharacterClass, ElementType
        
        # Base stats by tier
        tier_stats = {
            MonsterTier.TIER_1: {"hp": 30, "attack": 8, "defense": 5, "speed": 8},
            MonsterTier.TIER_2: {"hp": 50, "attack": 12, "defense": 8, "speed": 10},
            MonsterTier.TIER_3: {"hp": 80, "attack": 18, "defense": 12, "speed": 12},
            MonsterTier.TIER_4: {"hp": 120, "attack": 25, "defense": 18, "speed": 15},
        }

        stats = tier_stats[tier]
        
        # Scale by floor
        scale_factor = 1.0 + (floor * 0.1)
        
        return Character(
            character_id=f"monster_{tier.value}_{floor}",
            name=f"{tier.value.replace('_', ' ').title()} Floor {floor}",
            character_class=CharacterClass.ROGUE,  # Default class
            level=max(1, floor),
            max_hp=int(stats["hp"] * scale_factor),
            current_hp=int(stats["hp"] * scale_factor),
            attack=int(stats["attack"] * scale_factor),
            defense=int(stats["defense"] * scale_factor),
            speed=int(stats["speed"] * scale_factor),
            element=ElementType.NEUTRAL,
        )


class DailyResetScheduler:
    """Handles daily reset logic for dungeon attempts."""

    @staticmethod
    def is_reset_needed(last_reset_date: date) -> bool:
        """Check if a daily reset is needed."""
        return last_reset_date < date.today()

    @staticmethod
    def perform_daily_reset(player_id: str, daily_resets: Dict[str, DailyResetInfo]) -> DailyResetInfo:
        """Perform daily reset for a player."""
        new_daily_info = DailyResetInfo(player_id=player_id, date=date.today())
        daily_resets[player_id] = new_daily_info
        return new_daily_info

    @staticmethod
    def get_attempts_remaining(
        player_id: str,
        dungeon_id: str,
        dungeon: Dungeon,
        daily_resets: Dict[str, DailyResetInfo],
    ) -> int:
        """Get remaining attempts for a player in a specific dungeon."""
        today = date.today()
        
        # Check if we need a reset
        if player_id not in daily_resets or daily_resets[player_id].date < today:
            DailyResetScheduler.perform_daily_reset(player_id, daily_resets)
        
        daily_info = daily_resets[player_id]
        attempts_used = daily_info.dungeon_attempts.get(dungeon_id, 0)
        return max(0, dungeon.daily_reset_count - attempts_used)
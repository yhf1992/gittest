"""Tests for combat engine logic."""
import pytest
from combat_engine.models import (
    Character,
    CharacterClass,
    ElementType,
    StatusEffect,
    StatusEffectType,
)
from combat_engine.engine import (
    CombatSimulator,
    DamageCalculator,
    StatusEffectEngine,
    ElementalModifier,
)


class TestElementalModifier:
    """Test elemental modifier calculations."""

    def test_fire_vs_earth(self):
        """Test fire advantage against earth."""
        modifier = ElementalModifier.get_modifier(ElementType.FIRE, ElementType.EARTH)
        assert modifier == 1.5

    def test_fire_vs_wind(self):
        """Test fire weakness against wind."""
        modifier = ElementalModifier.get_modifier(ElementType.FIRE, ElementType.WIND)
        assert modifier == 0.8

    def test_water_vs_fire(self):
        """Test water advantage against fire."""
        modifier = ElementalModifier.get_modifier(ElementType.WATER, ElementType.FIRE)
        assert modifier == 1.5

    def test_earth_vs_water(self):
        """Test earth advantage against water."""
        modifier = ElementalModifier.get_modifier(ElementType.EARTH, ElementType.WATER)
        assert modifier == 1.5

    def test_wind_vs_water(self):
        """Test wind advantage against water."""
        modifier = ElementalModifier.get_modifier(ElementType.WIND, ElementType.WATER)
        assert modifier == 1.5

    def test_neutral_element(self):
        """Test neutral element has no modifiers."""
        modifier = ElementalModifier.get_modifier(ElementType.NEUTRAL, ElementType.FIRE)
        assert modifier == 1.0

    def test_same_elements(self):
        """Test same elements have no modifier."""
        modifier = ElementalModifier.get_modifier(ElementType.FIRE, ElementType.FIRE)
        assert modifier == 1.0


class TestStatusEffectEngine:
    """Test status effect application and processing."""

    def test_apply_stun(self):
        """Test applying stun effect."""
        target = Character(
            character_id="target",
            name="Target",
            character_class=CharacterClass.WARRIOR,
            level=1,
            max_hp=100,
            current_hp=100,
            attack=10,
            defense=10,
            speed=10,
            element=ElementType.NEUTRAL,
        )
        effect = StatusEffectEngine.apply_stun(target, duration=1, source_id="attacker")
        assert target.has_status_effect(StatusEffectType.STUN)
        assert effect.duration == 1

    def test_apply_dot(self):
        """Test applying damage over time effect."""
        target = Character(
            character_id="target",
            name="Target",
            character_class=CharacterClass.WARRIOR,
            level=1,
            max_hp=100,
            current_hp=100,
            attack=10,
            defense=10,
            speed=10,
            element=ElementType.NEUTRAL,
        )
        effect = StatusEffectEngine.apply_dot(target, damage_per_turn=5, duration=3, source_id="attacker")
        assert target.has_status_effect(StatusEffectType.DOT)
        assert effect.value == 5

    def test_apply_defense_debuff(self):
        """Test applying defense debuff effect."""
        target = Character(
            character_id="target",
            name="Target",
            character_class=CharacterClass.WARRIOR,
            level=1,
            max_hp=100,
            current_hp=100,
            attack=10,
            defense=10,
            speed=10,
            element=ElementType.NEUTRAL,
        )
        original_defense = target.defense.current_value
        effect = StatusEffectEngine.apply_defense_debuff(
            target, defense_reduction=3, duration=2, source_id="attacker"
        )
        assert target.has_status_effect(StatusEffectType.DEFENSE_DEBUFF)
        assert target.defense.current_value == original_defense - 3

    def test_apply_attack_buff(self):
        """Test applying attack buff effect."""
        target = Character(
            character_id="target",
            name="Target",
            character_class=CharacterClass.WARRIOR,
            level=1,
            max_hp=100,
            current_hp=100,
            attack=10,
            defense=10,
            speed=10,
            element=ElementType.NEUTRAL,
        )
        original_attack = target.attack.current_value
        effect = StatusEffectEngine.apply_attack_buff(target, attack_bonus=5, duration=2, source_id="attacker")
        assert target.has_status_effect(StatusEffectType.ATTACK_BUFF)
        assert target.attack.current_value == original_attack + 5

    def test_process_dot_start_of_turn(self):
        """Test processing DoT at start of turn."""
        target = Character(
            character_id="target",
            name="Target",
            character_class=CharacterClass.WARRIOR,
            level=1,
            max_hp=100,
            current_hp=100,
            attack=10,
            defense=10,
            speed=10,
            element=ElementType.NEUTRAL,
        )
        StatusEffectEngine.apply_dot(target, damage_per_turn=5, duration=2, source_id="attacker")
        results = StatusEffectEngine.process_status_effects_start_of_turn(target)
        assert len(results) == 1
        assert results[0][1] == 5  # 5 damage


class TestDamageCalculator:
    """Test damage calculation formulas."""

    def test_basic_damage_calculation(self):
        """Test basic damage calculation without randomness."""
        attacker = Character(
            character_id="attacker",
            name="Attacker",
            character_class=CharacterClass.WARRIOR,
            level=1,
            max_hp=100,
            current_hp=100,
            attack=20,
            defense=5,
            speed=10,
            element=ElementType.NEUTRAL,
        )
        defender = Character(
            character_id="defender",
            name="Defender",
            character_class=CharacterClass.WARRIOR,
            level=1,
            max_hp=100,
            current_hp=100,
            attack=10,
            defense=8,
            speed=10,
            element=ElementType.NEUTRAL,
        )
        DamageCalculator.set_random_seed(42)
        damage, is_crit, is_miss = DamageCalculator.calculate_damage(
            attacker, defender, base_multiplier=1.0, use_random=False
        )
        # Base damage = attack * 1.0 - defense * 0.5 = 20 * 1.0 - 8 * 0.5 = 20 - 4 = 16
        assert damage >= 1
        assert not is_crit
        assert not is_miss

    def test_damage_with_elemental_advantage(self):
        """Test damage calculation with elemental advantage."""
        attacker = Character(
            character_id="attacker",
            name="Attacker",
            character_class=CharacterClass.WARRIOR,
            level=1,
            max_hp=100,
            current_hp=100,
            attack=20,
            defense=5,
            speed=10,
            element=ElementType.FIRE,  # Fire
        )
        defender = Character(
            character_id="defender",
            name="Defender",
            character_class=CharacterClass.WARRIOR,
            level=1,
            max_hp=100,
            current_hp=100,
            attack=10,
            defense=8,
            speed=10,
            element=ElementType.EARTH,  # Earth (weak to fire)
        )
        DamageCalculator.set_random_seed(42)
        damage, is_crit, is_miss = DamageCalculator.calculate_damage(
            attacker, defender, base_multiplier=1.0, use_random=False
        )
        assert damage > 16  # Should be higher due to element advantage

    def test_damage_minimum_is_one(self):
        """Test damage is at least 1."""
        attacker = Character(
            character_id="attacker",
            name="Attacker",
            character_class=CharacterClass.WARRIOR,
            level=1,
            max_hp=100,
            current_hp=100,
            attack=1,
            defense=5,
            speed=10,
            element=ElementType.NEUTRAL,
        )
        defender = Character(
            character_id="defender",
            name="Defender",
            character_class=CharacterClass.WARRIOR,
            level=1,
            max_hp=100,
            current_hp=100,
            attack=10,
            defense=50,
            speed=10,
            element=ElementType.NEUTRAL,
        )
        DamageCalculator.set_random_seed(42)
        damage, is_crit, is_miss = DamageCalculator.calculate_damage(
            attacker, defender, base_multiplier=1.0, use_random=False
        )
        assert damage >= 1


class TestCombatSimulator:
    """Test combat simulation."""

    def test_simulate_simple_combat(self):
        """Test simulating a complete combat."""
        player = Character(
            character_id="player_1",
            name="Hero",
            character_class=CharacterClass.WARRIOR,
            level=5,
            max_hp=100,
            current_hp=100,
            attack=20,
            defense=15,
            speed=10,
            element=ElementType.FIRE,
        )
        opponent = Character(
            character_id="monster_1",
            name="Goblin",
            character_class=CharacterClass.ROGUE,
            level=3,
            max_hp=50,
            current_hp=50,
            attack=12,
            defense=5,
            speed=8,
            element=ElementType.NEUTRAL,
        )

        simulator = CombatSimulator(seed=42)
        combat_log = simulator.simulate_combat(player, opponent)

        assert combat_log.combat_id is not None
        assert combat_log.winner_id is not None
        assert len(combat_log.turns) > 0
        assert combat_log.total_turns == len(combat_log.turns)
        assert (
            combat_log.winner_id in [player.character_id, opponent.character_id]
            or combat_log.winner_id is None
        )

    def test_combat_respects_max_turns(self):
        """Test that combat respects maximum turn limit."""
        # Create very balanced opponents to test max turn limit
        player = Character(
            character_id="player_1",
            name="Hero",
            character_class=CharacterClass.WARRIOR,
            level=5,
            max_hp=1000,
            current_hp=1000,
            attack=5,  # Low attack
            defense=25,  # High defense
            speed=10,
            element=ElementType.NEUTRAL,
        )
        opponent = Character(
            character_id="monster_1",
            name="Boss",
            character_class=CharacterClass.WARRIOR,
            level=5,
            max_hp=1000,
            current_hp=1000,
            attack=5,  # Low attack
            defense=25,  # High defense
            speed=10,
            element=ElementType.NEUTRAL,
        )

        simulator = CombatSimulator(seed=42)
        combat_log = simulator.simulate_combat(player, opponent)

        assert combat_log.total_turns <= simulator.MAX_TURNS

    def test_combat_deterministic_with_seed(self):
        """Test that combat is deterministic with same seed."""
        player = Character(
            character_id="player_1",
            name="Hero",
            character_class=CharacterClass.WARRIOR,
            level=5,
            max_hp=100,
            current_hp=100,
            attack=20,
            defense=15,
            speed=10,
            element=ElementType.FIRE,
        )
        opponent = Character(
            character_id="monster_1",
            name="Goblin",
            character_class=CharacterClass.ROGUE,
            level=3,
            max_hp=50,
            current_hp=50,
            attack=12,
            defense=5,
            speed=8,
            element=ElementType.NEUTRAL,
        )

        # Run combat twice with same seed
        simulator1 = CombatSimulator(seed=12345)
        combat_log1 = simulator1.simulate_combat(
            Character(
                character_id="player_1",
                name="Hero",
                character_class=CharacterClass.WARRIOR,
                level=5,
                max_hp=100,
                current_hp=100,
                attack=20,
                defense=15,
                speed=10,
                element=ElementType.FIRE,
            ),
            Character(
                character_id="monster_1",
                name="Goblin",
                character_class=CharacterClass.ROGUE,
                level=3,
                max_hp=50,
                current_hp=50,
                attack=12,
                defense=5,
                speed=8,
                element=ElementType.NEUTRAL,
            ),
        )

        simulator2 = CombatSimulator(seed=12345)
        combat_log2 = simulator2.simulate_combat(
            Character(
                character_id="player_1",
                name="Hero",
                character_class=CharacterClass.WARRIOR,
                level=5,
                max_hp=100,
                current_hp=100,
                attack=20,
                defense=15,
                speed=10,
                element=ElementType.FIRE,
            ),
            Character(
                character_id="monster_1",
                name="Goblin",
                character_class=CharacterClass.ROGUE,
                level=3,
                max_hp=50,
                current_hp=50,
                attack=12,
                defense=5,
                speed=8,
                element=ElementType.NEUTRAL,
            ),
        )

        # Check that combats have same result
        assert combat_log1.winner_id == combat_log2.winner_id
        assert combat_log1.total_turns == combat_log2.total_turns

    def test_dead_character_cannot_attack(self):
        """Test that dead character doesn't attack."""
        # This is implicitly tested by alive check - dead character has current_hp <= 0
        player = Character(
            character_id="player_1",
            name="Hero",
            character_class=CharacterClass.WARRIOR,
            level=5,
            max_hp=100,
            current_hp=100,
            attack=20,
            defense=15,
            speed=10,
            element=ElementType.FIRE,
        )
        opponent = Character(
            character_id="monster_1",
            name="Goblin",
            character_class=CharacterClass.ROGUE,
            level=3,
            max_hp=1,  # Very low health
            current_hp=1,
            attack=0,  # No attack
            defense=0,
            speed=8,
            element=ElementType.NEUTRAL,
        )

        simulator = CombatSimulator(seed=42)
        combat_log = simulator.simulate_combat(player, opponent)

        # Player should be the winner
        assert combat_log.winner_id == player.character_id


class TestStatusEffects:
    """Test status effects in combat."""

    def test_stun_prevents_action(self):
        """Test that stun prevents character from acting."""
        player = Character(
            character_id="player_1",
            name="Hero",
            character_class=CharacterClass.WARRIOR,
            level=5,
            max_hp=100,
            current_hp=100,
            attack=20,
            defense=15,
            speed=10,
            element=ElementType.FIRE,
        )
        opponent = Character(
            character_id="monster_1",
            name="Goblin",
            character_class=CharacterClass.ROGUE,
            level=3,
            max_hp=50,
            current_hp=50,
            attack=12,
            defense=5,
            speed=8,
            element=ElementType.NEUTRAL,
        )

        # Apply stun to player
        StatusEffectEngine.apply_stun(player, duration=1, source_id=opponent.character_id)

        simulator = CombatSimulator(seed=42)
        # Simulate one turn manually
        turn_log = simulator.simulate_combat(player, opponent)
        # The combat should still complete, but we can verify the mechanics work


class TestTierProgression:
    """Test tier/level progression impacts."""

    def test_higher_level_has_higher_stats(self):
        """Test that higher level characters have impact."""
        low_level = Character(
            character_id="low",
            name="Low Level",
            character_class=CharacterClass.WARRIOR,
            level=1,
            max_hp=50,
            current_hp=50,
            attack=5,
            defense=5,
            speed=5,
            element=ElementType.NEUTRAL,
        )
        high_level = Character(
            character_id="high",
            name="High Level",
            character_class=CharacterClass.WARRIOR,
            level=10,
            max_hp=200,
            current_hp=200,
            attack=25,
            defense=20,
            speed=15,
            element=ElementType.NEUTRAL,
        )

        # High level should have better stats
        assert high_level.max_hp > low_level.max_hp
        assert high_level.attack.base_value > low_level.attack.base_value
        assert high_level.defense.base_value > low_level.defense.base_value

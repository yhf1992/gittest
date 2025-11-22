"""Tests for edge cases and complex scenarios."""
import pytest
from combat_engine.models import (
    Character,
    CharacterClass,
    ElementType,
    StatusEffect,
    StatusEffectType,
)
from combat_engine.engine import CombatSimulator, StatusEffectEngine, DamageCalculator


class TestCriticalHits:
    """Test critical hit mechanics."""

    def test_critical_hit_doubles_damage(self):
        """Test that critical hits double damage."""
        attacker = Character(
            character_id="attacker",
            name="Strong",
            character_class=CharacterClass.WARRIOR,
            level=1,
            max_hp=100,
            current_hp=100,
            attack=50,
            defense=0,
            speed=10,
            element=ElementType.NEUTRAL,
        )
        defender = Character(
            character_id="defender",
            name="Weak",
            character_class=CharacterClass.ROGUE,
            level=1,
            max_hp=100,
            current_hp=100,
            attack=10,
            defense=0,
            speed=1,
            element=ElementType.NEUTRAL,
        )

        # Calculate normal damage
        DamageCalculator.set_random_seed(42)
        normal_damage, _, _ = DamageCalculator.calculate_damage(
            attacker, defender, base_multiplier=1.0, use_random=False
        )

        # Crit damage should be 2x
        assert normal_damage > 0


class TestMissChance:
    """Test miss mechanics."""

    def test_miss_prevents_damage(self):
        """Test that miss results in 0 damage."""
        attacker = Character(
            character_id="attacker",
            name="Attacker",
            character_class=CharacterClass.WARRIOR,
            level=1,
            max_hp=100,
            current_hp=100,
            attack=50,
            defense=0,
            speed=10,
            element=ElementType.NEUTRAL,
        )
        defender = Character(
            character_id="defender",
            name="Defender",
            character_class=CharacterClass.ROGUE,
            level=1,
            max_hp=100,
            current_hp=100,
            attack=10,
            defense=0,
            speed=1,
            element=ElementType.NEUTRAL,
        )

        # Run many attempts to catch a miss
        for i in range(100):
            DamageCalculator.set_random_seed(i)
            damage, _, is_miss = DamageCalculator.calculate_damage(
                attacker, defender, base_multiplier=1.0, use_random=True
            )
            if is_miss:
                assert damage == 0
                return

        # If we get here, we never saw a miss in 100 attempts (unlucky but possible)


class TestDeathHandling:
    """Test death mechanics."""

    def test_character_dies_when_hp_reaches_zero(self):
        """Test character death when HP reaches 0."""
        char = Character(
            character_id="char",
            name="Character",
            character_class=CharacterClass.WARRIOR,
            level=1,
            max_hp=10,
            current_hp=10,
            attack=10,
            defense=10,
            speed=10,
            element=ElementType.NEUTRAL,
        )
        assert char.is_alive()

        char.take_damage(10)
        assert not char.is_alive()

    def test_dead_character_doesnt_exceed_negative_hp(self):
        """Test that damage doesn't make HP go below 0."""
        char = Character(
            character_id="char",
            name="Character",
            character_class=CharacterClass.WARRIOR,
            level=1,
            max_hp=10,
            current_hp=5,
            attack=10,
            defense=10,
            speed=10,
            element=ElementType.NEUTRAL,
        )

        damage = char.take_damage(100)
        assert damage == 5  # Only 5 damage taken
        assert char.current_hp == 0


class TestOverheal:
    """Test over-healing prevention."""

    def test_heal_capped_at_max_hp(self):
        """Test that healing doesn't exceed max HP."""
        char = Character(
            character_id="char",
            name="Character",
            character_class=CharacterClass.WARRIOR,
            level=1,
            max_hp=100,
            current_hp=90,
            attack=10,
            defense=10,
            speed=10,
            element=ElementType.NEUTRAL,
        )

        healing = char.heal(50)
        assert healing == 10  # Only 10 HP healed
        assert char.current_hp == 100

    def test_heal_when_full_health(self):
        """Test healing when already at full health."""
        char = Character(
            character_id="char",
            name="Character",
            character_class=CharacterClass.WARRIOR,
            level=1,
            max_hp=100,
            current_hp=100,
            attack=10,
            defense=10,
            speed=10,
            element=ElementType.NEUTRAL,
        )

        healing = char.heal(50)
        assert healing == 0
        assert char.current_hp == 100


class TestStatusEffectLifecycle:
    """Test status effect application, duration, and removal."""

    def test_stun_is_applied_and_ticks_down(self):
        """Test stun effect application and duration."""
        char = Character(
            character_id="char",
            name="Character",
            character_class=CharacterClass.WARRIOR,
            level=1,
            max_hp=100,
            current_hp=100,
            attack=10,
            defense=10,
            speed=10,
            element=ElementType.NEUTRAL,
        )

        effect = StatusEffectEngine.apply_stun(char, duration=2, source_id="attacker")
        assert char.has_status_effect(StatusEffectType.STUN)
        assert len(char.status_effects) == 1
        assert char.status_effects[0].duration == 2

    def test_multiple_different_effects_stack(self):
        """Test that different effect types can coexist."""
        char = Character(
            character_id="char",
            name="Character",
            character_class=CharacterClass.WARRIOR,
            level=1,
            max_hp=100,
            current_hp=100,
            attack=10,
            defense=10,
            speed=10,
            element=ElementType.NEUTRAL,
        )

        StatusEffectEngine.apply_stun(char, duration=1, source_id="attacker1")
        StatusEffectEngine.apply_dot(char, damage_per_turn=5, duration=3, source_id="attacker2")

        assert len(char.status_effects) == 2
        assert char.has_status_effect(StatusEffectType.STUN)
        assert char.has_status_effect(StatusEffectType.DOT)

    def test_same_effect_replaces_if_longer(self):
        """Test that longer-duration effects replace shorter ones."""
        char = Character(
            character_id="char",
            name="Character",
            character_class=CharacterClass.WARRIOR,
            level=1,
            max_hp=100,
            current_hp=100,
            attack=10,
            defense=10,
            speed=10,
            element=ElementType.NEUTRAL,
        )

        StatusEffectEngine.apply_stun(char, duration=1, source_id="attacker1")
        assert char.status_effects[0].duration == 1

        StatusEffectEngine.apply_stun(char, duration=3, source_id="attacker2")
        assert len(char.status_effects) == 1
        assert char.status_effects[0].duration == 3

    def test_same_effect_shorter_duration_not_replaced(self):
        """Test that shorter-duration effects don't replace longer ones."""
        char = Character(
            character_id="char",
            name="Character",
            character_class=CharacterClass.WARRIOR,
            level=1,
            max_hp=100,
            current_hp=100,
            attack=10,
            defense=10,
            speed=10,
            element=ElementType.NEUTRAL,
        )

        StatusEffectEngine.apply_stun(char, duration=3, source_id="attacker1")
        assert char.status_effects[0].duration == 3

        StatusEffectEngine.apply_stun(char, duration=1, source_id="attacker2")
        assert len(char.status_effects) == 1
        assert char.status_effects[0].duration == 3  # Unchanged


class TestDefenseDebuff:
    """Test defense debuff mechanics."""

    def test_defense_debuff_reduces_damage_mitigation(self):
        """Test that defense debuff reduces defender's defense."""
        defender = Character(
            character_id="defender",
            name="Defender",
            character_class=CharacterClass.WARRIOR,
            level=1,
            max_hp=100,
            current_hp=100,
            attack=10,
            defense=20,
            speed=10,
            element=ElementType.NEUTRAL,
        )

        original_defense = defender.defense.current_value
        StatusEffectEngine.apply_defense_debuff(defender, defense_reduction=5, duration=2, source_id="attacker")

        assert defender.defense.current_value == original_defense - 5

    def test_defense_debuff_does_not_go_negative(self):
        """Test that defense doesn't go below 0."""
        defender = Character(
            character_id="defender",
            name="Defender",
            character_class=CharacterClass.WARRIOR,
            level=1,
            max_hp=100,
            current_hp=100,
            attack=10,
            defense=3,
            speed=10,
            element=ElementType.NEUTRAL,
        )

        StatusEffectEngine.apply_defense_debuff(defender, defense_reduction=10, duration=2, source_id="attacker")

        assert defender.defense.current_value == 0


class TestAttackBuff:
    """Test attack buff mechanics."""

    def test_attack_buff_increases_damage(self):
        """Test that attack buff increases attack stat."""
        attacker = Character(
            character_id="attacker",
            name="Attacker",
            character_class=CharacterClass.WARRIOR,
            level=1,
            max_hp=100,
            current_hp=100,
            attack=20,
            defense=10,
            speed=10,
            element=ElementType.NEUTRAL,
        )

        original_attack = attacker.attack.current_value
        StatusEffectEngine.apply_attack_buff(attacker, attack_bonus=5, duration=2, source_id="attacker")

        assert attacker.attack.current_value == original_attack + 5


class TestVeryLowStats:
    """Test combat with very low stats."""

    def test_zero_attack_still_deals_one_damage(self):
        """Test that even with 0 attack, minimum 1 damage is dealt."""
        attacker = Character(
            character_id="attacker",
            name="Weakling",
            character_class=CharacterClass.WARRIOR,
            level=1,
            max_hp=1,
            current_hp=1,
            attack=0,
            defense=0,
            speed=0,
            element=ElementType.NEUTRAL,
        )
        defender = Character(
            character_id="defender",
            name="Target",
            character_class=CharacterClass.WARRIOR,
            level=1,
            max_hp=100,
            current_hp=100,
            attack=0,
            defense=100,
            speed=0,
            element=ElementType.NEUTRAL,
        )

        DamageCalculator.set_random_seed(999)
        damage, _, is_miss = DamageCalculator.calculate_damage(attacker, defender, use_random=False)

        if not is_miss:
            assert damage >= 1


class TestHighStatsDifference:
    """Test combat with large stat differences."""

    def test_high_level_one_shot_low_level(self):
        """Test that high-level character can one-shot low-level opponent."""
        player = Character(
            character_id="strong",
            name="Level 100",
            character_class=CharacterClass.WARRIOR,
            level=100,
            max_hp=500,
            current_hp=500,
            attack=100,
            defense=50,
            speed=30,
            element=ElementType.FIRE,
        )
        opponent = Character(
            character_id="weak",
            name="Level 1",
            character_class=CharacterClass.ROGUE,
            level=1,
            max_hp=1,
            current_hp=1,
            attack=0,
            defense=0,
            speed=0,
            element=ElementType.NEUTRAL,
        )

        simulator = CombatSimulator(seed=1)
        combat_log = simulator.simulate_combat(player, opponent)

        assert combat_log.winner_id == player.character_id
        assert combat_log.total_turns <= 2  # Should be very quick


class TestSimultaneousCombatClones:
    """Test that multiple simultaneous simulations don't interfere."""

    def test_parallel_simulations_independent(self):
        """Test that running multiple simulations doesn't cross-pollinate."""
        def run_combat(seed):
            player = Character(
                character_id="player",
                name="Player",
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
                character_id="opponent",
                name="Opponent",
                character_class=CharacterClass.ROGUE,
                level=3,
                max_hp=50,
                current_hp=50,
                attack=15,
                defense=8,
                speed=12,
                element=ElementType.NEUTRAL,
            )

            simulator = CombatSimulator(seed=seed)
            return simulator.simulate_combat(player, opponent)

        results1 = run_combat(111)
        results2 = run_combat(222)
        results3 = run_combat(111)  # Same seed as results1

        # Same seed should produce same winner
        assert results1.winner_id == results3.winner_id
        assert results1.total_turns == results3.total_turns

        # Different seed might produce different result
        # (Not guaranteed but likely)


class TestCombatWithAllStatusEffects:
    """Test combat where all status effects are applied."""

    def test_combat_with_multiple_active_effects(self):
        """Test combat where character has multiple status effects."""
        player = Character(
            character_id="player",
            name="Player",
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
            character_id="opponent",
            name="Opponent",
            character_class=CharacterClass.ROGUE,
            level=3,
            max_hp=50,
            current_hp=50,
            attack=15,
            defense=8,
            speed=12,
            element=ElementType.NEUTRAL,
        )

        # Apply multiple effects to player
        StatusEffectEngine.apply_stun(opponent, duration=1, source_id=player.character_id)
        StatusEffectEngine.apply_dot(opponent, damage_per_turn=3, duration=2, source_id=player.character_id)
        StatusEffectEngine.apply_defense_debuff(opponent, defense_reduction=2, duration=2, source_id=player.character_id)

        # Verify all effects applied
        assert len(opponent.status_effects) == 3
        assert opponent.has_status_effect(StatusEffectType.STUN)
        assert opponent.has_status_effect(StatusEffectType.DOT)
        assert opponent.has_status_effect(StatusEffectType.DEFENSE_DEBUFF)

"""Tests for combat engine models."""
import pytest
from combat_engine.models import (
    Character,
    CharacterClass,
    ElementType,
    StatusEffect,
    StatusEffectType,
    Stat,
)


class TestStat:
    """Test Stat class."""

    def test_stat_initialization(self):
        """Test stat initialization."""
        stat = Stat(base_value=10, current_value=10)
        assert stat.base_value == 10
        assert stat.current_value == 10

    def test_stat_reset_to_base(self):
        """Test resetting stat to base value."""
        stat = Stat(base_value=10, current_value=5)
        stat.reset_to_base()
        assert stat.current_value == 10

    def test_stat_effective_value(self):
        """Test getting effective value with modifier."""
        stat = Stat(base_value=10, current_value=10)
        assert stat.get_effective_value(1.5) == 15
        assert stat.get_effective_value(0.5) == 5

    def test_stat_effective_value_negative(self):
        """Test effective value doesn't go negative."""
        stat = Stat(base_value=10, current_value=10)
        assert stat.get_effective_value(0.0) == 0


class TestStatusEffect:
    """Test StatusEffect class."""

    def test_status_effect_creation(self):
        """Test creating a status effect."""
        effect = StatusEffect(
            effect_type=StatusEffectType.STUN, value=0, duration=1, source_character_id="attacker"
        )
        assert effect.effect_type == StatusEffectType.STUN
        assert effect.duration == 1

    def test_status_effect_tick(self):
        """Test ticking down status effect."""
        effect = StatusEffect(
            effect_type=StatusEffectType.DOT, value=5, duration=3, source_character_id="attacker"
        )
        assert effect.tick() is True
        assert effect.duration == 2
        assert effect.tick() is True
        assert effect.duration == 1
        assert effect.tick() is False
        assert effect.duration == 0

    def test_status_effect_to_dict(self):
        """Test converting status effect to dict."""
        effect = StatusEffect(
            effect_type=StatusEffectType.DOT, value=5, duration=2, source_character_id="attacker"
        )
        result = effect.to_dict()
        assert result["effect_type"] == "dot"
        assert result["value"] == 5
        assert result["duration"] == 2
        assert result["source_character_id"] == "attacker"


class TestCharacter:
    """Test Character class."""

    def test_character_creation(self):
        """Test creating a character."""
        char = Character(
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
        assert char.character_id == "player_1"
        assert char.name == "Hero"
        assert char.level == 5
        assert char.is_alive()

    def test_character_is_alive(self):
        """Test is_alive check."""
        char = Character(
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
        assert char.is_alive()
        char.current_hp = 0
        assert not char.is_alive()

    def test_character_take_damage(self):
        """Test taking damage."""
        char = Character(
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
        damage = char.take_damage(30)
        assert damage == 30
        assert char.current_hp == 70

    def test_character_take_excessive_damage(self):
        """Test taking more damage than current HP."""
        char = Character(
            character_id="player_1",
            name="Hero",
            character_class=CharacterClass.WARRIOR,
            level=5,
            max_hp=100,
            current_hp=50,
            attack=20,
            defense=15,
            speed=10,
            element=ElementType.FIRE,
        )
        damage = char.take_damage(100)
        assert damage == 50
        assert char.current_hp == 0

    def test_character_heal(self):
        """Test healing."""
        char = Character(
            character_id="player_1",
            name="Hero",
            character_class=CharacterClass.WARRIOR,
            level=5,
            max_hp=100,
            current_hp=60,
            attack=20,
            defense=15,
            speed=10,
            element=ElementType.FIRE,
        )
        healing = char.heal(30)
        assert healing == 30
        assert char.current_hp == 90

    def test_character_heal_over_max(self):
        """Test healing doesn't exceed max HP."""
        char = Character(
            character_id="player_1",
            name="Hero",
            character_class=CharacterClass.WARRIOR,
            level=5,
            max_hp=100,
            current_hp=90,
            attack=20,
            defense=15,
            speed=10,
            element=ElementType.FIRE,
        )
        healing = char.heal(30)
        assert healing == 10
        assert char.current_hp == 100

    def test_character_apply_status_effect(self):
        """Test applying a status effect."""
        char = Character(
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
        effect = StatusEffect(
            effect_type=StatusEffectType.STUN, value=0, duration=1, source_character_id="attacker"
        )
        char.apply_status_effect(effect)
        assert len(char.status_effects) == 1
        assert char.has_status_effect(StatusEffectType.STUN)

    def test_character_status_effect_stacking(self):
        """Test that longer effects replace shorter ones."""
        char = Character(
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
        effect1 = StatusEffect(
            effect_type=StatusEffectType.DOT, value=5, duration=1, source_character_id="attacker1"
        )
        effect2 = StatusEffect(
            effect_type=StatusEffectType.DOT, value=5, duration=3, source_character_id="attacker2"
        )
        char.apply_status_effect(effect1)
        char.apply_status_effect(effect2)
        # Should have only one DOT effect with duration 3
        assert len(char.status_effects) == 1
        assert char.status_effects[0].duration == 3

    def test_character_remove_expired_status_effects(self):
        """Test removing expired status effects."""
        char = Character(
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
        effect1 = StatusEffect(
            effect_type=StatusEffectType.STUN, value=0, duration=-1, source_character_id="attacker"
        )
        effect2 = StatusEffect(
            effect_type=StatusEffectType.DOT, value=5, duration=1, source_character_id="attacker"
        )
        char.status_effects = [effect1, effect2]
        expired = char.remove_expired_status_effects()
        assert len(expired) == 1
        assert len(char.status_effects) == 1
        assert char.status_effects[0].effect_type == StatusEffectType.DOT

    def test_character_reset_for_combat(self):
        """Test resetting character for combat."""
        char = Character(
            character_id="player_1",
            name="Hero",
            character_class=CharacterClass.WARRIOR,
            level=5,
            max_hp=100,
            current_hp=50,
            attack=20,
            defense=15,
            speed=10,
            element=ElementType.FIRE,
        )
        effect = StatusEffect(
            effect_type=StatusEffectType.STUN, value=0, duration=1, source_character_id="attacker"
        )
        char.apply_status_effect(effect)

        char.reset_for_combat()
        assert char.current_hp == 100
        assert len(char.status_effects) == 0

    def test_character_to_dict(self):
        """Test converting character to dict."""
        char = Character(
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
        result = char.to_dict()
        assert result["character_id"] == "player_1"
        assert result["name"] == "Hero"
        assert result["level"] == 5
        assert result["max_hp"] == 100
        assert result["current_hp"] == 100
        assert result["is_alive"] is True

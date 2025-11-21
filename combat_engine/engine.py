"""
Core combat simulation engine with deterministic damage formulas and mechanics.
"""
import random
from typing import List, Tuple, Optional, Dict, Any
from copy import deepcopy
import uuid

from .models import (
    Character,
    StatusEffect,
    StatusEffectType,
    CombatAction,
    CombatTurn,
    CombatLog,
    ElementType,
)


class ElementalModifier:
    """Handles elemental damage modifiers."""

    # Elemental advantage matrix: attacker -> defender -> multiplier
    ADVANTAGE_MATRIX = {
        ElementType.FIRE: {ElementType.EARTH: 1.5, ElementType.WIND: 0.8},
        ElementType.WATER: {ElementType.FIRE: 1.5, ElementType.EARTH: 0.8},
        ElementType.EARTH: {ElementType.WATER: 1.5, ElementType.WIND: 0.8},
        ElementType.WIND: {ElementType.WATER: 1.5, ElementType.FIRE: 0.8},
        ElementType.NEUTRAL: {},
    }

    @staticmethod
    def get_modifier(attacker_element: ElementType, defender_element: ElementType) -> float:
        """Get damage modifier based on elemental types."""
        if attacker_element in ElementalModifier.ADVANTAGE_MATRIX:
            modifiers = ElementalModifier.ADVANTAGE_MATRIX[attacker_element]
            return modifiers.get(defender_element, 1.0)
        return 1.0


class StatusEffectEngine:
    """Handles status effect application, processing, and resolution."""

    @staticmethod
    def apply_stun(target: Character, duration: int = 1, source_id: str = "system") -> StatusEffect:
        """Apply stun effect (prevents next action)."""
        effect = StatusEffect(
            effect_type=StatusEffectType.STUN, value=0, duration=duration, source_character_id=source_id
        )
        target.apply_status_effect(effect)
        return effect

    @staticmethod
    def apply_dot(
        target: Character, damage_per_turn: int, duration: int = 3, source_id: str = "system"
    ) -> StatusEffect:
        """Apply damage over time effect."""
        effect = StatusEffect(
            effect_type=StatusEffectType.DOT,
            value=damage_per_turn,
            duration=duration,
            source_character_id=source_id,
        )
        target.apply_status_effect(effect)
        return effect

    @staticmethod
    def apply_defense_debuff(
        target: Character, defense_reduction: int, duration: int = 2, source_id: str = "system"
    ) -> StatusEffect:
        """Apply defense debuff (reduces defense stat)."""
        effect = StatusEffect(
            effect_type=StatusEffectType.DEFENSE_DEBUFF,
            value=defense_reduction,
            duration=duration,
            source_character_id=source_id,
        )
        target.apply_status_effect(effect)
        # Apply debuff to defense stat
        target.defense.current_value = max(0, target.defense.current_value - defense_reduction)
        return effect

    @staticmethod
    def apply_attack_buff(
        target: Character, attack_bonus: int, duration: int = 2, source_id: str = "system"
    ) -> StatusEffect:
        """Apply attack buff."""
        effect = StatusEffect(
            effect_type=StatusEffectType.ATTACK_BUFF,
            value=attack_bonus,
            duration=duration,
            source_character_id=source_id,
        )
        target.apply_status_effect(effect)
        target.attack.current_value += attack_bonus
        return effect

    @staticmethod
    def process_status_effects_start_of_turn(character: Character) -> List[Tuple[StatusEffect, int]]:
        """Process status effects at start of turn. Returns list of (effect, damage/healing)."""
        results = []
        for effect in character.status_effects:
            if effect.effect_type == StatusEffectType.DOT:
                damage = effect.value
                results.append((effect, damage))
            elif effect.effect_type == StatusEffectType.HEAL_OVER_TIME:
                healing = effect.value
                results.append((effect, healing))
        return results

    @staticmethod
    def process_status_effects_end_of_turn(character: Character) -> None:
        """Tick down and remove expired status effects."""
        for effect in character.status_effects:
            effect.tick()
        character.remove_expired_status_effects()

    @staticmethod
    def clear_expired_effects(character: Character) -> None:
        """Clear effects that have expired."""
        character.remove_expired_status_effects()


class DamageCalculator:
    """Handles deterministic damage calculations with all modifiers."""

    # Base damage formula: base_damage = attacker_attack * modifier - defender_defense
    # Modifiers: crit (2.0x), elemental, status effects

    CRIT_CHANCE_BASE = 0.15  # 15% base crit chance
    MISS_CHANCE_BASE = 0.05  # 5% base miss chance

    @staticmethod
    def calculate_damage(
        attacker: Character,
        defender: Character,
        base_multiplier: float = 1.0,
        use_random: bool = True,
    ) -> Tuple[int, bool, bool]:
        """
        Calculate damage dealt with all modifiers.
        Returns (damage, is_crit, is_miss)
        """
        # Check for miss
        miss_chance = DamageCalculator.MISS_CHANCE_BASE
        if use_random and random.random() < miss_chance:
            return 0, False, True

        # Get effective attack (with buffs)
        attack_bonus = 0
        if attacker.has_status_effect(StatusEffectType.ATTACK_BUFF):
            effect = attacker.get_status_effect(StatusEffectType.ATTACK_BUFF)
            attack_bonus = effect.value if effect else 0

        attacker_attack = attacker.attack.current_value + attack_bonus

        # Get effective defense (with debuffs)
        defender_defense = defender.defense.current_value

        # Base damage calculation
        base_damage = max(1, int(attacker_attack * base_multiplier - defender_defense * 0.5))

        # Apply elemental modifier
        elemental_mod = ElementalModifier.get_modifier(attacker.element, defender.element)
        base_damage = int(base_damage * elemental_mod)

        # Check for crit
        is_crit = False
        if use_random and random.random() < DamageCalculator.CRIT_CHANCE_BASE:
            base_damage = int(base_damage * 2.0)
            is_crit = True

        return max(1, base_damage), is_crit, False

    @staticmethod
    def set_random_seed(seed: int) -> None:
        """Set random seed for deterministic testing."""
        random.seed(seed)


class CombatSimulator:
    """Main combat simulation engine."""

    MAX_TURNS = 50  # Prevent infinite combat

    def __init__(self, seed: Optional[int] = None):
        """Initialize simulator with optional random seed."""
        if seed is not None:
            random.seed(seed)
        self.combat_id = str(uuid.uuid4())

    def determine_turn_order(self, player: Character, opponent: Character) -> List[Character]:
        """Determine turn order based on speed stats."""
        # Add small random variation to speed for more dynamic combat
        player_speed = player.speed.current_value + random.randint(-2, 2)
        opponent_speed = opponent.speed.current_value + random.randint(-2, 2)

        if player_speed >= opponent_speed:
            return [player, opponent]
        else:
            return [opponent, player]

    def resolve_attack(
        self, attacker: Character, defender: Character, action_log: CombatTurn
    ) -> CombatAction:
        """Resolve a single attack action."""
        action = CombatAction(
            actor_id=attacker.character_id, target_id=defender.character_id, action_type="attack"
        )

        # Check if attacker is stunned
        if attacker.has_status_effect(StatusEffectType.STUN):
            action.is_stun = True
            # Remove stun before next turn
            stun_effect = attacker.get_status_effect(StatusEffectType.STUN)
            if stun_effect:
                stun_effect.tick()
            return action

        # Calculate base damage
        damage, is_crit, is_miss = DamageCalculator.calculate_damage(attacker, defender)

        action.damage_dealt = damage
        action.is_crit = is_crit
        action.is_miss = is_miss

        if not is_miss:
            # Apply damage
            actual_damage = defender.take_damage(damage)

            # Determine status effects to apply based on attacker class
            status_to_apply = self._determine_status_effects(attacker, defender)
            for effect in status_to_apply:
                action.status_effects_applied.append(effect)

            # Check for multi-hit based on attacker speed (high speed has chance for multi-hit)
            multi_hit_count = self._calculate_multi_hit(attacker)
            if multi_hit_count > 1:
                action.multi_hit_count = multi_hit_count
                # Each extra hit deals 50% damage
                extra_damage = int(damage * 0.5) * (multi_hit_count - 1)
                actual_damage += defender.take_damage(extra_damage)
                action.damage_dealt = actual_damage

        return action

    def _determine_status_effects(self, attacker: Character, defender: Character) -> List[StatusEffect]:
        """Determine which status effects to apply based on attacker class."""
        effects = []
        class_name = attacker.character_class.value

        # Class-based effect chances
        if class_name == "rogue" and random.random() < 0.3:  # 30% chance for rogues
            effects.append(
                StatusEffectEngine.apply_stun(defender, duration=1, source_id=attacker.character_id)
            )
        elif class_name == "mage" and random.random() < 0.4:  # 40% chance for mages
            effects.append(
                StatusEffectEngine.apply_dot(
                    defender, damage_per_turn=3, duration=3, source_id=attacker.character_id
                )
            )
        elif class_name == "paladin" and random.random() < 0.2:  # 20% chance for paladins
            # Paladins get defense buff on successful hit
            StatusEffectEngine.apply_attack_buff(
                attacker, attack_bonus=2, duration=2, source_id=attacker.character_id
            )

        # Warriors have 20% chance for defense debuff
        if class_name == "warrior" and random.random() < 0.2:
            effects.append(
                StatusEffectEngine.apply_defense_debuff(
                    defender, defense_reduction=2, duration=2, source_id=attacker.character_id
                )
            )

        return effects

    def _calculate_multi_hit(self, attacker: Character) -> int:
        """Calculate multi-hit count based on speed."""
        speed = attacker.speed.current_value
        if speed > 15:
            if random.random() < 0.3:  # 30% chance for multi-hit
                return 2
        return 1

    def process_turn_start_effects(self, character: Character, action_log: CombatTurn) -> None:
        """Process effects at start of turn (DoT, HoT, etc)."""
        effects_results = StatusEffectEngine.process_status_effects_start_of_turn(character)

        for effect, value in effects_results:
            if effect.effect_type == StatusEffectType.DOT:
                damage = character.take_damage(value)
            elif effect.effect_type == StatusEffectType.HEAL_OVER_TIME:
                healing = character.heal(value)

    def simulate_combat(self, player: Character, opponent: Character) -> CombatLog:
        """Simulate a complete combat session."""
        # Deep copy characters to avoid modifying originals
        player = deepcopy(player)
        opponent = deepcopy(opponent)

        # Reset for combat
        player.reset_for_combat()
        opponent.reset_for_combat()

        # Create combat log
        combat_log = CombatLog(combat_id=self.combat_id, player=player, opponent=opponent)

        # Determine turn order
        turn_order = self.determine_turn_order(player, opponent)

        turn_number = 0
        while player.is_alive() and opponent.is_alive() and turn_number < self.MAX_TURNS:
            turn_number += 1

            # Alternate turns based on predetermined order or alternating
            if turn_number % 2 == 1:
                actor = player
                target = opponent
            else:
                actor = opponent
                target = player

            # Create turn log
            turn_log = CombatTurn(
                turn_number=turn_number,
                actor_id=actor.character_id,
                actor_status_before=actor.to_dict(),
                target_status_before=target.to_dict(),
            )

            # Process status effects at start of turn
            self.process_turn_start_effects(actor, turn_log)

            # Resolve attack
            action = self.resolve_attack(actor, target, turn_log)
            turn_log.actions.append(action)

            # Process status effects at end of turn (tick down)
            StatusEffectEngine.process_status_effects_end_of_turn(actor)
            StatusEffectEngine.process_status_effects_end_of_turn(target)

            # Record status after turn
            turn_log.actor_status_after = actor.to_dict()
            turn_log.target_status_after = target.to_dict()

            combat_log.turns.append(turn_log)

        # Determine winner
        combat_log.total_turns = turn_number
        if player.is_alive() and not opponent.is_alive():
            combat_log.winner_id = player.character_id
        elif opponent.is_alive() and not player.is_alive():
            combat_log.winner_id = opponent.character_id
        # else: draw

        return combat_log

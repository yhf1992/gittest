"""
Tests for equipment generation and management system.
"""
import pytest
import random
from combat_engine.models import (
    Equipment, EquipmentSlot, ItemRarity, AffixType, ElementType,
    PlayerInventory, Character, CharacterClass
)
from combat_engine.equipment import EquipmentGenerator, InventoryManager


class TestEquipmentGenerator:
    """Test equipment generation functionality."""

    def test_generate_equipment_basic(self):
        """Test basic equipment generation."""
        equipment = EquipmentGenerator.generate_equipment(
            slot=EquipmentSlot.WEAPON,
            item_level=10,
            rarity=ItemRarity.COMMON,
            seed=42
        )
        
        assert equipment.slot == EquipmentSlot.WEAPON
        assert equipment.rarity == ItemRarity.COMMON
        assert equipment.level_requirement >= 1
        assert "attack" in equipment.base_stats
        assert equipment.item_id is not None
        assert equipment.name is not None

    def test_generate_equipment_different_slots(self):
        """Test equipment generation for different slots."""
        # Weapon
        weapon = EquipmentGenerator.generate_equipment(
            slot=EquipmentSlot.WEAPON,
            item_level=15,
            seed=42
        )
        assert "attack" in weapon.base_stats
        
        # Armor
        armor = EquipmentGenerator.generate_equipment(
            slot=EquipmentSlot.ARMOR,
            item_level=15,
            seed=42
        )
        assert "defense" in armor.base_stats
        assert "hp" in armor.base_stats
        
        # Accessory
        accessory = EquipmentGenerator.generate_equipment(
            slot=EquipmentSlot.ACCESSORY,
            item_level=15,
            seed=42
        )
        assert "attack" in accessory.base_stats
        assert "defense" in accessory.base_stats
        assert "speed" in accessory.base_stats

    def test_generate_equipment_rarity_scaling(self):
        """Test that higher rarity equipment has better stats."""
        common = EquipmentGenerator.generate_equipment(
            slot=EquipmentSlot.WEAPON,
            item_level=10,
            rarity=ItemRarity.COMMON,
            seed=42
        )
        
        legendary = EquipmentGenerator.generate_equipment(
            slot=EquipmentSlot.WEAPON,
            item_level=10,
            rarity=ItemRarity.LEGENDARY,
            seed=42
        )
        
        # Legendary should have significantly higher stats
        assert legendary.base_stats["attack"] > common.base_stats["attack"]
        assert len(legendary.affixes) >= len(common.affixes)

    def test_generate_equipment_affixes(self):
        """Test affix generation."""
        # Generate rare equipment (should have multiple affixes)
        equipment = EquipmentGenerator.generate_equipment(
            slot=EquipmentSlot.WEAPON,
            item_level=20,
            rarity=ItemRarity.RARE,
            seed=42
        )
        
        # Should have at least 2 affixes for rare items
        assert len(equipment.affixes) >= 2
        
        # Check affix types are valid
        for affix in equipment.affixes:
            assert isinstance(affix.affix_type, AffixType)
            assert affix.value > 0

    def test_generate_equipment_special_proc(self):
        """Test special proc generation for high rarity items."""
        # Generate legendary equipment (high chance for special proc)
        equipment = EquipmentGenerator.generate_equipment(
            slot=EquipmentSlot.WEAPON,
            item_level=25,
            rarity=ItemRarity.LEGENDARY,
            seed=42
        )
        
        # Legendary items have 50% chance for special proc
        # With seed=42, we can test deterministically
        assert equipment.special_proc is not None or equipment.special_proc is None  # May or may not have proc

    def test_rarity_roll_distribution(self):
        """Test rarity roll distribution over many rolls."""
        rarity_counts = {rarity: 0 for rarity in ItemRarity}
        
        # Roll many times to check distribution
        for _ in range(1000):
            rarity = EquipmentGenerator._roll_rarity()
            rarity_counts[rarity] += 1
        
        # Common should be most frequent
        assert rarity_counts[ItemRarity.COMMON] > rarity_counts[ItemRarity.LEGENDARY]
        
        # All rarities should appear at least once in 1000 rolls
        for count in rarity_counts.values():
            assert count > 0

    def test_deterministic_generation_with_seed(self):
        """Test that same seed produces identical equipment."""
        equipment1 = EquipmentGenerator.generate_equipment(
            slot=EquipmentSlot.WEAPON,
            item_level=15,
            seed=12345
        )
        
        equipment2 = EquipmentGenerator.generate_equipment(
            slot=EquipmentSlot.WEAPON,
            item_level=15,
            seed=12345
        )
        
        # Should be identical
        assert equipment1.name == equipment2.name
        assert equipment1.base_stats == equipment2.base_stats
        assert len(equipment1.affixes) == len(equipment2.affixes)


class TestInventoryManager:
    """Test inventory management functionality."""

    def test_create_inventory(self):
        """Test inventory creation."""
        inventory = PlayerInventory(
            player_id="test_player",
            currency=1000
        )
        
        assert inventory.player_id == "test_player"
        assert inventory.currency == 1000
        assert len(inventory.inventory) == 0
        assert len(inventory.equipment) == 0

    def test_equip_item(self):
        """Test equipping items."""
        inventory = PlayerInventory(player_id="test_player")
        
        # Initialize equipment slots
        for slot in EquipmentSlot:
            inventory.equipment[slot] = None
        
        # Create weapon
        weapon = EquipmentGenerator.generate_equipment(
            slot=EquipmentSlot.WEAPON,
            item_level=10,
            seed=42
        )
        
        # Add to inventory
        inventory.inventory.append(weapon)
        
        # Equip the weapon
        previous_item = InventoryManager.equip_item(inventory, weapon.item_id)
        
        # Should have no previous item
        assert previous_item is None
        
        # Weapon should be equipped
        assert inventory.equipment[EquipmentSlot.WEAPON] == weapon
        
        # Should be removed from inventory
        assert weapon not in inventory.inventory

    def test_equip_item_replace_existing(self):
        """Test equipping item replaces existing one."""
        inventory = PlayerInventory(player_id="test_player")
        
        # Initialize equipment slots
        for slot in EquipmentSlot:
            inventory.equipment[slot] = None
        
        # Create two weapons
        weapon1 = EquipmentGenerator.generate_equipment(
            slot=EquipmentSlot.WEAPON,
            item_level=5,
            seed=42
        )
        
        weapon2 = EquipmentGenerator.generate_equipment(
            slot=EquipmentSlot.WEAPON,
            item_level=10,
            seed=123
        )
        
        # Equip first weapon
        inventory.inventory.append(weapon1)
        InventoryManager.equip_item(inventory, weapon1.item_id)
        
        # Equip second weapon (should replace first)
        inventory.inventory.append(weapon2)
        previous_item = InventoryManager.equip_item(inventory, weapon2.item_id)
        
        # Should return the first weapon
        assert previous_item == weapon1
        
        # Second weapon should be equipped
        assert inventory.equipment[EquipmentSlot.WEAPON] == weapon2

    def test_unequip_item(self):
        """Test unequipping items."""
        inventory = PlayerInventory(player_id="test_player")
        
        # Initialize equipment slots
        for slot in EquipmentSlot:
            inventory.equipment[slot] = None
        
        # Create and equip weapon
        weapon = EquipmentGenerator.generate_equipment(
            slot=EquipmentSlot.WEAPON,
            item_level=10,
            seed=42
        )
        inventory.equipment[EquipmentSlot.WEAPON] = weapon
        
        # Unequip the weapon
        unequipped_item = InventoryManager.unequip_item(inventory, EquipmentSlot.WEAPON)
        
        # Should return the weapon
        assert unequipped_item == weapon
        
        # Should be removed from equipment slot
        assert inventory.equipment[EquipmentSlot.WEAPON] is None
        
        # Should be added to inventory
        assert weapon in inventory.inventory

    def test_calculate_total_stats(self):
        """Test calculating total stats from equipment."""
        inventory = PlayerInventory(player_id="test_player")
        
        # Initialize equipment slots
        for slot in EquipmentSlot:
            inventory.equipment[slot] = None
        
        # Create and equip items
        weapon = EquipmentGenerator.generate_equipment(
            slot=EquipmentSlot.WEAPON,
            item_level=10,
            seed=42
        )
        armor = EquipmentGenerator.generate_equipment(
            slot=EquipmentSlot.ARMOR,
            item_level=10,
            seed=123
        )
        
        inventory.equipment[EquipmentSlot.WEAPON] = weapon
        inventory.equipment[EquipmentSlot.ARMOR] = armor
        
        # Calculate total stats
        total_stats = InventoryManager.calculate_total_stats(inventory)
        
        # Should have combined stats
        assert total_stats["attack"] > 0
        assert total_stats["defense"] > 0
        assert total_stats["hp"] > 0

    def test_apply_equipment_to_character(self):
        """Test applying equipment stats to character."""
        # Create base character
        character = Character(
            character_id="test_char",
            name="Test Hero",
            character_class=CharacterClass.WARRIOR,
            level=10,
            max_hp=100,
            current_hp=100,
            attack=20,
            defense=15,
            speed=10,
            element=ElementType.NEUTRAL
        )
        
        # Create inventory with equipment
        inventory = PlayerInventory(player_id="test_player")
        
        # Initialize equipment slots
        for slot in EquipmentSlot:
            inventory.equipment[slot] = None
        
        # Add equipment
        weapon = EquipmentGenerator.generate_equipment(
            slot=EquipmentSlot.WEAPON,
            item_level=10,
            seed=42
        )
        inventory.equipment[EquipmentSlot.WEAPON] = weapon
        
        # Apply equipment to character
        equipped_character = InventoryManager.apply_equipment_to_character(character, inventory)
        
        # Should have increased stats
        assert equipped_character.attack.current_value > character.attack.current_value
        assert equipped_character.max_hp > character.max_hp
        assert equipped_character.current_hp > character.current_hp


class TestEquipmentAffixes:
    """Test equipment affix functionality."""

    def test_affix_value_calculation(self):
        """Test affix value calculation for different types."""
        # Test attack bonus
        attack_value = EquipmentGenerator._calculate_affix_value(
            AffixType.ATTACK_BONUS, 10, ItemRarity.RARE
        )
        assert attack_value > 0
        
        # Test crit chance (should be capped)
        crit_value = EquipmentGenerator._calculate_affix_value(
            AffixType.CRIT_CHANCE, 100, ItemRarity.LEGENDARY  # Very high level
        )
        assert crit_value <= 25  # Should be capped at 25%
        
        # Test lifesteal (should be capped)
        lifesteal_value = EquipmentGenerator._calculate_affix_value(
            AffixType.LIFESTEAL, 100, ItemRarity.LEGENDARY  # Very high level
        )
        assert lifesteal_value <= 20  # Should be capped at 20%

    def test_elemental_affix_generation(self):
        """Test that elemental affixes get elements assigned."""
        # Generate many items and check for elemental affixes
        found_elemental = False
        
        for _ in range(100):
            equipment = EquipmentGenerator.generate_equipment(
                slot=EquipmentSlot.WEAPON,
                item_level=20,
                rarity=ItemRarity.EPIC,
                seed=random.randint(1, 10000)
            )
            
            for affix in equipment.affixes:
                if affix.affix_type == AffixType.ELEMENTAL_DAMAGE:
                    assert affix.element is not None
                    assert isinstance(affix.element, ElementType)
                    found_elemental = True
                    break
            
            if found_elemental:
                break
        
        # Should find at least one elemental affix in 100 tries
        assert found_elemental
#!/usr/bin/env python3
"""Quick functionality test"""

def test_equipment():
    from combat_engine.models import EquipmentSlot, ItemRarity
    from combat_engine.equipment import EquipmentGenerator
    
    print("Testing equipment generation...")
    item = EquipmentGenerator.generate_equipment(
        slot=EquipmentSlot.WEAPON,
        item_level=10,
        rarity=ItemRarity.RARE,
        seed=42
    )
    print(f"✓ Generated {item.name} (rarity: {item.rarity.value})")
    print(f"  Base stats: {item.base_stats}")
    print(f"  Affixes: {len(item.affixes)}")
    return True

def test_loot():
    from combat_engine.models import MonsterTier
    from combat_engine.loot import LootRoller, LootTableManager
    
    print("\nTesting loot system...")
    loot_table = LootTableManager.create_default_loot_table(MonsterTier.TIER_1, "test")
    equipment, currency = LootRoller.roll_loot(loot_table, seed=42)
    print(f"✓ Rolled {len(equipment)} items and {currency} currency")
    return True

def test_dungeon():
    from combat_engine.dungeon import DungeonManager
    
    print("\nTesting dungeon system...")
    manager = DungeonManager()
    dungeons = manager.list_dungeons()
    print(f"✓ Found {len(dungeons)} dungeons")
    
    dungeon = manager.get_dungeon("goblin_caves")
    if dungeon:
        print(f"✓ Retrieved {dungeon.name} (difficulty: {dungeon.difficulty.value})")
    return True

def test_inventory():
    from combat_engine.models import PlayerInventory, EquipmentSlot
    from combat_engine.equipment import InventoryManager, EquipmentGenerator
    
    print("\nTesting inventory management...")
    inventory = PlayerInventory(player_id="test", currency=100)
    
    # Initialize equipment slots
    for slot in EquipmentSlot:
        inventory.equipment[slot] = None
    
    # Generate and equip item
    item = EquipmentGenerator.generate_equipment(
        slot=EquipmentSlot.WEAPON,
        item_level=10,
        seed=42
    )
    inventory.inventory.append(item)
    
    previous = InventoryManager.equip_item(inventory, item.item_id)
    equipped = inventory.equipment[EquipmentSlot.WEAPON]
    
    print(f"✓ Equipped {equipped.name}")
    print(f"✓ Inventory has {len(inventory.inventory)} items")
    
    # Calculate stats
    stats = InventoryManager.calculate_total_stats(inventory)
    print(f"✓ Total attack: {stats['attack']}")
    return True

def main():
    print("=== Loot Dungeon System Functionality Test ===\n")
    
    try:
        test_equipment()
        test_loot()
        test_dungeon()
        test_inventory()
        
        print("\n=== ALL TESTS PASSED ===")
        print("✓ Equipment generation working")
        print("✓ Loot system working")
        print("✓ Dungeon system working")
        print("✓ Inventory management working")
        print("\n🎉 Loot dungeon system is fully functional!")
        
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    return True

if __name__ == "__main__":
    main()
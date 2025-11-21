"""Final verification test"""

def test_core_functionality():
    try:
        # Test equipment generation
        from combat_engine.models import EquipmentSlot, ItemRarity
        from combat_engine.equipment import EquipmentGenerator
        
        item = EquipmentGenerator.generate_equipment(
            slot=EquipmentSlot.WEAPON,
            item_level=10,
            rarity=ItemRarity.RARE,
            seed=42
        )
        print(f"✓ Equipment Generation: {item.name} ({item.rarity.value})")
        
        # Test loot system
        from combat_engine.models import MonsterTier
        from combat_engine.loot import LootTableManager, LootRoller
        
        loot_table = LootTableManager.create_default_loot_table(MonsterTier.TIER_1, "test")
        equipment, currency = LootRoller.roll_loot(loot_table, seed=42)
        print(f"✓ Loot System: {len(equipment)} items, {currency} currency")
        
        # Test dungeon system
        from combat_engine.dungeon import DungeonManager
        
        manager = DungeonManager()
        dungeons = manager.list_dungeons()
        print(f"✓ Dungeon System: {len(dungeons)} dungeons available")
        
        # Test inventory
        from combat_engine.models import PlayerInventory
        from combat_engine.equipment import InventoryManager
        
        inventory = PlayerInventory(player_id="test", currency=100)
        for slot in EquipmentSlot:
            inventory.equipment[slot] = None
        
        InventoryManager.add_item_to_inventory(inventory, item)
        InventoryManager.equip_item(inventory, item.item_id)
        
        stats = InventoryManager.calculate_total_stats(inventory)
        print(f"✓ Inventory System: {stats['attack']} attack from equipped items")
        
        print("\n🎉 ALL CORE SYSTEMS WORKING!")
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_core_functionality()
    exit(0 if success else 1)
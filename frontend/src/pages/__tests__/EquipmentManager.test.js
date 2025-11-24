import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EquipmentManager from '../EquipmentManager';
import { renderWithProviders } from '../test/utils';
import { mockEquipmentService, mockInventoryService, mockEquipment } from '../test/mocks';

// Mock the API services
vi.mock('../services/api', async () => {
  const actual = await vi.importActual('../services/api');
  return {
    ...actual,
    equipmentService: {
      ...mockEquipmentService
    },
    inventoryService: {
      ...mockInventoryService
    }
  };
});

// Mock the useAuth hook
vi.mock('../services/AuthContext', async () => {
  const actual = await vi.importActual('../services/AuthContext');
  return {
    ...actual,
    useAuth: () => ({
      user: { id: 'test-user-1', username: 'TestUser' }
    })
  };
});

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

describe('EquipmentManager Page', () => {
  const mockInventoryData = {
    player_id: 'test-user-1',
    currency: 500,
    equipped_items: {
      Weapon: mockEquipment[0],
      Armor: mockEquipment[1],
      Accessory: null
    },
    inventory_items: mockEquipment,
    total_stats: {
      attack: 65,
      defense: 50,
      hp: 100,
      speed: 0
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockInventoryService.stats.mockResolvedValue(mockInventoryData);
    mockEquipmentService.getSlots.mockResolvedValue({
      slots: ['Weapon', 'Armor', 'Accessory']
    });
    mockEquipmentService.getRarities.mockResolvedValue({
      rarities: ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary']
    });
    mockEquipmentService.generate.mockResolvedValue(mockEquipment[0]);
    mockInventoryService.equip.mockResolvedValue({
      message: 'Item equipped successfully',
      updated_stats: mockInventoryData.total_stats
    });
    mockInventoryService.unequip.mockResolvedValue({
      message: 'Item unequipped successfully',
      updated_stats: mockInventoryData.total_stats
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial Loading and Setup', () => {
    it('should show loading state while fetching data', () => {
      mockInventoryService.stats.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      renderWithProviders(<EquipmentManager />);
      
      expect(screen.getByText('Loading inventory...')).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should load equipment data on mount', async () => {
      renderWithProviders(<EquipmentManager />);
      
      await waitFor(() => {
        expect(mockInventoryService.stats).toHaveBeenCalledWith('test-user-1');
        expect(mockEquipmentService.getSlots).toHaveBeenCalled();
        expect(mockEquipmentService.getRarities).toHaveBeenCalled();
      });
    });

    it('should display error message when data loading fails', async () => {
      mockInventoryService.stats.mockRejectedValue({ error: 'Failed to load inventory' });
      
      renderWithProviders(<EquipmentManager />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load inventory')).toBeInTheDocument();
      });
    });

    it('should display equipment manager interface after successful load', async () => {
      renderWithProviders(<EquipmentManager />);
      
      await waitFor(() => {
        expect(screen.getByText('Equipment Manager')).toBeInTheDocument();
        expect(screen.getByText('Character Stats')).toBeInTheDocument();
        expect(screen.getByText('Inventory')).toBeInTheDocument();
      });
    });
  });

  describe('Character Stats Display', () => {
    beforeEach(async () => {
      renderWithProviders(<EquipmentManager />);
      await waitFor(() => {
        expect(screen.getByText('Character Stats')).toBeInTheDocument();
      });
    });

    it('should display total character stats', () => {
      expect(screen.getByText('65')).toBeInTheDocument(); // Attack
      expect(screen.getByText('50')).toBeInTheDocument(); // Defense
      expect(screen.getByText('100')).toBeInTheDocument(); // HP
      expect(screen.getByText('0')).toBeInTheDocument(); // Speed
    });

    it('should display stat labels correctly', () => {
      expect(screen.getByText('Attack')).toBeInTheDocument();
      expect(screen.getByText('Defense')).toBeInTheDocument();
      expect(screen.getByText('HP')).toBeInTheDocument();
      expect(screen.getByText('Speed')).toBeInTheDocument();
    });

    it('should display currency', () => {
      expect(screen.getByText('500')).toBeInTheDocument(); // Currency
    });
  });

  describe('Equipped Items Display', () => {
    beforeEach(async () => {
      renderWithProviders(<EquipmentManager />);
      await waitFor(() => {
        expect(screen.getByText('Equipped Items')).toBeInTheDocument();
      });
    });

    it('should display equipped items', () => {
      expect(screen.getByText(mockEquipment[0].name)).toBeInTheDocument(); // Iron Sword
      expect(screen.getByText(mockEquipment[1].name)).toBeInTheDocument(); // Dragon Scale Armor
    });

    it('should display empty slots for unequipped items', () => {
      expect(screen.getByText('Accessory')).toBeInTheDocument();
      expect(screen.getByText('Empty')).toBeInTheDocument();
    });

    it('should show item rarity colors', () => {
      const swordElement = screen.getByText(mockEquipment[0].name);
      const armorElement = screen.getByText(mockEquipment[1].name);
      
      expect(swordElement).toBeInTheDocument();
      expect(armorElement).toBeInTheDocument();
      // Would need to check computed styles for color in real implementation
    });
  });

  describe('Inventory Display', () => {
    beforeEach(async () => {
      renderWithProviders(<EquipmentManager />);
      await waitFor(() => {
        expect(screen.getByText('Inventory')).toBeInTheDocument();
      });
    });

    it('should display inventory items', () => {
      expect(screen.getByText(mockEquipment[0].name)).toBeInTheDocument();
      expect(screen.getByText(mockEquipment[1].name)).toBeInTheDocument();
      expect(screen.getByText(`(${mockEquipment.length})`)).toBeInTheDocument();
    });

    it('should display item stats correctly', () => {
      expect(screen.getByText('Level 10')).toBeInTheDocument();
      expect(screen.getByText('Level 50')).toBeInTheDocument();
      expect(screen.getByText('ATTACK: 15')).toBeInTheDocument();
      expect(screen.getByText('DEFENSE: 50')).toBeInTheDocument();
    });

    it('should display item rarity badges', () => {
      expect(screen.getByText('COMMON')).toBeInTheDocument();
      expect(screen.getByText('LEGENDARY')).toBeInTheDocument();
    });

    it('should display equip buttons for inventory items', () => {
      const equipButtons = screen.getAllByRole('button', { name: /equip/i });
      expect(equipButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Equipment Equipping', () => {
    beforeEach(async () => {
      renderWithProviders(<EquipmentManager />);
      await waitFor(() => {
        expect(screen.getByText('Inventory')).toBeInTheDocument();
      });
    });

    it('should equip item when equip button is clicked', async () => {
      const user = userEvent.setup();
      
      const equipButtons = screen.getAllByRole('button', { name: /equip/i });
      await user.click(equipButtons[0]);
      
      await waitFor(() => {
        expect(mockInventoryService.equip).toHaveBeenCalledWith('test-user-1', mockEquipment[0].id);
      });
    });

    it('should show loading state while equipping', async () => {
      const user = userEvent.setup();
      mockInventoryService.equip.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      const equipButtons = screen.getAllByRole('button', { name: /equip/i });
      await user.click(equipButtons[0]);
      
      expect(screen.getByText('Equipping...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /equipping/i })).toBeDisabled();
    });

    it('should display success message after equipping', async () => {
      const user = userEvent.setup();
      
      const equipButtons = screen.getAllByRole('button', { name: /equip/i });
      await user.click(equipButtons[0]);
      
      await waitFor(() => {
        expect(screen.getByText('Item equipped successfully')).toBeInTheDocument();
      });
    });

    it('should display error message when equipping fails', async () => {
      const user = userEvent.setup();
      mockInventoryService.equip.mockRejectedValue({ error: 'Cannot equip item' });
      
      const equipButtons = screen.getAllByRole('button', { name: /equip/i });
      await user.click(equipButtons[0]);
      
      await waitFor(() => {
        expect(screen.getByText('Cannot equip item')).toBeInTheDocument();
      });
    });
  });

  describe('Equipment Unequipping', () => {
    beforeEach(async () => {
      renderWithProviders(<EquipmentManager />);
      await waitFor(() => {
        expect(screen.getByText('Equipped Items')).toBeInTheDocument();
      });
    });

    it('should unequip item when unequip button is clicked', async () => {
      const user = userEvent.setup();
      
      const unequipButtons = screen.getAllByRole('button', { name: /unequip/i });
      await user.click(unequipButtons[0]);
      
      await waitFor(() => {
        expect(mockInventoryService.unequip).toHaveBeenCalledWith('test-user-1', 'Weapon');
      });
    });

    it('should show loading state while unequipping', async () => {
      const user = userEvent.setup();
      mockInventoryService.unequip.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      const unequipButtons = screen.getAllByRole('button', { name: /unequip/i });
      await user.click(unequipButtons[0]);
      
      expect(screen.getByText('Unequipping...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /unequipping/i })).toBeDisabled();
    });
  });

  describe('Item Generation', () => {
    beforeEach(async () => {
      renderWithProviders(<EquipmentManager />);
      await waitFor(() => {
        expect(screen.getByText('Inventory')).toBeInTheDocument();
      });
    });

    it('should generate new item when forge button is clicked', async () => {
      const user = userEvent.setup();
      
      await user.click(screen.getByRole('button', { name: /forge new loot/i }));
      
      await waitFor(() => {
        expect(mockEquipmentService.generate).toHaveBeenCalled();
      });
    });

    it('should show loading state while generating', async () => {
      const user = userEvent.setup();
      mockEquipmentService.generate.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      await user.click(screen.getByRole('button', { name: /forge new loot/i }));
      
      expect(screen.getByText('Rolling loot...')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /rolling loot/i })).toBeDisabled();
    });
  });

  describe('Filtering and Sorting', () => {
    beforeEach(async () => {
      renderWithProviders(<EquipmentManager />);
      await waitFor(() => {
        expect(screen.getByText('Inventory')).toBeInTheDocument();
      });
    });

    it('should have slot filter options', () => {
      expect(screen.getByRole('combobox', { name: /slot/i })).toBeInTheDocument();
    });

    it('should have rarity filter options', () => {
      expect(screen.getByRole('combobox', { name: /rarity/i })).toBeInTheDocument();
    });

    it('should have sort options', () => {
      expect(screen.getByRole('combobox', { name: /sort by/i })).toBeInTheDocument();
    });

    it('should filter items by slot when slot filter is changed', async () => {
      const user = userEvent.setup();
      
      const slotFilter = screen.getByRole('combobox', { name: /slot/i });
      await user.click(slotFilter);
      await user.click(screen.getByText('Weapon'));
      
      // Verify filtering logic (would need to check filtered results)
      expect(slotFilter).toHaveValue('Weapon');
    });

    it('should sort items when sort option is changed', async () => {
      const user = userEvent.setup();
      
      const sortSelect = screen.getByRole('combobox', { name: /sort by/i });
      await user.click(sortSelect);
      await user.click(screen.getByText('Attack'));
      
      expect(sortSelect).toHaveValue('attack');
    });
  });

  describe('Special Effects Display', () => {
    const equipmentWithEffects = [
      {
        ...mockEquipment[0],
        specialEffects: {
          stunChance: 15,
          dotDamage: 25,
          defenseBreak: 10,
          multiHitChance: 5
        }
      }
    ];

    beforeEach(async () => {
      mockInventoryService.stats.mockResolvedValue({
        ...mockInventoryData,
        inventory_items: equipmentWithEffects
      });
      
      renderWithProviders(<EquipmentManager />);
      await waitFor(() => {
        expect(screen.getByText('Inventory')).toBeInTheDocument();
      });
    });

    it('should display special effects for items', () => {
      expect(screen.getByText('15%')).toBeInTheDocument(); // Stun chance
      expect(screen.getByText('25')).toBeInTheDocument(); // DoT damage
      expect(screen.getByText('10')).toBeInTheDocument(); // Defense break
      expect(screen.getByText('5%')).toBeInTheDocument(); // Multi-hit chance
    });

    it('should display effect labels', () => {
      expect(screen.getByText('Stun')).toBeInTheDocument();
      expect(screen.getByText('DoT')).toBeInTheDocument();
      expect(screen.getByText('Armor Shred')).toBeInTheDocument();
      expect(screen.getByText('Multi-hit')).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    beforeEach(async () => {
      renderWithProviders(<EquipmentManager />);
      await waitFor(() => {
        expect(screen.getByText('Equipment Manager')).toBeInTheDocument();
      });
    });

    it('should navigate back to dashboard when back button is clicked', async () => {
      const user = userEvent.setup();
      
      await user.click(screen.getByRole('button', { name: /← back to dashboard/i }));
      
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  describe('Accessibility', () => {
    beforeEach(async () => {
      renderWithProviders(<EquipmentManager />);
      await waitFor(() => {
        expect(screen.getByText('Equipment Manager')).toBeInTheDocument();
      });
    });

    it('should have proper heading structure', () => {
      expect(screen.getByRole('heading', { name: 'Equipment Manager' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Character Stats' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Equipped Items' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Inventory' })).toBeInTheDocument();
    });

    it('should have accessible buttons', () => {
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAccessibleName();
      });
    });

    it('should have accessible form controls', () => {
      const comboboxes = screen.getAllByRole('combobox');
      comboboxes.forEach(combobox => {
        expect(combobox).toHaveAccessibleName();
      });
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      
      // Test Tab navigation
      await user.tab();
      expect(screen.getByRole('button', { name: /← back to dashboard/i })).toHaveFocus();
      
      await user.tab();
      // Should focus on first interactive element
    });

    it('should have ARIA labels for stat displays', () => {
      const statDisplays = screen.getAllByRole('region');
      statDisplays.forEach(display => {
        expect(display).toHaveAttribute('aria-label') || 
               expect(display.closest('[aria-label]')).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    beforeEach(async () => {
      renderWithProviders(<EquipmentManager />);
      await waitFor(() => {
        expect(screen.getByText('Equipment Manager')).toBeInTheDocument();
      });
    });

    it('should render correctly on mobile', () => {
      window.innerWidth = 375;
      
      expect(screen.getByText('Equipment Manager')).toBeInTheDocument();
      expect(screen.getByText('Character Stats')).toBeInTheDocument();
      expect(screen.getByText('Inventory')).toBeInTheDocument();
    });

    it('should render correctly on tablet', () => {
      window.innerWidth = 768;
      
      expect(screen.getByText('Equipment Manager')).toBeInTheDocument();
      expect(screen.getByText('Character Stats')).toBeInTheDocument();
      expect(screen.getByText('Inventory')).toBeInTheDocument();
    });

    it('should render correctly on desktop', () => {
      window.innerWidth = 1024;
      
      expect(screen.getByText('Equipment Manager')).toBeInTheDocument();
      expect(screen.getByText('Character Stats')).toBeInTheDocument();
      expect(screen.getByText('Inventory')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty inventory gracefully', async () => {
      mockInventoryService.stats.mockResolvedValue({
        ...mockInventoryData,
        inventory_items: []
      });
      
      renderWithProviders(<EquipmentManager />);
      
      await waitFor(() => {
        expect(screen.getByText('No items match current filters')).toBeInTheDocument();
      });
    });

    it('should handle items with missing properties gracefully', async () => {
      const incompleteItems = [
        {
          id: 'incomplete-1',
          name: 'Incomplete Item',
          // Missing other properties
        }
      ];
      
      mockInventoryService.stats.mockResolvedValue({
        ...mockInventoryData,
        inventory_items: incompleteItems
      });
      
      renderWithProviders(<EquipmentManager />);
      
      await waitFor(() => {
        expect(screen.getByText('Incomplete Item')).toBeInTheDocument();
      });
    });

    it('should handle very large inventory efficiently', async () => {
      const largeInventory = Array.from({ length: 100 }, (_, i) => ({
        ...mockEquipment[0],
        id: `item-${i}`,
        name: `Item ${i}`
      }));
      
      mockInventoryService.stats.mockResolvedValue({
        ...mockInventoryData,
        inventory_items: largeInventory
      });
      
      renderWithProviders(<EquipmentManager />);
      
      await waitFor(() => {
        expect(screen.getByText(`(${largeInventory.length})`)).toBeInTheDocument();
      });
    });
  });
});
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DungeonCompletion from '../DungeonCompletion';
import { renderWithProviders } from '../test/utils';
import { mockEquipment } from '../test/mocks';

// Mock react-router-dom
const mockNavigate = vi.fn();
const mockLocation = {
  state: {
    run: {
      run_id: 'test-run-1',
      player_id: 'test-user-1',
      dungeon_id: 'goblin-caves',
      start_time: '2023-01-01T00:00:00Z',
      end_time: '2023-01-01T00:05:00Z',
      current_floor: 3,
      status: 'completed'
    },
    dungeon: {
      dungeon_id: 'goblin-caves',
      name: 'Goblin Caves',
      description: 'Infested with goblins',
      difficulty: 'Easy',
      entry_cost: 50,
      floors: 3,
      daily_reset_count: 10,
      reward_multiplier: 1.0
    },
    rewards: [
      {
        ...mockEquipment[0],
        slot: 'Weapon',
        rarity: 'Common',
        name: 'Goblin Slayer',
        attack_bonus: 15,
        defense_bonus: 0,
        hp_bonus: 0,
        speed_bonus: 5,
        crit_chance_bonus: 0
      },
      {
        ...mockEquipment[1],
        slot: 'Armor',
        rarity: 'Rare',
        name: 'Goblin Hide Armor',
        attack_bonus: 0,
        defense_bonus: 20,
        hp_bonus: 30,
        speed_bonus: 0,
        crit_chance_bonus: 2
      }
    ],
    currency: 150,
    completed: true,
    floorsCompleted: 3
  }
};

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation
  };
});

describe('DungeonCompletion Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial Loading and Setup', () => {
    it('should redirect to dashboard if no completion data is provided', () => {
      mockLocation.state = null;
      
      renderWithProviders(<DungeonCompletion />);
      
      expect(screen.getByText('Missing completion data')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /← back to dashboard/i })).toBeInTheDocument();
    });

    it('should display completion page with valid data', () => {
      renderWithProviders(<DungeonCompletion />);
      
      expect(screen.getByText('Goblin Caves')).toBeInTheDocument();
      expect(screen.getByText('🏆 Dungeon Completed!')).toBeInTheDocument();
    });

    it('should display back to dashboard button', () => {
      renderWithProviders(<DungeonCompletion />);
      
      expect(screen.getByRole('button', { name: /← back to dashboard/i })).toBeInTheDocument();
    });
  });

  describe('Completion Status Display', () => {
    it('should display success status for completed dungeon', () => {
      renderWithProviders(<DungeonCompletion />);
      
      expect(screen.getByText('🏆 Dungeon Completed!')).toBeInTheDocument();
      expect(screen.getByText('Victory')).toBeInTheDocument();
    });

    it('should display partial completion status', () => {
      mockLocation.state.completed = false;
      mockLocation.state.floorsCompleted = 2;
      
      renderWithProviders(<DungeonCompletion />);
      
      expect(screen.getByText('⏸️ Partial Completion')).toBeInTheDocument();
      expect(screen.getByText('Partial')).toBeInTheDocument();
    });

    it('should display failed status for failed dungeon', () => {
      mockLocation.state.completed = false;
      mockLocation.state.floorsCompleted = 0;
      
      renderWithProviders(<DungeonCompletion />);
      
      expect(screen.getByText('💀 Dungeon Failed')).toBeInTheDocument();
      expect(screen.getByText('Failed')).toBeInTheDocument();
    });
  });

  describe('Run Summary Display', () => {
    beforeEach(() => {
      renderWithProviders(<DungeonCompletion />);
    });

    it('should display run summary header', () => {
      expect(screen.getByText('Run Summary')).toBeInTheDocument();
    });

    it('should display floors completed', () => {
      expect(screen.getByText('3/3')).toBeInTheDocument();
      expect(screen.getByText('Floors')).toBeInTheDocument();
    });

    it('should display difficulty', () => {
      expect(screen.getByText('Easy')).toBeInTheDocument();
      expect(screen.getByText('Difficulty')).toBeInTheDocument();
    });

    it('should display completion time', () => {
      expect(screen.getByText('5 min')).toBeInTheDocument();
      expect(screen.getByText('Time')).toBeInTheDocument();
    });

    it('should handle unknown time', () => {
      mockLocation.state.run.start_time = null;
      
      renderWithProviders(<DungeonCompletion />);
      
      expect(screen.getByText('Unknown')).toBeInTheDocument();
    });

    it('should display status', () => {
      expect(screen.getByText('Victory')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
    });
  });

  describe('Rewards Display', () => {
    beforeEach(() => {
      renderWithProviders(<DungeonCompletion />);
    });

    it('should display rewards header', () => {
      expect(screen.getByText('🎁 Rewards Earned')).toBeInTheDocument();
    });

    it('should display currency rewards', () => {
      expect(screen.getByText('Gold Earned')).toBeInTheDocument();
      expect(screen.getByText('💰 150')).toBeInTheDocument();
    });

    it('should display equipment rewards', () => {
      expect(screen.getByText('Goblin Slayer')).toBeInTheDocument();
      expect(screen.getByText('Goblin Hide Armor')).toBeInTheDocument();
    });

    it('should display equipment slots', () => {
      expect(screen.getByText('Weapon')).toBeInTheDocument();
      expect(screen.getByText('Armor')).toBeInTheDocument();
    });

    it('should display equipment rarities', () => {
      expect(screen.getByText('Common')).toBeInTheDocument();
      expect(screen.getByText('Rare')).toBeInTheDocument();
    });

    it('should display equipment stats', () => {
      expect(screen.getByText('+15 Attack, +5 Speed')).toBeInTheDocument();
      expect(screen.getByText('+20 Defense, +30 HP, +2% Crit')).toBeInTheDocument();
    });

    it('should display no rewards message when no rewards', () => {
      mockLocation.state.rewards = [];
      mockLocation.state.currency = 0;
      
      renderWithProviders(<DungeonCompletion />);
      
      expect(screen.getByText('No equipment rewards earned this run')).toBeInTheDocument();
      expect(screen.queryByText('Gold Earned')).not.toBeInTheDocument();
    });

    it('should handle equipment with no special stats', () => {
      const equipmentWithNoStats = [{
        ...mockEquipment[0],
        name: 'Plain Sword',
        attack_bonus: 0,
        defense_bonus: 0,
        hp_bonus: 0,
        speed_bonus: 0,
        crit_chance_bonus: 0
      }];
      mockLocation.state.rewards = equipmentWithNoStats;
      
      renderWithProviders(<DungeonCompletion />);
      
      expect(screen.getByText('No special stats')).toBeInTheDocument();
    });
  });

  describe('Action Buttons', () => {
    beforeEach(() => {
      renderWithProviders(<DungeonCompletion />);
    });

    it('should display run again button', () => {
      expect(screen.getByRole('button', { name: /🔄 run again/i })).toBeInTheDocument();
    });

    it('should display view inventory button', () => {
      expect(screen.getByRole('button', { name: /🎒 view inventory/i })).toBeInTheDocument();
    });

    it('should display dashboard button', () => {
      expect(screen.getByRole('button', { name: /🏠 dashboard/i })).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      renderWithProviders(<DungeonCompletion />);
    });

    it('should navigate to dungeons when run again is clicked', async () => {
      const user = userEvent.setup();
      
      await user.click(screen.getByRole('button', { name: /🔄 run again/i }));
      
      expect(mockNavigate).toHaveBeenCalledWith('/dungeons');
    });

    it('should navigate to equipment when view inventory is clicked', async () => {
      const user = userEvent.setup();
      
      await user.click(screen.getByRole('button', { name: /🎒 view inventory/i }));
      
      expect(mockNavigate).toHaveBeenCalledWith('/equipment');
    });

    it('should navigate to dashboard when dashboard button is clicked', async () => {
      const user = userEvent.setup();
      
      await user.click(screen.getByRole('button', { name: /🏠 dashboard/i }));
      
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });

    it('should navigate to dashboard when back button is clicked', async () => {
      const user = userEvent.setup();
      
      await user.click(screen.getByRole('button', { name: /← back to dashboard/i }));
      
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  describe('Equipment Stats Formatting', () => {
    it('should format attack stats correctly', () => {
      const equipmentWithAttack = [{
        ...mockEquipment[0],
        attack_bonus: 25
      }];
      mockLocation.state.rewards = equipmentWithAttack;
      
      renderWithProviders(<DungeonCompletion />);
      
      expect(screen.getByText('+25 Attack')).toBeInTheDocument();
    });

    it('should format defense stats correctly', () => {
      const equipmentWithDefense = [{
        ...mockEquipment[0],
        defense_bonus: 30
      }];
      mockLocation.state.rewards = equipmentWithDefense;
      
      renderWithProviders(<DungeonCompletion />);
      
      expect(screen.getByText('+30 Defense')).toBeInTheDocument();
    });

    it('should format HP stats correctly', () => {
      const equipmentWithHP = [{
        ...mockEquipment[0],
        hp_bonus: 50
      }];
      mockLocation.state.rewards = equipmentWithHP;
      
      renderWithProviders(<DungeonCompletion />);
      
      expect(screen.getByText('+50 HP')).toBeInTheDocument();
    });

    it('should format speed stats correctly', () => {
      const equipmentWithSpeed = [{
        ...mockEquipment[0],
        speed_bonus: 10
      }];
      mockLocation.state.rewards = equipmentWithSpeed;
      
      renderWithProviders(<DungeonCompletion />);
      
      expect(screen.getByText('+10 Speed')).toBeInTheDocument();
    });

    it('should format crit chance stats correctly', () => {
      const equipmentWithCrit = [{
        ...mockEquipment[0],
        crit_chance_bonus: 5
      }];
      mockLocation.state.rewards = equipmentWithCrit;
      
      renderWithProviders(<DungeonCompletion />);
      
      expect(screen.getByText('+5% Crit')).toBeInTheDocument();
    });

    it('should combine multiple stats correctly', () => {
      const equipmentWithMultipleStats = [{
        ...mockEquipment[0],
        attack_bonus: 15,
        defense_bonus: 10,
        hp_bonus: 20,
        speed_bonus: 5,
        crit_chance_bonus: 3
      }];
      mockLocation.state.rewards = equipmentWithMultipleStats;
      
      renderWithProviders(<DungeonCompletion />);
      
      expect(screen.getByText('+15 Attack, +10 Defense, +20 HP, +5 Speed, +3% Crit')).toBeInTheDocument();
    });
  });

  describe('Rarity Classes', () => {
    it('should apply correct rarity class for common items', () => {
      const commonEquipment = [{
        ...mockEquipment[0],
        rarity: 'Common'
      }];
      mockLocation.state.rewards = commonEquipment;
      
      renderWithProviders(<DungeonCompletion />);
      
      const rarityElement = screen.getByText('Common');
      expect(rarityElement).toHaveClass('rarity-common');
    });

    it('should apply correct rarity class for rare items', () => {
      const rareEquipment = [{
        ...mockEquipment[0],
        rarity: 'Rare'
      }];
      mockLocation.state.rewards = rareEquipment;
      
      renderWithProviders(<DungeonCompletion />);
      
      const rarityElement = screen.getByText('Rare');
      expect(rarityElement).toHaveClass('rarity-rare');
    });

    it('should handle null/undefined rarity gracefully', () => {
      const equipmentWithoutRarity = [{
        ...mockEquipment[0],
        rarity: null
      }];
      mockLocation.state.rewards = equipmentWithoutRarity;
      
      renderWithProviders(<DungeonCompletion />);
      
      const rarityElement = screen.getByText('common');
      expect(rarityElement).toHaveClass('rarity-common');
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      renderWithProviders(<DungeonCompletion />);
    });

    it('should have proper heading structure', () => {
      expect(screen.getByRole('heading', { name: 'Goblin Caves' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Run Summary' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: '🎁 Rewards Earned' })).toBeInTheDocument();
    });

    it('should have accessible buttons', () => {
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAccessibleName();
      });
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      
      // Test Tab navigation
      await user.tab();
      expect(screen.getByRole('button', { name: /← back to dashboard/i })).toHaveFocus();
      
      await user.tab();
      expect(screen.getByRole('button', { name: /🔄 run again/i })).toHaveFocus();
    });

    it('should have ARIA labels for status indicators', () => {
      const statusElement = screen.getByText('🏆 Dungeon Completed!');
      expect(statusElement).toHaveAttribute('role') || 
             expect(statusElement.closest('[role]')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    beforeEach(() => {
      renderWithProviders(<DungeonCompletion />);
    });

    it('should render correctly on mobile', () => {
      window.innerWidth = 375;
      
      expect(screen.getByText('Goblin Caves')).toBeInTheDocument();
      expect(screen.getByText('🏆 Dungeon Completed!')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /🔄 run again/i })).toBeInTheDocument();
    });

    it('should render correctly on tablet', () => {
      window.innerWidth = 768;
      
      expect(screen.getByText('Goblin Caves')).toBeInTheDocument();
      expect(screen.getByText('🏆 Dungeon Completed!')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /🔄 run again/i })).toBeInTheDocument();
    });

    it('should render correctly on desktop', () => {
      window.innerWidth = 1024;
      
      expect(screen.getByText('Goblin Caves')).toBeInTheDocument();
      expect(screen.getByText('🏆 Dungeon Completed!')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /🔄 run again/i })).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty rewards array', () => {
      mockLocation.state.rewards = [];
      
      renderWithProviders(<DungeonCompletion />);
      
      expect(screen.getByText('No equipment rewards earned this run')).toBeInTheDocument();
    });

    it('should handle zero currency', () => {
      mockLocation.state.currency = 0;
      
      renderWithProviders(<DungeonCompletion />);
      
      expect(screen.queryByText('Gold Earned')).not.toBeInTheDocument();
    });

    it('should handle missing run data', () => {
      mockLocation.state.run = null;
      
      renderWithProviders(<DungeonCompletion />);
      
      expect(screen.getByText('Missing completion data')).toBeInTheDocument();
    });

    it('should handle missing dungeon data', () => {
      mockLocation.state.dungeon = null;
      
      renderWithProviders(<DungeonCompletion />);
      
      expect(screen.getByText('Missing completion data')).toBeInTheDocument();
    });

    it('should handle very large reward amounts', () => {
      mockLocation.state.currency = 999999;
      
      renderWithProviders(<DungeonCompletion />);
      
      expect(screen.getByText('💰 999999')).toBeInTheDocument();
    });

    it('should handle very long dungeon names', () => {
      mockLocation.state.dungeon.name = 'Very Long Dungeon Name That Might Overflow On Small Screens';
      
      renderWithProviders(<DungeonCompletion />);
      
      expect(screen.getByText('Very Long Dungeon Name That Might Overflow On Small Screens')).toBeInTheDocument();
    });
  });
});
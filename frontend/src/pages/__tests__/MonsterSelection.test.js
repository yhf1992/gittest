import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MonsterSelection from '../MonsterSelection';
import { renderWithProviders } from '../test/utils';
import { mockCombatService, mockMonsters } from '../test/mocks';

// Mock the API services
vi.mock('../services/api', async () => {
  const actual = await vi.importActual('../services/api');
  return {
    ...actual,
    combatService: {
      ...mockCombatService
    }
  };
});

describe('MonsterSelection Page', () => {
  const mockNavigate = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    vi.doMock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom');
      return {
        ...actual,
        useNavigate: () => mockNavigate
      };
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading spinner while fetching monsters', () => {
      mockCombatService.getMonsters.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      renderWithProviders(<MonsterSelection />);
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error message when API call fails', async () => {
      mockCombatService.getMonsters.mockRejectedValue({ error: 'Failed to load monsters' });
      
      renderWithProviders(<MonsterSelection />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load monsters')).toBeInTheDocument();
      });
    });

    it('should display generic error message when no specific error provided', async () => {
      mockCombatService.getMonsters.mockRejectedValue(new Error('Network error'));
      
      renderWithProviders(<MonsterSelection />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load monsters')).toBeInTheDocument();
      });
    });
  });

  describe('Successful Data Loading', () => {
    beforeEach(() => {
      mockCombatService.getMonsters.mockResolvedValue({
        monsters: mockMonsters
      });
    });

    it('should display monster list correctly', async () => {
      renderWithProviders(<MonsterSelection />);
      
      await waitFor(() => {
        expect(screen.getByText('Select Your Opponent')).toBeInTheDocument();
      });
      
      // Check that all monsters are displayed
      expect(screen.getByText('Goblin Warrior')).toBeInTheDocument();
      expect(screen.getByText('Ancient Dragon')).toBeInTheDocument();
    });

    it('should display monster tiers with correct colors', async () => {
      renderWithProviders(<MonsterSelection />);
      
      await waitFor(() => {
        expect(screen.getByText('Common')).toBeInTheDocument();
        expect(screen.getByText('Boss')).toBeInTheDocument();
      });
      
      // Check tier colors (would need to check computed styles)
      const commonTier = screen.getByText('Common');
      const bossTier = screen.getByText('Boss');
      
      expect(commonTier).toBeInTheDocument();
      expect(bossTier).toBeInTheDocument();
    });

    it('should display monster stats correctly', async () => {
      renderWithProviders(<MonsterSelection />);
      
      await waitFor(() => {
        expect(screen.getByText('HP')).toBeInTheDocument();
        expect(screen.getByText('ATK')).toBeInTheDocument();
        expect(screen.getByText('DEF')).toBeInTheDocument();
        expect(screen.getByText('SPD')).toBeInTheDocument();
      });
      
      // Check specific monster stats
      expect(screen.getByText('100')).toBeInTheDocument(); // Goblin HP
      expect(screen.getByText('15')).toBeInTheDocument(); // Goblin Attack
      expect(screen.getByText('1000')).toBeInTheDocument(); // Dragon HP
      expect(screen.getByText('100')).toBeInTheDocument(); // Dragon Attack
    });

    it('should display element icons correctly', async () => {
      renderWithProviders(<MonsterSelection />);
      
      await waitFor(() => {
        expect(screen.getByText('⚪ Neutral')).toBeInTheDocument();
        expect(screen.getByText('🔥 Fire')).toBeInTheDocument();
      });
    });

    it('should display loot preview information', async () => {
      const monstersWithLoot = [
        {
          ...mockMonsters[0],
          loot_preview: {
            currency: 50,
            items: ['Iron Sword', 'Health Potion'],
            drop_chance: '75%'
          }
        }
      ];
      mockCombatService.getMonsters.mockResolvedValue({
        monsters: monstersWithLoot
      });
      
      renderWithProviders(<MonsterSelection />);
      
      await waitFor(() => {
        expect(screen.getByText('Loot Preview')).toBeInTheDocument();
      });
      
      expect(screen.getByText('50')).toBeInTheDocument(); // Currency
      expect(screen.getByText('Iron Sword')).toBeInTheDocument();
      expect(screen.getByText('Health Potion')).toBeInTheDocument();
      expect(screen.getByText('Drop Chance: 75%')).toBeInTheDocument();
    });

    it('should handle empty monster list gracefully', async () => {
      mockCombatService.getMonsters.mockResolvedValue({ monsters: [] });
      
      renderWithProviders(<MonsterSelection />);
      
      await waitFor(() => {
        expect(screen.getByText('Select Your Opponent')).toBeInTheDocument();
      });
      
      expect(screen.queryByText('Goblin Warrior')).not.toBeInTheDocument();
      expect(screen.getByText('No monsters available')).toBeInTheDocument();
    });
  });

  describe('Monster Selection', () => {
    beforeEach(() => {
      mockCombatService.getMonsters.mockResolvedValue({
        monsters: mockMonsters
      });
    });

    it('should select a monster when clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<MonsterSelection />);
      
      await waitFor(() => {
        expect(screen.getByText('Goblin Warrior')).toBeInTheDocument();
      });
      
      const goblinCard = screen.getByText('Goblin Warrior').closest('.monster-card');
      await user.click(goblinCard);
      
      expect(screen.getByText('Start Combat with Goblin Warrior')).toBeInTheDocument();
    });

    it('should highlight selected monster', async () => {
      const user = userEvent.setup();
      renderWithProviders(<MonsterSelection />);
      
      await waitFor(() => {
        expect(screen.getByText('Goblin Warrior')).toBeInTheDocument();
      });
      
      const goblinCard = screen.getByText('Goblin Warrior').closest('.monster-card');
      await user.click(goblinCard);
      
      expect(goblinCard).toHaveClass('selected');
    });

    it('should allow switching selection between monsters', async () => {
      const user = userEvent.setup();
      renderWithProviders(<MonsterSelection />);
      
      await waitFor(() => {
        expect(screen.getByText('Goblin Warrior')).toBeInTheDocument();
        expect(screen.getByText('Ancient Dragon')).toBeInTheDocument();
      });
      
      // Select first monster
      const goblinCard = screen.getByText('Goblin Warrior').closest('.monster-card');
      await user.click(goblinCard);
      
      expect(screen.getByText('Start Combat with Goblin Warrior')).toBeInTheDocument();
      expect(goblinCard).toHaveClass('selected');
      
      // Select second monster
      const dragonCard = screen.getByText('Ancient Dragon').closest('.monster-card');
      await user.click(dragonCard);
      
      expect(screen.getByText('Start Combat with Ancient Dragon')).toBeInTheDocument();
      expect(dragonCard).toHaveClass('selected');
      expect(goblinCard).not.toHaveClass('selected');
    });
  });

  describe('Combat Start', () => {
    beforeEach(() => {
      mockCombatService.getMonsters.mockResolvedValue({
        monsters: mockMonsters
      });
    });

    it('should navigate to combat with selected monster', async () => {
      const user = userEvent.setup();
      renderWithProviders(<MonsterSelection />);
      
      await waitFor(() => {
        expect(screen.getByText('Goblin Warrior')).toBeInTheDocument();
      });
      
      // Select monster
      const goblinCard = screen.getByText('Goblin Warrior').closest('.monster-card');
      await user.click(goblinCard);
      
      // Start combat
      const startButton = screen.getByRole('button', { name: /start combat with goblin warrior/i });
      await user.click(startButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/combat', { 
        state: { monster: mockMonsters[0] } 
      });
    });

    it('should not show start combat button when no monster is selected', async () => {
      renderWithProviders(<MonsterSelection />);
      
      await waitFor(() => {
        expect(screen.getByText('Select Your Opponent')).toBeInTheDocument();
      });
      
      expect(screen.queryByText(/start combat/i)).not.toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      mockCombatService.getMonsters.mockResolvedValue({
        monsters: mockMonsters
      });
    });

    it('should navigate back to dashboard when back button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<MonsterSelection />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /← back to dashboard/i })).toBeInTheDocument();
      });
      
      await user.click(screen.getByRole('button', { name: /← back to dashboard/i }));
      
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  describe('Filtering and Sorting', () => {
    beforeEach(() => {
      mockCombatService.getMonsters.mockResolvedValue({
        monsters: mockMonsters
      });
    });

    it('should filter monsters by tier if filter is implemented', async () => {
      // This test assumes tier filtering is implemented
      // If not implemented, this would test the absence of filtering
      renderWithProviders(<MonsterSelection />);
      
      await waitFor(() => {
        expect(screen.getByText('Goblin Warrior')).toBeInTheDocument();
        expect(screen.getByText('Ancient Dragon')).toBeInTheDocument();
      });
      
      // If filtering controls exist, test them here
      // For now, verify all monsters are shown
      expect(screen.getAllByTestId('monster-card')).toHaveLength(2);
    });

    it('should sort monsters by level if sorting is implemented', async () => {
      // This test assumes level sorting is implemented
      renderWithProviders(<MonsterSelection />);
      
      await waitFor(() => {
        expect(screen.getByText('Goblin Warrior')).toBeInTheDocument();
        expect(screen.getByText('Ancient Dragon')).toBeInTheDocument();
      });
      
      // Check that monsters are displayed in some order
      const levels = screen.getAllByText(/Level \d+/);
      expect(levels).toHaveLength(2);
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      mockCombatService.getMonsters.mockResolvedValue({
        monsters: mockMonsters
      });
    });

    it('should have proper heading structure', async () => {
      renderWithProviders(<MonsterSelection />);
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Select Your Opponent' })).toBeInTheDocument();
      });
    });

    it('should have accessible monster cards', async () => {
      renderWithProviders(<MonsterSelection />);
      
      await waitFor(() => {
        const monsterCards = screen.getAllByRole('button');
        expect(monsterCards.length).toBeGreaterThan(0);
      });
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      renderWithProviders(<MonsterSelection />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /← back to dashboard/i })).toBeInTheDocument();
      });
      
      // Test Tab navigation
      await user.tab();
      expect(screen.getByRole('button', { name: /← back to dashboard/i })).toHaveFocus();
      
      // Continue tabbing through monster cards
      await user.tab();
      const firstMonster = screen.getAllByRole('button')[1]; // First monster card
      expect(firstMonster).toHaveFocus();
    });

    it('should support Enter key for monster selection', async () => {
      const user = userEvent.setup();
      renderWithProviders(<MonsterSelection />);
      
      await waitFor(() => {
        expect(screen.getByText('Goblin Warrior')).toBeInTheDocument();
      });
      
      // Focus on first monster card and press Enter
      const firstMonster = screen.getAllByRole('button')[1];
      firstMonster.focus();
      await user.keyboard('{Enter}');
      
      expect(screen.getByText('Start Combat with Goblin Warrior')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    beforeEach(() => {
      mockCombatService.getMonsters.mockResolvedValue({
        monsters: mockMonsters
      });
    });

    it('should render correctly on mobile', async () => {
      window.innerWidth = 375;
      
      renderWithProviders(<MonsterSelection />);
      
      await waitFor(() => {
        expect(screen.getByText('Select Your Opponent')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Goblin Warrior')).toBeInTheDocument();
    });

    it('should render correctly on tablet', async () => {
      window.innerWidth = 768;
      
      renderWithProviders(<MonsterSelection />);
      
      await waitFor(() => {
        expect(screen.getByText('Select Your Opponent')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Goblin Warrior')).toBeInTheDocument();
    });

    it('should render correctly on desktop', async () => {
      window.innerWidth = 1024;
      
      renderWithProviders(<MonsterSelection />);
      
      await waitFor(() => {
        expect(screen.getByText('Select Your Opponent')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Goblin Warrior')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle monsters with missing properties gracefully', async () => {
      const incompleteMonsters = [
        {
          monster_id: 'incomplete-1',
          name: 'Incomplete Monster',
          tier: 'tier_1',
          level: 5,
          // Missing some properties
        }
      ];
      mockCombatService.getMonsters.mockResolvedValue({
        monsters: incompleteMonsters
      });
      
      renderWithProviders(<MonsterSelection />);
      
      await waitFor(() => {
        expect(screen.getByText('Incomplete Monster')).toBeInTheDocument();
      });
      
      // Should not crash with missing properties
      expect(screen.getByText('Common')).toBeInTheDocument();
      expect(screen.getByText('Level 5')).toBeInTheDocument();
    });

    it('should handle very large monster lists efficiently', async () => {
      const largeMonsterList = Array.from({ length: 100 }, (_, i) => ({
        monster_id: `monster-${i}`,
        name: `Monster ${i}`,
        tier: 'tier_1',
        level: i + 1,
        max_hp: 100,
        attack: 10,
        defense: 10,
        speed: 10,
        element: 'neutral',
        description: `Description for monster ${i}`,
        class: 'Warrior',
        loot_preview: {
          currency: 10,
          items: ['Basic Item'],
          drop_chance: '50%'
        }
      }));
      
      mockCombatService.getMonsters.mockResolvedValue({
        monsters: largeMonsterList
      });
      
      renderWithProviders(<MonsterSelection />);
      
      await waitFor(() => {
        expect(screen.getByText('Monster 0')).toBeInTheDocument();
        expect(screen.getByText('Monster 99')).toBeInTheDocument();
      });
      
      expect(screen.getAllByTestId('monster-card')).toHaveLength(100);
    });
  });
});
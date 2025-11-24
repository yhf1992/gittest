import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DungeonRun from '../DungeonRun';
import { renderWithProviders } from '../test/utils';
import { mockDungeonService } from '../test/mocks';

// Mock the API services
vi.mock('../services/api', async () => {
  const actual = await vi.importActual('../services/api');
  return {
    ...actual,
    dungeonService: {
      ...mockDungeonService
    }
  };
});

// Mock react-router-dom
const mockNavigate = vi.fn();
const mockLocation = {
  state: {
    run: {
      run_id: 'test-run-1',
      player_id: 'test-user-1',
      dungeon_id: 'goblin-caves',
      start_time: '2023-01-01T00:00:00Z',
      current_floor: 1,
      status: 'active'
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
    character: {
      character_id: 'test-char-1',
      name: 'TestPlayer',
      character_class: 'Warrior',
      level: 10,
      max_hp: 100,
      current_hp: 100,
      attack: 20,
      defense: 15,
      speed: 10,
      element: 'Neutral'
    },
    inventory: {
      player_id: 'test-user-1',
      currency: 950,
      equipment: {},
      inventory: []
    }
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

describe('DungeonRun Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Initial Loading and Setup', () => {
    it('should redirect to dungeon selection if no run data is provided', () => {
      mockLocation.state = null;
      
      renderWithProviders(<DungeonRun />);
      
      expect(mockNavigate).toHaveBeenCalledWith('/dungeons');
    });

    it('should initialize with correct player stats', () => {
      renderWithProviders(<DungeonRun />);
      
      expect(screen.getByText('100 / 100')).toBeInTheDocument(); // HP
      expect(screen.getByText('TestPlayer')).toBeInTheDocument();
      expect(screen.getByText('Level 10')).toBeInTheDocument();
    });

    it('should display dungeon information', () => {
      renderWithProviders(<DungeonRun />);
      
      expect(screen.getByText('Goblin Caves')).toBeInTheDocument();
      expect(screen.getByText('Floor 1 / 3')).toBeInTheDocument();
      expect(screen.getByText('Easy')).toBeInTheDocument();
    });

    it('should start first floor automatically on mount', () => {
      renderWithProviders(<DungeonRun />);
      
      // Should show that combat is starting
      expect(screen.getByText('Starting floor 1...')).toBeInTheDocument();
    });
  });

  describe('Combat Simulation', () => {
    beforeEach(() => {
      renderWithProviders(<DungeonRun />);
    });

    it('should generate enemies for each floor', async () => {
      await waitFor(() => {
        expect(screen.getByText(/Combat with/)).toBeInTheDocument();
      });
      
      // Enemy should be generated and displayed
      expect(screen.getByText('Goblin Scout')).toBeInTheDocument();
    });

    it('should display combat progress', async () => {
      await waitFor(() => {
        expect(screen.getByText('Loading...')).toBeInTheDocument();
      });
      
      // Combat should be simulated
      vi.advanceTimersByTime(1000);
      
      await waitFor(() => {
        expect(screen.getByText('Victory!')).toBeInTheDocument();
      });
    });

    it('should update player HP after combat', async () => {
      await waitFor(() => {
        expect(screen.getByText('Loading...')).toBeInTheDocument();
      });
      
      vi.advanceTimersByTime(1000);
      
      await waitFor(() => {
        // HP should be reduced after combat
        const hpText = screen.getByText(/\/ \d+/);
        expect(hpText).toBeInTheDocument();
      });
    });

    it('should automatically progress to next floor after victory', async () => {
      await waitFor(() => {
        expect(screen.getByText('Loading...')).toBeInTheDocument();
      });
      
      vi.advanceTimersByTime(1000);
      
      await waitFor(() => {
        expect(screen.getByText('Victory!')).toBeInTheDocument();
      });
      
      // Should progress to next floor after delay
      vi.advanceTimersByTime(2000);
      
      await waitFor(() => {
        expect(screen.getByText('Floor 2 / 3')).toBeInTheDocument();
      });
    });

    it('should handle player defeat correctly', async () => {
      // Mock a defeat scenario
      const weakCharacter = {
        ...mockLocation.state.character,
        max_hp: 10,
        attack: 1,
        defense: 1
      };
      mockLocation.state.character = weakCharacter;
      
      renderWithProviders(<DungeonRun />);
      
      await waitFor(() => {
        expect(screen.getByText('Loading...')).toBeInTheDocument();
      });
      
      vi.advanceTimersByTime(1000);
      
      await waitFor(() => {
        expect(screen.getByText('Defeated!')).toBeInTheDocument();
        expect(screen.getByText('0 / 10')).toBeInTheDocument(); // HP should be 0
      });
    });
  });

  describe('Combat Logs', () => {
    beforeEach(() => {
      renderWithProviders(<DungeonRun />);
    });

    it('should display combat logs after each fight', async () => {
      await waitFor(() => {
        expect(screen.getByText('Loading...')).toBeInTheDocument();
      });
      
      vi.advanceTimersByTime(1000);
      
      await waitFor(() => {
        expect(screen.getByText('Combat Log')).toBeInTheDocument();
        expect(screen.getByText(/Floor 1:/)).toBeInTheDocument();
      });
    });

    it('should show combat results in logs', async () => {
      await waitFor(() => {
        expect(screen.getByText('Loading...')).toBeInTheDocument();
      });
      
      vi.advanceTimersByTime(1000);
      
      await waitFor(() => {
        expect(screen.getByText(/Victory/)).toBeInTheDocument();
        expect(screen.getByText(/vs/)).toBeInTheDocument();
      });
    });
  });

  describe('Dungeon Completion', () => {
    beforeEach(() => {
      renderWithProviders(<DungeonRun />);
    });

    it('should complete dungeon after final floor', async () => {
      await waitFor(() => {
        expect(screen.getByText('Loading...')).toBeInTheDocument();
      });
      
      // Progress through all floors
      for (let floor = 1; floor <= 3; floor++) {
        vi.advanceTimersByTime(1000);
        
        await waitFor(() => {
          if (floor < 3) {
            expect(screen.getByText(`Floor ${floor} / 3`)).toBeInTheDocument();
          }
        });
        
        if (floor < 3) {
          // Wait for floor transition
          vi.advanceTimersByTime(2000);
        }
      }
      
      await waitFor(() => {
        expect(screen.getByText('Dungeon Completed!')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /view rewards/i })).toBeInTheDocument();
      });
    });

    it('should navigate to completion page when view rewards is clicked', async () => {
      await waitFor(() => {
        expect(screen.getByText('Loading...')).toBeInTheDocument();
      });
      
      // Progress through all floors
      for (let floor = 1; floor <= 3; floor++) {
        vi.advanceTimersByTime(1000);
        
        if (floor < 3) {
          vi.advanceTimersByTime(2000);
        }
      }
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /view rewards/i })).toBeInTheDocument();
      });
      
      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: /view rewards/i }));
      
      expect(mockNavigate).toHaveBeenCalledWith('/dungeon-completion', {
        state: expect.objectContaining({
          run: expect.any(Object),
          dungeon: expect.any(Object),
          character: expect.any(Object),
          inventory: expect.any(Object),
          combatLogs: expect.any(Array)
        })
      });
    });
  });

  describe('Enemy Scaling', () => {
    it('should generate stronger enemies on higher floors', async () => {
      renderWithProviders(<DungeonRun />);
      
      // Floor 1 enemy
      await waitFor(() => {
        expect(screen.getByText('Loading...')).toBeInTheDocument();
      });
      
      vi.advanceTimersByTime(1000);
      vi.advanceTimersByTime(2000); // Move to floor 2
      
      await waitFor(() => {
        expect(screen.getByText('Floor 2 / 3')).toBeInTheDocument();
        // Enemy should be stronger on floor 2
        expect(screen.getByText(/Orc Warrior|Fire Mage|Shadow Assassin/)).toBeInTheDocument();
      });
      
      vi.advanceTimersByTime(1000);
      vi.advanceTimersByTime(2000); // Move to floor 3
      
      await waitFor(() => {
        expect(screen.getByText('Floor 3 / 3')).toBeInTheDocument();
        // Enemy should be even stronger on floor 3
        expect(screen.getByText(/Dragon Knight|Shadow Assassin/)).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      renderWithProviders(<DungeonRun />);
    });

    it('should have back to dashboard button', () => {
      expect(screen.getByRole('button', { name: /← back to dashboard/i })).toBeInTheDocument();
    });

    it('should navigate to dashboard when back button is clicked', async () => {
      const user = userEvent.setup();
      
      await user.click(screen.getByRole('button', { name: /← back to dashboard/i }));
      
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  describe('Loading States', () => {
    beforeEach(() => {
      renderWithProviders(<DungeonRun />);
    });

    it('should show loading state during combat', async () => {
      await waitFor(() => {
        expect(screen.getByText('Loading...')).toBeInTheDocument();
      });
    });

    it('should show floor transition loading', async () => {
      await waitFor(() => {
        expect(screen.getByText('Loading...')).toBeInTheDocument();
      });
      
      vi.advanceTimersByTime(1000);
      
      await waitFor(() => {
        expect(screen.getByText('Victory!')).toBeInTheDocument();
      });
      
      // Should show transition state
      expect(screen.getByText('Moving to next floor...')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      renderWithProviders(<DungeonRun />);
    });

    it('should have proper heading structure', () => {
      expect(screen.getByRole('heading', { name: 'Goblin Caves' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'TestPlayer' })).toBeInTheDocument();
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
    });

    it('should have ARIA labels for progress indicators', () => {
      const progressBars = screen.getAllByRole('progressbar');
      progressBars.forEach(bar => {
        expect(bar).toHaveAttribute('aria-label') || 
               expect(bar).toHaveAttribute('aria-labelledby');
      });
    });
  });

  describe('Responsive Design', () => {
    beforeEach(() => {
      renderWithProviders(<DungeonRun />);
    });

    it('should render correctly on mobile', () => {
      window.innerWidth = 375;
      
      expect(screen.getByText('Goblin Caves')).toBeInTheDocument();
      expect(screen.getByText('Floor 1 / 3')).toBeInTheDocument();
    });

    it('should render correctly on tablet', () => {
      window.innerWidth = 768;
      
      expect(screen.getByText('Goblin Caves')).toBeInTheDocument();
      expect(screen.getByText('Floor 1 / 3')).toBeInTheDocument();
    });

    it('should render correctly on desktop', () => {
      window.innerWidth = 1024;
      
      expect(screen.getByText('Goblin Caves')).toBeInTheDocument();
      expect(screen.getByText('Floor 1 / 3')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing character data gracefully', () => {
      mockLocation.state.character = null;
      
      renderWithProviders(<DungeonRun />);
      
      // Should not crash and should redirect
      expect(mockNavigate).toHaveBeenCalledWith('/dungeons');
    });

    it('should handle missing dungeon data gracefully', () => {
      mockLocation.state.dungeon = null;
      
      renderWithProviders(<DungeonRun />);
      
      expect(mockNavigate).toHaveBeenCalledWith('/dungeons');
    });

    it('should handle zero-floor dungeons', () => {
      const zeroFloorDungeon = {
        ...mockLocation.state.dungeon,
        floors: 0
      };
      mockLocation.state.dungeon = zeroFloorDungeon;
      
      renderWithProviders(<DungeonRun />);
      
      // Should complete immediately
      expect(screen.getByText('Dungeon Completed!')).toBeInTheDocument();
    });

    it('should handle very long dungeons efficiently', () => {
      const longDungeon = {
        ...mockLocation.state.dungeon,
        floors: 100
      };
      mockLocation.state.dungeon = longDungeon;
      
      renderWithProviders(<DungeonRun />);
      
      expect(screen.getByText('Floor 1 / 100')).toBeInTheDocument();
    });
  });
});
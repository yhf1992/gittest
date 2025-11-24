import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DungeonSelection from '../DungeonSelection';
import { renderWithProviders } from '../test/utils';
import { mockAuthService, mockDungeonService, mockDungeons, mockUser } from '../test/mocks';

// Mock the API services
vi.mock('../services/api', async () => {
  const actual = await vi.importActual('../services/api');
  return {
    ...actual,
    authService: {
      ...mockAuthService
    },
    dungeonService: {
      ...mockDungeonService
    }
  };
});

// Mock the useAuth hook
vi.mock('../services/AuthContext', async () => {
  const actual = await vi.importActual('../services/AuthContext');
  return {
    ...actual,
    useAuth: () => ({
      user: mockUser
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

describe('DungeonSelection Page', () => {
  const mockCharacter = {
    character_id: 'test-char-1',
    name: 'TestPlayer',
    character_class: 'Warrior',
    level: 10,
    max_hp: 500,
    attack: 75,
    defense: 50,
    speed: 60,
    element: 'Fire'
  };

  const mockProfileData = {
    user: mockUser,
    character: mockCharacter,
    currency: 1000
  };

  const dungeonsWithRequirements = [
    {
      ...mockDungeons[0],
      dungeon_id: 'goblin-caves',
      level_requirement: 5,
      entry_cost: 50,
      floors: 5,
      daily_reset_count: 10,
      difficulty: 'Easy'
    },
    {
      ...mockDungeons[1],
      dungeon_id: 'shadow-realm',
      level_requirement: 20,
      entry_cost: 200,
      floors: 10,
      daily_reset_count: 3,
      difficulty: 'Hard'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockAuthService.getProfile.mockResolvedValue(mockProfileData);
    mockDungeonService.getDungeons.mockResolvedValue({
      dungeons: dungeonsWithRequirements
    });
    mockDungeonService.enterDungeon.mockResolvedValue({
      run: {
        run_id: 'test-run-1',
        player_id: mockUser.id,
        dungeon_id: 'goblin-caves',
        start_time: '2023-01-01T00:00:00Z',
        current_floor: 1,
        status: 'active'
      },
      inventory: {
        player_id: mockUser.id,
        currency: 950, // After entry cost
        equipment: {},
        inventory: []
      }
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial Loading and Setup', () => {
    it('should show loading state while fetching data', () => {
      mockAuthService.getProfile.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      renderWithProviders(<DungeonSelection />);
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should load profile and dungeon data on mount', async () => {
      renderWithProviders(<DungeonSelection />);
      
      await waitFor(() => {
        expect(mockAuthService.getProfile).toHaveBeenCalled();
        expect(mockDungeonService.getDungeons).toHaveBeenCalled();
      });
    });

    it('should display error message when data loading fails', async () => {
      mockDungeonService.getDungeons.mockRejectedValue({ error: 'Failed to load dungeons' });
      
      renderWithProviders(<DungeonSelection />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load dungeon data')).toBeInTheDocument();
      });
    });

    it('should display dungeon selection interface after successful load', async () => {
      renderWithProviders(<DungeonSelection />);
      
      await waitFor(() => {
        expect(screen.getByText('🏛️ Dungeon Selection')).toBeInTheDocument();
        expect(screen.getByText('Choose your challenge and test your strength')).toBeInTheDocument();
      });
    });
  });

  describe('Player Information Display', () => {
    beforeEach(async () => {
      renderWithProviders(<DungeonSelection />);
      await waitFor(() => {
        expect(screen.getByText('Welcome, TestUser')).toBeInTheDocument();
      });
    });

    it('should display player username', () => {
      expect(screen.getByText('Welcome, TestUser')).toBeInTheDocument();
    });

    it('should display character stats', () => {
      expect(screen.getByText('10')).toBeInTheDocument(); // Level
      expect(screen.getByText('Warrior')).toBeInTheDocument(); // Class
      expect(screen.getByText('1000')).toBeInTheDocument(); // Gold
      expect(screen.getByText('75')).toBeInTheDocument(); // Attack
      expect(screen.getByText('50')).toBeInTheDocument(); // Defense
      expect(screen.getByText('60')).toBeInTheDocument(); // Speed
    });

    it('should display stat labels correctly', () => {
      expect(screen.getByText('Level')).toBeInTheDocument();
      expect(screen.getByText('Class')).toBeInTheDocument();
      expect(screen.getByText('Gold')).toBeInTheDocument();
      expect(screen.getByText('Attack')).toBeInTheDocument();
      expect(screen.getByText('Defense')).toBeInTheDocument();
      expect(screen.getByText('Speed')).toBeInTheDocument();
    });
  });

  describe('Dungeon Display', () => {
    beforeEach(async () => {
      renderWithProviders(<DungeonSelection />);
      await waitFor(() => {
        expect(screen.getByText('Goblin Caves')).toBeInTheDocument();
      });
    });

    it('should display dungeon names', () => {
      expect(screen.getByText('Goblin Caves')).toBeInTheDocument();
      expect(screen.getByText('Shadow Realm')).toBeInTheDocument();
    });

    it('should display dungeon difficulties', () => {
      expect(screen.getByText('Easy')).toBeInTheDocument();
      expect(screen.getByText('Hard')).toBeInTheDocument();
    });

    it('should display dungeon descriptions', () => {
      expect(screen.getByText('Infested with goblins and other weak creatures')).toBeInTheDocument();
      expect(screen.getByText('A dark realm filled with powerful shadows')).toBeInTheDocument();
    });

    it('should display dungeon details', () => {
      expect(screen.getByText('5')).toBeInTheDocument(); // Level requirement for goblin caves
      expect(screen.getByText('20')).toBeInTheDocument(); // Level requirement for shadow realm
      expect(screen.getByText('50 gold')).toBeInTheDocument(); // Entry cost for goblin caves
      expect(screen.getByText('200 gold')).toBeInTheDocument(); // Entry cost for shadow realm
      expect(screen.getByText('5')).toBeInTheDocument(); // Floors for goblin caves
      expect(screen.getByText('10')).toBeInTheDocument(); // Floors for shadow realm
      expect(screen.getByText('10')).toBeInTheDocument(); // Daily attempts for goblin caves
      expect(screen.getByText('3')).toBeInTheDocument(); // Daily attempts for shadow realm
    });

    it('should display detail labels', () => {
      expect(screen.getByText('Level Req')).toBeInTheDocument();
      expect(screen.getByText('Entry Cost')).toBeInTheDocument();
      expect(screen.getByText('Floors')).toBeInTheDocument();
      expect(screen.getByText('Daily Attempts')).toBeInTheDocument();
    });

    it('should display detail icons', () => {
      expect(screen.getByText('⚔️')).toBeInTheDocument(); // Level req icon
      expect(screen.getByText('💰')).toBeInTheDocument(); // Entry cost icon
      expect(screen.getByText('🏰')).toBeInTheDocument(); // Floors icon
      expect(screen.getByText('⭐')).toBeInTheDocument(); // Daily attempts icon
    });
  });

  describe('Dungeon Status and Availability', () => {
    beforeEach(async () => {
      renderWithProviders(<DungeonSelection />);
      await waitFor(() => {
        expect(screen.getByText('Goblin Caves')).toBeInTheDocument();
      });
    });

    it('should show available status for accessible dungeons', () => {
      expect(screen.getByText('Ready to enter')).toBeInTheDocument();
    });

    it('should enable enter button for available dungeons', () => {
      const enterButtons = screen.getAllByRole('button', { name: /enter dungeon/i });
      expect(enterButtons[0]).not.toBeDisabled(); // Goblin caves should be available
    });

    it('should show locked status for level-locked dungeons', async () => {
      const lowLevelCharacter = {
        ...mockCharacter,
        level: 3
      };
      
      mockAuthService.getProfile.mockResolvedValue({
        ...mockProfileData,
        character: lowLevelCharacter
      });
      
      renderWithProviders(<DungeonSelection />);
      
      await waitFor(() => {
        expect(screen.getByText('Requires level 5')).toBeInTheDocument();
      });
    });

    it('should disable enter button for level-locked dungeons', async () => {
      const lowLevelCharacter = {
        ...mockCharacter,
        level: 3
      };
      
      mockAuthService.getProfile.mockResolvedValue({
        ...mockProfileData,
        character: lowLevelCharacter
      });
      
      renderWithProviders(<DungeonSelection />);
      
      await waitFor(() => {
        const lockedButtons = screen.getAllByRole('button', { name: /locked/i });
        expect(lockedButtons.length).toBeGreaterThan(0);
      });
    });

    it('should show locked status for insufficient gold', async () => {
      const poorProfile = {
        ...mockProfileData,
        currency: 25
      };
      
      mockAuthService.getProfile.mockResolvedValue(poorProfile);
      
      renderWithProviders(<DungeonSelection />);
      
      await waitFor(() => {
        expect(screen.getByText('Requires 50 gold')).toBeInTheDocument();
      });
    });

    it('should disable enter button for insufficient gold', async () => {
      const poorProfile = {
        ...mockProfileData,
        currency: 25
      };
      
      mockAuthService.getProfile.mockResolvedValue(poorProfile);
      
      renderWithProviders(<DungeonSelection />);
      
      await waitFor(() => {
        const lockedButtons = screen.getAllByRole('button', { name: /locked/i });
        expect(lockedButtons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Dungeon Entry', () => {
    beforeEach(async () => {
      renderWithProviders(<DungeonSelection />);
      await waitFor(() => {
        expect(screen.getByText('Goblin Caves')).toBeInTheDocument();
      });
    });

    it('should enter dungeon when enter button is clicked', async () => {
      const user = userEvent.setup();
      
      const enterButtons = screen.getAllByRole('button', { name: /enter dungeon/i });
      await user.click(enterButtons[0]);
      
      await waitFor(() => {
        expect(mockDungeonService.enterDungeon).toHaveBeenCalledWith(
          mockUser.id,
          'goblin-caves',
          mockCharacter,
          expect.objectContaining({
            player_id: mockUser.id,
            currency: 1000
          })
        );
      });
    });

    it('should navigate to dungeon run page after successful entry', async () => {
      const user = userEvent.setup();
      
      const enterButtons = screen.getAllByRole('button', { name: /enter dungeon/i });
      await user.click(enterButtons[0]);
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dungeon-run', {
          state: {
            run: expect.objectContaining({
              run_id: 'test-run-1',
              dungeon_id: 'goblin-caves'
            }),
            dungeon: expect.objectContaining({
              dungeon_id: 'goblin-caves',
              name: 'Goblin Caves'
            }),
            character: mockCharacter,
            inventory: expect.objectContaining({
              player_id: mockUser.id,
              currency: 950
            })
          }
        });
      });
    });

    it('should display error message when dungeon entry fails', async () => {
      const user = userEvent.setup();
      mockDungeonService.enterDungeon.mockRejectedValue({ error: 'Cannot enter dungeon' });
      
      const enterButtons = screen.getAllByRole('button', { name: /enter dungeon/i });
      await user.click(enterButtons[0]);
      
      await waitFor(() => {
        expect(screen.getByText('Cannot enter dungeon')).toBeInTheDocument();
      });
    });

    it('should handle missing character data gracefully', async () => {
      const profileWithoutCharacter = {
        ...mockProfileData,
        character: null
      };
      
      mockAuthService.getProfile.mockResolvedValue(profileWithoutCharacter);
      
      renderWithProviders(<DungeonSelection />);
      
      await waitFor(() => {
        expect(screen.getByText('Character data required')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    beforeEach(async () => {
      renderWithProviders(<DungeonSelection />);
      await waitFor(() => {
        expect(screen.getByText('🏛️ Dungeon Selection')).toBeInTheDocument();
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
      renderWithProviders(<DungeonSelection />);
      await waitFor(() => {
        expect(screen.getByText('🏛️ Dungeon Selection')).toBeInTheDocument();
      });
    });

    it('should have proper heading structure', () => {
      expect(screen.getByRole('heading', { name: '🏛️ Dungeon Selection' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Welcome, TestUser' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Goblin Caves' })).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: 'Shadow Realm' })).toBeInTheDocument();
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
      // Should focus on first interactive element
    });

    it('should have ARIA labels for dungeon cards', () => {
      const dungeonCards = screen.getAllByRole('article');
      dungeonCards.forEach(card => {
        expect(card).toHaveAttribute('aria-label') || 
               expect(card.closest('[aria-label]')).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    beforeEach(async () => {
      renderWithProviders(<DungeonSelection />);
      await waitFor(() => {
        expect(screen.getByText('🏛️ Dungeon Selection')).toBeInTheDocument();
      });
    });

    it('should render correctly on mobile', () => {
      window.innerWidth = 375;
      
      expect(screen.getByText('🏛️ Dungeon Selection')).toBeInTheDocument();
      expect(screen.getByText('Goblin Caves')).toBeInTheDocument();
    });

    it('should render correctly on tablet', () => {
      window.innerWidth = 768;
      
      expect(screen.getByText('🏛️ Dungeon Selection')).toBeInTheDocument();
      expect(screen.getByText('Goblin Caves')).toBeInTheDocument();
    });

    it('should render correctly on desktop', () => {
      window.innerWidth = 1024;
      
      expect(screen.getByText('🏛️ Dungeon Selection')).toBeInTheDocument();
      expect(screen.getByText('Goblin Caves')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty dungeon list gracefully', async () => {
      mockDungeonService.getDungeons.mockResolvedValue({ dungeons: [] });
      
      renderWithProviders(<DungeonSelection />);
      
      await waitFor(() => {
        expect(screen.getByText('🏛️ Dungeon Selection')).toBeInTheDocument();
        expect(screen.queryByText('Goblin Caves')).not.toBeInTheDocument();
      });
    });

    it('should handle dungeons with missing properties gracefully', async () => {
      const incompleteDungeons = [
        {
          dungeon_id: 'incomplete-1',
          name: 'Incomplete Dungeon',
          // Missing other properties
        }
      ];
      
      mockDungeonService.getDungeons.mockResolvedValue({
        dungeons: incompleteDungeons
      });
      
      renderWithProviders(<DungeonSelection />);
      
      await waitFor(() => {
        expect(screen.getByText('Incomplete Dungeon')).toBeInTheDocument();
      });
    });

    it('should handle very large dungeon list efficiently', async () => {
      const largeDungeonList = Array.from({ length: 50 }, (_, i) => ({
        ...dungeonsWithRequirements[0],
        dungeon_id: `dungeon-${i}`,
        name: `Dungeon ${i}`
      }));
      
      mockDungeonService.getDungeons.mockResolvedValue({
        dungeons: largeDungeonList
      });
      
      renderWithProviders(<DungeonSelection />);
      
      await waitFor(() => {
        expect(screen.getByText('Dungeon 0')).toBeInTheDocument();
        expect(screen.getByText('Dungeon 49')).toBeInTheDocument();
      });
    });
  });
});
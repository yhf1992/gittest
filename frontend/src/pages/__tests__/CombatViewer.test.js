import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CombatViewer from '../CombatViewer';
import { renderWithProviders } from '../test/utils';
import { mockCombatService, mockAuthService, mockUser, mockMonsters, mockCombatResult } from '../test/mocks';

// Mock the API services
vi.mock('../services/api', async () => {
  const actual = await vi.importActual('../services/api');
  return {
    ...actual,
    combatService: {
      ...mockCombatService
    },
    authService: {
      ...mockAuthService
    }
  };
});

// Mock react-router-dom
const mockNavigate = vi.fn();
const mockLocation = { state: { monster: mockMonsters[0] } };

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation
  };
});

describe('CombatViewer Page', () => {
  const mockCharacter = {
    character_id: 'player-1',
    name: 'TestPlayer',
    character_class: 'Warrior',
    level: 10,
    max_hp: 500,
    attack: 75,
    defense: 50,
    speed: 60,
    element: 'Fire'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    
    mockAuthService.getProfile.mockResolvedValue({
      character: mockCharacter
    });
    
    mockCombatService.simulateCombat.mockResolvedValue(mockCombatResult);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Initial Loading and Setup', () => {
    it('should show loading state while fetching data', () => {
      mockAuthService.getProfile.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      renderWithProviders(<CombatViewer />);
      
      expect(screen.getByText('Preparing for battle...')).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should redirect to monster selection if no monster is provided', () => {
      mockLocation.state = null;
      
      renderWithProviders(<CombatViewer />);
      
      expect(mockNavigate).toHaveBeenCalledWith('/monster-selection');
    });

    it('should load player data and start combat on mount', async () => {
      renderWithProviders(<CombatViewer />);
      
      await waitFor(() => {
        expect(mockAuthService.getProfile).toHaveBeenCalled();
        expect(mockCombatService.simulateCombat).toHaveBeenCalledWith(
          expect.objectContaining({
            character_id: mockCharacter.character_id,
            name: mockCharacter.name
          }),
          expect.objectContaining({
            character_id: mockMonsters[0].monster_id,
            name: mockMonsters[0].name
          })
        );
      });
    });

    it('should display error message when combat simulation fails', async () => {
      mockCombatService.simulateCombat.mockRejectedValue({ error: 'Combat failed' });
      
      renderWithProviders(<CombatViewer />);
      
      await waitFor(() => {
        expect(screen.getByText('Combat failed')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /back to monster selection/i })).toBeInTheDocument();
      });
    });
  });

  describe('Combat Arena Display', () => {
    beforeEach(async () => {
      renderWithProviders(<CombatViewer />);
      await waitFor(() => {
        expect(screen.getByText('Combat Arena')).toBeInTheDocument();
      });
    });

    it('should display both combatants correctly', () => {
      expect(screen.getByText(mockCharacter.name)).toBeInTheDocument();
      expect(screen.getByText(`Lv. ${mockCharacter.level}`)).toBeInTheDocument();
      expect(screen.getByText(mockMonsters[0].name)).toBeInTheDocument();
      expect(screen.getByText(`Lv. ${mockMonsters[0].level}`)).toBeInTheDocument();
    });

    it('should show VS indicator between combatants', () => {
      expect(screen.getByText('⚔️')).toBeInTheDocument();
    });

    it('should display combatant avatars', () => {
      expect(screen.getByText('👤')).toBeInTheDocument(); // Player avatar
      expect(screen.getByText('👹')).toBeInTheDocument(); // Enemy avatar
    });
  });

  describe('Combat Playback Controls', () => {
    beforeEach(async () => {
      renderWithProviders(<CombatViewer />);
      await waitFor(() => {
        expect(screen.getByText('Combat Arena')).toBeInTheDocument();
      });
    });

    it('should have play/pause controls', () => {
      expect(screen.getByRole('button', { name: /▶️ start combat/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /⏸️ pause/i })).not.toBeInTheDocument();
    });

    it('should start combat playback when play button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CombatViewer />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /▶️ start combat/i })).toBeInTheDocument();
      });
      
      await user.click(screen.getByRole('button', { name: /▶️ start combat/i }));
      
      expect(screen.getByRole('button', { name: /⏸️ pause/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /▶️ start combat/i })).not.toBeInTheDocument();
    });

    it('should pause combat when pause button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CombatViewer />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /▶️ start combat/i })).toBeInTheDocument();
      });
      
      // Start combat
      await user.click(screen.getByRole('button', { name: /▶️ start combat/i }));
      
      // Pause combat
      await user.click(screen.getByRole('button', { name: /⏸️ pause/i }));
      
      expect(screen.getByRole('button', { name: /▶️ resume/i })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /⏸️ pause/i })).not.toBeInTheDocument();
    });

    it('should have replay button', () => {
      expect(screen.getByRole('button', { name: /🔄 replay/i })).toBeInTheDocument();
    });

    it('should restart combat when replay button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CombatViewer />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /🔄 replay/i })).toBeInTheDocument();
      });
      
      await user.click(screen.getByRole('button', { name: /🔄 replay/i }));
      
      // Should start playing from the beginning
      expect(screen.getByRole('button', { name: /⏸️ pause/i })).toBeInTheDocument();
    });
  });

  describe('Speed Controls', () => {
    beforeEach(async () => {
      renderWithProviders(<CombatViewer />);
      await waitFor(() => {
        expect(screen.getByText('Combat Arena')).toBeInTheDocument();
      });
    });

    it('should have speed control buttons', () => {
      expect(screen.getByRole('button', { name: /slow/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /normal/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /fast/i })).toBeInTheDocument();
    });

    it('should highlight active speed button', () => {
      expect(screen.getByRole('button', { name: /normal/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /slow/i })).not.toBeDisabled();
      expect(screen.getByRole('button', { name: /fast/i })).not.toBeDisabled();
    });

    it('should change combat speed when speed button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<CombatViewer />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /slow/i })).toBeInTheDocument();
      });
      
      await user.click(screen.getByRole('button', { name: /slow/i }));
      
      expect(screen.getByRole('button', { name: /slow/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /normal/i })).not.toBeDisabled();
    });
  });

  describe('Combat Log Display', () => {
    const detailedCombatResult = {
      ...mockCombatResult,
      turns: [
        {
          turn_number: 1,
          actor_id: 'player-1',
          actions: [
            {
              actor_id: 'player-1',
              action_type: 'attack',
              damage_dealt: 25,
              is_crit: false,
              is_miss: false
            }
          ],
          actor_status_after: {
            current_hp: 500,
            max_hp: 500,
            status_effects: []
          },
          target_status_after: {
            current_hp: 75,
            max_hp: 100,
            status_effects: []
          }
        },
        {
          turn_number: 2,
          actor_id: 'goblin-1',
          actions: [
            {
              actor_id: 'goblin-1',
              action_type: 'attack',
              damage_dealt: 15,
              is_crit: false,
              is_miss: false
            }
          ],
          actor_status_after: {
            current_hp: 75,
            max_hp: 100,
            status_effects: []
          },
          target_status_after: {
            current_hp: 485,
            max_hp: 500,
            status_effects: []
          }
        }
      ]
    };

    beforeEach(async () => {
      mockCombatService.simulateCombat.mockResolvedValue(detailedCombatResult);
      renderWithProviders(<CombatViewer />);
      await waitFor(() => {
        expect(screen.getByText('Combat Arena')).toBeInTheDocument();
      });
    });

    it('should display turn information correctly', async () => {
      const user = userEvent.setup();
      
      // Start combat to show first turn
      await user.click(screen.getByRole('button', { name: /▶️ start combat/i }));
      
      // Fast forward through the timer
      vi.advanceTimersByTime(1000);
      
      await waitFor(() => {
        expect(screen.getByText('Turn 1')).toBeInTheDocument();
      });
    });

    it('should show HP bars for both combatants', async () => {
      const user = userEvent.setup();
      
      await user.click(screen.getByRole('button', { name: /▶️ start combat/i }));
      vi.advanceTimersByTime(1000);
      
      await waitFor(() => {
        expect(screen.getByText('500 / 500')).toBeInTheDocument(); // Player HP
        expect(screen.getByText('75 / 100')).toBeInTheDocument(); // Enemy HP
      });
    });

    it('should display damage numbers correctly', async () => {
      const user = userEvent.setup();
      
      await user.click(screen.getByRole('button', { name: /▶️ start combat/i }));
      vi.advanceTimersByTime(1000);
      
      await waitFor(() => {
        expect(screen.getByText('-25 HP')).toBeInTheDocument();
      });
    });

    it('should handle critical hits', async () => {
      const combatWithCrit = {
        ...detailedCombatResult,
        turns: [
          {
            ...detailedCombatResult.turns[0],
            actions: [
              {
                ...detailedCombatResult.turns[0].actions[0],
                damage_dealt: 50,
                is_crit: true
              }
            ]
          }
        ]
      };
      mockCombatService.simulateCombat.mockResolvedValue(combatWithCrit);
      
      renderWithProviders(<CombatViewer />);
      
      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: /▶️ start combat/i }));
      vi.advanceTimersByTime(1000);
      
      await waitFor(() => {
        expect(screen.getByText('CRITICAL!')).toBeInTheDocument();
        expect(screen.getByText('-50 HP')).toBeInTheDocument();
      });
    });

    it('should handle missed attacks', async () => {
      const combatWithMiss = {
        ...detailedCombatResult,
        turns: [
          {
            ...detailedCombatResult.turns[0],
            actions: [
              {
                ...detailedCombatResult.turns[0].actions[0],
                damage_dealt: 0,
                is_miss: true
              }
            ]
          }
        ]
      };
      mockCombatService.simulateCombat.mockResolvedValue(combatWithMiss);
      
      renderWithProviders(<CombatViewer />);
      
      const user = userEvent.setup();
      await user.click(screen.getByRole('button', { name: /▶️ start combat/i }));
      vi.advanceTimersByTime(1000);
      
      await waitFor(() => {
        expect(screen.getByText('❌ MISS!')).toBeInTheDocument();
      });
    });
  });

  describe('Status Effects', () => {
    const combatWithStatusEffects = {
      ...mockCombatResult,
      turns: [
        {
          turn_number: 1,
          actor_id: 'player-1',
          actions: [
            {
              actor_id: 'player-1',
              action_type: 'attack',
              damage_dealt: 25,
              is_crit: false,
              is_miss: false,
              status_effects_applied: [
                { effect_type: 'stun', duration: 2 },
                { effect_type: 'defense_debuff', duration: 3 }
              ]
            }
          ],
          actor_status_after: {
            current_hp: 500,
            max_hp: 500,
            status_effects: [
              { effect_type: 'attack_buff', duration: 2 }
            ]
          },
          target_status_after: {
            current_hp: 75,
            max_hp: 100,
            status_effects: [
              { effect_type: 'stun', duration: 2 },
              { effect_type: 'defense_debuff', duration: 3 }
            ]
          }
        }
      ]
    };

    beforeEach(async () => {
      mockCombatService.simulateCombat.mockResolvedValue(combatWithStatusEffects);
      renderWithProviders(<CombatViewer />);
      await waitFor(() => {
        expect(screen.getByText('Combat Arena')).toBeInTheDocument();
      });
    });

    it('should display applied status effects', async () => {
      const user = userEvent.setup();
      
      await user.click(screen.getByRole('button', { name: /▶️ start combat/i }));
      vi.advanceTimersByTime(1000);
      
      await waitFor(() => {
        expect(screen.getByText('😵 Stunned')).toBeInTheDocument();
        expect(screen.getByText('🛡️💥 Defense Down')).toBeInTheDocument();
      });
    });

    it('should show active status effect badges', async () => {
      const user = userEvent.setup();
      
      await user.click(screen.getByRole('button', { name: /▶️ start combat/i }));
      vi.advanceTimersByTime(1000);
      
      await waitFor(() => {
        expect(screen.getByText('⚔️✨')).toBeInTheDocument(); // Attack buff icon
      });
    });
  });

  describe('Combat Results', () => {
    const victoryResult = {
      winner_id: 'player-1',
      total_turns: 3,
      turns: [
        {
          turn_number: 1,
          actor_id: 'player-1',
          actions: [{ actor_id: 'player-1', action_type: 'attack', damage_dealt: 50 }],
          actor_status_after: { current_hp: 500, max_hp: 500, status_effects: [] },
          target_status_after: { current_hp: 50, max_hp: 100, status_effects: [] }
        },
        {
          turn_number: 2,
          actor_id: 'goblin-1',
          actions: [{ actor_id: 'goblin-1', action_type: 'attack', damage_dealt: 10 }],
          actor_status_after: { current_hp: 50, max_hp: 100, status_effects: [] },
          target_status_after: { current_hp: 490, max_hp: 500, status_effects: [] }
        },
        {
          turn_number: 3,
          actor_id: 'player-1',
          actions: [{ actor_id: 'player-1', action_type: 'attack', damage_dealt: 50 }],
          actor_status_after: { current_hp: 490, max_hp: 500, status_effects: [] },
          target_status_after: { current_hp: 0, max_hp: 100, status_effects: [] }
        }
      ]
    };

    const defeatResult = {
      ...victoryResult,
      winner_id: 'goblin-1'
    };

    it('should display victory result correctly', async () => {
      mockCombatService.simulateCombat.mockResolvedValue(victoryResult);
      renderWithProviders(<CombatViewer />);
      
      const user = userEvent.setup();
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /▶️ start combat/i })).toBeInTheDocument();
      });
      
      // Play through all turns
      await user.click(screen.getByRole('button', { name: /▶️ start combat/i }));
      
      // Fast forward through all turns
      for (let i = 0; i < 3; i++) {
        vi.advanceTimersByTime(1000);
      }
      
      await waitFor(() => {
        expect(screen.getByText('🎉 VICTORY!')).toBeInTheDocument();
        expect(screen.getByText('Total Turns:')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
        expect(screen.getByText('Experience Gained:')).toBeInTheDocument();
        expect(screen.getByText(/\+ \d+ XP/)).toBeInTheDocument();
      });
    });

    it('should display defeat result correctly', async () => {
      mockCombatService.simulateCombat.mockResolvedValue(defeatResult);
      renderWithProviders(<CombatViewer />);
      
      const user = userEvent.setup();
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /▶️ start combat/i })).toBeInTheDocument();
      });
      
      await user.click(screen.getByRole('button', { name: /▶️ start combat/i }));
      
      for (let i = 0; i < 3; i++) {
        vi.advanceTimersByTime(1000);
      }
      
      await waitFor(() => {
        expect(screen.getByText('💀 DEFEAT')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    beforeEach(async () => {
      renderWithProviders(<CombatViewer />);
      await waitFor(() => {
        expect(screen.getByText('Combat Arena')).toBeInTheDocument();
      });
    });

    it('should navigate back to monster selection when back button is clicked', async () => {
      const user = userEvent.setup();
      
      await user.click(screen.getByRole('button', { name: /← back/i }));
      
      expect(mockNavigate).toHaveBeenCalledWith('/monster-selection');
    });
  });

  describe('Accessibility', () => {
    beforeEach(async () => {
      renderWithProviders(<CombatViewer />);
      await waitFor(() => {
        expect(screen.getByText('Combat Arena')).toBeInTheDocument();
      });
    });

    it('should have proper heading structure', () => {
      expect(screen.getByRole('heading', { name: 'Combat Arena' })).toBeInTheDocument();
    });

    it('should have accessible buttons', () => {
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAccessibleName();
      });
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      
      // Test Tab navigation through controls
      await user.tab();
      expect(screen.getByRole('button', { name: /← back/i })).toHaveFocus();
      
      await user.tab();
      expect(screen.getByRole('button', { name: /slow/i })).toHaveFocus();
    });

    it('should have ARIA labels for progress indicators', () => {
      // Check that HP bars have proper accessibility attributes
      const hpBars = screen.getAllByRole('progressbar');
      hpBars.forEach(bar => {
        expect(bar).toHaveAttribute('aria-label') || 
               expect(bar).toHaveAttribute('aria-labelledby');
      });
    });
  });

  describe('Responsive Design', () => {
    beforeEach(async () => {
      renderWithProviders(<CombatViewer />);
      await waitFor(() => {
        expect(screen.getByText('Combat Arena')).toBeInTheDocument();
      });
    });

    it('should render correctly on mobile', () => {
      window.innerWidth = 375;
      
      expect(screen.getByText('Combat Arena')).toBeInTheDocument();
      expect(screen.getByText(mockCharacter.name)).toBeInTheDocument();
      expect(screen.getByText(mockMonsters[0].name)).toBeInTheDocument();
    });

    it('should render correctly on tablet', () => {
      window.innerWidth = 768;
      
      expect(screen.getByText('Combat Arena')).toBeInTheDocument();
      expect(screen.getByText(mockCharacter.name)).toBeInTheDocument();
      expect(screen.getByText(mockMonsters[0].name)).toBeInTheDocument();
    });

    it('should render correctly on desktop', () => {
      window.innerWidth = 1024;
      
      expect(screen.getByText('Combat Arena')).toBeInTheDocument();
      expect(screen.getByText(mockCharacter.name)).toBeInTheDocument();
      expect(screen.getByText(mockMonsters[0].name)).toBeInTheDocument();
    });
  });
});
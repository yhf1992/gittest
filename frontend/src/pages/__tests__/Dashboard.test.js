import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dashboard from '../Dashboard';
import { renderWithProviders } from '../test/utils';
import { mockAuthService, mockUser } from '../test/mocks';

// Mock the API services
vi.mock('../services/api', async () => {
  const actual = await vi.importActual('../services/api');
  return {
    ...actual,
    authService: {
      ...mockAuthService
    }
  };
});

// Mock the useAuth hook
vi.mock('../services/AuthContext', async () => {
  const actual = await vi.importActual('../services/AuthContext');
  return {
    ...actual,
    useAuth: () => ({
      user: mockUser,
      logout: vi.fn()
    })
  };
});

describe('Dashboard Page', () => {
  const mockNavigate = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock react-router-dom's useNavigate
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
    it('should show loading spinner while fetching data', () => {
      mockAuthService.getProfile.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      renderWithProviders(<Dashboard />);
      
      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error message when API call fails', async () => {
      mockAuthService.getProfile.mockRejectedValue({ error: 'Failed to load profile' });
      
      renderWithProviders(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load profile')).toBeInTheDocument();
      });
      
      expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
    });

    it('should display generic error message when no specific error provided', async () => {
      mockAuthService.getProfile.mockRejectedValue(new Error('Network error'));
      
      renderWithProviders(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Failed to load dashboard data')).toBeInTheDocument();
      });
    });
  });

  describe('Successful Data Loading', () => {
    const mockProfileData = {
      user: mockUser,
      character: {
        name: 'Test Character',
        cultivation_level: 'Foundation Building',
        level: 10,
        max_hp: 500,
        attack: 75,
        defense: 50,
        speed: 60,
        character_class: 'Warrior',
        experience: 1500
      }
    };

    beforeEach(() => {
      mockAuthService.getProfile.mockResolvedValue(mockProfileData);
    });

    it('should display user information correctly', async () => {
      renderWithProviders(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Welcome, TestUser')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Test Character')).toBeInTheDocument();
      expect(screen.getByText('Foundation Building')).toBeInTheDocument();
    });

    it('should display character stats correctly', async () => {
      renderWithProviders(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('10')).toBeInTheDocument(); // Level
      });
      
      expect(screen.getByText('500')).toBeInTheDocument(); // HP
      expect(screen.getByText('75')).toBeInTheDocument(); // Attack
      expect(screen.getByText('50')).toBeInTheDocument(); // Defense
      expect(screen.getByText('60')).toBeInTheDocument(); // Speed
      expect(screen.getByText('Warrior')).toBeInTheDocument(); // Class
    });

    it('should display experience progress correctly', async () => {
      renderWithProviders(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Cultivation Progress')).toBeInTheDocument();
      });
      
      // Check that experience bar is rendered
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.getByText(/EXP/i)).toBeInTheDocument();
    });

    it('should display quick action buttons', async () => {
      renderWithProviders(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /⚔️ fight monster/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /🛡️ view equipment/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /🏛️ enter dungeon/i })).toBeInTheDocument();
      });
    });

    it('should handle missing character data gracefully', async () => {
      const profileWithoutCharacter = {
        user: mockUser,
        character: null
      };
      mockAuthService.getProfile.mockResolvedValue(profileWithoutCharacter);
      
      renderWithProviders(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Welcome, TestUser')).toBeInTheDocument();
      });
      
      expect(screen.getByText('TestUser')).toBeInTheDocument(); // Fallback to username
      expect(screen.getByText('练气')).toBeInTheDocument(); // Default cultivation level
      
      // Stats should not be displayed
      expect(screen.queryByText('Level')).not.toBeInTheDocument();
      expect(screen.queryByText('HP')).not.toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    const mockProfileData = {
      user: mockUser,
      character: {
        name: 'Test Character',
        cultivation_level: 'Foundation Building',
        level: 10,
        max_hp: 500,
        attack: 75,
        defense: 50,
        speed: 60,
        character_class: 'Warrior',
        experience: 1500
      }
    };

    beforeEach(() => {
      mockAuthService.getProfile.mockResolvedValue(mockProfileData);
    });

    it('should navigate to monster selection when fight button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /⚔️ fight monster/i })).toBeInTheDocument();
      });
      
      await user.click(screen.getByRole('button', { name: /⚔️ fight monster/i }));
      
      expect(mockNavigate).toHaveBeenCalledWith('/monster-selection');
    });

    it('should navigate to equipment page when equipment button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /🛡️ view equipment/i })).toBeInTheDocument();
      });
      
      await user.click(screen.getByRole('button', { name: /🛡️ view equipment/i }));
      
      expect(mockNavigate).toHaveBeenCalledWith('/equipment');
    });

    it('should navigate to dungeon page when dungeon button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /🏛️ enter dungeon/i })).toBeInTheDocument();
      });
      
      await user.click(screen.getByRole('button', { name: /🏛️ enter dungeon/i }));
      
      expect(mockNavigate).toHaveBeenCalledWith('/dungeons');
    });
  });

  describe('Logout Functionality', () => {
    const mockLogout = vi.fn();
    
    beforeEach(() => {
      vi.doMock('../services/AuthContext', async () => {
        const actual = await vi.importActual('../services/AuthContext');
        return {
          ...actual,
          useAuth: () => ({
            user: mockUser,
            logout: mockLogout
          })
        };
      });
      
      mockAuthService.getProfile.mockResolvedValue({
        user: mockUser,
        character: null
      });
    });

    it('should logout and navigate to login when logout button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
      });
      
      await user.click(screen.getByRole('button', { name: /logout/i }));
      
      expect(mockLogout).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  describe('Experience Calculation', () => {
    it('should calculate experience progress correctly', async () => {
      const profileWithSpecificExp = {
        user: mockUser,
        character: {
          name: 'Test Character',
          cultivation_level: 'Foundation Building',
          level: 5,
          max_hp: 500,
          attack: 75,
          defense: 50,
          speed: 60,
          character_class: 'Warrior',
          experience: 900 // Level 5 requires 1600 total exp (100 * 4^2 = 1600), so 900 is 50% progress
        }
      };
      mockAuthService.getProfile.mockResolvedValue(profileWithSpecificExp);
      
      renderWithProviders(<Dashboard />);
      
      await waitFor(() => {
        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toHaveStyle('width: 50%');
      });
    });

    it('should handle edge cases in experience calculation', async () => {
      const profileWithZeroExp = {
        user: mockUser,
        character: {
          name: 'Test Character',
          cultivation_level: 'Foundation Building',
          level: 1,
          max_hp: 500,
          attack: 75,
          defense: 50,
          speed: 60,
          character_class: 'Warrior',
          experience: 0
        }
      };
      mockAuthService.getProfile.mockResolvedValue(profileWithZeroExp);
      
      renderWithProviders(<Dashboard />);
      
      await waitFor(() => {
        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toHaveStyle('width: 0%');
      });
    });
  });

  describe('Accessibility', () => {
    const mockProfileData = {
      user: mockUser,
      character: {
        name: 'Test Character',
        cultivation_level: 'Foundation Building',
        level: 10,
        max_hp: 500,
        attack: 75,
        defense: 50,
        speed: 60,
        character_class: 'Warrior',
        experience: 1500
      }
    };

    beforeEach(() => {
      mockAuthService.getProfile.mockResolvedValue(mockProfileData);
    });

    it('should have proper heading structure', async () => {
      renderWithProviders(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: '仙侠 Combat Engine' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Test Character' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Quick Actions' })).toBeInTheDocument();
      });
    });

    it('should have accessible buttons', async () => {
      renderWithProviders(<Dashboard />);
      
      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        buttons.forEach(button => {
          expect(button).toHaveAccessibleName();
        });
      });
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /⚔️ fight monster/i })).toBeInTheDocument();
      });
      
      await user.tab();
      expect(screen.getByRole('button', { name: /logout/i })).toHaveFocus();
      
      await user.tab();
      expect(screen.getByRole('button', { name: /⚔️ fight monster/i })).toHaveFocus();
    });

    it('should have ARIA labels for progress bar', async () => {
      renderWithProviders(<Dashboard />);
      
      await waitFor(() => {
        const progressBar = screen.getByRole('progressbar');
        expect(progressBar).toHaveAttribute('aria-label') || 
               expect(progressBar).toHaveAttribute('aria-labelledby');
      });
    });
  });

  describe('Responsive Design', () => {
    const mockProfileData = {
      user: mockUser,
      character: {
        name: 'Test Character',
        cultivation_level: 'Foundation Building',
        level: 10,
        max_hp: 500,
        attack: 75,
        defense: 50,
        speed: 60,
        character_class: 'Warrior',
        experience: 1500
      }
    };

    beforeEach(() => {
      mockAuthService.getProfile.mockResolvedValue(mockProfileData);
    });

    it('should render correctly on mobile', async () => {
      window.innerWidth = 375;
      
      renderWithProviders(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Welcome, TestUser')).toBeInTheDocument();
      });
      
      expect(screen.getByRole('button', { name: /⚔️ fight monster/i })).toBeInTheDocument();
    });

    it('should render correctly on tablet', async () => {
      window.innerWidth = 768;
      
      renderWithProviders(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Welcome, TestUser')).toBeInTheDocument();
      });
      
      expect(screen.getByRole('button', { name: /⚔️ fight monster/i })).toBeInTheDocument();
    });

    it('should render correctly on desktop', async () => {
      window.innerWidth = 1024;
      
      renderWithProviders(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByText('Welcome, TestUser')).toBeInTheDocument();
      });
      
      expect(screen.getByRole('button', { name: /⚔️ fight monster/i })).toBeInTheDocument();
    });
  });
});
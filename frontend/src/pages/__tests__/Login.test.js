import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from '../Login';
import { renderWithoutAuth, mockApiResponse, mockApiError, fillAndSubmitForm } from '../../test/utils';
import { mockAuthService, mockUser } from '../../test/mocks';

// Mock the AuthContext
vi.mock('../../services/AuthContext', async () => {
  const actual = await vi.importActual('../../services/AuthContext');
  return {
    ...actual,
    useAuth: () => ({
      login: mockAuthService.login,
      register: mockAuthService.register,
    })
  };
});

describe('Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render login form by default', () => {
      renderWithoutAuth(<Login />);
      
      expect(screen.getByText('仙侠 Combat')).toBeInTheDocument();
      expect(screen.getByText('Begin Your Journey to Immortality')).toBeInTheDocument();
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /enter the realm/i })).toBeInTheDocument();
      expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
    });

    it('should render registration form when toggle is clicked', async () => {
      const user = userEvent.setup();
      renderWithoutAuth(<Login />);
      
      await user.click(screen.getByRole('button', { name: /create account/i }));
      
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /begin cultivation/i })).toBeInTheDocument();
    });

    it('should have proper form validation attributes', () => {
      renderWithoutAuth(<Login />);
      
      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/password/i);
      
      expect(usernameInput).toHaveAttribute('required');
      expect(passwordInput).toHaveAttribute('required');
      expect(passwordInput).toHaveAttribute('minLength', '6');
    });
  });

  describe('Login Functionality', () => {
    it('should successfully login with valid credentials', async () => {
      const user = userEvent.setup();
      mockAuthService.login.mockResolvedValue({
        token: 'test-token',
        user: mockUser
      });
      
      renderWithoutAuth(<Login />);
      
      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /enter the realm/i }));
      
      await waitFor(() => {
        expect(mockAuthService.login).toHaveBeenCalledWith('testuser', 'password123');
      });
      
      expect(screen.getByText('Login successful! Redirecting...')).toBeInTheDocument();
    });

    it('should show error message with invalid credentials', async () => {
      const user = userEvent.setup();
      mockAuthService.login.mockRejectedValue({
        error: 'Invalid username or password'
      });
      
      renderWithoutAuth(<Login />);
      
      await user.type(screen.getByLabelText(/username/i), 'wronguser');
      await user.type(screen.getByLabelText(/password/i), 'wrongpass');
      await user.click(screen.getByRole('button', { name: /enter the realm/i }));
      
      await waitFor(() => {
        expect(screen.getByText('Invalid username or password')).toBeInTheDocument();
      });
    });

    it('should show loading state during login', async () => {
      const user = userEvent.setup();
      mockAuthService.login.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      renderWithoutAuth(<Login />);
      
      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /enter the realm/i }));
      
      expect(screen.getByText('Logging in...')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('Registration Functionality', () => {
    it('should successfully register with valid data', async () => {
      const user = userEvent.setup();
      mockAuthService.register.mockResolvedValue({
        token: 'test-token',
        user: mockUser
      });
      
      renderWithoutAuth(<Login />);
      
      // Switch to registration form
      await user.click(screen.getByRole('button', { name: /create account/i }));
      
      await user.type(screen.getByLabelText(/username/i), 'newuser');
      await user.type(screen.getByLabelText(/email/i), 'newuser@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /begin cultivation/i }));
      
      await waitFor(() => {
        expect(mockAuthService.register).toHaveBeenCalledWith('newuser', 'newuser@example.com', 'password123');
      });
      
      expect(screen.getByText('Registration successful! Redirecting...')).toBeInTheDocument();
    });

    it('should show error message with invalid registration data', async () => {
      const user = userEvent.setup();
      mockAuthService.register.mockRejectedValue({
        error: 'Username already exists'
      });
      
      renderWithoutAuth(<Login />);
      
      await user.click(screen.getByRole('button', { name: /create account/i }));
      await user.type(screen.getByLabelText(/username/i), 'existinguser');
      await user.type(screen.getByLabelText(/email/i), 'existing@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /begin cultivation/i }));
      
      await waitFor(() => {
        expect(screen.getByText('Username already exists')).toBeInTheDocument();
      });
    });

    it('should show loading state during registration', async () => {
      const user = userEvent.setup();
      mockAuthService.register.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      
      renderWithoutAuth(<Login />);
      
      await user.click(screen.getByRole('button', { name: /create account/i }));
      await user.type(screen.getByLabelText(/username/i), 'newuser');
      await user.type(screen.getByLabelText(/email/i), 'newuser@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.click(screen.getByRole('button', { name: /begin cultivation/i }));
      
      expect(screen.getByText('Creating account...')).toBeInTheDocument();
      expect(screen.getByRole('button')).toBeDisabled();
    });
  });

  describe('Form Interaction', () => {
    it('should clear messages when user types in form', async () => {
      const user = userEvent.setup();
      mockAuthService.login.mockRejectedValue({ error: 'Login failed' });
      
      renderWithoutAuth(<Login />);
      
      // Trigger an error first
      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/password/i), 'wrongpass');
      await user.click(screen.getByRole('button', { name: /enter the realm/i }));
      
      await waitFor(() => {
        expect(screen.getByText('Login failed')).toBeInTheDocument();
      });
      
      // Type in username field
      await user.clear(screen.getByLabelText(/username/i));
      await user.type(screen.getByLabelText(/username/i), 'newuser');
      
      // Error message should be cleared
      expect(screen.queryByText('Login failed')).not.toBeInTheDocument();
    });

    it('should reset form when toggling between login and register', async () => {
      const user = userEvent.setup();
      
      renderWithoutAuth(<Login />);
      
      // Fill login form
      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      
      // Switch to registration
      await user.click(screen.getByRole('button', { name: /create account/i }));
      
      // Form should be reset
      expect(screen.getByLabelText(/username/i)).toHaveValue('');
      expect(screen.getByLabelText(/password/i)).toHaveValue('');
      expect(screen.getByLabelText(/email/i)).toHaveValue('');
      
      // Fill registration form
      await user.type(screen.getByLabelText(/username/i), 'newuser');
      await user.type(screen.getByLabelText(/email/i), 'newuser@example.com');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      
      // Switch back to login
      await user.click(screen.getByRole('button', { name: /sign in/i }));
      
      // Form should be reset again
      expect(screen.getByLabelText(/username/i)).toHaveValue('');
      expect(screen.getByLabelText(/password/i)).toHaveValue('');
      expect(screen.queryByLabelText(/email/i)).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      renderWithoutAuth(<Login />);
      
      // Check form labels
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      
      // Check button roles
      expect(screen.getByRole('button', { name: /enter the realm/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
      
      // Check heading structure
      expect(screen.getByRole('heading', { name: '仙侠 Combat' })).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      renderWithoutAuth(<Login />);
      
      // Tab through form elements
      await user.tab();
      expect(screen.getByLabelText(/username/i)).toHaveFocus();
      
      await user.tab();
      expect(screen.getByLabelText(/password/i)).toHaveFocus();
      
      await user.tab();
      expect(screen.getByRole('button', { name: /enter the realm/i })).toHaveFocus();
    });

    it('should support form submission with Enter key', async () => {
      const user = userEvent.setup();
      mockAuthService.login.mockResolvedValue({
        token: 'test-token',
        user: mockUser
      });
      
      renderWithoutAuth(<Login />);
      
      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/password/i), 'password123');
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(mockAuthService.login).toHaveBeenCalledWith('testuser', 'password123');
      });
    });
  });

  describe('Responsive Design', () => {
    it('should render correctly on mobile', () => {
      // Mock mobile viewport
      window.innerWidth = 375;
      
      renderWithoutAuth(<Login />);
      
      expect(screen.getByText('仙侠 Combat')).toBeInTheDocument();
      expect(screen.getByRole('form')).toBeInTheDocument();
    });

    it('should render correctly on tablet', () => {
      // Mock tablet viewport
      window.innerWidth = 768;
      
      renderWithoutAuth(<Login />);
      
      expect(screen.getByText('仙侠 Combat')).toBeInTheDocument();
      expect(screen.getByRole('form')).toBeInTheDocument();
    });

    it('should render correctly on desktop', () => {
      // Mock desktop viewport
      window.innerWidth = 1024;
      
      renderWithoutAuth(<Login />);
      
      expect(screen.getByText('仙侠 Combat')).toBeInTheDocument();
      expect(screen.getByRole('form')).toBeInTheDocument();
    });
  });
});
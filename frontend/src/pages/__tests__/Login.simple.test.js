import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from '../Login';

// Mock the services
const mockLogin = vi.fn();
const mockRegister = vi.fn();

vi.mock('../../services/AuthContext', () => ({
  useAuth: () => ({
    login: mockLogin,
    register: mockRegister,
  })
}));

describe('Login Page - Basic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render login form', () => {
    render(<Login />);
    
    expect(screen.getByText('仙侠 Combat')).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enter the realm/i })).toBeInTheDocument();
  });

  it('should show registration form when toggle is clicked', async () => {
    const user = userEvent.setup();
    render(<Login />);
    
    await user.click(screen.getByRole('button', { name: /create account/i }));
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /begin cultivation/i })).toBeInTheDocument();
  });
});
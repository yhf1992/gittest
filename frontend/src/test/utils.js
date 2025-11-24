import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

// Mock AuthContext for testing
const mockAuthContext = {
  token: 'test-token',
  user: { id: 'test-user', username: 'test' },
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  loading: false,
  isAuthenticated: true,
};

// Custom render function that includes providers
export const renderWithProviders = (
  ui,
  {
    initialEntries = ['/'],
    authState = mockAuthContext
  } = {}
) => {
  // Mock localStorage for auth state
  localStorage.setItem('xianxia_token', authState.token);
  localStorage.setItem('xianxia_user', JSON.stringify(authState.user));

  const Wrapper = ({ children }) => (
    <MemoryRouter initialEntries={initialEntries}>
      {children}
    </MemoryRouter>
  );

  return render(ui, { wrapper: Wrapper });
};

// Custom render function without auth (for login page)
export const renderWithoutAuth = (ui, { initialEntries = ['/'] } = {}) => {
  const Wrapper = ({ children }) => (
    <MemoryRouter initialEntries={initialEntries}>
      {children}
    </MemoryRouter>
  );

  return render(ui, { wrapper: Wrapper });
};

// Helper to wait for loading states
export const waitForLoading = () => new Promise(resolve => setTimeout(resolve, 0));

// Helper to mock responsive design
export const mockResponsive = (width) => {
  window.innerWidth = width;
  window.dispatchEvent(new Event('resize'));
};

// Helper to test accessibility
export const checkAccessibility = async (container) => {
  // Basic accessibility checks
  const buttons = container.querySelectorAll('button');
  buttons.forEach(button => {
    expect(button).toHaveAttribute('type');
  });

  const inputs = container.querySelectorAll('input');
  inputs.forEach(input => {
    expect(input).toHaveAttribute('aria-label') || 
           expect(input).toHaveAttribute('aria-labelledby') ||
           expect(input.closest('label')).toBeInTheDocument();
  });

  const images = container.querySelectorAll('img');
  images.forEach(img => {
    expect(img).toHaveAttribute('alt');
  });
};

// Helper to test keyboard navigation
export const testKeyboardNavigation = (container) => {
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  focusableElements.forEach((element, index) => {
    element.focus();
    expect(element).toHaveFocus();
    
    // Test Tab navigation
    if (index < focusableElements.length - 1) {
      fireEvent.keyDown(element, { key: 'Tab' });
      expect(focusableElements[index + 1]).toHaveFocus();
    }
  });
};

// Mock API responses
export const mockApiResponse = (data, status = 200) => {
  global.fetch.mockResolvedValueOnce({
    ok: true,
    status,
    json: () => Promise.resolve(data),
  });
};

export const mockApiError = (error, status = 400) => {
  global.fetch.mockResolvedValueOnce({
    ok: false,
    status,
    json: () => Promise.resolve({ error }),
  });
};

// Helper to simulate form submission
export const fillAndSubmitForm = async (formData, submitButton) => {
  for (const [name, value] of Object.entries(formData)) {
    const input = screen.getByLabelText(new RegExp(name, 'i')) || 
                  screen.getByPlaceholderText(new RegExp(name, 'i')) ||
                  screen.getByName(name);
    
    await userEvent.clear(input);
    await userEvent.type(input, value);
  }

  await userEvent.click(submitButton);
};
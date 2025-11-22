import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

// Mock fetch
global.fetch = vi.fn();

describe('App', () => {
  it('renders the main title', () => {
    render(<App />);
    expect(screen.getByText('Xianxia Mini-RPG')).toBeTruthy();
  });

  it('shows loading state initially', () => {
    render(<App />);
    expect(screen.getByText('Checking server status...')).toBeTruthy();
  });
});
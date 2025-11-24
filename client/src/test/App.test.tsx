import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

describe('App', () => {
  it('renders the component showcase', () => {
    render(<App />);
    expect(screen.getByText('Xianxia UI Component Library')).toBeInTheDocument();
  });

  it('displays all component sections', () => {
    render(<App />);
    expect(screen.getByText('RarityBadge')).toBeInTheDocument();
    expect(screen.getByText('StatusBadge')).toBeInTheDocument();
    expect(screen.getByText('StatDisplay')).toBeInTheDocument();
    expect(screen.getByText('EquipmentCard')).toBeInTheDocument();
    expect(screen.getByText('CombatLogEntry')).toBeInTheDocument();
  });

  it('displays responsive design section', () => {
    render(<App />);
    expect(screen.getByText('Responsive Design')).toBeInTheDocument();
  });
});

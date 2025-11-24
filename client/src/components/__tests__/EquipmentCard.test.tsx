import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EquipmentCard } from '../EquipmentCard';
import { Equipment, EquipmentSlot, ItemRarity } from '../../types/combat';

const mockEquipment: Equipment = {
  id: 'weapon-1',
  name: 'Heavenly Sword',
  slot: EquipmentSlot.WEAPON,
  rarity: ItemRarity.LEGENDARY,
  level: 50,
  attack: 100,
  defense: 20,
  hp: 50,
  speed: 10,
  special_effect: 'Deals extra fire damage',
};

describe('EquipmentCard', () => {
  it('renders equipment name and level', () => {
    render(<EquipmentCard equipment={mockEquipment} />);
    expect(screen.getByText('Heavenly Sword')).toBeInTheDocument();
    expect(screen.getByText('Level 50')).toBeInTheDocument();
  });

  it('displays equipment stats', () => {
    render(<EquipmentCard equipment={mockEquipment} />);
    expect(screen.getByText('+100')).toBeInTheDocument();
    expect(screen.getByText('+20')).toBeInTheDocument();
    expect(screen.getByText('+50')).toBeInTheDocument();
    expect(screen.getByText('+10')).toBeInTheDocument();
  });

  it('displays special effect', () => {
    render(<EquipmentCard equipment={mockEquipment} />);
    expect(screen.getByText('Deals extra fire damage')).toBeInTheDocument();
  });

  it('renders rarity badge', () => {
    render(<EquipmentCard equipment={mockEquipment} />);
    expect(screen.getByText('Legendary')).toBeInTheDocument();
  });

  it('shows equip button when not equipped', () => {
    render(<EquipmentCard equipment={mockEquipment} isEquipped={false} />);
    expect(screen.getByText('Equip')).toBeInTheDocument();
  });

  it('shows unequip button when equipped', () => {
    render(<EquipmentCard equipment={mockEquipment} isEquipped={true} />);
    expect(screen.getByText('Unequip')).toBeInTheDocument();
  });

  it('shows equipped indicator when equipped', () => {
    render(<EquipmentCard equipment={mockEquipment} isEquipped={true} />);
    expect(screen.getByText('⚡ Equipped')).toBeInTheDocument();
  });

  it('calls onClick when card is clicked', () => {
    const handleClick = vi.fn();
    render(<EquipmentCard equipment={mockEquipment} onClick={handleClick} />);
    fireEvent.click(screen.getByText('Heavenly Sword'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('calls onEquip when equip button is clicked', () => {
    const handleEquip = vi.fn();
    render(<EquipmentCard equipment={mockEquipment} onEquip={handleEquip} />);
    fireEvent.click(screen.getByText('Equip'));
    expect(handleEquip).toHaveBeenCalledTimes(1);
  });

  it('calls onUnequip when unequip button is clicked', () => {
    const handleUnequip = vi.fn();
    render(
      <EquipmentCard 
        equipment={mockEquipment} 
        isEquipped={true} 
        onUnequip={handleUnequip} 
      />
    );
    fireEvent.click(screen.getByText('Unequip'));
    expect(handleUnequip).toHaveBeenCalledTimes(1);
  });

  it('hides actions when showActions is false', () => {
    render(<EquipmentCard equipment={mockEquipment} showActions={false} />);
    expect(screen.queryByText('Equip')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <EquipmentCard equipment={mockEquipment} className="custom-class" />
    );
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('applies rarity CSS class', () => {
    const { container } = render(<EquipmentCard equipment={mockEquipment} />);
    expect(container.querySelector('.equipment-rarity-legendary')).toBeInTheDocument();
  });

  it('applies equipped CSS class when equipped', () => {
    const { container } = render(
      <EquipmentCard equipment={mockEquipment} isEquipped={true} />
    );
    expect(container.querySelector('.equipped')).toBeInTheDocument();
  });

  it('sets data-equipment-id attribute', () => {
    const { container } = render(<EquipmentCard equipment={mockEquipment} />);
    const card = container.querySelector('[data-equipment-id="weapon-1"]');
    expect(card).toBeInTheDocument();
  });

  it('renders weapon slot icon', () => {
    const { container } = render(<EquipmentCard equipment={mockEquipment} />);
    expect(container.querySelector('.equipment-slot-icon')).toHaveTextContent('⚔️');
  });

  it('renders armor slot icon', () => {
    const armorEquipment: Equipment = {
      ...mockEquipment,
      slot: EquipmentSlot.ARMOR,
    };
    const { container } = render(<EquipmentCard equipment={armorEquipment} />);
    expect(container.querySelector('.equipment-slot-icon')).toHaveTextContent('🛡️');
  });

  it('renders accessory slot icon', () => {
    const accessoryEquipment: Equipment = {
      ...mockEquipment,
      slot: EquipmentSlot.ACCESSORY,
    };
    const { container } = render(<EquipmentCard equipment={accessoryEquipment} />);
    expect(container.querySelector('.equipment-slot-icon')).toHaveTextContent('💍');
  });

  it('does not render stats section when equipment has no stats', () => {
    const noStatsEquipment: Equipment = {
      id: 'item-1',
      name: 'Simple Item',
      slot: EquipmentSlot.ACCESSORY,
      rarity: ItemRarity.COMMON,
      level: 1,
    };
    const { container } = render(<EquipmentCard equipment={noStatsEquipment} />);
    expect(container.querySelector('.equipment-stats')).not.toBeInTheDocument();
  });

  it('does not render special effect when not present', () => {
    const noEffectEquipment: Equipment = {
      ...mockEquipment,
      special_effect: undefined,
    };
    const { container } = render(<EquipmentCard equipment={noEffectEquipment} />);
    expect(container.querySelector('.equipment-special-effect')).not.toBeInTheDocument();
  });
});

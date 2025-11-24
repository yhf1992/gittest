# Xianxia UI Component Library

A collection of reusable React components with ancient cultivation/xianxia aesthetics for RPG games.

## 🎨 Theme System

The component library uses a comprehensive CSS variable-based theme system located in `/src/styles/theme.css`.

### Key Features
- Dark mystical backgrounds
- Gold and purple accent colors
- Rarity-based color coding
- Status effect color mapping
- Responsive breakpoints
- Ancient border effects

### Color Palette

#### Rarity Colors
- **Common**: Gray `#9e9e9e`
- **Uncommon**: Green `#4caf50`
- **Rare**: Blue `#2196f3`
- **Epic**: Purple `#9c27b0`
- **Legendary**: Orange `#ff9800` (with glow effect)

#### Status Effects
- **Stun**: `#f39c12`
- **DoT**: `#e74c3c`
- **Buff**: `#2ecc71`
- **Debuff**: `#c0392b`
- **Heal**: `#1abc9c`

## 📦 Components

### RarityBadge

Display item rarity with color-coded styling.

```tsx
import { RarityBadge } from './components';
import { ItemRarity } from './types/combat';

<RarityBadge rarity={ItemRarity.LEGENDARY} />
<RarityBadge rarity={ItemRarity.RARE} size="sm" />
<RarityBadge rarity={ItemRarity.EPIC} showLabel={false} />
```

**Props:**
- `rarity`: ItemRarity (required)
- `size`: 'sm' | 'md' | 'lg' (default: 'md')
- `showLabel`: boolean (default: true)
- `className`: string

### StatusBadge

Display status effects with icons, values, and duration.

```tsx
import { StatusBadge } from './components';
import { StatusEffectType } from './types/combat';

<StatusBadge 
  statusType={StatusEffectType.STUN} 
  duration={3} 
/>
<StatusBadge 
  statusType={StatusEffectType.DOT} 
  value={50} 
  duration={3}
  size="lg"
/>
```

**Props:**
- `statusType`: StatusEffectType (required)
- `value`: number
- `duration`: number
- `size`: 'sm' | 'md' | 'lg' (default: 'md')
- `showDetails`: boolean (default: true)
- `className`: string

### StatDisplay

Display character stats with icons and optional progress bars.

```tsx
import { StatDisplay } from './components';

<StatDisplay label="HP" value={850} maxValue={1000} />
<StatDisplay 
  label="Attack" 
  value={250} 
  variant="detailed"
  showPercentage
/>
<StatDisplay 
  label="Defense" 
  value={180} 
  icon="🛡️"
  color="#3498db"
/>
```

**Props:**
- `label`: string (required)
- `value`: number (required)
- `maxValue`: number
- `icon`: string
- `variant`: 'default' | 'compact' | 'detailed' (default: 'default')
- `showPercentage`: boolean (default: false)
- `color`: string (CSS color)
- `className`: string

### EquipmentCard

Display equipment with stats, rarity, and actions.

```tsx
import { EquipmentCard } from './components';

<EquipmentCard 
  equipment={{
    id: 'sword-1',
    name: 'Celestial Blade',
    slot: EquipmentSlot.WEAPON,
    rarity: ItemRarity.LEGENDARY,
    level: 75,
    attack: 250,
    defense: 50,
    hp: 100,
    speed: 30,
    special_effect: 'Summons celestial dragon'
  }}
  isEquipped={false}
  onEquip={() => handleEquip()}
  onUnequip={() => handleUnequip()}
  showActions={true}
/>
```

**Props:**
- `equipment`: Equipment (required)
- `onClick`: () => void
- `isEquipped`: boolean (default: false)
- `showActions`: boolean (default: true)
- `onEquip`: () => void
- `onUnequip`: () => void
- `className`: string

### CombatLogEntry

Display combat action with damage, effects, and animations.

```tsx
import { CombatLogEntry } from './components';

<CombatLogEntry 
  action={{
    turn: 5,
    attacker_name: 'Hero',
    defender_name: 'Monster',
    action_type: 'attack',
    damage: 350,
    is_crit: true,
    message: 'Critical strike!',
    status_effects_applied: [...]
  }}
  variant="default"
/>
```

**Props:**
- `action`: CombatAction (required)
- `variant`: 'default' | 'compact' (default: 'default')
- `className`: string

## 📱 Responsive Design

All components are fully responsive with three breakpoints:

- **Mobile**: < 640px
  - Compact layouts
  - Stacked components
  - Touch-friendly sizing

- **Tablet**: 641px - 1023px
  - Balanced layouts
  - Grid adjustments
  - Medium spacing

- **Desktop**: > 1024px
  - Full layouts
  - Maximum detail
  - Hover effects

## 🧪 Testing

All components have comprehensive test coverage using Vitest and React Testing Library.

Run tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm test -- --watch
```

## 📖 Usage Examples

See `src/stories/ComponentShowcase.tsx` for comprehensive usage examples and interactive demonstrations.

## 🎯 Best Practices

1. **Import theme CSS**: Always import `styles/theme.css` in your main entry point
2. **Use TypeScript types**: Import types from `types/combat.ts`
3. **Combine components**: Components work well together (e.g., StatusBadge inside CombatLogEntry)
4. **Custom styling**: Use `className` prop for additional styling
5. **Responsive testing**: Test on multiple screen sizes

## 🔧 Customization

### Override CSS Variables

```css
:root {
  --color-accent-gold: #your-color;
  --color-bg-primary: #your-bg;
  /* ... other variables */
}
```

### Extend Components

```tsx
import { EquipmentCard } from './components';

function CustomEquipmentCard(props) {
  return (
    <EquipmentCard 
      {...props}
      className="my-custom-class"
      onClick={() => {
        // Custom logic
        props.onClick?.();
      }}
    />
  );
}
```

## 📄 License

MIT

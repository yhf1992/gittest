# Xianxia Client - React Component Library

A complete xianxia-themed React component library for RPG games with ancient cultivation aesthetics.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Lint code
npm run lint
```

## 📦 Components

- **RarityBadge** - Color-coded item rarity indicators
- **StatusBadge** - Status effects with icons and details
- **StatDisplay** - Character stat displays with progress bars
- **EquipmentCard** - Equipment display with stats and actions
- **CombatLogEntry** - Combat action logs with animations

## 🎨 Theme

The component library features a comprehensive xianxia/cultivation theme:

- Dark mystical backgrounds
- Gold and purple accents
- Ancient UI aesthetics with corner decorations
- Rarity-based color coding
- Status effect color mapping
- Responsive design (mobile/tablet/desktop)

## 🧪 Testing

- **79 tests** passing (100% pass rate)
- Comprehensive coverage with Vitest + React Testing Library
- All components fully tested

## 📚 Documentation

- **Component Documentation**: `src/components/README.md`
- **Implementation Details**: `COMPONENT_LIBRARY_DOCUMENTATION.md`
- **Interactive Showcase**: Run `npm run dev` and visit the app

## 🎯 Features

✅ Fully typed with TypeScript  
✅ Responsive design (mobile/tablet/desktop)  
✅ CSS variables for easy theming  
✅ Comprehensive test coverage  
✅ Production-ready components  
✅ Interactive component showcase  
✅ Complete documentation  

## 🌐 View Components

Start the development server to see the interactive component showcase:

```bash
npm run dev
```

Then open http://localhost:5173 in your browser.

The showcase includes:
- Live component examples
- Code snippets
- Responsive design demos
- Usage documentation

## 🔧 Tech Stack

- React 18.2.0
- TypeScript 5.2.2
- Vite 4.5.0
- Vitest 0.34.6
- React Testing Library

## 📂 Project Structure

```
client/
├── src/
│   ├── components/         # Reusable components
│   │   ├── __tests__/     # Component tests
│   │   ├── *.tsx          # Component implementations
│   │   └── *.css          # Component styles
│   ├── stories/           # Component showcase
│   ├── styles/            # Global theme
│   ├── types/             # TypeScript types
│   └── test/              # Test configuration
├── package.json
└── README.md
```

## 🎨 Customization

Override CSS variables to customize the theme:

```css
:root {
  --color-accent-gold: #your-gold;
  --color-bg-primary: #your-background;
  /* ... other variables */
}
```

See `src/styles/theme.css` for all available variables.

## 📊 Metrics

- **Components**: 5
- **Tests**: 79 passing
- **Bundle Size**: 162.72 kB (51.90 kB gzipped)
- **TypeScript Errors**: 0
- **Lint Errors**: 0

## 📖 Usage

Import components:

```tsx
import { 
  RarityBadge, 
  StatusBadge, 
  StatDisplay, 
  EquipmentCard, 
  CombatLogEntry 
} from './components';

import { 
  ItemRarity, 
  StatusEffectType, 
  Equipment, 
  CombatAction 
} from './types/combat';
```

See component documentation for detailed API reference and examples.

## ✨ Highlights

- Ancient cultivation aesthetics
- Legendary items with animated glow
- Status effects with emoji icons
- Animated progress bars
- Smooth slide-in animations
- Interactive hover effects
- Rarity-based borders and colors
- Fully responsive design

## 🤝 Contributing

When adding new components:

1. Create component file in `src/components/`
2. Create matching CSS file
3. Add TypeScript types to `src/types/combat.ts`
4. Create test file in `src/components/__tests__/`
5. Update `src/components/index.ts` exports
6. Document in `src/components/README.md`
7. Add example to `ComponentShowcase.tsx`

## 📝 License

MIT

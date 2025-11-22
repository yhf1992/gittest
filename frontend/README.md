# Xianxia Combat Engine Frontend

## Setup Instructions

### Backend Setup

1. **Install Python Dependencies:**
```bash
cd /home/engine/project
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

2. **Start the Backend Server:**
```bash
source venv/bin/activate
python app.py
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. **Install Node.js Dependencies:**
```bash
cd /home/engine/project/frontend
npm install
```

2. **Start the Frontend Development Server:**
```bash
npm start
```

The frontend will run on `http://localhost:3000`

## Features

### Authentication System
- User registration and login
- JWT token-based authentication
- Session persistence with localStorage
- Automatic token refresh and validation

### Dashboard Features
- User profile with cultivation level (练气→渡劫)
- Character stats display (HP, Attack, Defense, Speed)
- Experience bar with level progression
- Quick action buttons for combat, equipment, and dungeons
- Xianxia-themed dark UI with ancient Chinese styling

### API Endpoints

#### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /auth/profile` - Get user profile (protected)
- `GET /auth/cultivation-levels` - Get cultivation levels

#### Combat System
- `POST /combat/simulate` - Simulate combat
- `GET /combat/character-classes` - Get character classes
- `GET /combat/elements` - Get elements

#### Equipment System
- `POST /equipment/generate` - Generate equipment
- `GET /equipment/slots` - Get equipment slots
- `GET /equipment/rarities` - Get rarity tiers

#### Inventory Management
- `POST /inventory/create` - Create inventory
- `POST /inventory/equip` - Equip item
- `POST /inventory/unequip` - Unequip item
- `GET /inventory/stats` - Get total stats

#### Loot System
- `POST /loot/roll` - Roll for loot
- `GET /loot/tables` - Get loot tables
- `GET /loot/monster-tiers` - Get monster tiers

#### Dungeon System
- `GET /dungeons` - List dungeons
- `GET /dungeons/{id}` - Get dungeon info
- `POST /dungeons/enter` - Enter dungeon
- `POST /dungeons/complete` - Complete dungeon
- `GET /dungeons/difficulties` - Get difficulties

## Xianxia Theme

The frontend features a dark, mystical theme inspired by ancient Chinese cultivation novels:

- **Color Scheme:** Dark backgrounds with gold accents
- **Typography:** Noto Serif SC and Cinzel fonts for an ancient feel
- **Visual Elements:** Subtle animations, glowing effects, and traditional symbols
- **Cultivation Levels:** 练气 → 筑基 → 金丹 → 元婴 → 化神 → 渡劫
- **UI Components:** Styled cards, buttons, and forms with xianxia aesthetics

## Usage

1. **First Time Users:**
   - Navigate to `http://localhost:3000`
   - Click "Create Account" to register
   - Fill in username, email, and password
   - Automatically redirected to dashboard

2. **Returning Users:**
   - Navigate to `http://localhost:3000`
   - Enter username and password
   - Click "Enter the Realm" to login

3. **Dashboard Features:**
   - View cultivation level and progress
   - Check character stats
   - Use quick action buttons (placeholder for now)
   - Logout when done

## Development Notes

- Frontend uses React 18 with React Router for navigation
- Axios for API communication with automatic token handling
- Context API for state management
- CSS animations and transitions for enhanced UX
- Responsive design for mobile and desktop

## Testing

Test user registration and login flow:
1. Register a new user
2. Verify dashboard loads with user data
3. Refresh page to test session persistence
4. Logout and test login again

The backend creates mock user data and characters for testing purposes.
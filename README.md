# Xianxia Mini-RPG

A full-stack TypeScript/JavaScript mini-RPG game inspired by Chinese cultivation novels.

## 🏗️ Project Structure

This is a monorepo with the following structure:

```
xianxia-minirpg/
├── shared/          # Shared types and utilities
├── server/          # Node.js + Express + TypeScript backend
├── client/          # Vite + React + TypeScript frontend
├── package.json     # Root package.json with workspace configuration
└── .env.example     # Environment variables template
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm 9+

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd xianxia-minirpg
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Set up the database:
```bash
npm run db:generate
npm run db:migrate
```

### Development

Start both client and server in development mode:
```bash
npm run dev
```

This will start:
- Server: http://localhost:3001
- Client: http://localhost:3000

### Individual Development

Start only the server:
```bash
npm run dev:server
```

Start only the client:
```bash
npm run dev:client
```

## 🧪 Testing

Run all tests:
```bash
npm test
```

Run tests for a specific workspace:
```bash
npm run test --workspace=server
npm run test --workspace=client
npm run test --workspace=shared
```

## 🔧 Code Quality

Lint all packages:
```bash
npm run lint
```

Fix linting issues:
```bash
npm run lint:fix
```

Format code:
```bash
npm run format
```

## 🗄️ Database

This project uses Prisma with SQLite for development.

### Database Commands

Generate Prisma client:
```bash
npm run db:generate
```

Run migrations:
```bash
npm run db:migrate
```

Open Prisma Studio (database GUI):
```bash
npm run db:studio
```

Reset database:
```bash
npm run db:reset
```

## 📦 Build

Build all packages for production:
```bash
npm run build
```

Start production server:
```bash
npm run start --workspace=server
```

Preview production client:
```bash
npm run preview --workspace=client
```

## 🧹 Cleanup

Clean all build artifacts:
```bash
npm run clean
```

## 📁 Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Database
DATABASE_URL="file:./dev.db"

# Server
PORT=3001
NODE_ENV=development

# Client (optional)
VITE_API_URL=http://localhost:3001
```

## 🎮 Game Features

- Character creation and progression
- Turn-based combat system
- Experience and leveling mechanics
- Equipment and inventory system
- Quest system
- Save/load functionality

## 🛠️ Tech Stack

### Server
- Node.js
- Express.js
- TypeScript
- Prisma ORM
- SQLite
- Jest (testing)

### Client
- React 18
- TypeScript
- Vite
- React Router
- Vitest (testing)
- Testing Library

### Shared
- TypeScript types
- Common utilities
- Shared interfaces

## 📝 API Endpoints

### Health Check
- `GET /api/health` - Server health status

### Users
- `GET /api/users` - Get all users
- `POST /api/users` - Create new user

### Characters
- `GET /api/characters` - Get all characters
- `POST /api/characters` - Create new character
- `GET /api/characters/:id` - Get character by ID

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details
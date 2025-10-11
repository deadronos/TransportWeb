# Technical Context

## Technology Stack

### Core Framework
- **React 19.0**: Latest stable with concurrent features
- **TypeScript 5.7**: Strict mode for type safety
- **Vite 6.0**: Fast dev server and optimized builds

### 3D Rendering
- **Three.js 0.169**: WebGL abstraction
- **react-three-fiber 8.17**: React reconciler for Three.js
- **drei 9.114**: Helper components (controls, stats, grid)

### State Management
- **Zustand 5.0**: Lightweight state for UI/meta
- **Miniplex 2.3**: ECS for simulation entities
- **nanoid 5.0**: Fast unique ID generation
- **seedrandom 3.0**: Deterministic RNG

### Testing
- **Vitest 2.1**: Fast unit tests with coverage
- **Playwright 1.49**: E2E browser testing
- **Testing Library 16.1**: React component testing
- **jsdom 25.0**: DOM simulation for Vitest

### Tooling
- **ESLint 9.15**: TypeScript-aware linting
- **Prettier 3.3**: Code formatting
- **vite-tsconfig-paths**: Path alias support (@/)
- **vite-plugin-compression**: Gzip and Brotli compression
- **vite-plugin-svgr**: SVG as React components

## Development Setup

### Prerequisites
```bash
Node.js 18+ (LTS recommended)
npm 9+
Modern browser (Chrome, Firefox, Safari, Edge)
```

### Installation
```bash
npm install
```

### Available Commands
```bash
npm run dev           # Start dev server (port 3000)
npm run build         # Production build
npm run preview       # Preview production build
npm test              # Run unit tests
npm run test:ui       # Vitest UI
npm run test:coverage # Coverage report
npm run test:e2e      # Playwright E2E tests
npm run lint          # ESLint check
npm run format        # Prettier format
```

### Path Aliases
```typescript
@/* → src/*
```

Example:
```typescript
import { useWorld } from '@/game/ecs/world'
```

## Technical Constraints

### Browser Requirements
- WebGL 2.0 support (95%+ of browsers)
- ES2022 JavaScript features
- localStorage for persistence
- Performance: 60fps on mid-range hardware (2020+)

### Memory Budget
- Target: <500MB for typical gameplay
- Instancing reduces per-entity cost
- Periodic garbage collection pauses acceptable
- No memory leaks over extended play

### Network
- Fully offline after initial load
- Optional: Share saves via URL (future)
- No real-time multiplayer (out of scope v1)

## Dependency Notes

### Why Miniplex?
- TypeScript-first ECS with excellent DX
- Query system is ergonomic and fast
- Smaller bundle size than alternatives (bitECS, ecsy)
- React-friendly design patterns

### Why Zustand?
- Minimal boilerplate vs Redux/MobX
- Excellent TypeScript inference
- Middleware for devtools/persistence
- No context provider overhead

### Why react-three-fiber?
- React patterns for Three.js scene graphs
- Automatic memory cleanup
- Hooks for animation loops
- Strong ecosystem (drei, postprocessing)

## Build Configuration

### Production Optimizations
- Code splitting by vendor (React, Three.js, state)
- Gzip and Brotli compression
- Tree-shaking unused code
- Sourcemaps for debugging

### Development Features
- Fast HMR (<100ms)
- Error overlay
- Dev server proxy (if needed)
- Source maps

## TypeScript Configuration

### Compiler Options
- `strict: true` - All strict checks enabled
- `noUncheckedIndexedAccess: true` - Array safety
- `isolatedModules: true` - Fast transpilation
- `verbatimModuleSyntax: true` - Explicit imports

### Path Resolution
- `baseUrl: "."` with `paths: { "@/*": ["./src/*"] }`
- Enables clean imports across deep directory structures

## Known Issues

### TypeScript + R3F
- Some Three.js types require manual casting
- JSX elements in R3F may show warnings (safe to ignore)

### Vitest + Three.js
- Use jsdom environment for React components
- Mock Three.js for unit tests if needed

### ESLint + Flat Config
- Using ESM config (eslint.config.js)
- Some plugins may need compatibility adapters

---

**Status**: Active  
**Created**: 2025-10-11  
**Last Updated**: 2025-10-11

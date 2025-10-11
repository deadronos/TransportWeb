# Active Context

## Current Focus

**Phase**: Initial project scaffold and foundation (Phase 1 of 4)

**Status**: Setting up core architecture and validating technical approach with minimal PoC.

## What We're Building Now

### Completed
- ✅ Memory bank structure (projectbrief, requirements, design, tasks)
- ✅ Package.json with all dependencies
- ✅ Vite configuration (merged with vitest)
- ✅ ESLint configuration (replaced Next.js with React)
- ✅ TypeScript configuration (strict mode, path aliases)
- ✅ React entry files (main.tsx, App.tsx, main.css)
- ✅ ECS world setup (Miniplex integration)
- ✅ Fixed timestep system
- ✅ R3F GameCanvas with controls
- ✅ Zustand clock slice
- ✅ HUD with speed controls
- ✅ SceneGraph component
- ✅ Example unit test (ECS)
- ✅ Example E2E test (Playwright)
- ✅ README with getting started
- ✅ Core memory bank files (productContext, techContext, systemPatterns)

### In Progress
- 🔄 Installing dependencies (`npm install`)
- 🔄 Testing PoC (verify R3F + ECS integration works)

### Next Steps
1. Run `npm install` to install all dependencies
2. Run `npm run dev` to start dev server
3. Verify 3D canvas renders with moving vehicle
4. Verify HUD controls work
5. Create remaining placeholder files and folders
6. Update task tracking

## Recent Changes

**2025-10-11**: Initial scaffold creation
- Created complete project structure from idea.md specification
- Set up all configuration files (Vite, ESLint, TypeScript, Playwright)
- Implemented minimal PoC with:
  - Working R3F canvas with OrbitControls and Stats
  - ECS world with demo vehicle entity
  - Fixed timestep simulation loop
  - Zustand-powered HUD controls
- Added example unit and E2E tests
- Documented architecture in memory bank

## Active Decisions

### Technical Decisions
- **Vite over Next.js**: Faster dev server, simpler CSR setup (as specified in idea.md)
- **Fixed 60fps timestep**: Ensures deterministic simulation
- **ECS boundary**: Simulation never touches Zustand (one-way flow)
- **Instancing strategy**: Defer to Phase 2 when we have actual repeated geometry

### Design Decisions
- **PoC first, then scaffold**: Validate core architecture before creating all files
- **Inline styles for now**: Will move to CSS modules when styling becomes complex
- **Demo vehicle**: Simple cube that moves to verify fixed timestep works

## Known Issues

None yet - about to validate PoC.

## Blockers

None.

## Questions

- [ ] Should we add Leva debug panel in initial scaffold? (Deferred to Phase 2)
- [ ] WebWorker for pathfinding? (Deferred until performance testing)
- [ ] Texture atlasing strategy? (Deferred to asset implementation)

---

**Next Action**: Run `npm install` and test PoC  
**Last Updated**: 2025-10-11

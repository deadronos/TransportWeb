# Transport Tycoon UI/Graphics Design Research

**Date:** 2025-01-05  
**Status:** Research Complete  
**Purpose:** Analyze Transport Tycoon-like game visual design patterns to inform our R3F implementation

---

## Executive Summary

Transport Tycoon established a visual design language that has persisted for 30+ years across spiritual successors like OpenTTD, Transport Fever, and Voxel Tycoon. The core pattern is **isometric 2D/3D hybrid** with **comprehensive UI overlays** for managing complex transportation networks.

**Key Finding:** Modern implementations (Transport Fever 2, Voxel Tycoon) have moved from pure isometric 2D sprites to **full 3D with constrained camera angles** while retaining the same UI patterns and information density.

---

## Visual Design Patterns

### 1. **Camera & Perspective**

#### Classic (Transport Tycoon Deluxe / OpenTTD)
- **Pure isometric projection** (dimetric 2:1 ratio)
- Fixed camera angle (~30° from horizontal)
- 2D sprites with layering for depth
- Zoom levels: 4x, 2x, 1x, 0.5x (discrete)
- No rotation (4-direction sprite sets compensate)

#### Modern (Transport Fever 2 / Voxel Tycoon)
- **Full 3D with constrained isometric-style camera**
- Free rotation and smooth zoom
- Maintains recognizable isometric "feel"
- First-person camera mode for immersion
- Physically-based rendering (PBR) with dynamic lighting

**R3F Implementation Recommendation:**
```typescript
// Start with isometric-style OrbitControls
<OrbitControls
  minPolarAngle={Math.PI / 6}  // ~30° from horizontal
  maxPolarAngle={Math.PI / 3}  // ~60° max
  enableRotate={true}          // Allow rotation unlike classic TT
  enablePan={true}
  minDistance={10}
  maxDistance={200}
/>

// Alternative: Fixed isometric camera
camera.position.set(50, 40, 50);
camera.lookAt(0, 0, 0);
```

---

### 2. **UI Layout & Structure**

#### Core Components (Present in All Variants)

**Top Menu Bar** (Full width, ~30-40px height)
- File menu (Save/Load/Options)
- Construction tools (Rail/Road/Water/Air)
- Company/Economy info
- Time/Date display
- Speed controls (Pause, 1×, 2×, 4×, 8×)
- Quick tools (Dynamite, Query, Screenshot)

**Side Panels** (Collapsible, 200-300px width)
- **Vehicle Lists:** Trains, Road Vehicles, Ships, Aircraft
  - Filterable by type, status, profit
  - Quick actions: Send to depot, Clone, Sell
- **Company Finances:** Balance sheet, income statement
- **Industry/Town Info:** Production rates, population
- **Messages/News:** Alerts, subsidies, company updates

**Bottom Info Panel** (Optional, 100-150px height)
- Minimap with network overlay
- Current selection details
- Context-sensitive help

**Floating Windows** (Draggable)
- Station/Waypoint details
- Vehicle orders/schedule
- Company comparison graphs
- Cargo flow visualization

#### Information Density
- Small fonts (8-12px bitmap fonts in classic, 12-16px in modern)
- Heavy use of icons and color coding
- Tooltips on hover for everything
- Compact table layouts with sortable columns

**R3F Implementation Pattern:**
```tsx
// HUD structure
<div className="game-ui">
  {/* Top bar - always visible */}
  <header className="top-menu-bar">
    <FileMenu />
    <ConstructionTools />
    <TimeControls />
    <QuickActions />
  </header>

  {/* Left sidebar - toggleable */}
  <aside className="left-panel" data-visible={showLeftPanel}>
    <VehicleList />
    <CompanyFinances />
  </aside>

  {/* Right sidebar - toggleable */}
  <aside className="right-panel" data-visible={showRightPanel}>
    <IndustryList />
    <TownList />
  </aside>

  {/* Bottom panel - context-sensitive */}
  <footer className="bottom-panel">
    <Minimap />
    <SelectionDetails />
  </footer>

  {/* Floating windows - draggable */}
  {floatingWindows.map(window => (
    <DraggableWindow key={window.id} {...window} />
  ))}
</div>
```

---

### 3. **Color Palette & Visual Style**

#### Classic Transport Tycoon Palette
- **Terrain:** Vibrant greens (grass), blues (water), grays/browns (mountains)
- **Infrastructure:**
  - Rails: Dark gray with wooden sleepers
  - Roads: Gray tarmac with white/yellow lines
  - Stations: Red roofs, gray platforms
  - Signals: Red (stop), Green (go), Yellow (caution)
- **Vehicles:** Company color + base color (e.g., red + gray for trains)
- **UI:** Earthy browns, grays, beige backgrounds
- **Text:** High contrast (white on dark, black on light)

#### Modern Evolution (Transport Fever 2)
- More realistic, less saturated colors
- Seasonal variation (snow, autumn leaves)
- Weather effects (rain, fog)
- Day/night cycle with lighting
- Physically accurate materials (PBR)

#### Voxel Tycoon Approach
- Clean, stylized voxel aesthetic
- Bright, saturated colors
- Smooth shading with ambient occlusion
- Maintains readability at all zoom levels

**R3F Material Recommendations:**
```tsx
// Use MeshStandardMaterial for PBR-style rendering
<meshStandardMaterial
  color="#2d5016"        // Grass green
  roughness={0.8}        // Matte finish
  metalness={0.0}        // Non-metallic
  envMapIntensity={0.5}  // Subtle reflections
/>

// Vehicles with company color tint
<meshStandardMaterial
  color={companyColor}
  roughness={0.3}
  metalness={0.6}
  emissive="#000000"
/>

// Rails/infrastructure
<meshStandardMaterial
  color="#4a4a4a"        // Dark gray
  roughness={0.6}
  metalness={0.8}
/>
```

---

### 4. **Grid & Tile System**

#### Classic Grid (OpenTTD)
- **Square tiles** (e.g., 64×64 pixels on screen at 1× zoom)
- World coordinates: Integer grid positions
- Height levels: 16 height increments per tile
- Slopes: 8 directions (N, NE, E, SE, S, SW, W, NW)
- Buildings: Multi-tile (e.g., 2×2, 3×3)

#### Modern Adaptations
- **Transport Fever 2:** Smooth terrain without visible grid
- **Voxel Tycoon:** 1-meter voxel cubes, visible grid on placement

**R3F Grid Implementation:**
```tsx
// Visual grid for construction mode
<Grid
  args={[1000, 1000]}         // Infinite grid size
  cellSize={10}                // 10 units per tile
  cellThickness={0.5}
  cellColor="#888888"
  sectionSize={50}             // Major grid lines every 5 tiles
  sectionThickness={1}
  sectionColor="#666666"
  fadeDistance={500}
  fadeStrength={1}
  visible={constructionMode}   // Only show during placement
/>

// Snap-to-grid helper
const snapToGrid = (position: Vector3, gridSize = 10) => {
  return new Vector3(
    Math.round(position.x / gridSize) * gridSize,
    Math.round(position.y / gridSize) * gridSize,
    Math.round(position.z / gridSize) * gridSize
  );
};
```

---

### 5. **Construction Visuals**

#### Ghost/Preview Graphics
- **Transparent overlay** showing placement before confirmation
- Color-coded: Green (valid), Red (invalid), Yellow (warning)
- Show cost estimate
- Snap to grid/existing infrastructure
- Preview with dotted outlines

#### Track/Road Building
- **Drag-and-drop** from start to end point
- Auto-pathfinding between endpoints
- Show preview of entire route before placing
- Real-time cost calculation
- Gradient indicators (slopes too steep = red)

**R3F Implementation:**
```tsx
// Ghost building material
const ghostMaterial = new MeshStandardMaterial({
  color: isValid ? '#00ff00' : '#ff0000',
  transparent: true,
  opacity: 0.5,
  depthWrite: false,
  side: DoubleSide
});

// Track preview with instanced meshes
<Instances limit={1000} material={ghostMaterial}>
  {trackSegments.map((segment, i) => (
    <Instance
      key={i}
      position={segment.position}
      rotation={segment.rotation}
      scale={[1, 1, segment.length]}
    />
  ))}
</Instances>

// Cost overlay
<Html position={[x, y + 5, z]} center>
  <div className="construction-cost">
    ${formatCurrency(totalCost)}
  </div>
</Html>
```

---

### 6. **Vehicle Representation**

#### Visual States
- **Idle:** Stationary at station/depot
- **Moving:** Animated wheels, smoke effects (steam locos)
- **Loading:** Cargo appears/disappears
- **Breakdown:** Smoke, stopped on track
- **Aging:** Visual wear over time (rust, dirt)

#### Animation
- **Classic:** Sprite-based, 4-8 frames per direction
- **Modern:** 3D models with skeletal animation
- Wheels rotate based on speed
- Smoke particles from steam engines
- Headlights at night

**R3F Vehicle Animation:**
```tsx
// Vehicle component with animation
function Vehicle({ vehicle }: { vehicle: VehicleEntity }) {
  const meshRef = useRef<Mesh>(null);
  
  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    // Update position along path
    const newPos = interpolateAlongPath(
      vehicle.path,
      vehicle.pathProgress
    );
    meshRef.current.position.copy(newPos);
    
    // Rotate to face direction
    const lookAtPos = interpolateAlongPath(
      vehicle.path,
      vehicle.pathProgress + 0.1
    );
    meshRef.current.lookAt(lookAtPos);
    
    // Animate wheels (child meshes)
    const wheelRotation = (vehicle.speed * delta * Math.PI) / 5;
    meshRef.current.children.forEach(child => {
      if (child.name.startsWith('wheel')) {
        child.rotation.x += wheelRotation;
      }
    });
  });

  return (
    <group ref={meshRef}>
      <mesh>
        <boxGeometry args={[2, 1.5, 5]} />
        <meshStandardMaterial color={vehicle.companyColor} />
      </mesh>
      {/* Wheels */}
      {[...Array(4)].map((_, i) => (
        <mesh
          key={i}
          name={`wheel${i}`}
          position={wheelPositions[i]}
        >
          <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} />
          <meshStandardMaterial color="#222222" />
        </mesh>
      ))}
    </group>
  );
}
```

---

### 7. **Station & Infrastructure UI**

#### Station Coverage Overlay
- **Radius circle** showing catchment area
- Color-coded by cargo type acceptance
- Animated when selecting station
- Toggleable from station window

#### Station Window Contents
- Cargo waiting (by type, with amounts)
- Vehicles scheduled to stop
- Rating (0-100%) per cargo type
- Monthly statistics graph
- Upgrade buttons (longer platforms, covered, etc.)

#### Signals & Pathfinding Visualization
- **Signal types:**
  - Block signals (traditional, red/green)
  - Path signals (modern, allow multiple trains in block)
  - One-way indicators
- Visual feedback: Highlight reserved paths when train selected
- Debug mode: Show pathfinder routes

**R3F Station Overlay:**
```tsx
// Station coverage radius
function StationCoverage({ station }: { station: StationEntity }) {
  return (
    <group>
      {/* Coverage circle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
        <ringGeometry args={[
          0,
          station.catchmentRadius,
          64
        ]} />
        <meshBasicMaterial
          color="#00ff88"
          transparent
          opacity={0.3}
          side={DoubleSide}
        />
      </mesh>
      
      {/* Connected industries/buildings */}
      {station.connectedBuildings.map(building => (
        <Line
          key={building.id}
          points={[station.position, building.position]}
          color="#00ff88"
          lineWidth={2}
          dashed
        />
      ))}
    </group>
  );
}
```

---

### 8. **Minimap Design**

#### Classic Minimap Features
- **Viewport indicator:** Rectangle showing current view
- **Mode toggle buttons:**
  - Terrain elevation
  - Infrastructure (rails/roads)
  - Vehicle density
  - Industry/town locations
  - Company territories
- Clickable to jump camera
- Optional transparency overlay on main view

#### Modern Enhancements
- Real-time vehicle tracking (dots moving)
- Animated alerts (flashing for breakdowns)
- Zoom in/out on minimap itself
- Multiple layer toggles simultaneously

**R3F Minimap Implementation:**
```tsx
// Orthographic minimap camera rendering to texture
function Minimap() {
  const minimapCamera = useMemo(() => {
    const cam = new OrthographicCamera(-100, 100, 100, -100, 0.1, 1000);
    cam.position.set(0, 500, 0);
    cam.lookAt(0, 0, 0);
    return cam;
  }, []);

  const renderTarget = useFBO(512, 512);

  useFrame((state) => {
    state.gl.setRenderTarget(renderTarget);
    state.gl.render(state.scene, minimapCamera);
    state.gl.setRenderTarget(null);
  });

  return (
    <Html position={[0, 0, 0]} style={{ position: 'fixed', bottom: 10, right: 10 }}>
      <canvas
        width={256}
        height={256}
        style={{ border: '2px solid #333' }}
        onClick={(e) => {
          // Calculate world position from click
          const rect = e.currentTarget.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width) * 200 - 100;
          const z = ((e.clientY - rect.top) / rect.height) * 200 - 100;
          // Jump camera to position
        }}
      />
    </Html>
  );
}
```

---

## Implementation Recommendations for TransportWeb

### Phase 1: Core Visual Foundation
1. **Set up isometric-style camera** with OrbitControls
2. **Implement grid system** with snap-to-grid helpers
3. **Create basic terrain tiles** (grass, water, mountain)
4. **Simple vehicle placeholders** (colored boxes with direction indicators)

### Phase 2: UI Framework
1. **Top menu bar** with construction tool buttons
2. **Time controls HUD** (pause, speed multiplier)
3. **Selection system** (raycasting, outline shader)
4. **Ghost building preview** with color-coded validity

### Phase 3: Advanced Graphics
1. **Detailed 3D models** for vehicles (trains, trucks)
2. **Track/road meshes** with automatic curve generation
3. **Station buildings** with multi-tile footprints
4. **Particle effects** (smoke, dust)

### Phase 4: Polish
1. **Minimap** with real-time updates
2. **Day/night cycle** with lighting
3. **Weather effects** (rain, fog)
4. **UI animations** (smooth transitions, tooltips)

---

## Appendix: Reference Screenshots Analysis

### OpenTTD (Classic Style)
- **Strengths:** Extremely clear readability, proven UI patterns, low resource requirements
- **Weaknesses:** Dated visual style, limited camera freedom, tile-based restrictions
- **Best for:** Understanding core game mechanics and UI layout

### Transport Fever 2 (Modern Realistic)
- **Strengths:** Beautiful realistic graphics, smooth camera, immersive
- **Weaknesses:** Complex asset pipeline, performance intensive, harder to read at a glance
- **Best for:** Inspiration for 3D rendering techniques and modern UI polish

### Voxel Tycoon (Modern Stylized)
- **Strengths:** Clean voxel aesthetic, good performance, modding-friendly
- **Weaknesses:** Less realistic, simpler visual language
- **Best for:** Balancing aesthetics with performance, construction visualization

---

## Conclusion

**Recommended Approach for TransportWeb:**

Adopt a **"modern classic"** visual style:
- **3D graphics** (Three.js/R3F) with **isometric-style camera constraints**
- **Stylized, low-poly assets** (easier to create, better performance)
- **Classic UI layout** (top menu bar, side panels, minimap)
- **Ghost building system** with color-coded validity feedback
- **Grid-based construction** with snap-to-grid but smooth animations

This approach balances:
- ✅ **Visual clarity** (critical for complex network management)
- ✅ **Development speed** (simpler assets than photorealistic)
- ✅ **Performance** (runs well in browser)
- ✅ **Familiarity** (players recognize Transport Tycoon patterns)

**Next Steps:**
1. Create a simple tile-based terrain system (10×10 grid)
2. Implement construction mode with ghost preview
3. Build draggable track placement with pathfinding
4. Add vehicle movement along paths with animation

---

**References:**
- OpenTTD Wiki: https://wiki.openttd.org/
- Transport Fever 2 Steam Page: https://store.steampowered.com/app/1066780/Transport_Fever_2/
- Voxel Tycoon Steam Page: https://store.steampowered.com/app/732050/Voxel_Tycoon/
- Classic TT Graphics: https://www.transporttycoon.com/

========================================
ARCHITECTURE CONVENTIONS
========================================

As we implement remaining features, maintain these principles:

File Granularity:
- One class/system per file, maximum
- If a file exceeds 300 lines, consider splitting it
- Related utilities grouped in /utils/ subdirectories by domain

Directory Organization:
- /src/tools/ - All tool implementations
- /src/tools/widgets/ - Reusable 3D UI widgets for tools
- /src/ui/ - All 2D DOM UI components
- /src/camera/ - Camera control and management
- /src/scene/ - Three.js scene setup and rendering
- /src/assets/ - Asset loading, management, organization
- /src/map/ - Map data structure and persistence
- /src/history/ - Undo/redo and action tracking
- /src/input/ - Input handling and routing
- /src/selection/ - Selection state and operations
- /src/snapping/ - Grid and object snapping logic
- /src/lights/ - Dynamic light management
- /src/layers/ - Layer system
- /src/physics/ - Collision detection and spatial queries
- /src/performance/ - Optimization utilities
- /src/persistence/ - Save/load system
- /src/import/ - Import different file formats
- /src/export/ - Export different file formats
- /src/rendering/ - Rendering effects and shaders
- /src/utils/ - Generic utilities
- /src/core/ - Core app orchestration

Naming Conventions:
- UI components: *-ui.js
- Tools: *-tool.js
- Managers: *-manager.js
- Controllers: *-controller.js
- Utilities: clear, action-oriented names

State Management:
- Events for cross-component communication (already established)
- Managers own their domain's state
- UI components are thin layers over logic
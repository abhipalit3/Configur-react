# How to Integrate Helper Functions into ThreeScene.jsx

## Step 1: Add imports at the top of ThreeScene.jsx

```javascript
// Add these imports after the existing imports
import {
  initializeRenderer,
  initializeScene,
  setupLighting,
  setupGrids,
  initializeCamera,
  initializeControls,
  setupEnvironment,
  setupKeyboardControls,
  setupCameraLogger,
  setupResizeHandler,
  startAnimationLoop,
  centerOrbitOnContent
} from '../helpers/sceneSetup'
import { initializeRackScene } from '../helpers/rackBuilder'
```

## Step 2: Replace the scene setup code in useEffect

Replace lines 83-126 (renderer, scene, lights, grids, camera, controls setup) with:

```javascript
useEffect(() => {
  // Store cleanup functions
  const cleanupFunctions = []
  
  // Initialize renderer using helper
  const renderer = initializeRenderer(mountRef.current)
  rendererRef.current = renderer
  
  // Initialize scene using helper
  const scene = initializeScene()
  
  // Setup lighting using helper
  const { ambient, dirLight } = setupLighting(scene)
  
  // Setup grids using helper
  const { gridHelper, backgroundGrid } = setupGrids(scene)
  
  // Initialize camera using helper
  const camera = initializeCamera()
  cameraRef.current = camera
  
  // Initialize controls using helper
  const controls = initializeControls(camera, renderer.domElement)
  
  // Setup environment using helper
  setupEnvironment(scene, renderer)
  
  // Setup keyboard controls using helper
  cleanupFunctions.push(setupKeyboardControls(controls))
  
  // Setup camera logger using helper
  cleanupFunctions.push(setupCameraLogger(camera, controls))
  
  // Setup resize handler using helper
  cleanupFunctions.push(setupResizeHandler(camera, renderer))
  
  // Initialize rack scene using helper
  const { materials, snapPoints, rackParams: newRackParams } = initializeRackScene(
    scene, 
    initialRackParams, 
    initialBuildingParams
  )
  
  // Update rack params state
  setRackParams(newRackParams)
  
  // ... rest of your existing code for MEP renderers, measurement tool, etc ...
  
  // Start animation loop using helper
  const stopAnimation = startAnimationLoop(renderer, scene, camera, controls, () => {
    // Frame callback - update measurement labels etc
    if (measurementToolRef.current) {
      measurementToolRef.current.updateLabels()
    }
  })
  cleanupFunctions.push(stopAnimation)
  
  // Cleanup function
  return () => {
    // Call all cleanup functions
    cleanupFunctions.forEach(cleanup => cleanup())
    
    // Your existing cleanup code
    dispose(scene)
    disposeMaterials(materials)
    renderer.dispose()
    controls.dispose()
    
    if (mountRef.current && mountRef.current.contains(renderer.domElement)) {
      mountRef.current.removeChild(renderer.domElement)
    }
  }
}, [initialRackParams, initialBuildingParams])
```

## Benefits of this approach:

1. **Cleaner ThreeScene.jsx**: The main component focuses on orchestration rather than implementation details
2. **Reusable functions**: Helper functions can be used in other components or tests
3. **Easier testing**: Each helper function can be tested independently
4. **Better organization**: Related functionality is grouped together
5. **Maintainability**: Easier to find and fix specific functionality

## Next Steps:

Once you've tested that the scene still works with these helpers, we can continue extracting:
- MEP management helpers
- Camera control helpers
- Editor management helpers
- Measurement tool helpers
- ViewCube helpers

Each extraction will follow the same pattern:
1. Create helper functions in separate files
2. Import them in ThreeScene
3. Replace the inline code with helper function calls
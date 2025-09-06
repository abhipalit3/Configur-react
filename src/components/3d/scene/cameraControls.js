/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import * as THREE from 'three'

/**
 * Save camera state to localStorage
 */
export function saveCameraState(camera, controls, viewMode) {
  const cameraState = {
    position: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
    rotation: { x: camera.rotation.x, y: camera.rotation.y, z: camera.rotation.z },
    zoom: camera.zoom,
    target: { x: controls.target.x, y: controls.target.y, z: controls.target.z },
    viewMode: viewMode
  }
  try {
    localStorage.setItem('cameraState', JSON.stringify(cameraState))
    // console.log('💾 Camera state saved:', cameraState)
  } catch (error) {
    console.warn('⚠️ Failed to save camera state:', error)
  }
}

/**
 * Load camera state from localStorage
 */
export function loadCameraState() {
  try {
    const saved = localStorage.getItem('cameraState')
    if (saved) {
      const cameraState = JSON.parse(saved)
      // console.log('📷 Loading saved camera state:', cameraState)
      return cameraState
    }
  } catch (error) {
    console.warn('⚠️ Failed to load camera state:', error)
  }
  return null
}

/**
 * Apply saved camera state to camera and controls
 */
export function applyCameraState(camera, controls, savedState, originalSettings) {
  if (savedState) {
    // Apply saved camera state
    camera.position.set(savedState.position.x, savedState.position.y, savedState.position.z)
    camera.rotation.set(savedState.rotation.x, savedState.rotation.y, savedState.rotation.z)
    camera.zoom = savedState.zoom
    controls.target.set(savedState.target.x, savedState.target.y, savedState.target.z)
    
    // Update the original settings with loaded state for 3D restoration
    if (originalSettings) {
      originalSettings.position = camera.position.clone()
      originalSettings.rotation = camera.rotation.clone()
      originalSettings.zoom = camera.zoom
      originalSettings.target = controls.target.clone()
    }
    
    camera.updateProjectionMatrix()
    controls.update()
    
    return savedState.viewMode || '3D'
  }
  return '3D'
}

/**
 * Initialize original camera settings for 3D view restoration
 */
export function initializeOriginalCameraSettings(camera, controls) {
  return {
    position: camera.position.clone(),
    rotation: camera.rotation.clone(), 
    zoom: camera.zoom,
    target: controls.target.clone()
  }
}

/**
 * Switch to 2D view mode (side view orthographic)
 */
export function switchTo2DView(camera, controls, scene, originalSettings, onSave) {
  // Store current 3D settings before switching
  originalSettings.position = camera.position.clone()
  originalSettings.rotation = camera.rotation.clone()
  originalSettings.zoom = camera.zoom
  originalSettings.target = controls.target.clone()
  
  // Save current state before switching
  if (onSave) onSave()
  
  // Switch to 2D view (side view orthographic - looking from right)
  // Find the rack group specifically
  let rackGroup = null
  let rackBounds = null
  
  scene.traverse((object) => {
    if (object.name === 'TradeRackGroup' || object.name === 'RackGroup' || 
        (object.userData && object.userData.isGenerated)) {
      if (object.isGroup || object.isMesh) {
        if (!rackGroup) rackGroup = object
      }
    }
  })
  
  // Calculate bounding box
  const bbox = new THREE.Box3()
  
  if (rackGroup) {
    // Use the rack group for bounds
    bbox.setFromObject(rackGroup)
  } else {
    // Fallback: find all rack-related meshes
    scene.traverse((object) => {
      if (object.isMesh && object.visible && 
          (object.name.includes('Rack') || object.name.includes('Beam') || 
           object.name.includes('Post') || object.name.includes('Column') ||
           object.userData.isGenerated)) {
        bbox.expandByObject(object)
      }
    })
  }
  
  // If still empty, use default bounds
  if (bbox.isEmpty()) {
    // console.log('🔧 Using default bounds for 2D view')
    bbox.min.set(-2, -1, -2)
    bbox.max.set(2, 3, 2)
  }
  
  const center = bbox.getCenter(new THREE.Vector3())
  const size = bbox.getSize(new THREE.Vector3())
  
  // console.log('🔧 2D View - Bounding box center:', center.x, center.y, center.z)
  // console.log('🔧 2D View - Bounding box size:', size.x, size.y, size.z)
  
  // Position camera to look from the right side (positive X direction)
  // This gives us a side elevation view
  const distance = 10 // Fixed reasonable distance
  camera.position.set(center.x + distance, center.y, center.z)
  camera.up.set(0, 1, 0) // Y-up
  
  // Set target to center of rack
  controls.target.copy(center)
  
  // Calculate zoom to fit content with proper padding
  // For side view, we care about height (Y) and depth (Z)
  const maxDim = Math.max(size.y, size.z) * 1.2 // Add 20% padding
  if (maxDim > 0 && isFinite(maxDim)) {
    camera.zoom = 10 / maxDim // Adjust zoom based on content size
  } else {
    camera.zoom = 2 // Default zoom
  }
  
  // Enable pan and zoom, disable rotation
  controls.enableRotate = false
  controls.enableZoom = true
  controls.enablePan = true
  controls.mouseButtons = {
    LEFT: THREE.MOUSE.PAN,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: THREE.MOUSE.PAN
  }
  
  // Force camera to look at center
  camera.lookAt(center)
  camera.updateProjectionMatrix()
  controls.update()
  
  // console.log('🔧 2D View - Final camera position:', camera.position.x, camera.position.y, camera.position.z)
  // console.log('🔧 2D View - Final controls target:', controls.target.x, controls.target.y, controls.target.z)
  // console.log('🔧 2D View - Final camera zoom:', camera.zoom)
}

/**
 * Switch to 3D view mode (restore perspective view)
 */
export function switchTo3DView(camera, controls, originalSettings, onSave) {
  // console.log('🔧 Restoring 3D view')
  
  // Restore 3D view
  camera.position.copy(originalSettings.position)
  camera.zoom = originalSettings.zoom
  camera.up.set(0, 1, 0)
  
  // Restore controls
  controls.target.copy(originalSettings.target)
  controls.enableRotate = true
  controls.enableZoom = true
  controls.mouseButtons = { 
    LEFT: THREE.MOUSE.ROTATE, 
    MIDDLE: THREE.MOUSE.DOLLY, 
    RIGHT: THREE.MOUSE.PAN 
  }
  
  // Update camera and controls
  camera.updateProjectionMatrix()
  controls.update()
  
  // Save restored 3D state
  if (onSave) onSave()
  
  // console.log('🔧 3D View restored - Camera position:', camera.position)
  // console.log('🔧 3D View restored - Controls target:', controls.target)
}

/**
 * Create view mode handler function
 */
export function createViewModeHandler(camera, controls, scene, originalSettings) {
  let currentViewMode = '3D'
  
  const saveState = () => saveCameraState(camera, controls, currentViewMode)
  
  return (mode) => {
    // console.log('🔧 Switching to view mode:', mode)
    currentViewMode = mode // Update tracked view mode
    window.currentViewMode = mode // Update global access
    
    if (mode === '2D') {
      switchTo2DView(camera, controls, scene, originalSettings, saveState)
    } else if (mode === '3D') {
      switchTo3DView(camera, controls, originalSettings, saveState)
    }
    
    return currentViewMode
  }
}

/**
 * Fit view to content (zoom only, keeps camera angle)
 */
export function fitViewToContent(camera, controls, scene, onSave) {
  // console.log('🔧 Fitting view to content (zoom only)')
  
  const bbox = new THREE.Box3()
  let hasContent = false
  
  // Calculate bounding box of all generated content
  scene.traverse((object) => {
    if (object.userData.isGenerated && object.isMesh) {
      const objectBBox = new THREE.Box3().setFromObject(object)
      bbox.union(objectBBox)
      hasContent = true
    }
  })
  
  // If no generated content, use all visible meshes
  if (!hasContent) {
    scene.traverse((object) => {
      if (object.isMesh && object.visible) {
        const objectBBox = new THREE.Box3().setFromObject(object)
        bbox.union(objectBBox)
      }
    })
  }
  
  if (!bbox.isEmpty()) {
    const center = bbox.getCenter(new THREE.Vector3())
    const size = bbox.getSize(new THREE.Vector3())
    
    // console.log('🔧 Fit View - Bounding box:', { center, size })
    
    // Calculate appropriate zoom to fit content
    // Get the camera's current direction and distance to determine zoom
    const cameraDirection = new THREE.Vector3()
    camera.getWorldDirection(cameraDirection)
    
    // Project the bounding box size onto the camera's view plane
    const distance = camera.position.distanceTo(controls.target)
    
    // For orthographic camera, we need to fit the content within the view
    // Calculate the maximum dimension as seen from the current camera angle
    const maxDim = Math.max(size.x, size.y, size.z)
    
    // Set zoom to fit content with some padding (don't change camera position or target)
    const baseViewSize = 20 // Base orthographic view size
    camera.zoom = baseViewSize / maxDim * 0.8 // Fit with 20% padding
    
    // Only update camera projection, don't change position or target
    camera.updateProjectionMatrix()
    
    // Save the new zoom state
    if (onSave) onSave()
    
    // console.log('🔧 Fit View - New zoom:', camera.zoom)
  } else {
    console.warn('⚠️ No content found to fit view to')
  }
}

/**
 * Create fit view handler function
 */
export function createFitViewHandler(camera, controls, scene) {
  const saveState = () => {
    const currentViewMode = window.currentViewMode || '3D'
    saveCameraState(camera, controls, currentViewMode)
  }
  
  return () => {
    fitViewToContent(camera, controls, scene, saveState)
  }
}

/**
 * Setup camera state persistence with debounced saving
 */
export function setupCameraStatePersistence(camera, controls) {
  let saveTimeout = null
  
  const debouncedSave = () => {
    if (saveTimeout) {
      clearTimeout(saveTimeout)
    }
    
    saveTimeout = setTimeout(() => {
      if (window.sceneViewModeHandler) { // Only save if scene is ready
        const currentViewMode = window.currentViewMode || '3D'
        saveCameraState(camera, controls, currentViewMode)
      }
    }, 500) // Save 500ms after user stops moving camera
  }
  
  const onControlsChange = () => {
    debouncedSave()
  }
  
  // Add event listener
  controls.addEventListener('change', onControlsChange)
  
  // Return cleanup function
  return () => {
    if (saveTimeout) {
      clearTimeout(saveTimeout)
    }
    controls.removeEventListener('change', onControlsChange)
  }
}

/**
 * Initialize camera controls and view management
 */
export function initializeCameraControls(camera, controls, scene, initialViewMode = '3D') {
  // Initialize original camera settings
  const originalCameraSettings = initializeOriginalCameraSettings(camera, controls)
  
  // Load and apply saved camera state
  const savedCameraState = loadCameraState()
  let currentViewMode = initialViewMode
  
  if (savedCameraState) {
    currentViewMode = applyCameraState(camera, controls, savedCameraState, originalCameraSettings)
  }
  
  // Make view mode globally accessible
  window.currentViewMode = currentViewMode
  
  // Create view mode handler
  const viewModeHandler = createViewModeHandler(camera, controls, scene, originalCameraSettings)
  window.sceneViewModeHandler = viewModeHandler
  
  // Create fit view handler  
  const fitViewHandler = createFitViewHandler(camera, controls, scene)
  window.sceneFitViewHandler = fitViewHandler
  
  // Setup camera state persistence
  const cleanupStatePersistence = setupCameraStatePersistence(camera, controls)
  
  return {
    originalCameraSettings,
    currentViewMode,
    viewModeHandler,
    fitViewHandler,
    cleanup: cleanupStatePersistence
  }
}
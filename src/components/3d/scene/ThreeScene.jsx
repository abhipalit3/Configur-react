/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import React, { useRef, useEffect, useState } from 'react'
import * as THREE from 'three'
import { dispose } from '../core/utils.js'
import { TransformControls } from 'three/addons/controls/TransformControls.js'
import { ViewCube } from '../controls/ViewCube.js'
import { MeasurementTool } from '../controls/MeasurementTool.js'
import { DuctworkRenderer, DuctEditor } from '../ductwork'
import { PipingRenderer } from '../piping'
import { PipeEditor } from '../piping'
import { ConduitRenderer, ConduitEditorUI } from '../conduits'
import { CableTrayRenderer } from '../cable-trays'
import { CableTrayEditor } from '../cable-trays/CableTrayEditor'
import { disposeMaterials } from '../materials'
import { initializeMepSelectionManager } from '../core/MepSelectionManager.js'
import { TradeRackInteraction } from '../trade-rack/TradeRackInteraction.js'
import '../styles/measurement-styles.css'

// Import helper functions
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
  centerOrbitOnContent,
  updateOrthoCamera
} from './sceneSetup'
import { initializeRackScene } from './rackBuilder'
import {
  initializeMepRenderers,
  setupMepInteractions,
  setupMepSnapPoints,
  updateAllMepItems,
  initializeMepSelection,
  setupMepEditorCallbacks,
  setupMepTierUpdates,
  setupInitialMepUpdate,
  cleanupMepRenderers
} from './mepManagement'
import {
  createEditorHandlers,
  createSelectionHandlers,
  setupEditorCallbacks
} from './editorManagement'


export default function ThreeScene({ isMeasurementActive, mepItems = [], initialRackParams, initialBuildingParams, initialViewMode = '3D', onSceneReady }) {
  const mountRef = useRef(null)
  const measurementToolRef = useRef(null)
  const ductworkRendererRef = useRef(null)
  const pipingRendererRef = useRef(null)
  const conduitRendererRef = useRef(null)
  const cableTrayRendererRef = useRef(null)
  const tradeRackInteractionRef = useRef(null)
  const cameraRef = useRef(null)
  const rendererRef = useRef(null)
  
  // State for axis locking - only one axis can be locked at a time
  const [axisLock, setAxisLock] = useState({
    x: false,
    y: false,
    z: false
  })

  // State for duct editor
  const [selectedDuct, setSelectedDuct] = useState(null)
  const [showDuctEditor, setShowDuctEditor] = useState(false)
  const [skipDuctRecreation, setSkipDuctRecreation] = useState(false)
  
  // State for pipe editor
  const [selectedPipe, setSelectedPipe] = useState(null)
  const [showPipeEditor, setShowPipeEditor] = useState(false)
  const [skipPipeRecreation, setSkipPipeRecreation] = useState(false)
  
  // State for conduit editor
  const [selectedConduit, setSelectedConduit] = useState(null)
  const [showConduitEditor, setShowConduitEditor] = useState(false)
  const [skipConduitRecreation, setSkipConduitRecreation] = useState(false)
  
  // State for cable tray editor
  const [selectedCableTray, setSelectedCableTray] = useState(null)
  const [showCableTrayEditor, setShowCableTrayEditor] = useState(false)
  const [skipCableTrayRecreation, setSkipCableTrayRecreation] = useState(false)
  
  // State for trade rack selection
  const [selectedTradeRack, setSelectedTradeRack] = useState(null)
  
  // State for rack parameters (to access in render)
  const [rackParams, setRackParams] = useState({
    tierCount: 2,
    tierHeights: [2, 2],
    bayCount: 4,
    bayWidth: 3,
    depth: 4,
    beamSize: 2,
    postSize: 2
  })
  
  // State for editor handlers
  const [editorHandlers, setEditorHandlers] = useState(null)

  useEffect(() => {
    // Store cleanup functions
    const cleanupFunctions = []
    let materials = null
    
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
    
    // Save camera state when user interacts with controls
    let saveTimeout
    const onControlsChange = () => {
      // Debounce saving to avoid too frequent writes
      clearTimeout(saveTimeout)
      saveTimeout = setTimeout(() => {
        if (window.sceneViewModeHandler) { // Only save if scene is ready
          saveCameraState()
        }
      }, 500) // Save 500ms after user stops moving camera
    }
    controls.addEventListener('change', onControlsChange)
    controls.update()
    
    // Initialize rack scene using helper
    const rackData = initializeRackScene(scene, initialRackParams, initialBuildingParams)
    materials = rackData.materials
    const snapPoints = rackData.snapPoints
    
    // Update rack params state
    setRackParams(rackData.rackParams)

    // Notify parent that scene is ready
    if (onSceneReady) {
      onSceneReady(scene, materials, snapPoints)
    }

    // Center the orbit controls on the generated content using helper
    centerOrbitOnContent(scene, controls)

    const measurementTool = new MeasurementTool(
      scene,
      camera,
      renderer.domElement,
      snapPoints
    )
    measurementToolRef.current = measurementTool
    
    // Make measurement tool globally accessible for clear functionality
    window.measurementToolInstance = measurementTool
    
    // Track current view mode
    let currentViewMode = initialViewMode
    
    // Make view mode globally accessible for measurement tool
    window.currentViewMode = currentViewMode
    
    // Camera state persistence functions
    const saveCameraState = () => {
      const cameraState = {
        position: { x: camera.position.x, y: camera.position.y, z: camera.position.z },
        rotation: { x: camera.rotation.x, y: camera.rotation.y, z: camera.rotation.z },
        zoom: camera.zoom,
        target: { x: controls.target.x, y: controls.target.y, z: controls.target.z },
        viewMode: currentViewMode
      }
      try {
        localStorage.setItem('cameraState', JSON.stringify(cameraState))
        // console.log('💾 Camera state saved:', cameraState)
      } catch (error) {
        console.warn('⚠️ Failed to save camera state:', error)
      }
    }
    
    const loadCameraState = () => {
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

    // Store original camera settings for 3D view restoration
    let originalCameraSettings = {
      position: camera.position.clone(),
      rotation: camera.rotation.clone(),
      zoom: camera.zoom,
      target: controls.target.clone()
    }
    
    // Load and apply saved camera state if available
    const savedCameraState = loadCameraState()
    if (savedCameraState) {
      // Apply saved camera state
      camera.position.set(savedCameraState.position.x, savedCameraState.position.y, savedCameraState.position.z)
      camera.rotation.set(savedCameraState.rotation.x, savedCameraState.rotation.y, savedCameraState.rotation.z)
      camera.zoom = savedCameraState.zoom
      controls.target.set(savedCameraState.target.x, savedCameraState.target.y, savedCameraState.target.z)
      
      // Update the original settings with loaded state for 3D restoration
      originalCameraSettings = {
        position: camera.position.clone(),
        rotation: camera.rotation.clone(), 
        zoom: camera.zoom,
        target: controls.target.clone()
      }
      
      camera.updateProjectionMatrix()
      controls.update()
    }
    
    // View mode handler (2D/3D)
    window.sceneViewModeHandler = (mode) => {
      // console.log('🔧 Switching to view mode:', mode)
      currentViewMode = mode // Update tracked view mode
      window.currentViewMode = mode // Update global access
      
      if (mode === '2D') {
        // Store current 3D settings before switching
        originalCameraSettings.position = camera.position.clone()
        originalCameraSettings.rotation = camera.rotation.clone()
        originalCameraSettings.zoom = camera.zoom
        originalCameraSettings.target = controls.target.clone()
        
        // Save current state before switching
        saveCameraState()
        
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
      } else if (mode === '3D') {
        // console.log('🔧 Restoring 3D view')
        
        // Restore 3D view
        camera.position.copy(originalCameraSettings.position)
        camera.zoom = originalCameraSettings.zoom
        camera.up.set(0, 1, 0)
        
        // Restore controls
        controls.target.copy(originalCameraSettings.target)
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
        saveCameraState()
        
        // console.log('🔧 3D View restored - Camera position:', camera.position)
        // console.log('🔧 3D View restored - Controls target:', controls.target)
      }
    }
    
    // Fit view handler - only adjusts zoom, keeps camera angle
    window.sceneFitViewHandler = () => {
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
        saveCameraState()
        
        // console.log('🔧 Fit View - New zoom:', camera.zoom)
        // console.log('🔧 Fit View - Camera position unchanged:', camera.position)
        // console.log('🔧 Fit View - Camera target unchanged:', controls.target)
      } else {
        console.warn('⚠️ No content found for fit view')
      }
    }

    // Restore measurements from manifest after initialization
    setTimeout(() => {
      measurementTool.restoreFromManifest()
      
      // Restore view mode if it was 2D
      if (initialViewMode === '2D') {
        // console.log('🔧 Restoring 2D view mode on load')
        window.sceneViewModeHandler('2D')
      }
    }, 100) // Small delay to ensure scene is fully initialized

    // Initialize all MEP renderers using helper
    const mepRenderers = initializeMepRenderers(scene, camera, renderer, controls, rackData.fullParams)
    
    // Store renderers in refs for component access
    ductworkRendererRef.current = mepRenderers.ductwork
    pipingRendererRef.current = mepRenderers.piping
    conduitRendererRef.current = mepRenderers.conduit
    cableTrayRendererRef.current = mepRenderers.cableTray
    
    // Setup interactions for all MEP renderers using helper
    setupMepInteractions(mepRenderers, camera, renderer, controls)
    
    // Setup snap points for all MEP renderers using helper
    setupMepSnapPoints(mepRenderers, snapPoints)

    
    // Create editor handlers using helper
    const editorStates = {
      selectedDuct,
      selectedPipe,
      selectedConduit,
      selectedCableTray
    }
    
    const editorSetters = {
      setSelectedDuct,
      setShowDuctEditor,
      setSkipDuctRecreation,
      setSelectedPipe,
      setShowPipeEditor,
      setSkipPipeRecreation,
      setSelectedConduit,
      setShowConduitEditor,
      setSkipConduitRecreation,
      setSelectedCableTray,
      setShowCableTrayEditor,
      setSkipCableTrayRecreation
    }
    
    const editorHandlersInstance = createEditorHandlers(mepRenderers, editorStates, editorSetters)
    setEditorHandlers(editorHandlersInstance)
    const selectionHandlers = createSelectionHandlers(mepRenderers, editorSetters)
    
    // Setup editor callbacks polling using helper
    const cleanupEditorCallbacks = setupMepEditorCallbacks(mepRenderers, selectionHandlers)
    cleanupFunctions.push(cleanupEditorCallbacks)
    
    // Setup tier information updates using helper
    const cleanupTierUpdates = setupMepTierUpdates(mepRenderers, mepItems)
    cleanupFunctions.push(cleanupTierUpdates)
    
    // Setup editor callbacks for renderers using helper
    setupEditorCallbacks(mepRenderers, editorHandlersInstance)
    
    // Legacy handlers for backward compatibility (will be removed in future steps)
    const handleDuctEditorSave = (newDimensions) => {
      
      if (mepRenderers.ductwork?.ductInteraction) {
        // Update the 3D duct
        mepRenderers.ductwork.ductInteraction.updateDuctDimensions(newDimensions)
        
        // Update localStorage (MEP panel data)
        try {
          const storedMepItems = JSON.parse(localStorage.getItem('configurMepItems') || '[]')
          const selectedDuctData = selectedDuct?.userData?.ductData
          
          if (selectedDuctData) {
            // Find and update the matching item
            const updatedItems = storedMepItems.map(item => {
              if (item.id === selectedDuctData.id) {
                return { ...item, ...newDimensions }
              }
              return item
            })
            
            localStorage.setItem('configurMepItems', JSON.stringify(updatedItems))
            
            // Trigger refresh of MEP panel if callback exists
            if (window.refreshMepPanel) {
              window.refreshMepPanel()
            }
          }
        } catch (error) {
          console.error('Error updating MEP items:', error)
        }
      }
      
      setShowDuctEditor(false)
    }
    
    const handleDuctEditorCancel = () => {
      setShowDuctEditor(false)
    }
    
    // Pipe editor handlers
    const handlePipeEditorSave = (newDimensions) => {
      
      if (mepRenderers.piping?.pipeInteraction) {
        // Update the 3D pipe
        mepRenderers.piping.pipeInteraction.updatePipeDimensions(newDimensions)
        
        // Update localStorage (MEP panel data)
        try {
          const storedMepItems = JSON.parse(localStorage.getItem('configurMepItems') || '[]')
          const selectedPipeData = selectedPipe?.userData?.pipeData
          
          if (selectedPipeData) {
            // Find and update the matching item
            // Handle ID matching - selectedPipeData.id might have _0, _1 suffix for multiple pipes
            const baseId = selectedPipeData.id.toString().split('_')[0]
            
            const updatedItems = storedMepItems.map(item => {
              const itemBaseId = item.id.toString().split('_')[0]
              
              if (itemBaseId === baseId && item.type === 'pipe') {
                // Include current pipe position in the update
                const currentPosition = {
                  x: selectedPipe.position.x,
                  y: selectedPipe.position.y, 
                  z: selectedPipe.position.z
                }
                
                const updatedItem = { 
                  ...item, 
                  ...newDimensions,
                  position: currentPosition
                }
                return updatedItem
              }
              return item
            })
            
            localStorage.setItem('configurMepItems', JSON.stringify(updatedItems))
            
            // IMPORTANT: Also update the manifest to ensure consistency
            if (window.updateMEPItemsManifest) {
              window.updateMEPItemsManifest(updatedItems)
            } else {
              console.warn('⚠️ updateMEPItemsManifest not available - manifest may be out of sync')
            }
            
            // Dispatch custom event to notify MEP panel of changes
            window.dispatchEvent(new CustomEvent('mepItemsUpdated', {
              detail: { updatedItems, updatedPipeId: selectedPipeData.id }
            }))
            
            // Also try multiple refresh methods
            if (window.refreshMepPanel) {
              window.refreshMepPanel()
            }
            
            // Force re-render by dispatching storage event
            window.dispatchEvent(new StorageEvent('storage', {
              key: 'configurMepItems',
              newValue: JSON.stringify(updatedItems),
              storageArea: localStorage
            }))
          }
        } catch (error) {
          console.error('Error updating MEP pipe items:', error)
        }
      }
      
      setShowPipeEditor(false)
    }
    
    const handlePipeEditorCancel = () => {
      setShowPipeEditor(false)
    }
    
    const handleConduitEditorSave = (newDimensions) => {
      // console.log(`⚡ ThreeScene: handleConduitEditorSave called with:`, newDimensions)
      if (mepRenderers.conduit?.conduitInteraction) {
        // Update the 3D conduit with new dimensions
        mepRenderers.conduit.conduitInteraction.updateConduitDimensions(newDimensions)
        
        // Update MEP items in localStorage similar to pipes and ducts
        try {
          const storedMepItems = JSON.parse(localStorage.getItem('configurMepItems') || '[]')
          const selectedConduitData = selectedConduit?.userData?.conduitData
          
          if (selectedConduitData && storedMepItems.length > 0) {
            const baseId = selectedConduitData.id.toString().split('_')[0]
            
            const updatedItems = storedMepItems.map(item => {
              const itemBaseId = item.id.toString().split('_')[0]
              
              if (itemBaseId === baseId && item.type === 'conduit') {
                const currentPosition = {
                  x: selectedConduit.position.x,
                  y: selectedConduit.position.y, 
                  z: selectedConduit.position.z
                }
                
                // Include count in updates since it's now editable
                const updatedItem = { 
                  ...item, 
                  ...newDimensions,
                  position: currentPosition
                }
                return updatedItem
              }
              return item
            })
            
            localStorage.setItem('configurMepItems', JSON.stringify(updatedItems))
            
            if (window.updateMEPItemsManifest) {
              window.updateMEPItemsManifest(updatedItems)
            }
            
            window.dispatchEvent(new CustomEvent('mepItemsUpdated', {
              detail: { updatedItems, updatedConduitId: selectedConduitData.id }
            }))
            
            if (window.refreshMepPanel) {
              window.refreshMepPanel()
            }
            
            window.dispatchEvent(new StorageEvent('storage', {
              key: 'configurMepItems',
              newValue: JSON.stringify(updatedItems),
              storageArea: localStorage
            }))
          }
        } catch (error) {
          console.error('Error updating MEP conduit items:', error)
        }
      }
      
      setShowConduitEditor(false)
    }
    
    const handleConduitEditorCancel = () => {
      setShowConduitEditor(false)
    }
    
    // Cable tray editor handlers
    const handleCableTrayEditorSave = (newDimensions) => {
      // console.log(`🔌 ThreeScene: handleCableTrayEditorSave called with:`, newDimensions)
      
      // Set flag to prevent cable tray recreation
      setSkipCableTrayRecreation(true)
      
      if (cableTrayRendererRef.current?.cableTrayInteraction) {
        // First update the selected cable tray's userData to ensure consistency
        if (selectedCableTray?.userData?.cableTrayData) {
          selectedCableTray.userData.cableTrayData = {
            ...selectedCableTray.userData.cableTrayData,
            ...newDimensions
          }
        }
        
        // Update the 3D cable tray with new dimensions
        cableTrayRendererRef.current.cableTrayInteraction.updateCableTrayDimensions(newDimensions)
        
        // Update MEP items in localStorage similar to other MEP systems
        try {
          const storedMepItems = JSON.parse(localStorage.getItem('configurMepItems') || '[]')
          const selectedCableTrayData = selectedCableTray?.userData?.cableTrayData
          
          if (selectedCableTrayData && storedMepItems.length > 0) {
            const baseId = selectedCableTrayData.id.toString().split('_')[0]
            
            const updatedItems = storedMepItems.map(item => {
              const itemBaseId = item.id.toString().split('_')[0]
              
              if (itemBaseId === baseId && item.type === 'cableTray') {
                // console.log(`🔌 Found matching cable tray in localStorage to update:`, item)
                const currentPosition = {
                  x: selectedCableTray.position.x,
                  y: selectedCableTray.position.y, 
                  z: selectedCableTray.position.z
                }
                
                const updatedItem = {
                  ...item,
                  width: newDimensions.width,
                  height: newDimensions.height,
                  trayType: newDimensions.trayType,
                  tier: newDimensions.tier,
                  tierName: `Tier ${newDimensions.tier}`,
                  position: currentPosition
                }
                // console.log(`🔌 Updated cable tray item:`, updatedItem)
                return updatedItem
              }
              return item
            })
            
            localStorage.setItem('configurMepItems', JSON.stringify(updatedItems))
            // console.log(`🔌 Updated cable tray ${selectedCableTrayData.id} in localStorage`)
            
            // Dispatch storage event to update other components
            window.dispatchEvent(new Event('storage'))
          } else {
            console.warn('⚠️ Could not find cable tray data for localStorage update')
          }
        } catch (error) {
          console.error('Error updating MEP cable tray items:', error)
        }
      }
      
      // Don't close the editor immediately - let user click away or edit another cable tray
      // setShowCableTrayEditor(false)
    }
    
    const handleCableTrayEditorCancel = () => {
      setShowCableTrayEditor(false)
    }
    
    // Set callbacks on duct interaction
    if (mepRenderers.ductwork?.ductInteraction) {
      mepRenderers.ductwork.ductInteraction.setDuctEditorCallbacks(
        handleDuctEditorSave,
        handleDuctEditorCancel
      )
    }
    
    // Setup initial MEP update using helper
    const cleanupInitialUpdate = setupInitialMepUpdate(mepRenderers, mepItems)
    cleanupFunctions.push(cleanupInitialUpdate)

    // Enhanced ViewCube Setup
    const viewCubeScene    = new THREE.Scene()
    const viewCubeCamera   = new THREE.PerspectiveCamera(50, 1, 0.1, 100)
    viewCubeCamera.position.set(0, 0, 5) // Closer for better visibility
    viewCubeCamera.lookAt(0, 0, 0)
    
    const viewCube         = new ViewCube(1.2) // Larger size
    viewCubeScene.add(viewCube)

    // Add some lighting to the ViewCube scene
    const viewCubeAmbient = new THREE.AmbientLight(0xffffff, 0.6)
    const viewCubeDirectional = new THREE.DirectionalLight(0xffffff, 0.4)
    viewCubeDirectional.position.set(1, 1, 1)
    viewCubeScene.add(viewCubeAmbient, viewCubeDirectional)

    // Setup click handling for the ViewCube
    viewCube.setupClickHandler(camera, controls, scene)

    const viewCubeRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true })
    viewCubeRenderer.setSize(150, 150) // Larger ViewCube display
    viewCubeRenderer.setClearColor(0x000000, 0) // Fully transparent background
    viewCubeRenderer.toneMapping = THREE.ACESFilmicToneMapping
    viewCubeRenderer.outputColorSpace = THREE.SRGBColorSpace
    viewCubeRenderer.physicallyCorrectLights = true
    viewCubeRenderer.setPixelRatio(window.devicePixelRatio)
    mountRef.current.appendChild(viewCubeRenderer.domElement)
    Object.assign(viewCubeRenderer.domElement.style, {
      position: 'absolute',
      left: '20px',
      bottom: '20px',
      zIndex: '1000',
      cursor: 'pointer'
      // Removed border and background styling for clean transparent look
    })

    // ViewCube click handler
    const onViewCubeClick = (event) => {
      // Calculate mouse position relative to ViewCube canvas
      const rect = viewCubeRenderer.domElement.getBoundingClientRect()
      const mouse = new THREE.Vector2()
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

      // Raycast against ViewCube
      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera(mouse, viewCubeCamera)
      const intersects = raycaster.intersectObject(viewCube)

      if (intersects.length > 0) {
        const faceIndex = intersects[0].face.materialIndex
        viewCube.animateToView(faceIndex)
      }
    }

    viewCubeRenderer.domElement.addEventListener('click', onViewCubeClick)

    // Resize & Animate
    // Animation loop will be started later after ViewCube setup
      
    // Start animation loop using helper
    const stopAnimation = startAnimationLoop(renderer, scene, camera, controls, () => {
      // Frame callback
      updateOrthoCamera(camera, 20)
      
      // Update ViewCube if it exists
      if (viewCube && viewCubeCamera && viewCubeRenderer) {
        // Apply inverse rotation to ViewCube
        const inverseQuaternion = camera.quaternion.clone().invert()
        viewCube.quaternion.copy(inverseQuaternion)
        
        // Keep ViewCube camera looking at the ViewCube
        viewCubeCamera.position.set(0, 0, 5)
        viewCubeCamera.up.copy(camera.up)
        viewCubeCamera.lookAt(0, 0, 0)
        
        viewCubeRenderer.render(viewCubeScene, viewCubeCamera)
      }
      
      // Update measurement labels if tool exists
      if (measurementTool) {
        measurementTool.updateLabels()
      }
    })
    cleanupFunctions.push(stopAnimation)

    // Initialize centralized MEP selection manager using helper
    const mepSelectionManager = initializeMepSelection(scene, camera, renderer)

    // Initialize trade rack interaction system AFTER MEP manager
    const tradeRackInteraction = new TradeRackInteraction(scene, camera, renderer, controls)
    tradeRackInteractionRef.current = tradeRackInteraction
    
    // Add event listeners for trade rack selection
    const handleTradeRackSelected = (event) => {
      console.log('🎯 Trade rack selected event:', event.detail)
      setSelectedTradeRack(event.detail.rack)
    }
    
    const handleTradeRackDeselected = () => {
      console.log('❌ Trade rack deselected event')
      setSelectedTradeRack(null)
    }
    
    document.addEventListener('tradeRackSelected', handleTradeRackSelected)
    document.addEventListener('tradeRackDeselected', handleTradeRackDeselected)

    // Cleanup
    return () => {
      // Call all cleanup functions from helpers
      cleanupFunctions.forEach(cleanup => cleanup && cleanup())
      
      // Remove other event listeners
      controls.removeEventListener('change', onControlsChange)
      viewCubeRenderer.domElement.removeEventListener('click', onViewCubeClick)
      document.removeEventListener('tradeRackSelected', handleTradeRackSelected)
      document.removeEventListener('tradeRackDeselected', handleTradeRackDeselected)
      
      if (measurementToolRef.current) {
        measurementToolRef.current.dispose()
      }
      if (tradeRackInteractionRef.current) {
        tradeRackInteractionRef.current.dispose()
      }
      // Cleanup MEP renderers using helper
      cleanupMepRenderers(mepRenderers)
      
      // Clean up other global references
      if (window.measurementToolInstance) {
        delete window.measurementToolInstance
      }
      if (window.sceneViewModeHandler) {
        delete window.sceneViewModeHandler
      }
      if (window.sceneFitViewHandler) {
        delete window.sceneFitViewHandler
      }
      dispose(scene)
      disposeMaterials(materials)
      renderer.dispose()
      viewCubeRenderer.dispose()
      if (mountRef.current) {
        if (mountRef.current.contains(renderer.domElement)) {
          mountRef.current.removeChild(renderer.domElement)
        }
        if (mountRef.current.contains(viewCubeRenderer.domElement)) {
          mountRef.current.removeChild(viewCubeRenderer.domElement)
        }
      }
    }
  }, [initialRackParams, initialBuildingParams]) // Rebuild scene when parameters change

  // Handle measurement tool activation/deactivation
  useEffect(() => {
    if (measurementToolRef.current) {
      if (isMeasurementActive) {
        measurementToolRef.current.enable()
      } else {
        measurementToolRef.current.disable()
      }
    }
  }, [isMeasurementActive])

  // Update axis lock in measurement tool
  useEffect(() => {
    if (measurementToolRef.current) {
      measurementToolRef.current.setAxisLock(axisLock)
    }
  }, [axisLock])

  // Update ductwork and piping when MEP items change
  useEffect(() => {
    if (skipDuctRecreation) {
      setSkipDuctRecreation(false)
      return
    }
    
    if (skipPipeRecreation) {
      setSkipPipeRecreation(false)
      return
    }
    
    if (skipConduitRecreation) {
      setSkipConduitRecreation(false)
      return
    }
    
    if (skipCableTrayRecreation) {
      // Don't reset the flag immediately - wait for next render cycle
      setTimeout(() => setSkipCableTrayRecreation(false), 100)
      return
    }
    
    // Update all MEP items using helper
    const mepRenderers = {
      ductwork: ductworkRendererRef.current,
      piping: pipingRendererRef.current,
      conduit: conduitRendererRef.current,
      cableTray: cableTrayRendererRef.current
    }
    
    updateAllMepItems(mepRenderers, mepItems)
  }, [mepItems, skipDuctRecreation, skipPipeRecreation, skipConduitRecreation, skipCableTrayRecreation])

  const handleAxisToggle = (axis) => {
    setAxisLock(prev => {
      const currentlyLocked = prev[axis]
      if (currentlyLocked) {
        // If clicking already locked axis, unlock it
        return { x: false, y: false, z: false }
      } else {
        // If clicking unlocked axis, lock only this axis
        return { 
          x: axis === 'x', 
          y: axis === 'y', 
          z: axis === 'z' 
        }
      }
    })
  }

  const handleClearMeasurements = () => {
    if (measurementToolRef.current) {
      measurementToolRef.current.clearAll()
    }
  }

  return (
    <div ref={mountRef} style={{ width: '100%', height: '100%' }}>
      {isMeasurementActive && (
        <div className="measurement-controls-panel" style={{
          position: 'absolute',
          bottom: '120px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(255, 255, 255, 0.95)',
          border: '1px solid #E1E8ED',
          borderRadius: '8px',
          padding: '12px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
          zIndex: 1000,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          backdropFilter: 'blur(8px)',
          minWidth: '260px'
        }}>
          <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', color: '#2C3E50', textAlign: 'center' }}>
            Measurement Controls
          </div>
          
          {/* Axis Lock Section */}
          <div style={{ marginBottom: '8px' }}>
            <div style={{ fontSize: '11px', fontWeight: '500', marginBottom: '4px', color: '#555', textAlign: 'center' }}>
              Axis Lock:
            </div>
            <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', marginBottom: '8px' }}>
              {['X', 'Y', 'Z'].map(axis => (
                <button
                  key={axis}
                  onClick={() => handleAxisToggle(axis.toLowerCase())}
                  style={{
                    width: '30px',
                    height: '30px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    background: axisLock[axis.toLowerCase()] ? '#00D4FF' : 'white',
                    color: axisLock[axis.toLowerCase()] ? 'white' : '#333',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontSize: '12px',
                    borderColor: axisLock[axis.toLowerCase()] ? '#00D4FF' : '#ddd'
                  }}
                >
                  {axis}
                </button>
              ))}
            </div>
            
            {/* Clear Button */}
            <div style={{ textAlign: 'center' }}>
              <button
                onClick={handleClearMeasurements}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #ff4444',
                  borderRadius: '4px',
                  background: 'white',
                  color: '#ff4444',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontSize: '11px'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = '#ff4444'
                  e.target.style.color = 'white'
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'white'
                  e.target.style.color = '#ff4444'
                }}
              >
                Clear All
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Duct Editor */}
      {showDuctEditor && selectedDuct && cameraRef.current && rendererRef.current && editorHandlers && (
        <DuctEditor
          selectedDuct={selectedDuct}
          camera={cameraRef.current}
          renderer={rendererRef.current}
          visible={showDuctEditor}
          rackParams={rackParams}
          onSave={editorHandlers.duct.save}
          onCancel={editorHandlers.duct.cancel}
        />
      )}
      
      {/* Pipe Editor */}
      {showPipeEditor && selectedPipe && cameraRef.current && rendererRef.current && editorHandlers && (
        <PipeEditor
          selectedPipe={selectedPipe}
          camera={cameraRef.current}
          renderer={rendererRef.current}
          visible={showPipeEditor}
          rackParams={rackParams}
          onSave={editorHandlers.pipe.save}
          onCancel={editorHandlers.pipe.cancel}
        />
      )}
      
      {/* Conduit Editor */}
      {showConduitEditor && selectedConduit && cameraRef.current && rendererRef.current && editorHandlers && (
        <ConduitEditorUI
          selectedConduit={selectedConduit}
          camera={cameraRef.current}
          renderer={rendererRef.current}
          visible={showConduitEditor}
          rackParams={rackParams}
          onSave={editorHandlers.conduit.save}
          onCancel={editorHandlers.conduit.cancel}
        />
      )}
      
      {/* Cable Tray Editor */}
      {showCableTrayEditor && selectedCableTray && cameraRef.current && rendererRef.current && editorHandlers && (
        <CableTrayEditor
          selectedCableTray={selectedCableTray}
          camera={cameraRef.current}
          renderer={rendererRef.current}
          visible={showCableTrayEditor}
          rackParams={rackParams}
          onSave={editorHandlers.cableTray.save}
          onCancel={editorHandlers.cableTray.cancel}
        />
      )}
    </div>
  )
}
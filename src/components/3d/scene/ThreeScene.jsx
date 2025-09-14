/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import React, { useRef, useEffect, useState, useCallback } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { dispose } from '../core/utils.js'
import { ViewCube } from '../controls/ViewCube.js'
import {buildRackScene} from '../trade-rack/buildRack.js'
import { MeasurementTool } from '../controls/MeasurementTool.js'
import { DuctworkRenderer, DuctEditor } from '../ductwork'
import { PipingRenderer } from '../piping'
import { PipeEditor } from '../piping'
import { ConduitRenderer, ConduitEditorUI } from '../conduits'
import { CableTrayRenderer } from '../cable-trays'
import { CableTrayEditor } from '../cable-trays/CableTrayEditor'
import { createMaterials, loadTextures, disposeMaterials } from '../materials'
import { initializeMepSelectionManager } from '../core/MepSelectionManager.js'
import { TradeRackInteraction, TradeRackEditor } from '../trade-rack'
import '../styles/measurement-styles.css'
import { getTemporaryState, updateCameraState, getRackTemporaryState } from '../../../utils/temporaryState'
import { getProjectManifest, updateMEPItems } from '../../../utils/projectManifest'


/**
 * Main 3D scene component for the prefabrication assembly automation application
 * Manages Three.js renderer, cameras, controls, and all 3D content including rack structures,
 * MEP systems (ductwork, piping, conduits, cable trays), measurement tools, and interactions
 * 
 * @param {Object} props - Component properties
 * @param {boolean} props.isMeasurementActive - Whether measurement tool is currently active
 * @param {Array} props.mepItems - Array of MEP (mechanical, electrical, plumbing) items to render
 * @param {Object} props.initialRackParams - Initial rack configuration parameters
 * @param {Object} props.initialBuildingParams - Initial building shell parameters
 * @param {string} props.initialViewMode - Initial view mode ('3D', '2D', etc.)
 * @param {Function} props.onSceneReady - Callback fired when scene is initialized and ready
 * @returns {JSX.Element} The rendered 3D scene canvas
 */
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

  // Consolidated MEP editor state
  const [mepEditorState, setMepEditorState] = useState({
    duct: { selected: null, showEditor: false, skipRecreation: false },
    pipe: { selected: null, showEditor: false, skipRecreation: false },
    conduit: { selected: null, showEditor: false, skipRecreation: false },
    cableTray: { selected: null, showEditor: false, skipRecreation: false },
    tradeRack: { selected: null, showEditor: false, skipRecreation: false }
  })
  
  // State for rack parameters (to access in render)
  const [rackParams, setRackParams] = useState({
    tierCount: 2,
    tierHeights: [2, 2],
    topClearance: 0,
    bayCount: 4,
    bayWidth: 3,
    depth: 4,
    beamSize: 2,
    postSize: 2
  })
  
  // Utility function for MEP editor save operations
  const handleMepEditorSave = useCallback((type, selectedObject, newDimensions, renderer, interactionKey, updateMethod) => {
    setMepEditorState(prev => ({
      ...prev,
      [type]: { ...prev[type], skipRecreation: true }
    }))
    
    if (renderer?.[interactionKey]) {
      // Update selected object userData
      const dataKey = `${type}Data`
      if (selectedObject?.userData?.[dataKey]) {
        selectedObject.userData[dataKey] = {
          ...selectedObject.userData[dataKey],
          ...newDimensions
        }
      }
      
      // Update 3D object
      renderer[interactionKey][updateMethod](newDimensions)
      
      // Update manifest
      try {
        const manifest = getProjectManifest()
        const storedMepItems = [
          ...(manifest.mepItems?.ductwork || []),
          ...(manifest.mepItems?.piping || []),
          ...(manifest.mepItems?.conduits || []),
          ...(manifest.mepItems?.cableTrays || [])
        ]
        const selectedData = selectedObject?.userData?.[dataKey]
        
        if (selectedData) {
          const baseId = selectedData.id.toString().split('_')[0]
          const updatedItems = storedMepItems.map(item => {
            const itemBaseId = item.id.toString().split('_')[0]
            
            if (itemBaseId === baseId && (type === 'duct' || item.type === type)) {
              const currentPosition = {
                x: selectedObject.position.x,
                y: selectedObject.position.y,
                z: selectedObject.position.z
              }
              
              return {
                ...item,
                ...newDimensions,
                position: currentPosition
              }
            }
            return item
          })
          
          updateMEPItems(updatedItems, 'all')
          
          if (window.updateMEPItemsManifest) {
            window.updateMEPItemsManifest(updatedItems)
          }
          
          window.dispatchEvent(new CustomEvent('mepItemsUpdated', {
            detail: { updatedItems, [`updated${type.charAt(0).toUpperCase() + type.slice(1)}Id`]: selectedData.id }
          }))
          
          if (window.refreshMepPanel) {
            window.refreshMepPanel()
          }
          
          window.dispatchEvent(new StorageEvent('storage', {
            key: 'projectManifest',
            newValue: JSON.stringify(getProjectManifest()),
            storageArea: localStorage
          }))
        }
      } catch (error) {
        console.error(`Error updating MEP ${type} items:`, error)
      }
    }
    
    // Reset skip flag after delay
    setTimeout(() => {
      setMepEditorState(prev => ({
        ...prev,
        [type]: { ...prev[type], skipRecreation: false }
      }))
    }, 100)
  }, [])
  
  // MEP editor handler functions
  const handleDuctEditorSave = useCallback((newDimensions) => {
    handleMepEditorSave('duct', mepEditorState.duct.selected, newDimensions, ductworkRendererRef.current, 'ductInteraction', 'updateObjectDimensions')
    setMepEditorState(prev => ({ ...prev, duct: { ...prev.duct, showEditor: false } }))
  }, [handleMepEditorSave, mepEditorState.duct.selected])
  
  const handleDuctEditorCancel = useCallback(() => {
    setMepEditorState(prev => ({ ...prev, duct: { ...prev.duct, showEditor: false } }))
  }, [])
  
  const handlePipeEditorSave = useCallback((newDimensions) => {
    handleMepEditorSave('pipe', mepEditorState.pipe.selected, newDimensions, pipingRendererRef.current, 'pipeInteraction', 'updateObjectDimensions')
    setMepEditorState(prev => ({ ...prev, pipe: { ...prev.pipe, showEditor: false } }))
  }, [handleMepEditorSave, mepEditorState.pipe.selected])
  
  const handlePipeEditorCancel = useCallback(() => {
    setMepEditorState(prev => ({ ...prev, pipe: { ...prev.pipe, showEditor: false } }))
  }, [])
  
  const handleConduitEditorSave = useCallback((newDimensions) => {
    handleMepEditorSave('conduit', mepEditorState.conduit.selected, newDimensions, conduitRendererRef.current, 'conduitInteraction', 'updateConduitDimensions')
    setMepEditorState(prev => ({ ...prev, conduit: { ...prev.conduit, showEditor: false } }))
  }, [handleMepEditorSave, mepEditorState.conduit.selected])
  
  const handleConduitEditorCancel = useCallback(() => {
    setMepEditorState(prev => ({ ...prev, conduit: { ...prev.conduit, showEditor: false } }))
  }, [])
  
  const handleCableTrayEditorSave = useCallback((newDimensions) => {
    handleMepEditorSave('cableTray', mepEditorState.cableTray.selected, newDimensions, cableTrayRendererRef.current, 'cableTrayInteraction', 'updateCableTrayDimensions')
    setMepEditorState(prev => ({ ...prev, cableTray: { ...prev.cableTray, showEditor: false } }))
  }, [handleMepEditorSave, mepEditorState.cableTray.selected])
  
  const handleCableTrayEditorCancel = useCallback(() => {
    setMepEditorState(prev => ({ ...prev, cableTray: { ...prev.cableTray, showEditor: false } }))
  }, [])

  // One-time scene setup (renderer, camera, controls)
  useEffect(() => {
    // console.log('🚀 Initializing scene (one-time setup)')
    
    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.physicallyCorrectLights = true
    mountRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer // Store for duct editor

    // Scene & Lights
    const scene = new THREE.Scene()
    scene.background = null // Transparent background

    const ambient = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambient)

    const dirLight = new THREE.DirectionalLight(0xffffff, 1)
    dirLight.position.set(10, 20, 10)
    dirLight.castShadow = true
    scene.add(dirLight)

    const gridHelper = new THREE.GridHelper(100, 100, 0x000000, 0x000000)
    gridHelper.material.opacity = 0.15
    gridHelper.material.transparent = true
    gridHelper.material.depthWrite = false
    gridHelper.renderOrder = -1
    scene.add(gridHelper)

    // Background grid
    const lines = []
    const gridSize = 1000, gridStep = 10
    for (let i = -gridSize; i <= gridSize; i += gridStep) {
      lines.push(-gridSize, 0, i, gridSize, 0, i, i, 0, -gridSize, i, 0, gridSize)
    }
    const gridGeometry = new THREE.BufferGeometry()
    gridGeometry.setAttribute('position', new THREE.Float32BufferAttribute(lines, 3))
    const gridMaterial = new THREE.LineBasicMaterial({ color: 0x000000, opacity: 0.3, transparent: true, depthWrite: false })
    const backgroundGrid = new THREE.LineSegments(gridGeometry, gridMaterial)
    backgroundGrid.renderOrder = -2
    scene.add(backgroundGrid)

    function updateOrthoCamera(camera, viewHeight) {
      const aspect = window.innerWidth / window.innerHeight
      const halfHeight = viewHeight / 2
      const halfWidth = halfHeight * aspect
      camera.left = -halfWidth
      camera.right = halfWidth
      camera.top = halfHeight
      camera.bottom = -halfHeight
      camera.updateProjectionMatrix()
    }

    // Camera & Controls
    const aspect = window.innerWidth / window.innerHeight
    const d = 10
    const camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 0.01, 100)
    camera.zoom = 2
    camera.position.set(9.238, 7.435, 6.181)
    cameraRef.current = camera // Store for duct editor
    camera.lookAt(0, 0, 0)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.1
    controls.minZoom = 1.5
    controls.maxZoom = 100
    controls.keys = { LEFT: 'ArrowLeft', UP: 'ArrowUp', RIGHT: 'ArrowRight', BOTTOM: 'ArrowDown' }
    controls.target.set(-1.731, 2.686, -1.376)
    controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN }
    
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

    const onKeyDown = (evt) => {
      switch (evt.key.toLowerCase()) {
        case 'p':
          controls.mouseButtons.LEFT = THREE.MOUSE.PAN; break
        case 'o':
          controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE; break
        case 'escape':
          controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN }
          break
        case 'e': // Press 'E' to edit selected MEP item (backup method)
          const tradeRackSelected = tradeRackInteractionRef.current?.selectedObject
          if (tradeRackSelected) {
            setMepEditorState(prev => ({
              ...prev,
              tradeRack: { ...prev.tradeRack, selected: tradeRackSelected, showEditor: true }
            }))
          }
          break
      }
      controls.update()
    }
    window.addEventListener('keydown', onKeyDown)
    controls.update()

    // Environment - fixed sigmaRadians value to avoid clipping warning
    const pmremGenerator = new THREE.PMREMGenerator(renderer)
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture
    pmremGenerator.dispose() // Clean up to avoid memory leaks

    // Camera Logger

    // Materials
    const textures = loadTextures()
    const materials = createMaterials(textures)
    const {
      floorMaterial,
      postMaterial,
      longBeamMaterial,
      transBeamMaterial,
      wallMaterial,
      ceilingMaterial,
      roofMaterial,
      shellBeamMaterial,
      ductMat
    } = materials

    /* ---------- parameters ---------- */
    // Use passed rack and building parameters, with defaults as fallback
    // console.log('🔧 Scene building with rack params:', initialRackParams)
    // console.log('🔧 Scene building with building params:', initialBuildingParams)
    
    // Load temporary state FIRST to override any configuration values
    // But only if we're not creating a new rack
    let tempState = null
    if (!initialRackParams?.isNewRack) {
      try {
        tempState = getRackTemporaryState()
        if (tempState?.position) {
          console.log('🔧 Loading temporary state BEFORE building rack:', tempState)
          console.log('🔧 Temporary state position:', tempState.position)
          // Already in correct format
          tempState = { position: tempState.position }
        }
      } catch (error) {
        console.error('Error loading temporary state:', error)
      }
    } else {
      console.log('🔧 Skipping temporary state load - creating new rack')
    }

    const params = {
    // Building parameters
    corridorWidth  : initialBuildingParams?.corridorWidth || 10,
    corridorHeight : initialBuildingParams?.corridorHeight || 15,
    ceilingHeight  : initialBuildingParams?.ceilingHeight || 9,
    ceilingDepth   : initialBuildingParams?.ceilingDepth || 2,
    slabDepth      : initialBuildingParams?.slabDepth || 4,
    wallThickness  : initialBuildingParams?.wallThickness || 6,

    // Rack parameters - use TEMPORARY STATE first, then passed props or defaults
    bayCount  : initialRackParams?.bayCount || 4,
    bayWidth  : initialRackParams?.bayWidth || 3,
    depth     : initialRackParams?.depth || 4,

    // Use temporary state topClearance if available, otherwise use config/default
    topClearance : tempState?.topClearance !== undefined ? tempState.topClearance : (initialRackParams?.topClearance || 0),
    // Handle both old postSize format and new columnSizes + columnType format
    postSize     : initialRackParams?.columnSizes && initialRackParams?.columnType 
                   ? initialRackParams.columnSizes[initialRackParams.columnType] 
                   : (initialRackParams?.postSize || 2),
    // Handle both old beamSize format and new beamSizes + beamType format
    beamSize     : initialRackParams?.beamSizes && initialRackParams?.beamType 
                   ? initialRackParams.beamSizes[initialRackParams.beamType] 
                   : (initialRackParams?.beamSize || 2),

    tierCount    : initialRackParams?.tierCount || 2,
    tierHeights  : initialRackParams?.tierHeights || [2, 2],   // ft  (parallel array #1)

    // Pass new parameter structure for beam/column type selection
    beamSizes    : initialRackParams?.beamSizes,
    beamType     : initialRackParams?.beamType,
    columnSizes  : initialRackParams?.columnSizes,
    columnType   : initialRackParams?.columnType,

    /* per-tier duct settings – disabled to use DuctworkRenderer instead */
    ductEnabled  : [false, false],
    ductWidths   : [18, 18], // in  (parallel array #2)
    ductHeights  : [16, 16], // in  (parallel array #3)
    ductOffsets  : [ 0,  0], // in  (parallel array #4)
    
    // Position handling: distinguish between page refresh vs new rack
    // If tempState exists, it's likely a page refresh, so use temporary state
    // If no tempState and isNewRack, it's a fresh new rack
    position: tempState?.position || initialRackParams?.position,
    
    // Pass basic flags
    isNewRack: initialRackParams?.isNewRack || false,
    isUsingPreservedPosition: !!initialRackParams?.isUsingPreservedPosition
    };
    
    console.log('🔧 Final params position before buildRack:', params.position)

    const mats = {
        postMaterial,
        longBeamMaterial,
        transBeamMaterial,
        wallMaterial,
        ceilingMaterial,
        floorMaterial,
        roofMaterial,
        shellBeamMaterial,
        ductMat
        };
    
    const snapPoints = buildRackScene(scene, params, mats)
    
    // Update rack configuration and position with temporary state values for consistency
    if (tempState) {
      scene.traverse((child) => {
        if (child.userData?.type === 'tradeRack') {
          // Update position if temporary state has different position than what was built
          if (tempState.position) {
            child.position.set(
              tempState.position.x || child.position.x,
              tempState.position.y || child.position.y,
              tempState.position.z || child.position.z
            )
          }
          
          // Update configuration with temporary state values
          if (child.userData.configuration) {
            child.userData.configuration.topClearance = tempState.topClearance || 0
            
            // Update position in configuration as well for editor consistency
            if (tempState.position) {
              child.userData.configuration.position = {
                x: tempState.position.x || 0,
                y: tempState.position.y || 0,
                z: tempState.position.z || 0
              }
            }
          }
        }
      })
    }
    
    // Update rack parameters state for use in render
    setRackParams({
      tierCount: params.tierCount,
      tierHeights: params.tierHeights,
      bayCount: params.bayCount,
      bayWidth: params.bayWidth,
      depth: params.depth,
      beamSize: params.beamSize,
      postSize: params.postSize
    })

    // Notify parent that scene is ready
    if (onSceneReady) {
      onSceneReady(scene, mats, snapPoints)
    }

    // Center the orbit controls on the generated content
    const centerOrbitOnContent = () => {
      const bbox = new THREE.Box3()
      
      // Only include generated objects (rack and MEP components)
      scene.traverse((object) => {
        if (object.userData.isGenerated && object.isMesh) {
          const objectBBox = new THREE.Box3().setFromObject(object)
          bbox.union(objectBBox)
        }
      })

      if (!bbox.isEmpty()) {
        const center = bbox.getCenter(new THREE.Vector3())
        controls.target.copy(center)
        controls.update()
      }
    }

    // Set initial orbit center
    centerOrbitOnContent()

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
        updateCameraState(cameraState)
        // console.log('💾 Camera state saved:', cameraState)
      } catch (error) {
        console.warn('⚠️ Failed to save camera state:', error)
      }
    }
    
    const loadCameraState = () => {
      try {
        const tempState = getTemporaryState()
        const cameraState = tempState.camera
        if (cameraState && cameraState.position) {
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
    
    // Initialize a stub for sceneViewModeHandler to prevent early call errors
    window.sceneViewModeHandler = () => {
      console.warn('sceneViewModeHandler called before full initialization')
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
        
        const size = bbox.getSize(new THREE.Vector3())
        
        // console.log('🔧 2D View - Bounding box size:', size.x, size.y, size.z)
        
        // Position camera to look from the right side (positive X direction)
        // This gives us a side elevation view
        const center = bbox.getCenter(new THREE.Vector3())
        camera.position.set(center.x + 10, center.y, center.z)
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

    // Create standardized rack parameters for all MEP systems
    const rackParams = {
      bayCount: params.bayCount,
      bayWidth: params.bayWidth,
      depth: params.depth,
      rackWidth: params.depth,
      tierCount: params.tierCount,
      tierHeights: params.tierHeights,
      topClearance: params.topClearance,
      beamSize: params.beamSize,
      postSize: params.postSize,
      columnSize: params.postSize,
      columnType: 'standard'
    }
    
    // Initialize ductwork renderer
    const ductworkRenderer = new DuctworkRenderer(scene, rackParams)
    ductworkRendererRef.current = ductworkRenderer
    window.ductworkRendererInstance = ductworkRenderer
    
    // Initialize piping renderer
    const pipingRenderer = new PipingRenderer(
      scene, camera, renderer, controls,
      ductworkRenderer.snapLineManager
    )
    pipingRendererRef.current = pipingRenderer
    window.pipingRendererInstance = pipingRenderer
    pipingRenderer.updateRackParams(rackParams)

    // Initialize conduit renderer
    const conduitRenderer = new ConduitRenderer(
      scene, camera, renderer, controls,
      ductworkRenderer.snapLineManager
    )
    conduitRendererRef.current = conduitRenderer
    window.conduitRendererInstance = conduitRenderer
    conduitRenderer.updateRackParams(rackParams)

    // Initialize cable tray renderer
    const cableTrayRenderer = new CableTrayRenderer(
      scene, ductworkRenderer.snapLineManager
    )
    cableTrayRendererRef.current = cableTrayRenderer
    window.cableTrayRendererInstance = cableTrayRenderer
    
    // Setup MEP system interactions
    const interactionParams = [camera, renderer, controls]
    ductworkRenderer.setupInteractions(...interactionParams)
    pipingRenderer.setupInteractions(...interactionParams)
    conduitRenderer.setupInteractions(...interactionParams)
    cableTrayRenderer.setupInteractions(...interactionParams)

    // Provide access to snap points for measurement tool
    const geometryKeys = ['ductGeometry', 'pipeGeometry', 'conduitGeometry', 'cableTrayGeometry']
    const renderers = [ductworkRenderer, pipingRenderer, conduitRenderer, cableTrayRenderer]
    
    renderers.forEach((renderer, index) => {
      const geometry = renderer[geometryKeys[index]]
      if (geometry?.setSnapPoints) {
        geometry.setSnapPoints(snapPoints)
      }
    })

    
    // Simple polling to check MEP selections and auto-open editors
    const handleMepSelection = () => {
      const selections = {
        duct: ductworkRenderer.ductInteraction?.selectedObject,
        pipe: pipingRenderer.pipeInteraction?.selectedObject,
        conduit: conduitRenderer.conduitInteraction?.selectedObject,
        cableTray: cableTrayRenderer.cableTrayInteraction?.getSelectedCableTray()
      }
      
      setMepEditorState(prev => {
        const newState = { ...prev }
        
        Object.entries(selections).forEach(([type, selected]) => {
          if (newState[type].selected !== selected) {
            newState[type].selected = selected
            
            // Open editor when selected, close when deselected
            if (selected && !newState[type].skipRecreation) {
              newState[type].showEditor = true
            } else if (!selected) {
              newState[type].showEditor = false
            }
          }
        })
        
        return newState
      })
    }
    
    // Poll every 200ms - simple and works
    const pollSelection = setInterval(handleMepSelection, 200)
    
    
    // Periodically update tier information for all MEP systems
    const pollTierInfo = setInterval(() => {
      if (mepItems.length > 0) {
        if (ductworkRenderer.ductInteraction?.updateAllDuctTierInfo) {
          ductworkRenderer.ductInteraction.updateAllDuctTierInfo()
        }
        if (pipingRenderer.pipeInteraction?.updateAllPipeTierInfo) {
          pipingRenderer.pipeInteraction.updateAllPipeTierInfo()
        }
        if (cableTrayRenderer.cableTrayInteraction?.updateAllCableTrayTierInfo) {
          cableTrayRenderer.cableTrayInteraction.updateAllCableTrayTierInfo()
        }
      }
    }, 5000)
    
    
    
    
    // Base class handles editor callbacks automatically through events
    
    // Initial ductwork, piping, conduit, and cable tray update
    setTimeout(() => {
      if (mepItems && mepItems.length > 0) {
        ductworkRenderer.updateDuctwork(mepItems)
        pipingRenderer.updatePiping(mepItems)
        conduitRenderer.updateConduits(mepItems)
        cableTrayRenderer.updateCableTrays(mepItems)
      }
    }, 200) // Small delay to ensure everything is ready

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
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onResize)

    ;(function animate() {
      requestAnimationFrame(animate)
      controls.update()
      updateOrthoCamera(camera, 20)
      
      // Global TransformControls safety check
      try {
        // Check all MEP interaction instances for orphaned TransformControls
        const interactions = [
          ductworkRendererRef.current?.ductInteraction,
          pipingRendererRef.current?.pipeInteraction, 
          conduitRendererRef.current?.conduitInteraction,
          cableTrayRendererRef.current?.cableTrayInteraction
        ].filter(Boolean)
        
        interactions.forEach(interaction => {
          if (interaction.transformControls?.object && !interaction.transformControls.object.parent) {
            console.warn('⚠️ Detaching orphaned TransformControls in animation loop')
            interaction.transformControls.detach()
          }
        })
        
        renderer.render(scene, camera)
      } catch (error) {
        if (error.message.includes('TransformControls')) {
          console.warn('⚠️ TransformControls error caught in animation loop:', error.message)
        } else {
          console.error('❌ Animation loop error:', error)
        }
      }
      
      // Apply inverse rotation to ViewCube so it shows correct faces
      // When camera rotates right, ViewCube should rotate left to show the face we're looking from
      const inverseQuaternion = camera.quaternion.clone().invert()
      viewCube.quaternion.copy(inverseQuaternion)
      
      // Keep ViewCube camera looking at the ViewCube with same up vector as main camera
      viewCubeCamera.position.set(0, 0, 5)
      viewCubeCamera.up.copy(camera.up)
      viewCubeCamera.lookAt(0, 0, 0)
      
      viewCubeRenderer.render(viewCubeScene, viewCubeCamera)
      measurementTool.updateLabels()
    })()

    // Initialize centralized MEP selection manager AFTER all interactions are set up
    initializeMepSelectionManager(scene, camera, renderer)

    // Initialize trade rack interaction system AFTER MEP manager
    const tradeRackInteraction = new TradeRackInteraction(scene, camera, renderer, controls)
    tradeRackInteractionRef.current = tradeRackInteraction
    
    // Expose globally for configuration saving
    window.tradeRackInteractionInstance = tradeRackInteraction
    
    // Add event listeners for trade rack selection
    const handleTradeRackSelected = (event) => {
      // console.log('🎯 Trade rack selected event:', event.detail)
      setMepEditorState(prev => ({
        ...prev,
        tradeRack: { ...prev.tradeRack, selected: event.detail.rack, showEditor: true }
      }))
    }
    
    const handleTradeRackDeselected = () => {
      // console.log('❌ Trade rack deselected event')
      setMepEditorState(prev => ({
        ...prev,
        tradeRack: { ...prev.tradeRack, selected: null, showEditor: false }
      }))
    }
    
    document.addEventListener('tradeRackSelected', handleTradeRackSelected)
    document.addEventListener('tradeRackDeselected', handleTradeRackDeselected)

    // Cleanup
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('resize', onResize)
      viewCubeRenderer.domElement.removeEventListener('click', onViewCubeClick)
      document.removeEventListener('tradeRackSelected', handleTradeRackSelected)
      document.removeEventListener('tradeRackDeselected', handleTradeRackDeselected)
      
      // Cleanup selection polling
      if (pollSelection) {
        clearInterval(pollSelection)
      }
      
      // Cleanup tier info polling
      if (pollTierInfo) {
        clearInterval(pollTierInfo)
      }
      
      if (measurementToolRef.current) {
        measurementToolRef.current.dispose()
      }
      if (tradeRackInteractionRef.current) {
        tradeRackInteractionRef.current.dispose()
      }
      // Clean up global references
      if (window.mepSelectionManager) {
        window.mepSelectionManager.dispose()
        delete window.mepSelectionManager
      }
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
  }, []) // One-time setup only - prevent WebGL context leaks
  // TODO: Add separate useEffect for parameter updates that rebuilds scene content without creating new WebGL context

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

  // Update ductwork and piping when MEP items change (NOT when editor state changes!)
  useEffect(() => {
    // Check skip flags and reset them
    const shouldSkip = Object.entries(mepEditorState).some(([type, state]) => {
      if (state.skipRecreation) {
        setTimeout(() => {
          setMepEditorState(prev => ({
            ...prev,
            [type]: { ...prev[type], skipRecreation: false }
          }))
        }, type === 'cableTray' ? 100 : 0)
        return true
      }
      return false
    })
    
    if (shouldSkip) return
    
    console.log('🔄 MEP Items changed - updating renderers with:', mepItems?.length, 'items')
    
    if (ductworkRendererRef.current && mepItems) {
      ductworkRendererRef.current.updateDuctwork(mepItems)
    }
    
    if (pipingRendererRef.current && mepItems) {
      pipingRendererRef.current.updatePiping(mepItems)
    }

    if (conduitRendererRef.current && mepItems) {
      conduitRendererRef.current.updateConduits(mepItems)
    }

    if (cableTrayRendererRef.current && mepItems) {
      cableTrayRendererRef.current.updateCableTrays(mepItems)
    }
  }, [mepItems]) // REMOVED mepEditorState dependency!
  
  // Separate effect to handle skip recreation flags
  useEffect(() => {
    Object.entries(mepEditorState).forEach(([type, state]) => {
      if (state.skipRecreation) {
        setTimeout(() => {
          setMepEditorState(prev => ({
            ...prev,
            [type]: { ...prev[type], skipRecreation: false }
          }))
        }, type === 'cableTray' ? 100 : 0)
      }
    })
  }, [mepEditorState])

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
      {mepEditorState.duct.showEditor && mepEditorState.duct.selected && cameraRef.current && rendererRef.current && (
        <DuctEditor
          selectedObject={mepEditorState.duct.selected}
          camera={cameraRef.current}
          renderer={rendererRef.current}
          visible={mepEditorState.duct.showEditor}
          onSave={handleDuctEditorSave}
          onCancel={handleDuctEditorCancel}
          onCopy={() => ductworkRendererRef.current?.ductInteraction?.copySelectedObject()}
        />
      )}
      
      {/* Pipe Editor */}
      {mepEditorState.pipe.showEditor && mepEditorState.pipe.selected && cameraRef.current && rendererRef.current && (
        <PipeEditor
          selectedObject={mepEditorState.pipe.selected}
          camera={cameraRef.current}
          renderer={rendererRef.current}
          visible={mepEditorState.pipe.showEditor}
          onSave={handlePipeEditorSave}
          onCancel={handlePipeEditorCancel}
          onCopy={() => pipingRendererRef.current?.pipeInteraction?.copySelectedObject()}
        />
      )}
      
      {/* Conduit Editor */}
      {mepEditorState.conduit.showEditor && mepEditorState.conduit.selected && cameraRef.current && rendererRef.current && (
        <ConduitEditorUI
          selectedConduit={mepEditorState.conduit.selected}
          camera={cameraRef.current}
          renderer={rendererRef.current}
          visible={mepEditorState.conduit.showEditor}
          rackParams={rackParams}
          onSave={handleConduitEditorSave}
          onCancel={handleConduitEditorCancel}
          onCopy={() => conduitRendererRef.current?.conduitInteraction?.copySelectedConduit()}
        />
      )}
      
      {/* Cable Tray Editor */}
      {mepEditorState.cableTray.showEditor && mepEditorState.cableTray.selected && cameraRef.current && rendererRef.current && (
        <CableTrayEditor
          selectedCableTray={mepEditorState.cableTray.selected}
          camera={cameraRef.current}
          renderer={rendererRef.current}
          visible={mepEditorState.cableTray.showEditor}
          rackParams={rackParams}
          onSave={handleCableTrayEditorSave}
          onCancel={handleCableTrayEditorCancel}
          onCopy={() => cableTrayRendererRef.current?.cableTrayInteraction?.duplicateSelectedCableTray()}
        />
      )}
      
      {/* Trade Rack Editor */}
      {mepEditorState.tradeRack.showEditor && mepEditorState.tradeRack.selected && cameraRef.current && rendererRef.current && (
        <TradeRackEditor
          selectedObject={mepEditorState.tradeRack.selected}
          camera={cameraRef.current}
          renderer={rendererRef.current}
          visible={mepEditorState.tradeRack.showEditor}
          onSave={(newDimensions) => {
            console.log(`🔧 ThreeScene: TradeRackEditor save called with:`, newDimensions)
            
            setMepEditorState(prev => ({
              ...prev,
              tradeRack: { ...prev.tradeRack, skipRecreation: true }
            }))
            
            if (tradeRackInteractionRef.current && tradeRackInteractionRef.current.selectedObject) {
              tradeRackInteractionRef.current.updateTradeRackDimensions(newDimensions)
              console.log('🔧 Triggered trade rack rebuild with new dimensions:', newDimensions)
            }
            
            setTimeout(() => {
              setMepEditorState(prev => ({
                ...prev,
                tradeRack: { ...prev.tradeRack, skipRecreation: false, showEditor: false }
              }))
            }, 100)
          }}
          onCancel={() => {
            setMepEditorState(prev => ({ ...prev, tradeRack: { ...prev.tradeRack, showEditor: false } }))
          }}
        />
      )}
    </div>
  )
}
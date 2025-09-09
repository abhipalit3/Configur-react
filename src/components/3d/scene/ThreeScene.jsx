/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import React, { useRef, useEffect, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { dispose } from '../core/utils.js'
import { TransformControls } from 'three/addons/controls/TransformControls.js'
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
import { TradeRackInteraction } from '../trade-rack/TradeRackInteraction.js'
import '../styles/measurement-styles.css'


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

    function createBackgroundGrid(size = 1000, step = 10, color = 0x000000) {
      const lines = []
      for (let i = -size; i <= size; i += step) {
        lines.push(-size, 0, i, size, 0, i)
        lines.push(i, 0, -size, i, 0, size)
      }
      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(lines.flat(), 3))
      const material = new THREE.LineBasicMaterial({ color, opacity: 0.3, transparent: true, depthWrite: false })
      const lineSegments = new THREE.LineSegments(geometry, material)
      lineSegments.renderOrder = -2
      scene.add(lineSegments)
    }
    createBackgroundGrid()

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

    let currentMode = 'default'
    const onKeyDown = (evt) => {
      switch (evt.key.toLowerCase()) {
        case 'p':
          controls.mouseButtons.LEFT = THREE.MOUSE.PAN; currentMode = 'pan'; break
        case 'o':
          controls.mouseButtons.LEFT = THREE.MOUSE.ROTATE; currentMode = 'orbit'; break
        case 'escape':
          controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN }
          currentMode = 'default'; break
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
    const logCamera = () => {
    }
    const onLog = (e) => { if (e.code === 'KeyL') logCamera() }
    window.addEventListener('keydown', onLog)

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
    
    const params = {
    // Building parameters
    corridorWidth  : initialBuildingParams?.corridorWidth || 10,
    corridorHeight : initialBuildingParams?.corridorHeight || 15,
    ceilingHeight  : initialBuildingParams?.ceilingHeight || 9,
    ceilingDepth   : initialBuildingParams?.ceilingDepth || 2,
    slabDepth      : initialBuildingParams?.slabDepth || 4,
    wallThickness  : initialBuildingParams?.wallThickness || 6,

    // Rack parameters - use passed props or defaults
    bayCount  : initialRackParams?.bayCount || 4,
    bayWidth  : initialRackParams?.bayWidth || 3,
    depth     : initialRackParams?.depth || 4,

    topClearance : initialRackParams?.topClearance || 15,
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
    ductOffsets  : [ 0,  0]  // in  (parallel array #4)
    };

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

    // Initialize ductwork renderer with the same rack parameters used by buildRack
    const ductworkRenderer = new DuctworkRenderer(scene, {
      bayCount: params.bayCount,
      bayWidth: params.bayWidth,
      depth: params.depth,
      rackWidth: params.depth, // Map depth to rackWidth for clarity
      tierCount: params.tierCount,
      tierHeights: params.tierHeights, // These are already numbers in feet
      topClearance: params.topClearance,
      beamSize: params.beamSize,
      postSize: params.postSize,
      columnSize: params.postSize, // Also map postSize to columnSize for consistency
      columnType: 'standard' // Default column type
    })
    ductworkRendererRef.current = ductworkRenderer
    
    // Make ductwork renderer globally accessible
    window.ductworkRendererInstance = ductworkRenderer
    
    // Initialize piping renderer with the same parameters
    const pipingRenderer = new PipingRenderer(
      scene,
      camera, 
      renderer,
      controls,
      ductworkRenderer.snapLineManager // Share snap line manager with ductwork
    )
    pipingRendererRef.current = pipingRenderer
    
    // Make piping renderer globally accessible
    window.pipingRendererInstance = pipingRenderer
    
    // Update piping renderer with rack parameters
    pipingRenderer.updateRackParams({
      bayCount: params.bayCount,
      bayWidth: params.bayWidth,
      depth: params.depth,
      rackWidth: params.depth,
      tierCount: params.tierCount,
      tierHeights: params.tierHeights,
      topClearance: params.topClearance,
      beamSize: params.beamSize,
      postSize: params.postSize
    })

    // Initialize conduit renderer with the same parameters
    const conduitRenderer = new ConduitRenderer(
      scene,
      camera, 
      renderer,
      controls,
      ductworkRenderer.snapLineManager // Share snap line manager with ductwork and piping
    )
    conduitRendererRef.current = conduitRenderer
    
    // Make conduit renderer globally accessible
    window.conduitRendererInstance = conduitRenderer
    
    // Update conduit renderer with rack parameters
    conduitRenderer.updateRackParams({
      bayCount: params.bayCount,
      bayWidth: params.bayWidth,
      depth: params.depth,
      rackWidth: params.depth,
      tierCount: params.tierCount,
      tierHeights: params.tierHeights,
      topClearance: params.topClearance,
      beamSize: params.beamSize,
      postSize: params.postSize
    })

    // Initialize cable tray renderer with the same parameters
    const cableTrayRenderer = new CableTrayRenderer(
      scene,
      ductworkRenderer.snapLineManager // Share snap line manager with other MEP systems
    )
    cableTrayRendererRef.current = cableTrayRenderer
    
    // Make cable tray renderer globally accessible
    window.cableTrayRendererInstance = cableTrayRenderer
    
    // Setup ductwork interactions
    ductworkRenderer.setupInteractions(camera, renderer, controls)
    
    // Setup piping interactions
    pipingRenderer.setupInteractions(camera, renderer, controls)

    // Setup conduit interactions
    conduitRenderer.setupInteractions(camera, renderer, controls)

    // Setup cable tray interactions
    cableTrayRenderer.setupInteractions(camera, renderer, controls)

    // Provide access to snap points for measurement tool
    if (ductworkRenderer.ductGeometry) {
      ductworkRenderer.ductGeometry.setSnapPoints(snapPoints)
    }
    if (pipingRenderer.pipeGeometry) {
      pipingRenderer.pipeGeometry.setSnapPoints(snapPoints)
    }
    if (conduitRenderer.conduitGeometry) {
      conduitRenderer.conduitGeometry.setSnapPoints(snapPoints)
    }
    if (cableTrayRenderer.cableTrayGeometry) {
      cableTrayRenderer.cableTrayGeometry.setSnapPoints(snapPoints)
    }

    
    // Setup duct editor callbacks
    const handleDuctSelection = () => {
      const selected = ductworkRenderer.ductInteraction?.getSelectedDuct()
      setSelectedDuct(selected)
      setShowDuctEditor(!!selected)
    }
    
    // Setup pipe editor callbacks
    const handlePipeSelection = () => {
      const selected = pipingRenderer.pipeInteraction?.getSelectedPipe()
      setSelectedPipe(selected)
      setShowPipeEditor(!!selected)
    }
    
    // Setup conduit editor callbacks
    const handleConduitSelection = () => {
      const selected = conduitRenderer.conduitInteraction?.getSelectedConduit()
      setSelectedConduit(selected)
      setShowConduitEditor(!!selected)
    }
    
    // Setup cable tray editor callbacks
    const handleCableTraySelection = () => {
      const selected = cableTrayRenderer.cableTrayInteraction?.getSelectedCableTray()
      setSelectedCableTray(selected)
      // Only automatically open editor if not currently skipping recreation (during save operations)
      if (!skipCableTrayRecreation) {
        setShowCableTrayEditor(!!selected)
      }
    }
    
    // Poll for duct, pipe, conduit, and cable tray selection changes
    const pollSelection = setInterval(() => {
      handleDuctSelection()
      handlePipeSelection()
      handleConduitSelection()
      handleCableTraySelection()
    }, 100)
    
    // Periodically update tier information for all ducts
    const pollTierInfo = setInterval(() => {
      if (ductworkRenderer.ductInteraction && mepItems.length > 0) {
        ductworkRenderer.ductInteraction.updateAllDuctTierInfo()
      }
      // Update pipe tier information (now with Above/Below rack detection)
      if (pipingRenderer.pipeInteraction && mepItems.length > 0) {
        pipingRenderer.pipeInteraction.updateAllPipeTierInfo()
      }
      
      // Update cable tray tier information
      if (cableTrayRenderer.cableTrayInteraction && mepItems.length > 0) {
        cableTrayRenderer.cableTrayInteraction.updateAllCableTrayTierInfo()
      }
    }, 5000) // Update every 5 seconds
    
    const handleDuctEditorSave = (newDimensions) => {
      
      if (ductworkRenderer.ductInteraction) {
        // Update the 3D duct
        ductworkRenderer.ductInteraction.updateDuctDimensions(newDimensions)
        
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
      
      if (pipingRenderer.pipeInteraction) {
        // Update the 3D pipe
        pipingRenderer.pipeInteraction.updatePipeDimensions(newDimensions)
        
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
      if (conduitRenderer.conduitInteraction) {
        // Update the 3D conduit with new dimensions
        conduitRenderer.conduitInteraction.updateConduitDimensions(newDimensions)
        
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
    if (ductworkRenderer.ductInteraction) {
      ductworkRenderer.ductInteraction.setDuctEditorCallbacks(
        handleDuctEditorSave,
        handleDuctEditorCancel
      )
    }
    
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
    const mepSelectionManager = initializeMepSelectionManager(scene, camera, renderer)
    console.log('🎯 MEP Selection Manager initialized in ThreeScene at end')

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
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keydown', onLog)
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
    
    if (ductworkRendererRef.current && mepItems) {
      ductworkRendererRef.current.updateDuctwork(mepItems)
    }
    
    if (pipingRendererRef.current && mepItems) {
      pipingRendererRef.current.updatePiping(mepItems)
    }

    if (conduitRendererRef.current && mepItems && !skipConduitRecreation) {
      conduitRendererRef.current.updateConduits(mepItems)
    }

    if (cableTrayRendererRef.current && mepItems && !skipCableTrayRecreation) {
      cableTrayRendererRef.current.updateCableTrays(mepItems)
    }
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
      {showDuctEditor && selectedDuct && cameraRef.current && rendererRef.current && (
        <DuctEditor
          selectedDuct={selectedDuct}
          camera={cameraRef.current}
          renderer={rendererRef.current}
          visible={showDuctEditor}
          rackParams={rackParams}
          onSave={(dimensions) => {
            
            // Set flag to prevent duct recreation
            setSkipDuctRecreation(true)
            
            if (ductworkRendererRef.current?.ductInteraction) {
              // First update the selected duct's userData to ensure consistency
              if (selectedDuct?.userData?.ductData) {
                selectedDuct.userData.ductData = {
                  ...selectedDuct.userData.ductData,
                  ...dimensions
                }
              }
              
              // Update the 3D duct
              ductworkRendererRef.current.ductInteraction.updateDuctDimensions(dimensions)
              
              // Update localStorage (MEP panel data)
              try {
                const storedMepItems = JSON.parse(localStorage.getItem('configurMepItems') || '[]')
                const selectedDuctData = selectedDuct?.userData?.ductData
                
                if (selectedDuctData) {
                  
                  // Find and update the matching item
                  // Handle ID matching - selectedDuctData.id might have _0, _1 suffix for multiple ducts
                  const baseId = selectedDuctData.id.toString().split('_')[0]
                  
                  const updatedItems = storedMepItems.map(item => {
                    const itemBaseId = item.id.toString().split('_')[0]
                    
                    if (itemBaseId === baseId) {
                      // Include current duct position in the update
                      const currentPosition = {
                        x: selectedDuct.position.x,
                        y: selectedDuct.position.y, 
                        z: selectedDuct.position.z
                      }
                      
                      const updatedItem = { 
                        ...item, 
                        ...dimensions,
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
                    detail: { updatedItems, updatedDuctId: selectedDuctData.id }
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
                console.error('Error updating MEP items:', error)
              }
            }
            
            // Don't close the editor immediately - let user click away or edit another duct
            // setShowDuctEditor(false)
          }}
          onCancel={() => {
            setShowDuctEditor(false)
          }}
          onCopy={() => {
            if (ductworkRendererRef.current?.ductInteraction) {
              ductworkRendererRef.current.ductInteraction.duplicateSelectedDuct()
            }
          }}
        />
      )}
      
      {/* Pipe Editor */}
      {showPipeEditor && selectedPipe && cameraRef.current && rendererRef.current && (
        <PipeEditor
          selectedPipe={selectedPipe}
          camera={cameraRef.current}
          renderer={rendererRef.current}
          visible={showPipeEditor}
          rackParams={rackParams}
          onSave={(dimensions) => {
            
            // Set flag to prevent pipe recreation
            setSkipPipeRecreation(true)
            
            if (pipingRendererRef.current?.pipeInteraction) {
              // First update the selected pipe's userData to ensure consistency
              if (selectedPipe?.userData?.pipeData) {
                selectedPipe.userData.pipeData = {
                  ...selectedPipe.userData.pipeData,
                  ...dimensions
                }
              }
              
              // Update the 3D pipe
              pipingRendererRef.current.pipeInteraction.updatePipeDimensions(dimensions)
              
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
                        ...dimensions,
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
            
            // Don't close the editor immediately - let user click away or edit another pipe
            // setShowPipeEditor(false)
          }}
          onCancel={() => {
            setShowPipeEditor(false)
          }}
          onCopy={() => {
            if (pipingRendererRef.current?.pipeInteraction) {
              pipingRendererRef.current.pipeInteraction.duplicateSelectedPipe()
            }
          }}
        />
      )}
      
      {/* Conduit Editor */}
      {showConduitEditor && selectedConduit && cameraRef.current && rendererRef.current && (
        <ConduitEditorUI
          selectedConduit={selectedConduit}
          camera={cameraRef.current}
          renderer={rendererRef.current}
          visible={showConduitEditor}
          rackParams={rackParams}
          onSave={(dimensions) => {
            
            // Set flag to prevent conduit recreation
            setSkipConduitRecreation(true)
            
            if (conduitRendererRef.current?.conduitInteraction) {
              // First update the selected conduit's userData to ensure consistency
              if (selectedConduit?.userData?.conduitData) {
                selectedConduit.userData.conduitData = {
                  ...selectedConduit.userData.conduitData,
                  ...dimensions
                }
              }
              
              // Update the 3D conduit
              conduitRendererRef.current.conduitInteraction.updateConduitDimensions(dimensions)
              
              // Update localStorage (MEP panel data)
              try {
                const storedMepItems = JSON.parse(localStorage.getItem('configurMepItems') || '[]')
                const selectedConduitData = selectedConduit?.userData?.conduitData
                
                if (selectedConduitData) {
                  
                  // Find and update the matching item
                  // Handle ID matching - selectedConduitData.id might have _0, _1 suffix for multiple conduits
                  const baseId = selectedConduitData.id.toString().split('_')[0]
                  
                  const updatedItems = storedMepItems.map(item => {
                    const itemBaseId = item.id.toString().split('_')[0]
                    
                    if (itemBaseId === baseId && item.type === 'conduit') {
                      // Include current conduit position in the update
                      const currentPosition = {
                        x: selectedConduit.position.x,
                        y: selectedConduit.position.y, 
                        z: selectedConduit.position.z
                      }
                      
                      // Include count since it's now editable
                      const updatedItem = { 
                        ...item, 
                        ...dimensions,
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
                    detail: { updatedItems, updatedConduitId: selectedConduitData.id }
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
                console.error('Error updating MEP conduit items:', error)
              }
            }
            
            // Don't close the editor immediately - let user click away or edit another conduit
            // setShowConduitEditor(false)
          }}
          onCancel={() => {
            setShowConduitEditor(false)
          }}
          onCopy={() => {
            if (conduitRendererRef.current?.conduitInteraction) {
              conduitRendererRef.current.conduitInteraction.copySelectedConduit()
            }
          }}
        />
      )}
      
      {/* Cable Tray Editor */}
      {showCableTrayEditor && selectedCableTray && cameraRef.current && rendererRef.current && (
        <CableTrayEditor
          selectedCableTray={selectedCableTray}
          camera={cameraRef.current}
          renderer={rendererRef.current}
          visible={showCableTrayEditor}
          rackParams={rackParams}
          onSave={(dimensions) => {
            // console.log(`🔌 ThreeScene: Cable tray editor save called with:`, dimensions)
            
            // Set flag to prevent cable tray recreation
            setSkipCableTrayRecreation(true)
            
            if (cableTrayRendererRef.current?.cableTrayInteraction) {
              // First update the selected cable tray's userData to ensure consistency
              if (selectedCableTray?.userData?.cableTrayData) {
                selectedCableTray.userData.cableTrayData = {
                  ...selectedCableTray.userData.cableTrayData,
                  ...dimensions
                }
              }
              
              // Update the 3D cable tray
              cableTrayRendererRef.current.cableTrayInteraction.updateCableTrayDimensions(dimensions)
              
              // Update localStorage (MEP panel data)
              try {
                const storedMepItems = JSON.parse(localStorage.getItem('configurMepItems') || '[]')
                const selectedCableTrayData = selectedCableTray?.userData?.cableTrayData
                
                if (selectedCableTrayData) {
                  const baseId = selectedCableTrayData.id.toString().split('_')[0]
                  
                  const updatedItems = storedMepItems.map(item => {
                    const itemBaseId = item.id.toString().split('_')[0]
                    
                    if (itemBaseId === baseId && item.type === 'cableTray') {
                      // console.log(`🔌 Found matching cable tray in localStorage:`, item)
                      const currentPosition = {
                        x: selectedCableTray.position.x,
                        y: selectedCableTray.position.y,
                        z: selectedCableTray.position.z
                      }
                      
                      // Auto-detect tier based on current Y position
                      let tierInfo = { tier: dimensions.tier, tierName: `Tier ${dimensions.tier}` }
                      if (cableTrayRendererRef.current?.cableTrayInteraction) {
                        const detectedTier = cableTrayRendererRef.current.cableTrayInteraction.calculateCableTrayTierFromPosition(
                          currentPosition.y, 
                          dimensions.height
                        )
                        if (detectedTier.tier) {
                          tierInfo = detectedTier
                          // console.log(`🔌 Auto-detected tier: ${tierInfo.tierName} for Y position ${currentPosition.y}`)
                        }
                      }
                      
                      const updatedItem = {
                        ...item,
                        width: dimensions.width,
                        height: dimensions.height,
                        trayType: dimensions.trayType,
                        tier: tierInfo.tier,
                        tierName: tierInfo.tierName,
                        position: currentPosition
                      }
                      // console.log(`🔌 Updated cable tray item:`, updatedItem)
                      return updatedItem
                    }
                    return item
                  })
                  
                  localStorage.setItem('configurMepItems', JSON.stringify(updatedItems))
                  // console.log(`🔌 Saved cable tray ${selectedCableTrayData.id} to localStorage`)
                  
                  // IMPORTANT: Also update the manifest to ensure consistency
                  if (window.updateMEPItemsManifest) {
                    window.updateMEPItemsManifest(updatedItems)
                  } else {
                    console.warn('⚠️ updateMEPItemsManifest not available - manifest may be out of sync')
                  }
                  
                  // Dispatch custom event to notify MEP panel of changes
                  window.dispatchEvent(new CustomEvent('mepItemsUpdated', {
                    detail: { updatedItems, updatedCableTrayId: selectedCableTrayData.id }
                  }))
                  
                  // Also try multiple refresh methods
                  if (window.refreshMepPanel) {
                    window.refreshMepPanel()
                  }
                  
                  // Dispatch storage event to update other components
                  window.dispatchEvent(new Event('storage'))
                } else {
                  console.warn('⚠️ Could not find cable tray data for localStorage update')
                }
              } catch (error) {
                console.error('Error updating MEP cable tray items:', error)
              }
            }
            
            // Close the editor after saving (consistent with duct behavior)
            setShowCableTrayEditor(false)
          }}
          onCancel={() => {
            setShowCableTrayEditor(false)
          }}
          onCopy={() => {
            if (cableTrayRendererRef.current?.cableTrayInteraction) {
              cableTrayRendererRef.current.cableTrayInteraction.duplicateSelectedCableTray()
            }
          }}
        />
      )}
    </div>
  )
}
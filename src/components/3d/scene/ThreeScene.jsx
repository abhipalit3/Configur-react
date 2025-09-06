/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import React, { useRef, useEffect, useState } from 'react'
import * as THREE from 'three'
import { dispose } from '../core/utils.js'
import { TransformControls } from 'three/addons/controls/TransformControls.js'
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
import {
  initializeCameraControls
} from './cameraControls'
import {
  initializeViewCube
} from './viewCubeControls'
import {
  initializeMeasurementTool,
  setupMeasurementRestoration,
  createAxisToggleHandler,
  createClearMeasurementsHandler,
  setupMeasurementActivation,
  setupAxisLockUpdates,
  updateMeasurementLabels,
  cleanupMeasurementTool
} from './measurementControls'
import { MeasurementControlsPanel } from './measurementUI'


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
    
    // Initialize camera controls and view management using helpers
    const cameraControlsData = initializeCameraControls(camera, controls, scene, initialViewMode)
    const { originalCameraSettings, currentViewMode, viewModeHandler, fitViewHandler, cleanup: cleanupCameraControls } = cameraControlsData
    cleanupFunctions.push(cleanupCameraControls)
    
    // Update controls
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

    // Initialize measurement tool using helper
    const measurementTool = initializeMeasurementTool(scene, camera, renderer.domElement, snapPoints)
    measurementToolRef.current = measurementTool
    
    // Note: Camera controls and view mode management now handled by initializeCameraControls helper above
    // Setup measurement tool restoration using helper
    const cleanupMeasurementRestoration = setupMeasurementRestoration(measurementTool)
    cleanupFunctions.push(cleanupMeasurementRestoration)
    
    // Restore view mode if it was 2D (using helper function)
    if (initialViewMode === '2D') {
      setTimeout(() => {
        // console.log('🔧 Restoring 2D view mode on load')
        window.sceneViewModeHandler('2D')
      }, 100) // Small delay to ensure scene is fully initialized
    }

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

    // Initialize ViewCube using helper
    const viewCubeComponents = initializeViewCube(camera, controls, scene, mountRef.current)
    const { updateViewCube, cleanup: cleanupViewCube } = viewCubeComponents
    cleanupFunctions.push(cleanupViewCube)
      
    // Start animation loop using helper
    const stopAnimation = startAnimationLoop(renderer, scene, camera, controls, () => {
      // Frame callback
      updateOrthoCamera(camera, 20)
      
      // Update ViewCube using helper
      updateViewCube()
      
      // Update measurement labels using helper
      updateMeasurementLabels(measurementTool)
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
      document.removeEventListener('tradeRackSelected', handleTradeRackSelected)
      document.removeEventListener('tradeRackDeselected', handleTradeRackDeselected)
      
      // Cleanup measurement tool using helper
      cleanupMeasurementTool(measurementToolRef)
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
      if (mountRef.current) {
        if (mountRef.current.contains(renderer.domElement)) {
          mountRef.current.removeChild(renderer.domElement)
        }
      }
    }
  }, [initialRackParams, initialBuildingParams]) // Rebuild scene when parameters change

  // Handle measurement tool activation/deactivation using helper
  useEffect(() => {
    setupMeasurementActivation(measurementToolRef, isMeasurementActive)
  }, [isMeasurementActive])

  // Update axis lock in measurement tool using helper
  useEffect(() => {
    setupAxisLockUpdates(measurementToolRef, axisLock)
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

  // Create axis toggle handler using helper
  const handleAxisToggle = createAxisToggleHandler(setAxisLock)

  // Create clear measurements handler using helper
  const handleClearMeasurements = createClearMeasurementsHandler(measurementToolRef)

  return (
    <div ref={mountRef} style={{ width: '100%', height: '100%' }}>
      {/* Measurement Controls Panel using helper component */}
      <MeasurementControlsPanel 
        isMeasurementActive={isMeasurementActive}
        axisLock={axisLock}
        onAxisToggle={handleAxisToggle}
        onClearMeasurements={handleClearMeasurements}
      />
      
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
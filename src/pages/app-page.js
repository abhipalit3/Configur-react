/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import React, { Fragment, useState, useRef } from 'react'

import { Helmet } from 'react-helmet'

import {
  AppTopMainMenu,
  AppBottomOptions
} from '../components/layout'
import { AppButtonLeftMenu } from '../components/navigation'
import {
  AppRackProperties,
  AppSavedConfigurations,
  AppTierMEP,
  AppAddMEP,
  AppDuctwork,
  AppPiping,
  AppConduits,
  AppCableTrays
} from '../components/mep'
import { AppAIChatPanel } from '../components/ui'
import { AppManualBuilding } from '../components/forms'
import { ThreeScene } from '../components/3d'
import { useSceneShell } from '../hooks/useSceneShell'
import { useSceneRack } from '../hooks/useSceneRack'
import { buildingShellDefaults } from '../types/buildingShell'
import { tradeRackDefaults } from '../types/tradeRack'
import { 
  initializeProject,
  updateBuildingShell,
  updateTradeRackConfiguration,
  updateMEPItems,
  addMEPItem,
  removeMEPItem,
  updateUIState,
  updateMeasurements,
  syncManifestWithLocalStorage,
  setActiveConfiguration,
  syncMEPItemsWithLocalStorage
} from '../utils/projectManifest'
import { calculateTotalHeight } from '../types/tradeRack'
// Import manifest debugging tools (available in browser console)
import '../utils/manifestExporter'
import './app-page.css'

const AppPage = (props) => {
  // Helper function to restore UI state from manifest
  const getInitialUIState = () => {
    try {
      const manifest = JSON.parse(localStorage.getItem('projectManifest') || '{}')
      const savedUIState = manifest.uiState || {}
      return savedUIState
    } catch (error) {
      // console.error('❌ Error loading UI state from manifest:', error)
      return {}
    }
  }

  const initialUIState = getInitialUIState()

  // State to track which panel is currently active - restore from manifest
  const [activePanel, setActivePanel] = useState(initialUIState.activePanel || null)
  // State to track if rack properties is visible - restore from manifest, default to true
  const [isRackPropertiesVisible, setIsRackPropertiesVisible] = useState(
    initialUIState.isRackPropertiesVisible !== undefined ? initialUIState.isRackPropertiesVisible : true
  )
  // State to track if saved configurations is visible - always visible
  const [isSavedConfigsVisible, setIsSavedConfigsVisible] = useState(true)
  // State to trigger refresh of saved configurations
  const [savedConfigsRefresh, setSavedConfigsRefresh] = useState(0)
  // State to track measurement tool activation - restore from manifest
  const [isMeasurementActive, setIsMeasurementActive] = useState(
    initialUIState.isMeasurementActive || false
  )
  // State to track view mode (2D/3D) - restore from manifest
  const [viewMode, setViewMode] = useState(
    initialUIState.viewMode || '3D'
  )
  // State to track if configuration is fully loaded
  const [isConfigLoaded, setIsConfigLoaded] = useState(false)
  // State to track AppAddMEP visibility - restore from manifest, default to false (closed)
  const [isAddMEPVisible, setIsAddMEPVisible] = useState(
    initialUIState.isAddMEPVisible ?? false
  )
  
  // State for building shell parameters - initialize from saved data
  const [buildingParams, setBuildingParams] = useState(() => {
    try {
      // Try to load building shell parameters from manifest
      const manifest = JSON.parse(localStorage.getItem('projectManifest') || '{}')
      const savedBuildingShell = manifest.buildingShell?.parameters
      
      if (savedBuildingShell) {
        // console.log('🏢 Loading saved building shell parameters:', savedBuildingShell)
        return savedBuildingShell
      }
      
      // Fall back to defaults
      // console.log('🏢 Using default building shell parameters')
      return buildingShellDefaults
    } catch (error) {
      // console.error('❌ Error loading building shell parameters:', error)
      return buildingShellDefaults
    }
  })
  
  // State for trade rack parameters
  const [rackParams, setRackParams] = useState(() => {
    // First, try to load from active configuration
    try {
      const manifest = JSON.parse(localStorage.getItem('projectManifest') || '{}')
      const activeConfigId = manifest.tradeRacks?.activeConfigurationId
      
      if (activeConfigId) {
        const savedConfigs = JSON.parse(localStorage.getItem('tradeRackConfigurations') || '[]')
        const activeConfig = savedConfigs.find(config => config.id === activeConfigId)
        
        if (activeConfig) {
          const { id, name, savedAt, importedAt, originalId, buildingShellParams, ...configParams } = activeConfig
          // Store in localStorage for tier calculations
          localStorage.setItem('rackParameters', JSON.stringify(configParams))
          
          // If there are saved building shell parameters, we should use them during initialization
          // They will be loaded separately through the buildingParams useState initialization
          
          return configParams
        }
      }
      
      // Fallback to saved rack parameters
      const saved = localStorage.getItem('rackParameters')
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (error) {
      console.error('Error loading rack parameters:', error)
    }
    
    // Fall back to defaults and save them
    localStorage.setItem('rackParameters', JSON.stringify(tradeRackDefaults))
    return tradeRackDefaults
  })
  
  // Building shell controller
  const buildingShell = useSceneShell()
  
  // Trade rack controller
  const tradeRack = useSceneRack()
  
  // State to track MEP items - initialize from localStorage
  const [mepItems, setMepItems] = useState(() => {
    try {
      const savedItems = localStorage.getItem('configurMepItems')
      const parsedItems = savedItems ? JSON.parse(savedItems) : []
      return parsedItems
    } catch (error) {
      // console.error('❌ Error loading MEP items:', error)
      return []
    }
  })

  // Initialize project manifest on component mount
  React.useEffect(() => {
    // console.log('🔧 AppPage: Starting initialization...')
    
    // Initialize project and check if we need to seed data
    const manifest = initializeProject()
    
    // Sync manifest with localStorage to ensure consistency
    syncManifestWithLocalStorage()
    syncMEPItemsWithLocalStorage()
    
    // Debug: Check localStorage contents
    // console.log('📊 LocalStorage Debug:', {
    //   projectManifest: localStorage.getItem('projectManifest') ? 'exists' : 'missing',
    //   configurMepItems: localStorage.getItem('configurMepItems') ? 'exists' : 'missing', 
    //   rackParameters: localStorage.getItem('rackParameters') ? 'exists' : 'missing',
    //   tradeRackConfigurations: localStorage.getItem('tradeRackConfigurations') ? 'exists' : 'missing'
    // })
    
    // Make measurement update function available globally for the measurement tool
    window.updateManifestMeasurements = (measurements) => {
      updateMeasurements(measurements)
    }
    
    // Make MEP items update function available globally for 3D scene
    window.updateMEPItemsManifest = (items) => {
      updateMEPItems(items, 'all')
    }
    
    // Make MEP panel refresh function available globally
    window.refreshMepPanel = () => {
      // Force a re-render by updating the mepItems from localStorage
      try {
        const savedItems = localStorage.getItem('configurMepItems')
        const parsedItems = savedItems ? JSON.parse(savedItems) : []
        setMepItems([...parsedItems]) // Create new array reference to trigger re-render
      } catch (error) {
        console.error('❌ Error refreshing MEP panel:', error)
      }
    }
    
    // Make tier update function available globally
    window.updateDuctTierInfo = () => {
      if (window.ductworkRendererInstance?.ductInteraction) {
        window.ductworkRendererInstance.ductInteraction.updateAllDuctTierInfo()
      }
    }
    
    // Cleanup function to remove global reference
    return () => {
      if (window.updateManifestMeasurements) {
        delete window.updateManifestMeasurements
      }
      if (window.updateMEPItemsManifest) {
        delete window.updateMEPItemsManifest
      }
      if (window.refreshMepPanel) {
        delete window.refreshMepPanel
      }
      if (window.updateDuctTierInfo) {
        delete window.updateDuctTierInfo
      }
    }
  }, [])

  // Mark configuration as loaded after initial render
  React.useEffect(() => {
    // Wait a brief moment to ensure all initialization is complete
    const timer = setTimeout(() => {
      // console.log('🔧 Configuration marked as loaded')
      setIsConfigLoaded(true)
    }, 50) // Very short delay to ensure state initialization is complete
    
    return () => clearTimeout(timer)
  }, [])

  // Save UI state whenever it changes
  React.useEffect(() => {
    updateUIState({
      activePanel: activePanel,
      isRackPropertiesVisible: isRackPropertiesVisible,
      isMeasurementActive: isMeasurementActive,
      isAddMEPVisible: isAddMEPVisible,
      viewMode: viewMode
    })
  }, [activePanel, isRackPropertiesVisible, isMeasurementActive, isAddMEPVisible, viewMode])

  // Apply loaded rack configuration to 3D scene on mount
  React.useEffect(() => {
    if (rackParams && (tradeRack.update || window.ductworkRendererInstance)) {
      // Small delay to ensure 3D components are ready
      setTimeout(() => {
        // Switch building shell mode based on mount type
        if (buildingShell.switchMode) {
          const isFloorMounted = rackParams.mountType === 'floor'
          buildingShell.switchMode(buildingParams, isFloorMounted)
        }
        
        // Combine rack params with building shell context
        const combinedParams = {
          ...rackParams,
          buildingContext: {
            corridorHeight: buildingParams.corridorHeight,
            beamDepth: buildingParams.beamDepth
          }
        }
        
        // Update 3D trade rack
        if (tradeRack.update) {
          tradeRack.update(combinedParams)
        }

        // Update ductwork renderer with loaded rack parameters
        if (window.ductworkRendererInstance) {
          window.ductworkRendererInstance.updateRackParams(combinedParams)
          
          // Trigger recalculation of tier info for all ducts with a small delay
          setTimeout(() => {
            if (window.ductworkRendererInstance) {
              window.ductworkRendererInstance.recalculateTierInfo()
            }
          }, 200)
        }
      }, 100)
    }
  }, []) // Only run once on mount
  
  // Save to localStorage and update manifest whenever mepItems changes
  React.useEffect(() => {
    try {
      localStorage.setItem('configurMepItems', JSON.stringify(mepItems))
      // Update manifest with current MEP items
      updateMEPItems(mepItems, 'all')
    } catch (error) {
      console.error('Error saving MEP items:', error)
    }
  }, [mepItems])
  
  // Update trade rack when building shell parameters change
  React.useEffect(() => {
    if (rackParams && tradeRack.update && isConfigLoaded) {
      // console.log('🏢 Building shell parameters changed, updating trade rack...')
      
      // Switch building shell mode based on mount type
      if (buildingShell.switchMode) {
        const isFloorMounted = rackParams.mountType === 'floor'
        buildingShell.switchMode(buildingParams, isFloorMounted)
      }
      
      // Combine rack params with updated building shell context
      const combinedParams = {
        ...rackParams,
        buildingContext: {
          corridorHeight: buildingParams.corridorHeight,
          beamDepth: buildingParams.beamDepth || { feet: 0, inches: 0 }
        }
      }
      
      // Update the trade rack with new building context
      tradeRack.update(combinedParams)
      
      // Update ductwork renderer with new parameters
      if (window.ductworkRendererInstance) {
        window.ductworkRendererInstance.updateRackParams(combinedParams)
        
        // Trigger recalculation of tier info for all ducts
        setTimeout(() => {
          if (window.ductworkRendererInstance) {
            window.ductworkRendererInstance.recalculateTierInfo()
          }
        }, 100)
      }
    }
  }, [buildingParams, isConfigLoaded]) // Depend on buildingParams changes
  
  // Handler for panel button clicks
  const handlePanelClick = (panelName) => {
    // Handle special case for tradeRack panel (toggles rack properties)
    if (panelName === 'tradeRack') {
      const newRackPropertiesState = !isRackPropertiesVisible
      setIsRackPropertiesVisible(newRackPropertiesState)
      // Close any other active panel when opening rack properties
      if (newRackPropertiesState) {
        setActivePanel(null)
      }
      
      // UI state will be automatically saved by the useEffect
      return
    }
    
    // For other panels: If clicking the same panel, close it. Otherwise, open the new panel
    const newActivePanel = activePanel === panelName ? null : panelName
    setActivePanel(newActivePanel)
    // Close rack properties when opening another panel
    if (newActivePanel !== null) {
      setIsRackPropertiesVisible(false)
    }
    
    // UI state will be automatically saved by the useEffect
  }
  
  
  // Handler for adding MEP items
  const handleAddMepItem = (item) => {
    const newItem = { ...item, id: Date.now() + Math.random() }
    setMepItems([...mepItems, newItem])
    
    // Update manifest with new item
    addMEPItem(newItem)
    
    // Optionally close the panel after adding
    setActivePanel(null)
    // UI state will be automatically saved by the useEffect
  }
  
  // Handler for removing MEP items
  const handleRemoveMepItem = (itemId) => {
    const itemToRemove = mepItems.find(item => item.id === itemId)
    setMepItems(mepItems.filter(item => item.id !== itemId))
    
    // Update manifest
    if (itemToRemove) {
      removeMEPItem(itemId, itemToRemove.type)
    }
  }

  // Handler for deleting all MEP items
  const handleDeleteAllMepItems = () => {
    // Clear all MEP items from state
    setMepItems([])
    
    // Clear from localStorage
    localStorage.setItem('configurMepItems', JSON.stringify([]))
    
    // Update manifest with empty array
    updateMEPItems([], 'all')
    
    // Trigger refresh of 3D scene to remove all MEP elements
    if (window.ductworkRendererInstance) {
      window.ductworkRendererInstance.updateDuctwork([])
    }
    
    // console.log('🗑️ All MEP elements deleted')
  }

  // Handler for clicking MEP items in the panel (for duct and pipe selection)
  const handleMepItemClick = (item) => {
    if (item.type === 'duct') {
      // First deselect any selected pipes and conduits
      if (window.pipingRendererInstance?.pipeInteraction) {
        window.pipingRendererInstance.pipeInteraction.deselectPipe()
      }
      if (window.conduitRendererInstance?.conduitInteraction) {
        window.conduitRendererInstance.conduitInteraction.deselectConduit()
      }
      
      // Find and select the duct in the 3D scene
      if (window.ductworkRendererInstance?.ductInteraction) {
        const ductworkRenderer = window.ductworkRendererInstance
        const ductworkGroup = ductworkRenderer.getDuctworkGroup()
        
        // Find the duct group by ID (handle both base ID and instance ID formats)
        let targetDuct = null
        ductworkGroup.children.forEach(ductGroup => {
          const ductData = ductGroup.userData?.ductData
          if (ductData) {
            const baseId = ductData.id.toString().split('_')[0]
            const itemBaseId = item.id.toString().split('_')[0]
            if (baseId === itemBaseId || ductData.id === item.id) {
              targetDuct = ductGroup
            }
          }
        })
        
        if (targetDuct) {
          ductworkRenderer.ductInteraction.selectDuct(targetDuct)
        } else {
          console.warn('⚠️ Could not find duct to select:', item.id)
        }
      }
    } else if (item.type === 'pipe') {
      // First deselect any selected ducts and conduits
      if (window.ductworkRendererInstance?.ductInteraction) {
        window.ductworkRendererInstance.ductInteraction.deselectDuct()
      }
      if (window.conduitRendererInstance?.conduitInteraction) {
        window.conduitRendererInstance.conduitInteraction.deselectConduit()
      }
      
      // Find and select the pipe in the 3D scene
      if (window.pipingRendererInstance?.pipeInteraction) {
        const pipingRenderer = window.pipingRendererInstance
        const pipingGroup = pipingRenderer.getPipingGroup()
        
        // Find the pipe group by ID (handle both base ID and instance ID formats)
        let targetPipe = null
        pipingGroup.children.forEach(pipeGroup => {
          const pipeData = pipeGroup.userData?.pipeData
          if (pipeData) {
            const baseId = pipeData.id.toString().split('_')[0]
            const itemBaseId = item.id.toString().split('_')[0]
            if (baseId === itemBaseId || pipeData.id === item.id) {
              targetPipe = pipeGroup
            }
          }
        })
        
        if (targetPipe) {
          pipingRenderer.pipeInteraction.selectPipe(targetPipe)
        } else {
          console.warn('⚠️ Could not find pipe to select:', item.id)
        }
      }
    } else if (item.type === 'conduit') {
      // First deselect any selected ducts and pipes
      if (window.ductworkRendererInstance?.ductInteraction) {
        window.ductworkRendererInstance.ductInteraction.deselectDuct()
      }
      if (window.pipingRendererInstance?.pipeInteraction) {
        window.pipingRendererInstance.pipeInteraction.deselectPipe()
      }
      
      // Find and select the conduit in the 3D scene
      if (window.conduitRendererInstance?.conduitInteraction) {
        const conduitRenderer = window.conduitRendererInstance
        const conduitsGroup = conduitRenderer.getConduitsGroup()
        
        // Find the multi-conduit group by ID
        let targetConduit = null
        conduitsGroup.children.forEach(multiConduitGroup => {
          const conduitData = multiConduitGroup.userData?.conduitData
          if (conduitData && multiConduitGroup.userData?.type === 'multiConduit') {
            // For multi-conduit groups, match the base ID
            const baseId = conduitData.id.toString().split('_')[0]
            const itemBaseId = item.id.toString().split('_')[0]
            if (baseId === itemBaseId || conduitData.id === item.id) {
              targetConduit = multiConduitGroup
            }
          }
        })
        
        if (targetConduit) {
          conduitRenderer.conduitInteraction.selectConduit(targetConduit)
        } else {
          console.warn('⚠️ Could not find conduit to select:', item.id)
        }
      }
    } else if (item.type === 'cableTray') {
      // First deselect any selected ducts, pipes, and conduits
      if (window.ductworkRendererInstance?.ductInteraction) {
        window.ductworkRendererInstance.ductInteraction.deselectDuct()
      }
      if (window.pipingRendererInstance?.pipeInteraction) {
        window.pipingRendererInstance.pipeInteraction.deselectPipe()
      }
      if (window.conduitRendererInstance?.conduitInteraction) {
        window.conduitRendererInstance.conduitInteraction.deselectConduit()
      }
      
      // Find and select the cable tray in the 3D scene
      if (window.cableTrayRendererInstance?.cableTrayInteraction) {
        const cableTrayRenderer = window.cableTrayRendererInstance
        const cableTraysGroup = cableTrayRenderer.getCableTraysGroup()
        
        // Find the cable tray group by ID (handle both base ID and instance ID formats)
        let targetCableTray = null
        cableTraysGroup.children.forEach(cableTrayGroup => {
          const cableTrayData = cableTrayGroup.userData?.cableTrayData
          if (cableTrayData) {
            const baseId = cableTrayData.id.toString().split('_')[0]
            const itemBaseId = item.id.toString().split('_')[0]
            if (baseId === itemBaseId || cableTrayData.id === item.id) {
              targetCableTray = cableTrayGroup
            }
          }
        })
        
        if (targetCableTray) {
          cableTrayRenderer.cableTrayInteraction.selectCableTray(targetCableTray)
        } else {
          console.warn('⚠️ Could not find cable tray to select:', item.id)
        }
      }
    }
  }

  // Handler for changing duct and pipe color from MEP panel
  const handleDuctColorChange = (itemId, newColor) => {
    
    // Update the mepItems state
    const updatedItems = mepItems.map(item => {
      const baseId = item.id.toString().split('_')[0]
      const itemBaseId = itemId.toString().split('_')[0]
      if (baseId === itemBaseId || item.id === itemId) {
        return { ...item, color: newColor }
      }
      return item
    })
    setMepItems(updatedItems)
    
    // Find the item to determine its type
    const targetItem = updatedItems.find(item => {
      const baseId = item.id.toString().split('_')[0]
      const itemBaseId = itemId.toString().split('_')[0]
      return baseId === itemBaseId || item.id === itemId
    })
    
    if (targetItem?.type === 'duct') {
      // Update the 3D duct color
      if (window.ductworkRendererInstance?.ductInteraction) {
        const ductworkRenderer = window.ductworkRendererInstance
        const ductworkGroup = ductworkRenderer.getDuctworkGroup()
        
        // Find the duct group by ID
        ductworkGroup.children.forEach(ductGroup => {
          const ductData = ductGroup.userData?.ductData
          if (ductData) {
            const baseId = ductData.id.toString().split('_')[0]
            const ductBaseId = itemId.toString().split('_')[0]
            if (baseId === ductBaseId || ductData.id === itemId) {
              // Update duct color using the interaction system
              if (ductworkRenderer.ductInteraction.updateDuctDimensions) {
                ductworkRenderer.ductInteraction.updateDuctDimensions({ color: newColor })
              }
            }
          }
        })
      }
    } else if (targetItem?.type === 'pipe') {
      // Update the 3D pipe color
      if (window.pipingRendererInstance?.pipeInteraction) {
        const pipingRenderer = window.pipingRendererInstance
        const pipingGroup = pipingRenderer.getPipingGroup()
        
        // Find the pipe group by ID
        pipingGroup.children.forEach(pipeGroup => {
          const pipeData = pipeGroup.userData?.pipeData
          if (pipeData) {
            const baseId = pipeData.id.toString().split('_')[0]
            const pipeBaseId = itemId.toString().split('_')[0]
            if (baseId === pipeBaseId || pipeData.id === itemId) {
              // Update pipe color using the interaction system
              if (pipingRenderer.pipeInteraction.updatePipeDimensions) {
                pipingRenderer.pipeInteraction.updatePipeDimensions({ color: newColor })
              }
            }
          }
        })
      }
    } else if (targetItem?.type === 'conduit') {
      // Update the 3D conduit color
      if (window.conduitRendererInstance?.conduitInteraction) {
        const conduitRenderer = window.conduitRendererInstance
        const conduitsGroup = conduitRenderer.getConduitsGroup()
        
        // Find the conduit group by ID
        conduitsGroup.children.forEach(conduitGroup => {
          const conduitData = conduitGroup.userData?.conduitData
          if (conduitData) {
            const baseId = conduitData.id.toString().split('_')[0]
            const conduitBaseId = itemId.toString().split('_')[0]
            if (baseId === conduitBaseId || conduitData.id === itemId) {
              // Select the conduit first if not already selected
              if (conduitRenderer.conduitInteraction.selectedConduitGroup !== conduitGroup) {
                conduitRenderer.conduitInteraction.selectConduit(conduitGroup)
              }
              // Update conduit color using the interaction system
              if (conduitRenderer.conduitInteraction.updateConduitDimensions) {
                conduitRenderer.conduitInteraction.updateConduitDimensions({ color: newColor })
              }
            }
          }
        })
      }
    } else if (targetItem?.type === 'cableTray') {
      // Update the 3D cable tray color
      if (window.cableTrayRendererInstance?.cableTrayInteraction) {
        const cableTrayRenderer = window.cableTrayRendererInstance
        const cableTraysGroup = cableTrayRenderer.getCableTraysGroup()
        
        // Find the cable tray group by ID
        cableTraysGroup.children.forEach(cableTrayGroup => {
          const cableTrayData = cableTrayGroup.userData?.cableTrayData
          if (cableTrayData) {
            const baseId = cableTrayData.id.toString().split('_')[0]
            const cableTrayBaseId = itemId.toString().split('_')[0]
            if (baseId === cableTrayBaseId || cableTrayData.id === itemId) {
              // Select the cable tray first if not already selected
              if (cableTrayRenderer.cableTrayInteraction.selectedCableTrayGroup !== cableTrayGroup) {
                cableTrayRenderer.cableTrayInteraction.selectCableTray(cableTrayGroup)
              }
              // Update cable tray color using the interaction system
              if (cableTrayRenderer.cableTrayInteraction.updateCableTrayDimensions) {
                cableTrayRenderer.cableTrayInteraction.updateCableTrayDimensions({ color: newColor })
              }
            }
          }
        })
      }
    }
    
    // Update localStorage with new color
    localStorage.setItem('configurMepItems', JSON.stringify(updatedItems))
    
    // Update manifest
    updateMEPItems(updatedItems, 'color_change')
  }
  
  // Handler for measurement tool toggle
  const handleMeasurementToggle = () => {
    const newState = !isMeasurementActive
    setIsMeasurementActive(newState)
    
    // UI state will be automatically saved by the useEffect
  }
  
  // Handler for clearing all measurements
  const handleClearMeasurements = () => {
    // This will be handled by the measurement tool via ref
    if (window.measurementToolInstance) {
      window.measurementToolInstance.clearAll()
      // Update manifest with empty measurements
      updateMeasurements([])
    }
  }
  
  // Handler for view mode change (2D/3D)
  const handleViewModeChange = (mode) => {
    // console.log('Changing view mode to:', mode)
    setViewMode(mode) // Update local state for persistence
    if (window.sceneViewModeHandler) {
      window.sceneViewModeHandler(mode)
    }
  }
  
  // Handler for fit view
  const handleFitView = () => {
    // console.log('Fitting view to content')
    if (window.sceneFitViewHandler) {
      window.sceneFitViewHandler()
    }
  }
  
  // Handler for toggling AppAddMEP visibility
  const handleToggleAddMEP = () => {
    setIsAddMEPVisible(!isAddMEPVisible)
    // UI state will be automatically saved by the useEffect
  }

  // Handler for building shell save
  const handleBuildingSave = (params) => {
    setBuildingParams(params)
    
    // Update manifest with building shell data
    updateBuildingShell(params)
    
    // Get the latest rack parameters from localStorage to ensure we have the current state
    let currentRackParams = rackParams
    try {
      const savedRackParams = localStorage.getItem('rackParameters')
      if (savedRackParams) {
        currentRackParams = JSON.parse(savedRackParams)
      }
    } catch (error) {
      console.error('Error loading current rack parameters:', error)
    }
    
    // Update building shell based on current mount type
    if (buildingShell.update) {
      const isFloorMounted = currentRackParams.mountType === 'floor'
      buildingShell.update(params, isFloorMounted)
    }
    
    // Update rack with new building context for top clearance calculation
    if (tradeRack.update) {
      const updatedRackParams = {
        ...currentRackParams,
        buildingContext: {
          corridorHeight: params.corridorHeight,
          beamDepth: params.beamDepth
        }
      }
      tradeRack.update(updatedRackParams)
      
      // Also update the state to keep it in sync
      setRackParams(currentRackParams)
      
      // Refresh MEP items after rack update to ensure they're positioned correctly
      setTimeout(() => {
        if (window.ductworkRendererInstance) {
          window.ductworkRendererInstance.refreshDuctwork()
        }
        if (window.pipingRendererInstance) {
          const storedMepItems = JSON.parse(localStorage.getItem('configurMepItems') || '[]')
          window.pipingRendererInstance.updatePiping(storedMepItems)
        }
      }, 100)
    }
    
    // Building shell parameters are now stored independently in the manifest
    // Configurations will always reference the current building shell parameters
    // console.log('✅ Building shell parameters saved to manifest (independent of rack configurations)')
  }

  // Handler for adding rack to scene (without saving to configurations)
  const handleAddRack = (params) => {
    setRackParams(params)
    
    // Store current rack parameters in localStorage for tier calculations
    localStorage.setItem('rackParameters', JSON.stringify(params))
    
    // Switch building shell mode based on mount type
    if (buildingShell.switchMode) {
      const isFloorMounted = params.mountType === 'floor'
      buildingShell.switchMode(buildingParams, isFloorMounted)
    }
    
    // Combine rack params with building shell context for positioning calculation
    const combinedParams = {
      ...params,
      buildingContext: {
        corridorHeight: buildingParams.corridorHeight,
        beamDepth: buildingParams.beamDepth
      }
    }
    
    if (tradeRack.update) {
      tradeRack.update(combinedParams)
    }

    // Update ductwork renderer with new rack parameters
    if (window.ductworkRendererInstance) {
      window.ductworkRendererInstance.updateRackParams(combinedParams)
      
      // Trigger recalculation of tier info for all ducts with a small delay
      setTimeout(() => {
        if (window.ductworkRendererInstance) {
          window.ductworkRendererInstance.recalculateTierInfo()
        }
      }, 200)
    }
    
    // Close the properties panel after adding rack
    setIsRackPropertiesVisible(false)
  }

  // Handler for when configuration is saved from the saved configurations panel
  const handleConfigurationSaved = (config) => {
    // Trigger refresh of saved configurations panel
    setSavedConfigsRefresh(prev => prev + 1)
    
    // Update manifest with new trade rack configuration (mark as new save)
    updateTradeRackConfiguration(config, true)
    
    // Set this as the active configuration
    setActiveConfiguration(config.id)
  }

  // Handler for restoring saved rack configuration
  const handleRestoreConfiguration = (config) => {
    
    // Update rack parameters with saved config (excluding metadata and building shell params)
    const { id, name, savedAt, importedAt, originalId, buildingShellParams, ...configParams } = config
    setRackParams(configParams)
    
    // Note: Building shell parameters are NOT restored from configurations
    // The rack will use the current building shell parameters from the manifest
    // console.log('📦 Restoring rack configuration:', config.name || `Configuration ${id}`)
    // console.log('🏢 Using current building shell parameters (not from configuration)')
    
    // Store current rack parameters in localStorage for tier calculations
    localStorage.setItem('rackParameters', JSON.stringify(configParams))
    
    // Set this as the active configuration in the manifest
    if (id) {
      setActiveConfiguration(id)
    }
    
    // Apply the configuration to the 3D scene WITHOUT saving a new copy
    // Switch building shell mode based on mount type using CURRENT building params only
    if (buildingShell.switchMode) {
      const isFloorMounted = configParams.mountType === 'floor'
      buildingShell.switchMode(buildingParams, isFloorMounted)
    }
    
    // CRITICAL: Always ensure building context is passed for deck-mounted racks
    // This ensures the rack position is calculated correctly based on current building shell
    const combinedParams = {
      ...configParams,
      buildingContext: {
        corridorHeight: buildingParams.corridorHeight,
        beamDepth: buildingParams.beamDepth || { feet: 0, inches: 0 } // Ensure beamDepth has a valid default
      }
    }
    
    // Force a complete rebuild of the rack with updated positioning
    if (tradeRack.update) {
      // Small delay to ensure building shell updates first
      setTimeout(() => {
        tradeRack.update(combinedParams)
      }, 50)
    }
    
    // Update ductwork renderer with restored rack parameters
    if (window.ductworkRendererInstance) {
      window.ductworkRendererInstance.updateRackParams(combinedParams)
      
      // Trigger recalculation of tier info for all ducts with a small delay
      setTimeout(() => {
        if (window.ductworkRendererInstance) {
          window.ductworkRendererInstance.recalculateTierInfo()
        }
      }, 200)
    }
    
    // Update manifest with restored configuration (not a new save)
    updateTradeRackConfiguration(combinedParams, false)
    
  }


  // Listen for measurement tool deactivation events
  React.useEffect(() => {
    const handleMeasurementToolDeactivated = () => {
      setIsMeasurementActive(false)
    }

    document.addEventListener('measurementToolDeactivated', handleMeasurementToolDeactivated)

    return () => {
      document.removeEventListener('measurementToolDeactivated', handleMeasurementToolDeactivated)
    }
  }, [])

  // Listen for MEP items updates from 3D scene
  React.useEffect(() => {
    const handleMepItemsUpdated = (event) => {
      if (event.detail && event.detail.updatedItems) {
        setMepItems(event.detail.updatedItems)
      }
    }

    const handleStorageChange = (event) => {
      if (event.key === 'configurMepItems') {
        try {
          const updatedItems = JSON.parse(event.newValue || '[]')
          setMepItems(updatedItems)
        } catch (error) {
          console.error('Error parsing updated MEP items from storage:', error)
        }
      }
    }

    window.addEventListener('mepItemsUpdated', handleMepItemsUpdated)
    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('mepItemsUpdated', handleMepItemsUpdated)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  // Global keyboard handler for measurement deletion when tool is inactive
  React.useEffect(() => {
    const handleGlobalKeyDown = (event) => {
      // Only handle delete when measurement tool is inactive but measurements exist
      if (!isMeasurementActive && window.measurementToolInstance) {
        const measurementTool = window.measurementToolInstance
        
        switch(event.key.toLowerCase()) {
          case 'delete':
          case 'backspace':
            // Delete selected measurements
            if (measurementTool.selectedMeasurements && measurementTool.selectedMeasurements.size > 0) {
              const selectedCount = measurementTool.selectedMeasurements.size
              measurementTool.deleteSelectedMeasurements()
            }
            break
          case 'a':
            if (event.ctrlKey || event.metaKey) {
              // Select all measurements
              event.preventDefault()
              measurementTool.selectAll()
            }
            break
          case 'escape':
            // Clear selection when tool is inactive
            if (measurementTool.selectedMeasurements && measurementTool.selectedMeasurements.size > 0) {
              measurementTool.clearSelection()
            }
            break
        }
      }
    }

    document.addEventListener('keydown', handleGlobalKeyDown)

    return () => {
      document.removeEventListener('keydown', handleGlobalKeyDown)
    }
  }, [isMeasurementActive])

  // Handle click-outside to close AppAddMEP panel
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (!isAddMEPVisible) return

      // Check if the click is on the plus icon that toggles the panel
      const plusIcon = event.target.closest('.app-tier-mep-icon10')
      if (plusIcon) return // Don't close if clicking the toggle button

      // Check if the click is inside the AppAddMEP panel
      const addMEPPanel = event.target.closest('.app-add-mep-container')
      if (addMEPPanel) return // Don't close if clicking inside the panel

      // Close the panel if clicking anywhere else
      setIsAddMEPVisible(false)
    }

    if (isAddMEPVisible) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isAddMEPVisible])

  // Handle click-outside to close left-side panels (MEP panels, building, etc.)
  React.useEffect(() => {
    const handleClickOutsidePanels = (event) => {
      if (!activePanel) return // No panel is active

      // List of all left-side panel types and their corresponding container class names
      const leftPanels = [
        { type: 'ductwork', className: 'app-ductwork-container' },
        { type: 'piping', className: 'app-piping-container1' },
        { type: 'conduits', className: 'app-conduits-container1' },
        { type: 'cableTrays', className: 'app-cable-trays-container1' },
        { type: 'building', className: 'app-manual-building-container' },
        { type: 'aiChat', className: 'app-ai-chat-panel-container1' }
      ]

      // Check if current active panel is one of the left panels
      const currentPanel = leftPanels.find(panel => panel.type === activePanel)
      if (!currentPanel) return // Not a left panel, don't handle

      // Check if the click is inside the current panel
      const panelElement = event.target.closest(`.${currentPanel.className}`)
      if (panelElement) return // Don't close if clicking inside the panel

      // Check if the click is on the AppAddMEP buttons that might open these panels
      const addMEPPanel = event.target.closest('.app-add-mep-container')
      if (addMEPPanel) return // Don't close if clicking MEP buttons (they handle closing)

      // Check if the click is on the AI Chat button that toggles this panel
      const aiChatButton = event.target.closest('#AI_ChatButton')
      if (aiChatButton && currentPanel.type === 'aiChat') return // Don't close if clicking the AI Chat toggle button

      // Close the panel if clicking anywhere else
      setActivePanel(null)
    }

    if (activePanel) {
      document.addEventListener('mousedown', handleClickOutsidePanels)
      return () => {
        document.removeEventListener('mousedown', handleClickOutsidePanels)
      }
    }
  }, [activePanel])

  // Handle click-outside to close rack properties panel
  React.useEffect(() => {
    const handleClickOutsideRackProperties = (event) => {
      if (!isRackPropertiesVisible) return // Rack properties is not visible

      // Check if the click is inside the rack properties panel
      const rackPropertiesPanel = event.target.closest('.app-rack-properties-container')
      if (rackPropertiesPanel) return // Don't close if clicking inside the panel

      // Check if the click is on the trade rack button that toggles this panel
      const tradeRackButton = event.target.closest('#TradeRackPropButton')
      if (tradeRackButton) return // Don't close if clicking the toggle button

      // Close the panel if clicking anywhere else
      setIsRackPropertiesVisible(false)
    }

    if (isRackPropertiesVisible) {
      document.addEventListener('mousedown', handleClickOutsideRackProperties)
      return () => {
        document.removeEventListener('mousedown', handleClickOutsideRackProperties)
      }
    }
  }, [isRackPropertiesVisible])
  
  return (
    <div className="app-page-container">
      <Helmet>
        <title>AppPage - Configur</title>
        <meta
          name="description"
          content="Configure prefabricated assemblies using AI and Natural language."
        />
        <meta property="og:title" content="AppPage - Configur" />
        <meta
          property="og:description"
          content="Configure prefabricated assemblies using AI and Natural language."
        />
      </Helmet>

      <AppTopMainMenu rootClassName="app-top-main-menuroot-class-name1" />
      
      <AppButtonLeftMenu 
        rootClassName="app-button-left-menuroot-class-name1"
        onPanelClick={handlePanelClick}
        activePanel={activePanel}
        isRackPropertiesVisible={isRackPropertiesVisible}
      />

      <div className="app-page-right-menus">
        {isRackPropertiesVisible && (
          <AppRackProperties 
            rootClassName="app-rack-propertiesroot-class-name2" 
            initial={rackParams}
            onAddRack={handleAddRack}
            onClose={() => setIsRackPropertiesVisible(false)}
          />
        )}
        <AppSavedConfigurations 
          rootClassName="app-saved-configurationsroot-class-name" 
          onRestoreConfiguration={handleRestoreConfiguration}
          refreshTrigger={savedConfigsRefresh}
          onConfigurationSaved={handleConfigurationSaved}
        />
        <AppTierMEP 
          rootClassName="app-tier-me-proot-class-name" 
          mepItems={mepItems}
          onRemoveItem={handleRemoveMepItem}
          onItemClick={handleMepItemClick}
          onColorChange={handleDuctColorChange}
          onToggleAddMEP={handleToggleAddMEP}
          onDeleteAll={handleDeleteAllMepItems}
        />
        {isAddMEPVisible && (
          <AppAddMEP 
            rootClassName="app-add-me-proot-class-name"
            onDuctworkClick={() => {
              handlePanelClick('ductwork')
              setIsAddMEPVisible(false)
            }}
            onPipingClick={() => {
              handlePanelClick('piping')
              setIsAddMEPVisible(false)
            }}
            onConduitsClick={() => {
              handlePanelClick('conduits')
              setIsAddMEPVisible(false)
            }}
            onCableTraysClick={() => {
              handlePanelClick('cableTrays')
              setIsAddMEPVisible(false)
            }}
          />
        )}
      </div>
      
      {/* Conditionally render panels based on activePanel state */}
      {activePanel === 'aiChat' && (
        <AppAIChatPanel 
          rootClassName="app-ai-chat-panelroot-class-name1" 
          onClose={() => setActivePanel(null)}
        />
      )}

      {activePanel === 'building' && (
        <AppManualBuilding 
          rootClassName="app-manual-buildingroot-class-name1" 
          initial={buildingParams}
          onSave={handleBuildingSave}
          onClose={() => setActivePanel(null)}
        />
      )}

      {activePanel === 'ductwork' && (
        <AppDuctwork 
          rootClassName="app-ductworkroot-class-name" 
          onClose={() => setActivePanel(null)}
          onAddDuct={handleAddMepItem}
        />
      )}

      {activePanel === 'piping' && (
        <AppPiping 
          rootClassName="app-pipingroot-class-name" 
          onClose={() => setActivePanel(null)}
          onAddPipe={handleAddMepItem}
        />
      )}

      {activePanel === 'conduits' && (
        <AppConduits 
          rootClassName="app-conduitsroot-class-name" 
          onClose={() => setActivePanel(null)}
          onAddConduit={handleAddMepItem}
        />
      )}

      {activePanel === 'cableTrays' && (
        <AppCableTrays 
          rootClassName="app-cable-traysroot-class-name" 
          onClose={() => setActivePanel(null)}
          onAddCableTray={handleAddMepItem}
        />
      )}

      <AppBottomOptions 
        rootClassName="app-bottom-optionsroot-class-name" 
        onMeasurementClick={handleMeasurementToggle}
        isMeasurementActive={isMeasurementActive}
        onClearMeasurements={handleClearMeasurements}
        onViewModeChange={handleViewModeChange}
        onFitView={handleFitView}
        initialViewMode={viewMode}
      />
      
      {isConfigLoaded ? (
        <ThreeScene 
          isMeasurementActive={isMeasurementActive}
          mepItems={mepItems}
          initialRackParams={rackParams}
          initialBuildingParams={buildingParams}
          initialViewMode={viewMode}
          onSceneReady={(scene, materials, snapPoints) => {
          // Set references in the building shell hook
          buildingShell.setReferences(scene, materials, snapPoints)
          
          // Set references in the trade rack hook
          tradeRack.setReferences(scene, materials, snapPoints)
          
          // Initialize building shell with actual loaded parameters based on mount type
          const initialMountType = rackParams?.mountType || 'deck'
          const isInitialFloorMounted = initialMountType === 'floor'
          buildingShell.build(buildingParams, isInitialFloorMounted)
          
          // Initialize trade rack with actual parameters and building context
          const initialRackParams = {
            ...rackParams,
            buildingContext: {
              corridorHeight: buildingParams.corridorHeight,
              beamDepth: buildingParams.beamDepth
            }
          }
          tradeRack.build(initialRackParams)
          
          // Update ductwork renderer with actual rack parameters
          if (window.ductworkRendererInstance) {
            window.ductworkRendererInstance.updateRackParams(initialRackParams)
          }
        }}
      />
      ) : (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 50%, #f8f9fa 100%)',
          color: '#333333',
          fontSize: '16px',
          zIndex: 1000,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
        }}>
          <div style={{ 
            textAlign: 'center',
            padding: '40px',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(0, 0, 0, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ 
              width: '60px', 
              height: '60px', 
              border: '3px solid rgba(0, 0, 0, 0.1)', 
              borderTop: '3px solid #00D4FF',
              borderRight: '3px solid #00A8CC',
              borderRadius: '50%',
              animation: 'spin 1.2s cubic-bezier(0.4, 0, 0.2, 1) infinite',
              margin: '0 auto 24px'
            }}></div>
            <div style={{
              fontSize: '18px',
              fontWeight: '500',
              color: '#333333',
              marginBottom: '8px',
              letterSpacing: '0.5px'
            }}>
              Loading Configuration
            </div>
            <div style={{
              fontSize: '14px',
              color: 'rgba(0, 0, 0, 0.6)',
              fontWeight: '400'
            }}>
              Setting up your workspace...
            </div>
          </div>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}
    </div>
  )
}

export default AppPage
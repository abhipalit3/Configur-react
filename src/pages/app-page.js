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
  syncMEPItemsWithLocalStorage
} from '../utils/projectManifest'
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
      console.error('❌ Error loading UI state from manifest:', error)
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
  
  // State for building shell parameters
  const [buildingParams, setBuildingParams] = useState(buildingShellDefaults)
  
  // State for trade rack parameters
  const [rackParams, setRackParams] = useState(tradeRackDefaults)
  
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
      console.error('❌ Error loading MEP items:', error)
      return []
    }
  })

  // Initialize project manifest on component mount
  React.useEffect(() => {
    initializeProject()
    // Sync manifest with localStorage to ensure consistency
    syncManifestWithLocalStorage()
    syncMEPItemsWithLocalStorage()
    
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
    }
  }, [])

  // Save UI state whenever it changes
  React.useEffect(() => {
    updateUIState({
      activePanel: activePanel,
      isRackPropertiesVisible: isRackPropertiesVisible,
      isMeasurementActive: isMeasurementActive
    })
  }, [activePanel, isRackPropertiesVisible, isMeasurementActive])
  
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

  // Handler for clicking MEP items in the panel (for duct selection)
  const handleMepItemClick = (item) => {
    if (item.type === 'duct') {
      
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
    }
  }

  // Handler for changing duct color from MEP panel
  const handleDuctColorChange = (ductId, newColor) => {
    
    // Update the mepItems state
    const updatedItems = mepItems.map(item => {
      const baseId = item.id.toString().split('_')[0]
      const ductBaseId = ductId.toString().split('_')[0]
      if (baseId === ductBaseId || item.id === ductId) {
        return { ...item, color: newColor }
      }
      return item
    })
    setMepItems(updatedItems)
    
    // Update the 3D duct color
    if (window.ductworkRendererInstance?.ductInteraction) {
      const ductworkRenderer = window.ductworkRendererInstance
      const ductworkGroup = ductworkRenderer.getDuctworkGroup()
      
      // Find the duct group by ID
      ductworkGroup.children.forEach(ductGroup => {
        const ductData = ductGroup.userData?.ductData
        if (ductData) {
          const baseId = ductData.id.toString().split('_')[0]
          const ductBaseId = ductId.toString().split('_')[0]
          if (baseId === ductBaseId || ductData.id === ductId) {
            // Update duct color using the interaction system
            if (ductworkRenderer.ductInteraction.updateDuctDimensions) {
              ductworkRenderer.ductInteraction.updateDuctDimensions({ color: newColor })
            }
          }
        }
      })
    }
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

  // Handler for building shell save
  const handleBuildingSave = (params) => {
    setBuildingParams(params)
    
    // Update manifest with building shell data
    updateBuildingShell(params)
    
    if (buildingShell.update) {
      buildingShell.update(params)
    }
    
    // Update rack with new building context for top clearance calculation
    if (tradeRack.update) {
      const updatedRackParams = {
        ...rackParams,
        buildingContext: {
          corridorHeight: params.corridorHeight,
          beamDepth: params.beamDepth
        }
      }
      tradeRack.update(updatedRackParams)
    }
  }

  // Handler for trade rack save
  const handleRackSave = (params) => {
    setRackParams(params)
    
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
    }

    // Save configuration to localStorage
    try {
      const savedConfigs = JSON.parse(localStorage.getItem('tradeRackConfigurations') || '[]')
      const newConfig = {
        id: Date.now(),
        name: `Rack Configuration ${savedConfigs.length + 1}`,
        ...params,
        savedAt: new Date().toISOString()
      }
      savedConfigs.push(newConfig)
      localStorage.setItem('tradeRackConfigurations', JSON.stringify(savedConfigs))
      
      // Update manifest with new trade rack configuration (mark as new save)
      updateTradeRackConfiguration(combinedParams, true)
      
      
      // Trigger refresh of saved configurations panel
      setSavedConfigsRefresh(prev => prev + 1)
    } catch (error) {
      console.error('Error saving rack configuration:', error)
    }
  }

  // Handler for restoring saved rack configuration
  const handleRestoreConfiguration = (config) => {
    
    // Update rack parameters with saved config (excluding metadata)
    const { id, name, savedAt, importedAt, originalId, ...configParams } = config
    setRackParams(configParams)
    
    // Apply the configuration to the 3D scene WITHOUT saving a new copy
    // Switch building shell mode based on mount type
    if (buildingShell.switchMode) {
      const isFloorMounted = configParams.mountType === 'floor'
      buildingShell.switchMode(buildingParams, isFloorMounted)
    }
    
    // Combine rack params with building shell context for positioning calculation
    const combinedParams = {
      ...configParams,
      buildingContext: {
        corridorHeight: buildingParams.corridorHeight,
        beamDepth: buildingParams.beamDepth
      }
    }
    
    if (tradeRack.update) {
      tradeRack.update(combinedParams)
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
            onSave={handleRackSave}
            onClose={() => setIsRackPropertiesVisible(false)}
          />
        )}
        <AppSavedConfigurations 
          rootClassName="app-saved-configurationsroot-class-name" 
          onRestoreConfiguration={handleRestoreConfiguration}
          refreshTrigger={savedConfigsRefresh}
        />
        <AppTierMEP 
          rootClassName="app-tier-me-proot-class-name" 
          mepItems={mepItems}
          onRemoveItem={handleRemoveMepItem}
          onItemClick={handleMepItemClick}
          onColorChange={handleDuctColorChange}
        />
        <AppAddMEP rootClassName="app-add-me-proot-class-name" />
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
      />
      
      <ThreeScene 
        isMeasurementActive={isMeasurementActive}
        mepItems={mepItems}
        onSceneReady={(scene, materials, snapPoints) => {
          // Set references in the building shell hook
          buildingShell.setReferences(scene, materials, snapPoints)
          
          // Set references in the trade rack hook
          tradeRack.setReferences(scene, materials, snapPoints)
          
          // Initialize building shell based on default mount type
          const initialMountType = tradeRackDefaults.mountType || 'deck'
          const isInitialFloorMounted = initialMountType === 'floor'
          buildingShell.build(buildingShellDefaults, isInitialFloorMounted)
          
          // Initialize trade rack with defaults and building context
          const initialRackParams = {
            ...tradeRackDefaults,
            buildingContext: {
              corridorHeight: buildingShellDefaults.corridorHeight,
              beamDepth: buildingShellDefaults.beamDepth
            }
          }
          tradeRack.build(initialRackParams)
          
          // Update ductwork renderer with actual rack parameters
          if (window.ductworkRendererInstance) {
            window.ductworkRendererInstance.updateRackParams(initialRackParams)
          }
        }}
      />
    </div>
  )
}

export default AppPage
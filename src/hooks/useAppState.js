/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import { useState, useEffect } from 'react'
import { buildingShellDefaults } from '../types/buildingShell'
import { tradeRackDefaults } from '../types/tradeRack'
import { 
  getProjectManifest,
  setActiveConfiguration,
  updateBuildingShell,
  updateTradeRackConfiguration
} from '../utils/projectManifest'
import { getTemporaryState, updateUIState as updateTempUIState, getRackTemporaryState, getAllMEPItemsFromTemporary } from '../utils/temporaryState'

/**
 * Custom hook for managing application state
 */
export const useAppState = () => {
  // Helper function to restore UI state from temporary state
  const getInitialUIState = () => {
    try {
      const tempState = getTemporaryState()
      return tempState.ui || {}
    } catch (error) {
      return {}
    }
  }

  const initialUIState = getInitialUIState()

  // State to track project name
  const [projectName, setProjectName] = useState(() => {
    const manifest = getProjectManifest()
    return manifest.project?.name || 'Office Building'
  })

  // UI State
  const [activePanel, setActivePanel] = useState(initialUIState.activePanel || null)
  const [isRackPropertiesVisible, setIsRackPropertiesVisible] = useState(
    initialUIState.isRackPropertiesVisible !== undefined ? initialUIState.isRackPropertiesVisible : true
  )
  const [isSavedConfigsVisible, setIsSavedConfigsVisible] = useState(true)
  const [savedConfigsRefresh, setSavedConfigsRefresh] = useState(0)
  const [isMeasurementActive, setIsMeasurementActive] = useState(
    initialUIState.isMeasurementActive !== undefined ? initialUIState.isMeasurementActive : false
  )
  const [viewMode, setViewMode] = useState(
    initialUIState.viewMode || '3D'
  )
  const [isConfigLoaded, setIsConfigLoaded] = useState(false)
  const [isAddMEPVisible, setIsAddMEPVisible] = useState(
    initialUIState.isAddMEPVisible ?? false
  )

  // Building parameters state
  const [buildingParams, setBuildingParams] = useState(() => {
    try {
      const manifest = getProjectManifest()
      const savedBuildingShell = manifest.buildingShell?.parameters
      
      if (savedBuildingShell) {
        return savedBuildingShell
      }
      
      return buildingShellDefaults
    } catch (error) {
      return buildingShellDefaults
    }
  })

  // Trade rack parameters state
  const [rackParams, setRackParams] = useState(() => {
    try {
      const manifest = getProjectManifest()
      
      // Try to get active configuration from manifest first
      if (manifest.tradeRacks?.active) {
        const { lastApplied, ...configParams } = manifest.tradeRacks.active
        return configParams
      }
      
      // Fallback to active configuration by ID
      const activeConfigId = manifest.tradeRacks?.activeConfigurationId
      if (activeConfigId && manifest.tradeRacks?.configurations) {
        const activeConfig = manifest.tradeRacks.configurations.find(config => config.id === activeConfigId)
        
        if (activeConfig) {
          const { id, name, savedAt, importedAt, originalId, buildingShellParams, syncedAt, ...configParams } = activeConfig
          return configParams
        }
      }
      
      return tradeRackDefaults
    } catch (error) {
      console.error('Error loading rack parameters:', error)
      return tradeRackDefaults
    }
  })

  // MEP items state
  const [mepItems, setMepItems] = useState(() => {
    try {
      // Use temporary state instead of legacy manifest
      const allMepItems = getAllMEPItemsFromTemporary()
      return allMepItems
    } catch (error) {
      console.error('Error loading MEP items:', error)
      return []
    }
  })

  // Save UI state whenever it changes
  useEffect(() => {
    // Update all UI state in temporary storage only
    updateTempUIState({
      activePanel: activePanel,
      isRackPropertiesVisible: isRackPropertiesVisible,
      isMeasurementActive: isMeasurementActive,
      isAddMEPVisible: isAddMEPVisible,
      viewMode: viewMode
    })
  }, [activePanel, isRackPropertiesVisible, isMeasurementActive, isAddMEPVisible, viewMode])

  // Mark configuration as loaded after initial render
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsConfigLoaded(true)
    }, 50)
    
    return () => clearTimeout(timer)
  }, [])

  /**
   * Updates the project name in state and manifest
   * @param {string} newName - The new project name
   */
  const handleProjectNameChange = (newName) => {
    setProjectName(newName)
    
    // Update project name in manifest
    const manifest = getProjectManifest()
    manifest.project.name = newName
    manifest.project.lastModified = new Date().toISOString()
    
    // Save updated manifest
    require('../utils/projectManifest').saveProjectManifest(manifest)
  }

  /**
   * Handles panel selection and updates UI state accordingly
   * Manages active panel state and rack properties visibility
   * @param {string} panelName - Name of the panel to toggle (e.g., 'tradeRack', 'mep')
   */
  const handlePanelClick = (panelName) => {
    if (panelName === 'tradeRack') {
      const newRackPropertiesState = !isRackPropertiesVisible
      
      // When opening trade rack properties, preserve current rack position and top clearance
      if (newRackPropertiesState && window.tradeRackInteractionInstance) {
        const currentPosition = window.tradeRackInteractionInstance.getCurrentRackPosition()
        if (currentPosition) {
          console.log('🔧 Preserving current rack position when opening properties:', currentPosition)
          
          // Also get current top clearance from temporary state
          let currentTopClearance = null
          try {
            const tempState = getRackTemporaryState()
            if (tempState?.topClearance !== undefined) {
              currentTopClearance = tempState.topClearance // Already in feet
              console.log('🔧 Preserving current top clearance from temp state:', currentTopClearance, 'feet')
            }
          } catch (error) {
            console.warn('Could not get current top clearance:', error)
          }
          
          setRackParams(prevParams => ({
            ...prevParams,
            currentPosition: currentPosition,
            // Update top clearance if available from temporary state
            ...(currentTopClearance !== null && { topClearance: currentTopClearance })
          }))
        }
      }
      
      setIsRackPropertiesVisible(newRackPropertiesState)
      if (newRackPropertiesState) {
        setActivePanel(null)
      }
      return
    }
    
    const newActivePanel = activePanel === panelName ? null : panelName
    setActivePanel(newActivePanel)
    if (newActivePanel !== null) {
      setIsRackPropertiesVisible(false)
    }
  }

  return {
    // State
    projectName,
    activePanel,
    isRackPropertiesVisible,
    isSavedConfigsVisible,
    savedConfigsRefresh,
    isMeasurementActive,
    viewMode,
    isConfigLoaded,
    isAddMEPVisible,
    buildingParams,
    rackParams,
    mepItems,
    
    // Setters
    setProjectName,
    setActivePanel,
    setIsRackPropertiesVisible,
    setIsSavedConfigsVisible,
    setSavedConfigsRefresh,
    setIsMeasurementActive,
    setViewMode,
    setIsConfigLoaded,
    setIsAddMEPVisible,
    setBuildingParams,
    setRackParams,
    setMepItems,
    
    // Handlers
    handleProjectNameChange,
    handlePanelClick
  }
}
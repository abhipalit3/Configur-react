/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import { useState, useEffect } from 'react'
import { buildingShellDefaults } from '../types/buildingShell'
import { tradeRackDefaults } from '../types/tradeRack'
import { 
  updateUIState,
  setActiveConfiguration,
  updateBuildingShell,
  updateTradeRackConfiguration
} from '../utils/projectManifest'

/**
 * Custom hook for managing application state
 */
export const useAppState = () => {
  // Helper function to restore UI state from manifest
  const getInitialUIState = () => {
    try {
      const manifest = JSON.parse(localStorage.getItem('projectManifest') || '{}')
      const savedUIState = manifest.uiState || {}
      return savedUIState
    } catch (error) {
      return {}
    }
  }

  const initialUIState = getInitialUIState()

  // State to track project name
  const [projectName, setProjectName] = useState(() => {
    return localStorage.getItem('projectName') || 'Office Building'
  })

  // UI State
  const [activePanel, setActivePanel] = useState(initialUIState.activePanel || null)
  const [isRackPropertiesVisible, setIsRackPropertiesVisible] = useState(
    initialUIState.isRackPropertiesVisible !== undefined ? initialUIState.isRackPropertiesVisible : true
  )
  const [isSavedConfigsVisible, setIsSavedConfigsVisible] = useState(true)
  const [savedConfigsRefresh, setSavedConfigsRefresh] = useState(0)
  const [isMeasurementActive, setIsMeasurementActive] = useState(
    initialUIState.isMeasurementActive || false
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
      const manifest = JSON.parse(localStorage.getItem('projectManifest') || '{}')
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
      const manifest = JSON.parse(localStorage.getItem('projectManifest') || '{}')
      const activeConfigId = manifest.tradeRacks?.activeConfigurationId
      
      if (activeConfigId) {
        const savedConfigs = JSON.parse(localStorage.getItem('tradeRackConfigurations') || '[]')
        const activeConfig = savedConfigs.find(config => config.id === activeConfigId)
        
        if (activeConfig) {
          const { id, name, savedAt, importedAt, originalId, buildingShellParams, ...configParams } = activeConfig
          localStorage.setItem('rackParameters', JSON.stringify(configParams))
          return configParams
        }
      }
      
      const saved = localStorage.getItem('rackParameters')
      if (saved) {
        return JSON.parse(saved)
      }
    } catch (error) {
      console.error('Error loading rack parameters:', error)
    }
    
    localStorage.setItem('rackParameters', JSON.stringify(tradeRackDefaults))
    return tradeRackDefaults
  })

  // MEP items state
  const [mepItems, setMepItems] = useState(() => {
    try {
      const savedItems = localStorage.getItem('configurMepItems')
      const parsedItems = savedItems ? JSON.parse(savedItems) : []
      return parsedItems
    } catch (error) {
      return []
    }
  })

  // Save UI state whenever it changes
  useEffect(() => {
    updateUIState({
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
   * Updates the project name in state and localStorage
   * @param {string} newName - The new project name
   */
  const handleProjectNameChange = (newName) => {
    setProjectName(newName)
    localStorage.setItem('projectName', newName)
  }

  /**
   * Handles panel selection and updates UI state accordingly
   * Manages active panel state and rack properties visibility
   * @param {string} panelName - Name of the panel to toggle (e.g., 'tradeRack', 'mep')
   */
  const handlePanelClick = (panelName) => {
    if (panelName === 'tradeRack') {
      const newRackPropertiesState = !isRackPropertiesVisible
      
      // When opening trade rack properties, preserve current rack position
      if (newRackPropertiesState && window.tradeRackInteractionInstance) {
        const currentPosition = window.tradeRackInteractionInstance.getCurrentRackPosition()
        if (currentPosition) {
          console.log('🔧 Preserving current rack position when opening properties:', currentPosition)
          setRackParams(prevParams => ({
            ...prevParams,
            currentPosition: currentPosition
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
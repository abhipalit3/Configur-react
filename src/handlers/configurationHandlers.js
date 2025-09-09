/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import { 
  updateBuildingShell,
  updateTradeRackConfiguration,
  setActiveConfiguration
} from '../utils/projectManifest'

/**
 * Creates configuration handlers for the application
 */
export const createConfigurationHandlers = (
  buildingParams,
  setBuildingParams,
  rackParams,
  setRackParams,
  setSavedConfigsRefresh,
  buildingShell,
  tradeRack
) => {

  // Handler for building shell save
  const handleBuildingSave = (params) => {
    setBuildingParams(params)
    
    // Update manifest with building shell data
    updateBuildingShell(params)
    
    // Get the latest rack parameters from localStorage
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
    
    // Update rack with new building context
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
      
      // Refresh MEP items after rack update
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
  }

  // Handler for adding rack to scene
  const handleAddRack = (params, setIsRackPropertiesVisible) => {
    setRackParams(params)
    
    // Store current rack parameters in localStorage
    localStorage.setItem('rackParameters', JSON.stringify(params))
    
    // Switch building shell mode based on mount type
    if (buildingShell.switchMode) {
      const isFloorMounted = params.mountType === 'floor'
      buildingShell.switchMode(buildingParams, isFloorMounted)
    }
    
    // Combine rack params with building shell context
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
      
      // Trigger recalculation of tier info
      setTimeout(() => {
        if (window.ductworkRendererInstance) {
          window.ductworkRendererInstance.recalculateTierInfo()
        }
      }, 200)
    }
    
    // Close the properties panel after adding rack
    setIsRackPropertiesVisible(false)
  }

  // Handler for when configuration is saved
  const handleConfigurationSaved = (config) => {
    // Trigger refresh of saved configurations panel
    setSavedConfigsRefresh(prev => prev + 1)
    
    // Update manifest with new trade rack configuration
    updateTradeRackConfiguration(config, true)
    
    // Set this as the active configuration
    setActiveConfiguration(config.id)
  }

  // Handler for restoring saved rack configuration
  const handleRestoreConfiguration = (config) => {
    
    // Update rack parameters with saved config
    const { id, name, savedAt, importedAt, originalId, buildingShellParams, ...configParams } = config
    setRackParams(configParams)
    
    // Store current rack parameters in localStorage
    localStorage.setItem('rackParameters', JSON.stringify(configParams))
    
    // Set this as the active configuration
    if (id) {
      setActiveConfiguration(id)
    }
    
    // Apply the configuration to the 3D scene
    if (buildingShell.switchMode) {
      const isFloorMounted = configParams.mountType === 'floor'
      buildingShell.switchMode(buildingParams, isFloorMounted)
    }
    
    // Ensure building context is passed for deck-mounted racks
    const combinedParams = {
      ...configParams,
      buildingContext: {
        corridorHeight: buildingParams.corridorHeight,
        beamDepth: buildingParams.beamDepth || { feet: 0, inches: 0 }
      }
    }
    
    // Force a complete rebuild of the rack
    if (tradeRack.update) {
      setTimeout(() => {
        tradeRack.update(combinedParams)
      }, 50)
    }
    
    // Update ductwork renderer with restored rack parameters
    if (window.ductworkRendererInstance) {
      window.ductworkRendererInstance.updateRackParams(combinedParams)
      
      setTimeout(() => {
        if (window.ductworkRendererInstance) {
          window.ductworkRendererInstance.recalculateTierInfo()
        }
      }, 200)
    }
    
    // Update manifest with restored configuration
    updateTradeRackConfiguration(combinedParams, false)
  }

  return {
    handleBuildingSave,
    handleAddRack,
    handleConfigurationSaved,
    handleRestoreConfiguration
  }
}
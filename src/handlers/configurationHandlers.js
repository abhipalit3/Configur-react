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
    // FIRST: Clear any existing temporary state since we're creating a new rack
    localStorage.removeItem('rackTemporaryState')
    console.log('🔧 Cleared temporary state for new rack creation')
    
    // Convert topClearance from feet+inches object to total inches
    let processedParams = { 
      ...params,
      // Add flag to indicate this is a fresh rack, not a restoration
      isNewRack: true,
      // Add flag to indicate we're using preserved position (not restoring config)
      isUsingPreservedPosition: !!params.preservedPosition,
      // Use preserved position if available, otherwise reset to center (z=0)
      position: params.preservedPosition || { x: 0, y: 0, z: 0 }
    }
    
    // Clean up the preservedPosition from params to avoid storing it
    delete processedParams.preservedPosition
    if (params.topClearance && typeof params.topClearance === 'object') {
      const totalInches = (params.topClearance.feet || 0) * 12 + (params.topClearance.inches || 0)
      processedParams.topClearanceInches = totalInches
      // Keep the original for buildRack positioning (it still needs this for initial positioning)
      processedParams.topClearance = totalInches / 12
      console.log('🔧 Converted topClearance from', params.topClearance, 'to', totalInches, 'inches')
    } else if (processedParams.topClearanceInches === undefined) {
      // Ensure topClearanceInches is always set, default to 0
      processedParams.topClearanceInches = 0
    }
    
    setRackParams(processedParams)
    
    // Store processed rack parameters in localStorage
    localStorage.setItem('rackParameters', JSON.stringify(processedParams))
    
    // Switch building shell mode based on mount type
    if (buildingShell.switchMode) {
      const isFloorMounted = processedParams.mountType === 'floor'
      buildingShell.switchMode(buildingParams, isFloorMounted)
    }
    
    // Combine rack params with building shell context
    const combinedParams = {
      ...processedParams,
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
    
    console.log('🔧 RESTORE CONFIG DEBUG:')
    console.log('- config received:', config)
    console.log('- config.position:', config.position)
    console.log('- config.topClearance:', config.topClearance)
    
    // Update rack parameters with saved config
    const { id, name, savedAt, importedAt, originalId, buildingShellParams, ...configParams } = config
    
    // Convert topClearance from feet+inches object to total inches (same as handleAddRack)
    let processedParams = { ...configParams }
    if (configParams.topClearance && typeof configParams.topClearance === 'object') {
      const totalInches = (configParams.topClearance.feet || 0) * 12 + (configParams.topClearance.inches || 0)
      processedParams.topClearanceInches = totalInches
      // Keep the original for buildRack positioning
      processedParams.topClearance = totalInches / 12
      console.log('🔧 Restored config - converted topClearance from', configParams.topClearance, 'to', totalInches, 'inches')
    }
    
    // Clear any existing temporary state since we're restoring a configuration
    localStorage.removeItem('rackTemporaryState')
    console.log('🔧 Cleared temporary state for configuration restore')
    
    setRackParams(processedParams)
    
    // Store processed rack parameters in localStorage
    localStorage.setItem('rackParameters', JSON.stringify(processedParams))
    
    // Set this as the active configuration
    if (id) {
      setActiveConfiguration(id)
    }
    
    // Apply the configuration to the 3D scene
    if (buildingShell.switchMode) {
      const isFloorMounted = processedParams.mountType === 'floor'
      buildingShell.switchMode(buildingParams, isFloorMounted)
    }
    
    // Ensure building context is passed for deck-mounted racks
    const combinedParams = {
      ...processedParams,
      buildingContext: {
        corridorHeight: buildingParams.corridorHeight,
        beamDepth: buildingParams.beamDepth || { feet: 0, inches: 0 }
      }
    }
    
    console.log('🔧 RESTORE FINAL PARAMS DEBUG:')
    console.log('- combinedParams.position:', combinedParams.position)
    console.log('- combinedParams.topClearance:', combinedParams.topClearance)
    console.log('- combinedParams.topClearanceInches:', combinedParams.topClearanceInches)
    
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
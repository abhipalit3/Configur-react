/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import { 
  getProjectManifest,
  updateBuildingShell,
  updateTradeRackConfiguration,
  setActiveConfiguration
} from '../utils/projectManifest'
import { clearRackTemporaryState, updateRackTemporaryState } from '../utils/temporaryState'

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
    
    // Get the latest rack parameters from manifest
    let currentRackParams = rackParams
    try {
      const manifest = getProjectManifest()
      if (manifest.tradeRacks?.active) {
        const { lastApplied, ...configParams } = manifest.tradeRacks.active
        currentRackParams = configParams
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
          const manifest = getProjectManifest()
          const allMepItems = [
            ...(manifest.mepItems?.ductwork || []),
            ...(manifest.mepItems?.piping || []),
            ...(manifest.mepItems?.conduits || []),
            ...(manifest.mepItems?.cableTrays || [])
          ]
          window.pipingRendererInstance.updatePiping(allMepItems)
        }
      }, 100)
    }
  }

  // Handler for adding rack to scene
  const handleAddRack = (params, setIsRackPropertiesVisible) => {
    // Convert topClearance from feet+inches object to total inches first
    let topClearanceInches = 0
    if (params.topClearance && typeof params.topClearance === 'object') {
      topClearanceInches = (params.topClearance.feet || 0) * 12 + (params.topClearance.inches || 0)
    } else if (typeof params.topClearance === 'number') {
      topClearanceInches = params.topClearance * 12 // Convert feet to inches
    }
    
    // For new racks, set temporary state with Z=0 and preserve top clearance from properties panel
    updateRackTemporaryState({
      position: { x: 0, y: 0, z: 0 },
      topClearance: topClearanceInches / 12, // Store in feet for consistency
      isDragging: false
    })
    console.log('🔧 Set temporary state for new rack: Z=0, topClearance=', topClearanceInches, 'inches')
    
    // Convert topClearance from feet+inches object to total inches
    let processedParams = { 
      ...params
    }
    
    // Clean up preserved position
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
    
    // Calculate Y position based on top clearance for new racks
    // For deck-mounted racks, the baseline Y should be calculated from building context
    const clearanceInches = processedParams.topClearanceInches || 0
    const clearanceMeters = clearanceInches * 0.0254 // Convert inches to meters
    
    // For new racks, don't pass a position so buildRack will calculate it based on clearance
    // The buildRack will handle Z=0 for new racks via the isNewRack flag
    delete processedParams.position
    
    setRackParams(processedParams)
    
    // Update manifest with new rack configuration
    updateTradeRackConfiguration(processedParams, false)
    
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
      
      // Update temporary state with final rack position AFTER the rack is built
      // For fresh racks, this should be Z=0 as calculated by buildRack
      setTimeout(() => {
        // Get the actual final position from the built rack
        const finalPosition = { x: 0, y: combinedParams.position?.y || 0, z: 0 }
        updateRackTemporaryState({
          position: finalPosition,
          isDragging: false
        })
        console.log('🔧 Updated temporary state for new rack:', finalPosition)
      }, 100)
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
    
    // DON'T update the active configuration or trigger rebuilds
    // Just let the save happen without changing the current rack
    console.log('🔧 Configuration saved, not changing active rack')
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
    
    // Update temporary state with restored configuration position instead of clearing
    // Make sure we use the exact position from the saved configuration
    updateRackTemporaryState({
      position: processedParams.position || { x: 0, y: 0, z: 0 },
      isDragging: false
    })
    console.log('🔧 Updated temporary state with restored configuration position:', processedParams.position)
    
    setRackParams(processedParams)
    
    // Update manifest with restored rack configuration
    updateTradeRackConfiguration(processedParams, false)
    
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
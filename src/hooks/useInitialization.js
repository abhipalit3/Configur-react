/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import { useEffect } from 'react'
import { 
  initializeProject,
  syncManifestWithLocalStorage,
  syncMEPItemsWithLocalStorage,
  updateMEPItems
} from '../utils/projectManifest'

/**
 * Custom hook for initialization logic
 */
export const useInitialization = (
  rackParams,
  buildingParams,
  buildingShell,
  tradeRack,
  mepItems
) => {

  // Initialize project manifest on component mount
  useEffect(() => {
    // Initialize project and check if we need to seed data
    const manifest = initializeProject()
    
    // Sync manifest with localStorage to ensure consistency
    syncManifestWithLocalStorage()
    syncMEPItemsWithLocalStorage()
    
    return () => {
      // Cleanup if needed
    }
  }, [])

  // Save to localStorage and update manifest whenever mepItems changes
  useEffect(() => {
    try {
      localStorage.setItem('configurMepItems', JSON.stringify(mepItems))
      // Update manifest with current MEP items
      updateMEPItems(mepItems, 'all')
    } catch (error) {
      console.error('Error saving MEP items:', error)
    }
  }, [mepItems])

  // Apply loaded rack configuration to 3D scene on mount
  useEffect(() => {
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
}
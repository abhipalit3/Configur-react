/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import { useEffect } from 'react'

/**
 * Custom hook for syncing building and rack parameters
 */
export const useBuildingRackSync = (
  buildingParams,
  rackParams,
  isConfigLoaded,
  buildingShell,
  tradeRack
) => {

  // Update trade rack when building shell parameters change
  useEffect(() => {
    if (rackParams && tradeRack.update && isConfigLoaded) {
      
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
  }, [buildingParams, isConfigLoaded, rackParams, buildingShell, tradeRack])
}
/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import React from 'react'
import * as THREE from 'three'
import { BaseMepEditor } from '../base/BaseMepEditor.js'

/**
 * TradeRackEditor - Trade rack-specific editor using base component
 * Simplified editor for basic trade rack configuration
 */
export const TradeRackEditor = ({ selectedTradeRack, ...otherProps }) => {
  const fields = [
    {
      type: 'number',
      name: 'topClearance',
      label: 'Top Clearance (in)',
      min: '0',
      max: '36',
      step: '1'
    }
  ]

  const getInitialDimensions = (selectedTradeRack) => {
    if (!selectedTradeRack?.userData?.configuration) {
      return {
        topClearance: 0, // Default 0 inches (at baseline position)
        position: { x: 0, y: 0, z: 0 }
      }
    }
    
    const config = selectedTradeRack.userData.configuration
    
    // Calculate clearance based on current position relative to baseline
    let topClearanceInches = 0 // default (at baseline)
    if (config.baselineY !== undefined && selectedTradeRack.position) {
      // Calculate current offset from baseline in inches
      // Negative offset means rack is below baseline (more clearance)
      const offsetFromBaseline = config.baselineY - selectedTradeRack.position.y
      topClearanceInches = Math.round(offsetFromBaseline * 39.3701) // meters to inches
    } else if (config.topClearance !== undefined) {
      // Fallback to stored topClearance if no baseline available
      topClearanceInches = Math.round(config.topClearance * 12)
    }
    
    return {
      topClearance: Math.max(0, topClearanceInches), // Ensure non-negative
      position: selectedTradeRack.position || { x: 0, y: 0, z: 0 }
    }
  }

  // Override the save behavior for trade rack format
  const handleSave = (dimensions) => {
    if (otherProps.onSave) {
      // Pass top clearance in inches directly to the interaction
      const topClearanceInches = parseInt(dimensions.topClearance) || 0
      
      const rackConfig = {
        topClearance: topClearanceInches
      }
      
      console.log(`🔧 TradeRackEditor saving: ${topClearanceInches} inches`)
      otherProps.onSave(rackConfig)
    }
  }

  // Custom offset function to position editor just below the gizmo
  const getOffsetY = (rack) => {
    if (!rack) return 0
    
    // Get the bounding box of the rack to find its center (where gizmo is)
    const box = new THREE.Box3().setFromObject(rack)
    const size = box.getSize(new THREE.Vector3())
    
    // The gizmo is at the center of the bounding box
    // calculateScreenPosition starts from object origin and SUBTRACTS the offset
    // So worldPos.y - offset = final Y position
    // We want: final Y = center Y - 0.8 (below center)
    // Therefore: offset = worldPos.y - (center.y - 0.8)
    
    // Since the rack origin is typically at the bottom:
    // Center is at origin.y + size.y/2
    // We want to be at center - 0.8
    // So offset should be -(size.y/2 - 0.8)
    
    const offset = -(size.y / 2 - 0.8)
    
    
    return offset
  }
  
  return (
    <BaseMepEditor
      selectedObject={selectedTradeRack}
      {...otherProps}
      mepType="tradeRack"
      fields={fields}
      getInitialDimensions={getInitialDimensions}
      onSave={handleSave}
      getOffsetY={getOffsetY}
      minWidth="250px"
    />
  )
}

export default TradeRackEditor
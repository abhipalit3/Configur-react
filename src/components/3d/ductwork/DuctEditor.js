/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import React from 'react'
import { BaseMepEditor } from '../base/BaseMepEditor.js'

/**
 * DuctEditor - Duct-specific implementation using base component
 * This dramatically simplifies the duct editor code
 */
export const DuctEditor = (props) => {
  // Define duct-specific fields
  const fields = [
    {
      type: 'tier',
      name: 'tier',
      label: 'Tier',
      processor: (value) => parseInt(value)
    },
    {
      type: 'number',
      name: 'width',
      label: 'W',
      step: '0.5',
      min: '1',
      max: '48',
      width: '50px',
      processor: (value) => parseFloat(value)
    },
    {
      type: 'number',
      name: 'height',
      label: 'H',
      step: '0.5',
      min: '1',
      max: '48',
      width: '50px',
      processor: (value) => parseFloat(value)
    },
    {
      type: 'number',
      name: 'insulation',
      label: 'I',
      step: '0.25',
      min: '0',
      max: '6',
      width: '50px',
      processor: (value) => parseFloat(value)
    }
  ]

  // Get initial dimensions from selected duct
  const getInitialDimensions = (selectedDuct) => {
    if (!selectedDuct?.userData?.ductData) {
      return {
        width: 12,
        height: 8,
        insulation: 0,
        tier: 1
      }
    }
    
    const ductData = selectedDuct.userData.ductData
    return {
      width: ductData.width || 12,
      height: ductData.height || 8,
      insulation: ductData.insulation || 0,
      tier: ductData.tier || 1
    }
  }

  // Calculate editor position offset based on duct size
  const getOffsetY = (selectedDuct) => {
    if (!selectedDuct?.userData?.ductData) return 0.3
    
    const ductData = selectedDuct.userData.ductData
    const height = ductData.height || 8
    const insulation = ductData.insulation || 0
    
    // Convert inches to meters
    const heightM = height * 0.0254
    const insulationM = insulation * 0.0254
    const totalHeight = heightM + (2 * insulationM)
    
    // Position editor above the duct with some padding
    return (totalHeight / 2) + 0.3
  }

  // Use the base editor with duct-specific configuration
  return (
    <BaseMepEditor
      {...props}
      mepType="duct"
      fields={fields}
      getInitialDimensions={getInitialDimensions}
      getOffsetY={getOffsetY}
      minWidth="400px"
    />
  )
}

export default DuctEditor
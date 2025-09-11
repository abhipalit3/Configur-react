/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import React from 'react'
import { BaseMepEditor } from '../BaseMepEditor.js'

/**
 * Example PipeEditor using base component
 * Shows how to customize fields for different MEP types
 */
export const PipeEditorBase = (props) => {
  // Define pipe-specific fields
  const fields = [
    {
      type: 'tier',
      name: 'tier',
      label: 'Tier',
      processor: (value) => parseInt(value)
    },
    {
      type: 'number',
      name: 'diameter',
      label: 'Ø',
      step: '0.25',
      min: '0.5',
      max: '12',
      width: '60px',
      processor: (value) => parseFloat(value)
    },
    {
      type: 'select',
      name: 'material',
      label: 'Mat',
      width: '80px',
      options: [
        { value: 'steel', label: 'Steel' },
        { value: 'copper', label: 'Copper' },
        { value: 'pvc', label: 'PVC' },
        { value: 'hdpe', label: 'HDPE' }
      ]
    },
    {
      type: 'number',
      name: 'insulation',
      label: 'I',
      step: '0.25',
      min: '0',
      max: '4',
      width: '50px',
      processor: (value) => parseFloat(value)
    }
  ]

  // Get initial dimensions from selected pipe
  const getInitialDimensions = (selectedPipe) => {
    if (!selectedPipe?.userData?.pipeData) {
      return {
        diameter: 2,
        material: 'steel',
        insulation: 0,
        tier: 1
      }
    }
    
    const pipeData = selectedPipe.userData.pipeData
    return {
      diameter: pipeData.diameter || 2,
      material: pipeData.material || 'steel',
      insulation: pipeData.insulation || 0,
      tier: pipeData.tier || 1
    }
  }

  // Calculate editor position offset based on pipe size
  const getOffsetY = (selectedPipe) => {
    if (!selectedPipe?.userData?.pipeData) return 0.3
    
    const pipeData = selectedPipe.userData.pipeData
    const diameter = pipeData.diameter || 2
    const insulation = pipeData.insulation || 0
    
    // Convert inches to meters
    const diameterM = diameter * 0.0254
    const insulationM = insulation * 0.0254
    const totalDiameter = diameterM + (2 * insulationM)
    
    // Position editor above the pipe with some padding
    return (totalDiameter / 2) + 0.2
  }

  // Use the base editor with pipe-specific configuration
  return (
    <BaseMepEditor
      {...props}
      mepType="pipe"
      fields={fields}
      getInitialDimensions={getInitialDimensions}
      getOffsetY={getOffsetY}
      minWidth="350px"
    />
  )
}

export default PipeEditorBase
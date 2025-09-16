/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import React, { useCallback } from 'react'
import { BaseMepEditor } from '../base/BaseMepEditor.js'

/**
 * PipeEditor - Pipe-specific implementation using base component
 * This dramatically simplifies the pipe editor code
 */
export const PipeEditor = (props) => {
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
      name: 'pipeType',
      label: 'Type',
      width: '90px',
      options: [
        { value: 'copper', label: 'Copper' },
        { value: 'steel', label: 'Steel' },
        { value: 'pvc', label: 'PVC' },
        { value: 'hdpe', label: 'HDPE' },
        { value: 'cast_iron', label: 'Cast Iron' },
        { value: 'pex', label: 'PEX' }
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
  const getInitialDimensions = useCallback((selectedPipe) => {
    if (!selectedPipe?.userData?.pipeData) {
      return {
        diameter: 2,
        pipeType: 'copper',
        insulation: 0,
        tier: 1,
        color: ''
      }
    }
    
    const pipeData = selectedPipe.userData.pipeData
    return {
      diameter: pipeData.diameter || 2,
      pipeType: pipeData.pipeType || pipeData.material || 'copper', // Handle both field names
      insulation: pipeData.insulation || 0,
      tier: pipeData.tier || 1,
      color: pipeData.color || ''
    }
  }, [])

  // Calculate editor position offset based on pipe size
  const getOffsetY = useCallback((selectedPipe) => {
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
  }, [])

  // Use the base editor with pipe-specific configuration
  return (
    <BaseMepEditor
      {...props}
      mepType="pipe"
      fields={fields}
      getInitialDimensions={getInitialDimensions}
      getOffsetY={getOffsetY}
      minWidth="400px"
    />
  )
}

export default PipeEditor
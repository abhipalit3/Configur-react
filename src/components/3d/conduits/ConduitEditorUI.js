/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import React from 'react'
import { BaseMepEditor } from '../base/BaseMepEditor.js'

/**
 * ConduitEditorUI - Conduit-specific editor using base component
 * Dramatically simplified from the original ~13k lines to ~50 lines
 */
export const ConduitEditorUI = ({ selectedConduit, ...otherProps }) => {
  const fields = [
    {
      type: 'tier',
      name: 'tier',
      label: 'Tier'
    },
    {
      type: 'select',
      name: 'conduitType',
      label: 'Type',
      options: [
        { value: 'EMT', label: 'EMT' },
        { value: 'Rigid', label: 'Rigid' },
        { value: 'PVC', label: 'PVC' },
        { value: 'Flexible', label: 'Flexible' }
      ]
    },
    {
      type: 'number',
      name: 'diameter',
      label: 'Ø',
      min: '0.25',
      max: '6',
      step: '0.25'
    },
    {
      type: 'number',
      name: 'spacing',
      label: 'S',
      min: '1',
      max: '12',
      step: '0.25'
    },
    {
      type: 'number',
      name: 'count',
      label: '#',
      min: '1',
      max: '20',
      step: '1'
    }
  ]

  const getInitialDimensions = (conduitData) => ({
    diameter: conduitData?.diameter || 1,
    conduitType: conduitData?.conduitType || 'EMT',
    spacing: conduitData?.spacing || 4,
    count: conduitData?.count || 1,
    tier: conduitData?.tier || 1,
    color: conduitData?.color || ''
  })

  return (
    <BaseMepEditor
      selectedObject={selectedConduit}
      {...otherProps}
      mepType="conduit"
      fields={fields}
      getInitialDimensions={getInitialDimensions}
    />
  )
}

export default ConduitEditorUI
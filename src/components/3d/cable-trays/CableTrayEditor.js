/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

import React from 'react'
import { BaseMepEditor } from '../base/BaseMepEditor.js'

/**
 * CableTrayEditor - Cable tray-specific editor using base component
 * Dramatically simplified from the original ~15k lines to ~50 lines
 */
export const CableTrayEditor = ({ selectedCableTray, ...otherProps }) => {
  const fields = [
    {
      type: 'tier',
      name: 'tier',
      label: 'Tier'
    },
    {
      type: 'select',
      name: 'trayType',
      label: 'Type',
      options: [
        { value: 'ladder', label: 'Ladder' },
        { value: 'solid bottom', label: 'Solid' },
        { value: 'wire mesh', label: 'Wire' }
      ]
    },
    {
      type: 'number',
      name: 'width',
      label: 'W',
      min: '6',
      max: '36',
      step: '0.5'
    },
    {
      type: 'number',
      name: 'height',
      label: 'H',
      min: '2',
      max: '12',
      step: '0.5'
    }
  ]

  const getInitialDimensions = (selectedCableTray) => {
    if (!selectedCableTray?.userData?.cableTrayData) {
      return {
        width: 12,
        height: 4,
        trayType: 'ladder',
        tier: 1,
        color: ''
      }
    }
    
    const cableTrayData = selectedCableTray.userData.cableTrayData
    return {
      width: cableTrayData.width || 12,
      height: cableTrayData.height || 4,
      trayType: cableTrayData.trayType || 'ladder',
      tier: cableTrayData.tier || 1,
      color: cableTrayData.color || ''
    }
  }

  return (
    <BaseMepEditor
      selectedObject={selectedCableTray}
      {...otherProps}
      mepType="cableTray"
      fields={fields}
      getInitialDimensions={getInitialDimensions}
    />
  )
}

export default CableTrayEditor
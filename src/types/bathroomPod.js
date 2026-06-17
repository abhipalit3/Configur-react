/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

export const BATHROOM_POD_MAX_SEGMENTS = 10

export const bathroomPodStructuralTypes = [
  { value: 'monolithic', label: 'Monolithic' },
  { value: 'tiesIntoExisting', label: 'Ties Into Existing Structure' }
]

export const bathroomPodFinishTypes = [
  { value: 'tile', label: 'Tile' },
  { value: 'futureFinish', label: 'Future Finish' }
]

export const bathroomPodFixtureTypes = [
  { value: 'toilet', label: 'Toilet', color: '#2f6f73' },
  { value: 'lavatory', label: 'Lavatory', color: '#6d5dfc' },
  { value: 'shower', label: 'Shower', color: '#2874a6' },
  { value: 'drain', label: 'Drain', color: '#111827' },
  { value: 'accessory', label: 'Accessory', color: '#8a5a44' },
  { value: 'other', label: 'Other', color: '#64748b' }
]

export const feetToInches = (feet = 0, inches = 0) => {
  const feetValue = parseFloat(feet) || 0
  const inchesValue = parseFloat(inches) || 0
  return Math.max(0, Math.round((feetValue * 12 + inchesValue) * 100) / 100)
}

export const inchesToFeetInches = (totalInches = 0) => {
  const safeInches = Math.max(0, parseFloat(totalInches) || 0)
  const feet = Math.floor(safeInches / 12)
  const inches = Math.round((safeInches - feet * 12) * 100) / 100
  return { feet, inches }
}

export const formatInchesAsFeet = (totalInches = 0) => {
  const { feet, inches } = inchesToFeetInches(totalInches)
  if (!inches) return `${feet}'0"`
  return `${feet}'${inches}"`
}

const makeFixture = (type, x, y, label) => ({
  id: `${type}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  type,
  x,
  y,
  label
})

const getLayoutBounds = (layout = []) => {
  if (!layout.length) {
    return {
      minX: 0,
      minY: 0,
      maxX: 96,
      maxY: 120,
      width: 96,
      height: 120
    }
  }

  const xs = layout.map(point => point.x)
  const ys = layout.map(point => point.y)
  const minX = Math.min(...xs)
  const minY = Math.min(...ys)
  const maxX = Math.max(...xs)
  const maxY = Math.max(...ys)

  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY
  }
}

const getLayoutCenter = (layout = []) => {
  const bounds = getLayoutBounds(layout)
  return {
    x: Math.round(((bounds.minX + bounds.maxX) / 2) * 100) / 100,
    y: Math.round(((bounds.minY + bounds.maxY) / 2) * 100) / 100
  }
}

const getDefaultSlopeBoxForLayout = (layout = []) => {
  const bounds = getLayoutBounds(layout)
  const minDimension = Math.max(18, Math.min(bounds.width, bounds.height))
  const size = Math.round(Math.min(36, minDimension * 0.45) * 100) / 100
  return {
    width: size,
    length: size,
    rotation: 0,
    depth: 1
  }
}

export const bathroomPodTemplates = [
  {
    id: 'compact',
    name: 'Compact 6x8',
    points: [
      { x: 0, y: 0 },
      { x: 72, y: 0 },
      { x: 72, y: 96 },
      { x: 0, y: 96 }
    ],
    drain: { x: 42, y: 60 }
  },
  {
    id: 'standard',
    name: 'Standard 8x10',
    points: [
      { x: 0, y: 0 },
      { x: 96, y: 0 },
      { x: 96, y: 120 },
      { x: 0, y: 120 }
    ],
    drain: { x: 60, y: 72 }
  },
  {
    id: 'angled-entry',
    name: 'Angled Entry 8x10',
    points: [
      { x: 0, y: 0 },
      { x: 96, y: 0 },
      { x: 96, y: 120 },
      { x: 24, y: 120 },
      { x: 0, y: 96 }
    ],
    drain: { x: 60, y: 72 }
  }
]

export const bathroomPodDefaults = {
  productType: 'bathroomPod',
  templateId: 'standard',
  layout: bathroomPodTemplates[1].points,
  structuralType: 'monolithic',
  finishType: 'tile',
  heights: {
    overall: 108,
    clear: 96,
    floorBase: 6
  },
  slopeBox: {
    width: 36,
    length: 36,
    rotation: 0,
    depth: 1
  },
  doorway: {
    edgeIndex: 0,
    offset: 30,
    width: 36,
    height: 84
  },
  coveEdgeIndex: 2,
  fixtures: [
    {
      id: 'drain_default',
      type: 'drain',
      x: bathroomPodTemplates[1].drain.x,
      y: bathroomPodTemplates[1].drain.y,
      label: 'Drain'
    }
  ]
}

export const createBathroomPodFromLayout = ({
  layout = bathroomPodTemplates[1].points,
  name = 'Custom Pod',
  templateId = 'custom',
  sourceImportBatchId = null
} = {}) => {
  const nextLayout = layout.map(point => ({ ...point }))
  const drain = getLayoutCenter(nextLayout)
  return {
    ...bathroomPodDefaults,
    id: `bathroom_pod_${Date.now()}`,
    name,
    templateId,
    sourceImportBatchId,
    layout: nextLayout,
    slopeBox: getDefaultSlopeBoxForLayout(nextLayout),
    doorway: {
      ...bathroomPodDefaults.doorway,
      edgeIndex: 0
    },
    coveEdgeIndex: Math.min(2, nextLayout.length - 1),
    fixtures: [
      {
        id: 'drain_default',
        type: 'drain',
        x: drain.x,
        y: drain.y,
        label: 'Drain'
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
}

export const createBathroomPodFromTemplate = (templateId = 'standard') => {
  const template = bathroomPodTemplates.find(item => item.id === templateId) || bathroomPodTemplates[1]
  return createBathroomPodFromLayout({
    layout: template.points,
    name: template.name,
    templateId: template.id
  })
}

export const createBathroomPodFixture = (type, x, y) => {
  const fixtureType = bathroomPodFixtureTypes.find(item => item.value === type) || bathroomPodFixtureTypes[5]
  return makeFixture(fixtureType.value, x, y, fixtureType.label)
}

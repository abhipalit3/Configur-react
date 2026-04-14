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
    clear: 96
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

export const createBathroomPodFromTemplate = (templateId = 'standard') => {
  const template = bathroomPodTemplates.find(item => item.id === templateId) || bathroomPodTemplates[1]
  const drain = template.drain

  return {
    ...bathroomPodDefaults,
    id: `bathroom_pod_${Date.now()}`,
    name: template.name,
    templateId: template.id,
    layout: template.points.map(point => ({ ...point })),
    doorway: {
      ...bathroomPodDefaults.doorway,
      edgeIndex: 0
    },
    coveEdgeIndex: Math.min(2, template.points.length - 1),
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

export const createBathroomPodFixture = (type, x, y) => {
  const fixtureType = bathroomPodFixtureTypes.find(item => item.value === type) || bathroomPodFixtureTypes[5]
  return makeFixture(fixtureType.value, x, y, fixtureType.label)
}


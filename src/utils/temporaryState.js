/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

/**
 * Temporary State Management System
 * Handles session-specific data that doesn't need to persist between app sessions
 * This includes camera state, UI state, temporary object positions, and interaction state
 */

const TEMPORARY_STATE_KEY = 'temporaryState'

/**
 * Create the initial temporary state structure
 */
export const createInitialTemporaryState = () => ({
  version: '1.0.0',
  sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
  createdAt: new Date().toISOString(),
  lastUpdated: new Date().toISOString(),
  
  // Camera and view state
  camera: {
    position: { x: 10.038100000385551, y: 2.8969804368500087, z: -0.3017166141457097 },
    rotation: { x: 5.677015507194442e-20, y: 1.5707963267948966, z: 0 },
    zoom: 3.1374761413173733,
    target: { x: 0.038100000385550795, y: 2.896980435510149, z: -0.30171660990868626 },
    viewMode: '2D'
  },
  
  // UI interaction state
  ui: {
    activePanel: null,
    selectedObjects: [],
    hoveredObjects: [],
    dragState: null,
    transformMode: 'translate',
    measurementToolActive: false,
    isRackPropertiesVisible: true,
    colorPickerState: null
  },
  
  // Temporary rack state during interactions
  rack: {
    temporaryPosition: null,
    isDragging: false,
    isPreviewMode: false,
    transformGizmoVisible: false,
    snapGuides: []
  },
  
  // MEP object temporary states
  mep: {
    selectedItemId: null,
    selectedItemType: null,
    editingItemId: null,
    previewItems: [],
    snapLines: []
  },
  
  // Measurement tool state
  measurements: {
    activePoints: [],
    previewLine: null,
    selectedMeasurements: [],
    axisLock: null
  }
})

/**
 * Get temporary state from localStorage
 * Creates initial state if none exists
 */
export const getTemporaryState = () => {
  try {
    const stored = localStorage.getItem(TEMPORARY_STATE_KEY)
    if (stored) {
      const state = JSON.parse(stored)
      // Validate structure and migrate if needed
      return validateAndMigrateTemporaryState(state)
    }
    // Create new temporary state if none exists
    const newState = createInitialTemporaryState()
    saveTemporaryState(newState)
    return newState
  } catch (error) {
    console.error('Error loading temporary state:', error)
    const fallbackState = createInitialTemporaryState()
    saveTemporaryState(fallbackState)
    return fallbackState
  }
}

/**
 * Save temporary state to localStorage
 */
export const saveTemporaryState = (state) => {
  try {
    state.lastUpdated = new Date().toISOString()
    localStorage.setItem(TEMPORARY_STATE_KEY, JSON.stringify(state, null, 2))
    return true
  } catch (error) {
    console.error('Error saving temporary state:', error)
    return false
  }
}

/**
 * Update camera state
 */
export const updateCameraState = (cameraData) => {
  const state = getTemporaryState()
  state.camera = {
    ...state.camera,
    ...cameraData
  }
  saveTemporaryState(state)
  return state
}

/**
 * Update UI state
 */
export const updateUIState = (uiChanges) => {
  const state = getTemporaryState()
  state.ui = {
    ...state.ui,
    ...uiChanges
  }
  saveTemporaryState(state)
  return state
}

/**
 * Update rack temporary state
 */
export const updateRackTemporaryState = (rackChanges) => {
  const state = getTemporaryState()
  state.rack = {
    ...state.rack,
    ...rackChanges
  }
  saveTemporaryState(state)
  return state
}

/**
 * Save rack temporary position during interactions
 */
export const saveRackTemporaryPosition = (position) => {
  const state = getTemporaryState()
  state.rack.position = {
    x: position.x,
    y: position.y,
    z: position.z
  }
  state.rack.isDragging = true
  saveTemporaryState(state)
  return state
}

/**
 * Clear rack temporary state
 */
export const clearRackTemporaryState = () => {
  const state = getTemporaryState()
  state.rack = {
    position: null,
    isDragging: false,
    isPreviewMode: false,
    transformGizmoVisible: false,
    snapGuides: []
  }
  saveTemporaryState(state)
  return state
}

/**
 * Update MEP object state
 */
export const updateMEPState = (mepChanges) => {
  const state = getTemporaryState()
  state.mep = {
    ...state.mep,
    ...mepChanges
  }
  saveTemporaryState(state)
  return state
}

/**
 * Update measurement tool state
 */
export const updateMeasurementState = (measurementChanges) => {
  const state = getTemporaryState()
  state.measurements = {
    ...state.measurements,
    ...measurementChanges
  }
  saveTemporaryState(state)
  return state
}

/**
 * Get specific state section
 */
export const getCameraState = () => getTemporaryState().camera
export const getUIState = () => getTemporaryState().ui
export const getRackTemporaryState = () => getTemporaryState().rack
export const getMEPState = () => getTemporaryState().mep
export const getMeasurementState = () => getTemporaryState().measurements

/**
 * Clear all temporary state (useful for new sessions)
 */
export const clearAllTemporaryState = () => {
  const newState = createInitialTemporaryState()
  saveTemporaryState(newState)
  return newState
}

/**
 * Validate and migrate temporary state structure
 */
const validateAndMigrateTemporaryState = (state) => {
  const initial = createInitialTemporaryState()
  
  // Ensure all required properties exist
  const migratedState = {
    ...initial,
    ...state,
    // Ensure nested objects exist
    camera: { ...initial.camera, ...state.camera },
    ui: { ...initial.ui, ...state.ui },
    rack: { ...initial.rack, ...state.rack },
    mep: { ...initial.mep, ...state.mep },
    measurements: { ...initial.measurements, ...state.measurements }
  }
  
  return migratedState
}

/**
 * Initialize temporary state system
 */
export const initializeTemporaryState = () => {
  try {
    const state = getTemporaryState()
    // Create new session ID for this app instance
    state.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`
    state.createdAt = new Date().toISOString()
    saveTemporaryState(state)
    return state
  } catch (error) {
    console.error('Failed to initialize temporary state:', error)
    throw error
  }
}
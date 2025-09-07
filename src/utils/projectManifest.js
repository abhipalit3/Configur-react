/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

/**
 * Project Manifest System
 * Auto-updating manifest file for all project data
 * This will be migrated to Azure backend later
 */

const PROJECT_MANIFEST_KEY = 'projectManifest'
const MANIFEST_VERSION = '1.0.0'

/**
 * Create the initial project manifest structure
 */
export const createInitialManifest = () => ({
  version: MANIFEST_VERSION,
  projectId: `project_${Date.now()}`,
  createdAt: new Date().toISOString(),
  lastUpdated: new Date().toISOString(),
  
  // Project metadata
  project: {
    name: 'Untitled Project',
    description: 'DPR Configur Project',
    status: 'active',
    tags: []
  },
  
  // Building shell configuration
  buildingShell: {
    parameters: null,
    lastModified: null,
    version: 1
  },
  
  // Trade rack configurations
  tradeRacks: {
    active: null, // Currently active configuration
    activeConfigurationId: null, // ID of the currently selected/active configuration
    configurations: [], // All saved configurations
    lastModified: null,
    totalCount: 0
  },
  
  // MEP items (ductwork, piping, conduits, cable trays)
  mepItems: {
    ductwork: [],
    piping: [],
    conduits: [],
    cableTrays: [],
    totalCount: 0,
    lastModified: null
  },
  
  // Measurements and annotations
  measurements: {
    items: [],
    totalCount: 0,
    lastModified: null
  },
  
  // UI state and preferences
  uiState: {
    activePanel: null,
    isRackPropertiesVisible: true,
    isMeasurementActive: false,
    lastModified: null
  },
  
  // Session statistics
  statistics: {
    configurationsSaved: 0,
    mepItemsAdded: 0,
    measurementsTaken: 0,
    sessionTime: 0,
    lastSession: new Date().toISOString()
  },
  
  // Change history for audit trail
  changeHistory: []
})

/**
 * Get the current project manifest from localStorage
 */
export const getProjectManifest = () => {
  try {
    const stored = localStorage.getItem(PROJECT_MANIFEST_KEY)
    if (stored) {
      const manifest = JSON.parse(stored)
      // Validate and migrate if needed
      return validateAndMigrateManifest(manifest)
    }
    // Create new manifest if none exists
    const newManifest = createInitialManifest()
    saveProjectManifest(newManifest)
    return newManifest
  } catch (error) {
    // console.error('Error loading project manifest:', error)
    const fallbackManifest = createInitialManifest()
    saveProjectManifest(fallbackManifest)
    return fallbackManifest
  }
}

/**
 * Save the project manifest to localStorage
 */
export const saveProjectManifest = (manifest) => {
  try {
    // Update timestamps
    manifest.lastUpdated = new Date().toISOString()
    
    // Save to localStorage
    localStorage.setItem(PROJECT_MANIFEST_KEY, JSON.stringify(manifest, null, 2))
    
    // Project manifest updated
    
    return true
  } catch (error) {
    console.error('❌ Error saving project manifest:', error)
    return false
  }
}

/**
 * Update building shell parameters in manifest
 */
export const updateBuildingShell = (parameters) => {
  const manifest = getProjectManifest()
  
  manifest.buildingShell = {
    parameters: parameters,
    lastModified: new Date().toISOString(),
    version: (manifest.buildingShell.version || 0) + 1
  }
  
  // Add to change history
  addChangeToHistory(manifest, 'buildingShell', 'updated', {
    operation: 'update_parameters',
    parametersCount: Object.keys(parameters).length
  })
  
  saveProjectManifest(manifest)
  return manifest
}

/**
 * Update trade rack configuration in manifest
 */
export const updateTradeRackConfiguration = (configuration, isNewSave = false) => {
  const manifest = getProjectManifest()
  
  if (isNewSave) {
    // Add new configuration to saved list
    const configWithMetadata = {
      ...configuration,
      id: configuration.id || Date.now(),
      savedAt: new Date().toISOString(),
      version: 1
    }
    
    manifest.tradeRacks.configurations.push(configWithMetadata)
    manifest.tradeRacks.totalCount = manifest.tradeRacks.configurations.length
    manifest.statistics.configurationsSaved++
    
    addChangeToHistory(manifest, 'tradeRacks', 'configuration_saved', {
      configurationId: configWithMetadata.id,
      configurationName: configWithMetadata.name
    })
  }
  
  // Update active configuration
  manifest.tradeRacks.active = {
    ...configuration,
    lastApplied: new Date().toISOString()
  }
  
  manifest.tradeRacks.lastModified = new Date().toISOString()
  
  addChangeToHistory(manifest, 'tradeRacks', 'configuration_applied', {
    mountType: configuration.mountType,
    dimensions: `${configuration.rackLength?.feet || 0}'${configuration.rackLength?.inches || 0}" x ${configuration.rackWidth?.feet || 0}'${configuration.rackWidth?.inches || 0}"`,
    tierCount: configuration.tierCount
  })
  
  saveProjectManifest(manifest)
  return manifest
}

/**
 * Delete trade rack configuration from manifest
 */
export const deleteTradeRackConfiguration = (configurationId) => {
  const manifest = getProjectManifest()
  
  // Find the configuration to delete
  const configToDelete = manifest.tradeRacks.configurations.find(config => config.id === configurationId)
  
  if (configToDelete) {
    // Remove from configurations array
    manifest.tradeRacks.configurations = manifest.tradeRacks.configurations.filter(config => config.id !== configurationId)
    manifest.tradeRacks.totalCount = manifest.tradeRacks.configurations.length
    manifest.tradeRacks.lastModified = new Date().toISOString()
    
    addChangeToHistory(manifest, 'tradeRacks', 'configuration_deleted', {
      configurationId: configurationId,
      configurationName: configToDelete.name || `Configuration ${configurationId}`,
      dimensions: `${configToDelete.rackLength?.feet || 0}'${configToDelete.rackLength?.inches || 0}" x ${configToDelete.rackWidth?.feet || 0}'${configToDelete.rackWidth?.inches || 0}"`,
      mountType: configToDelete.mountType,
      tierCount: configToDelete.tierCount
    })
    
    saveProjectManifest(manifest)
  } else {
    console.warn(`⚠️ Configuration ${configurationId} not found in manifest`)
  }
  
  return manifest
}

/**
 * Set the active configuration ID
 */
export const setActiveConfiguration = (configurationId) => {
  const manifest = getProjectManifest()
  
  manifest.tradeRacks.activeConfigurationId = configurationId
  manifest.tradeRacks.lastModified = new Date().toISOString()
  
  addChangeToHistory(manifest, 'tradeRacks', 'configuration_activated', {
    configurationId: configurationId
  })
  
  saveProjectManifest(manifest)
  return manifest
}

/**
 * Sync manifest with current localStorage configurations
 */
export const syncManifestWithLocalStorage = () => {
  const manifest = getProjectManifest()
  
  try {
    // Get current configurations from localStorage
    const localStorageConfigs = JSON.parse(localStorage.getItem('tradeRackConfigurations') || '[]')
    
    // Update manifest to match localStorage
    manifest.tradeRacks.configurations = localStorageConfigs.map(config => ({
      ...config,
      syncedAt: new Date().toISOString()
    }))
    manifest.tradeRacks.totalCount = localStorageConfigs.length
    manifest.tradeRacks.lastModified = new Date().toISOString()
    
    addChangeToHistory(manifest, 'tradeRacks', 'synced_with_localstorage', {
      configurationCount: localStorageConfigs.length
    })
    
    saveProjectManifest(manifest)
    // Manifest synced with localStorage
    
    return manifest
  } catch (error) {
    console.error('❌ Error syncing manifest with localStorage:', error)
    return manifest
  }
}

/**
 * Map component types to manifest categories
 */
const mapTypeToCategory = (componentType) => {
  const typeMap = {
    'duct': 'ductwork',
    'pipe': 'piping', 
    'conduit': 'conduits',
    'cableTray': 'cableTrays'
  }
  return typeMap[componentType] || componentType
}

/**
 * Update MEP items in manifest
 */
export const updateMEPItems = (items, category = 'all') => {
  const manifest = getProjectManifest()
  
  // Updating MEP items in manifest
  
  if (category === 'all') {
    // Update all MEP items - map component types to manifest categories
    manifest.mepItems = {
      ductwork: items.filter(item => mapTypeToCategory(item.type) === 'ductwork'),
      piping: items.filter(item => mapTypeToCategory(item.type) === 'piping'),
      conduits: items.filter(item => mapTypeToCategory(item.type) === 'conduits'),
      cableTrays: items.filter(item => mapTypeToCategory(item.type) === 'cableTrays'),
      totalCount: items.length,
      lastModified: new Date().toISOString()
    }
  } else {
    // Update specific category
    manifest.mepItems[category] = items
    manifest.mepItems.totalCount = Object.values(manifest.mepItems)
      .filter(Array.isArray)
      .reduce((total, arr) => total + arr.length, 0)
    manifest.mepItems.lastModified = new Date().toISOString()
  }
  
  manifest.statistics.mepItemsAdded = manifest.mepItems.totalCount
  
  addChangeToHistory(manifest, 'mepItems', category === 'all' ? 'bulk_update' : 'category_update', {
    category: category,
    itemCount: category === 'all' ? items.length : items.length,
    totalItems: manifest.mepItems.totalCount
  })
  
  // MEP items updated in manifest
  
  saveProjectManifest(manifest)
  return manifest
}

/**
 * Sync MEP items with localStorage
 */
export const syncMEPItemsWithLocalStorage = () => {
  try {
    const storedMepItems = JSON.parse(localStorage.getItem('configurMepItems') || '[]')
    // Syncing MEP items with localStorage
    updateMEPItems(storedMepItems, 'all')
    return storedMepItems
  } catch (error) {
    console.error('❌ Error syncing MEP items with localStorage:', error)
    return []
  }
}

/**
 * Add new MEP item to manifest
 */
export const addMEPItem = (item) => {
  const manifest = getProjectManifest()
  const category = mapTypeToCategory(item.type) // Map component type to manifest category
  
  if (!manifest.mepItems[category]) {
    manifest.mepItems[category] = []
  }
  
  const itemWithMetadata = {
    ...item,
    id: item.id || `${category}_${Date.now()}`,
    addedAt: new Date().toISOString()
  }
  
  manifest.mepItems[category].push(itemWithMetadata)
  manifest.mepItems.totalCount++
  manifest.mepItems.lastModified = new Date().toISOString()
  manifest.statistics.mepItemsAdded++
  
  addChangeToHistory(manifest, 'mepItems', 'item_added', {
    itemType: category,
    itemId: itemWithMetadata.id,
    itemName: itemWithMetadata.name || `${category} item`,
    originalType: item.type
  })
  
  // MEP item added to manifest
  
  saveProjectManifest(manifest)
  return manifest
}

/**
 * Remove MEP item from manifest
 */
export const removeMEPItem = (itemId, itemType) => {
  const manifest = getProjectManifest()
  const category = mapTypeToCategory(itemType) // Map component type to manifest category
  
  if (manifest.mepItems[category]) {
    const initialCount = manifest.mepItems[category].length
    manifest.mepItems[category] = manifest.mepItems[category].filter(item => item.id !== itemId)
    
    if (manifest.mepItems[category].length < initialCount) {
      manifest.mepItems.totalCount--
      manifest.mepItems.lastModified = new Date().toISOString()
      
      addChangeToHistory(manifest, 'mepItems', 'item_removed', {
        itemType: category,
        itemId: itemId,
        originalType: itemType
      })
      
      // MEP item removed from manifest
      
      saveProjectManifest(manifest)
    }
  }
  
  return manifest
}

/**
 * Update UI state in manifest
 */
export const updateUIState = (stateChanges) => {
  const manifest = getProjectManifest()
  
  manifest.uiState = {
    ...manifest.uiState,
    ...stateChanges,
    lastModified: new Date().toISOString()
  }
  
  saveProjectManifest(manifest)
  return manifest
}

/**
 * Update measurements in manifest
 */
export const updateMeasurements = (measurements) => {
  const manifest = getProjectManifest()
  
  manifest.measurements = {
    items: measurements.map(measurement => ({
      ...measurement,
      id: measurement.id || `measurement_${Date.now()}`,
      createdAt: measurement.createdAt || new Date().toISOString()
    })),
    totalCount: measurements.length,
    lastModified: new Date().toISOString()
  }
  
  manifest.statistics.measurementsTaken = measurements.length
  
  addChangeToHistory(manifest, 'measurements', 'updated', {
    measurementCount: measurements.length
  })
  
  saveProjectManifest(manifest)
  return manifest
}

/**
 * Generate human-readable event title
 */
const generateEventTitle = (component, action, details = {}) => {
  switch (component) {
    case 'tradeRacks':
      switch (action) {
        case 'position_moved':
          const distance = details.distance
          const totalMove = distance ? Math.sqrt(distance.x**2 + distance.y**2 + distance.z**2).toFixed(1) : '0'
          return `Rack Moved ${totalMove}ft`
        case 'parameter_changed':
          const paramName = details.parameterName
          const oldVal = details.oldValue
          const newVal = details.newValue
          switch (paramName) {
            case 'tierCount':
              return `Tier Count: ${oldVal} → ${newVal} tiers`
            case 'tierHeights':
              return `Tier Heights Updated`
            case 'bayCount':
              return `Bay Count: ${oldVal} → ${newVal} bays`
            case 'mountType':
              return `Mount Type: ${oldVal} → ${newVal}`
            case 'rackLength':
              return `Rack Length Changed`
            case 'rackWidth':
              return `Rack Width Changed`
            case 'bayWidth':
              return `Bay Width Changed`
            default:
              return `${paramName} Parameter Updated`
          }
        case 'configuration_saved':
          return `Configuration "${details.configurationName}" Saved`
        case 'configuration_applied':
          return `Configuration Applied (${details.tierCount} tiers)`
        case 'configuration_deleted':
          return `Configuration "${details.configurationName}" Deleted`
        case 'configuration_activated':
          return `Configuration Activated`
        default:
          return `Rack ${action.replace('_', ' ')}`
      }
    case 'mepItems':
      switch (action) {
        case 'item_added':
          const itemType = details.itemType || details.originalType
          return `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} Added`
        case 'item_removed':
          const removedType = details.itemType || details.originalType
          return `${removedType.charAt(0).toUpperCase() + removedType.slice(1)} Removed`
        case 'item_moved':
          const movedType = details.itemType || details.originalType
          return `${movedType.charAt(0).toUpperCase() + movedType.slice(1)} Moved`
        case 'item_modified':
          const modType = details.itemType || details.originalType
          return `${modType.charAt(0).toUpperCase() + modType.slice(1)} Modified`
        case 'bulk_update':
          return `${details.itemCount} MEP Items Updated`
        case 'category_update':
          return `${details.category} Items Updated (${details.itemCount})`
        default:
          return `MEP ${action.replace('_', ' ')}`
      }
    case 'buildingShell':
      return `Building Shell Updated`
    case 'measurements':
      return `Measurements Updated (${details.measurementCount || 0})`
    default:
      return `${component} ${action.replace('_', ' ')}`
  }
}

/**
 * Add rack position change to history
 */
export const addRackPositionChange = (oldPosition, newPosition, rackId) => {
  const manifest = getProjectManifest()
  
  const details = {
    rackId: rackId,
    operation: 'move_position',
    oldPosition: oldPosition,
    newPosition: newPosition,
    distance: oldPosition && newPosition ? {
      x: Math.abs(newPosition.x - oldPosition.x),
      y: Math.abs(newPosition.y - oldPosition.y),
      z: Math.abs(newPosition.z - oldPosition.z)
    } : null
  }
  
  addChangeToHistory(manifest, 'tradeRacks', 'position_moved', details)
  
  saveProjectManifest(manifest)
  return manifest
}

/**
 * Add rack parameter change to history
 */
export const addRackParameterChange = (parameterName, oldValue, newValue, rackId) => {
  const manifest = getProjectManifest()
  
  const details = {
    rackId: rackId,
    operation: 'update_parameter',
    parameterName: parameterName,
    oldValue: oldValue,
    newValue: newValue,
    parameterType: typeof newValue
  }
  
  addChangeToHistory(manifest, 'tradeRacks', 'parameter_changed', details)
  
  saveProjectManifest(manifest)
  return manifest
}

/**
 * Add MEP item change to history
 */
export const addMEPItemChange = (action, itemType, itemId, itemName = null, additionalDetails = {}) => {
  const manifest = getProjectManifest()
  
  const details = {
    itemType: itemType,
    itemId: itemId,
    itemName: itemName || `${itemType} item`,
    originalType: itemType,
    ...additionalDetails
  }
  
  addChangeToHistory(manifest, 'mepItems', action, details)
  
  saveProjectManifest(manifest)
  return manifest
}

/**
 * Add change to history for audit trail
 */
const addChangeToHistory = (manifest, component, action, details = {}) => {
  const change = {
    id: `change_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    timestamp: new Date().toISOString(),
    component: component,
    action: action,
    title: generateEventTitle(component, action, details),
    details: details,
    sessionId: getSessionId()
  }
  
  manifest.changeHistory.unshift(change)
  
  // Keep only last 1000 changes to prevent unlimited growth
  if (manifest.changeHistory.length > 1000) {
    manifest.changeHistory = manifest.changeHistory.slice(0, 1000)
  }
}

/**
 * Validate and migrate manifest to current version
 */
const validateAndMigrateManifest = (manifest) => {
  // If manifest is from older version, migrate it
  if (!manifest.version || manifest.version !== MANIFEST_VERSION) {
    // Migrating manifest to current version
    // Add migration logic here when needed
    manifest.version = MANIFEST_VERSION
  }
  
  // Ensure all required properties exist
  const initial = createInitialManifest()
  
  const migratedManifest = {
    ...initial,
    ...manifest,
    // Ensure nested objects exist
    project: { ...initial.project, ...manifest.project },
    buildingShell: { ...initial.buildingShell, ...manifest.buildingShell },
    tradeRacks: { ...initial.tradeRacks, ...manifest.tradeRacks },
    mepItems: { ...initial.mepItems, ...manifest.mepItems },
    measurements: { ...initial.measurements, ...manifest.measurements },
    uiState: { ...initial.uiState, ...manifest.uiState },
    statistics: { ...initial.statistics, ...manifest.statistics }
  }
  
  return migratedManifest
}

/**
 * Get or create session ID
 */
let sessionId = null
const getSessionId = () => {
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`
  }
  return sessionId
}

/**
 * Export manifest for backup/migration
 */
export const exportProjectManifest = () => {
  const manifest = getProjectManifest()
  
  const exportData = {
    ...manifest,
    exportedAt: new Date().toISOString(),
    exportedBy: 'DPR Configur Client'
  }
  
  return exportData
}

/**
 * Get project statistics
 */
export const getProjectStatistics = () => {
  const manifest = getProjectManifest()
  
  return {
    ...manifest.statistics,
    totalComponents: {
      tradeRacks: manifest.tradeRacks.totalCount,
      mepItems: manifest.mepItems.totalCount,
      measurements: manifest.measurements.totalCount
    },
    lastActivity: manifest.lastUpdated,
    projectAge: Date.now() - new Date(manifest.createdAt).getTime()
  }
}

/**
 * Initialize project manifest on app start
 */
export const initializeProject = () => {
  // console.log('🚀 Initializing project manifest system...')
  
  try {
    // Project manifest system initialized
    const manifest = getProjectManifest()
    
    // Update session statistics
    manifest.statistics.lastSession = new Date().toISOString()
    
    // Save updated manifest
    saveProjectManifest(manifest)
    
    // console.log('✅ Project manifest initialized successfully:', {
    //   projectId: manifest.projectId,
    //   version: manifest.version,
    //   mepItemsCount: manifest.mepItems.totalCount,
    //   configurationsCount: manifest.tradeRacks.totalCount
    // })
    
    return manifest
  } catch (error) {
    console.error('❌ Failed to initialize project manifest:', error)
    throw error
  }
}
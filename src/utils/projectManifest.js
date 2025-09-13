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
 * Retrieves the current project manifest from localStorage
 * Creates initial manifest if none exists or if there are errors loading
 * Validates and migrates manifest structure when necessary
 * @returns {Object} Current project manifest object
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
 * Saves the project manifest to localStorage with automatic timestamp updates
 * Updates the lastUpdated field and persists the manifest data
 * @param {Object} manifest - Complete project manifest object to save
 * @returns {boolean} True if save was successful, false otherwise
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
 * Save configuration to list only (doesn't update active config)
 */
export const saveConfigurationToList = (configuration) => {
  const manifest = getProjectManifest()
  
  // Check if this configuration already exists in the saved list
  const existingConfigIndex = manifest.tradeRacks.configurations.findIndex(
    config => config.id === configuration.id
  )
  
  if (existingConfigIndex >= 0) {
    // Update existing configuration
    manifest.tradeRacks.configurations[existingConfigIndex] = {
      ...configuration,
      savedAt: new Date().toISOString(),
      version: (manifest.tradeRacks.configurations[existingConfigIndex].version || 0) + 1
    }
  } else {
    // Add new configuration to saved list
    const configWithMetadata = {
      ...configuration,
      id: configuration.id || Date.now(),
      savedAt: new Date().toISOString(),
      version: 1
    }
    manifest.tradeRacks.configurations.unshift(configWithMetadata)
    manifest.tradeRacks.totalCount = manifest.tradeRacks.configurations.length
  }
  
  manifest.tradeRacks.lastModified = new Date().toISOString()
  saveProjectManifest(manifest)
  return manifest
}

/**
 * Update trade rack configuration in manifest
 */
export const updateTradeRackConfiguration = (configuration, isNewSave = false) => {
  const manifest = getProjectManifest()
  
  if (isNewSave) {
    // Check if this configuration already exists in the saved list
    const existingConfigIndex = manifest.tradeRacks.configurations.findIndex(
      config => config.id === configuration.id
    )
    
    if (existingConfigIndex >= 0) {
      // Update existing configuration
      manifest.tradeRacks.configurations[existingConfigIndex] = {
        ...configuration,
        savedAt: new Date().toISOString(),
        version: (manifest.tradeRacks.configurations[existingConfigIndex].version || 0) + 1
      }
      
      addChangeToHistory(manifest, 'tradeRacks', 'configuration_updated', {
        configurationId: configuration.id,
        configurationName: configuration.name
      })
    } else {
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
 * Add change to history for audit trail
 */
const addChangeToHistory = (manifest, component, action, details = {}) => {
  const change = {
    id: `change_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    timestamp: new Date().toISOString(),
    component: component,
    action: action,
    details: details,
    sessionId: getSessionId()
  }
  
  manifest.changeHistory.unshift(change)
  
  // Keep only last 100 changes to prevent unlimited growth
  if (manifest.changeHistory.length > 100) {
    manifest.changeHistory = manifest.changeHistory.slice(0, 100)
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
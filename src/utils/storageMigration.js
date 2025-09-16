/**
 * Copyright (c) 2024 DPR Construction. All rights reserved.
 * This software is proprietary and confidential.
 * Unauthorized copying or distribution is strictly prohibited.
 */

/**
 * Storage Migration Utility
 * Consolidates existing localStorage data into the new two-key system:
 * - projectManifest: Persistent project data
 * - temporaryState: Session/UI state
 */

import { getProjectManifest, saveProjectManifest, updateTradeRackConfiguration, updateMEPItems } from './projectManifest'
import { 
  getTemporaryState, 
  saveTemporaryState, 
  updateCameraState, 
  clearRackTemporaryState,
  updateAllMEPItemsInTemporary 
} from './temporaryState'

/**
 * Keys that will be migrated and removed
 */
const LEGACY_KEYS = [
  'rackParameters',
  'configurMepItems', 
  'cameraState',
  'tradeRackConfigurations',
  'rackTemporaryState',
  'projectName'
]

/**
 * Migrate all legacy localStorage data to consolidated system
 */
export const migrateLegacyStorage = () => {
  console.log('🔄 Starting localStorage migration to consolidated system...')
  
  try {
    let migrationResults = {
      migratedKeys: [],
      skippedKeys: [],
      errors: []
    }

    // Get current manifest and temporary state
    const manifest = getProjectManifest()
    const tempState = getTemporaryState()

    // Migrate rack parameters
    migrationResults = migrateRackParameters(manifest, migrationResults)
    
    // Migrate MEP items
    migrationResults = migrateMEPItems(manifest, migrationResults)
    
    // Migrate camera state
    migrationResults = migrateCameraState(tempState, migrationResults)
    
    // Migrate trade rack configurations
    migrationResults = migrateTradeRackConfigurations(manifest, migrationResults)
    
    // Migrate rack temporary state
    migrationResults = migrateRackTemporaryState(tempState, migrationResults)
    
    // Migrate project name
    migrationResults = migrateProjectName(manifest, migrationResults)
    
    // Migrate configurations to include MEP structure
    migrationResults = migrateConfigurationsForMEP(manifest, migrationResults)

    // Save updated states
    saveProjectManifest(manifest)
    saveTemporaryState(tempState)

    console.log('✅ Migration completed successfully:', migrationResults)
    return migrationResults

  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  }
}

/**
 * Migrate rackParameters to projectManifest
 */
const migrateRackParameters = (manifest, results) => {
  try {
    const rackParams = localStorage.getItem('rackParameters')
    if (rackParams) {
      const parsedParams = JSON.parse(rackParams)
      
      // Update active configuration in manifest
      updateTradeRackConfiguration(parsedParams)
      
      results.migratedKeys.push('rackParameters')
      console.log('✅ Migrated rackParameters to projectManifest')
    } else {
      results.skippedKeys.push('rackParameters (not found)')
    }
  } catch (error) {
    results.errors.push(`rackParameters: ${error.message}`)
    console.error('❌ Error migrating rackParameters:', error)
  }
  return results
}

/**
 * Migrate configurMepItems to temporary state (new system) and legacy manifest
 */
const migrateMEPItems = (manifest, results) => {
  try {
    const mepItems = localStorage.getItem('configurMepItems')
    if (mepItems) {
      const parsedItems = JSON.parse(mepItems)
      
      // Migrate to temporary state (new primary storage for MEP items)
      if (parsedItems.length > 0) {
        updateAllMEPItemsInTemporary(parsedItems, 'all')
        console.log('✅ Migrated configurMepItems to temporary state (new system)')
      }
      
      // Legacy migration to manifest (deprecated but kept for compatibility)
      updateMEPItems(parsedItems, 'all')
      
      results.migratedKeys.push('configurMepItems')
      console.log('✅ Migrated configurMepItems to both temporary state and manifest')
    } else {
      results.skippedKeys.push('configurMepItems (not found)')
    }
  } catch (error) {
    results.errors.push(`configurMepItems: ${error.message}`)
    console.error('❌ Error migrating configurMepItems:', error)
  }
  return results
}

/**
 * Migrate cameraState to temporaryState
 */
const migrateCameraState = (tempState, results) => {
  try {
    const cameraState = localStorage.getItem('cameraState')
    if (cameraState) {
      const parsedCamera = JSON.parse(cameraState)
      
      // Update camera state in temporary state
      updateCameraState(parsedCamera)
      
      results.migratedKeys.push('cameraState')
      console.log('✅ Migrated cameraState to temporaryState')
    } else {
      results.skippedKeys.push('cameraState (not found)')
    }
  } catch (error) {
    results.errors.push(`cameraState: ${error.message}`)
    console.error('❌ Error migrating cameraState:', error)
  }
  return results
}

/**
 * Migrate tradeRackConfigurations to projectManifest
 */
const migrateTradeRackConfigurations = (manifest, results) => {
  try {
    const configs = localStorage.getItem('tradeRackConfigurations')
    if (configs) {
      const parsedConfigs = JSON.parse(configs)
      
      // Update configurations in manifest (they may already be there, but ensure sync)
      manifest.tradeRacks.configurations = parsedConfigs.map(config => ({
        ...config,
        syncedAt: new Date().toISOString()
      }))
      manifest.tradeRacks.totalCount = parsedConfigs.length
      manifest.tradeRacks.lastModified = new Date().toISOString()
      
      results.migratedKeys.push('tradeRackConfigurations')
      console.log('✅ Migrated tradeRackConfigurations to projectManifest')
    } else {
      results.skippedKeys.push('tradeRackConfigurations (not found)')
    }
  } catch (error) {
    results.errors.push(`tradeRackConfigurations: ${error.message}`)
    console.error('❌ Error migrating tradeRackConfigurations:', error)
  }
  return results
}

/**
 * Migrate rackTemporaryState to temporaryState
 */
const migrateRackTemporaryState = (tempState, results) => {
  try {
    const rackTempState = localStorage.getItem('rackTemporaryState')
    if (rackTempState) {
      const parsedRackState = JSON.parse(rackTempState)
      
      // Clear and update rack temporary state
      clearRackTemporaryState()
      if (parsedRackState.position) {
        tempState.rack.temporaryPosition = parsedRackState.position
        tempState.rack.isDragging = parsedRackState.isDragging || false
        saveTemporaryState(tempState)
      }
      
      results.migratedKeys.push('rackTemporaryState')
      console.log('✅ Migrated rackTemporaryState to temporaryState')
    } else {
      results.skippedKeys.push('rackTemporaryState (not found)')
    }
  } catch (error) {
    results.errors.push(`rackTemporaryState: ${error.message}`)
    console.error('❌ Error migrating rackTemporaryState:', error)
  }
  return results
}

/**
 * Migrate projectName to projectManifest
 */
const migrateProjectName = (manifest, results) => {
  try {
    const projectName = localStorage.getItem('projectName')
    if (projectName && projectName !== manifest.project.name) {
      manifest.project.name = projectName
      manifest.project.lastModified = new Date().toISOString()
      
      results.migratedKeys.push('projectName')
      console.log('✅ Migrated projectName to projectManifest')
    } else {
      results.skippedKeys.push('projectName (not found or already current)')
    }
  } catch (error) {
    results.errors.push(`projectName: ${error.message}`)
    console.error('❌ Error migrating projectName:', error)
  }
  return results
}

/**
 * Remove legacy localStorage keys after successful migration
 */
export const removeLegacyStorageKeys = () => {
  console.log('🗑️ Removing legacy localStorage keys...')
  
  const removedKeys = []
  const failedKeys = []
  
  LEGACY_KEYS.forEach(key => {
    try {
      if (localStorage.getItem(key) !== null) {
        localStorage.removeItem(key)
        removedKeys.push(key)
        console.log(`🗑️ Removed legacy key: ${key}`)
      }
    } catch (error) {
      failedKeys.push({ key, error: error.message })
      console.error(`❌ Failed to remove key ${key}:`, error)
    }
  })
  
  return { removedKeys, failedKeys }
}

/**
 * Check if migration is needed
 */
export const isMigrationNeeded = () => {
  return LEGACY_KEYS.some(key => localStorage.getItem(key) !== null)
}

/**
 * Migrate existing configurations to include MEP structure
 */
const migrateConfigurationsForMEP = (manifest, results) => {
  try {
    let migratedCount = 0
    
    if (manifest.tradeRacks?.configurations) {
      manifest.tradeRacks.configurations = manifest.tradeRacks.configurations.map(config => {
        // If configuration doesn't have MEP items, add empty structure
        if (!config.mepItems) {
          migratedCount++
          return {
            ...config,
            mepItems: {
              ductwork: [],
              piping: [],
              conduits: [],
              cableTrays: [],
              totalCount: 0,
              migratedAt: new Date().toISOString()
            }
          }
        }
        return config
      })
      
      if (migratedCount > 0) {
        results.migratedKeys.push(`configurations_mep_structure (${migratedCount} configs)`)
        console.log(`✅ Added MEP structure to ${migratedCount} existing configurations`)
      } else {
        results.skippedKeys.push('configurations_mep_structure (all configs already have MEP structure)')
      }
    } else {
      results.skippedKeys.push('configurations_mep_structure (no configurations found)')
    }
  } catch (error) {
    results.errors.push(`configurations_mep_structure: ${error.message}`)
    console.error('❌ Error migrating configurations for MEP structure:', error)
  }
  return results
}

/**
 * Get current localStorage size and key count
 */
export const getStorageInfo = () => {
  const keys = Object.keys(localStorage)
  let totalSize = 0
  
  const keyInfo = keys.map(key => {
    const value = localStorage.getItem(key)
    const size = new Blob([value]).size
    totalSize += size
    return { key, size, sizeKB: (size / 1024).toFixed(2) }
  })
  
  return {
    totalKeys: keys.length,
    totalSizeKB: (totalSize / 1024).toFixed(2),
    keys: keyInfo,
    legacyKeys: keys.filter(key => LEGACY_KEYS.includes(key))
  }
}

/**
 * Complete migration process with cleanup
 */
export const performCompleteStorageMigration = () => {
  console.log('🚀 Starting complete storage migration...')
  
  // Check if migration is needed
  if (!isMigrationNeeded()) {
    console.log('ℹ️ No legacy keys found, migration not needed')
    return { migrationNeeded: false }
  }
  
  // Get storage info before migration
  const beforeInfo = getStorageInfo()
  console.log('📊 Storage before migration:', beforeInfo)
  
  // Perform migration
  const migrationResults = migrateLegacyStorage()
  
  // Remove legacy keys
  const cleanupResults = removeLegacyStorageKeys()
  
  // Get storage info after migration
  const afterInfo = getStorageInfo()
  console.log('📊 Storage after migration:', afterInfo)
  
  return {
    migrationNeeded: true,
    migrationResults,
    cleanupResults,
    beforeInfo,
    afterInfo
  }
}